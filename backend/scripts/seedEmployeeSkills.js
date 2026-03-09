const mongoose = require('mongoose');
const User = require('../models/User');
require('dotenv').config({ path: './config/.env' });

/**
 * Seed existing employees with skill labels and hierarchy
 * Run this script to update existing employees:
 * node backend/scripts/seedEmployeeSkills.js
 */

const employeeSkills = {
  // Existing employees from seed data
  'rahul@hustle.com': {
    skills: ['AI Developer', 'Machine Learning', 'Python', 'LangChain', 'RAG Systems', 'OpenAI'],
    seniorityLevel: 'senior',
    canDelegate: true,
    jobCategory: 'developer'
  },
  'veer@hustle.com': {
    skills: ['AI Developer', 'Machine Learning', 'Python', 'Vector Databases', 'ML Pipelines'],
    seniorityLevel: 'senior',
    canDelegate: true,
    jobCategory: 'developer'
  },
  'krishna@hustle.com': {
    skills: ['Full Stack Developer', 'Backend Developer', 'Node.js', 'React', 'Database', 'API Development'],
    seniorityLevel: 'senior',
    canDelegate: true,
    jobCategory: 'developer'
  },
  'mohit@hustle.com': {
    skills: ['Frontend Developer', 'UI/UX Designer', 'React', 'JavaScript', 'CSS', 'Responsive Design'],
    seniorityLevel: 'senior',
    canDelegate: true,
    jobCategory: 'developer'
  },
  // Developer test user (if exists)
  'developertest@hustle.com': {
    skills: ['Full Stack Developer', 'QA/Testing', 'JavaScript', 'Testing Frameworks'],
    seniorityLevel: 'junior',
    canDelegate: false,
    jobCategory: 'developer'
  }
};

async function seedEmployeeSkills() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/husl-os', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log('✅ Connected to MongoDB');

    let updatedCount = 0;
    let notFoundCount = 0;

    // Update each employee
    for (const [email, updates] of Object.entries(employeeSkills)) {
      const user = await User.findOne({ email: email.toLowerCase() });
      
      if (user) {
        // Update user with new fields
        user.skills = updates.skills;
        user.seniorityLevel = updates.seniorityLevel;
        user.canDelegate = updates.canDelegate;
        user.jobCategory = updates.jobCategory;
        
        await user.save();
        
        console.log(`✅ Updated ${user.firstName} ${user.lastName} (${email})`);
        console.log(`   Skills: ${updates.skills.join(', ')}`);
        console.log(`   Seniority: ${updates.seniorityLevel}`);
        console.log(`   Can Delegate: ${updates.canDelegate}`);
        console.log('');
        
        updatedCount++;
      } else {
        console.log(`⚠️  User not found: ${email}`);
        notFoundCount++;
      }
    }

    // Also update any existing managers to ensure they can see the new features
    const managers = await User.find({ role: 'manager' });
    for (const manager of managers) {
      if (!manager.seniorityLevel) {
        manager.seniorityLevel = 'lead';
        manager.canDelegate = true;
        await manager.save();
        console.log(`✅ Updated manager: ${manager.firstName} ${manager.lastName}`);
      }
    }

    console.log('\n📊 Summary:');
    console.log(`   Updated: ${updatedCount} employees`);
    console.log(`   Not Found: ${notFoundCount} employees`);
    console.log(`   Managers Updated: ${managers.length}`);
    console.log('\n✅ Seed completed successfully!');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Seed error:', error);
    process.exit(1);
  }
}

// Run the seed function
seedEmployeeSkills();
