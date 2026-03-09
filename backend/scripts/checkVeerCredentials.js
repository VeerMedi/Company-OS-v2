const mongoose = require('mongoose');
require('dotenv').config();

mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/hustle-system')
  .then(async () => {
    const User = require('../models/User');
    
    const veer = await User.findOne({ email: 'veer@hustle.com' }).select('+originalPassword +password');
    if (!veer) {
      console.log('❌ Veer not found');
      process.exit(1);
    }
    
    console.log('📋 Veer Credentials:');
    console.log('  Email:', veer.email);
    console.log('  Role:', veer.role);
    console.log('  Original Password:', veer.originalPassword || 'NOT SET');
    console.log('  Active:', veer.isActive);
    console.log('\n🔑 Login with:');
    console.log('  Email: veer@hustle.com');
    console.log('  Password:', veer.originalPassword || 'krishna123 or 123456');
    
    process.exit(0);
  })
  .catch(err => {
    console.error('Error:', err);
    process.exit(1);
  });
