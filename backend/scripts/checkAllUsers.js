const mongoose = require('mongoose');
require('dotenv').config();

mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/hustle-system')
  .then(async () => {
    const User = require('../models/User');
    
    const users = await User.find({ 
      role: { $in: ['individual', 'service-delivery', 'service-onboarding', 'developer', 'intern'] }
    }).select('firstName lastName email role employeeId').sort('firstName');
    
    console.log('📋 All Team Members:');
    console.log('='.repeat(60));
    users.forEach(u => {
      console.log(`${u.firstName} ${u.lastName}`.padEnd(20), 
                  `Role: ${u.role}`.padEnd(30), 
                  `Email: ${u.email}`);
    });
    console.log('='.repeat(60));
    console.log(`Total: ${users.length} users`);
    
    process.exit(0);
  })
  .catch(err => {
    console.error('Error:', err);
    process.exit(1);
  });
