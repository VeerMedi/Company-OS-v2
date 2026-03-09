const { validationResult } = require('express-validator');
const Task = require('../models/Task');
const Checkpoint = require('../models/Checkpoint');
const Project = require('../models/Project');
const User = require('../models/User');
const { invalidateHRCache } = require('./hrController');
const TaskIntelligenceService = require('../services/TaskIntelligenceService');

// Helper function to check if role is an individual/service role
const isIndividualRole = (role) => {
  return ['individual', 'service-delivery', 'service-onboarding'].includes(role);
};

// @desc    Create a new task
// @route   POST /api/tasks
// @access  Private (Manager)
const createTask = async (req, res) => {
  try {
    console.log('🔵 Create Task Request:');
    console.log('  Body:', JSON.stringify(req.body, null, 2));

    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const {
      title,
      description,
      projectId,
      assignedToId,
      deadline,
      points,
      priority,
      source,
      requiresOverride
    } = req.body;

    // Authorization check
    const isCofounder = req.user.role === 'co-founder';
    const isCEO = req.user.role === 'ceo';
    const isHR = req.user.role === 'hr';

    // Check if assigned user exists and has appropriate role
    const assignedUser = await User.findById(assignedToId);
    if (!assignedUser) {
      return res.status(404).json({
        success: false,
        message: 'Assigned user not found'
      });
    }

    // Handle project-less tasks (general HR/administrative tasks)
    let project = null;
    let isProjectManager = false;

    if (projectId) {
      // Check if project exists
      project = await Project.findById(projectId);

      if (!project) {
        return res.status(404).json({
          success: false,
          message: 'Project not found'
        });
      }

      isProjectManager = project.assignedManager.toString() === req.user.id;

      // Only the assigned project manager or co-founder/CEO can create project tasks
      if (!isCofounder && !isCEO && !isProjectManager) {
        return res.status(403).json({
          success: false,
          message: 'You are not authorized to create tasks for this project'
        });
      }
    } else {
      // No project specified - this is a general task
      // Only cofounder, CEO, or HR can create general tasks
      if (!isCofounder && !isCEO && !isHR) {
        return res.status(403).json({
          success: false,
          message: 'Only co-founders, CEO, or HR can create general tasks without a project'
        });
      }

      // General tasks can only be assigned to HR or managers
      if (!['hr', 'manager'].includes(assignedUser.role)) {
        return res.status(400).json({
          success: false,
          message: 'General tasks (without project) can only be assigned to HR or managers'
        });
      }
    }

    // For cofounder-initiated tasks, assignee must be manager or HR
    if (source === 'cofounder_rag' && isCofounder) {
      if (!['manager', 'hr'].includes(assignedUser.role)) {
        return res.status(400).json({
          success: false,
          message: 'Cofounder-initiated tasks must be assigned to managers or HR, who can then sub-assign to team members'
        });
      }
    } else {
      // Regular tasks - assignee must be team members (developers, interns, service delivery, etc.)
      if (!['individual', 'service-delivery', 'service-onboarding', 'developer', 'intern'].includes(assignedUser.role)) {
        return res.status(400).json({
          success: false,
          message: 'Tasks can only be assigned to team members (developers, interns, service delivery, or service onboarding)'
        });
      }
    }

    // Handle task overriding for urgent cofounder tasks
    let overriddenTasks = [];
    if (requiresOverride && isCofounder && source === 'cofounder_rag') {
      // Find conflicting tasks for the same assignee with overlapping deadlines
      const urgentDeadline = new Date(deadline);
      const assigneeTasks = await Task.find({
        assignedTo: assignedToId,
        status: { $in: ['not-started', 'in-progress'] },
        deadline: {
          $gte: new Date(),
          $lte: urgentDeadline
        }
      });

      // Mark lower priority tasks for postponement
      for (const existingTask of assigneeTasks) {
        if (existingTask.priority !== 'urgent' && existingTask.source !== 'cofounder_rag') {
          // Push deadline by 3 days
          const newDeadline = new Date(existingTask.deadline);
          newDeadline.setDate(newDeadline.setDate() + 3);

          existingTask.deadline = newDeadline;
          existingTask.comments.push({
            user: req.user.id,
            text: `⚠️ Deadline postponed due to urgent cofounder task: "${title}". Original deadline was ${existingTask.deadline.toLocaleDateString()}.`,
            createdAt: new Date()
          });

          await existingTask.save();
          overriddenTasks.push({
            id: existingTask._id,
            title: existingTask.title,
            newDeadline: newDeadline
          });
        }
      }
    }

    // Calculate auto-boosted points for cofounder tasks if not specified
    let finalPoints = points || 1;
    if (source === 'cofounder_rag' && isCofounder) {
      if (!points) {
        // Auto-calculate based on priority
        const priorityPoints = {
          'urgent': 8,
          'high': 5,
          'medium': 3,
          'low': 2
        };
        finalPoints = priorityPoints[priority] || 3;
      } else {
        // Boost provided points by 50% for cofounder tasks
        finalPoints = Math.ceil(points * 1.5);
      }
    }

    // Create the task
    const taskData = {
      title,
      description,
      assignedTo: assignedToId,
      assignedBy: req.user.id,
      deadline,
      points: finalPoints,
      priority: priority || 'medium',
      status: 'not-started',
      source: source || 'manual',
      requiresOverride: requiresOverride || false,
      taskType: projectId ? 'project' : 'default'  // Mark as general task if no project
    };

    // Only add project if specified
    if (projectId) {
      taskData.project = projectId;
    }


    const task = await Task.create(taskData);

    // ===== TASK INTELLIGENCE: Auto-analyze complexity =====
    try {
      const intelligenceResult = await TaskIntelligenceService.analyzeTaskComplexity({
        title: task.title,
        description: task.description,
        phase: TaskIntelligenceService.mapCategoryToPhase(task.taskCategory),
        dependencies: [], // Could extract from description or future dependency field
        priority: task.priority
      });

      if (intelligenceResult.success && intelligenceResult.data) {
        // Update task with intelligence data
        task.points = intelligenceResult.data.points;
        task.complexityScore = intelligenceResult.data.complexityScore;
        task.complexityDimensions = intelligenceResult.data.dimensions;
        task.complexityExplanation = intelligenceResult.data.explanation;
        task.intelligenceGenerated = true;
        await task.save();
      } else {
        // Fallback: keep original points
        console.log('Task Intelligence unavailable, using manual points');
      }
    } catch (error) {
      // Silent fail - task already created, intelligence is optional
      console.error('Task Intelligence error:', error.message);
    }
    // ===== END TASK INTELLIGENCE =====

    // Update project points only if project exists
    if (project) {
      await project.calculateProgress();
    }

    // Invalidate HR dashboard cache since task data changed
    invalidateHRCache();

    // Return the created task with populated fields
    const populatedTask = await Task.findById(task._id)
      .populate('project', 'name')
      .populate('assignedTo', 'firstName lastName email role')
      .populate('assignedBy', 'firstName lastName email');

    const response = {
      success: true,
      message: 'Task created successfully',
      data: populatedTask
    };

    // Add override information if applicable
    if (overriddenTasks.length > 0) {
      response.overriddenTasks = overriddenTasks;
      response.message += ` (${overriddenTasks.length} task(s) postponed due to urgency)`;
    }

    // Add point boost notification for cofounder tasks
    if (source === 'cofounder_rag' && isCofounder) {
      response.pointsBoost = {
        original: points || null,
        final: finalPoints,
        reason: points ? '50% boost for cofounder-initiated task' : 'Auto-calculated based on priority'
      };
    }

    res.status(201).json(response);

  } catch (error) {
    console.error('Create task error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create task',
      error: process.env.NODE_ENV === 'development' ? error.message : {}
    });
  }
};

