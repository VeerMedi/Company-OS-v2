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
    
    console.log('📋 Veer Singh Info:');
    console.log('  Email:', veer.email);
    console.log('  Role:', veer.role);
    console.log('  Expected Dashboard: DeveloperDashboard');
    
    process.exit(0);
  })
  .catch(err => {
    console.error('Error:', err);
    process.exit(1);
  });
