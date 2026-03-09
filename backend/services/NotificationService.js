// Notification Service for Sales Management System
// Handles internal alerts and notifications for various workflows

const User = require('../models/User');
const Company = require('../models/Company');
const Lead = require('../models/Lead');
const Task = require('../models/Task');
const RevenueTarget = require('../models/RevenueTarget');

// In-memory notification store (replace with database or Redis in production)
const notificationStore = new Map();

// Notification types
const NOTIFICATION_TYPES = {
  COMPANY_SUBMITTED: 'company_submitted',
  COMPANY_APPROVED: 'company_approved',
  COMPANY_REJECTED: 'company_rejected',
  COMPANY_NEEDS_REVISION: 'company_needs_revision',
  LEAD_STAGE_CHANGED: 'lead_stage_changed',
  LEAD_WON: 'lead_won',
  LEAD_LOST: 'lead_lost',
  TASK_ASSIGNED: 'task_assigned',
  TASK_OVERDUE: 'task_overdue',
  TASK_COMPLETED: 'task_completed',
  TARGET_CREATED: 'target_created',
  TARGET_ACHIEVEMENT: 'target_achievement',
  STRATEGY_PROPOSED: 'strategy_proposed',
  STRATEGY_APPROVED: 'strategy_approved',
  STRATEGY_REJECTED: 'strategy_rejected',
  
  // Follow-up notifications
  FOLLOWUP_ADDED: 'followup_added',
  FOLLOWUP_EVIDENCE_PENDING: 'followup_evidence_pending',
  FOLLOWUP_EVIDENCE_SUBMITTED: 'followup_evidence_submitted',
  FOLLOWUP_NEXT_STEP_REMINDER: 'followup_next_step_reminder',
  FOLLOWUP_OVERDUE: 'followup_overdue',
  FOLLOWUP_SCHEDULED_REMINDER: 'followup_scheduled_reminder'
};

// Priority levels
const PRIORITY = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  URGENT: 'urgent'
};

/**
 * Create a notification
 */
const createNotification = async (data) => {
  const notification = {
    id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    type: data.type,
    userId: data.userId,
    title: data.title,
    message: data.message,
    priority: data.priority || PRIORITY.MEDIUM,
    relatedEntity: data.relatedEntity, // { type: 'company', id: '...' }
    actionUrl: data.actionUrl,
    read: false,
    createdAt: new Date(),
    metadata: data.metadata || {}
  };

  // Store notification
  if (!notificationStore.has(data.userId)) {
    notificationStore.set(data.userId, []);
  }
  notificationStore.get(data.userId).push(notification);

  // TODO: Send real-time notification via WebSocket
  // TODO: Send email notification if configured
  // TODO: Store in database

  return notification;
};

/**
 * Get notifications for a user
 */
const getUserNotifications = async (userId, filters = {}) => {
  const userNotifications = notificationStore.get(userId) || [];
  
  let filtered = [...userNotifications];

  // Apply filters
  if (filters.unreadOnly) {
    filtered = filtered.filter(n => !n.read);
  }
  if (filters.type) {
    filtered = filtered.filter(n => n.type === filters.type);
  }
  if (filters.priority) {
    filtered = filtered.filter(n => n.priority === filters.priority);
  }

  // Sort by newest first
  filtered.sort((a, b) => b.createdAt - a.createdAt);

  // Limit results
  if (filters.limit) {
    filtered = filtered.slice(0, filters.limit);
  }

  return {
    total: userNotifications.length,
    unread: userNotifications.filter(n => !n.read).length,
    notifications: filtered
  };
};

/**
 * Mark notification as read
 */
const markAsRead = async (userId, notificationId) => {
  const userNotifications = notificationStore.get(userId) || [];
  const notification = userNotifications.find(n => n.id === notificationId);
  
  if (notification) {
    notification.read = true;
    notification.readAt = new Date();
  }

  return notification;
};

