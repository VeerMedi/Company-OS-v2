const cron = require('node-cron');
const SalesTaskService = require('../services/SalesTaskService');

/**
 * Scheduler for processing recurring sales tasks
 * Runs daily at midnight to generate due recurring task instances
 */
class RecurringTaskScheduler {
  static start() {
    // Run every day at midnight
    cron.schedule('0 0 * * *', async () => {
      console.log('Running recurring task processor...');
      try {
        const results = await SalesTaskService.processRecurringTasks();
        
        const successCount = results.filter(r => r.success).length;
        const failureCount = results.filter(r => !r.success).length;
        
        console.log(`Recurring tasks processed: ${successCount} success, ${failureCount} failures`);
        
        if (failureCount > 0) {
          const failures = results.filter(r => !r.success);
          console.error('Failed tasks:', failures);
        }
      } catch (error) {
        console.error('Error processing recurring tasks:', error);
      }
    });

    console.log('Recurring task scheduler started');
  }

  /**
   * Manually trigger recurring task processing (for testing)
   */
  static async processNow() {
    console.log('Manually processing recurring tasks...');
    try {
      const results = await SalesTaskService.processRecurringTasks();
      return results;
    } catch (error) {
      console.error('Error processing recurring tasks:', error);
      throw error;
    }
  }
}

module.exports = RecurringTaskScheduler;
