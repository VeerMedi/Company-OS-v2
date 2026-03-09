const mongoose = require('mongoose');
const User = require('./models/User');
const bcrypt = require('bcryptjs');

mongoose.connect('mongodb://127.0.0.1:27017/husl_os')
  .then(async () => {
    console.log('✅ Connected to MongoDB\n');
    
    // Create test users for CSV import
    const testUsers = [
      {
        employeeId: 'DEV002',
        firstName: 'Raj',
        lastName: 'Kumar',
        email: 'raj.kumar@company.com',
        role: 'developer',
        password: 'password123',
        dateOfBirth: new Date('1995-06-15'),
        phoneNumber: '9876543210',
        address: 'Mumbai, India',
        isActive: true
      },
      {
        employeeId: 'DEV001',
        firstName: 'Priya',
        lastName: 'Sharma',
        email: 'priya.sharma@company.com',
        role: 'developer',
        password: 'password123',
        dateOfBirth: new Date('1994-03-20'),
        phoneNumber: '9876543211',
        address: 'Delhi, India',
        isActive: true
      },
      {
        employeeId: 'EMP001',
        firstName: 'Amit',
        lastName: 'Verma',
        email: 'amit.verma@company.com',
        role: 'individual',
        password: 'password123',
        dateOfBirth: new Date('1992-08-10'),
        phoneNumber: '9876543212',
        address: 'Bangalore, India',
        isActive: true
      },
      {
        employeeId: 'INT001',
        firstName: 'Sneha',
        lastName: 'Patel',
        email: 'sneha.patel@company.com',
        role: 'intern',
        password: 'password123',
        dateOfBirth: new Date('2000-11-25'),
        phoneNumber: '9876543213',
        address: 'Pune, India',
        isActive: true
      },
      {
        employeeId: 'HR001',
        firstName: 'Krishna',
        lastName: 'Jaiswal',
        email: 'krishna@company.com',
        role: 'hr',
        password: 'password123',
        dateOfBirth: new Date('1990-01-15'),
        phoneNumber: '9876543214',
        address: 'Noida, India',
        isActive: true
      }
    ];
    
    console.log('🚀 Creating test users...\n');
    
    for (const userData of testUsers) {
      // Check if already exists
      const existing = await User.findOne({ email: userData.email });
      if (existing) {
        console.log(`⏭️  Skip: ${userData.employeeId} (${userData.email}) - Already exists`);
        continue;
      }
      
      const user = new User(userData);
      await user.save();
      console.log(`✅ Created: ${userData.employeeId} - ${userData.firstName} ${userData.lastName} (${userData.role})`);
    }
    
    console.log('\n📊 Users in database:');
    const allUsers = await User.find({}, { employeeId: 1, firstName: 1, lastName: 1, role: 1 });
    allUsers.forEach(u => {
      console.log(`  • ${u.employeeId} - ${u.firstName} ${u.lastName} (${u.role})`);
    });
    
    console.log('\n✅ All done!');
    mongoose.disconnect();
  })
  .catch(err => {
    console.error('❌ Error:', err);
    mongoose.disconnect();
  });
