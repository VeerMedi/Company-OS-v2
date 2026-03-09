const { validationResult } = require('express-validator');
const Checkpoint = require('../models/Checkpoint');
const Task = require('../models/Task');
const Project = require('../models/Project');

// @desc    Create a new checkpoint
// @route   POST /api/checkpoints
// @access  Private (Manager or Individual)
const createCheckpoint = async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { title, description, taskId } = req.body;

    // Check if task exists
    const task = await Task.findById(taskId).populate('project', 'assignedManager');
    
    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    // Check if user has permission (manager of project or assigned individual)
    const isManager = req.user.role === 'manager' && task.project.assignedManager.toString() === req.user.id;
    const isAssigned = req.user.role === 'individual' && task.assignedTo.toString() === req.user.id;
    const isCoFounder = req.user.role === 'co-founder';
    const isCEO = req.user.role === 'ceo';

    if (!isManager && !isAssigned && !isCoFounder && !isCEO) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to create checkpoints for this task'
      });
    }

    // Create the checkpoint
    const checkpoint = await Checkpoint.create({
      title,
      description,
      task: taskId,
      isCompleted: false
    });

    // Return the created checkpoint
    const populatedCheckpoint = await Checkpoint.findById(checkpoint._id)
      .populate({
        path: 'task',
        select: 'title',
        populate: {
          path: 'project',
          select: 'name'
        }
      });

    res.status(201).json({
      success: true,
      message: 'Checkpoint created successfully',
      data: populatedCheckpoint
    });

  } catch (error) {
    console.error('Create checkpoint error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create checkpoint',
      error: process.env.NODE_ENV === 'development' ? error.message : {}
    });
  }
};

// @desc    Get all checkpoints for a task
// @route   GET /api/checkpoints
// @access  Private (Based on task permissions)
const getCheckpoints = async (req, res) => {
  try {
    const { taskId } = req.query;
    
    if (!taskId) {
      return res.status(400).json({
        success: false,
        message: 'Task ID is required'
      });
    }

    // Check if task exists
    const task = await Task.findById(taskId).populate('project', 'assignedManager');
    
    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    // Check if user has permission to view this task's checkpoints
    if (req.user.role === 'manager') {
      if (task.project.assignedManager.toString() !== req.user.id) {
        return res.status(403).json({
          success: false,
          message: 'You do not have permission to view these checkpoints'
        });
      }
    } else if (req.user.role === 'individual') {
      if (task.assignedTo.toString() !== req.user.id) {
        return res.status(403).json({
          success: false,
          message: 'You do not have permission to view these checkpoints'
        });
      }
    }

    // Get checkpoints for this task
    const checkpoints = await Checkpoint.find({ task: taskId })
      .populate('completedBy', 'firstName lastName email')
      .populate({
        path: 'task',
        select: 'title',
        populate: {
          path: 'project',
          select: 'name'
        }
      })
      .sort({ createdAt: 1 });

    res.status(200).json({
      success: true,
      count: checkpoints.length,
      data: checkpoints
    });

  } catch (error) {
    console.error('Get checkpoints error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch checkpoints',
      error: process.env.NODE_ENV === 'development' ? error.message : {}
    });
  }
};

// @desc    Get a single checkpoint
// @route   GET /api/checkpoints/:id
// @access  Private (Based on task permissions)
const getCheckpoint = async (req, res) => {
  try {
    const checkpoint = await Checkpoint.findById(req.params.id)
      .populate('completedBy', 'firstName lastName email')
      .populate({
        path: 'task',
        select: 'title assignedTo',
        populate: [
          {
            path: 'project',
            select: 'name assignedManager'
          },
          {
            path: 'assignedTo',
            select: 'firstName lastName email'
          }
        ]
      });

    if (!checkpoint) {
      return res.status(404).json({
        success: false,
        message: 'Checkpoint not found'
      });
    }

    // Check permissions
    if (req.user.role === 'manager') {
      if (checkpoint.task.project.assignedManager.toString() !== req.user.id) {
        return res.status(403).json({
          success: false,
          message: 'You do not have permission to view this checkpoint'
        });
      }
    } else if (req.user.role === 'individual') {
      if (checkpoint.task.assignedTo._id.toString() !== req.user.id) {
        return res.status(403).json({
          success: false,
          message: 'You do not have permission to view this checkpoint'
        });
      }
    }

    res.status(200).json({
      success: true,
      data: checkpoint
    });

  } catch (error) {
    console.error('Get checkpoint error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch checkpoint',
      error: process.env.NODE_ENV === 'development' ? error.message : {}
    });
  }
};

