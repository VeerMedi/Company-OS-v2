require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');

const checkUser = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const user = await User.findOne({ email: 'hr@hustlesystem.com' });
        if (user) {
            console.log('User Found:', user.email);
            console.log('Active:', user.isActive);
            console.log('Role:', user.role);
        } else {
            console.log('User NOT found!');
        }
    } catch (err) {
        console.error('Error:', err.message);
    } finally {
        await mongoose.disconnect();
    }
};

checkUser();
