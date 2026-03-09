const RevenueTargetService = require('./RevenueTargetService');
const CompanyTargetService = require('./CompanyTargetService');
const LeadManagementService = require('./LeadManagementService');
const SalesTaskService = require('./SalesTaskService');
const User = require('../models/User');

/**
 * Integrated Sales Management Service
 * Orchestrates the complete sales workflow from target setting to deal closing
 */
class SalesIntegrationService {
  /**
   * Complete workflow: Co-Founder sets target → HOS receives and plans
   */
  static async initiateRevenueTargetWorkflow(targetData, coFounderId) {
    // Step 1: Co-Founder creates revenue target
    const revenueTarget = await RevenueTargetService.createRevenueTarget(
      targetData,
      coFounderId
    );

    // Step 2: Notify HOS (this would integrate with notification system)
    // In a real system, send email/notification to HOS
    
    return {
      revenueTarget,
      nextStep: 'HOS needs to review and respond to the target'
    };
  }

  /**
   * HOS workflow: Accept target → Propose strategy → Get approval
   */
  static async hosWorkflow(targetId, hosId, responseData, strategyData = null) {
    // Step 1: HOS responds to target
    const updatedTarget = await RevenueTargetService.hosRespondToTarget(
      targetId,
      hosId,
      responseData
    );

    // Step 2: If accepted, propose strategy
    if (responseData.status === 'accepted' && strategyData) {
      const targetWithStrategy = await RevenueTargetService.proposeStrategy(
        targetId,
        hosId,
        strategyData
      );

      return {
        target: targetWithStrategy,
        nextStep: 'Awaiting Co-Founder approval of strategy'
      };
    }

    return {
      target: updatedTarget,
      nextStep: responseData.status === 'accepted' 
        ? 'Propose strategy for achieving the target'
        : 'Target response recorded'
    };
  }

  /**
   * Sales rep workflow: Identify company → Add research → Submit for approval
   */
  static async companIdentificationWorkflow(companyData, salesRepId) {
    // Step 1: Identify company
    const company = await CompanyTargetService.identifyCompany(
      companyData,
      salesRepId
    );

    // Step 2: Attach study documents if provided
    if (companyData.studyDocuments && companyData.studyDocuments.length > 0) {
      await CompanyTargetService.attachStudyDocuments(
        company._id,
        companyData.studyDocuments,
        salesRepId
      );
    }

    // Step 3: Update research if provided
    if (companyData.research) {
      await CompanyTargetService.updateResearch(
        company._id,
        salesRepId,
        companyData.research
      );
    }

    return {
      company,
      nextStep: 'Company submitted for HOS approval'
    };
  }

  /**
   * HOS reviews company and if approved, sales rep can add leads
   */
  static async companyApprovalWorkflow(companyId, hosId, approved, notes) {
    const company = await CompanyTargetService.reviewCompany(
      companyId,
      hosId,
      approved,
      notes
    );

    return {
      company,
      nextStep: approved 
        ? 'Company approved - sales rep can now add leads and start outreach'
        : 'Company rejected - sales rep notified'
    };
  }

  /**
   * Complete lead lifecycle from creation to closing
   */
  static async leadLifecycleWorkflow(leadData, salesRepId) {
    // Step 1: Create lead
    const lead = await LeadManagementService.createLead(leadData, salesRepId);

    // Step 2: Create initial outreach task
    const outreachTask = await SalesTaskService.createDefaultTask({
      title: `Initial outreach - ${leadData.name}`,
      description: `Make first contact with ${leadData.name} at ${leadData.companyName}`,
      assignedTo: salesRepId,
      deadline: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2 days
      priority: 'high',
      companyId: leadData.companyId,
      leadId: lead._id
    }, salesRepId);

    return {
      lead,
      outreachTask,
      nextStep: 'Complete initial outreach and move lead through stages'
    };
  }

  /**
   * Progress lead through stages with automatic task creation
   */
  static async progressLead(leadId, newStage, updatedBy, notes) {
    // Update lead stage
    const lead = await LeadManagementService.updateLeadStage(
      leadId,
      newStage,
      updatedBy,
      notes
    );

    // Create appropriate follow-up task based on stage
    let followUpTask = null;
    const taskData = this.getTaskForStage(newStage, lead);
    
    if (taskData) {
      followUpTask = await SalesTaskService.createDefaultTask({
        ...taskData,
        assignedTo: lead.assignedTo,
        companyId: lead.company,
        leadId: lead._id
      }, updatedBy);
    }

    return {
      lead,
      followUpTask,
      nextStep: this.getNextStepForStage(newStage)
    };
  }

  /**
   * Get suggested task for each stage
   */
  static getTaskForStage(stage, lead) {
    const tasks = {
      'qualified': {
        title: `Discovery call - ${lead.name}`,
        description: 'Conduct discovery call to understand requirements and pain points',
        deadline: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
        priority: 'high'
      },
      'proposal': {
        title: `Prepare proposal - ${lead.name}`,
        description: 'Create and send detailed proposal',
        deadline: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
        priority: 'high'
      },
      'negotiation': {
        title: `Follow up on proposal - ${lead.name}`,
        description: 'Negotiate terms and address concerns',
        deadline: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
        priority: 'urgent'
      }
    };

    return tasks[stage] || null;
  }

  /**
   * Get next step description for each stage
   */
  static getNextStepForStage(stage) {
    const nextSteps = {
      'lead': 'Qualify the lead by understanding their needs',
      'qualified': 'Schedule discovery call or demo',
      'proposal': 'Prepare and send proposal',
      'negotiation': 'Address concerns and finalize terms',
      'closedWon': 'Deal won! Update revenue achievement',
      'closedLost': 'Analyze loss reason and update records'
    };

    return nextSteps[stage] || 'Continue lead management';
  }

