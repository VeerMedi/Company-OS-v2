const mongoose = require('mongoose');
const User = require('../models/User');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const resetHRPassword = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB...');

        const hr = await User.findOne({ email: 'hr@hustlesystem.com' });

        if (!hr) {
            console.log('HR user not found!');
            process.exit(0);
        }

        console.log('Found HR user:', hr.email);
        console.log('Resetting password to: krishna123');

        hr.password = 'krishna123';
        hr.isPasswordChanged = true;
        await hr.save();

        console.log('Password reset successful!');
        console.log('\nLogin with:');
        console.log('Email: hr@hustlesystem.com');
        console.log('Password: krishna123');

    } catch (error) {
        console.error('Error:', error.message);
    } finally {
        await mongoose.disconnect();
        process.exit(0);
    }
};

resetHRPassword();
