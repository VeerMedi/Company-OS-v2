const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('../models/User');

dotenv.config();

const checkVeerData = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/hustle-system');
    console.log('✅ Connected to MongoDB\n');

    const veer = await User.findOne({ email: 'veer@hustle.com' })
      .select('firstName lastName email role specializations skills');

    if (!veer) {
      console.log('❌ Veer not found!');
      process.exit(1);
    }

    console.log('📊 Veer Singh Data:');
    console.log('═══════════════════════════════════════');
    console.log(`Name: ${veer.firstName} ${veer.lastName}`);
    console.log(`Email: ${veer.email}`);
    console.log(`Role: ${veer.role}`);
    console.log(`\nSpecializations (${veer.specializations?.length || 0}):`);
    if (veer.specializations && veer.specializations.length > 0) {
      veer.specializations.forEach((spec, i) => console.log(`  ${i + 1}. ${spec}`));
    } else {
      console.log('  ⚠️  No specializations found!');
    }
    
    console.log(`\nSkills (${veer.skills?.length || 0}):`);
    if (veer.skills && veer.skills.length > 0) {
      veer.skills.forEach((skill, i) => console.log(`  ${i + 1}. ${skill}`));
    } else {
      console.log('  ⚠️  No skills found!');
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
};

checkVeerData();
