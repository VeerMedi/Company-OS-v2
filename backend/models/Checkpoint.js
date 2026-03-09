const mongoose = require('mongoose');

const checkpointSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Checkpoint title is required'],
    trim: true,
    maxlength: [100, 'Checkpoint title cannot exceed 100 characters']
  },
  description: {
    type: String,
    trim: true
  },
  task: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Task',
    required: [true, 'Checkpoint must be associated with a task']
  },
  isCompleted: {
    type: Boolean,
    default: false
  },
  completedAt: {
    type: Date
  },
  completedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  verificationUrl: {
    type: String,
    trim: true
  },
  verificationMethod: {
    type: String,
    enum: {
      values: ['url', 'screenshot', 'document', 'other'],
      message: 'Verification method must be one of: url, screenshot, document, other'
    },
    default: 'url'
  },
  screenshots: [{
    url: String,
    caption: String,
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  feedback: {
    text: String,
    givenBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    givenAt: {
      type: Date
    }
  },
  isApproved: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Pre-save middleware to update completedAt date
checkpointSchema.pre('save', function(next) {
  if (this.isModified('isCompleted') && this.isCompleted && !this.completedAt) {
    this.completedAt = new Date();
  }
  
  if (this.isModified('isCompleted') && !this.isCompleted) {
    this.completedAt = undefined;
    this.completedBy = undefined;
  }
  
  next();
});

// Create index for better query performance
checkpointSchema.index({ task: 1 });
checkpointSchema.index({ isCompleted: 1 });

module.exports = mongoose.model('Checkpoint', checkpointSchema);