// @desc    Get all tasks (filtered by role/project)
// @route   GET /api/tasks
// @access  Private
const getAllTasks = async (req, res) => {
  try {
    let tasks;
    const { projectId, status } = req.query;

    // Build query based on role and projectId
    const query = {};
    if (projectId) query.project = projectId;
    if (status) {
      const statuses = status.split(',').map(s => s.trim());
      query.status = { $in: statuses };
    }

    switch (req.user.role) {
      case 'ceo':
      case 'co-founder':
      case 'hr':
        // Can see all tasks (optionally filtered by project)
        tasks = await Task.find(query)
          .populate('project', 'name')
          .populate('assignedTo', 'firstName lastName email')
          .populate('assignedBy', 'firstName lastName email')
          .sort({ deadline: 1 });
        break;

      case 'manager':
        // If project is specified, check if manager is assigned to that project
        if (projectId) {
          const project = await Project.findById(projectId);
          if (!project || project.assignedManager.toString() !== req.user.id) {
            return res.status(403).json({
              success: false,
              message: 'You do not have permission to view tasks for this project'
            });
          }
        }

        // Get all projects assigned to this manager
        const managedProjects = await Project.find({ assignedManager: req.user.id }).select('_id');
        const managedProjectIds = managedProjects.map(p => p._id);

        // Get all team members (subordinates)
        const teamMembers = await User.find({
          role: { $in: ['individual', 'service-delivery', 'service-onboarding', 'intern', 'developer', 'team-lead'] }
        }).select('_id');
        const teamMemberIds = teamMembers.map(u => u._id);

        // Filter tasks by these projects OR tasks assigned to manager OR tasks assigned to team members
        tasks = await Task.find({
          ...query,
          $or: [
            { project: { $in: managedProjectIds } },
            { assignedTo: req.user.id },
            { assignedTo: { $in: teamMemberIds } }
          ]
        })
          .populate('project', 'name')
          .populate('assignedTo', 'firstName lastName email')
          .populate('assignedBy', 'firstName lastName email')
          .sort({ deadline: 1 });
        break;

      case 'individual':
      case 'service-delivery':
      case 'service-onboarding':
      case 'developer':
      case 'intern':
      case 'team-lead':
        // Check if user is requesting tasks for a specific assignee (mentee)
        if (req.user.role === 'developer' || req.user.role === 'team-lead') {
          // Fetch user with mentorFor populated to be safe, though usually req.user might not have it
          // Assuming req.user is from middleware, simpler to fresh fetch or trust if populated.
          // Let's safe fetch.
          const userWithMentorship = await User.findById(req.user.id);
          const menteeIds = userWithMentorship.mentorFor ? userWithMentorship.mentorFor.map(id => id.toString()) : [];

          if (req.query.assignedTo) {
            // Allow team-leads and developers to view any intern/developer's tasks (for leave handover management)
            const allowedRoles = ['team-lead', 'developer'];
            const canViewAnyTasks = allowedRoles.includes(req.user.role);

            if (canViewAnyTasks || menteeIds.includes(req.query.assignedTo) || req.query.assignedTo === req.user.id) {
              query.assignedTo = req.query.assignedTo;

              // If viewing mentee tasks, don't force filtering by assignedTo: req.user.id
              // Just use the query builder
              tasks = await Task.find(query)
                .populate('project', 'name')
                .populate('assignedTo', 'firstName lastName email')
                .populate('assignedBy', 'firstName lastName email')
                .sort({ deadline: 1 });
              break;
            }
          }
        }

        // Default: Individuals, developers, interns, and team leads can only see tasks assigned to them
        tasks = await Task.find({ ...query, assignedTo: req.user.id })
          .populate('project', 'name')
          .populate('assignedTo', 'firstName lastName email')
          .populate('assignedBy', 'firstName lastName email')
          .sort({ deadline: 1 });

        // Filter out tasks that are part of assigned bunches
        // (to avoid showing same task in both "My Tasks" and "My Task Bunches")
        const TaskBunch = require('../models/TaskBunch');
        const userBunches = await TaskBunch.find({
          $or: [
            { assignedTo: req.user.id },
            { tasks: { $in: tasks.map(t => t._id) } }
          ]
        }).select('tasks assignedTo');

        // Get task IDs that are in assigned bunches
        const taskIdsInAssignedBunches = new Set();
        userBunches.forEach(bunch => {
          // Only exclude tasks if the whole bunch is assigned to user
          if (bunch.assignedTo && bunch.assignedTo.toString() === req.user.id.toString()) {
            bunch.tasks.forEach(taskId => {
              taskIdsInAssignedBunches.add(taskId.toString());
            });
          }
        });

        // Filter out tasks that are in assigned bunches
        tasks = tasks.filter(task => !taskIdsInAssignedBunches.has(task._id.toString()));

        break;

      default:
        return res.status(403).json({
          success: false,
          message: 'Unauthorized access'
        });
    }

    res.status(200).json({
      success: true,
      count: tasks.length,
      data: tasks
    });

  } catch (error) {
    console.error('Get tasks error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch tasks',
      error: process.env.NODE_ENV === 'development' ? error.message : {}
    });
  }
};

