const Task = require('../models/Task');
const User = require('../models/User');

/**
 * Coverage Analytics Service
 * Tracks and analyzes task coverage statistics
 */
class CoverageAnalyticsService {
  
  /**
   * Get tasks user completed for others (coverage tasks)
   * @param {String} userId - User ID
   * @returns {Array} - Coverage tasks
   */
  async getCoverageTasksForUser(userId) {
    try {
      const coverageTasks = await Task.find({
        completedBy: userId,
        isCoverageTask: true
      })
      .populate('coveredFor', 'firstName lastName')
      .populate('project', 'name')
      .sort({ completedAt: -1 });

      return coverageTasks;
    } catch (error) {
      console.error('Error getting coverage tasks:', error);
      throw error;
    }
  }

  /**
   * Get coverage statistics for a user
   * @param {String} userId - User ID
   * @returns {Object} - Coverage statistics
   */
  async getCoverageStats(userId) {
    try {
      // Get all completed tasks by user
      const allCompletedTasks = await Task.find({
        completedBy: userId,
        status: 'completed'
      });

      // Get coverage tasks
      const coverageTasks = await Task.find({
        completedBy: userId,
        isCoverageTask: true,
        status: 'completed'
      }).populate('coveredFor', 'firstName lastName');

      // Calculate points
      const totalPoints = allCompletedTasks.reduce((sum, task) => sum + (task.points || 0), 0);
      const coveragePoints = coverageTasks.reduce((sum, task) => sum + (task.points || 0), 0);
      const ownTasksPoints = totalPoints - coveragePoints;

      // Get unique people covered for
      const coveredForSet = new Set();
      coverageTasks.forEach(task => {
        if (task.coveredFor) {
          coveredForSet.add(`${task.coveredFor.firstName} ${task.coveredFor.lastName}`);
        }
      });

      // Calculate coverage rate
      const coverageRate = allCompletedTasks.length > 0 
        ? (coverageTasks.length / allCompletedTasks.length * 100).toFixed(1)
        : 0;

      return {
        tasksCovered: coverageTasks.length,
        pointsFromCoverage: coveragePoints,
        ownTasksPoints: ownTasksPoints,
        totalPoints: totalPoints,
        coveredFor: Array.from(coveredForSet),
        coverageRate: parseFloat(coverageRate),
        totalTasksCompleted: allCompletedTasks.length
      };
    } catch (error) {
      console.error('Error getting coverage stats:', error);
      throw error;
    }
  }

  /**
   * Get who covered for an employee
   * @param {String} employeeId - Employee ID
   * @returns {Array} - List of users who covered and their stats
   */
  async getWhoCoveredForEmployee(employeeId) {
    try {
      const coverageTasks = await Task.find({
        coveredFor: employeeId,
        isCoverageTask: true,
        status: 'completed'
      })
      .populate('completedBy', 'firstName lastName')
      .populate('project', 'name');

      // Group by completer
      const coverageByUser = {};
      
      coverageTasks.forEach(task => {
        if (task.completedBy) {
          const userId = task.completedBy._id.toString();
          if (!coverageByUser[userId]) {
            coverageByUser[userId] = {
              user: {
                _id: task.completedBy._id,
                name: `${task.completedBy.firstName} ${task.completedBy.lastName}`
              },
              tasksCovered: 0,
              pointsEarned: 0,
              tasks: []
            };
          }
          coverageByUser[userId].tasksCovered++;
          coverageByUser[userId].pointsEarned += task.points || 0;
          coverageByUser[userId].tasks.push({
            title: task.title,
            points: task.points,
            completedAt: task.completedAt,
            project: task.project?.name
          });
        }
      });

      return Object.values(coverageByUser);
    } catch (error) {
      console.error('Error getting who covered for employee:', error);
      throw error;
    }
  }

  /**
   * Get coverage statistics for all employees (HR dashboard)
   * @returns {Array} - Coverage stats for all employees
   */
  async getAllEmployeesCoverageStats() {
    try {
      const employees = await User.find({
        isActive: true,
        role: { $in: ['individual', 'service-delivery', 'service-onboarding'] }
      }).select('firstName lastName totalPoints');

      const stats = await Promise.all(
        employees.map(async (employee) => {
          const coverageStats = await this.getCoverageStats(employee._id);
          return {
            _id: employee._id,
            name: `${employee.firstName} ${employee.lastName}`,
            totalPoints: employee.totalPoints || 0,
            ownTasksPoints: coverageStats.ownTasksPoints,
            coverageTasks: coverageStats.tasksCovered,
            coveragePoints: coverageStats.pointsFromCoverage,
            coverageRate: coverageStats.coverageRate,
            totalTasksCompleted: coverageStats.totalTasksCompleted
          };
        })
      );

      return stats.sort((a, b) => b.coverageRate - a.coverageRate);
    } catch (error) {
      console.error('Error getting all employees coverage stats:', error);
      throw error;
    }
  }
}

module.exports = new CoverageAnalyticsService();
