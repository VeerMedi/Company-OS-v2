const mongoose = require('mongoose');

const companySchema = new mongoose.Schema({
  // Company Information
  companyName: {
    type: String,
    required: [true, 'Company name is required'],
    trim: true
  },
  industry: {
    type: String,
    trim: true
  },
  website: String,
  
  // Location Details
  location: {
    city: String,
    state: String,
    country: {
      type: String,
      default: 'India'
    },
    address: String
  },
  
  // Company Size & Details
  employeeCount: {
    type: String,
    enum: ['1-10', '11-50', '51-200', '201-500', '501-1000', '1000+', 'unknown'],
    default: 'unknown'
  },
  revenue: {
    type: String,
    enum: ['<1Cr', '1-5Cr', '5-10Cr', '10-50Cr', '50-100Cr', '100Cr+', 'unknown'],
    default: 'unknown'
  },
  
  // Relationship Status
  status: {
    type: String,
    enum: ['identified', 'researching', 'approved', 'in-contact', 'rejected', 'on-hold'],
    default: 'identified'
  },
  
  // Potential & Priority
  potentialValue: {
    type: Number,
    default: 0,
    min: 0
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium'
  },
  
  // Assignment
  identifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User', // Sales Rep who found this company
    required: true
  },
  assignedHOS: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User' // Head of Sales selected for review
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User' // Head of Sales who approved
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User' // Sales Rep assigned to pursue
  },
  
  // Approval Workflow
  approvalStatus: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'needs-revision'],
    default: 'pending'
  },
  approvalNotes: String,
  approvalDate: Date,
  
  // Related Revenue Target
  revenueTarget: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'RevenueTarget'
  },
  
  // Authority/Decision Makers Count
  authorityCount: {
    type: Number,
    default: 0
  },
  
  // Company Research Notes
  research: {
    keyDecisionMakers: String,
    painPoints: String,
    competitors: String,
    budget: String,
    timeline: String,
    potentialServices: String,
    notes: String
  },

  // Additional detailed fields (imported/exported via CSV)
  overview: String, // Company overview / description
  geographicalHotspots: String,
  annualRevenueUSD: String,
  currentTechStack: String,
  automationSaaSUsed: String,
  expectedROIImpact: String,
  keyChallenges: String,
  howHustleHouseCanHelp: String,
  additionalNotes: String,
  wrtRoiPriorityLevel: String,
  proofOfConcept: String,
  latestNews: String,
  
  // Study Documents for approval workflow
  studyDocuments: [{
    name: {
      type: String,
      required: true
    },
    documentType: {
      type: String,
      enum: ['company-research', 'market-analysis', 'competitive-analysis', 'financial-report', 'other'],
      default: 'other'
    },
    url: String,
    filePath: String,
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    uploadedAt: {
      type: Date,
      default: Date.now
    },
    description: String
  }],
  
  // Activities
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
  }],
  
  // Soft Delete
  isDeleted: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Indexes
companySchema.index({ companyName: 1 });
companySchema.index({ identifiedBy: 1, approvalStatus: 1 });
companySchema.index({ assignedTo: 1, status: 1 });
companySchema.index({ 'location.city': 1, 'location.state': 1 });
companySchema.index({ revenueTarget: 1 });
companySchema.index({ approvalStatus: 1, status: 1 });

// Update authority count when leads are added
companySchema.methods.updateAuthorityCount = async function() {
  const Lead = mongoose.model('Lead');
  this.authorityCount = await Lead.countDocuments({ 
    company: this._id, 
    isDeleted: false 
  });
  await this.save();
};

const Company = mongoose.model('Company', companySchema);

module.exports = Company;
