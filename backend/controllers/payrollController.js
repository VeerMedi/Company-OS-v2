const Payroll = require('../models/Payroll');
const User = require('../models/User');
const AutomatedPayrollService = require('../services/AutomatedPayrollService');
const mongoose = require('mongoose');

// Get all payroll records (HR only)
const getAllPayrolls = async (req, res) => {
  try {
    // Check if user has HR permissions
    if (!req.user.hasPermission('read_hr_data')) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to view payroll data'
      });
    }

    const { page = 1, limit = 20, month, year, employeeId, status } = req.query;
    
    // Build filter object
    let filter = { isActive: true };
    
    if (month && year) {
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0);
      filter.salaryMonth = { $gte: startDate, $lte: endDate };
    }
    
    if (employeeId) {
      filter.employeeId = employeeId;
    }
    
    if (status) {
      filter.paymentStatus = status;
    }

    const payrolls = await Payroll.find(filter)
      .populate('employeeId', 'firstName lastName employeeId email role department')
      .populate('createdBy', 'firstName lastName')
      .populate('updatedBy', 'firstName lastName')
      .sort({ salaryMonth: -1, createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Payroll.countDocuments(filter);

    res.json({
      success: true,
      data: payrolls,
      pagination: {
        current: page,
        pages: Math.ceil(total / limit),
        total
      }
    });
  } catch (error) {
    console.error('Error fetching payrolls:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch payroll records',
      error: error.message
    });
  }
};

// Get payroll by ID
const getPayrollById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const payroll = await Payroll.findById(id)
      .populate('employeeId', 'firstName lastName employeeId email role department phoneNumber')
      .populate('createdBy', 'firstName lastName')
      .populate('updatedBy', 'firstName lastName');

    if (!payroll) {
      return res.status(404).json({
        success: false,
        message: 'Payroll record not found'
      });
    }

    // Check permissions
    const canView = req.user.hasPermission('read_hr_data') || 
                   (req.user.role === 'manager') ||
                   (req.user._id.toString() === payroll.employeeId._id.toString());

    if (!canView) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to view this payroll record'
      });
    }

    res.json({
      success: true,
      data: payroll
    });
  } catch (error) {
    console.error('Error fetching payroll:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch payroll record',
      error: error.message
    });
  }
};

// Create new payroll record (HR only)
const createPayroll = async (req, res) => {
  try {
    // Check if user has HR write permissions
    if (!req.user.hasPermission('write_hr_data')) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to create payroll records'
      });
    }

    const {
      employeeId,
      salaryMonth,
      basicSalary,
      allowances,
      deductions,
      bonus,
      overtime,
      workingDays,
      paymentMethod,
      bankDetails,
      remarks
    } = req.body;

    // Validate employee exists and is not CEO or Co-founder
    const employee = await User.findById(employeeId);
    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found'
      });
    }

    if (employee.role === 'ceo' || employee.role === 'co-founder') {
      return res.status(400).json({
        success: false,
        message: 'Cannot create payroll for CEO or Co-founder'
      });
    }

    // Check if payroll already exists for this employee and month
    const existingPayroll = await Payroll.findOne({
      employeeId,
      salaryMonth: new Date(salaryMonth),
      isActive: true
    });

    if (existingPayroll) {
      return res.status(400).json({
        success: false,
        message: 'Payroll record already exists for this employee and month'
      });
    }

    const payrollData = {
      employeeId,
      employeeCode: employee.employeeId,
      salaryMonth: new Date(salaryMonth),
      basicSalary,
      allowances: allowances || {},
      deductions: deductions || {},
      bonus: bonus || 0,
      overtime: overtime || {},
      workingDays: workingDays || { total: 22, present: 22, leave: 0 },
      paymentMethod: paymentMethod || 'bank-transfer',
      bankDetails: bankDetails || {},
      remarks,
      createdBy: req.user._id
    };

    const payroll = new Payroll(payrollData);
    await payroll.save();

    await payroll.populate('employeeId', 'firstName lastName employeeId email role department');
    await payroll.populate('createdBy', 'firstName lastName');

    res.status(201).json({
      success: true,
      data: payroll,
      message: 'Payroll record created successfully'
    });
  } catch (error) {
    console.error('Error creating payroll:', error);
    
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Payroll record already exists for this employee and month'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Failed to create payroll record',
      error: error.message
    });
  }
};

