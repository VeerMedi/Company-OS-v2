const mongoose = require('mongoose');

const handbookSchema = new mongoose.Schema({
  department: {
    type: String,
    enum: ['development', 'sales', 'hr', 'operations', 'general'],
    required: true,
    index: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  subtitle: {
    type: String,
    trim: true
  },
  
  // Structure
  sections: [{
    sectionId: {
      type: String,
      required: true
    },
    title: {
      type: String,
      required: true
    },
    content: {
      type: String,  // Rich text (HTML or Markdown)
      required: true
    },
    order: {
      type: Number,
      required: true
    },
    
    // Metadata
    principles: [String],  // Optional key principles
    tags: [String],  // For search
    
    // Visibility
    visibleToRoles: [{
      type: String,
      enum: ['all', 'ceo', 'hr', 'manager', 'individual', 'developer', 'sales', 'operations'],
      default: 'all'
    }],
    
    lastEditedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    lastEditedAt: {
      type: Date,
      default: Date.now
    }
  }],
  
  // Approval workflow
  status: {
    type: String,
    enum: ['draft', 'pending_approval', 'approved', 'published', 'archived'],
    default: 'draft',
    index: true
  },
  
  // Publication
  currentVersion: {
    type: Number,
    default: 1
  },
  publishedAt: Date,
  publishedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  
  // Management
  managedBy: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  
  // Approval
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  approvedAt: Date,
  approvalNotes: String,
  
  // Escalation
  escalationContact: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  
  // RAG sync status
  lastSyncedToRAG: Date,
  ragSyncStatus: {
    type: String,
    enum: ['synced', 'pending', 'failed', 'not_required'],
    default: 'pending'
  },
  ragSyncError: String
}, {
  timestamps: true
});

// Indexes for performance
handbookSchema.index({ department: 1, status: 1 });
handbookSchema.index({ 'sections.tags': 1 });
handbookSchema.index({ createdAt: -1 });

// Methods
handbookSchema.methods.createVersion = async function() {
  const HandbookVersion = mongoose.model('HandbookVersion');
  
  const version = await HandbookVersion.create({
    handbookId: this._id,
    versionNumber: this.currentVersion,
    snapshot: {
      title: this.title,
      subtitle: this.subtitle,
      sections: this.sections,
      department: this.department
    },
    changedBy: this.lastEditedBy || this.createdBy,
    createdAt: new Date()
  });
  
  return version;
};

handbookSchema.methods.canBeEditedBy = function(userId, userRole) {
  // CEOs and HR can edit any handbook
  if (['ceo', 'hr'].includes(userRole)) {
    return true;
  }
  
  // Check if user is a manager for this handbook
  return this.managedBy.some(managerId => managerId.toString() === userId.toString());
};

handbookSchema.methods.canBeApprovedBy = function(userRole) {
  return ['ceo', 'hr'].includes(userRole);
};

module.exports = mongoose.model('Handbook', handbookSchema);
