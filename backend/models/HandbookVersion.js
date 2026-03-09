const mongoose = require('mongoose');

const handbookVersionSchema = new mongoose.Schema({
  handbookId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Handbook',
    required: true,
    index: true
  },
  
  versionNumber: {
    type: Number,
    required: true
  },
  
  // Snapshot of handbook at this version
  snapshot: {
    title: String,
    subtitle: String,
    sections: [{
      sectionId: String,
      title: String,
      content: String,
      order: Number,
      principles: [String],
      tags: [String],
      visibleToRoles: [String]
    }],
    department: String
  },
  
  // Change tracking
  changesSummary: String,  // Human-readable summary of changes
  changedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // Approval
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  approvedAt: Date,
  approvalNotes: String,
  
  // Publishing
  publishedAt: Date,
  publishedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  
  // Metadata
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Compound index for version lookup
handbookVersionSchema.index({ handbookId: 1, versionNumber: -1 });

// Statics
handbookVersionSchema.statics.getLatestVersion = async function(handbookId) {
  return this.findOne({ handbookId })
    .sort({ versionNumber: -1 })
    .limit(1);
};

handbookVersionSchema.statics.getAllVersions = async function(handbookId) {
  return this.find({ handbookId })
    .sort({ versionNumber: -1 })
    .populate('changedBy', 'firstName lastName email')
    .populate('approvedBy', 'firstName lastName email')
    .populate('publishedBy', 'firstName lastName email');
};

module.exports = mongoose.model('HandbookVersion', handbookVersionSchema);
