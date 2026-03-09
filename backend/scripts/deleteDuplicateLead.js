/**
 * Delete Duplicate Lead Script
 * Finds and deletes duplicate leads by name
 */

const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const Lead = require('../models/Lead');
const Company = require('../models/Company');

async function deleteDuplicateLead() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    
    const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI;
    
    if (!mongoUri) {
      console.error('❌ MongoDB URI not found in environment variables');
      process.exit(1);
    }
    
    await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    
    console.log('✅ Connected to MongoDB');
    console.log('');

    // Find all leads with name "Elite Consultants"
    const leadName = 'Elite Consultants';
    const duplicateLeads = await Lead.find({
      name: { $regex: new RegExp(`^${leadName}$`, 'i') },
      isDeleted: false
    })
    .populate('company', 'companyName')
    .sort({ createdAt: 1 }); // Oldest first

    console.log(`🔍 Found ${duplicateLeads.length} leads with name "${leadName}"`);
    console.log('');

    if (duplicateLeads.length === 0) {
      console.log('ℹ️  No leads found with that name');
      await mongoose.connection.close();
      process.exit(0);
    }

    // Display all found leads
    duplicateLeads.forEach((lead, index) => {
      console.log(`\n${index + 1}. Lead ID: ${lead._id}`);
      console.log(`   Name: ${lead.name}`);
      console.log(`   Designation: ${lead.designation || 'N/A'}`);
      console.log(`   Company: ${lead.company ? lead.company.companyName : 'N/A'}`);
      console.log(`   Email: ${lead.email || 'N/A'}`);
      console.log(`   Stage: ${lead.stage}`);
      console.log(`   Created: ${lead.createdAt}`);
    });

    console.log('\n');

    if (duplicateLeads.length > 1) {
      // Keep the oldest one, delete the rest
      const toKeep = duplicateLeads[0];
      const toDelete = duplicateLeads.slice(1);

      console.log(`📌 Keeping: Lead ID ${toKeep._id} (oldest, created ${toKeep.createdAt})`);
      console.log(`🗑️  Deleting ${toDelete.length} duplicate(s):`);
      
      for (const lead of toDelete) {
        console.log(`   - Lead ID: ${lead._id} (created ${lead.createdAt})`);
        
        // Soft delete
        lead.isDeleted = true;
        lead.deletedAt = new Date();
        await lead.save();
      }

      console.log('');
      console.log(`✅ Successfully deleted ${toDelete.length} duplicate lead(s)`);
      console.log(`✅ Kept original lead: ${toKeep.name} (ID: ${toKeep._id})`);
    } else {
      console.log('ℹ️  Only one lead found, no duplicates to delete');
    }

    await mongoose.connection.close();
    console.log('');
    console.log('✅ Database connection closed');
    console.log('🎉 Operation completed successfully!');

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

// Run the script
deleteDuplicateLead();
