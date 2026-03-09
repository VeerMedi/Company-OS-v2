const mongoose = require('mongoose');
const Project = require('../models/Project');
const Company = require('../models/Company');
const User = require('../models/User');
require('dotenv').config();

const seedSampleData = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB...');

        // Find CEO user
        const ceoUser = await User.findOne({ role: 'ceo' });
        if (!ceoUser) {
            console.log('❌ No CEO found. Please run seedCEO.js first.');
            process.exit(1);
        }

        // Sample Projects
        const sampleProjects = [
            {
                name: 'Office Furniture Package - TechCorp',
                description: 'Complete office furniture setup for 50 employees including desks, chairs, and storage units',
                status: 'in-progress',
                progress: 65,
                deadline: new Date('2026-03-15'),
                assignedManager: ceoUser._id,
                createdBy: ceoUser._id
            },
            {
                name: 'Residential Modular Kitchen - Villa Heights',
                description: 'Premium modular kitchen with island counter, granite countertops, and modern appliances',
                status: 'not-started',
                progress: 35,
                deadline: new Date('2026-02-28'),
                assignedManager: ceoUser._id,
                createdBy: ceoUser._id
            },
            {
                name: 'Corporate Conference Room Setup',
                description: 'Executive conference room with custom tables, executive chairs, and AV equipment setup',
                status: 'completed',
                progress: 100,
                deadline: new Date('2025-12-20'),
                assignedManager: ceoUser._id,
                createdBy: ceoUser._id
            }
        ];

        // Sample Companies
        const sampleCompanies = [
            {
                companyName: 'TechCorp Solutions Pvt Ltd',
                industry: 'Information Technology',
                location: { city: 'Mumbai', country: 'India' },
                website: 'https://techcorp.example.com',
                approvalStatus: 'approved',
                status: 'active',
                identifiedBy: ceoUser._id,
                isDeleted: false
            },
            {
                companyName: 'Villa Heights Developers',
                industry: 'Real Estate',
                location: { city: 'Delhi', country: 'India' },
                website: 'https://villaheights.example.com',
                approvalStatus: 'approved',
                status: 'active',
                identifiedBy: ceoUser._id,
                isDeleted: false
            },
            {
                companyName: 'Global Enterprises Inc',
                industry: 'Manufacturing',
                location: { city: 'Bangalore', country: 'India' },
                website: 'https://global-ent.example.com',
                approvalStatus: 'pending',
                status: 'identified',
                identifiedBy: ceoUser._id,
                isDeleted: false
            },
            {
                companyName: 'Skyline Properties',
                industry: 'Real Estate',
                location: { city: 'Pune', country: 'India' },
                approvalStatus: 'approved',
                status: 'active',
                identifiedBy: ceoUser._id,
                isDeleted: false
            }
        ];

        // Clear existing
        await Project.deleteMany({});
        await Company.deleteMany({});

        // Insert
        const projects = await Project.insertMany(sampleProjects);
        const companies = await Company.insertMany(sampleCompanies);

        console.log(`✅ Successfully seeded:`);
        console.log(`   - ${projects.length} Projects`);
        console.log(`   - ${companies.length} Companies`);
        console.log('\n📊 Sample data ready for dashboards!');

    } catch (error) {
        console.error('❌ Error seeding data:', error);
    } finally {
        await mongoose.disconnect();
        process.exit(0);
    }
};

if (require.main === module) {
    seedSampleData();
}

module.exports = seedSampleData;
