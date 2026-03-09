const Sale = require('../models/Sale');
const SalesTarget = require('../models/SalesTarget');
const User = require('../models/User');
const Company = require('../models/Company');
const Lead = require('../models/Lead');
const RevenueTarget = require('../models/RevenueTarget');
const emailService = require('../utils/emailService');

// Get all sales (with filtering options)
exports.getAllSales = async (req, res) => {
  try {
    const { 
      stage, 
      status, 
      assignedTo, 
      leadType,
      startDate,
      endDate,
      minValue,
      maxValue
    } = req.query;

    // Build filter query
    const filter = { isDeleted: false };
    
    if (stage) filter.stage = stage;
    if (status) filter.status = status;
    if (assignedTo) filter.assignedTo = assignedTo;
    if (leadType) filter.leadType = leadType;
    
    if (startDate || endDate) {
      filter.contactDate = {};
      if (startDate) filter.contactDate.$gte = new Date(startDate);
      if (endDate) filter.contactDate.$lte = new Date(endDate);
    }
    
    if (minValue || maxValue) {
      filter.estimatedValue = {};
      if (minValue) filter.estimatedValue.$gte = Number(minValue);
      if (maxValue) filter.estimatedValue.$lte = Number(maxValue);
    }

    // If user is not CEO or Head of Sales, show only their assigned sales
    if (req.user.role !== 'ceo' && req.user.role !== 'head-of-sales') {
      filter.assignedTo = req.user.id;
    }

    const sales = await Sale.find(filter)
      .populate('company', 'companyName industry approvalStatus approvedBy approvalDate')
      .populate({
        path: 'company',
        populate: {
          path: 'approvedBy',
          select: 'firstName lastName'
        }
      })
      .populate('assignedTo', 'firstName lastName email')
      .populate('headOfSales', 'firstName lastName email')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: sales.length,
      data: sales
    });
  } catch (error) {
    console.error('Error fetching sales:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching sales',
      error: error.message
    });
  }
};

// Get sales for specific sales rep (for their dashboard)
exports.getMySales = async (req, res) => {
  try {
    const sales = await Sale.find({
      assignedTo: req.user.id,
      isDeleted: false
    })
      .populate('company', 'companyName industry approvalStatus approvedBy approvalDate')
      .populate({
        path: 'company',
        populate: {
          path: 'approvedBy',
          select: 'firstName lastName'
        }
      })
      .populate('headOfSales', 'firstName lastName email')
      .sort({ createdAt: -1 });

    const stats = {
      total: sales.length,
      active: sales.filter(s => s.status === 'active').length,
      won: sales.filter(s => s.status === 'won').length,
      lost: sales.filter(s => s.status === 'lost').length,
      totalValue: sales
        .filter(s => s.status === 'won')
        .reduce((sum, s) => sum + s.actualValue, 0)
    };

    res.status(200).json({
      success: true,
      data: sales,
      stats
    });
  } catch (error) {
    console.error('Error fetching my sales:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching sales',
      error: error.message
    });
  }
};

