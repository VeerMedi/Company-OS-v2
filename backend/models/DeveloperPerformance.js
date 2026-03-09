const mongoose = require('mongoose');

const developerPerformanceSchema = new mongoose.Schema({
  developer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  
  // Daily Statistics
  dailyStats: {
    tasksAssignedToday: {
      type: Number,
      default: 0
    },
    tasksCompletedToday: {
      type: Number,
      default: 0
    },
    pointsEarnedToday: {
      type: Number,
      default: 0
    },
    extraTasksToday: {
      type: Number,
      default: 0
    },
    coverageTasksToday: {
      type: Number,
      default: 0
    },
    onTimeCompletionsToday: {
      type: Number,
      default: 0
    }
  },

  // Weekly Statistics
  weeklyStats: {
    tasksAssignedThisWeek: {
      type: Number,
      default: 0
    },
    tasksCompletedThisWeek: {
      type: Number,
      default: 0
    },
    pointsEarnedThisWeek: {
      type: Number,
      default: 0
    },
    extraTasksThisWeek: {
      type: Number,
      default: 0
    },
    coverageTasksThisWeek: {
      type: Number,
      default: 0
    },
    onTimeCompletionsThisWeek: {
      type: Number,
      default: 0
    }
  },

  // Monthly Statistics
  monthlyStats: {
    tasksAssignedThisMonth: {
      type: Number,
      default: 0
    },
    tasksCompletedThisMonth: {
      type: Number,
      default: 0
    },
    pointsEarnedThisMonth: {
      type: Number,
      default: 0
    },
    extraTasksThisMonth: {
      type: Number,
      default: 0
    },
    coverageTasksThisMonth: {
      type: Number,
      default: 0
    },
    onTimeCompletionsThisMonth: {
      type: Number,
      default: 0
    }
  },

  // All-Time Statistics
  allTimeStats: {
    totalTasksAssigned: {
      type: Number,
      default: 0
    },
    totalTasksCompleted: {
      type: Number,
      default: 0
    },
    totalPointsEarned: {
      type: Number,
      default: 0
    },
    totalExtraTasks: {
      type: Number,
      default: 0
    },
    totalCoverageTasks: {
      type: Number,
      default: 0
    },
    totalOnTimeCompletions: {
      type: Number,
      default: 0
    }
  },

  // Streak Information
  streak: {
    currentStreak: {
      type: Number,
      default: 0
    },
    longestStreak: {
      type: Number,
      default: 0
    },
    lastActiveDate: {
      type: Date
    },
    streakUpdatedAt: {
      type: Date
    }
  },

  // Performance Metrics (Calculated)
  metrics: {
    productivityScore: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    },
    completionRate: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    },
    averagePointsPerTask: {
      type: Number,
      default: 0
    },
    onTimeDeliveryRate: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    }
  },

  // Historical data for trends (last 30 days)
  dailyHistory: [{
    date: {
      type: Date,
      required: true
    },
    tasksCompleted: {
      type: Number,
      default: 0
    },
    pointsEarned: {
      type: Number,
      default: 0
    },
    productivityScore: {
      type: Number,
      default: 0
    }
  }],

  // Last calculation timestamp
  lastCalculatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Method to calculate productivity score
developerPerformanceSchema.methods.calculateProductivityScore = function() {
  const { allTimeStats } = this;
  
  if (allTimeStats.totalTasksAssigned === 0) {
    return 0;
  }

  // Weights for different components
  const COMPLETION_WEIGHT = 0.40;
  const ON_TIME_WEIGHT = 0.30;
  const EXTRA_TASKS_WEIGHT = 0.20;
  const COVERAGE_WEIGHT = 0.10;

  // 1. Task Completion Rate (0-100)
  const completionRate = (allTimeStats.totalTasksCompleted / allTimeStats.totalTasksAssigned) * 100;

  // 2. On-Time Delivery Rate (0-100)
  const onTimeRate = allTimeStats.totalTasksCompleted > 0
    ? (allTimeStats.totalOnTimeCompletions / allTimeStats.totalTasksCompleted) * 100
    : 0;

  // 3. Extra Tasks Score (0-100, capped at assigned tasks count for fairness)
  const extraTasksRatio = Math.min(
    allTimeStats.totalExtraTasks / Math.max(allTimeStats.totalTasksAssigned, 1),
    1
  );
  const extraTasksScore = extraTasksRatio * 100;

  // 4. Coverage Tasks Score (0-100, capped at assigned tasks count for fairness)
  const coverageTasksRatio = Math.min(
    allTimeStats.totalCoverageTasks / Math.max(allTimeStats.totalTasksAssigned, 1),
    1
  );
  const coverageScore = coverageTasksRatio * 100;

  // Calculate weighted productivity score
  const productivityScore = (
    (completionRate * COMPLETION_WEIGHT) +
    (onTimeRate * ON_TIME_WEIGHT) +
    (extraTasksScore * EXTRA_TASKS_WEIGHT) +
    (coverageScore * COVERAGE_WEIGHT)
  );

  return Math.min(Math.round(productivityScore), 100);
};

