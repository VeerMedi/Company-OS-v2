const Lead = require('../models/Lead');
const Company = require('../models/Company');
const User = require('../models/User');
const RevenueTarget = require('../models/RevenueTarget');

class LeadManagementService {
  /**
   * Create a new lead (authority/decision maker)
   */
  static async createLead(leadData, createdBy) {
    // Verify company exists
    const company = await Company.findById(leadData.companyId);
    if (!company) {
      throw new Error('Company not found');
    }

    // Verify assignee
    const assignee = await User.findById(leadData.assignedTo);
    if (!assignee) {
      throw new Error('Assigned user not found');
    }

    const lead = new Lead({
      company: leadData.companyId,
      name: leadData.name,
      designation: leadData.designation,
      department: leadData.department,
      email: leadData.email,
      phone: leadData.phone,
      linkedIn: leadData.linkedIn,
      authorityLevel: leadData.authorityLevel || 'influencer',
      decisionPower: leadData.decisionPower || 'medium',
      stage: 'lead',
      status: 'active',
      potentialValue: leadData.potentialValue || 0,
      probability: leadData.probability || 50,
      serviceInterest: leadData.serviceInterest,
      requirements: leadData.requirements,
      assignedTo: leadData.assignedTo,
      firstContactDate: new Date(),
      expectedCloseDate: leadData.expectedCloseDate
    });

    // Initialize stage history
    lead.stageHistory.push({
      stage: 'lead',
      enteredAt: new Date(),
      updatedBy: createdBy,
      notes: 'Lead created'
    });

    // Add activity
    lead.activities.push({
      action: 'created',
      description: `Lead created for ${leadData.name}`,
      performedBy: createdBy,
      timestamp: new Date()
    });

    await lead.save();

    // Update company's authority count
    await company.updateAuthorityCount();

    return lead;
  }

  /**
   * Move lead to next stage
   */
  static async updateLeadStage(leadId, newStage, updatedBy, notes) {
    const lead = await Lead.findById(leadId);
    if (!lead) {
      throw new Error('Lead not found');
    }

    const validStages = ['lead', 'qualified', 'proposal', 'negotiation', 'closedWon', 'closedLost'];
    if (!validStages.includes(newStage)) {
      throw new Error(`Invalid stage. Must be one of: ${validStages.join(', ')}`);
    }

    const oldStage = lead.stage;
    lead.stage = newStage;

    // Update stage history
    lead.stageHistory.push({
      stage: newStage,
      enteredAt: new Date(),
      updatedBy,
      notes: notes || `Moved from ${oldStage} to ${newStage}`
    });

    // Update status based on stage
    if (newStage === 'closedWon') {
      lead.status = 'won';
      lead.actualCloseDate = new Date();
      lead.actualValue = lead.potentialValue;
    } else if (newStage === 'closedLost') {
      lead.status = 'lost';
      lead.actualCloseDate = new Date();
    } else {
      lead.status = 'active';
    }

    // Add activity
    lead.activities.push({
      action: 'stage_updated',
      description: `Stage changed from ${oldStage} to ${newStage}`,
      performedBy: updatedBy,
      timestamp: new Date()
    });

    await lead.save();

    // If deal won, update revenue target
    if (newStage === 'closedWon' && lead.actualValue > 0) {
      await this.updateRevenueTargetOnWin(lead);
    }

    return lead;
  }

  /**
   * Update revenue target when deal is won
   */
  static async updateRevenueTargetOnWin(lead) {
    const company = await Company.findById(lead.company).populate('revenueTarget');
    if (company && company.revenueTarget) {
      const RevenueTargetService = require('./RevenueTargetService');
      await RevenueTargetService.updateAchievedAmount(
        company.revenueTarget._id,
        lead.actualValue
      );
    }
  }

  /**
   * Add follow-up activity
   */
  static async addFollowUp(leadId, followUpData, createdBy) {
    const lead = await Lead.findById(leadId);
    if (!lead) {
      throw new Error('Lead not found');
    }

    lead.followUps.push({
      date: followUpData.date || new Date(),
      type: followUpData.type,
      notes: followUpData.notes,
      outcome: followUpData.outcome,
      nextAction: followUpData.nextAction,
      createdBy,
      createdAt: new Date()
    });

    lead.lastContactDate = new Date();

    // Add activity
    lead.activities.push({
      action: 'follow_up',
      description: `Follow-up added: ${followUpData.type}`,
      performedBy: createdBy,
      timestamp: new Date()
    });

    await lead.save();
    return lead;
  }

