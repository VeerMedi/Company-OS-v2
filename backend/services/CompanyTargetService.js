const Company = require('../models/Company');
const Lead = require('../models/Lead');
const User = require('../models/User');

class CompanyTargetService {
  /**
   * Sales rep identifies/adds a target company
   */
  static async identifyCompany(companyData, identifiedBy) {
    const salesRep = await User.findById(identifiedBy);
    if (!salesRep) {
      throw new Error('User not found');
    }

    const company = new Company({
      companyName: companyData.companyName,
      industry: companyData.industry,
      website: companyData.website,
      location: companyData.location,
      employeeCount: companyData.employeeCount,
      revenue: companyData.revenue,
      potentialValue: companyData.potentialValue,
      priority: companyData.priority || 'medium',
      identifiedBy,
      assignedTo: identifiedBy,
      status: 'identified',
      approvalStatus: 'pending',
      revenueTarget: companyData.revenueTargetId,
      research: companyData.research || {},
      studyDocuments: companyData.studyDocuments || []
    });

    // Add activity
    company.activities.push({
      action: 'identified',
      description: `Company identified by ${salesRep.firstName} ${salesRep.lastName}`,
      performedBy: identifiedBy,
      timestamp: new Date()
    });

    await company.save();
    return company;
  }

  /**
   * Attach study documents to company
   */
  static async attachStudyDocuments(companyId, documents, uploadedBy) {
    const company = await Company.findById(companyId);
    if (!company) {
      throw new Error('Company not found');
    }

    const newDocuments = documents.map(doc => ({
      name: doc.name,
      documentType: doc.documentType || 'other',
      url: doc.url,
      filePath: doc.filePath,
      uploadedBy,
      uploadedAt: new Date(),
      description: doc.description
    }));

    company.studyDocuments.push(...newDocuments);

    // Add activity
    company.activities.push({
      action: 'documents_attached',
      description: `${newDocuments.length} study document(s) attached`,
      performedBy: uploadedBy,
      timestamp: new Date()
    });

    await company.save();
    return company;
  }

  /**
   * HOS reviews and approves/rejects company target
   */
  static async reviewCompany(companyId, hosId, approved, notes) {
    const company = await Company.findById(companyId);
    if (!company) {
      throw new Error('Company not found');
    }

    const hos = await User.findById(hosId);
    if (!hos || hos.role !== 'head-of-sales') {
      throw new Error('Only Head of Sales can review companies');
    }

    company.approvalStatus = approved ? 'approved' : 'rejected';
    company.approvalNotes = notes;
    company.approvedBy = hosId;
    company.approvalDate = new Date();

    if (approved) {
      company.status = 'approved';
    } else {
      company.status = 'rejected';
    }

    // Add activity
    company.activities.push({
      action: approved ? 'approved' : 'rejected',
      description: approved 
        ? 'Company approved by HOS' 
        : 'Company rejected by HOS',
      performedBy: hosId,
      timestamp: new Date()
    });

    await company.save();
    return company;
  }

  /**
   * Request revision from sales rep
   */
  static async requestRevision(companyId, hosId, feedback) {
    const company = await Company.findById(companyId);
    if (!company) {
      throw new Error('Company not found');
    }

    const hos = await User.findById(hosId);
    if (!hos || hos.role !== 'head-of-sales') {
      throw new Error('Only Head of Sales can request revisions');
    }

    company.approvalStatus = 'needs-revision';
    company.approvalNotes = feedback;
    company.status = 'researching';

    // Add activity
    company.activities.push({
      action: 'revision_requested',
      description: 'HOS requested revision',
      performedBy: hosId,
      timestamp: new Date()
    });

    await company.save();
    return company;
  }

  /**
   * Update company research/study information
   */
  static async updateResearch(companyId, userId, researchData) {
    const company = await Company.findById(companyId);
    if (!company) {
      throw new Error('Company not found');
    }

    company.research = {
      ...company.research,
      ...researchData
    };

    company.status = 'researching';

    // Add activity
    company.activities.push({
      action: 'research_updated',
      description: 'Company research information updated',
      performedBy: userId,
      timestamp: new Date()
    });

    await company.save();
    return company;
  }

  /**
   * Get companies pending HOS approval
   */
  static async getPendingApprovals(hosId) {
    const companies = await Company.find({
      approvalStatus: 'pending',
      isDeleted: false
    })
      .populate('identifiedBy', 'firstName lastName email')
      .populate('assignedTo', 'firstName lastName email')
      .populate('revenueTarget', 'targetAmount targetPeriod')
      .sort({ createdAt: -1 });

    return companies;
  }

  /**
   * Get companies by sales rep
   */
  static async getCompaniesBySalesRep(salesRepId, filters = {}) {
    const query = {
      $or: [
        { identifiedBy: salesRepId },
        { assignedTo: salesRepId }
      ],
      isDeleted: false,
      ...filters
    };

    const companies = await Company.find(query)
      .populate('identifiedBy', 'firstName lastName email')
      .populate('assignedTo', 'firstName lastName email')
      .populate('approvedBy', 'firstName lastName email')
      .populate('revenueTarget', 'targetAmount targetPeriod')
      .sort({ createdAt: -1 });

    return companies;
  }

  /**
   * Assign company to sales rep
   */
  static async assignToSalesRep(companyId, salesRepId, assignedBy) {
    const company = await Company.findById(companyId);
    if (!company) {
      throw new Error('Company not found');
    }

    const salesRep = await User.findById(salesRepId);
    if (!salesRep) {
      throw new Error('Sales rep not found');
    }

    company.assignedTo = salesRepId;
    
    // Add activity
    company.activities.push({
      action: 'assigned',
      description: `Company assigned to ${salesRep.firstName} ${salesRep.lastName}`,
      performedBy: assignedBy,
      timestamp: new Date()
    });

    await company.save();
    return company;
  }

  /**
   * Get companies by approval status
   */
  static async getCompaniesByStatus(status, filters = {}) {
    const query = {
      approvalStatus: status,
      isDeleted: false,
      ...filters
    };

    const companies = await Company.find(query)
      .populate('identifiedBy', 'firstName lastName email')
      .populate('assignedTo', 'firstName lastName email')
      .populate('approvedBy', 'firstName lastName email')
      .populate('revenueTarget', 'targetAmount targetPeriod')
      .sort({ createdAt: -1 });

    return companies;
  }
}

module.exports = CompanyTargetService;
