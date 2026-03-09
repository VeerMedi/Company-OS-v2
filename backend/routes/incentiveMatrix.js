const express = require('express');
const router = express.Router();
const {
  getAllTiers,
  createTier,
  updateTier,
  deleteTier,
  previewIncentive,
  getDistribution
} = require('../controllers/incentiveMatrixController');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

// Get all active tiers (all authenticated users can view)
router.get(
  '/',
  authenticateToken,
  getAllTiers
);

// Get incentive distribution statistics (HR, CEO, Co-founder only)
router.get(
  '/distribution',
  authenticateToken,
  authorizeRoles('hr', 'ceo', 'co-founder'),
  getDistribution
);

// Preview incentive for an employee
router.get(
  '/preview/:employeeId',
  authenticateToken,
  previewIncentive
);

// Create new tier (HR, CEO, Co-founder only)
router.post(
  '/',
  authenticateToken,
  authorizeRoles('hr', 'ceo', 'co-founder'),
  createTier
);

// Update tier (HR, CEO, Co-founder only)
router.put(
  '/:id',
  authenticateToken,
  authorizeRoles('hr', 'ceo', 'co-founder'),
  updateTier
);

// Delete tier (HR, CEO, Co-founder only)
router.delete(
  '/:id',
  authenticateToken,
  authorizeRoles('hr', 'ceo', 'co-founder'),
  deleteTier
);

module.exports = router;
