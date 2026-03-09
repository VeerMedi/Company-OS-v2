const mongoose = require('mongoose');
const User = require('../models/User');
require('dotenv').config();

const assignMenteesToDevelopers = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    //Get developers and interns
    const veer = await User.findOne({ email: 'veer@hustle.com' });
    const krishna = await User.findOne({ email: 'krishna.mehra@hustle.com' });
    const rahul = await User.findOne({ email: 'rahul.nema@hustle.com' });
    const mohit = await User.findOne({ email: 'mohit.sharma@hustle.com' });

    if (!veer || !krishna || !rahul || !mohit) {
      console.log('❌ Some users not found');
      process.exit(1);
    }

    console.log('📋 Current Setup:');
    console.log('Developers:');
    console.log('  - Veer Singh (DEV003)');
    console.log('  - Krishna Mehra (DEV002)');
    console.log('\nInterns:');
    console.log('  - Rahul Nema (INT001)');
    console.log('  - Mohit Sharma (INT002)');
    console.log('');

    // Assign Rahul to Veer as mentee
    veer.mentorFor = [rahul._id];
    await veer.save();
    console.log('✅ Assigned Rahul Nema as mentee to Veer Singh');

    // Assign Mohit to Krishna as mentee  
    krishna.mentorFor = [mohit._id];
    await krishna.save();
    console.log('✅ Assigned Mohit Sharma as mentee to Krishna Mehra');

    // Verify
    console.log('\n📊 Final Mentorship Structure:');
    const updatedVeer = await User.findById(veer._id).populate('mentorFor', 'firstName lastName email role');
    const updatedKrishna = await User.findById(krishna._id).populate('mentorFor', 'firstName lastName email role');

    console.log('\n👤 Veer Singh (Developer):');
    console.log('   Mentees:', updatedVeer.mentorFor.map(m => `${m.firstName} ${m.lastName} (${m.role})`).join(', '));

    console.log('\n👤 Krishna Mehra (Developer):');
    console.log('   Mentees:', updatedKrishna.mentorFor.map(m => `${m.firstName} ${m.lastName} (${m.role})`).join(', '));

    console.log('\n✨ Mentorship assignments complete!\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
};

assignMenteesToDevelopers();
