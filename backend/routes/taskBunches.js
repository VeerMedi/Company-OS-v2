const express = require('express');
const router = express.Router();
const TaskBunch = require('../models/TaskBunch');
const Task = require('../models/Task');
const User = require('../models/User');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

// @desc    Get all task bunches for a project
// @route   GET /api/task-bunches/project/:projectId
// @access  Private
router.get('/project/:projectId', authenticateToken, async (req, res) => {
  try {
    console.log('📦 Fetching bunches for project:', req.params.projectId);
    
    const bunches = await TaskBunch.find({ project: req.params.projectId })
      .populate('tasks')
      .populate('assignedTo', 'firstName lastName')
      .sort({ createdAt: -1 });

    console.log('📦 Found', bunches.length, 'bunches');

    res.status(200).json({
      success: true,
      count: bunches.length,
      data: bunches
    });
  } catch (error) {
    console.error('❌ Error fetching task bunches:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch task bunches',
      message: error.message
    });
  }
});

// @desc    Get task bunches assigned to current user
// @route   GET /api/task-bunches/my-bunches
// @access  Private
router.get('/my-bunches', authenticateToken, async (req, res) => {
  try {
    const bunches = await TaskBunch.getBunchesByUser(req.user.id);

    // Calculate progress for each bunch (bunches are plain objects now)
    // Progress calculation is already handled in the model based on tasks
    // No need to call calculateProgress and save here

    res.status(200).json({
      success: true,
      count: bunches.length,
      data: bunches
    });
  } catch (error) {
    console.error('Error fetching my bunches:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch your task bunches'
    });
  }
});

// @desc    Get all task bunches for manager's projects
// @route   GET /api/task-bunches/manager-bunches
// @access  Private (Manager only)
router.get('/manager-bunches', authenticateToken, authorizeRoles('manager', 'co-founder', 'ceo'), async (req, res) => {
  try {
    const Project = require('../models/Project');

    // Find all projects where user is manager
    const projects = await Project.find({
      $or: [
        { assignedManager: req.user.id },
        { createdBy: req.user.id }
      ]
    }).select('_id');

    const projectIds = projects.map(p => p._id);

    // Get all bunches for these projects
    const bunches = await TaskBunch.find({
      project: { $in: projectIds }
    })
      .populate('project', 'name deadline status')
      .populate('assignedTo', 'firstName lastName email')
      .populate({
        path: 'tasks',
        populate: {
          path: 'assignedTo',
          select: 'firstName lastName email role'
        }
      })
      .sort({ createdAt: -1 });

    // Calculate progress for each bunch
    for (const bunch of bunches) {
      await bunch.calculateProgress();
      await bunch.save();
    }

    res.status(200).json({
      success: true,
      count: bunches.length,
      data: bunches
    });
  } catch (error) {
    console.error('Error fetching manager bunches:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch task bunches'
    });
  }
});

// @desc    Assign entire task bunch to a user
// @route   POST /api/task-bunches/:id/assign
// @access  Private (Manager only)
router.post('/:id/assign', authenticateToken, authorizeRoles('manager', 'co-founder', 'ceo'), async (req, res) => {
  try {
    const { assignedTo } = req.body;

    if (!assignedTo) {
      return res.status(400).json({
        success: false,
        error: 'Please provide assignedTo user ID'
      });
    }

    // Verify the assignee exists and is active
    const assignee = await User.findById(assignedTo);
    if (!assignee || !assignee.isActive) {
      return res.status(404).json({
        success: false,
        error: 'Assignee not found or inactive'
      });
    }

    // Find the bunch
    const bunch = await TaskBunch.findById(req.params.id).populate({
      path: 'tasks',
      populate: {
        path: 'assignedTo',
        select: 'firstName lastName email role'
      }
    });
    if (!bunch) {
      return res.status(404).json({
        success: false,
        error: 'Task bunch not found'
      });
    }

    // Assign bunch
    bunch.assignedTo = assignedTo;
    bunch.assignedBy = req.user.id;
    bunch.status = 'assigned';
    await bunch.save();

    // Assign all tasks in the bunch to the same user
    const taskIds = bunch.tasks.map(task => task._id || task);
    await Task.updateMany(
      { _id: { $in: taskIds } },
      {
        $set: {
          assignedTo: assignedTo,
          assignedBy: req.user.id,
          status: 'not-started'
        }
      }
    );

    // Populate the updated bunch
    const updatedBunch = await TaskBunch.findById(bunch._id)
      .populate('assignedTo', 'firstName lastName email')
      .populate('assignedBy', 'firstName lastName email')
      .populate({
        path: 'tasks',
        populate: {
          path: 'assignedTo',
          select: 'firstName lastName email role'
        }
      });

    res.status(200).json({
      success: true,
      message: `Task bunch "${bunch.name}" assigned to ${assignee.firstName} ${assignee.lastName}`,
      data: updatedBunch,
      tasksAssigned: taskIds.length
    });
  } catch (error) {
    console.error('Error assigning task bunch:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to assign task bunch'
    });
  }
});