  /**
   * Create recurring follow-up tasks for nurturing leads
   */
  static async createNurturingCampaign(leadId, salesRepId, frequency = 'weekly') {
    const lead = await LeadManagementService.getLeadsBySalesRep(salesRepId, { _id: leadId });
    
    if (!lead || lead.length === 0) {
      throw new Error('Lead not found');
    }

    const recurringTask = await SalesTaskService.createRecurringTask({
      title: `Follow up - ${lead[0].name}`,
      description: 'Regular check-in and relationship building',
      assignedTo: salesRepId,
      deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      frequency,
      interval: 1,
      recurringEndDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 3 months
      companyId: lead[0].company._id,
      leadId: lead[0]._id,
      priority: 'medium'
    }, salesRepId);

    return {
      recurringTask,
      message: `Nurturing campaign created with ${frequency} follow-ups for 3 months`
    };
  }

  /**
   * Dashboard data for HOS
   */
  static async getHOSDashboard(hosId) {
    // Get active revenue targets
    const activeTargets = await RevenueTargetService.getTargetsForHOS(hosId, {
      status: { $in: ['pending', 'approved', 'in-progress'] }
    });

    // Get companies pending approval
    const pendingCompanies = await CompanyTargetService.getPendingApprovals(hosId);

    // Get all leads in pipeline
    const pipelineSummary = await LeadManagementService.getPipelineSummary();

    // Get tasks
    const tasks = await SalesTaskService.getTasksForSalesRole(hosId, {
      status: { $in: ['not-started', 'in-progress'] }
    });

    return {
      revenueTargets: activeTargets,
      pendingApprovals: pendingCompanies.length,
      pipeline: pipelineSummary,
      activeTasks: tasks.length,
      summary: {
        totalTargetAmount: activeTargets.reduce((sum, t) => sum + t.targetAmount, 0),
        totalAchievedAmount: activeTargets.reduce((sum, t) => sum + t.achievedAmount, 0),
        overallProgress: this.calculateOverallProgress(activeTargets)
      }
    };
  }

  /**
   * Dashboard data for Sales Rep
   */
  static async getSalesRepDashboard(salesRepId) {
    // Get assigned companies
    const companies = await CompanyTargetService.getCompaniesBySalesRep(salesRepId);

    // Get leads
    const leads = await LeadManagementService.getLeadsBySalesRep(salesRepId);

    // Get pipeline summary
    const pipelineSummary = await LeadManagementService.getPipelineSummary(salesRepId);

    // Get tasks
    const tasks = await SalesTaskService.getTasksForSalesRole(salesRepId, {
      status: { $in: ['not-started', 'in-progress'] }
    });

    return {
      companies: companies.length,
      leads: leads.length,
      pipeline: pipelineSummary,
      tasks: tasks,
      summary: {
        activeLeads: leads.filter(l => l.status === 'active').length,
        totalPotentialValue: leads.reduce((sum, l) => sum + l.potentialValue, 0),
        closingThisMonth: leads.filter(l => {
          return l.expectedCloseDate && 
                 new Date(l.expectedCloseDate).getMonth() === new Date().getMonth();
        }).length
      }
    };
  }

  /**
   * Calculate overall progress across multiple targets
   */
  static calculateOverallProgress(targets) {
    if (targets.length === 0) return 0;
    
    const totalTarget = targets.reduce((sum, t) => sum + t.targetAmount, 0);
    const totalAchieved = targets.reduce((sum, t) => sum + t.achievedAmount, 0);
    
    return totalTarget > 0 ? Math.round((totalAchieved / totalTarget) * 100) : 0;
  }

  /**
   * Get complete sales funnel metrics
   */
  static async getSalesFunnelMetrics(revenueTargetId = null) {
    const matchQuery = { isDeleted: false };
    
    // If revenue target specified, filter companies and leads related to it
    if (revenueTargetId) {
      const companies = await CompanyTargetService.getCompaniesBySalesRep(null, {
        revenueTarget: revenueTargetId
      });
      const companyIds = companies.map(c => c._id);
      matchQuery.company = { $in: companyIds };
    }

    const Lead = require('../models/Lead');
    
    const metrics = await Lead.aggregate([
      { $match: matchQuery },
      {
        $facet: {
          byStage: [
            { $group: { _id: '$stage', count: { $sum: 1 }, value: { $sum: '$potentialValue' } } }
          ],
          conversion: [
            {
              $group: {
                _id: null,
                totalLeads: { $sum: 1 },
                qualified: { $sum: { $cond: [{ $in: ['$stage', ['qualified', 'proposal', 'negotiation', 'closedWon']] }, 1, 0] } },
                proposals: { $sum: { $cond: [{ $in: ['$stage', ['proposal', 'negotiation', 'closedWon']] }, 1, 0] } },
                negotiations: { $sum: { $cond: [{ $in: ['$stage', ['negotiation', 'closedWon']] }, 1, 0] } },
                won: { $sum: { $cond: [{ $eq: ['$stage', 'closedWon'] }, 1, 0] } },
                lost: { $sum: { $cond: [{ $eq: ['$stage', 'closedLost'] }, 1, 0] } },
                totalValue: { $sum: '$actualValue' }
              }
            }
          ]
        }
      }
    ]);

    return metrics[0];
  }
}

module.exports = SalesIntegrationService;
