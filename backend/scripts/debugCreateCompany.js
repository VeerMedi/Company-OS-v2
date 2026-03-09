const mongoose = require('mongoose');
const Company = require('../models/Company');
const User = require('../models/User');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const debugCompany = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB...');

        // Find a user to act as submitter
        const user = await User.findOne({ role: 'ceo' }) || await User.findOne({ role: 'hr' });
        if (!user) {
            console.log('No CEO or HR user found for testing.');
            process.exit(1);
        }
        console.log(`Using User: ${user.firstName} (${user._id})`);

        // Attempt to create a company directly
        const testCompany = new Company({
            companyName: 'Test Company Debug ' + Date.now(),
            industry: 'Debug Tech',
            location: { city: 'Debug City' },
            status: 'in-contact',
            priority: 'Medium',
            identifiedBy: user._id, // This is what the controller uses
            assignedTo: user._id
        });

        console.log('Attempting to save company...');
        await testCompany.save();
        console.log('✅ Company saved successfully!');
        console.log(testCompany);

    } catch (error) {
        console.error('❌ Save Failed:', error);
        if (error.errors) {
            Object.keys(error.errors).forEach(key => {
                console.error(`  -> ${key}: ${error.errors[key].message}`);
            });
        }
    } finally {
        await mongoose.disconnect();
        process.exit(0);
    }
};

debugCompany();
