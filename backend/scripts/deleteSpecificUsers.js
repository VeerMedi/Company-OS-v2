require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');

const deleteSpecificUsers = async () => {
  try {
    console.log('Connecting to database...');
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('Connected to MongoDB');

    console.log('\n🗑️  Deleting specific user accounts...\n');

    // List of emails to delete
    const emailsToDelete = [
      'aayushitrivedi220891@acropolis.in'
    ];

    // Delete users
    const result = await User.deleteMany({ 
      email: { $in: emailsToDelete } 
    });

    console.log(`✅ Deleted ${result.deletedCount} user accounts`);
    
    // Show deleted emails
    console.log('\nDeleted accounts:');
    emailsToDelete.forEach(email => {
      console.log(`  ❌ ${email}`);
    });

    // Show remaining users
    const remainingUsers = await User.find({}, 'name email role').sort({ role: 1, name: 1 });
    
    console.log(`\n👥 Remaining users: ${remainingUsers.length} accounts`);
    console.log('\nAvailable login accounts:');
    console.log('─'.repeat(60));
    remainingUsers.forEach(user => {
      console.log(`📧 ${user.email.padEnd(30)} | ${user.role.padEnd(15)} | ${user.name || 'undefined'}`);
    });
    console.log('─'.repeat(60));

    console.log('\n✨ User deletion completed successfully!\n');

  } catch (error) {
    console.error('❌ Error deleting users:', error);
  } finally {
    await mongoose.connection.close();
    console.log('Database connection closed');
    process.exit(0);
  }
};

deleteSpecificUsers();