/**
 * Mark all notifications as read
 */
const markAllAsRead = async (userId) => {
  const userNotifications = notificationStore.get(userId) || [];
  userNotifications.forEach(n => {
    n.read = true;
    n.readAt = new Date();
  });
  
  return { modifiedCount: userNotifications.length };
};

/**
 * Delete notification
 */
const deleteNotification = async (userId, notificationId) => {
  const userNotifications = notificationStore.get(userId) || [];
  const index = userNotifications.findIndex(n => n.id === notificationId);
  
  if (index !== -1) {
    userNotifications.splice(index, 1);
    return true;
  }
  
  return false;
};

// ============ WORKFLOW-SPECIFIC NOTIFICATION FUNCTIONS ============

/**
 * Notify HOS when company is submitted
 */
const notifyCompanySubmitted = async (company, submittedBy) => {
  try {
    // Get HOS users
    const hosUsers = await User.find({ role: 'head-of-sales', isActive: true });
    
    for (const hos of hosUsers) {
      await createNotification({
        userId: hos._id.toString(),
        type: NOTIFICATION_TYPES.COMPANY_SUBMITTED,
        title: 'New Company Submission',
        message: `${submittedBy.name} submitted ${company.companyName} for approval`,
        priority: PRIORITY.MEDIUM,
        relatedEntity: { type: 'company', id: company._id.toString() },
        actionUrl: `/companies/${company._id}`,
        metadata: {
          companyName: company.companyName,
          submittedBy: submittedBy.name,
          industry: company.industry
        }
      });
    }
  } catch (error) {
    console.error('Error notifying company submission:', error);
  }
};

/**
 * Notify sales rep when company is approved/rejected
 */
const notifyCompanyReviewed = async (company, reviewedBy, approved) => {
  try {
    const salesRep = await User.findById(company.identifiedBy);
    if (!salesRep) return;

    await createNotification({
      userId: salesRep._id.toString(),
      type: approved ? NOTIFICATION_TYPES.COMPANY_APPROVED : NOTIFICATION_TYPES.COMPANY_REJECTED,
      title: `Company ${approved ? 'Approved' : 'Rejected'}`,
      message: `${company.companyName} has been ${approved ? 'approved' : 'rejected'} by ${reviewedBy.name}${company.approvalNotes ? `: ${company.approvalNotes}` : ''}`,
      priority: approved ? PRIORITY.MEDIUM : PRIORITY.HIGH,
      relatedEntity: { type: 'company', id: company._id.toString() },
      actionUrl: `/companies/${company._id}`,
      metadata: {
        companyName: company.companyName,
        approved,
        notes: company.approvalNotes
      }
    });
  } catch (error) {
    console.error('Error notifying company review:', error);
  }
};

/**
 * Notify sales rep when revision is requested
 */
const notifyRevisionRequested = async (company, requestedBy) => {
  try {
    const salesRep = await User.findById(company.identifiedBy);
    if (!salesRep) return;

    await createNotification({
      userId: salesRep._id.toString(),
      type: NOTIFICATION_TYPES.COMPANY_NEEDS_REVISION,
      title: 'Company Revision Requested',
      message: `${requestedBy.name} requested more information for ${company.companyName}: ${company.approvalNotes}`,
      priority: PRIORITY.HIGH,
      relatedEntity: { type: 'company', id: company._id.toString() },
      actionUrl: `/companies/${company._id}/edit`,
      metadata: {
        companyName: company.companyName,
        notes: company.approvalNotes
      }
    });
  } catch (error) {
    console.error('Error notifying revision request:', error);
  }
};

/**
 * Notify on lead stage change
 */
