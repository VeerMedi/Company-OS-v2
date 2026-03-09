import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Users,
  TrendingUp,
  DollarSign,
  Target,
  Award,
  UserPlus,
  Phone,
  Mail,
  Calendar,
  Filter,
  Download,
  Plus,
  Eye,
  Edit,
  ClipboardCheck,
  BarChart3,
  PieChart,
  Activity,
  Building2,
  CheckCircle,
  X,
  AlertCircle,
  Upload,
  FileUp,
  FileDown,
  Search,
  Trash2
} from 'lucide-react';
import DashboardLayout from '../components/DashboardLayout';
import AttendancePunch from '../components/AttendancePunch';
import AttendanceManagement from '../components/AttendanceManagement';
import ComprehensiveMonitoring from '../components/ComprehensiveMonitoring';
import HOSLeadManagement from '../components/HOSLeadManagement';
import SalesSummaryWidgets from '../components/SalesSummaryWidgets';
import RevenueSummaryWidgets from '../components/RevenueSummaryWidgets';
import api from '../utils/api';
import { formatDate } from '../utils/helpers';
import { showToast } from '../utils/toast';

// CSV Helper Functions
const parseCSV = (csvText) => {
  const lines = csvText.split('\n').filter(line => line.trim());
  if (lines.length < 2) return [];

  const headers = lines[0].split(',').map(h => h.trim());
  const data = [];

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',').map(v => v.trim());
    const row = {};
    headers.forEach((header, index) => {
      row[header] = values[index] || '';
    });
    data.push(row);
  }

  return data;
};

const generateCompanyCSVTemplate = () => {
  // Use user-friendly headers (these will be the columns expected in CSV import/export)
  const headers = [
    'Company Name',
    'Company Overview / Description',
    'Industry',
    'Working Employees',
    'Country / Region',
    'Geographical Hotspots',
    'Annual Revenue (USD)',
    'Website',
    'Current Tech Stack',
    'Current Pain Points',
    'Automation / SaaS Solutions Used',
    'Expected ROI Impact (Qualitative/%)',
    'Key Challenges',
    'How Hustle House Can Help (Pitch Angle)',
    'Additional Notes / Comments',
    'WRT ROI- Priority Level',
    'Proof of concept',
    'Latest company/Industry News'
  ];
  return headers.join(',') + '\n';
};

const generateLeadCSVTemplate = () => {
  const headers = [
    'companyName',
    'leadName',
    'designation',
    'department',
    'email',
    'phone',
    'linkedIn',
    'authorityLevel',
    'decisionPower',
    'potentialValue',
    'serviceInterest',
    'requirements'
  ];
  return headers.join(',') + '\n';
};

