const mongoose = require('mongoose');
const User = require('../models/User');
require('dotenv').config();

const cleanDatabaseFinal = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Define users to keep
    const keepEmails = [
      'ceo@hustlesystem.com',           // CEO
      'cofounder@hustlesystem.com',      // Co-founder
      'manager@hustlesystem.com',        // Manager
      'sourabh.tl@hustle.com',          // Team Lead
      'veer@hustle.com',                // Developer
      'krishna.mehra@hustle.com',       // Developer
      'rahul.nema@hustle.com',          // Intern
      'mohit.sharma@hustle.com'         // Intern
    ];

    console.log('📋 Users to KEEP:');
    console.log('='.repeat(70));
    keepEmails.forEach(email => console.log('  ✓', email));
    console.log('');

    // Get all current users
    const allUsers = await User.find({}).select('email role firstName lastName');
    console.log(`📊 Total users in database: ${allUsers.length}\n`);

    // Find users to delete
    const usersToDelete = allUsers.filter(u => !keepEmails.includes(u.email));
    
    console.log('🗑️  Users to DELETE:');
    console.log('='.repeat(70));
    if (usersToDelete.length === 0) {
      console.log('  (none - database is clean)');
    } else {
      usersToDelete.forEach(u => {
        console.log(`  ❌ ${u.firstName} ${u.lastName} - ${u.email} (${u.role})`);
      });
    }
    console.log('');

    // Delete users not in keep list
    const deleteResult = await User.deleteMany({ 
      email: { $nin: keepEmails } 
    });
    
    console.log(`✅ Deleted ${deleteResult.deletedCount} users\n`);

    // Verify remaining users
    const remainingUsers = await User.find({})
      .select('firstName lastName email role employeeId')
      .sort('role');
    
    console.log('📋 REMAINING USERS:');
    console.log('='.repeat(70));
    remainingUsers.forEach(u => {
      console.log(`${u.role.padEnd(15)} | ${(u.firstName + ' ' + u.lastName).padEnd(25)} | ${u.email.padEnd(35)} | ${u.employeeId || 'N/A'}`);
    });
    console.log('='.repeat(70));
    console.log(`\n✨ Database cleanup complete! ${remainingUsers.length} users remaining.\n`);

  } catch (error) {
    console.error('❌ Error:', error.message);
    throw error;
  } finally {
    await mongoose.disconnect();
  }
};

// Run if called directly
if (require.main === module) {
  cleanDatabaseFinal().then(() => process.exit(0)).catch(err => {
    console.error(err);
    process.exit(1);
  });
}

module.exports = cleanDatabaseFinal;
