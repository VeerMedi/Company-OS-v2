const express = require('express');
const rateLimit = require('express-rate-limit');
const router = express.Router();
const { check, body } = require('express-validator');
const multer = require('multer');
const path = require('path');

const {
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
} = require('../controllers/taskController');

const Task = require('../models/Task');

const {
  authenticateToken,
  authorizeRoles
} = require('../middleware/auth');

// Rate limiting for task endpoints
const taskLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 40, // limit each IP to 40 requests per 10 minutes
  message: {
    success: false,
    message: 'Too many task requests, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Validation for task creation
const validateTask = [
  body('title')
    .not().isEmpty().withMessage('Task title is required')
    .isLength({ max: 100 }).withMessage('Task title cannot exceed 100 characters'),
  body('description')
    .not().isEmpty().withMessage('Task description is required'),
  body('projectId')
    .optional({ nullable: true })  // Optional for HR/general tasks
    .isMongoId().withMessage('Invalid project ID format'),
  body('assignedToId')
    .not().isEmpty().withMessage('Assignee is required')
    .isMongoId().withMessage('Invalid assignee ID format'),
  body('deadline')
    .not().isEmpty().withMessage('Task deadline is required')
    .isISO8601().withMessage('Task deadline must be a valid date'),
  body('points')
    .optional()
    .isInt({ min: 1 }).withMessage('Points must be at least 1'),
  body('priority')
    .optional()
    .isIn(['low', 'medium', 'high', 'urgent']).withMessage('Invalid priority value')
];

// Validation for task update
const validateTaskUpdate = [
  check('title')
    .optional()
    .isLength({ max: 100 }).withMessage('Task title cannot exceed 100 characters'),
  check('deadline')
    .optional()
    .isISO8601().withMessage('Task deadline must be a valid date'),
  check('status')
    .optional()
    .isIn(['not-started', 'in-progress', 'completed', 'cant-complete', 'review'])
    .withMessage('Invalid status value'),
  check('points')
    .optional()
    .isInt({ min: 1 }).withMessage('Points must be at least 1'),
  check('priority')
    .optional()
    .isIn(['low', 'medium', 'high', 'urgent']).withMessage('Invalid priority value'),
  check('assignedToId')
    .optional()
    .isMongoId().withMessage('Invalid assignee ID format'),
  check('revisionRequired')
    .optional()
    .isBoolean().withMessage('Revision required must be a boolean')
];

// Validation for adding a comment
const validateComment = [
  check('comment')
    .not().isEmpty().withMessage('Comment text is required')
];

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/task-evidence/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, `task-evidence-${uniqueSuffix}${ext}`);
  }
});

const fileFilter = (req, file, cb) => {
  // Allow images, videos, and documents
  const allowedTypes = /jpeg|jpg|png|gif|mp4|mov|avi|pdf|doc|docx|txt/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error('Only images, videos, and documents are allowed!'));
  }
};

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: fileFilter
});

// Get available individuals for task assignment
router.get(
  '/individuals',
  authenticateToken,
  authorizeRoles('manager', 'co-founder', 'ceo'),
  getAvailableIndividuals
);

// Get unassigned automated tasks
router.get(
  '/unassigned',
  authenticateToken,
  authorizeRoles('manager'),
  getUnassignedTasks
);

// Get all tasks for HR analytics
router.get(
  '/all',
  taskLimiter,
  authenticateToken,
  authorizeRoles('hr', 'ceo', 'co-founder'),
  getAllTasks
);

// Get tasks assigned by a manager
router.get(
  '/manager',
  authenticateToken,
  authorizeRoles('manager', 'co-founder', 'ceo'),
  getAllTasks
);

// Get tasks assigned to an individual
router.get(
  '/assigned',
  authenticateToken,
  authorizeRoles('service-delivery', 'service-onboarding', 'individual', 'manager', 'co-founder', 'ceo', 'team-lead', 'developer', 'intern'),
  getAllTasks
);

// Create a new task (Manager only)
router.post(
  '/',
  authenticateToken,
  authorizeRoles('manager', 'co-founder', 'ceo'),
  validateTask,
  createTask
);