const downloadCSV = (csvContent, filename) => {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

// Helper function to normalize employee count to backend enum values
const normalizeEmployeeCount = (value) => {
  if (!value) return 'unknown';
  const str = value.toString().trim();

  // Map common formats to backend enum
  const mapping = {
    '1-10': '1-10',
    '11-50': '11-50',
    '51-200': '51-200',
    '201-500': '201-500',
    '501-1000': '501-1000',
    '500+': '501-1000',
    '1000+': '1000+',
    '1001+': '1000+',
  };

  return mapping[str] || 'unknown';
};

// Helper function to normalize revenue to backend enum values
const normalizeRevenue = (value) => {
  if (!value) return 'unknown';
  const str = value.toString().trim().toUpperCase();

  // Map common revenue formats to backend enum
  // Backend enum: ['<1Cr', '1-5Cr', '5-10Cr', '10-50Cr', '50-100Cr', '100Cr+', 'unknown']
  const mapping = {
    '$1M - $5M': '1-5Cr',
    '$5M - $10M': '5-10Cr',
    '$10M - $50M': '10-50Cr',
    '$50M - $100M': '50-100Cr',
    '$100M+': '100Cr+',
    '<$1M': '<1Cr',
    'UNDER $1M': '<1Cr',
    'UNKNOWN': 'unknown',
  };

  return mapping[str] || 'unknown';
};

const HeadOfSalesDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  
  // Persist current view in localStorage
  const [currentView, setCurrentView] = useState(() => {
    const savedView = localStorage.getItem('headOfSalesDashboardView');
    return savedView || 'dashboard';
  });

  // Save view to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('headOfSalesDashboardView', currentView);
  }, [currentView]);

  // State for sales data
  const [teamStats, setTeamStats] = useState([]);
  const [overallStats, setOverallStats] = useState({});
  const [salesTeam, setSalesTeam] = useState([]);
  const [analytics, setAnalytics] = useState({});
  const [recentSales, setRecentSales] = useState([]);
  const [targets, setTargets] = useState([]);

  // New state for revenue targets and company approvals
  const [revenueTargets, setRevenueTargets] = useState([]);
  const [pendingCompanies, setPendingCompanies] = useState([]);
  const [recentActivities, setRecentActivities] = useState([]);
  const [selectedRevenueTarget, setSelectedRevenueTarget] = useState(null);
  const [showStrategyModal, setShowStrategyModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showCompanyApprovalModal, setShowCompanyApprovalModal] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState(null);

  // New state for sales management
  const [leads, setLeads] = useState([]);
  const [salesTasks, setSalesTasks] = useState([]);
  const [pipelineStats, setPipelineStats] = useState({});
  const [showCreateTaskModal, setShowCreateTaskModal] = useState(false);
  const [approvalNotes, setApprovalNotes] = useState('');

  // Import/Export states for companies
  const [showCompanyImportModal, setShowCompanyImportModal] = useState(false);
  const [showCompanyExportModal, setShowCompanyExportModal] = useState(false);
  const [companyImportFile, setCompanyImportFile] = useState(null);
  const [importedCompanies, setImportedCompanies] = useState([]);
  const [isImporting, setIsImporting] = useState(false);
  const [selectedCompaniesForAssignment, setSelectedCompaniesForAssignment] = useState([]);
  const [bulkAssignTo, setBulkAssignTo] = useState('');
  const [companyStatusFilter, setCompanyStatusFilter] = useState('all'); // Filter for company approval status

  // Import/Export states for leads
  const [showLeadImportModal, setShowLeadImportModal] = useState(false);
  const [leadImportFile, setLeadImportFile] = useState(null);
  const [importedLeads, setImportedLeads] = useState([]);
  const [isImportingLeads, setIsImportingLeads] = useState(false);

  // Search states
  const [companySearchQuery, setCompanySearchQuery] = useState('');
  const [leadSearchQuery, setLeadSearchQuery] = useState('');

  // Modal states
  const [showCreateTargetModal, setShowCreateTargetModal] = useState(false);
  const [isCreatingTarget, setIsCreatingTarget] = useState(false);
  const [selectedMember, setSelectedMember] = useState(null);
  const [cofounderRevenueTargets, setCofounderRevenueTargets] = useState([]);
  const [selectedRevenueTargetId, setSelectedRevenueTargetId] = useState('');

  const [newTarget, setNewTarget] = useState({
    userId: '',
    revenueTargetId: '',
    targetPeriod: 'monthly',
    startDate: '',
    endDate: '',
    revenueTarget: '',
    companiesTarget: '',
    leadsTarget: '',
    conversionsTarget: '',
    notes: ''
  });

  // Sidebar actions
  const sidebarActions = [
    {
      label: 'Dashboard',
      icon: BarChart3,
      onClick: () => setCurrentView('dashboard'),
      active: currentView === 'dashboard'
    },
    {
      label: 'Complete Monitoring',
      icon: Activity,
      onClick: () => setCurrentView('comprehensive-monitoring'),
      active: currentView === 'comprehensive-monitoring'
    },
    {
      label: 'Lead Management',
      icon: UserPlus,
      onClick: () => setCurrentView('lead-management'),
      active: currentView === 'lead-management'
    },
    {
      label: 'Revenue Overview',
      icon: DollarSign,
      onClick: () => setCurrentView('revenue-overview'),
      active: currentView === 'revenue-overview'
    },
    {
      label: 'Revenue Targets',
      icon: Target,
      onClick: () => setCurrentView('revenue-targets'),
      active: currentView === 'revenue-targets'
    },
    {
      label: 'Company Approvals',
      icon: ClipboardCheck,
      onClick: () => setCurrentView('company-approvals'),
      active: currentView === 'company-approvals'
    },
    {
      label: 'Team Overview',
      icon: Users,
      onClick: () => setCurrentView('team-overview'),
      active: currentView === 'team-overview'
    },
    {
      label: 'Sales Pipeline',
      icon: TrendingUp,
      onClick: () => setCurrentView('pipeline'),
      active: currentView === 'pipeline'
    },
    {
      label: 'Targets & KPIs',
      icon: Target,
      onClick: () => setCurrentView('targets'),
      active: currentView === 'targets'
    },
    {
      label: 'My Attendance',
      icon: ClipboardCheck,
      onClick: () => setCurrentView('my-attendance'),
      active: currentView === 'my-attendance'
    },
    {
      label: 'Team Attendance',
      icon: Users,
      onClick: () => setCurrentView('team-attendance'),
      active: currentView === 'team-attendance'
    }
  ];

  // Fetch all data
  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    setIsLoading(true);
    try {
      const [
        teamResponse,
        analyticsResponse,
        salesResponse,
        targetsResponse,
        hosDashboardResponse,
        // New API calls for sales management
        companiesResponse,
        leadsResponse,
        salesTasksResponse,
        pipelineResponse
      ] = await Promise.all([
        api.get('/sales/team-overview').catch(err => {
          console.error('Team overview error:', err);
          return { data: { teamStats: [], overallStats: {}, salesTeam: [] } };
        }),
        api.get('/sales/analytics').catch(err => {
          console.error('Analytics error:', err);
          return { data: { data: {} } };
        }),
        api.get('/sales/all').catch(err => {
          console.error('Sales error:', err);
          return { data: { data: [] } };
        }),
        api.get('/sales/targets/all').catch(err => {
          console.error('Targets error:', err);
          return { data: { data: [] } };
        }),
        api.get('/revenue/dashboard/hos').catch(err => {
          console.error('Revenue dashboard error:', err);
          return { data: { data: { targets: [], pendingApprovals: { companies: [] }, recentActivities: [] } } };
        }),
        // New endpoints - Get all companies instead of just pending
        api.get('/companies/all').catch(err => {
          console.error('Companies error:', err);
          return { data: { data: [] } };
        }),
        api.get('/leads/all').catch(err => {
          console.error('Leads error:', err);
          return { data: { data: [] } };
        }),
        api.get('/sales-tasks/all').catch(err => {
          console.error('Sales tasks error:', err);
          return { data: { data: { tasks: [] } } };
        }),
        api.get('/leads/pipeline/overview').catch(err => {
          console.error('Pipeline error:', err);
          return { data: { data: {} } };
        })
      ]);

      setTeamStats(teamResponse.data.teamStats || []);
      setOverallStats(teamResponse.data.overallStats || {});
      setSalesTeam(teamResponse.data.salesTeam || []);
      setAnalytics(analyticsResponse.data.data || {});
      setRecentSales(salesResponse.data.data || []);
      // Fix: Backend returns targets in data.data, not data directly
      setTargets(targetsResponse.data.data || targetsResponse.data || []);

      // Debug logging
      console.log('Targets Response:', targetsResponse.data);
      console.log('Targets Set:', targetsResponse.data.data || targetsResponse.data || []);

      // Updated data from HOS dashboard and new endpoints
      const hosData = hosDashboardResponse.data.data || {};
      setRevenueTargets(hosData.targets || []);

      // Use new companies endpoint data
      const companiesPending = companiesResponse.data.data || [];
      console.log('📊 Companies fetched:', companiesPending.length);
      console.log('📋 Sample company data:', companiesPending[0]);
      setPendingCompanies(companiesPending);

      // Set leads data - backend returns array directly in data.data
      const leadsData = leadsResponse.data.data || [];
      setLeads(Array.isArray(leadsData) ? leadsData : []);

      // Set sales tasks data
      const tasksData = salesTasksResponse.data.data || {};
      setSalesTasks(tasksData.tasks || []);

      // Set pipeline stats
      const pipelineData = pipelineResponse.data.data || {};
      setPipelineStats(pipelineData);

      setRecentActivities(hosData.recentActivities || []);
    } catch (error) {
      console.error('Error fetching sales data:', error);
      showToast.error('Failed to fetch sales data');
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch revenue targets for dropdown
  const fetchRevenueTargets = async () => {
    try {
      console.log('Fetching revenue targets...');
      const response = await api.get('/revenue/targets');
      console.log('Revenue targets response:', response.data);
      if (response.data.success && response.data.data) {
        console.log('Setting revenue targets:', response.data.data.length, 'targets found');
        setCofounderRevenueTargets(response.data.data);
      } else {
        console.log('No revenue targets found or invalid response');
        setCofounderRevenueTargets([]);
      }
    } catch (error) {
      console.error('Error fetching revenue targets:', error);
      setCofounderRevenueTargets([]);
    }
  };

  // Open modal and fetch revenue targets
  const handleOpenCreateTargetModal = async () => {
    setShowCreateTargetModal(true);
    await fetchRevenueTargets();
  };

  // Create sales target
  const handleCreateTarget = async (e) => {
    e.preventDefault();

    // Validation
    if (!newTarget.userId) {
      showToast.error('Please select a team member');
      return;
    }

    if (!newTarget.startDate || !newTarget.endDate) {
      showToast.error('Please set start and end dates');
      return;
    }

    if (new Date(newTarget.endDate) <= new Date(newTarget.startDate)) {
      showToast.error('End date must be after start date');
      return;
    }

    if (!newTarget.revenueTarget || Number(newTarget.revenueTarget) <= 0) {
      showToast.error('Please set a valid revenue target');
      return;
    }

    setIsCreatingTarget(true);

    try {
      const targetData = {
        userId: newTarget.userId,
        revenueTargetId: newTarget.revenueTargetId || undefined,
        targetPeriod: newTarget.targetPeriod,
        startDate: newTarget.startDate,
        endDate: newTarget.endDate,
        revenueTarget: Number(newTarget.revenueTarget),
        companiesTarget: newTarget.companiesTarget ? Number(newTarget.companiesTarget) : 0,
        leadsTarget: newTarget.leadsTarget ? Number(newTarget.leadsTarget) : 0,
        conversionsTarget: newTarget.conversionsTarget ? Number(newTarget.conversionsTarget) : 0,
        notes: newTarget.notes || ''
      };

      const response = await api.post('/sales/targets/create', targetData);

      if (response.data.success) {
        showToast.success('Sales target created successfully! 🎯');

        // Get the assigned team member's name for the notification message
        const assignedMember = salesTeam.find(m => m._id === newTarget.userId);
        if (assignedMember) {
          showToast.success(`📧 Email notification sent to ${assignedMember.firstName} ${assignedMember.lastName}`, {
            duration: 4000
          });
        }

        setShowCreateTargetModal(false);

        // Reset form
        setNewTarget({
          userId: '',
          revenueTargetId: '',
          targetPeriod: 'monthly',
          startDate: '',
          endDate: '',
          revenueTarget: '',
          companiesTarget: '',
          leadsTarget: '',
          conversionsTarget: '',
          notes: ''
        });
        setSelectedRevenueTargetId('');

        // Refresh data
        await fetchAllData();
      }
    } catch (error) {
      console.error('Error creating target:', error);
      const errorMessage = error.response?.data?.message || 'Failed to create target';
      showToast.error(errorMessage);
    } finally {
      setIsCreatingTarget(false);
    }
  };

  // Respond to Revenue Target
  const handleRespondToTarget = async (targetId, status, message) => {
    try {
      await api.post(`/revenue/targets/${targetId}/respond`, { status, message });
      showToast.success('Response submitted successfully');
      fetchAllData();
    } catch (error) {
      console.error('Error responding to target:', error);
      showToast.error('Failed to submit response');
    }
  };

  // Submit Strategy for Revenue Target
  const handleSubmitStrategy = async (targetId, strategyData) => {
    try {
      const response = await api.post(`/revenue/targets/${targetId}/strategy`, strategyData);
      showToast.success('Strategy submitted successfully');

      // Show email notification toast
      if (response.data.emailSent && response.data.emailRecipient) {
        setTimeout(() => {
          showToast.success(`📧 Notification email sent to ${response.data.emailRecipient}`);
        }, 500);
      }

      setShowStrategyModal(false);
      setSelectedRevenueTarget(null);
      fetchAllData();
    } catch (error) {
      console.error('Error submitting strategy:', error);
      showToast.error('Failed to submit strategy');
    }
  };

  // Approve/Reject Company
  const handleApproveCompany = async (companyId, approvalStatus, approvalNotes, assignedTo) => {
    try {
      let response;
      if (approvalStatus === 'needs-revision') {
        // Use request revision endpoint
        response = await api.put(`/companies/${companyId}/request-revision`, {
          notes: approvalNotes
        });
        showToast.success('Revision requested successfully');
      } else {
        // Use review endpoint for approve/reject
        response = await api.put(`/companies/${companyId}/review`, {
          approved: approvalStatus === 'approved',
          notes: approvalNotes,
          assignTo: assignedTo // Add assignment parameter
        });
        showToast.success(`Company ${approvalStatus} successfully`);
      }

      // Show email notification toast if email was sent
      if (response.data.emailSent) {
        setTimeout(() => {
          showToast.success('📧 Email notification sent to team member');
        }, 500);
      }

      setShowCompanyApprovalModal(false);
      setSelectedCompany(null);
      setApprovalNotes('');
      fetchAllData();
    } catch (error) {
      console.error('Error processing company:', error);
      showToast.error(error.response?.data?.message || 'Failed to process company approval');
    }
  };

  // Delete Sales Target
  const handleDeleteTarget = async (targetId) => {
    if (!window.confirm('Are you sure you want to delete this target? This action cannot be undone.')) {
      return;
    }

    try {
      await api.delete(`/sales/targets/${targetId}`);
      showToast.success('Target deleted successfully');
      fetchAllData();
    } catch (error) {
      console.error('Error deleting target:', error);
      showToast.error(error.response?.data?.message || 'Failed to delete target');
    }
  };

  // Delete Company
  const handleDeleteCompany = async (companyId, companyName) => {
    if (window.confirm(`Are you sure you want to delete "${companyName}"? This action cannot be undone.`)) {
      try {
        await api.delete(`/companies/${companyId}`);
        showToast.success('Company deleted successfully');
        fetchAllData();
      } catch (error) {
        showToast.error(error.response?.data?.message || 'Failed to delete company');
      }
    }
  };

  // Company Import/Export Functions
  const handleCompanyFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.name.endsWith('.csv')) {
      showToast.error('Please upload a CSV file');
      return;
    }

    setCompanyImportFile(file);
    const reader = new FileReader();

    reader.onload = (event) => {
      try {
        const csvText = event.target.result;
        const parsedData = parseCSV(csvText);

        console.log('📄 Parsed CSV rows:', parsedData.length);
        console.log('📋 First row headers:', Object.keys(parsedData[0] || {}));

        // Transform CSV data to company format
        const companies = parsedData.map((row, index) => {
          // Support both user-friendly headers and machine keys
          const get = (friendly, machine) => {
            return row[friendly] !== undefined ? row[friendly] : (row[machine] !== undefined ? row[machine] : '');
          };

          const companyName = (get('Company Name', 'companyName') || '').toString().trim();
          const companyOverview = get('Company Overview / Description', 'overview');
          const industry = get('Industry', 'industry');
          const employeeCount = get('Working Employees', 'employeeCount') || 'unknown';
          const country = get('Country / Region', 'country') || 'India';
          const geographicalHotspots = get('Geographical Hotspots', 'geographicalHotspots');
          const annualRevenueUSD = get('Annual Revenue (USD)', 'annualRevenueUSD');
          const website = get('Website', 'website');
          const currentTechStack = get('Current Tech Stack', 'currentTechStack');
          const currentPainPoints = get('Current Pain Points', 'currentPainPoints') || get('Current Pain Points', 'painPoints') || '';
          const automationSaaSUsed = get('Automation / SaaS Solutions Used', 'automationSaaSUsed');
          const expectedROIImpact = get('Expected ROI Impact (Qualitative/%)', 'expectedROIImpact');
          const keyChallenges = get('Key Challenges', 'keyChallenges');
          const howHustleHouseCanHelp = get('How Hustle House Can Help (Pitch Angle)', 'howHustleHouseCanHelp');
          const additionalNotes = get('Additional Notes / Comments', 'additionalNotes');
          const wrtRoiPriorityLevel = get('WRT ROI- Priority Level', 'wrtRoiPriorityLevel');
          const proofOfConcept = get('Proof of concept', 'proofOfConcept');
          const latestNews = get('Latest company/Industry News', 'latestNews');

          const company = {
            id: `import-${index}`,
            companyName,
            overview: companyOverview,
            industry,
            website,
            location: {
              city: '',
              state: '',
              country
            },
            employeeCount,
            annualRevenueUSD,
            geographicalHotspots,
            currentTechStack,
            automationSaaSUsed,
            expectedROIImpact,
            keyChallenges,
            howHustleHouseCanHelp,
            additionalNotes,
            wrtRoiPriorityLevel,
            proofOfConcept,
            latestNews,
            research: {
              keyDecisionMakers: get('Key Decision Makers', 'keyDecisionMakers') || '',
              painPoints: currentPainPoints,
              notes: additionalNotes || get('notes', 'notes') || ''
            },
            potentialValue: Number(get('Potential Value', 'potentialValue')) || 0,
            priority: get('Priority', 'priority') || 'medium',
            assignedTo: '',
            isValid: !!companyName
          };

          if (index === 0) {
            console.log('🏢 Sample company parsed:', company);
          }

          return company;
        });

        const validCompanies = companies.filter(c => c.isValid);
        console.log(`✅ Valid companies: ${validCompanies.length} out of ${companies.length}`);

        setImportedCompanies(validCompanies);

        if (validCompanies.length === 0) {
          showToast.error('No valid companies found in CSV');
        } else {
          showToast.success(`${validCompanies.length} companies loaded from CSV`);
        }
      } catch (error) {
        console.error('❌ Error parsing CSV:', error);
        showToast.error('Failed to parse CSV file');
      }
    };

    reader.readAsText(file);
  };

  const handleBulkImportCompanies = async () => {
    if (importedCompanies.length === 0) {
      showToast.error('No companies to import');
      return;
    }

    // Check if all companies have assignedTo
    const unassigned = importedCompanies.filter(c => !c.assignedTo);
    if (unassigned.length > 0) {
      showToast.error('Please assign all companies to a sales representative');
      return;
    }

    setIsImporting(true);

    try {
      console.log('📤 Importing companies:', importedCompanies.length);

      const payload = {
        companies: importedCompanies.map(c => {
          const company = {
            companyName: c.companyName,
            overview: c.overview,
            industry: c.industry,
            website: c.website,
            location: c.location,
            employeeCount: normalizeEmployeeCount(c.employeeCount),
            revenue: normalizeRevenue(c.annualRevenueUSD || c.revenue),
            annualRevenueUSD: c.annualRevenueUSD,
            geographicalHotspots: c.geographicalHotspots,
            currentTechStack: c.currentTechStack,
            automationSaaSUsed: c.automationSaaSUsed,
            expectedROIImpact: c.expectedROIImpact,
            keyChallenges: c.keyChallenges,
            howHustleHouseCanHelp: c.howHustleHouseCanHelp,
            additionalNotes: c.additionalNotes,
            wrtRoiPriorityLevel: c.wrtRoiPriorityLevel,
            proofOfConcept: c.proofOfConcept,
            latestNews: c.latestNews,
            potentialValue: c.potentialValue,
            priority: c.priority,
            research: c.research,
            assignedTo: c.assignedTo,
            approvalStatus: 'approved',
            status: 'approved'
          };
          console.log('📦 Company payload:', company);
          return company;
        })
      };

      console.log('🚀 Sending bulk import request:', payload);

      const response = await api.post('/companies/bulk-import', payload);

      console.log('✅ Import response:', response.data);

      if (response.data.success) {
        const created = response.data.data.created;
        const skipped = response.data.data.skipped;
        const errors = response.data.data.errors;

        if (created > 0) {
          showToast.success(`Successfully imported ${created} companies${skipped > 0 ? ` (${skipped} skipped)` : ''}`);
        } else {
          showToast.info(`No companies imported. ${skipped} already exist.`);
        }

        if (errors && errors.length > 0) {
          console.error('Import errors:', errors);
          errors.forEach(err => {
            console.error(`❌ ${err.company}: ${err.error}`);
          });
        }

        setShowCompanyImportModal(false);
        setImportedCompanies([]);
        setCompanyImportFile(null);
        await fetchAllData();
      } else {
        showToast.error('Import failed: ' + (response.data.message || 'Unknown error'));
      }
    } catch (error) {
      console.error('❌ Error importing companies:', error);
      console.error('Error response:', error.response?.data);
      showToast.error(error.response?.data?.message || 'Failed to import companies');
    } finally {
      setIsImporting(false);
    }
  };

  const handleExportCompanies = () => {
    if (pendingCompanies.length === 0) {
      showToast.error('No companies to export');
      return;
    }

    // Generate CSV content using the 18 requested headers
    const headers = [
      'Company Name',
      'Company Overview / Description',
      'Industry',
      'Working Employees',
      'Country / Region',
      'Geographical Hotspots',
      'Annual Revenue (USD)',
      'Website',
      'Current Tech Stack',
      'Current Pain Points',
      'Automation / SaaS Solutions Used',
      'Expected ROI Impact (Qualitative/%)',
      'Key Challenges',
      'How Hustle House Can Help (Pitch Angle)',
      'Additional Notes / Comments',
      'WRT ROI- Priority Level',
      'Proof of concept',
      'Latest company/Industry News'
    ];

    const rows = pendingCompanies.map(company => [
      company.companyName || '',
      company.overview || company.research?.notes || '',
      company.industry || '',
      company.employeeCount || '',
      company.location?.country || company.location?.city || '',
      company.geographicalHotspots || '',
      company.annualRevenueUSD || company.revenue || '',
      company.website || '',
      company.currentTechStack || '',
      company.research?.painPoints || '',
      company.automationSaaSUsed || '',
      company.expectedROIImpact || '',
      company.keyChallenges || '',
      company.howHustleHouseCanHelp || '',
      company.additionalNotes || '',
      company.wrtRoiPriorityLevel || '',
      company.proofOfConcept || '',
      company.latestNews || ''
    ]);

    const csvContent = [headers.join(','), ...rows.map(row => row.map(cell => `"${(cell || '').toString().replace(/"/g, '""')}"`).join(','))].join('\n');

    const timestamp = new Date().toISOString().split('T')[0];
    downloadCSV(csvContent, `companies-export-${timestamp}.csv`);
    showToast.success('Companies exported successfully');
  };

  const handleDownloadCompanyTemplate = () => {
    const template = generateCompanyCSVTemplate();
    const exampleRow = '"Acme Corporation","Leading technology company specializing in AI and automation solutions","Technology","201-500","India","Mumbai, Bangalore, Delhi NCR","$10M - $50M","https://acmecorp.com","Salesforce, HubSpot, Custom CRM","Manual processes, data silos, inefficient workflows","Salesforce, Monday.com, Slack","40% cost reduction, 3x productivity improvement","Scaling operations, integrating disparate systems","We can provide end-to-end automation using our proprietary AI platform, reducing manual work by 60%","Company is expanding rapidly and needs scalable solutions","high","Pilot automation for sales team (3 months)","Recently raised Series B funding, expanding to 3 new cities"\n';
    downloadCSV(template + exampleRow, 'company-import-template.csv');
    showToast.success('Template downloaded');
  };

  // Lead Import/Export Functions
  const generateLeadCSVTemplate = () => {
    const headers = [
      'Company Name',
      'Industry',
      'Prospect Name',
      'Designation',
      'Department',
      'Location',
      'LinkedIn ID',
      'Contact Number',
      'Email Address',
      'No. of Touchpoints',
      'Last Contact Date',
      'Remark',
      'Lead Stage (New / Contacted / Nurturing / Closed)',
      'Lead Owner (Sales Rep)'
    ];
    return headers.join(',') + '\n';
  };

  const handleLeadFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.name.endsWith('.csv')) {
      showToast.error('Please upload a CSV file');
      return;
    }

    setLeadImportFile(file);
    const reader = new FileReader();

    reader.onload = (event) => {
      try {
        const csvText = event.target.result;
        const parsedData = parseCSV(csvText);

        console.log('📄 Parsed Lead CSV rows:', parsedData.length);
        console.log('📋 First row headers:', Object.keys(parsedData[0] || {}));

        const leads = parsedData.map((row, index) => {
          const get = (friendly, machine) => {
            return row[friendly] !== undefined ? row[friendly] : (row[machine] !== undefined ? row[machine] : '');
          };

          const companyName = (get('Company Name', 'companyName') || '').toString().trim();
          const prospectName = (get('Prospect Name', 'prospectName') || get('Prospect Name', 'name') || '').toString().trim();
          const designation = get('Designation', 'designation');
          const department = get('Department', 'department');
          const location = get('Location', 'location');
          const linkedIn = get('LinkedIn ID', 'linkedIn') || get('LinkedIn ID', 'linkedInId');
          const phone = get('Contact Number', 'phone') || get('Contact Number', 'contactNumber');
          const email = get('Email Address', 'email') || get('Email Address', 'emailAddress');
          const touchpoints = get('No. of Touchpoints', 'touchpoints') || '0';
          const lastContactDate = get('Last Contact Date', 'lastContactDate');
          const remark = get('Remark', 'remark') || get('Remark', 'remarks');
          const leadStage = get('Lead Stage (New / Contacted / Nurturing / Closed)', 'leadStage') || 'new';
          const leadOwner = get('Lead Owner (Sales Rep)', 'leadOwner') || '';
          const industry = get('Industry', 'industry') || '';

          // Map lead stage to backend enum
          let mappedStage = 'lead';
          const stageStr = leadStage.toString().toLowerCase().trim();
          if (stageStr.includes('new')) mappedStage = 'lead';
          else if (stageStr.includes('contacted')) mappedStage = 'contacted';
          else if (stageStr.includes('nurturing')) mappedStage = 'nurturing';
          else if (stageStr.includes('closed')) mappedStage = 'closed-won';

          // Parse potential value from remark or default
          let potentialValue = 0;
          const remarkStr = (remark || '').toString().toLowerCase();
          if (remarkStr.includes('high intent') || remarkStr.includes('ready to buy')) {
            potentialValue = 500000; // Default for high intent
          } else if (remarkStr.includes('budget discussion')) {
            potentialValue = 300000; // Default for budget discussion
          } else if (remarkStr.includes('demo') || remarkStr.includes('interested')) {
            potentialValue = 200000; // Default for interested
          } else {
            potentialValue = 100000; // Default base value
          }

          // Determine lead type based on touchpoints and stage
          let leadType = 'cold';
          const touchpointCount = parseInt(touchpoints) || 0;
          if (touchpointCount >= 7 || stageStr.includes('nurturing') || remarkStr.includes('high intent')) {
            leadType = 'hot';
          } else if (touchpointCount >= 3 || stageStr.includes('contacted')) {
            leadType = 'warm';
          }

          const lead = {
            id: `lead-import-${index}`,
            companyName,
            industry,
            name: prospectName,
            designation,
            department,
            location,
            linkedIn,
            phone,
            email,
            touchpoints: touchpointCount,
            lastContactDate: lastContactDate || null,
            remark,
            stage: mappedStage,
            status: stageStr.includes('nurturing') ? 'nurturing' : stageStr.includes('closed') ? 'won' : 'active',
            potentialValue,
            leadType,
            leadSource: 'import',
            leadOwner: '',
            assignedTo: '',
            isValid: !!(companyName && prospectName && designation)
          };

          if (index === 0) {
            console.log('👤 Sample lead parsed:', lead);
            console.log('💰 Potential Value:', potentialValue);
            console.log('🏷️ Lead Type:', leadType);
            console.log('📝 Remark:', remark);
          }

          return lead;
        });

        const validLeads = leads.filter(l => l.isValid);
        console.log(`✅ Valid leads: ${validLeads.length} out of ${leads.length}`);

        setImportedLeads(validLeads);

        if (validLeads.length === 0) {
          showToast.error('No valid leads found in CSV');
        } else {
          showToast.success(`${validLeads.length} leads loaded from CSV`);
        }
      } catch (error) {
        console.error('❌ Error parsing lead CSV:', error);
        showToast.error('Failed to parse CSV file');
      }
    };

    reader.readAsText(file);
  };

  const handleBulkImportLeads = async () => {
    if (importedLeads.length === 0) {
      showToast.error('No leads to import');
      return;
    }

    const unassigned = importedLeads.filter(l => !l.assignedTo);
    if (unassigned.length > 0) {
      showToast.error('Please assign all leads to a sales representative');
      return;
    }

    setIsImportingLeads(true);

    try {
      console.log('📤 Importing leads:', importedLeads.length);

      const payload = {
        leads: importedLeads.map(l => ({
          companyName: l.companyName,
          industry: l.industry,
          name: l.name,
          designation: l.designation,
          department: l.department,
          location: l.location,
          linkedIn: l.linkedIn,
          phone: l.phone,
          email: l.email,
          touchpoints: l.touchpoints,
          lastContactDate: l.lastContactDate,
          remark: l.remark,
          stage: l.stage,
          status: l.status,
          potentialValue: l.potentialValue,
          leadType: l.leadType,
          leadSource: l.leadSource,
          assignedTo: l.assignedTo
        }))
      };

      console.log('🚀 Sending bulk lead import request:', payload);

      const response = await api.post('/leads/bulk-import', payload);

      console.log('✅ Lead import response:', response.data);

      if (response.data.success) {
        const created = response.data.data.created;
        const skipped = response.data.data.skipped;
        const errors = response.data.data.errors || [];

        if (created > 0) {
          showToast.success(`Successfully imported ${created} leads${skipped > 0 ? ` (${skipped} skipped)` : ''}`);
        } else if (skipped > 0) {
          showToast.warning(`No leads imported. ${skipped} skipped - companies may not exist or leads already exist.`);
        } else {
          showToast.info('No leads were imported.');
        }

        // Show detailed errors if any
        if (errors.length > 0) {
          console.warn('⚠️ Import errors:', errors);
          const companyNotFoundErrors = errors.filter(e => e.error?.includes('Company not found'));
          if (companyNotFoundErrors.length > 0) {
            const companyNames = companyNotFoundErrors.map(e => e.companyName).filter(Boolean).join(', ');
            showToast.error(`${companyNotFoundErrors.length} leads skipped: Companies not found (${companyNames.substring(0, 100)}${companyNames.length > 100 ? '...' : ''}). Please create these companies first.`);
          }
        }

        setShowLeadImportModal(false);
        setImportedLeads([]);
        setLeadImportFile(null);
        await fetchAllData();
      } else {
        showToast.error('Import failed: ' + (response.data.message || 'Unknown error'));
      }
    } catch (error) {
      console.error('❌ Error importing leads:', error);
      console.error('Error response:', error.response?.data);
      showToast.error(error.response?.data?.message || 'Failed to import leads');
    } finally {
      setIsImportingLeads(false);
    }
  };

  const handleDownloadLeadTemplate = () => {
    const template = generateLeadCSVTemplate();
    const exampleRow = '"Acme Corporation","Technology","John Smith","Chief Technology Officer","IT","Mumbai, India","https://linkedin.com/in/johnsmith","9876543210","john.smith@acmecorp.com","5","2025-01-15","Interested in automation solutions","Contacted",""\n';
    downloadCSV(template + exampleRow, 'lead-import-template.csv');
    showToast.success('Lead template downloaded');
  };

  const handleExportLeads = () => {
    if (leads.length === 0) {
      showToast.error('No leads to export');
      return;
    }

    const headers = [
      'Company Name',
      'Industry',
      'Prospect Name',
      'Designation',
      'Department',
      'Location',
      'LinkedIn ID',
      'Contact Number',
      'Email Address',
      'No. of Touchpoints',
      'Last Contact Date',
      'Remark',
      'Lead Stage (New / Contacted / Nurturing / Closed)',
      'Lead Owner (Sales Rep)'
    ];

    const rows = leads.map(lead => {
      const assignedRep = salesTeam.find(m => m._id === lead.assignedTo?._id);
      const repName = assignedRep ? `${assignedRep.firstName} ${assignedRep.lastName}` :
        (lead.assignedTo ? `${lead.assignedTo.firstName} ${lead.assignedTo.lastName}` : '');

      let stageText = 'New';
      if (lead.stage === 'contacted') stageText = 'Contacted';
      else if (lead.status === 'nurturing') stageText = 'Nurturing';
      else if (lead.stage === 'closed-won' || lead.stage === 'closedWon') stageText = 'Closed';

      return [
        lead.company?.companyName || '',
        lead.company?.industry || '',
        lead.name || '',
        lead.designation || '',
        lead.department || '',
        lead.location || (lead.company?.location ? `${lead.company.location.city || ''}, ${lead.company.location.country || ''}`.trim() : ''),
        lead.linkedIn || '',
        lead.phone || '',
        lead.email || '',
        lead.followUps?.length || 0,
        lead.lastContactDate ? new Date(lead.lastContactDate).toISOString().split('T')[0] : '',
        lead.requirements || lead.serviceInterest || '',
        stageText,
        repName
      ];
    });

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${(cell || '').toString().replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    const timestamp = new Date().toISOString().split('T')[0];
    downloadCSV(csvContent, `leads-export-${timestamp}.csv`);
    showToast.success('Leads exported successfully');
  };

  const handleBulkAssignCompanies = async () => {
    if (selectedCompaniesForAssignment.length === 0) {
      showToast.error('Please select companies to assign');
      return;
    }

    if (!bulkAssignTo) {
      showToast.error('Please select a sales representative');
      return;
    }

    try {
      const response = await api.post('/companies/bulk-assign', {
        companyIds: selectedCompaniesForAssignment,
        assignedTo: bulkAssignTo
      });

      if (response.data.success) {
        showToast.success(`Successfully assigned ${selectedCompaniesForAssignment.length} companies`);
        setSelectedCompaniesForAssignment([]);
        setBulkAssignTo('');
        fetchAllData();
      }
    } catch (error) {
      console.error('Error bulk assigning companies:', error);
      showToast.error(error.response?.data?.message || 'Failed to assign companies');
    }
  };

  // Dashboard stats
  const stats = [
    {
      name: 'Total Revenue',
      value: `₹${(overallStats.totalRevenue || 0).toLocaleString()}`,
      icon: DollarSign,
      change: '+12.5%',
      changeType: 'positive'
    },
    {
      name: 'Active Leads',
      value: overallStats.activeLeads || 0,
      icon: TrendingUp,
      change: '+8.2%',
      changeType: 'positive'
    },
    {
      name: 'Team Members',
      value: overallStats.totalTeamMembers || 0,
      icon: Users,
      change: '',
      changeType: 'neutral'
    },
    {
      name: 'Won Deals',
      value: overallStats.wonDeals || 0,
      icon: Award,
      change: '+15.3%',
      changeType: 'positive'
    }
  ];

  // Stage distribution for pipeline
  const stageColors = {
    lead: 'bg-gray-500',
    qualified: 'bg-blue-500',
    proposal: 'bg-yellow-500',
    negotiation: 'bg-orange-500',
    'closed-won': 'bg-green-500',
    'closed-lost': 'bg-red-500'
  };

  // Render different views
  if (currentView === 'my-attendance') {
    return (
      <DashboardLayout sidebarActions={sidebarActions}>
        <AttendancePunch />
      </DashboardLayout>
    );
  }

  if (currentView === 'team-attendance') {
    return (
      <DashboardLayout sidebarActions={sidebarActions}>
        <AttendanceManagement />
      </DashboardLayout>
    );
  }

  // Comprehensive Monitoring View
  if (currentView === 'comprehensive-monitoring') {
    return (
      <DashboardLayout sidebarActions={sidebarActions}>
        <ComprehensiveMonitoring />
      </DashboardLayout>
    );
  }

  // Lead Management View
  if (currentView === 'lead-management') {
    return (
      <DashboardLayout sidebarActions={sidebarActions}>
        <HOSLeadManagement />
      </DashboardLayout>
    );
  }

  // Revenue Overview View
  if (currentView === 'revenue-overview') {
    return (
      <DashboardLayout sidebarActions={sidebarActions}>
        <div className="space-y-6">
          <RevenueSummaryWidgets
            revenueData={{
              revenueTargets,
              overallStats,
              analytics,
              teamStats,
              recentActivities
            }}
          />
        </div>
      </DashboardLayout>
    );
  }

  // Revenue Targets View
  if (currentView === 'revenue-targets') {
    return (
      <DashboardLayout sidebarActions={sidebarActions}>
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold text-gray-900">Revenue Targets from Co-Founder</h2>
          </div>

          {revenueTargets && revenueTargets.length > 0 ? (
            <div className="space-y-4">
              {revenueTargets.map(target => {
                // Format period display
                const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
                  'July', 'August', 'September', 'October', 'November', 'December'];
                const periodDisplay = target.targetMonth && target.targetYear
                  ? `${monthNames[target.targetMonth - 1]} ${target.targetYear}`
                  : `${target.targetPeriod} Target`;

                return (
                  <div key={target._id} className="dashboard-card">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">
                          {periodDisplay}
                        </h3>
                        <p className="text-sm text-gray-500 capitalize">
                          {target.targetPeriod} target
                        </p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${target.hosResponse?.status === 'accepted' ? 'bg-green-100 text-green-800' :
                        target.hosResponse?.status === 'negotiating' ? 'bg-yellow-100 text-yellow-800' :
                          target.hosResponse?.status === 'rejected' ? 'bg-red-100 text-red-800' :
                            'bg-gray-100 text-gray-800'
                        }`}>
                        {target.hosResponse?.status || 'pending'}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                      <div className="bg-blue-50 rounded-lg p-3">
                        <div className="text-sm text-blue-600 mb-1">Target Amount</div>
                        <div className="text-2xl font-bold text-blue-900">
                          ₹{target.targetAmount?.toLocaleString()}
                        </div>
                      </div>
                      <div className="bg-green-50 rounded-lg p-3">
                        <div className="text-sm text-green-600 mb-1">Achieved</div>
                        <div className="text-2xl font-bold text-green-900">
                          ₹{target.achievedAmount?.toLocaleString()}
                        </div>
                      </div>
                      <div className="bg-purple-50 rounded-lg p-3">
                        <div className="text-sm text-purple-600 mb-1">Progress</div>
                        <div className="text-2xl font-bold text-purple-900">
                          {target.progressPercentage}%
                        </div>
                      </div>
                      <div className="bg-orange-50 rounded-lg p-3">
                        <div className="text-sm text-orange-600 mb-1">Status</div>
                        <div className="text-lg font-bold text-orange-900 capitalize">
                          {target.status}
                        </div>
                      </div>
                    </div>

                    {target.notes && (
                      <div className="bg-gray-50 rounded-lg p-3 mb-4">
                        <div className="text-sm font-medium text-gray-700 mb-1">Notes from Co-Founder:</div>
                        <p className="text-sm text-gray-600">{target.notes}</p>
                      </div>
                    )}

                    {target.strategy?.targetLocations?.length > 0 && (
                      <div className="mb-4">
                        <div className="text-sm font-medium text-gray-700 mb-2">Your Strategy:</div>
                        <div className="space-y-2">
                          {target.strategy.targetLocations.map((loc, idx) => (
                            <div key={idx} className="bg-gray-50 rounded p-3 border border-gray-200">
                              <div className="flex justify-between items-start mb-2">
                                <span className="font-medium text-gray-900">{loc.location}</span>
                                <span className="text-green-600 font-semibold">₹{loc.targetAmount?.toLocaleString()}</span>
                              </div>
                              <p className="text-sm text-gray-600 mb-2">{loc.reasoning}</p>
                              {loc.assignedReps?.length > 0 && (
                                <div className="bg-white rounded p-2 border-l-2 border-blue-500">
                                  <div className="text-xs font-medium text-gray-700 mb-1">Assigned Sales Rep:</div>
                                  {loc.assignedReps.map((rep, repIdx) => (
                                    <div key={repIdx} className="text-sm text-gray-900">
                                      <span className="font-medium">{rep.firstName} {rep.lastName}</span>
                                      <div className="text-xs text-gray-600 mt-1">
                                        📧 {rep.email}
                                        {rep.phone && <> | 📱 {rep.phone}</>}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                        {target.strategy.approvedByCoFounder ? (
                          <div className="mt-2 text-sm text-green-600 font-medium">✓ Strategy Approved by Co-Founder</div>
                        ) : (
                          <div className="mt-2 text-sm text-yellow-600 font-medium">⏳ Awaiting Co-Founder Approval</div>
                        )}
                      </div>
                    )}

                    <div className="flex gap-2">
                      {target.hosResponse?.status === 'pending' && (
                        <button
                          onClick={() => handleRespondToTarget(target._id, 'accepted', 'Target accepted')}
                          className="btn-primary text-sm"
                        >
                          Accept Target
                        </button>
                      )}
                      {target.hosResponse?.status === 'accepted' && !target.strategy?.targetLocations?.length && (
                        <button
                          onClick={() => {
                            setSelectedRevenueTarget(target);
                            setShowStrategyModal(true);
                          }}
                          className="btn-primary text-sm"
                        >
                          Propose Strategy
                        </button>
                      )}
                      <button
                        onClick={() => {
                          setSelectedRevenueTarget(target);
                          setShowDetailsModal(true);
                        }}
                        className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm hover:bg-gray-300"
                      >
                        View Details
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="dashboard-card text-center py-12">
              <DollarSign className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">No revenue targets assigned yet</p>
            </div>
          )}
        </div>

        {/* Details Modal */}
        {showDetailsModal && selectedRevenueTarget && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <h2 className="text-2xl font-bold">Revenue Target Details</h2>
                  <button
                    onClick={() => {
                      setShowDetailsModal(false);
                      setSelectedRevenueTarget(null);
                    }}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="h-6 w-6" />
                  </button>
                </div>

                <div className="space-y-6">
                  {/* Target Overview */}
                  <div className="bg-blue-50 rounded-lg p-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <div className="text-sm text-blue-600 mb-1">Period</div>
                        <div className="font-semibold">
                          {(() => {
                            const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
                              'July', 'August', 'September', 'October', 'November', 'December'];
                            return selectedRevenueTarget.targetMonth && selectedRevenueTarget.targetYear
                              ? `${monthNames[selectedRevenueTarget.targetMonth - 1]} ${selectedRevenueTarget.targetYear}`
                              : selectedRevenueTarget.targetPeriod;
                          })()}
                        </div>
                      </div>
                      <div>
                        <div className="text-sm text-blue-600 mb-1">Target Amount</div>
                        <div className="text-2xl font-bold">₹{selectedRevenueTarget.targetAmount?.toLocaleString()}</div>
                      </div>
                    </div>
                  </div>

                  {/* Progress */}
                  <div className="grid grid-cols-3 gap-4">
                    <div className="bg-green-50 rounded-lg p-4">
                      <div className="text-sm text-green-600 mb-1">Achieved</div>
                      <div className="text-xl font-bold text-green-900">
                        ₹{selectedRevenueTarget.achievedAmount?.toLocaleString() || '0'}
                      </div>
                    </div>
                    <div className="bg-purple-50 rounded-lg p-4">
                      <div className="text-sm text-purple-600 mb-1">Progress</div>
                      <div className="text-xl font-bold text-purple-900">
                        {selectedRevenueTarget.progressPercentage || 0}%
                      </div>
                    </div>
                    <div className="bg-orange-50 rounded-lg p-4">
                      <div className="text-sm text-orange-600 mb-1">Status</div>
                      <div className="text-lg font-bold text-orange-900 capitalize">
                        {selectedRevenueTarget.status || 'In-Progress'}
                      </div>
                    </div>
                  </div>

                  {/* Co-Founder Notes */}
                  {selectedRevenueTarget.notes && (
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="text-sm font-medium text-gray-700 mb-2">Notes from Co-Founder:</div>
                      <p className="text-gray-600">{selectedRevenueTarget.notes}</p>
                    </div>
                  )}

                  {/* HOS Response */}
                  {selectedRevenueTarget.hosResponse && (
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="text-sm font-medium text-gray-700 mb-2">Your Response:</div>
                      <div className="space-y-2">
                        <div>
                          <span className="text-sm text-gray-600">Status: </span>
                          <span className={`px-2 py-1 rounded text-sm font-medium ${selectedRevenueTarget.hosResponse.status === 'accepted' ? 'bg-green-100 text-green-800' :
                            selectedRevenueTarget.hosResponse.status === 'negotiating' ? 'bg-yellow-100 text-yellow-800' :
                              selectedRevenueTarget.hosResponse.status === 'rejected' ? 'bg-red-100 text-red-800' :
                                'bg-gray-100 text-gray-800'
                            }`}>
                            {selectedRevenueTarget.hosResponse.status}
                          </span>
                        </div>
                        {selectedRevenueTarget.hosResponse.message && (
                          <div>
                            <span className="text-sm text-gray-600">Message: </span>
                            <span className="text-gray-900">{selectedRevenueTarget.hosResponse.message}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Strategy Details */}
                  {selectedRevenueTarget.strategy?.targetLocations?.length > 0 && (
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="text-sm font-medium text-gray-700 mb-3">Your Strategy:</div>
                      <div className="space-y-3">
                        {selectedRevenueTarget.strategy.targetLocations.map((loc, idx) => (
                          <div key={idx} className="bg-white rounded p-3 border border-gray-200">
                            <div className="flex justify-between items-start mb-2">
                              <span className="font-medium text-gray-900">{loc.location}</span>
                              <span className="text-green-600 font-semibold">₹{loc.targetAmount?.toLocaleString()}</span>
                            </div>
                            <p className="text-sm text-gray-600 mb-2">{loc.reasoning}</p>
                            {loc.assignedReps?.length > 0 && (
                              <div className="bg-blue-50 rounded p-2 border-l-3 border-blue-500 mt-2">
                                <div className="text-xs font-semibold text-blue-900 mb-2">👤 Assigned Sales Representative</div>
                                {loc.assignedReps.map((rep, repIdx) => (
                                  <div key={repIdx} className="bg-white rounded p-2 mb-2 last:mb-0">
                                    <div className="font-medium text-gray-900">
                                      {rep.firstName} {rep.lastName}
                                    </div>
                                    <div className="text-xs text-gray-600 mt-1 space-y-1">
                                      <div className="flex items-center gap-1">
                                        <span>📧</span>
                                        <a href={`mailto:${rep.email}`} className="text-blue-600 hover:underline">
                                          {rep.email}
                                        </a>
                                      </div>
                                      {rep.phone && (
                                        <div className="flex items-center gap-1">
                                          <span>📱</span>
                                          <a href={`tel:${rep.phone}`} className="text-blue-600 hover:underline">
                                            {rep.phone}
                                          </a>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        ))}
                        <div className="pt-2 border-t">
                          {selectedRevenueTarget.strategy.approvedByCoFounder ? (
                            <div className="text-sm text-green-600 font-medium flex items-center gap-2">
                              <CheckCircle className="h-4 w-4" />
                              Strategy Approved by Co-Founder
                            </div>
                          ) : (
                            <div className="text-sm text-yellow-600 font-medium flex items-center gap-2">
                              <AlertCircle className="h-4 w-4" />
                              Awaiting Co-Founder Approval
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex gap-2 pt-4 border-t">
                    {selectedRevenueTarget.hosResponse?.status === 'accepted' && !selectedRevenueTarget.strategy?.targetLocations?.length && (
                      <button
                        onClick={() => {
                          setShowDetailsModal(false);
                          setShowStrategyModal(true);
                        }}
                        className="btn-primary"
                      >
                        Propose Strategy
                      </button>
                    )}
                    <button
                      onClick={() => {
                        setShowDetailsModal(false);
                        setSelectedRevenueTarget(null);
                      }}
                      className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300"
                    >
                      Close
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Strategy Submission Modal */}
        {showStrategyModal && selectedRevenueTarget && (
          <StrategyModal
            target={selectedRevenueTarget}
            salesTeam={salesTeam}
            onClose={() => {
              setShowStrategyModal(false);
              setSelectedRevenueTarget(null);
            }}
            onSubmit={handleSubmitStrategy}
          />
        )}
      </DashboardLayout>
    );
  }

  // Company Approvals View
  if (currentView === 'company-approvals') {
    return (
      <DashboardLayout sidebarActions={sidebarActions}>
        <div className="space-y-6">
          {/* Header with Import/Export Actions */}
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Company Management</h2>
              <p className="text-sm text-gray-600 mt-1">Review, import, and assign companies to your sales team</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setShowCompanyImportModal(true)}
                className="btn-primary flex items-center gap-2"
              >
                <Upload className="h-4 w-4" />
                Import Companies
              </button>
              <button
                onClick={() => setShowLeadImportModal(true)}
                className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2"
              >
                <Upload className="h-4 w-4" />
                Import Leads
              </button>
              <button
                onClick={handleExportCompanies}
                disabled={pendingCompanies.length === 0}
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Download className="h-4 w-4" />
                Export Companies
              </button>
              <button
                onClick={handleExportLeads}
                disabled={leads.length === 0}
                className="bg-teal-600 text-white px-4 py-2 rounded-lg hover:bg-teal-700 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Download className="h-4 w-4" />
                Export Leads
              </button>
            </div>
          </div>

          {/* Bulk Assignment Section */}
          {selectedCompaniesForAssignment.length > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-blue-600" />
                  <span className="font-medium text-blue-900">
                    {selectedCompaniesForAssignment.length} companies selected
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <select
                    value={bulkAssignTo}
                    onChange={(e) => setBulkAssignTo(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select Sales Rep</option>
                    {salesTeam
                      .filter(member =>
                        member.role === 'service-onboarding' ||
                        member.category === 'service-onboarding' ||
                        member.role === 'individual'
                      )
                      .map((member) => (
                        <option key={member._id} value={member._id}>
                          {member.firstName} {member.lastName} ({member.role})
                        </option>
                      ))}
                  </select>
                  <button
                    onClick={handleBulkAssignCompanies}
                    disabled={!bulkAssignTo}
                    className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Assign Selected
                  </button>
                  <button
                    onClick={() => setSelectedCompaniesForAssignment([])}
                    className="text-gray-600 hover:text-gray-800"
                  >
                    Clear
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
              <div className="text-sm text-yellow-600 mb-1">Pending Review</div>
              <div className="text-2xl font-bold text-yellow-900">
                {pendingCompanies.filter(c => c.approvalStatus === 'pending').length}
              </div>
            </div>
            <div className="bg-green-50 rounded-lg p-4 border border-green-200">
              <div className="text-sm text-green-600 mb-1">Approved</div>
              <div className="text-2xl font-bold text-green-900">
                {pendingCompanies.filter(c => c.approvalStatus === 'approved').length}
              </div>
            </div>
            <div className="bg-red-50 rounded-lg p-4 border border-red-200">
              <div className="text-sm text-red-600 mb-1">Needs Revision</div>
              <div className="text-2xl font-bold text-red-900">
                {pendingCompanies.filter(c => c.approvalStatus === 'needs-revision').length}
              </div>
            </div>
            <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
              <div className="text-sm text-blue-600 mb-1">Total Companies</div>
              <div className="text-2xl font-bold text-blue-900">
                {pendingCompanies.length}
              </div>
            </div>
          </div>

          {/* Search Bar */}
          <div className="dashboard-card">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type="text"
                placeholder="Search companies by name, industry, location..."
                value={companySearchQuery}
                onChange={(e) => setCompanySearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
          </div>

          {/* Filter Tabs */}
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setCompanyStatusFilter('all')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${companyStatusFilter === 'all'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
              >
                All Companies ({pendingCompanies.length})
              </button>
              <button
                onClick={() => setCompanyStatusFilter('pending')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${companyStatusFilter === 'pending'
                  ? 'border-yellow-500 text-yellow-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
              >
                Pending ({pendingCompanies.filter(c => c.approvalStatus === 'pending').length})
              </button>
              <button
                onClick={() => setCompanyStatusFilter('approved')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${companyStatusFilter === 'approved'
                  ? 'border-green-500 text-green-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
              >
                Approved ({pendingCompanies.filter(c => c.approvalStatus === 'approved').length})
              </button>
              <button
                onClick={() => setCompanyStatusFilter('needs-revision')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${companyStatusFilter === 'needs-revision'
                  ? 'border-red-500 text-red-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
              >
                Needs Revision ({pendingCompanies.filter(c => c.approvalStatus === 'needs-revision').length})
              </button>
            </nav>
          </div>

          {pendingCompanies && pendingCompanies.length > 0 ? (
            <div className="space-y-4">
              {(() => {
                // Filter companies based on status filter and search query
                const filteredCompanies = pendingCompanies.filter(company => {
                  const matchesStatus = companyStatusFilter === 'all' || company.approvalStatus === companyStatusFilter;
                  const matchesSearch = companySearchQuery === '' ||
                    company.companyName?.toLowerCase().includes(companySearchQuery.toLowerCase()) ||
                    company.industry?.toLowerCase().includes(companySearchQuery.toLowerCase()) ||
                    company.location?.city?.toLowerCase().includes(companySearchQuery.toLowerCase()) ||
                    company.location?.state?.toLowerCase().includes(companySearchQuery.toLowerCase());
                  return matchesStatus && matchesSearch;
                });

                if (filteredCompanies.length === 0) {
                  return (
                    <div className="text-center py-12">
                      <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500">No companies match your filters</p>
                      {companySearchQuery && (
                        <button
                          onClick={() => setCompanySearchQuery('')}
                          className="text-primary-600 hover:text-primary-700 font-medium mt-2"
                        >
                          Clear search
                        </button>
                      )}
                    </div>
                  );
                }

                return (
                  <>
                    <div className="text-sm text-gray-600 mb-3">
                      Showing {filteredCompanies.length} of {pendingCompanies.length} companies
                    </div>
                    {filteredCompanies.map(company => (
                      <div key={company._id} className="dashboard-card hover:shadow-md transition-shadow">
                        <div className="flex items-start gap-4">
                          {/* Checkbox for selection */}
                          <input
                            type="checkbox"
                            checked={selectedCompaniesForAssignment.includes(company._id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedCompaniesForAssignment([...selectedCompaniesForAssignment, company._id]);
                              } else {
                                setSelectedCompaniesForAssignment(selectedCompaniesForAssignment.filter(id => id !== company._id));
                              }
                            }}
                            className="mt-1 h-5 w-5 text-blue-600 rounded focus:ring-blue-500"
                          />

                          {/* Company Details */}
                          <div className="flex-1">
                            <div className="flex justify-between items-start mb-4">
                              <div>
                                <h3 className="text-lg font-semibold text-gray-900">{company.companyName}</h3>
                                <p className="text-sm text-gray-500">{company.industry}</p>
                              </div>
                              <span className={`px-3 py-1 rounded-full text-sm font-medium ${company.approvalStatus === 'approved'
                                ? 'bg-green-100 text-green-800'
                                : company.approvalStatus === 'needs-revision'
                                  ? 'bg-red-100 text-red-800'
                                  : company.approvalStatus === 'rejected'
                                    ? 'bg-gray-100 text-gray-800'
                                    : 'bg-yellow-100 text-yellow-800'
                                }`}>
                                {company.approvalStatus === 'pending'
                                  ? 'Pending Review'
                                  : company.approvalStatus === 'needs-revision'
                                    ? 'Needs Revision'
                                    : company.approvalStatus.charAt(0).toUpperCase() + company.approvalStatus.slice(1)
                                }
                              </span>
                            </div>

                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4 text-sm">
                              <div>
                                <span className="text-gray-500">Location:</span>
                                <div className="font-medium">{company.location?.city}, {company.location?.state}</div>
                              </div>
                              <div>
                                <span className="text-gray-500">Employee Count:</span>
                                <div className="font-medium">{company.employeeCount}</div>
                              </div>
                              <div>
                                <span className="text-gray-500">Revenue:</span>
                                <div className="font-medium">{company.revenue}</div>
                              </div>
                              <div>
                                <span className="text-gray-500">Potential Value:</span>
                                <div className="font-medium text-green-600">₹{company.potentialValue?.toLocaleString()}</div>
                              </div>
                            </div>

                            {company.research && (
                              <div className="bg-gray-50 rounded-lg p-3 mb-4 text-sm">
                                <div className="font-medium text-gray-700 mb-2">Research Notes:</div>
                                <div className="space-y-1">
                                  {company.research.keyDecisionMakers && (
                                    <div><span className="text-gray-600">Decision Makers:</span> {company.research.keyDecisionMakers}</div>
                                  )}
                                  {company.research.painPoints && (
                                    <div><span className="text-gray-600">Pain Points:</span> {company.research.painPoints}</div>
                                  )}
                                  {company.research.notes && (
                                    <div><span className="text-gray-600">Notes:</span> {company.research.notes}</div>
                                  )}
                                </div>
                              </div>
                            )}

                            {/* Approval Notes */}
                            {company.approvalNotes && (company.approvalStatus === 'approved' || company.approvalStatus === 'needs-revision') && (
                              <div className={`rounded-lg p-3 mb-4 text-sm ${company.approvalStatus === 'approved'
                                ? 'bg-green-50 border border-green-200'
                                : 'bg-red-50 border border-red-200'
                                }`}>
                                <div className="font-medium mb-1 ${company.approvalStatus === 'approved' ? 'text-green-700' : 'text-red-700'}">
                                  {company.approvalStatus === 'approved' ? '✓ Approval Notes:' : '⚠ Revision Required:'}
                                </div>
                                <p className={company.approvalStatus === 'approved' ? 'text-green-600' : 'text-red-600'}>
                                  {company.approvalNotes}
                                </p>
                              </div>
                            )}

                            <div className="flex items-center justify-between pt-3 border-t">
                              <div className="text-sm text-gray-500">
                                Identified by: <span className="font-medium">
                                  {company.identifiedBy?.firstName} {company.identifiedBy?.lastName}
                                </span>
                                {company.assignedTo && (
                                  <> • Assigned to: <span className="font-medium text-blue-600">
                                    {company.assignedTo.firstName} {company.assignedTo.lastName}
                                  </span></>
                                )}
                              </div>
                              <div className="flex gap-2">
                                {company.approvalStatus === 'pending' && (
                                  <button
                                    onClick={() => {
                                      setSelectedCompany(company);
                                      setShowCompanyApprovalModal(true);
                                    }}
                                    className="btn-primary text-sm"
                                  >
                                    Review & Assign
                                  </button>
                                )}
                                {company.approvalStatus === 'approved' && !company.assignedTo && (
                                  <button
                                    onClick={() => {
                                      setSelectedCompany(company);
                                      setShowCompanyApprovalModal(true);
                                    }}
                                    className="bg-blue-600 text-white px-3 py-2 rounded-lg text-sm hover:bg-blue-700"
                                  >
                                    Assign Sales Rep
                                  </button>
                                )}
                                {company.approvalStatus === 'approved' && company.assignedTo && (
                                  <button
                                    onClick={() => {
                                      setSelectedCompany(company);
                                      setShowCompanyApprovalModal(true);
                                    }}
                                    className="bg-purple-600 text-white px-3 py-2 rounded-lg text-sm hover:bg-purple-700"
                                  >
                                    Reassign
                                  </button>
                                )}
                                {company.approvalStatus === 'needs-revision' && (
                                  <button
                                    onClick={() => {
                                      setSelectedCompany(company);
                                      setShowCompanyApprovalModal(true);
                                    }}
                                    className="bg-orange-600 text-white px-3 py-2 rounded-lg text-sm hover:bg-orange-700"
                                  >
                                    Review Again
                                  </button>
                                )}
                                <button
                                  onClick={() => {
                                    setSelectedCompany(company);
                                    setShowCompanyApprovalModal(true);
                                  }}
                                  className="bg-gray-200 text-gray-700 px-3 py-2 rounded-lg text-sm hover:bg-gray-300"
                                >
                                  View Details
                                </button>
                                <button
                                  onClick={() => handleDeleteCompany(company._id, company.companyName)}
                                  className="text-red-600 hover:text-red-900 p-2"
                                  title="Delete Company"
                                >
                                  <Trash2 className="h-5 w-5" />
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </>
                );
              })()}
            </div>
          ) : (
            <div className="dashboard-card text-center py-12">
              <ClipboardCheck className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 mb-4">No companies pending approval</p>
              <button
                onClick={() => setShowCompanyImportModal(true)}
                className="btn-primary inline-flex items-center gap-2"
              >
                <Upload className="h-4 w-4" />
                Import Companies
              </button>
            </div>
          )}
        </div>

        {/* Company Approval Modal */}
        {showCompanyApprovalModal && selectedCompany && (
          <CompanyApprovalModal
            company={selectedCompany}
            salesTeam={salesTeam}
            onClose={() => {
              setShowCompanyApprovalModal(false);
              setSelectedCompany(null);
            }}
            onApprove={handleApproveCompany}
          />
        )}

        {/* Company Import Modal */}
        {showCompanyImportModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-5xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">Import Companies</h2>
                    <p className="text-sm text-gray-500 mt-1">Upload CSV file and assign to sales representatives</p>
                  </div>
                  <button
                    onClick={() => {
                      setShowCompanyImportModal(false);
                      setImportedCompanies([]);
                      setCompanyImportFile(null);
                    }}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="h-6 w-6" />
                  </button>
                </div>

                {/* File Upload Section */}
                <div className="mb-6">
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                    <FileUp className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                    <label className="cursor-pointer">
                      <span className="btn-primary inline-flex items-center gap-2">
                        <Upload className="h-4 w-4" />
                        Choose CSV File
                      </span>
                      <input
                        type="file"
                        accept=".csv"
                        onChange={handleCompanyFileUpload}
                        className="hidden"
                      />
                    </label>
                    <p className="text-sm text-gray-500 mt-2">
                      {companyImportFile ? companyImportFile.name : 'Upload a CSV file with company data'}
                    </p>
                    <button
                      onClick={handleDownloadCompanyTemplate}
                      className="text-sm text-blue-600 hover:text-blue-700 mt-3 inline-flex items-center gap-1"
                    >
                      <FileDown className="h-4 w-4" />
                      Download CSV Template
                    </button>
                  </div>
                </div>

                {/* Preview and Assignment Section */}
                {importedCompanies.length > 0 && (
                  <div className="space-y-4">
                    {/* Bulk Assignment Header */}
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex-1">
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            🎯 Bulk Assign All Companies to Single Rep
                          </label>
                          <select
                            onChange={(e) => {
                              const selectedRep = e.target.value;
                              if (selectedRep) {
                                // Assign all companies to selected rep
                                const updated = importedCompanies.map(company => ({
                                  ...company,
                                  assignedTo: selectedRep
                                }));
                                setImportedCompanies(updated);
                              }
                            }}
                            className="w-full max-w-md px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="">Select Sales Rep to Assign All</option>
                            {salesTeam
                              .filter(member =>
                                member.role === 'service-onboarding' ||
                                member.category === 'service-onboarding' ||
                                member.role === 'individual'
                              )
                              .map((member) => (
                                <option key={member._id} value={member._id}>
                                  {member.firstName} {member.lastName} ({member.role})
                                </option>
                              ))}
                          </select>
                        </div>
                        <button
                          onClick={handleBulkImportCompanies}
                          disabled={isImporting || importedCompanies.some(c => !c.assignedTo)}
                          className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                        >
                          {isImporting ? 'Importing...' : 'Import All Companies'}
                        </button>
                      </div>
                    </div>

                    <div className="flex justify-between items-center">
                      <h3 className="font-semibold text-gray-900">
                        Preview ({importedCompanies.length} companies)
                      </h3>
                      <div className="text-sm text-gray-600">
                        {importedCompanies.filter(c => c.assignedTo).length} of {importedCompanies.length} assigned
                      </div>
                    </div>

                    <div className="max-h-96 overflow-y-auto space-y-3">
                      {importedCompanies.map((company, index) => (
                        <div key={company.id} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                          <div className="flex justify-between items-start gap-4">
                            <div className="flex-1">
                              <div className="font-medium text-gray-900">{company.companyName}</div>
                              <div className="text-sm text-gray-600 mt-1">
                                {company.industry} • {company.location.city}, {company.location.state}
                              </div>
                              <div className="text-sm text-gray-500 mt-1">
                                Potential: ₹{company.potentialValue?.toLocaleString()} • Priority: {company.priority}
                              </div>
                            </div>
                            <div className="w-64">
                              <label className="block text-xs font-medium text-gray-700 mb-1">
                                Assign to Sales Rep *
                              </label>
                              <select
                                value={company.assignedTo}
                                onChange={(e) => {
                                  const updated = [...importedCompanies];
                                  updated[index].assignedTo = e.target.value;
                                  setImportedCompanies(updated);
                                }}
                                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                              >
                                <option value="">Select Rep</option>
                                {(() => {
                                  console.log('🔍 Sales Team Array:', salesTeam);
                                  console.log('🔍 Sales Team Length:', salesTeam?.length);
                                  salesTeam.forEach(member => {
                                    console.log(`👤 ${member.firstName} ${member.lastName} - Role: ${member.role}, Category: ${member.category}`);
                                  });
                                  const filtered = salesTeam.filter(member =>
                                    member.role === 'service-onboarding' ||
                                    member.category === 'service-onboarding' ||
                                    member.role === 'individual'
                                  );
                                  console.log('✅ Filtered Sales Reps:', filtered);
                                  return filtered;
                                })().map((member) => (
                                  <option key={member._id} value={member._id}>
                                    {member.firstName} {member.lastName} ({member.role})
                                  </option>
                                ))}
                              </select>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Lead Import Modal */}
        {showLeadImportModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-5xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">Import Leads</h2>
                    <p className="text-sm text-gray-500 mt-1">Upload CSV file with lead prospects and assign to sales reps</p>
                    <p className="text-xs text-orange-600 mt-1 font-medium">⚠️ Note: Companies must already exist. Create companies first before importing leads.</p>
                  </div>
                  <button
                    onClick={() => {
                      setShowLeadImportModal(false);
                      setImportedLeads([]);
                      setLeadImportFile(null);
                    }}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="h-6 w-6" />
                  </button>
                </div>

                {/* File Upload Section */}
                <div className="mb-6">
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                    <FileUp className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                    <label className="cursor-pointer">
                      <span className="btn-primary inline-flex items-center gap-2">
                        <Upload className="h-4 w-4" />
                        Choose CSV File
                      </span>
                      <input
                        type="file"
                        accept=".csv"
                        onChange={handleLeadFileUpload}
                        className="hidden"
                      />
                    </label>
                    <p className="text-sm text-gray-500 mt-2">
                      {leadImportFile ? leadImportFile.name : 'Upload a CSV file with lead data'}
                    </p>
                    <button
                      onClick={handleDownloadLeadTemplate}
                      className="text-sm text-blue-600 hover:text-blue-700 mt-3 inline-flex items-center gap-1"
                    >
                      <FileDown className="h-4 w-4" />
                      Download Lead CSV Template
                    </button>
                  </div>
                </div>

                {/* Preview and Assignment Section */}
                {importedLeads.length > 0 && (
                  <div className="space-y-4">
                    {/* Bulk Assignment Header */}
                    <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex-1">
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            🎯 Bulk Assign All Leads to Single Rep
                          </label>
                          <select
                            onChange={(e) => {
                              const selectedRep = e.target.value;
                              if (selectedRep) {
                                // Assign all leads to selected rep
                                const updated = importedLeads.map(lead => ({
                                  ...lead,
                                  assignedTo: selectedRep
                                }));
                                setImportedLeads(updated);
                              }
                            }}
                            className="w-full max-w-md px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                          >
                            <option value="">Select Sales Rep to Assign All</option>
                            {salesTeam
                              .filter(member =>
                                member.role === 'service-onboarding' ||
                                member.category === 'service-onboarding' ||
                                member.role === 'individual'
                              )
                              .map((member) => (
                                <option key={member._id} value={member._id}>
                                  {member.firstName} {member.lastName} ({member.role})
                                </option>
                              ))}
                          </select>
                        </div>
                        <button
                          onClick={handleBulkImportLeads}
                          disabled={isImportingLeads || importedLeads.some(l => !l.assignedTo)}
                          className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                        >
                          {isImportingLeads ? 'Importing...' : 'Import All Leads'}
                        </button>
                      </div>
                    </div>

                    <div className="flex justify-between items-center">
                      <h3 className="font-semibold text-gray-900">
                        Preview ({importedLeads.length} leads)
                      </h3>
                      <div className="text-sm text-gray-600">
                        {importedLeads.filter(l => l.assignedTo).length} of {importedLeads.length} assigned
                      </div>
                    </div>

                    <div className="max-h-96 overflow-y-auto space-y-3">
                      {importedLeads.map((lead, index) => (
                        <div key={lead.id} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                          <div className="flex justify-between items-start gap-4">
                            <div className="flex-1">
                              <div className="font-medium text-gray-900">{lead.name}</div>
                              <div className="text-sm text-gray-600 mt-1">
                                {lead.designation} at {lead.companyName}
                              </div>
                              <div className="text-xs text-gray-500 mt-1">
                                {lead.email} • {lead.phone} • Stage: {lead.stage}
                              </div>
                            </div>
                            <div className="w-64">
                              <label className="block text-xs font-medium text-gray-700 mb-1">
                                Assign to Sales Rep *
                              </label>
                              <select
                                value={lead.assignedTo}
                                onChange={(e) => {
                                  const updated = [...importedLeads];
                                  updated[index].assignedTo = e.target.value;
                                  setImportedLeads(updated);
                                }}
                                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                              >
                                <option value="">Select Rep</option>
                                {salesTeam
                                  .filter(member =>
                                    member.role === 'service-onboarding' ||
                                    member.category === 'service-onboarding' ||
                                    member.role === 'individual'
                                  )
                                  .map((member) => (
                                    <option key={member._id} value={member._id}>
                                      {member.firstName} {member.lastName} ({member.role})
                                    </option>
                                  ))}
                              </select>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </DashboardLayout>
    );
  }

  if (currentView === 'team-overview') {
    return (
      <DashboardLayout sidebarActions={sidebarActions}>
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold text-gray-900">Sales Team Overview</h2>
            <button
              onClick={handleOpenCreateTargetModal}
              className="btn-primary flex items-center gap-2"
            >
              <Target className="h-4 w-4" />
              Set Target
            </button>
          </div>

          {/* Team Performance Table */}
          <div className="dashboard-card overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Sales Rep
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total Leads
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Active
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Won
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Revenue
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Conversion Rate
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {teamStats.map((member) => (
                  <tr key={member.userId} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 bg-primary-100 rounded-full flex items-center justify-center">
                          <span className="text-primary-600 font-semibold">
                            {member.name.split(' ').map(n => n[0]).join('')}
                          </span>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{member.name}</div>
                          <div className="text-sm text-gray-500">{member.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {member.totalLeads}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {member.activeLeads}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600 font-medium">
                      {member.wonDeals}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                      ₹{member.totalRevenue.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${parseFloat(member.conversionRate) >= 50
                        ? 'bg-green-100 text-green-800'
                        : parseFloat(member.conversionRate) >= 30
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-red-100 text-red-800'
                        }`}>
                        {member.conversionRate}%
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <button
                        onClick={() => navigate(`/sales/member/${member.userId}`)}
                        className="text-primary-600 hover:text-primary-900 mr-3"
                      >
                        <Eye className="h-5 w-5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (currentView === 'pipeline') {
    const pipelineStages = [
      { id: 'lead', name: 'Lead', color: 'bg-gray-500' },
      { id: 'qualified', name: 'Qualified', color: 'bg-blue-500' },
      { id: 'proposal', name: 'Proposal', color: 'bg-yellow-500' },
      { id: 'negotiation', name: 'Negotiation', color: 'bg-orange-500' },
      { id: 'closed-won', name: 'Closed Won', color: 'bg-green-500' },
      { id: 'closed-lost', name: 'Closed Lost', color: 'bg-red-500' }
    ];

    return (
      <DashboardLayout sidebarActions={sidebarActions}>
        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Team Sales Pipeline</h2>
            <p className="text-sm text-gray-500 mt-1">Monitor all leads across the team with proof tracking</p>
          </div>

          {/* Pipeline Statistics */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {pipelineStages.map((stage) => {
              const count = leads.filter(lead => lead.stage === stage.id).length;
              return (
                <div key={stage.id} className="dashboard-card">
                  <div className="text-center">
                    <div className={`w-12 h-12 ${stage.color} rounded-full mx-auto mb-2 flex items-center justify-center`}>
                      <span className="text-white font-bold text-lg">{count}</span>
                    </div>
                    <div className="text-sm font-medium text-gray-900 capitalize">
                      {stage.name}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Kanban Board View */}
          <div className="overflow-x-auto pb-4">
            <div className="flex gap-4 min-w-max">
              {pipelineStages.map((stage) => {
                const stageLeads = leads.filter(lead => lead.stage === stage.id);

                return (
                  <div
                    key={stage.id}
                    className="flex-shrink-0 w-80"
                  >
                    {/* Stage Header */}
                    <div className={`${stage.color} text-white rounded-t-lg p-3`}>
                      <div className="flex justify-between items-center">
                        <h3 className="font-semibold">{stage.name}</h3>
                        <span className="bg-white bg-opacity-30 px-2 py-1 rounded-full text-sm">
                          {stageLeads.length}
                        </span>
                      </div>
                    </div>

                    {/* Stage Content */}
                    <div className="bg-gray-50 rounded-b-lg p-3 min-h-[600px] space-y-3">
                      {stageLeads.length === 0 ? (
                        <div className="text-center py-8 text-gray-400 text-sm">
                          No leads in this stage
                        </div>
                      ) : (
                        stageLeads.map((lead) => (
                          <div
                            key={lead._id}
                            className="bg-white rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow border border-gray-200 cursor-pointer"
                            onClick={() => navigate(`/sales/lead/${lead._id}`)}
                          >
                            {/* Lead Card */}
                            <div className="space-y-2">
                              <div className="flex justify-between items-start">
                                <div className="flex-1">
                                  <h4 className="font-semibold text-gray-900">{lead.name}</h4>
                                  <p className="text-sm text-gray-500">{lead.company?.companyName || lead.designation}</p>
                                </div>
                                <span className={`px-2 py-1 text-xs font-medium rounded-full ${lead.leadType === 'hot' ? 'bg-red-100 text-red-800' :
                                  lead.leadType === 'warm' ? 'bg-orange-100 text-orange-800' :
                                    'bg-blue-100 text-blue-800'
                                  }`}>
                                  {lead.leadType}
                                </span>
                              </div>

                              <div className="text-sm text-gray-600">
                                <div className="flex items-center gap-1">
                                  <DollarSign className="h-3 w-3" />
                                  <span className="font-medium">₹{(lead.potentialValue || 0).toLocaleString()}</span>
                                </div>
                              </div>

                              <div className="text-xs text-gray-500">
                                <div className="flex items-center gap-1">
                                  <Users className="h-3 w-3" />
                                  <span>{lead.assignedTo?.firstName} {lead.assignedTo?.lastName}</span>
                                </div>
                              </div>

                              {lead.serviceInterest && (
                                <div className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded">
                                  {lead.serviceInterest}
                                </div>
                              )}

                              {/* Company Link Indicator */}
                              {lead.company && (
                                <div className="text-xs text-purple-600 flex items-center gap-1">
                                  <Building2 className="h-3 w-3" />
                                  <span>Linked to company</span>
                                </div>
                              )}

                              {/* Stage Proofs Indicator */}
                              {lead.stageProofs && lead.stageProofs.length > 0 && (
                                <div className="text-xs text-green-600 flex items-center gap-1 bg-green-50 px-2 py-1 rounded">
                                  <CheckCircle className="h-3 w-3" />
                                  {lead.stageProofs.length} proof(s)
                                </div>
                              )}

                              {lead.expectedCloseDate && (
                                <div className="text-xs text-gray-500 flex items-center gap-1">
                                  <Calendar className="h-3 w-3" />
                                  {new Date(lead.expectedCloseDate).toLocaleDateString()}
                                </div>
                              )}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Detailed Table View */}
          <div className="dashboard-card">
            <h3 className="text-lg font-semibold mb-4">All Leads - Detailed View</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Lead Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Company</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Sales Rep</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Value</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Stage</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {leads.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="px-6 py-12 text-center text-gray-500">
                        No leads found. Import leads to get started.
                      </td>
                    </tr>
                  ) : (
                    leads.map((lead) => (
                      <tr key={lead._id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{lead.name}</div>
                          <div className="text-sm text-gray-500">{lead.designation}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {lead.company ? (
                            <div>
                              <div className="text-sm font-medium text-gray-900">{lead.company.companyName}</div>
                              <div className="text-xs text-gray-500">{lead.company.industry}</div>
                            </div>
                          ) : (
                            <span className="text-xs text-gray-400">No company</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {lead.assignedTo?.firstName} {lead.assignedTo?.lastName}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          ₹{(lead.potentialValue || 0).toLocaleString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="px-2 py-1 text-xs font-medium rounded-full capitalize bg-blue-100 text-blue-800">
                            {lead.stage.replace('-', ' ')}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full capitalize ${lead.status === 'active' ? 'bg-green-100 text-green-800' :
                            lead.status === 'won' ? 'bg-blue-100 text-blue-800' :
                              lead.status === 'lost' ? 'bg-red-100 text-red-800' :
                                'bg-gray-100 text-gray-800'
                            }`}>
                            {lead.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <button
                            onClick={() => navigate(`/leads/${lead._id}`)}
                            className="text-primary-600 hover:text-primary-900"
                          >
                            <Eye className="h-5 w-5" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (currentView === 'targets') {
    return (
      <DashboardLayout sidebarActions={sidebarActions}>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Sales Targets & KPIs</h2>
              <p className="text-sm text-gray-500 mt-1">Manage and track sales targets for your team</p>
            </div>
            <button
              onClick={handleOpenCreateTargetModal}
              className="btn-primary flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Create Target
            </button>
          </div>

          {/* Summary Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="dashboard-card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Active Targets</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {targets.filter(t => t.status === 'active').length}
                  </p>
                </div>
                <Target className="h-8 w-8 text-primary-600" />
              </div>
            </div>
            <div className="dashboard-card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Completed</p>
                  <p className="text-2xl font-bold text-green-600">
                    {targets.filter(t => t.status === 'completed').length}
                  </p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
            </div>
            <div className="dashboard-card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Avg Progress</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {targets.filter(t => t.status === 'active').length > 0
                      ? Math.round(
                        targets
                          .filter(t => t.status === 'active')
                          .reduce((sum, t) => sum + t.progressPercentage, 0) /
                        targets.filter(t => t.status === 'active').length
                      )
                      : 0}%
                  </p>
                </div>
                <Activity className="h-8 w-8 text-blue-600" />
              </div>
            </div>
            <div className="dashboard-card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Team Members</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {salesTeam.length}
                  </p>
                </div>
                <Users className="h-8 w-8 text-gray-600" />
              </div>
            </div>
          </div>

          {/* Active Targets */}
          {targets.filter(t => t.status === 'active').length > 0 ? (
            <>
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Active Targets</h3>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {targets.filter(t => t.status === 'active').map((target) => {
                  // Check for duplicate targets for the same user in overlapping periods
                  const duplicates = targets.filter(t =>
                    t.status === 'active' &&
                    t.userId?._id === target.userId?._id &&
                    t._id !== target._id &&
                    (
                      (new Date(t.startDate) <= new Date(target.endDate) && new Date(t.endDate) >= new Date(target.startDate))
                    )
                  );
                  const hasDuplicate = duplicates.length > 0;

                  return (
                    <div key={target._id} className={`dashboard-card hover:shadow-lg transition-shadow ${hasDuplicate ? 'border-2 border-red-300 bg-red-50' : ''}`}>
                      {hasDuplicate && (
                        <div className="mb-3 p-2 bg-red-100 border border-red-300 rounded-lg flex items-start gap-2">
                          <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                          <div className="flex-1">
                            <p className="text-sm font-semibold text-red-900">Duplicate Target Warning!</p>
                            <p className="text-xs text-red-700">This user has multiple overlapping targets. Please delete one.</p>
                          </div>
                        </div>
                      )}
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">
                            {target.userId?.firstName} {target.userId?.lastName}
                          </h3>
                          <p className="text-sm text-gray-500">{target.userId?.email}</p>
                          <p className="text-sm text-gray-600 capitalize mt-1 font-medium">{target.targetPeriod} Target</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="px-3 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
                            Active
                          </span>
                          <button
                            onClick={() => handleDeleteTarget(target._id)}
                            className="p-1 text-red-600 hover:text-red-800 hover:bg-red-100 rounded"
                            title="Delete Target"
                          >
                            <X className="h-5 w-5" />
                          </button>
                        </div>
                      </div>

                      {/* Progress Bar */}
                      <div className="mb-4">
                        <div className="flex justify-between text-sm mb-2">
                          <span className="text-gray-600 font-medium">Overall Progress</span>
                          <span className="font-bold text-gray-900">{target.progressPercentage}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                          <div
                            className={`h-3 rounded-full transition-all ${target.progressPercentage >= 100 ? 'bg-green-500' :
                              target.progressPercentage >= 75 ? 'bg-blue-500' :
                                target.progressPercentage >= 50 ? 'bg-yellow-500' :
                                  'bg-red-500'
                              }`}
                            style={{ width: `${Math.min(target.progressPercentage, 100)}%` }}
                          ></div>
                        </div>
                      </div>

                      {/* Target Details Grid - Sales Funnel */}
                      <div className="grid grid-cols-2 gap-4 mb-3">
                        <div className="p-3 bg-gray-50 rounded-lg">
                          <div className="text-xs text-gray-500 mb-1">Revenue Target</div>
                          <div className="font-semibold text-gray-900">₹{target.revenueTarget.toLocaleString()}</div>
                        </div>
                        <div className="p-3 bg-green-50 rounded-lg">
                          <div className="text-xs text-gray-500 mb-1">Revenue Achieved</div>
                          <div className="font-semibold text-green-600">₹{target.revenueAchieved.toLocaleString()}</div>
                        </div>
                      </div>

                      {/* Sales Funnel: Companies → Leads → Conversions */}
                      <div className="space-y-2 mb-3">
                        <div className="text-xs font-semibold text-gray-700 uppercase tracking-wide mb-2">
                          Sales Funnel Progress
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                          <div className="p-2 bg-orange-50 rounded-lg border border-orange-200">
                            <div className="text-xs text-gray-600 mb-1">Companies</div>
                            <div className="font-semibold text-gray-900">
                              {target.companiesAchieved || 0} / {target.companiesTarget || 0}
                            </div>
                          </div>
                          <div className="p-2 bg-blue-50 rounded-lg border border-blue-200">
                            <div className="text-xs text-gray-600 mb-1">Leads</div>
                            <div className="font-semibold text-gray-900">
                              {target.leadsAchieved || 0} / {target.leadsTarget || 0}
                            </div>
                          </div>
                          <div className="p-2 bg-purple-50 rounded-lg border border-purple-200">
                            <div className="text-xs text-gray-600 mb-1">Conversions</div>
                            <div className="font-semibold text-gray-900">
                              {target.conversionsAchieved || 0} / {target.conversionsTarget || 0}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Period */}
                      <div className="pt-3 border-t">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">Period:</span>
                          <span className="font-medium text-gray-900">
                            {formatDate(target.startDate)} - {formatDate(target.endDate)}
                          </span>
                        </div>
                      </div>

                      {/* Notes */}
                      {target.notes && (
                        <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                          <p className="text-xs font-medium text-blue-900 mb-1">Notes:</p>
                          <p className="text-sm text-blue-800">{target.notes}</p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </>
          ) : (
            <div className="dashboard-card text-center py-12">
              <Target className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Active Targets</h3>
              <p className="text-gray-500 mb-4">Create targets for your team members to track their performance</p>
              <button
                onClick={handleOpenCreateTargetModal}
                className="btn-primary inline-flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                Create Your First Target
              </button>
            </div>
          )}

          {/* Completed Targets */}
          {targets.filter(t => t.status === 'completed').length > 0 && (
            <>
              <div className="flex items-center justify-between mt-8">
                <h3 className="text-lg font-semibold text-gray-900">Completed Targets</h3>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {targets.filter(t => t.status === 'completed').map((target) => (
                  <div key={target._id} className="dashboard-card">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h4 className="font-semibold text-gray-900">
                          {target.userId?.firstName} {target.userId?.lastName}
                        </h4>
                        <p className="text-xs text-gray-500 capitalize">{target.targetPeriod}</p>
                      </div>
                      <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                        Completed
                      </span>
                    </div>
                    <div className="text-center py-3">
                      <div className={`text-3xl font-bold ${target.progressPercentage >= 100 ? 'text-green-600' : 'text-orange-600'
                        }`}>
                        {target.progressPercentage}%
                      </div>
                      <div className="text-sm text-gray-500 mt-1">Achievement</div>
                    </div>
                    <div className="text-sm text-gray-600">
                      ₹{target.revenueAchieved.toLocaleString()} / ₹{target.revenueTarget.toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Create Target Modal */}
        {showCreateTargetModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto relative">
              {/* Loading Overlay */}
              {isCreatingTarget && (
                <div className="absolute inset-0 bg-white bg-opacity-90 flex items-center justify-center z-10 rounded-lg">
                  <div className="text-center">
                    <svg className="animate-spin h-12 w-12 text-primary-600 mx-auto mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <p className="text-gray-700 font-medium">Creating target...</p>
                    <p className="text-sm text-gray-500 mt-1">Sending email notification...</p>
                  </div>
                </div>
              )}
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">Create Sales Target</h2>
                    <p className="text-sm text-gray-500 mt-1">Set targets for your team members</p>
                  </div>
                  <button
                    onClick={() => setShowCreateTargetModal(false)}
                    disabled={isCreatingTarget}
                    className="text-gray-400 hover:text-gray-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <X className="h-6 w-6" />
                  </button>
                </div>

                <form onSubmit={handleCreateTarget} className="space-y-6">
                  {/* Team Member Selection */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Team Member <span className="text-red-500">*</span>
                    </label>
                    <select
                      required
                      value={newTarget.userId}
                      onChange={(e) => setNewTarget({ ...newTarget, userId: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    >
                      <option value="">Select team member</option>
                      {salesTeam.map((member) => (
                        <option key={member._id} value={member._id}>
                          {member.firstName} {member.lastName} ({member.email})
                        </option>
                      ))}
                    </select>
                    {salesTeam.length === 0 && (
                      <p className="text-xs text-red-500 mt-1">No team members available</p>
                    )}
                  </div>

                  {/* Revenue Target Link (Optional) */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Link to Co-Founder Revenue Target <span className="text-gray-400 text-xs">(Optional)</span>
                    </label>
                    <select
                      value={newTarget.revenueTargetId}
                      onChange={(e) => {
                        const selectedId = e.target.value;
                        setNewTarget({ ...newTarget, revenueTargetId: selectedId });
                        setSelectedRevenueTargetId(selectedId);
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    >
                      <option value="">None - Create Independent Target</option>
                      {cofounderRevenueTargets.map((target) => (
                        <option key={target._id} value={target._id}>
                          {target.targetPeriod.charAt(0).toUpperCase() + target.targetPeriod.slice(1)} -
                          {new Date(target.startDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })} -
                          ₹{target.targetAmount?.toLocaleString('en-IN') || '0'}
                          {target.assignedTo?.firstName && ` (${target.assignedTo.firstName})`}
                        </option>
                      ))}
                    </select>
                    {cofounderRevenueTargets.length === 0 && (
                      <p className="text-xs text-gray-500 mt-1">No revenue targets available from Co-Founder</p>
                    )}
                    {selectedRevenueTargetId && (
                      <p className="text-xs text-blue-600 mt-1">
                        ℹ️ This sales target will be linked to the selected revenue target
                      </p>
                    )}
                  </div>

                  {/* Target Period and Dates */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Target Period <span className="text-red-500">*</span>
                      </label>
                      <select
                        required
                        value={newTarget.targetPeriod}
                        onChange={(e) => {
                          const period = e.target.value;
                          setNewTarget({ ...newTarget, targetPeriod: period });
                          // Auto-calculate end date if start month is selected
                          if (newTarget.startDate) {
                            const startDate = new Date(newTarget.startDate);
                            let endDate = new Date(startDate);

                            if (period === 'monthly') {
                              endDate.setMonth(endDate.getMonth() + 1);
                            } else if (period === 'quarterly') {
                              endDate.setMonth(endDate.getMonth() + 3);
                            } else if (period === 'half-yearly') {
                              endDate.setMonth(endDate.getMonth() + 6);
                            } else if (period === 'yearly') {
                              endDate.setFullYear(endDate.getFullYear() + 1);
                            }
                            endDate.setDate(endDate.getDate() - 1); // Last day of period

                            setNewTarget({
                              ...newTarget,
                              targetPeriod: period,
                              endDate: endDate.toISOString().split('T')[0]
                            });
                          }
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      >
                        <option value="monthly">Monthly</option>
                        <option value="quarterly">Quarterly (3 months)</option>
                        <option value="half-yearly">Half-Yearly (6 months)</option>
                        <option value="yearly">Yearly</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Start Month <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="month"
                        required
                        value={newTarget.startDate ? newTarget.startDate.substring(0, 7) : ''}
                        onChange={(e) => {
                          const startMonth = e.target.value; // Format: YYYY-MM
                          const startDate = new Date(startMonth + '-01');
                          let endDate = new Date(startDate);

                          if (newTarget.targetPeriod === 'monthly') {
                            endDate.setMonth(endDate.getMonth() + 1);
                          } else if (newTarget.targetPeriod === 'quarterly') {
                            endDate.setMonth(endDate.getMonth() + 3);
                          } else if (newTarget.targetPeriod === 'half-yearly') {
                            endDate.setMonth(endDate.getMonth() + 6);
                          } else if (newTarget.targetPeriod === 'yearly') {
                            endDate.setFullYear(endDate.getFullYear() + 1);
                          }
                          endDate.setDate(endDate.getDate() - 1); // Last day of period

                          setNewTarget({
                            ...newTarget,
                            startDate: startDate.toISOString().split('T')[0],
                            endDate: endDate.toISOString().split('T')[0]
                          });
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      />
                      {newTarget.startDate && newTarget.endDate && (
                        <p className="text-xs text-gray-500 mt-1">
                          {new Date(newTarget.startDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })} - {new Date(newTarget.endDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Targets */}
                  <div className="space-y-4">
                    <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">
                      Target Metrics (Sales Funnel)
                    </h3>
                    <p className="text-xs text-gray-600">
                      Companies → Leads → Conversions (Closed Deals)
                    </p>

                    {/* Revenue Target */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Revenue Target (₹) <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        required
                        min="0"
                        step="1000"
                        value={newTarget.revenueTarget}
                        onChange={(e) => setNewTarget({ ...newTarget, revenueTarget: e.target.value })}
                        placeholder="e.g., 500000"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      />
                      {newTarget.revenueTarget && (
                        <p className="text-xs text-gray-500 mt-1">
                          ₹{Number(newTarget.revenueTarget).toLocaleString()}
                        </p>
                      )}
                    </div>

                    {/* Sales Funnel Targets */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Companies Target
                        </label>
                        <input
                          type="number"
                          min="0"
                          value={newTarget.companiesTarget}
                          onChange={(e) => setNewTarget({ ...newTarget, companiesTarget: e.target.value })}
                          placeholder="e.g., 30"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        />
                        <p className="text-xs text-gray-500 mt-1">New companies to submit</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Leads Target
                        </label>
                        <input
                          type="number"
                          min="0"
                          value={newTarget.leadsTarget}
                          onChange={(e) => setNewTarget({ ...newTarget, leadsTarget: e.target.value })}
                          placeholder="e.g., 20"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        />
                        <p className="text-xs text-gray-500 mt-1">Leads to generate</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Conversions Target
                        </label>
                        <input
                          type="number"
                          min="0"
                          value={newTarget.conversionsTarget}
                          onChange={(e) => setNewTarget({ ...newTarget, conversionsTarget: e.target.value })}
                          placeholder="e.g., 5"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        />
                        <p className="text-xs text-gray-500 mt-1">Deals to close</p>
                      </div>
                    </div>
                  </div>

                  {/* Notes */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Notes / Instructions
                    </label>
                    <textarea
                      rows="4"
                      value={newTarget.notes}
                      onChange={(e) => setNewTarget({ ...newTarget, notes: e.target.value })}
                      placeholder="Add any instructions or notes for the team member..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    ></textarea>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex justify-end gap-3 pt-4 border-t">
                    <button
                      type="button"
                      onClick={() => {
                        setShowCreateTargetModal(false);
                        setNewTarget({
                          userId: '',
                          revenueTargetId: '',
                          targetPeriod: 'monthly',
                          startDate: '',
                          endDate: '',
                          revenueTarget: '',
                          companiesTarget: '',
                          leadsTarget: '',
                          conversionsTarget: '',
                          notes: ''
                        });
                        setSelectedRevenueTargetId('');
                      }}
                      disabled={isCreatingTarget}
                      className="px-6 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={!newTarget.userId || !newTarget.revenueTarget || isCreatingTarget}
                      className="btn-primary px-6 py-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                      {isCreatingTarget ? (
                        <>
                          <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Creating...
                        </>
                      ) : (
                        'Create Target'
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </DashboardLayout>
    );
  }

  // Main Dashboard View
  return (
    <DashboardLayout sidebarActions={sidebarActions}>
      <div className="space-y-6">
        <SalesSummaryWidgets
          salesData={{
            teamStats,
            overallStats,
            salesTeam,
            analytics,
            recentSales,
            targets,
            revenueTargets,
            pendingCompanies,
            recentActivities,
            leads,
            tasks: {
              total: salesTasks.length,
              completed: salesTasks.filter(t => t.status === 'completed' || t.status === 'done').length,
              pending: salesTasks.filter(t => t.status !== 'completed' && t.status !== 'done').length,
              percentage: salesTasks.length > 0 ? Math.round((salesTasks.filter(t => t.status === 'completed' || t.status === 'done').length / salesTasks.length) * 100) : 0
            },
            pipeline: pipelineStats
          }}
        />
      </div>

      {/* Create Target Modal */}
      {showCreateTargetModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto relative">
            {/* Loading Overlay */}
            {isCreatingTarget && (
              <div className="absolute inset-0 bg-white bg-opacity-90 flex items-center justify-center z-10 rounded-lg">
                <div className="text-center">
                  <svg className="animate-spin h-12 w-12 text-primary-600 mx-auto mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <p className="text-gray-700 font-medium">Creating target...</p>
                  <p className="text-sm text-gray-500 mt-1">Sending email notification...</p>
                </div>
              </div>
            )}
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Create Sales Target</h2>
                  <p className="text-sm text-gray-500 mt-1">Set targets for your team members</p>
                </div>
                <button
                  onClick={() => setShowCreateTargetModal(false)}
                  disabled={isCreatingTarget}
                  className="text-gray-400 hover:text-gray-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              <form onSubmit={handleCreateTarget} className="space-y-6">
                {/* Team Member Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Team Member <span className="text-red-500">*</span>
                  </label>
                  <select
                    required
                    value={newTarget.userId}
                    onChange={(e) => setNewTarget({ ...newTarget, userId: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  >
                    <option value="">Select team member</option>
                    {salesTeam.map((member) => (
                      <option key={member._id} value={member._id}>
                        {member.firstName} {member.lastName} ({member.email})
                      </option>
                    ))}
                  </select>
                  {salesTeam.length === 0 && (
                    <p className="text-xs text-red-500 mt-1">No team members available</p>
                  )}
                </div>

                {/* Revenue Target Link (Optional) */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Link to Co-Founder Revenue Target <span className="text-gray-400 text-xs">(Optional)</span>
                  </label>
                  <select
                    value={newTarget.revenueTargetId}
                    onChange={(e) => {
                      const selectedId = e.target.value;
                      setNewTarget({ ...newTarget, revenueTargetId: selectedId });
                      setSelectedRevenueTargetId(selectedId);
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  >
                    <option value="">None - Create Independent Target</option>
                    {cofounderRevenueTargets.map((target) => (
                      <option key={target._id} value={target._id}>
                        {target.targetPeriod.charAt(0).toUpperCase() + target.targetPeriod.slice(1)} -
                        {new Date(target.startDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })} -
                        ₹{target.targetAmount?.toLocaleString('en-IN') || '0'}
                        {target.assignedTo?.firstName && ` (${target.assignedTo.firstName})`}
                      </option>
                    ))}
                  </select>
                  {cofounderRevenueTargets.length === 0 && (
                    <p className="text-xs text-gray-500 mt-1">No revenue targets available from Co-Founder</p>
                  )}
                  {selectedRevenueTargetId && (
                    <p className="text-xs text-blue-600 mt-1">
                      ℹ️ This sales target will be linked to the selected revenue target
                    </p>
                  )}
                </div>

                {/* Target Period and Dates */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Target Period <span className="text-red-500">*</span>
                    </label>
                    <select
                      required
                      value={newTarget.targetPeriod}
                      onChange={(e) => {
                        const period = e.target.value;
                        setNewTarget({ ...newTarget, targetPeriod: period });
                        // Auto-calculate end date if start month is selected
                        if (newTarget.startDate) {
                          const startDate = new Date(newTarget.startDate);
                          let endDate = new Date(startDate);

                          if (period === 'monthly') {
                            endDate.setMonth(endDate.getMonth() + 1);
                          } else if (period === 'quarterly') {
                            endDate.setMonth(endDate.getMonth() + 3);
                          } else if (period === 'half-yearly') {
                            endDate.setMonth(endDate.getMonth() + 6);
                          } else if (period === 'yearly') {
                            endDate.setFullYear(endDate.getFullYear() + 1);
                          }
                          endDate.setDate(endDate.getDate() - 1); // Last day of period

                          setNewTarget({
                            ...newTarget,
                            targetPeriod: period,
                            endDate: endDate.toISOString().split('T')[0]
                          });
                        }
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    >
                      <option value="monthly">Monthly</option>
                      <option value="quarterly">Quarterly (3 months)</option>
                      <option value="half-yearly">Half-Yearly (6 months)</option>
                      <option value="yearly">Yearly</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Start Month <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="month"
                      required
                      value={newTarget.startDate ? newTarget.startDate.substring(0, 7) : ''}
                      onChange={(e) => {
                        const startMonth = e.target.value; // Format: YYYY-MM
                        const startDate = new Date(startMonth + '-01');
                        let endDate = new Date(startDate);

                        if (newTarget.targetPeriod === 'monthly') {
                          endDate.setMonth(endDate.getMonth() + 1);
                        } else if (newTarget.targetPeriod === 'quarterly') {
                          endDate.setMonth(endDate.getMonth() + 3);
                        } else if (newTarget.targetPeriod === 'half-yearly') {
                          endDate.setMonth(endDate.getMonth() + 6);
                        } else if (newTarget.targetPeriod === 'yearly') {
                          endDate.setFullYear(endDate.getFullYear() + 1);
                        }
                        endDate.setDate(endDate.getDate() - 1); // Last day of period

                        setNewTarget({
                          ...newTarget,
                          startDate: startDate.toISOString().split('T')[0],
                          endDate: endDate.toISOString().split('T')[0]
                        });
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    />
                    {newTarget.startDate && newTarget.endDate && (
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(newTarget.startDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })} - {new Date(newTarget.endDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                      </p>
                    )}
                  </div>
                </div>

                {/* Targets */}
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">Target Metrics</h3>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Revenue Target (₹) <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        required
                        min="0"
                        step="1000"
                        value={newTarget.revenueTarget}
                        onChange={(e) => setNewTarget({ ...newTarget, revenueTarget: e.target.value })}
                        placeholder="e.g., 500000"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      />
                      {newTarget.revenueTarget && (
                        <p className="text-xs text-gray-500 mt-1">
                          ₹{Number(newTarget.revenueTarget).toLocaleString()}
                        </p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Leads Target
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={newTarget.leadsTarget}
                        onChange={(e) => setNewTarget({ ...newTarget, leadsTarget: e.target.value })}
                        placeholder="e.g., 20"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Conversions Target
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={newTarget.conversionsTarget}
                        onChange={(e) => setNewTarget({ ...newTarget, conversionsTarget: e.target.value })}
                        placeholder="e.g., 5"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Notes */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Notes / Instructions
                  </label>
                  <textarea
                    rows="4"
                    value={newTarget.notes}
                    onChange={(e) => setNewTarget({ ...newTarget, notes: e.target.value })}
                    placeholder="Add any instructions or notes for the team member..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  ></textarea>
                </div>

                {/* Action Buttons */}
                <div className="flex justify-end gap-3 pt-4 border-t">
                  <button
                    type="button"
                    onClick={() => {
                      setShowCreateTargetModal(false);
                      setNewTarget({
                        userId: '',
                        revenueTargetId: '',
                        targetPeriod: 'monthly',
                        startDate: '',
                        endDate: '',
                        revenueTarget: '',
                        companiesTarget: '',
                        leadsTarget: '',
                        conversionsTarget: '',
                        notes: ''
                      });
                      setSelectedRevenueTargetId('');
                    }}
                    disabled={isCreatingTarget}
                    className="px-6 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={!newTarget.userId || !newTarget.revenueTarget || isCreatingTarget}
                    className="btn-primary px-6 py-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {isCreatingTarget ? (
                      <>
                        <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Creating...
                      </>
                    ) : (
                      'Create Target'
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

// Strategy Modal Component
const StrategyModal = ({ target, salesTeam, onClose, onSubmit }) => {
  const [locations, setLocations] = useState([
    { location: '', targetAmount: '', reasoning: '', assignedReps: [] }
  ]);
  const [expectedCompanies, setExpectedCompanies] = useState('');
  const [expectedLeads, setExpectedLeads] = useState('');

  const addLocation = () => {
    setLocations([...locations, { location: '', targetAmount: '', reasoning: '', assignedReps: [] }]);
  };

  const removeLocation = (index) => {
    setLocations(locations.filter((_, i) => i !== index));
  };

  const updateLocation = (index, field, value) => {
    const updated = [...locations];
    updated[index][field] = value;
    setLocations(updated);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const strategyData = {
      targetLocations: locations.map(loc => ({
        ...loc,
        targetAmount: Number(loc.targetAmount)
      })),
      expectedCompanies: Number(expectedCompanies),
      expectedLeads: Number(expectedLeads)
    };
    onSubmit(target._id, strategyData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <h2 className="text-2xl font-bold mb-4">Propose Strategy for Revenue Target</h2>

          <div className="bg-blue-50 rounded-lg p-4 mb-6">
            <div className="font-semibold text-gray-900 mb-2">Target: ₹{target.targetAmount.toLocaleString()}</div>
            <div className="text-sm text-gray-600">
              Period: {(() => {
                const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
                  'July', 'August', 'September', 'October', 'November', 'December'];
                return target.targetMonth && target.targetYear
                  ? `${monthNames[target.targetMonth - 1]} ${target.targetYear}`
                  : target.targetPeriod;
              })()} ({target.targetPeriod})
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-lg font-semibold">Target Locations</h3>
                <button
                  type="button"
                  onClick={addLocation}
                  className="text-sm text-blue-600 hover:text-blue-700"
                >
                  + Add Location
                </button>
              </div>

              {locations.map((location, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4 mb-3">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Location *
                      </label>
                      <input
                        type="text"
                        required
                        value={location.location}
                        onChange={(e) => updateLocation(index, 'location', e.target.value)}
                        placeholder="e.g., Mumbai, Delhi, Bangalore"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Target Amount (₹) *
                      </label>
                      <input
                        type="number"
                        required
                        value={location.targetAmount}
                        onChange={(e) => updateLocation(index, 'targetAmount', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      />
                    </div>
                  </div>
                  <div className="mb-3">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Reasoning *
                    </label>
                    <textarea
                      required
                      rows="2"
                      value={location.reasoning}
                      onChange={(e) => updateLocation(index, 'reasoning', e.target.value)}
                      placeholder="Why target this location?"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    ></textarea>
                  </div>
                  <div className="mb-3">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Assign Sales Rep
                    </label>
                    <select
                      value={location.assignedReps[0] || ''}
                      onChange={(e) => updateLocation(index, 'assignedReps', e.target.value ? [e.target.value] : [])}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    >
                      <option value="">Select sales representative</option>
                      {salesTeam
                        .filter(rep => rep.role === 'service-onboarding')
                        .map(rep => (
                          <option key={rep._id} value={rep._id}>
                            {rep.firstName} {rep.lastName} - {rep.email}
                          </option>
                        ))}
                    </select>
                    <p className="text-xs text-gray-500 mt-1">Choose a sales individual to assign to this location</p>
                  </div>
                  {locations.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeLocation(index)}
                      className="text-sm text-red-600 hover:text-red-700"
                    >
                      Remove Location
                    </button>
                  )}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Expected Companies *
                </label>
                <input
                  type="number"
                  required
                  value={expectedCompanies}
                  onChange={(e) => setExpectedCompanies(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Expected Leads *
                </label>
                <input
                  type="number"
                  required
                  value={expectedLeads}
                  onChange={(e) => setExpectedLeads(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn-primary"
              >
                Submit Strategy
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

// Company Approval Modal Component
const CompanyApprovalModal = ({ company, salesTeam, onClose, onApprove }) => {
  const [approvalStatus, setApprovalStatus] = useState('approved');
  const [approvalNotes, setApprovalNotes] = useState('');
  const [assignedTo, setAssignedTo] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Debug: Log company data when modal opens
  console.log('🔍 CompanyApprovalModal - Full company data:', company);
  console.log('📝 New fields check:', {
    overview: company.overview,
    geographicalHotspots: company.geographicalHotspots,
    annualRevenueUSD: company.annualRevenueUSD,
    currentTechStack: company.currentTechStack,
    currentPainPoints: company.currentPainPoints,
    automationSaaSUsed: company.automationSaaSUsed,
    expectedROIImpact: company.expectedROIImpact,
    keyChallenges: company.keyChallenges,
    howHustleHouseCanHelp: company.howHustleHouseCanHelp,
    additionalNotes: company.additionalNotes,
    wrtRoiPriorityLevel: company.wrtRoiPriorityLevel,
    proofOfConcept: company.proofOfConcept,
    latestNews: company.latestNews
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await onApprove(company._id, approvalStatus, approvalNotes, assignedTo || company.identifiedBy._id);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto relative">
        {/* Loading Overlay */}
        {isSubmitting && (
          <div className="absolute inset-0 bg-white bg-opacity-90 flex items-center justify-center z-10 rounded-lg">
            <div className="text-center">
              <svg className="animate-spin h-12 w-12 text-primary-600 mx-auto mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <p className="text-gray-700 font-medium">Processing decision...</p>
              <p className="text-sm text-gray-500 mt-1">Sending email notification...</p>
            </div>
          </div>
        )}
        <div className="p-6">
          <h2 className="text-2xl font-bold mb-4">Review Company: {company.companyName}</h2>

          <div className="bg-gray-50 rounded-lg p-4 mb-6 space-y-4">
            {/* Company Overview */}
            {company.overview && (
              <div>
                <span className="text-gray-600 font-semibold">Company Overview / Description:</span>
                <div className="text-sm mt-1 text-gray-800">{company.overview}</div>
              </div>
            )}

            {/* Basic Info Grid */}
            <div className="grid grid-cols-2 gap-3 text-sm pt-3 border-t">
              <div>
                <span className="text-gray-500">Industry:</span>
                <div className="font-medium">{company.industry || 'Not specified'}</div>
              </div>
              <div>
                <span className="text-gray-500">Working Employees:</span>
                <div className="font-medium">{company.employeeCount || 'Unknown'}</div>
              </div>
              <div>
                <span className="text-gray-500">Country / Region:</span>
                <div className="font-medium">
                  {company.location?.country || company.location?.city || company.location?.state
                    ? `${company.location?.city || ''}${company.location?.city && company.location?.state ? ', ' : ''}${company.location?.state || ''}${(company.location?.city || company.location?.state) && company.location?.country ? ', ' : ''}${company.location?.country || ''}`
                    : 'Not specified'}
                </div>
              </div>
              <div>
                <span className="text-gray-500">Geographical Hotspots:</span>
                <div className="font-medium">{company.geographicalHotspots || 'Not specified'}</div>
              </div>
              <div>
                <span className="text-gray-500">Annual Revenue (USD):</span>
                <div className="font-medium">{company.annualRevenueUSD || company.revenue || 'Unknown'}</div>
              </div>
              {company.website && (
                <div>
                  <span className="text-gray-500">Website:</span>
                  <div className="font-medium">
                    <a href={company.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                      {company.website}
                    </a>
                  </div>
                </div>
              )}
            </div>

            {/* Tech & Current Situation */}
            <div className="pt-3 border-t space-y-2 text-sm">
              {company.currentTechStack && (
                <div>
                  <span className="text-gray-600 font-semibold">Current Tech Stack:</span>
                  <div className="mt-1 text-gray-800">{company.currentTechStack}</div>
                </div>
              )}
              {(company.currentPainPoints || company.research?.painPoints) && (
                <div>
                  <span className="text-gray-600 font-semibold">Current Pain Points:</span>
                  <div className="mt-1 text-gray-800">{company.currentPainPoints || company.research?.painPoints}</div>
                </div>
              )}
              {company.automationSaaSUsed && (
                <div>
                  <span className="text-gray-600 font-semibold">Automation / SaaS Solutions Used:</span>
                  <div className="mt-1 text-gray-800">{company.automationSaaSUsed}</div>
                </div>
              )}
            </div>

            {/* Business Insights */}
            <div className="pt-3 border-t space-y-2 text-sm">
              {company.expectedROIImpact && (
                <div>
                  <span className="text-gray-600 font-semibold">Expected ROI Impact (Qualitative/%):</span>
                  <div className="mt-1 text-gray-800">{company.expectedROIImpact}</div>
                </div>
              )}
              {company.keyChallenges && (
                <div>
                  <span className="text-gray-600 font-semibold">Key Challenges:</span>
                  <div className="mt-1 text-gray-800">{company.keyChallenges}</div>
                </div>
              )}
              {company.howHustleHouseCanHelp && (
                <div>
                  <span className="text-gray-600 font-semibold">How Hustle House Can Help (Pitch Angle):</span>
                  <div className="mt-1 text-gray-800">{company.howHustleHouseCanHelp}</div>
                </div>
              )}
            </div>

            {/* Additional Details */}
            <div className="pt-3 border-t space-y-2 text-sm">
              {company.additionalNotes && (
                <div>
                  <span className="text-gray-600 font-semibold">Additional Notes / Comments:</span>
                  <div className="mt-1 text-gray-800">{company.additionalNotes}</div>
                </div>
              )}
              <div className="grid grid-cols-2 gap-3">
                {company.wrtRoiPriorityLevel && (
                  <div>
                    <span className="text-gray-500">WRT ROI - Priority Level:</span>
                    <div className="font-medium capitalize">{company.wrtRoiPriorityLevel}</div>
                  </div>
                )}
                {company.potentialValue && (
                  <div>
                    <span className="text-gray-500">Potential Value:</span>
                    <div className="font-medium text-green-600">₹{company.potentialValue?.toLocaleString()}</div>
                  </div>
                )}
              </div>
              {company.proofOfConcept && (
                <div>
                  <span className="text-gray-600 font-semibold">Proof of Concept:</span>
                  <div className="mt-1 text-gray-800">{company.proofOfConcept}</div>
                </div>
              )}
              {company.latestNews && (
                <div>
                  <span className="text-gray-600 font-semibold">Latest Company/Industry News:</span>
                  <div className="mt-1 text-gray-800">{company.latestNews}</div>
                </div>
              )}
            </div>

            {/* Research Notes (if any additional fields exist) */}
            {company.research && (company.research.keyDecisionMakers || company.research.competitors || company.research.budget || company.research.timeline || company.research.potentialServices || company.research.notes) && (
              <div className="pt-3 border-t">
                <div className="font-semibold text-gray-700 mb-2">Additional Research Notes:</div>
                <div className="space-y-1 text-sm">
                  {company.research.keyDecisionMakers && (
                    <div><span className="text-gray-600">Decision Makers:</span> {company.research.keyDecisionMakers}</div>
                  )}
                  {company.research.competitors && (
                    <div><span className="text-gray-600">Competitors:</span> {company.research.competitors}</div>
                  )}
                  {company.research.budget && (
                    <div><span className="text-gray-600">Budget:</span> {company.research.budget}</div>
                  )}
                  {company.research.timeline && (
                    <div><span className="text-gray-600">Timeline:</span> {company.research.timeline}</div>
                  )}
                  {company.research.potentialServices && (
                    <div><span className="text-gray-600">Potential Services:</span> {company.research.potentialServices}</div>
                  )}
                  {company.research.notes && (
                    <div><span className="text-gray-600">Notes:</span> {company.research.notes}</div>
                  )}
                </div>
              </div>
            )}

            {company.studyDocuments && company.studyDocuments.length > 0 && (
              <div className="pt-3 border-t">
                <div className="font-medium text-gray-700 mb-2">📎 Uploaded Documents:</div>
                <div className="space-y-2">
                  {company.studyDocuments.map((doc, index) => (
                    <div key={index} className="flex items-center justify-between bg-white p-2 rounded border">
                      <div className="flex items-center gap-2">
                        <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <div>
                          <div className="font-medium text-sm">{doc.name}</div>
                          {doc.description && (
                            <div className="text-xs text-gray-500">{doc.description}</div>
                          )}
                          <div className="text-xs text-gray-400">
                            {doc.documentType && <span className="capitalize">{doc.documentType.replace('-', ' ')}</span>}
                            {doc.uploadedAt && <span> • {new Date(doc.uploadedAt).toLocaleDateString()}</span>}
                          </div>
                        </div>
                      </div>
                      <a
                        href={`${import.meta.env.VITE_API_URL?.replace('/api', '') || window.location.origin}/${doc.filePath}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                      >
                        View
                      </a>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Approval Decision *
              </label>
              <select
                required
                value={approvalStatus}
                onChange={(e) => setApprovalStatus(e.target.value)}
                disabled={isSubmitting}
                className="w-full px-3 py-2 border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <option value="approved">Approve</option>
                <option value="rejected">Reject</option>
                <option value="needs-revision">Needs Revision</option>
              </select>
            </div>

            {approvalStatus === 'approved' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Assign to Sales Rep
                </label>
                <select
                  value={assignedTo}
                  onChange={(e) => setAssignedTo(e.target.value)}
                  disabled={isSubmitting}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <option value="">Keep with {company.identifiedBy?.firstName} {company.identifiedBy?.lastName}</option>
                  {salesTeam
                    .filter(rep => rep._id !== company.identifiedBy?._id)
                    .map(rep => (
                      <option key={rep._id} value={rep._id}>
                        Reassign to {rep.firstName} {rep.lastName}
                      </option>
                    ))}
                </select>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Notes
              </label>
              <textarea
                rows="3"
                value={approvalNotes}
                onChange={(e) => setApprovalNotes(e.target.value)}
                disabled={isSubmitting}
                placeholder="Add your feedback or instructions..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
              ></textarea>
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className={`px-4 py-2 rounded-md text-white flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed ${approvalStatus === 'approved' ? 'bg-green-600 hover:bg-green-700' :
                  approvalStatus === 'rejected' ? 'bg-red-600 hover:bg-red-700' :
                    'bg-yellow-600 hover:bg-yellow-700'
                  }`}
              >
                {isSubmitting ? (
                  <>
                    <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Processing...
                  </>
                ) : (
                  'Submit Decision'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default HeadOfSalesDashboard;
