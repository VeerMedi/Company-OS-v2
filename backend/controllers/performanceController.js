const User = require('../models/User');
const Task = require('../models/Task');
const Project = require('../models/Project');
const DeveloperPerformance = require('../models/DeveloperPerformance');

// @desc    Get individual performance rankings
// @route   GET /api/performance/individuals
// @access  Private (HR, CEO, Co-founder, Manager)
const getIndividualPerformance = async (req, res) => {
  try {
    const { period = 'all-time' } = req.query;
    const userRole = req.user.role;

    // Build date filter based on period
    let dateFilter = {};
    const now = new Date();

    switch (period) {
      case 'this-month':
        dateFilter = {
          $gte: new Date(now.getFullYear(), now.getMonth(), 1),
          $lte: new Date(now.getFullYear(), now.getMonth() + 1, 0)
        };
        break;
      case 'last-30-days':
        dateFilter = {
          $gte: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
          $lte: now
        };
        break;
      case 'this-quarter':
        const quarter = Math.floor(now.getMonth() / 3);
        dateFilter = {
          $gte: new Date(now.getFullYear(), quarter * 3, 1),
          $lte: new Date(now.getFullYear(), (quarter + 1) * 3, 0)
        };
        break;
      case 'this-year':
        dateFilter = {
          $gte: new Date(now.getFullYear(), 0, 1),
          $lte: new Date(now.getFullYear(), 11, 31)
        };
        break;
      case 'all-time':
      default:
        // No date filter for all-time
        break;
    }

    // Build query based on role
    let individualsQuery = {
      role: { $in: ['individual', 'developer', 'team-lead', 'intern', 'service-delivery', 'service-onboarding'] },
      isActive: true
    };

    // Note: For now, managers see all team members regardless of reporting structure
    // This provides better visibility until the org structure is fully configured
    // If strict hierarchy is needed, uncomment the filter below:
    // if (userRole === 'manager') {
    //   individualsQuery.reportingTo = req.user._id;
    // }

    // Get all individuals (filtered by manager if applicable)
    const individuals = await User.find(individualsQuery).select('firstName lastName email totalPoints createdAt');

    // Build performance data for each individual
    const performanceData = await Promise.all(
      individuals.map(async (individual) => {
        // Try to get DeveloperPerformance record first (has calculated metrics)
        const developerPerf = await DeveloperPerformance.findOne({ developer: individual._id });

        // Build task query with date filter if specified
        let taskQuery = { assignedTo: individual._id };
        if (Object.keys(dateFilter).length > 0) {
          taskQuery.createdAt = dateFilter;
        }

        // Get all tasks assigned to this individual
        const allTasks = await Task.find(taskQuery);

        // Get completed tasks
        const completedTasks = allTasks.filter(task => task.status === 'completed');

        // Calculate points earned in the period
        let pointsEarned = 0;
        if (Object.keys(dateFilter).length > 0) {
          // For specific periods, calculate points from completed tasks in that period
          const completedTasksInPeriod = await Task.find({
            assignedTo: individual._id,
            status: 'completed',
            completedAt: dateFilter
          });
          pointsEarned = completedTasksInPeriod.reduce((sum, task) => sum + (task.points || 0), 0);
        } else {
          // For all-time, use DeveloperPerformance total or user's total points
          pointsEarned = developerPerf?.allTimeStats?.totalPointsEarned || individual.totalPoints || 0;
        }

        // Use DeveloperPerformance metrics if available, otherwise calculate
        let completionRate, productivityScore;

        if (developerPerf && period === 'all-time') {
          // Use pre-calculated metrics from DeveloperPerformance
          completionRate = developerPerf.metrics.completionRate;
          productivityScore = developerPerf.metrics.productivityScore;
        } else {
          // Calculate for specific period
          completionRate = allTasks.length > 0
            ? Math.round((completedTasks.length / allTasks.length) * 100)
            : 0;
          productivityScore = completionRate; // Simplified for period-specific
        }

        // Get task distribution by status
        const tasksByStatus = {
          'not-started': allTasks.filter(t => t.status === 'not-started').length,
          'in-progress': allTasks.filter(t => t.status === 'in-progress').length,
          'completed': completedTasks.length,
          'cant-complete': allTasks.filter(t => t.status === 'cant-complete').length,
          'review': allTasks.filter(t => t.status === 'review').length
        };

        // Get recent performance trend (last 7 days of completed tasks)
        const last7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        const recentCompletedTasks = await Task.find({
          assignedTo: individual._id,
          status: 'completed',
          completedAt: { $gte: last7Days }
        });

        // Calculate average time to complete tasks
        const tasksWithDuration = completedTasks.filter(task =>
          task.acceptedAt && task.completedAt
        );
        const avgCompletionTime = tasksWithDuration.length > 0
          ? tasksWithDuration.reduce((sum, task) => {
            const duration = new Date(task.completedAt) - new Date(task.acceptedAt);
            return sum + duration;
          }, 0) / tasksWithDuration.length
          : 0;

        // Convert milliseconds to days
        const avgCompletionDays = Math.round(avgCompletionTime / (1000 * 60 * 60 * 24));

        return {
          id: individual._id,
          name: `${individual.firstName} ${individual.lastName}`,
          email: individual.email,
          totalPoints: pointsEarned,
          totalTasks: allTasks.length,
          completedTasks: completedTasks.length,
          completionRate,
          productivityScore, // Added productivity score
          tasksByStatus,
          recentActivity: recentCompletedTasks.length,
          avgCompletionTime: avgCompletionDays,
          joinedDate: individual.createdAt,
          lastTaskCompleted: completedTasks.length > 0
            ? completedTasks.sort((a, b) => new Date(b.completedAt) - new Date(a.completedAt))[0].completedAt
            : null,
          // Add streak info if available
          streak: developerPerf?.streak?.currentStreak || 0,
          longestStreak: developerPerf?.streak?.longestStreak || 0
        };
      })
    );

    // Sort by total points (descending) by default
    performanceData.sort((a, b) => b.totalPoints - a.totalPoints);

    // Add ranking
    const rankedData = performanceData.map((individual, index) => ({
      ...individual,
      rank: index + 1
    }));

    // Calculate overall statistics
    const totalIndividuals = rankedData.length;
    const totalPointsEarned = rankedData.reduce((sum, ind) => sum + ind.totalPoints, 0);
    const totalTasksCompleted = rankedData.reduce((sum, ind) => sum + ind.completedTasks, 0);
    const avgCompletionRate = totalIndividuals > 0
      ? Math.round(rankedData.reduce((sum, ind) => sum + ind.completionRate, 0) / totalIndividuals)
      : 0;

    res.status(200).json({
      success: true,
      data: rankedData,
      statistics: {
        totalIndividuals,
        totalPointsEarned,
        totalTasksCompleted,
        avgCompletionRate,
        period
      },
      period,
      generatedAt: new Date()
    });

  } catch (error) {
    console.error('Get individual performance error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch performance data',
      error: process.env.NODE_ENV === 'development' ? error.message : {}
    });
  }
};

