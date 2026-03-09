/**
 * Follow-Up Reminder Scheduler
 * Handles automated reminders for follow-up tasks:
 * - Overdue evidence (2+ days)
 * - Scheduled follow-up reminders (1 day before)
 * - Next follow-up date reminders
 */

const Lead = require('../models/Lead');
const User = require('../models/User');
const NotificationService = require('./NotificationService');
const emailService = require('../utils/emailService');

class FollowUpReminderScheduler {
  constructor() {
    this.isRunning = false;
    this.intervalId = null;
    // Run checks every 6 hours (adjustable)
    this.checkInterval = 6 * 60 * 60 * 1000; // 6 hours in milliseconds
  }

  /**
   * Start the scheduler
   */
  start() {
    if (this.isRunning) {
      console.log('⚠️ Follow-up reminder scheduler is already running');
      return;
    }

    console.log('🚀 Starting follow-up reminder scheduler...');
    this.isRunning = true;

    // Run immediately on startup
    this.runChecks();

    // Then run periodically
    this.intervalId = setInterval(() => {
      this.runChecks();
    }, this.checkInterval);

    console.log(`✅ Follow-up reminder scheduler started (runs every ${this.checkInterval / (60 * 60 * 1000)} hours)`);
  }

  /**
   * Stop the scheduler
   */
  stop() {
    if (!this.isRunning) {
      console.log('⚠️ Follow-up reminder scheduler is not running');
      return;
    }

    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }

