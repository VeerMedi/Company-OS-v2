require('dotenv').config();
const mongoose = require('mongoose');

// Import all models
const Attendance = require('../models/Attendance');
const Checkpoint = require('../models/Checkpoint');
const Company = require('../models/Company');
const Lead = require('../models/Lead');
const { Leave } = require('../models/Leave'); // Destructure Leave from export
const Payroll = require('../models/Payroll');
const Project = require('../models/Project');
const RevenueTarget = require('../models/RevenueTarget');
const Sale = require('../models/Sale');
const SalesTarget = require('../models/SalesTarget');
const Task = require('../models/Task');
// User model is intentionally excluded - we want to keep user data

const clearDatabase = async () => {
  try {
    console.log('Connecting to database...');
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('Connected to MongoDB');

    console.log('\n🧹 Starting database cleanup (keeping Users)...\n');

    // Clear all collections except Users
    const collections = [
      { name: 'Attendance', model: Attendance },
      { name: 'Checkpoints', model: Checkpoint },
      { name: 'Companies', model: Company },
      { name: 'Leads', model: Lead },
      { name: 'Leaves', model: Leave },
      { name: 'Payrolls', model: Payroll },
      { name: 'Projects', model: Project },
      { name: 'RevenueTargets', model: RevenueTarget },
      { name: 'Sales', model: Sale },
      { name: 'SalesTargets', model: SalesTarget },
      { name: 'Tasks', model: Task },
    ];

    for (const collection of collections) {
      const count = await collection.model.countDocuments();
      await collection.model.deleteMany({});
      console.log(`✅ Cleared ${collection.name}: ${count} documents deleted`);
    }

    // Show remaining users
    const User = require('../models/User');
    const userCount = await User.countDocuments();
    const users = await User.find({}, 'name email role').sort({ role: 1, name: 1 });
    
    console.log(`\n👥 Users preserved: ${userCount} accounts`);
    console.log('\nAvailable login accounts:');
    console.log('─'.repeat(60));
    users.forEach(user => {
      console.log(`📧 ${user.email.padEnd(30)} | ${user.role.padEnd(15)} | ${user.name}`);
    });
    console.log('─'.repeat(60));

    console.log('\n✨ Database cleared successfully! All user accounts are intact.\n');

  } catch (error) {
    console.error('❌ Error clearing database:', error);
  } finally {
    await mongoose.connection.close();
    console.log('Database connection closed');
    process.exit(0);
  }
};

clearDatabase();