// @desc    Assign individual task within a bunch
// @route   POST /api/task-bunches/:bunchId/tasks/:taskId/assign
// @access  Private (Manager only)
router.post('/:bunchId/tasks/:taskId/assign', authenticateToken, authorizeRoles('manager', 'co-founder', 'ceo'), async (req, res) => {
  try {
    const { assignedTo } = req.body;
    const { bunchId, taskId } = req.params;

    if (!assignedTo) {
      return res.status(400).json({
        success: false,
        error: 'Please provide assignedTo user ID'
      });
    }

    // Verify the assignee exists
    const assignee = await User.findById(assignedTo);
    if (!assignee || !assignee.isActive) {
      return res.status(404).json({
        success: false,
        error: 'Assignee not found or inactive'
      });
    }

    // Find the bunch and verify task belongs to it
    const bunch = await TaskBunch.findById(bunchId);
    if (!bunch) {
      return res.status(404).json({
        success: false,
        error: 'Task bunch not found'
      });
    }

    if (!bunch.tasks.includes(taskId)) {
      return res.status(400).json({
        success: false,
        error: 'Task does not belong to this bunch'
      });
    }

    // Find and assign the task
    const task = await Task.findById(taskId);
    if (!task) {
      return res.status(404).json({
        success: false,
        error: 'Task not found'
      });
    }

    task.assignedTo = assignedTo;
    task.assignedBy = req.user.id;
    if (task.status === 'pending-assignment') {
      task.status = 'not-started';
    }
    await task.save();

    // Record delegation in bunch
    bunch.delegations.push({
      task: taskId,
      delegatedTo: assignedTo,
      delegatedBy: req.user.id,
      delegatedAt: new Date(),
      notes: req.body.notes || ''
    });
    await bunch.save();

    const updatedTask = await Task.findById(taskId)
      .populate('assignedTo', 'firstName lastName email')
      .populate('assignedBy', 'firstName lastName email');

    res.status(200).json({
      success: true,
      message: `Task "${task.title}" assigned to ${assignee.firstName} ${assignee.lastName}`,
      data: updatedTask
    });
  } catch (error) {
    console.error('Error assigning individual task:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to assign task'
    });
  }
});

// @desc    Unassign task bunch
// @route   PUT /api/task-bunches/:id/unassign
// @access  Private (Manager only)
router.put('/:id/unassign', authenticateToken, authorizeRoles('manager', 'co-founder', 'ceo'), async (req, res) => {
  try {
    const bunch = await TaskBunch.findById(req.params.id).populate({
      path: 'tasks',
      populate: {
        path: 'assignedTo',
        select: 'firstName lastName email role'
      }
    });
    if (!bunch) {
      return res.status(404).json({
        success: false,
        error: 'Task bunch not found'
      });
    }

    // Unassign bunch
    bunch.assignedTo = null;
    bunch.status = 'pending-assignment';
    await bunch.save();

    // Unassign all tasks in the bunch
    const taskIds = bunch.tasks.map(task => task._id || task);
    await Task.updateMany(
      { _id: { $in: taskIds } },
      {
        $set: {
          assignedTo: null,
          status: 'pending-assignment'
        }
      }
    );

    res.status(200).json({
      success: true,
      message: `Task bunch "${bunch.name}" unassigned`,
      data: bunch
    });
  } catch (error) {
    console.error('Error unassigning task bunch:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to unassign task bunch'
    });
  }
});

// @desc    Get all developers/interns for assignment dropdown
// @route   GET /api/task-bunches/assignable-users
// @access  Private (Manager only)
router.get('/assignable-users', authenticateToken, authorizeRoles('manager', 'co-founder', 'ceo'), async (req, res) => {
  try {
    const users = await User.find({
      isActive: true,
      role: { $in: ['developer', 'intern', 'team-lead'] }
    }).select('firstName lastName email role skills specializations');

    res.status(200).json({
      success: true,
      count: users.length,
      data: users
    });
  } catch (error) {
    console.error('Error fetching assignable users:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch users'
    });
  }
});

module.exports = router;