// @desc    Update a checkpoint
// @route   PUT /api/checkpoints/:id
// @access  Private (Individual for completion, Manager for approval)
const updateCheckpoint = async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const checkpoint = await Checkpoint.findById(req.params.id)
      .populate({
        path: 'task',
        populate: {
          path: 'project',
          select: 'assignedManager'
        }
      });

    if (!checkpoint) {
      return res.status(404).json({
        success: false,
        message: 'Checkpoint not found'
      });
    }

    // Define fields that can be updated based on role
    const fieldsToUpdate = {};
    
    // Co-founder and CEO can update anything
    if (req.user.role === 'co-founder' || req.user.role === 'ceo') {
      if (req.body.title !== undefined) fieldsToUpdate.title = req.body.title;
      if (req.body.description !== undefined) fieldsToUpdate.description = req.body.description;
      if (req.body.isCompleted !== undefined) {
        fieldsToUpdate.isCompleted = req.body.isCompleted;
        if (req.body.isCompleted) {
          fieldsToUpdate.completedBy = req.user.id;
          fieldsToUpdate.completedAt = new Date();
        } else {
          fieldsToUpdate.completedBy = null;
          fieldsToUpdate.completedAt = null;
        }
      }
      
      if (req.body.isApproved !== undefined) fieldsToUpdate.isApproved = req.body.isApproved;
      if (req.body.verificationUrl !== undefined) fieldsToUpdate.verificationUrl = req.body.verificationUrl;
      if (req.body.verificationMethod !== undefined) fieldsToUpdate.verificationMethod = req.body.verificationMethod;
      
      // Handle feedback
      if (req.body.feedback !== undefined) {
        fieldsToUpdate['feedback.text'] = req.body.feedback;
        fieldsToUpdate['feedback.givenBy'] = req.user.id;
        fieldsToUpdate['feedback.givenAt'] = new Date();
      }
      
      // Handle screenshots
      if (req.body.screenshot) {
        const screenshot = {
          url: req.body.screenshot.url,
          caption: req.body.screenshot.caption,
          uploadedAt: new Date()
        };
        
        // If updating screenshots array directly
        if (req.body.screenshots) {
          fieldsToUpdate.screenshots = req.body.screenshots;
        } else {
          // Add to existing screenshots
          fieldsToUpdate.$push = { screenshots: screenshot };
        }
      }
    }
    // Managers can update approval status and provide feedback
    else if (req.user.role === 'manager') {
      if (checkpoint.task.project.assignedManager.toString() !== req.user.id) {
        return res.status(403).json({
          success: false,
          message: 'You do not have permission to update this checkpoint'
        });
      }
      
      if (req.body.title !== undefined) fieldsToUpdate.title = req.body.title;
      if (req.body.description !== undefined) fieldsToUpdate.description = req.body.description;
      if (req.body.isApproved !== undefined) fieldsToUpdate.isApproved = req.body.isApproved;
      
      // Handle feedback
      if (req.body.feedback !== undefined) {
        fieldsToUpdate['feedback.text'] = req.body.feedback;
        fieldsToUpdate['feedback.givenBy'] = req.user.id;
        fieldsToUpdate['feedback.givenAt'] = new Date();
      }
    }
    // Individuals can mark their checkpoints as completed and provide evidence
    else if (req.user.role === 'individual') {
      const task = await Task.findById(checkpoint.task._id);
      if (task.assignedTo.toString() !== req.user.id) {
        return res.status(403).json({
          success: false,
          message: 'You do not have permission to update this checkpoint'
        });
      }
      
      if (req.body.isCompleted !== undefined) {
        fieldsToUpdate.isCompleted = req.body.isCompleted;
        if (req.body.isCompleted) {
          fieldsToUpdate.completedBy = req.user.id;
          fieldsToUpdate.completedAt = new Date();
        } else {
          fieldsToUpdate.completedBy = null;
          fieldsToUpdate.completedAt = null;
        }
      }
      
      if (req.body.verificationUrl !== undefined) fieldsToUpdate.verificationUrl = req.body.verificationUrl;
      if (req.body.verificationMethod !== undefined) fieldsToUpdate.verificationMethod = req.body.verificationMethod;
      
      // Handle screenshots
      if (req.body.screenshot) {
        const screenshot = {
          url: req.body.screenshot.url,
          caption: req.body.screenshot.caption,
          uploadedAt: new Date()
        };
        
        // If updating screenshots array directly
        if (req.body.screenshots) {
          fieldsToUpdate.screenshots = req.body.screenshots;
        } else {
          // Add to existing screenshots
          fieldsToUpdate.$push = { screenshots: screenshot };
        }
      }
    } else {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to update this checkpoint'
      });
    }

    // Update the checkpoint
    const updatedCheckpoint = await Checkpoint.findByIdAndUpdate(
      req.params.id,
      fieldsToUpdate,
      { new: true, runValidators: true }
    )
      .populate('completedBy', 'firstName lastName email')
      .populate({
        path: 'task',
        select: 'title status',
        populate: {
          path: 'project',
          select: 'name'
        }
      })
      .populate('feedback.givenBy', 'firstName lastName email');

    // If all checkpoints are completed, suggest marking the task as completed
    if (updatedCheckpoint.isCompleted) {
      const allCheckpoints = await Checkpoint.find({ task: checkpoint.task._id });
      const allCompleted = allCheckpoints.every(cp => cp.isCompleted);
      
      if (allCompleted && req.user.role === 'individual') {
        // Update task status to review
        await Task.findByIdAndUpdate(checkpoint.task._id, { status: 'review' });
      }
    }

    res.status(200).json({
      success: true,
      message: 'Checkpoint updated successfully',
      data: updatedCheckpoint,
      allCheckpointsCompleted: updatedCheckpoint.isCompleted ? 
        await Checkpoint.find({ task: checkpoint.task._id }).then(cps => cps.every(cp => cp.isCompleted)) : 
        false
    });

  } catch (error) {
    console.error('Update checkpoint error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update checkpoint',
      error: process.env.NODE_ENV === 'development' ? error.message : {}
    });
  }
};

