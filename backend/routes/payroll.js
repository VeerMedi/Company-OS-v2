const express = require('express');
const router = express.Router();
const {
  getAllPayrolls,
  getPayrollById,
  createPayroll,
  updatePayroll,
  deletePayroll,
  getMyPayroll,
  getTeamPayroll,
  markAsPaid,
  getPayrollSummary,
  getEligibleEmployees,
  // New automated payroll functions
  calculateAutomatedPayroll,
  createAutomatedPayroll,
  getEmployeeBankDetails,
  generateBulkPayroll,
  getPayrollPreview,
  generatePayrollFromEvaluation
} = require('../controllers/payrollController');
const { authenticateToken } = require('../middleware/auth');
const { body, validationResult } = require('express-validator');

// Validation middleware
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array()
    });
  }
  next();
};

// Validation rules for creating payroll
const createPayrollValidation = [
  body('employeeId')
    .notEmpty()
    .withMessage('Employee ID is required')
    .isMongoId()
    .withMessage('Invalid employee ID'),
  body('salaryMonth')
    .notEmpty()
    .withMessage('Salary month is required')
    .isISO8601()
    .withMessage('Invalid date format'),
  body('basicSalary')
    .isNumeric()
    .withMessage('Basic salary must be a number')
    .isFloat({ min: 0 })
    .withMessage('Basic salary cannot be negative'),
  body('allowances.hra')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('HRA cannot be negative'),
  body('allowances.transport')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Transport allowance cannot be negative'),
  body('allowances.medical')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Medical allowance cannot be negative'),
  body('allowances.performance')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Performance allowance cannot be negative'),
  body('allowances.other')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Other allowances cannot be negative'),
  body('deductions.tax')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Tax cannot be negative'),
  body('deductions.providentFund')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Provident fund cannot be negative'),
  body('deductions.insurance')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Insurance cannot be negative'),
  body('deductions.loan')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Loan deduction cannot be negative'),
  body('deductions.other')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Other deductions cannot be negative'),
  body('bonus')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Bonus cannot be negative'),
  body('overtime.hours')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Overtime hours cannot be negative'),
  body('overtime.rate')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Overtime rate cannot be negative'),
  body('workingDays.total')
    .optional()
    .isInt({ min: 1, max: 31 })
    .withMessage('Total working days must be between 1 and 31'),
  body('workingDays.present')
    .optional()
    .isInt({ min: 0, max: 31 })
    .withMessage('Present days must be between 0 and 31'),
  body('workingDays.leave')
    .optional()
    .isInt({ min: 0, max: 31 })
    .withMessage('Leave days must be between 0 and 31'),
  body('paymentMethod')
    .optional()
    .isIn(['bank-transfer', 'cash', 'cheque'])
    .withMessage('Invalid payment method'),
  body('remarks')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Remarks cannot exceed 500 characters')
];

// Validation rules for updating payroll
const updatePayrollValidation = [
  body('basicSalary')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Basic salary cannot be negative'),
  body('allowances.hra')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('HRA cannot be negative'),
  body('allowances.transport')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Transport allowance cannot be negative'),
  body('allowances.medical')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Medical allowance cannot be negative'),
  body('allowances.performance')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Performance allowance cannot be negative'),
  body('allowances.other')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Other allowances cannot be negative'),
  body('deductions.tax')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Tax cannot be negative'),
  body('deductions.providentFund')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Provident fund cannot be negative'),
  body('deductions.insurance')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Insurance cannot be negative'),
  body('deductions.loan')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Loan deduction cannot be negative'),
  body('deductions.other')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Other deductions cannot be negative'),
  body('bonus')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Bonus cannot be negative'),
  body('overtime.hours')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Overtime hours cannot be negative'),
  body('overtime.rate')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Overtime rate cannot be negative'),
  body('workingDays.total')
    .optional()
    .isInt({ min: 1, max: 31 })
    .withMessage('Total working days must be between 1 and 31'),
  body('workingDays.present')
    .optional()
    .isInt({ min: 0, max: 31 })
    .withMessage('Present days must be between 0 and 31'),
  body('workingDays.leave')
    .optional()
    .isInt({ min: 0, max: 31 })
    .withMessage('Leave days must be between 0 and 31'),
  body('paymentStatus')
    .optional()
    .isIn(['pending', 'processing', 'paid', 'on-hold'])
    .withMessage('Invalid payment status'),
  body('paymentMethod')
    .optional()
    .isIn(['bank-transfer', 'cash', 'cheque'])
    .withMessage('Invalid payment method'),
  body('remarks')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Remarks cannot exceed 500 characters')
];

// Validation rules for marking as paid
const markAsPaidValidation = [
  body('transactionId')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Transaction ID must be between 1 and 100 characters'),
  body('paymentDate')
    .optional()
    .isISO8601()
    .withMessage('Invalid payment date format')
];

// Apply authentication middleware to all routes
router.use(authenticateToken);

// HR Routes (require HR permissions)
router.get('/', getAllPayrolls); // GET /api/payroll - Get all payroll records (HR only)
router.post('/', createPayrollValidation, handleValidationErrors, createPayroll); // POST /api/payroll - Create payroll record (HR only)
router.get('/summary', getPayrollSummary); // GET /api/payroll/summary - Get payroll summary (HR only)
router.get('/employees', getEligibleEmployees); // GET /api/payroll/employees - Get eligible employees (HR only)

// Individual Routes
router.get('/my-payroll', getMyPayroll); // GET /api/payroll/my-payroll - Get own payroll history

// Manager Routes  
router.get('/team', getTeamPayroll); // GET /api/payroll/team - Get team payroll (Managers only)

// Automated Payroll Routes (HR only)
router.post('/calculate', calculateAutomatedPayroll); // POST /api/payroll/calculate - Calculate automated payroll (HR only)
router.post('/create-automated', createAutomatedPayroll); // POST /api/payroll/create-automated - Create automated payroll (HR only)
router.post('/bulk-generate', generateBulkPayroll); // POST /api/payroll/bulk-generate - Generate bulk payroll (HR only)
router.get('/preview', getPayrollPreview); // GET /api/payroll/preview - Get payroll preview (HR only)
router.get('/employee/:employeeId/bank-details', getEmployeeBankDetails); // GET /api/payroll/employee/:employeeId/bank-details - Get employee bank details (HR only)

// Performance Evaluation Integration (HR only)
router.post('/from-evaluation/:evaluationId', generatePayrollFromEvaluation); // POST /api/payroll/from-evaluation/:evaluationId - Generate payroll from performance evaluation (HR only)

// Specific payroll record routes
router.get('/:id', getPayrollById); // GET /api/payroll/:id - Get payroll by ID
router.put('/:id', updatePayrollValidation, handleValidationErrors, updatePayroll); // PUT /api/payroll/:id - Update payroll (HR only)
router.delete('/:id', deletePayroll); // DELETE /api/payroll/:id - Delete payroll (HR only)
router.patch('/:id/mark-paid', markAsPaidValidation, handleValidationErrors, markAsPaid); // PATCH /api/payroll/:id/mark-paid - Mark as paid (HR only)

module.exports = router;