// Update payroll record (HR only)
const updatePayroll = async (req, res) => {
  try {
    // Check if user has HR write permissions
    if (!req.user.hasPermission('write_hr_data')) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to update payroll records'
      });
    }

    const { id } = req.params;
    const updateData = { ...req.body };
    
    // Add updatedBy field
    updateData.updatedBy = req.user._id;

    const payroll = await Payroll.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    )
      .populate('employeeId', 'firstName lastName employeeId email role department')
      .populate('createdBy', 'firstName lastName')
      .populate('updatedBy', 'firstName lastName');

    if (!payroll) {
      return res.status(404).json({
        success: false,
        message: 'Payroll record not found'
      });
    }

    res.json({
      success: true,
      data: payroll,
      message: 'Payroll record updated successfully'
    });
  } catch (error) {
    console.error('Error updating payroll:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update payroll record',
      error: error.message
    });
  }
};

// Delete payroll record (HR only - soft delete)
const deletePayroll = async (req, res) => {
  try {
    // Check if user has HR write permissions
    if (!req.user.hasPermission('write_hr_data')) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to delete payroll records'
      });
    }

    const { id } = req.params;

    const payroll = await Payroll.findByIdAndUpdate(
      id,
      { 
        isActive: false,
        updatedBy: req.user._id
      },
      { new: true }
    );

    if (!payroll) {
      return res.status(404).json({
        success: false,
        message: 'Payroll record not found'
      });
    }

    res.json({
      success: true,
      message: 'Payroll record deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting payroll:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete payroll record',
      error: error.message
    });
  }
};

// Get employee's own payroll history
const getMyPayroll = async (req, res) => {
  try {
    const { page = 1, limit = 12 } = req.query;
    
    // Exclude CEO and Co-founder from viewing payroll
    if (req.user.role === 'ceo' || req.user.role === 'co-founder') {
      return res.status(403).json({
        success: false,
        message: 'CEO and Co-founder do not have payroll records'
      });
    }

    const payrolls = await Payroll.find({
      employeeId: req.user._id,
      isActive: true
    })
      .populate('createdBy', 'firstName lastName')
      .sort({ salaryMonth: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Payroll.countDocuments({
      employeeId: req.user._id,
      isActive: true
    });

    res.json({
      success: true,
      data: payrolls,
      pagination: {
        current: page,
        pages: Math.ceil(total / limit),
        total
      }
    });
  } catch (error) {
    console.error('Error fetching my payroll:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch your payroll records',
      error: error.message
    });
  }
};

// Get team payroll (Managers only)
const getTeamPayroll = async (req, res) => {
  try {
    // Check if user is a manager
    if (req.user.role !== 'manager') {
      return res.status(403).json({
        success: false,
        message: 'Only managers can view team payroll data'
      });
    }

    const { page = 1, limit = 20, month, year } = req.query;
    
    // Build filter for team members (individuals under this manager)
    let filter = { 
      isActive: true
    };
    
    // Get team members (individuals) - assuming managers can see individual's payroll
    const teamMembers = await User.find({ 
      role: { $in: ['individual', 'service-delivery', 'service-onboarding'] },
      isActive: true 
    }).select('_id');
    
    const teamMemberIds = teamMembers.map(member => member._id);
    filter.employeeId = { $in: teamMemberIds };
    
    if (month && year) {
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0);
      filter.salaryMonth = { $gte: startDate, $lte: endDate };
    }

    const payrolls = await Payroll.find(filter)
      .populate('employeeId', 'firstName lastName employeeId email department')
      .sort({ salaryMonth: -1, createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Payroll.countDocuments(filter);

    res.json({
      success: true,
      data: payrolls,
      pagination: {
        current: page,
        pages: Math.ceil(total / limit),
        total
      }
    });
  } catch (error) {
    console.error('Error fetching team payroll:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch team payroll records',
      error: error.message
    });
  }
};

// Mark payroll as paid (HR only)
const markAsPaid = async (req, res) => {
  try {
    // Check if user has HR write permissions
    if (!req.user.hasPermission('write_hr_data')) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to update payment status'
      });
    }

    const { id } = req.params;
    const { transactionId, paymentDate } = req.body;

    const payroll = await Payroll.findById(id);
    if (!payroll) {
      return res.status(404).json({
        success: false,
        message: 'Payroll record not found'
      });
    }

    await payroll.markAsPaid(transactionId, paymentDate);
    payroll.updatedBy = req.user._id;
    await payroll.save();

    await payroll.populate('employeeId', 'firstName lastName employeeId email');

    res.json({
      success: true,
      data: payroll,
      message: 'Payroll marked as paid successfully'
    });
  } catch (error) {
    console.error('Error marking payroll as paid:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update payment status',
      error: error.message
    });
  }
};

