const express = require('express');
const router = express.Router();
const { check } = require('express-validator');
const multer = require('multer');
const path = require('path');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/screenshots/')
  },
  filename: function (req, file, cb) {
    cb(null, `checkpoint-${Date.now()}${path.extname(file.originalname)}`)
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: function (req, file, cb) {
    const allowedTypes = /jpeg|jpg|png|gif/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

const {
  createCheckpoint,
  getCheckpoints,
  getCheckpoint,
  updateCheckpoint,
  deleteCheckpoint,
  addScreenshot,
  completeCheckpoint
} = require('../controllers/checkpointController');

const { 
  authenticateToken, 
  authorizeRoles
} = require('../middleware/auth');

// Validation for checkpoint creation
const validateCheckpoint = [
  check('title')
    .not().isEmpty().withMessage('Checkpoint title is required')
    .isLength({ max: 100 }).withMessage('Checkpoint title cannot exceed 100 characters'),
  check('taskId')
    .not().isEmpty().withMessage('Task ID is required')
    .isMongoId().withMessage('Invalid task ID format')
];

// Validation for checkpoint update
const validateCheckpointUpdate = [
  check('title')
    .optional()
    .isLength({ max: 100 }).withMessage('Checkpoint title cannot exceed 100 characters'),
  check('isCompleted')
    .optional()
    .isBoolean().withMessage('Completed status must be a boolean'),
  check('verificationMethod')
    .optional()
    .isIn(['url', 'screenshot', 'document', 'other']).withMessage('Invalid verification method'),
  check('isApproved')
    .optional()
    .isBoolean().withMessage('Approval status must be a boolean')
];

// Validation for adding a screenshot
const validateScreenshot = [
  check('url')
    .not().isEmpty().withMessage('Screenshot URL is required'),
  check('caption')
    .optional()
];

// Create a new checkpoint
router.post(
  '/',
  authenticateToken,
  validateCheckpoint,
  createCheckpoint
);

// Get all checkpoints for a task
router.get(
  '/',
  authenticateToken,
  getCheckpoints
);

// Get single checkpoint
router.get(
  '/:id',
  authenticateToken,
  getCheckpoint
);

// Update checkpoint
router.put(
  '/:id',
  authenticateToken,
  validateCheckpointUpdate,
  updateCheckpoint
);

// Delete checkpoint (Manager or Co-founder/CEO)
router.delete(
  '/:id',
  authenticateToken,
  authorizeRoles('manager', 'co-founder', 'ceo'),
  deleteCheckpoint
);

// Add screenshot to checkpoint
router.post(
  '/:id/screenshots',
  authenticateToken,
  validateScreenshot,
  addScreenshot
);

// Complete checkpoint with evidence
router.post(
  '/complete',
  authenticateToken,
  authorizeRoles('service-delivery', 'service-onboarding', 'individual'),
  upload.single('screenshot'),
  completeCheckpoint
);

module.exports = router;
module.exports = router;