const notifyLeadStageChange = async (lead, previousStage, changedBy) => {
  try {
    // Notify HOS
    const hosUsers = await User.find({ role: 'head-of-sales', isActive: true });
    
    // Notify only on important stages
    const importantStages = ['qualified', 'proposal', 'negotiation', 'closedWon', 'closedLost'];
    if (!importantStages.includes(lead.stage)) return;

    const priority = lead.stage === 'closedWon' ? PRIORITY.HIGH : PRIORITY.MEDIUM;
    
    for (const hos of hosUsers) {
      await createNotification({
        userId: hos._id.toString(),
        type: NOTIFICATION_TYPES.LEAD_STAGE_CHANGED,
        title: `Lead Stage Updated: ${lead.stage}`,
        message: `${lead.name} moved from ${previousStage} to ${lead.stage} by ${changedBy.name}`,
        priority,
        relatedEntity: { type: 'lead', id: lead._id.toString() },
        actionUrl: `/leads/${lead._id}`,
        metadata: {
          leadName: lead.name,
          previousStage,
          newStage: lead.stage,
          company: lead.company?.companyName
        }
      });
    }
  } catch (error) {
    console.error('Error notifying lead stage change:', error);
  }
};

/**
 * Notify on deal won
 */
const notifyDealWon = async (lead, value) => {
  try {
    // Notify HOS and Co-founders
    const notifyRoles = ['head-of-sales', 'co-founder', 'ceo'];
    const usersToNotify = await User.find({ 
      role: { $in: notifyRoles }, 
      isActive: true 
    });
    
    for (const user of usersToNotify) {
      await createNotification({
        userId: user._id.toString(),
        type: NOTIFICATION_TYPES.LEAD_WON,
        title: '🎉 Deal Closed Won!',
        message: `${lead.assignedTo?.name || 'Sales team'} closed ${lead.name} - ₹${value?.toLocaleString() || lead.potentialValue?.toLocaleString()}`,
        priority: PRIORITY.HIGH,
        relatedEntity: { type: 'lead', id: lead._id.toString() },
        actionUrl: `/leads/${lead._id}`,
        metadata: {
          leadName: lead.name,
          value: value || lead.potentialValue,
          assignedTo: lead.assignedTo?.name,
          company: lead.company?.companyName
        }
      });
    }
  } catch (error) {
    console.error('Error notifying deal won:', error);
  }
};

/**
 * Notify on task assignment
 */
const notifyTaskAssigned = async (task, assignedBy) => {
  try {
    const assignedUser = await User.findById(task.assignedTo);
    if (!assignedUser) return;

    await createNotification({
      userId: assignedUser._id.toString(),
      type: NOTIFICATION_TYPES.TASK_ASSIGNED,
      title: 'New Task Assigned',
      message: `${assignedBy.name} assigned you: ${task.title}`,
      priority: task.priority === 'urgent' ? PRIORITY.URGENT : PRIORITY.MEDIUM,
      relatedEntity: { type: 'task', id: task._id.toString() },
      actionUrl: `/tasks/${task._id}`,
      metadata: {
        taskTitle: task.title,
        dueDate: task.dueDate,
        priority: task.priority,
        assignedBy: assignedBy.name
      }
    });
  } catch (error) {
    console.error('Error notifying task assignment:', error);
  }
};

/**
 * Notify on overdue tasks
 */
