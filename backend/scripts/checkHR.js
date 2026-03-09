const mongoose = require('mongoose');
const User = require('../models/User');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const checkHR = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB...\n');

        const hr = await User.findOne({ email: 'hr@hustlesystem.com' });

        if (!hr) {
            console.log('❌ HR user not found!');
            process.exit(0);
        }

        console.log('✅ HR User Found:\n');
        console.log('📧 Email:', hr.email);
        console.log('👔 Role:', hr.role);
        console.log('🆔 Employee ID:', hr.employeeId);
        console.log('🏢 Department:', hr.department);
        console.log('✅ Active:', hr.isActive);
        console.log('🔑 Password Changed:', hr.isPasswordChanged);
        console.log('\n🔐 Testing password "krishna123"...');

        const bcrypt = require('bcrypt');
        const isMatch = await bcrypt.compare('krishna123', hr.password);
        console.log('Password Match:', isMatch ? '✅ YES' : '❌ NO');

        if (!isMatch) {
            console.log('\n🔄 Updating password to "krishna123"...');
            hr.password = 'krishna123';
            await hr.save();
            console.log('✅ Password updated successfully!');
        }

    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await mongoose.disconnect();
        process.exit(0);
    }
};

checkHR();
