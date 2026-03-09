const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Project name is required'],
    trim: true,
    maxlength: [100, 'Project name cannot exceed 100 characters']
  },
  description: {
    type: String,
    required: [true, 'Project description is required'],
    trim: true
  },
  deadline: {
    type: Date,
    required: [true, 'Project deadline is required']
  },
  documentation: {
    type: String,
    trim: true
  },
  status: {
    type: String,
    enum: {
      values: ['not-started', 'in-progress', 'completed', 'on-hold', 'cancelled', 'ready-for-assignment', 'automation-pending', 'automation-failed'],
      message: 'Status must be one of: not-started, in-progress, completed, on-hold, cancelled, ready-for-assignment, automation-pending, automation-failed'
    },
    default: 'not-started'
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  assignedManager: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false // Made optional for automated projects
  },
  isAutomated: {
    type: Boolean,
    default: false
  },
  automationDetails: {
    n8nWebhookUrl: String,
    automatedAt: Date,
    automationStatus: {
      type: String,
      enum: ['pending', 'success', 'failed'],
      default: 'pending'
    },
    automationError: String
  },
  progress: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  totalPoints: {
    type: Number,
    default: 0
  },
  completedPoints: {
    type: Number,
    default: 0
  },
  isAutomated: {
    type: Boolean,
    default: false
  },
  attachments: [{
    name: String,
    fileUrl: String,
    fileType: String,
    uploadedAt: {
      type: Date,
      default: Date.now
    },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  }],
  // Soft Delete
  isDeleted: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for tasks
projectSchema.virtual('tasks', {
  ref: 'Task',
  localField: '_id',
  foreignField: 'project',
  justOne: false
});

// Pre-save middleware to update progress
projectSchema.pre('save', function (next) {
  if (this.totalPoints > 0) {
    this.progress = Math.round((this.completedPoints / this.totalPoints) * 100);
  }
  next();
});

// Method to calculate project progress
projectSchema.methods.calculateProgress = async function () {
  const tasks = await mongoose.model('Task').find({ project: this._id });

  let totalPoints = 0;
  let completedPoints = 0;

  tasks.forEach(task => {
    totalPoints += task.points;
    if (task.status === 'completed') {
      completedPoints += task.points;
    }
  });

  this.totalPoints = totalPoints;
  this.completedPoints = completedPoints;

  if (totalPoints > 0) {
    this.progress = Math.round((completedPoints / totalPoints) * 100);
  } else {
    this.progress = 0;
  }

  return this.save();
};

// Static method to find projects by manager
projectSchema.statics.findByManager = function (managerId) {
  return this.find({ assignedManager: managerId }).populate('createdBy', 'firstName lastName email');
};

// Create index for better query performance
projectSchema.index({ createdBy: 1 });
projectSchema.index({ assignedManager: 1 });
projectSchema.index({ status: 1 });

module.exports = mongoose.model('Project', projectSchema);