const notifyOverdueTasks = async () => {
  try {
    const now = new Date();
    const overdueTasks = await Task.find({
      taskType: 'sales',
      status: { $nin: ['completed', 'cancelled'] },
      dueDate: { $lt: now },
      overdueNotificationSent: { $ne: true }
    }).populate('assignedTo assignedBy', 'name email role');

    for (const task of overdueTasks) {
      // Notify assigned user
      if (task.assignedTo) {
        await createNotification({
          userId: task.assignedTo._id.toString(),
          type: NOTIFICATION_TYPES.TASK_OVERDUE,
          title: '⚠️ Task Overdue',
          message: `Task "${task.title}" is overdue since ${task.dueDate.toLocaleDateString()}`,
          priority: PRIORITY.URGENT,
          relatedEntity: { type: 'task', id: task._id.toString() },
          actionUrl: `/tasks/${task._id}`,
          metadata: {
            taskTitle: task.title,
            dueDate: task.dueDate,
            daysOverdue: Math.floor((now - task.dueDate) / (1000 * 60 * 60 * 24))
          }
        });
      }

      // Notify HOS
      const hosUsers = await User.find({ role: 'head-of-sales', isActive: true });
      for (const hos of hosUsers) {
        await createNotification({
          userId: hos._id.toString(),
          type: NOTIFICATION_TYPES.TASK_OVERDUE,
          title: 'Team Member Has Overdue Task',
          message: `${task.assignedTo?.name}'s task "${task.title}" is overdue`,
          priority: PRIORITY.HIGH,
          relatedEntity: { type: 'task', id: task._id.toString() },
          actionUrl: `/tasks/${task._id}`,
          metadata: {
            taskTitle: task.title,
            assignedTo: task.assignedTo?.name,
            dueDate: task.dueDate
          }
        });
      }

      // Mark as notified
      task.overdueNotificationSent = true;
      await task.save();
    }
  } catch (error) {
    console.error('Error notifying overdue tasks:', error);
  }
};

/**
 * Notify on task completion
 */
const notifyTaskCompleted = async (task, completedBy) => {
  try {
    // Notify HOS
    const hosUsers = await User.find({ role: 'head-of-sales', isActive: true });
    
    for (const hos of hosUsers) {
      await createNotification({
        userId: hos._id.toString(),
        type: NOTIFICATION_TYPES.TASK_COMPLETED,
        title: 'Task Completed',
        message: `${completedBy.name} completed: ${task.title}`,
        priority: PRIORITY.LOW,
        relatedEntity: { type: 'task', id: task._id.toString() },
        actionUrl: `/tasks/${task._id}`,
        metadata: {
          taskTitle: task.title,
          completedBy: completedBy.name,
          completedAt: new Date()
        }
      });
    }
  } catch (error) {
    console.error('Error notifying task completion:', error);
  }
};

/**
 * Notify on revenue target creation
 */
const notifyTargetCreated = async (target, createdBy) => {
  try {
    const assignedUser = await User.findById(target.assignedTo);
    if (!assignedUser) return;

    await createNotification({
      userId: assignedUser._id.toString(),
      type: NOTIFICATION_TYPES.TARGET_CREATED,
      title: 'New Revenue Target Assigned',
      message: `${createdBy.name} set a new ${target.targetPeriod} target of ₹${target.targetAmount.toLocaleString()}`,
      priority: PRIORITY.HIGH,
      relatedEntity: { type: 'revenue-target', id: target._id.toString() },
      actionUrl: `/revenue/targets/${target._id}`,
      metadata: {
        targetAmount: target.targetAmount,
        targetPeriod: target.targetPeriod,
        startDate: target.startDate,
        endDate: target.endDate
      }
    });
  } catch (error) {
    console.error('Error notifying target creation:', error);
  }
};

/**
 * Notify on strategy submission
 */
const notifyStrategyProposed = async (target, proposedBy) => {
  try {
    const cofounder = await User.findById(target.setBy);
    if (!cofounder) return;

    await createNotification({
      userId: cofounder._id.toString(),
      type: NOTIFICATION_TYPES.STRATEGY_PROPOSED,
      title: 'Strategy Proposal Submitted',
      message: `${proposedBy.name} submitted a strategy for ${target.targetPeriod} revenue target`,
      priority: PRIORITY.HIGH,
      relatedEntity: { type: 'revenue-target', id: target._id.toString() },
      actionUrl: `/revenue/targets/${target._id}`,
      metadata: {
        targetAmount: target.targetAmount,
        expectedCompanies: target.strategy?.expectedCompanies,
        expectedLeads: target.strategy?.expectedLeads
      }
    });
  } catch (error) {
    console.error('Error notifying strategy proposal:', error);
  }
};