// Get sales team overview (for Head of Sales)
exports.getSalesTeamOverview = async (req, res) => {
  try {
    // Check if user is authorized
    if (req.user.role !== 'head-of-sales' && req.user.role !== 'ceo') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view team overview'
      });
    }

    // Get all sales team members - check both role and category for service-onboarding
    const salesTeam = await User.find({
      $or: [
        { role: 'service-onboarding' },
        { category: 'service-onboarding' }
      ],
      isDeleted: { $ne: true }
    }).select('firstName lastName email role category');

    console.log('🔍 Sales Team Query Result:', salesTeam.length, 'members found');
    salesTeam.forEach(member => {
      console.log(`👤 ${member.firstName} ${member.lastName} - Role: ${member.role}, Category: ${member.category}`);
    });

    // Get all sales
    const allSales = await Sale.find({ isDeleted: false })
      .populate('assignedTo', 'firstName lastName email');

    // Calculate team statistics
    const teamStats = salesTeam.map(member => {
      const memberSales = allSales.filter(
        s => s.assignedTo && s.assignedTo._id.toString() === member._id.toString()
      );

      return {
        userId: member._id,
        name: `${member.firstName} ${member.lastName}`,
        email: member.email,
        totalLeads: memberSales.length,
        activeLeads: memberSales.filter(s => s.status === 'active').length,
        wonDeals: memberSales.filter(s => s.status === 'won').length,
        lostDeals: memberSales.filter(s => s.status === 'lost').length,
        totalRevenue: memberSales
          .filter(s => s.status === 'won')
          .reduce((sum, s) => sum + s.actualValue, 0),
        conversionRate: memberSales.length > 0
          ? ((memberSales.filter(s => s.status === 'won').length / memberSales.length) * 100).toFixed(2)
          : 0
      };
    });

    // Overall team statistics
    const overallStats = {
      totalTeamMembers: salesTeam.length,
      totalLeads: allSales.length,
      activeLeads: allSales.filter(s => s.status === 'active').length,
      wonDeals: allSales.filter(s => s.status === 'won').length,
      lostDeals: allSales.filter(s => s.status === 'lost').length,
      totalRevenue: allSales
        .filter(s => s.status === 'won')
        .reduce((sum, s) => sum + s.actualValue, 0),
      avgDealSize: allSales.filter(s => s.status === 'won').length > 0
        ? (allSales.filter(s => s.status === 'won').reduce((sum, s) => sum + s.actualValue, 0) /
           allSales.filter(s => s.status === 'won').length).toFixed(2)
        : 0
    };

    res.status(200).json({
      success: true,
      teamStats,
      overallStats,
      salesTeam
    });
  } catch (error) {
    console.error('Error fetching team overview:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching team overview',
      error: error.message
    });
  }
};

// Create a new sale/lead
exports.createSale = async (req, res) => {
  try {
    const saleData = {
      ...req.body,
      assignedTo: req.body.assignedTo || req.user.id
    };

    // If user is Head of Sales, set headOfSales field
    if (req.user.role === 'head-of-sales') {
      saleData.headOfSales = req.user.id;
    }

    const sale = await Sale.create(saleData);
    
    await sale.populate('assignedTo', 'firstName lastName email');
    if (sale.headOfSales) {
      await sale.populate('headOfSales', 'firstName lastName email');
    }

    res.status(201).json({
      success: true,
      message: 'Sale created successfully',
      data: sale
    });
  } catch (error) {
    console.error('Error creating sale:', error);
    res.status(400).json({
      success: false,
      message: 'Error creating sale',
      error: error.message
    });
  }
};

// Get single sale details
exports.getSaleById = async (req, res) => {
  try {
    const sale = await Sale.findOne({
      _id: req.params.id,
      isDeleted: false
    })
      .populate('assignedTo', 'firstName lastName email phone')
      .populate('headOfSales', 'firstName lastName email')
      .populate('followUps.createdBy', 'firstName lastName')
      .populate('activities.performedBy', 'firstName lastName');

    if (!sale) {
      return res.status(404).json({
        success: false,
        message: 'Sale not found'
      });
    }

    // Check authorization
    const isAuthorized =
      req.user.role === 'ceo' ||
      req.user.role === 'head-of-sales' ||
      sale.assignedTo._id.toString() === req.user.id;

    if (!isAuthorized) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this sale'
      });
    }

    res.status(200).json({
      success: true,
      data: sale
    });
  } catch (error) {
    console.error('Error fetching sale:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching sale',
      error: error.message
    });
  }
};

