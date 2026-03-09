const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('../models/User');

dotenv.config();

const updateDeveloperTest = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/hustle-system', {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('✅ MongoDB connected\n');

    // Find developer test user
    const devTest = await User.findOne({ 
      $or: [
        { firstName: 'developer', lastName: 'test' },
        { email: { $regex: /developer.*test/i } }
      ]
    });

    if (!devTest) {
      console.log('❌ Developer test user not found');
      process.exit(1);
    }

    console.log('📊 Current State:');
    console.log(`   Name: ${devTest.firstName} ${devTest.lastName}`);
    console.log(`   Email: ${devTest.email}`);
    console.log(`   Role: ${devTest.role}`);
    console.log(`   Skills: ${devTest.skills || 'None'}`);
    console.log(`   JobCategory: ${devTest.jobCategory || 'None'}`);

    // Update with developer skills
    devTest.skills = ['React', 'JavaScript', 'Node.js', 'Full-Stack'];
    devTest.jobCategory = 'developer';
    await devTest.save();

    console.log('\n✅ Updated Developer Test User:');
    console.log(`   Skills: ${devTest.skills.join(', ')}`);
    console.log(`   JobCategory: ${devTest.jobCategory}`);

    // Also update Alice, Bob, Charlie if they exist
    const developers = await User.find({
      email: { $in: ['alice.frontend@test.com', 'bob.backend@test.com', 'charlie.fullstack@test.com'] }
    });

    console.log(`\n✅ Found ${developers.length} other developers`);
    for (const dev of developers) {
      console.log(`   - ${dev.firstName} ${dev.lastName}: Skills=${dev.skills?.join(', ') || 'None'}, JobCategory=${dev.jobCategory || 'None'}`);
    }

    console.log('\n🎉 Update complete!\n');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
};

updateDeveloperTest();