    this.isRunning = false;
    console.log('⏹️ Follow-up reminder scheduler stopped');
  }

  /**
   * Run all scheduled checks
   */
  async runChecks() {
    const startTime = Date.now();
    console.log(`\n🔔 Running follow-up reminder checks at ${new Date().toLocaleString()}...`);

    try {
      await Promise.all([
        this.checkOverdueEvidence(),
        this.checkScheduledReminders(),
        this.checkNextFollowUpDates()
      ]);

      const duration = Date.now() - startTime;
      console.log(`✅ Follow-up reminder checks completed in ${duration}ms\n`);
    } catch (error) {
      console.error('❌ Error running follow-up reminder checks:', error);
    }
  }

  /**
   * Check for overdue evidence submissions (2+ days)
   */
  async checkOverdueEvidence() {
    try {
      const twoDaysAgo = new Date();
      twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);

      const leads = await Lead.find({
        'followUps.status': 'pending',
        'followUps.evidenceSubmitted': false,
        'followUps.scheduledDate': { $lt: twoDaysAgo }
      })
      .populate('assignedTo', 'firstName lastName email')
      .populate('company', 'companyName');

      let overdueCount = 0;

      for (const lead of leads) {
        for (const followUp of lead.followUps) {
          if (
            followUp.status === 'pending' &&
            !followUp.evidenceSubmitted &&
            new Date(followUp.scheduledDate) < twoDaysAgo
          ) {
            // Calculate days overdue
            const daysOverdue = Math.floor(
              (Date.now() - new Date(followUp.scheduledDate).getTime()) / (1000 * 60 * 60 * 24)
            );

            // Check if reminder was sent in last 24 hours
            const lastReminder = followUp.lastEvidenceReminderSent;
            const oneDayAgo = new Date();
            oneDayAgo.setDate(oneDayAgo.getDate() - 1);

            if (!lastReminder || new Date(lastReminder) < oneDayAgo) {
              // Send reminder
              await this.sendOverdueEvidenceReminder(
                lead,
                followUp,
                daysOverdue
              );

              // Update last reminder timestamp
              followUp.lastEvidenceReminderSent = Date.now();
              await lead.save();

              overdueCount++;
            }
          }
        }
      }

      if (overdueCount > 0) {
        console.log(`📬 Sent ${overdueCount} overdue evidence reminders`);
      } else {
        console.log(`✓ No overdue evidence found`);
      }
    } catch (error) {
      console.error('Error checking overdue evidence:', error);
    }
  }

  /**
   * Check for scheduled follow-ups (1 day before)
   */
  async checkScheduledReminders() {
    try {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(0, 0, 0, 0);

      const dayAfterTomorrow = new Date(tomorrow);
      dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 1);

      const leads = await Lead.find({
        'followUps.status': 'pending',
        'followUps.scheduledDate': {
          $gte: tomorrow,
          $lt: dayAfterTomorrow
        }
      })
      .populate('assignedTo', 'firstName lastName email')
      .populate('company', 'companyName');

      let reminderCount = 0;

      for (const lead of leads) {
        for (const followUp of lead.followUps) {
          const scheduledDate = new Date(followUp.scheduledDate);
          
          if (
            followUp.status === 'pending' &&
            scheduledDate >= tomorrow &&
            scheduledDate < dayAfterTomorrow
          ) {
            // Check if reminder already sent
            if (!followUp.scheduledReminderSent) {
              await this.sendScheduledFollowUpReminder(
                lead,
                followUp
              );

              // Mark reminder as sent
              followUp.scheduledReminderSent = true;
              await lead.save();

              reminderCount++;
            }
          }
        }
      }

      if (reminderCount > 0) {
        console.log(`📬 Sent ${reminderCount} scheduled follow-up reminders`);
      } else {
        console.log(`✓ No upcoming follow-ups found`);
      }
    } catch (error) {
      console.error('Error checking scheduled reminders:', error);
    }
  }

  /**
   * Check for next follow-up dates approaching
   */
  async checkNextFollowUpDates() {
    try {
      const threeDaysFromNow = new Date();
      threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);
      threeDaysFromNow.setHours(23, 59, 59, 999);

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const leads = await Lead.find({
        'followUps.nextFollowUpDate': {
          $gte: today,
          $lte: threeDaysFromNow
        }
      })
      .populate('assignedTo', 'firstName lastName email')
      .populate('company', 'companyName');

      let nextFollowUpCount = 0;

      for (const lead of leads) {
        for (const followUp of lead.followUps) {
          const nextDate = followUp.nextFollowUpDate ? new Date(followUp.nextFollowUpDate) : null;
          
          if (nextDate && nextDate >= today && nextDate <= threeDaysFromNow) {
            // Check if reminder already sent
            if (!followUp.nextFollowUpReminderSent) {
              await this.sendNextFollowUpReminder(
                lead,
                followUp
              );

              // Mark reminder as sent
              followUp.nextFollowUpReminderSent = true;
              await lead.save();

              nextFollowUpCount++;
            }
          }
        }
      }

      if (nextFollowUpCount > 0) {
        console.log(`📬 Sent ${nextFollowUpCount} next follow-up reminders`);
      } else {
        console.log(`✓ No upcoming next follow-ups found`);
      }
    } catch (error) {
      console.error('Error checking next follow-up dates:', error);
    }
  }

  /**
   * Send overdue evidence reminder
   */
  async sendOverdueEvidenceReminder(lead, followUp, daysOverdue) {
    try {
      const salesRep = lead.assignedTo;
      const company = lead.company;

      if (!salesRep || !salesRep.email) return;

      // Send in-app notification
      await NotificationService.notifyFollowUpEvidencePending(
        salesRep._id.toString(),
        lead._id.toString(),
        followUp._id.toString(),
        lead.name,
        company ? company.companyName : 'Unknown Company',
        daysOverdue
      );

      // Send email reminder
      await emailService.sendFollowUpEvidencePendingReminder({
        salesRepEmail: salesRep.email,
        salesRepName: `${salesRep.firstName} ${salesRep.lastName}`,
        leadName: lead.name,
        companyName: company ? company.companyName : 'Unknown Company',
        contactMethod: followUp.contactMethod,
        scheduledDate: followUp.scheduledDate,
        daysOverdue,
        leadId: lead._id,
        followUpId: followUp._id
      });

      console.log(`  📧 Overdue reminder sent to ${salesRep.email} (${daysOverdue} days overdue)`);
    } catch (error) {
      console.error('Error sending overdue evidence reminder:', error);
    }
  }

  /**
   * Send scheduled follow-up reminder (1 day before)
   */
  async sendScheduledFollowUpReminder(lead, followUp) {
    try {
      const salesRep = lead.assignedTo;
      const company = lead.company;

      if (!salesRep || !salesRep.email) return;

      // Send email reminder
      await emailService.sendFollowUpScheduledReminder({
        salesRepEmail: salesRep.email,
        salesRepName: `${salesRep.firstName} ${salesRep.lastName}`,
        leadName: lead.name,
        companyName: company ? company.companyName : 'Unknown Company',
        contactMethod: followUp.contactMethod,
        scheduledDate: followUp.scheduledDate,
        objective: followUp.objective,
        leadId: lead._id,
        followUpId: followUp._id
      });

      console.log(`  📧 Scheduled reminder sent to ${salesRep.email} (1 day before)`);
    } catch (error) {
      console.error('Error sending scheduled follow-up reminder:', error);
    }
  }

  /**
   * Send next follow-up date reminder
   */
  async sendNextFollowUpReminder(lead, followUp) {
    try {
      const salesRep = lead.assignedTo;
      const company = lead.company;

      if (!salesRep || !salesRep.email) return;

      const nextFollowUpDate = followUp.nextFollowUpDate;
      const daysUntil = Math.ceil(
        (new Date(nextFollowUpDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
      );

      // Send email reminder
      await emailService.sendNextFollowUpReminder({
        salesRepEmail: salesRep.email,
        salesRepName: `${salesRep.firstName} ${salesRep.lastName}`,
        leadName: lead.name,
        companyName: company ? company.companyName : 'Unknown Company',
        previousContactMethod: followUp.contactMethod,
        previousSummary: followUp.summary,
        nextFollowUpDate,
        daysUntil,
        leadId: lead._id,
        followUpId: followUp._id
      });

      console.log(`  📧 Next follow-up reminder sent to ${salesRep.email} (${daysUntil} days until)`);
    } catch (error) {
      console.error('Error sending next follow-up reminder:', error);
    }
  }

  /**
   * Get scheduler status
   */
  getStatus() {
    return {
      isRunning: this.isRunning,
      checkInterval: this.checkInterval,
      checkIntervalHours: this.checkInterval / (60 * 60 * 1000)
    };
  }
}

// Export singleton instance
module.exports = new FollowUpReminderScheduler();