// @desc    Get a single task
// @route   GET /api/tasks/:id
// @access  Private (Based on role/assignment)
const getTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id)
      .populate('project', 'name assignedManager')
      .populate('assignedTo', 'firstName lastName email')
      .populate('assignedBy', 'firstName lastName email')
      .populate('reviewedBy', 'firstName lastName email')
      .populate('evidence.submittedBy', 'firstName lastName email role')
      .populate('statusHistory.changedBy', 'firstName lastName email role')
      .populate('statusHistory.evidence.submittedBy', 'firstName lastName email role')
      .populate('revisionHistory.requestedBy', 'firstName lastName email role')
      .populate({
        path: 'checkpoints',
        options: { sort: { createdAt: 1 } },
        populate: {
          path: 'completedBy',
          select: 'firstName lastName email'
        }
      });

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    // Check permissions based on role
    if (req.user.role === 'manager') {
      // Make sure manager is assigned to the project
      if (task.project.assignedManager.toString() !== req.user.id) {
        return res.status(403).json({
          success: false,
          message: 'You do not have permission to view this task'
        });
      }
    } else if (isIndividualRole(req.user.role)) {
      // Make sure task is assigned to this individual
      if (task.assignedTo._id.toString() !== req.user.id) {
        return res.status(403).json({
          success: false,
          message: 'You do not have permission to view this task'
        });
      }
    }

    res.status(200).json({
      success: true,
      data: task
    });

  } catch (error) {
    console.error('Get task error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch task',
      error: process.env.NODE_ENV === 'development' ? error.message : {}
    });
  }
};

// @desc    Update a task
// @route   PUT /api/tasks/:id
// @access  Private (Manager or Assigned Individual for status only)
const updateTask = async (req, res) => {
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

    const task = await Task.findById(req.params.id)
      .populate('project', 'assignedManager')
      .populate('assignedTo', 'firstName lastName');

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    // Check permissions based on role
    let fieldsToUpdate = {};

    if (req.user.role === 'co-founder' || req.user.role === 'ceo') {
      // Co-founders and CEOs can update any field
      if (req.body.title) fieldsToUpdate.title = req.body.title;
      if (req.body.description) fieldsToUpdate.description = req.body.description;
      if (req.body.deadline) fieldsToUpdate.deadline = req.body.deadline;
      if (req.body.status) fieldsToUpdate.status = req.body.status;
      if (req.body.points) fieldsToUpdate.points = req.body.points;
      if (req.body.priority) fieldsToUpdate.priority = req.body.priority;

      // If assigned to a new user, verify they are an individual
      if (req.body.assignedToId) {
        const newAssignee = await User.findById(req.body.assignedToId);
        if (!newAssignee) {
          return res.status(404).json({
            success: false,
            message: 'New assignee not found'
          });
        }

        if (!['individual', 'service-delivery', 'service-onboarding'].includes(newAssignee.role)) {
          return res.status(400).json({
            success: false,
            message: 'Tasks can only be assigned to service delivery or service onboarding team members'
          });
        }

        fieldsToUpdate.assignedTo = req.body.assignedToId;
      }

    } else if (req.user.role === 'manager') {
      // Make sure manager is assigned to the project
      if (task.project.assignedManager.toString() !== req.user.id) {
        return res.status(403).json({
          success: false,
          message: 'You do not have permission to update this task'
        });
      }

      // Managers can update any field except the project
      if (req.body.title) fieldsToUpdate.title = req.body.title;
      if (req.body.description) fieldsToUpdate.description = req.body.description;
      if (req.body.deadline) fieldsToUpdate.deadline = req.body.deadline;
      if (req.body.status) fieldsToUpdate.status = req.body.status;
      if (req.body.points) fieldsToUpdate.points = req.body.points;
      if (req.body.priority) fieldsToUpdate.priority = req.body.priority;

      // If assigned to a new user, verify they are an individual
      if (req.body.assignedToId) {
        const newAssignee = await User.findById(req.body.assignedToId);
        if (!newAssignee) {
          return res.status(404).json({
            success: false,
            message: 'New assignee not found'
          });
        }

        if (!['individual', 'service-delivery', 'service-onboarding'].includes(newAssignee.role)) {
          return res.status(400).json({
            success: false,
            message: 'Tasks can only be assigned to service delivery or service onboarding team members'
          });
        }

        fieldsToUpdate.assignedTo = req.body.assignedToId;
      }

      // Managers can also review completed tasks
      if (req.body.isApproved !== undefined) {
        fieldsToUpdate.isApproved = req.body.isApproved;
        fieldsToUpdate.reviewedBy = req.user.id;
        fieldsToUpdate.reviewedAt = new Date();
      }

      if (req.body.revisionRequired !== undefined) {
        fieldsToUpdate.revisionRequired = req.body.revisionRequired;
        fieldsToUpdate.revisionComments = req.body.revisionComments;
        // If revision required, change status back to in-progress
        if (req.body.revisionRequired) {
          fieldsToUpdate.status = 'in-progress';
        }
      }

    } else if (isIndividualRole(req.user.role)) {
      // Make sure task is assigned to this individual
      if (task.assignedTo._id.toString() !== req.user.id) {
        return res.status(403).json({
          success: false,
          message: 'You do not have permission to update this task'
        });
      }

      // Individuals can only update the status
      if (req.body.status) {
        fieldsToUpdate.status = req.body.status;

        // If marking as completed, record the completion date
        if (req.body.status === 'completed' && task.status !== 'completed') {
          fieldsToUpdate.completedAt = new Date();
        }
      }
    } else {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to update this task'
      });
    }

    // Update the task
    const updatedTask = await Task.findByIdAndUpdate(
      req.params.id,
      fieldsToUpdate,
      { new: true, runValidators: true }
    )
      .populate('project', 'name')
      .populate('assignedTo', 'firstName lastName email')
      .populate('assignedBy', 'firstName lastName email')
      .populate('reviewedBy', 'firstName lastName email');

    // Update project progress
    const project = await Project.findById(task.project._id);
    if (project) {
      await project.calculateProgress();
    }

    res.status(200).json({
      success: true,
      message: 'Task updated successfully',
      data: updatedTask
    });

  } catch (error) {
    console.error('Update task error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update task',
      error: process.env.NODE_ENV === 'development' ? error.message : {}
    });
  }
};

