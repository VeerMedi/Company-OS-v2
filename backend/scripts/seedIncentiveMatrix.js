const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const IncentiveMatrix = require('../models/IncentiveMatrix');
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
  .then(() => console.log('✅ MongoDB connected for seeding'))
  .catch((err) => {
    console.error('❌ MongoDB connection error:', err);
    process.exit(1);
  });

// Default incentive tiers
const defaultTiers = [
  {
    tier: 'Bronze',
    displayOrder: 1,
    emoji: '🥉',
    minProductivityScore: 0,
    maxProductivityScore: 50,
    minPoints: 0,
    maxPoints: 100,
    incentiveAmount: 500,
    incentiveType: 'fixed',
    description: 'Entry level tier for productivity scores 0-50% or up to 100 points'
  },
  {
    tier: 'Silver',
    displayOrder: 2,
    emoji: '🥈',
    minProductivityScore: 51,
    maxProductivityScore: 65,
    minPoints: 101,
    maxPoints: 200,
    incentiveAmount: 1000,
    incentiveType: 'fixed',
    description: 'Intermediate tier for productivity scores 51-65% or 101-200 points'
  },
  {
    tier: 'Gold',
    displayOrder: 3,
    emoji: '🥇',
    minProductivityScore: 66,
    maxProductivityScore: 80,
    minPoints: 201,
    maxPoints: 350,
    incentiveAmount: 2000,
    incentiveType: 'fixed',
    description: 'Proficient tier for productivity scores 66-80% or 201-350 points'
  },
  {
    tier: 'Platinum',
    displayOrder: 4,
    emoji: '💎',
    minProductivityScore: 81,
    maxProductivityScore: 90,
    minPoints: 351,
    maxPoints: 500,
    incentiveAmount: 3000,
    incentiveType: 'fixed',
    description: 'Expert tier for productivity scores 81-90% or 351-500 points'
  },
  {
    tier: 'Diamond',
    displayOrder: 5,
    emoji: '🌟',
    minProductivityScore: 91,
    maxProductivityScore: 100,
    minPoints: 501,
    maxPoints: null, // Unlimited
    incentiveAmount: 5000,
    incentiveType: 'fixed',
    description: 'Elite tier for exceptional performance - 91-100% or 501+ points'
  }
];

async function seedIncentiveMatrix() {
  try {
    console.log('🚀 Starting Incentive Matrix Seeding...\n');
    
    // Find an HR user to set as creator
    let hrUser = await User.findOne({ role: 'hr' });
    
    if (!hrUser) {
      // Try CEO or co-founder
      hrUser = await User.findOne({ role: { $in: ['ceo', 'co-founder'] } });
    }
    
    if (!hrUser) {
      console.error('❌ No HR, CEO, or Co-founder user found. Cannot seed incentive matrix.');
      console.log('💡 Please create an HR user first, then run this script again.');
      process.exit(1);
    }
    
    console.log(`✅ Using ${hrUser.firstName} ${hrUser.lastName} (${hrUser.role}) as creator\n`);
    
    // Check if tiers already exist
    const existingTiersCount = await IncentiveMatrix.countDocuments();
    
    if (existingTiersCount > 0) {
      console.log(`⚠️  ${existingTiersCount} incentive tiers already exist in the database`);
      console.log('  To re-seed, please delete existing tiers first.\n');
      
      // Show existing tiers
      const existingTiers = await IncentiveMatrix.find().sort({ displayOrder: 1 });
      console.log('📊 Existing Tiers:');
      existingTiers.forEach(tier => {
        console.log(`  ${tier.emoji} ${tier.tier}: ${tier.scoreRange}, ${tier.pointsRange} → ₹${tier.incentiveAmount}`);
      });
      
      process.exit(0);
    }
    
    // Create tiers
    console.log('📝 Creating default incentive tiers...\n');
    
    for (const tierData of defaultTiers) {
      const tier = await IncentiveMatrix.create({
        ...tierData,
        createdBy: hrUser._id
      });
      
      console.log(`✅ Created: ${tier.emoji} ${tier.tier}`);
      console.log(`   Score Range: ${tier.scoreRange}`);
      console.log(`   Points Range: ${tier.pointsRange}`);
      console.log(`   Incentive: ₹${tier.incentiveAmount}`);
      console.log(`   Description: ${tier.description}\n`);
    }
    
    console.log('✅ Incentive Matrix Seeding Completed Successfully!\n');
    
    // Show summary
    const totalTiers = await IncentiveMatrix.countDocuments();
    const totalIncentivePotential = defaultTiers.reduce((sum, t) => sum + t.incentiveAmount, 0);
    
    console.log('📊 Summary:');
    console.log(`  Total Tiers Created: ${totalTiers}`);
    console.log(`  Minimum Incentive: ₹${Math.min(...defaultTiers.map(t => t.incentiveAmount))}`);
    console.log(`  Maximum Incentive: ₹${Math.max(...defaultTiers.map(t => t.incentiveAmount))}`);
    console.log(`  Average Incentive: ₹${Math.round(totalIncentivePotential / totalTiers)}\n`);
    
    console.log('💡 TIP: HR users can now edit these tiers via the Incentive Matrix Manager');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding incentive matrix:', error);
    process.exit(1);
  }
}

// Run seeding
seedIncentiveMatrix();
