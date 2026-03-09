const mongoose = require('mongoose');
const Attendance = require('./models/Attendance');
require('dotenv').config();

const deleteRecentImports = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/hustle-system', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('✅ Connected to MongoDB');

    // Get date range for last 7 days
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    console.log(`\n📅 Checking records from ${sevenDaysAgo.toDateString()} to ${today.toDateString()}`);

    // Find all attendance records created in last 7 days
    const recentRecords = await Attendance.find({
      createdAt: {
        $gte: sevenDaysAgo,
        $lte: today
      }
    });

    console.log(`\n📊 Found ${recentRecords.length} attendance records created today`);

    if (recentRecords.length === 0) {
      console.log('❌ No records found to delete');
      process.exit(0);
    }

    // Show sample records
    console.log('\n🔍 Sample records to be deleted:');
    recentRecords.slice(0, 10).forEach((record, i) => {
      console.log(`${i + 1}. Employee ID: ${record.employee} | Date: ${record.date.toISOString().split('T')[0]} | Status: ${record.status} | Created: ${record.createdAt.toLocaleString()}`);
    });

    // Ask for confirmation (auto-confirm in script)
    console.log(`\n⚠️  About to delete ${recentRecords.length} records...`);

    // Delete the records
    const result = await Attendance.deleteMany({
      createdAt: {
        $gte: sevenDaysAgo,
        $lte: today
      }
    });

    console.log(`\n✅ Successfully deleted ${result.deletedCount} attendance records!`);
    console.log('🎯 All recent imported records (last 7 days) have been removed.');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 MongoDB connection closed');
    process.exit(0);
  }
};

// Run the script
deleteRecentImports();