// @desc    Get detailed performance for a specific individual
// @route   GET /api/performance/individuals/:id
// @access  Private (HR, CEO, Co-founder, Manager)
const getIndividualDetailedPerformance = async (req, res) => {
  try {
    const { id } = req.params;
    const { period = 'all-time' } = req.query;

    // Find the individual
    const individual = await User.findById(id);
    if (!individual || individual.role !== 'individual') {
      return res.status(404).json({
        success: false,
        message: 'Individual not found'
      });
    }

    // Build date filter based on period
    let dateFilter = {};
    const now = new Date();

    switch (period) {
      case 'this-month':
        dateFilter = {
          $gte: new Date(now.getFullYear(), now.getMonth(), 1),
          $lte: new Date(now.getFullYear(), now.getMonth() + 1, 0)
        };
        break;
      case 'last-30-days':
        dateFilter = {
          $gte: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
          $lte: now
        };
        break;
      case 'this-quarter':
        const quarter = Math.floor(now.getMonth() / 3);
        dateFilter = {
          $gte: new Date(now.getFullYear(), quarter * 3, 1),
          $lte: new Date(now.getFullYear(), (quarter + 1) * 3, 0)
        };
        break;
      case 'this-year':
        dateFilter = {
          $gte: new Date(now.getFullYear(), 0, 1),
          $lte: new Date(now.getFullYear(), 11, 31)
        };
        break;
    }

    // Get detailed task information
    let taskQuery = { assignedTo: id };
    if (Object.keys(dateFilter).length > 0) {
      taskQuery.createdAt = dateFilter;
    }

    const tasks = await Task.find(taskQuery)
      .populate('project', 'name description')
      .populate('assignedBy', 'firstName lastName')
      .sort({ createdAt: -1 });

    // Get performance trends (daily completion over last 30 days)
    const last30Days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const dailyCompletions = await Task.aggregate([
      {
        $match: {
          assignedTo: individual._id,
          status: 'completed',
          completedAt: { $gte: last30Days }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$completedAt' },
            month: { $month: '$completedAt' },
            day: { $dayOfMonth: '$completedAt' }
          },
          count: { $sum: 1 },
          points: { $sum: '$points' }
        }
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 }
      }
    ]);

    // Get project-wise performance
    const projectPerformance = await Task.aggregate([
      {
        $match: taskQuery
      },
      {
        $lookup: {
          from: 'projects',
          localField: 'project',
          foreignField: '_id',
          as: 'projectInfo'
        }
      },
      {
        $unwind: '$projectInfo'
      },
      {
        $group: {
          _id: '$project',
          projectName: { $first: '$projectInfo.name' },
          totalTasks: { $sum: 1 },
          completedTasks: {
            $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
          },
          totalPoints: { $sum: '$points' },
          earnedPoints: {
            $sum: { $cond: [{ $eq: ['$status', 'completed'] }, '$points', 0] }
          }
        }
      },
      {
        $addFields: {
          completionRate: {
            $round: [
              { $multiply: [{ $divide: ['$completedTasks', '$totalTasks'] }, 100] }
            ]
          }
        }
      }
    ]);

    const detailedPerformance = {
      individual: {
        id: individual._id,
        name: `${individual.firstName} ${individual.lastName}`,
        email: individual.email,
        totalPoints: individual.totalPoints || 0,
        joinedDate: individual.createdAt
      },
      tasks,
      dailyCompletions,
      projectPerformance,
      summary: {
        totalTasks: tasks.length,
        completedTasks: tasks.filter(t => t.status === 'completed').length,
        inProgressTasks: tasks.filter(t => t.status === 'in-progress').length,
        overdueTasks: tasks.filter(t =>
          t.status !== 'completed' && new Date(t.deadline) < new Date()
        ).length,
        totalPointsAvailable: tasks.reduce((sum, task) => sum + (task.points || 0), 0),
        pointsEarned: tasks.filter(t => t.status === 'completed')
          .reduce((sum, task) => sum + (task.points || 0), 0)
      },
      period,
      generatedAt: new Date()
    };

    res.status(200).json({
      success: true,
      data: detailedPerformance
    });

  } catch (error) {
    console.error('Get individual detailed performance error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch detailed performance data',
      error: process.env.NODE_ENV === 'development' ? error.message : {}
    });
  }
};

