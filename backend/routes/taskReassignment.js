const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const taskReassignmentService = require('../services/taskReassignmentService');

/**
 * @route   GET /api/tasks/reassignment/leave/:leaveId
 * @desc    Get tasks affected by leave period
 * @access  Private (Manager/HR/Cofounder)
 */
router.get('/leave/:leaveId', authenticateToken, async (req, res) => {
  try {
    const Leave = require('../models/Leave').Leave;
    const leave = await Leave.findById(req.params.leaveId).populate('employee');

    if (!leave) {
      return res.status(404).json({
        success: false,
        message: 'Leave request not found'
      });
    }

    // Get affected tasks
    const result = await taskReassignmentService.getAffectedTasks(
      leave.employee._id,
      leave.startDate,
      leave.endDate
    );

    res.status(200).json({
      success: true,
      data: {
        ...result,
        leave: {
          _id: leave._id,
          startDate: leave.startDate,
          endDate: leave.endDate,
          type: leave.leaveType
        }
      }
    });

  } catch (error) {
    console.error('Error getting affected tasks:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get affected tasks',
      error: error.message
    });
  }
});

/**
 * @route   POST /api/tasks/reassignment/bulk
 * @desc    Bulk reassign tasks during leave approval
 * @access  Private (Manager/HR/Cofounder)
 */
router.post('/bulk', authenticateToken, async (req, res) => {
  try {
    const { reassignments, leaveId } = req.body;

    if (!reassignments || !Array.isArray(reassignments)) {
      return res.status(400).json({
        success: false,
        message: 'Reassignments array is required'
      });
    }

    if (!leaveId) {
      return res.status(400).json({
        success: false,
        message: 'Leave ID is required'
      });
    }

    // Perform bulk reassignment
    const results = await taskReassignmentService.bulkReassignTasks(
      reassignments,
      req.user._id,
      leaveId
    );

    res.status(200).json({
      success: true,
      data: results,
      message: `Successfully reassigned ${results.success.length} tasks`
    });

  } catch (error) {
    console.error('Error in bulk reassignment:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reassign tasks',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/tasks/reassignment/history/:taskId
 * @desc    Get reassignment history for a task
 * @access  Private
 */
router.get('/history/:taskId', authenticateToken, async (req, res) => {
  try {
    const history = await taskReassignmentService.getReassignmentHistory(req.params.taskId);

    res.status(200).json({
      success: true,
      data: history
    });

  } catch (error) {
    console.error('Error getting reassignment history:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get reassignment history',
      error: error.message
    });
  }
});

/**
 * @route   POST /api/tasks/reassignment/revert/:taskId
 * @desc    Revert task to original assignee
 * @access  Private (Manager/HR/Cofounder)
 */
router.post('/revert/:taskId', authenticateToken, async (req, res) => {
  try {
    const result = await taskReassignmentService.revertTaskAssignment(
      req.params.taskId,
      req.user._id
    );

    res.status(200).json({
      success: true,
      data: result,
      message: result.message
    });

  } catch (error) {
    console.error('Error reverting task:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to revert task assignment',
      error: error.message
    });
  }
});

module.exports = router;
