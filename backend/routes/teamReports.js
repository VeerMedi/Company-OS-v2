const express = require('express');
const router = express.Router();
const { getTeamReportData } = require('../controllers/teamReportsController');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

// All routes require authentication and manager/ceo/co-founder roles
router.use(authenticateToken);
router.use(authorizeRoles('manager', 'ceo', 'co-founder'));

// @desc    Get team report data
// @route   GET /api/team-reports
// @access  Private (Manager, CEO, Co-founder)
router.get('/', getTeamReportData);

module.exports = router;
