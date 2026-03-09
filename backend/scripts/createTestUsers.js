const mongoose = require('mongoose');
const User = require('../models/User');
require('dotenv').config();

const createTestUser = async () => {
  try {
    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB for creating test user...');

    // Create a test manager account
    const testManagerData = {
      firstName: 'Test',
      lastName: 'Manager',
      email: 'manager@test.com',
      password: 'krishna123', // This will be hashed automatically
      role: 'manager',
      phoneNumber: '+1-555-123-4567',
      dateOfBirth: new Date('1985-06-15'),
      department: 'Development',
      isActive: true,
      isPasswordChanged: false // This user will need to change password on first login
    };

    const manager = await User.create(testManagerData);
    console.log('✅ Test manager created successfully!');
    console.log('📧 Email:', manager.email);
    console.log('🔑 Password: krishna123');
    console.log('👤 Role:', manager.roleDisplay);
    console.log('🆔 Employee ID:', manager.employeeId);
    console.log('🔒 Needs password change:', !manager.isPasswordChanged);

    // Create a test individual account
    const testIndividualData = {
      firstName: 'Test',
      lastName: 'Individual',
      email: 'individual@test.com',
      password: 'krishna123',
      role: 'individual',
      phoneNumber: '+1-555-987-6543',
      dateOfBirth: new Date('1990-12-01'),
      department: 'Sales',
      isActive: true,
      isPasswordChanged: false
    };

    const individual = await User.create(testIndividualData);
    console.log('✅ Test individual created successfully!');
    console.log('📧 Email:', individual.email);
    console.log('🔑 Password: krishna123');
    console.log('👤 Role:', individual.roleDisplay);
    console.log('🆔 Employee ID:', individual.employeeId);
    console.log('🔒 Needs password change:', !individual.isPasswordChanged);

    console.log('\n🚀 Test users created! You can now test edit/delete functionality.');

  } catch (error) {
    console.error('❌ Error creating test users:', error.message);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
};

// Run if called directly
if (require.main === module) {
  createTestUser();
}

module.exports = createTestUser;