const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const PayrollService = require('../services/PayrollService');
const payrollScheduler = require('../services/PayrollScheduler');

// Get dashboard data (reminder state, payroll status)
router.get('/dashboard', authenticateToken, async (req, res) => {
  try {
    const dashboardData = await payrollScheduler.getDashboardData();
    res.json({
      success: true,
      data: dashboardData
    });
  } catch (error) {
    console.error('Dashboard data fetch error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch dashboard data',
      error: error.message
    });
  }
});

// Dismiss salary reminder
router.post('/dismiss-reminder', authenticateToken, async (req, res) => {
  try {
    payrollScheduler.dismissReminder();
    res.json({
      success: true,
      message: 'Reminder dismissed successfully'
    });
  } catch (error) {
    console.error('Dismiss reminder error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to dismiss reminder',
      error: error.message
    });
  }
});

// Manually trigger payroll generation (HR only)
router.post('/generate-monthly', authenticateToken, async (req, res) => {
  try {
    // Check if user is HR
    if (req.user.role !== 'hr') {
      return res.status(403).json({
        success: false,
        message: 'Only HR can trigger payroll generation'
      });
    }

    const results = await payrollScheduler.triggerPayrollGeneration(req.user);
    res.json({
      success: true,
      message: 'Monthly payroll generation completed',
      data: results
    });
  } catch (error) {
    console.error('Manual payroll generation error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate monthly payroll',
      error: error.message
    });
  }
});

// Get current month payroll status
router.get('/status', authenticateToken, async (req, res) => {
  try {
    const status = await PayrollService.getCurrentMonthPayrollStatus();
    res.json({
      success: true,
      data: status
    });
  } catch (error) {
    console.error('Payroll status fetch error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch payroll status',
      error: error.message
    });
  }
});

// Get pending payroll summary
router.get('/pending', authenticateToken, async (req, res) => {
  try {
    const summary = await PayrollService.getPendingPayrollSummary();
    res.json({
      success: true,
      data: summary
    });
  } catch (error) {
    console.error('Pending payroll fetch error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch pending payroll summary',
      error: error.message
    });
  }
});

// Update salary template for employee (HR only)
router.put('/template/:employeeId', authenticateToken, async (req, res) => {
  try {
    // Check if user is HR
    if (req.user.role !== 'hr') {
      return res.status(403).json({
        success: false,
        message: 'Only HR can update salary templates'
      });
    }

    const { employeeId } = req.params;
    const salaryData = req.body;

    const template = await PayrollService.updateEmployeeSalaryTemplate(employeeId, salaryData);
    res.json({
      success: true,
      message: 'Salary template updated successfully',
      data: template
    });
  } catch (error) {
    console.error('Salary template update error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update salary template',
      error: error.message
    });
  }
});

// Get scheduler status (Admin only)
router.get('/scheduler/status', authenticateToken, async (req, res) => {
  try {
    // Check if user is HR or CEO
    if (!['hr', 'ceo'].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    const status = payrollScheduler.getStatus();
    res.json({
      success: true,
      data: status
    });
  } catch (error) {
    console.error('Scheduler status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch scheduler status',
      error: error.message
    });
  }
});

// Toggle auto generation (HR only)
router.post('/scheduler/toggle-auto', authenticateToken, async (req, res) => {
  try {
    // Check if user is HR
    if (req.user.role !== 'hr') {
      return res.status(403).json({
        success: false,
        message: 'Only HR can toggle auto generation'
      });
    }

    const { enabled } = req.body;
    payrollScheduler.setAutoGeneration(enabled);
    
    res.json({
      success: true,
      message: `Auto generation ${enabled ? 'enabled' : 'disabled'}`,
      data: { autoGenerate: enabled }
    });
  } catch (error) {
    console.error('Toggle auto generation error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to toggle auto generation',
      error: error.message
    });
  }
});

// Force reminder (for testing - HR only)
router.post('/scheduler/force-reminder', authenticateToken, async (req, res) => {
  try {
    // Check if user is HR
    if (req.user.role !== 'hr') {
      return res.status(403).json({
        success: false,
        message: 'Only HR can force reminders'
      });
    }

    payrollScheduler.forceReminder();
    res.json({
      success: true,
      message: 'Reminder force triggered'
    });
  } catch (error) {
    console.error('Force reminder error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to force reminder',
      error: error.message
    });
  }
});

module.exports = router;