const Lead = require('../models/Lead');
const Company = require('../models/Company');
const SalesTarget = require('../models/SalesTarget');
const RevenueTarget = require('../models/RevenueTarget');
const User = require('../models/User');

/**
 * HEAD OF SALES COMPREHENSIVE MONITORING CONTROLLER
 * This controller provides a complete view of the sales pipeline
 * linking targets → companies → leads → pipeline stages → followups
 */

// Get Sales Reps List
exports.getSalesRepsList = async (req, res) => {
  try {
    const salesReps = await User.find({ 
      role: 'service-onboarding',
      isActive: true
    })
    .select('firstName lastName email employeeId role')
    .sort({ firstName: 1, lastName: 1 });

    res.json({
      success: true,
      data: salesReps
    });
  } catch (error) {
    console.error('Get sales reps list error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error fetching sales reps', 
      error: error.message 
    });
  }
};

// Get Complete Sales Overview - Links Everything
exports.getCompleteSalesOverview = async (req, res) => {
  try {
    const { salesRepId, startDate, endDate, targetId, status, priority } = req.query;

    // Build filter
    const leadFilter = { isDeleted: false };
    const companyFilter = { approvalStatus: 'approved' };
    const targetFilter = {};

    if (salesRepId) {
      leadFilter.assignedTo = salesRepId;
      companyFilter.assignedTo = salesRepId;
      targetFilter.userId = salesRepId;
    }

    // Lead status filter
    if (status && status !== 'all') {
      if (status === 'won') {
        leadFilter.stage = 'closedWon';
      } else if (status === 'lost') {
        leadFilter.stage = 'closedLost';
      } else {
        leadFilter.status = status;
      }
    }

    // Company priority filter
    if (priority && priority !== 'all') {
      companyFilter.priority = priority;
    }

    if (startDate || endDate) {
      leadFilter.firstContactDate = {};
      if (startDate) leadFilter.firstContactDate.$gte = new Date(startDate);
      if (endDate) leadFilter.firstContactDate.$lte = new Date(endDate);
    }

    if (targetId) {
      // Get companies linked to this target
      companyFilter.revenueTarget = targetId;
    }

    // Fetch all data
    const [salesTargets, revenueTargets, companies, leads] = await Promise.all([
      SalesTarget.find(targetFilter)
        .populate('userId', 'firstName lastName email employeeId')
        .populate('createdBy', 'firstName lastName')
        .sort({ createdAt: -1 }),
      
      RevenueTarget.find({ status: { $in: ['active', 'pending'] } })
        .populate('assignedTo', 'firstName lastName email')
        .populate('createdBy', 'firstName lastName')
        .sort({ createdAt: -1 }),
      
      Company.find(companyFilter)
        .populate('identifiedBy', 'firstName lastName email')
        .populate('approvedBy', 'firstName lastName')
        .populate('assignedTo', 'firstName lastName email employeeId role')
        .populate('revenueTarget')
        .sort({ createdAt: -1 }),
      
      Lead.find(leadFilter)
        .populate('company', 'companyName industry location revenueTarget')
        .populate('assignedTo', 'firstName lastName email employeeId role')
        .populate({
          path: 'followUps.createdBy',
          select: 'firstName lastName'
        })
        .sort({ lastContactDate: -1 })
    ]);

    // Get unique sales reps from companies and leads (only service-onboarding)
    const salesRepsMap = new Map();
    
    companies.forEach(company => {
      if (company.assignedTo && company.assignedTo.role === 'service-onboarding') {
        salesRepsMap.set(company.assignedTo._id.toString(), company.assignedTo);
      }
    });
    
    leads.forEach(lead => {
      if (lead.assignedTo && lead.assignedTo.role === 'service-onboarding') {
        salesRepsMap.set(lead.assignedTo._id.toString(), lead.assignedTo);
      }
    });
    
    const salesReps = Array.from(salesRepsMap.values());

    // Build comprehensive mapping
    const overview = {
      summary: {
        totalTargets: salesTargets.length,
        activeTargets: salesTargets.filter(t => t.status === 'active').length,
        totalCompanies: companies.length,
        totalLeads: leads.length,
        activeLeads: leads.filter(l => l.status === 'active').length,
        wonDeals: leads.filter(l => l.stage === 'closedWon').length,
        lostDeals: leads.filter(l => l.stage === 'closedLost').length,
        totalRevenue: leads
          .filter(l => l.stage === 'closedWon')
          .reduce((sum, l) => sum + (l.actualValue || 0), 0),
        pipelineValue: leads
          .filter(l => l.status === 'active')
          .reduce((sum, l) => sum + (l.potentialValue || 0), 0)
      },
      
      // Target → Company → Lead mapping
      targetMapping: await buildTargetMapping(salesTargets, revenueTargets, companies, leads),
      
      // Sales rep performance
      repPerformance: buildRepPerformance(salesReps, companies, leads, salesTargets),
      
      // Pipeline by stage with detailed followups
      pipelineDetails: buildPipelineDetails(leads),
      
      // Recent activities across all levels
      recentActivities: buildRecentActivities(leads, companies),
      
      // Followup tracking
      followupTracking: buildFollowupTracking(leads),
      
      // Companies needing attention
      attentionRequired: identifyAttentionRequired(companies, leads)
    };

    res.json({
      success: true,
      data: overview
    });
  } catch (error) {
    console.error('Get complete sales overview error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error fetching sales overview', 
      error: error.message 
    });
  }
};

