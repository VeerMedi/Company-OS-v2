const express = require('express');
const router = express.Router();
const { authenticateToken, authorizeRoles } = require('../middleware/auth');
const revenueController = require('../controllers/revenueController');

// ============ CO-FOUNDER ROUTES ============

// Revenue Target Management
router.post(
  '/targets',
  authenticateToken,
  authorizeRoles('ceo', 'co-founder'),
  revenueController.createRevenueTarget
);

router.get(
  '/targets',
  authenticateToken,
  authorizeRoles('ceo', 'co-founder', 'head-of-sales'),
  revenueController.getAllRevenueTargets
);

router.get(
  '/targets/:id',
  authenticateToken,
  authorizeRoles('ceo', 'co-founder', 'head-of-sales'),
  revenueController.getRevenueTarget
);

router.put(
  '/targets/:id',
  authenticateToken,
  authorizeRoles('ceo', 'co-founder'),
  revenueController.updateRevenueTarget
);

router.post(
  '/targets/:id/approve-strategy',
  authenticateToken,
  authorizeRoles('ceo', 'co-founder'),
  revenueController.approveHOSStrategy
);

// Co-Founder Dashboard
router.get(
  '/dashboard/cofounder',
  authenticateToken,
  authorizeRoles('ceo', 'co-founder'),
  revenueController.getCoFounderDashboard
);

// ============ HEAD OF SALES ROUTES ============

// HOS Revenue Target Management
router.get(
  '/targets/my-targets',
  authenticateToken,
  authorizeRoles('head-of-sales'),
  revenueController.getMyRevenueTargets
);

router.post(
  '/targets/:id/respond',
  authenticateToken,
  authorizeRoles('head-of-sales'),
  revenueController.respondToRevenueTarget
);

router.post(
  '/targets/:id/strategy',
  authenticateToken,
  authorizeRoles('head-of-sales'),
  revenueController.submitStrategy
);

// HOS Dashboard
router.get(
  '/dashboard/hos',
  authenticateToken,
  authorizeRoles('head-of-sales', 'ceo', 'co-founder', 'admin'),
  revenueController.getHOSDashboard
);

// Get active approved revenue targets for sales team to link companies
router.get(
  '/targets/active-approved',
  authenticateToken,
  authorizeRoles('service-onboarding', 'service-delivery', 'individual', 'head-of-sales'),
  revenueController.getActiveApprovedTargets
);

// Update Financial Data (Manual Override)
// Update Financial Data (Manual Override)
router.put('/financial-data',
  authenticateToken,
  authorizeRoles('ceo', 'co-founder'),
  revenueController.updateFinancialData
);

module.exports = router;
