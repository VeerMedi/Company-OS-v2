const express = require('express');
const rateLimit = require('express-rate-limit');
const router = express.Router();
const { check } = require('express-validator');
const multer = require('multer');
const path = require('path');

const {
  createProject,
  getAllProjects,
  getProject,
  updateProject,
  deleteProject,
  getAvailableManagers,
  automateProject,
  automateProjectWithLLM
} = require('../controllers/projectController');

const {
  authenticateToken,
  authorizeRoles
} = require('../middleware/auth');

// Rate limiting for project endpoints
const projectLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 25, // limit each IP to 25 requests per 10 minutes
  message: {
    success: false,
    message: 'Too many project requests, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Configure multer for PDF uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/automation/');
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  if (file.mimetype === 'application/pdf') {
    cb(null, true);
  } else {
    cb(new Error('Only PDF files are allowed'), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});

// Validation for project creation
const validateProject = [
  check('name')
    .not().isEmpty().withMessage('Project name is required')
    .isLength({ max: 100 }).withMessage('Project name cannot exceed 100 characters'),
  check('description')
    .not().isEmpty().withMessage('Project description is required'),
  check('deadline')
    .not().isEmpty().withMessage('Project deadline is required')
    .isISO8601().withMessage('Project deadline must be a valid date'),
  check('assignedManagerId')
    .not().isEmpty().withMessage('Manager is required')
    .isMongoId().withMessage('Invalid manager ID format')
];

// Validation for project update
const validateProjectUpdate = [
  check('name')
    .optional()
    .isLength({ max: 100 }).withMessage('Project name cannot exceed 100 characters'),
  check('deadline')
    .optional()
    .isISO8601().withMessage('Project deadline must be a valid date'),
  check('status')
    .optional()
    .isIn(['not-started', 'in-progress', 'completed', 'on-hold', 'cancelled'])
    .withMessage('Invalid status value'),
  check('assignedManagerId')
    .optional()
    .isMongoId().withMessage('Invalid manager ID format')
];

// Get available managers for project assignment
router.get(
  '/managers',
  authenticateToken,
  authorizeRoles('co-founder', 'ceo'),
  getAvailableManagers
);

// Automate project creation with n8n
router.post(
  '/automate',
  authenticateToken,
  authorizeRoles('co-founder', 'ceo'),
  upload.single('pdfFile'),
  automateProject
);

// Automate project with LLM task generation
router.post(
  '/automate-llm',
  authenticateToken,
  authorizeRoles('co-founder', 'ceo', 'manager'),
  automateProjectWithLLM
);

// Get all projects for HR analytics
router.get(
  '/all',
  projectLimiter,
  authenticateToken,
  authorizeRoles('hr', 'ceo', 'co-founder'),
  getAllProjects
);

// Create a new project (Co-founder, CEO, Manager)
router.post(
  '/',
  authenticateToken,
  authorizeRoles('co-founder', 'ceo', 'manager'),
  upload.single('srsDocument'), // Add multer middleware to handle file upload
  validateProject,
  createProject
);

// Get all projects (filtered by role)
router.get(
  '/',
  authenticateToken,
  getAllProjects
);

// Get single project with bunches
router.get(
  '/:id',
  authenticateToken,
  getProject
);

// Get bunches for a project
router.get(
  '/:id/bunches',
  authenticateToken,
  async (req, res) => {
    try {
      const TaskBunch = require('../models/TaskBunch');
      const bunches = await TaskBunch.getBunchesByProject(req.params.id);
      res.status(200).json({ success: true, data: bunches });
    } catch (error) {
      console.error('❌ Error fetching project bunches:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get bunches',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
    }
  }
);

// Assign bunch to employee (Manager only)
router.post(
  '/:projectId/bunches/:bunchId/assign',
  authenticateToken,
  authorizeRoles('manager', 'co-founder', 'ceo'),
  async (req, res) => {
    try {
      const TaskBunch = require('../models/TaskBunch');
      const Task = require('../models/Task');
      const { employeeId } = req.body;

      const bunch = await TaskBunch.findById(req.params.bunchId);
      if (!bunch) return res.status(404).json({ success: false, message: 'Bunch not found' });

      bunch.assignedTo = employeeId;
      bunch.assignedBy = req.user.id;
      bunch.status = 'assigned';
      await bunch.save();

      await Task.updateMany(
        { _id: { $in: bunch.tasks } },
        { $set: { assignedTo: employeeId, assignedBy: req.user.id, status: 'not-started', taskBunch: bunch._id } }
      );

      res.status(200).json({ success: true, message: 'Bunch assigned', data: bunch });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Failed to assign bunch' });
    }
  }
);

// Update project
router.put(
  '/:id',
  authenticateToken,
  validateProjectUpdate,
  updateProject
);

// Delete project (Co-founder, CEO, Manager)
router.delete(
  '/:id',
  authenticateToken,
  authorizeRoles('co-founder', 'ceo', 'manager'),
  deleteProject
);

module.exports = router;