// Get detailed target tracking with full hierarchy
exports.getTargetDetailedTracking = async (req, res) => {
  try {
    const { targetId } = req.params;

    const target = await SalesTarget.findById(targetId)
      .populate('userId', 'firstName lastName email employeeId')
      .populate('createdBy', 'firstName lastName');

    if (!target) {
      return res.status(404).json({ message: 'Target not found' });
    }

    // Get all companies linked to this target's user
    const companies = await Company.find({
      assignedTo: target.userId._id,
      approvalStatus: 'approved',
      createdAt: { $gte: target.startDate, $lte: target.endDate }
    })
      .populate('identifiedBy', 'firstName lastName')
      .populate('approvedBy', 'firstName lastName')
      .populate('revenueTarget');

    // Get all leads from these companies
    const companyIds = companies.map(c => c._id);
    const leads = await Lead.find({
      company: { $in: companyIds },
      isDeleted: false
    })
      .populate('company', 'companyName industry location')
      .populate('assignedTo', 'firstName lastName email')
      .populate({
        path: 'followUps.createdBy',
        select: 'firstName lastName'
      })
      .sort({ lastContactDate: -1 });

    // Build hierarchy
    const hierarchy = companies.map(company => {
      const companyLeads = leads.filter(l => 
        l.company && l.company._id.toString() === company._id.toString()
      );

      return {
        company: {
          id: company._id,
          name: company.companyName,
          industry: company.industry,
          location: company.location,
          priority: company.priority,
          potentialValue: company.potentialValue,
          status: company.status,
          identifiedDate: company.createdAt,
          approvedDate: company.approvalDate,
          revenueTarget: company.revenueTarget
        },
        leads: companyLeads.map(lead => ({
          id: lead._id,
          name: lead.name,
          designation: lead.designation,
          stage: lead.stage,
          status: lead.status,
          potentialValue: lead.potentialValue,
          actualValue: lead.actualValue,
          probability: lead.probability,
          lastContact: lead.lastContactDate,
          followUps: lead.followUps.map(f => ({
            date: f.date,
            type: f.type,
            notes: f.notes,
            outcome: f.outcome,
            nextAction: f.nextAction,
            createdBy: f.createdBy,
            createdAt: f.createdAt
          })),
          stageHistory: lead.stageHistory,
          upcomingFollowups: lead.followUps
            .filter(f => new Date(f.date) > new Date() && !f.outcome)
            .sort((a, b) => new Date(a.date) - new Date(b.date))
        })),
        statistics: {
          totalLeads: companyLeads.length,
          activeLeads: companyLeads.filter(l => l.status === 'active').length,
          wonDeals: companyLeads.filter(l => l.stage === 'closedWon').length,
          lostDeals: companyLeads.filter(l => l.stage === 'closedLost').length,
          totalValue: companyLeads.reduce((sum, l) => sum + (l.potentialValue || 0), 0),
          wonValue: companyLeads
            .filter(l => l.stage === 'closedWon')
            .reduce((sum, l) => sum + (l.actualValue || 0), 0)
        }
      };
    });

    // Calculate progress
    const allLeads = leads;
    const wonDeals = allLeads.filter(l => l.stage === 'closedWon');
    const wonRevenue = wonDeals.reduce((sum, l) => sum + (l.actualValue || 0), 0);

    const progress = {
      companies: {
        target: target.companiesTarget,
        achieved: companies.length,
        percentage: target.companiesTarget > 0 
          ? ((companies.length / target.companiesTarget) * 100).toFixed(1)
          : 0
      },
      leads: {
        target: target.leadsTarget,
        achieved: allLeads.length,
        percentage: target.leadsTarget > 0 
          ? ((allLeads.length / target.leadsTarget) * 100).toFixed(1)
          : 0
      },
      conversions: {
        target: target.conversionsTarget,
        achieved: wonDeals.length,
        percentage: target.conversionsTarget > 0 
          ? ((wonDeals.length / target.conversionsTarget) * 100).toFixed(1)
          : 0
      },
      revenue: {
        target: target.revenueTarget,
        achieved: wonRevenue,
        percentage: target.revenueTarget > 0 
          ? ((wonRevenue / target.revenueTarget) * 100).toFixed(1)
          : 0
      }
    };

    res.json({
      success: true,
      data: {
        target,
        progress,
        hierarchy,
        summary: {
          totalCompanies: companies.length,
          totalLeads: allLeads.length,
          activeLeads: allLeads.filter(l => l.status === 'active').length,
          wonDeals: wonDeals.length,
          wonRevenue,
          pipelineValue: allLeads
            .filter(l => l.status === 'active')
            .reduce((sum, l) => sum + (l.potentialValue || 0), 0)
        }
      }
    });
  } catch (error) {
    console.error('Get target detailed tracking error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error fetching target details', 
      error: error.message 
    });
  }
};