  /**
   * Schedule meeting
   */
  static async scheduleMeeting(leadId, meetingData, scheduledBy) {
    const lead = await Lead.findById(leadId);
    if (!lead) {
      throw new Error('Lead not found');
    }

    lead.meetings.push({
      scheduledDate: meetingData.scheduledDate,
      duration: meetingData.duration,
      type: meetingData.type,
      attendees: meetingData.attendees || [],
      agenda: meetingData.agenda,
      notes: meetingData.notes,
      status: 'scheduled'
    });

    // Add activity
    lead.activities.push({
      action: 'meeting_scheduled',
      description: `${meetingData.type} meeting scheduled`,
      performedBy: scheduledBy,
      timestamp: new Date()
    });

    await lead.save();
    return lead;
  }

  /**
   * Update meeting outcome
   */
  static async updateMeetingOutcome(leadId, meetingIndex, outcome, updatedBy) {
    const lead = await Lead.findById(leadId);
    if (!lead) {
      throw new Error('Lead not found');
    }

    if (!lead.meetings[meetingIndex]) {
      throw new Error('Meeting not found');
    }

    lead.meetings[meetingIndex].outcome = outcome.notes;
    lead.meetings[meetingIndex].status = outcome.status || 'completed';
    lead.lastContactDate = new Date();

    // Add activity
    lead.activities.push({
      action: 'meeting_completed',
      description: 'Meeting outcome updated',
      performedBy: updatedBy,
      timestamp: new Date()
    });

    await lead.save();
    return lead;
  }

  /**
   * Attach document to lead
   */
  static async attachDocument(leadId, documentData, uploadedBy) {
    const lead = await Lead.findById(leadId);
    if (!lead) {
      throw new Error('Lead not found');
    }

    lead.documents.push({
      name: documentData.name,
      type: documentData.type,
      url: documentData.url,
      uploadedBy,
      uploadedAt: new Date()
    });

    // Add activity
    lead.activities.push({
      action: 'document_attached',
      description: `Document attached: ${documentData.name}`,
      performedBy: uploadedBy,
      timestamp: new Date()
    });

    await lead.save();
    return lead;
  }

  /**
   * Update lead value and probability
   */
  static async updateDealMetrics(leadId, metrics, updatedBy) {
    const lead = await Lead.findById(leadId);
    if (!lead) {
      throw new Error('Lead not found');
    }

    if (metrics.potentialValue !== undefined) {
      lead.potentialValue = metrics.potentialValue;
    }
    if (metrics.probability !== undefined) {
      lead.probability = Math.min(Math.max(metrics.probability, 0), 100);
    }
    if (metrics.expectedCloseDate !== undefined) {
      lead.expectedCloseDate = metrics.expectedCloseDate;
    }

    // Add activity
    lead.activities.push({
      action: 'metrics_updated',
      description: 'Deal metrics updated',
      performedBy: updatedBy,
      timestamp: new Date()
    });

    await lead.save();
    return lead;
  }

  /**
   * Get leads by stage
   */
  static async getLeadsByStage(stage, filters = {}) {
    const query = {
      stage,
      isDeleted: false,
      ...filters
    };

    const leads = await Lead.find(query)
      .populate('company', 'companyName industry location')
      .populate('assignedTo', 'firstName lastName email')
      .sort({ expectedCloseDate: 1 });

    return leads;
  }

  /**
   * Get leads assigned to sales rep
   */
  static async getLeadsBySalesRep(salesRepId, filters = {}) {
    const query = {
      assignedTo: salesRepId,
      isDeleted: false,
      ...filters
    };

    const leads = await Lead.find(query)
      .populate('company', 'companyName industry location')
      .populate('assignedTo', 'firstName lastName email')
      .sort({ expectedCloseDate: 1 });

    return leads;
  }

  /**
   * Get leads by company
   */
  static async getLeadsByCompany(companyId) {
    const leads = await Lead.find({
      company: companyId,
      isDeleted: false
    })
      .populate('assignedTo', 'firstName lastName email')
      .sort({ createdAt: -1 });

    return leads;
  }

  /**
   * Get pipeline summary
   */
  static async getPipelineSummary(salesRepId = null) {
    const matchQuery = { isDeleted: false };
    if (salesRepId) {
      matchQuery.assignedTo = salesRepId;
    }

    const summary = await Lead.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: '$stage',
          count: { $sum: 1 },
          totalValue: { $sum: '$potentialValue' },
          avgProbability: { $avg: '$probability' }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    return summary;
  }

  /**
   * Reassign lead to different sales rep
   */
  static async reassignLead(leadId, newSalesRepId, reassignedBy) {
    const lead = await Lead.findById(leadId);
    if (!lead) {
      throw new Error('Lead not found');
    }

    const newRep = await User.findById(newSalesRepId);
    if (!newRep) {
      throw new Error('Sales rep not found');
    }

    const oldRep = lead.assignedTo;
    lead.assignedTo = newSalesRepId;

    // Add activity
    lead.activities.push({
      action: 'reassigned',
      description: `Lead reassigned to ${newRep.firstName} ${newRep.lastName}`,
      performedBy: reassignedBy,
      timestamp: new Date()
    });

    await lead.save();
    return lead;
  }
}

module.exports = LeadManagementService;