// Achievement definitions
const ACHIEVEMENTS = [
  {
    id: 'first_task',
    name: 'Getting Started',
    description: 'Complete your first task',
    icon: '🎯',
    rarity: 'common'
  },
  {
    id: 'speed_demon',
    name: 'Speed Demon',
    description: 'Complete a task in under 24 hours',
    icon: '⚡',
    rarity: 'rare'
  },
  {
    id: 'point_master',
    name: 'Point Master',
    description: 'Earn 100+ points',
    icon: '💎',
    rarity: 'epic'
  },
  {
    id: 'streak_7',
    name: 'Week Warrior',
    description: 'Maintain a 7-day streak',
    icon: '🔥',
    rarity: 'rare'
  },
  {
    id: 'perfectionist',
    name: 'Perfectionist',
    description: 'Complete 10 tasks',
    icon: '✨',
    rarity: 'epic'
  },
  {
    id: 'high_performer',
    name: 'High Performer',
    description: 'Achieve 90%+ completion rate',
    icon: '🌟',
    rarity: 'legendary'
  }
];

// @desc    Get personalized performance insights for logged-in user
// @route   GET /api/performance/my-insights
// @access  Private
const getMyInsights = async (req, res) => {
  try {
    const userId = req.user._id;
    const DeveloperPerformance = require('../models/DeveloperPerformance');

    // Get or create performance record
    let performance = await DeveloperPerformance.findOne({ developer: userId });

    if (!performance) {
      // Initialize performance record if it doesn't exist
      performance = new DeveloperPerformance({
        developer: userId,
        dailyStats: {},
        weeklyStats: {},
        monthlyStats: {},
        allTimeStats: {},
        streak: { currentStreak: 0, longestStreak: 0 },
        metrics: {},
        dailyHistory: []
      });
      await performance.save();
    }

    // Fetch all tasks for this developer
    const allTasks = await Task.find({ assignedTo: userId })
      .sort({ createdAt: -1 });

    // Sync performance with current task data
    await syncPerformanceWithTasks(performance, allTasks);

    // Fetch all tasks for breakdown
    const completedTasks = allTasks.filter(t => t.status === 'completed');
    const inProgressTasks = allTasks.filter(t => t.status === 'in-progress');
    const pendingTasks = allTasks.filter(t => t.status === 'not-started');

    // Task breakdown by priority
    const byPriority = {
      high: allTasks.filter(t => t.priority === 'high').length,
      medium: allTasks.filter(t => t.priority === 'medium').length,
      low: allTasks.filter(t => t.priority === 'low').length,
      urgent: allTasks.filter(t => t.priority === 'urgent').length
    };

    // Task breakdown by status
    const byStatus = {
      completed: completedTasks.length,
      inProgress: inProgressTasks.length,
      pending: pendingTasks.length
    };

    // Skills breakdown
    const skillsMap = {};
    completedTasks.forEach(task => {
      if (task.requiredSkills && Array.isArray(task.requiredSkills)) {
        task.requiredSkills.forEach(skill => {
          skillsMap[skill] = (skillsMap[skill] || 0) + 1;
        });
      }
    });

    // Generate achievements based on performance data
    const achievements = generateDeveloperAchievements(performance);

    // Generate insights
    const insights = generateDeveloperInsights(performance, allTasks);

    // Get trends from daily history (last 30 days)
    const trends = performance.dailyHistory.slice(0, 30).reverse();

    // Prepare response with comprehensive data
    const responseData = {
      overview: {
        productivityScore: performance.metrics.productivityScore,
        completionRate: performance.metrics.completionRate,
        totalPoints: performance.allTimeStats.totalPointsEarned,
        currentStreak: performance.streak.currentStreak,
        longestStreak: performance.streak.longestStreak,
        onTimeDeliveryRate: performance.metrics.onTimeDeliveryRate,
        averagePointsPerTask: performance.metrics.averagePointsPerTask
      },
      daily: {
        tasksAssigned: performance.dailyStats.tasksAssignedToday,
        tasksCompleted: performance.dailyStats.tasksCompletedToday,
        pointsEarned: performance.dailyStats.pointsEarnedToday,
        extraTasks: performance.dailyStats.extraTasksToday,
        coverageTasks: performance.dailyStats.coverageTasksToday,
        onTimeCompletions: performance.dailyStats.onTimeCompletionsToday
      },
      weekly: {
        tasksAssigned: performance.weeklyStats.tasksAssignedThisWeek,
        tasksCompleted: performance.weeklyStats.tasksCompletedThisWeek,
        pointsEarned: performance.weeklyStats.pointsEarnedThisWeek,
        extraTasks: performance.weeklyStats.extraTasksThisWeek,
        coverageTasks: performance.weeklyStats.coverageTasksThisWeek,
        onTimeCompletions: performance.weeklyStats.onTimeCompletionsThisWeek
      },
      monthly: {
        tasksAssigned: performance.monthlyStats.tasksAssignedThisMonth,
        tasksCompleted: performance.monthlyStats.tasksCompletedThisMonth,
        pointsEarned: performance.monthlyStats.pointsEarnedThisMonth,
        extraTasks: performance.monthlyStats.extraTasksThisMonth,
        coverageTasks: performance.monthlyStats.coverageTasksThisMonth,
        onTimeCompletions: performance.monthlyStats.onTimeCompletionsThisMonth
      },
      achievements,
      insights,
      breakdown: {
        byPriority,
        byStatus,
        bySkill: skillsMap
      },
      trends
    };

    res.status(200).json({
      success: true,
      data: responseData
    });

  } catch (error) {
    console.error('Performance insights error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch performance insights',
      error: process.env.NODE_ENV === 'development' ? error.message : {}
    });
  }
};

