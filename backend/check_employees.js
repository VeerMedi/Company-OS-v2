const mongoose = require('mongoose');
const User = require('./models/User');

mongoose.connect('mongodb://127.0.0.1:27017/husl_os')
  .then(async () => {
    console.log('✅ Connected to MongoDB\n');
    
    const users = await User.find({}, { 
      employeeId: 1, 
      firstName: 1, 
      lastName: 1, 
      role: 1,
      isActive: 1 
    }).limit(20);
    
    console.log('📋 Employee Codes in Database:\n');
    users.forEach(u => {
      const status = u.isActive ? '✅' : '❌';
      console.log(`  ${status} ${u.employeeId || 'NO_EMPLOYEE_ID'} - ${u.firstName} ${u.lastName} (${u.role})`);
    });
    
    console.log(`\n📊 Total users found: ${users.length}`);
    
    // Check for specific codes from CSV
    const csvCodes = ['DEV002', 'DEV001', 'EMP001', 'INT001'];
    console.log('\n🔍 Checking CSV employee codes:\n');
    for (const code of csvCodes) {
      const found = await User.findOne({ employeeId: code, isActive: true });
      if (found) {
        console.log(`  ✅ ${code} - Found: ${found.firstName} ${found.lastName}`);
      } else {
        console.log(`  ❌ ${code} - NOT FOUND`);
      }
    }
    
    mongoose.disconnect();
    console.log('\n🔌 Disconnected');
  })
  .catch(err => {
    console.error('❌ Error:', err);
    mongoose.disconnect();
  });
