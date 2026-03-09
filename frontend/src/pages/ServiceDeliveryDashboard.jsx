import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  CheckSquare,
  CheckCircle,
  Clock,
  Calendar,
  User,
  Users,
  Target,
  Award,
  FileText,
  MessageSquare,
  AlertCircle,
  Eye,
  Upload,
  Link,
  Image,
  ChevronDown,
  ChevronUp,
  X,
  DollarSign,
  ClipboardCheck,
  Building2,
  TrendingUp,
  Plus,
  Bot
} from 'lucide-react';
import DashboardLayout from '../components/DashboardLayout';
import TaskStatusDropdown from '../components/TaskStatusDropdown';
import TaskEvidenceModal from '../components/TaskEvidenceModal';
import EmployeeLeaveManagement from '../components/EmployeeLeaveManagement';
import AttendancePunch from '../components/AttendancePunch';
import LeaveStatusWidget from '../components/LeaveStatusWidget';
import IndividualAttendanceSummary from '../components/IndividualAttendanceSummary';
import Profile from './Profile';
import CoverageTasksView from '../components/CoverageTasksView';
import api from '../utils/api';
import { formatDate } from '../utils/helpers';
import { showToast as toast } from '../utils/toast';



const ServiceDeliveryDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [tasks, setTasks] = useState([]);
  const [checkpoints, setCheckpoints] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Persist current view in localStorage
  const [currentView, setCurrentView] = useState(() => {
    const savedView = localStorage.getItem('serviceDeliveryDashboardView');
    return savedView || 'dashboard';
  });

  // Save view to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('serviceDeliveryDashboardView', currentView);
  }, [currentView]);

  // Modal states
  const [showCheckpointModal, setShowCheckpointModal] = useState(false);
  const [selectedCheckpoint, setSelectedCheckpoint] = useState(null);
  const [expandedTaskId, setExpandedTaskId] = useState(null);

  // Task evidence modal states
  const [showEvidenceModal, setShowEvidenceModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [pendingStatus, setPendingStatus] = useState(null);

  // Checkpoint form state
  const [checkpointEvidence, setCheckpointEvidence] = useState({
    verificationUrl: '',
    verificationMethod: 'url',
    screenshot: null,
    caption: ''
  });

  // Preview state for uploaded images
  const [previewUrl, setPreviewUrl] = useState(null);

  // Sales management state
  const [myCompanies, setMyCompanies] = useState([]);
  const [myLeads, setMyLeads] = useState([]);
  const [mySalesTasks, setMySalesTasks] = useState([]);
  const [showCompanyModal, setShowCompanyModal] = useState(false);
  const [showLeadModal, setShowLeadModal] = useState(false);
  const [newCompany, setNewCompany] = useState({
    companyName: '',
    industry: '',
    website: '',
    contactPerson: '',
    contactEmail: '',
    contactPhone: '',
    address: ''
  });

  // Coverage statistics state
  const [coverageStats, setCoverageStats] = useState({
    tasksCovered: 0,
    pointsFromCoverage: 0,
    ownTasksPoints: 0,
    totalPoints: 0,
    coveredFor: [],
    coverageRate: 0
  });
  const [coverageTasks, setCoverageTasks] = useState([]);

  // Handbook modal state
  const [showHandbook, setShowHandbook] = useState(false);

  const quickActions = [
    { name: 'My Tasks', icon: CheckCircle, onClick: () => setCurrentView('tasks') },
    { name: 'My Profile', icon: User, onClick: () => setCurrentView('profile') },
    { name: 'Performance', icon: Target, onClick: () => navigate('/profile?tab=performance') },
    { name: 'Attendance', icon: ClipboardCheck, onClick: () => setCurrentView('attendance') },
    { name: 'Leave', icon: Calendar, onClick: () => setCurrentView('leave') },
  ];

  // Fetch data on component mount
  useEffect(() => {
    fetchData();
    fetchCoverageData();
  }, []);

  const fetchCoverageData = async () => {
    try {
      const [statsRes, tasksRes] = await Promise.all([
        api.get('/tasks/coverage/stats'),
        api.get('/tasks/coverage/my-coverage')
      ]);

      if (statsRes.data.success) {
        setCoverageStats(statsRes.data.data);
      }

      if (tasksRes.data.success) {
        setCoverageTasks(tasksRes.data.data);
      }
    } catch (error) {
      console.error('Error fetching coverage data:', error);
    }
  };

  const fetchData = async () => {
    setIsLoading(true);
    try {
      // Fetch tasks assigned to this individual
      const tasksRes = await api.get('/tasks/assigned');
      setTasks(tasksRes.data.data);

      // Fetch sales management data
      try {
        const [companiesRes, leadsRes, salesTasksRes] = await Promise.all([
          api.get('/companies/my-companies').catch(() => ({ data: { data: [] } })),
          api.get('/leads/my-leads').catch(() => ({ data: { data: { leads: [] } } })),
          api.get('/sales-tasks/my-tasks').catch(() => ({ data: { data: { tasks: [] } } }))
        ]);

        setMyCompanies(companiesRes.data.data || []);
        setMyLeads(leadsRes.data.data?.leads || []);
        setMySalesTasks(salesTasksRes.data.data?.tasks || []);
      } catch (salesError) {
        console.log('Sales features not available:', salesError);
      }

      // Fetch checkpoints for all tasks
      const allCheckpoints = [];
      for (const task of tasksRes.data.data) {
        try {
          const checkpointsRes = await api.get(`/checkpoints?taskId=${task._id}`);
          if (checkpointsRes.data.data) {
            allCheckpoints.push(...checkpointsRes.data.data.map(cp => ({
              ...cp,
              taskId: task._id,
              taskTitle: task.title
            })));
          }
        } catch (checkpointError) {
          console.log(`No checkpoints found for task ${task._id}`);
        }
      }
      setCheckpoints(allCheckpoints);

    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError('Failed to load dashboard data. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle input change for checkpoint evidence
  const handleEvidenceInputChange = (e) => {
    const { name, value } = e.target;
    setCheckpointEvidence({ ...checkpointEvidence, [name]: value });
  };

  // Handle screenshot file upload
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setCheckpointEvidence({
        ...checkpointEvidence,
        screenshot: file,
        verificationMethod: 'screenshot'
      });

      // Create preview URL
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // Clear file preview and selection
  const clearFileSelection = () => {
    setCheckpointEvidence({
      ...checkpointEvidence,
      screenshot: null
    });
    setPreviewUrl(null);
  };

  // Submit checkpoint evidence
  const handleSubmitEvidence = async (e) => {
    e.preventDefault();

    if (!selectedCheckpoint) return;

    try {
      // Create form data for file upload
      const formData = new FormData();
      formData.append('checkpointId', selectedCheckpoint._id);
      formData.append('verificationMethod', checkpointEvidence.verificationMethod);

      if (checkpointEvidence.verificationMethod === 'url') {
        formData.append('verificationUrl', checkpointEvidence.verificationUrl);
      } else if (checkpointEvidence.verificationMethod === 'screenshot' && checkpointEvidence.screenshot) {
        formData.append('screenshot', checkpointEvidence.screenshot);
        formData.append('caption', checkpointEvidence.caption);
      }

      // Submit checkpoint completion
      const res = await api.post('/checkpoints/complete', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      // Update task in state
      const updatedTasks = tasks.map(task => {
        if (task.checkpoints && task.checkpoints.some(cp => cp._id === selectedCheckpoint._id)) {
          const updatedCheckpoints = task.checkpoints.map(cp =>
            cp._id === selectedCheckpoint._id
              ? { ...cp, isCompleted: true, ...res.data.data }
              : cp
          );
          return { ...task, checkpoints: updatedCheckpoints };
        }
        return task;
      });

      setTasks(updatedTasks);

      // Reset form and close modal
      setCheckpointEvidence({
        verificationUrl: '',
        verificationMethod: 'url',
        screenshot: null,
        caption: ''
      });
      setPreviewUrl(null);
      setShowCheckpointModal(false);
      setSelectedCheckpoint(null);

      toast.success('Checkpoint completed successfully');
    } catch (err) {
      console.error('Error completing checkpoint:', err);
      setError('Failed to complete checkpoint. Please try again.');
      toast.error('Failed to complete checkpoint');
    }
  };

  // Toggle task details expansion
  const toggleTaskExpand = (taskId) => {
    if (expandedTaskId === taskId) {
      setExpandedTaskId(null);
    } else {
      setExpandedTaskId(taskId);
    }
  };

  // Accept a task
  const handleAcceptTask = async (taskId) => {
    try {
      const res = await api.patch(`/tasks/${taskId}/accept`);

      // Update task status in state
      const updatedTasks = tasks.map(task =>
        task._id === taskId
          ? { ...task, status: 'in-progress', acceptedAt: new Date() }
          : task
      );

      setTasks(updatedTasks);
      toast.success('Task accepted successfully');
    } catch (err) {
      console.error('Error accepting task:', err);
      toast.error('Failed to accept task');
    }
  };

  // Handle evidence requirement for status changes
  const handleEvidenceRequired = (newStatus, task) => {
    setSelectedTask(task);
    setPendingStatus(newStatus);
    setShowEvidenceModal(true);
  };

  // Handle direct status changes (no evidence required)
  const handleDirectStatusChange = async (taskId, newStatus) => {
    try {
      console.log('Updating task status:', { taskId, newStatus });

      let res;
      if (newStatus === 'accept') {
        // Use the accept endpoint for accepting tasks
        res = await api.patch(`/tasks/${taskId}/accept`);
      } else {
        // Use the status endpoint for other status changes
        res = await api.patch(`/tasks/${taskId}/status`, { status: newStatus });
      }

      // Update task status in state
      const updatedTasks = tasks.map(task =>
        task._id === taskId
          ? {
            ...task,
            status: newStatus === 'accept' ? 'in-progress' : newStatus,
            updatedAt: new Date(),
            ...(newStatus === 'accept' ? { acceptedAt: new Date() } : {})
          }
          : task
      );

      setTasks(updatedTasks);
      const statusLabel = newStatus === 'accept' ? 'accepted' : newStatus.replace('-', ' ');
      toast.success(`Task ${statusLabel} successfully`);
    } catch (err) {
      console.error('Error updating task status:', err);
      console.error('Error details:', err.response?.data);

      let errorMessage = 'Failed to update task status';
      if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (err.message) {
        errorMessage = err.message;
      }

      toast.error(errorMessage);
    }
  };

  // Submit evidence with status change
  const handleEvidenceSubmit = async (formData) => {
    try {
      const res = await api.post('/tasks/update-with-evidence', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      // Update task in state
      const updatedTasks = tasks.map(task =>
        task._id === selectedTask._id
          ? { ...task, ...res.data.data }
          : task
      );

      setTasks(updatedTasks);

      const statusLabel = pendingStatus === 'accept' ? 'accepted' : pendingStatus;
      toast.success(`Task ${statusLabel} successfully with evidence!`);

    } catch (err) {
      console.error('Error submitting evidence:', err);
      toast.error('Failed to submit evidence');
      throw err;
    }
  };

  // Update task status (legacy function for backward compatibility)
  const handleUpdateTaskStatus = async (taskId, newStatus) => {
    try {
      const res = await api.patch(`/tasks/${taskId}/status`, { status: newStatus });

      // Update task status in state
      const updatedTasks = tasks.map(task =>
        task._id === taskId
          ? { ...task, status: newStatus }
          : task
      );

      setTasks(updatedTasks);
      toast.success(`Task status updated to ${newStatus.replace('-', ' ')}`);
    } catch (err) {
      console.error('Error updating task status:', err);
      toast.error('Failed to update task status');
    }
  };

  // Mark task as completed
  const handleCompleteTask = async (taskId) => {
    try {
      // Try force complete first
      const res = await api.patch(`/tasks/${taskId}/force-complete`);

      if (res.data.success) {
        // Update task status in state using the response data
        const updatedTask = res.data.data;

        const updatedTasks = tasks.map(task =>
          task._id === taskId ? updatedTask : task
        );

        setTasks(updatedTasks);
        toast.success('Task completed successfully!');
      }
    } catch (err) {
      console.error('Error completing task:', err);
      toast.error('Failed to complete task: ' + (err.response?.data?.message || err.message));
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
      case 'cant-complete':
        return 'bg-red-100 text-red-800';
      case 'review':
        return 'bg-amber-100 text-amber-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Get priority badge color
  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'low':
        return 'bg-green-100 text-green-800';
      case 'medium':
        return 'bg-blue-100 text-blue-800';
      case 'high':
        return 'bg-amber-100 text-amber-800';
      case 'urgent':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-blue-100 text-blue-800';
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

  // Dashboard stats
  const stats = [
    {
      name: 'Active Tasks',
      value: tasks.filter(t => t.status !== 'completed').length || '0',
      change: '',
      icon: Clock
    },
    {
      name: 'Completed Tasks',
      value: tasks.filter(t => t.status === 'completed').length || '0',
      change: '',
      icon: CheckCircle
    },
    {
      name: 'Total Points',
      value: user?.totalPoints || coverageStats.totalPoints || '0',
      change: '',
      icon: Target
    },
    {
      name: 'Coverage Points',
      value: coverageStats.pointsFromCoverage || '0',
      change: coverageStats.coverageRate ? `${coverageStats.coverageRate}% coverage` : '',
      icon: Award
    }
  ];

  // Define sidebar actions for Individual
  console.log('🔍 ServiceDeliveryDashboard - User jobCategory:', user?.jobCategory, 'Is developer:', user?.jobCategory === 'developer');
  const sidebarActions = [
    {
      label: 'Dashboard',
      icon: CheckSquare,
      onClick: () => setCurrentView('dashboard'),
      active: currentView === 'dashboard'
    },
    {
      label: 'My Tasks',
      icon: CheckCircle,
      onClick: () => setCurrentView('tasks'),
      active: currentView === 'tasks'
    },
    {
      label: 'Coverage Tasks',
      icon: Users,
      onClick: () => setCurrentView('coverage'),
      active: currentView === 'coverage'
    },
    {
      label: 'My Profile',
      icon: User,
      onClick: () => setCurrentView('profile'),
      active: currentView === 'profile'
    },
    {
      label: 'Performance',
      icon: Target,
      onClick: () => navigate('/profile?tab=performance'),
      active: false
    },
    {
      label: 'Attendance',
      icon: ClipboardCheck,
      onClick: () => setCurrentView('attendance'),
      active: currentView === 'attendance'
    },
    {
      label: 'Leave Management',
      icon: Calendar,
      onClick: () => setCurrentView('leave'),
      active: currentView === 'leave'
    },
    ...(user?.jobCategory === 'developer' ? [{
      label: 'AI Handbook',
      icon: Bot,
      onClick: () => navigate('/ai-handbook'),
      active: false
    }] : [])
  ];

  // Company submission handler
  const handleSubmitCompany = async (e) => {
    e.preventDefault();
    try {
      await api.post('/companies', newCompany);
      toast.success('Company submitted for approval successfully');
      setShowCompanyModal(false);
      setNewCompany({
        companyName: '',
        industry: '',
        website: '',
        contactPerson: '',
        contactEmail: '',
        contactPhone: '',
        address: ''
      });
      fetchData();
    } catch (error) {
      console.error('Error submitting company:', error);
      toast.error('Failed to submit company');
    }
  };

  // Render Companies view
  if (currentView === 'companies') {
    return (
      <DashboardLayout sidebarActions={sidebarActions}>
        <div className="p-6 space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold text-gray-900">My Companies</h2>
            <button
              onClick={() => setShowCompanyModal(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Submit Company
            </button>
          </div>

          {myCompanies.length === 0 ? (
            <div className="bg-white rounded-lg shadow p-12 text-center">
              <Building2 className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No companies submitted yet</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {myCompanies.map((company) => (
                <div key={company._id} className="bg-white rounded-lg shadow p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{company.companyName}</h3>
                      <p className="text-sm text-gray-600">{company.industry}</p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-sm font-semibold ${company.approvalStatus === 'approved' ? 'bg-green-100 text-green-800' :
                      company.approvalStatus === 'rejected' ? 'bg-red-100 text-red-800' :
                        company.approvalStatus === 'needsRevision' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-gray-100 text-gray-800'
                      }`}>
                      {company.approvalStatus}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className="text-gray-500">Contact:</span>
                      <div className="font-medium">{company.contactPerson}</div>
                    </div>
                    <div>
                      <span className="text-gray-500">Submitted:</span>
                      <div className="font-medium">{formatDate(company.createdAt)}</div>
                    </div>
                  </div>
                  {company.approvalNotes && (
                    <div className="mt-3 p-3 bg-gray-50 rounded text-sm">
                      <span className="font-medium">Feedback: </span>{company.approvalNotes}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Company Submission Modal */}
          {showCompanyModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-xl font-bold">Submit New Company</h3>
                  <button onClick={() => setShowCompanyModal(false)}>
                    <X className="h-6 w-6 text-gray-400" />
                  </button>
                </div>
                <form onSubmit={handleSubmitCompany} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Company Name *</label>
                      <input
                        type="text"
                        required
                        value={newCompany.companyName}
                        onChange={(e) => setNewCompany({ ...newCompany, companyName: e.target.value })}
                        className="w-full border rounded px-3 py-2"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Industry *</label>
                      <input
                        type="text"
                        required
                        value={newCompany.industry}
                        onChange={(e) => setNewCompany({ ...newCompany, industry: e.target.value })}
                        className="w-full border rounded px-3 py-2"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Website</label>
                      <input
                        type="url"
                        value={newCompany.website}
                        onChange={(e) => setNewCompany({ ...newCompany, website: e.target.value })}
                        className="w-full border rounded px-3 py-2"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Contact Person *</label>
                      <input
                        type="text"
                        required
                        value={newCompany.contactPerson}
                        onChange={(e) => setNewCompany({ ...newCompany, contactPerson: e.target.value })}
                        className="w-full border rounded px-3 py-2"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Contact Email *</label>
                      <input
                        type="email"
                        required
                        value={newCompany.contactEmail}
                        onChange={(e) => setNewCompany({ ...newCompany, contactEmail: e.target.value })}
                        className="w-full border rounded px-3 py-2"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Contact Phone</label>
                      <input
                        type="tel"
                        value={newCompany.contactPhone}
                        onChange={(e) => setNewCompany({ ...newCompany, contactPhone: e.target.value })}
                        className="w-full border rounded px-3 py-2"
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                      <textarea
                        value={newCompany.address}
                        onChange={(e) => setNewCompany({ ...newCompany, address: e.target.value })}
                        className="w-full border rounded px-3 py-2"
                        rows="2"
                      />
                    </div>
                  </div>
                  <div className="flex gap-3 pt-4">
                    <button
                      type="button"
                      onClick={() => setShowCompanyModal(false)}
                      className="flex-1 bg-gray-200 text-gray-800 px-4 py-2 rounded hover:bg-gray-300"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="flex-1 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                    >
                      Submit
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      </DashboardLayout>
    );
  }

  // Render Leads view
  if (currentView === 'leads') {
    return (
      <DashboardLayout sidebarActions={sidebarActions}>
        <div className="p-6 space-y-6">
          <h2 className="text-2xl font-bold text-gray-900">My Leads</h2>

          {myLeads.length === 0 ? (
            <div className="bg-white rounded-lg shadow p-12 text-center">
              <TrendingUp className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No leads yet</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {myLeads.map((lead) => (
                <div key={lead._id} className="bg-white rounded-lg shadow p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{lead.name}</h3>
                      <p className="text-sm text-gray-600">{lead.company?.companyName}</p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-sm font-semibold ${lead.stage === 'closedWon' ? 'bg-green-100 text-green-800' :
                      lead.stage === 'closedLost' ? 'bg-red-100 text-red-800' :
                        lead.stage === 'negotiation' ? 'bg-orange-100 text-orange-800' :
                          lead.stage === 'proposal' ? 'bg-yellow-100 text-yellow-800' :
                            lead.stage === 'qualified' ? 'bg-blue-100 text-blue-800' :
                              'bg-gray-100 text-gray-800'
                      }`}>
                      {lead.stage}
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500">Potential Value:</span>
                      <div className="font-medium">₹{(lead.potentialValue || 0).toLocaleString()}</div>
                    </div>
                    <div>
                      <span className="text-gray-500">Probability:</span>
                      <div className="font-medium">{lead.probability}%</div>
                    </div>
                    <div>
                      <span className="text-gray-500">Expected Value:</span>
                      <div className="font-medium">₹{(lead.expectedValue || 0).toLocaleString()}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </DashboardLayout>
    );
  }

  // Render Sales Tasks view
  if (currentView === 'sales-tasks') {
    return (
      <DashboardLayout sidebarActions={sidebarActions}>
        <div className="p-6 space-y-6">
          <h2 className="text-2xl font-bold text-gray-900">My Sales Tasks</h2>

          {mySalesTasks.length === 0 ? (
            <div className="bg-white rounded-lg shadow p-12 text-center">
              <Target className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No sales tasks assigned yet</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {mySalesTasks.map((task) => (
                <div key={task._id} className="bg-white rounded-lg shadow p-6">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{task.title}</h3>
                      <p className="text-sm text-gray-600 mt-1">{task.description}</p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-sm font-semibold ${task.priority === 'urgent' ? 'bg-red-100 text-red-800' :
                      task.priority === 'high' ? 'bg-orange-100 text-orange-800' :
                        task.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-gray-100 text-gray-800'
                      }`}>
                      {task.priority}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className="text-gray-500">Due Date:</span>
                      <div className="font-medium">{formatDate(task.deadline)}</div>
                    </div>
                    <div>
                      <span className="text-gray-500">Status:</span>
                      <div className="font-medium capitalize">{task.status.replace('-', ' ')}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </DashboardLayout>
    );
  }

  // Render My Tasks view if selected
  if (currentView === 'tasks') {
    return (
      <DashboardLayout sidebarActions={sidebarActions}>
        <div className="space-y-6">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-cyan-600 rounded-xl shadow-lg p-8">
            <h1 className="text-3xl font-bold text-white flex items-center">
              <CheckCircle className="h-8 w-8 mr-3" />
              My Tasks
            </h1>
            <p className="mt-2 text-blue-100">View and manage all your assigned tasks</p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl shadow-lg border-2 border-blue-200 p-6 hover:shadow-xl hover:scale-105 transition-all duration-300">
              <div className="flex items-center justify-between mb-3">
                <div className="h-12 w-12 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center shadow-lg">
                  <Clock className="h-6 w-6 text-white" />
                </div>
              </div>
              <p className="text-sm font-bold text-gray-600 mb-1">Active Tasks</p>
              <p className="text-3xl font-bold text-gray-900">{stats[0].value}</p>
            </div>

            <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl shadow-lg border-2 border-green-200 p-6 hover:shadow-xl hover:scale-105 transition-all duration-300">
              <div className="flex items-center justify-between mb-3">
                <div className="h-12 w-12 rounded-full bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center shadow-lg">
                  <CheckCircle className="h-6 w-6 text-white" />
                </div>
              </div>
              <p className="text-sm font-bold text-gray-600 mb-1">Completed Tasks</p>
              <p className="text-3xl font-bold text-gray-900">{stats[1].value}</p>
            </div>

            <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl shadow-lg border-2 border-purple-200 p-6 hover:shadow-xl hover:scale-105 transition-all duration-300">
              <div className="flex items-center justify-between mb-3">
                <div className="h-12 w-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg">
                  <Target className="h-6 w-6 text-white" />
                </div>
              </div>
              <p className="text-sm font-bold text-gray-600 mb-1">Total Points</p>
              <p className="text-3xl font-bold text-gray-900">{stats[2].value}</p>
            </div>

            <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl shadow-lg border-2 border-amber-200 p-6 hover:shadow-xl hover:scale-105 transition-all duration-300">
              <div className="flex items-center justify-between mb-3">
                <div className="h-12 w-12 rounded-full bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center shadow-lg">
                  <Award className="h-6 w-6 text-white" />
                </div>
              </div>
              <p className="text-sm font-bold text-gray-600 mb-1">Earned Points</p>
              <p className="text-3xl font-bold text-gray-900">{stats[3].value}</p>
            </div>
          </div>

          {/* Tasks List */}
          <div className="bg-white rounded-xl shadow-lg border-2 border-blue-100 p-6">
            {isLoading ? (
              <div className="py-8 text-center">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-2 border-t-primary-500 border-r-primary-500 border-b-transparent border-l-transparent"></div>
                <p className="mt-2 text-gray-500">Loading tasks...</p>
              </div>
            ) : error ? (
              <div className="py-8 text-center text-red-600">
                <AlertCircle className="h-8 w-8 mx-auto mb-2" />
                <p>{error}</p>
                <button
                  onClick={() => window.location.reload()}
                  className="mt-2 text-primary-600 hover:underline"
                >
                  Try again
                </button>
              </div>
            ) : tasks.length === 0 ? (
              <div className="py-10 text-center">
                <CheckSquare className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                <h3 className="text-gray-500 text-lg font-medium mb-1">No tasks assigned yet</h3>
                <p className="text-gray-400">Tasks will appear here once they are assigned to you</p>
              </div>
            ) : (
              <div>
                {tasks.map((task, index) => (
                  <div key={task._id} className={`mb-4 border-2 border-blue-200 rounded-xl shadow-md hover:shadow-lg transition-all duration-200 ${index % 2 === 0 ? 'bg-white' : 'bg-blue-50/30'}`}>
                    <div
                      className="p-5 cursor-pointer hover:bg-blue-50/50 transition-colors rounded-t-xl"
                      onClick={() => toggleTaskExpand(task._id)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center flex-1">
                          <div className={`h-12 w-12 rounded-full ${getStatusColor(task.status)} flex items-center justify-center shadow-md border-2 border-white`}>
                            <CheckSquare className="h-6 w-6" />
                          </div>
                          <div className="ml-4 flex-1">
                            <div className="text-base font-bold text-gray-900">{task.title}</div>
                            <div className="text-sm text-gray-600 mt-1 flex items-center flex-wrap gap-3">
                              <span className="flex items-center">
                                <Award className="w-4 h-4 mr-1 text-purple-500" />
                                {task.project?.name}
                              </span>
                              <span className="flex items-center">
                                <Target className="w-4 h-4 mr-1 text-blue-500" />
                                {task.points} points
                              </span>
                              <span className="flex items-center">
                                <Calendar className="w-4 h-4 mr-1 text-amber-500" />
                                {formatDeadline(task.deadline)}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-3">
                          <TaskStatusDropdown
                            task={task}
                            onStatusChange={handleDirectStatusChange}
                            onEvidenceRequired={handleEvidenceRequired}
                          />

                          <span className={`px-3 py-1 inline-flex text-xs leading-5 font-bold rounded-full ${getPriorityColor(task.priority)}`}>
                            {task.priority?.charAt(0).toUpperCase() + task.priority?.slice(1)}
                          </span>
                          {expandedTaskId === task._id ?
                            <ChevronUp className="h-6 w-6 text-blue-600" /> :
                            <ChevronDown className="h-6 w-6 text-blue-600" />
                          }
                        </div>
                      </div>
                    </div>

                    {expandedTaskId === task._id && (
                      <div className="p-6 border-t-2 border-blue-200 bg-gradient-to-br from-blue-50 via-purple-50 to-cyan-50 rounded-b-xl">
                        {/* Description Section */}
                        <div className="mb-6">
                          <h4 className="text-base font-semibold text-gray-900 flex items-center mb-2">
                            <FileText className="h-5 w-5 mr-2 text-blue-500" />Description
                          </h4>
                          <div className="bg-white rounded-lg p-4 border border-gray-100 shadow-sm text-gray-800 text-sm">
                            {task.description}
                          </div>
                        </div>

                        {/* Project Section */}
                        <div className="mb-6">
                          <h4 className="text-base font-semibold text-gray-900 flex items-center mb-2">
                            <Award className="h-5 w-5 mr-2 text-purple-500" />Project
                          </h4>
                          <div className="flex items-center bg-white rounded-lg p-3 border border-gray-100 shadow-sm text-gray-800 text-sm">
                            <span className="font-medium mr-2">{task.project?.name || 'N/A'}</span>
                            <span className="ml-auto text-xs text-gray-500 flex items-center">
                              <Calendar className="inline w-4 h-4 mr-1" />{formatDeadline(task.deadline)}
                            </span>
                          </div>
                        </div>

                        {/* Checkpoints & Assigned By Row */}
                        <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                          {/* Checkpoints Section */}
                          <div>
                            <h4 className="text-base font-semibold text-gray-900 flex items-center mb-2">
                              <CheckCircle className="h-5 w-5 mr-2 text-green-500" />Checkpoints
                            </h4>
                            {task.checkpoints && task.checkpoints.length > 0 ? (
                              <ul className="space-y-3">
                                {task.checkpoints.map((checkpoint) => (
                                  <li key={checkpoint._id} className="flex items-center justify-between bg-white rounded p-3 border border-gray-100 shadow-sm">
                                    <div className="flex items-center">
                                      <div className={`h-4 w-4 mr-3 rounded-full ${checkpoint.isCompleted ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                                      <div>
                                        <span className="text-sm text-gray-800 font-medium">{checkpoint.title}</span>
                                        {checkpoint.description && (
                                          <p className="text-xs text-gray-500 mt-1">{checkpoint.description}</p>
                                        )}
                                        {checkpoint.isCompleted && checkpoint.completedAt && (
                                          <p className="text-xs text-green-600 mt-1">
                                            ✓ Completed on {formatDate(checkpoint.completedAt)}
                                          </p>
                                        )}
                                      </div>
                                    </div>
                                    {!checkpoint.isCompleted && (
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setSelectedCheckpoint(checkpoint);
                                          setShowCheckpointModal(true);
                                        }}
                                        className="px-3 py-1 bg-primary-100 text-primary-600 rounded-md hover:bg-primary-200 text-xs flex items-center"
                                      >
                                        <CheckCircle className="h-3 w-3 mr-1" />
                                        Complete
                                      </button>
                                    )}
                                    {checkpoint.isCompleted && (
                                      <span className="text-xs text-green-600 font-medium">✓ Completed</span>
                                    )}
                                  </li>
                                ))}
                              </ul>
                            ) : (
                              <p className="text-sm text-gray-500">No checkpoints for this task</p>
                            )}
                          </div>
                          {/* Assigned By Section */}
                          {task.assignedBy && (
                            <div>
                              <h4 className="text-base font-semibold text-gray-900 flex items-center mb-2">
                                <User className="h-5 w-5 mr-2 text-gray-500" />Assigned By
                              </h4>
                              <div className="flex items-center bg-white rounded-lg p-3 border border-gray-100 shadow-sm">
                                <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 text-base font-bold">
                                  {task.assignedBy.firstName?.[0]}{task.assignedBy.lastName?.[0]}
                                </div>
                                <span className="ml-3 text-sm text-gray-800">
                                  {task.assignedBy.firstName} {task.assignedBy.lastName}
                                </span>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Status, Points, Priority Row */}
                        <div className="flex items-center text-xs text-gray-500 space-x-6 mt-6">
                          <span className={`inline-block px-2 py-1 rounded text-xs font-semibold ${getStatusColor(task.status)}`}>{task.status.replace('-', ' ').toUpperCase()}</span>
                          <span><Target className="inline w-4 h-4 mr-1" />{task.points} points</span>
                          <span className="capitalize"><Clock className="inline w-4 h-4 mr-1" />{task.priority} priority</span>
                        </div>
                        <div className="flex justify-end space-x-2 pt-4 border-t border-gray-100 mt-6">
                          <div className="text-xs text-gray-500 italic">
                            Use the status dropdown above to update task progress
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // Render Coverage Tasks view if selected
  if (currentView === 'coverage') {
    return (
      <DashboardLayout sidebarActions={sidebarActions}>
        <CoverageTasksView coverageStats={coverageStats} coverageTasks={coverageTasks} />
      </DashboardLayout>
    );
  }

  // Render My Profile view if selected
  if (currentView === 'profile') {
    return (
      <DashboardLayout sidebarActions={sidebarActions}>
        <Profile />
      </DashboardLayout>
    );
  }

  // Render Leave Management view if selected
  if (currentView === 'leave') {
    return (
      <DashboardLayout sidebarActions={sidebarActions}>
        <EmployeeLeaveManagement />
      </DashboardLayout>
    );
  }

  // Render Attendance view if selected
  if (currentView === 'attendance') {
    return (
      <DashboardLayout sidebarActions={sidebarActions}>
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">My Attendance</h1>
            <p className="text-gray-600">Track your daily attendance and view monthly summary</p>
          </div>

          {/* Leave Status Widget */}
          <LeaveStatusWidget />

          {/* Attendance Punch Section */}
          <AttendancePunch />

          {/* Attendance Summary Section */}
          <IndividualAttendanceSummary
            employeeId={user._id}
          />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout sidebarActions={sidebarActions}>
      <div className="space-y-6">
        {/* Welcome Section */}
        <div className="bg-gradient-to-r from-primary-600 to-primary-700 rounded-lg shadow-sm">
          <div className="px-6 py-8 text-white">
            <h1 className="text-3xl font-bold">Welcome, {user?.firstName}!</h1>
            <p className="mt-2 text-primary-100">
              Track your tasks and submit your progress
            </p>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat) => {
            const IconComponent = stat.icon;
            return (
              <div key={stat.name} className="dashboard-card">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="p-3 bg-primary-100 rounded-lg">
                      <IconComponent className="h-6 w-6 text-primary-600" />
                    </div>
                  </div>
                  <div className="ml-4 flex-1">
                    <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
                    <div className="text-sm text-gray-500">{stat.name}</div>
                    {stat.change && <div className="text-sm text-primary-600 font-medium">{stat.change}</div>}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Quick Actions */}
        <div className="dashboard-card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {quickActions.map((action) => {
              const IconComponent = action.icon;

              return (
                <button
                  key={action.name}
                  onClick={action.onClick}
                  className="flex flex-col items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <IconComponent className="h-8 w-8 text-primary-600 mb-2" />
                  <span className="text-sm font-medium text-gray-900 text-center">
                    {action.name}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* My Tasks Section */}
        <div className="bg-white rounded-xl shadow-lg border-2 border-blue-100 p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900 flex items-center">
              <CheckCircle className="h-7 w-7 mr-3 text-blue-600" />
              My Tasks
            </h2>
            <button
              onClick={() => setCurrentView('tasks')}
              className="px-4 py-2 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-lg hover:from-blue-700 hover:to-cyan-700 transition-all duration-200 font-semibold shadow-md hover:shadow-lg"
            >
              View All
            </button>
          </div>

          {isLoading ? (
            <div className="py-8 text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-2 border-t-primary-500 border-r-primary-500 border-b-transparent border-l-transparent"></div>
              <p className="mt-2 text-gray-500">Loading tasks...</p>
            </div>
          ) : error ? (
            <div className="py-8 text-center text-red-600">
              <AlertCircle className="h-8 w-8 mx-auto mb-2" />
              <p>{error}</p>
              <button
                onClick={() => window.location.reload()}
                className="mt-2 text-primary-600 hover:underline"
              >
                Try again
              </button>
            </div>
          ) : tasks.length === 0 ? (
            <div className="py-12 text-center bg-gradient-to-br from-blue-50 to-cyan-50 rounded-lg">
              <CheckSquare className="h-16 w-16 mx-auto mb-4 text-blue-300" />
              <h3 className="text-gray-700 text-xl font-bold mb-2">No tasks assigned yet</h3>
              <p className="text-gray-500">Tasks will appear here once they are assigned to you</p>
            </div>
          ) : (
            <div>
              {tasks.slice(0, 5).map((task, index) => (
                <div key={task._id} className={`mb-4 border-2 border-blue-200 rounded-xl shadow-md hover:shadow-lg transition-all duration-200 ${index % 2 === 0 ? 'bg-white' : 'bg-blue-50/30'}`}>
                  <div
                    className="p-5 cursor-pointer hover:bg-blue-50/50 transition-colors rounded-t-xl"
                    onClick={() => toggleTaskExpand(task._id)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center flex-1">
                        <div className={`h-12 w-12 rounded-full ${getStatusColor(task.status)} flex items-center justify-center shadow-md border-2 border-white`}>
                          <CheckSquare className="h-6 w-6" />
                        </div>
                        <div className="ml-4 flex-1">
                          <div className="text-base font-bold text-gray-900">{task.title}</div>
                          <div className="text-sm text-gray-600 mt-1 flex items-center flex-wrap gap-3">
                            <span className="flex items-center">
                              <Award className="w-4 h-4 mr-1 text-purple-500" />
                              {task.project?.name}
                            </span>
                            <span className="flex items-center">
                              <Target className="w-4 h-4 mr-1 text-blue-500" />
                              {task.points} points
                            </span>
                            <span className="flex items-center">
                              <Calendar className="w-4 h-4 mr-1 text-amber-500" />
                              {formatDeadline(task.deadline)}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        {/* Task Status Dropdown */}
                        <TaskStatusDropdown
                          task={task}
                          onStatusChange={handleDirectStatusChange}
                          onEvidenceRequired={handleEvidenceRequired}
                        />

                        <span className={`px-3 py-1 inline-flex text-xs leading-5 font-bold rounded-full ${getPriorityColor(task.priority)}`}>
                          {task.priority?.charAt(0).toUpperCase() + task.priority?.slice(1)}
                        </span>
                        {expandedTaskId === task._id ?
                          <ChevronUp className="h-6 w-6 text-blue-600" /> :
                          <ChevronDown className="h-6 w-6 text-blue-600" />
                        }
                      </div>
                    </div>
                  </div>

                  {expandedTaskId === task._id && (
                    <div className="p-6 border-t-2 border-blue-200 bg-gradient-to-br from-blue-50 via-purple-50 to-cyan-50 rounded-b-xl">
                      {/* Description Section */}
                      <div className="mb-6">
                        <h4 className="text-base font-semibold text-gray-900 flex items-center mb-2">
                          <FileText className="h-5 w-5 mr-2 text-blue-500" />Description
                        </h4>
                        <div className="bg-white rounded-lg p-4 border border-gray-100 shadow-sm text-gray-800 text-sm">
                          {task.description}
                        </div>
                      </div>

                      {/* Project Section */}
                      <div className="mb-6">
                        <h4 className="text-base font-semibold text-gray-900 flex items-center mb-2">
                          <Award className="h-5 w-5 mr-2 text-purple-500" />Project
                        </h4>
                        <div className="flex items-center bg-white rounded-lg p-3 border border-gray-100 shadow-sm text-gray-800 text-sm">
                          <span className="font-medium mr-2">{task.project?.name || 'N/A'}</span>
                          <span className="ml-auto text-xs text-gray-500 flex items-center">
                            <Calendar className="inline w-4 h-4 mr-1" />{formatDeadline(task.deadline)}
                          </span>
                        </div>
                      </div>

                      {/* Checkpoints & Assigned By Row */}
                      <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Checkpoints Section */}
                        <div>
                          <h4 className="text-base font-semibold text-gray-900 flex items-center mb-2">
                            <CheckCircle className="h-5 w-5 mr-2 text-green-500" />Checkpoints
                          </h4>
                          {task.checkpoints && task.checkpoints.length > 0 ? (
                            <ul className="space-y-3">
                              {task.checkpoints.map((checkpoint) => (
                                <li key={checkpoint._id} className="flex items-center justify-between bg-white rounded p-3 border border-gray-100 shadow-sm">
                                  <div className="flex items-center">
                                    <div className={`h-4 w-4 mr-3 rounded-full ${checkpoint.isCompleted ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                                    <div>
                                      <span className="text-sm text-gray-800 font-medium">{checkpoint.title}</span>
                                      {checkpoint.description && (
                                        <p className="text-xs text-gray-500 mt-1">{checkpoint.description}</p>
                                      )}
                                      {checkpoint.isCompleted && checkpoint.completedAt && (
                                        <p className="text-xs text-green-600 mt-1">
                                          ✓ Completed on {formatDate(checkpoint.completedAt)}
                                        </p>
                                      )}
                                    </div>
                                  </div>
                                  {!checkpoint.isCompleted && (
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setSelectedCheckpoint(checkpoint);
                                        setShowCheckpointModal(true);
                                      }}
                                      className="px-3 py-1 bg-primary-100 text-primary-600 rounded-md hover:bg-primary-200 text-xs flex items-center"
                                    >
                                      <CheckCircle className="h-3 w-3 mr-1" />
                                      Complete
                                    </button>
                                  )}
                                  {checkpoint.isCompleted && (
                                    <span className="text-xs text-green-600 font-medium">✓ Completed</span>
                                  )}
                                </li>
                              ))}
                            </ul>
                          ) : (
                            <p className="text-sm text-gray-500">No checkpoints for this task</p>
                          )}
                        </div>
                        {/* Assigned By Section */}
                        {task.assignedBy && (
                          <div>
                            <h4 className="text-base font-semibold text-gray-900 flex items-center mb-2">
                              <User className="h-5 w-5 mr-2 text-gray-500" />Assigned By
                            </h4>
                            <div className="flex items-center bg-white rounded-lg p-3 border border-gray-100 shadow-sm">
                              <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 text-base font-bold">
                                {task.assignedBy.firstName?.[0]}{task.assignedBy.lastName?.[0]}
                              </div>
                              <span className="ml-3 text-sm text-gray-800">
                                {task.assignedBy.firstName} {task.assignedBy.lastName}
                              </span>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Status, Points, Priority Row */}
                      <div className="flex items-center text-xs text-gray-500 space-x-6 mt-6">
                        <span className={`inline-block px-2 py-1 rounded text-xs font-semibold ${getStatusColor(task.status)}`}>{task.status.replace('-', ' ').toUpperCase()}</span>
                        <span><Target className="inline w-4 h-4 mr-1" />{task.points} points</span>
                        <span className="capitalize"><Clock className="inline w-4 h-4 mr-1" />{task.priority} priority</span>
                      </div>
                      <div className="flex justify-end space-x-2 pt-4 border-t border-gray-100 mt-6">
                        <div className="text-xs text-gray-500 italic">
                          Use the status dropdown above to update task progress
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* My Checkpoints Section */}
        <div className="dashboard-card">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-semibold text-gray-900">My Checkpoints</h2>
            <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
              {checkpoints.filter(cp => !cp.isCompleted).length} pending
            </span>
          </div>

          {checkpoints.length === 0 ? (
            <div className="py-8 text-center text-gray-500">
              <CheckCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No checkpoints assigned yet</p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {checkpoints.map((checkpoint) => (
                <div
                  key={checkpoint._id}
                  className={`p-4 rounded-lg border ${checkpoint.isCompleted
                    ? 'bg-green-50 border-green-200'
                    : 'bg-white border-gray-200 hover:shadow-md'
                    } transition-shadow`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900">{checkpoint.title}</h3>
                      <p className="text-sm text-gray-600 mt-1">{checkpoint.description}</p>
                      <p className="text-xs text-gray-500 mt-2">
                        Task: {checkpoint.taskTitle}
                      </p>
                      {checkpoint.isCompleted && (
                        <p className="text-xs text-green-600 mt-2">
                          ✓ Completed on {formatDate(checkpoint.completedAt)}
                        </p>
                      )}
                    </div>
                    {!checkpoint.isCompleted && (
                      <button
                        onClick={() => {
                          setSelectedCheckpoint(checkpoint);
                          setShowCheckpointModal(true);
                        }}
                        className="ml-2 px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
                      >
                        Complete
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Complete Checkpoint Modal */}
      {showCheckpointModal && selectedCheckpoint && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>

            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <form onSubmit={handleSubmitEvidence}>
                <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Complete Checkpoint</h3>

                  <div className="mb-4">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Checkpoint: {selectedCheckpoint.title}</h4>
                    {selectedCheckpoint.description && (
                      <p className="text-sm text-gray-600 mb-4">{selectedCheckpoint.description}</p>
                    )}
                  </div>

                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Evidence Type
                    </label>
                    <div className="flex space-x-4">
                      <label className="flex items-center">
                        <input
                          type="radio"
                          name="verificationMethod"
                          value="url"
                          checked={checkpointEvidence.verificationMethod === 'url'}
                          onChange={handleEvidenceInputChange}
                          className="mr-2"
                        />
                        <Link className="h-4 w-4 mr-1" />
                        URL Link
                      </label>
                      <label className="flex items-center">
                        <input
                          type="radio"
                          name="verificationMethod"
                          value="screenshot"
                          checked={checkpointEvidence.verificationMethod === 'screenshot'}
                          onChange={handleEvidenceInputChange}
                          className="mr-2"
                        />
                        <Image className="h-4 w-4 mr-1" />
                        Screenshot
                      </label>
                    </div>
                  </div>

                  {checkpointEvidence.verificationMethod === 'url' && (
                    <div className="mb-4">
                      <label htmlFor="verificationUrl" className="block text-sm font-medium text-gray-700 mb-1">
                        Verification URL
                      </label>
                      <input
                        type="url"
                        id="verificationUrl"
                        name="verificationUrl"
                        required
                        value={checkpointEvidence.verificationUrl}
                        onChange={handleEvidenceInputChange}
                        placeholder="https://example.com/proof"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                      />
                    </div>
                  )}

                  {checkpointEvidence.verificationMethod === 'screenshot' && (
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Upload Screenshot
                      </label>
                      <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
                        <div className="space-y-1 text-center">
                          {previewUrl ? (
                            <div className="relative">
                              <img
                                src={previewUrl}
                                alt="Preview"
                                className="mx-auto h-32 w-32 object-cover rounded-md"
                              />
                              <button
                                type="button"
                                onClick={clearFileSelection}
                                className="absolute top-0 right-0 -mt-2 -mr-2 bg-red-500 text-white rounded-full h-6 w-6 flex items-center justify-center"
                              >
                                <X className="h-4 w-4" />
                              </button>
                            </div>
                          ) : (
                            <>
                              <Upload className="mx-auto h-12 w-12 text-gray-400" />
                              <div className="flex text-sm text-gray-600">
                                <label htmlFor="screenshot" className="relative cursor-pointer bg-white rounded-md font-medium text-primary-600 hover:text-primary-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-primary-500">
                                  <span>Upload a file</span>
                                  <input
                                    id="screenshot"
                                    name="screenshot"
                                    type="file"
                                    accept="image/*"
                                    className="sr-only"
                                    onChange={handleFileChange}
                                  />
                                </label>
                                <p className="pl-1">or drag and drop</p>
                              </div>
                              <p className="text-xs text-gray-500">PNG, JPG, GIF up to 10MB</p>
                            </>
                          )}
                        </div>
                      </div>

                      {checkpointEvidence.screenshot && (
                        <div className="mt-3">
                          <label htmlFor="caption" className="block text-sm font-medium text-gray-700 mb-1">
                            Caption (Optional)
                          </label>
                          <input
                            type="text"
                            id="caption"
                            name="caption"
                            value={checkpointEvidence.caption}
                            onChange={handleEvidenceInputChange}
                            placeholder="Describe what this screenshot shows"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                          />
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                  <button
                    type="submit"
                    className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-primary-600 text-base font-medium text-white hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 sm:ml-3 sm:w-auto sm:text-sm"
                  >
                    Complete Checkpoint
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowCheckpointModal(false);
                      setSelectedCheckpoint(null);
                      setCheckpointEvidence({
                        verificationUrl: '',
                        verificationMethod: 'url',
                        screenshot: null,
                        caption: ''
                      });
                      setPreviewUrl(null);
                    }}
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

      {/* Task Evidence Modal */}
      <TaskEvidenceModal
        isOpen={showEvidenceModal}
        onClose={() => {
          setShowEvidenceModal(false);
          setSelectedTask(null);
          setPendingStatus(null);
        }}
        task={selectedTask}
        newStatus={pendingStatus}
        onSubmit={handleEvidenceSubmit}
      />
    </DashboardLayout>
  );
};

export default ServiceDeliveryDashboard;
