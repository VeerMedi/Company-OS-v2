const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const DeveloperPerformance = require('../models/DeveloperPerformance');
const User = require('../models/User');

// Get MongoDB URI
const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI;

if (!mongoUri) {
  console.error('❌ Error: MONGODB_URI or MONGO_URI not found in .env file');
  process.exit(1);
}

// Connect to MongoDB
mongoose.connect(mongoUri, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
  .then(() => console.log('✅ MongoDB connected for performance seeding'))
  .catch((err) => {
    console.error('❌ MongoDB connection error:', err);
    process.exit(1);
  });

// Helper to generate random stats
const generateRandomStats = () => {
  const totalAssigned = Math.floor(Math.random() * 30) + 20; // 20-50 tasks
  const totalCompleted = Math.floor(totalAssigned * (0.6 + Math.random() * 0.3)); // 60-90% completion
  const onTimeCompletions = Math.floor(totalCompleted * (0.5 + Math.random() * 0.4)); // 50-90% on-time
  const extraTasks = Math.floor(Math.random() * 8); // 0-8 extra tasks
  const coverageTasks = Math.floor(Math.random() * 5); // 0-5 coverage tasks
  const pointsPerTask = 3 + Math.floor(Math.random() * 7); // 3-10 points per task
  const totalPoints = totalCompleted * pointsPerTask;

  return {
    totalAssigned,
    totalCompleted,
    onTimeCompletions,
    extraTasks,
    coverageTasks,
    totalPoints
  };
};

async function seedDeveloperPerformance() {
  try {
    console.log('🚀 Starting Developer Performance Data Seeding...\n');
    
    // Find all developers
    const developers = await User.find({
      role: { $in: ['individual', 'service-delivery', 'service-onboarding'] },
      isActive: true
    });
    
    if (developers.length === 0) {
      console.error('❌ No developers found in the database');
      process.exit(1);
    }
    
    console.log(`📊 Found ${developers.length} developers\n`);
    console.log('📝 Creating mock performance records...\n');
    
    let createdCount = 0;
    let updatedCount = 0;
    
    for (const dev of developers) {
      try {
        // Check if performance record already exists
        let perfRecord = await DeveloperPerformance.findOne({ developer: dev._id });
        
        // Generate random but realistic stats
        const stats = generateRandomStats();
        
        // Generate daily stats (last 30 days)
        const dailyHistory = [];
        const now = new Date();
        for (let i = 29; i >= 0; i--) {
          const date = new Date(now);
          date.setDate(date.getDate() - i);
          date.setHours(0, 0, 0, 0);
          
          const tasksCompleted = Math.floor(Math.random() * 4); // 0-3 tasks per day
          const pointsEarned = tasksCompleted * (3 + Math.floor(Math.random() * 7));
          const dayScore = tasksCompleted > 0 ? 50 + Math.floor(Math.random() * 40) : 0;
          
          dailyHistory.push({
            date,
            tasksCompleted,
            pointsEarned,
            productivityScore: dayScore
          });
        }
        
        // Calculate streak
        let currentStreak = 0;
        let longestStreak = 0;
        let tempStreak = 0;
        
        for (let i = dailyHistory.length - 1; i >= 0; i--) {
          if (dailyHistory[i].tasksCompleted > 0) {
            tempStreak++;
            if (i === dailyHistory.length - 1) {
              currentStreak = tempStreak;
            }
            if (tempStreak > longestStreak) {
              longestStreak = tempStreak;
            }
          } else {
            if (i === dailyHistory.length - 1) {
              currentStreak = 0;
            }
            tempStreak = 0;
          }
        }
        
        const performanceData = {
          developer: dev._id,
          
          // Daily stats
          dailyStats: {
            tasksAssignedToday: Math.floor(Math.random() * 3),
            tasksCompletedToday: Math.floor(Math.random() * 2),
            pointsEarnedToday: Math.floor(Math.random() * 15),
            extraTasksToday: Math.random() > 0.7 ? 1 : 0,
            coverageTasksToday: Math.random() > 0.8 ? 1 : 0,
            onTimeCompletionsToday: Math.floor(Math.random() * 2)
          },
          
          // Weekly stats
          weeklyStats: {
            tasksAssignedThisWeek: Math.floor(stats.totalAssigned * 0.15),
            tasksCompletedThisWeek: Math.floor(stats.totalCompleted * 0.15),
            pointsEarnedThisWeek: Math.floor(stats.totalPoints * 0.15),
            extraTasksThisWeek: Math.floor(stats.extraTasks * 0.3),
            coverageTasksThisWeek: Math.floor(stats.coverageTasks * 0.3),
            onTimeCompletionsThisWeek: Math.floor(stats.onTimeCompletions * 0.15)
          },
          
          // Monthly stats
          monthlyStats: {
            tasksAssignedThisMonth: Math.floor(stats.totalAssigned * 0.3),
            tasksCompletedThisMonth: Math.floor(stats.totalCompleted * 0.3),
            pointsEarnedThisMonth: Math.floor(stats.totalPoints * 0.3),
            extraTasksThisMonth: Math.floor(stats.extraTasks * 0.5),
            coverageTasksThisMonth: Math.floor(stats.coverageTasks * 0.5),
            onTimeCompletionsThisMonth: Math.floor(stats.onTimeCompletions * 0.3)
          },
          
          // All-time stats
          allTimeStats: {
            totalTasksAssigned: stats.totalAssigned,
            totalTasksCompleted: stats.totalCompleted,
            totalPointsEarned: stats.totalPoints,
            totalExtraTasks: stats.extraTasks,
            totalCoverageTasks: stats.coverageTasks,
            totalOnTimeCompletions: stats.onTimeCompletions
          },
          
          // Streak
          streak: {
            currentStreak,
            longestStreak,
            lastActiveDate: dailyHistory[dailyHistory.length - 1].date,
            streakUpdatedAt: new Date()
          },
          
          // Daily history
          dailyHistory,
          
          lastCalculatedAt: new Date()
        };
        
        if (perfRecord) {
          // Update existing record
          Object.assign(perfRecord, performanceData);
          perfRecord.recalculateMetrics();
          await perfRecord.save();
          
          console.log(`✅ Updated: ${dev.firstName} ${dev.lastName}`);
          updatedCount++;
        } else {
          // Create new record
          perfRecord = new DeveloperPerformance(performanceData);
          perfRecord.recalculateMetrics();
          await perfRecord.save();
          
          console.log(`✅ Created: ${dev.firstName} ${dev.lastName}`);
          createdCount++;
        }
        
        console.log(`   📊 ${stats.totalCompleted}/${stats.totalAssigned} tasks | Score: ${perfRecord.metrics.productivityScore}% | Streak: ${currentStreak}🔥\n`);
        
      } catch (error) {
        console.error(`❌ Error for ${dev.firstName} ${dev.lastName}:`, error.message);
      }
    }
    
    console.log('\n✨ Seeding Complete!\n');
    console.log(`📊 Created: ${createdCount} | Updated: ${updatedCount}\n`);
    console.log('💡 View in: Manager Dashboard → Performance Tracking → View Detailed Performance\n');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

seedDeveloperPerformance();
