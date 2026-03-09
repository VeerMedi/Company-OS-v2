const mongoose = require('mongoose');

const revenueTargetSchema = new mongoose.Schema({
  // Set by Co-Founder
  setBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User', // Head of Sales
    required: true
  },
  
  // Target Details
  targetPeriod: {
    type: String,
    enum: ['monthly', 'quarterly', 'half-yearly', 'yearly'],
    required: true
  },
  // For monthly targets - store month and year
  targetMonth: {
    type: Number, // 1-12 (January-December)
    min: 1,
    max: 12
  },
  targetYear: {
    type: Number,
    min: 2020,
    max: 2100
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  },
  
  // Financial Target
  targetAmount: {
    type: Number,
    required: true,
    min: 0
  },
  achievedAmount: {
    type: Number,
    default: 0,
    min: 0
  },
  currency: {
    type: String,
    default: 'INR',
    enum: ['INR', 'USD', 'EUR', 'GBP']
  },
  
  // Status
  status: {
    type: String,
    enum: ['pending', 'approved', 'in-progress', 'completed', 'expired'],
    default: 'pending'
  },
  
  // Head of Sales Response
  hosResponse: {
    status: {
      type: String,
      enum: ['pending', 'accepted', 'negotiating', 'rejected'],
      default: 'pending'
    },
    message: String,
    respondedAt: Date
  },
  
  // Strategy proposed by HOS
  strategy: {
    targetLocations: [{
      location: String,
      targetAmount: Number,
      reasoning: String,
      assignedReps: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      }]
    }],
    expectedCompanies: Number,
    expectedLeads: Number,
    proposedAt: Date,
    approvedByCoFounder: {
      type: Boolean,
      default: false
    },
    coFounderFeedback: String
  },
  
  // Progress Tracking
  progressPercentage: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  
  // Notes and Communication
  notes: String,
  
  // Activity Timeline
  activities: [{
    action: String,
    description: String,
    performedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    timestamp: {
      type: Date,
      default: Date.now
    }
  }]
}, {
  timestamps: true
});

// Indexes
revenueTargetSchema.index({ setBy: 1, status: 1 });
revenueTargetSchema.index({ assignedTo: 1, status: 1 });
revenueTargetSchema.index({ startDate: 1, endDate: 1 });

// Calculate progress before save
revenueTargetSchema.pre('save', function(next) {
  if (this.targetAmount > 0) {
    this.progressPercentage = Math.min(
      Math.round((this.achievedAmount / this.targetAmount) * 100),
      100
    );
  }
  
  // Check if expired
  if (this.endDate < new Date() && this.status === 'in-progress') {
    this.status = 'expired';
  }
  
  // Update status based on achievement
  if (this.progressPercentage >= 100 && this.status === 'in-progress') {
    this.status = 'completed';
  }
  
  next();
});

const RevenueTarget = mongoose.model('RevenueTarget', revenueTargetSchema);

module.exports = RevenueTarget;