// @desc    Delete a task
// @route   DELETE /api/tasks/:id
// @access  Private (Manager only)
const deleteTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id)
      .populate('project', 'assignedManager');

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    // Check permissions (only manager assigned to project or co-founder/CEO can delete)
    if (
      req.user.role !== 'co-founder' &&
      req.user.role !== 'ceo' &&
      (req.user.role !== 'manager' || task.project.assignedManager.toString() !== req.user.id)
    ) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to delete this task'
      });
    }

    // Delete all associated checkpoints
    await Checkpoint.deleteMany({ task: req.params.id });

    // Delete the task
    await Task.findByIdAndDelete(req.params.id);

    // Update project progress
    const project = await Project.findById(task.project._id);
    if (project) {
      await project.calculateProgress();
    }

    res.status(200).json({
      success: true,
      message: 'Task deleted successfully'
    });

  } catch (error) {
    console.error('Delete task error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete task',
      error: process.env.NODE_ENV === 'development' ? error.message : {}
    });
  }
};

// @desc    Add a comment to a task
// @route   POST /api/tasks/:id/comments
// @access  Private (Anyone with access to the task)
const addComment = async (req, res) => {
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

    const task = await Task.findById(req.params.id)
      .populate('project', 'assignedManager')
      .populate('assignedTo', 'firstName lastName');

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    // Check if user has access to this task
    if (req.user.role === 'manager') {
      if (task.project.assignedManager.toString() !== req.user.id) {
        return res.status(403).json({
          success: false,
          message: 'You do not have permission to comment on this task'
        });
      }
    } else if (isIndividualRole(req.user.role)) {
      if (task.assignedTo._id.toString() !== req.user.id) {
        return res.status(403).json({
          success: false,
          message: 'You do not have permission to comment on this task'
        });
      }
    }

    // Add the comment
    task.comments.push({
      user: req.user.id,
      text: req.body.comment
    });

    await task.save();

    // Return the updated task with populated comments
    const updatedTask = await Task.findById(req.params.id)
      .populate('project', 'name')
      .populate('assignedTo', 'firstName lastName email')
      .populate('assignedBy', 'firstName lastName email')
      .populate('comments.user', 'firstName lastName role');

    res.status(200).json({
      success: true,
      message: 'Comment added successfully',
      data: updatedTask
    });

  } catch (error) {
    console.error('Add comment error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add comment',
      error: process.env.NODE_ENV === 'development' ? error.message : {}
    });
  }
};

// @desc    Get all available individuals for task assignment
// @route   GET /api/tasks/individuals
// @access  Private (Manager, Co-founder, CEO)
const getAvailableIndividuals = async (req, res) => {
  try {
    if (req.user.role !== 'manager' && req.user.role !== 'co-founder' && req.user.role !== 'ceo') {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized access'
      });
    }

    const individuals = await User.find({
      role: { $in: ['individual', 'service-delivery', 'service-onboarding'] },
      isActive: true
    })
      .select('firstName lastName email employeeId');

    res.status(200).json({
      success: true,
      count: individuals.length,
      data: individuals
    });

  } catch (error) {
    console.error('Get individuals error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch individuals',
      error: process.env.NODE_ENV === 'development' ? error.message : {}
    });
  }
};

// @desc    Accept a task
// @route   PATCH /api/tasks/:id/accept
// @access  Private (Individual assigned to task)
const acceptTask = async (req, res) => {
  try {
    const { id } = req.params;

    console.log('🔵 Accept Task Request:');
    console.log('  Task ID:', id);
    console.log('  User ID:', req.user.id);
    console.log('  User Email:', req.user.email);
    console.log('  User Role:', req.user.role);

    const task = await Task.findById(id);

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    // Check if current user is assigned to this task OR if task is unassigned (allow claiming)
    if (task.assignedTo && task.assignedTo.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'You can only accept tasks assigned to you'
      });
    }

    // If task was unassigned, assign it to the user
    if (!task.assignedTo) {
      task.assignedTo = req.user.id;
      // If it was pending assignment, we might want to set assignedBy to system or keep null
      // task.assignedBy = req.user.id; // Optional: self-assigned
    }

    // Update task status to in-progress
    task.status = 'in-progress';
    task.acceptedAt = new Date();
    await task.save();

    console.log('✅ Task accepted successfully');

    // Invalidate HR dashboard cache since task status changed
    invalidateHRCache();

    res.status(200).json({
      success: true,
      message: 'Task accepted successfully',
      data: task
    });
  } catch (error) {
    console.error('Accept task error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to accept task',
      error: process.env.NODE_ENV === 'development' ? error.message : {}
    });
  }
};

// @desc    Update task status
// @route   PATCH /api/tasks/:id/status
// @access  Private (Individual assigned to task)
const updateTaskStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ['assigned', 'not-started', 'in-progress', 'cant-complete', 'review', 'completed'];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status provided'
      });
    }

    const task = await Task.findById(id).populate('assignedTo originalAssignee');

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    // Check if current user is assigned to this task or is a manager/admin
    if (
      task.assignedTo._id.toString() !== req.user.id &&
      !['manager', 'co-founder', 'ceo'].includes(req.user.role)
    ) {
      return res.status(403).json({
        success: false,
        message: 'You can only update tasks assigned to you'
      });
    }

    task.status = status;
    task.lastUpdated = new Date();

    if (status === 'completed') {
      task.completedAt = new Date();
      task.completedBy = req.user._id;
      task.pointsEarnedBy = req.user._id;

      // Check if this is a coverage task (reassigned task)
      if (task.isReassigned && task.originalAssignee) {
        task.isCoverageTask = true;
        task.coveredFor = task.originalAssignee._id;
        console.log(`Coverage task completed: ${task.title} by ${req.user.firstName} for ${task.originalAssignee.firstName}`);
      }

      // Award points to the person who completed the task
      await User.findByIdAndUpdate(req.user._id, {
        $inc: { totalPoints: task.points }
      });

      console.log(`Awarded ${task.points} points to ${req.user.firstName} ${req.user.lastName}`);
    }

    await task.save();

    res.status(200).json({
      success: true,
      message: `Task status updated to ${status}`,
      data: task
    });
  } catch (error) {
    console.error('Update task status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update task status',
      error: process.env.NODE_ENV === 'development' ? error.message : {}
    });
  }
};

