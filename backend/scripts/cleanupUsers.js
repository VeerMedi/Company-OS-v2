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

const cleanupUsers = async () => {
  try {
    console.log('\n🧹 Cleaning up users...\n');

    // Remove Rehman Dakait
    const rehmanResult = await User.deleteOne({ email: 'rehman@hustle.com' });
    console.log(`✓ Removed Rehman Dakait: ${rehmanResult.deletedCount} user deleted`);

    // Remove old team lead  
    const oldTeamLeadResult = await User.deleteOne({ email: 'sourabh.tl@hustle.com', lastName: 'Dakait' });
    console.log(`✓ Removed old team lead: ${oldTeamLeadResult.deletedCount} user deleted`);

    // Remove all users with 'individual' role
    const individualResult = await User.deleteMany({ role: 'individual' });
    console.log(`✓ Removed individual role users: ${individualResult.deletedCount} users deleted`);

    // List remaining users
    const remainingUsers = await User.find({ isActive: true })
      .select('firstName lastName email role designation specializations')
      .lean();

    console.log('\n📋 Remaining active users:');
    console.log('════════════════════════════════════════════════════════════');
    remainingUsers.forEach(user => {
      const specs = user.specializations ? ` (${user.specializations.join(', ')})` : '';
      console.log(`${user.firstName} ${user.lastName} - ${user.role} - ${user.email}${specs}`);
    });

    console.log('\n✅ Cleanup completed successfully!\n');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error during cleanup:', error);
    process.exit(1);
  }
};

// Run the cleanup function
(async () => {
  await connectDB();
  await cleanupUsers();
})();
