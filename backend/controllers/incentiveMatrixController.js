const IncentiveMatrix = require('../models/IncentiveMatrix');
const incentiveCalculator = require('../services/IncentiveCalculator');

/**
 * @desc    Get all incentive tiers
 * @route   GET /api/incentive-matrix
 * @access  Private (All authenticated users can view)
 */
const getAllTiers = async (req, res) => {
  try {
    const tiers = await IncentiveMatrix.getActiveTiers();
    
    res.status(200).json({
      success: true,
      count: tiers.length,
      data: tiers
    });
  } catch (error) {
    console.error('Get all tiers error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch incentive tiers',
      error: process.env.NODE_ENV === 'development' ? error.message : {}
    });
  }
};

/**
 * @desc    Create a new incentive tier
 * @route   POST /api/incentive-matrix
 * @access  Private (HR, CEO, Co-founder only)
 */
const createTier = async (req, res) => {
  try {
    const {
      tier,
      displayOrder,
      emoji,
      minProductivityScore,
      maxProductivityScore,
      minPoints,
      maxPoints,
      incentiveAmount,
      incentiveType,
      description
    } = req.body;
    
    // Validate no overlapping tiers
    try {
      await IncentiveMatrix.validateNoOverlap({
        minProductivityScore,
        maxProductivityScore,
        minPoints,
        maxPoints
      });
    } catch (validationError) {
      return res.status(400).json({
        success: false,
        message: validationError.message
      });
    }
    
    const newTier = await IncentiveMatrix.create({
      tier,
      displayOrder,
      emoji: emoji || '🏆',
      minProductivityScore,
      maxProductivityScore,
      minPoints,
      maxPoints: maxPoints || null,
      incentiveAmount,
      incentiveType: incentiveType || 'fixed',
      description,
      createdBy: req.user._id
    });
    
    const populatedTier = await IncentiveMatrix.findById(newTier._id)
      .populate('createdBy', 'firstName lastName');
    
    res.status(201).json({
      success: true,
      message: 'Incentive tier created successfully',
      data: populatedTier
    });
  } catch (error) {
    console.error('Create tier error:', error);
    
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'A tier with this name already exists'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Failed to create incentive tier',
      error: process.env.NODE_ENV === 'development' ? error.message : {}
    });
  }
};

/**
 * @desc    Update an incentive tier
 * @route   PUT /api/incentive-matrix/:id
 * @access  Private (HR, CEO, Co-founder only)
 */
const updateTier = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    const tier = await IncentiveMatrix.findById(id);
    if (!tier) {
      return res.status(404).json({
        success: false,
        message: 'Incentive tier not found'
      });
    }
    
    // Validate no overlapping with other tiers
    if (updateData.minProductivityScore || updateData.maxProductivityScore || 
        updateData.minPoints || updateData.maxPoints) {
      try {
        await IncentiveMatrix.validateNoOverlap({
          minProductivityScore: updateData.minProductivityScore || tier.minProductivityScore,
          maxProductivityScore: updateData.maxProductivityScore || tier.maxProductivityScore,
          minPoints: updateData.minPoints || tier.minPoints,
          maxPoints: updateData.maxPoints !== undefined ? updateData.maxPoints : tier.maxPoints
        }, id);
      } catch (validationError) {
        return res.status(400).json({
          success: false,
          message: validationError.message
        });
      }
    }
    
    // Update tier
    updateData.updatedBy = req.user._id;
    const updatedTier = await IncentiveMatrix.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    )
      .populate('createdBy', 'firstName lastName')
      .populate('updatedBy', 'firstName lastName');
    
    res.status(200).json({
      success: true,
      message: 'Incentive tier updated successfully',
      data: updatedTier
    });
  } catch (error) {
    console.error('Update tier error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update incentive tier',
      error: process.env.NODE_ENV === 'development' ? error.message : {}
    });
  }
};

/**
 * @desc    Delete an incentive tier
 * @route   DELETE /api/incentive-matrix/:id
 * @access  Private (HR, CEO, Co-founder only)
 */
const deleteTier = async (req, res) => {
  try {
    const { id } = req.params;
    
    const tier = await IncentiveMatrix.findById(id);
    if (!tier) {
      return res.status(404).json({
        success: false,
        message: 'Incentive tier not found'
      });
    }
    
    // Soft delete by setting isActive to false
    tier.isActive = false;
    tier.updatedBy = req.user._id;
    await tier.save();
    
    res.status(200).json({
      success: true,
      message: 'Incentive tier deleted successfully'
    });
  } catch (error) {
    console.error('Delete tier error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete incentive tier',
      error: process.env.NODE_ENV === 'development' ? error.message : {}
    });
  }
};

/**
 * @desc    Preview incentive for an employee
 * @route   GET /api/incentive-matrix/preview/:employeeId
 * @access  Private
 */
const previewIncentive = async (req, res) => {
  try {
    const { employeeId } = req.params;
    const { basicSalary } = req.query;
    
    const preview = await incentiveCalculator.previewIncentive(
      employeeId,
      parseFloat(basicSalary) || 10000
    );
    
    res.status(200).json({
      success: true,
      data: preview
    });
  } catch (error) {
    console.error('Preview incentive error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to preview incentive',
      error: process.env.NODE_ENV === 'development' ? error.message : {}
    });
  }
};

/**
 * @desc    Get incentive distribution statistics
 * @route   GET /api/incentive-matrix/distribution
 * @access  Private (HR, CEO, Co-founder only)
 */
const getDistribution = async (req, res) => {
  try {
    const { salaryMonth } = req.query;
    
    const distribution = await incentiveCalculator.getIncentiveDistribution(salaryMonth);
    
    res.status(200).json({
      success: true,
      data: distribution
    });
  } catch (error) {
    console.error('Get distribution error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get incentive distribution',
      error: process.env.NODE_ENV === 'development' ? error.message : {}
    });
  }
};

module.exports = {
  getAllTiers,
  createTier,
  updateTier,
  deleteTier,
  previewIncentive,
  getDistribution
};
