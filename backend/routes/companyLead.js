const express = require('express');
const router = express.Router();
const { authenticateToken, authorizeRoles } = require('../middleware/auth');
const companyLeadController = require('../controllers/companyLeadController');

// ============ COMPANY ROUTES ============

// Create company (Sales Rep)
router.post(
  '/companies',
  authenticateToken,
  authorizeRoles('service-onboarding', 'head-of-sales', 'ceo', 'co-founder'),
  companyLeadController.createCompany
);

// Get all companies
router.get(
  '/companies',
  authenticateToken,
  authorizeRoles('service-onboarding', 'head-of-sales', 'ceo', 'co-founder'),
  companyLeadController.getAllCompanies
);

// Get my companies
router.get(
  '/companies/my-companies',
  authenticateToken,
  authorizeRoles('service-onboarding', 'head-of-sales'),
  companyLeadController.getMyCompanies
);

// Get single company
router.get(
  '/companies/:id',
  authenticateToken,
  authorizeRoles('service-onboarding', 'head-of-sales', 'ceo', 'co-founder'),
  companyLeadController.getCompany
);

// Update company
router.put(
  '/companies/:id',
  authenticateToken,
  authorizeRoles('service-onboarding', 'head-of-sales', 'ceo', 'co-founder'),
  companyLeadController.updateCompany
);

// Approve/Reject company (HOS only)
router.post(
  '/companies/:id/approve',
  authenticateToken,
  authorizeRoles('head-of-sales', 'ceo', 'co-founder'),
  companyLeadController.approveCompany
);

// Delete company
router.delete(
  '/companies/:id',
  authenticateToken,
  authorizeRoles('service-onboarding', 'head-of-sales', 'ceo', 'co-founder'),
  companyLeadController.deleteCompany
);

// ============ LEAD ROUTES ============

// Create lead (Sales Rep)
router.post(
  '/leads',
  authenticateToken,
  authorizeRoles('service-onboarding', 'head-of-sales', 'ceo', 'co-founder'),
  companyLeadController.createLead
);

// Get all leads
router.get(
  '/leads',
  authenticateToken,
  authorizeRoles('service-onboarding', 'head-of-sales', 'ceo', 'co-founder'),
  companyLeadController.getAllLeads
);

// Get my leads
router.get(
  '/leads/my-leads',
  authenticateToken,
  authorizeRoles('service-onboarding', 'head-of-sales'),
  companyLeadController.getMyLeads
);

// Get single lead
router.get(
  '/leads/:id',
  authenticateToken,
  authorizeRoles('service-onboarding', 'head-of-sales', 'ceo', 'co-founder'),
  companyLeadController.getLead
);

// Update lead
router.put(
  '/leads/:id',
  authenticateToken,
  authorizeRoles('service-onboarding', 'head-of-sales', 'ceo', 'co-founder'),
  companyLeadController.updateLead
);

// Add follow-up
router.post(
  '/leads/:id/followup',
  authenticateToken,
  authorizeRoles('service-onboarding', 'head-of-sales', 'ceo', 'co-founder'),
  companyLeadController.addFollowUp
);

// Add meeting
router.post(
  '/leads/:id/meeting',
  authenticateToken,
  authorizeRoles('service-onboarding', 'head-of-sales', 'ceo', 'co-founder'),
  companyLeadController.addMeeting
);

// Delete lead
router.delete(
  '/leads/:id',
  authenticateToken,
  authorizeRoles('service-onboarding', 'head-of-sales', 'ceo', 'co-founder'),
  companyLeadController.deleteLead
);

// ============ SALES REP DASHBOARD ============

router.get(
  '/dashboard/sales-rep',
  authenticateToken,
  authorizeRoles('service-onboarding'),
  companyLeadController.getSalesRepDashboard
);

module.exports = router;