// Helper: Sync performance with actual task data
async function syncPerformanceWithTasks(performance, tasks) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const weekStart = new Date(today);
  weekStart.setDate(today.getDate() - today.getDay()); // Start of week (Sunday)

  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);

  // Reset counters
  performance.dailyStats = {
    tasksAssignedToday: 0,
    tasksCompletedToday: 0,
    pointsEarnedToday: 0,
    extraTasksToday: 0,
    coverageTasksToday: 0,
    onTimeCompletionsToday: 0
  };

  performance.weeklyStats = {
    tasksAssignedThisWeek: 0,
    tasksCompletedThisWeek: 0,
    pointsEarnedThisWeek: 0,
    extraTasksThisWeek: 0,
    coverageTasksThisWeek: 0,
    onTimeCompletionsThisWeek: 0
  };

  performance.monthlyStats = {
    tasksAssignedThisMonth: 0,
    tasksCompletedThisMonth: 0,
    pointsEarnedThisMonth: 0,
    extraTasksThisMonth: 0,
    coverageTasksThisMonth: 0,
    onTimeCompletionsThisMonth: 0
  };

  performance.allTimeStats = {
    totalTasksAssigned: tasks.length,
    totalTasksCompleted: 0,
    totalPointsEarned: 0,
    totalExtraTasks: 0,
    totalCoverageTasks: 0,
    totalOnTimeCompletions: 0
  };

  // Calculate expected tasks per day (rough estimate)
  const avgTasksPerDay = 3; // Configurable

  tasks.forEach(task => {
    const taskDate = new Date(task.createdAt);
    taskDate.setHours(0, 0, 0, 0);

    const isToday = taskDate.getTime() === today.getTime();
    const isThisWeek = taskDate >= weekStart;
    const isThisMonth = taskDate >= monthStart;

    // Count assigned tasks
    if (isToday) performance.dailyStats.tasksAssignedToday++;
    if (isThisWeek) performance.weeklyStats.tasksAssignedThisWeek++;
    if (isThisMonth) performance.monthlyStats.tasksAssignedThisMonth++;

    // Process completed tasks
    if (task.status === 'completed') {
      const completedDate = new Date(task.completedAt || task.updatedAt);
      completedDate.setHours(0, 0, 0, 0);

      const completedToday = completedDate.getTime() === today.getTime();
      const completedThisWeek = completedDate >= weekStart;
      const completedThisMonth = completedDate >= monthStart;

      const points = task.points || 0;
      const isCoverage = task.isCoverageTask || false;
      const isOnTime = new Date(task.completedAt || task.updatedAt) <= new Date(task.deadline);

      // Update all-time stats
      performance.allTimeStats.totalTasksCompleted++;
      performance.allTimeStats.totalPointsEarned += points;
      if (isCoverage) performance.allTimeStats.totalCoverageTasks++;
      if (isOnTime) performance.allTimeStats.totalOnTimeCompletions++;

      // Update daily stats
      if (completedToday) {
        performance.dailyStats.tasksCompletedToday++;
        performance.dailyStats.pointsEarnedToday += points;
        if (isCoverage) performance.dailyStats.coverageTasksToday++;
        if (isOnTime) performance.dailyStats.onTimeCompletionsToday++;
      }

      // Update weekly stats
      if (completedThisWeek) {
        performance.weeklyStats.tasksCompletedThisWeek++;
        performance.weeklyStats.pointsEarnedThisWeek += points;
        if (isCoverage) performance.weeklyStats.coverageTasksThisWeek++;
        if (isOnTime) performance.weeklyStats.onTimeCompletionsThisWeek++;
      }

      // Update monthly stats
      if (completedThisMonth) {
        performance.monthlyStats.tasksCompletedThisMonth++;
        performance.monthlyStats.pointsEarnedThisMonth += points;
        if (isCoverage) performance.monthlyStats.coverageTasksThisMonth++;
        if (isOnTime) performance.monthlyStats.onTimeCompletionsThisMonth++;
      }

      // Update streak on most recent completion
      if (performance.allTimeStats.totalTasksCompleted === 1 ||
        !performance.streak.lastActiveDate ||
        completedDate > new Date(performance.streak.lastActiveDate)) {
        performance.updateStreak(completedDate);
      }
    }
  });

  // Calculate extra tasks (tasks completed beyond expected)
  const tasksCompletedToday = performance.dailyStats.tasksCompletedToday;
  const tasksCompletedThisWeek = performance.weeklyStats.tasksCompletedThisWeek;
  const tasksCompletedThisMonth = performance.monthlyStats.tasksCompletedThisMonth;

  performance.dailyStats.extraTasksToday = Math.max(0, tasksCompletedToday - avgTasksPerDay);
  performance.weeklyStats.extraTasksThisWeek = Math.max(0, tasksCompletedThisWeek - (avgTasksPerDay * 7));
  performance.monthlyStats.extraTasksThisMonth = Math.max(0, tasksCompletedThisMonth - (avgTasksPerDay * 30));

  performance.allTimeStats.totalExtraTasks = Math.max(
    0,
    performance.allTimeStats.totalTasksCompleted - (avgTasksPerDay * 30) // Rough estimate
  );

  // Recalculate all metrics
  performance.recalculateMetrics();

  // Add today's entry to daily history
  performance.addDailyHistoryEntry(
    today,
    performance.dailyStats.tasksCompletedToday,
    performance.dailyStats.pointsEarnedToday,
    performance.metrics.productivityScore
  );

  await performance.save();
  return performance;
}

