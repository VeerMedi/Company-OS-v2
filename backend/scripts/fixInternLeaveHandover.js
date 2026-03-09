const mongoose = require('mongoose');
const { Leave } = require('../models/Leave');
const User = require('../models/User');
require('dotenv').config();

async function fixInternLeaveHandoverStatus() {
  try {
    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Find all leaves from interns
    const internUsers = await User.find({ role: 'intern' }).select('_id');
    const internIds = internUsers.map(u => u._id);

    console.log(`Found ${internIds.length} interns`);

    // Find all pending leaves from interns that don't have handoverStatus set properly
    const leavesToFix = await Leave.find({
      employee: { $in: internIds },
      status: 'pending',
      $or: [
        { handoverStatus: { $exists: false } },
        { handoverStatus: null },
        { handoverStatus: 'not_required' }
      ]
    }).populate('employee', 'firstName lastName email role');

    console.log(`Found ${leavesToFix.length} intern leaves that need handoverStatus update`);

    // Update each leave
    for (const leave of leavesToFix) {
      console.log(`Updating leave for ${leave.employee.firstName} ${leave.employee.lastName} - ${leave.leaveType}`);
      leave.handoverStatus = 'pending';
      await leave.save();
    }

    console.log(`✅ Updated ${leavesToFix.length} leaves with handoverStatus: 'pending'`);

    // Also fix leaves that have handoverStatus completed but should not
    const completedHandovers = await Leave.find({
      employee: { $in: internIds },
      status: 'pending',
      handoverStatus: 'completed',
      'managerApproval.status': 'pending'
    }).populate('employee', 'firstName lastName email role');

    console.log(`\nFound ${completedHandovers.length} intern leaves with completed handover but pending manager approval`);
    
    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');
    console.log('\n🎉 Migration completed successfully!');

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

// Run the migration
fixInternLeaveHandoverStatus();
