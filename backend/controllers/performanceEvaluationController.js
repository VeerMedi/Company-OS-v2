const PerformanceEvaluation = require('../models/PerformanceEvaluation');
const PerformanceEditLog = require('../models/PerformanceEditLog');
const PerformanceMetricsService = require('../services/PerformanceMetricsService');
const User = require('../models/User');
const Payroll = require('../models/Payroll');

// @desc    Get all performance evaluations (filtered by role)
// @route   GET /api/performance-evaluations
// @access  Private (Manager, HR, CEO)
const getPerformanceEvaluations = async (req, res) => {
  try {
    const { period, status, employeeId } = req.query;
    const userRole = req.user.role;
    
    let query = { isActive: true };
    
    // Role-based filtering
    if (userRole === 'hr') {
      // HR can only see approved or sent_to_hr evaluations
      query.status = { $in: ['approved', 'sent_to_hr', 'payroll_generated'] };
    } else if (userRole === 'manager') {
      // Managers see their team's evaluations
      const teamMembers = await User.find({ 
        reportingTo: req.user._id,
        isActive: true 
      }).select('_id');
      query.employee = { $in: teamMembers.map(m => m._id) };
    }
    
    // Additional filters
    if (status) query.status = status;
    if (employeeId) query.employee = employeeId;
    
    if (period) {
      const now = new Date();
      let startDate, endDate;
      
      if (period === 'current-month') {
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      } else if (period === 'current-quarter') {
        const quarter = Math.floor(now.getMonth() / 3);
        startDate = new Date(now.getFullYear(), quarter * 3, 1);
        endDate = new Date(now.getFullYear(), (quarter + 1) * 3, 0);
      }
      
      if (startDate && endDate) {
        query['evaluationPeriod.startDate'] = { $gte: startDate };
        query['evaluationPeriod.endDate'] = { $lte: endDate };
      }
    }
    
    const evaluations = await PerformanceEvaluation.find(query)
      .populate('employee', 'firstName lastName email role employeeId')
      .populate('createdBy', 'firstName lastName')
      .populate('managerApproval.approvedBy', 'firstName lastName')
      .sort({ 'evaluationPeriod.endDate': -1 })
      .lean();
    
    res.status(200).json({
      success: true,
      count: evaluations.length,
      data: evaluations
    });
  } catch (error) {
    console.error('Get performance evaluations error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch performance evaluations',
      error: process.env.NODE_ENV === 'development' ? error.message : {}
    });
  }
};

// @desc    Get single performance evaluation
// @route   GET /api/performance-evaluations/:id
// @access  Private
const getPerformanceEvaluationById = async (req, res) => {
  try {
    const evaluation = await PerformanceEvaluation.findById(req.params.id)
      .populate('employee', 'firstName lastName email role employeeId')
      .populate('createdBy', 'firstName lastName')
      .populate('managerApproval.approvedBy', 'firstName lastName')
      .populate('hrConfirmation.confirmedBy', 'firstName lastName');
    
    if (!evaluation) {
      return res.status(404).json({
        success: false,
        message: 'Performance evaluation not found'
      });
    }
    
    // Permission check
    const userRole = req.user.role;
    if (userRole === 'hr' && !['approved', 'sent_to_hr', 'payroll_generated'].includes(evaluation.status)) {
      return res.status(403).json({
        success: false,
        message: 'HR can only access approved evaluations'
      });
    }
    
    res.status(200).json({
      success: true,
      data: evaluation
    });
  } catch (error) {
    console.error('Get performance evaluation error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch performance evaluation',
      error: process.env.NODE_ENV === 'development' ? error.message : {}
    });
  }
};

