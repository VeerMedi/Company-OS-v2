const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const User = require('../models/User');

const generateShortId = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 5; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
};

const updateIds = async () => {
    try {
        console.log('Connecting to MongoDB...', process.env.MONGODB_URI);
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        const users = await User.find({});
        console.log(`Found ${users.length} users. Updating IDs...`);

        let updatedCount = 0;
        const usedIds = new Set();

        // First pass: collect existing IDs if we were keeping them, 
        // but we are regenerating ALL, so we start fresh.

        for (const user of users) {
            let newId = generateShortId();
            // Simple collision check (in-memory against newly generated batch)
            while (usedIds.has(newId)) {
                newId = generateShortId();
            }
            usedIds.add(newId);

            // Use updateOne to avoid triggering all pre-save hooks if not needed,
            // or just to be precise.
            await User.updateOne({ _id: user._id }, { $set: { employeeId: newId } });
            console.log(`Updated User: ${user.email} | New ID: ${newId}`);
            updatedCount++;
        }

        console.log(`\nSuccess! Updated ${updatedCount} users.`);
        process.exit(0);
    } catch (error) {
        console.error('Error updating IDs:', error);
        process.exit(1);
    }
};

updateIds();
