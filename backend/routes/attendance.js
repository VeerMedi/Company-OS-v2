const express = require('express');
const router = express.Router();
const AttendanceController = require('../controllers/attendanceController');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

// Employee routes (all employees can access)
router.post('/punch-in', authenticateToken, AttendanceController.punchIn);
router.post('/punch-out', authenticateToken, AttendanceController.punchOut);
router.get('/status', authenticateToken, AttendanceController.getPunchStatus);
router.get('/leave-status', authenticateToken, AttendanceController.getLeaveStatus);
router.get('/my-attendance', authenticateToken, AttendanceController.getEmployeeAttendance);
router.get('/monthly', authenticateToken, AttendanceController.getMonthlyAttendance);
router.post('/break/start', authenticateToken, AttendanceController.addBreak);
router.post('/break/end', authenticateToken, AttendanceController.endBreak);

// Employee specific attendance (managers can view their team's attendance)
router.get('/employee/:employeeId', authenticateToken, AttendanceController.getEmployeeAttendance);

// HR/Admin routes (restricted access)
router.get('/dashboard', authenticateToken, authorizeRoles('hr', 'ceo', 'co-founder'), AttendanceController.getDashboardData);

router.get('/all', authenticateToken, authorizeRoles('hr', 'ceo', 'co-founder', 'manager'), AttendanceController.getAllEmployeesAttendance);

router.post('/validate-import', authenticateToken, authorizeRoles('hr', 'ceo', 'co-founder', 'manager'), AttendanceController.validateAttendanceCSV);

router.post('/import', authenticateToken, authorizeRoles('hr', 'ceo', 'co-founder', 'manager'), AttendanceController.importAttendanceCSV);

router.post('/recalculate', authenticateToken, authorizeRoles('hr', 'ceo', 'co-founder', 'manager'), AttendanceController.recalculateAttendance);

router.get('/recent-imports', authenticateToken, authorizeRoles('hr', 'ceo', 'co-founder', 'manager'), AttendanceController.getRecentImports);

router.delete('/import-batch/:batchId', authenticateToken, authorizeRoles('hr', 'ceo', 'co-founder', 'manager'), AttendanceController.deleteImportBatch);

router.post('/manual-entry', authenticateToken, authorizeRoles('hr', 'ceo', 'co-founder', 'manager'), AttendanceController.createManualEntry);

router.put('/:attendanceId', authenticateToken, authorizeRoles('hr', 'ceo', 'co-founder', 'manager'), AttendanceController.updateAttendance);

// Manager routes (can view their team's attendance)
router.get('/team', authenticateToken, authorizeRoles('manager', 'hr', 'ceo', 'co-founder'), async (req, res, next) => {
  // If manager, filter by their department
  if (req.user.role === 'manager') {
    req.query.department = req.user.department;
  }
  next();
}, AttendanceController.getAllEmployeesAttendance);

module.exports = router;