// Helper: Generate achievements based on DeveloperPerformance data
function generateDeveloperAchievements(performance) {
  const achievements = [
    {
      id: 'first_task',
      name: 'First Steps',
      description: 'Complete your first task',
      icon: '🎯',
      earned: performance.allTimeStats.totalTasksCompleted >= 1,
      rarity: 'common'
    },
    {
      id: 'task_master_10',
      name: 'Task Master',
      description: 'Complete 10 tasks',
      icon: '⭐',
      earned: performance.allTimeStats.totalTasksCompleted >= 10,
      rarity: 'common'
    },
    {
      id: 'task_champion_50',
      name: 'Task Champion',
      description: 'Complete 50 tasks',
      icon: '🏆',
      earned: performance.allTimeStats.totalTasksCompleted >= 50,
      rarity: 'rare'
    },
    {
      id: 'task_legend_100',
      name: 'Task Legend',
      description: 'Complete 100 tasks',
      icon: '👑',
      earned: performance.allTimeStats.totalTasksCompleted >= 100,
      rarity: 'epic'
    },
    {
      id: 'week_streak',
      name: 'Week Warrior',
      description: '7-day streak',
      icon: '🔥',
      earned: performance.streak.currentStreak >= 7,
      rarity: 'rare'
    },
    {
      id: 'month_streak',
      name: 'Month Master',
      description: '30-day streak',
      icon: '💪',
      earned: performance.streak.currentStreak >= 30,
      rarity: 'epic'
    },
    {
      id: 'perfect_score',
      name: 'Perfectionist',
      description: '100% productivity score',
      icon: '💯',
      earned: performance.metrics.productivityScore === 100,
      rarity: 'legendary'
    },
    {
      id: 'team_player',
      name: 'Team Player',
      description: 'Complete 5 coverage tasks',
      icon: '🤝',
      earned: performance.allTimeStats.totalCoverageTasks >= 5,
      rarity: 'rare'
    },
    {
      id: 'overachiever',
      name: 'Overachiever',
      description: 'Complete 10 extra tasks',
      icon: '🚀',
      earned: performance.allTimeStats.totalExtraTasks >= 10,
      rarity: 'epic'
    },
    {
      id: 'point_collector',
      name: 'Point Collector',
      description: 'Earn 500 points',
      icon: '💰',
      earned: performance.allTimeStats.totalPointsEarned >= 500,
      rarity: 'rare'
    },
    {
      id: 'consistency_king',
      name: 'Consistency King',
      description: '90%+ on-time delivery',
      icon: '⚡',
      earned: performance.metrics.onTimeDeliveryRate >= 90,
      rarity: 'epic'
    }
  ];

  return achievements;
}

