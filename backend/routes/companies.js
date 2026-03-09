const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');
const companyController = require('../controllers/companyController');

// Configure multer for document uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/documents/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'company-doc-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = /pdf|doc|docx|xls|xlsx|ppt|pptx|txt|csv/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error('Only document files are allowed!'));
  }
};

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter
});

// ============ SALES TEAM ROUTES ============

// Submit company for approval (with optional document upload)
router.post(
  '/',
  authenticateToken,
  authorizeRoles('service-onboarding', 'service-delivery', 'individual', 'head-of-sales', 'ceo', 'co-founder'),
  upload.single('researchDocument'),
  companyController.submitCompany
);

// Bulk import companies (HOS only)
router.post(
  '/bulk-import',
  authenticateToken,
  authorizeRoles('head-of-sales'),
  companyController.bulkImportCompanies
);

// Bulk assign companies (HOS only)
router.post(
  '/bulk-assign',
  authenticateToken,
  authorizeRoles('head-of-sales'),
  companyController.bulkAssignCompanies
);

// Get my companies
router.get(
  '/my-companies',
  authenticateToken,
  authorizeRoles('service-onboarding', 'service-delivery', 'individual'),
  companyController.getMyCompanies
);

// Update company research
router.put(
  '/:companyId/research',
  authenticateToken,
  authorizeRoles('service-onboarding', 'service-delivery', 'individual'),
  companyController.updateCompanyResearch
);

// Upload study document
router.post(
  '/:companyId/documents',
  authenticateToken,
  authorizeRoles('service-onboarding', 'service-delivery', 'individual', 'head-of-sales', 'co-founder'),
  upload.single('document'),
  companyController.uploadStudyDocument
);

// ============ HEAD OF SALES ROUTES ============

// Get pending approval companies
router.get(
  '/pending-approval',
  authenticateToken,
  authorizeRoles('head-of-sales'),
  companyController.getPendingApprovals
);

// Get all companies (with filters)
router.get(
  '/all',
  authenticateToken,
  authorizeRoles('head-of-sales', 'co-founder', 'ceo'),
  companyController.getAllCompanies
);

// Approve/reject company
router.put(
  '/:companyId/review',
  authenticateToken,
  authorizeRoles('head-of-sales'),
  companyController.reviewCompany
);

// Request revision
router.put(
  '/:companyId/request-revision',
  authenticateToken,
  authorizeRoles('head-of-sales'),
  companyController.requestRevision
);

// Assign company to sales rep
router.put(
  '/:companyId/assign',
  authenticateToken,
  authorizeRoles('head-of-sales'),
  companyController.assignCompany
);

// ============ COMMON ROUTES ============

// Get single company details
router.get(
  '/:companyId',
  authenticateToken,
  authorizeRoles('service-onboarding', 'service-delivery', 'individual', 'head-of-sales', 'co-founder', 'ceo'),
  companyController.getCompanyDetails
);

// Update company details (Generic update)
router.put(
  '/:companyId',
  authenticateToken,
  authorizeRoles('ceo', 'co-founder'),
  companyController.updateCompanyDetails
);

// Get all companies (for dropdown/selection)
router.get(
  '/',
  authenticateToken,
  authorizeRoles('service-onboarding', 'service-delivery', 'individual', 'head-of-sales', 'co-founder', 'ceo'),
  companyController.getAllCompanies
);

// Delete company (soft delete)
router.delete(
  '/:companyId',
  authenticateToken,
  authorizeRoles('head-of-sales', 'co-founder', 'ceo'),
  companyController.deleteCompany
);

module.exports = router;
