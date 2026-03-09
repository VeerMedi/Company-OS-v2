const Task = require('../models/Task');
const User = require('../models/User');
const Leave = require('../models/Leave').Leave;
const notificationService = require('./enhancedNotificationService');

/**
 * Task Reassignment Service for Leave Management
 * Handles task reassignment when employees go on leave
 */
class TaskReassignmentService {
  
  /**
   * Get tasks affected by leave period
   * @param {String} employeeId - Employee going on leave
   * @param {Date} startDate - Leave start date
   * @param {Date} endDate - Leave end date
   * @returns {Object} - Affected tasks and available assignees
   */
  async getAffectedTasks(employeeId, startDate, endDate) {
    try {
      console.log('Getting affected tasks for employee:', employeeId, 'from', startDate, 'to', endDate);
      
      // Get employee details first to know their skills and category
      const employee = await User.findById(employeeId);
      
      if (!employee) {
        console.error('Employee not found:', employeeId);
        return {
          tasks: [],
          availableAssignees: [],
          employee: null
        };
      }

      console.log('Employee found:', employee.firstName, employee.lastName, 'Skills:', employee.skills, 'Category:', employee.jobCategory);
      
      // Find all active tasks assigned to employee with deadlines during leave
      const tasks = await Task.find({
        assignedTo: employeeId,
        deadline: {
          $gte: new Date(startDate),
          $lte: new Date(endDate)
        },
        status: {
          $nin: ['completed', 'cant-complete']
        }
      })
      .populate('project', 'name')
      .populate('assignedTo', 'firstName lastName')
      .sort({ deadline: 1 });

      console.log(`Found ${tasks.length} affected tasks`);

      // Get available team members with matching skills and category
      const query = {
        _id: { $ne: employeeId },
        isActive: true
      };

      // Filter by job category if employee has one
      if (employee.jobCategory) {
        query.jobCategory = employee.jobCategory;
      }

      // Filter by skills - find users who have at least one matching skill
      if (employee.skills && employee.skills.length > 0) {
        query.skills = { $in: employee.skills };
      }

      const availableAssignees = await User.find(query)
        .select('firstName lastName employeeId role skills jobCategory');
      
      console.log(`Found ${availableAssignees.length} available assignees with matching skills/category`);

      return {
        tasks,
        availableAssignees,
        employee: {
          _id: employee._id,
          name: `${employee.firstName} ${employee.lastName}`,
          role: employee.role,
          skills: employee.skills,
          jobCategory: employee.jobCategory
        }
      };
    } catch (error) {
      console.error('Error getting affected tasks:', error);
      throw error;
    }
  }

  /**
   * Bulk reassign tasks during leave approval
   * @param {Array} reassignments - Array of {taskId, newAssigneeId, notes}
   * @param {String} managerId - Manager performing reassignment
   * @param {String} leaveId - Leave request ID
   * @returns {Object} - Reassignment results
   */
  async bulkReassignTasks(reassignments, managerId, leaveId) {
    try {
      const results = {
        success: [],
        failed: [],
        skipped: []
      };

      for (const reassignment of reassignments) {
        const { taskId, newAssigneeId, notes } = reassignment;

        // Skip if no new assignee selected
        if (!newAssigneeId) {
          results.skipped.push({ taskId, reason: 'No assignee selected' });
          continue;
        }

        try {
          const task = await Task.findById(taskId).populate('assignedTo');
          
          if (!task) {
            results.failed.push({ taskId, reason: 'Task not found' });
            continue;
          }

          const originalAssignee = task.assignedTo;

          // Store original assignee if not already reassigned
          if (!task.isReassigned) {
            task.originalAssignee = task.assignedTo;
          }

          // Add to reassignment history
          task.reassignmentHistory.push({
            originalAssignee: task.assignedTo,
            newAssignee: newAssigneeId,
            reassignedBy: managerId,
            reason: 'leave',
            leaveId: leaveId,
            notes: notes || '',
            reassignedAt: new Date()
          });

          // Update current assignee
          task.assignedTo = newAssigneeId;
          task.isReassigned = true;

          await task.save();

          // Populate for notifications
          await task.populate('assignedTo project');
          const newAssignee = await User.findById(newAssigneeId);

          // Send notifications
          try {
            // Notify original assignee
            await notificationService.createNotification({
              userId: originalAssignee._id,
              type: 'task_reassigned',
              title: 'Task Reassigned During Leave',
              message: `Your task "${task.title}" has been reassigned to ${newAssignee.firstName} ${newAssignee.lastName} during your leave`,
              relatedModel: 'Task',
              relatedId: task._id,
              actionUrl: `/tasks`,
              priority: 'medium'
            });

            // Notify new assignee
            await notificationService.createNotification({
              userId: newAssigneeId,
              type: 'task_assigned',
              title: '📋 Task Assigned (Leave Coverage)',
              message: `You've been assigned "${task.title}" (covering for ${originalAssignee.firstName} ${originalAssignee.lastName})`,
              relatedModel: 'Task',
              relatedId: task._id,
              actionUrl: `/tasks`,
              priority: 'high',
              metadata: {
                coveringFor: `${originalAssignee.firstName} ${originalAssignee.lastName}`,
                deadline: task.deadline
              }
            });
          } catch (notifError) {
            console.error('Error sending reassignment notifications:', notifError);
          }

          results.success.push({
            taskId,
            taskTitle: task.title,
            from: `${originalAssignee.firstName} ${originalAssignee.lastName}`,
            to: `${newAssignee.firstName} ${newAssignee.lastName}`
          });

        } catch (taskError) {
          console.error(`Error reassigning task ${taskId}:`, taskError);
          results.failed.push({ taskId, reason: taskError.message });
        }
      }

      return results;
    } catch (error) {
      console.error('Error in bulk reassignment:', error);
      throw error;
    }
  }

