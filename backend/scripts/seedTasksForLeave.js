const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Task = require('../models/Task');
const User = require('../models/User');
const Project = require('../models/Project');

// Load environment variables
dotenv.config();

// Connect to MongoDB and wait for connection
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/hustle-system', {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('✅ MongoDB connected');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
};

const seedTasksForLeave = async () => {
  try {
    console.log('🌱 Seeding tasks for leave testing...');

    // Find some users to assign tasks to
    const developers = await User.find({ 
      role: { $in: ['individual', 'service-delivery'] }
    }).limit(5);

    if (developers.length === 0) {
      console.log('❌ No developers found. Please create users first.');
      process.exit(1);
    }

    // Find or create a test project
    let project = await Project.findOne({ name: 'Leave Testing Project' });
    
    if (!project) {
      const manager = await User.findOne({ role: 'manager' });
      if (!manager) {
        console.log('❌ No manager found. Please create a manager first.');
        process.exit(1);
      }

      project = await Project.create({
        name: 'Leave Testing Project',
        description: 'Project for testing leave task reassignment',
        assignedManagerId: manager._id,
        createdBy: manager._id,
        deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
        status: 'in-progress'
      });
      console.log(`✅ Created project: ${project.name}`);
    }

    // Create tasks with varying deadlines
    const today = new Date();
    const tasks = [];

    // Task 1: Due in 3 days
    tasks.push({
      title: 'Fix Login Bug',
      description: 'Resolve authentication issue on login page',
      project: project._id,
      assignedTo: developers[0]._id,
      assignedBy: developers[0]._id,
      deadline: new Date(today.getTime() + 3 * 24 * 60 * 60 * 1000),
      status: 'in-progress',
      priority: 'high',
      points: 5
    });

    // Task 2: Due in 5 days
    tasks.push({
      title: 'Update Dashboard UI',
      description: 'Implement new dashboard design',
      project: project._id,
      assignedTo: developers[0]._id,
      assignedBy: developers[0]._id,
      deadline: new Date(today.getTime() + 5 * 24 * 60 * 60 * 1000),
      status: 'not-started',
      priority: 'medium',
      points: 8
    });

    // Task 3: Due in 7 days
    tasks.push({
      title: 'Write Unit Tests',
      description: 'Add unit tests for authentication module',
      project: project._id,
      assignedTo: developers[0]._id,
      assignedBy: developers[0]._id,
      deadline: new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000),
      status: 'not-started',
      priority: 'medium',
      points: 3
    });

    // Task 4: Due in 10 days
    tasks.push({
      title: 'API Documentation',
      description: 'Document REST API endpoints',
      project: project._id,
      assignedTo: developers[0]._id,
      assignedBy: developers[0]._id,
      deadline: new Date(today.getTime() + 10 * 24 * 60 * 60 * 1000),
      status: 'not-started',
      priority: 'low',
      points: 5
    });

    // Task 5: Due in 14 days
    tasks.push({
      title: 'Performance Optimization',
      description: 'Optimize database queries for better performance',
      project: project._id,
      assignedTo: developers[0]._id,
      assignedBy: developers[0]._id,
      deadline: new Date(today.getTime() + 14 * 24 * 60 * 60 * 1000),
      status: 'not-started',
      priority: 'high',
      points: 10
    });

    // Create additional tasks for other developers
    if (developers.length > 1) {
      tasks.push({
        title: 'Code Review',
        description: 'Review pull requests from team',
        project: project._id,
        assignedTo: developers[1]._id,
        assignedBy: developers[1]._id,
        deadline: new Date(today.getTime() + 4 * 24 * 60 * 60 * 1000),
        status: 'in-progress',
        priority: 'medium',
        points: 3
      });
    }

    // Insert tasks
    const createdTasks = await Task.insertMany(tasks);
    
    console.log(`✅ Created ${createdTasks.length} tasks`);
    console.log('\n📋 Task Summary:');
    createdTasks.forEach((task, index) => {
      console.log(`   ${index + 1}. ${task.title} - Due: ${task.deadline.toDateString()} - Assigned to: ${developers[0].firstName} ${developers[0].lastName}`);
    });

    console.log('\n💡 Test Instructions:');
    console.log(`   1. Submit a leave request for ${developers[0].firstName} ${developers[0].lastName}`);
    console.log(`   2. Leave dates should overlap with task deadlines (e.g., ${new Date(today.getTime() + 2 * 24 * 60 * 60 * 1000).toDateString()} to ${new Date(today.getTime() + 8 * 24 * 60 * 60 * 1000).toDateString()})`);
    console.log(`   3. Manager approves leave and should see task reassignment modal`);
    console.log(`   4. Reassign tasks to other team members`);
    console.log('\n🎉 Seed complete!');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding tasks:', error);
    process.exit(1);
  }
};

// Run the seed function
(async () => {
  await connectDB();
  await seedTasksForLeave();
})();
