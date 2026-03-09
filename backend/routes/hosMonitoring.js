const express = require('express');
const router = express.Router();
const { authenticateToken, authorizeRoles } = require('../middleware/auth');
const hosMonitoringController = require('../controllers/hosMonitoringController');

/**
 * HEAD OF SALES MONITORING ROUTES
 * Comprehensive monitoring endpoints for HOS to track:
 * - Targets → Companies → Leads → Pipeline
 * - Followups and activities
 * - Team performance
 */

// Get list of sales reps for filtering
router.get(
  '/sales-reps',
  authenticateToken,
  authorizeRoles('head-of-sales', 'ceo'),
  hosMonitoringController.getSalesRepsList
);

// Get complete sales overview (all targets, companies, leads, pipeline)
router.get(
  '/overview',
  authenticateToken,
  authorizeRoles('head-of-sales', 'ceo'),
  hosMonitoringController.getCompleteSalesOverview
);

// Get detailed tracking for a specific target
router.get(
  '/target/:targetId/detailed',
  authenticateToken,
  authorizeRoles('head-of-sales', 'ceo'),
  hosMonitoringController.getTargetDetailedTracking
);

// Get followup schedule across all leads
router.get(
  '/followups/schedule',
  authenticateToken,
  authorizeRoles('head-of-sales', 'ceo'),
  hosMonitoringController.getFollowupSchedule
);

// Get company-lead pipeline view
router.get(
  '/company/:companyId/pipeline',
  authenticateToken,
  authorizeRoles('head-of-sales', 'ceo', 'service-onboarding', 'service-delivery', 'individual'),
  hosMonitoringController.getCompanyLeadPipeline
);

module.exports = router;