// Helper: Generate insights based on performance
function generateDeveloperInsights(performance, allTasks) {
  const insights = [];

  // Positive insights
  if (performance.metrics.productivityScore >= 90) {
    insights.push({
      type: 'positive',
      icon: '🎉',
      message: 'Outstanding performance! Your productivity score is in the top tier.'
    });
  } else if (performance.metrics.productivityScore >= 75) {
    insights.push({
      type: 'positive',
      icon: '👍',
      message: 'Great work! You\'re maintaining a strong productivity score.'
    });
  }

  if (performance.streak.currentStreak >= 7) {
    insights.push({
      type: 'positive',
      icon: '🔥',
      message: `Impressive ${performance.streak.currentStreak}-day streak! Keep the momentum going.`
    });
  }

  if (performance.allTimeStats.totalCoverageTasks > 0) {
    insights.push({
      type: 'positive',
      icon: '🤝',
      message: `You've helped the team by completing ${performance.allTimeStats.totalCoverageTasks} coverage tasks.`
    });
  }

  if (performance.allTimeStats.totalExtraTasks > 0) {
    insights.push({
      type: 'positive',
      icon: '🚀',
      message: `Overachiever! You've completed ${performance.allTimeStats.totalExtraTasks} extra tasks beyond daily expectations.`
    });
  }

  // Suggestions
  if (performance.metrics.completionRate < 70) {
    insights.push({
      type: 'suggestion',
      icon: '💡',
      message: 'Focus on completing assigned tasks to improve your completion rate.'
    });
  }

  if (performance.metrics.onTimeDeliveryRate < 80) {
    insights.push({
      type: 'suggestion',
      icon: '⏰',
      message: 'Try to complete tasks before their deadlines to boost your on-time delivery rate.'
    });
  }

  if (performance.streak.currentStreak === 0 && performance.allTimeStats.totalTasksCompleted > 0) {
    insights.push({
      type: 'suggestion',
      icon: '🎯',
      message: 'Complete a task today to start a new streak!'
    });
  }

  const pendingTasks = allTasks.filter(t => t.status === 'not-started' && t.priority === 'high');
  if (pendingTasks.length > 0) {
    insights.push({
      type: 'suggestion',
      icon: '⚠️',
      message: `You have ${pendingTasks.length} high-priority pending task${pendingTasks.length > 1 ? 's' : ''}. Consider tackling these first!`
    });
  }

  // Milestone achievements
  const tasksToNextMilestone = 50 - (performance.allTimeStats.totalTasksCompleted % 50);
  if (tasksToNextMilestone <= 5 && tasksToNextMilestone > 0) {
    insights.push({
      type: 'info',
      icon: '🏆',
      message: `Just ${tasksToNextMilestone} more task${tasksToNextMilestone > 1 ? 's' : ''} to unlock a milestone achievement!`
    });
  }

  return insights;
}