/**
 * Notify on strategy approval/rejection
 */
const notifyStrategyReviewed = async (target, reviewedBy, approved) => {
  try {
    const hos = await User.findById(target.assignedTo);
    if (!hos) return;

    await createNotification({
      userId: hos._id.toString(),
      type: approved ? NOTIFICATION_TYPES.STRATEGY_APPROVED : NOTIFICATION_TYPES.STRATEGY_REJECTED,
      title: `Strategy ${approved ? 'Approved' : 'Rejected'}`,
      message: `Your strategy for ${target.targetPeriod} target was ${approved ? 'approved' : 'rejected'} by ${reviewedBy.name}${target.strategy?.coFounderFeedback ? `: ${target.strategy.coFounderFeedback}` : ''}`,
      priority: PRIORITY.HIGH,
      relatedEntity: { type: 'revenue-target', id: target._id.toString() },
      actionUrl: `/revenue/targets/${target._id}`,
      metadata: {
        approved,
        feedback: target.strategy?.coFounderFeedback
      }
    });
  } catch (error) {
    console.error('Error notifying strategy review:', error);
  }
};

/**
 * Check and send pending approval alerts (run periodically)
 */
const sendPendingApprovalAlerts = async () => {
  try {
    // Check for companies pending approval > 24 hours
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const pendingCompanies = await Company.find({
      approvalStatus: 'pending',
      createdAt: { $lt: yesterday },
      isDeleted: false
    }).populate('identifiedBy', 'name');

    if (pendingCompanies.length > 0) {
      const hosUsers = await User.find({ role: 'head-of-sales', isActive: true });
      
      for (const hos of hosUsers) {
        await createNotification({
          userId: hos._id.toString(),
          type: 'pending_approvals_alert',
          title: `${pendingCompanies.length} Pending Approvals`,
          message: `You have ${pendingCompanies.length} companies awaiting approval for over 24 hours`,
          priority: PRIORITY.HIGH,
          actionUrl: '/companies/pending-approval',
          metadata: {
            count: pendingCompanies.length,
            companies: pendingCompanies.map(c => c.companyName).slice(0, 5)
          }
        });
      }
    }
  } catch (error) {
    console.error('Error sending pending approval alerts:', error);
  }
};

// ============ FOLLOW-UP NOTIFICATION FUNCTIONS ============

/**
 * Notify HOS when a follow-up is added
 */
const notifyFollowUpAdded = async (lead, followUp, addedBy) => {
  try {
    // Get HOS users
    const hosUsers = await User.find({ role: 'head-of-sales', isActive: true });
    
    const leadName = lead.name || lead.contactPerson?.name || 'Unknown Lead';
    const companyName = lead.company?.companyName || 'Unknown Company';
    
    for (const hos of hosUsers) {
      await createNotification({
        userId: hos._id.toString(),
        type: NOTIFICATION_TYPES.FOLLOWUP_ADDED,
        title: '📝 New Follow-up Added',
        message: `${addedBy.firstName} ${addedBy.lastName} added a ${followUp.contactMethod || followUp.type} follow-up for ${leadName} (${companyName})`,
        priority: PRIORITY.MEDIUM,
        relatedEntity: { type: 'lead', id: lead._id.toString() },
        actionUrl: `/leads/${lead._id}`,
        metadata: {
          leadName,
          companyName,
          contactMethod: followUp.contactMethod || followUp.type,
          scheduledDate: followUp.scheduledDate || followUp.date,
          scheduledTime: followUp.scheduledTime,
          summary: followUp.summary || followUp.notes,
          nextStep: followUp.nextStep || followUp.nextAction,
          addedBy: `${addedBy.firstName} ${addedBy.lastName}`,
          evidenceRequired: followUp.evidenceRequired
        }
      });
    }

    // Also notify the sales rep (reminder about next step)
    await createNotification({
      userId: addedBy._id.toString(),
      type: NOTIFICATION_TYPES.FOLLOWUP_NEXT_STEP_REMINDER,
      title: '✅ Follow-up Added - Next Step',
      message: `You added a follow-up for ${leadName}. ${followUp.nextStep || followUp.nextAction ? `Next step: ${followUp.nextStep || followUp.nextAction}` : 'Remember to submit evidence after completion.'}`,
      priority: PRIORITY.MEDIUM,
      relatedEntity: { type: 'lead', id: lead._id.toString() },
      actionUrl: `/leads/${lead._id}`,
      metadata: {
        leadName,
        companyName,
        followUpId: followUp._id?.toString(),
        nextStep: followUp.nextStep || followUp.nextAction,
        nextFollowUpDate: followUp.nextFollowUpDate,
        evidenceRequired: followUp.evidenceRequired
      }
    });
  } catch (error) {
    console.error('Error notifying follow-up added:', error);
  }
};