// Update sale
exports.updateSale = async (req, res) => {
  try {
    const sale = await Sale.findOne({
      _id: req.params.id,
      isDeleted: false
    });

    if (!sale) {
      return res.status(404).json({
        success: false,
        message: 'Sale not found'
      });
    }

    // Check authorization
    const isAuthorized =
      req.user.role === 'ceo' ||
      req.user.role === 'head-of-sales' ||
      sale.assignedTo.toString() === req.user.id;

    if (!isAuthorized) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this sale'
      });
    }

    // Track stage changes
    if (req.body.stage && req.body.stage !== sale.stage) {
      sale.activities.push({
        action: 'stage_changed',
        description: `Stage changed from ${sale.stage} to ${req.body.stage}`,
        performedBy: req.user.id,
        timestamp: new Date()
      });
    }

    // Track status changes
    if (req.body.status && req.body.status !== sale.status) {
      sale.activities.push({
        action: 'status_changed',
        description: `Status changed from ${sale.status} to ${req.body.status}`,
        performedBy: req.user.id,
        timestamp: new Date()
      });

      // Set close date if won or lost
      if (req.body.status === 'won' || req.body.status === 'lost') {
        sale.actualCloseDate = new Date();
      }
    }

    // Update fields
    Object.keys(req.body).forEach(key => {
      if (key !== 'activities' && key !== 'followUps' && key !== 'documents') {
        sale[key] = req.body[key];
      }
    });

    await sale.save();
    await sale.populate('assignedTo', 'firstName lastName email');
    if (sale.headOfSales) {
      await sale.populate('headOfSales', 'firstName lastName email');
    }

    res.status(200).json({
      success: true,
      message: 'Sale updated successfully',
      data: sale
    });
  } catch (error) {
    console.error('Error updating sale:', error);
    res.status(400).json({
      success: false,
      message: 'Error updating sale',
      error: error.message
    });
  }
};

// Update sale stage with proof
exports.updateStageWithProof = async (req, res) => {
  try {
    const { toStage, proofType, proofSummary, proofLink } = req.body;
    
    const sale = await Sale.findOne({
      _id: req.params.id,
      isDeleted: false
    });

    if (!sale) {
      return res.status(404).json({
        success: false,
        message: 'Sale not found'
      });
    }

    // Check authorization
    const isAuthorized =
      req.user.role === 'ceo' ||
      req.user.role === 'head-of-sales' ||
      sale.assignedTo.toString() === req.user.id;

    if (!isAuthorized) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this sale'
      });
    }

    const fromStage = sale.stage;

    // Handle file upload if present
    let proofDocument = null;
    if (req.file) {
      proofDocument = {
        name: req.file.originalname,
        path: req.file.path,
        uploadedAt: new Date()
      };
    }

    // Add stage proof
    sale.stageProofs.push({
      fromStage,
      toStage,
      proofType,
      proofSummary,
      proofLink: proofLink || '',
      proofDocument,
      submittedBy: req.user.id,
      submittedAt: new Date()
    });

    // Update stage
    sale.stage = toStage;

    // Add activity log
    sale.activities.push({
      action: 'stage_changed_with_proof',
      description: `Stage changed from ${fromStage} to ${toStage} with ${proofType} proof`,
      performedBy: req.user.id,
      timestamp: new Date()
    });

    // Update status based on stage
    if (toStage === 'closed-won') {
      sale.status = 'won';
      sale.actualCloseDate = new Date();
    } else if (toStage === 'closed-lost') {
      sale.status = 'lost';
      sale.actualCloseDate = new Date();
    }

    await sale.save();
    await sale.populate('assignedTo', 'firstName lastName email');
    await sale.populate('stageProofs.submittedBy', 'firstName lastName email');

    res.status(200).json({
      success: true,
      message: 'Sale stage updated with proof',
      data: sale
    });
  } catch (error) {
    console.error('Error updating stage with proof:', error);
    res.status(400).json({
      success: false,
      message: 'Error updating sale stage',
      error: error.message
    });
  }
};

