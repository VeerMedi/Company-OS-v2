const express = require('express');
const router = express.Router();
const {
  getPerformanceEvaluations,
  getPerformanceEvaluationById,
  createPerformanceEvaluation,
  updatePerformanceMetrics,
  approveEvaluation,
  rejectEvaluation,
  sendToHR,
  getAuditLog,
  getEmployeeEvaluations
} = require('../controllers/performanceEvaluationController');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

// All routes require authentication
router.use(authenticateToken);

// List evaluations (role-filtered)
router.get('/', authorizeRoles('manager', 'hr', 'ceo', 'co-founder'), getPerformanceEvaluations);

// Get employee's evaluations (employees can view their own)
router.get('/employee/:employeeId', getEmployeeEvaluations);

// Get single evaluation
router.get('/:id', getPerformanceEvaluationById);

// Get audit log
router.get('/:id/audit-log', authorizeRoles('manager', 'hr', 'ceo', 'co-founder'), getAuditLog);

// Create evaluation (manager only)
router.post('/', authorizeRoles('manager', 'ceo', 'co-founder'), createPerformanceEvaluation);

// Update metrics (manager only)
router.put('/:id/metrics', authorizeRoles('manager', 'ceo', 'co-founder'), updatePerformanceMetrics);

// Approve evaluation (manager only)
router.post('/:id/approve', authorizeRoles('manager', 'ceo', 'co-founder'), approveEvaluation);

// Reject evaluation (manager only)
router.post('/:id/reject', authorizeRoles('manager', 'ceo', 'co-founder'), rejectEvaluation);

// Send to HR (manager only)
router.post('/:id/send-to-hr', authorizeRoles('manager', 'ceo', 'co-founder'), sendToHR);

module.exports = router;
