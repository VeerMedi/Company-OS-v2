const express = require('express');
const router = express.Router();
const { authenticateToken, authorizeRoles } = require('../middleware/auth');
const salesTaskController = require('../controllers/salesTaskController');

// ============ HEAD OF SALES ROUTES ============

// Create sales task
router.post(
  '/',
  authenticateToken,
  authorizeRoles('head-of-sales'),
  salesTaskController.createSalesTask
);

// Get all sales tasks
router.get(
  '/all',
  authenticateToken,
  authorizeRoles('head-of-sales', 'co-founder', 'ceo'),
  salesTaskController.getAllSalesTasks
);

// Update sales task
router.put(
  '/:taskId',
  authenticateToken,
  authorizeRoles('head-of-sales', 'service-onboarding', 'service-delivery', 'individual'),
  salesTaskController.updateSalesTask
);

// Delete sales task
router.delete(
  '/:taskId',
  authenticateToken,
  authorizeRoles('head-of-sales'),
  salesTaskController.deleteSalesTask
);

// Assign/reassign task
router.put(
  '/:taskId/assign',
  authenticateToken,
  authorizeRoles('head-of-sales'),
  salesTaskController.assignSalesTask
);

// Bulk update tasks
router.post(
  '/bulk-update',
  authenticateToken,
  authorizeRoles('head-of-sales'),
  salesTaskController.bulkUpdateTasks
);

// ============ SALES TEAM ROUTES ============

// Get my sales tasks
router.get(
  '/my-tasks',
  authenticateToken,
  authorizeRoles('service-onboarding', 'service-delivery', 'individual'),
  salesTaskController.getMySalesTasks
);

// Update my task status
router.patch(
  '/:taskId/status',
  authenticateToken,
  authorizeRoles('service-onboarding', 'service-delivery', 'individual'),
  salesTaskController.updateMyTaskStatus
);

// ============ COMMON ROUTES ============

// Get all tasks (with role-based filtering)
router.get(
  '/',
  authenticateToken,
  authorizeRoles('service-onboarding', 'service-delivery', 'individual', 'head-of-sales', 'co-founder', 'ceo'),
  salesTaskController.getAllSalesTasks
);

// Get task details
router.get(
  '/:taskId',
  authenticateToken,
  authorizeRoles('service-onboarding', 'service-delivery', 'individual', 'head-of-sales', 'co-founder', 'ceo'),
  salesTaskController.getTaskDetails
);

// Get overdue tasks
router.get(
  '/alerts/overdue',
  authenticateToken,
  authorizeRoles('service-onboarding', 'service-delivery', 'individual', 'head-of-sales', 'co-founder', 'ceo'),
  salesTaskController.getOverdueTasks
);

// Get upcoming tasks
router.get(
  '/alerts/upcoming',
  authenticateToken,
  authorizeRoles('service-onboarding', 'service-delivery', 'individual', 'head-of-sales', 'co-founder', 'ceo'),
  salesTaskController.getUpcomingTasks
);

module.exports = router;