// Helper: Calculate streak
function calculateStreakHelper(completedTasks) {
  if (completedTasks.length === 0) {
    return { current: 0, longest: 0 };
  }

  const sorted = completedTasks
    .map(t => new Date(t.updatedAt))
    .sort((a, b) => b - a);

  let currentStreak = 0;
  let longestStreak = 0;
  let tempStreak = 1;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const lastTaskDate = new Date(sorted[0]);
  lastTaskDate.setHours(0, 0, 0, 0);
  const daysDiff = Math.floor((today - lastTaskDate) / (1000 * 60 * 60 * 24));

  if (daysDiff <= 1) {
    currentStreak = 1;

    for (let i = 1; i < sorted.length; i++) {
      const prevDate = new Date(sorted[i - 1]);
      const currDate = new Date(sorted[i]);
      prevDate.setHours(0, 0, 0, 0);
      currDate.setHours(0, 0, 0, 0);

      const diff = Math.floor((prevDate - currDate) / (1000 * 60 * 60 * 24));

      if (diff === 1) {
        currentStreak++;
        tempStreak++;
      } else {
        break;
      }

      longestStreak = Math.max(longestStreak, tempStreak);
    }
  }

  longestStreak = Math.max(longestStreak, currentStreak);
  return { current: currentStreak, longest: longestStreak };
}

// Helper: Calculate productivity score
function calculateProductivityScoreHelper(stats) {
  const completionWeight = 0.4;
  const pointsWeight = 0.3;
  const volumeWeight = 0.3;

  const completionScore = stats.completionRate;
  const pointsScore = Math.min((stats.totalPoints / 100) * 100, 100);
  const volumeScore = Math.min((stats.completedCount / 10) * 100, 100);

  const score = (completionScore * completionWeight) +
    (pointsScore * pointsWeight) +
    (volumeScore * volumeWeight);

  return Math.round(score);
}

// Helper: Generate points over time
function generatePointsOverTimeHelper(completedTasks, days) {
  const result = [];
  const today = new Date();

  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    date.setHours(0, 0, 0, 0);

    const nextDate = new Date(date);
    nextDate.setDate(nextDate.getDate() + 1);

    const dayPoints = completedTasks
      .filter(t => {
        const taskDate = new Date(t.updatedAt);
        return taskDate >= date && taskDate < nextDate;
      })
      .reduce((sum, t) => sum + (t.points || 0), 0);

    result.push({
      date: date.toISOString().split('T')[0],
      points: dayPoints
    });
  }

  return result;
}

// Helper: Generate weekly productivity
function generateWeeklyProductivityHelper(completedTasks) {
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const productivity = days.map(day => ({ day, count: 0 }));

  completedTasks.forEach(task => {
    const dayIndex = new Date(task.updatedAt).getDay();
    productivity[dayIndex].count++;
  });

  return productivity;
}

// Helper: Detect achievements
function detectAchievementsHelper(stats) {
  const earned = [];

  ACHIEVEMENTS.forEach(achievement => {
    let isEarned = false;
    let earnedDate = null;

    switch (achievement.id) {
      case 'first_task':
        isEarned = stats.completedTasks.length >= 1;
        earnedDate = isEarned ? stats.completedTasks[0].updatedAt : null;
        break;
      case 'speed_demon':
        isEarned = stats.completedTasks.some(t => {
          const created = new Date(t.createdAt);
          const completed = new Date(t.updatedAt);
          const hours = (completed - created) / (1000 * 60 * 60);
          return hours < 24;
        });
        break;
      case 'point_master':
        isEarned = stats.totalPoints >= 100;
        break;
      case 'streak_7':
        isEarned = stats.streak >= 7;
        break;
      case 'perfectionist':
        isEarned = stats.completedTasks.length >= 10;
        break;
      case 'high_performer':
        isEarned = stats.completionRate >= 90;
        break;
    }

    earned.push({
      ...achievement,
      earned: isEarned,
      earnedDate: earnedDate || (isEarned ? new Date() : null)
    });
  });

  return earned;
}

