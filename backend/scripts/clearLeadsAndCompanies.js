require('dotenv').config();
const mongoose = require('mongoose');

// Import models
const Company = require('../models/Company');
const Lead = require('../models/Lead');

const clearLeadsAndCompanies = async () => {
  try {
    console.log('Connecting to database...');
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to MongoDB\n');

    console.log('🧹 Starting cleanup of Leads and Companies...\n');

    // Count documents before deletion
    const leadCount = await Lead.countDocuments();
    const companyCount = await Company.countDocuments();

    console.log(`📊 Current counts:`);
    console.log(`   - Leads: ${leadCount}`);
    console.log(`   - Companies: ${companyCount}\n`);

    // Delete all leads
    console.log('🗑️  Deleting all leads...');
    await Lead.deleteMany({});
    console.log(`✅ Deleted ${leadCount} leads\n`);

    // Delete all companies
    console.log('🗑️  Deleting all companies...');
    await Company.deleteMany({});
    console.log(`✅ Deleted ${companyCount} companies\n`);

    // Verify deletion
    const remainingLeads = await Lead.countDocuments();
    const remainingCompanies = await Company.countDocuments();

    console.log('📊 Final counts:');
    console.log(`   - Leads: ${remainingLeads}`);
    console.log(`   - Companies: ${remainingCompanies}\n`);

    if (remainingLeads === 0 && remainingCompanies === 0) {
      console.log('✅ Successfully cleared all leads and companies!');
    } else {
      console.log('⚠️  Warning: Some documents may not have been deleted');
    }

  } catch (error) {
    console.error('❌ Error clearing database:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Database connection closed');
    process.exit(0);
  }
};

// Run the script
clearLeadsAndCompanies();
