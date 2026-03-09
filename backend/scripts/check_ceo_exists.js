require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');

const checkCEO = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const user = await User.findOne({ email: 'ceo@hustlesystem.com' });
        if (user) {
            console.log('CEO Found:', user.email);
            console.log('Role:', user.role);
        } else {
            console.log('CEO NOT found!');
        }
    } catch (err) {
        console.error('Error:', err.message);
    } finally {
        await mongoose.disconnect();
    }
};

checkCEO();
