const Task = require('../models/Task');
const Company = require('../models/Company');
const Lead = require('../models/Lead');
const RevenueTarget = require('../models/RevenueTarget');
const User = require('../models/User');

// ============ HEAD OF SALES SECTION ============

// Create Sales Task (HOS assigns task to sales team)
exports.createSalesTask = async (req, res) => {
  try {
    const {
      title,
      description,
      assignedTo,
      dueDate,
      priority,
      documentLink,
      recurring,
      salesContext
    } = req.body;

    // Verify assigned user exists and is sales team
    const assignedUser = await User.findById(assignedTo);
    if (!assignedUser) {
      return res.status(404).json({ message: 'Assigned user not found' });
    }

    // Verify sales context if provided
    if (salesContext) {
      if (salesContext.company) {
        const company = await Company.findById(salesContext.company);
        if (!company) {
          return res.status(404).json({ message: 'Company not found in sales context' });
        }
      }
      if (salesContext.lead) {
        const lead = await Lead.findById(salesContext.lead);
        if (!lead) {
          return res.status(404).json({ message: 'Lead not found in sales context' });
        }
      }
      if (salesContext.revenueTarget) {
        const target = await RevenueTarget.findById(salesContext.revenueTarget);
        if (!target) {
          return res.status(404).json({ message: 'Revenue target not found in sales context' });
        }
      }
    }

    const task = new Task({
      title,
      description,
      assignedTo,
      assignedBy: req.user.id,
      dueDate,
      priority: priority || 'medium',
      status: 'pending',
      taskType: 'sales',
      documentLink,
      recurring: recurring?.enabled ? recurring : undefined,
      salesContext: salesContext || {}
    });

    await task.save();
    await task.populate('assignedTo assignedBy', 'name email role');
    await task.populate('salesContext.company', 'companyName');
    await task.populate('salesContext.lead', 'name designation');

    // TODO: Send notification to assigned user

    res.status(201).json({
      success: true,
      message: 'Sales task created successfully',
      data: task
    });
  } catch (error) {
    console.error('Create sales task error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get All Sales Tasks (HOS view)
exports.getAllSalesTasks = async (req, res) => {
  try {
    const { status, priority, assignedTo } = req.query;
    const filter = { taskType: 'sales' };

    if (status) filter.status = status;
    if (priority) filter.priority = priority;
    if (assignedTo) filter.assignedTo = assignedTo;

    const tasks = await Task.find(filter)
      .populate('assignedTo assignedBy', 'name email role employeeId')
      .populate('salesContext.company', 'companyName industry')
      .populate('salesContext.lead', 'name designation')
      .populate('salesContext.revenueTarget', 'targetAmount targetPeriod')
      .sort({ dueDate: 1, createdAt: -1 });

    // Calculate stats
    const stats = {
      total: tasks.length,
      pending: tasks.filter(t => t.status === 'pending').length,
      inProgress: tasks.filter(t => t.status === 'in-progress').length,
      completed: tasks.filter(t => t.status === 'completed').length,
      overdue: tasks.filter(t => t.dueDate && new Date(t.dueDate) < new Date() && t.status !== 'completed').length
    };

    res.json({
      success: true,
      count: tasks.length,
      stats,
      data: tasks
    });
  } catch (error) {
    console.error('Get all sales tasks error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Update Sales Task
exports.updateSalesTask = async (req, res) => {
  try {
    const { taskId } = req.params;
    const updates = req.body;

    const task = await Task.findOne({ _id: taskId, taskType: 'sales' });
    if (!task) {
      return res.status(404).json({ message: 'Sales task not found' });
    }

    // Only HOS or assigned user can update
    if (req.user.role !== 'head-of-sales' && 
        task.assignedTo.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to update this task' });
    }

    // Update allowed fields
    const allowedUpdates = [
      'title', 'description', 'dueDate', 'priority', 'status',
      'documentLink', 'recurring', 'salesContext'
    ];

    Object.keys(updates).forEach(key => {
      if (allowedUpdates.includes(key)) {
        task[key] = updates[key];
      }
    });

    // Track status change
    if (updates.status && updates.status !== task.status) {
      task.statusHistory = task.statusHistory || [];
      task.statusHistory.push({
        status: updates.status,
        changedBy: req.user.id,
        changedAt: Date.now(),
        notes: updates.statusNotes
      });

      // If completed, set completion date
      if (updates.status === 'completed') {
        task.completedAt = Date.now();
        task.completedBy = req.user.id;
      }
    }

    task.updatedAt = Date.now();

    await task.save();
    await task.populate('assignedTo assignedBy', 'name email role');
    await task.populate('salesContext.company', 'companyName');
    await task.populate('salesContext.lead', 'name designation');

    res.json({
      success: true,
      message: 'Task updated successfully',
      data: task
    });
  } catch (error) {
    console.error('Update sales task error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Delete Sales Task
exports.deleteSalesTask = async (req, res) => {
  try {
    const { taskId } = req.params;

    const task = await Task.findOne({ _id: taskId, taskType: 'sales' });
    if (!task) {
      return res.status(404).json({ message: 'Sales task not found' });
    }

    // Only HOS can delete tasks
    if (req.user.role !== 'head-of-sales') {
      return res.status(403).json({ message: 'Only Head of Sales can delete tasks' });
    }

    await task.deleteOne();

    res.json({
      success: true,
      message: 'Task deleted successfully'
    });
  } catch (error) {
    console.error('Delete sales task error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Assign/Reassign Sales Task
exports.assignSalesTask = async (req, res) => {
  try {
    const { taskId } = req.params;
    const { assignTo } = req.body;

    const task = await Task.findOne({ _id: taskId, taskType: 'sales' });
    if (!task) {
      return res.status(404).json({ message: 'Sales task not found' });
    }

    const newAssignee = await User.findById(assignTo);
    if (!newAssignee) {
      return res.status(404).json({ message: 'User not found' });
    }

    const previousAssignee = task.assignedTo;
    task.assignedTo = assignTo;
    task.assignmentHistory = task.assignmentHistory || [];
    task.assignmentHistory.push({
      from: previousAssignee,
      to: assignTo,
      changedBy: req.user.id,
      changedAt: Date.now()
    });

    await task.save();
    await task.populate('assignedTo assignedBy', 'name email role');

    // TODO: Notify new assignee

    res.json({
      success: true,
      message: 'Task reassigned successfully',
      data: task
    });
  } catch (error) {
    console.error('Assign sales task error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// ============ SALES TEAM SECTION ============

// Get My Sales Tasks
exports.getMySalesTasks = async (req, res) => {
  try {
    const { status, priority } = req.query;
    const filter = {
      assignedTo: req.user.id,
      taskType: 'sales'
    };

    if (status) filter.status = status;
    if (priority) filter.priority = priority;

    const tasks = await Task.find(filter)
      .populate('assignedBy', 'name email role')
      .populate('salesContext.company', 'companyName industry priority')
      .populate('salesContext.lead', 'name designation stage')
      .populate('salesContext.revenueTarget', 'targetAmount targetPeriod')
      .sort({ dueDate: 1, createdAt: -1 });

    // Calculate stats
    const now = new Date();
    const stats = {
      total: tasks.length,
      pending: tasks.filter(t => t.status === 'pending').length,
      inProgress: tasks.filter(t => t.status === 'in-progress').length,
      completed: tasks.filter(t => t.status === 'completed').length,
      overdue: tasks.filter(t => t.dueDate && new Date(t.dueDate) < now && t.status !== 'completed').length,
      dueToday: tasks.filter(t => {
        if (!t.dueDate || t.status === 'completed') return false;
        const dueDate = new Date(t.dueDate);
        return dueDate.toDateString() === now.toDateString();
      }).length
    };

    res.json({
      success: true,
      count: tasks.length,
      stats,
      data: tasks
    });
  } catch (error) {
    console.error('Get my sales tasks error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Update My Task Status
exports.updateMyTaskStatus = async (req, res) => {
  try {
    const { taskId } = req.params;
    const { status, notes, evidence } = req.body;

    const task = await Task.findOne({
      _id: taskId,
      assignedTo: req.user.id,
      taskType: 'sales'
    });

    if (!task) {
      return res.status(404).json({ message: 'Task not found or not assigned to you' });
    }

    const validStatuses = ['pending', 'in-progress', 'completed', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: 'Invalid status', validStatuses });
    }

    const oldStatus = task.status;
    task.status = status;

    task.statusHistory = task.statusHistory || [];
    task.statusHistory.push({
      status,
      changedBy: req.user.id,
      changedAt: Date.now(),
      notes
    });

    if (status === 'completed') {
      task.completedAt = Date.now();
      task.completedBy = req.user.id;
      if (evidence) {
        task.evidence = task.evidence || [];
        task.evidence.push({
          type: 'completion',
          url: evidence,
          uploadedBy: req.user.id,
          uploadedAt: Date.now()
        });
      }
    }

    if (status === 'in-progress' && oldStatus === 'pending') {
      task.startedAt = Date.now();
    }

    await task.save();
    await task.populate('assignedBy', 'name email role');
    await task.populate('salesContext.company', 'companyName');
    await task.populate('salesContext.lead', 'name designation');

    // TODO: Notify HOS of status change

    res.json({
      success: true,
      message: `Task marked as ${status}`,
      data: task
    });
  } catch (error) {
    console.error('Update my task status error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get Task Details
exports.getTaskDetails = async (req, res) => {
  try {
    const { taskId } = req.params;

    const task = await Task.findOne({ _id: taskId, taskType: 'sales' })
      .populate('assignedTo assignedBy', 'name email role employeeId')
      .populate('completedBy', 'name email')
      .populate('salesContext.company', 'companyName industry location website')
      .populate('salesContext.lead', 'name designation email phone stage')
      .populate('salesContext.revenueTarget', 'targetAmount targetPeriod startDate endDate')
      .populate('statusHistory.changedBy', 'name email')
      .populate('assignmentHistory.from assignmentHistory.to', 'name email');

    if (!task) {
      return res.status(404).json({ message: 'Sales task not found' });
    }

    // Check access
    const hasAccess = 
      req.user.role === 'co-founder' ||
      req.user.role === 'head-of-sales' ||
      task.assignedTo._id.toString() === req.user.id ||
      task.assignedBy._id.toString() === req.user.id;

    if (!hasAccess) {
      return res.status(403).json({ message: 'Not authorized to view this task' });
    }

    res.json({
      success: true,
      data: task
    });
  } catch (error) {
    console.error('Get task details error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get Overdue Tasks (with notifications)
exports.getOverdueTasks = async (req, res) => {
  try {
    const now = new Date();
    const filter = {
      taskType: 'sales',
      status: { $nin: ['completed', 'cancelled'] },
      dueDate: { $lt: now }
    };

    // Filter based on role
    if (req.user.role !== 'head-of-sales' && req.user.role !== 'co-founder') {
      filter.assignedTo = req.user.id;
    }

    const tasks = await Task.find(filter)
      .populate('assignedTo assignedBy', 'name email role')
      .populate('salesContext.company', 'companyName')
      .populate('salesContext.lead', 'name designation')
      .sort({ dueDate: 1 });

    // Calculate how overdue each task is
    const tasksWithOverdueInfo = tasks.map(task => ({
      ...task.toObject(),
      daysOverdue: Math.floor((now - new Date(task.dueDate)) / (1000 * 60 * 60 * 24))
    }));

    res.json({
      success: true,
      count: tasks.length,
      data: tasksWithOverdueInfo
    });
  } catch (error) {
    console.error('Get overdue tasks error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get Upcoming Tasks (due in next 7 days)
exports.getUpcomingTasks = async (req, res) => {
  try {
    const now = new Date();
    const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    
    const filter = {
      taskType: 'sales',
      status: { $nin: ['completed', 'cancelled'] },
      dueDate: { $gte: now, $lte: nextWeek }
    };

    // Filter based on role
    if (req.user.role !== 'head-of-sales' && req.user.role !== 'co-founder') {
      filter.assignedTo = req.user.id;
    }

    const tasks = await Task.find(filter)
      .populate('assignedTo assignedBy', 'name email role')
      .populate('salesContext.company', 'companyName priority')
      .populate('salesContext.lead', 'name designation stage')
      .sort({ dueDate: 1 });

    // Calculate days until due
    const tasksWithDueDays = tasks.map(task => ({
      ...task.toObject(),
      daysUntilDue: Math.ceil((new Date(task.dueDate) - now) / (1000 * 60 * 60 * 24))
    }));

    res.json({
      success: true,
      count: tasks.length,
      data: tasksWithDueDays
    });
  } catch (error) {
    console.error('Get upcoming tasks error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Bulk Task Operations (HOS only)
exports.bulkUpdateTasks = async (req, res) => {
  try {
    const { taskIds, updates } = req.body;

    if (!Array.isArray(taskIds) || taskIds.length === 0) {
      return res.status(400).json({ message: 'Task IDs array is required' });
    }

    const allowedBulkUpdates = ['status', 'priority', 'assignedTo'];
    const updateData = {};

    Object.keys(updates).forEach(key => {
      if (allowedBulkUpdates.includes(key)) {
        updateData[key] = updates[key];
      }
    });

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ message: 'No valid updates provided' });
    }

    const result = await Task.updateMany(
      { _id: { $in: taskIds }, taskType: 'sales' },
      { $set: updateData }
    );

    res.json({
      success: true,
      message: `${result.modifiedCount} tasks updated successfully`,
      modifiedCount: result.modifiedCount
    });
  } catch (error) {
    console.error('Bulk update tasks error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = exports;
