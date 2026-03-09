const mongoose = require('mongoose');
const { Leave } = require('../models/Leave');
require('dotenv').config();

async function revalidateStatuses() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB');

        // Get all leaves that might need status correction
        const leaves = await Leave.find({});
        console.log(`🔍 Checking ${leaves.length} leave records...`);

        let fixedCount = 0;
        for (const leave of leaves) {
            const oldStatus = leave.status;

            // Manually trigger the status logic instead of calling the populate-heavy method
            const requiredApprovals = await leave.getRequiredApprovals();
            let anyRejected = false;

            if (leave.managerApproval.status === 'rejected') anyRejected = true;
            if (leave.hrApproval.status === 'rejected') anyRejected = true;
            if (leave.coFounderApproval.status === 'rejected') anyRejected = true;

            if (anyRejected) {
                leave.status = 'rejected';
            } else {
                // If not rejected, let the model method re-evaluate approval levels
                await leave.updateStatus();
            }

            if (oldStatus !== leave.status) {
                console.log(`♻️  Updated status for leave ${leave._id}: ${oldStatus} -> ${leave.status}`);
                await leave.save();
                fixedCount++;
            }
        }

        console.log(`✅ Revalidated and fixed ${fixedCount} leave records`);
        await mongoose.connection.close();
        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

revalidateStatuses();