// Get all tasks (filtered by role/project)
router.get(
  '/',
  authenticateToken,
  getAllTasks
);

// Get tasks for review (must be before /:id route)
router.get(
  '/review',
  authenticateToken,
  authorizeRoles('manager', 'ceo', 'hr', 'team-lead'),
  getTasksForReview
);

// Get my tasks (must be before /:id route to avoid treating 'my-tasks' as an ID)
router.get(
  '/my-tasks',
  authenticateToken,
  getAllTasks
);

// Get my task bunches (must be before /:id route)
router.get('/my-bunches', authenticateToken, async (req, res) => {
  try {
    const TaskBunch = require('../models/TaskBunch');
    const bunches = await TaskBunch.getBunchesByUser(req.user.id);
    res.status(200).json({ success: true, data: bunches });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to get bunches' });
  }
});

// Get all bunches for manager (must be before /:id route)
router.get('/manager-bunches', authenticateToken, authorizeRoles('manager', 'co-founder', 'ceo'), async (req, res) => {
  try {
    const TaskBunch = require('../models/TaskBunch');
    const Project = require('../models/Project');

    // Find all projects where the user is the assigned manager
    const projects = await Project.find({
      $or: [
        { assignedManagerId: req.user.id },
        { createdBy: req.user.id }
      ]
    }).select('_id');

    const projectIds = projects.map(p => p._id);

    // If no projects, return empty array
    if (projectIds.length === 0) {
      return res.status(200).json({ success: true, data: [] });
    }

    // Get all bunches for these projects
    const bunches = await TaskBunch.find({ project: { $in: projectIds } })
      .populate('assignedTo', 'firstName lastName email role')
      .populate('project', 'name status')
      .populate({
        path: 'tasks',
        select: 'title description status complexity points priority'
      })
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, data: bunches });
  } catch (error) {
    console.error('Error fetching manager bunches:', error);
    console.error('Error details:', error.message);
    console.error('Error stack:', error.stack);
    res.status(500).json({ success: false, message: 'Failed to get bunches', error: error.message });
  }
});

// Get tasks delegated by current user (must be before /:id route)
router.get(
  '/my-delegated-tasks',
  authenticateToken,
  authorizeRoles('developer', 'team-lead'),
  getMyDelegatedTasks
);

// Get single task
router.get(
  '/:id',
  authenticateToken,
  getTask
);

// Update task
router.put(
  '/:id',
  authenticateToken,
  validateTaskUpdate,
  updateTask
);

// Delete task (Manager only)
router.delete(
  '/:id',
  authenticateToken,
  authorizeRoles('manager', 'co-founder', 'ceo'),
  deleteTask
);

// Add comment to task
router.post(
  '/:id/comments',
  authenticateToken,
  validateComment,
  addComment
);

// Accept a task
router.patch(
  '/:id/accept',
  authenticateToken,
  authorizeRoles('developer', 'intern', 'team-lead', 'service-delivery', 'service-onboarding', 'individual'),
  acceptTask
);

router.patch(
  '/:id/status',
  authenticateToken,
  authorizeRoles('service-delivery', 'service-onboarding', 'individual', 'manager', 'co-founder', 'ceo', 'team-lead', 'developer', 'intern'),
  updateTaskStatus
);

// Delegate task to mentee
router.post(
  '/:id/delegate',
  authenticateToken,
  authorizeRoles('developer', 'team-lead'),
  delegateTask
);

// Complete a task
router.patch(
  '/:id/complete',
  authenticateToken,
  authorizeRoles('developer', 'intern', 'team-lead', 'service-delivery', 'service-onboarding', 'individual'),
  completeTask
);

// Force complete a task (bypass checkpoint validation)
router.patch(
  '/:id/force-complete',
  authenticateToken,
  authorizeRoles('service-delivery', 'service-onboarding', 'individual', 'manager', 'co-founder', 'ceo'),
  forceCompleteTask
);

// Update task with evidence
router.post(
  '/update-with-evidence',
  authenticateToken,
  authorizeRoles('developer', 'intern', 'team-lead', 'manager'),
  upload.array('files', 10), // Allow up to 10 files
  updateTaskWithEvidence
);

