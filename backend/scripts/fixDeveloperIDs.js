const mongoose = require('mongoose');
const User = require('../models/User');
require('dotenv').config();

const fixDeveloperIDs = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Get all developers and interns
    const users = await User.find({ 
      role: { $in: ['developer', 'intern'] } 
    }).select('firstName lastName email role employeeId');

    console.log('📋 Current IDs:');
    console.log('='.repeat(70));
    users.forEach(u => {
      console.log(`${u.role.padEnd(12)} | ${(u.firstName + ' ' + u.lastName).padEnd(25)} | ${u.employeeId}`);
    });
    console.log('');

    // Update IDs
    console.log('🔧 Updating Employee IDs...\n');

    // First, update Rahul (intern) to free up DEV003
    const rahul = await User.findOne({ email: 'rahul.nema@hustle.com' });
    if (rahul && rahul.employeeId === 'DEV003') {
      rahul.employeeId = 'INT001';
      await rahul.save();
      console.log('✅ Updated Rahul Nema (Intern): DEV003 → INT001');
    }

    // Now update Veer to DEV003
    const veer = await User.findOne({ email: 'veer@hustle.com' });
    if (veer && veer.employeeId === 'EMP003') {
      veer.employeeId = 'DEV003';
      await veer.save();
      console.log('✅ Updated Veer Singh (Developer): EMP003 → DEV003');
    }

    // Show final result
    const updatedUsers = await User.find({ 
      role: { $in: ['developer', 'intern'] } 
    }).select('firstName lastName email role employeeId').sort('role employeeId');

    console.log('\n📋 Updated IDs:');
    console.log('='.repeat(70));
    console.log('DEVELOPERS:');
    updatedUsers.filter(u => u.role === 'developer').forEach(u => {
      console.log(`  ${(u.firstName + ' ' + u.lastName).padEnd(25)} | ${u.employeeId} | ${u.email}`);
    });
    console.log('\nINTERNS:');
    updatedUsers.filter(u => u.role === 'intern').forEach(u => {
      console.log(`  ${(u.firstName + ' ' + u.lastName).padEnd(25)} | ${u.employeeId} | ${u.email}`);
    });
    
    console.log('\n✨ ID update complete!\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
};

fixDeveloperIDs();
