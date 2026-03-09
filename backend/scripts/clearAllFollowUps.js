/**
 * Clear All Follow-Ups Script
 * Removes all follow-ups from all leads in the database
 * Keeps leads, companies, and all other data intact
 */

const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

// Import models
const Lead = require('../models/Lead');

async function clearAllFollowUps() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    
    // Try both environment variable names
    const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI;
    
    if (!mongoUri) {
      console.error('❌ MongoDB URI not found in environment variables');
      console.log('Please set MONGODB_URI or MONGO_URI in your .env file');
      process.exit(1);
    }
    
    // Connect to MongoDB
    await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    
    console.log('✅ Connected to MongoDB');
    console.log('');

    // Count leads with follow-ups before deletion
    const leadsWithFollowUps = await Lead.countDocuments({
      'followUps.0': { $exists: true }
    });

    if (leadsWithFollowUps === 0) {
      console.log('ℹ️  No follow-ups found in the database');
      await mongoose.connection.close();
      console.log('');
      console.log('✅ Database connection closed');
      process.exit(0);
    }

    console.log(`📊 Found ${leadsWithFollowUps} leads with follow-ups`);
    console.log('');
    console.log('🗑️  Starting follow-up deletion process...');
    console.log('');

    // Count total follow-ups
    const allLeads = await Lead.find({ 'followUps.0': { $exists: true } });
    let totalFollowUps = 0;
    allLeads.forEach(lead => {
      totalFollowUps += lead.followUps.length;
    });

    console.log(`📝 Total follow-ups to delete: ${totalFollowUps}`);
    console.log('');

    // Delete all follow-ups from all leads
    const result = await Lead.updateMany(
      {},
      { $set: { followUps: [] } }
    );

    console.log('✅ Follow-ups deletion complete!');
    console.log('');
    console.log('📊 Deletion Summary:');
    console.log(`   - Leads updated: ${result.modifiedCount}`);
    console.log(`   - Total follow-ups deleted: ${totalFollowUps}`);
    console.log('');

    // Verify deletion
    const remainingFollowUps = await Lead.countDocuments({
      'followUps.0': { $exists: true }
    });

    if (remainingFollowUps === 0) {
      console.log('✅ Verification: All follow-ups successfully deleted');
    } else {
      console.log(`⚠️  Warning: ${remainingFollowUps} leads still have follow-ups`);
    }

    // Close connection
    await mongoose.connection.close();
    console.log('');
    console.log('✅ Database connection closed');
    console.log('');
    console.log('🎉 Operation completed successfully!');

  } catch (error) {
    console.error('❌ Error clearing follow-ups:', error);
    process.exit(1);
  }
}

// Run the script
clearAllFollowUps();