// Add follow-up to sale
exports.addFollowUp = async (req, res) => {
  try {
    const { date, notes, nextAction } = req.body;

    const sale = await Sale.findOne({
      _id: req.params.id,
      isDeleted: false
    });

    if (!sale) {
      return res.status(404).json({
        success: false,
        message: 'Sale not found'
      });
    }

    sale.followUps.push({
      date,
      notes,
      nextAction,
      createdBy: req.user.id,
      createdAt: new Date()
    });

    sale.activities.push({
      action: 'follow_up_added',
      description: 'Follow-up added',
      performedBy: req.user.id,
      timestamp: new Date()
    });

    await sale.save();
    await sale.populate('followUps.createdBy', 'firstName lastName');

    res.status(200).json({
      success: true,
      message: 'Follow-up added successfully',
      data: sale
    });
  } catch (error) {
    console.error('Error adding follow-up:', error);
    res.status(400).json({
      success: false,
      message: 'Error adding follow-up',
      error: error.message
    });
  }
};

// Delete sale (soft delete)
exports.deleteSale = async (req, res) => {
  try {
    const sale = await Sale.findById(req.params.id);

    if (!sale) {
      return res.status(404).json({
        success: false,
        message: 'Sale not found'
      });
    }

    // Only CEO or Head of Sales can delete
    if (req.user.role !== 'ceo' && req.user.role !== 'head-of-sales') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete sales'
      });
    }

    sale.isDeleted = true;
    sale.activities.push({
      action: 'deleted',
      description: 'Sale deleted',
      performedBy: req.user.id,
      timestamp: new Date()
    });

    await sale.save();

    res.status(200).json({
      success: true,
      message: 'Sale deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting sale:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting sale',
      error: error.message
    });
  }
};

// Get sales analytics
exports.getSalesAnalytics = async (req, res) => {
  try {
    const { startDate, endDate, userId } = req.query;

    // Build filter
    const filter = { isDeleted: false };
    
    if (startDate || endDate) {
      filter.contactDate = {};
      if (startDate) filter.contactDate.$gte = new Date(startDate);
      if (endDate) filter.contactDate.$lte = new Date(endDate);
    }

    if (userId && (req.user.role === 'ceo' || req.user.role === 'head-of-sales')) {
      filter.assignedTo = userId;
    } else if (req.user.role !== 'ceo' && req.user.role !== 'head-of-sales') {
      filter.assignedTo = req.user.id;
    }

    const sales = await Sale.find(filter);

    // Calculate analytics
    const analytics = {
      totalLeads: sales.length,
      byStage: {
        lead: sales.filter(s => s.stage === 'lead').length,
        qualified: sales.filter(s => s.stage === 'qualified').length,
        proposal: sales.filter(s => s.stage === 'proposal').length,
        negotiation: sales.filter(s => s.stage === 'negotiation').length,
        closedWon: sales.filter(s => s.stage === 'closed-won').length,
        closedLost: sales.filter(s => s.stage === 'closed-lost').length
      },
      byStatus: {
        active: sales.filter(s => s.status === 'active').length,
        onHold: sales.filter(s => s.status === 'on-hold').length,
        won: sales.filter(s => s.status === 'won').length,
        lost: sales.filter(s => s.status === 'lost').length
      },
      byLeadType: {
        hot: sales.filter(s => s.leadType === 'hot').length,
        warm: sales.filter(s => s.leadType === 'warm').length,
        cold: sales.filter(s => s.leadType === 'cold').length
      },
      revenue: {
        total: sales.filter(s => s.status === 'won').reduce((sum, s) => sum + s.actualValue, 0),
        estimated: sales.filter(s => s.status === 'active').reduce((sum, s) => sum + s.estimatedValue, 0),
        avgDealSize: sales.filter(s => s.status === 'won').length > 0
          ? (sales.filter(s => s.status === 'won').reduce((sum, s) => sum + s.actualValue, 0) /
             sales.filter(s => s.status === 'won').length)
          : 0
      },
      conversionRate: sales.length > 0
        ? ((sales.filter(s => s.status === 'won').length / sales.length) * 100).toFixed(2)
        : 0
    };

    res.status(200).json({
      success: true,
      data: analytics
    });
  } catch (error) {
    console.error('Error fetching analytics:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching analytics',
      error: error.message
    });
  }
};

