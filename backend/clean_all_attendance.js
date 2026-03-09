const mongoose = require('mongoose');

mongoose.connect('mongodb://127.0.0.1:27017/husl_os')
  .then(async () => {
    console.log('✅ Connected to MongoDB\n');
    
    const db = mongoose.connection.db;
    
    // Delete all attendance records
    const result = await db.collection('attendances').deleteMany({});
    console.log(`🗑️  Deleted ${result.deletedCount} attendance records\n`);
    
    // Also delete users if needed
    const userCount = await db.collection('users').countDocuments({});
    console.log(`👥 Users in database: ${userCount}`);
    
    console.log('✅ Cleanup complete!');
    mongoose.disconnect();
  })
  .catch(err => {
    console.error('❌ Error:', err);
    mongoose.disconnect();
  });