// Get payroll summary (HR only)
const getPayrollSummary = async (req, res) => {
  try {
    // Check if user has HR permissions
    if (!req.user.hasPermission('read_hr_data')) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to view payroll summary'
      });
    }

    const { month, year } = req.query;
    const currentDate = new Date();
    const targetMonth = month || currentDate.getMonth() + 1;
    const targetYear = year || currentDate.getFullYear();

    const summary = await Payroll.getMonthlySummary(targetMonth, targetYear);

    res.json({
      success: true,
      data: summary[0] || {
        totalEmployees: 0,
        totalGrossSalary: 0,
        totalNetSalary: 0,
        totalDeductions: 0,
        paidCount: 0,
        pendingCount: 0
      },
      month: targetMonth,
      year: targetYear
    });
  } catch (error) {
    console.error('Error fetching payroll summary:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch payroll summary',
      error: error.message
    });
  }
};

// Get employees eligible for payroll (HR only)
const getEligibleEmployees = async (req, res) => {
  try {
    // Check if user has HR permissions
    if (!req.user.hasPermission('read_hr_data')) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to view employee data'
      });
    }

    // Get all employees except CEO and Co-founder
    const employees = await User.find({
      role: { $nin: ['ceo', 'co-founder'] },
      isActive: true
    }).select('firstName lastName employeeId email role department');

    res.json({
      success: true,
      data: employees
    });
  } catch (error) {
    console.error('Error fetching eligible employees:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch employees',
      error: error.message
    });
  }
};

// Calculate automated payroll (HR only)
const calculateAutomatedPayroll = async (req, res) => {
  try {
    // Check if user has HR write permissions
    if (!req.user.hasPermission('write_hr_data')) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to calculate payroll'
      });
    }

    const {
      employeeId,
      salaryMonth,
      basicSalary,
      allowances = {},
      deductions = {},
      bonusAmount = 0
    } = req.body;

    // Validate required fields
    if (!employeeId || !salaryMonth || !basicSalary) {
      return res.status(400).json({
        success: false,
        message: 'Employee ID, salary month, and basic salary are required'
      });
    }

    // Check if employee is valid
    const employee = await User.findById(employeeId);
    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found'
      });
    }

    if (employee.role === 'ceo' || employee.role === 'co-founder') {
      return res.status(400).json({
        success: false,
        message: 'Cannot create payroll for CEO or Co-founder'
      });
    }

    // Calculate automated payroll
    const result = await AutomatedPayrollService.calculateAutomatedPayroll(
      employeeId,
      new Date(salaryMonth),
      basicSalary,
      allowances,
      deductions,
      bonusAmount
    );

    if (result.success) {
      res.json({
        success: true,
        data: result.data,
        breakdown: result.breakdown,
        message: 'Payroll calculated successfully'
      });
    } else {
      res.status(400).json({
        success: false,
        message: result.message
      });
    }
  } catch (error) {
    console.error('Error calculating automated payroll:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to calculate automated payroll',
      error: error.message
    });
  }
};

// Create payroll from automated calculation (HR only)
const createAutomatedPayroll = async (req, res) => {
  try {
    // Check if user has HR write permissions
    if (!req.user.hasPermission('write_hr_data')) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to create payroll records'
      });
    }

    const {
      employeeId,
      salaryMonth,
      basicSalary,
      allowances = {},
      deductions = {},
      bonusAmount = 0,
      remarks
    } = req.body;

    // Calculate automated payroll first
    const calculationResult = await AutomatedPayrollService.calculateAutomatedPayroll(
      employeeId,
      new Date(salaryMonth),
      basicSalary,
      allowances,
      deductions,
      bonusAmount
    );

    if (!calculationResult.success) {
      return res.status(400).json({
        success: false,
        message: calculationResult.message
      });
    }

    // Check if payroll already exists
    const existingPayroll = await Payroll.findOne({
      employeeId,
      salaryMonth: new Date(salaryMonth),
      isActive: true
    });

    if (existingPayroll) {
      return res.status(400).json({
        success: false,
        message: 'Payroll record already exists for this employee and month'
      });
    }

    // Create payroll record
    const payrollData = {
      ...calculationResult.data,
      remarks,
      createdBy: req.user._id
    };

    const payroll = new Payroll(payrollData);
    await payroll.save();

    await payroll.populate('employeeId', 'firstName lastName employeeId email role department');
    await payroll.populate('createdBy', 'firstName lastName');

    res.status(201).json({
      success: true,
      data: payroll,
      breakdown: calculationResult.breakdown,
      message: 'Automated payroll created successfully'
    });
  } catch (error) {
    console.error('Error creating automated payroll:', error);
    
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Payroll record already exists for this employee and month'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Failed to create automated payroll',
      error: error.message
    });
  }
};