// Get followup calendar/schedule across all leads
exports.getFollowupSchedule = async (req, res) => {
  try {
    const { startDate, endDate, salesRepId, status } = req.query;

    const filter = { isDeleted: false };
    if (salesRepId) filter.assignedTo = salesRepId;

    const leads = await Lead.find(filter)
      .populate('company', 'companyName industry priority')
      .populate('assignedTo', 'firstName lastName email')
      .populate({
        path: 'followUps.createdBy',
        select: 'firstName lastName'
      });

    // Extract all followups
    const allFollowups = [];
    leads.forEach(lead => {
      lead.followUps.forEach(followup => {
        let followupStatus = 'completed';
        if (!followup.outcome) {
          followupStatus = new Date(followup.date) < new Date() ? 'overdue' : 'upcoming';
        }

        if (status && followupStatus !== status) return;

        const followupDate = new Date(followup.date);
        if (startDate && followupDate < new Date(startDate)) return;
        if (endDate && followupDate > new Date(endDate)) return;

        allFollowups.push({
          id: followup._id,
          leadId: lead._id,
          leadName: lead.name,
          leadStage: lead.stage,
          company: lead.company,
          assignedTo: lead.assignedTo,
          date: followup.date,
          type: followup.type,
          notes: followup.notes,
          outcome: followup.outcome,
          nextAction: followup.nextAction,
          createdBy: followup.createdBy,
          createdAt: followup.createdAt,
          status: followupStatus
        });
      });
    });

    // Sort by date
    allFollowups.sort((a, b) => new Date(a.date) - new Date(b.date));

    // Group by date
    const byDate = {};
    allFollowups.forEach(f => {
      const dateKey = new Date(f.date).toISOString().split('T')[0];
      if (!byDate[dateKey]) byDate[dateKey] = [];
      byDate[dateKey].push(f);
    });

    // Statistics
    const stats = {
      total: allFollowups.length,
      upcoming: allFollowups.filter(f => f.status === 'upcoming').length,
      overdue: allFollowups.filter(f => f.status === 'overdue').length,
      completed: allFollowups.filter(f => f.status === 'completed').length,
      byType: allFollowups.reduce((acc, f) => {
        acc[f.type] = (acc[f.type] || 0) + 1;
        return acc;
      }, {})
    };

    res.json({
      success: true,
      data: {
        followups: allFollowups,
        byDate,
        stats
      }
    });
  } catch (error) {
    console.error('Get followup schedule error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error fetching followup schedule', 
      error: error.message 
    });
  }
};

