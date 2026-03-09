const mongoose = require('mongoose');
const { Leave } = require('../models/Leave');
const User = require('../models/User');
require('dotenv').config();

async function debugInternLeaves() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Find all interns
    const internUsers = await User.find({ role: 'intern' }).select('_id firstName lastName email');
    console.log(`Found ${internUsers.length} interns:`);
    internUsers.forEach(intern => {
      console.log(`  - ${intern.firstName} ${intern.lastName} (${intern._id})`);
    });

    const internIds = internUsers.map(u => u._id);

    // Find ALL leaves from interns (pending or not)
    const allInternLeaves = await Leave.find({
      employee: { $in: internIds }
    })
    .populate('employee', 'firstName lastName email role')
    .sort({ createdAt: -1 })
    .limit(10);

    console.log(`\n📋 Last 10 intern leave requests:\n`);
    
    allInternLeaves.forEach((leave, index) => {
      console.log(`${index + 1}. ${leave.employee.firstName} ${leave.employee.lastName}`);
      console.log(`   Leave Type: ${leave.leaveType}`);
      console.log(`   Status: ${leave.status}`);
      console.log(`   HandoverStatus: ${leave.handoverStatus || 'UNDEFINED/NULL'}`);
      console.log(`   Manager Approval: ${leave.managerApproval.status}`);
      console.log(`   HR Approval: ${leave.hrApproval.status}`);
      console.log(`   Created: ${leave.createdAt}`);
      console.log(`   ---`);
    });

    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

debugInternLeaves();
