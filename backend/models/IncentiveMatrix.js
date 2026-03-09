const mongoose = require('mongoose');

const incentiveMatrixSchema = new mongoose.Schema({
  tier: {
    type: String,
    required: [true, 'Tier name is required'],
    enum: ['Bronze', 'Silver', 'Gold', 'Platinum', 'Diamond'],
    unique: true
  },
  displayOrder: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  emoji: {
    type: String,
    default: '🏆'
  },
  minProductivityScore: {
    type: Number,
    required: [true, 'Minimum productivity score is required'],
    min: [0, 'Score cannot be negative'],
    max: [100, 'Score cannot exceed 100']
  },
  maxProductivityScore: {
    type: Number,
    required: [true, 'Maximum productivity score is required'],
    min: [0, 'Score cannot be negative'],
    max: [100, 'Score cannot exceed 100']
  },
  minPoints: {
    type: Number,
    required: [true, 'Minimum points are required'],
    min: [0, 'Points cannot be negative']
  },
  maxPoints: {
    type: Number,
    default: null // null means unlimited
  },
  incentiveAmount: {
    type: Number,
    required: [true, 'Incentive amount is required'],
    min: [0, 'Incentive amount cannot be negative']
  },
  incentiveType: {
    type: String,
    enum: ['fixed', 'percentage'],
    default: 'fixed'
  },
  description: {
    type: String,
    maxlength: [200, 'Description cannot exceed 200 characters']
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Creator is required']
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Validate that min score <= max score
incentiveMatrixSchema.pre('save', function(next) {
  if (this.minProductivityScore > this.maxProductivityScore) {
    return next(new Error('Minimum score cannot be greater than maximum score'));
  }
  
  if (this.maxPoints && this.minPoints > this.maxPoints) {
    return next(new Error('Minimum points cannot be greater than maximum points'));
  }
  
  next();
});

// Virtual for tier display name with emoji
incentiveMatrixSchema.virtual('displayName').get(function() {
  return `${this.emoji} ${this.tier}`;
});

// Virtual for score range display
incentiveMatrixSchema.virtual('scoreRange').get(function() {
  return `${this.minProductivityScore}-${this.maxProductivityScore}%`;
});

// Virtual for points range display
incentiveMatrixSchema.virtual('pointsRange').get(function() {
  if (this.maxPoints) {
    return `${this.minPoints}-${this.maxPoints}`;
  }
  return `${this.minPoints}+`;
});

// Index for faster queries
incentiveMatrixSchema.index({ isActive: 1, displayOrder: 1 });
incentiveMatrixSchema.index({ minProductivityScore: 1, maxProductivityScore: 1 });
incentiveMatrixSchema.index({ minPoints: 1, maxPoints: 1 });

// Static method to get all active tiers sorted by display order
incentiveMatrixSchema.statics.getActiveTiers = function() {
  return this.find({ isActive: true })
    .sort({ displayOrder: 1 })
    .populate('createdBy', 'firstName lastName')
    .populate('updatedBy', 'firstName lastName');
};

// Static method to find matching tier for given score and points
incentiveMatrixSchema.statics.findMatchingTier = async function(productivityScore, totalPoints) {
  // Get all active tiers sorted by incentive amount (descending) to get highest tier first
  const tiers = await this.find({ isActive: true }).sort({ incentiveAmount: -1 });
  
  // Find the highest tier that matches either score OR points criteria
  for (const tier of tiers) {
    const scoreMatch = productivityScore >= tier.minProductivityScore && 
                       productivityScore <= tier.maxProductivityScore;
    
    const pointsMatch = totalPoints >= tier.minPoints && 
                        (!tier.maxPoints || totalPoints <= tier.maxPoints);
    
    // OR logic: qualify if EITHER score OR points criteria is met
    if (scoreMatch || pointsMatch) {
      return tier;
    }
  }
  
  return null; // No tier matched
};

// Static method to validate no overlapping tiers
incentiveMatrixSchema.statics.validateNoOverlap = async function(tierData, excludeId = null) {
  const query = { isActive: true };
  if (excludeId) {
    query._id = { $ne: excludeId };
  }
  
  const existingTiers = await this.find(query);
  
  for (const existing of existingTiers) {
    // Check for score range overlap
    const scoreOverlap = 
      (tierData.minProductivityScore >= existing.minProductivityScore && 
       tierData.minProductivityScore <= existing.maxProductivityScore) ||
      (tierData.maxProductivityScore >= existing.minProductivityScore && 
       tierData.maxProductivityScore <= existing.maxProductivityScore) ||
      (tierData.minProductivityScore <= existing.minProductivityScore && 
       tierData.maxProductivityScore >= existing.maxProductivityScore);
    
    if (scoreOverlap) {
      throw new Error(`Score range overlaps with existing tier: ${existing.tier}`);
    }
    
    // Check for points range overlap (if both have max points)
    if (tierData.maxPoints && existing.maxPoints) {
      const pointsOverlap = 
        (tierData.minPoints >= existing.minPoints && 
         tierData.minPoints <= existing.maxPoints) ||
        (tierData.maxPoints >= existing.minPoints && 
         tierData.maxPoints <= existing.maxPoints) ||
        (tierData.minPoints <= existing.minPoints && 
         tierData.maxPoints >= existing.maxPoints);
      
      if (pointsOverlap) {
        throw new Error(`Points range overlaps with existing tier: ${existing.tier}`);
      }
    }
  }
  
  return true;
};

// Method to calculate incentive for basic salary
incentiveMatrixSchema.methods.calculateIncentive = function(basicSalary = 10000) {
  if (this.incentiveType === 'percentage') {
    return Math.round((basicSalary * this.incentiveAmount) / 100);
  }
  return this.incentiveAmount;
};

// Method to format incentive display
incentiveMatrixSchema.methods.getIncentiveDisplay = function(basicSalary = 10000) {
  if (this.incentiveType === 'percentage') {
    return `${this.incentiveAmount}% (₹${this.calculateIncentive(basicSalary)})`;
  }
  return `₹${this.incentiveAmount}`;
};

module.exports = mongoose.model('IncentiveMatrix', incentiveMatrixSchema);
