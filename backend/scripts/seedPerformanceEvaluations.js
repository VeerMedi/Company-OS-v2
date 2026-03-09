const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const PerformanceEvaluation = require('../models/PerformanceEvaluation');
const PerformanceMetricsService = require('../services/PerformanceMetricsService');
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
  .then(() => console.log('✅ MongoDB connected for performance evaluation seeding'))
  .catch((err) => {
    console.error('❌ MongoDB connection error:', err);
    process.exit(1);
  });

async function seedPerformanceEvaluations() {
  try {
    console.log('🚀 Starting Performance Evaluation Data Seeding...\n');
    
    // Find manager to set as creator
    let manager = await User.findOne({ role: 'manager' });
    
    if (!manager) {
      manager = await User.findOne({ role: { $in: ['ceo', 'co-founder'] } });
    }
    
    if (!manager) {
      console.error('❌ No manager, CEO, or Co-founder user found.');
      process.exit(1);
    }
    
    console.log(`✅ Using ${manager.firstName} ${manager.lastName} as creator\n`);
    
    // Find all developers/employees
    const employees = await User.find({
      role: { $in: ['individual', 'service-delivery', 'service-onboarding'] },
      isActive: true
    }).limit(12);
    
    if (employees.length === 0) {
      console.error('❌ No employees/developers found in the database');
      process.exit(1);
    }
    
    console.log(`📊 Found ${employees.length} employees\n`);
    
    // Get current month and previous months
    const now = new Date();
    const evaluationPeriods = [
      {
        name: 'Current Month',
        startDate: new Date(now.getFullYear(), now.getMonth(), 1),
        endDate: new Date(now.getFullYear(), now.getMonth() + 1, 0)
      },
      {
        name: 'Last Month',
        startDate: new Date(now.getFullYear(), now.getMonth() - 1, 1),
        endDate: new Date(now.getFullYear(), now.getMonth(), 0)
      },
      {
        name: '2 Months Ago',
        startDate: new Date(now.getFullYear(), now.getMonth() - 2, 1),
        endDate: new Date(now.getFullYear(), now.getMonth() - 1, 0)
      }
    ];
    
    console.log('📝 Creating performance evaluations...\n');
    
    let createdCount = 0;
    const statuses = ['draft', 'edited', 'approved', 'sent_to_hr'];
    
    for (const employee of employees) {
      // Create 1-3 evaluations per employee (different periods, different statuses)
      const numEvaluations = Math.floor(Math.random() * 2) + 1; // 1-2 evaluations
      
      for (let i = 0; i < numEvaluations; i++) {
        const period = evaluationPeriods[i % evaluationPeriods.length];
        
        try {
          // Check if evaluation already exists
          const existingEval = await PerformanceEvaluation.findOne({
            employee: employee._id,
            'evaluationPeriod.startDate': period.startDate,
            'evaluationPeriod.endDate': period.endDate,
            isActive: true
          });
          
          if (existingEval) {
            console.log(`⚠️  Evaluation already exists for ${employee.firstName} ${employee.lastName} (${period.name})`);
            continue;
          }
          
          // Auto-populate metrics using the service
          const metrics = await PerformanceMetricsService.autoPopulateMetrics(
            employee._id,
            period.startDate,
            period.endDate
          );
          
          // Add some manual adjustments for realism
          metrics.taskQuality.score = Math.min(100, metrics.taskQuality.score + Math.floor(Math.random() * 10) - 5);
          metrics.collaboration.score = Math.min(100, Math.floor(Math.random() * 30) + 60); // 60-90
          metrics.initiative.score = Math.min(100, Math.floor(Math.random() * 40) + 40); // 40-80
          
          // Randomly add bonuses or penalties
          if (Math.random() > 0.7) {
            metrics.bonuses.push({
              reason: 'Critical project delivery',
              amount: Math.floor(Math.random() * 2000) + 500,
              addedBy: manager._id,
              addedAt: new Date()
            });
          }
          
          if (Math.random() > 0.85) {
            metrics.penalties.push({
              reason: 'Late delivery',
              amount: Math.floor(Math.random() * 500) + 100,
              addedBy: manager._id,
              addedAt: new Date()
            });
          }
          
          // Determine status (more recent = more likely to be in progress)
          let status;
          if (i === 0) {
            // Current/recent evaluation - varies
            status = statuses[Math.floor(Math.random() * statuses.length)];
          } else {
            // Older evaluations - more likely approved/sent_to_hr
            status = Math.random() > 0.3 ? 'approved' : 'sent_to_hr';
          }
          
          // Create evaluation
          const evaluation = await PerformanceEvaluation.create({
            employee: employee._id,
            evaluationPeriod: {
              startDate: period.startDate,
              endDate: period.endDate
            },
            metrics,
            status,
            createdBy: manager._id
          });
          
          // If approved or sent_to_hr, add manager approval
          if (['approved', 'sent_to_hr'].includes(status)) {
            evaluation.managerApproval = {
              approvedBy: manager._id,
              approvedAt: new Date(period.endDate.getTime() + 2 * 24 * 60 * 60 * 1000), // 2 days after period ends
              comments: `Good performance this period. ${evaluation.derivedFields.grade} grade earned.`
            };
            await evaluation.save();
          }
          
          const gradeEmoji = {
            'A': '🏆',
            'B': '🥇',
            'C': '🥈',
            'D': '🥉',
            'F': '📊'
          };
          
          console.log(`✅ Created evaluation for: ${employee.firstName} ${employee.lastName} (${period.name})`);
          console.log(`   📊 Score: ${evaluation.derivedFields.totalScore} | Grade: ${gradeEmoji[evaluation.derivedFields.grade]} ${evaluation.derivedFields.grade} | Multiplier: ${evaluation.derivedFields.payrollMultiplier}x`);
          console.log(`   📈 Metrics: Task=${metrics.taskCompletion.score}, Quality=${metrics.taskQuality.score}, Attendance=${metrics.attendance.score}`);
          console.log(`   📅 Status: ${status}\n`);
          
          createdCount++;
        } catch (error) {
          console.error(`❌ Error creating evaluation for ${employee.firstName} ${employee.lastName}:`, error.message);
        }
      }
    }
    
    console.log('✨ Performance Evaluation Seeding Completed!\n');
    
    // Summary
    const totalEvaluations = await PerformanceEvaluation.countDocuments({ isActive: true });
    const byStatus = await PerformanceEvaluation.aggregate([
      { $match: { isActive: true } },
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);
    
    const byGrade = await PerformanceEvaluation.aggregate([
      { $match: { isActive: true } },
      { $group: { _id: '$derivedFields.grade', count: { $sum: 1 } } },
      { $sort: { _id: 1 } }
    ]);
    
    console.log('📊 Summary:');
    console.log(`  Total Evaluations: ${totalEvaluations}`);
    console.log(`  Created This Run: ${createdCount}`);
    console.log(`\n  By Status:`);
    byStatus.forEach(s => console.log(`    ${s._id}: ${s.count}`));
    console.log(`\n  By Grade:`);
    byGrade.forEach(g => console.log(`    ${g._id}: ${g.count}`));
    
    console.log('\n💡 TIP: View evaluations in Manager Dashboard → Team Reports → Performance Matrix tab');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding performance evaluations:', error);
    process.exit(1);
  }
}

// Run seeding
seedPerformanceEvaluations();