// Get company-lead pipeline view
exports.getCompanyLeadPipeline = async (req, res) => {
  try {
    const { companyId } = req.params;

    const company = await Company.findById(companyId)
      .populate('identifiedBy', 'firstName lastName email')
      .populate('approvedBy', 'firstName lastName')
      .populate('assignedTo', 'firstName lastName email')
      .populate('revenueTarget');

    if (!company) {
      return res.status(404).json({ message: 'Company not found' });
    }

    // Get all leads for this company
    const leads = await Lead.find({
      company: companyId,
      isDeleted: false
    })
      .populate('assignedTo', 'firstName lastName email')
      .populate({
        path: 'followUps.createdBy',
        select: 'firstName lastName'
      })
      .sort({ lastContactDate: -1 });

    // Pipeline breakdown
    const pipeline = {
      lead: leads.filter(l => l.stage === 'lead'),
      qualified: leads.filter(l => l.stage === 'qualified'),
      proposal: leads.filter(l => l.stage === 'proposal'),
      negotiation: leads.filter(l => l.stage === 'negotiation'),
      closedWon: leads.filter(l => l.stage === 'closedWon'),
      closedLost: leads.filter(l => l.stage === 'closedLost')
    };

    // Statistics
    const stats = {
      totalLeads: leads.length,
      activeLeads: leads.filter(l => l.status === 'active').length,
      wonDeals: leads.filter(l => l.stage === 'closedWon').length,
      lostDeals: leads.filter(l => l.stage === 'closedLost').length,
      totalPotentialValue: leads.reduce((sum, l) => sum + (l.potentialValue || 0), 0),
      wonRevenue: leads
        .filter(l => l.stage === 'closedWon')
        .reduce((sum, l) => sum + (l.actualValue || 0), 0),
      conversionRate: leads.length > 0 
        ? ((leads.filter(l => l.stage === 'closedWon').length / leads.length) * 100).toFixed(1)
        : 0,
      averageDealSize: (() => {
        const wonLeads = leads.filter(l => l.stage === 'closedWon' && l.actualValue > 0);
        return wonLeads.length > 0
          ? Math.round(wonLeads.reduce((sum, l) => sum + l.actualValue, 0) / wonLeads.length)
          : 0;
      })()
    };

    // Recent activities
    const activities = [];
    leads.forEach(lead => {
      // Stage changes
      lead.stageHistory.forEach(stage => {
        activities.push({
          type: 'stage_change',
          date: stage.enteredAt,
          leadName: lead.name,
          leadId: lead._id,
          description: `Moved to ${stage.stage}`,
          notes: stage.notes
        });
      });

      // Followups
      lead.followUps.forEach(followup => {
        activities.push({
          type: 'followup',
          date: followup.createdAt,
          leadName: lead.name,
          leadId: lead._id,
          description: `${followup.type} followup`,
          notes: followup.notes,
          outcome: followup.outcome
        });
      });
    });

    activities.sort((a, b) => new Date(b.date) - new Date(a.date));

    res.json({
      success: true,
      data: {
        company,
        leads,
        pipeline,
        stats,
        recentActivities: activities.slice(0, 50)
      }
    });
  } catch (error) {
    console.error('Get company-lead pipeline error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error fetching company pipeline', 
      error: error.message 
    });
  }
};

// Helper functions
async function buildTargetMapping(salesTargets, revenueTargets, companies, leads) {
  const mapping = [];

  for (const target of salesTargets) {
    // Get companies for this sales rep within target period
    const targetCompanies = companies.filter(c => 
      c.assignedTo && 
      c.assignedTo._id.toString() === target.userId._id.toString() &&
      new Date(c.createdAt) >= new Date(target.startDate) &&
      new Date(c.createdAt) <= new Date(target.endDate)
    );

    const companyIds = targetCompanies.map(c => c._id.toString());
    const targetLeads = leads.filter(l => 
      l.company && companyIds.includes(l.company._id.toString())
    );

    mapping.push({
      target: {
        id: target._id,
        period: target.targetPeriod,
        startDate: target.startDate,
        endDate: target.endDate,
        salesRep: target.userId,
        status: target.status
      },
      goals: {
        revenue: target.revenueTarget,
        companies: target.companiesTarget,
        leads: target.leadsTarget,
        conversions: target.conversionsTarget
      },
      achieved: {
        revenue: targetLeads
          .filter(l => l.stage === 'closedWon')
          .reduce((sum, l) => sum + (l.actualValue || 0), 0),
        companies: targetCompanies.length,
        leads: targetLeads.length,
        conversions: targetLeads.filter(l => l.stage === 'closedWon').length
      },
      companies: targetCompanies.map(c => ({
        id: c._id,
        name: c.companyName,
        industry: c.industry,
        leadsCount: targetLeads.filter(l => 
          l.company && l.company._id.toString() === c._id.toString()
        ).length,
        wonDeals: targetLeads.filter(l => 
          l.company && 
          l.company._id.toString() === c._id.toString() &&
          l.stage === 'closedWon'
        ).length
      }))
    });
  }

  return mapping;
}

