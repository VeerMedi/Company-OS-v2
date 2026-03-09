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
    
    console.log('📋 Manager:', manager.email, '(ID:', manager._id.toString(), ')');
    console.log('\n📊 All Active Projects:');
    console.log('='.repeat(80));
    
    const projects = await Project.find({
      status: { $nin: ['completed', 'cancelled', 'on-hold'] }
    }).populate('assignedManager', 'email firstName lastName');
    
    projects.forEach(p => {
      const managerInfo = p.assignedManager 
        ? `${p.assignedManager.email} (${p.assignedManager._id})`
        : 'NONE';
      const isManagersProject = p.assignedManager && p.assignedManager._id.toString() === manager._id.toString() ? '✅' : '❌';
      console.log(`${isManagersProject} ${p.name.padEnd(45)} Manager: ${managerInfo}`);
    });
    
    console.log('='.repeat(80));
    
    const managersProjects = projects.filter(p => 
      p.assignedManager && p.assignedManager._id.toString() === manager._id.toString()
    );
    console.log(`\n${managersProjects.length} projects assigned to manager@hustlesystem.com`);
    
    process.exit(0);
  })
  .catch(err => {
    console.error('Error:', err);
    process.exit(1);
  });
