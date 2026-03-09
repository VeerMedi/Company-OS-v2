const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const Payroll = require('../models/Payroll');
const User = require('../models/User');
const IncentiveMatrix = require('../models/IncentiveMatrix');
const DeveloperPerformance = require('../models/DeveloperPerformance');

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
  .then(() => console.log('✅ MongoDB connected for payroll seeding'))
  .catch((err) => {
    console.error('❌ MongoDB connection error:', err);
    process.exit(1);
  });

async function seedMockPayroll() {
  try {
    console.log('🚀 Starting Mock Payroll Data Seeding...\n');
    
    // Find HR user to set as creator
    let hrUser = await User.findOne({ role: 'hr' });
    
    if (!hrUser) {
      hrUser = await User.findOne({ role: { $in: ['ceo', 'co-founder'] } });
    }
    
    if (!hrUser) {
      console.error('❌ No HR, CEO, or Co-founder user found.');
      process.exit(1);
    }
    
    console.log(`✅ Using ${hrUser.firstName} ${hrUser.lastName} as creator\n`);
    
    // Find all developers
    const developers = await User.find({
      role: { $in: ['individual', 'service-delivery', 'service-onboarding'] },
      isActive: true
    }).limit(10);
    
    if (developers.length === 0) {
      console.error('❌ No developers found in the database');
      process.exit(1);
    }
    
    console.log(`📊 Found ${developers.length} developers\n`);
    
    // Get current month
    const now = new Date();
    const currentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    
    // Get incentive tiers
    const tiers = await IncentiveMatrix.find({ isActive: true }).sort({ displayOrder: 1 });
    
    console.log('📝 Creating mock payroll records with incentives...\n');
    
    let createdCount = 0;
    
    for (const dev of developers) {
      try {
        // Check if payroll already exists for this month
        const existingPayroll = await Payroll.findOne({
          employeeId: dev._id,
          salaryMonth: currentMonth
        });
        
        if (existingPayroll) {
          console.log(`⚠️  Payroll already exists for ${dev.firstName} ${dev.lastName}`);
          continue;
        }
        
        // Generate random performance data
        const productivityScore = Math.floor(Math.random() * 50) + 50; // 50-100%
        const totalPoints = Math.floor(Math.random() * 400) + 100; // 100-500 points
        const presentDays = Math.floor(Math.random() * 3) + 20; // 20-22 days
        
        // Find matching incentive tier
        let matchedTier = null;
        for (const tier of tiers.reverse()) { // Check from highest to lowest
          const scoreMatch = productivityScore >= tier.minProductivityScore && 
                           productivityScore <= tier.maxProductivityScore;
          const pointsMatch = totalPoints >= tier.minPoints && 
                            (!tier.maxPoints || totalPoints <= tier.maxPoints);
          
          if (scoreMatch || pointsMatch) {
            matchedTier = tier;
            break;
          }
        }
        
        // Calculate incentive
        const incentiveAmount = matchedTier ? matchedTier.incentiveAmount : 0;
        const incentiveDetails = matchedTier ? {
          tier: matchedTier.tier,
          tierEmoji: matchedTier.emoji,
          productivityScore,
          totalPoints,
          incentiveAmount,
          criteriaUsed: 'both',
          matchedBy: `Qualified by productivity score (${productivityScore}%) and points (${totalPoints})`,
          calculatedAt: new Date()
        } : {
          tier: null,
          tierEmoji: null,
          productivityScore,
          totalPoints,
          incentiveAmount: 0,
          criteriaUsed: 'none',
          matchedBy: 'No tier matched',
          calculatedAt: new Date()
        };
        
        // Calculate salary components
        const basicSalary = 10000;
        const perDaySalary = basicSalary / 22;
        const leaveDays = 22 - presentDays;
        const leaveDeduction = Math.round(leaveDays * perDaySalary);
        const adjustedBasicSalary = basicSalary - leaveDeduction;
        
        // Allowances
        const hra = Math.round(adjustedBasicSalary * 0.30);
        const transport = presentDays >= 20 ? 2000 : Math.round(2000 * (presentDays / 22));
        const medical = presentDays >= 20 ? 1500 : Math.round(1500 * (presentDays / 22));
        const performance = incentiveAmount; // Incentive goes here
        
        // Deductions
        const pf = Math.round(adjustedBasicSalary * 0.12);
        const insurance = 500;
        const tax = adjustedBasicSalary * 12 > 250000 ? Math.round((adjustedBasicSalary * 12 - 250000) * 0.05 / 12) : 0;
        
        // Totals
        const grossSalary = adjustedBasicSalary + hra + transport + medical + performance;
        const totalDeductions = pf + insurance + tax;
        const netSalary = grossSalary - totalDeductions;
        
        // Create payroll
        const payroll = await Payroll.create({
          employeeId: dev._id,
          employeeCode: dev.employeeId || `EMP${String(Math.floor(Math.random() * 1000)).padStart(3, '0')}`,
          salaryMonth: currentMonth,
          basicSalary: adjustedBasicSalary,
          allowances: {
            hra,
            transport,
            medical,
            performance,
            other: 0
          },
          deductions: {
            tax,
            providentFund: pf,
            insurance,
            loan: 0,
            other: 0
          },
          bonus: 0,
          overtime: {
            hours: 0,
            rate: 200,
            amount: 0
          },
          workingDays: {
            total: 22,
            present: presentDays,
            absent: 0,
            leave: leaveDays
          },
          grossSalary,
          totalDeductions,
          netSalary,
          paymentStatus: Math.random() > 0.3 ? 'pending' : 'paid',
          paymentDate: Math.random() > 0.3 ? null : new Date(),
          paymentMethod: 'bank-transfer',
          bankDetails: {
            accountNumber: dev.bankDetails?.accountNumber || '',
            ifscCode: dev.bankDetails?.ifscCode || '',
            bankName: dev.bankDetails?.bankName || '',
            transactionId: Math.random() > 0.3 ? '' : `TXN${Date.now()}${Math.floor(Math.random() * 1000)}`
          },
          incentiveDetails,
          remarks: `Auto-generated mock payroll for ${presentDays}/${22} days present`,
          createdBy: hrUser._id,
          isActive: true
        });
        
        console.log(`✅ Created payroll for: ${dev.firstName} ${dev.lastName}`);
        console.log(`   📊 Performance: ${productivityScore}% score, ${totalPoints} points`);
        console.log(`   ${matchedTier ? matchedTier.emoji : '❌'} Tier: ${matchedTier ? matchedTier.tier : 'None'} → ₹${incentiveAmount} incentive`);
        console.log(`   💰 Net Salary: ₹${netSalary.toLocaleString()} (${presentDays}/22 days)`);
        console.log(`   📅 Status: ${payroll.paymentStatus}\n`);
        
        createdCount++;
      } catch (error) {
        console.error(`❌ Error creating payroll for ${dev.firstName} ${dev.lastName}:`, error.message);
      }
    }
    
    console.log('✨ Mock Payroll Seeding Completed!\n');
    
    // Summary
    const totalPayrolls = await Payroll.countDocuments({ salaryMonth: currentMonth });
    const paidCount = await Payroll.countDocuments({ salaryMonth: currentMonth, paymentStatus: 'paid' });
    const pendingCount = await Payroll.countDocuments({ salaryMonth: currentMonth, paymentStatus: 'pending' });
    
    const totalNetSalary = await Payroll.aggregate([
      { $match: { salaryMonth: currentMonth } },
      { $group: { _id: null, total: { $sum: '$netSalary' } } }
    ]);
    
    const totalIncentives = await Payroll.aggregate([
      { $match: { salaryMonth: currentMonth } },
      { $group: { _id: null, total: { $sum: '$incentiveDetails.incentiveAmount' } } }
    ]);
    
    console.log('📊 Summary:');
    console.log(`  Total Payroll Records: ${totalPayrolls}`);
    console.log(`  Paid: ${paidCount}`);
    console.log(`  Pending: ${pendingCount}`);
    console.log(`  Total Net Salary: ₹${(totalNetSalary[0]?.total || 0).toLocaleString()}`);
    console.log(`  Total Incentives: ₹${(totalIncentives[0]?.total || 0).toLocaleString()}\n`);
    
    console.log('💡 TIP: View payroll in HR Dashboard → Payroll tab');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding mock payroll:', error);
    process.exit(1);
  }
}

// Run seeding
seedMockPayroll();