function buildRepPerformance(salesReps, companies, leads, targets) {
  return salesReps.map(rep => {
    const repCompanies = companies.filter(c => 
      c.assignedTo && c.assignedTo._id.toString() === rep._id.toString()
    );
    const companyIds = repCompanies.map(c => c._id.toString());
    const repLeads = leads.filter(l => 
      l.assignedTo._id.toString() === rep._id.toString()
    );
    const repTargets = targets.filter(t => 
      t.userId._id.toString() === rep._id.toString()
    );

    return {
      salesRep: {
        id: rep._id,
        name: `${rep.firstName} ${rep.lastName}`,
        email: rep.email,
        employeeId: rep.employeeId
      },
      targets: repTargets.length,
      activeTargets: repTargets.filter(t => t.status === 'active').length,
      companies: repCompanies.length,
      leads: repLeads.length,
      activeLeads: repLeads.filter(l => l.status === 'active').length,
      wonDeals: repLeads.filter(l => l.stage === 'closedWon').length,
      wonRevenue: repLeads
        .filter(l => l.stage === 'closedWon')
        .reduce((sum, l) => sum + (l.actualValue || 0), 0),
      pipelineValue: repLeads
        .filter(l => l.status === 'active')
        .reduce((sum, l) => sum + (l.potentialValue || 0), 0),
      conversionRate: repLeads.length > 0 
        ? ((repLeads.filter(l => l.stage === 'closedWon').length / repLeads.length) * 100).toFixed(1)
        : 0
    };
  });
}

function buildPipelineDetails(leads) {
  const stages = ['lead', 'qualified', 'proposal', 'negotiation', 'closedWon', 'closedLost'];
  
  return stages.map(stage => {
    const stageLeads = leads.filter(l => l.stage === stage);
    
    return {
      stage,
      count: stageLeads.length,
      value: stageLeads.reduce((sum, l) => sum + (l.potentialValue || 0), 0),
      leads: stageLeads.map(l => ({
        id: l._id,
        name: l.name,
        company: l.company ? l.company.companyName : 'N/A',
        designation: l.designation,
        potentialValue: l.potentialValue,
        actualValue: l.actualValue,
        probability: l.probability,
        assignedTo: l.assignedTo ? `${l.assignedTo.firstName} ${l.assignedTo.lastName}` : 'N/A',
        lastContact: l.lastContactDate,
        daysSinceContact: Math.floor((Date.now() - new Date(l.lastContactDate)) / (1000 * 60 * 60 * 24)),
        followUpsCount: l.followUps.length,
        lastFollowup: l.followUps.length > 0 
          ? l.followUps[l.followUps.length - 1]
          : null
      }))
    };
  });
}

function buildRecentActivities(leads, companies) {
  const activities = [];

  // Lead activities
  leads.forEach(lead => {
    // Stage changes
    if (lead.stageHistory && lead.stageHistory.length > 0) {
      lead.stageHistory.slice(-5).forEach(stage => {
        activities.push({
          type: 'lead_stage',
          date: stage.enteredAt,
          leadId: lead._id,
          leadName: lead.name,
          companyName: lead.company ? lead.company.companyName : 'N/A',
          description: `Lead moved to ${stage.stage}`,
          notes: stage.notes
        });
      });
    }

    // Recent followups
    if (lead.followUps && lead.followUps.length > 0) {
      lead.followUps.slice(-3).forEach(followup => {
        activities.push({
          type: 'followup',
          date: followup.createdAt,
          leadId: lead._id,
          leadName: lead.name,
          companyName: lead.company ? lead.company.companyName : 'N/A',
          description: `${followup.type} - ${followup.notes}`,
          outcome: followup.outcome
        });
      });
    }
  });

  // Company activities
  companies.forEach(company => {
    if (company.activities && company.activities.length > 0) {
      company.activities.slice(-3).forEach(activity => {
        activities.push({
          type: 'company',
          date: activity.performedAt,
          companyId: company._id,
          companyName: company.companyName,
          description: `${activity.action}: ${activity.description}`
        });
      });
    }
  });

  // Sort by date descending
  activities.sort((a, b) => new Date(b.date) - new Date(a.date));

  return activities.slice(0, 100); // Return top 100 activities
}

