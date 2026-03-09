const ExecutiveTask = require('../models/ExecutiveTask');

// Create new executive task (CEO/Co-Founder)
exports.createExecutiveTask = async (req, res) => {
  try {
    const { description, assignedTo, assignedToType, projectId, deadline } = req.body;
    
    // Normalize the role to lowercase and handle 'chiefexecutive' case
    let assignedByRole = req.user.role.toLowerCase();
    if (assignedByRole === 'chiefexecutive') {
      assignedByRole = 'ceo';
    }
    
    console.log('✅ Creating executive task:', {
      description,
      assignedTo,
      assignedToType,
      projectId,
      deadline,
      assignedBy: req.user.id,
      assignedByRole: assignedByRole,
      originalRole: req.user.role
    });
    
    // Validate required fields
    if (!description || !assignedTo || !assignedToType || !deadline) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: description, assignedTo, assignedToType, and deadline are required'
      });
    }
    
    const executiveTask = new ExecutiveTask({
      description,
      assignedTo,
      assignedToType,
      projectId: projectId || null,
      executiveDeadline: deadline,
      assignedBy: req.user.id,
      assignedByRole: assignedByRole
    });

    await executiveTask.save();
    
    console.log('✅ Executive task saved with ID:', executiveTask._id);

    await executiveTask.populate([
      { path: 'assignedTo', select: 'firstName lastName email role' },
      { path: 'assignedBy', select: 'firstName lastName email role' },
      { path: 'projectId', select: 'name description' }
    ]);

    res.status(201).json({
      success: true,
      message: 'Executive task created successfully',
      data: executiveTask
    });
  } catch (error) {
    console.error('Error creating executive task:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create executive task',
      error: error.message
    });
  }
};

// Get executive tasks for manager/HR
exports.getMyExecutiveTasks = async (req, res) => {
  try {
    const { status } = req.query;
    
    console.log('📋 Fetching executive tasks for user:', req.user.id, 'Role:', req.user.role);
    
    const query = { assignedTo: req.user.id };
    if (status) {
      query.status = status;
    }

    const tasks = await ExecutiveTask.find(query)
      .populate('assignedBy', 'firstName lastName email role')
      .populate('projectId', 'name description deadline')
      .populate({
        path: 'delegatedTask',
        populate: {
          path: 'assignedTo',
          select: 'firstName lastName email role'
        }
      })
      .sort({ createdAt: -1 });

    console.log('📋 Found', tasks.length, 'executive tasks');

    res.json({
      success: true,
      data: tasks
    });
  } catch (error) {
    console.error('Error fetching executive tasks:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch executive tasks',
      error: error.message
    });
  }
};

// Update executive task status
exports.updateExecutiveTaskStatus = async (req, res) => {
  try {
    const { taskId } = req.params;
    const { status, delegatedTaskId, notes } = req.body;

    const task = await ExecutiveTask.findById(taskId);
    
    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Executive task not found'
      });
    }

    if (task.assignedTo.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized to update this task'
      });
    }

    task.status = status;
    if (delegatedTaskId) {
      task.delegatedTask = delegatedTaskId;
    }
    if (notes) {
      task.notes = notes;
    }

    await task.save();

    await task.populate([
      { path: 'assignedBy', select: 'firstName lastName email role' },
      { path: 'projectId', select: 'name description' },
      { path: 'delegatedTask' }
    ]);

    res.json({
      success: true,
      message: 'Executive task updated successfully',
      data: task
    });
  } catch (error) {
    console.error('Error updating executive task:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update executive task',
      error: error.message
    });
  }
};

// Get all executive tasks (for CEO/Co-Founder)
exports.getAllExecutiveTasks = async (req, res) => {
  try {
    const tasks = await ExecutiveTask.find({ assignedBy: req.user.id })
      .populate('assignedTo', 'firstName lastName email role')
      .populate('projectId', 'name description')
      .populate('delegatedTask')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: tasks
    });
  } catch (error) {
    console.error('Error fetching all executive tasks:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch executive tasks',
      error: error.message
    });
  }
};