// @desc    Delete a checkpoint
// @route   DELETE /api/checkpoints/:id
// @access  Private (Manager or Co-founder/CEO)
const deleteCheckpoint = async (req, res) => {
  try {
    const checkpoint = await Checkpoint.findById(req.params.id)
      .populate({
        path: 'task',
        populate: {
          path: 'project',
          select: 'assignedManager'
        }
      });

    if (!checkpoint) {
      return res.status(404).json({
        success: false,
        message: 'Checkpoint not found'
      });
    }

    // Check permissions
    if (req.user.role === 'manager') {
      if (checkpoint.task.project.assignedManager.toString() !== req.user.id) {
        return res.status(403).json({
          success: false,
          message: 'You do not have permission to delete this checkpoint'
        });
      }
    } else if (req.user.role !== 'co-founder' && req.user.role !== 'ceo') {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to delete this checkpoint'
      });
    }

    // Delete the checkpoint
    await checkpoint.remove();

    res.status(200).json({
      success: true,
      message: 'Checkpoint deleted successfully'
    });

  } catch (error) {
    console.error('Delete checkpoint error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete checkpoint',
      error: process.env.NODE_ENV === 'development' ? error.message : {}
    });
  }
};

// @desc    Add a screenshot to a checkpoint
// @route   POST /api/checkpoints/:id/screenshots
// @access  Private (Individual assigned to the task or Manager)
const addScreenshot = async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { url, caption } = req.body;

    const checkpoint = await Checkpoint.findById(req.params.id)
      .populate({
        path: 'task',
        select: 'assignedTo',
        populate: {
          path: 'project',
          select: 'assignedManager'
        }
      });

    if (!checkpoint) {
      return res.status(404).json({
        success: false,
        message: 'Checkpoint not found'
      });
    }

    // Check permissions
    let hasPermission = false;
    
    if (req.user.role === 'individual') {
      const task = await Task.findById(checkpoint.task._id);
      hasPermission = task.assignedTo.toString() === req.user.id;
    } else if (req.user.role === 'manager') {
      hasPermission = checkpoint.task.project.assignedManager.toString() === req.user.id;
    } else if (req.user.role === 'co-founder' || req.user.role === 'ceo') {
      hasPermission = true;
    }

    if (!hasPermission) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to add screenshots to this checkpoint'
      });
    }

    // Add the screenshot
    checkpoint.screenshots.push({
      url,
      caption,
      uploadedAt: new Date()
    });

    await checkpoint.save();

    res.status(200).json({
      success: true,
      message: 'Screenshot added successfully',
      data: checkpoint
    });

  } catch (error) {
    console.error('Add screenshot error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add screenshot',
      error: process.env.NODE_ENV === 'development' ? error.message : {}
    });
  }
};

