const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');
const leadController = require('../controllers/leadController');

// Configure multer for evidence file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/follow-up-evidence/');
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'evidence-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: function (req, file, cb) {
    const allowedTypes = /jpeg|jpg|png|gif|pdf|doc|docx|txt/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only images, PDFs, and documents are allowed'));
    }
  }
});

// ============ SALES TEAM ROUTES ============

// Create lead (for approved companies only)
router.post(
  '/',
  authenticateToken,
  authorizeRoles('service-onboarding', 'service-delivery', 'individual', 'head-of-sales'),
  leadController.createLead
);

// Bulk import leads (HOS only)
router.post(
  '/bulk-import',
  authenticateToken,
  authorizeRoles('head-of-sales'),
  leadController.bulkImportLeads
);

// Bulk assign leads (HOS only)
router.post(
  '/bulk-assign',
  authenticateToken,
  authorizeRoles('head-of-sales'),
  leadController.bulkAssignLeads
);

// Get my leads
router.get(
  '/my-leads',
  authenticateToken,
  authorizeRoles('service-onboarding', 'service-delivery', 'individual'),
  leadController.getMyLeads
);

// Add follow-up to lead
router.post(
  '/:leadId/follow-up',
  authenticateToken,
  authorizeRoles('service-onboarding', 'service-delivery', 'individual', 'head-of-sales'),
  leadController.addFollowUp
);

// Submit follow-up evidence
router.post(
  '/:leadId/follow-up/:followUpId/evidence',
  authenticateToken,
  authorizeRoles('service-onboarding', 'service-delivery', 'individual', 'head-of-sales'),
  upload.array('evidence', 5), // Allow up to 5 files
  leadController.submitFollowUpEvidence
);

// Update lead stage
router.put(
  '/:leadId/stage',
  authenticateToken,
  authorizeRoles('service-onboarding', 'service-delivery', 'individual', 'head-of-sales'),
  leadController.updateLeadStage
);

// Update lead information
router.put(
  '/:leadId',
  authenticateToken,
  authorizeRoles('service-onboarding', 'service-delivery', 'individual', 'head-of-sales'),
  leadController.updateLead
);

// ============ HEAD OF SALES ROUTES ============

// Get all leads (HOS view with filters)
router.get(
  '/all',
  authenticateToken,
  authorizeRoles('head-of-sales', 'co-founder', 'ceo'),
  leadController.getAllLeads
);

// Get lead pipeline overview
router.get(
  '/pipeline/overview',
  authenticateToken,
  authorizeRoles('head-of-sales', 'co-founder', 'ceo'),
  leadController.getLeadPipeline
);

// Assign lead to sales rep
router.put(
  '/:leadId/assign',
  authenticateToken,
  authorizeRoles('head-of-sales'),
  leadController.assignLead
);

// ============ COMMON ROUTES ============

// Get all leads (general endpoint with access control)
router.get(
  '/',
  authenticateToken,
  authorizeRoles('service-onboarding', 'service-delivery', 'individual', 'head-of-sales', 'co-founder', 'ceo'),
  leadController.getAllLeads
);

// Get lead details
router.get(
  '/:leadId',
  authenticateToken,
  authorizeRoles('service-onboarding', 'service-delivery', 'individual', 'head-of-sales', 'co-founder', 'ceo'),
  leadController.getLeadDetails
);

// Delete lead (soft delete)
router.delete(
  '/:leadId',
  authenticateToken,
  authorizeRoles('head-of-sales', 'co-founder'),
  leadController.deleteLead
);

// ============ STATS & ANALYTICS ============

// Get my performance stats
router.get(
  '/stats/my-performance',
  authenticateToken,
  authorizeRoles('service-onboarding', 'service-delivery', 'individual'),
  leadController.getMyPerformanceStats
);

module.exports = router;