// @desc    Complete a task
// @route   PATCH /api/tasks/:id/complete
// @access  Private (Individual assigned to task)
const completeTask = async (req, res) => {
  try {
    const { id } = req.params;

    console.log('Starting task completion for task ID:', id, 'by user:', req.user.id);

    const task = await Task.findById(id).populate('checkpoints');

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    console.log('Task found:', {
      taskId: task._id,
      currentStatus: task.status,
      assignedTo: task.assignedTo,
      checkpoints: task.checkpoints?.length || 0
    });

    // Check if current user is assigned to this task
    if (task.assignedTo.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'You can only complete tasks assigned to you'
      });
    }

    // Check if all checkpoints are completed (only if checkpoints exist)
    if (task.checkpoints && task.checkpoints.length > 0) {
      const allCheckpointsCompleted = task.checkpoints.every(cp => cp.isCompleted);

      if (!allCheckpointsCompleted) {
        const incompleteCheckpoints = task.checkpoints.filter(cp => !cp.isCompleted);
        console.log('Incomplete checkpoints:', incompleteCheckpoints.map(cp => cp._id));
        return res.status(400).json({
          success: false,
          message: 'All checkpoints must be completed before marking task as completed',
          incompleteCheckpoints: incompleteCheckpoints.length
        });
      }
    }

    // Update task status
    task.status = 'completed';
    task.completedAt = new Date();

    console.log('Before saving task:', {
      taskId: task._id,
      status: task.status,
      completedAt: task.completedAt,
      modified: task.modifiedPaths()
    });

    await task.save();

    // Invalidate HR dashboard cache since task completed
    invalidateHRCache();

    // Verify the task was saved correctly by fetching fresh from DB
    const savedTask = await Task.findById(task._id)
      .populate('assignedTo', 'firstName lastName email')
      .populate('project', 'name');

    console.log('After saving task:', {
      taskId: savedTask._id,
      status: savedTask.status,
      completedAt: savedTask.completedAt
    });

    res.status(200).json({
      success: true,
      message: 'Task completed successfully',
      data: savedTask
    });
  } catch (error) {
    console.error('Complete task error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to complete task',
      error: process.env.NODE_ENV === 'development' ? error.message : {}
    });
  }
};

// @desc    Force complete a task (bypass checkpoint validation)
// @route   PATCH /api/tasks/:id/force-complete
// @access  Private (Individual assigned to task)
const forceCompleteTask = async (req, res) => {
  try {
    const { id } = req.params;

    console.log('Force completing task ID:', id, 'by user:', req.user.id);

    const task = await Task.findById(id);

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    // Check if current user is assigned to this task
    if (task.assignedTo.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'You can only complete tasks assigned to you'
      });
    }

    // Force update task status without checkpoint validation
    const updatedTask = await Task.findByIdAndUpdate(
      id,
      {
        status: 'completed',
        completedAt: new Date()
      },
      {
        new: true,
        runValidators: true
      }
    ).populate('assignedTo', 'firstName lastName email')
      .populate('project', 'name');

    console.log('Force completed task:', {
      taskId: updatedTask._id,
      status: updatedTask.status,
      completedAt: updatedTask.completedAt
    });

    res.status(200).json({
      success: true,
      message: 'Task force completed successfully',
      data: updatedTask
    });
  } catch (error) {
    console.error('Force complete task error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to force complete task',
      error: process.env.NODE_ENV === 'development' ? error.message : {}
    });
  }
};

