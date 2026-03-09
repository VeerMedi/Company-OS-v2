const mongoose = require('mongoose');
const User = require('../models/User');
require('dotenv').config();

const setupOrgHierarchy = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Get all users
    const ceo = await User.findOne({ email: 'ceo@hustlesystem.com' });
    const cofounder = await User.findOne({ email: 'cofounder@hustlesystem.com' });
    const manager = await User.findOne({ email: 'manager@hustlesystem.com' });
    const teamLead = await User.findOne({ email: 'sourabh.tl@hustle.com' });
    const veer = await User.findOne({ email: 'veer@hustle.com' });
    const krishna = await User.findOne({ email: 'krishna.mehra@hustle.com' });
    const rahul = await User.findOne({ email: 'rahul.nema@hustle.com' });
    const mohit = await User.findOne({ email: 'mohit.sharma@hustle.com' });

    console.log('🏗️  Setting up organizational hierarchy...\n');

    // Update Employee IDs to standard format
    ceo.employeeId = 'CEO001';
    ceo.firstName = 'Chief';
    ceo.lastName = 'Executive';
    ceo.password = 'krishna123';
    ceo.isPasswordChanged = false;
    ceo.isActive = true;
    ceo.reportingTo = null; // CEO reports to no one
    await ceo.save();
    console.log('✅ CEO - CEO001 - No reporting (top level)');

    cofounder.employeeId = 'CF001';
    cofounder.firstName = 'Co-Founder';
    cofounder.lastName = 'User';
    cofounder.password = 'krishna123';
    cofounder.isPasswordChanged = false;
    cofounder.isActive = true;
    cofounder.reportingTo = ceo._id; // Reports to CEO
    await cofounder.save();
    console.log('✅ Co-Founder - CF001 - Reports to: CEO');

    manager.employeeId = 'MGR001';
    manager.firstName = 'Manager';
    manager.lastName = 'User';
    manager.password = 'krishna123';
    manager.isPasswordChanged = false;
    manager.isActive = true;
    manager.reportingTo = cofounder._id; // Reports to Co-founder
    await manager.save();
    console.log('✅ Manager - MGR001 - Reports to: Co-Founder');

    teamLead.employeeId = 'TL001';
    teamLead.firstName = 'Sourabh';
    teamLead.lastName = 'Singh';
    teamLead.password = 'krishna123';
    teamLead.isPasswordChanged = false;
    teamLead.isActive = true;
    teamLead.reportingTo = manager._id; // Reports to Manager
    await teamLead.save();
    console.log('✅ Team Lead - TL001 - Reports to: Manager');

    veer.employeeId = 'DEV001';
    veer.firstName = 'Veer';
    veer.lastName = 'Singh';
    veer.password = 'krishna123';
    veer.isPasswordChanged = false;
    veer.isActive = true;
    veer.reportingTo = teamLead._id; // Reports to Team Lead
    veer.mentorFor = [rahul._id]; // Mentors Rahul
    await veer.save();
    console.log('✅ Developer (Veer) - DEV001 - Reports to: Team Lead - Mentors: Rahul');

    krishna.employeeId = 'DEV002';
    krishna.firstName = 'Krishna';
    krishna.lastName = 'Mehra';
    krishna.password = 'krishna123';
    krishna.isPasswordChanged = false;
    krishna.isActive = true;
    krishna.reportingTo = teamLead._id; // Reports to Team Lead
    krishna.mentorFor = [mohit._id]; // Mentors Mohit
    await krishna.save();
    console.log('✅ Developer (Krishna) - DEV002 - Reports to: Team Lead - Mentors: Mohit');

    rahul.employeeId = 'INT001';
    rahul.firstName = 'Rahul';
    rahul.lastName = 'Nema';
    rahul.password = 'krishna123';
    rahul.isPasswordChanged = false;
    rahul.isActive = true;
    rahul.reportingTo = veer._id; // Reports to Veer (mentor)
    await rahul.save();
    console.log('✅ Intern (Rahul) - INT001 - Reports to: Veer (mentor)');

    mohit.employeeId = 'INT002';
    mohit.firstName = 'Mohit';
    mohit.lastName = 'Sharma';
    mohit.password = 'krishna123';
    mohit.isPasswordChanged = false;
    mohit.isActive = true;
    mohit.reportingTo = krishna._id; // Reports to Krishna (mentor)
    await mohit.save();
    console.log('✅ Intern (Mohit) - INT002 - Reports to: Krishna (mentor)');

    console.log('\n' + '='.repeat(80));
    console.log('🎯 ORGANIZATIONAL HIERARCHY COMPLETE');
    console.log('='.repeat(80));
    console.log('\n📊 Structure:');
    console.log('CEO (Chief Executive)');
    console.log(' └─ Co-Founder (Co-Founder User)');
    console.log('     └─ Manager (Manager User)');
    console.log('         └─ Team Lead (Sourabh Singh)');
    console.log('             ├─ Developer: Veer Singh (DEV001)');
    console.log('             │   └─ Intern: Rahul Nema (INT001) [mentee]');
    console.log('             └─ Developer: Krishna Mehra (DEV002)');
    console.log('                 └─ Intern: Mohit Sharma (INT002) [mentee]');
    console.log('\n✨ All users configured with password: krishna123\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
    throw error;
  } finally {
    await mongoose.disconnect();
  }
};

// Run if called directly
if (require.main === module) {
  setupOrgHierarchy().then(() => process.exit(0)).catch(err => {
    console.error(err);
    process.exit(1);
  });
}

module.exports = setupOrgHierarchy;