/**
 * Notify sales rep about pending evidence submission
 */
const notifyFollowUpEvidencePending = async (lead, followUp, salesRep) => {
  try {
    const leadName = lead.name || lead.contactPerson?.name || 'Unknown Lead';
    const companyName = lead.company?.companyName || 'Unknown Company';
    
    await createNotification({
      userId: salesRep._id.toString(),
      type: NOTIFICATION_TYPES.FOLLOWUP_EVIDENCE_PENDING,
      title: '⚠️ Evidence Submission Pending',
      message: `Please submit evidence for your ${followUp.contactMethod || followUp.type} follow-up with ${leadName} (${companyName})`,
      priority: PRIORITY.HIGH,
      relatedEntity: { type: 'lead', id: lead._id.toString() },
      actionUrl: `/leads/${lead._id}/submit-evidence/${followUp._id}`,
      metadata: {
        leadName,
        companyName,
        followUpId: followUp._id.toString(),
        contactMethod: followUp.contactMethod || followUp.type,
        scheduledDate: followUp.scheduledDate || followUp.date,
        daysSinceFollowUp: Math.floor((new Date() - new Date(followUp.scheduledDate || followUp.date)) / (1000 * 60 * 60 * 24))
      }
    });
  } catch (error) {
    console.error('Error notifying follow-up evidence pending:', error);
  }
};

/**
 * Notify HOS when evidence is submitted
 */
const notifyFollowUpEvidenceSubmitted = async (lead, followUp, submittedBy) => {
  try {
    const hosUsers = await User.find({ role: 'head-of-sales', isActive: true });
    const leadName = lead.name || lead.contactPerson?.name || 'Unknown Lead';
    const companyName = lead.company?.companyName || 'Unknown Company';
    
    for (const hos of hosUsers) {
      await createNotification({
        userId: hos._id.toString(),
        type: NOTIFICATION_TYPES.FOLLOWUP_EVIDENCE_SUBMITTED,
        title: '✅ Follow-up Evidence Submitted',
        message: `${submittedBy.firstName} ${submittedBy.lastName} submitted evidence for ${leadName} (${companyName})`,
        priority: PRIORITY.LOW,
        relatedEntity: { type: 'lead', id: lead._id.toString() },
        actionUrl: `/leads/${lead._id}`,
        metadata: {
          leadName,
          companyName,
          followUpId: followUp._id.toString(),
          contactMethod: followUp.contactMethod || followUp.type,
          evidenceFiles: followUp.evidenceFiles?.length || 0,
          evidenceNotes: followUp.evidenceNotes,
          submittedBy: `${submittedBy.firstName} ${submittedBy.lastName}`
        }
      });
    }
  } catch (error) {
    console.error('Error notifying follow-up evidence submitted:', error);
  }
};

/**
 * Send scheduled reminder for upcoming follow-up
 */
