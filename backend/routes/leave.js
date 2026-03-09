const express = require('express');
const router = express.Router();
const {
  createLeaveRequest,
  getAllLeaveRequests,
  getMyLeaves,
  getPendingApprovals,
  updateLeaveApproval,
  getLeaveBalance,
  getMyLeaveBalance,
  updateLeaveBalance,
  cancelLeaveRequest,
  getLeaveStats,
  confirmTaskHandover,
  getAllLeaveBalances
} = require('../controllers/leaveController');
const { authenticateToken } = require('../middleware/auth');

// Apply authentication middleware to all routes
router.use(authenticateToken);

// Leave request routes
router.post('/request', createLeaveRequest);
router.get('/requests', getAllLeaveRequests);
router.get('/my-leaves', getMyLeaves);
router.get('/pending-approvals', getPendingApprovals);
router.put('/approve/:leaveId', updateLeaveApproval);
router.put('/approve/:leaveId', updateLeaveApproval);
router.put('/cancel/:leaveId', cancelLeaveRequest);
// Handover confirmation route
router.patch('/:leaveId/confirm-handover', confirmTaskHandover);

// Leave balance routes
router.get('/balances', getAllLeaveBalances);
router.get('/balance/:employeeId?', getLeaveBalance);
router.get('/my-balance', getMyLeaveBalance);
router.put('/balance/:employeeId', updateLeaveBalance);

// Statistics routes
router.get('/stats', getLeaveStats);

module.exports = router;