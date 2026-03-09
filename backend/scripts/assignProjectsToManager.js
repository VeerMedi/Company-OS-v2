const mongoose = require('mongoose');
require('dotenv').config();

mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/hustle-system')
  .then(async () => {
    const Project = require('../models/Project');
    const User = require('../models/User');
    
    const manager = await User.findOne({ email: 'manager@hustlesystem.com' });
    if (!manager) {
      console.log('❌ Manager not found');
      process.exit(1);
    }
    
    // Update all active projects to this manager
    const result = await Project.updateMany(
      { status: { $nin: ['completed', 'cancelled'] } },
      { assignedManager: manager._id }
    );
    
    console.log('✅ Updated', result.modifiedCount, 'projects');
    console.log('   All active projects now assigned to:', manager.email);
    
    const projects = await Project.find({ assignedManager: manager._id }).select('name status');
    console.log('\n📋 Projects now assigned to manager@hustlesystem.com:');
    projects.forEach(p => console.log(`  - ${p.name} (${p.status})`));
    
    process.exit(0);
  })
  .catch(err => {
    console.error('Error:', err);
    process.exit(1);
  });
