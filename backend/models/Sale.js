const mongoose = require('mongoose');

const saleSchema = new mongoose.Schema({
  // Company Reference (if created from a company submission)
  company: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company'
  },
  
  // Client Information
  clientName: {
    type: String,
    required: [true, 'Client name is required'],
    trim: true
  },
  clientEmail: {
    type: String,
    required: [true, 'Client email is required'],
    lowercase: true,
    match: [
      /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
      'Please enter a valid email'
    ]
  },
  clientPhone: {
    type: String,
    required: [true, 'Client phone is required'],
    trim: true
  },
  clientCompany: {
    type: String,
    trim: true
  },
  clientAddress: {
    type: String,
    trim: true
  },
  
  // Lead Information
  leadSource: {
    type: String,
    enum: ['website', 'referral', 'cold-call', 'social-media', 'event', 'partner', 'other'],
    default: 'website'
  },
  leadType: {
    type: String,
    enum: ['hot', 'warm', 'cold'],
    default: 'warm'
  },
  
  // Service Details
  serviceType: {
    type: String,
    required: [true, 'Service type is required'],
    trim: true
  },
  serviceDescription: {
    type: String,
    trim: true
  },
  
  // Financial Details
  estimatedValue: {
    type: Number,
    required: [true, 'Estimated value is required'],
    min: [0, 'Estimated value cannot be negative']
  },
  actualValue: {
    type: Number,
    default: 0,
    min: [0, 'Actual value cannot be negative']
  },
  currency: {
    type: String,
    default: 'INR',
    enum: ['INR', 'USD', 'EUR', 'GBP']
  },
  
  // Sales Process
  stage: {
    type: String,
    enum: ['lead', 'qualified', 'proposal', 'negotiation', 'closed-won', 'closed-lost'],
    default: 'lead'
  },
  status: {
    type: String,
    enum: ['active', 'on-hold', 'won', 'lost'],
    default: 'active'
  },
  probability: {
    type: Number,
    default: 50,
    min: 0,
    max: 100
  },
  
  // Assignment
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Sales representative is required']
  },
  headOfSales: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  
  // Timeline
  contactDate: {
    type: Date,
    default: Date.now
  },
  expectedCloseDate: {
    type: Date
  },
  actualCloseDate: {
    type: Date
  },
  
  // Follow-ups and Notes
  followUps: [{
    date: {
      type: Date,
      required: true
    },
    notes: {
      type: String,
      trim: true
    },
    nextAction: {
      type: String,
      trim: true
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  
  // Stage Proofs - Evidence for moving between pipeline stages
  stageProofs: [{
    fromStage: {
      type: String,
      enum: ['lead', 'qualified', 'proposal', 'negotiation', 'closed-won', 'closed-lost'],
      required: true
    },
    toStage: {
      type: String,
      enum: ['lead', 'qualified', 'proposal', 'negotiation', 'closed-won', 'closed-lost'],
      required: true
    },
    proofType: {
      type: String,
      enum: ['call-summary', 'meeting-summary', 'email-thread', 'proposal-sent', 'contract-signed', 'other'],
      required: true
    },
    proofSummary: {
      type: String,
      required: true,
      trim: true
    },
    proofLink: {
      type: String,
      trim: true
    },
    proofDocument: {
      name: String,
      path: String,
      uploadedAt: {
        type: Date,
        default: Date.now
      }
    },
    submittedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    submittedAt: {
      type: Date,
      default: Date.now
    }
  }],
  
  // Documents
  documents: [{
    name: {
      type: String,
      required: true
    },
    url: {
      type: String,
      required: true
    },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  
  // Activity Log
  activities: [{
    action: {
      type: String,
      required: true
    },
    description: {
      type: String
    },
    performedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    timestamp: {
      type: Date,
      default: Date.now
    }
  }],
  
  // Additional Notes
  notes: {
    type: String,
    trim: true
  },
  
  // Metadata
  isDeleted: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Indexes for better query performance
saleSchema.index({ assignedTo: 1, stage: 1 });
saleSchema.index({ headOfSales: 1, status: 1 });
saleSchema.index({ stage: 1, status: 1 });
saleSchema.index({ expectedCloseDate: 1 });
saleSchema.index({ clientEmail: 1 });

// Add activity log entry before save
saleSchema.pre('save', function(next) {
  if (this.isNew) {
    this.activities.push({
      action: 'created',
      description: 'Lead created',
      performedBy: this.assignedTo,
      timestamp: new Date()
    });
  }
  next();
});

const Sale = mongoose.model('Sale', saleSchema);

module.exports = Sale;
