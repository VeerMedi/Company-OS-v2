const mongoose = require('mongoose');

const executiveTaskSchema = new mongoose.Schema({
  description: {
    type: String,
    required: true,
    trim: true
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  assignedToType: {
    type: String,
    enum: ['manager', 'hr'],
    required: true
  },
  assignedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  assignedByRole: {
    type: String,
    enum: ['ceo', 'co-founder'],
    required: true
  },
  projectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: false // Made optional for "other" tasks
  },
  executiveDeadline: {
    type: Date,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'delegated', 'completed'],
    default: 'pending'
  },
  delegatedTask: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Task'
  },
  notes: String
}, {
  timestamps: true
});

// Index for quick queries
executiveTaskSchema.index({ assignedTo: 1, status: 1 });
executiveTaskSchema.index({ assignedBy: 1 });

module.exports = mongoose.model('ExecutiveTask', executiveTaskSchema);
