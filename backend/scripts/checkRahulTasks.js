const mongoose = require('mongoose');
require('dotenv').config();

mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/hustle-system')
  .then(async () => {
    const User = require('../models/User');
    const Task = require('../models/Task');
    
    const rahul = await User.findOne({ email: 'rahul@hustle.com' });
    if (!rahul) {
      console.log('❌ Rahul not found');
      process.exit(1);
    }
    
    console.log('📋 Rahul Info:');
    console.log('  ID:', rahul._id.toString());
    console.log('  Role:', rahul.role);
    
    const tasks = await Task.find({ assignedTo: rahul._id }).select('title assignedTo status');
    console.log('\n📝 Tasks assigned to Rahul:', tasks.length);
    tasks.forEach(t => {
      console.log('  - Task:', t.title);
      console.log('    AssignedTo ID:', t.assignedTo.toString());
      console.log('    Status:', t.status);
    });
    
    process.exit(0);
  })
  .catch(err => {
    console.error('Error:', err);
    process.exit(1);
  });
