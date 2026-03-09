const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Task title is required'],
    trim: true,
    maxlength: [100, 'Task title cannot exceed 100 characters']
  },
  description: {
    type: String,
    required: [true, 'Task description is required'],
    trim: true
  },
  documentLink: {
    type: String,
    trim: true,
    validate: {
      validator: function(v) {
        if (!v) return true;
        return /^https?:\/\/.+/.test(v);
      },
      message: 'Document link must be a valid URL'
    }
  },
  project: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: false // Made optional for sales tasks
  },
  taskType: {
    type: String,
    enum: ['project', 'sales', 'default', 'recurring'],
    default: 'project'
  },
  // Recurring task configuration
  recurring: {
    enabled: {
      type: Boolean,
      default: false
    },
    frequency: {
      type: String,
      enum: ['daily', 'weekly', 'biweekly', 'monthly', 'quarterly'],
    },
    interval: {
      type: Number,
      default: 1,
      min: 1
    },
    endDate: Date,
    lastGenerated: Date,
    nextDueDate: Date
  },
  // Sales-specific fields
  salesContext: {
    company: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Company'
    },
    lead: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Lead'
    },
    revenueTarget: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'RevenueTarget'
    }
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false // Made optional for automated tasks awaiting assignment
  },
  assignedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false // Made optional for automated tasks
  },
  // Delegation tracking - when a developer delegates a task to their mentee
  delegatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false
  },
  delegatedAt: {
    type: Date
  },
  delegationHistory: [{
    from: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    to: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    delegatedAt: {
      type: Date,
      default: Date.now
    },
    notes: String
  }],
  source: {
    type: String,
    enum: ['manual', 'cofounder_rag', 'automated', 'recurring'],
    default: 'manual',
    index: true
  },
  requiresOverride: {
    type: Boolean,
    default: false,
    index: true
  },
  deadline: {
    type: Date,
    required: [true, 'Task deadline is required']
  },
  status: {
    type: String,
    enum: {
      values: ['not-started', 'in-progress', 'completed', 'cant-complete', 'review', 'pending-assignment', 'needs-revision'],
      message: 'Status must be one of: not-started, in-progress, completed, cant-complete, review, pending-assignment, needs-revision'
    },
    default: 'not-started'
  },
  points: {
    type: Number,
    required: [true, 'Task points are required'],
    min: [1, 'Task points must be at least 1'],
    default: 1
  },
  priority: {
    type: String,
    enum: {
      values: ['low', 'medium', 'high', 'urgent'],
      message: 'Priority must be one of: low, medium, high, urgent'
    },
    default: 'medium'
  },
  requiredSkills: [{
    type: String,
    trim: true
  }],
  taskCategory: {
    type: String,
    enum: ['development', 'design', 'testing', 'devops', 'sales', 'hr', 'management'],
    default: 'development'
  },
  // Task Intelligence - AI-generated complexity analysis
  complexityScore: {
    type: Number,
    min: 0,
    max: 100,
    default: null
  },
  complexityDimensions: {
    technical_depth: { type: Number, min: 0, max: 10 },
    effort: { type: Number, min: 0, max: 10 },
    ambiguity: { type: Number, min: 0, max: 10 },
    dependencies: { type: Number, min: 0, max: 10 },
    blast_radius: { type: Number, min: 0, max: 10 },
    skill_level: { type: Number, min: 0, max: 10 },
    cross_domain: { type: Number, min: 0, max: 10 }
  },
  complexityExplanation: {
    type: String,
    default: ''
  },
  intelligenceGenerated: {
    type: Boolean,
    default: false
  },
  completedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  pointsEarnedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  isCoverageTask: {
    type: Boolean,
    default: false
  },
  coveredFor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  completedAt: {
    type: Date
  },
  completedByManager: {
    type: Boolean,
    default: false
  },
  completedByUser: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  pointsAwarded: {
    type: Number,
    min: [0, 'Points awarded cannot be negative']
  },
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  reviewedAt: {
    type: Date
  },
  isApproved: {
    type: Boolean,
    default: false
  },
  comments: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    text: {
      type: String,
      required: true
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  revisionRequired: {
    type: Boolean,
    default: false
  },
  revisionDeadline: {
    type: Date
  },
  revisionCount: {
    type: Number,
    default: 0
  },
  revisionHistory: [{
    requestedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    requestedAt: {
      type: Date,
      default: Date.now
    },
    feedback: {
      type: String,
      required: true
    },
    newDeadline: {
      type: Date
    },
    resolvedAt: {
      type: Date
    },
    isResolved: {
      type: Boolean,
      default: false
    }
  }],
  isAutomated: {
    type: Boolean,
    default: false
  },
  // AI-generated task fields
  aiGenerated: {
    type: Boolean,
    default: false
  },
  phase: {
    type: String,
    trim: true
  },
  complexity: {
    type: String,
    enum: ['Low', 'Medium', 'High'],
    default: 'Medium'
  },
  suggestedRole: {
    type: String,
    trim: true
  },
  // Task Bunch relationship
  taskBunch: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'TaskBunch',
    default: null
  },
  // Inter-bunch dependencies
  dependsOnTasks: [{
    task: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Task'
    },
    taskBunch: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'TaskBunch'
    },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'completed'],
      default: 'pending'
    }
  }],
  // Tasks that depend on this task (reverse relationship)
  dependentTasks: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Task'
  }],
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  revisionComments: {
    type: String
  },
  // Status history with evidence
  statusHistory: [{
    status: {
      type: String,
      enum: ['not-started', 'in-progress', 'completed', 'cant-complete', 'review', 'needs-revision'],
      required: true
    },
    changedAt: {
      type: Date,
      default: Date.now
    },
    changedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    evidence: {
      type: {
        type: String,
        enum: ['screenshot', 'video', 'url', 'document', 'mixed'],
        default: 'mixed'
      },
      description: {
        type: String,
        required: true
      },
      notes: String,
      files: [{
        originalName: String,
        filename: String,
        path: String,
        mimetype: String,
        size: Number
      }],
      urls: [String],
      submittedAt: {
        type: Date,
        default: Date.now
      },
      submittedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      }
    }
  }],
  // Latest evidence for quick access
  evidence: {
    type: {
      type: String,
      enum: ['screenshot', 'video', 'url', 'document', 'mixed'],
      default: 'mixed'
    },
    description: String,
    notes: String,
    files: [{
      originalName: String,
      filename: String,
      path: String,
      mimetype: String,
      size: Number
    }],
    urls: [String],
    submittedAt: Date,
    submittedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  },
  // Additional timestamps
  acceptedAt: Date,
  
  // Task Reassignment (for leave management)
  isReassigned: {
    type: Boolean,
    default: false
  },
  originalAssignee: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  reassignmentHistory: [{
    originalAssignee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    newAssignee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    reassignedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    reason: {
      type: String,
      enum: ['leave', 'workload', 'manual', 'other'],
      default: 'manual'
    },
    leaveId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Leave'
    },
    reassignedAt: {
      type: Date,
      default: Date.now
    },
    notes: {
      type: String,
      maxlength: 500
    },
    revertedAt: Date,
    isReverted: {
      type: Boolean,
      default: false
    }
  }],
  // Executive task metadata
  metadata: {
    isExecutiveTask: {
      type: Boolean,
      default: false
    },
    executiveTaskId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ExecutiveTask'
    },
    createdByRole: {
      type: String,
      enum: ['ceo', 'co-founder']
    },
    createdByName: String,
    isNew: {
      type: Boolean,
      default: false
    }
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for checkpoints
taskSchema.virtual('checkpoints', {
  ref: 'Checkpoint',
  localField: '_id',
  foreignField: 'task',
  justOne: false
});

// Pre-save middleware to update project progress when task is completed
taskSchema.pre('save', async function(next) {
  // If the task status changed to completed, update the completedAt date
  if (this.isModified('status') && this.status === 'completed' && !this.completedAt) {
    this.completedAt = new Date();
  }
  
  // If task was un-completed, remove the completedAt date
  if (this.isModified('status') && this.status !== 'completed') {
    this.completedAt = undefined;
  }
  
  next();
});

// Post-save middleware to update project progress
taskSchema.post('save', async function() {
  try {
    const Project = mongoose.model('Project');
    const project = await Project.findById(this.project);
    if (project) {
      await project.calculateProgress();
    }
  } catch (error) {
    console.error('Error updating project progress:', error);
  }
});

// Create index for better query performance
taskSchema.index({ project: 1 });
taskSchema.index({ assignedTo: 1 });
taskSchema.index({ status: 1 });
taskSchema.index({ deadline: 1 });

module.exports = mongoose.model('Task', taskSchema);