// Helper: Generate insights
function generateInsightsHelper(stats) {
  const insights = [];

  // Positive feedback
  if (stats.completionRate >= 80) {
    insights.push({
      type: 'positive',
      message: `Outstanding! Your ${stats.completionRate}% completion rate is excellent!`,
      icon: '🎉'
    });
  }

  if (stats.streak >= 3) {
    insights.push({
      type: 'positive',
      message: `You're on fire! ${stats.streak} day streak! Keep the momentum going!`,
      icon: '🔥'
    });
  }

  if (stats.monthlyPoints > 50) {
    insights.push({
      type: 'positive',
      message: `Great month! You've earned ${stats.monthlyPoints} points in the last 30 days!`,
      icon: '💎'
    });
  }

  // Suggestions
  if (stats.pendingHighPriority > 0) {
    insights.push({
      type: 'suggestion',
      message: `You have ${stats.pendingHighPriority} high-priority task${stats.pendingHighPriority > 1 ? 's' : ''} pending. Consider tackling these first!`,
      icon: '💡'
    });
  }

  if (stats.inProgressCount > 5) {
    insights.push({
      type: 'suggestion',
      message: `You have ${stats.inProgressCount} tasks in progress. Try focusing on completing a few before starting new ones.`,
      icon: '🎯'
    });
  }

  if (stats.completionRate < 50 && stats.completedCount > 0) {
    insights.push({
      type: 'suggestion',
      message: `Your completion rate is ${stats.completionRate}%. Focus on finishing existing tasks to boost your score!`,
      icon: '📈'
    });
  }

  // Motivational
  if (stats.completedCount === 0) {
    insights.push({
      type: 'info',
      message: `Start your journey! Complete your first task to unlock achievements and earn points.`,
      icon: '🚀'
    });
  }

  return insights;
}

// Helper: Calculate average completion time
function calculateAverageCompletionTimeHelper(completedTasks) {
  if (completedTasks.length === 0) return 0;

  const totalHours = completedTasks.reduce((sum, task) => {
    const created = new Date(task.createdAt);
    const completed = new Date(task.updatedAt);
    const hours = (completed - created) / (1000 * 60 * 60);
    return sum + hours;
  }, 0);

  return Math.round(totalHours / completedTasks.length);
}

// @desc    Get performance insights for a specific employee (for managers/HR)
// @route   GET /api/performance/individuals/:id/insights
// @access  Private (Manager, HR, CEO, Co-founder)
const getEmployeeInsights = async (req, res) => {
  try {
    const { id: employeeId } = req.params;
    const DeveloperPerformance = require('../models/DeveloperPerformance');

    // Verify the employee exists
    const employee = await User.findById(employeeId);
    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found'
      });
    }

    // Check if manager is trying to access their team member's data
    if (req.user.role === 'manager' && employee.reportingTo?.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You can only view performance insights for your team members'
      });
    }

    // Get or create performance record
    let performance = await DeveloperPerformance.findOne({ developer: employeeId });

    if (!performance) {
      // Initialize performance record if it doesn't exist
      performance = new DeveloperPerformance({
        developer: employeeId,
        dailyStats: {},
        weeklyStats: {},
        monthlyStats: {},
        allTimeStats: {},
        streak: { currentStreak: 0, longestStreak: 0 },
        metrics: {},
        dailyHistory: []
      });
      await performance.save();
    }

    // Fetch all tasks for this employee
    const allTasks = await Task.find({ assignedTo: employeeId })
      .sort({ createdAt: -1 });

    // Sync performance with current task data
    await syncPerformanceWithTasks(performance, allTasks);

    // Prepare comprehensive response data
    const responseData = {
      overview: {
        productivityScore: performance.metrics.productivityScore,
        completionRate: performance.metrics.completionRate,
        totalPoints: performance.allTimeStats.totalPointsEarned,
        currentStreak: performance.streak.currentStreak,
        longestStreak: performance.streak.longestStreak,
        onTimeDeliveryRate: performance.metrics.onTimeDeliveryRate,
        averagePointsPerTask: performance.metrics.averagePointsPerTask
      },
      metrics: performance.metrics,
      allTime: performance.allTimeStats,
      daily: performance.dailyStats,
      weekly: performance.weeklyStats,
      monthlyStats: performance.monthlyStats,
      streak: performance.streak,
      dailyHistory: performance.dailyHistory.slice(0, 30).reverse(),
      recentTasks: allTasks.slice(0, 10).map(task => ({
        id: task._id,
        title: task.title,
        status: task.status,
        points: task.points,
        completedAt: task.completedAt,
        deadline: task.deadline,
        project: task.project
      }))
    };

    res.status(200).json({
      success: true,
      data: responseData
    });

  } catch (error) {
    console.error('Get employee insights error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch employee performance insights',
      error: process.env.NODE_ENV === 'development' ? error.message : {}
    });
  }
};

module.exports = {
  getIndividualPerformance,
  getIndividualDetailedPerformance,
  getMyInsights,
  getEmployeeInsights
};