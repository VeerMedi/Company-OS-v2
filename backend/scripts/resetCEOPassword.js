const mongoose = require('mongoose');
const User = require('../models/User');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const resetCEOPassword = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB...');

        const ceo = await User.findOne({ email: 'ceo@hustlesystem.com' });

        if (!ceo) {
            console.log('CEO user not found!');
            process.exit(0);
        }

        console.log('Found CEO user:', ceo.email);
        console.log('Resetting password to: krishna123');

        ceo.password = 'krishna123';
        ceo.isPasswordChanged = true;
        await ceo.save();

        console.log('Password reset successful!');

    } catch (error) {
        console.error('Error:', error.message);
    } finally {
        await mongoose.disconnect();
        process.exit(0);
    }
};

resetCEOPassword();
