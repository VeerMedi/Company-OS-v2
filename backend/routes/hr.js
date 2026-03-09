const express = require('express');
const rateLimit = require('express-rate-limit');
const router = express.Router();

const {
  getHRDashboard,
  getEmployees,
  getProjects,
  getTasks,
  getAllEmployeePerformance,
  getEmployeePerformance,
  getAllEmployeePayrollPreview
} = require('../controllers/hrController');

const { authenticateToken, authorizeRoles } = require('../middleware/auth');

// Rate limiting for HR endpoints
const hrLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 50, // limit each IP to 50 requests per 5 minutes
  message: {
    success: false,
    message: 'Too many HR requests, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// More permissive rate limiting for dashboard (since it's cached)
const dashboardLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 20, // limit each IP to 20 requests per minute
  message: {
    success: false,
    message: 'Too many dashboard requests, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// @route   GET /api/hr/dashboard
// @desc    Get optimized HR dashboard data
// @access  Private (HR, CEO, Co-founder)
router.get('/dashboard', 
  dashboardLimiter,
  authenticateToken, 
  authorizeRoles('hr', 'ceo', 'co-founder'), 
  getHRDashboard
);

// @route   GET /api/hr/employees
// @desc    Get paginated employee list
// @access  Private (HR, CEO, Co-founder)
router.get('/employees', 
  hrLimiter,
  authenticateToken, 
  authorizeRoles('hr', 'ceo', 'co-founder'), 
  getEmployees
);

// @route   GET /api/hr/projects
// @desc    Get paginated project list
// @access  Private (HR, CEO, Co-founder)
router.get('/projects', 
  hrLimiter,
  authenticateToken, 
  authorizeRoles('hr', 'ceo', 'co-founder'), 
  getProjects
);

// @route   GET /api/hr/tasks
// @desc    Get paginated task list
// @access  Private (HR, CEO, Co-founder)
router.get('/tasks', 
  hrLimiter,
  authenticateToken, 
  authorizeRoles('hr', 'ceo', 'co-founder'), 
  getTasks
);

// @route   GET /api/hr/performance/all
// @desc    Get detailed performance metrics for all employees
// @access  Private (HR, CEO, Co-founder)
router.get('/performance/all', 
  hrLimiter,
  authenticateToken, 
  authorizeRoles('hr', 'ceo', 'co-founder'), 
  getAllEmployeePerformance
);

// @route   GET /api/hr/performance/:employeeId
// @desc    Get detailed performance metrics for a specific employee
// @access  Private (HR, CEO, Co-founder)
router.get('/performance/:employeeId', 
  hrLimiter,
  authenticateToken, 
  authorizeRoles('hr', 'ceo', 'co-founder'), 
  getEmployeePerformance
);

// @route   GET /api/hr/payroll/preview
// @desc    Get payroll preview for all employees with performance and attendance metrics
// @access  Private (HR, CEO, Co-founder)
router.get('/payroll/preview', 
  hrLimiter,
  authenticateToken, 
  authorizeRoles('hr', 'ceo', 'co-founder'), 
  getAllEmployeePayrollPreview
);

module.exports = router;