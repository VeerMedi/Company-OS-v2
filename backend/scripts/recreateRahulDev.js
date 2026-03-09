const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
require('dotenv').config();

const recreateRahul = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Check if Rahul already exists
    const existing = await User.findOne({ email: 'rahul.nema@hustle.com' });
    if (existing) {
      console.log('⚠️  Rahul already exists, updating his details...');
      await User.deleteOne({ email: 'rahul.nema@hustle.com' });
    }

    // Also check for old email
    const oldEmail = await User.findOne({ email: 'rahul@hustle.com' });
    if (oldEmail) {
      console.log('⚠️  Old Rahul email found, removing...');
      await User.deleteOne({ email: 'rahul@hustle.com' });
    }

    // Create Rahul as a developer
    const rahulData = {
      firstName: 'Rahul',
      lastName: 'Nema',
      email: 'rahul.nema@hustle.com',
      password: 'krishna123',
      role: 'developer', // Changed from 'individual' to 'developer'
      skills: ['AI/ML', 'Python', 'Automation', 'LangChain', 'RAG Systems', 'OpenAI'],
      jobCategory: 'developer',
      dateOfBirth: new Date('1995-01-15'),
      phoneNumber: '+919876543210',
      department: 'Development',
      isActive: true,
      isPasswordChanged: false
    };

    const rahul = await User.create(rahulData);
    
    console.log('✅ Rahul Nema recreated as Developer!');
    console.log('━'.repeat(60));
    console.log(`👤 Name: ${rahul.firstName} ${rahul.lastName}`);
    console.log(`📧 Email: ${rahul.email}`);
    console.log(`🔑 Password: krishna123`);
    console.log(`👔 Role: ${rahul.role}`);
    console.log(`🆔 Employee ID: ${rahul.employeeId}`);
    console.log(`💼 Skills: ${rahul.skills.join(', ')}`);
    console.log('━'.repeat(60));

    // Show all developers now
    console.log('\n📋 All Developers:');
    const developers = await User.find({ role: 'developer' })
      .select('firstName lastName email employeeId skills')
      .sort('firstName');
    
    developers.forEach(dev => {
      console.log(`  • ${dev.firstName} ${dev.lastName} (${dev.email}) - ${dev.skills.join(', ')}`);
    });

    console.log(`\n✨ Total Developers: ${developers.length}\n`);

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('Database connection closed');
    process.exit(0);
  }
};

recreateRahul();
