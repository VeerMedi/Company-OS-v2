const mongoose = require('mongoose');
const User = require('../models/User');
require('dotenv').config();

const addHRProfile = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Get CEO for reporting relationship
    const ceo = await User.findOne({ email: 'ceo@hustlesystem.com' });
    
    if (!ceo) {
      console.log('❌ CEO not found');
      process.exit(1);
    }

    // Check if HR already exists
    const existingHR = await User.findOne({ email: 'hr@hustlesystem.com' });
    if (existingHR) {
      console.log('⚠️  HR user already exists, updating...');
      await User.deleteOne({ email: 'hr@hustlesystem.com' });
    }

    // Create HR user
    const hrData = {
      firstName: 'HR',
      lastName: 'Manager',
      email: 'hr@hustlesystem.com',
      password: 'krishna123',
      role: 'hr',
      employeeId: 'HR001',
      phoneNumber: '+91-9876543200',
      dateOfBirth: new Date('1988-03-15'),
      department: 'Human Resources',
      isActive: true,
      isPasswordChanged: false,
      reportingTo: ceo._id // HR reports to CEO
    };

    const hr = await User.create(hrData);
    console.log('✅ HR Profile Created Successfully!\n');

    console.log('=' .repeat(70));
    console.log('📋 HR PROFILE DETAILS');
    console.log('='.repeat(70));
    console.log('Name:', hr.firstName, hr.lastName);
    console.log('Email:', hr.email);
    console.log('Password: krishna123');
    console.log('Role:', hr.role);
    console.log('Employee ID:', hr.employeeId);
    console.log('Department:', hr.department);
    console.log('Reports to: CEO (Chief Executive)');
    console.log('Status: Active');
    console.log('='.repeat(70));

    // Show updated organization
    console.log('\n📊 Updated Organizational Structure:\n');
    console.log('CEO (Chief Executive) - CEO001');
    console.log(' ├─ HR Manager - HR001 [NEW]');
    console.log(' └─ Co-Founder (Co-Founder User) - CF001');
    console.log('     └─ Manager (Manager User) - MGR001');
    console.log('         └─ Team Lead (Sourabh Singh) - TL001');
    console.log('             ├─ Developer: Veer Singh - DEV001');
    console.log('             │   └─ Intern: Rahul Nema - INT001');
    console.log('             └─ Developer: Krishna Mehra - DEV002');
    console.log('                 └─ Intern: Mohit Sharma - INT002');

    console.log('\n✨ HR profile added successfully!\n');

    // Count total users
    const totalUsers = await User.countDocuments({});
    console.log(`📊 Total users in database: ${totalUsers}\n`);

  } catch (error) {
    console.error('❌ Error:', error.message);
    throw error;
  } finally {
    await mongoose.disconnect();
  }
};

// Run if called directly
if (require.main === module) {
  addHRProfile().then(() => process.exit(0)).catch(err => {
    console.error(err);
    process.exit(1);
  });
}

module.exports = addHRProfile;
