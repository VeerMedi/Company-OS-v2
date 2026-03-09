const Company = require('../models/Company');
const Lead = require('../models/Lead');
const RevenueTarget = require('../models/RevenueTarget');
const SalesTarget = require('../models/SalesTarget');
const User = require('../models/User');

// ============ COMPANY MANAGEMENT ============

// Create Company (Sales Rep identifies a company)
exports.createCompany = async (req, res) => {
  try {
    const {
      companyName,
      industry,
      website,
      location,
      employeeCount,
      revenue,
      potentialValue,
      priority,
      revenueTarget,
      research
    } = req.body;

    const company = new Company({
      companyName,
      industry,
      website,
      location,
      employeeCount,
      revenue,
      potentialValue,
      priority,
      identifiedBy: req.user.id,
      assignedTo: req.user.id,
      revenueTarget,
      research,
      approvalStatus: 'pending',
      status: 'identified',
      activities: [{
        action: 'Company Identified',
        description: `Company identified by ${req.user.firstName} ${req.user.lastName}`,
        performedBy: req.user.id
      }]
    });

    await company.save();
    await company.populate('identifiedBy revenueTarget', 'firstName lastName email targetAmount');

    // Update the sales target for the sales rep who created the company
    const salesRepId = req.user.id;
    const activeTarget = await SalesTarget.findOne({
      userId: salesRepId,
      status: 'active',
      startDate: { $lte: new Date() },
      endDate: { $gte: new Date() }
    });

    if (activeTarget) {
      // Increment companies achieved
      activeTarget.companiesAchieved = (activeTarget.companiesAchieved || 0) + 1;
      
      // Update progress percentage
      const totalProgress = (
        (activeTarget.revenueAchieved / activeTarget.revenueTarget) * 0.4 +
        (activeTarget.companiesAchieved / activeTarget.companiesTarget) * 0.2 +
        (activeTarget.leadsAchieved / activeTarget.leadsTarget) * 0.2 +
        (activeTarget.conversionsAchieved / activeTarget.conversionsTarget) * 0.2
      ) * 100;
      
      activeTarget.progressPercentage = Math.round(totalProgress);
      
      await activeTarget.save();
      console.log(`✅ Updated sales target for user ${salesRepId}: ${activeTarget.companiesAchieved}/${activeTarget.companiesTarget} companies`);
    }

    res.status(201).json({
      success: true,
      data: company
    });
  } catch (error) {
    console.error('Create company error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get All Companies
exports.getAllCompanies = async (req, res) => {
  try {
    const { 
      approvalStatus, 
      status, 
      location, 
      priority, 
      revenueTarget,
      assignedTo 
    } = req.query;
    
    const filter = { isDeleted: false };
    
    if (approvalStatus) filter.approvalStatus = approvalStatus;
    if (status) filter.status = status;
    if (priority) filter.priority = priority;
    if (revenueTarget) filter.revenueTarget = revenueTarget;
    if (assignedTo) filter.assignedTo = assignedTo;
    if (location) {
      filter.$or = [
        { 'location.city': new RegExp(location, 'i') },
        { 'location.state': new RegExp(location, 'i') }
      ];
    }

    const companies = await Company.find(filter)
      .populate('identifiedBy assignedTo approvedBy', 'firstName lastName email role')
      .populate('revenueTarget', 'targetAmount targetPeriod')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: companies.length,
      data: companies
    });
  } catch (error) {
    console.error('Get all companies error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get My Companies (Sales Rep's companies)
exports.getMyCompanies = async (req, res) => {
  try {
    const companies = await Company.find({ 
      $or: [
        { identifiedBy: req.user.id },
        { assignedTo: req.user.id }
      ],
      isDeleted: false 
    })
      .populate('approvedBy', 'firstName lastName email')
      .populate('revenueTarget', 'targetAmount targetPeriod')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: companies.length,
      data: companies
    });
  } catch (error) {
    console.error('Get my companies error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get Single Company
exports.getCompany = async (req, res) => {
  try {
    const company = await Company.findOne({
      _id: req.params.id,
      isDeleted: false
    })
      .populate('identifiedBy assignedTo approvedBy', 'firstName lastName email role')
      .populate('revenueTarget', 'targetAmount targetPeriod startDate endDate')
      .populate('activities.performedBy', 'firstName lastName email');

    if (!company) {
      return res.status(404).json({ message: 'Company not found' });
    }

    // Get leads for this company
    const leads = await Lead.find({ 
      company: company._id,
      isDeleted: false 
    })
      .populate('assignedTo', 'firstName lastName email')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: {
        company,
        leads
      }
    });
  } catch (error) {
    console.error('Get company error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Update Company
exports.updateCompany = async (req, res) => {
  try {
    const company = await Company.findOne({
      _id: req.params.id,
      isDeleted: false
    });

    if (!company) {
      return res.status(404).json({ message: 'Company not found' });
    }

    const {
      companyName,
      industry,
      website,
      location,
      employeeCount,
      revenue,
      potentialValue,
      priority,
      status,
      research
    } = req.body;

    if (companyName) company.companyName = companyName;
    if (industry) company.industry = industry;
    if (website) company.website = website;
    if (location) company.location = { ...company.location, ...location };
    if (employeeCount) company.employeeCount = employeeCount;
    if (revenue) company.revenue = revenue;
    if (potentialValue !== undefined) company.potentialValue = potentialValue;
    if (priority) company.priority = priority;
    if (status) company.status = status;
    if (research) company.research = { ...company.research, ...research };

    company.activities.push({
      action: 'Company Updated',
      description: `Company information updated by ${req.user.name}`,
      performedBy: req.user.id
    });

    await company.save();
    await company.populate('identifiedBy assignedTo approvedBy', 'name email');

    res.json({
      success: true,
      data: company
    });
  } catch (error) {
    console.error('Update company error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Approve/Reject Company (Head of Sales)
exports.approveCompany = async (req, res) => {
  try {
    const { approvalStatus, approvalNotes, assignedTo } = req.body;

    const company = await Company.findOne({
      _id: req.params.id,
      isDeleted: false
    });

    if (!company) {
      return res.status(404).json({ message: 'Company not found' });
    }

    company.approvalStatus = approvalStatus;
    company.approvalNotes = approvalNotes;
    company.approvedBy = req.user.id;
    company.approvalDate = Date.now();

    if (approvalStatus === 'approved') {
      company.status = 'approved';
      if (assignedTo) {
        company.assignedTo = assignedTo;
      }
      
      // If company doesn't have a revenue target, link to active approved HOS strategy
      if (!company.revenueTarget) {
        const activeTarget = await RevenueTarget.findOne({
          assignedTo: req.user.id,
          status: 'in-progress',
          'strategy.approvedByCoFounder': true
        });
        
        if (activeTarget) {
          company.revenueTarget = activeTarget._id;
        }
      }
    } else if (approvalStatus === 'rejected') {
      company.status = 'rejected';
    }

    company.activities.push({
      action: `Company ${approvalStatus}`,
      description: `Company ${approvalStatus} by ${req.user.firstName} ${req.user.lastName}. ${approvalNotes || ''}`,
      performedBy: req.user.id
    });

    await company.save();
    await company.populate('identifiedBy assignedTo approvedBy', 'firstName lastName email');

    res.json({
      success: true,
      data: company
    });
  } catch (error) {
    console.error('Approve company error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Delete Company (Soft delete)
exports.deleteCompany = async (req, res) => {
  try {
    const company = await Company.findById(req.params.id);
    if (!company) {
      return res.status(404).json({ message: 'Company not found' });
    }

    company.isDeleted = true;
    company.activities.push({
      action: 'Company Deleted',
      description: `Company deleted by ${req.user.firstName} ${req.user.lastName}`,
      performedBy: req.user.id
    });

    await company.save();

    res.json({
      success: true,
      message: 'Company deleted successfully'
    });
  } catch (error) {
    console.error('Delete company error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// ============ LEAD MANAGEMENT ============

// Create Lead (Authority/Decision Maker)
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
      notes,
      painPoints
    } = req.body;

    // Verify company exists and is approved
    const companyDoc = await Company.findOne({
      _id: company,
      isDeleted: false
    });

    if (!companyDoc) {
      return res.status(404).json({ message: 'Company not found' });
    }

    if (companyDoc.approvalStatus !== 'approved') {
      return res.status(400).json({ message: 'Company must be approved before adding leads' });
    }

    // Check if lead already exists for this company
    const existingLead = await Lead.findOne({
      company,
      $or: [
        { email: email?.toLowerCase() },
        { 
          name: { $regex: new RegExp(`^${name}$`, 'i') }, 
          designation: { $regex: new RegExp(`^${designation}$`, 'i') }
        }
      ],
      isDeleted: false
    });

    if (existingLead) {
      return res.status(400).json({ 
        message: 'A lead with this name and designation or email already exists for this company',
        existingLead: {
          id: existingLead._id,
          name: existingLead.name,
          designation: existingLead.designation,
          stage: existingLead.stage
        }
      });
    }

    const lead = new Lead({
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
      notes,
      painPoints,
      assignedTo: req.user.id,
      stage: 'identified',
      status: 'active',
      activities: [{
        action: 'Lead Created',
        description: `Lead created for ${name} - ${designation}`,
        performedBy: req.user.id
      }]
    });

    await lead.save();
    await lead.populate('company assignedTo', 'companyName name email');

    // Add activity to company
    companyDoc.activities.push({
      action: 'Lead Added',
      description: `New lead added: ${name} - ${designation}`,
      performedBy: req.user.id
    });
    await companyDoc.save();

    res.status(201).json({
      success: true,
      data: lead
    });
  } catch (error) {
    console.error('Create lead error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get All Leads
exports.getAllLeads = async (req, res) => {
  try {
    const { stage, status, assignedTo, company } = req.query;
    const filter = { isDeleted: false };
    
    if (stage) filter.stage = stage;
    if (status) filter.status = status;
    if (assignedTo) filter.assignedTo = assignedTo;
    if (company) filter.company = company;

    const leads = await Lead.find(filter)
      .populate('company', 'companyName industry location')
      .populate('assignedTo', 'name email')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: leads.length,
      data: leads
    });
  } catch (error) {
    console.error('Get all leads error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get My Leads (Sales Rep's leads)
exports.getMyLeads = async (req, res) => {
  try {
    const leads = await Lead.find({ 
      assignedTo: req.user.id,
      isDeleted: false 
    })
      .populate('company', 'companyName industry location')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: leads.length,
      data: leads
    });
  } catch (error) {
    console.error('Get my leads error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get Single Lead
exports.getLead = async (req, res) => {
  try {
    const lead = await Lead.findOne({
      _id: req.params.id,
      isDeleted: false
    })
      .populate('company', 'companyName industry location website')
      .populate('assignedTo', 'name email role')
      .populate('followUps.createdBy', 'name email')
      .populate('activities.performedBy', 'name email');

    if (!lead) {
      return res.status(404).json({ message: 'Lead not found' });
    }

    res.json({
      success: true,
      data: lead
    });
  } catch (error) {
    console.error('Get lead error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Update Lead
exports.updateLead = async (req, res) => {
  try {
    const lead = await Lead.findOne({
      _id: req.params.id,
      isDeleted: false
    });

    if (!lead) {
      return res.status(404).json({ message: 'Lead not found' });
    }

    const allowedUpdates = [
      'name', 'designation', 'department', 'email', 'phone', 'linkedIn',
      'authorityLevel', 'decisionPower', 'stage', 'status', 'potentialValue',
      'actualValue', 'probability', 'serviceInterest', 'requirements',
      'expectedCloseDate', 'actualCloseDate', 'lastContactDate', 'notes',
      'painPoints', 'objections'
    ];

    allowedUpdates.forEach(field => {
      if (req.body[field] !== undefined) {
        lead[field] = req.body[field];
      }
    });

    lead.activities.push({
      action: 'Lead Updated',
      description: `Lead updated by ${req.user.name}`,
      performedBy: req.user.id
    });

    await lead.save();
    await lead.populate('company assignedTo', 'companyName name email');

    res.json({
      success: true,
      data: lead
    });
  } catch (error) {
    console.error('Update lead error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Add Follow-up
exports.addFollowUp = async (req, res) => {
  try {
    const { date, type, notes, outcome, nextAction } = req.body;

    const lead = await Lead.findOne({
      _id: req.params.id,
      isDeleted: false
    });

    if (!lead) {
      return res.status(404).json({ message: 'Lead not found' });
    }

    lead.followUps.push({
      date,
      type,
      notes,
      outcome,
      nextAction,
      createdBy: req.user.id
    });

    lead.lastContactDate = date;

    lead.activities.push({
      action: 'Follow-up Added',
      description: `${type} follow-up: ${notes.substring(0, 50)}...`,
      performedBy: req.user.id
    });

    await lead.save();
    await lead.populate('company assignedTo', 'companyName name email');

    res.json({
      success: true,
      data: lead
    });
  } catch (error) {
    console.error('Add follow-up error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Add Meeting
exports.addMeeting = async (req, res) => {
  try {
    const { scheduledDate, duration, type, attendees, agenda, notes, outcome, status } = req.body;

    const lead = await Lead.findOne({
      _id: req.params.id,
      isDeleted: false
    });

    if (!lead) {
      return res.status(404).json({ message: 'Lead not found' });
    }

    lead.meetings.push({
      scheduledDate,
      duration,
      type,
      attendees,
      agenda,
      notes,
      outcome,
      status
    });

    lead.activities.push({
      action: 'Meeting Scheduled',
      description: `${type} meeting scheduled for ${new Date(scheduledDate).toLocaleDateString()}`,
      performedBy: req.user.id
    });

    await lead.save();
    await lead.populate('company assignedTo', 'companyName name email');

    res.json({
      success: true,
      data: lead
    });
  } catch (error) {
    console.error('Add meeting error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Delete Lead (Soft delete)
exports.deleteLead = async (req, res) => {
  try {
    const lead = await Lead.findById(req.params.id);
    if (!lead) {
      return res.status(404).json({ message: 'Lead not found' });
    }

    lead.isDeleted = true;
    lead.activities.push({
      action: 'Lead Deleted',
      description: `Lead deleted by ${req.user.name}`,
      performedBy: req.user.id
    });

    await lead.save();

    res.json({
      success: true,
      message: 'Lead deleted successfully'
    });
  } catch (error) {
    console.error('Delete lead error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get Sales Rep Dashboard
exports.getSalesRepDashboard = async (req, res) => {
  try {
    // My companies
    const myCompanies = await Company.find({
      $or: [
        { identifiedBy: req.user.id },
        { assignedTo: req.user.id }
      ],
      isDeleted: false
    }).populate('revenueTarget', 'targetAmount');

    // My leads
    const myLeads = await Lead.find({
      assignedTo: req.user.id,
      isDeleted: false
    }).populate('company', 'companyName');

    // Stats
    const totalCompanies = myCompanies.length;
    const pendingApproval = myCompanies.filter(c => c.approvalStatus === 'pending').length;
    const approvedCompanies = myCompanies.filter(c => c.approvalStatus === 'approved').length;
    
    const totalLeads = myLeads.length;
    const activeLeads = myLeads.filter(l => l.status === 'active').length;
    const wonDeals = myLeads.filter(l => l.stage === 'closed-won').length;
    
    const totalRevenue = myLeads
      .filter(l => l.stage === 'closed-won')
      .reduce((sum, l) => sum + (l.actualValue || 0), 0);

    // Pipeline by stage
    const pipeline = {
      identified: myLeads.filter(l => l.stage === 'identified').length,
      contacted: myLeads.filter(l => l.stage === 'contacted').length,
      qualified: myLeads.filter(l => l.stage === 'qualified').length,
      'meeting-scheduled': myLeads.filter(l => l.stage === 'meeting-scheduled').length,
      proposal: myLeads.filter(l => l.stage === 'proposal').length,
      negotiation: myLeads.filter(l => l.stage === 'negotiation').length,
      'closed-won': myLeads.filter(l => l.stage === 'closed-won').length,
      'closed-lost': myLeads.filter(l => l.stage === 'closed-lost').length
    };

    // Upcoming follow-ups
    const upcomingFollowUps = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    myLeads.forEach(lead => {
      lead.followUps.forEach(followUp => {
        const followUpDate = new Date(followUp.date);
        followUpDate.setHours(0, 0, 0, 0);
        
        if (followUpDate >= today) {
          upcomingFollowUps.push({
            leadId: lead._id,
            leadName: lead.name,
            company: lead.company?.companyName,
            followUp
          });
        }
      });
    });

    upcomingFollowUps.sort((a, b) => new Date(a.followUp.date) - new Date(b.followUp.date));

    res.json({
      success: true,
      data: {
        stats: {
          totalCompanies,
          pendingApproval,
          approvedCompanies,
          totalLeads,
          activeLeads,
          wonDeals,
          totalRevenue
        },
        pipeline,
        upcomingFollowUps: upcomingFollowUps.slice(0, 10),
        recentCompanies: myCompanies.slice(0, 5),
        recentLeads: myLeads.slice(0, 5)
      }
    });
  } catch (error) {
    console.error('Get sales rep dashboard error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = exports;
