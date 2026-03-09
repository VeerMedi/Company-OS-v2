const mongoose = require('mongoose');

const taskFeedbackSchema = new mongoose.Schema({
  taskId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Task',
    required: true,
    index: true
  },
  
  // Task details at time of completion (for ML training)
  taskSnapshot: {
    title: String,
    description: String,
    phase: String,
    position: String,
    estimatedPoints: Number,
    estimatedScore: Number,
    dimensions: {
      technical_depth: Number,
      effort: Number,
      ambiguity: Number,
      dependencies: Number,
      blast_radius: Number,
      skill_level: Number,
      cross_domain: Number
    },
    buzzwordDensity: Number,
    confidence: Number
  },
  
  // Actual completion data
  actualHours: {
    type: Number,
    required: true,
    min: 0
  },
  
  rework: {
    type: Boolean,
    default: false
  },
  
  qualityRating: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  
  // Metadata
  managerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  
  submittedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  
  notes: String,
  
  submittedAt: {
    type: Date,
    default: Date.now
  },
  
  // ML usage tracking
  usedInTraining: {
    type: Boolean,
    default: false
  },
  
  trainingVersions: [{
    version: String,
    trainedAt: Date
  }]
}, {
  timestamps: true
});

// Index for ML queries
taskFeedbackSchema.index({ usedInTraining: 1, submittedAt: 1 });

module.exports = mongoose.model('TaskFeedback', taskFeedbackSchema);
