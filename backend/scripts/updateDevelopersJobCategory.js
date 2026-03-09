const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('../models/User');

// Load environment variables
dotenv.config();

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/hustle-system', {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('✅ MongoDB connected');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
};

const updateDevelopersJobCategory = async () => {
  try {
    console.log('🔄 Updating developers from Operations to Development...');

    // List of developer emails to update
    const developerEmails = [
      'rahul@hustle.com',
      'krishna@hustle.com',
      'veer@hustle.com',
      'mohit@hustle.com'
    ];

    // Update all specified users
    const result = await User.updateMany(
      { email: { $in: developerEmails } },
      { 
        $set: { 
          jobCategory: 'developer',
          department: 'Development'
        } 
      }
    );

    console.log(`✅ Updated ${result.modifiedCount} users`);

    // Display updated users
    const updatedUsers = await User.find({ 
      email: { $in: developerEmails } 
    }).select('firstName lastName email jobCategory department role');

    console.log('\n📋 Updated Users:');
    updatedUsers.forEach(user => {
      console.log(`   - ${user.firstName} ${user.lastName} (${user.email})`);
      console.log(`     Job Category: ${user.jobCategory}`);
      console.log(`     Department: ${user.department}`);
      console.log(`     Role: ${user.role}`);
    });

    console.log('\n🎉 Update complete!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error updating developers:', error);
    process.exit(1);
  }
};

// Run the update function
(async () => {
  await connectDB();
  await updateDevelopersJobCategory();
})();