// @desc    Complete a checkpoint with evidence
// @route   POST /api/checkpoints/complete
// @access  Private (Individual assigned to task)
const completeCheckpoint = async (req, res) => {
  try {
    const { checkpointId, verificationMethod, verificationUrl, caption } = req.body;
    
    // Find the checkpoint and populate task
    const checkpoint = await Checkpoint.findById(checkpointId).populate('task');
    
    if (!checkpoint) {
      return res.status(404).json({
        success: false,
        message: 'Checkpoint not found'
      });
    }
    
    // Check if user is assigned to this task
    if (checkpoint.task.assignedTo.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'You can only complete checkpoints for tasks assigned to you'
      });
    }
    
    // Check if checkpoint is already completed
    if (checkpoint.isCompleted) {
      return res.status(400).json({
        success: false,
        message: 'Checkpoint is already completed'
      });
    }
    
    // Update checkpoint
    checkpoint.isCompleted = true;
    checkpoint.completedAt = new Date();
    checkpoint.completedBy = req.user.id;
    
    // Add evidence based on verification method
    if (verificationMethod === 'url' && verificationUrl) {
      checkpoint.verificationUrl = verificationUrl;
      checkpoint.verificationMethod = 'url';
    } else if (verificationMethod === 'screenshot' && req.file) {
      // Handle file upload (screenshot)
      checkpoint.verificationMethod = 'screenshot';
      checkpoint.screenshotPath = req.file.path;
      checkpoint.screenshotCaption = caption || '';
    }
    
    await checkpoint.save();
    
    // Check if all checkpoints for this task are completed
    const allCheckpoints = await Checkpoint.find({ task: checkpoint.task._id });
    const allCompleted = allCheckpoints.every(cp => cp.isCompleted);
    
    // If all checkpoints are completed, update task progress
    if (allCompleted) {
      checkpoint.task.status = 'review';
      await checkpoint.task.save();
    }
    
    res.status(200).json({
      success: true,
      message: 'Checkpoint completed successfully',
      data: checkpoint
    });
  } catch (error) {
    console.error('Complete checkpoint error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to complete checkpoint',
      error: process.env.NODE_ENV === 'development' ? error.message : {}
    });
  }
};

module.exports = {
  createCheckpoint,
  getCheckpoints,
  getCheckpoint,
  updateCheckpoint,
  deleteCheckpoint,
  addScreenshot,
  completeCheckpoint
};