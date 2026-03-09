const express = require('express');
const router = express.Router();
const { authenticateToken, authorizeRoles } = require('../middleware/auth');
const {
  createExecutiveTask,
  getMyExecutiveTasks,
  updateExecutiveTaskStatus,
  getAllExecutiveTasks
} = require('../controllers/executiveTaskController');

// CEO/Co-Founder routes
router.post('/', authenticateToken, authorizeRoles('ceo', 'co-founder', 'chiefexecutive'), createExecutiveTask);
router.get('/sent', authenticateToken, authorizeRoles('ceo', 'co-founder', 'chiefexecutive'), getAllExecutiveTasks);
router.get('/all', authenticateToken, authorizeRoles('ceo', 'co-founder', 'chiefexecutive'), getAllExecutiveTasks);

// Manager/HR routes
router.get('/my-tasks', authenticateToken, authorizeRoles('manager', 'hr'), getMyExecutiveTasks);
router.put('/:taskId/status', authenticateToken, authorizeRoles('manager', 'hr'), updateExecutiveTaskStatus);

module.exports = router;