// @desc    Create new performance evaluation
// @route   POST /api/performance-evaluations
// @access  Private (Manager, CEO, Co-founder)
const createPerformanceEvaluation = async (req, res) => {
  try {
    const { employeeId, evaluationPeriod } = req.body;
    
    // Validate employee
    const employee = await User.findById(employeeId);
    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found'
      });
    }
    
    // Check for existing evaluation for this period
    const existing = await PerformanceEvaluation.findOne({
      employee: employeeId,
      'evaluationPeriod.startDate': evaluationPeriod.startDate,
      'evaluationPeriod.endDate': evaluationPeriod.endDate,
      isActive: true
    });
    
    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'Evaluation already exists for this period'
      });
    }
    
    // Auto-populate metrics
    const metrics = await PerformanceMetricsService.autoPopulateMetrics(
      employeeId,
      new Date(evaluationPeriod.startDate),
      new Date(evaluationPeriod.endDate)
    );
    
    // Create evaluation
    const evaluation = await PerformanceEvaluation.create({
      employee: employeeId,
      evaluationPeriod,
      metrics,
      status: 'draft',
      createdBy: req.user._id
    });
    
    const populated = await PerformanceEvaluation.findById(evaluation._id)
      .populate('employee', 'firstName lastName email');
    
    res.status(201).json({
      success: true,
      message: 'Performance evaluation created successfully',
      data: populated
    });
  } catch (error) {
    console.error('Create performance evaluation error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create performance evaluation',
      error: process.env.NODE_ENV === 'development' ? error.message : {}
    });
  }
};

// @desc    Update performance metrics (with audit logging)
// @route   PUT /api/performance-evaluations/:id/metrics
// @access  Private (Manager only)
const updatePerformanceMetrics = async (req, res) => {
  try {
    const { metrics, reason } = req.body;
    
    const evaluation = await PerformanceEvaluation.findById(req.params.id);
    
    if (!evaluation) {
      return res.status(404).json({
        success: false,
        message: 'Performance evaluation not found'
      });
    }
    
    // Check if can edit
    if (!evaluation.canEdit(req.user._id, req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Cannot edit: evaluation is locked or you lack permission'
      });
    }
    
    if (!reason || reason.length < 10) {
      return res.status(400).json({
        success: false,
        message: 'A detailed reason (min 10 characters) is required for editing metrics'
      });
    }
    
    // Log each field change
    const logPromises = [];
    
    for (const [metricKey, metricValue] of Object.entries(metrics)) {
      const oldValue = evaluation.metrics[metricKey];
      
      if (JSON.stringify(oldValue) !== JSON.stringify(metricValue)) {
        // Check threshold for score changes
        if (metricValue.score !== undefined && oldValue.score !== undefined) {
          const threshold = PerformanceMetricsService.validateEditThreshold(
            oldValue.score,
            metricValue.score
          );
          
          if (threshold.exceeded) {
            console.warn(`Threshold exceeded for ${metricKey}: ${threshold.warning}`);
          }
        }
        
        // Log the edit
        logPromises.push(
          PerformanceEditLog.logEdit({
            evaluationId: evaluation._id,
            editedBy: req.user._id,
            fieldName: `metrics.${metricKey}`,
            oldValue: oldValue,
            newValue: metricValue,
            reason,
            req
          })
        );
        
        // Update the metric
        evaluation.metrics[metricKey] = metricValue;
        
        // Mark as overridden if applicable
        if (metricKey === 'taskCompletion') {
          evaluation.metrics.taskCompletion.isOverridden = true;
        }
      }
    }
    
    await Promise.all(logPromises);
    
    // Update status to 'edited' if it was 'draft'
    if (evaluation.status === 'draft') {
      evaluation.status = 'edited';
    }
    
    evaluation.updatedBy = req.user._id;
    await evaluation.save();
    
    const updated = await PerformanceEvaluation.findById(evaluation._id)
      .populate('employee', 'firstName lastName email');
    
    res.status(200).json({
      success: true,
      message: 'Metrics updated successfully',
      data: updated
    });
  } catch (error) {
    console.error('Update metrics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update metrics',
      error: process.env.NODE_ENV === 'development' ? error.message : {}
    });
  }
};

