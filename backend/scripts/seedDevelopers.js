const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('../models/User');
const Task = require('../models/Task');
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

const seedDevelopers = async () => {
  try {
    console.log('🌱 Seeding developers and tasks...');

    // Find manager
    const manager = await User.findOne({ role: 'manager' });
    if (!manager) {
      console.log('❌ No manager found. Please create a manager first.');
      process.exit(1);
    }

    // Create 4 developers with specific roles
    const developers = [
      {
        firstName: 'Rahul',
        lastName: 'Nema',
        email: 'rahul@hustle.com',
        password: 'krishna123',
        role: 'individual',
        skills: ['AI/ML', 'Python', 'Automation', 'LangChain', 'RAG Systems', 'OpenAI'],
        jobCategory: 'developer',
        dateOfBirth: new Date('1995-01-15'),
        phoneNumber: '+919876543210',
        department: 'Development'
      },
      {
        firstName: 'Veer',
        lastName: 'Singh',
        email: 'veer@hustle.com',
        password: '123456',
        role: 'individual',
        skills: ['AI/ML', 'Python', 'Automation', 'OpenAI', 'Vector Databases', 'Machine Learning'],
        jobCategory: 'developer',
        dateOfBirth: new Date('1994-05-22'),
        phoneNumber: '+919876543211',
        department: 'Development'
      },
      {
        firstName: 'Krishna',
        lastName: 'Sharma',
        email: 'krishna@hustle.com',
        password: '123456',
        role: 'individual',
        skills: ['React', 'JavaScript', 'Node.js', 'MongoDB', 'Full-Stack', 'Express'],
        jobCategory: 'developer',
        dateOfBirth: new Date('1996-08-10'),
        phoneNumber: '+919876543212',
        department: 'Development'
      },
      {
        firstName: 'Mohit',
        lastName: 'Kumar',
        email: 'mohit@hustle.com',
        password: '123456',
        role: 'individual',
        skills: ['React', 'JavaScript', 'CSS', 'UI/UX', 'Frontend', 'HTML5'],
        jobCategory: 'developer',
        dateOfBirth: new Date('1995-11-25'),
        phoneNumber: '+919876543213',
        department: 'Development'
      }
    ];

    // Delete existing test developers if they exist
    await User.deleteMany({
      email: { $in: developers.map(d => d.email) }
    });

    // Create developers using save() to trigger password hashing middleware
    const createdDevs = [];
    for (const devData of developers) {
      const dev = new User(devData);
      await dev.save();
      createdDevs.push(dev);
    }

    console.log(`✅ Created ${createdDevs.length} developers:`);
    createdDevs.forEach(dev => {
      console.log(`   - ${dev.firstName} ${dev.lastName} (${dev.skills.join(', ')})`);
    });

    // Find or create test project
    let project = await Project.findOne({ name: 'Skill-Based Testing Project' });

    if (!project) {
      project = await Project.create({
        name: 'Skill-Based Testing Project',
        description: 'Project for testing skill-based task reassignment',
        assignedManagerId: manager._id,
        createdBy: manager._id,
        deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        status: 'in-progress'
      });
      console.log(`✅ Created project: ${project.name}`);
    }

    // Create tasks with different skill requirements
    const today = new Date();
    const tasks = [];

    // AI/Automation tasks for Rahul
    tasks.push({
      title: 'Implement RAG System Enhancement',
      description: 'Enhance RAG system with better context retrieval and response generation',
      project: project._id,
      assignedTo: createdDevs[0]._id, // Rahul
      assignedBy: manager._id,
      deadline: new Date(today.getTime() + 5 * 24 * 60 * 60 * 1000),
      status: 'in-progress',
      priority: 'high',
      points: 13,
      requiredSkills: ['AI/ML', 'Python', 'RAG Systems', 'LangChain'],
      taskCategory: 'development'
    });

    tasks.push({
      title: 'Build Voice Agent Integration',
      description: 'Integrate voice capabilities with AI assistant',
      project: project._id,
      assignedTo: createdDevs[0]._id, // Rahul
      assignedBy: manager._id,
      deadline: new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000),
      status: 'not-started',
      priority: 'medium',
      points: 10,
      requiredSkills: ['Python', 'OpenAI', 'Automation'],
      taskCategory: 'development'
    });

    // AI/Automation tasks for Veer
    tasks.push({
      title: 'Optimize Vector Database Performance',
      description: 'Improve vector search efficiency and indexing',
      project: project._id,
      assignedTo: createdDevs[1]._id, // Veer
      assignedBy: manager._id,
      deadline: new Date(today.getTime() + 4 * 24 * 60 * 60 * 1000),
      status: 'in-progress',
      priority: 'high',
      points: 8,
      requiredSkills: ['Vector Databases', 'Python', 'AI/ML'],
      taskCategory: 'development'
    });

    tasks.push({
      title: 'Create ML Model Training Pipeline',
      description: 'Build automated pipeline for model training and evaluation',
      project: project._id,
      assignedTo: createdDevs[1]._id, // Veer
      assignedBy: manager._id,
      deadline: new Date(today.getTime() + 8 * 24 * 60 * 60 * 1000),
      status: 'not-started',
      priority: 'medium',
      points: 12,
      requiredSkills: ['Machine Learning', 'Python', 'Automation'],
      taskCategory: 'development'
    });

    // Web Development tasks for Krishna
    tasks.push({
      title: 'Build Analytics Dashboard Backend',
      description: 'Create REST API endpoints for analytics dashboard',
      project: project._id,
      assignedTo: createdDevs[2]._id, // Krishna
      assignedBy: manager._id,
      deadline: new Date(today.getTime() + 6 * 24 * 60 * 60 * 1000),
      status: 'in-progress',
      priority: 'high',
      points: 10,
      requiredSkills: ['Node.js', 'MongoDB', 'Express', 'Full-Stack'],
      taskCategory: 'development'
    });

    tasks.push({
      title: 'Implement Real-time Data Sync',
      description: 'Add WebSocket support for real-time dashboard updates',
      project: project._id,
      assignedTo: createdDevs[2]._id, // Krishna
      assignedBy: manager._id,
      deadline: new Date(today.getTime() + 9 * 24 * 60 * 60 * 1000),
      status: 'not-started',
      priority: 'medium',
      points: 11,
      requiredSkills: ['Node.js', 'JavaScript', 'React'],
      taskCategory: 'development'
    });

    // Web Development tasks for Mohit
    tasks.push({
      title: 'Design Modern UI Components',
      description: 'Create reusable React components with glassmorphism design',
      project: project._id,
      assignedTo: createdDevs[3]._id, // Mohit
      assignedBy: manager._id,
      deadline: new Date(today.getTime() + 3 * 24 * 60 * 60 * 1000),
      status: 'in-progress',
      priority: 'high',
      points: 8,
      requiredSkills: ['React', 'CSS', 'UI/UX', 'Frontend'],
      taskCategory: 'development'
    });

    tasks.push({
      title: 'Implement Responsive Dashboard Layout',
      description: 'Build mobile-responsive dashboard with modern animations',
      project: project._id,
      assignedTo: createdDevs[3]._id, // Mohit
      assignedBy: manager._id,
      deadline: new Date(today.getTime() + 5 * 24 * 60 * 60 * 1000),
      status: 'not-started',
      priority: 'high',
      points: 9,
      requiredSkills: ['React', 'JavaScript', 'CSS', 'HTML5'],
      taskCategory: 'development'
    });

    // Insert tasks
    const createdTasks = await Task.insertMany(tasks);

    console.log(`\n✅ Created ${createdTasks.length} tasks with skill requirements`);
    console.log('\n📋 Task Summary:');

    createdDevs.forEach((dev, idx) => {
      const devTasks = createdTasks.filter(t => t.assignedTo.toString() === dev._id.toString());
      console.log(`\n   ${dev.firstName} ${dev.lastName} (${dev.skills.join(', ')}):`);
      devTasks.forEach(task => {
        console.log(`      - ${task.title} (${task.requiredSkills.join(', ')}) - Due: ${task.deadline.toDateString()}`);
      });
    });

    console.log('\n💡 Developer Credentials:');
    console.log('   AI & Automation Developers:');
    console.log('   - Rahul: rahul@hustle.com / krishna123');
    console.log('   - Veer: veer@hustle.com / 123456');
    console.log('\n   Web Developers:');
    console.log('   - Krishna: krishna@hustle.com / 123456');
    console.log('   - Mohit: mohit@hustle.com / 123456');
    console.log('\n🎉 Seed complete!');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding developers:', error);
    process.exit(1);
  }
};

// Run the seed function
(async () => {
  await connectDB();
  await seedDevelopers();
})();
