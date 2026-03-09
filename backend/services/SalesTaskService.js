const Task = require('../models/Task');
const User = require('../models/User');
const Company = require('../models/Company');
const Lead = require('../models/Lead');
const RevenueTarget = require('../models/RevenueTarget');

class SalesTaskService {
  /**
   * Create a default sales task
   */
  static async createDefaultTask(taskData, createdBy) {
    const task = new Task({
      title: taskData.title,
      description: taskData.description,
      documentLink: taskData.documentLink,
      assignedTo: taskData.assignedTo,
      assignedBy: createdBy,
      deadline: taskData.deadline,
      priority: taskData.priority || 'medium',
      taskType: 'default',
      salesContext: {
        company: taskData.companyId,
        lead: taskData.leadId,
        revenueTarget: taskData.revenueTargetId
      },
      createdBy
    });

    await task.save();
    return task;
  }

  /**
   * Create a recurring sales task
   */
  static async createRecurringTask(taskData, createdBy) {
    const task = new Task({
      title: taskData.title,
      description: taskData.description,
      documentLink: taskData.documentLink,
      assignedTo: taskData.assignedTo,
      assignedBy: createdBy,
      deadline: taskData.deadline,
      priority: taskData.priority || 'medium',
      taskType: 'recurring',
      recurring: {
        enabled: true,
        frequency: taskData.frequency || 'weekly',
        interval: taskData.interval || 1,
        endDate: taskData.recurringEndDate,
        nextDueDate: this.calculateNextDueDate(taskData.deadline, taskData.frequency, taskData.interval)
      },
      salesContext: {
        company: taskData.companyId,
        lead: taskData.leadId,
        revenueTarget: taskData.revenueTargetId
      },
      createdBy
    });

    await task.save();
    return task;
  }

  /**
   * Generate next instance of recurring task
   */
  static async generateRecurringTaskInstance(originalTask) {
    if (!originalTask.recurring.enabled) {
      throw new Error('Task is not a recurring task');
    }

    // Check if we've passed the end date
    if (originalTask.recurring.endDate && new Date() > originalTask.recurring.endDate) {
      return null;
    }

    // Create new task instance
    const newTask = new Task({
      title: originalTask.title,
      description: originalTask.description,
      documentLink: originalTask.documentLink,
      assignedTo: originalTask.assignedTo,
      assignedBy: originalTask.assignedBy,
      deadline: originalTask.recurring.nextDueDate,
      priority: originalTask.priority,
      taskType: 'sales',
      salesContext: originalTask.salesContext,
      createdBy: originalTask.createdBy
    });

    await newTask.save();

    // Update original task's recurring data
    originalTask.recurring.lastGenerated = new Date();
    originalTask.recurring.nextDueDate = this.calculateNextDueDate(
      originalTask.recurring.nextDueDate,
      originalTask.recurring.frequency,
      originalTask.recurring.interval
    );
    await originalTask.save();

    return newTask;
  }

  /**
   * Calculate next due date based on frequency
   */
  static calculateNextDueDate(currentDate, frequency, interval = 1) {
    const nextDate = new Date(currentDate);

    switch (frequency) {
      case 'daily':
        nextDate.setDate(nextDate.getDate() + interval);
        break;
      case 'weekly':
        nextDate.setDate(nextDate.getDate() + (7 * interval));
        break;
      case 'biweekly':
        nextDate.setDate(nextDate.getDate() + (14 * interval));
        break;
      case 'monthly':
        nextDate.setMonth(nextDate.getMonth() + interval);
        break;
      case 'quarterly':
        nextDate.setMonth(nextDate.getMonth() + (3 * interval));
        break;
      default:
        nextDate.setDate(nextDate.getDate() + 7); // Default to weekly
    }

    return nextDate;
  }

  /**
   * Process all recurring tasks that are due
   */
  static async processRecurringTasks() {
    const today = new Date();
    
    const dueTasks = await Task.find({
      taskType: 'recurring',
      'recurring.enabled': true,
      'recurring.nextDueDate': { $lte: today },
      $or: [
        { 'recurring.endDate': { $exists: false } },
        { 'recurring.endDate': null },
        { 'recurring.endDate': { $gte: today } }
      ]
    });

    const results = [];
    for (const task of dueTasks) {
      try {
        const newTask = await this.generateRecurringTaskInstance(task);
        if (newTask) {
          results.push({ success: true, task: newTask });
        }
      } catch (error) {
        results.push({ success: false, error: error.message, taskId: task._id });
      }
    }

    return results;
  }

  /**
   * Get tasks for HOS or Sales Team
   */
  static async getTasksForSalesRole(userId, filters = {}) {
    const query = {
      assignedTo: userId,
      taskType: { $in: ['sales', 'default', 'recurring'] },
      ...filters
    };

    const tasks = await Task.find(query)
      .populate('assignedBy', 'firstName lastName email')
      .populate('salesContext.company', 'companyName industry location')
      .populate('salesContext.lead', 'name designation stage')
      .populate('salesContext.revenueTarget', 'targetAmount targetPeriod')
      .sort({ deadline: 1 });

    return tasks;
  }

  /**
   * Assign sales task to user (HOS or Sales Team member)
   */
  static async assignTaskToSalesUser(taskId, userId, assignedBy) {
    const task = await Task.findById(taskId);
    if (!task) {
      throw new Error('Task not found');
    }

    const user = await User.findById(userId);
    if (!user || !['head-of-sales', 'individual'].includes(user.role)) {
      throw new Error('User must be HOS or Sales Team member');
    }

    task.assignedTo = userId;
    task.assignedBy = assignedBy;
    task.status = 'not-started';
    
    await task.save();
    return task;
  }

  /**
   * Link task to company, lead, or revenue target
   */
  static async linkTaskToSalesContext(taskId, context) {
    const task = await Task.findById(taskId);
    if (!task) {
      throw new Error('Task not found');
    }

    if (context.companyId) {
      const company = await Company.findById(context.companyId);
      if (!company) throw new Error('Company not found');
      task.salesContext.company = context.companyId;
    }

    if (context.leadId) {
      const lead = await Lead.findById(context.leadId);
      if (!lead) throw new Error('Lead not found');
      task.salesContext.lead = context.leadId;
    }

    if (context.revenueTargetId) {
      const target = await RevenueTarget.findById(context.revenueTargetId);
      if (!target) throw new Error('Revenue target not found');
      task.salesContext.revenueTarget = context.revenueTargetId;
    }

    await task.save();
    return task;
  }
}

module.exports = SalesTaskService;
