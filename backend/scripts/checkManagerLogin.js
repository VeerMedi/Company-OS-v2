const mongoose = require('mongoose');
const User = require('../models/User');
require('dotenv').config();

const checkManagerLogin = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    const manager = await User.findOne({ email: 'manager@hustlesystem.com' });
    
    if (!manager) {
      console.log('❌ Manager user not found in database');
      process.exit(1);
    }

    console.log('📋 Manager Account Details:');
    console.log('='.repeat(60));
    console.log('Email:', manager.email);
    console.log('Name:', manager.firstName, manager.lastName);
    console.log('Role:', manager.role);
    console.log('Employee ID:', manager.employeeId);
    console.log('Active:', manager.isActive);
    console.log('');

    // Reset password directly
    console.log('🔧 Resetting password to "krishna123"...');
    manager.password = 'krishna123';
    manager.isPasswordChanged = false;
    await manager.save();
    console.log('✅ Password reset successfully!');

    console.log('\n✨ You can now login with:');
    console.log('   Email: manager@hustlesystem.com');
    console.log('   Password: krishna123');
    console.log('');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
};

checkManagerLogin();
