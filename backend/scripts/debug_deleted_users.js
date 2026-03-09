const mongoose = require('mongoose');
const path = require('path');
const dotenv = require('dotenv');

// Load .env explicitly
const envPath = path.resolve(__dirname, '../.env');
console.log('Loading .env from:', envPath);
const result = dotenv.config({ path: envPath });

if (result.error) {
    console.error('Error loading .env:', result.error);
}

const uri = process.env.MONGODB_URI;

if (!uri) {
    console.error('CRITICAL ERROR: MONGODB_URI is not defined in .env!');
    console.error('Script was about to fall back to localhost, but stopping to prevent Confusion.');
    process.exit(1);
}

console.log('Connecting to Database (masked):', uri.split('@')[1] || 'Unknown Format');

mongoose.connect(uri)
    .then(async () => {
        const User = require('../models/User');

        console.log('--- FIXING DELETED USERS (REMOTE DB) ---');

        // Check inactive users
        const inactiveUsers = await User.find({ isActive: false });
        console.log(`Inactive Users found: ${inactiveUsers.length}`);

        // FIX: Set isDeleted=true for inactive users if missing
        if (inactiveUsers.length > 0) {
            console.log('Running migration to set isDeleted=true...');
            // Only update if isDeleted is not explicitly true
            const start = Date.now();
            const result = await User.updateMany(
                { isActive: false, isDeleted: { $ne: true } },
                { $set: { isDeleted: true, deletedAt: new Date() } }
            );
            console.log(`Fixed ${result.modifiedCount} users in ${(Date.now() - start)}ms`);
        } else {
            console.log('No inactive users found to fix.');
        }

        // Verify
        const deletedUsers = await User.find({ isDeleted: true });
        console.log(`Total Deleted Users now: ${deletedUsers.length}`);

        process.exit(0);
    })
    .catch(err => {
        console.error('Connection Error:', err);
        process.exit(1);
    });