// Method to calculate completion rate
developerPerformanceSchema.methods.calculateCompletionRate = function() {
  const { allTimeStats } = this;
  
  if (allTimeStats.totalTasksAssigned === 0) {
    return 0;
  }

  const rate = (allTimeStats.totalTasksCompleted / allTimeStats.totalTasksAssigned) * 100;
  return Math.min(Math.round(rate), 100);
};

// Method to calculate on-time delivery rate
developerPerformanceSchema.methods.calculateOnTimeDeliveryRate = function() {
  const { allTimeStats } = this;
  
  if (allTimeStats.totalTasksCompleted === 0) {
    return 0;
  }

  const rate = (allTimeStats.totalOnTimeCompletions / allTimeStats.totalTasksCompleted) * 100;
  return Math.min(Math.round(rate), 100);
};

// Method to update streak
developerPerformanceSchema.methods.updateStreak = function(completionDate = new Date()) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const completionDay = new Date(completionDate);
  completionDay.setHours(0, 0, 0, 0);

  const lastActive = this.streak.lastActiveDate ? new Date(this.streak.lastActiveDate) : null;
  
  if (lastActive) {
    lastActive.setHours(0, 0, 0, 0);
    
    const daysDiff = Math.floor((completionDay - lastActive) / (1000 * 60 * 60 * 24));
    
    if (daysDiff === 0) {
      // Same day, no change to streak
      return this.streak.currentStreak;
    } else if (daysDiff === 1) {
      // Consecutive day, increment streak
      this.streak.currentStreak += 1;
    } else if (daysDiff > 1) {
      // Streak broken, reset to 1
      this.streak.currentStreak = 1;
    }
  } else {
    // First task completion
    this.streak.currentStreak = 1;
  }

  // Update longest streak if current exceeds it
  if (this.streak.currentStreak > this.streak.longestStreak) {
    this.streak.longestStreak = this.streak.currentStreak;
  }

  this.streak.lastActiveDate = completionDay;
  this.streak.streakUpdatedAt = new Date();

  return this.streak.currentStreak;
};

// Method to add daily history entry
developerPerformanceSchema.methods.addDailyHistoryEntry = function(date, tasksCompleted, pointsEarned, productivityScore) {
  const entryDate = new Date(date);
  entryDate.setHours(0, 0, 0, 0);

  // Check if entry for this date already exists
  const existingIndex = this.dailyHistory.findIndex(entry => {
    const d = new Date(entry.date);
    d.setHours(0, 0, 0, 0);
    return d.getTime() === entryDate.getTime();
  });

  if (existingIndex >= 0) {
    // Update existing entry
    this.dailyHistory[existingIndex].tasksCompleted = tasksCompleted;
    this.dailyHistory[existingIndex].pointsEarned = pointsEarned;
    this.dailyHistory[existingIndex].productivityScore = productivityScore;
  } else {
    // Add new entry
    this.dailyHistory.push({
      date: entryDate,
      tasksCompleted,
      pointsEarned,
      productivityScore
    });
  }

  // Keep only last 90 days
  this.dailyHistory.sort((a, b) => b.date - a.date);
  if (this.dailyHistory.length > 90) {
    this.dailyHistory = this.dailyHistory.slice(0, 90);
  }
};

// Method to recalculate all metrics
developerPerformanceSchema.methods.recalculateMetrics = function() {
  this.metrics.productivityScore = this.calculateProductivityScore();
  this.metrics.completionRate = this.calculateCompletionRate();
  this.metrics.onTimeDeliveryRate = this.calculateOnTimeDeliveryRate();
  
  if (this.allTimeStats.totalTasksCompleted > 0) {
    this.metrics.averagePointsPerTask = Math.round(
      this.allTimeStats.totalPointsEarned / this.allTimeStats.totalTasksCompleted
    );
  }

  this.lastCalculatedAt = new Date();
};

// Index for faster queries
developerPerformanceSchema.index({ developer: 1 });
developerPerformanceSchema.index({ 'metrics.productivityScore': -1 });
developerPerformanceSchema.index({ lastCalculatedAt: 1 });

module.exports = mongoose.model('DeveloperPerformance', developerPerformanceSchema);