// Get employee bank details (HR only)
const getEmployeeBankDetails = async (req, res) => {
  try {
    // Check if user has HR permissions
    if (!req.user.hasPermission('read_hr_data')) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to view employee bank details'
      });
    }

    const { employeeId } = req.params;

    const result = await AutomatedPayrollService.getEmployeeBankDetails(employeeId);

    if (result.success) {
      res.json(result);
    } else {
      res.status(404).json(result);
    }
  } catch (error) {
    console.error('Error fetching employee bank details:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch employee bank details',
      error: error.message
    });
  }
};

// Generate bulk payroll for multiple employees (HR only)
const generateBulkPayroll = async (req, res) => {
  try {
    // Check if user has HR write permissions
    if (!req.user.hasPermission('write_hr_data')) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to generate bulk payroll'
      });
    }

    const {
      employeeIds,
      salaryMonth,
      defaultSalaryData = {}
    } = req.body;

    if (!employeeIds || !Array.isArray(employeeIds) || employeeIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Employee IDs array is required'
      });
    }

    if (!salaryMonth) {
      return res.status(400).json({
        success: false,
        message: 'Salary month is required'
      });
    }

    // Generate bulk payroll
    const results = await AutomatedPayrollService.generateBulkPayroll(
      employeeIds,
      salaryMonth,
      defaultSalaryData,
      req.user._id
    );

    const successful = results.filter(result => result.success);
    const failed = results.filter(result => !result.success);

    res.json({
      success: true,
      data: {
        total: results.length,
        successful: successful.length,
        failed: failed.length,
        results: results
      },
      message: `Bulk payroll generation completed. ${successful.length} successful, ${failed.length} failed.`
    });
  } catch (error) {
    console.error('Error generating bulk payroll:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate bulk payroll',
      error: error.message
    });
  }
};

// Get payroll calculation preview without saving (HR only)
const getPayrollPreview = async (req, res) => {
  try {
    // Check if user has HR permissions
    if (!req.user.hasPermission('read_hr_data')) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to preview payroll'
      });
    }

    const {
      employeeId,
      salaryMonth,
      basicSalary,
      allowances = {},
      deductions = {},
      bonusAmount = 0
    } = req.query;

    if (!employeeId || !salaryMonth || !basicSalary) {
      return res.status(400).json({
        success: false,
        message: 'Employee ID, salary month, and basic salary are required'
      });
    }

    // Calculate payroll preview
    const result = await AutomatedPayrollService.calculateAutomatedPayroll(
      employeeId,
      new Date(salaryMonth),
      parseInt(basicSalary),
      allowances,
      deductions,
      parseInt(bonusAmount)
    );

    if (result.success) {
      res.json({
        success: true,
        preview: result.breakdown,
        message: 'Payroll preview generated successfully'
      });
    } else {
      res.status(400).json({
        success: false,
        message: result.message
      });
    }
  } catch (error) {
    console.error('Error generating payroll preview:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate payroll preview',
      error: error.message
    });
  }
};