  /**
   * Revert task to original assignee after leave ends
   * @param {String} taskId - Task ID
   * @param {String} managerId - Manager performing revert
   * @returns {Object} - Revert result
   */
  async revertTaskAssignment(taskId, managerId) {
    try {
      const task = await Task.findById(taskId).populate('assignedTo originalAssignee');

      if (!task) {
        throw new Error('Task not found');
      }

      if (!task.isReassigned || !task.originalAssignee) {
        throw new Error('Task was not reassigned');
      }

      const currentAssignee = task.assignedTo;
      const originalAssignee = task.originalAssignee;

      // Update task
      task.assignedTo = task.originalAssignee;
      task.isReassigned = false;

      // Mark last reassignment as reverted
      if (task.reassignmentHistory.length > 0) {
        const lastReassignment = task.reassignmentHistory[task.reassignmentHistory.length - 1];
        lastReassignment.isReverted = true;
        lastReassignment.revertedAt = new Date();
      }

      await task.save();
      await task.populate('project');

      // Send notifications
      try {
        // Notify original assignee (task returned)
        await notificationService.createNotification({
          userId: originalAssignee._id,
          type: 'task_assigned',
          title: 'Task Returned After Leave',
          message: `Your task "${task.title}" has been returned to you`,
          relatedModel: 'Task',
          relatedId: task._id,
          actionUrl: `/tasks`,
          priority: 'medium'
        });

        // Notify previous assignee (task removed)
        await notificationService.createNotification({
          userId: currentAssignee._id,
          type: 'task_updated',
          title: 'Task Reassigned',
          message: `Task "${task.title}" has been returned to ${originalAssignee.firstName} ${originalAssignee.lastName}`,
          relatedModel: 'Task',
          relatedId: task._id,
          actionUrl: `/tasks`,
          priority: 'low'
        });
      } catch (notifError) {
        console.error('Error sending revert notifications:', notifError);
      }

      return {
        success: true,
        task,
        message: `Task reverted to ${originalAssignee.firstName} ${originalAssignee.lastName}`
      };

    } catch (error) {
      console.error('Error reverting task:', error);
      throw error;
    }
  }

  /**
   * Get reassignment history for a task
   * @param {String} taskId - Task ID
   * @returns {Array} - Reassignment history
   */
  async getReassignmentHistory(taskId) {
    try {
      const task = await Task.findById(taskId)
        .populate('reassignmentHistory.originalAssignee', 'firstName lastName')
        .populate('reassignmentHistory.newAssignee', 'firstName lastName')
        .populate('reassignmentHistory.reassignedBy', 'firstName lastName')
        .populate('reassignmentHistory.leaveId');

      if (!task) {
        throw new Error('Task not found');
      }

      return task.reassignmentHistory;
    } catch (error) {
      console.error('Error getting reassignment history:', error);
      throw error;
    }
  }
}

module.exports = new TaskReassignmentService();
