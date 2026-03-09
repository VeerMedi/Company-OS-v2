const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
require('dotenv').config();

const cleanupAndResetUsers = async () => {
  try {
    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Step 1: Remove all users with 'individual' role
    console.log('🧹 STEP 1: Removing old individual employees...\n');
    
    const individualUsers = await User.find({ role: 'individual' }).select('firstName lastName email');
    console.log('Users to be removed:');
    individualUsers.forEach(user => {
      console.log(`  ❌ ${user.firstName} ${user.lastName} (${user.email})`);
    });
    
    const deleteResult = await User.deleteMany({ role: 'individual' });
    console.log(`\n✅ Removed ${deleteResult.deletedCount} individual users\n`);

    // Step 2: Reset passwords for remaining users
    console.log('🔑 STEP 2: Resetting passwords for all remaining users...\n');
    
    const newPassword = 'krishna123';
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    const updateResult = await User.updateMany(
      {}, // All remaining users
      { 
        password: hashedPassword,
        isPasswordChanged: false // They'll need to change password on first login
      }
    );
    
    console.log(`✅ Reset passwords for ${updateResult.modifiedCount} users\n`);

    // Step 3: Display all remaining users with their credentials
    console.log('=' .repeat(80));
    console.log('📋 REMAINING ACTIVE USERS - LOGIN CREDENTIALS');
    console.log('='.repeat(80));
    
    const remainingUsers = await User.find({})
      .select('firstName lastName email role department employeeId')
      .sort({ role: 1, firstName: 1 });
    
    console.log('\n🔐 ALL USERS CAN NOW LOGIN WITH PASSWORD: krishna123\n');
    
    // Group by role
    const usersByRole = remainingUsers.reduce((acc, user) => {
      if (!acc[user.role]) acc[user.role] = [];
      acc[user.role].push(user);
      return acc;
    }, {});
    
    Object.entries(usersByRole).forEach(([role, users]) => {
      console.log(`\n${role.toUpperCase()} (${users.length}):`);
      console.log('-'.repeat(80));
      users.forEach(user => {
        console.log(`  👤 ${user.firstName} ${user.lastName}`.padEnd(30) +
                    `📧 ${user.email}`.padEnd(40) +
                    `🆔 ${user.employeeId || 'N/A'}`);
      });
    });
    
    console.log('\n' + '='.repeat(80));
    console.log(`\n✨ Total Active Users: ${remainingUsers.length}`);
    console.log('\n🚀 Cleanup complete! All users can now login with password: krishna123\n');

  } catch (error) {
    console.error('❌ Error during cleanup:', error.message);
    throw error;
  } finally {
    await mongoose.disconnect();
    console.log('Database connection closed');
    process.exit(0);
  }
};

// Run if called directly
if (require.main === module) {
  cleanupAndResetUsers();
}

module.exports = cleanupAndResetUsers;