// @desc    Approve performance evaluation
// @route   POST /api/performance-evaluations/:id/approve
// @access  Private (Manager only)
const approveEvaluation = async (req, res) => {
  try {
    const { comments } = req.body;
    
    const evaluation = await PerformanceEvaluation.findById(req.params.id);
    
    if (!evaluation) {
      return res.status(404).json({
        success: false,
        message: 'Performance evaluation not found'
      });
    }
    
    await evaluation.approve(req.user._id, comments);
    
    const approved = await PerformanceEvaluation.findById(evaluation._id)
      .populate('employee', 'firstName lastName email')
      .populate('managerApproval.approvedBy', 'firstName lastName');
    
    res.status(200).json({
      success: true,
      message: 'Evaluation approved successfully',
      data: approved
    });
  } catch (error) {
    console.error('Approve evaluation error:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to approve evaluation'
    });
  }
};

// @desc    Reject performance evaluation
// @route   POST /api/performance-evaluations/:id/reject
// @access  Private (Manager only)
const rejectEvaluation = async (req, res) => {
  try {
    const { reason } = req.body;
    
    if (!reason) {
      return res.status(400).json({
        success: false,
        message: 'Rejection reason is required'
      });
    }
    
    const evaluation = await PerformanceEvaluation.findById(req.params.id);
    
    if (!evaluation) {
      return res.status(404).json({
        success: false,
        message: 'Performance evaluation not found'
      });
    }
    
    await evaluation.reject(req.user._id, reason);
    
    res.status(200).json({
      success: true,
      message: 'Evaluation rejected and sent back to draft',
      data: evaluation
    });
  } catch (error) {
    console.error('Reject evaluation error:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to reject evaluation'
    });
  }
};

// @desc    Send evaluation to HR
// @route   POST /api/performance-evaluations/:id/send-to-hr
// @access  Private (Manager only)
const sendToHR = async (req, res) => {
  try {
    const evaluation = await PerformanceEvaluation.findById(req.params.id);
    
    if (!evaluation) {
      return res.status(404).json({
        success: false,
        message: 'Performance evaluation not found'
      });
    }
    
    await evaluation.sendToHR(req.user._id);
    
    res.status(200).json({
      success: true,
      message: 'Evaluation sent to HR successfully',
      data: evaluation
    });
  } catch (error) {
    console.error('Send to HR error:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to send evaluation to HR'
    });
  }
};

// @desc    Get audit log for evaluation
// @route   GET /api/performance-evaluations/:id/audit-log
// @access  Private (Manager, HR)
const getAuditLog = async (req, res) => {
  try {
    const evaluation = await PerformanceEvaluation.findById(req.params.id);
    
    if (!evaluation) {
      return res.status(404).json({
        success: false,
        message: 'Performance evaluation not found'
      });
    }
    
    const auditLog = await PerformanceEditLog.getAuditTrail(req.params.id);
    
    res.status(200).json({
      success: true,
      count: auditLog.length,
      data: auditLog
    });
  } catch (error) {
    console.error('Get audit log error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch audit log',
      error: process.env.NODE_ENV === 'development' ? error.message : {}
    });
  }
};

// @desc    Get employee's evaluations (for employees)
// @route   GET /api/performance-evaluations/employee/:employeeId
// @access  Private (Employee can only see their own)
const getEmployeeEvaluations = async (req, res) => {
  try {
    const { employeeId } = req.params;
    
    // Employees can only see their own evaluations
    if (req.user.role === 'individual' && req.user._id.toString() !== employeeId) {
      return res.status(403).json({
        success: false,
        message: 'You can only view your own evaluations'
      });
    }
    
    const evaluations = await PerformanceEvaluation.find({
      employee: employeeId,
      status: { $in: ['approved', 'locked', 'payroll_generated'] }, // Only approved
      isActive: true
    })
      .populate('managerApproval.approvedBy', 'firstName lastName')
      .sort({ 'evaluationPeriod.endDate': -1 })
      .lean();
    
    res.status(200).json({
      success: true,
      count: evaluations.length,
      data: evaluations
    });
  } catch (error) {
    console.error('Get employee evaluations error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch employee evaluations',
      error: process.env.NODE_ENV === 'development' ? error.message : {}
    });
  }
};

module.exports = {
  getPerformanceEvaluations,
  getPerformanceEvaluationById,
  createPerformanceEvaluation,
  updatePerformanceMetrics,
  approveEvaluation,
  rejectEvaluation,
  sendToHR,
  getAuditLog,
  getEmployeeEvaluations
};
