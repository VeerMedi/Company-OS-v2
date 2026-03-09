const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('../models/User');
const Task = require('../models/Task');
const Project = require('../models/Project');

dotenv.config();

const checkBobTasks = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/hustle-system');
    console.log('✅ MongoDB connected\n');

    // Find Bob
    const bob = await User.findOne({ email: 'bob.backend@test.com' });
    
    if (!bob) {
      console.log('❌ Bob not found');
      process.exit(1);
    }

    console.log('👤 Bob Backend:');
    console.log(`   Skills: ${bob.skills?.join(', ')}`);
    console.log(`   JobCategory: ${bob.jobCategory}\n`);

    // Find Bob's tasks
    const tasks = await Task.find({ 
      assignedTo: bob._id,
      status: { $nin: ['completed', 'cant-complete'] }
    }).populate('project', 'name');

    console.log(`📋 Bob's Active Tasks: ${tasks.length}\n`);

    tasks.forEach((task, index) => {
      console.log(`${index + 1}. ${task.title}`);
      console.log(`   Project: ${task.project?.name || 'None'}`);
      console.log(`   Required Skills: ${task.requiredSkills?.join(', ') || 'None'}`);
      console.log(`   Task Category: ${task.taskCategory || 'None'}`);
      console.log(`   Deadline: ${task.deadline}`);
      console.log(`   Status: ${task.status}\n`);
    });

    // Find available assignees with matching skills
    const availableAssignees = await User.find({
      _id: { $ne: bob._id },
      isActive: true,
      jobCategory: bob.jobCategory,
      skills: { $in: bob.skills }
    }).select('firstName lastName skills jobCategory');

    console.log(`👥 Available Assignees (matching skills): ${availableAssignees.length}\n`);
    availableAssignees.forEach(assignee => {
      console.log(`   - ${assignee.firstName} ${assignee.lastName}`);
      console.log(`     Skills: ${assignee.skills?.join(', ')}`);
      console.log(`     JobCategory: ${assignee.jobCategory}\n`);
    });

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
};

checkBobTasks();
