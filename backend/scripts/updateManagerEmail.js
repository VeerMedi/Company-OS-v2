const mongoose = require('mongoose');
require('dotenv').config();

mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/hustle-system')
  .then(async () => {
    const User = require('../models/User');
    const Project = require('../models/Project');
    
    // Find existing manager
    const existingManager = await User.findOne({ role: 'manager' });
    
    if (existingManager) {
      console.log('📋 Current Manager:');
      console.log('  Email:', existingManager.email);
      console.log('  Name:', existingManager.firstName, existingManager.lastName);
      console.log('  ID:', existingManager._id);
      
      // Update email to manager@hustlesystem.com
      existingManager.email = 'manager@hustlesystem.com';
      await existingManager.save();
      
      console.log('\n✅ Updated manager email to: manager@hustlesystem.com');
      console.log('   Password remains the same');
      
      // Count projects assigned to this manager
      const projectCount = await Project.countDocuments({ 
        $or: [
          { assignedManager: existingManager._id },
          { createdBy: existingManager._id }
        ]
      });
      
      console.log(`\n📊 Projects managed: ${projectCount}`);
    } else {
      console.log('❌ No manager found in database');
    }
    
    process.exit(0);
  })
  .catch(err => {
    console.error('Error:', err);
    process.exit(1);
  });
