const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI;

mongoose.connect(mongoUri)
  .then(async () => {
    console.log('✅ Connected to MongoDB');
    console.log('🗑️  Dropping payrolls collection...');
    
    await mongoose.connection.db.collection('payrolls').drop().catch(() => {
      console.log('⚠️  Collection might not exist, continuing...');
    });
    
    console.log('✅ Collection dropped successfully!');
    process.exit(0);
  })
  .catch((err) => {
    console.error('❌ Error:', err);
    process.exit(1);
  });
