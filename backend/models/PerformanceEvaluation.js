const mongoose = require('mongoose');

const performanceEvaluationSchema = new mongoose.Schema({
  employee: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  
  evaluationPeriod: {
    startDate: {
      type: Date,
      required: true
    },
    endDate: {
      type: Date,
      required: true
    }
  },
  
  status: {
    type: String,
    enum: ['draft', 'edited', 'approved', 'locked', 'sent_to_hr', 'payroll_generated'],
    default: 'draft',
    index: true
  },
  
  // Performance Metrics
  metrics: {
    taskCompletion: {
      score: {
        type: Number,
        min: 0,
        max: 100,
        default: 0
      },
      autoCalculated: {
        type: Number,
        min: 0,
        max: 100
      },
      isOverridden: {
        type: Boolean,
        default: false
      }
    },
    
    taskQuality: {
      score: {
        type: Number,
        min: 0,
        max: 100,
        default: 0
      },
      isManual: {
        type: Boolean,
        default: true
      }
    },
    
    attendance: {
      score: {
        type: Number,
        min: 0,
        max: 100,
        default: 0
      },
      locked: {
        type: Boolean,
        default: true
      }
    },
    
    collaboration: {
      score: {
        type: Number,
        min: 0,
        max: 100,
        default: 0
      }
    },
    
    initiative: {
      score: {
        type: Number,
        min: 0,
        max: 100,
        default: 0
      }
    },
    
    penalties: [{
      reason: {
        type: String,
        required: true
      },
      amount: {
        type: Number,
        required: true
      },
      addedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      addedAt: {
        type: Date,
        default: Date.now
      }
    }],
    
    bonuses: [{
      reason: {
        type: String,
        required: true
      },
      amount: {
        type: Number,
        required: true
      },
      addedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      addedAt: {
        type: Date,
        default: Date.now
      }
    }]
  },
  
  // Derived/Calculated Fields
  derivedFields: {
    totalScore: {
      type: Number,
      min: 0,
      max: 100,
      default: 0
    },
    grade: {
      type: String,
      enum: ['A', 'B', 'C', 'D', 'F'],
      default: 'F'
    },
    payrollMultiplier: {
      type: Number,
      min: 0,
      max: 2,
      default: 1.0
    }
  },
  
  // Manager Approval
  managerApproval: {
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    approvedAt: {
      type: Date
    },
    comments: {
      type: String
    },
    rejectedAt: {
      type: Date
    },
    rejectionReason: {
      type: String
    }
  },
  
  // HR Confirmation
  hrConfirmation: {
    confirmedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    confirmedAt: {
      type: Date
    }
  },
  
  // Payroll Link
  payrollId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Payroll'
  },
  
  // Audit trail
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Compound index for uniqueness per evaluation period
performanceEvaluationSchema.index({ 
  employee: 1, 
  'evaluationPeriod.startDate': 1,
  'evaluationPeriod.endDate': 1
}, { unique: true });

// Method to calculate total performance score
performanceEvaluationSchema.methods.calculateTotalScore = function() {
  const weights = {
    taskCompletion: 0.30,
    taskQuality: 0.25,
    attendance: 0.20,
    collaboration: 0.15,
    initiative: 0.10
  };
  
  const totalScore = 
    (this.metrics.taskCompletion.score * weights.taskCompletion) +
    (this.metrics.taskQuality.score * weights.taskQuality) +
    (this.metrics.attendance.score * weights.attendance) +
    (this.metrics.collaboration.score * weights.collaboration) +
    (this.metrics.initiative.score * weights.initiative);
  
  return Math.round(totalScore);
};

// Method to calculate performance grade
performanceEvaluationSchema.methods.calculateGrade = function() {
  const score = this.derivedFields.totalScore;
  
  if (score >= 90) return 'A';
  if (score >= 75) return 'B';
  if (score >= 60) return 'C';
  if (score >= 40) return 'D';
  return 'F';
};

// Method to calculate payroll multiplier
performanceEvaluationSchema.methods.calculatePayrollMultiplier = function() {
  const grade = this.derivedFields.grade;
  
  const multipliers = {
    'A': 1.2,
    'B': 1.0,
    'C': 0.8,
    'D': 0.6,
    'F': 0.5
  };
  
  return multipliers[grade] || 1.0;
};

// Method to check if user can edit this evaluation
performanceEvaluationSchema.methods.canEdit = function(userId, userRole) {
  // Cannot edit if approved or locked
  if (['approved', 'locked', 'sent_to_hr', 'payroll_generated'].includes(this.status)) {
    return false;
  }
  
  // Only manager can edit
  if (!['manager', 'ceo', 'co-founder'].includes(userRole)) {
    return false;
  }
  
  return true;
};

// Method to approve evaluation
performanceEvaluationSchema.methods.approve = async function(managerId, comments) {
  if (!this.canEdit(managerId, 'manager')) {
    throw new Error('Cannot approve: evaluation is locked or you lack permission');
  }
  
  // Recalculate all derived fields
  this.derivedFields.totalScore = this.calculateTotalScore();
  this.derivedFields.grade = this.calculateGrade();
  this.derivedFields.payrollMultiplier = this.calculatePayrollMultiplier();
  
  this.status = 'approved';
  this.managerApproval.approvedBy = managerId;
  this.managerApproval.approvedAt = new Date();
  this.managerApproval.comments = comments;
  this.updatedBy = managerId;
  
  return await this.save();
};

// Method to reject evaluation
performanceEvaluationSchema.methods.reject = async function(managerId, reason) {
  if (!['edited', 'draft'].includes(this.status)) {
    throw new Error('Can only reject draft or edited evaluations');
  }
  
  this.status = 'draft';
  this.managerApproval.rejectedAt = new Date();
  this.managerApproval.rejectionReason = reason;
  this.updatedBy = managerId;
  
  return await this.save();
};

// Method to send to HR
performanceEvaluationSchema.methods.sendToHR = async function(managerId) {
  if (this.status !== 'approved') {
    throw new Error('Can only send approved evaluations to HR');
  }
  
  this.status = 'sent_to_hr';
  this.updatedBy = managerId;
  
  return await this.save();
};

// Pre-save middleware to update derived fields
performanceEvaluationSchema.pre('save', function(next) {
  // Auto-calculate total score and grade if metrics changed
  if (this.isModified('metrics')) {
    this.derivedFields.totalScore = this.calculateTotalScore();
    this.derivedFields.grade = this.calculateGrade();
    this.derivedFields.payrollMultiplier = this.calculatePayrollMultiplier();
  }
  
  next();
});

module.exports = mongoose.model('PerformanceEvaluation', performanceEvaluationSchema);
