const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('../models/User');

dotenv.config();

const updateBobBackend = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/hustle-system');
    console.log('✅ MongoDB connected\n');

    // Find Bob Backend
    const bob = await User.findOne({ 
      $or: [
        { firstName: 'Bob', lastName: 'Backend' },
        { email: { $regex: /bob.*backend/i } }
      ]
    });

    if (!bob) {
      console.log('❌ Bob Backend not found');
      
      // List all users to help find Bob
      const users = await User.find({}).select('firstName lastName email skills jobCategory');
      console.log('\n📋 All users:');
      users.forEach(u => {
        console.log(`   - ${u.firstName} ${u.lastName} (${u.email})`);
        console.log(`     Skills: ${u.skills?.join(', ') || 'None'}`);
        console.log(`     JobCategory: ${u.jobCategory || 'None'}`);
      });
      
      process.exit(1);
    }

    console.log('📊 Current State:');
    console.log(`   Name: ${bob.firstName} ${bob.lastName}`);
    console.log(`   Email: ${bob.email}`);
    console.log(`   Role: ${bob.role}`);
    console.log(`   Skills: ${bob.skills?.join(', ') || 'None'}`);
    console.log(`   JobCategory: ${bob.jobCategory || 'None'}`);

    // Update with backend developer skills
    if (!bob.skills || bob.skills.length === 0) {
      bob.skills = ['Node.js', 'MongoDB', 'Express', 'APIs', 'Backend'];
      bob.jobCategory = 'developer';
      await bob.save();

      console.log('\n✅ Updated Bob Backend:');
      console.log(`   Skills: ${bob.skills.join(', ')}`);
      console.log(`   JobCategory: ${bob.jobCategory}`);
    } else {
      console.log('\n✅ Bob already has skills configured');
    }

    console.log('\n🎉 Update complete!\n');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
};

updateBobBackend();