function buildFollowupTracking(leads) {
  const upcoming = [];
  const overdue = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  leads.forEach(lead => {
    if (!lead.followUps || lead.followUps.length === 0) return;

    lead.followUps.forEach(followup => {
      if (followup.outcome) return; // Skip completed followups

      const followupDate = new Date(followup.date);
      followupDate.setHours(0, 0, 0, 0);

      const item = {
        id: followup._id,
        leadId: lead._id,
        leadName: lead.name,
        leadStage: lead.stage,
        company: lead.company ? lead.company.companyName : 'N/A',
        assignedTo: lead.assignedTo ? `${lead.assignedTo.firstName} ${lead.assignedTo.lastName}` : 'N/A',
        date: followup.date,
        type: followup.type,
        notes: followup.notes,
        nextAction: followup.nextAction
      };

      if (followupDate < today) {
        overdue.push(item);
      } else {
        upcoming.push(item);
      }
    });
  });

  // Sort
  upcoming.sort((a, b) => new Date(a.date) - new Date(b.date));
  overdue.sort((a, b) => new Date(a.date) - new Date(b.date));

  return {
    upcoming: upcoming.slice(0, 50),
    overdue,
    counts: {
      upcoming: upcoming.length,
      overdue: overdue.length,
      total: upcoming.length + overdue.length
    }
  };
}

function identifyAttentionRequired(companies, leads) {
  const attention = [];
  const today = new Date();

  companies.forEach(company => {
    const companyLeads = leads.filter(l => 
      l.company && l.company._id.toString() === company._id.toString()
    );

    const reasons = [];

    // No leads created for approved company
    if (companyLeads.length === 0 && company.approvalStatus === 'approved') {
      const daysSinceApproval = Math.floor((today - new Date(company.approvalDate)) / (1000 * 60 * 60 * 24));
      if (daysSinceApproval > 7) {
        reasons.push(`No leads created for ${daysSinceApproval} days since approval`);
      }
    }

    // Leads with no recent activity
    companyLeads.forEach(lead => {
      const daysSinceContact = Math.floor((today - new Date(lead.lastContactDate)) / (1000 * 60 * 60 * 24));
      if (daysSinceContact > 14 && lead.status === 'active') {
        reasons.push(`Lead "${lead.name}" - No contact for ${daysSinceContact} days`);
      }

      // High-value leads stuck in stage
      if (lead.potentialValue > 100000 && lead.stageHistory.length > 0) {
        const currentStageEntry = lead.stageHistory[lead.stageHistory.length - 1];
        const daysInStage = Math.floor((today - new Date(currentStageEntry.enteredAt)) / (1000 * 60 * 60 * 24));
        if (daysInStage > 30 && lead.stage !== 'closedWon' && lead.stage !== 'closedLost') {
          reasons.push(`High-value lead "${lead.name}" (₹${lead.potentialValue.toLocaleString()}) stuck in ${lead.stage} for ${daysInStage} days`);
        }
      }
    });

    if (reasons.length > 0) {
      attention.push({
        companyId: company._id,
        companyName: company.companyName,
        assignedTo: company.assignedTo,
        reasons,
        priority: company.priority,
        potentialValue: company.potentialValue
      });
    }
  });

  // Sort by priority and potential value
  attention.sort((a, b) => {
    const priorityWeight = { critical: 4, high: 3, medium: 2, low: 1 };
    const aPriority = priorityWeight[a.priority] || 0;
    const bPriority = priorityWeight[b.priority] || 0;
    
    if (aPriority !== bPriority) return bPriority - aPriority;
    return (b.potentialValue || 0) - (a.potentialValue || 0);
  });

  return attention;
}

module.exports = exports;
