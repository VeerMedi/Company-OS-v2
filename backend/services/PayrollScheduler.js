const cron = require('node-cron');
const PayrollService = require('./PayrollService');
const User = require('../models/User');

class PayrollScheduler {
  constructor() {
    this.reminderState = {
      shouldShowReminder: false,
      lastChecked: null,
      payrollStatus: null
    };
    this.autoGenerate = true; // Flag to enable/disable auto generation
  }

  /**
   * Initialize all scheduled tasks
   */
  init() {
    console.log('🕐 Initializing Payroll Scheduler...');
    
    // Check every hour for auto-generation (1st of month at 9 AM)
    cron.schedule('0 * * * *', () => {
      this.checkAutoGeneration();
    });

    // Check daily for reminder (30th of month)
    cron.schedule('0 9 * * *', () => {
      this.checkReminder();
    });

    // Check payroll status every 6 hours
    cron.schedule('0 */6 * * *', () => {
      this.updatePayrollStatus();
    });

    console.log('✅ Payroll Scheduler initialized successfully');
  }

  /**
   * Check if payroll should be auto-generated
   */
  async checkAutoGeneration() {
    try {
      if (!this.autoGenerate) return;

      const shouldGenerate = PayrollService.shouldGeneratePayroll();
      
      if (shouldGenerate) {
        console.log('🎯 Auto-generating monthly payroll...');
        
        // Get system user for payroll creation
        const systemUser = await User.findOne({ role: 'hr' }) || await User.findOne({ role: 'manager' });
        
        if (systemUser) {
          const results = await PayrollService.generateCurrentMonthPayroll(systemUser);
          console.log('✅ Auto payroll generation completed:', results);
          
          // Update reminder state to trigger dashboard notification
          this.updateReminderState();
        } else {
          console.error('❌ No HR or Manager user found for auto payroll generation');
        }
      }
    } catch (error) {
      console.error('❌ Auto payroll generation failed:', error.message);
    }
  }

  /**
   * Check if salary reminder should be shown
   */
  async checkReminder() {
    try {
      const shouldShow = PayrollService.shouldShowSalaryReminder();
      
      if (shouldShow) {
        console.log('🔔 Salary processing reminder activated');
        this.updateReminderState();
      }
    } catch (error) {
      console.error('❌ Reminder check failed:', error.message);
    }
  }

  /**
   * Update payroll status for dashboard display
   */
  async updatePayrollStatus() {
    try {
      const status = await PayrollService.getCurrentMonthPayrollStatus();
      this.reminderState.payrollStatus = status;
      this.reminderState.lastChecked = new Date();
      
      // Show reminder if there are pending payrolls on 30th
      const currentDate = new Date().getDate();
      if (currentDate === 30 && status.needsPaymentProcessing) {
        this.reminderState.shouldShowReminder = true;
      }
      
      console.log('📊 Payroll status updated:', status);
    } catch (error) {
      console.error('❌ Payroll status update failed:', error.message);
    }
  }

  /**
   * Update reminder state
   */
  updateReminderState() {
    this.reminderState.shouldShowReminder = true;
    this.reminderState.lastChecked = new Date();
  }

  /**
   * Get current reminder state for dashboard
   * @returns {Object} Current reminder state
   */
  getReminderState() {
    return this.reminderState;
  }

  /**
   * Dismiss the reminder
   */
  dismissReminder() {
    this.reminderState.shouldShowReminder = false;
    console.log('🔕 Salary reminder dismissed');
  }

  /**
   * Manually trigger payroll generation
   * @param {Object} createdBy - User triggering the generation
   * @returns {Object} Generation results
   */
  async triggerPayrollGeneration(createdBy) {
    try {
      console.log('🎯 Manually triggering payroll generation...');
      const results = await PayrollService.generateCurrentMonthPayroll(createdBy);
      this.updateReminderState();
      return results;
    } catch (error) {
      console.error('❌ Manual payroll generation failed:', error.message);
      throw error;
    }
  }

  /**
   * Get payroll dashboard data
   * @returns {Object} Dashboard data including status and reminders
   */
  async getDashboardData() {
    try {
      const status = await PayrollService.getCurrentMonthPayrollStatus();
      const pendingSummary = await PayrollService.getPendingPayrollSummary();
      
      return {
        reminderState: this.reminderState,
        payrollStatus: status,
        pendingSummary: pendingSummary,
        currentMonth: new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
      };
    } catch (error) {
      console.error('❌ Dashboard data fetch failed:', error.message);
      return {
        reminderState: this.reminderState,
        payrollStatus: null,
        pendingSummary: null,
        currentMonth: new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
      };
    }
  }

  /**
   * Enable/disable auto generation
   * @param {boolean} enabled - Whether to enable auto generation
   */
  setAutoGeneration(enabled) {
    this.autoGenerate = enabled;
    console.log(`🔄 Auto payroll generation ${enabled ? 'enabled' : 'disabled'}`);
  }

  /**
   * Force check reminder (for testing)
   */
  forceReminder() {
    this.updateReminderState();
    console.log('🔔 Reminder force triggered');
  }

  /**
   * Get scheduler status
   * @returns {Object} Current scheduler status
   */
  getStatus() {
    return {
      autoGenerate: this.autoGenerate,
      reminderState: this.reminderState,
      isRunning: true,
      currentDate: new Date().toISOString()
    };
  }
}

// Create singleton instance
const payrollScheduler = new PayrollScheduler();

module.exports = payrollScheduler;