const sendFollowUpScheduledReminder = async (lead, followUp, salesRep) => {
  try {
    const leadName = lead.name || lead.contactPerson?.name || 'Unknown Lead';
    const companyName = lead.company?.companyName || 'Unknown Company';
    const scheduledDate = new Date(followUp.scheduledDate || followUp.date);
    
    await createNotification({
      userId: salesRep._id.toString(),
      type: NOTIFICATION_TYPES.FOLLOWUP_SCHEDULED_REMINDER,
      title: '🔔 Upcoming Follow-up',
      message: `Reminder: ${followUp.contactMethod || followUp.type} follow-up with ${leadName} scheduled for ${scheduledDate.toLocaleDateString()} at ${followUp.scheduledTime || 'N/A'}`,
      priority: PRIORITY.MEDIUM,
      relatedEntity: { type: 'lead', id: lead._id.toString() },
      actionUrl: `/leads/${lead._id}`,
      metadata: {
        leadName,
        companyName,
        followUpId: followUp._id.toString(),
        contactMethod: followUp.contactMethod || followUp.type,
        scheduledDate: followUp.scheduledDate || followUp.date,
        scheduledTime: followUp.scheduledTime,
        summary: followUp.summary || followUp.notes,
        messageSent: followUp.messageSent
      }
    });
  } catch (error) {
    console.error('Error sending scheduled follow-up reminder:', error);
  }
};

/**
 * Send next follow-up date reminder
 */
const sendNextFollowUpReminder = async (lead, followUp, salesRep) => {
  try {
    if (!followUp.nextFollowUpDate) return;
    
    const leadName = lead.name || lead.contactPerson?.name || 'Unknown Lead';
    const companyName = lead.company?.companyName || 'Unknown Company';
    const nextDate = new Date(followUp.nextFollowUpDate);
    
    await createNotification({
      userId: salesRep._id.toString(),
      type: NOTIFICATION_TYPES.FOLLOWUP_NEXT_STEP_REMINDER,
      title: '📅 Next Follow-up Due',
      message: `Next follow-up with ${leadName} (${companyName}) is due on ${nextDate.toLocaleDateString()}`,
      priority: PRIORITY.MEDIUM,
      relatedEntity: { type: 'lead', id: lead._id.toString() },
      actionUrl: `/leads/${lead._id}`,
      metadata: {
        leadName,
        companyName,
        nextFollowUpDate: followUp.nextFollowUpDate,
        nextStep: followUp.nextStep || followUp.nextAction,
        previousFollowUpId: followUp._id.toString()
      }
    });
  } catch (error) {
    console.error('Error sending next follow-up reminder:', error);
  }
};

/**
 * Check and notify overdue follow-ups (run periodically)
 */