// Get task details for manager view
router.get(
  '/:id/details',
  authenticateToken,
  authorizeRoles('manager', 'ceo', 'hr', 'team-lead', 'co-founder', 'developer', 'intern'),
  getTaskDetails
);

// Complete task by manager and award points
router.patch(
  '/:id/manager-complete',
  authenticateToken,
  authorizeRoles('manager', 'ceo', 'hr', 'team-lead', 'co-founder'),
  managerCompleteTask
);

// Request revision for a task
router.patch(
  '/:id/request-revision',
  authenticateToken,
  authorizeRoles('manager', 'ceo', 'hr', 'team-lead', 'co-founder'),
  requestRevision
);

// Submit task evidence
router.put('/:id/submit', authenticateToken, upload.fields([
  { name: 'verificationImage', maxCount: 1 },
  { name: 'files', maxCount: 5 }
]), submitTaskEvidence);

// Resolve revision (resubmit task after addressing feedback)
router.patch(
  '/:id/resolve-revision',
  authenticateToken,
  authorizeRoles('service-delivery', 'service-onboarding', 'individual'),
  resolveRevision
);

// Coverage Analytics Endpoints
const coverageAnalyticsService = require('../services/coverageAnalyticsService');

// Get my coverage tasks
router.get(
  '/coverage/my-coverage',
  authenticateToken,
  async (req, res) => {
    try {
      const coverageTasks = await coverageAnalyticsService.getCoverageTasksForUser(req.user._id);
      res.status(200).json({
        success: true,
        data: coverageTasks
      });
    } catch (error) {
      console.error('Error getting coverage tasks:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get coverage tasks'
      });
    }
  }
);

// Get coverage stats for a user
router.get(
  '/coverage/stats/:userId?',
  authenticateToken,
  async (req, res) => {
    try {
      const userId = req.params.userId || req.user._id;
      const stats = await coverageAnalyticsService.getCoverageStats(userId);
      res.status(200).json({
        success: true,
        data: stats
      });
    } catch (error) {
      console.error('Error getting coverage stats:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get coverage stats'
      });
    }
  }
);

// Get who covered for an employee
router.get(
  '/coverage/for-employee/:employeeId',
  authenticateToken,
  authorizeRoles('manager', 'hr', 'ceo', 'co-founder'),
  async (req, res) => {
    try {
      const coverage = await coverageAnalyticsService.getWhoCoveredForEmployee(req.params.employeeId);
      res.status(200).json({
        success: true,
        data: coverage
      });
    } catch (error) {
      console.error('Error getting who covered for employee:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get coverage information'
      });
    }
  }
);

// Get all employees coverage stats (HR dashboard)
router.get(
  '/coverage/all-employees',
  authenticateToken,
  authorizeRoles('hr', 'ceo', 'co-founder'),
  async (req, res) => {
    try {
      const stats = await coverageAnalyticsService.getAllEmployeesCoverageStats();
      res.status(200).json({
        success: true,
        data: stats
      });
    } catch (error) {
      console.error('Error getting all employees coverage stats:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get coverage statistics'
      });
    }
  }
);

// @desc    Unassign a task
// @route   PUT /api/tasks/:id/unassign
// @access  Private (Manager, Team Lead, Co-founder, CEO)
router.put(
  '/:id/unassign',
  authenticateToken,
  authorizeRoles('manager', 'team-lead', 'co-founder', 'ceo'),
  async (req, res) => {
    try {
      const task = await Task.findById(req.params.id);

      if (!task) {
        return res.status(404).json({
          success: false,
          message: 'Task not found'
        });
      }

      // Store the task title for the response message
      const taskTitle = task.title;

      // Unassign the task
      task.assignedTo = null;
      task.status = 'pending-assignment';
      await task.save();

      res.status(200).json({
        success: true,
        message: `Task "${taskTitle}" has been unassigned`,
        data: task
      });
    } catch (error) {
      console.error('Error unassigning task:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to unassign task'
      });
    }
  }
);

module.exports = router;