const mongoose = require('mongoose');
const User = require('../models/User');
require('dotenv').config();

const seedCEO = async () => {
  try {
    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB for seeding...');

    // Check if CEO already exists
    const existingCEO = await User.findOne({ role: 'ceo' });
    if (existingCEO) {
      console.log('CEO account already exists:', existingCEO.email);
      process.exit(0);
    }

    // Create hardcoded CEO account
    const ceoData = {
      firstName: 'Chief',
      lastName: 'Executive',
      email: 'ceo@hustlesystem.com',
      password: 'krishna123', // Updated password
      role: 'ceo',
      phoneNumber: '+1-555-487-8530',
      dateOfBirth: new Date('1970-01-01'), // CEO DOB
      isActive: true,
      isPasswordChanged: true // CEO doesn't need to change password
      // employeeId and department will be auto-generated
    };

    const ceo = await User.create(ceoData);
    console.log('✅ CEO account created successfully!');
    console.log('📧 Email:', ceo.email);
    console.log('🔑 Password: krishna123');
    console.log('👑 Role:', ceo.roleDisplay);
    console.log('🆔 Employee ID:', ceo.employeeId);

    console.log('\n🚀 You can now login as CEO and create other users!');

  } catch (error) {
    console.error('❌ Error seeding CEO:', error.message);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
};

// Run if called directly
if (require.main === module) {
  seedCEO();
}

module.exports = seedCEO;