// Sales Target Management
exports.createSalesTarget = async (req, res) => {
  try {
    // Only CEO or Head of Sales can create targets
    if (req.user.role !== 'ceo' && req.user.role !== 'head-of-sales') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to create sales targets'
      });
    }

    const { userId, startDate, endDate, targetPeriod } = req.body;

    // Check for overlapping targets for the same user
    const existingTargets = await SalesTarget.find({
      userId: userId,
      status: { $in: ['active', 'pending'] },
      $or: [
        // New target starts within existing target period
        {
          startDate: { $lte: new Date(startDate) },
          endDate: { $gte: new Date(startDate) }
        },
        // New target ends within existing target period
        {
          startDate: { $lte: new Date(endDate) },
          endDate: { $gte: new Date(endDate) }
        },
        // New target completely encompasses existing target
        {
          startDate: { $gte: new Date(startDate) },
          endDate: { $lte: new Date(endDate) }
        }
      ]
    }).populate('userId', 'firstName lastName email');

    if (existingTargets.length > 0) {
      const existingTarget = existingTargets[0];
      return res.status(400).json({
        success: false,
        message: `A ${existingTarget.targetPeriod} target already exists for ${existingTarget.userId.firstName} ${existingTarget.userId.lastName} from ${new Date(existingTarget.startDate).toLocaleDateString()} to ${new Date(existingTarget.endDate).toLocaleDateString()}`,
        existingTarget: {
          id: existingTarget._id,
          period: existingTarget.targetPeriod,
          startDate: existingTarget.startDate,
          endDate: existingTarget.endDate
        }
      });
    }

    const target = await SalesTarget.create({
      ...req.body,
      createdBy: req.user.id
    });

    await target.populate('userId', 'firstName lastName email');
    await target.populate('createdBy', 'firstName lastName');

    // Send email notification to the assigned sales representative
    try {
      let linkedRevenueTargetAmount = null;
      
      // If linked to revenue target, fetch the amount
      if (req.body.revenueTargetId) {
        const revenueTarget = await RevenueTarget.findById(req.body.revenueTargetId);
        if (revenueTarget) {
          linkedRevenueTargetAmount = revenueTarget.targetAmount;
        }
      }

      const emailData = {
        salesRepEmail: target.userId.email,
        salesRepName: `${target.userId.firstName} ${target.userId.lastName}`,
        revenueTarget: target.revenueTarget,
        companiesTarget: target.companiesTarget,
        leadsTarget: target.leadsTarget,
        conversionsTarget: target.conversionsTarget,
        targetPeriod: target.targetPeriod,
        startDate: target.startDate,
        endDate: target.endDate,
        notes: target.notes,
        assignedByName: `${target.createdBy.firstName} ${target.createdBy.lastName}`,
        linkedRevenueTarget: linkedRevenueTargetAmount
      };

      await emailService.sendSalesTargetNotification(emailData);
      console.log(`Sales target notification email sent to ${target.userId.email}`);
    } catch (emailError) {
      console.error('Failed to send email notification:', emailError);
      // Don't fail the request if email fails
    }

    res.status(201).json({
      success: true,
      message: 'Sales target created successfully',
      data: target
    });
  } catch (error) {
    console.error('Error creating sales target:', error);
    res.status(400).json({
      success: false,
      message: 'Error creating sales target',
      error: error.message
    });
  }
};

exports.getSalesTargets = async (req, res) => {
  try {
    const { userId, status, targetPeriod } = req.query;

    const filter = {};
    if (status) filter.status = status;
    if (targetPeriod) filter.targetPeriod = targetPeriod;

    // If not CEO or Head of Sales, show only own targets
    if (req.user.role !== 'ceo' && req.user.role !== 'head-of-sales') {
      filter.userId = req.user.id;
    } else if (userId) {
      filter.userId = userId;
    }

    const targets = await SalesTarget.find(filter)
      .populate('userId', 'firstName lastName email')
      .populate('createdBy', 'firstName lastName')
      .sort({ startDate: -1 });

    res.status(200).json({
      success: true,
      data: targets
    });
  } catch (error) {
    console.error('Error fetching sales targets:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching sales targets',
      error: error.message
    });
  }
};

