require('dotenv').config();
const mongoose = require('mongoose');

console.log('Testing connection with MONGODB_URI from .env...');

mongoose.connect(process.env.MONGODB_URI)
    .then(() => {
        console.log('✅ Connection Successful!');
        process.exit(0);
    })
    .catch(err => {
        console.error('❌ Connection Failed:', err.message);
        process.exit(1);
    });