// @desc    Update task status with evidence
// @route   POST /api/tasks/update-with-evidence
// @access  Private (Individual)
const updateTaskWithEvidence = async (req, res) => {
  try {
    const { taskId, newStatus, description, evidenceType, notes } = req.body;

    // Validate required fields
    if (!taskId || !newStatus || !description) {
      return res.status(400).json({
        success: false,
        message: 'Task ID, new status, and description are required'
      });
    }

    // Find the task
    const task = await Task.findById(taskId)
      .populate('assignedTo', 'firstName lastName email')
      .populate('assignedBy', 'firstName lastName email')
      .populate('project', 'name');

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    // Check if user is assigned to this task
    if (task.assignedTo._id.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'You can only update tasks assigned to you'
      });
    }

    // Validate status transition
    const validTransitions = {
      'not-started': ['accept', 'in-progress'],
      'assigned': ['accept', 'in-progress'],
      'accepted': ['in-progress', 'cant-complete'],
      'in-progress': ['completed', 'cant-complete', 'review'],
      'cant-complete': ['in-progress'],
      'review': ['in-progress', 'completed'],
      'needs-revision': ['in-progress', 'review']
    };

    const currentStatus = task.status;
    if (!validTransitions[currentStatus] || !validTransitions[currentStatus].includes(newStatus)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status transition from ${currentStatus} to ${newStatus}`
      });
    }

    // Process uploaded files
    const evidence = {
      type: evidenceType || 'mixed',
      description,
      notes: notes || '',
      files: [],
      urls: [],
      submittedAt: new Date(),
      submittedBy: req.user.id
    };

    // Handle file uploads
    if (req.files && req.files.length > 0) {
      evidence.files = req.files.map(file => ({
        originalName: file.originalname,
        filename: file.filename,
        path: file.path,
        mimetype: file.mimetype,
        size: file.size
      }));
    }

    // Handle URLs
    const urls = [];
    for (let i = 0; req.body[`urls[${i}]`]; i++) {
      const url = req.body[`urls[${i}]`];
      if (url && url.trim()) {
        urls.push(url.trim());
      }
    }
    evidence.urls = urls;

    // Update task status and add evidence
    const statusUpdate = {
      status: newStatus === 'accept' ? 'in-progress' : newStatus,
      updatedAt: new Date(),
      evidence: evidence  // Store evidence in main task field too
    };

    // Set specific timestamps
    if (newStatus === 'accept' || (newStatus === 'in-progress' && currentStatus === 'not-started')) {
      statusUpdate.acceptedAt = new Date();
    } else if (newStatus === 'completed') {
      statusUpdate.completedAt = new Date();
    }

    // Initialize statusHistory if it doesn't exist
    if (!task.statusHistory) {
      task.statusHistory = [];
    }

    // Add to status history
    task.statusHistory.push({
      status: statusUpdate.status,
      changedAt: new Date(),
      changedBy: req.user.id,
      evidence: evidence
    });

    // Update task (this will also set task.evidence)
    Object.assign(task, statusUpdate);
    await task.save();

    // Populate the updated task
    const updatedTask = await Task.findById(taskId)
      .populate('assignedTo', 'firstName lastName email')
      .populate('assignedBy', 'firstName lastName email')
      .populate('project', 'name')
      .populate('statusHistory.changedBy', 'firstName lastName');

    res.status(200).json({
      success: true,
      message: `Task ${newStatus === 'accept' ? 'accepted' : newStatus} successfully with evidence`,
      data: updatedTask
    });

  } catch (error) {
    console.error('Update task with evidence error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update task with evidence',
      error: process.env.NODE_ENV === 'development' ? error.message : {}
    });
  }
};

// @desc    Submit task evidence for review
// @route   PUT /api/tasks/:id/submit
// @access  Private (Assigned User)
const submitTaskEvidence = async (req, res) => {
  try {
    const { id } = req.params;
    const { verificationUrl } = req.body;

    // Find the task
    const task = await Task.findById(id);

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    // Check if user is assigned to this task
    // Allow assignedTo user OR coveredFor user (if coverage task)
    const isAssignee = task.assignedTo && task.assignedTo.toString() === req.user.id;
    const isCovering = task.isCoverageTask && task.coveredFor && task.coveredFor.toString() === req.user.id; // Logic check: actually coverage task is usually done BY someone else.
    // Let's stick to assignedTo check for now. The person doing the task is assignedTo.

    // Strict check: Only the assigned user can submit evidence?
    // Or anyone with role if it's open? For now, stick to basic check.
    if (task.assignedTo && task.assignedTo.toString() !== req.user.id) {
      // Check if user is admin/manager just in case, but usually only assignee submits
      if (!['manager', 'admin', 'ceo', 'co-founder'].includes(req.user.role)) {
        return res.status(403).json({
          success: false,
          message: 'You can only submit evidence for tasks assigned to you'
        });
      }
    }

    // Process evidence
    const evidence = {
      type: 'mixed',
      description: 'Task completion evidence submitted',
      notes: req.body.notes || '',
      files: [],
      urls: [],
      submittedAt: new Date(),
      submittedBy: req.user.id
    };

    // Handle files (verificationImage or generic files)
    if (req.files) {
      if (req.files.verificationImage) {
        req.files.verificationImage.forEach(file => {
          evidence.files.push({
            originalName: file.originalname,
            filename: file.filename,
            path: file.path,
            mimetype: file.mimetype,
            size: file.size
          });
        });
      }
      if (req.files.files) {
        req.files.files.forEach(file => {
          evidence.files.push({
            originalName: file.originalname,
            filename: file.filename,
            path: file.path,
            mimetype: file.mimetype,
            size: file.size
          });
        });
      }
    }

    // Handle URL
    if (verificationUrl && verificationUrl.trim()) {
      evidence.urls.push(verificationUrl.trim());
    }

    // Update task
    task.status = 'review';
    task.evidence = evidence; // Store latest evidence

    // Add to history
    task.statusHistory.push({
      status: 'review',
      changedAt: new Date(),
      changedBy: req.user.id,
      evidence: evidence
    });

    await task.save();

    res.status(200).json({
      success: true,
      message: 'Evidence submitted successfully',
      data: task
    });

  } catch (error) {
    console.error('Submit evidence error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to submit evidence',
      error: process.env.NODE_ENV === 'development' ? error.message : {}
    });
  }
};

// @desc    Get task details for manager view
// @route   GET /api/tasks/:id/details
// @access  Private (Manager)
const getTaskDetails = async (req, res) => {
  try {
    const { id } = req.params;

    const task = await Task.findById(id)
      .populate('assignedTo', 'firstName lastName email role')
      .populate('assignedBy', 'firstName lastName email role')
      .populate('project', 'title description')
      .populate('reviewedBy', 'firstName lastName email')
      .populate('statusHistory.changedBy', 'firstName lastName')
      .populate('comments.user', 'firstName lastName profilePicture');

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    // Check if user has permission to view this task
    const userRole = req.user.role;
    const allowedRoles = ['manager', 'ceo', 'hr', 'team-lead', 'co-founder', 'developer', 'intern'];

    if (!allowedRoles.includes(userRole)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You do not have permission to view task details.'
      });
    }

    res.status(200).json({
      success: true,
      data: task
    });

  } catch (error) {
    console.error('Get task details error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get task details',
      error: process.env.NODE_ENV === 'development' ? error.message : {}
    });
  }
};

// @desc    Complete task by manager and award points
// @route   PATCH /api/tasks/:id/manager-complete
// @access  Private (Manager)
const managerCompleteTask = async (req, res) => {
  try {
    const { id } = req.params;
    const { pointsAwarded } = req.body;

    // Validate points
    if (!pointsAwarded || pointsAwarded <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Valid points to award are required'
      });
    }

    const task = await Task.findById(id)
      .populate('assignedTo', 'firstName lastName email role totalPoints')
      .populate('assignedBy', 'firstName lastName email role')
      .populate('project', 'name description');

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    // Check if task has an assigned user
    if (!task.assignedTo) {
      return res.status(400).json({
        success: false,
        message: 'Task has no assigned user'
      });
    }

    // Check if user has permission to complete this task
    if (!['manager', 'ceo', 'hr', 'team-lead', 'co-founder'].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Check if task is in review status
    if (task.status !== 'review') {
      return res.status(400).json({
        success: false,
        message: 'Task must be in review status to be completed by manager'
      });
    }

    // Update task status and add completion details
    task.status = 'completed';
    task.completedAt = new Date();
    task.completedByManager = true;
    task.completedByUser = req.user.id;
    task.pointsAwarded = pointsAwarded;
    task.reviewedBy = req.user.id;
    task.reviewedAt = new Date();
    task.isApproved = true;

    // Add to status history
    task.statusHistory.push({
      status: 'completed',
      changedBy: req.user.id,
      changedAt: new Date(),
      evidence: {
        type: 'document',
        description: `Completed by manager with ${pointsAwarded} points awarded`,
        notes: `Manager completion with ${pointsAwarded} points`,
        submittedAt: new Date()
      }
    });

    await task.save();

    // Update user's points
    if (task.assignedTo && task.assignedTo._id) {
      const assignedUser = await User.findById(task.assignedTo._id);
      if (assignedUser) {
        assignedUser.totalPoints = (assignedUser.totalPoints || 0) + pointsAwarded;
        await assignedUser.save();
      }
    }

    // Populate the updated task for response
    const updatedTask = await Task.findById(id)
      .populate('assignedTo', 'firstName lastName email role totalPoints')
      .populate('project', 'name description')
      .populate('reviewedBy', 'firstName lastName email');

    const assignedUserName = task.assignedTo && task.assignedTo.firstName && task.assignedTo.lastName
      ? `${task.assignedTo.firstName} ${task.assignedTo.lastName}`
      : 'the assigned user';

    res.status(200).json({
      success: true,
      message: `Task completed successfully and ${pointsAwarded} points awarded to ${assignedUserName}`,
      data: updatedTask
    });

  } catch (error) {
    console.error('Manager complete task error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to complete task',
      error: process.env.NODE_ENV === 'development' ? error.message : {}
    });
  }
};

// @desc    Get unassigned automated tasks
// @route   GET /api/tasks/unassigned
// @access  Private (Manager)
const getUnassignedTasks = async (req, res) => {
  try {
    // Only managers can see unassigned tasks
    if (req.user.role !== 'manager') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Managers only.'
      });
    }

    // Find tasks that are automated and have no assigned user (pending assignment)
    const unassignedTasks = await Task.find({
      isAutomated: true,
      status: 'pending-assignment',
      assignedTo: { $exists: false }
    })
      .populate('project', 'name description assignedManager')
      .populate('createdBy', 'firstName lastName email')
      .sort({ createdAt: -1 });

    // Filter tasks where the manager is assigned to the project
    const managerTasks = unassignedTasks.filter(task =>
      task.project && task.project.assignedManager &&
      task.project.assignedManager.toString() === req.user.id
    );

    res.status(200).json({
      success: true,
      count: managerTasks.length,
      data: managerTasks
    });

  } catch (error) {
    console.error('Get unassigned tasks error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch unassigned tasks',
      error: process.env.NODE_ENV === 'development' ? error.message : {}
    });
  }
};

// @desc    Request revision for a task
// @route   PATCH /api/tasks/:id/request-revision
// @access  Private (Manager)
const requestRevision = async (req, res) => {
  try {
    const { id } = req.params;
    const { feedback, newDeadline } = req.body;

    // Validate input
    if (!feedback || feedback.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Feedback is required for revision requests'
      });
    }

    const task = await Task.findById(id)
      .populate('assignedTo', 'firstName lastName email role')
      .populate('assignedBy', 'firstName lastName email role')
      .populate('project', 'name description assignedManager');

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    // Check if user has permission to request revision
    if (!['manager', 'ceo', 'hr', 'team-lead', 'co-founder'].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Allow revision requests for active or reviewable tasks (not just 'review' status)
    // This supports the "Global Review" feature where leads can request changes even on completed/in-progress tasks
    if (!['review', 'completed', 'in-progress'].includes(task.status)) {
      return res.status(400).json({
        success: false,
        message: 'Revisions can only be requested for active, completed, or review-pending tasks'
      });
    }

    // Parse and validate new deadline
    let revisionDeadline = null;
    if (newDeadline) {
      revisionDeadline = new Date(newDeadline);
      if (isNaN(revisionDeadline.getTime())) {
        return res.status(400).json({
          success: false,
          message: 'Invalid deadline format'
        });
      }

      // Ensure new deadline is in the future
      if (revisionDeadline <= new Date()) {
        return res.status(400).json({
          success: false,
          message: 'New deadline must be in the future'
        });
      }
    }

    // Update task status and add revision request
    task.status = 'needs-revision';
    task.revisionRequired = true;
    task.revisionCount = (task.revisionCount || 0) + 1;
    task.revisionDeadline = revisionDeadline;

    // Update main deadline if new deadline provided
    if (revisionDeadline) {
      task.deadline = revisionDeadline;
    }

    // Add to revision history
    task.revisionHistory.push({
      requestedBy: req.user.id,
      requestedAt: new Date(),
      feedback: feedback.trim(),
      newDeadline: revisionDeadline,
      isResolved: false
    });

    // Add to status history
    task.statusHistory.push({
      status: 'needs-revision',
      changedBy: req.user.id,
      changedAt: new Date(),
      evidence: {
        type: 'document',
        description: `Revision requested: ${feedback.trim()}`,
        notes: revisionDeadline ? `New deadline: ${revisionDeadline.toISOString()}` : 'No new deadline specified',
        submittedAt: new Date()
      }
    });

    await task.save();

    // Invalidate HR dashboard cache since task data changed
    invalidateHRCache();

    // Populate the updated task for response
    const updatedTask = await Task.findById(id)
      .populate('assignedTo', 'firstName lastName email')
      .populate('project', 'name description')
      .populate('revisionHistory.requestedBy', 'firstName lastName email');

    const assignedUserName = task.assignedTo && task.assignedTo.firstName && task.assignedTo.lastName
      ? `${task.assignedTo.firstName} ${task.assignedTo.lastName}`
      : 'the assigned user';

    res.status(200).json({
      success: true,
      message: `Revision requested for task "${task.title}". ${assignedUserName} has been notified.`,
      data: updatedTask
    });

  } catch (error) {
    console.error('Request revision error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to request revision',
      error: process.env.NODE_ENV === 'development' ? error.message : {}
    });
  }
};

// @desc    Get tasks that are in review status for manager approval
// @route   GET /api/tasks/review
// @access  Private (Manager, Team Lead, CEO, HR)
const getTasksForReview = async (req, res) => {
  try {
    // Check if user has review permissions
    if (!['manager', 'ceo', 'hr', 'team-lead', 'co-founder'].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Fetch ALL tasks relevant for review/oversight
    // "Team lead sub ka kam review kr sakta hai" - User Request
    // This removes hierarchy restrictions and shows all team activity
    const tasks = await Task.find({
      // Show tasks that are active (Review, In Progress, Needs Revision)
      // Excluded 'completed' so approved tasks disappear from the list (Inbox style)
      status: { $in: ['review', 'in-progress', 'needs-revision'] },
      // Exclude tasks assigned to the reviewer themselves (they see these in "My Tasks")
      assignedTo: { $ne: req.user.id }
    })
      .populate('assignedTo', 'firstName lastName email employeeId')
      .populate('assignedBy', 'firstName lastName email')
      .populate('project', 'name description assignedManager')
      .populate('revisionHistory.requestedBy', 'firstName lastName email')
      .populate('comments.user', 'firstName lastName profilePicture')
      .sort({ updatedAt: -1 });

    res.status(200).json({
      success: true,
      count: tasks.length,
      data: tasks
    });

  } catch (error) {
    console.error('Get tasks for review error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch tasks for review',
      error: process.env.NODE_ENV === 'development' ? error.message : {}
    });
  }
};

// @desc    Resolve revision (when individual resubmits)
// @route   PATCH /api/tasks/:id/resolve-revision
// @access  Private (Individual - task owner)
const resolveRevision = async (req, res) => {
  try {
    const { id } = req.params;

    const task = await Task.findById(id)
      .populate('assignedTo', 'firstName lastName email')
      .populate('project', 'name description');

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    // Check if user is the assigned individual
    if (!task.assignedTo || task.assignedTo._id.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'You can only resolve revisions for tasks assigned to you'
      });
    }

    // Only allow resolution for tasks that need revision
    if (task.status !== 'needs-revision') {
      return res.status(400).json({
        success: false,
        message: 'This task does not require revision'
      });
    }

    // Mark latest revision as resolved and change status back to review
    if (task.revisionHistory && task.revisionHistory.length > 0) {
      const latestRevision = task.revisionHistory[task.revisionHistory.length - 1];
      latestRevision.resolvedAt = new Date();
      latestRevision.isResolved = true;
    }

    task.status = 'review';
    task.revisionRequired = false;

    // Add to status history
    task.statusHistory.push({
      status: 'review',
      changedBy: req.user.id,
      changedAt: new Date(),
      evidence: {
        type: 'document',
        description: 'Task resubmitted after addressing revision feedback',
        notes: 'Ready for manager review',
        submittedAt: new Date()
      }
    });

    await task.save();

    // Invalidate HR dashboard cache
    invalidateHRCache();

    res.status(200).json({
      success: true,
      message: 'Task resubmitted for review successfully',
      data: task
    });

  } catch (error) {
    console.error('Resolve revision error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to resolve revision',
      error: process.env.NODE_ENV === 'development' ? error.message : {}
    });
  }
};

// @desc    Delegate task to mentee
// @route   POST /api/tasks/:id/delegate
// @access  Private (Developer/Team-lead assigned to task)
const delegateTask = async (req, res) => {
  try {
    const { delegateToId, notes } = req.body;
    const taskId = req.params.id;

    if (!delegateToId) {
      return res.status(400).json({
        success: false,
        message: 'Please provide delegateToId'
      });
    }

    // Find the task
    const task = await Task.findById(taskId)
      .populate('assignedTo', 'firstName lastName')
      .populate('assignedBy', 'firstName lastName');

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    // Verify ownership
    // A user can delegate if:
    // 1. The task is directly assigned to them
    // 2. The task belongs to a bunch explicitly assigned to them
    const TaskBunch = require('../models/TaskBunch');
    const bunch = task.taskBunch ? await TaskBunch.findById(task.taskBunch) : null;

    const isDirectlyAssigned = task.assignedTo && task.assignedTo._id.toString() === req.user.id;
    const isBunchAssigned = bunch && bunch.assignedTo && bunch.assignedTo.toString() === req.user.id;

    if (!isDirectlyAssigned && !isBunchAssigned) {
      return res.status(403).json({
        success: false,
        message: 'You can only delegate tasks assigned to you or your assigned bunches'
      });
    }

    // Verify current user is developer or team-lead
    if (!['developer', 'team-lead'].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Only developers and team leads can delegate tasks'
      });
    }

    // Fetch current user's details for mentorship check (if not developer)
    const currentUser = await User.findById(req.user.id);
    if (!currentUser) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Verify delegate target is in user's mentorFor
    // Verify delegate target
    // Check if target is a mentee (unless user is developer, then allow any intern)
    let isAllowed = false;

    if (req.user.role === 'developer') {
      const targetUserCheck = await User.findById(delegateToId);
      if (targetUserCheck && targetUserCheck.role === 'intern') {
        isAllowed = true;
      }
    }

    if (!isAllowed && req.user.mentorFor) {
      isAllowed = req.user.mentorFor.some(
        menteeId => menteeId.toString() === delegateToId
      );
    }

    if (!isAllowed) {
      return res.status(403).json({
        success: false,
        message: 'You can only delegate to your mentees or interns'
      });
    }

    // Verify target user exists and is active
    const targetUser = await User.findById(delegateToId);
    if (!targetUser || !targetUser.isActive) {
      return res.status(404).json({
        success: false,
        message: 'Target user not found or inactive'
      });
    }

    // Update task with delegation info
    task.assignedTo = delegateToId;
    task.delegatedBy = req.user.id;
    task.delegatedAt = new Date();

    // Add to delegation history
    task.delegationHistory.push({
      from: req.user.id,
      to: delegateToId,
      delegatedAt: new Date(),
      notes: notes || ''
    });

    await task.save();

    // Return updated task with populated fields
    const updatedTask = await Task.findById(taskId)
      .populate('assignedTo', 'firstName lastName email role')
      .populate('assignedBy', 'firstName lastName email role')
      .populate('delegatedBy', 'firstName lastName email role')
      .populate('project', 'name');

    res.status(200).json({
      success: true,
      message: `Task delegated to ${targetUser.firstName} ${targetUser.lastName}`,
      data: updatedTask
    });

  } catch (error) {
    console.error('Delegate task error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delegate task',
      error: process.env.NODE_ENV === 'development' ? error.message : {}
    });
  }
};

// @desc    Get tasks delegated by current user
// @route   GET /api/tasks/my-delegated-tasks
// @access  Private (Developer/Team-lead)
const getMyDelegatedTasks = async (req, res) => {
  try {
    // console.log('Getting delegated tasks for user:', req.user ? req.user.firstName : 'Unknown');

    if (!req.user) {
      return res.status(401).json({ success: false, message: 'User not authenticated' });
    }

    const userId = req.user._id || req.user.id; // Safe access

    const tasks = await Task.find({
      delegatedBy: userId
    })
      .populate('assignedTo', 'firstName lastName email role employeeId')
      .populate('assignedBy', 'firstName lastName email role')
      .populate('delegatedBy', 'firstName lastName email role')
      .populate('project', 'name')
      .sort({ delegatedAt: -1 });

    res.status(200).json({
      success: true,
      count: tasks.length,
      data: tasks
    });
  } catch (error) {
    console.error('Get delegated tasks error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch delegated tasks',
      error: process.env.NODE_ENV === 'development' ? error.message : {}
    });
  }
};

module.exports = {
  createTask,
  getAllTasks,
  getTask,
  updateTask,
  deleteTask,
  addComment,
  getAvailableIndividuals,
  acceptTask,
  updateTaskStatus,
  completeTask,
  forceCompleteTask,
  updateTaskWithEvidence,
  getTaskDetails,
  managerCompleteTask,
  getUnassignedTasks,
  requestRevision,
  getTasksForReview,
  resolveRevision,
  delegateTask,
  getMyDelegatedTasks,
  submitTaskEvidence
};