module.exports = {
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
  generatePayrollFromEvaluation: async (req, res) => {
    try {
      // Check if user has HR write permissions
      if (!req.user.hasPermission('write_hr_data')) {
        return res.status(403).json({
          success: false,
          message: 'You do not have permission to generate payroll'
        });
      }

      const { evaluationId } = req.params;
      const { basicSalary = 10000, remarks } = req.body;

      // Import PerformanceEvaluation model
      const PerformanceEvaluation = require('../models/PerformanceEvaluation');

      // Fetch the performance evaluation
      const evaluation = await PerformanceEvaluation.findById(evaluationId)
        .populate('employee', 'firstName lastName employeeId email role department');

      if (!evaluation) {
        return res.status(404).json({
          success: false,
          message: 'Performance evaluation not found'
        });
      }

      // Verify evaluation is approved or sent_to_hr
      if (!['approved', 'sent_to_hr'].includes(evaluation.status)) {
        return res.status(400).json({
          success: false,
          message: 'Can only generate payroll from approved evaluations'
        });
      }

      // Check if payroll already generated for this evaluation
      if (evaluation.status === 'payroll_generated' && evaluation.payrollId) {
        return res.status(400).json({
          success: false,
          message: 'Payroll already generated for this evaluation'
        });
      }

      const employeeId = evaluation.employee._id;
      const salaryMonth = evaluation.evaluationPeriod.endDate;

      // Check if payroll already exists for this month
      const existingPayroll = await Payroll.findOne({
        employeeId,
        salaryMonth: new Date(salaryMonth),
        isActive: true
      });

      if (existingPayroll) {
        return res.status(400).json({
          success: false,
          message: 'Payroll already exists for this employee and month'
        });
      }

      // Calculate payroll with performance multiplier
      const performanceMultiplier = evaluation.derivedFields.payrollMultiplier;
      const baseAllowances = {
        hra: Math.round(basicSalary * 0.30),
        transport: 2000,
        medical: 1500,
        performance: 0
      };

      // Calculate performance allowance
      const performanceAllowance = Math.round((baseAllowances.hra + baseAllowances.transport + baseAllowances.medical) * (performanceMultiplier - 1));
      baseAllowances.performance = Math.max(0, performanceAllowance);

      // Apply bonuses and penalties
      const bonusAmount = evaluation.metrics.bonuses.reduce((sum, bonus) => sum + bonus.amount, 0);
      const penaltyAmount = evaluation.metrics.penalties.reduce((sum, penalty) => sum + penalty.amount, 0);

      // Calculate with automated service
      const calculationResult = await AutomatedPayrollService.calculateAutomatedPayroll(
        employeeId,
        new Date(salaryMonth),
        basicSalary,
        baseAllowances,
        { other: penaltyAmount },
        bonusAmount
      );

      if (!calculationResult.success) {
        return res.status(400).json({
          success: false,
          message: calculationResult.message
        });
      }

      // Create payroll record
      const payrollData = {
        ...calculationResult.data,
        remarks: remarks || `Generated from performance evaluation (Grade: ${evaluation.derivedFields.grade}, Multiplier: ${performanceMultiplier}x)`,
        createdBy: req.user._id,
        incentiveDetails: {
          tier: evaluation.derivedFields.grade,
          tierEmoji: evaluation.derivedFields.grade === 'A' ? '🏆' : 
                     evaluation.derivedFields.grade === 'B' ? '🥇' :
                     evaluation.derivedFields.grade === 'C' ? '🥈' :
                     evaluation.derivedFields.grade === 'D' ? '🥉' : '📊',
          productivityScore: evaluation.derivedFields.totalScore,
          totalPoints: 0,
          incentiveAmount: baseAllowances.performance,
          criteriaUsed: 'performance_evaluation',
          matchedBy: `Performance grade ${evaluation.derivedFields.grade} with ${performanceMultiplier}x multiplier`,
          calculatedAt: new Date()
        }
      };

      const payroll = new Payroll(payrollData);
      await payroll.save();

      // Update evaluation
      evaluation.status = 'payroll_generated';
      evaluation.payrollId = payroll._id;
      await evaluation.save();

      await payroll.populate('employeeId', 'firstName lastName employeeId email role department');
      await payroll.populate('createdBy', 'firstName lastName');

      res.status(201).json({
        success: true,
        data: payroll,
        evaluation: {
          grade: evaluation.derivedFields.grade,
          totalScore: evaluation.derivedFields.totalScore,
          multiplier: performanceMultiplier
        },
        message: 'Payroll generated successfully from performance evaluation'
      });
    } catch (error) {
      console.error('Error generating payroll from evaluation:', error);
      
      if (error.code === 11000) {
        return res.status(400).json({
          success: false,
          message: 'Payroll record already exists for this employee and month'
        });
      }
      
      res.status(500).json({
        success: false,
        message: 'Failed to generate payroll from evaluation',
        error: error.message
      });
    }
  }
};