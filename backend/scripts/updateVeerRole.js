const mongoose = require('mongoose');
require('dotenv').config();

mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/hustle-system')
  .then(async () => {
    const User = require('../models/User');
    
    const veer = await User.findOne({ email: 'veer@hustle.com' });
    if (!veer) {
      console.log('❌ Veer not found');
      process.exit(1);
    }
    
    console.log('📋 Before:');
    console.log('  Role:', veer.role);
    console.log('  Dashboard: IndividualDeveloperDashboard');
    
    // Update to developer role
    veer.role = 'developer';
    await veer.save();
    
    console.log('\n✅ Updated!');
    console.log('  New Role:', veer.role);
    console.log('  New Dashboard: DeveloperDashboard');
    
    process.exit(0);
  })
  .catch(err => {
    console.error('Error:', err);
    process.exit(1);
  });
