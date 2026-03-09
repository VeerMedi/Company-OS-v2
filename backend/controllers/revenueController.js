const RevenueTarget = require('../models/RevenueTarget');
const Company = require('../models/Company');
const Lead = require('../models/Lead');
const User = require('../models/User');
const Sale = require('../models/Sale');
const Payroll = require('../models/Payroll');
const FinancialData = require('../models/FinancialData');
const { sendRevenueTargetNotification } = require('../utils/emailService');

// ============ CO-FOUNDER SECTION ============

// Create Revenue Target (Co-Founder creates target for HOS)
exports.createRevenueTarget = async (req, res) => {
  try {
    const { assignedTo, targetPeriod, targetMonth, targetYear, startDate, endDate, targetAmount, currency, notes } = req.body;

    // Verify assigned user is Head of Sales
    const hosUser = await User.findById(assignedTo);
    if (!hosUser || hosUser.role !== 'head-of-sales') {
      return res.status(400).json({ message: 'Target must be assigned to Head of Sales' });
    }

    // Get Co-Founder details
    const cofounderUser = await User.findById(req.user.id);

    // Get month name for description
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'];
    const monthName = targetMonth ? monthNames[targetMonth - 1] : '';
    const periodDescription = monthName && targetYear ? `${monthName} ${targetYear}` : targetPeriod;

    const revenueTarget = new RevenueTarget({
      setBy: req.user.id,
      assignedTo,
      targetPeriod,
      targetMonth,
      targetYear,
      startDate,
      endDate,
      targetAmount,
      currency: currency || 'INR',
      notes,
      status: 'in-progress',
      activities: [{
        action: 'Revenue Target Created',
        description: `Target of ${currency || 'INR'} ${targetAmount?.toLocaleString()} set for ${periodDescription}`,
        performedBy: req.user.id
      }]
    });

    await revenueTarget.save();
    await revenueTarget.populate('setBy assignedTo', 'name email role');

    // Send email notification to HOS
    const emailResult = await sendRevenueTargetNotification({
      hosEmail: hosUser.email,
      hosName: `${hosUser.firstName} ${hosUser.lastName}`,
      targetAmount,
      currency: currency || 'INR',
      periodDescription,
      cofounderName: `${cofounderUser.firstName} ${cofounderUser.lastName}`
    });

    res.status(201).json({
      success: true,
      data: revenueTarget,
      emailSent: emailResult.success,
      emailRecipient: emailResult.recipient
    });
  } catch (error) {
    console.error('Create revenue target error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get All Revenue Targets (Co-Founder view)
exports.getAllRevenueTargets = async (req, res) => {
  try {
    const { status, period } = req.query;
    const filter = {};

    if (status) filter.status = status;
    if (period) filter.targetPeriod = period;

    const targets = await RevenueTarget.find(filter)
      .populate('setBy assignedTo', 'name email role')
      .populate('strategy.targetLocations.assignedReps', 'firstName lastName email phone')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: targets.length,
      data: targets
    });
  } catch (error) {
    console.error('Get all revenue targets error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get Single Revenue Target
exports.getRevenueTarget = async (req, res) => {
  try {
    const target = await RevenueTarget.findById(req.params.id)
      .populate('setBy assignedTo', 'name email role')
      .populate('strategy.targetLocations.assignedReps', 'firstName lastName email phone')
      .populate('activities.performedBy', 'name email');

    if (!target) {
      return res.status(404).json({ message: 'Revenue target not found' });
    }

    res.json({
      success: true,
      data: target
    });
  } catch (error) {
    console.error('Get revenue target error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Update Revenue Target
exports.updateRevenueTarget = async (req, res) => {
  try {
    const { targetAmount, startDate, endDate, notes, status } = req.body;

    const target = await RevenueTarget.findById(req.params.id);
    if (!target) {
      return res.status(404).json({ message: 'Revenue target not found' });
    }

    // Update fields
    if (targetAmount) target.targetAmount = targetAmount;
    if (startDate) target.startDate = startDate;
    if (endDate) target.endDate = endDate;
    if (notes) target.notes = notes;
    if (status) target.status = status;

    target.activities.push({
      action: 'Target Updated',
      description: `Revenue target updated by ${req.user.name}`,
      performedBy: req.user.id
    });

    await target.save();
    await target.populate('setBy assignedTo', 'name email role');

    res.json({
      success: true,
      data: target
    });
  } catch (error) {
    console.error('Update revenue target error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Approve/Reject HOS Strategy (Co-Founder approves HOS's proposed strategy)
exports.approveHOSStrategy = async (req, res) => {
  try {
    const { approved, feedback } = req.body;

    const target = await RevenueTarget.findById(req.params.id);
    if (!target) {
      return res.status(404).json({ message: 'Revenue target not found' });
    }

    if (!target.strategy || !target.strategy.targetLocations || target.strategy.targetLocations.length === 0) {
      return res.status(400).json({ message: 'No strategy found to approve' });
    }

    target.strategy.approvedByCoFounder = approved;
    target.strategy.coFounderFeedback = feedback;

    if (approved) {
      target.hosResponse.status = 'accepted';
      target.activities.push({
        action: 'Strategy Approved',
        description: 'Co-Founder approved the HOS strategy',
        performedBy: req.user.id
      });
    } else {
      target.activities.push({
        action: 'Strategy Rejected',
        description: `Co-Founder rejected strategy. Feedback: ${feedback}`,
        performedBy: req.user.id
      });
    }

    await target.save();
    await target.populate('setBy assignedTo', 'name email role');

    // Get HOS and Co-Founder details for email
    const hosUser = await User.findById(target.assignedTo);
    const cofounderUser = await User.findById(req.user.id);

    // Get month name for description
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'];
    const monthName = target.targetMonth ? monthNames[target.targetMonth - 1] : '';
    const periodDescription = monthName && target.targetYear ? `${monthName} ${target.targetYear}` : target.targetPeriod;

    // Send appropriate email notification to HOS
    let emailResult;
    if (approved) {
      const { sendStrategyApprovedNotification } = require('../utils/emailService');
      emailResult = await sendStrategyApprovedNotification({
        hosEmail: hosUser.email,
        hosName: `${hosUser.firstName} ${hosUser.lastName}`,
        cofounderName: `${cofounderUser.firstName} ${cofounderUser.lastName}`,
        targetAmount: target.targetAmount,
        currency: target.currency,
        periodDescription,
        feedback
      });
    } else {
      const { sendStrategyRejectedNotification } = require('../utils/emailService');
      emailResult = await sendStrategyRejectedNotification({
        hosEmail: hosUser.email,
        hosName: `${hosUser.firstName} ${hosUser.lastName}`,
        cofounderName: `${cofounderUser.firstName} ${cofounderUser.lastName}`,
        targetAmount: target.targetAmount,
        currency: target.currency,
        periodDescription,
        feedback
      });
    }

    res.json({
      success: true,
      data: target,
      emailSent: emailResult.success,
      emailRecipient: emailResult.recipient
    });
  } catch (error) {
    console.error('Approve HOS strategy error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get Co-Founder Dashboard Data
exports.getCoFounderDashboard = async (req, res) => {
  try {
    // Active Targets
    const activeTargets = await RevenueTarget.find({ status: 'in-progress' })
      .populate('assignedTo', 'name email')
      .populate('strategy.targetLocations.assignedReps', 'firstName lastName email phone');

    // Overall Stats
    const totalTargetAmount = activeTargets.reduce((sum, t) => sum + t.targetAmount, 0);
    const totalAchieved = activeTargets.reduce((sum, t) => sum + t.achievedAmount, 0);
    const overallProgress = totalTargetAmount > 0 ? Math.round((totalAchieved / totalTargetAmount) * 100) : 0;

    // Companies & Leads Stats
    const totalCompanies = await Company.countDocuments({ isDeleted: false });
    const approvedCompanies = await Company.countDocuments({ approvalStatus: 'approved', isDeleted: false });
    const pendingApproval = await Company.countDocuments({ approvalStatus: 'pending', isDeleted: false });

    const totalLeads = await Lead.countDocuments({ isDeleted: false });
    const activeLeads = await Lead.countDocuments({ status: 'active', isDeleted: false });
    const wonDeals = await Lead.countDocuments({ stage: 'closed-won', isDeleted: false });

    // Calculate total deal value
    const wonLeads = await Lead.find({ stage: 'closed-won', isDeleted: false });
    const totalRevenue = wonLeads.reduce((sum, lead) => sum + (lead.actualValue || 0), 0);

    // Calculate Current Funds (Total Revenue from Sales - Total Expenses from Payroll)
    // Note: Ideally this should use the Sale model for confirmed sales, similar to CEO dashboard
    const [allSales, allPayrolls] = await Promise.all([
      Sale.find({ stage: 'closed-won' }),
      Payroll.find({})
    ]);

    const actualTotalRevenue = allSales.reduce((sum, sale) => sum + (sale.actualValue || sale.estimatedValue || 0), 0);
    const totalExpenses = allPayrolls.reduce((sum, payroll) => sum + (payroll.netSalary || 0), 0);
    const currentFunds = actualTotalRevenue - totalExpenses;

    // Check for manual overrides
    const financialData = await FinancialData.findOne({ type: 'cofounder-dashboard' });
    const manualData = financialData?.data || {};

    // Merge calculated data with manual data (manual takes precedence if exists)
    const finalTotalRevenue = manualData.totalRevenue !== undefined ? manualData.totalRevenue : totalRevenue;
    const finalTargetAmount = manualData.targetRevenue !== undefined ? manualData.targetRevenue : totalTargetAmount;
    const finalExpectedRevenue = manualData.totalAchieved !== undefined ? manualData.totalAchieved : totalAchieved;
    const finalCurrentFunds = manualData.currentFunds !== undefined ? manualData.currentFunds : currentFunds;

    // Recalculate achievement percentage if values changed
    const finalOverallProgress = finalTargetAmount > 0 ? Math.round((finalExpectedRevenue / finalTargetAmount) * 100) : overallProgress;

    // Recent Activities
    const recentActivities = [];

    // Get recent target activities
    const targets = await RevenueTarget.find()
      .sort({ updatedAt: -1 })
      .limit(10)
      .populate('activities.performedBy', 'name');

    targets.forEach(target => {
      target.activities.slice(-5).forEach(activity => {
        recentActivities.push({
          type: 'revenue-target',
          action: activity.action,
          description: activity.description,
          performedBy: activity.performedBy?.name || 'System',
          timestamp: activity.timestamp,
          relatedId: target._id
        });
      });
    });

    // Sort by timestamp
    recentActivities.sort((a, b) => b.timestamp - a.timestamp);

    res.json({
      success: true,
      data: {
        targets: {
          active: activeTargets.length,
          totalTargetAmount,
          totalAchieved,
          overallProgress: finalOverallProgress,
          list: activeTargets
        },
        companies: {
          total: totalCompanies,
          approved: approvedCompanies,
          pendingApproval
        },
        leads: {
          total: totalLeads,
          active: activeLeads,
          won: wonDeals
        },
        revenue: {
          total: finalTotalRevenue,
          target: finalTargetAmount,
          achieved: finalExpectedRevenue,
          currentFunds: {
            value: finalCurrentFunds,
            formatted: `₹${finalCurrentFunds.toLocaleString('en-IN')}`
          }
        },
        recentActivities: recentActivities.slice(0, 20)
      }
    });
  } catch (error) {
    console.error('Get co-founder dashboard error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Update Financial Data (Manual Overrides)
exports.updateFinancialData = async (req, res) => {
  try {
    const { currentFunds, totalRevenue, targetRevenue, totalAchieved } = req.body;

    const data = {};
    if (currentFunds !== undefined) data.currentFunds = currentFunds;
    if (totalRevenue !== undefined) data.totalRevenue = totalRevenue;
    if (targetRevenue !== undefined) data.targetRevenue = targetRevenue;
    if (totalAchieved !== undefined) data.totalAchieved = totalAchieved;

    let financialData = await FinancialData.findOne({ type: 'cofounder-dashboard' });

    if (financialData) {
      financialData.data = { ...financialData.data, ...data };
      financialData.updatedBy = req.user.id;
      await financialData.save();
    } else {
      financialData = await FinancialData.create({
        type: 'cofounder-dashboard',
        data,
        updatedBy: req.user.id
      });
    }

    res.json({
      success: true,
      data: financialData
    });
  } catch (error) {
    console.error('Update financial data error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// ============ HEAD OF SALES SECTION ============

// Get Assigned Revenue Targets (HOS view)
exports.getMyRevenueTargets = async (req, res) => {
  try {
    const targets = await RevenueTarget.find({
      assignedTo: req.user.id
    })
      .populate('setBy', 'name email role')
      .populate('strategy.targetLocations.assignedReps', 'firstName lastName email phone')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: targets.length,
      data: targets
    });
  } catch (error) {
    console.error('Get my revenue targets error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Respond to Revenue Target (HOS accepts/negotiates target)
exports.respondToRevenueTarget = async (req, res) => {
  try {
    const { status, message } = req.body;

    const target = await RevenueTarget.findById(req.params.id);
    if (!target) {
      return res.status(404).json({ message: 'Revenue target not found' });
    }

    if (target.assignedTo.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    target.hosResponse.status = status;
    target.hosResponse.message = message;
    target.hosResponse.respondedAt = Date.now();

    target.activities.push({
      action: 'HOS Response',
      description: `Head of Sales ${status}: ${message}`,
      performedBy: req.user.id
    });

    await target.save();
    await target.populate('setBy assignedTo', 'name email role');

    res.json({
      success: true,
      data: target
    });
  } catch (error) {
    console.error('Respond to revenue target error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Submit Strategy (HOS proposes location-based strategy)
exports.submitStrategy = async (req, res) => {
  try {
    const { targetLocations, expectedCompanies, expectedLeads } = req.body;

    const target = await RevenueTarget.findById(req.params.id);
    if (!target) {
      return res.status(404).json({ message: 'Revenue target not found' });
    }

    if (target.assignedTo.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    target.strategy = {
      targetLocations,
      expectedCompanies,
      expectedLeads,
      proposedAt: Date.now(),
      approvedByCoFounder: false
    };

    target.activities.push({
      action: 'Strategy Submitted',
      description: `HOS submitted strategy with ${targetLocations.length} target locations`,
      performedBy: req.user.id
    });

    await target.save();
    await target.populate('setBy assignedTo', 'name email role');
    await target.populate('strategy.targetLocations.assignedReps', 'firstName lastName email phone');

    // Get HOS and Co-Founder details for email
    const hosUser = await User.findById(req.user.id);
    const cofounderUser = await User.findById(target.setBy);

    // Get month name for description
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'];
    const monthName = target.targetMonth ? monthNames[target.targetMonth - 1] : '';
    const periodDescription = monthName && target.targetYear ? `${monthName} ${target.targetYear}` : target.targetPeriod;

    // Send email notification to Co-Founder
    const { sendStrategyProposalNotification } = require('../utils/emailService');
    const emailResult = await sendStrategyProposalNotification({
      cofounderEmail: cofounderUser.email,
      cofounderName: `${cofounderUser.firstName} ${cofounderUser.lastName}`,
      hosName: `${hosUser.firstName} ${hosUser.lastName}`,
      targetAmount: target.targetAmount,
      currency: target.currency,
      periodDescription,
      locationCount: targetLocations.length,
      expectedCompanies,
      expectedLeads
    });

    res.json({
      success: true,
      data: target,
      emailSent: emailResult.success,
      emailRecipient: emailResult.recipient
    });
  } catch (error) {
    console.error('Submit strategy error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get HOS Dashboard
exports.getHOSDashboard = async (req, res) => {
  try {
    // Active Revenue Targets
    let targetQuery = { status: { $in: ['in-progress', 'pending'] } };

    // If not HOS (e.g. CEO), find the HOS user to get their targets
    if (req.user.role !== 'head-of-sales') {
      const hosUser = await User.findOne({ role: 'head-of-sales', isActive: true });
      if (hosUser) {
        targetQuery.assignedTo = hosUser._id;
      }
    } else {
      targetQuery.assignedTo = req.user.id;
    }

    const activeTargets = await RevenueTarget.find(targetQuery)
      .populate('setBy', 'name email')
      .populate('strategy.targetLocations.assignedReps', 'firstName lastName email phone');

    // Pending approval companies
    const pendingCompanies = await Company.find({
      approvalStatus: 'pending',
      isDeleted: false
    })
      .populate('identifiedBy', 'name email')
      .sort({ createdAt: -1 })
      .limit(20);

    // Sales team members
    const salesTeam = await User.find({
      role: 'service-onboarding',
      isActive: true
    }).select('name email employeeId');

    // Team performance
    const teamStats = [];
    let totalTeamRevenue = 0; // Calculate total revenue

    for (const rep of salesTeam) {
      const companiesIdentified = await Company.countDocuments({
        identifiedBy: rep._id,
        isDeleted: false
      });
      const leadsManaged = await Lead.countDocuments({
        assignedTo: rep._id,
        isDeleted: false
      });
      const wonDeals = await Lead.countDocuments({
        assignedTo: rep._id,
        stage: 'closed-won',
        isDeleted: false
      });

      const leads = await Lead.find({
        assignedTo: rep._id,
        stage: 'closed-won',
        isDeleted: false
      });
      const revenue = leads.reduce((sum, l) => sum + (l.actualValue || 0), 0);
      totalTeamRevenue += revenue;

      teamStats.push({
        rep: {
          id: rep._id,
          name: rep.name,
          email: rep.email,
          employeeId: rep.employeeId
        },
        companiesIdentified,
        leadsManaged,
        wonDeals,
        revenue
      });
    }

    // Overall stats
    const totalCompanies = await Company.countDocuments({ isDeleted: false });
    const approvedCompanies = await Company.countDocuments({
      approvalStatus: 'approved',
      isDeleted: false
    });
    const totalLeads = await Lead.countDocuments({ isDeleted: false });
    const activeLeads = await Lead.countDocuments({
      status: 'active',
      isDeleted: false
    });

    // Recent activities
    const recentActivities = [];

    const companies = await Company.find({ isDeleted: false })
      .sort({ updatedAt: -1 })
      .limit(10)
      .populate('identifiedBy', 'name')
      .populate('activities.performedBy', 'name');

    companies.forEach(company => {
      company.activities.slice(-3).forEach(activity => {
        recentActivities.push({
          type: 'company',
          action: activity.action,
          description: activity.description,
          performedBy: activity.performedBy?.name || 'System',
          timestamp: activity.timestamp,
          relatedId: company._id,
          relatedName: company.companyName
        });
      });
    });

    recentActivities.sort((a, b) => b.timestamp - a.timestamp);

    res.json({
      success: true,
      data: {
        targets: activeTargets,
        pendingApprovals: {
          count: pendingCompanies.length,
          companies: pendingCompanies
        },
        salesTeam: teamStats,
        overview: {
          totalCompanies,
          approvedCompanies,
          totalLeads,
          activeLeads,
          teamSize: salesTeam.length,
          totalRevenue: totalTeamRevenue
        },
        recentActivities: recentActivities.slice(0, 20)
      }
    });
  } catch (error) {
    console.error('Get HOS dashboard error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get Active Approved Revenue Targets (for sales team to link companies)
exports.getActiveApprovedTargets = async (req, res) => {
  try {
    const targets = await RevenueTarget.find({
      status: 'in-progress',
      'strategy.approvedByCoFounder': true
    })
      .populate('assignedTo', 'name email')
      .select('targetAmount targetPeriod startDate endDate achievedAmount progressPercentage strategy.targetLocations')
      .sort({ startDate: -1 });

    res.json({
      success: true,
      count: targets.length,
      data: targets
    });
  } catch (error) {
    console.error('Get active approved targets error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = exports;
