const mongoose = require('mongoose');

const salesTargetSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required']
  },
  revenueTargetId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'RevenueTarget',
    required: false
  },
  targetPeriod: {
    type: String,
    enum: ['monthly', 'quarterly', 'half-yearly', 'yearly'],
    required: [true, 'Target period is required']
  },
  startDate: {
    type: Date,
    required: [true, 'Start date is required']
  },
  endDate: {
    type: Date,
    required: [true, 'End date is required']
  },
  
  // Financial Targets
  revenueTarget: {
    type: Number,
    required: [true, 'Revenue target is required'],
    min: [0, 'Revenue target cannot be negative']
  },
  revenueAchieved: {
    type: Number,
    default: 0,
    min: [0, 'Revenue achieved cannot be negative']
  },
  
  // Activity Targets - Sales Funnel: Companies → Leads → Conversions
  companiesTarget: {
    type: Number,
    default: 0,
    min: [0, 'Companies target cannot be negative']
  },
  companiesAchieved: {
    type: Number,
    default: 0,
    min: [0, 'Companies achieved cannot be negative']
  },
  
  leadsTarget: {
    type: Number,
    default: 0,
    min: [0, 'Leads target cannot be negative']
  },
  leadsAchieved: {
    type: Number,
    default: 0,
    min: [0, 'Leads achieved cannot be negative']
  },
  
  conversionsTarget: {
    type: Number,
    default: 0,
    min: [0, 'Conversions target cannot be negative']
  },
  conversionsAchieved: {
    type: Number,
    default: 0,
    min: [0, 'Conversions achieved cannot be negative']
  },
  
  // Status
  status: {
    type: String,
    enum: ['active', 'completed', 'expired'],
    default: 'active'
  },
  
  // Progress tracking
  progressPercentage: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  
  // Notes
  notes: {
    type: String,
    trim: true
  },
  
  // Created by (typically Head of Sales or CEO)
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

// Indexes
salesTargetSchema.index({ userId: 1, targetPeriod: 1, startDate: -1 });
salesTargetSchema.index({ status: 1 });

// Calculate progress percentage before save
salesTargetSchema.pre('save', function(next) {
  if (this.revenueTarget > 0) {
    this.progressPercentage = Math.min(
      Math.round((this.revenueAchieved / this.revenueTarget) * 100),
      100
    );
  }
  
  // Check if target period has expired
  if (this.endDate < new Date() && this.status === 'active') {
    this.status = 'expired';
  }
  
  next();
});

const SalesTarget = mongoose.model('SalesTarget', salesTargetSchema);

module.exports = SalesTarget;
