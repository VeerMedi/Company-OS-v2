const mongoose = require('mongoose');
require('dotenv').config();

mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/hustle-system')
  .then(async () => {
    const Project = require('../models/Project');
    
    const projects = await Project.find({}).select('name status assignedManager createdBy').sort('name');
    
    console.log('�� All Projects in Database:');
    console.log('='.repeat(70));
    projects.forEach(p => {
      const statusColor = p.status === 'in-progress' ? '✅' : 
                         p.status === 'completed' ? '🏁' : 
                         p.status === 'cancelled' ? '❌' : 
                         p.status === 'on-hold' ? '⏸️' : '📌';
      console.log(`${statusColor} ${p.name.padEnd(40)} Status: ${p.status}`);
    });
    console.log('='.repeat(70));
    console.log(`\nTotal: ${projects.length} projects`);
    
    const activeProjects = projects.filter(p => 
      p.status !== 'completed' && 
      p.status !== 'cancelled' && 
      p.status !== 'on-hold'
    );
    console.log(`Active (should show in dropdown): ${activeProjects.length} projects`);
    
    process.exit(0);
  })
  .catch(err => {
    console.error('Error:', err);
    process.exit(1);
  });
