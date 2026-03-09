const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analyticsController');
const { authenticateToken } = require('../middleware/auth');

// All routes require authentication
router.use(authenticateToken);

// Get VOICE analytics data
router.get('/voice', analyticsController.getVOICEAnalytics);

// Process natural language query
router.post('/voice/query', analyticsController.processQuery);

module.exports = router;
