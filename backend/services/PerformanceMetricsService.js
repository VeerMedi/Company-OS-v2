const Task = require('../models/Task');
const Attendance = require('../models/Attendance');
const DeveloperPerformance = require('../models/DeveloperPerformance');

class PerformanceMetricsService {
  /**
   * Calculate task completion score based on completed vs assigned tasks
   */
  static async calculateTaskCompletionScore(employeeId, startDate, endDate) {
    try {
      const tasks = await Task.find({
        assignedTo: employeeId,
        createdAt: { $gte: startDate, $lte: endDate }
      });
      
      if (tasks.length === 0) return 0;
      
      const completedTasks = tasks.filter(task => task.status === 'completed').length;
      const score = Math.round((completedTasks / tasks.length) * 100);
      
      return Math.min(score, 100);
    } catch (error) {
      console.error('Error calculating task completion score:', error);
      return 0;
    }
  }
  
  /**
   * Calculate task quality score based on on-time delivery and review feedback
   */
  static async calculateTaskQualityScore(employeeId, startDate, endDate) {
    try {
      const completedTasks = await Task.find({
        assignedTo: employeeId,
        status: 'completed',
        completedAt: { $gte: startDate, $lte: endDate }
      });
      
      if (completedTasks.length === 0) return 0;
      
      // Calculate on-time delivery rate
      let onTimeCount = 0;
      completedTasks.forEach(task => {
        if (task.dueDate && task.completedAt && task.completedAt <= task.dueDate) {
          onTimeCount++;
        }
      });
      
      const onTimeRate = Math.round((onTimeCount / completedTasks.length) * 100);
      
      // Quality score is weighted: 70% on-time, 30% completion consistency
      const score = Math.round(onTimeRate * 0.7 + 30);
      
      return Math.min(score, 100);
    } catch (error) {
      console.error('Error calculating task quality score:', error);
      return 0;
    }
  }
  
  /**
   * Calculate attendance score - READ ONLY, locked field
   */
  static async calculateAttendanceScore(employeeId, startDate, endDate) {
    try {
      // Get attendance records for the period
      const attendanceRecords = await Attendance.find({
        employee: employeeId,
        date: { $gte: startDate, $lte: endDate }
      });
      
      if (attendanceRecords.length === 0) return 0;
      
      const presentDays = attendanceRecords.filter(record => 
        record.status === 'present' || record.status === 'half-day'
      ).length;
      
      const halfDays = attendanceRecords.filter(record => 
        record.status === 'half-day'
      ).length;
      
      // Adjust for half days (count as 0.5)
      const adjustedPresent = presentDays - (halfDays * 0.5);
      const totalDays = attendanceRecords.length;
      
      const attendanceRate = Math.round((adjustedPresent / totalDays) * 100);
      
      return Math.min(attendanceRate, 100);
    } catch (error) {
      console.error('Error calculating attendance score:', error);
      return 0;
    }
  }
  
  /**
   * Get collaboration score from DeveloperPerformance model
   */
  static async calculateCollaborationScore(employeeId, startDate, endDate) {
    try {
      // Check for coverage tasks and team support
      const coverageTasks = await Task.countDocuments({
        assignedTo: employeeId,
        createdAt: { $gte: startDate, $lte: endDate },
        tags: { $in: ['coverage', 'team-support', 'help'] }
      });
      
      // Score based on coverage tasks (max 100, 5 tasks = 100%)
      const score = Math.min(coverageTasks * 20, 100);
      
      return score;
    } catch (error) {
      console.error('Error calculating collaboration score:', error);
      return 0;
    }
  }
  
  /**
   * Calculate initiative score based on extra tasks and proactive work
   */
  static async calculateInitiativeScore(employeeId, startDate, endDate) {
    try {
      // Count extra tasks (tasks marked as extra or self-assigned)
      const extraTasks = await Task.countDocuments({
        assignedTo: employeeId,
        createdAt: { $gte: startDate, $lte: endDate },
        $or: [
          { tags: { $in: ['extra', 'initiative', 'improvement'] } },
          { assignedBy: employeeId } // Self-assigned tasks
        ]
      });
      
      // Score based on extra tasks (max 100, 5 tasks = 100%)
      const score = Math.min(extraTasks * 20, 100);
      
      return score;
    } catch (error) {
      console.error('Error calculating initiative score:', error);
      return 0;
    }
  }
  
  /**
   * Validate if edit threshold is exceeded (warn if >20% change)
   */
  static validateEditThreshold(oldValue, newValue, thresholdPercent = 20) {
    if (oldValue === 0) return { exceeded: false, changePercent: 0 };
    
    const changePercent = Math.abs(((newValue - oldValue) / oldValue) * 100);
    const exceeded = changePercent > thresholdPercent;
    
    return {
      exceeded,
      changePercent: Math.round(changePercent),
      warning: exceeded ? `This edit changes the value by ${Math.round(changePercent)}%, which exceeds the ${thresholdPercent}% threshold` : null
    };
  }
  
  /**
   * Auto-populate all metrics for an evaluation
   */
  static async autoPopulateMetrics(employeeId, startDate, endDate) {
    const [
      taskCompletion,
      taskQuality,
      attendance,
      collaboration,
      initiative
    ] = await Promise.all([
      this.calculateTaskCompletionScore(employeeId, startDate, endDate),
      this.calculateTaskQualityScore(employeeId, startDate, endDate),
      this.calculateAttendanceScore(employeeId, startDate, endDate),
      this.calculateCollaborationScore(employeeId, startDate, endDate),
      this.calculateInitiativeScore(employeeId, startDate, endDate)
    ]);
    
    return {
      taskCompletion: {
        score: taskCompletion,
        autoCalculated: taskCompletion,
        isOverridden: false
      },
      taskQuality: {
        score: taskQuality,
        isManual: false
      },
      attendance: {
        score: attendance,
        locked: true
      },
      collaboration: {
        score: collaboration
      },
      initiative: {
        score: initiative
      },
      penalties: [],
      bonuses: []
    };
  }
}

module.exports = PerformanceMetricsService;
