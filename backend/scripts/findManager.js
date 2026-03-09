const mongoose = require('mongoose');
const User = require('../models/User');
require('dotenv').config();

const findOrCreateManager = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB...\n');

        // Find manager
        let manager = await User.findOne({ role: 'manager' });

        if (!manager) {
            console.log('❌ Manager not found. Creating new manager...\n');

            // Create manager
            manager = await User.create({
                firstName: 'Manager',
                lastName: 'User',
                email: 'manager@hustlesystem.com',
                password: 'Manager@2024',
                role: 'manager',
                phoneNumber: '+91-9876543210',
                dateOfBirth: new Date('1990-01-01'),
                department: 'Management',
                isActive: true,
                isPasswordChanged: false
            });

            console.log('✅ Manager created successfully!\n');
        }

        // Display manager credentials
        console.log('='.repeat(80));
        console.log('\n📋 MANAGER CREDENTIALS:\n');
        console.log(`👤 Name: ${manager.firstName} ${manager.lastName}`);
        console.log(`📧 Email: ${manager.email}`);
        console.log(`🔑 Password: ${manager.originalPassword || 'Manager@2024'}`);
        console.log(`👔 Role: ${manager.role}`);
        console.log(`🆔 Employee ID: ${manager.employeeId || 'Will be auto-generated'}`);
        console.log(`🏢 Department: ${manager.department}`);
        console.log('\n' + '='.repeat(80));

    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await mongoose.disconnect();
        process.exit(0);
    }
};

findOrCreateManager();