exports.updateSalesTarget = async (req, res) => {
  try {
    const target = await SalesTarget.findById(req.params.id);

    if (!target) {
      return res.status(404).json({
        success: false,
        message: 'Sales target not found'
      });
    }

    // Only CEO or Head of Sales can update targets
    if (req.user.role !== 'ceo' && req.user.role !== 'head-of-sales') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update sales targets'
      });
    }

    Object.keys(req.body).forEach(key => {
      target[key] = req.body[key];
    });

    await target.save();
    await target.populate('userId', 'firstName lastName email');

    res.status(200).json({
      success: true,
      message: 'Sales target updated successfully',
      data: target
    });
  } catch (error) {
    console.error('Error updating sales target:', error);
    res.status(400).json({
      success: false,
      message: 'Error updating sales target',
      error: error.message
    });
  }
};

// Get detailed target analytics for a user
exports.getMyTargetAnalytics = async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Get all targets for the user
    const targets = await SalesTarget.find({ userId })
      .populate('createdBy', 'firstName lastName')
      .sort({ startDate: -1 });

    // Get all leads for the user
    const leads = await Lead.find({
      assignedTo: userId,
      isDeleted: false
    }).sort({ createdAt: -1 });

    // Get all companies submitted by the user
    const companies = await Company.find({
      identifiedBy: userId
    }).sort({ createdAt: -1 });

    // Current active target
    const activeTarget = targets.find(t => t.status === 'active');

    // Calculate current period performance
    let currentPeriodLeads = [];
    let currentPeriodCompanies = [];
    
    if (activeTarget) {
      currentPeriodLeads = leads.filter(l => {
        const leadDate = l.actualCloseDate || l.createdAt;
        return leadDate >= activeTarget.startDate && leadDate <= activeTarget.endDate;
      });
      
      currentPeriodCompanies = companies.filter(c => {
        const companyDate = c.createdAt;
        return companyDate >= activeTarget.startDate && companyDate <= activeTarget.endDate;
      });
    }

    // Performance metrics
    const wonDeals = currentPeriodLeads.filter(l => l.stage === 'closedWon');
    const totalRevenue = wonDeals.reduce((sum, l) => sum + (l.actualValue || 0), 0);
    const conversionRate = currentPeriodLeads.length > 0 
      ? ((wonDeals.length / currentPeriodLeads.length) * 100).toFixed(2)
      : 0;

    // Companies metrics
    const approvedCompanies = currentPeriodCompanies.filter(c => c.approvalStatus === 'approved').length;
    const pendingCompanies = currentPeriodCompanies.filter(c => c.approvalStatus === 'pending').length;
    const rejectedCompanies = currentPeriodCompanies.filter(c => c.approvalStatus === 'rejected').length;

    // Stage distribution of current leads
    const stageDistribution = {};
    leads.filter(l => l.status === 'active').forEach(lead => {
      stageDistribution[lead.stage] = (stageDistribution[lead.stage] || 0) + 1;
    });

    // Historical performance
    const historicalPerformance = targets
      .filter(t => t.status === 'completed')
      .slice(0, 6)
      .map(t => ({
        period: t.targetPeriod,
        startDate: t.startDate,
        endDate: t.endDate,
        targetRevenue: t.revenueTarget,
        achievedRevenue: t.revenueAchieved,
        percentage: t.progressPercentage,
        achieved: t.progressPercentage >= 100
      }));

    // Upcoming deadlines
    const upcomingDeadlines = leads
      .filter(l => l.status === 'active' && l.expectedCloseDate)
      .sort((a, b) => new Date(a.expectedCloseDate) - new Date(b.expectedCloseDate))
      .slice(0, 5)
      .map(l => ({
        id: l._id,
        clientName: l.name,
        clientCompany: l.company?.companyName || 'N/A',
        estimatedValue: l.potentialValue,
        expectedCloseDate: l.expectedCloseDate,
        stage: l.stage,
        daysRemaining: Math.ceil((new Date(l.expectedCloseDate) - new Date()) / (1000 * 60 * 60 * 24))
      }));

    // Recent wins
    const recentWins = leads
      .filter(l => l.stage === 'closedWon')
      .sort((a, b) => new Date(b.actualCloseDate || b.updatedAt) - new Date(a.actualCloseDate || a.updatedAt))
      .slice(0, 5)
      .map(l => ({
        id: l._id,
        clientName: l.name,
        clientCompany: l.company?.companyName || 'N/A',
        actualValue: l.actualValue,
        actualCloseDate: l.actualCloseDate,
        serviceType: l.serviceInterest
      }));

    // Calculate days remaining in current target
    let daysRemaining = 0;
    let daysElapsed = 0;
    let totalDays = 0;
    
    if (activeTarget) {
      const now = new Date();
      const start = new Date(activeTarget.startDate);
      const end = new Date(activeTarget.endDate);
      
      totalDays = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
      daysElapsed = Math.ceil((now - start) / (1000 * 60 * 60 * 24));
      daysRemaining = Math.ceil((end - now) / (1000 * 60 * 60 * 24));
    }

    // Active projects/opportunities
    const activeProjects = leads
      .filter(l => l.status === 'active')
      .map(l => ({
        id: l._id,
        clientName: l.name,
        clientCompany: l.company?.companyName || 'N/A',
        estimatedValue: l.potentialValue,
        stage: l.stage,
        probability: l.probability,
        expectedCloseDate: l.expectedCloseDate,
        serviceType: l.serviceInterest
      }));

    res.status(200).json({
      success: true,
      data: {
        currentTarget: activeTarget,
        targets: targets,
        performance: {
          totalCompanies: currentPeriodCompanies.length,
          approvedCompanies,
          pendingCompanies,
          rejectedCompanies,
          totalLeads: currentPeriodLeads.length,
          wonDeals: wonDeals.length,
          lostDeals: currentPeriodLeads.filter(l => l.stage === 'closedLost').length,
          totalRevenue,
          conversionRate,
          averageDealSize: wonDeals.length > 0 ? (totalRevenue / wonDeals.length).toFixed(2) : 0,
          funnelConversionRate: {
            companiesToLeads: approvedCompanies > 0 
              ? ((currentPeriodLeads.length / approvedCompanies) * 100).toFixed(2) 
              : 0,
            leadsToConversions: currentPeriodLeads.length > 0 
              ? ((wonDeals.length / currentPeriodLeads.length) * 100).toFixed(2) 
              : 0,
            companiesToConversions: approvedCompanies > 0 
              ? ((wonDeals.length / approvedCompanies) * 100).toFixed(2) 
              : 0
          }
        },
        stageDistribution,
        historicalPerformance,
        upcomingDeadlines,
        recentWins,
        activeProjects,
        timeline: {
          daysRemaining,
          daysElapsed,
          totalDays,
          percentageElapsed: totalDays > 0 ? ((daysElapsed / totalDays) * 100).toFixed(2) : 0
        }
      }
    });
  } catch (error) {
    console.error('Error fetching target analytics:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching target analytics',
      error: error.message
    });
  }
};

// Delete sales target
exports.deleteSalesTarget = async (req, res) => {
  try {
    // Only CEO or Head of Sales can delete targets
    if (req.user.role !== 'ceo' && req.user.role !== 'head-of-sales') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete sales targets'
      });
    }

    const target = await SalesTarget.findById(req.params.id);

    if (!target) {
      return res.status(404).json({
        success: false,
        message: 'Sales target not found'
      });
    }

    await SalesTarget.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Sales target deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting sales target:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting sales target',
      error: error.message
    });
  }
};