const notifyOverdueFollowUps = async () => {
  try {
    const now = new Date();
    const twoDaysAgo = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000);
    
    // Find leads with follow-ups that need evidence submission
    const leadsWithPendingEvidence = await Lead.find({
      'followUps': {
        $elemMatch: {
          evidenceRequired: true,
          evidenceSubmitted: false,
          scheduledDate: { $lt: twoDaysAgo }
        }
      }
    }).populate('assignedTo company', 'firstName lastName email companyName');

    for (const lead of leadsWithPendingEvidence) {
      const pendingFollowUps = lead.followUps.filter(
        fu => fu.evidenceRequired && 
              !fu.evidenceSubmitted && 
              new Date(fu.scheduledDate || fu.date) < twoDaysAgo
      );

      for (const followUp of pendingFollowUps) {
        // Check if already notified recently
        const lastNotified = followUp.lastEvidenceReminderSent;
        if (lastNotified && (now - new Date(lastNotified)) < 24 * 60 * 60 * 1000) {
          continue; // Skip if notified in last 24 hours
        }

        await notifyFollowUpEvidencePending(lead, followUp, lead.assignedTo);
        
        // Also notify HOS
        const hosUsers = await User.find({ role: 'head-of-sales', isActive: true });
        const leadName = lead.name || lead.contactPerson?.name || 'Unknown Lead';
        
        for (const hos of hosUsers) {
          await createNotification({
            userId: hos._id.toString(),
            type: NOTIFICATION_TYPES.FOLLOWUP_OVERDUE,
            title: '⚠️ Overdue Follow-up Evidence',
            message: `${lead.assignedTo?.firstName} ${lead.assignedTo?.lastName} has pending evidence for ${leadName} (${Math.floor((now - new Date(followUp.scheduledDate || followUp.date)) / (1000 * 60 * 60 * 24))} days overdue)`,
            priority: PRIORITY.HIGH,
            relatedEntity: { type: 'lead', id: lead._id.toString() },
            actionUrl: `/leads/${lead._id}`,
            metadata: {
              leadName,
              salesRep: `${lead.assignedTo?.firstName} ${lead.assignedTo?.lastName}`,
              followUpId: followUp._id.toString(),
              daysOverdue: Math.floor((now - new Date(followUp.scheduledDate || followUp.date)) / (1000 * 60 * 60 * 24))
            }
          });
        }

        // Mark as reminded
        followUp.lastEvidenceReminderSent = now;
        await lead.save();
      }
    }

    // Check for upcoming scheduled follow-ups (send reminder 1 day before)
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const dayAfterTomorrow = new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000);
    
    const leadsWithUpcomingFollowUps = await Lead.find({
      'followUps': {
        $elemMatch: {
          scheduledDate: { 
            $gte: tomorrow,
            $lt: dayAfterTomorrow
          },
          evidenceSubmitted: false
        }
      }
    }).populate('assignedTo company', 'firstName lastName email companyName');

    for (const lead of leadsWithUpcomingFollowUps) {
      const upcomingFollowUps = lead.followUps.filter(
        fu => !fu.evidenceSubmitted &&
              new Date(fu.scheduledDate || fu.date) >= tomorrow &&
              new Date(fu.scheduledDate || fu.date) < dayAfterTomorrow
      );

      for (const followUp of upcomingFollowUps) {
        await sendFollowUpScheduledReminder(lead, followUp, lead.assignedTo);
      }
    }

    // Check for next follow-up date reminders
    const leadsWithNextFollowUps = await Lead.find({
      'followUps': {
        $elemMatch: {
          nextFollowUpDate: { 
            $gte: tomorrow,
            $lt: dayAfterTomorrow
          }
        }
      }
    }).populate('assignedTo company', 'firstName lastName email companyName');

    for (const lead of leadsWithNextFollowUps) {
      const nextFollowUps = lead.followUps.filter(
        fu => fu.nextFollowUpDate &&
              new Date(fu.nextFollowUpDate) >= tomorrow &&
              new Date(fu.nextFollowUpDate) < dayAfterTomorrow
      );

      for (const followUp of nextFollowUps) {
        await sendNextFollowUpReminder(lead, followUp, lead.assignedTo);
      }
    }
  } catch (error) {
    console.error('Error notifying overdue follow-ups:', error);
  }
};

// Export all functions
module.exports = {
  NOTIFICATION_TYPES,
  PRIORITY,
  createNotification,
  getUserNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  
  // Workflow-specific notifications
  notifyCompanySubmitted,
  notifyCompanyReviewed,
  notifyRevisionRequested,
  notifyLeadStageChange,
  notifyDealWon,
  notifyTaskAssigned,
  notifyOverdueTasks,
  notifyTaskCompleted,
  notifyTargetCreated,
  notifyStrategyProposed,
  notifyStrategyReviewed,
  sendPendingApprovalAlerts,
  
  // Follow-up notifications
  notifyFollowUpAdded,
  notifyFollowUpEvidencePending,
  notifyFollowUpEvidenceSubmitted,
  sendFollowUpScheduledReminder,
  sendNextFollowUpReminder,
  notifyOverdueFollowUps
};
