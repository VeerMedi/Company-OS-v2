const mongoose = require('mongoose');
const User = require('../models/User');
require('dotenv').config();

const findCoFounder = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB...\n');

        // Find ALL users
        const allUsers = await User.find({}).select('firstName lastName email originalPassword role employeeId department');

        if (allUsers.length === 0) {
            console.log('❌ No users found in database.');
        } else {
            let output = `✅ Found ${allUsers.length} users:\n\n`;
            output += '='.repeat(80) + '\n';

            allUsers.forEach((user, index) => {
                output += `\n${index + 1}. ${user.firstName} ${user.lastName}\n`;
                output += `   📧 Email: ${user.email}\n`;
                output += `   🔑 Password: ${user.originalPassword || 'Not stored - Password is hashed'}\n`;
                output += `   👔 Role: ${user.role}\n`;
                output += `   🆔 Employee ID: ${user.employeeId || 'N/A'}\n`;
                output += `   🏢 Department: ${user.department || 'N/A'}\n`;

                // Also log to console
                console.log(`\n${index + 1}. ${user.firstName} ${user.lastName}`);
                console.log(`   📧 Email: ${user.email}`);
                console.log(`   🔑 Password: ${user.originalPassword || 'Not stored - Password is hashed'}`);
                console.log(`   👔 Role: ${user.role}`);
                console.log(`   🆔 Employee ID: ${user.employeeId || 'N/A'}`);
                console.log(`   🏢 Department: ${user.department || 'N/A'}`);
            });

            output += '\n' + '='.repeat(80);
            console.log('\n' + '='.repeat(80));

            // Write to file
            const fs = require('fs');
            const path = require('path');
            const filePath = path.join(__dirname, 'user_credentials.txt');
            fs.writeFileSync(filePath, output, 'utf8');
            console.log(`\n💾 Credentials saved to: ${filePath}`);
        }

    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await mongoose.disconnect();
        process.exit(0);
    }
};

findCoFounder();
