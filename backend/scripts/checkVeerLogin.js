const mongoose = require('mongoose');
const User = require('../models/User');
require('dotenv').config();

const checkVeerLogin = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    const veer = await User.findOne({ email: 'veer@hustle.com' });
    
    if (!veer) {
      console.log('❌ Veer user not found in database');
      process.exit(1);
    }

    console.log('📋 Veer Account Details:');
    console.log('='.repeat(60));
    console.log('Email:', veer.email);
    console.log('Name:', veer.firstName, veer.lastName);
    console.log('Role:', veer.role);
    console.log('Employee ID:', veer.employeeId);
    console.log('Active:', veer.isActive);
    console.log('Password Changed:', veer.isPasswordChanged);
    console.log('');

    // Reset password directly
    console.log('🔧 Resetting password to "krishna123"...');
    veer.password = 'krishna123';
    veer.isPasswordChanged = false;
    veer.isActive = true;
    await veer.save();
    console.log('✅ Password and account status updated!');

    console.log('\n✨ You can now login with:');
    console.log('   Email: veer@hustle.com');
    console.log('   Password: krishna123');
    console.log('');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
};

checkVeerLogin();
