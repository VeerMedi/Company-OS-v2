const Lead = require('../models/Lead');
const Company = require('../models/Company');
const Task = require('../models/Task');
const RevenueTarget = require('../models/RevenueTarget');
const SalesTarget = require('../models/SalesTarget');
const User = require('../models/User');
const NotificationService = require('../services/NotificationService');

// ============ SALES TEAM SECTION ============

// Create Lead (Sales Team adds lead for approved company)
exports.createLead = async (req, res) => {
  try {
    const {
      company,
      name,
      designation,
      department,
      email,
      phone,
      linkedIn,
      authorityLevel,
      decisionPower,
      potentialValue,
      serviceInterest,
      requirements,
      expectedCloseDate,
      assignedTo // HOS can assign to specific user
    } = req.body;

    // Verify company exists and is approved
    const companyDoc = await Company.findById(company);
    if (!companyDoc) {
      return res.status(404).json({ message: 'Company not found' });
    }

    if (companyDoc.approvalStatus !== 'approved') {
      return res.status(400).json({ 
        message: 'Cannot create leads for unapproved company. Company must be approved by HOS first.',
        companyStatus: companyDoc.approvalStatus
      });
    }

    // Check if lead already exists (by name and company combination)
    const existingLead = await Lead.findOne({
      company,
      name: name,
      isDeleted: false
    });

    if (existingLead) {
      return res.status(400).json({ 
        message: 'Lead with this name already exists for this company',
        existingLead: {
          id: existingLead._id,
          name: existingLead.name,
          email: existingLead.email,
          stage: existingLead.stage
        }
      });
    }

    // Additionally check email if provided to prevent email duplicates
    if (email) {
      const existingEmailLead = await Lead.findOne({
        company,
        email: email?.toLowerCase(),
        isDeleted: false
      });

      if (existingEmailLead) {
        return res.status(400).json({ 
          message: 'Lead with this email already exists for this company',
          existingLead: {
            id: existingEmailLead._id,
            name: existingEmailLead.name,
            email: existingEmailLead.email,
            stage: existingEmailLead.stage
          }
        });
      }
    }

    // Determine who the lead should be assigned to
    // If HOS provides assignedTo, use that; otherwise assign to current user
    const assignToUser = (req.user.role === 'head-of-sales' && assignedTo) 
      ? assignedTo 
      : req.user.id;

    const lead = new Lead({
      company,
      name,
      designation,
      department,
      email: email?.toLowerCase(),
      phone,
      linkedIn,
      authorityLevel: authorityLevel || 'influencer',
      decisionPower: decisionPower || 'medium',
      stage: 'lead',
      status: 'active',
      potentialValue: potentialValue || 0,
      probability: 50,
      serviceInterest,
      requirements,
      expectedCloseDate,
      assignedTo: assignToUser,
      firstContactDate: Date.now(),
      lastContactDate: Date.now(),
      stageHistory: [{
        stage: 'lead',
        enteredAt: Date.now(),
        updatedBy: req.user.id,
        notes: req.user.role === 'head-of-sales' ? 'Lead added by HOS' : 'Initial lead entry'
      }]
    });

    await lead.save();
    await lead.populate('company assignedTo', 'companyName name email firstName lastName');

    // Update company authority count
    companyDoc.authorityCount = await Lead.countDocuments({ 
      company: company, 
      isDeleted: false 
    });
    companyDoc.activities.push({
      action: 'Lead Added',
      description: `New lead ${name} (${designation}) added${req.user.role === 'head-of-sales' ? ' by HOS' : ''}`,
      performedBy: req.user.id
    });
    await companyDoc.save();

    // Update the sales target for the assigned sales rep
    const salesRepId = assignToUser;
    const activeTarget = await SalesTarget.findOne({
      userId: salesRepId,
      status: 'active',
      startDate: { $lte: new Date() },
      endDate: { $gte: new Date() }
    });

    if (activeTarget) {
      // Increment leads achieved
      activeTarget.leadsAchieved = (activeTarget.leadsAchieved || 0) + 1;
      
      // Update progress percentage
      const totalProgress = (
        (activeTarget.revenueAchieved / activeTarget.revenueTarget) * 0.4 +
        (activeTarget.companiesAchieved / activeTarget.companiesTarget) * 0.2 +
        (activeTarget.leadsAchieved / activeTarget.leadsTarget) * 0.2 +
        (activeTarget.conversionsAchieved / activeTarget.conversionsTarget) * 0.2
      ) * 100;
      
      activeTarget.progressPercentage = Math.round(totalProgress);
      
      await activeTarget.save();
      console.log(`✅ Updated sales target for user ${salesRepId}: ${activeTarget.leadsAchieved}/${activeTarget.leadsTarget} leads`);
    }

    // TODO: Create notification for assigned user if HOS assigned it

    res.status(201).json({
      success: true,
      message: 'Lead created successfully',
      data: lead
    });
  } catch (error) {
    console.error('Create lead error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Add Follow-up
exports.addFollowUp = async (req, res) => {
  try {
    const { leadId } = req.params;
    const { 
      contactMethod,
      scheduledDate,
      scheduledTime,
      summary,
      messageSent,
      conclusion,
      nextStep,
      nextFollowUpDate,
      // Legacy fields
      date, 
      type, 
      notes, 
      outcome, 
      nextAction 
    } = req.body;

    const lead = await Lead.findById(leadId);
      
    if (!lead) {
      return res.status(404).json({ message: 'Lead not found' });
    }

    // Verify access
    const assignedToId = lead.assignedTo._id ? lead.assignedTo._id.toString() : lead.assignedTo.toString();
    if (assignedToId !== req.user.id && req.user.role !== 'head-of-sales') {
      return res.status(403).json({ message: 'Not authorized to update this lead' });
    }

    // Create follow-up object with new fields
    const followUp = {
      contactMethod: contactMethod || type || 'other',
      scheduledDate: scheduledDate || date || Date.now(),
      scheduledTime: scheduledTime || '00:00',
      summary: summary || notes || '',
      messageSent,
      conclusion: conclusion || outcome,
      nextStep: nextStep || nextAction,
      nextFollowUpDate,
      evidenceRequired: true,
      evidenceSubmitted: false,
      status: 'pending',
      createdBy: req.user.id,
      createdAt: Date.now(),
      // Legacy fields for backward compatibility
      date: scheduledDate || date || Date.now(),
      type: contactMethod || type || 'other',
      notes: summary || notes,
      outcome: conclusion || outcome,
      nextAction: nextStep || nextAction
    };

    lead.followUps.push(followUp);
    lead.lastContactDate = Date.now();

    await lead.save();
    
    // Populate for response and email
    const populatedLead = await Lead.findById(leadId)
      .populate('company', 'companyName')
      .populate('assignedTo', 'firstName lastName email');

    // Send email notification to HOS
    try {
      const emailService = require('../utils/emailService');
      
      // Get HOS user
      const hos = await User.findOne({ role: 'head-of-sales' });
      
      if (hos && hos.email && populatedLead.company && populatedLead.assignedTo) {
        // Send email to HOS
        await emailService.sendFollowUpAddedNotification({
          hosEmail: hos.email,
          hosName: `${hos.firstName} ${hos.lastName}`,
          salesRepName: `${populatedLead.assignedTo.firstName} ${populatedLead.assignedTo.lastName}`,
          leadName: populatedLead.name,
          companyName: populatedLead.company.companyName,
          contactMethod: contactMethod || type || 'other',
          scheduledDate: scheduledDate || date,
          scheduledTime: scheduledTime || '00:00',
          summary: summary || notes,
          nextStep: nextStep || nextAction,
          leadId: populatedLead._id
        });

        // Create in-app notification for HOS
        await NotificationService.notifyFollowUpAdded(
          populatedLead,
          lead.followUps[lead.followUps.length - 1],
          req.user
        );

        // Send reminder email to sales rep about next steps
        if (populatedLead.assignedTo.email) {
          const reminderMessage = nextStep || nextAction 
            ? `Remember: ${nextStep || nextAction}` 
            : 'Remember to submit evidence after completing this follow-up';

          // Schedule reminder for 1 day before scheduled date if applicable
          const scheduledDateTime = new Date(scheduledDate || date);
          const oneDayBefore = new Date(scheduledDateTime.getTime() - 24 * 60 * 60 * 1000);
          const now = new Date();

          if (oneDayBefore > now) {
            // Will be sent by scheduled job
            console.log(`Scheduled reminder will be sent on ${oneDayBefore.toLocaleDateString()}`);
          }

          // Send immediate reminder about evidence requirement
          setTimeout(async () => {
            try {
              await emailService.sendFollowUpEvidencePendingReminder({
                salesRepEmail: populatedLead.assignedTo.email,
                salesRepName: `${populatedLead.assignedTo.firstName} ${populatedLead.assignedTo.lastName}`,
                leadName: populatedLead.name,
                companyName: populatedLead.company.companyName,
                contactMethod: contactMethod || type || 'other',
                scheduledDate: scheduledDate || date,
                daysSinceFollowUp: 0,
                leadId: populatedLead._id,
                followUpId: lead.followUps[lead.followUps.length - 1]._id
              });
            } catch (err) {
              console.error('Error sending sales rep reminder:', err);
            }
          }, 5000); // Send after 5 seconds
        }
      }
    } catch (emailError) {
      console.error('Error sending follow-up notification email:', emailError);
      // Don't fail the request if email fails
    }

    res.json({
      success: true,
      message: 'Follow-up added successfully. Please submit evidence after completion.',
      data: populatedLead
    });
  } catch (error) {
    console.error('Add follow-up error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Submit Follow-up Evidence
exports.submitFollowUpEvidence = async (req, res) => {
  try {
    const { leadId, followUpId } = req.params;
    const { evidenceNotes } = req.body;

    const lead = await Lead.findById(leadId);
      
    if (!lead) {
      return res.status(404).json({ message: 'Lead not found' });
    }

    // Verify access
    const assignedToId = lead.assignedTo._id ? lead.assignedTo._id.toString() : lead.assignedTo.toString();
    if (assignedToId !== req.user.id && req.user.role !== 'head-of-sales') {
      return res.status(403).json({ message: 'Not authorized to update this lead' });
    }

    // Find the follow-up
    const followUp = lead.followUps.id(followUpId);
    if (!followUp) {
      return res.status(404).json({ message: 'Follow-up not found' });
    }

    // Check if evidence already submitted
    if (followUp.evidenceSubmitted) {
      return res.status(400).json({ message: 'Evidence already submitted for this follow-up' });
    }

    // Handle file uploads
    const evidenceFiles = [];
    if (req.files && req.files.length > 0) {
      req.files.forEach(file => {
        evidenceFiles.push({
          filename: file.filename,
          originalName: file.originalname,
          path: file.path,
          uploadedAt: Date.now()
        });
      });
    }

    // Update follow-up with evidence
    followUp.evidenceSubmitted = true;
    followUp.evidenceFiles = evidenceFiles;
    followUp.evidenceNotes = evidenceNotes;
    followUp.completedAt = Date.now();
    followUp.status = 'completed';

    await lead.save();

    // Populate for email
    const populatedLead = await Lead.findById(leadId)
      .populate('company', 'companyName')
      .populate('assignedTo', 'firstName lastName email');

    // Send notifications to HOS
    try {
      // Get HOS user
      const hos = await User.findOne({ role: 'head-of-sales' });
      
      if (hos && populatedLead.company && populatedLead.assignedTo) {
        // Send in-app notification
        await NotificationService.notifyFollowUpEvidenceSubmitted(
          hos._id.toString(),
          populatedLead._id.toString(),
          followUp._id.toString(),
          populatedLead.name,
          populatedLead.company.companyName,
          `${populatedLead.assignedTo.firstName} ${populatedLead.assignedTo.lastName}`,
          evidenceFiles.length,
          evidenceNotes
        );

        // Send email notification
        if (hos.email) {
          const emailService = require('../utils/emailService');
          await emailService.sendFollowUpEvidenceSubmittedNotification({
            hosEmail: hos.email,
            hosName: `${hos.firstName} ${hos.lastName}`,
            salesRepName: `${populatedLead.assignedTo.firstName} ${populatedLead.assignedTo.lastName}`,
            leadName: populatedLead.name,
            companyName: populatedLead.company.companyName,
            contactMethod: followUp.contactMethod,
            scheduledDate: followUp.scheduledDate,
            summary: followUp.summary,
            conclusion: followUp.conclusion,
            evidenceCount: evidenceFiles.length,
            evidenceNotes,
            leadId: populatedLead._id,
            followUpId: followUp._id
          });
        }
      }
    } catch (notificationError) {
      console.error('Error sending evidence notifications:', notificationError);
      // Don't fail the request if notifications fail
    }

    res.json({
      success: true,
      message: 'Follow-up evidence submitted successfully',
      data: populatedLead
    });
  } catch (error) {
    console.error('Submit follow-up evidence error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Update Lead Stage
exports.updateLeadStage = async (req, res) => {
  try {
    const { leadId } = req.params;
    const { stage, notes, actualValue } = req.body;

    const validStages = ['lead', 'qualified', 'proposal', 'negotiation', 'closedWon', 'closedLost'];
    if (!validStages.includes(stage)) {
      return res.status(400).json({ 
        message: 'Invalid stage',
        validStages 
      });
    }

    const lead = await Lead.findById(leadId);
    if (!lead) {
      return res.status(404).json({ message: 'Lead not found' });
    }

    // Verify access
    if (lead.assignedTo.toString() !== req.user.id && 
        req.user.role !== 'head-of-sales') {
      return res.status(403).json({ message: 'Not authorized to update this lead' });
    }

    const previousStage = lead.stage;
    lead.stage = stage;

    // Add to stage history
    lead.stageHistory.push({
      stage,
      enteredAt: Date.now(),
      updatedBy: req.user.id,
      notes: notes || `Moved from ${previousStage} to ${stage}`
    });

    // Update probability based on stage
    const stageProbabilities = {
      lead: 10,
      qualified: 25,
      proposal: 50,
      negotiation: 75,
      closedWon: 100,
      closedLost: 0
    };
    lead.probability = stageProbabilities[stage];

    // Handle closed stages
    if (stage === 'closedWon') {
      lead.status = 'won';
      lead.actualCloseDate = Date.now();
      if (actualValue !== undefined) {
        lead.actualValue = actualValue;
      }

      // Update revenue target achievement
      const company = await Company.findById(lead.company);
      if (company && company.revenueTarget) {
        const target = await RevenueTarget.findById(company.revenueTarget);
        if (target) {
          target.achievedAmount += lead.actualValue || lead.potentialValue || 0;
          target.activities.push({
            action: 'Deal Closed',
            description: `${lead.name} - ${company.companyName}: ${lead.actualValue || lead.potentialValue}`,
            performedBy: req.user.id
          });
          await target.save();
        }
      }

      // Update sales target for conversions and revenue
      const salesRepId = lead.assignedTo.toString();
      const activeTarget = await SalesTarget.findOne({
        userId: salesRepId,
        status: 'active',
        startDate: { $lte: new Date() },
        endDate: { $gte: new Date() }
      });

      if (activeTarget) {
        // Increment conversions achieved
        activeTarget.conversionsAchieved = (activeTarget.conversionsAchieved || 0) + 1;
        
        // Add to revenue achieved
        activeTarget.revenueAchieved = (activeTarget.revenueAchieved || 0) + (lead.actualValue || lead.potentialValue || 0);
        
        // Update progress percentage
        const totalProgress = (
          (activeTarget.revenueAchieved / activeTarget.revenueTarget) * 0.4 +
          (activeTarget.companiesAchieved / activeTarget.companiesTarget) * 0.2 +
          (activeTarget.leadsAchieved / activeTarget.leadsTarget) * 0.2 +
          (activeTarget.conversionsAchieved / activeTarget.conversionsTarget) * 0.2
        ) * 100;
        
        activeTarget.progressPercentage = Math.round(totalProgress);
        
        await activeTarget.save();
        console.log(`✅ Updated sales target for user ${salesRepId}: ${activeTarget.conversionsAchieved}/${activeTarget.conversionsTarget} conversions, ₹${activeTarget.revenueAchieved}/${activeTarget.revenueTarget} revenue`);
      }
    } else if (stage === 'closedLost') {
      lead.status = 'lost';
      lead.actualCloseDate = Date.now();
    } else {
      lead.status = 'active';
    }

    lead.lastContactDate = Date.now();

    await lead.save();
    await lead.populate('company assignedTo', 'companyName firstName lastName email');

    // TODO: Send notification on stage change

    res.json({
      success: true,
      message: `Lead moved to ${stage}`,
      data: lead
    });
  } catch (error) {
    console.error('Update lead stage error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get My Leads
exports.getMyLeads = async (req, res) => {
  try {
    const { stage, status, company } = req.query;
    const filter = {
      assignedTo: req.user.id,
      isDeleted: false
    };

    if (stage) filter.stage = stage;
    if (status) filter.status = status;
    if (company) filter.company = company;

    const leads = await Lead.find(filter)
      .populate('company', 'companyName industry location priority')
      .populate('assignedTo', 'firstName lastName email')
      .sort({ lastContactDate: -1 });

    // Calculate stats
    const stats = {
      total: leads.length,
      byStage: {
        lead: leads.filter(l => l.stage === 'lead').length,
        qualified: leads.filter(l => l.stage === 'qualified').length,
        proposal: leads.filter(l => l.stage === 'proposal').length,
        negotiation: leads.filter(l => l.stage === 'negotiation').length,
        closedWon: leads.filter(l => l.stage === 'closedWon').length,
        closedLost: leads.filter(l => l.stage === 'closedLost').length
      },
      totalValue: leads.reduce((sum, l) => sum + (l.potentialValue || 0), 0),
      wonValue: leads.filter(l => l.stage === 'closedWon')
        .reduce((sum, l) => sum + (l.actualValue || 0), 0),
      conversionRate: leads.length > 0 
        ? ((leads.filter(l => l.stage === 'closedWon').length / leads.length) * 100).toFixed(1)
        : 0
    };

    res.json({
      success: true,
      count: leads.length,
      stats,
      data: leads
    });
  } catch (error) {
    console.error('Get my leads error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Update Lead Information
exports.updateLead = async (req, res) => {
  try {
    const { leadId } = req.params;
    const updates = req.body;

    const lead = await Lead.findById(leadId);
    if (!lead) {
      return res.status(404).json({ message: 'Lead not found' });
    }

    // Verify access
    if (lead.assignedTo.toString() !== req.user.id && 
        req.user.role !== 'head-of-sales') {
      return res.status(403).json({ message: 'Not authorized to update this lead' });
    }

    // Update allowed fields
    const allowedUpdates = [
      'name', 'designation', 'department', 'email', 'phone', 'linkedIn',
      'authorityLevel', 'decisionPower', 'potentialValue', 'serviceInterest',
      'requirements', 'expectedCloseDate', 'probability'
    ];

    Object.keys(updates).forEach(key => {
      if (allowedUpdates.includes(key)) {
        lead[key] = updates[key];
      }
    });

    await lead.save();
    await lead.populate('company assignedTo', 'companyName name email');

    res.json({
      success: true,
      message: 'Lead updated successfully',
      data: lead
    });
  } catch (error) {
    console.error('Update lead error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// ============ HEAD OF SALES SECTION ============

// Get All Leads (HOS view)
exports.getAllLeads = async (req, res) => {
  try {
    const { stage, status, company, assignedTo } = req.query;
    const filter = { isDeleted: false };

    if (stage) filter.stage = stage;
    if (status) filter.status = status;
    if (company) filter.company = company;
    if (assignedTo) filter.assignedTo = assignedTo;

    const leads = await Lead.find(filter)
      .populate('company', 'companyName industry location priority potentialValue')
      .populate('assignedTo', 'firstName lastName email employeeId role')
      .sort({ lastContactDate: -1 });

    // Pipeline stats
    const stats = {
      total: leads.length,
      byStage: {
        lead: leads.filter(l => l.stage === 'lead').length,
        qualified: leads.filter(l => l.stage === 'qualified').length,
        proposal: leads.filter(l => l.stage === 'proposal').length,
        negotiation: leads.filter(l => l.stage === 'negotiation').length,
        closedWon: leads.filter(l => l.stage === 'closedWon').length,
        closedLost: leads.filter(l => l.stage === 'closedLost').length
      },
      byStatus: {
        active: leads.filter(l => l.status === 'active').length,
        nurturing: leads.filter(l => l.status === 'nurturing').length,
        won: leads.filter(l => l.status === 'won').length,
        lost: leads.filter(l => l.status === 'lost').length
      },
      totalPipelineValue: leads.filter(l => l.status === 'active')
        .reduce((sum, l) => sum + (l.potentialValue || 0), 0),
      wonValue: leads.filter(l => l.stage === 'closedWon')
        .reduce((sum, l) => sum + (l.actualValue || 0), 0),
      averageDealSize: (() => {
        const wonLeads = leads.filter(l => l.stage === 'closedWon' && l.actualValue > 0);
        return wonLeads.length > 0
          ? Math.round(wonLeads.reduce((sum, l) => sum + l.actualValue, 0) / wonLeads.length)
          : 0;
      })(),
      conversionRate: leads.length > 0 
        ? ((leads.filter(l => l.stage === 'closedWon').length / leads.length) * 100).toFixed(1)
        : 0
    };

    res.json({
      success: true,
      count: leads.length,
      stats,
      data: leads
    });
  } catch (error) {
    console.error('Get all leads error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Assign Lead to Sales Rep
exports.assignLead = async (req, res) => {
  try {
    const { leadId } = req.params;
    const { assignedTo } = req.body;

    const lead = await Lead.findById(leadId);
    if (!lead) {
      return res.status(404).json({ message: 'Lead not found' });
    }

    const salesRep = await User.findById(assignedTo);
    if (!salesRep) {
      return res.status(404).json({ message: 'Sales representative not found' });
    }

    const previousAssignee = lead.assignedTo;
    lead.assignedTo = assignedTo;
    
    lead.stageHistory.push({
      stage: lead.stage,
      enteredAt: Date.now(),
      updatedBy: req.user.id,
      notes: `Reassigned to ${salesRep.firstName} ${salesRep.lastName}`
    });

    await lead.save();
    await lead.populate('company assignedTo', 'companyName firstName lastName email');

    // TODO: Notify new assignee

    res.json({
      success: true,
      message: 'Lead assigned successfully',
      data: lead
    });
  } catch (error) {
    console.error('Assign lead error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get Lead Pipeline Overview
exports.getLeadPipeline = async (req, res) => {
  try {
    const pipeline = {
      lead: [],
      qualified: [],
      proposal: [],
      negotiation: [],
      closedWon: [],
      closedLost: []
    };

    const leads = await Lead.find({ 
      status: { $ne: 'lost' },
      isDeleted: false 
    })
      .populate('company', 'companyName industry priority')
      .populate('assignedTo', 'name email')
      .sort({ lastContactDate: -1 });

    leads.forEach(lead => {
      if (pipeline[lead.stage]) {
        pipeline[lead.stage].push({
          id: lead._id,
          name: lead.name,
          company: lead.company?.companyName,
          value: lead.potentialValue,
          assignedTo: lead.assignedTo?.name,
          lastContact: lead.lastContactDate,
          probability: lead.probability
        });
      }
    });

    // Calculate stage values
    const stageValues = {};
    Object.keys(pipeline).forEach(stage => {
      stageValues[stage] = pipeline[stage].reduce((sum, l) => sum + (l.value || 0), 0);
    });

    res.json({
      success: true,
      data: {
        pipeline,
        stageValues,
        totalPipelineValue: Object.values(stageValues)
          .filter((_, idx) => idx < 4) // Exclude closedWon and closedLost
          .reduce((sum, val) => sum + val, 0)
      }
    });
  } catch (error) {
    console.error('Get lead pipeline error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// ============ COMMON SECTION ============

// Get Lead Details
exports.getLeadDetails = async (req, res) => {
  try {
    const { leadId } = req.params;

    const lead = await Lead.findById(leadId)
      .populate('company', 'companyName industry location website employeeCount revenue research')
      .populate('assignedTo', 'name email role employeeId')
      .populate('followUps.createdBy', 'name email')
      .populate('stageHistory.updatedBy', 'name email');

    if (!lead) {
      return res.status(404).json({ message: 'Lead not found' });
    }

    // Check access
    const hasAccess = 
      req.user.role === 'co-founder' ||
      req.user.role === 'head-of-sales' ||
      lead.assignedTo._id.toString() === req.user.id;

    if (!hasAccess) {
      return res.status(403).json({ message: 'Not authorized to view this lead' });
    }

    // Get related tasks
    const tasks = await Task.find({
      'salesContext.lead': leadId,
      taskType: 'sales'
    })
      .populate('assignedTo', 'name email')
      .sort({ dueDate: 1 });

    res.json({
      success: true,
      data: {
        lead,
        tasks,
        stats: {
          daysInStage: Math.floor((Date.now() - lead.stageHistory[lead.stageHistory.length - 1]?.enteredAt) / (1000 * 60 * 60 * 24)),
          totalFollowUps: lead.followUps.length,
          daysSinceLastContact: Math.floor((Date.now() - lead.lastContactDate) / (1000 * 60 * 60 * 24))
        }
      }
    });
  } catch (error) {
    console.error('Get lead details error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Delete Lead (Soft delete)
exports.deleteLead = async (req, res) => {
  try {
    const { leadId } = req.params;

    const lead = await Lead.findById(leadId);
    if (!lead) {
      return res.status(404).json({ message: 'Lead not found' });
    }

    // Only HOS or assigned rep can delete
    if (req.user.role !== 'head-of-sales' && 
        lead.assignedTo.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to delete this lead' });
    }

    lead.isDeleted = true;
    await lead.save();

    // Update company authority count
    const company = await Company.findById(lead.company);
    if (company) {
      company.authorityCount = await Lead.countDocuments({ 
        company: lead.company, 
        isDeleted: false 
      });
      await company.save();
    }

    res.json({
      success: true,
      message: 'Lead deleted successfully'
    });
  } catch (error) {
    console.error('Delete lead error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get Sales Performance Stats (for individual user)
exports.getMyPerformanceStats = async (req, res) => {
  try {
    const userId = req.user.id;

    // Get all user's leads
    const leads = await Lead.find({ 
      assignedTo: userId,
      isDeleted: false 
    });

    // Get user's companies
    const companies = await Company.find({
      $or: [
        { identifiedBy: userId },
        { assignedTo: userId }
      ],
      isDeleted: false
    });

    // Get user's tasks
    const tasks = await Task.find({
      assignedTo: userId,
      taskType: 'sales'
    });

    // Calculate stats
    const stats = {
      activeLeads: leads.filter(l => l.status === 'active').length,
      qualifiedLeads: leads.filter(l => l.stage === 'qualified' || l.stage === 'proposal' || l.stage === 'negotiation').length,
      closedWon: leads.filter(l => l.stage === 'closedWon').length,
      conversionRate: leads.length > 0 
        ? parseFloat(((leads.filter(l => l.stage === 'closedWon').length / leads.length) * 100).toFixed(1))
        : 0,
      totalValue: leads.filter(l => l.status === 'active')
        .reduce((sum, l) => sum + (l.potentialValue || 0), 0),
      averageDealSize: (() => {
        const wonLeads = leads.filter(l => l.stage === 'closedWon' && l.actualValue > 0);
        return wonLeads.length > 0
          ? Math.round(wonLeads.reduce((sum, l) => sum + l.actualValue, 0) / wonLeads.length)
          : 0;
      })(),
      assignedTasks: tasks.length,
      completedTasks: tasks.filter(t => t.status === 'completed').length,
      pendingTasks: tasks.filter(t => t.status === 'pending').length,
      companiesAdded: companies.length,
      monthlyTarget: 0, // Will be calculated from revenue targets
      monthlyAchieved: 0
    };

    // Get monthly target
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    const activeTarget = await RevenueTarget.findOne({
      'strategy.targetLocations.assignedReps': userId,
      startDate: { $lte: monthEnd },
      endDate: { $gte: monthStart }
    });

    if (activeTarget && activeTarget.strategy.targetLocations) {
      const userLocation = activeTarget.strategy.targetLocations.find(
        loc => loc.assignedReps.some(rep => rep.toString() === userId)
      );
      if (userLocation) {
        stats.monthlyTarget = userLocation.targetAmount || 0;
      }
    }

    // Calculate monthly achievement
    const monthlyWonLeads = leads.filter(l => 
      l.stage === 'closedWon' && 
      l.actualCloseDate >= monthStart && 
      l.actualCloseDate <= monthEnd
    );
    stats.monthlyAchieved = monthlyWonLeads.reduce((sum, l) => sum + (l.actualValue || 0), 0);

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Get performance stats error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Bulk Import Leads (HOS only)
exports.bulkImportLeads = async (req, res) => {
  try {
    const { leads } = req.body;

    console.log('📥 Bulk lead import request received');
    console.log('📦 Leads count:', leads?.length);

    if (!leads || !Array.isArray(leads) || leads.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Please provide an array of leads to import'
      });
    }

    const results = {
      created: 0,
      skipped: 0,
      errors: []
    };

    for (const leadData of leads) {
      try {
        console.log(`\n👤 Processing lead: ${leadData.name} for ${leadData.companyName}`);
        console.log(`💰 Potential Value received: ${leadData.potentialValue}`);
        console.log(`🏷️ Lead Type: ${leadData.leadType}, Lead Source: ${leadData.leadSource}`);
        
        // Find existing company (DO NOT CREATE)
        let company;
        if (leadData.company) {
          // If company ID is provided
          company = await Company.findById(leadData.company);
          console.log(`🔍 Searching by ID: ${leadData.company} - Found: ${company ? 'Yes' : 'No'}`);
        } else if (leadData.companyName) {
          // Search for company by name (case-insensitive, trim whitespace)
          const searchName = leadData.companyName.trim();
          company = await Company.findOne({
            companyName: { $regex: new RegExp(`^${searchName}$`, 'i') },
            isDeleted: false
          });
          console.log(`� Searching for company: "${searchName}" - Found: ${company ? company.companyName : 'No'}`);
        }

        if (!company) {
          console.log(`⚠️ Company not found: ${leadData.companyName} - Skipping lead`);
          results.skipped++;
          results.errors.push({
            lead: leadData.name,
            companyName: leadData.companyName,
            error: 'Company not found. Please create the company first before importing leads.'
          });
          continue;
        }

        console.log(`✅ Found existing company: ${company.companyName} (ID: ${company._id})`)

        // Check if lead already exists
        const existingLead = await Lead.findOne({
          company: company._id,
          $or: [
            { email: leadData.email?.toLowerCase() },
            { name: { $regex: new RegExp(`^${leadData.name}$`, 'i') }, designation: leadData.designation }
          ],
          isDeleted: false
        });

        if (existingLead) {
          console.log(`⚠️ Lead already exists: ${leadData.name}`);
          results.skipped++;
          results.errors.push({
            lead: leadData.name,
            error: 'Lead already exists for this company'
          });
          continue;
        }

        // Create new lead
        const newLead = new Lead({
          company: company._id,
          name: leadData.name,
          designation: leadData.designation,
          department: leadData.department,
          email: leadData.email,
          phone: leadData.phone,
          linkedIn: leadData.linkedIn,
          location: leadData.location,
          serviceInterest: leadData.remark || leadData.requirements,
          requirements: leadData.remark,
          assignedTo: leadData.assignedTo,
          createdBy: req.user.id,
          stage: leadData.stage || 'lead',
          status: leadData.status || 'active',
          lastContactDate: leadData.lastContactDate || null,
          potentialValue: leadData.potentialValue || 0,
          leadType: leadData.leadType || 'cold',
          leadSource: leadData.leadSource || 'import',
          firstContactDate: leadData.lastContactDate || new Date()
        });

        // Add follow-ups if touchpoints mentioned
        if (leadData.touchpoints && leadData.touchpoints > 0) {
          newLead.followUps = [{
            date: leadData.lastContactDate || new Date(),
            type: 'other',
            notes: `${leadData.touchpoints} touchpoints recorded during import`,
            createdBy: req.user.id
          }];
        }

        await newLead.save();
        console.log(`✅ Created lead: ${leadData.name}`);

        results.created++;
      } catch (error) {
        console.error(`❌ Error creating lead ${leadData.name}:`, error.message);
        results.errors.push({
          lead: leadData.name,
          error: error.message
        });
      }
    }

    console.log('\n📊 Lead import results:', results);

    res.status(200).json({
      success: true,
      message: `Bulk import completed: ${results.created} created, ${results.skipped} skipped`,
      data: results
    });
  } catch (error) {
    console.error('❌ Error in bulk import leads:', error);
    res.status(500).json({
      success: false,
      message: 'Error importing leads',
      error: error.message
    });
  }
};

// Bulk Assign Leads (HOS only)
exports.bulkAssignLeads = async (req, res) => {
  try {
    const { leadIds, assignedTo } = req.body;

    if (!leadIds || !Array.isArray(leadIds) || leadIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Please provide lead IDs to assign'
      });
    }

    if (!assignedTo) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a sales representative to assign to'
      });
    }

    // Verify the user exists and has correct role
    const salesRep = await User.findById(assignedTo);
    if (!salesRep) {
      return res.status(404).json({
        success: false,
        message: 'Sales representative not found'
      });
    }

    if (!['service-onboarding', 'individual', 'service-delivery'].includes(salesRep.role)) {
      return res.status(400).json({
        success: false,
        message: 'User must be a sales representative'
      });
    }

    // Update all leads
    const result = await Lead.updateMany(
      { _id: { $in: leadIds } },
      {
        $set: {
          assignedTo: assignedTo
        }
      }
    );

    res.status(200).json({
      success: true,
      message: `Successfully assigned ${result.modifiedCount} leads`,
      data: {
        updated: result.modifiedCount
      }
    });
  } catch (error) {
    console.error('Error in bulk assign leads:', error);
    res.status(500).json({
      success: false,
      message: 'Error assigning leads',
      error: error.message
    });
  }
};

module.exports = exports;
