const mongoose = require('mongoose');
const { Leave } = require('../models/Leave');
require('dotenv').config();

async function fixRejectedLeaves() {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB');

        // Find all leaves with status 'rejectd' (typo) or any variation
        const result = await Leave.updateMany(
            {
                $or: [
                    { status: 'rejectd' },
                    { status: 'reject' }
                ]
            },
            {
                $set: { status: 'rejected' }
            }
        );

        console.log(`✅ Fixed ${result.modifiedCount} rejected leave records`);

        // Also fix approval statuses
        const hrResult = await Leave.updateMany(
            { 'hrApproval.status': 'reject' },
            { $set: { 'hrApproval.status': 'rejected' } }
        );

        const managerResult = await Leave.updateMany(
            { 'managerApproval.status': 'reject' },
            { $set: { 'managerApproval.status': 'rejected' } }
        );

        console.log(`✅ Fixed ${hrResult.modifiedCount} HR approval records`);
        console.log(`✅ Fixed ${managerResult.modifiedCount} Manager approval records`);

        await mongoose.connection.close();
        console.log('✅ Database connection closed');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

fixRejectedLeaves();
