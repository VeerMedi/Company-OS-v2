/**
 * Sales Management System - Complete Integration Example
 * 
 * This file demonstrates how to integrate the sales management system
 * into your existing application with complete workflow examples.
 */

// ============================================================================
// STEP 1: Import Required Services
// ============================================================================

const RevenueTargetService = require('./services/RevenueTargetService');
const CompanyTargetService = require('./services/CompanyTargetService');
const LeadManagementService = require('./services/LeadManagementService');
const SalesTaskService = require('./services/SalesTaskService');
const SalesIntegrationService = require('./services/SalesIntegrationService');
const SalesHelpers = require('./utils/SalesHelpers');
const RecurringTaskScheduler = require('./utils/RecurringTaskScheduler');

// ============================================================================
// STEP 2: Initialize Recurring Task Scheduler (in server.js)
// ============================================================================

/**
 * Add this to your server.js after MongoDB connection:
 * 
 * RecurringTaskScheduler.start();
 * console.log('Sales management system initialized');
 */

// ============================================================================
// STEP 3: Example Controller - Revenue Target Management
// ============================================================================

class RevenueTargetController {
  /**
   * Co-Founder creates a revenue target
   * POST /api/revenue-targets
   */
  static async createTarget(req, res) {
    try {
      // Verify user is co-founder
      if (req.user.role !== 'co-founder') {
        return res.status(403).json({ error: 'Only Co-Founders can create targets' });
      }

      const result = await SalesIntegrationService.initiateRevenueTargetWorkflow(
        req.body,
        req.user._id
      );

      res.status(201).json({
        success: true,
        data: result.revenueTarget,
        message: result.nextStep
      });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  /**
   * HOS responds to revenue target
   * PUT /api/revenue-targets/:id/respond
   */
  static async hosRespond(req, res) {
    try {
      // Verify user is HOS
      if (req.user.role !== 'head-of-sales') {
        return res.status(403).json({ error: 'Only Head of Sales can respond' });
      }

      const { status, message, strategy } = req.body;

      const result = await SalesIntegrationService.hosWorkflow(
        req.params.id,
        req.user._id,
        { status, message },
        strategy
      );

      res.json({
        success: true,
        data: result.target,
        message: result.nextStep
      });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  /**
   * Get HOS dashboard
   * GET /api/sales/dashboard/hos
   */
  static async getHOSDashboard(req, res) {
    try {
      if (req.user.role !== 'head-of-sales') {
        return res.status(403).json({ error: 'Access denied' });
      }

      const dashboard = await SalesIntegrationService.getHOSDashboard(req.user._id);

      res.json({
        success: true,
        data: dashboard
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
}

// ============================================================================
// STEP 4: Example Controller - Company Target Management
// ============================================================================

class CompanyTargetController {
  /**
   * Sales rep identifies a target company
   * POST /api/company-targets
   */
  static async identifyCompany(req, res) {
    try {
      const result = await SalesIntegrationService.companyIdentificationWorkflow(
        req.body,
        req.user._id
      );

      res.status(201).json({
        success: true,
        data: result.company,
        message: result.nextStep
      });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  /**
   * HOS approves/rejects company
   * PUT /api/company-targets/:id/review
   */
  static async reviewCompany(req, res) {
    try {
      if (req.user.role !== 'head-of-sales') {
        return res.status(403).json({ error: 'Only HOS can review companies' });
      }

      const { approved, notes } = req.body;

      const result = await SalesIntegrationService.companyApprovalWorkflow(
        req.params.id,
        req.user._id,
        approved,
        notes
      );

      res.json({
        success: true,
        data: result.company,
        message: result.nextStep
      });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  /**
   * Get pending approvals for HOS
   * GET /api/company-targets/pending
   */
  static async getPendingApprovals(req, res) {
    try {
      if (req.user.role !== 'head-of-sales') {
        return res.status(403).json({ error: 'Access denied' });
      }

      const companies = await CompanyTargetService.getPendingApprovals(req.user._id);

      res.json({
        success: true,
        count: companies.length,
        data: companies
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
}

// ============================================================================
// STEP 5: Example Controller - Lead Management
// ============================================================================

class LeadController {
  /**
   * Create a new lead
   * POST /api/leads
   */
  static async createLead(req, res) {
    try {
      const result = await SalesIntegrationService.leadLifecycleWorkflow(
        req.body,
        req.user._id
      );

      res.status(201).json({
        success: true,
        data: {
          lead: result.lead,
          outreachTask: result.outreachTask
        },
        message: result.nextStep
      });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  /**
   * Update lead stage
   * PUT /api/leads/:id/stage
   */
  static async updateStage(req, res) {
    try {
      const { stage, notes } = req.body;

      const result = await SalesIntegrationService.progressLead(
        req.params.id,
        stage,
        req.user._id,
        notes
      );

      res.json({
        success: true,
        data: {
          lead: result.lead,
          followUpTask: result.followUpTask
        },
        message: result.nextStep
      });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  /**
   * Add follow-up activity
   * POST /api/leads/:id/follow-ups
   */
  static async addFollowUp(req, res) {
    try {
      const lead = await LeadManagementService.addFollowUp(
        req.params.id,
        req.body,
        req.user._id
      );

      res.json({
        success: true,
        data: lead
      });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  /**
   * Get pipeline summary
   * GET /api/leads/pipeline
   */
  static async getPipeline(req, res) {
    try {
      const salesRepId = req.user.role === 'head-of-sales' ? null : req.user._id;
      const summary = await LeadManagementService.getPipelineSummary(salesRepId);

      res.json({
        success: true,
        data: summary
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * Get sales funnel metrics
   * GET /api/leads/funnel
   */
  static async getFunnelMetrics(req, res) {
    try {
      const { revenueTargetId } = req.query;
      const metrics = await SalesIntegrationService.getSalesFunnelMetrics(revenueTargetId);

      res.json({
        success: true,
        data: metrics
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
}

// ============================================================================
// STEP 6: Example Controller - Sales Tasks
// ============================================================================

class SalesTaskController {
  /**
   * Create a sales task
   * POST /api/sales-tasks
   */
  static async createTask(req, res) {
    try {
      const { recurring, ...taskData } = req.body;

      let task;
      if (recurring) {
        task = await SalesTaskService.createRecurringTask(taskData, req.user._id);
      } else {
        task = await SalesTaskService.createDefaultTask(taskData, req.user._id);
      }

      res.status(201).json({
        success: true,
        data: task
      });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  /**
   * Get tasks for user
   * GET /api/sales-tasks
   */
  static async getTasks(req, res) {
    try {
      const tasks = await SalesTaskService.getTasksForSalesRole(
        req.user._id,
        req.query
      );

      res.json({
        success: true,
        count: tasks.length,
        data: tasks
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * Manually process recurring tasks (for testing)
   * POST /api/sales-tasks/process-recurring
   */
  static async processRecurring(req, res) {
    try {
      // Only allow admins or for testing
      if (req.user.role !== 'ceo' && req.user.role !== 'co-founder') {
        return res.status(403).json({ error: 'Access denied' });
      }

      const results = await RecurringTaskScheduler.processNow();

      res.json({
        success: true,
        data: results,
        summary: {
          success: results.filter(r => r.success).length,
          failed: results.filter(r => !r.success).length
        }
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
}

// ============================================================================
// STEP 7: Example Routes Definition
// ============================================================================

/**
 * Add these to your Express router:
 * 
 * const express = require('express');
 * const router = express.Router();
 * const auth = require('../middleware/auth'); // Your auth middleware
 * 
 * // Revenue Targets
 * router.post('/revenue-targets', auth, RevenueTargetController.createTarget);
 * router.put('/revenue-targets/:id/respond', auth, RevenueTargetController.hosRespond);
 * router.get('/sales/dashboard/hos', auth, RevenueTargetController.getHOSDashboard);
 * 
 * // Company Targets
 * router.post('/company-targets', auth, CompanyTargetController.identifyCompany);
 * router.put('/company-targets/:id/review', auth, CompanyTargetController.reviewCompany);
 * router.get('/company-targets/pending', auth, CompanyTargetController.getPendingApprovals);
 * 
 * // Leads
 * router.post('/leads', auth, LeadController.createLead);
 * router.put('/leads/:id/stage', auth, LeadController.updateStage);
 * router.post('/leads/:id/follow-ups', auth, LeadController.addFollowUp);
 * router.get('/leads/pipeline', auth, LeadController.getPipeline);
 * router.get('/leads/funnel', auth, LeadController.getFunnelMetrics);
 * 
 * // Sales Tasks
 * router.post('/sales-tasks', auth, SalesTaskController.createTask);
 * router.get('/sales-tasks', auth, SalesTaskController.getTasks);
 * router.post('/sales-tasks/process-recurring', auth, SalesTaskController.processRecurring);
 * 
 * module.exports = router;
 */

// ============================================================================
// STEP 8: Complete Workflow Example
// ============================================================================

async function completeWorkflowExample() {
  try {
    console.log('Starting complete sales workflow example...\n');

    // Assuming we have these user IDs
    const coFounderId = 'co-founder-user-id';
    const hosId = 'hos-user-id';
    const salesRepId = 'sales-rep-user-id';

    // 1. Co-Founder creates revenue target
    console.log('Step 1: Co-Founder creates revenue target');
    const targetResult = await SalesIntegrationService.initiateRevenueTargetWorkflow({
      assignedTo: hosId,
      targetPeriod: 'quarterly',
      startDate: new Date('2025-01-01'),
      endDate: new Date('2025-03-31'),
      targetAmount: 10000000,
      currency: 'INR',
      notes: 'Q1 2025 target - focus on tech companies'
    }, coFounderId);
    console.log(`✓ Target created: ${targetResult.revenueTarget._id}\n`);

    // 2. HOS responds and proposes strategy
    console.log('Step 2: HOS responds to target');
    const hosResult = await SalesIntegrationService.hosWorkflow(
      targetResult.revenueTarget._id,
      hosId,
      { status: 'accepted', message: 'Target accepted' },
      {
        targetLocations: [
          { location: 'Bangalore', targetAmount: 6000000, reasoning: 'Strong tech ecosystem' },
          { location: 'Mumbai', targetAmount: 4000000, reasoning: 'Financial services market' }
        ],
        expectedCompanies: 50,
        expectedLeads: 200
      }
    );
    console.log('✓ HOS accepted and proposed strategy\n');

    // 3. Co-Founder approves strategy
    console.log('Step 3: Co-Founder approves strategy');
    await RevenueTargetService.reviewStrategy(
      targetResult.revenueTarget._id,
      coFounderId,
      true,
      'Strategy approved. Proceed with execution.'
    );
    console.log('✓ Strategy approved\n');

    // 4. Sales rep identifies target company
    console.log('Step 4: Sales rep identifies target company');
    const companyResult = await SalesIntegrationService.companyIdentificationWorkflow({
      companyName: 'Tech Innovations Pvt Ltd',
      industry: 'Technology',
      website: 'https://techinnovations.com',
      location: { city: 'Bangalore', state: 'Karnataka', country: 'India' },
      employeeCount: '201-500',
      revenue: '10-50Cr',
      potentialValue: 800000,
      priority: 'high',
      revenueTargetId: targetResult.revenueTarget._id,
      research: {
        keyDecisionMakers: 'CTO (Rajesh Kumar), CEO (Priya Sharma)',
        painPoints: 'Manual HR processes, lack of automation',
        competitors: 'Currently using spreadsheets and basic tools',
        budget: 'Estimated 5-10L annually',
        timeline: 'Looking to implement in Q1 2025'
      },
      studyDocuments: [{
        name: 'Market Analysis - Tech Innovations',
        documentType: 'market-analysis',
        url: 'https://drive.google.com/file/d/xxx',
        description: 'Detailed market and competitive analysis'
      }]
    }, salesRepId);
    console.log(`✓ Company identified: ${companyResult.company._id}\n`);

    // 5. HOS approves company
    console.log('Step 5: HOS reviews and approves company');
    await SalesIntegrationService.companyApprovalWorkflow(
      companyResult.company._id,
      hosId,
      true,
      'Good research. Approved for pursuit.'
    );
    console.log('✓ Company approved\n');

    // 6. Sales rep adds lead
    console.log('Step 6: Sales rep creates lead');
    const leadResult = await SalesIntegrationService.leadLifecycleWorkflow({
      companyId: companyResult.company._id,
      companyName: 'Tech Innovations Pvt Ltd',
      name: 'Rajesh Kumar',
      designation: 'CTO',
      department: 'Technology',
      email: 'rajesh@techinnovations.com',
      phone: '+91-9876543210',
      authorityLevel: 'decision-maker',
      decisionPower: 'high',
      potentialValue: 800000,
      serviceInterest: 'HR Management System',
      assignedTo: salesRepId
    }, salesRepId);
    console.log(`✓ Lead created: ${leadResult.lead._id}`);
    console.log(`✓ Outreach task created: ${leadResult.outreachTask._id}\n`);

    // 7. Progress lead through stages
    console.log('Step 7: Progress lead through sales stages');
    
    // Qualified
    const qualified = await SalesIntegrationService.progressLead(
      leadResult.lead._id,
      'qualified',
      salesRepId,
      'Had initial call. Strong interest in automation.'
    );
    console.log(`✓ Lead qualified. Task created: ${qualified.followUpTask?._id}`);

    // Add follow-up
    await LeadManagementService.addFollowUp(leadResult.lead._id, {
      type: 'call',
      notes: 'Discovery call completed. Discussed pain points and requirements.',
      outcome: 'Very positive. They want a demo.',
      nextAction: 'Schedule demo for next week'
    }, salesRepId);

    // Proposal stage
    const proposal = await SalesIntegrationService.progressLead(
      leadResult.lead._id,
      'proposal',
      salesRepId,
      'Demo completed successfully. Sending proposal.'
    );
    console.log(`✓ Moved to proposal. Task created: ${proposal.followUpTask?._id}`);

    // Negotiation
    const negotiation = await SalesIntegrationService.progressLead(
      leadResult.lead._id,
      'negotiation',
      salesRepId,
      'Proposal sent. In negotiation phase.'
    );
    console.log(`✓ In negotiation. Task created: ${negotiation.followUpTask?._id}`);

    // Close won
    const won = await SalesIntegrationService.progressLead(
      leadResult.lead._id,
      'closedWon',
      salesRepId,
      'Deal closed! Contract signed.'
    );
    console.log(`✓ Deal WON! Revenue updated.\n`);

    // 8. Check dashboard
    console.log('Step 8: Check dashboards');
    const hosDashboard = await SalesIntegrationService.getHOSDashboard(hosId);
    console.log(`✓ HOS Dashboard:
      - Active Targets: ${hosDashboard.revenueTargets.length}
      - Total Target: ${SalesHelpers.formatCurrency(hosDashboard.summary.totalTargetAmount)}
      - Achieved: ${SalesHelpers.formatCurrency(hosDashboard.summary.totalAchievedAmount)}
      - Progress: ${hosDashboard.summary.overallProgress}%
      - Pending Approvals: ${hosDashboard.pendingApprovals}
    `);

    const repDashboard = await SalesIntegrationService.getSalesRepDashboard(salesRepId);
    console.log(`✓ Sales Rep Dashboard:
      - Companies: ${repDashboard.companies}
      - Leads: ${repDashboard.leads}
      - Active Leads: ${repDashboard.summary.activeLeads}
      - Total Potential: ${SalesHelpers.formatCurrency(repDashboard.summary.totalPotentialValue)}
    `);

    console.log('\n✓ Complete workflow executed successfully!');

  } catch (error) {
    console.error('Error in workflow:', error.message);
  }
}

// ============================================================================
// STEP 9: Middleware Example - Role-Based Access
// ============================================================================

function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ 
        error: `Access denied. Required role: ${roles.join(' or ')}` 
      });
    }

    next();
  };
}

/**
 * Usage:
 * router.post('/revenue-targets', auth, requireRole('co-founder'), RevenueTargetController.createTarget);
 * router.put('/company-targets/:id/review', auth, requireRole('head-of-sales'), CompanyTargetController.reviewCompany);
 */

// ============================================================================
// EXPORTS
// ============================================================================

module.exports = {
  RevenueTargetController,
  CompanyTargetController,
  LeadController,
  SalesTaskController,
  completeWorkflowExample,
  requireRole
};
