import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  Briefcase,
  Folder,
  Calendar,
  Clock,
  Plus,
  MoreHorizontal,
  CheckCircle,
  AlertCircle,
  Edit,
  Trash2,
  UserCheck,

  Zap,
  ClipboardCheck,
  DollarSign,
  TrendingUp,
  Building2,
  Target,
  Eye,
  CheckSquare,
  BarChart2
} from 'lucide-react';
import DashboardLayout from '../components/DashboardLayout';

import CoFounderLeaveApproval from '../components/CoFounderLeaveApproval';
import AttendanceManagement from '../components/AttendanceManagement';
import CoFounderAttendanceOverview from '../components/CoFounderAttendanceOverview';
import AnalyticsDashboard from '../components/AnalyticsDashboard';

import CoFounderSummaryWidgets from '../components/CoFounderSummaryWidgets';
import SalesSummaryWidgets from '../components/SalesSummaryWidgets';
import api from '../utils/api';
import { formatDate } from '../utils/helpers';
import { showToast } from '../utils/toast';
import StatCard from '../components/StatCard';
import ClientManagementDashboard from '../components/ClientManagementDashboard';

const CoFounderDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [managers, setManagers] = useState([]);
  const [attendanceSummary, setAttendanceSummary] = useState({});
  const [payrollSummary, setPayrollSummary] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Persist current view in localStorage to maintain state across page reloads
  const [currentView, setCurrentView] = useState(() => {
    const savedView = localStorage.getItem('cofounderDashboardView');
    return savedView || 'dashboard';
  });

  // Save view to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('cofounderDashboardView', currentView);
  }, [currentView]);

  // Sales/Revenue data
  const [salesDashboardData, setSalesDashboardData] = useState(null);
  const [showCreateTargetModal, setShowCreateTargetModal] = useState(false);
  const [selectedTarget, setSelectedTarget] = useState(null);
  const [showStrategyModal, setShowStrategyModal] = useState(false);

  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const [selectedProject, setSelectedProject] = useState(null);

  // New project form state
  const [newProject, setNewProject] = useState({
    name: '',
    description: '',
    deadline: '',
    documentation: '',
    assignedManagerId: ''
  });
  const [srsFile, setSrsFile] = useState(null);
  const [srsFileName, setSrsFileName] = useState('');

  // Fetch data on component mount
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        // Fetch projects
        const projectRes = await api.get('/projects');
        setProjects(projectRes.data.data);

        // Fetch managers for assignment
        const managersRes = await api.get('/projects/managers');
        setManagers(managersRes.data.data);

        // Fetch attendance summary
        const attendanceRes = await api.get('/attendance/all');
        setAttendanceSummary(attendanceRes.data.data.summary || {});

        // Fetch sales dashboard data
        try {
          const salesRes = await api.get('/revenue/dashboard/cofounder');
          setSalesDashboardData(salesRes.data.data);
        } catch (salesErr) {
          console.log('Sales data not available:', salesErr);
        }

        // Fetch payroll summary
        try {
          const date = new Date();
          const payrollRes = await api.get('/payroll/summary', {
            params: {
              month: date.getMonth() + 1,
              year: date.getFullYear()
            }
          });
          setPayrollSummary(payrollRes.data.data);
        } catch (payrollErr) {
          console.log('Payroll data not available:', payrollErr);
        }

      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        setError('Failed to load dashboard data. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  // Handle input change for new project
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewProject({ ...newProject, [name]: value });
  };

  // Handle SRS file upload
  const handleSrsFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      if (file.type !== 'application/pdf') {
        showToast.error('Please upload a PDF file only');
        e.target.value = '';
        return;
      }
      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        showToast.error('File size must be less than 10MB');
        e.target.value = '';
        return;
      }
      setSrsFile(file);
      setSrsFileName(file.name);
    }
  };

  // Create new project
  const handleCreateProject = async (e) => {
    e.preventDefault();

    // Validate manager selection
    if (!newProject.assignedManagerId) {
      showToast.error('Please select a manager for the project');
      return;
    }

    try {
      // Create FormData for file upload
      const formData = new FormData();
      formData.append('name', newProject.name);
      formData.append('description', newProject.description);
      formData.append('deadline', newProject.deadline);
      formData.append('documentation', newProject.documentation);
      formData.append('assignedManagerId', newProject.assignedManagerId);

      // Add SRS file if uploaded
      if (srsFile) {
        formData.append('srsDocument', srsFile);
      }

      // Step 1: Create the project
      const res = await api.post('/projects', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      const createdProject = res.data.data;

      // Add new project to state
      setProjects([createdProject, ...projects]);

      showToast.success('Project created successfully! Generating AI tasks...');

      // Step 2: Call LLM to generate tasks
      try {
        const llmRes = await api.post('/projects/automate-llm', {
          projectId: createdProject._id
        });

        if (llmRes.data.success) {
          showToast.success(`✨ AI generated ${llmRes.data.data.tasksCreated} tasks for the project!`);
        }
      } catch (llmError) {
        console.warn('LLM task generation failed:', llmError);
        showToast.warning('Project created, but AI task generation failed. Tasks can be created manually.');
      }

      // Reset form and close modal
      setNewProject({
        name: '',
        description: '',
        deadline: '',
        documentation: '',
        assignedManagerId: ''
      });
      setSrsFile(null);
      setSrsFileName('');
      setShowCreateModal(false);

    } catch (err) {
      console.error('Error creating project:', err);
      const errorMessage = err.response?.data?.message || err.response?.data?.errors?.[0]?.msg || 'Failed to create project. Please try again.';
      showToast.error(errorMessage);
    }
  };

  // Delete project
  const handleDeleteProject = async () => {
    if (!selectedProject) return;

    try {
      await api.delete(`/projects/${selectedProject._id}`);

      // Remove deleted project from state
      setProjects(projects.filter(project => project._id !== selectedProject._id));

      // Close modal
      setShowDeleteModal(false);
      setSelectedProject(null);

      showToast.success('Project deleted successfully!');

    } catch (err) {
      console.error('Error deleting project:', err);
      showToast.error('Failed to delete project. Please try again.');
    }
  };



  // Create Revenue Target
  const handleCreateRevenueTarget = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);

    try {
      const hosUsersResponse = await api.get('/users?role=head-of-sales');
      const hosUsers = hosUsersResponse.data.data || hosUsersResponse.data;

      if (hosUsers.length === 0) {
        showToast.error('No Head of Sales found. Please create a Head of Sales user first.');
        return;
      }

      // Calculate start and end dates from month/year
      const targetMonth = parseInt(formData.get('targetMonth'));
      const targetYear = parseInt(formData.get('targetYear'));

      // Start date: First day of the selected month
      const startDate = new Date(targetYear, targetMonth - 1, 1);

      // End date: Last day of the selected month
      const endDate = new Date(targetYear, targetMonth, 0);

      const targetData = {
        assignedTo: formData.get('assignedTo') || hosUsers[0]._id,
        targetPeriod: formData.get('targetPeriod'),
        targetMonth: targetMonth,
        targetYear: targetYear,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        targetAmount: parseFloat(formData.get('targetAmount')),
        currency: formData.get('currency'),
        notes: formData.get('notes')
      };

      const response = await api.post('/revenue/targets', targetData);
      showToast.success('Revenue target created successfully!');

      // Show email notification toast
      if (response.data.emailSent && response.data.emailRecipient) {
        setTimeout(() => {
          showToast.success(`📧 Notification email sent to ${response.data.emailRecipient}`);
        }, 500);
      }

      setShowCreateTargetModal(false);

      // Refresh sales data
      const salesRes = await api.get('/revenue/dashboard/cofounder');
      setSalesDashboardData(salesRes.data.data);
    } catch (error) {
      console.error('Error creating target:', error);
      showToast.error(error.response?.data?.message || 'Failed to create revenue target');
    }
  };

  // Approve/Reject HOS Strategy
  const handleApproveStrategy = async (targetId, approved, feedback) => {
    try {
      const response = await api.post(`/revenue/targets/${targetId}/approve-strategy`, {
        approved,
        feedback
      });
      showToast.success(approved ? 'Strategy approved!' : 'Strategy rejected');

      // Show email notification toast
      if (response.data.emailSent && response.data.emailRecipient) {
        setTimeout(() => {
          showToast.success(`📧 Notification email sent to ${response.data.emailRecipient}`);
        }, 500);
      }

      setShowStrategyModal(false);
      setSelectedTarget(null);

      // Refresh sales data
      const salesRes = await api.get('/revenue/dashboard/cofounder');
      setSalesDashboardData(salesRes.data.data);
    } catch (error) {
      console.error('Error approving strategy:', error);
      showToast.error('Failed to process strategy approval');
    }
  };

  // Get status badge color
  const getStatusColor = (status) => {
    switch (status) {
      case 'not-started':
        return 'bg-gray-100 text-gray-800';
      case 'in-progress':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'on-hold':
        return 'bg-amber-100 text-amber-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Format deadline with color based on proximity
  const formatDeadline = (deadline) => {
    const deadlineDate = new Date(deadline);
    const today = new Date();
    const daysUntil = Math.ceil((deadlineDate - today) / (1000 * 60 * 60 * 24));

    let colorClass = 'text-gray-600';
    if (daysUntil < 0) {
      colorClass = 'text-red-600 font-medium';
    } else if (daysUntil <= 3) {
      colorClass = 'text-amber-600 font-medium';
    } else if (daysUntil <= 7) {
      colorClass = 'text-orange-500';
    }

    return <span className={colorClass}>{formatDate(deadline)}</span>;
  };

  const stats = [
    { name: 'Total Projects', value: projects.length, icon: Folder },
    {
      name: 'In Progress',
      value: projects.filter(p => p.status === 'in-progress').length,
      icon: Clock
    },
    {
      name: 'Completed',
      value: projects.filter(p => p.status === 'completed').length,
      icon: CheckCircle
    },
    {
      name: 'Present Today',
      value: attendanceSummary.present || 0,
      icon: UserCheck,
      color: 'text-green-600'
    },
  ];

  // Define sidebar actions for Co-founder
  const sidebarActions = [
    {
      label: 'Dashboard',
      icon: Briefcase,
      onClick: () => setCurrentView('dashboard'),
      active: currentView === 'dashboard',
      viewId: 'cofounder-dashboard',
      previewData: {
        projects: 4,
        revenue: '₹124.5L'
      }
    },
    {
      label: 'Revenue & Sales',
      icon: DollarSign,
      onClick: () => setCurrentView('sales'),
      active: currentView === 'sales',
      viewId: 'cofounder-sales',
      previewData: {}
    },
    {
      label: 'Analytics',
      icon: BarChart2,
      onClick: () => setCurrentView('analytics'),
      active: currentView === 'analytics',
      viewId: 'cofounder-analytics',
      previewData: {}
    },
    {
      label: 'Client CMS',
      icon: Target,
      onClick: () => setCurrentView('client-management'),
      active: currentView === 'client-management',
      viewId: 'cofounder-client-cms',
      previewData: {}
    },

  ];

  // Helper function to render modals (rendered on all views)
  const renderModals = () => (
    <>
      {/* Create Project Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>

            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <form onSubmit={handleCreateProject}>
                <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Create New Project</h3>

                  <div className="mb-4">
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                      Project Name
                    </label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      required
                      value={newProject.name}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                    />
                  </div>

                  <div className="mb-4">
                    <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                      Description
                    </label>
                    <textarea
                      id="description"
                      name="description"
                      required
                      value={newProject.description}
                      onChange={handleInputChange}
                      rows={4}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                    />
                  </div>

                  <div className="mb-4">
                    <label htmlFor="deadline" className="block text-sm font-medium text-gray-700 mb-1">
                      Deadline
                    </label>
                    <input
                      type="date"
                      id="deadline"
                      name="deadline"
                      required
                      value={newProject.deadline}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                    />
                  </div>

                  <div className="mb-4">
                    <label htmlFor="assignedManagerId" className="block text-sm font-medium text-gray-700 mb-1">
                      Assign Manager
                    </label>
                    <select
                      id="assignedManagerId"
                      name="assignedManagerId"
                      required
                      value={newProject.assignedManagerId}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                    >
                      <option value="">-- Select a Manager --</option>
                      {managers.map((manager) => (
                        <option key={manager._id} value={manager._id}>
                          {manager.firstName} {manager.lastName} ({manager.employeeId})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="mb-4">
                    <label htmlFor="srsDocument" className="block text-sm font-medium text-gray-700 mb-1">
                      Upload SRS (Software Requirements Specification)
                    </label>
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-primary-400 transition-colors">
                      <input
                        type="file"
                        id="srsDocument"
                        name="srsDocument"
                        accept=".pdf"
                        onChange={handleSrsFileChange}
                        className="hidden"
                      />
                      <label
                        htmlFor="srsDocument"
                        className="cursor-pointer"
                      >
                        <div className="flex flex-col items-center">
                          <svg
                            className="w-12 h-12 text-gray-400 mb-3"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                            />
                          </svg>
                          {srsFileName ? (
                            <div className="text-sm">
                              <span className="text-primary-600 font-medium">{srsFileName}</span>
                              <p className="text-gray-500 text-xs mt-1">Click to change file</p>
                            </div>
                          ) : (
                            <div className="text-sm">
                              <span className="text-primary-600 font-medium">Click to upload</span>
                              <span className="text-gray-500"> or drag and drop</span>
                              <p className="text-gray-500 text-xs mt-1">PDF files only (max 10MB)</p>
                            </div>
                          )}
                        </div>
                      </label>
                    </div>
                  </div>

                  <div className="mb-4">
                    <label htmlFor="documentation" className="block text-sm font-medium text-gray-700 mb-1">
                      Additional Documentation (Optional)
                    </label>
                    <textarea
                      id="documentation"
                      name="documentation"
                      value={newProject.documentation}
                      onChange={handleInputChange}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                      placeholder="Add any additional requirements or documentation links here..."
                    />
                  </div>
                </div>

                <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                  <button
                    type="submit"
                    className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-primary-600 text-base font-medium text-white hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 sm:ml-3 sm:w-auto sm:text-sm"
                  >
                    Create Project
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:w-auto sm:text-sm"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedProject && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>

            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                    <AlertCircle className="h-6 w-6 text-red-600" />
                  </div>
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Delete Project</h3>
                    <p className="text-gray-500">
                      Are you sure you want to delete <span className="font-medium">{selectedProject.name}</span>? All tasks and data will be permanently removed. This action cannot be undone.
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  onClick={handleDeleteProject}
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  Delete
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowDeleteModal(false);
                    setSelectedProject(null);
                  }}
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:w-auto sm:text-sm"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}


    </>
  );

  // Render Analytics view if selected
  if (currentView === 'analytics') {
    return (
      <>
        <DashboardLayout sidebarActions={sidebarActions} isFullPage>
          <AnalyticsDashboard />
        </DashboardLayout>
        {renderModals()}
      </>
    );
  }

  // Render Client Management view if selected
  if (currentView === 'client-management') {
    return (
      <>
        <DashboardLayout sidebarActions={sidebarActions} isFullPage>
          <ClientManagementDashboard />
        </DashboardLayout>
        {renderModals()}
      </>
    );
  }

  // Render Leave Management view if selected
  if (currentView === 'leave') {
    return (
      <>
        <DashboardLayout sidebarActions={sidebarActions}>
          <CoFounderLeaveApproval />
        </DashboardLayout>
        {renderModals()}
      </>
    );
  }



  // Render Revenue & Sales view if selected
  if (currentView === 'sales') {
    let { targets, companies, leads, revenue, recentActivities } = salesDashboardData || {};

    // Inject Mock Targets if missing
    if (!targets || !targets.list || targets.list.length === 0) {
      targets = {
        list: [
          {
            _id: '1',
            targetPeriod: 'Quarterly',
            targetMonth: 3,
            targetYear: 2026,
            targetAmount: 15000000,
            achievedAmount: 9800000,
            progressPercentage: 65,
            hosResponse: { status: 'accepted' },
            strategy: {
              targetLocations: ['Mumbai', 'Delhi', 'Bangalore'],
              approvedByCoFounder: true
            }
          },
          {
            _id: '2',
            targetPeriod: 'January',
            targetMonth: 1,
            targetYear: 2026,
            targetAmount: 5000000,
            achievedAmount: 4200000,
            progressPercentage: 84,
            hosResponse: { status: 'accepted' },
            strategy: {
              targetLocations: ['Pune', 'Hyderabad'],
              approvedByCoFounder: true
            }
          },
          {
            _id: '3',
            targetPeriod: 'February',
            targetMonth: 2,
            targetYear: 2026,
            targetAmount: 6000000,
            achievedAmount: 1200000,
            progressPercentage: 20,
            hosResponse: { status: 'negotiating' },
            strategy: {
              targetLocations: ['Chennai'],
              approvedByCoFounder: false
            }
          }
        ]
      };
    }

    return (
      <DashboardLayout sidebarActions={sidebarActions}>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-white">Revenue & Sales Dashboard</h1>
              <p className="text-zinc-400 mt-1">Monitor sales performance and set revenue targets</p>
            </div>
          </div>

          {/* Widgets Section */}
          <SalesSummaryWidgets
            salesData={{
              leads: leads ? {
                total: leads.total || 0,
                active: leads.active || 0,
                qualified: leads.qualified || 0,
                won: leads.won || 0,
                funnel: leads.funnel || [
                  { stage: 'Prospects', count: leads?.total || 0, percentage: 100 },
                  { stage: 'Contacted', count: Math.round((leads?.total || 0) * 0.8), percentage: 80 },
                  { stage: 'Qualified', count: leads?.qualified || leads?.active || 0, percentage: 58 },
                  { stage: 'Proposal', count: Math.round((leads?.active || 0) * 0.7), percentage: 40 },
                  { stage: 'Won', count: leads?.won || 0, percentage: 28 }
                ]
              } : undefined,
              revenue: revenue ? {
                total: revenue.total || 0,
                target: revenue.target || 0,
                trend: revenue.trend || []
              } : undefined,
              companies: companies ? {
                total: companies.total || 0,
                approved: companies.approved || 0,
                pending: companies.pendingApproval || 0
              } : undefined
            }}
          />



          {/* Recent Activities */}
          {
            recentActivities && recentActivities.length > 0 && (
              <div className="dashboard-card">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Recent Activities</h2>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {recentActivities.map((activity, index) => (
                    <div key={index} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                      <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <AlertCircle size={16} className="text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <div className="font-medium text-gray-900">{activity.action}</div>
                        <div className="text-sm text-gray-600">{activity.description}</div>
                        <div className="text-xs text-gray-400 mt-1">
                          {activity.performedBy} • {new Date(activity.timestamp).toLocaleString()}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )
          }
        </div>

        {/* Create Target Modal */}
        {
          showCreateTargetModal && (
            <CreateRevenueTargetModal
              onClose={() => setShowCreateTargetModal(false)}
              onSubmit={handleCreateRevenueTarget}
            />
          )
        }

        {/* Strategy Approval Modal */}
        {
          showStrategyModal && selectedTarget && (
            <StrategyApprovalModal
              target={selectedTarget}
              onClose={() => {
                setShowStrategyModal(false);
                setSelectedTarget(null);
              }}
              onApprove={(feedback) => handleApproveStrategy(selectedTarget._id, true, feedback)}
              onReject={(feedback) => handleApproveStrategy(selectedTarget._id, false, feedback)}
            />
          )
        }
      </DashboardLayout >
    );
  }

  return (
    <DashboardLayout sidebarActions={sidebarActions}>
      <CoFounderSummaryWidgets
        projects={projects}
        salesData={salesDashboardData}
        attendanceSummary={attendanceSummary}
        payrollSummary={payrollSummary}
      />

      {/* Render all modals */}
      {renderModals()}
    </DashboardLayout>
  );
};

// Create Revenue Target Modal Component
const CreateRevenueTargetModal = ({ onClose, onSubmit }) => {
  const [hosUsers, setHosUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHOSUsers = async () => {
      try {
        setLoading(true);
        const response = await api.get('/users?role=head-of-sales');
        console.log('HOS Users Response:', response.data);

        // Handle different response formats
        let users = [];
        if (response.data.success && response.data.data) {
          // New format: { success: true, data: { users: [...], pagination: {...} } }
          users = response.data.data.users || response.data.data;
        } else if (Array.isArray(response.data)) {
          // Direct array format
          users = response.data;
        } else if (response.data.data) {
          users = response.data.data;
        }

        setHosUsers(Array.isArray(users) ? users : []);
      } catch (error) {
        console.error('Error fetching HOS users:', error);
        setHosUsers([]);
      } finally {
        setLoading(false);
      }
    };
    fetchHOSUsers();
  }, []);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <h2 className="text-2xl font-bold mb-4">Create Revenue Target</h2>

          <form onSubmit={onSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Assign to Head of Sales *
              </label>
              <select
                name="assignedTo"
                required
                disabled={loading}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
              >
                {loading ? (
                  <option value="">Loading Head of Sales...</option>
                ) : hosUsers && hosUsers.length > 0 ? (
                  hosUsers.map(user => (
                    <option key={user._id} value={user._id}>
                      {user.name} ({user.email})
                    </option>
                  ))
                ) : (
                  <option value="">No Head of Sales available</option>
                )}
              </select>
              {!loading && hosUsers && hosUsers.length === 0 && (
                <p className="text-xs text-red-600 mt-1">
                  Please create a Head of Sales user first
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Target Period *
              </label>
              <select
                name="targetPeriod"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="monthly">Monthly</option>
                <option value="quarterly">Quarterly</option>
                <option value="half-yearly">Half-Yearly</option>
                <option value="yearly">Yearly</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Target Month *
                </label>
                <select
                  name="targetMonth"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select Month</option>
                  <option value="1">January</option>
                  <option value="2">February</option>
                  <option value="3">March</option>
                  <option value="4">April</option>
                  <option value="5">May</option>
                  <option value="6">June</option>
                  <option value="7">July</option>
                  <option value="8">August</option>
                  <option value="9">September</option>
                  <option value="10">October</option>
                  <option value="11">November</option>
                  <option value="12">December</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Target Year *
                </label>
                <select
                  name="targetYear"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select Year</option>
                  {[...Array(5)].map((_, i) => {
                    const year = new Date().getFullYear() + i;
                    return <option key={year} value={year}>{year}</option>;
                  })}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Target Amount *
                </label>
                <input
                  type="number"
                  name="targetAmount"
                  required
                  min="0"
                  step="1000"
                  placeholder="Enter amount"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Currency *
                </label>
                <select
                  name="currency"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="INR">INR (₹)</option>
                  <option value="USD">USD ($)</option>
                  <option value="EUR">EUR (€)</option>
                  <option value="GBP">GBP (£)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Notes
              </label>
              <textarea
                name="notes"
                rows="3"
                placeholder="Add any additional notes or context..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              ></textarea>
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="submit"
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Create Target
              </button>
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

// Strategy Approval Modal Component
const StrategyApprovalModal = ({ target, onClose, onApprove, onReject }) => {
  const [feedback, setFeedback] = useState('');

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <h2 className="text-2xl font-bold mb-4">Review HOS Strategy</h2>

          <div className="mb-6">
            <div className="bg-blue-50 rounded-lg p-4 mb-4">
              <div className="font-semibold text-gray-900 mb-2">Revenue Target</div>
              <div className="text-sm text-gray-600">
                Amount: ₹{target.targetAmount.toLocaleString()} | Period: {target.targetPeriod}
              </div>
            </div>

            <div className="mb-4">
              <h3 className="font-semibold text-gray-900 mb-2">Proposed Strategy</h3>
              <div className="space-y-3">
                {target.strategy?.targetLocations?.map((location, index) => (
                  <div key={index} className="bg-gray-50 rounded-lg p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div className="font-medium text-gray-900">{location.location}</div>
                      <div className="font-semibold text-blue-600">
                        ₹{location.targetAmount?.toLocaleString() || 0}
                      </div>
                    </div>
                    <div className="text-sm text-gray-600 mb-2">{location.reasoning}</div>
                    <div className="text-xs text-gray-500">
                      Assigned Reps: {location.assignedReps?.length || 0}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="bg-gray-50 rounded-lg p-3">
                <div className="text-gray-600">Expected Companies</div>
                <div className="font-semibold text-lg">{target.strategy?.expectedCompanies || 0}</div>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <div className="text-gray-600">Expected Leads</div>
                <div className="font-semibold text-lg">{target.strategy?.expectedLeads || 0}</div>
              </div>
            </div>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Your Feedback
            </label>
            <textarea
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              rows="3"
              placeholder="Provide feedback on the strategy..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            ></textarea>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => onApprove(feedback)}
              className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center justify-center gap-2"
            >
              <CheckCircle size={20} />
              Approve Strategy
            </button>
            <button
              onClick={() => onReject(feedback)}
              className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center justify-center gap-2"
            >
              <AlertCircle size={20} />
              Reject Strategy
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CoFounderDashboard;