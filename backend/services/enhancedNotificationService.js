const Notification = require('../models/Notification');

/**
 * Enhanced Notification Service for Leave, Task, and Attendance
 */
class EnhancedNotificationService {
  
  /**
   * Create a notification
   */
  async createNotification({
    userId,
    type,
    title,
    message,
    relatedModel = null,
    relatedId = null,
    actionUrl = null,
    priority = 'medium',
    metadata = {}
  }) {
    try {
      const notification = await Notification.create({
        userId,
        type,
        title,
        message,
        relatedModel,
        relatedId,
        actionUrl,
        priority,
        metadata
      });

      console.log(`✅ Notification created: ${type} for user ${userId}`);
      return notification;
    } catch (error) {
      console.error('❌ Error creating notification:', error);
      // Don't throw - notifications shouldn't break main flow
      return null;
    }
  }

  /**
   * Leave Notifications
   */
  async notifyLeaveApproved(leave) {
    return await this.createNotification({
      userId: leave.employee._id,
      type: 'leave_approved',
      title: '✅ Leave Approved',
      message: `Your ${leave.leaveType} leave from ${this.formatDate(leave.startDate)} to ${this.formatDate(leave.endDate)} has been approved`,
      relatedModel: 'Leave',
      relatedId: leave._id,
      actionUrl: `/leave-management`,
      priority: 'medium'
    });
  }

  async notifyLeaveRejected(leave, reason = '') {
    return await this.createNotification({
      userId: leave.employee._id,
      type: 'leave_rejected',
      title: '❌ Leave Rejected',
      message: `Your ${leave.leaveType} leave request has been rejected${reason ? ': ' + reason : ''}`,
      relatedModel: 'Leave',
      relatedId: leave._id,
      actionUrl: `/leave-management`,
      priority: 'high'
    });
  }

  async notifyApprovalNeeded(leave, approverId) {
    const approverRole = leave.employee.role === 'individual' ? 'Manager' : 
                        leave.employee.role === 'manager' ? 'HR' : 'Cofounder';
    
    return await this.createNotification({
      userId: approverId,
      type: 'approval_needed',
      title: '📋 Leave Approval Required',
      message: `${leave.employee.firstName} ${leave.employee.lastName} requested ${leave.leaveType} leave (${leave.totalDays} days)`,
      relatedModel: 'Leave',
      relatedId: leave._id,
      actionUrl: `/leave-management`,
      priority: 'high',
      metadata: {
        employeeName: `${leave.employee.firstName} ${leave.employee.lastName}`,
        leaveType: leave.leaveType,
        days: leave.totalDays
      }
    });
  }

  /**
   * Helper methods
   */
  formatDate(date) {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  }
}

module.exports = new EnhancedNotificationService();
