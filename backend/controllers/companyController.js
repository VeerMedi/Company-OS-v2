const Company = require('../models/Company');
const Lead = require('../models/Lead');
const Task = require('../models/Task');
const RevenueTarget = require('../models/RevenueTarget');
const SalesTarget = require('../models/SalesTarget');
const User = require('../models/User');
const { sendCompanySubmissionNotification, sendCompanyReviewNotification } = require('../utils/emailService');

// ============ SALES TEAM SECTION ============

// Submit Company for Approval (Sales Team identifies and submits company)
exports.submitCompany = async (req, res) => {
  try {
    let {
      companyName,
      overview,
      industry,
      website,
      location,
      employeeCount,
      revenue,
      annualRevenueUSD,
      geographicalHotspots,
      currentTechStack,
      currentPainPoints,
      automationSaaSUsed,
      expectedROIImpact,
      keyChallenges,
      howHustleHouseCanHelp,
      additionalNotes,
      wrtRoiPriorityLevel,
      proofOfConcept,
      latestNews,
      potentialValue,
      priority,
      research,
      revenueTarget,
      assignedHOS
    } = req.body;

    // Parse JSON strings if they exist (from FormData)
    if (typeof location === 'string') {
      try {
        location = JSON.parse(location);
      } catch (e) {
        location = {};
      }
    }

    if (typeof research === 'string') {
      try {
        research = JSON.parse(research);
      } catch (e) {
        research = {};
      }
    }

    // Check if company already exists
    const existingCompany = await Company.findOne({
      companyName: { $regex: new RegExp(`^${companyName}$`, 'i') },
      isDeleted: false
    });

    if (existingCompany) {
      return res.status(400).json({
        message: 'Company already exists in the system',
        existingCompany: {
          id: existingCompany._id,
          name: existingCompany.companyName,
          status: existingCompany.approvalStatus
        }
      });
    }

    const company = new Company({
      companyName,
      overview,
      industry,
      website,
      location,
      employeeCount: employeeCount || 'unknown',
      revenue: revenue || annualRevenueUSD || 'unknown',
      annualRevenueUSD,
      geographicalHotspots,
      currentTechStack,
      currentPainPoints,
      automationSaaSUsed,
      expectedROIImpact,
      keyChallenges,
      howHustleHouseCanHelp,
      additionalNotes,
      wrtRoiPriorityLevel,
      proofOfConcept,
      latestNews,
      potentialValue: potentialValue || 0,
      priority: priority || wrtRoiPriorityLevel || 'medium',
      identifiedBy: req.user.id,
      assignedTo: req.user.id,
      assignedHOS: assignedHOS || null, // Store selected HOS
      research: {
        ...research,
        painPoints: currentPainPoints || research?.painPoints || '',
        notes: additionalNotes || research?.notes || ''
      },
      revenueTarget,
      status: 'researching',
      approvalStatus: 'pending',
      activities: [{
        action: 'Company Identified',
        description: `${companyName} added to system for approval`,
        performedBy: req.user.id
      }]
    });

    // Handle research document upload if present
    if (req.file) {
      company.studyDocuments = [{
        name: req.file.originalname,
        filePath: req.file.path,
        documentType: 'company-research',
        uploadedBy: req.user.id,
        uploadedAt: new Date(),
        description: 'Research document submitted with company'
      }];
    }

    await company.save();
    await company.populate('identifiedBy assignedTo assignedHOS', 'firstName lastName email role');

    // Send email notification to selected Head of Sales
    try {
      let hosUsers = [];

      // If a specific HOS was selected, send only to them
      if (assignedHOS) {
        const selectedHOS = await User.findById(assignedHOS);
        if (selectedHOS && selectedHOS.role === 'head-of-sales' && selectedHOS.isActive) {
          hosUsers = [selectedHOS];
        }
      } else {
        // Fallback: send to all active HOS users if none selected
        hosUsers = await User.find({ role: 'head-of-sales', isActive: true });
      }

      if (hosUsers.length > 0) {
        const submittedByUser = await User.findById(req.user.id);
        const locationStr = location ? `${location.city || ''}${location.city && location.state ? ', ' : ''}${location.state || ''}${(location.city || location.state) && location.country ? ', ' : ''}${location.country || ''}`.trim() : '';

        for (const hos of hosUsers) {
          await sendCompanySubmissionNotification({
            hosEmail: hos.email,
            hosName: `${hos.firstName} ${hos.lastName}`,
            companyName,
            submittedBy: `${submittedByUser.firstName} ${submittedByUser.lastName}`,
            submittedByEmail: submittedByUser.email,
            industry: industry || 'Not specified',
            location: locationStr || 'Not specified',
            potentialValue: potentialValue || 0,
            priority: priority || wrtRoiPriorityLevel || 'medium',
            website: website || ''
          });
        }
        console.log(`Company submission notification sent to ${assignedHOS ? 'selected' : 'all'} HOS`);
      }
    } catch (emailError) {
      console.error('Error sending company submission notification:', emailError);
      // Don't fail the request if email fails
    }

    res.status(201).json({
      success: true,
      message: 'Company submitted for approval',
      data: company
    });
  } catch (error) {
    console.error('Submit company error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Upload Study Documents
exports.uploadStudyDocument = async (req, res) => {
  try {
    const { companyId } = req.params;
    const { documentType, description, name } = req.body;

    const company = await Company.findById(companyId);
    if (!company) {
      return res.status(404).json({ message: 'Company not found' });
    }

    // Verify user has access to this company
    if (company.identifiedBy.toString() !== req.user.id &&
      company.assignedTo?.toString() !== req.user.id &&
      req.user.role !== 'head-of-sales' &&
      req.user.role !== 'co-founder') {
      return res.status(403).json({ message: 'Not authorized to upload documents for this company' });
    }

    // Handle file upload (req.file should be available if using multer)
    const document = {
      name: name || req.file?.originalname || 'Document',
      documentType: documentType || 'other',
      url: req.file?.path || req.body.url,
      filePath: req.file?.path,
      uploadedBy: req.user.id,
      uploadedAt: Date.now(),
      description
    };

    company.studyDocuments.push(document);
    company.activities.push({
      action: 'Document Uploaded',
      description: `${documentType || 'Document'} uploaded: ${name || req.file?.originalname}`,
      performedBy: req.user.id
    });

    await company.save();
    await company.populate('identifiedBy assignedTo', 'firstName lastName email');

    res.json({
      success: true,
      message: 'Document uploaded successfully',
      data: company
    });
  } catch (error) {
    console.error('Upload study document error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get My Companies (Sales Team view)
exports.getMyCompanies = async (req, res) => {
  try {
    const { status, approvalStatus } = req.query;
    const filter = {
      $or: [
        { identifiedBy: req.user.id },
        { assignedTo: req.user.id }
      ],
      isDeleted: false
    };

    if (status) filter.status = status;
    if (approvalStatus) filter.approvalStatus = approvalStatus;

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
    console.error('Get my companies error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Update Company Research
exports.updateCompanyResearch = async (req, res) => {
  try {
    const { companyId } = req.params;
    const { research, potentialValue, priority } = req.body;

    const company = await Company.findById(companyId);
    if (!company) {
      return res.status(404).json({ message: 'Company not found' });
    }

    // Verify ownership
    if (company.identifiedBy.toString() !== req.user.id &&
      company.assignedTo?.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to update this company' });
    }

    // Can't update if already approved
    if (company.approvalStatus === 'approved') {
      return res.status(400).json({ message: 'Cannot update approved company. Create a new submission or contact HOS.' });
    }

    if (research) company.research = { ...company.research, ...research };
    if (potentialValue !== undefined) company.potentialValue = potentialValue;
    if (priority) company.priority = priority;

    // If it was rejected or needs revision, move back to pending
    if (company.approvalStatus === 'rejected' || company.approvalStatus === 'needs-revision') {
      company.approvalStatus = 'pending';
      company.approvalNotes = '';
    }

    company.activities.push({
      action: 'Research Updated',
      description: 'Company research information updated',
      performedBy: req.user.id
    });

    await company.save();
    await company.populate('identifiedBy assignedTo', 'firstName lastName email');

    res.json({
      success: true,
      message: 'Company research updated',
      data: company
    });
  } catch (error) {
    console.error('Update company research error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// ============ HEAD OF SALES SECTION ============

// Get Pending Approval Companies
exports.getPendingApprovals = async (req, res) => {
  try {
    const companies = await Company.find({
      approvalStatus: 'pending',
      isDeleted: false
    })
      .populate('identifiedBy assignedTo', 'firstName lastName email role employeeId')
      .populate('revenueTarget', 'targetAmount targetPeriod')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: companies.length,
      data: companies
    });
  } catch (error) {
    console.error('Get pending approvals error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Approve/Reject Company (HOS reviews and decides)
exports.reviewCompany = async (req, res) => {
  try {
    const { companyId } = req.params;
    const { approved, notes, assignTo } = req.body;

    const company = await Company.findById(companyId);
    if (!company) {
      return res.status(404).json({ message: 'Company not found' });
    }

    if (company.approvalStatus !== 'pending') {
      return res.status(400).json({
        message: `Company already ${company.approvalStatus}. Cannot review again.`
      });
    }

    company.approvalStatus = approved ? 'approved' : 'rejected';
    company.approvalNotes = notes;
    company.approvalDate = Date.now();
    company.approvedBy = req.user.id;

    if (approved) {
      company.status = 'approved';

      // Assign to specific sales rep if provided
      if (assignTo) {
        const assignedUser = await User.findById(assignTo);
        if (assignedUser) {
          company.assignedTo = assignTo;
        }
      }

      company.activities.push({
        action: 'Company Approved',
        description: `Approved by HOS. ${notes || 'Ready for lead generation'}`,
        performedBy: req.user.id
      });

      // Update the sales target for the sales rep who submitted the company
      const salesRepId = company.identifiedBy;
      if (salesRepId) {
        // Find active target for this sales rep that covers the current date
        const activeTarget = await SalesTarget.findOne({
          userId: salesRepId,
          status: 'active',
          startDate: { $lte: new Date() },
          endDate: { $gte: new Date() }
        });

        console.log(`🔍 Looking for active target for user ${salesRepId}`);
        console.log(`📊 Found target:`, activeTarget ? `${activeTarget._id} - Companies: ${activeTarget.companiesAchieved}/${activeTarget.companiesTarget}` : 'No active target found');

        if (activeTarget) {
          // Increment companies achieved
          activeTarget.companiesAchieved = (activeTarget.companiesAchieved || 0) + 1;

          // Update progress percentage only if targets are set
          let totalProgress = 0;
          let componentCount = 0;

          if (activeTarget.revenueTarget && activeTarget.revenueTarget > 0) {
            totalProgress += (activeTarget.revenueAchieved / activeTarget.revenueTarget) * 0.4;
            componentCount++;
          }

          if (activeTarget.companiesTarget && activeTarget.companiesTarget > 0) {
            totalProgress += (activeTarget.companiesAchieved / activeTarget.companiesTarget) * 0.2;
            componentCount++;
          }

          if (activeTarget.leadsTarget && activeTarget.leadsTarget > 0) {
            totalProgress += (activeTarget.leadsAchieved / activeTarget.leadsTarget) * 0.2;
            componentCount++;
          }

          if (activeTarget.conversionsTarget && activeTarget.conversionsTarget > 0) {
            totalProgress += (activeTarget.conversionsAchieved / activeTarget.conversionsTarget) * 0.2;
            componentCount++;
          }

          // Only calculate if at least one component exists
          if (componentCount > 0) {
            activeTarget.progressPercentage = Math.round(totalProgress * 100);
          }

          await activeTarget.save();
          console.log(`✅ Updated sales target for user ${salesRepId}: ${activeTarget.companiesAchieved}/${activeTarget.companiesTarget} companies (${activeTarget.progressPercentage}% progress)`);
        } else {
          console.log(`⚠️ No active target found for user ${salesRepId} - Company approval not counted in targets`);
        }
      }

      // TODO: Notify sales rep of approval
    } else {
      company.status = 'rejected';
      company.activities.push({
        action: 'Company Rejected',
        description: `Rejected by HOS. Reason: ${notes}`,
        performedBy: req.user.id
      });

      // TODO: Notify sales rep of rejection
    }

    await company.save();
    await company.populate('identifiedBy assignedTo approvedBy', 'firstName lastName email role');

    // Send email notification to the submitter
    try {
      const reviewerUser = await User.findById(req.user.id);
      const submitterUser = company.identifiedBy;
      const assignedUser = company.assignedTo;

      if (submitterUser && submitterUser.email) {
        await sendCompanyReviewNotification({
          submitterEmail: submitterUser.email,
          submitterName: `${submitterUser.firstName} ${submitterUser.lastName}`,
          companyName: company.companyName,
          decision: approved ? 'approved' : 'rejected',
          reviewedBy: `${reviewerUser.firstName} ${reviewerUser.lastName}`,
          reviewNotes: notes || '',
          assignedTo: assignedUser && assignedUser._id.toString() !== submitterUser._id.toString()
            ? `${assignedUser.firstName} ${assignedUser.lastName}`
            : null
        });
        console.log('Company review notification sent to submitter');
      }
    } catch (emailError) {
      console.error('Error sending company review notification:', emailError);
      // Don't fail the request if email fails
    }

    res.json({
      success: true,
      message: `Company ${approved ? 'approved' : 'rejected'} successfully`,
      data: company,
      emailSent: true
    });
  } catch (error) {
    console.error('Review company error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Request Revision (HOS asks for more information)
exports.requestRevision = async (req, res) => {
  try {
    const { companyId } = req.params;
    const { notes } = req.body;

    const company = await Company.findById(companyId);
    if (!company) {
      return res.status(404).json({ message: 'Company not found' });
    }

    company.approvalStatus = 'needs-revision';
    company.approvalNotes = notes;
    company.approvedBy = req.user.id;
    company.activities.push({
      action: 'Revision Requested',
      description: `HOS requested more information: ${notes}`,
      performedBy: req.user.id
    });

    await company.save();
    await company.populate('identifiedBy assignedTo', 'firstName lastName email role');

    // Send email notification to the submitter
    try {
      const reviewerUser = await User.findById(req.user.id);
      const submitterUser = company.identifiedBy;

      if (submitterUser && submitterUser.email) {
        await sendCompanyReviewNotification({
          submitterEmail: submitterUser.email,
          submitterName: `${submitterUser.firstName} ${submitterUser.lastName}`,
          companyName: company.companyName,
          decision: 'needs-revision',
          reviewedBy: `${reviewerUser.firstName} ${reviewerUser.lastName}`,
          reviewNotes: notes || '',
          assignedTo: null
        });
        console.log('Company revision notification sent to submitter');
      }
    } catch (emailError) {
      console.error('Error sending company revision notification:', emailError);
      // Don't fail the request if email fails
    }

    res.json({
      success: true,
      message: 'Revision requested',
      data: company,
      emailSent: true
    });
  } catch (error) {
    console.error('Request revision error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get All Companies (HOS view with filters)
exports.getAllCompanies = async (req, res) => {
  try {
    const { status, approvalStatus, priority, assignedTo } = req.query;
    const filter = { isDeleted: false };

    if (status) filter.status = status;
    if (approvalStatus) filter.approvalStatus = approvalStatus;
    if (priority) filter.priority = priority;
    if (assignedTo) filter.assignedTo = assignedTo;

    const companies = await Company.find(filter)
      .populate('identifiedBy assignedTo approvedBy', 'firstName lastName email role employeeId')
      .populate('revenueTarget', 'targetAmount targetPeriod startDate endDate')
      .sort({ createdAt: -1 });

    // Group by status for quick stats
    const stats = {
      total: companies.length,
      pending: companies.filter(c => c.approvalStatus === 'pending').length,
      approved: companies.filter(c => c.approvalStatus === 'approved').length,
      rejected: companies.filter(c => c.approvalStatus === 'rejected').length,
      needsRevision: companies.filter(c => c.approvalStatus === 'needs-revision').length
    };

    res.json({
      success: true,
      count: companies.length,
      stats,
      data: companies
    });
  } catch (error) {
    console.error('Get all companies error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Assign Company to Sales Rep
exports.assignCompany = async (req, res) => {
  try {
    const { companyId } = req.params;
    const { assignTo } = req.body;

    const company = await Company.findById(companyId);
    if (!company) {
      return res.status(404).json({ message: 'Company not found' });
    }

    const salesRep = await User.findById(assignTo);
    if (!salesRep) {
      return res.status(404).json({ message: 'Sales representative not found' });
    }

    company.assignedTo = assignTo;
    company.activities.push({
      action: 'Company Reassigned',
      description: `Assigned to ${salesRep.firstName} ${salesRep.lastName}`,
      performedBy: req.user.id
    });

    await company.save();
    await company.populate('identifiedBy assignedTo approvedBy', 'firstName lastName email role');

    // TODO: Notify new assignee

    res.json({
      success: true,
      message: 'Company assigned successfully',
      data: company
    });
  } catch (error) {
    console.error('Assign company error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// ============ COMMON SECTION ============

// Update Generic Company Details (CEO/Co-Founder)
exports.updateCompanyDetails = async (req, res) => {
  try {
    const { companyId } = req.params;
    const { companyName, industry, website, location, status } = req.body;

    const company = await Company.findById(companyId);
    if (!company) {
      return res.status(404).json({ message: 'Company not found' });
    }

    // Update fields if provided
    if (companyName) company.companyName = companyName;
    if (industry) company.industry = industry;
    if (website) company.website = website;
    if (location) {
      // Handle location update - merge or replace
      company.location = { ...company.location, ...location };
    }
    if (status) company.status = status;

    company.activities.push({
      action: 'Details Updated',
      description: 'Company details updated by executive',
      performedBy: req.user.id
    });

    await company.save();
    await company.populate('identifiedBy assignedTo approvedBy', 'firstName lastName email role employeeId');

    res.json({
      success: true,
      message: 'Company details updated successfully',
      data: company
    });
  } catch (error) {
    console.error('Update company details error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get Single Company Details
exports.getCompanyDetails = async (req, res) => {
  try {
    const { companyId } = req.params;

    const company = await Company.findById(companyId)
      .populate('identifiedBy assignedTo approvedBy', 'firstName lastName email role employeeId')
      .populate('revenueTarget', 'targetAmount targetPeriod startDate endDate')
      .populate('studyDocuments.uploadedBy', 'firstName lastName email')
      .populate('activities.performedBy', 'firstName lastName email');

    if (!company) {
      return res.status(404).json({ message: 'Company not found' });
    }

    // Check access rights
    const hasAccess =
      req.user.role === 'co-founder' ||
      req.user.role === 'head-of-sales' ||
      company.identifiedBy.toString() === req.user.id ||
      company.assignedTo?.toString() === req.user.id;

    if (!hasAccess) {
      return res.status(403).json({ message: 'Not authorized to view this company' });
    }

    // Get related leads
    const leads = await Lead.find({ company: companyId, isDeleted: false })
      .populate('assignedTo', 'name email')
      .sort({ createdAt: -1 });

    // Get related tasks
    const tasks = await Task.find({
      'salesContext.company': companyId,
      taskType: 'sales'
    })
      .populate('assignedTo', 'name email')
      .sort({ dueDate: 1 });

    res.json({
      success: true,
      data: {
        company,
        leads,
        tasks,
        stats: {
          totalLeads: leads.length,
          activeLeads: leads.filter(l => l.status === 'active').length,
          wonDeals: leads.filter(l => l.stage === 'closedWon').length,
          totalTasks: tasks.length,
          pendingTasks: tasks.filter(t => t.status === 'pending').length
        }
      }
    });
  } catch (error) {
    console.error('Get company details error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Delete Company (Soft delete)
exports.deleteCompany = async (req, res) => {
  try {
    const { companyId } = req.params;

    const company = await Company.findById(companyId);
    if (!company) {
      return res.status(404).json({ message: 'Company not found' });
    }

    // Only HOS or the person who identified can delete
    if (req.user.role !== 'head-of-sales' &&
      company.identifiedBy.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to delete this company' });
    }

    // Non-HOS users cannot delete approved companies
    if (company.approvalStatus === 'approved' && req.user.role !== 'head-of-sales') {
      return res.status(400).json({
        message: 'Cannot delete approved company. Please contact Head of Sales.'
      });
    }

    company.isDeleted = true;
    company.activities.push({
      action: 'Company Deleted',
      description: 'Company removed from system',
      performedBy: req.user.id
    });

    await company.save();

    // Also soft delete all leads associated with this company
    const Lead = require('../models/Lead');
    const leadUpdateResult = await Lead.updateMany(
      { company: companyId, isDeleted: { $ne: true } },
      {
        $set: {
          isDeleted: true,
          deletedAt: new Date(),
          deletedBy: req.user.id
        }
      }
    );

    console.log(`Soft deleted ${leadUpdateResult.modifiedCount} leads associated with company ${company.companyName}`);

    res.json({
      success: true,
      message: 'Company deleted successfully',
      leadsDeleted: leadUpdateResult.modifiedCount
    });
  } catch (error) {
    console.error('Delete company error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Bulk Import Companies (HOS only)
exports.bulkImportCompanies = async (req, res) => {
  try {
    const { companies } = req.body;

    console.log('📥 Bulk import request received');
    console.log('📦 Companies count:', companies?.length);
    console.log('👤 Requesting user:', req.user.id, req.user.role);

    if (!companies || !Array.isArray(companies) || companies.length === 0) {
      console.log('❌ Invalid companies array');
      return res.status(400).json({
        success: false,
        message: 'Please provide an array of companies to import'
      });
    }

    const results = {
      created: 0,
      skipped: 0,
      errors: []
    };

    console.log('🔄 Processing companies...');

    for (const companyData of companies) {
      try {
        console.log(`\n🏢 Processing: ${companyData.companyName}`);

        // Check if company already exists
        const existingCompany = await Company.findOne({
          companyName: { $regex: new RegExp(`^${companyData.companyName}$`, 'i') },
          isDeleted: false
        });

        if (existingCompany) {
          console.log(`⚠️ Company already exists: ${companyData.companyName}`);
          results.skipped++;
          results.errors.push({
            company: companyData.companyName,
            error: 'Company already exists'
          });
          continue;
        }

        // Create new company
        const newCompany = new Company({
          companyName: companyData.companyName,
          overview: companyData.overview,
          industry: companyData.industry,
          website: companyData.website,
          location: companyData.location,
          employeeCount: companyData.employeeCount,
          revenue: companyData.revenue,
          annualRevenueUSD: companyData.annualRevenueUSD,
          geographicalHotspots: companyData.geographicalHotspots,
          currentTechStack: companyData.currentTechStack,
          automationSaaSUsed: companyData.automationSaaSUsed,
          expectedROIImpact: companyData.expectedROIImpact,
          keyChallenges: companyData.keyChallenges,
          howHustleHouseCanHelp: companyData.howHustleHouseCanHelp,
          additionalNotes: companyData.additionalNotes,
          wrtRoiPriorityLevel: companyData.wrtRoiPriorityLevel,
          proofOfConcept: companyData.proofOfConcept,
          latestNews: companyData.latestNews,
          potentialValue: companyData.potentialValue,
          priority: companyData.priority,
          research: companyData.research,
          identifiedBy: req.user.id,
          approvedBy: req.user.id,
          assignedTo: companyData.assignedTo,
          approvalStatus: companyData.approvalStatus || 'approved',
          approvalDate: new Date(),
          status: companyData.status || 'approved'
        });

        await newCompany.save();
        console.log(`✅ Created company: ${companyData.companyName}, assigned to: ${companyData.assignedTo}`);
        results.created++;
      } catch (error) {
        console.error(`❌ Error creating ${companyData.companyName}:`, error.message);
        results.errors.push({
          company: companyData.companyName,
          error: error.message
        });
      }
    }

    console.log('\n📊 Import results:', results);

    res.status(200).json({
      success: true,
      message: `Bulk import completed: ${results.created} created, ${results.skipped} skipped`,
      data: results
    });
  } catch (error) {
    console.error('❌ Error in bulk import:', error);
    res.status(500).json({
      success: false,
      message: 'Error importing companies',
      error: error.message
    });
  }
};

// Bulk Assign Companies (HOS only)
exports.bulkAssignCompanies = async (req, res) => {
  try {
    const { companyIds, assignedTo } = req.body;

    if (!companyIds || !Array.isArray(companyIds) || companyIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Please provide company IDs to assign'
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

    // Update all companies
    const result = await Company.updateMany(
      { _id: { $in: companyIds } },
      {
        $set: {
          assignedTo: assignedTo,
          approvedBy: req.user.id,
          approvalStatus: 'approved',
          approvalDate: new Date(),
          status: 'approved'
        }
      }
    );

    res.status(200).json({
      success: true,
      message: `Successfully assigned ${result.modifiedCount} companies`,
      data: {
        updated: result.modifiedCount
      }
    });
  } catch (error) {
    console.error('Error in bulk assign:', error);
    res.status(500).json({
      success: false,
      message: 'Error assigning companies',
      error: error.message
    });
  }
};

module.exports = exports;
