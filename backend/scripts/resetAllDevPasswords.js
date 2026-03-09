const mongoose = require('mongoose');
const User = require('../models/User');
require('dotenv').config();

const resetAllDevPasswords = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Reset passwords for all developers and interns
    const users = await User.find({ 
      role: { $in: ['developer', 'intern'] }
    });

    console.log('🔧 Resetting passwords for all developers and interns...\n');

    for (const user of users) {
      user.password = 'krishna123';
      user.isPasswordChanged = false;
      user.isActive = true;
      await user.save();
      console.log(`✅ ${user.firstName} ${user.lastName} (${user.role}) - ${user.email}`);
    }

    console.log('\n✨ All passwords reset to: krishna123');
    console.log('\n📋 Login Credentials:');
    console.log('='.repeat(70));
    
    const developers = users.filter(u => u.role === 'developer');
    const interns = users.filter(u => u.role === 'intern');
    
    console.log('\nDEVELOPERS:');
    developers.forEach(d => {
      console.log(`  📧 ${d.email.padEnd(35)} | 🔑 krishna123 | 🆔 ${d.employeeId}`);
    });
    
    console.log('\nINTERNS:');
    interns.forEach(i => {
      console.log(`  📧 ${i.email.padEnd(35)} | 🔑 krishna123 | 🆔 ${i.employeeId}`);
    });
    
    console.log('\n' + '='.repeat(70));
    console.log('\n✅ All accounts ready for login!\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
};

resetAllDevPasswords();
