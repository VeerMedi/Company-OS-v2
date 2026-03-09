const mongoose = require('mongoose');

const performanceEditLogSchema = new mongoose.Schema({
  evaluationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'PerformanceEvaluation',
    required: true,
    index: true
  },
  
  editedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  editedAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  
  fieldName: {
    type: String,
    required: true
  },
  
  oldValue: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },
  
  newValue: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },
  
  reason: {
    type: String,
    required: true,
    minlength: 10,
    maxlength: 500
  },
  
  changePercentage: {
    type: Number
  },
  
  ipAddress: {
    type: String
  },
  
  userAgent: {
    type: String
  }
}, {
  timestamps: true
});

// Index for efficient querying
performanceEditLogSchema.index({ evaluationId: 1, editedAt: -1 });
performanceEditLogSchema.index({ editedBy: 1 });

// Static method to create log entry
performanceEditLogSchema.statics.logEdit = async function(logData) {
  const { evaluationId, editedBy, fieldName, oldValue, newValue, reason, req } = logData;
  
  // Calculate change percentage if numeric values
  let changePercentage = null;
  if (typeof oldValue === 'number' && typeof newValue === 'number' && oldValue !== 0) {
    changePercentage = Math.round(((newValue - oldValue) / oldValue) * 100);
  }
  
  const logEntry = new this({
    evaluationId,
    editedBy,
    fieldName,
    oldValue,
    newValue,
    reason,
    changePercentage,
    ipAddress: req?.ip || req?.connection?.remoteAddress,
    userAgent: req?.get('user-agent')
  });
  
  return await logEntry.save();
};

// Static method to get audit trail for an evaluation
performanceEditLogSchema.statics.getAuditTrail = async function(evaluationId) {
  return await this.find({ evaluationId })
    .populate('editedBy', 'firstName lastName email role')
    .sort({ editedAt: -1 })
    .lean();
};

module.exports = mongoose.model('PerformanceEditLog', performanceEditLogSchema);
