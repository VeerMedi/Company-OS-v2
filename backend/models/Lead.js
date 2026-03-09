const mongoose = require('mongoose');

// Lead represents an authority/decision maker within a company
const leadSchema = new mongoose.Schema({
  // Company Reference
  company: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: [true, 'Company reference is required']
  },
  
  // Authority/Decision Maker Information
  name: {
    type: String,
    required: [true, 'Lead name is required'],
    trim: true
  },
  designation: {
    type: String,
    required: [true, 'Designation is required'],
    trim: true
  },
  department: String,
  
  // Contact Information
  email: {
    type: String,
    trim: true,
    lowercase: true
  },
  phone: {
    type: String,
    trim: true
  },
  linkedIn: String,
  
  // Lead Classification
  leadType: {
    type: String,
    enum: ['hot', 'warm', 'cold'],
    default: 'cold'
  },
  leadSource: {
    type: String,
    enum: ['website', 'referral', 'cold-call', 'social-media', 'event', 'import', 'other'],
    default: 'other'
  },
  location: String,
  
  // Authority Level
  authorityLevel: {
    type: String,
    enum: ['decision-maker', 'influencer', 'gatekeeper', 'end-user'],
    default: 'influencer'
  },
  decisionPower: {
    type: String,
    enum: ['high', 'medium', 'low'],
    default: 'medium'
  },
  
  // Lead Status in Sales Process
  stage: {
    type: String,
    enum: ['lead', 'qualified', 'proposal', 'negotiation', 'closedWon', 'closedLost', 'identified', 'contacted', 'meeting-scheduled', 'closed-won', 'closed-lost'],
    default: 'lead'
  },
  status: {
    type: String,
    enum: ['active', 'nurturing', 'on-hold', 'won', 'lost'],
    default: 'active'
  },
  // Stage tracking with timestamps
  stageHistory: [{
    stage: {
      type: String,
      enum: ['lead', 'qualified', 'proposal', 'negotiation', 'closedWon', 'closedLost']
    },
    enteredAt: {
      type: Date,
      default: Date.now
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    notes: String
  }],
  
  // Deal Information
  potentialValue: {
    type: Number,
    default: 0,
    min: 0
  },
  actualValue: {
    type: Number,
    default: 0,
    min: 0
  },
  probability: {
    type: Number,
    default: 50,
    min: 0,
    max: 100
  },
  
  // Service Interest
  serviceInterest: {
    type: String,
    trim: true
  },
  requirements: String,
  
  // Timeline
  firstContactDate: {
    type: Date,
    default: Date.now
  },
  expectedCloseDate: Date,
  actualCloseDate: Date,
  lastContactDate: Date,
  
  // Assignment
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User', // Sales Rep
    required: true
  },
  
  // Follow-ups
  followUps: [{
    // Contact Method
    contactMethod: {
      type: String,
      enum: ['linkedin', 'email', 'call', 'meeting', 'whatsapp', 'other']
    },
    
    // When - Date and Time
    scheduledDate: Date,
    scheduledTime: String, // HH:MM format
    
    // What was sent/discussed
    summary: {
      type: String,
      trim: true
    },
    messageSent: {
      type: String,
      trim: true
    },
    
    // Outcome
    conclusion: {
      type: String,
      trim: true
    },
    
    // Next Step
    nextStep: {
      type: String,
      trim: true
    },
    nextFollowUpDate: Date,
    
    // Evidence of Completion
    evidenceRequired: {
      type: Boolean,
      default: true
    },
    evidenceSubmitted: {
      type: Boolean,
      default: false
    },
    evidenceFiles: [{
      filename: String,
      originalName: String,
      path: String,
      uploadedAt: {
        type: Date,
        default: Date.now
      }
    }],
    evidenceNotes: String,
    completedAt: Date,
    
    // Reminder Tracking
    lastEvidenceReminderSent: Date, // Last time evidence reminder was sent
    scheduledReminderSent: {
      type: Boolean,
      default: false
    }, // Whether 1-day-before reminder was sent
    nextFollowUpReminderSent: {
      type: Boolean,
      default: false
    }, // Whether next follow-up reminder was sent
    
    // Legacy fields for backward compatibility
    date: Date,
    type: {
      type: String,
      enum: ['call', 'email', 'meeting', 'demo', 'proposal', 'linkedin', 'whatsapp', 'other']
    },
    notes: String,
    outcome: String,
    nextAction: String,
    
    // Tracking
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    createdAt: {
      type: Date,
      default: Date.now
    },
    
    // Status
    status: {
      type: String,
      enum: ['pending', 'completed', 'overdue'],
      default: 'pending'
    }
  }],
  
  // Meetings
  meetings: [{
    scheduledDate: Date,
    duration: Number, // in minutes
    type: {
      type: String,
      enum: ['initial', 'discovery', 'demo', 'proposal', 'negotiation', 'closing']
    },
    attendees: [String],
    agenda: String,
    notes: String,
    outcome: String,
    status: {
      type: String,
      enum: ['scheduled', 'completed', 'cancelled', 'rescheduled']
    }
  }],
  
  // Documents & Proposals
  documents: [{
    name: String,
    type: {
      type: String,
      enum: ['proposal', 'contract', 'presentation', 'other']
    },
    url: String,
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  
  // Notes
  notes: String,
  painPoints: String,
  objections: String,
  
  // Activity Log
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
  },
  deletedAt: Date,
  deletedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Indexes
leadSchema.index({ company: 1, isDeleted: 1 });
leadSchema.index({ assignedTo: 1, stage: 1 });
leadSchema.index({ status: 1 });
leadSchema.index({ expectedCloseDate: 1 });

// After save, update company's authority count and revenue target
leadSchema.post('save', async function() {
  const Company = mongoose.model('Company');
  const company = await Company.findById(this.company);
  if (company) {
    await company.updateAuthorityCount();
    
    // Update revenue target when lead is won
    if (this.stage === 'closed-won' && this.actualValue > 0 && company.revenueTarget) {
      const RevenueTarget = mongoose.model('RevenueTarget');
      const revenueTarget = await RevenueTarget.findById(company.revenueTarget);
      
      if (revenueTarget) {
        // Recalculate achieved amount from all won leads
        const Lead = mongoose.model('Lead');
        const wonLeads = await Lead.find({
          stage: 'closed-won',
          isDeleted: false
        }).populate('company');
        
        const achievedForTarget = wonLeads
          .filter(lead => lead.company && lead.company.revenueTarget && 
                         lead.company.revenueTarget.toString() === revenueTarget._id.toString())
          .reduce((sum, lead) => sum + (lead.actualValue || 0), 0);
        
        revenueTarget.achievedAmount = achievedForTarget;
        revenueTarget.progressPercentage = Math.min(
          Math.round((achievedForTarget / revenueTarget.targetAmount) * 100),
          100
        );
        
        if (revenueTarget.progressPercentage >= 100) {
          revenueTarget.status = 'completed';
        }
        
        await revenueTarget.save();
      }
    }
  }
});

// After delete, update company's authority count
leadSchema.post('remove', async function() {
  const Company = mongoose.model('Company');
  const company = await Company.findById(this.company);
  if (company) {
    await company.updateAuthorityCount();
  }
});

const Lead = mongoose.model('Lead', leadSchema);

module.exports = Lead;
