const express = require('express');
const router = express.Router();
const { getPerformanceReportData } = require('../controllers/performanceReportsController');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

// All routes require authentication and manager/ceo/co-founder roles
router.use(authenticateToken);
router.use(authorizeRoles('manager', 'ceo', 'co-founder'));

// @desc    Get performance report data
// @route   GET /api/performance-reports
// @access  Private (Manager, CEO, Co-founder)
router.get('/', getPerformanceReportData);

module.exports = router;
