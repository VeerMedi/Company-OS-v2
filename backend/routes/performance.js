const express = require('express');
const router = express.Router();

const {
  getIndividualPerformance,
  getIndividualDetailedPerformance,
  getMyInsights,
  getEmployeeInsights
} = require('../controllers/performanceController');

const { 
  authenticateToken, 
  authorizeRoles
} = require('../middleware/auth');

// @desc    Get personalized performance insights for logged-in user
// @route   GET /api/performance/my-insights
// @access  Private
router.get(
  '/my-insights',
  authenticateToken,
  getMyInsights
);

// @desc    Get all individual performance rankings
// @route   GET /api/performance/individuals
// @access  Private (HR, CEO, Co-founder, Manager)
router.get(
  '/individuals',
  authenticateToken,
  authorizeRoles('hr', 'ceo', 'co-founder', 'manager'),
  getIndividualPerformance
);

// @desc    Get detailed performance for a specific individual
// @route   GET /api/performance/individuals/:id
// @access  Private (HR, CEO, Co-founder, Manager)
router.get(
  '/individuals/:id',
  authenticateToken,
  authorizeRoles('hr', 'ceo', 'co-founder', 'manager'),
  getIndividualDetailedPerformance
);

// @desc    Get performance insights for a specific employee
// @route   GET /api/performance/individuals/:id/insights
// @access  Private (HR, CEO, Co-founder, Manager)
router.get(
  '/individuals/:id/insights',
  authenticateToken,
  authorizeRoles('hr', 'ceo', 'co-founder', 'manager'),
  getEmployeeInsights
);

module.exports = router;