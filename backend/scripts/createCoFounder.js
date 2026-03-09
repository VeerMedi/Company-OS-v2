const mongoose = require('mongoose');
const User = require('../models/User');
require('dotenv').config();

const createCoFounder = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB...\n');

        // Check if Co-Founder already exists
        const existingCoFounder = await User.findOne({ email: 'cofounder@hustlesystem.com' });
        if (existingCoFounder) {
            console.log('❌ Co-Founder user already exists!');
            console.log('📧 Email:', existingCoFounder.email);
            console.log('👔 Role:', existingCoFounder.role);
            console.log('\nPlease use existing Co-Founder user or delete it first.');
            process.exit(0);
        }

        // Create Co-Founder user
        const coFounderData = {
            firstName: 'Co-Founder',
            lastName: 'User',
            email: 'cofounder@hustlesystem.com',
            password: 'CoFounder@123',
            role: 'co-founder',
            phoneNumber: '+91-8888888888',
            dateOfBirth: new Date('1985-01-01'),
            department: 'Executive',
            isActive: true,
            isPasswordChanged: true
        };

        const coFounder = await User.create(coFounderData);

        console.log('✅ Co-Founder user created successfully!\n');
        console.log('='.repeat(80));
        console.log('\n📋 CO-FOUNDER USER CREDENTIALS:\n');
        console.log(`👤 Name: ${coFounder.firstName} ${coFounder.lastName}`);
        console.log(`📧 Email: ${coFounder.email}`);
        console.log(`🔑 Password: CoFounder@123`);
        console.log(`👔 Role: ${coFounder.role}`);
        console.log(`🆔 Employee ID: ${coFounder.employeeId}`);
        console.log(`🏢 Department: ${coFounder.department}`);
        console.log('\n' + '='.repeat(80));
        console.log('\n🚀 You can now login and access Co-Founder Dashboard!');
        console.log('\n📊 Co-Founder Dashboard Features:');
        console.log('   - Project Management');
        console.log('   - Revenue & Sales Tracking');
        console.log('   - Attendance Management');
        console.log('   - Leave Approval');
        console.log('   - Analytics Dashboard');
        console.log('   - AI Automation');

    } catch (error) {
        console.error('❌ Error creating Co-Founder user:', error.message);
    } finally {
        await mongoose.disconnect();
        process.exit(0);
    }
};

createCoFounder();
