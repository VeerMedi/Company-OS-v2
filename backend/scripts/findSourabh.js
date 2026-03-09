const mongoose = require('mongoose');
const User = require('../models/User');
require('dotenv').config();

const findSourabh = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('🔍 Searching for "sourabh" in database...\n');

        // Search in firstName, lastName, and email
        const users = await User.find({
            $or: [
                { firstName: { $regex: /sourabh/i } },
                { lastName: { $regex: /sourabh/i } },
                { email: { $regex: /sourabh/i } }
            ]
        }).select('firstName lastName email originalPassword role employeeId department isActive');

        if (users.length === 0) {
            console.log('❌ No user found with name "sourabh"\n');

            // Show all users as reference
            console.log('📋 All existing users:');
            const allUsers = await User.find({}).select('firstName lastName email role');
            allUsers.forEach((user, i) => {
                console.log(`${i + 1}. ${user.firstName} ${user.lastName} - ${user.email} (${user.role})`);
            });
        } else {
            console.log(`✅ Found ${users.length} user(s) matching "sourabh":\n`);
            console.log('='.repeat(80));

            users.forEach((user, index) => {
                console.log(`\n${index + 1}. ${user.firstName} ${user.lastName}`);
                console.log(`   📧 Email: ${user.email}`);
                console.log(`   🔑 Password: ${user.originalPassword || 'Not stored - Password is hashed'}`);
                console.log(`   👔 Role: ${user.role}`);
                console.log(`   🆔 Employee ID: ${user.employeeId || 'N/A'}`);
                console.log(`   🏢 Department: ${user.department || 'N/A'}`);
                console.log(`   ✅ Active: ${user.isActive ? 'Yes' : 'No'}`);
            });

            console.log('\n' + '='.repeat(80));
        }

    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await mongoose.disconnect();
        console.log('\n✅ Search complete.');
        process.exit(0);
    }
};

findSourabh();
