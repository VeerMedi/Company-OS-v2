const mongoose = require('mongoose');
const Company = require('../models/Company');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const checkClients = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB...\n');

        const clients = await Company.find({});
        console.log(`📊 Total Clients Found: ${clients.length}\n`);

        if (clients.length > 0) {
            console.log('📋 Client List:');
            clients.forEach((client, index) => {
                console.log(`${index + 1}. ${client.companyName} (Status: ${client.status})`);
            });
        } else {
            console.log('No clients found in the database.');
        }

    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await mongoose.disconnect();
        process.exit(0);
    }
};

checkClients();
