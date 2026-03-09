import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Users,
  CheckSquare,
  ClipboardList,
  Calendar,
  Clock,
  Plus,
  MoreHorizontal,
  CheckCircle,
  AlertCircle,
  Edit,
  Trash2,
  UserCheck,
  ChevronDown,
  ChevronUp,
  Target,
  BarChart3,
  FileText,
  Bot,
  Zap,
  UserPlus,
  DollarSign,
  ClipboardCheck,
  Eye,
  X,
  Sparkles
} from 'lucide-react';
import DashboardLayout from '../components/DashboardLayout';
import PayrollReminderPopup from '../components/PayrollReminderPopup';
import LeaveApproval from '../components/LeaveApproval';
import AttendancePunch from '../components/AttendancePunch';
import AttendanceManagement from '../components/AttendanceManagement';
import TeamOverview from '../components/manager/TeamOverview';
import ProjectStatus from '../components/manager/ProjectStatus';
import PerformanceTracking from '../components/manager/PerformanceTracking';
import TeamReports from '../components/manager/TeamReports';
import BunchManagement from '../components/manager/BunchManagement';
import BunchList from '../components/manager/BunchList';
import api from '../utils/api';
import { formatDate } from '../utils/helpers';
import { showToast as toast } from '../utils/toast';
import StatCard from '../components/StatCard';

const ManagerDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [individuals, setIndividuals] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [unassignedTasks, setUnassignedTasks] = useState([]);
  const [reviewTasks, setReviewTasks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Persist current view in localStorage to maintain state across page reloads
  const [currentView, setCurrentView] = useState(() => {
    const savedView = localStorage.getItem('managerDashboardView');
    return savedView || 'dashboard';
  });

  // Save view to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('managerDashboardView', currentView);
  }, [currentView]);

  // Modal states
  const [showCreateProjectModal, setShowCreateProjectModal] = useState(false);
  const [showCreateTaskModal, setShowCreateTaskModal] = useState(false);
  const [aiComplexityPreview, setAiComplexityPreview] = useState(null);
  const [aiPreviewLoading, setAiPreviewLoading] = useState(false);

  // New modal states for displaying lists
  const [showProjectsModal, setShowProjectsModal] = useState(false);
  const [showTaskReviewModal, setShowTaskReviewModal] = useState(false);
  const [showTaskAllocationModal, setShowTaskAllocationModal] = useState(false);
  const [showTaskBunchesModal, setShowTaskBunchesModal] = useState(false);
  const [showExecutiveTasksModal, setShowExecutiveTasksModal] = useState(false);
  const [showProjectDetailsModal, setShowProjectDetailsModal] = useState(false);

  // Executive tasks state
  const [executiveTasks, setExecutiveTasks] = useState([]);
  const [loadingExecutiveTasks, setLoadingExecutiveTasks] = useState(false);
  const [delegatingExecutiveTask, setDelegatingExecutiveTask] = useState(null);
  const [executiveTaskFilter, setExecutiveTaskFilter] = useState('all'); // 'all', 'project', 'other'

  // Advanced features state (v1.2.0)
  const [phasePrediction, setPhasePrediction] = useState(null);
  const [taskBreakdownSuggestions, setTaskBreakdownSuggestions] = useState(null);
  const [deadlineWarning, setDeadlineWarning] = useState(null);
  const [showConfidenceBreakdown, setShowConfidenceBreakdown] = useState(false);
  const [selectedDimension, setSelectedDimension] = useState(null);
  const [showDeleteTaskModal, setShowDeleteTaskModal] = useState(false);
  const [showCreateCheckpointModal, setShowCreateCheckpointModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [selectedProject, setSelectedProject] = useState(null);
  const [expandedTaskId, setExpandedTaskId] = useState(null);
  const [expandedProjects, setExpandedProjects] = useState([]); // Track which projects are expanded
  const [viewingBunchesForProject, setViewingBunchesForProject] = useState(null);

  // New project form state
  const [newProject, setNewProject] = useState({
    name: '',
    description: '',
    deadline: '',
    documentation: ''
  });
  const [srsFile, setSrsFile] = useState(null);
  const [srsFileName, setSrsFileName] = useState('');

  // New task form state
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    projectId: '',
    assignedToId: '',
    deadline: '',
    points: 1,
    priority: 'medium',
    taskBunch: ''  // Added for phase prediction feature
  });

  // New checkpoint form state
  const [newCheckpoint, setNewCheckpoint] = useState({
    title: '',
    description: '',
    taskId: ''
  });

  // Quick actions for management tools
  const quickActions = [
    { name: 'Team Overview', icon: Users, onClick: () => setCurrentView('team-overview') },
    { name: 'Project Status', icon: Target, onClick: () => setCurrentView('project-status') },
    { name: 'New Project', icon: Plus, onClick: () => setShowCreateProjectModal(true) },
    { name: 'My Profile', icon: UserCheck, onClick: () => navigate('/profile') },
    { name: 'Performance', icon: BarChart3, onClick: () => setCurrentView('performance') },
    { name: 'Team Reports', icon: FileText, onClick: () => setCurrentView('team-reports') },
  ];

  // Sidebar actions for DashboardLayout
  const sidebarActions = [
    {
      label: 'Dashboard',
      icon: Users,
      onClick: () => setCurrentView('dashboard'),
      active: currentView === 'dashboard'
    },
    {
      label: 'My Attendance',
      icon: ClipboardCheck,
      onClick: () => setCurrentView('my-attendance'),
      active: currentView === 'my-attendance'
    },
    {
      label: 'Team Attendance',
      icon: UserCheck,
      onClick: () => setCurrentView('team-attendance'),
      active: currentView === 'team-attendance'
    },
    {
      label: 'Leave Management',
      icon: Calendar,
      onClick: () => setCurrentView('leave'),
      active: currentView === 'leave'
    },
    {
      label: 'Team Overview',
      icon: Users,
      onClick: () => setCurrentView('team-overview'),
      active: currentView === 'team-overview'
    },
    {
      label: 'Project Status',
      icon: Target,
      onClick: () => setCurrentView('project-status'),
      active: currentView === 'project-status'
    },
    {
      label: 'New Project',
      icon: Plus,
      onClick: () => setShowCreateProjectModal(true),
      active: false
    },
    {
      label: 'Performance',
      icon: BarChart3,
      onClick: () => setCurrentView('performance'),
      active: currentView === 'performance'
    },
    {
      label: 'Team Reports',
      icon: FileText,
      onClick: () => setCurrentView('team-reports'),
      active: currentView === 'team-reports'
    }
  ];

  // Lock body scroll when any modal is open
  useEffect(() => {
    if (showProjectsModal || showTaskReviewModal || showTaskAllocationModal || showTaskBunchesModal) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    // Cleanup on unmount
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [showProjectsModal, showTaskReviewModal, showTaskAllocationModal, showTaskBunchesModal]);

  // Custom back handler for state-based views
  const handleBackToMain = () => {
    setCurrentView('dashboard');
  };

  // Handle input change for new project
  const handleProjectInputChange = (e) => {
    const { name, value } = e.target;
    setNewProject({ ...newProject, [name]: value });
  };

  // Handle SRS file upload
  const handleSrsFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.type !== 'application/pdf') {
        toast.error('Please upload a PDF file only');
        e.target.value = '';
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        toast.error('File size must be less than 10MB');
        e.target.value = '';
        return;
      }
      setSrsFile(file);
      setSrsFileName(file.name);
    }
  };

  // Create new project with AI automation
  const handleCreateProject = async (e) => {
    e.preventDefault();

    try {
      const formData = new FormData();
      formData.append('name', newProject.name);
      formData.append('description', newProject.description);
      formData.append('deadline', newProject.deadline);
      formData.append('documentation', newProject.documentation);
      formData.append('assignedManagerId', user.id); // Manager assigns to themselves

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

      setProjects([createdProject, ...projects]);
      toast.success('Project created successfully! Generating AI tasks...');

      // Step 2: Call LLM to generate tasks with bunches
      try {
        const llmRes = await api.post('/projects/automate-llm', {
          projectId: createdProject._id
        });

        if (llmRes.data.success) {
          toast.success(`✨ AI generated ${llmRes.data.data.tasksCreated} tasks in ${llmRes.data.data.bunchesCreated} bunches!`);
        }
      } catch (llmError) {
        console.warn('LLM task generation failed:', llmError);
        toast.warning('Project created, but AI task generation failed. Tasks can be created manually.');
      }

      // Reset form and close modal
      setNewProject({
        name: '',
        description: '',
        deadline: '',
        documentation: ''
      });
      setSrsFile(null);
      setSrsFileName('');
      setShowCreateProjectModal(false);

    } catch (err) {
      console.error('Error creating project:', err);
      const errorMessage = err.response?.data?.message || err.response?.data?.errors?.[0]?.msg || 'Failed to create project. Please try again.';
      toast.error(errorMessage);
    }
  };

  // Fetch data on component mount
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        // Fetch projects assigned to this manager
        const projectsRes = await api.get('/projects');
        console.log('📁 Projects fetched:', projectsRes.data.data);
        setProjects(projectsRes.data.data);

        // Fetch individuals for task assignment
        const individualsRes = await api.get('/users/individuals');
        setIndividuals(individualsRes.data.data);

        // Fetch tasks assigned by this manager
        const tasksRes = await api.get('/tasks/manager');
        setTasks(tasksRes.data.data);

        // Fetch unassigned automated tasks
        const unassignedRes = await api.get('/tasks/unassigned');
        setUnassignedTasks(unassignedRes.data.data || []);

        // Fetch tasks pending review
        const reviewRes = await api.get('/tasks/review');
        setReviewTasks(reviewRes.data.data || []);

      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        setError('Failed to load dashboard data. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  // Fetch executive tasks when modal opens
  useEffect(() => {
    if (showExecutiveTasksModal) {
      fetchExecutiveTasks();
    }
  }, [showExecutiveTasksModal]);

  // Fetch executive tasks (tasks assigned by CEO/Co-Founder)
  const fetchExecutiveTasks = async () => {
    setLoadingExecutiveTasks(true);
    try {
      const response = await api.get('/executive-tasks/my-tasks');
      console.log('📋 Executive Tasks Response:', response.data);
      const tasks = response.data.data || response.data || [];
      console.log('📋 Parsed Executive Tasks:', tasks);
      setExecutiveTasks(Array.isArray(tasks) ? tasks : []);
    } catch (error) {
      console.error('❌ Error fetching executive tasks:', error);
      console.error('❌ Error response:', error.response?.data);
      toast.error(error.response?.data?.message || 'Failed to load executive tasks');
    } finally {
      setLoadingExecutiveTasks(false);
    }
  };

  // Handle accepting executive task
  const handleAcceptExecutiveTask = async (taskId) => {
    try {
      await api.put(`/executive-tasks/${taskId}/status`, { status: 'accepted' });
      toast.success('Task accepted successfully');
      fetchExecutiveTasks(); // Refresh the list
    } catch (error) {
      console.error('Error accepting task:', error);
      toast.error(error.response?.data?.message || 'Failed to accept task');
    }
  };

  // Handle delegating executive task - open task creation modal
  const handleDelegateExecutiveTask = (executiveTask) => {
    // Pre-fill the task creation form with executive task details
    setNewTask({
      title: executiveTask.description,
      description: `Executive Task from ${executiveTask.assignedBy?.firstName} ${executiveTask.assignedBy?.lastName}\nOriginal Deadline: ${new Date(executiveTask.executiveDeadline).toLocaleDateString()}\n\nTask Details:\n`,
      projectId: executiveTask.projectId?._id || '',
      assignedToId: '',
      deadline: '',
      points: 1,
      priority: 'high',
      status: 'pending',
      taskBunch: ''
    });

    // Store the executive task ID for later update
    setDelegatingExecutiveTask(executiveTask._id);

    // Close executive tasks modal and open create task modal
    setShowExecutiveTasksModal(false);
    setShowCreateTaskModal(true);
  };

  // Handle input change for new task
  const handleTaskInputChange = (e) => {
    const { name, value } = e.target;
    setNewTask({ ...newTask, [name]: value });
  };

  // Handle input change for new checkpoint
  const handleCheckpointInputChange = (e) => {
    const { name, value } = e.target;
    setNewCheckpoint({ ...newCheckpoint, [name]: value });
  };

  // Create new task
  // AI Complexity Preview with debouncing
  const previewTimeoutRef = useRef(null);

  const previewAiComplexity = async (title, description, priority, phase) => {
    // Immediately clear preview if text is erased
    if (!title?.trim() || !description?.trim() || description.trim().length < 10) {
      setAiComplexityPreview(null);
      setAiPreviewLoading(false);

      // Clear any pending timeout
      if (previewTimeoutRef.current) {
        clearTimeout(previewTimeoutRef.current);
      }
      return;
    }

    // Clear previous timeout
    if (previewTimeoutRef.current) {
      clearTimeout(previewTimeoutRef.current);
    }

    // Debounce API call (wait 1 second after user stops typing)
    previewTimeoutRef.current = setTimeout(async () => {

      setAiPreviewLoading(true);

      try {
        const response = await fetch('http://localhost:8000/api/score-task', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            title,
            description,
          }),
          signal: AbortSignal.timeout(3000) // 3 second timeout
        });

        if (response.ok) {
          const data = await response.json();
          setAiComplexityPreview(data);

          // Feature 2: Check if task breakdown suggested
          if (data.points >= 20) {
            fetchTaskBreakdown(title, description, data.points, phase || newTask.taskBunch);
          } else {
            setTaskBreakdownSuggestions(null);
          }

          // Feature 3: Check deadline feasibility
          if (data.metadata?.deadline_check) {
            if (!data.metadata.deadline_check.feasible) {
              setDeadlineWarning(data.metadata.deadline_check);
            } else {
              setDeadlineWarning(null);
            }
          }
        } else {
          // Silently fail if AI service returns error
          // console.error('AI preview failed');
          setAiComplexityPreview(null);
        }
      } catch (error) {
        // Silently fail if AI service is unavailable
        // console.error('AI preview error:', error);
        setAiComplexityPreview(null);
      } finally {
        setAiPreviewLoading(false);
      }
    }, 1000); // 1 second debounce
  };

  // Feature 1: Predict phase from title/description
  const predictPhase = async (title, description) => {
    if (!title || !description || description.length < 10) return;

    try {
      const response = await fetch('http://localhost:8000/api/predict-phase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, description }),
        signal: AbortSignal.timeout(3000) // 3 second timeout
      });

      if (response.ok) {
        const prediction = await response.json();
        setPhasePrediction(prediction);

        // Auto-fill if confidence is high
        if (prediction.confidence >= 0.7 && !newTask.taskBunch) {
          setNewTask(prev => ({ ...prev, taskBunch: prediction.predicted_phase }));
        }
      }
    } catch (error) {
      // Silently fail if AI service is unavailable
      // console.error('Phase prediction error:', error);
    }
  };

  // Feature 2: Fetch task breakdown suggestions
  const fetchTaskBreakdown = async (title, description, estimatedPoints, phase) => {
    try {
      const response = await fetch('http://localhost:8000/api/suggest-breakdown', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          description,
          estimated_points: estimatedPoints,
          phase: phase || 'Backend Development'
        }),
        signal: AbortSignal.timeout(3000) // 3 second timeout
      });

      if (response.ok) {
        const breakdown = await response.json();
        if (breakdown.should_break) {
          setTaskBreakdownSuggestions(breakdown);
        }
      }
    } catch (error) {
      // Silently fail if AI service is unavailable
      // console.error('Task breakdown error:', error);
    }
  };

  const handleCreateTask = async (e) => {
    e.preventDefault();

    console.log('🔵 Creating task with data:', newTask);

    try {
      const res = await api.post('/tasks', newTask);
      console.log('✅ Task created successfully:', res.data);

      // If this task is delegating an executive task, update the executive task
      if (delegatingExecutiveTask) {
        try {
          await api.put(`/executive-tasks/${delegatingExecutiveTask}/status`, {
            status: 'delegated',
            delegatedTaskId: res.data.data._id
          });
          console.log('✅ Executive task updated with delegation');
          toast.success('Task delegated successfully');
        } catch (execError) {
          console.error('❌ Error updating executive task:', execError);
          toast.warning('Task created but failed to update executive task status');
        }
        // Clear the delegating state
        setDelegatingExecutiveTask(null);
      }

      // Add new task to state
      setTasks([res.data.data, ...tasks]);

      // Reset form and close modal
      setNewTask({
        title: '',
        description: '',
        projectId: '',
        assignedToId: '',
        deadline: '',
        points: 1,
        priority: 'medium',
        taskBunch: ''  // Reset phase
      });
      setShowCreateTaskModal(false);

      // Clear advanced features state
      setAiComplexityPreview(null);
      setTaskBreakdownSuggestions(null);
      setDeadlineWarning(null);
      setShowConfidenceBreakdown(false);
      setSelectedDimension(null);

      if (!delegatingExecutiveTask) {
        toast.success('Task created successfully');
      }
    } catch (err) {
      console.error('❌ Error creating task:', err);
      console.error('❌ Error response:', err.response?.data);
      setError('Failed to create task. Please try again.');
      toast.error('Failed to create task');
    }
  };

  // Create new checkpoint
  const handleCreateCheckpoint = async (e) => {
    e.preventDefault();

    try {
      const res = await api.post('/checkpoints', newCheckpoint);

      // Add new checkpoint to task
      const updatedTasks = tasks.map(task => {
        if (task._id === newCheckpoint.taskId) {
          return {
            ...task,
            checkpoints: [...(task.checkpoints || []), res.data.data]
          };
        }
        return task;
      });

      setTasks(updatedTasks);

      // Reset form and close modal
      setNewCheckpoint({
        title: '',
        description: '',
        taskId: ''
      });
      setShowCreateCheckpointModal(false);

      showToast.success('Checkpoint created successfully');
    } catch (err) {
      console.error('Error creating checkpoint:', err);
      setError('Failed to create checkpoint. Please try again.');
      showToast.error('Failed to create checkpoint');
    }
  };

  // Delete task
  const handleDeleteTask = async () => {
    if (!selectedTask) return;

    try {
      await api.delete(`/ tasks / ${selectedTask._id} `);

      // Remove deleted task from state
      setTasks(tasks.filter(task => task._id !== selectedTask._id));

      // Close modal
      setShowDeleteTaskModal(false);
      setSelectedTask(null);

      showToast.success('Task deleted successfully');
    } catch (err) {
      console.error('Error deleting task:', err);
      setError('Failed to delete task. Please try again.');
      showToast.error('Failed to delete task');
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

  // Get status badge color
  const getStatusColor = (status) => {
    switch (status) {
      case 'not-started':
        return 'bg-gray-100 text-gray-800';
      case 'in-progress':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'blocked':
        return 'bg-red-100 text-red-800';
      case 'review':
        return 'bg-amber-100 text-amber-800';
      case 'on-hold':
        return 'bg-amber-100 text-amber-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
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

  // Sort tasks: cofounder_rag tasks first (sorted by deadline), then regular tasks (sorted by priority then deadline)
  const getSortedTasks = (taskList) => {
    const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 };

    // Separate cofounder and regular tasks
    const cofounderTasks = taskList.filter(t => t.source === 'cofounder_rag');
    const regularTasks = taskList.filter(t => t.source !== 'cofounder_rag');

    // Sort cofounder tasks by priority first, then deadline
    cofounderTasks.sort((a, b) => {
      const priorityDiff = (priorityOrder[a.priority] || 2) - (priorityOrder[b.priority] || 2);
      if (priorityDiff !== 0) return priorityDiff;
      return new Date(a.deadline) - new Date(b.deadline);
    });

    // Sort regular tasks by priority then deadline
    regularTasks.sort((a, b) => {
      const priorityDiff = (priorityOrder[a.priority] || 2) - (priorityOrder[b.priority] || 2);
      if (priorityDiff !== 0) return priorityDiff;
      return new Date(a.deadline) - new Date(b.deadline);
    });

    // Cofounder tasks come first
    return [...cofounderTasks, ...regularTasks];
  };

  // Check if task is from cofounder RAG
  const isCofounderTask = (task) => task.source === 'cofounder_rag';

  // Toggle project expansion
  const toggleProjectExpand = (projectId) => {
    if (expandedProjects.includes(projectId)) {
      setExpandedProjects(expandedProjects.filter(id => id !== projectId));
    } else {
      setExpandedProjects([...expandedProjects, projectId]);
    }
  };

  // Get tasks for a specific project
  const getTasksByProject = (projectId) => {
    return tasks.filter(task =>
      task.project?._id === projectId || task.project === projectId
    );
  };

  // Get tasks without a project (general tasks)
  const getGeneralTasks = () => {
    return tasks.filter(task => !task.project);
  };

  // Dashboard statistics
  const stats = [
    { name: 'Assigned Projects', value: projects.length, icon: ClipboardList },
    {
      name: 'Tasks for Review',
      value: reviewTasks.length,
      icon: Eye
    },
    {
      name: 'Active Tasks',
      value: tasks.filter(t => t.status !== 'completed').length,
      icon: CheckSquare
    },
    {
      name: 'Completed Tasks',
      value: tasks.filter(t => t.status === 'completed').length,
      icon: CheckCircle
    },
  ];

  // Render different views based on current selection
  if (currentView === 'leave') {
    return (
      <DashboardLayout sidebarActions={sidebarActions} onBack={handleBackToMain} showBackButtonOverride={true}>
        <LeaveApproval />
      </DashboardLayout>
    );
  }

  if (currentView === 'my-attendance') {
    return (
      <DashboardLayout sidebarActions={sidebarActions} onBack={handleBackToMain} showBackButtonOverride={true}>
        <AttendancePunch />
      </DashboardLayout>
    );
  }

  if (currentView === 'team-attendance') {
    return (
      <DashboardLayout sidebarActions={sidebarActions} onBack={handleBackToMain} showBackButtonOverride={true}>
        <AttendanceManagement />
      </DashboardLayout>
    );
  }

  if (currentView === 'team-overview') {
    return (
      <DashboardLayout sidebarActions={sidebarActions} onBack={handleBackToMain} showBackButtonOverride={true}>
        <TeamOverview />
      </DashboardLayout>
    );
  }

  if (currentView === 'project-status') {
    return (
      <DashboardLayout sidebarActions={sidebarActions} onBack={handleBackToMain} showBackButtonOverride={true}>
        <ProjectStatus onViewBunches={(projectId) => {
          setViewingBunchesForProject(projectId);
          setShowProjectDetailsModal(true);
        }} />

        {/* Project Details Modal */}
        {showProjectDetailsModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4" onClick={() => setShowProjectDetailsModal(false)}>
            <div className="bg-background rounded-2xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden border border-border" onClick={(e) => e.stopPropagation()}>
              <div className="flex justify-between items-center p-6 border-b border-border">
                <div>
                  <h2 className="text-2xl font-bold text-foreground">Project Task Bunches</h2>
                  <p className="text-sm text-muted-foreground mt-1">Detailed view of microtasks and delegation</p>
                </div>
                <button
                  onClick={() => setShowProjectDetailsModal(false)}
                  className="p-2 hover:bg-muted rounded-full transition-colors"
                >
                  <X className="h-6 w-6 text-muted-foreground" />
                </button>
              </div>
              <div className="p-6 overflow-y-auto" style={{ maxHeight: 'calc(90vh - 100px)' }}>
                <BunchManagement projectId={viewingBunchesForProject} />
              </div>
            </div>
          </div>
        )}
      </DashboardLayout>
    );
  }



  if (currentView === 'performance') {
    return (
      <DashboardLayout sidebarActions={sidebarActions} onBack={handleBackToMain} showBackButtonOverride={true}>
        <PerformanceTracking />
      </DashboardLayout>
    );
  }

  if (currentView === 'team-reports') {
    return (
      <DashboardLayout sidebarActions={sidebarActions} onBack={handleBackToMain} showBackButtonOverride={true}>
        <TeamReports />
      </DashboardLayout>
    );
  }

  return (
    <>
      <PayrollReminderPopup userRole={user?.role} />
      <DashboardLayout sidebarActions={sidebarActions} showBackButtonOverride={false}>
        <div className="space-y-6">
          {/* Welcome Section */}
          <div className="bg-gradient-to-r from-primary-600 to-primary-700 rounded-lg shadow-sm">
            <div className="px-6 py-8 text-white">
              <h1 className="text-3xl font-bold">Welcome, {user?.firstName}!</h1>
              <p className="mt-2 text-primary-100">
                Manage your tasks and team members from the Manager dashboard
              </p>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
            {stats.map((stat, index) => (
              <div key={stat.name} className={`animate - fadeInUp stagger - ${index + 1} `}>
                <StatCard
                  title={stat.name}
                  value={stat.value}
                  icon={stat.icon}
                  trend={stat.change}
                  trendUp={stat.change?.includes('+')}
                  gradient={index === 0 ? 'primary' : index === 1 ? 'info' : index === 2 ? 'success' : 'warning'}
                />
              </div>
            ))}
          </div>

          {/* Quick Actions */}
          <div className="dashboard-card">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Management Tools</h2>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {quickActions.map((action) => {
                const IconComponent = action.icon;

                if (action.onClick) {
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
                }
              })}
            </div>
          </div>

          {/* Projects Section - Clickable Card */}
          <div
            className="dashboard-card cursor-pointer hover:shadow-lg transition-all duration-200 border-2 border-transparent hover:border-primary-500"
            onClick={() => setShowProjectsModal(true)}
          >
            <div className="flex justify-between items-center">
              <div className="flex items-center space-x-4">
                <div className="h-16 w-16 rounded-full bg-primary-100 flex items-center justify-center">
                  <ClipboardList className="h-8 w-8 text-primary-600" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">Projects & Tasks</h2>
                  <p className="text-sm text-gray-600 mt-1">Click to view all projects</p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold text-primary-600">{projects.length}</div>
                <div className="text-sm text-gray-500">Total Projects</div>
              </div>
            </div>
          </div>

          {/* Task Review Section - Clickable Card */}
          <div
            className="dashboard-card cursor-pointer hover:shadow-lg transition-all duration-200 border-2 border-transparent hover:border-yellow-500"
            onClick={() => setShowTaskReviewModal(true)}
          >
            <div className="flex justify-between items-center">
              <div className="flex items-center space-x-4">
                <div className="h-16 w-16 rounded-full bg-yellow-100 flex items-center justify-center">
                  <Eye className="h-8 w-8 text-yellow-600" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">Tasks Pending Review</h2>
                  <p className="text-sm text-gray-600 mt-1">Click to review submitted tasks</p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold text-yellow-600">{reviewTasks.length}</div>
                <div className="text-sm text-gray-500">Awaiting Review</div>
              </div>
            </div>
          </div>

          {/* Task Bunches Section - Clickable Card */}
          <div
            className="dashboard-card cursor-pointer hover:shadow-lg transition-all duration-200 border-2 border-transparent hover:border-green-500"
            onClick={() => setShowTaskBunchesModal(true)}
          >
            <div className="flex justify-between items-center">
              <div className="flex items-center space-x-4">
                <div className="h-16 w-16 rounded-full bg-green-100 flex items-center justify-center">
                  <Target className="h-8 w-8 text-green-600" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">Task Bunches</h2>
                  <p className="text-sm text-gray-600 mt-1">Click to view and assign task bunches</p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold text-green-600">View</div>
                <div className="text-sm text-gray-500">All Bunches</div>
              </div>
            </div>
          </div>

          {/* Projects Modal */}
          {showProjectsModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={() => setShowProjectsModal(false)}>
              <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-hidden" onClick={(e) => e.stopPropagation()}>
                <div className="flex justify-between items-center p-6 border-b border-gray-200">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">Projects & Tasks</h2>
                    <p className="text-sm text-gray-600 mt-1">Manage all your projects</p>
                  </div>
                  <div className="flex items-center space-x-3">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowCreateProjectModal(true);
                      }}
                      className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 flex items-center text-sm"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      New Project
                    </button>
                    <button
                      onClick={() => setShowProjectsModal(false)}
                      className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                    >
                      <X className="h-6 w-6 text-gray-500" />
                    </button>
                  </div>
                </div>
                <div className="p-6 overflow-y-auto" style={{ maxHeight: 'calc(90vh - 100px)' }}>
                  {isLoading ? (
                    <div className="py-8 text-center">
                      <div className="inline-block animate-spin rounded-full h-8 w-8 border-2 border-t-primary-500 border-r-primary-500 border-b-transparent border-l-transparent"></div>
                      <p className="mt-2 text-gray-500">Loading projects...</p>
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
                  ) : projects.length === 0 ? (
                    <div className="py-10 text-center">
                      <ClipboardList className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                      <h3 className="text-gray-500 text-lg font-medium mb-1">No projects assigned yet</h3>
                      <p className="text-gray-400">Projects will appear here once they are assigned to you</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {projects.map((project) => {
                        const projectTasks = getTasksByProject(project._id);
                        const isExpanded = expandedProjects.includes(project._id);

                        return (
                          <div key={project._id} className="border border-gray-200 rounded-lg overflow-hidden">
                            {/* Project Header - Clickable */}
                            <div
                              className="bg-white p-5 cursor-pointer hover:bg-gray-50 transition-colors"
                              onClick={() => toggleProjectExpand(project._id)}
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center flex-1">
                                  <div className="flex-shrink-0">
                                    <div className="h-12 w-12 rounded-full bg-primary-100 flex items-center justify-center">
                                      <ClipboardList className="h-6 w-6 text-primary-600" />
                                    </div>
                                  </div>
                                  <div className="ml-4 flex-1">
                                    <div className="flex items-center space-x-3">
                                      <h3 className="text-base font-semibold text-gray-900">{project.name}</h3>
                                      {project.isAutomated && (
                                        <div className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                                          <Bot className="w-3 h-3 mr-1" />
                                          AI Generated
                                        </div>
                                      )}
                                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(project.status)}`}>
                                        {project.status.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                                      </span>
                                    </div>
                                    <p className="text-sm text-gray-600 mt-1 line-clamp-1">
                                      {project.description}
                                    </p>
                                    <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                                      <div className="flex items-center">
                                        <Calendar className="w-3 h-3 mr-1" />
                                        {formatDeadline(project.deadline)}
                                      </div>
                                      <div className="flex items-center">
                                        <Users className="w-3 h-3 mr-1" />
                                        {project.createdBy?.firstName} {project.createdBy?.lastName}
                                      </div>
                                      <div className="flex items-center">
                                        <CheckSquare className="w-3 h-3 mr-1" />
                                        {projectTasks.length} task{projectTasks.length !== 1 ? 's' : ''}
                                      </div>
                                    </div>
                                  </div>
                                </div>

                                <div className="flex items-center space-x-4 ml-4">
                                  {/* Progress Bar */}
                                  <div className="w-32">
                                    <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
                                      <span>Progress</span>
                                      <span className="font-medium">{project.progress}%</span>
                                    </div>
                                    <div className="w-full bg-gray-200 rounded-full h-2">
                                      <div
                                        className="bg-primary-600 h-2 rounded-full transition-all"
                                        style={{ width: `${project.progress}%` }}
                                      ></div>
                                    </div>
                                  </div>

                                  {/* View Bunches Button */}
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setViewingBunchesForProject(project._id);
                                      setShowProjectDetailsModal(true);
                                    }}
                                    className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                                    title="View Task Clusters"
                                  >
                                    <Target className="h-5 w-5" />
                                  </button>

                                  {/* Add Task Button */}
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setSelectedProject(project);
                                      setNewTask({
                                        ...newTask,
                                        projectId: project._id
                                      });
                                      setShowCreateTaskModal(true);
                                    }}
                                    className="p-2 text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                                    title="Create Task"
                                  >
                                    <Plus className="h-5 w-5" />
                                  </button>

                                  {/* Expand Icon */}
                                  {isExpanded ? (
                                    <ChevronUp className="h-5 w-5 text-gray-400" />
                                  ) : (
                                    <ChevronDown className="h-5 w-5 text-gray-400" />
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* Project Tasks - Shown when expanded */}
                            {isExpanded && (
                              <div className="bg-gray-50 border-t border-gray-200 px-5 py-4">
                                {projectTasks.length === 0 ? (
                                  <div className="text-center py-8">
                                    <CheckSquare className="h-10 w-10 mx-auto mb-2 text-gray-300" />
                                    <p className="text-sm text-gray-500">No tasks in this project yet</p>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setSelectedProject(project);
                                        setNewTask({
                                          ...newTask,
                                          projectId: project._id
                                        });
                                        setShowCreateTaskModal(true);
                                      }}
                                      className="mt-3 text-sm text-primary-600 hover:text-primary-700 font-medium"
                                    >
                                      + Create First Task
                                    </button>
                                  </div>
                                ) : (
                                  <div className="space-y-3">
                                    {getSortedTasks(projectTasks).map((task) => (
                                      <div key={task._id} className={`bg-white border rounded-lg ${isCofounderTask(task) ? 'border-purple-400 border-2 shadow-sm' : 'border-gray-200'}`}>
                                        <div
                                          className={`flex items-center justify-between p-4 cursor-pointer ${isCofounderTask(task) ? 'hover:bg-purple-50' : 'hover:bg-gray-50'}`}
                                          onClick={() => toggleTaskExpand(task._id)}
                                        >
                                          <div className="flex items-center flex-1">
                                            <div className={`h-10 w-10 rounded-full ${getStatusColor(task.status)} flex items-center justify-center`}>
                                              {isCofounderTask(task) ? <Zap className="h-5 w-5" /> : <CheckSquare className="h-5 w-5" />}
                                            </div>
                                            <div className="ml-4 flex-1">
                                              <div className="flex items-center gap-2">
                                                <span className="text-sm font-medium text-gray-900">{task.title}</span>
                                                {isCofounderTask(task) && (
                                                  <span className="px-2 py-0.5 text-xs font-semibold bg-purple-100 text-purple-700 rounded-full flex items-center gap-1">
                                                    <Bot className="h-3 w-3" />
                                                    Executive Priority
                                                  </span>
                                                )}
                                              </div>
                                              <div className="text-xs text-gray-500 mt-1">
                                                Deadline: {formatDeadline(task.deadline)} • {task.points} points
                                              </div>
                                            </div>
                                          </div>
                                          <div className="flex items-center space-x-3">
                                            <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getPriorityColor(task.priority)}`}>
                                              {task.priority?.charAt(0).toUpperCase() + task.priority?.slice(1)}
                                            </span>
                                            <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(task.status)}`}>
                                              {task.status?.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                                            </span>
                                            <div className="flex items-center">
                                              <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 text-sm">
                                                {task.assignedTo?.firstName?.[0]}{task.assignedTo?.lastName?.[0]}
                                              </div>
                                              <div className="ml-2 text-sm text-gray-600 hidden md:block">
                                                {task.assignedTo?.firstName} {task.assignedTo?.lastName}
                                              </div>
                                            </div>
                                            {expandedTaskId === task._id ? <ChevronUp className="h-5 w-5 text-gray-500" /> : <ChevronDown className="h-5 w-5 text-gray-500" />}
                                          </div>
                                        </div>

                                        {/* Task Details - Expanded */}
                                        {expandedTaskId === task._id && (
                                          <div className="p-4 border-t border-gray-200 bg-gray-50">
                                            <div className="mb-4">
                                              <h4 className="text-sm font-medium text-gray-900 mb-2">Description</h4>
                                              <p className="text-sm text-gray-600">{task.description}</p>
                                            </div>
                                            <div className="flex justify-end space-x-2">
                                              <button
                                                onClick={(e) => {
                                                  e.stopPropagation();
                                                  setSelectedTask(task);
                                                  setShowDeleteTaskModal(true);
                                                }}
                                                className="px-3 py-1 bg-red-100 text-red-600 rounded-md hover:bg-red-200 text-xs flex items-center"
                                              >
                                                <Trash2 className="h-3 w-3 mr-1" />
                                                Delete
                                              </button>
                                              <button
                                                onClick={(e) => {
                                                  e.stopPropagation();
                                                  navigate(`/task/${task._id}`);
                                                }}
                                                className="px-3 py-1 bg-blue-100 text-blue-600 rounded-md hover:bg-blue-200 text-xs flex items-center"
                                              >
                                                <Eye className="h-3 w-3 mr-1" />
                                                View Details
                                              </button>
                                            </div>
                                          </div>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Task Review Modal */}
          {showTaskReviewModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={() => setShowTaskReviewModal(false)}>
              <div className="bg-white rounded-lg shadow-xl max-w-5xl w-full max-h-[85vh] overflow-hidden" onClick={(e) => e.stopPropagation()}>
                <div className="flex justify-between items-center p-6 border-b border-gray-200">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">Tasks Pending Review</h2>
                    <p className="text-sm text-gray-600 mt-1">Review and approve submitted tasks</p>
                  </div>
                  <button
                    onClick={() => setShowTaskReviewModal(false)}
                    className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                  >
                    <X className="h-6 w-6 text-gray-500" />
                  </button>
                </div>
                <div className="p-6 overflow-y-auto" style={{ maxHeight: 'calc(85vh - 100px)' }}>
                  <div className="space-y-3">
                    {reviewTasks.map((task) => (
                      <div key={task._id} className="border border-yellow-200 bg-yellow-50 rounded-lg p-4 hover:bg-yellow-100 transition-colors">
                        <div className="flex flex-col">
                          <div className="flex items-center space-x-3 mb-3">
                            <div className="h-10 w-10 rounded-full bg-yellow-500 flex items-center justify-center flex-shrink-0">
                              <Eye className="h-5 w-5 text-white" />
                            </div>
                            <div className="flex-1">
                              <h3 className="text-sm font-medium text-gray-900">{task.title}</h3>
                              <p className="text-xs text-gray-600">
                                Project: {task.project?.name} • Submitted by: {task.assignedTo?.firstName} {task.assignedTo?.lastName}
                              </p>
                              <p className="text-xs text-gray-500">
                                Deadline: {formatDeadline(task.deadline)} • Points: {task.points}
                              </p>
                            </div>
                          </div>

                          {/* Evidence Display */}
                          {task.evidence && (
                            <div className="mt-3 pt-3 border-t border-yellow-200 space-y-2">
                              <p className="text-xs font-semibold text-gray-700">📋 Evidence:</p>
                              {task.evidence.description && (
                                <div className="bg-white p-2 rounded">
                                  <p className="text-xs font-medium text-gray-600">Description:</p>
                                  <p className="text-sm text-gray-800">{task.evidence.description}</p>
                                </div>
                              )}
                              {task.evidence.files && task.evidence.files.length > 0 && (
                                <div>
                                  <p className="text-xs font-medium text-gray-600 mb-1">Files ({task.evidence.files.length}):</p>
                                  <div className="space-y-1">
                                    {task.evidence.files.map((file, idx) => (
                                      <a key={idx} href={`http://localhost:5000/${file.path}`} target="_blank" rel="noopener noreferrer"
                                        className="block text-xs text-blue-600 hover:underline bg-white px-2 py-1 rounded">
                                        📎 {file.originalName || file.filename}
                                      </a>
                                    ))}
                                  </div>
                                </div>
                              )}
                              {task.evidence.urls && task.evidence.urls.length > 0 && (
                                <div>
                                  <p className="text-xs font-medium text-gray-600 mb-1">Links:</p>
                                  <div className="space-y-1">
                                    {task.evidence.urls.map((url, idx) => (
                                      <a key={idx} href={url} target="_blank" rel="noopener noreferrer"
                                        className="block text-xs text-blue-600 hover:underline break-all bg-white px-2 py-1 rounded">
                                        🔗 {url}
                                      </a>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          )}

                          <div className="flex items-center space-x-2 mt-3">
                            {task.revisionCount > 0 && (
                              <span className="px-2 py-1 bg-orange-100 text-orange-800 text-xs rounded-full">
                                {task.revisionCount} revision{task.revisionCount !== 1 ? 's' : ''}
                              </span>
                            )}
                            <button
                              onClick={() => navigate(`/task/${task._id}`)}
                              className="px-3 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 text-sm flex items-center"
                            >
                              <Eye className="h-4 w-4 mr-2" />
                              Review Task
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Task Allocation Modal */}
          {showTaskAllocationModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={() => setShowTaskAllocationModal(false)}>
              <div className="bg-white rounded-lg shadow-xl max-w-5xl w-full max-h-[90vh] overflow-hidden" onClick={(e) => e.stopPropagation()}>
                <div className="flex justify-between items-center p-6 border-b border-gray-200">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">AI Generated Tasks</h2>
                    <p className="text-sm text-gray-600 mt-1">Assign these tasks to team members</p>
                  </div>
                  <button
                    onClick={() => setShowTaskAllocationModal(false)}
                    className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                  >
                    <X className="h-6 w-6 text-gray-500" />
                  </button>
                </div>
                <div className="p-6 overflow-y-auto" style={{ maxHeight: 'calc(90vh - 100px)' }}>
                  <div className="space-y-4">
                    {unassignedTasks.map((task) => (
                      <div key={task._id} className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-2">
                              <h3 className="text-sm font-medium text-gray-900">{task.title}</h3>
                              <div className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                                <Zap className="w-3 h-3 mr-1" />
                                AI Generated
                              </div>
                            </div>
                            <p className="text-sm text-gray-600 mb-3">{task.description}</p>
                            <div className="flex items-center space-x-4 text-xs text-gray-500">
                              <div className="flex items-center">
                                <Calendar className="w-3 h-3 mr-1" />
                                {formatDate(task.deadline)}
                              </div>
                              <div className="flex items-center">
                                <Target className="w-3 h-3 mr-1" />
                                {task.points} points
                              </div>
                              <div className="flex items-center">
                                <Clock className="w-3 h-3 mr-1" />
                                {task.priority} priority
                              </div>
                            </div>
                          </div>
                          <div className="ml-4">
                            <button
                              onClick={() => {
                                setSelectedTask(task);
                                setNewTask({
                                  ...newTask,
                                  title: task.title,
                                  description: task.description,
                                  projectId: task.project,
                                  deadline: task.deadline,
                                  points: task.points,
                                  priority: task.priority
                                });
                                setShowCreateTaskModal(true);
                              }}
                              className="inline-flex items-center px-3 py-2 bg-purple-600 text-white text-sm font-medium rounded-lg hover:bg-purple-700 transition-colors"
                            >
                              <UserPlus className="w-4 h-4 mr-2" />
                              Assign to Team Member
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Task Bunches Modal */}
          {showTaskBunchesModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={() => setShowTaskBunchesModal(false)}>
              <div className="bg-white rounded-lg shadow-xl max-w-5xl w-full max-h-[85vh] overflow-hidden" onClick={(e) => e.stopPropagation()}>
                <div className="flex justify-between items-center p-6 border-b border-gray-200">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">Task Bunches</h2>
                    <p className="text-sm text-gray-600 mt-1">AI-generated task bunches - assign entire bunches to team members</p>
                  </div>
                  <div className="flex items-center space-x-3">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowExecutiveTasksModal(true);
                      }}
                      className="px-4 py-2 bg-gradient-to-b from-zinc-900 to-black text-white rounded-md hover:from-zinc-800 hover:to-zinc-900 flex items-center text-sm border border-white/10 shadow-lg"
                    >
                      <Target className="h-4 w-4 mr-2" />
                      Your Task
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowCreateTaskModal(true);
                      }}
                      className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 flex items-center text-sm"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Create Task
                    </button>
                    <button
                      onClick={() => setShowTaskBunchesModal(false)}
                      className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                    >
                      <X className="h-6 w-6 text-gray-500" />
                    </button>
                  </div>
                </div>
                <div className="p-6 overflow-y-auto" style={{ maxHeight: 'calc(85vh - 100px)' }}>
                  <BunchList />
                </div>
              </div>
            </div>
          )}

          {/* Project Details Modal - Global */}
          {showProjectDetailsModal && (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4" onClick={() => setShowProjectDetailsModal(false)}>
              <div className="bg-background rounded-2xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden border border-border" onClick={(e) => e.stopPropagation()}>
                <div className="flex justify-between items-center p-6 border-b border-border">
                  <div>
                    <h2 className="text-2xl font-bold text-foreground">Project Task Bunches</h2>
                    <p className="text-sm text-muted-foreground mt-1">Detailed view of microtasks and delegation</p>
                  </div>
                  <button
                    onClick={() => setShowProjectDetailsModal(false)}
                    className="p-2 hover:bg-muted rounded-full transition-colors"
                  >
                    <X className="h-6 w-6 text-muted-foreground" />
                  </button>
                </div>
                <div className="p-6 overflow-y-auto" style={{ maxHeight: 'calc(90vh - 100px)' }}>
                  <BunchManagement projectId={viewingBunchesForProject} />
                </div>
              </div>
            </div>
          )}

          {/* General Tasks Section - Tasks not assigned to any project */}
          {
            getGeneralTasks().length > 0 && (
              <div className="dashboard-card">
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">General Tasks (No Project)</h2>
                    <p className="text-sm text-gray-600 mt-1">Tasks not assigned to any specific project</p>
                  </div>
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
                ) : (
                  <div>
                    {getSortedTasks(getGeneralTasks()).map((task) => (
                      <div key={task._id} className={`mb-4 border rounded-lg ${isCofounderTask(task) ? 'border-purple-400 border-2 bg-purple-50/30 shadow-sm' : 'border-gray-200'}`}>
                        <div
                          className={`flex items-center justify-between p-4 cursor-pointer ${isCofounderTask(task) ? 'hover:bg-purple-50' : 'hover:bg-gray-50'}`}
                          onClick={() => toggleTaskExpand(task._id)}
                        >
                          <div className="flex items-center">
                            <div className={`h-10 w-10 rounded-full ${getStatusColor(task.status)} flex items-center justify-center`}>
                              {isCofounderTask(task) ? <Zap className="h-5 w-5" /> : <CheckSquare className="h-5 w-5" />}
                            </div>
                            <div className="ml-4">
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-medium text-gray-900">{task.title}</span>
                                {isCofounderTask(task) && (
                                  <span className="px-2 py-0.5 text-xs font-semibold bg-purple-100 text-purple-700 rounded-full flex items-center gap-1">
                                    <Bot className="h-3 w-3" />
                                    Executive Priority
                                  </span>
                                )}
                              </div>
                              <div className="text-xs text-gray-500">
                                {task.project?.name ? `Project: ${task.project.name} • ` : ''}Deadline: {formatDeadline(task.deadline)}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center">
                            <span className={`px-2 mr-4 inline-flex text-xs leading-5 font-semibold rounded-full ${getPriorityColor(task.priority)}`}>
                              {task.priority?.charAt(0).toUpperCase() + task.priority?.slice(1)}
                            </span>
                            <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-600">
                              {task.assignedTo?.firstName?.[0]}{task.assignedTo?.lastName?.[0]}
                            </div>
                            <div className="ml-2 mr-4 text-sm text-gray-600">
                              {task.assignedTo?.firstName} {task.assignedTo?.lastName}
                            </div>
                            {expandedTaskId === task._id ? <ChevronUp className="h-5 w-5 text-gray-500" /> : <ChevronDown className="h-5 w-5 text-gray-500" />}
                          </div>
                        </div>

                        {expandedTaskId === task._id && (
                          <div className="p-4 border-t border-gray-200 bg-gray-50">
                            <div className="mb-4">
                              <h4 className="text-sm font-medium text-gray-900 mb-2">Description</h4>
                              <p className="text-sm text-gray-600">{task.description}</p>
                            </div>

                            <div className="mb-4">
                              <div className="flex items-center justify-between mb-2">
                                <h4 className="text-sm font-medium text-gray-900">Checkpoints</h4>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setNewCheckpoint({
                                      ...newCheckpoint,
                                      taskId: task._id
                                    });
                                    setShowCreateCheckpointModal(true);
                                  }}
                                  className="px-2 py-1 bg-gray-100 text-gray-600 rounded-md hover:bg-gray-200 text-xs flex items-center"
                                >
                                  <Plus className="h-3 w-3 mr-1" />
                                  Add Checkpoint
                                </button>
                              </div>

                              {task.checkpoints && task.checkpoints.length > 0 ? (
                                <ul className="space-y-2">
                                  {task.checkpoints.map((checkpoint) => (
                                    <li key={checkpoint._id} className="flex items-center">
                                      <div className={`h-4 w-4 mr-2 rounded-full ${checkpoint.isCompleted ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                                      <span className="text-sm text-gray-700">{checkpoint.title}</span>
                                      {checkpoint.isCompleted && (
                                        <span className="ml-2 text-xs text-green-600">Completed</span>
                                      )}
                                    </li>
                                  ))}
                                </ul>
                              ) : (
                                <p className="text-sm text-gray-500">No checkpoints added yet</p>
                              )}
                            </div>

                            <div className="flex justify-end space-x-2">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedTask(task);
                                  setShowDeleteTaskModal(true);
                                }}
                                className="px-3 py-1 bg-red-100 text-red-600 rounded-md hover:bg-red-200 text-xs flex items-center"
                              >
                                <Trash2 className="h-3 w-3 mr-1" />
                                Delete Task
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  navigate(`/task/${task._id}`);
                                }}
                                className="px-3 py-1 bg-blue-100 text-blue-600 rounded-md hover:bg-blue-200 text-xs flex items-center"
                              >
                                <Edit className="h-3 w-3 mr-1" />
                                View Details
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )
          }
        </div >

        {/* Create Task Modal */}
        {
          showCreateTaskModal && (
            <div className="fixed inset-0 z-50 overflow-y-auto">
              <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                <div className="fixed inset-0 transition-opacity" aria-hidden="true">
                  <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
                </div>

                <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

                <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
                  <form onSubmit={handleCreateTask}>
                    <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                      <h3 className="text-lg font-medium text-gray-900 mb-4">Create New Task</h3>

                      <div className="mb-4">
                        <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                          Task Title
                        </label>
                        <input
                          type="text"
                          id="title"
                          name="title"
                          required
                          value={newTask.title}
                          onChange={(e) => {
                            handleTaskInputChange(e);
                            // Feature 1: Predict phase as user types (disabled - requires AI service)
                            // if (e.target.value && newTask.description) {
                            //   predictPhase(e.target.value, newTask.description);
                            // }
                          }}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 text-gray-900"
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
                          value={newTask.description}
                          onChange={(e) => {
                            handleTaskInputChange(e);
                            // Feature 1: Predict phase (disabled - requires AI service)
                            // if (newTask.title && e.target.value) {
                            //   predictPhase(newTask.title, e.target.value);
                            // }
                            // Preview AI scoring after typing (disabled - requires AI service)
                            // previewAiComplexity(newTask.title, e.target.value, newTask.priority, newTask.taskBunch);
                          }}
                          rows={4}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 text-gray-900"
                        />
                      </div>

                      {/* Feature 3: Deadline Feasibility Warning */}
                      {deadlineWarning && !deadlineWarning.feasible && (
                        <div className="mb-4 p-3 bg-red-50 border-2 border-red-300 rounded-lg animate-pulse">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-2xl">⚠️</span>
                            <h4 className="font-bold text-red-900">Unrealistic Deadline Detected!</h4>
                          </div>
                          <p className="text-sm text-red-800 mb-2">
                            This task needs ~<strong>{deadlineWarning.estimated_hours}h</strong> but only{' '}
                            <strong>{deadlineWarning.available_hours}h</strong> available
                          </p>
                          <p className="text-sm font-semibold text-red-900 bg-red-100 p-2 rounded">
                            💡 {deadlineWarning.recommendation}
                          </p>
                        </div>
                      )}

                      {/* Feature 2: Task Breakdown Suggestions */}
                      {taskBreakdownSuggestions && taskBreakdownSuggestions.should_break && (
                        <div className="mb-4 p-4 bg-yellow-50 border-2 border-yellow-300 rounded-lg">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-2xl">✂️</span>
                            <h4 className="font-bold text-yellow-900">Large Task Detected - Consider Splitting</h4>
                          </div>
                          <p className="text-sm text-yellow-800 mb-3">{taskBreakdownSuggestions.reason}</p>

                          <div className="space-y-2 mb-3">
                            {taskBreakdownSuggestions.suggestions.map((subtask, i) => (
                              <div key={i} className="bg-white p-3 rounded-lg border border-yellow-200 hover:border-yellow-400 transition-colors">
                                <div className="flex justify-between items-start mb-1">
                                  <span className="font-medium text-sm text-gray-900">{subtask.title}</span>
                                  <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full font-semibold">
                                    {subtask.estimated_points} pts
                                  </span>
                                </div>
                                <p className="text-xs text-gray-600">{subtask.description}</p>
                              </div>
                            ))}
                          </div>

                          <div className="flex gap-2">
                            <button
                              type="button"
                              className="flex-1 text-sm bg-yellow-500 text-white px-4 py-2 rounded-lg hover:bg-yellow-600 font-medium"
                              onClick={() => alert('Copy these subtasks and create them separately!')}
                            >
                              📋 Copy Breakdown
                            </button>
                            <button
                              type="button"
                              className="text-sm text-yellow-700 px-4 py-2 rounded-lg hover:bg-yellow-100"
                              onClick={() => setTaskBreakdownSuggestions(null)}
                            >
                              Dismiss
                            </button>
                          </div>
                        </div>
                      )}

                      {/* AI Complexity Preview */}
                      {aiComplexityPreview && (
                        <div className="mb-4 p-4 bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 rounded-xl border-2 border-indigo-200 shadow-sm">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                              <span className="text-2xl">🤖</span>
                              <h4 className="text-sm font-bold text-indigo-900">AI Complexity Analysis</h4>
                            </div>
                            {/* Feature 4: Clickable Confidence Badge */}
                            <button
                              type="button"
                              onClick={() => setShowConfidenceBreakdown(!showConfidenceBreakdown)}
                              className="text-xs px-3 py-1.5 bg-green-100 text-green-700 rounded-full font-medium hover:bg-green-200 transition-colors cursor-pointer flex items-center gap-1"
                            >
                              {Math.round(aiComplexityPreview.confidence * 100)}% confidence
                              <span className="text-xs">{showConfidenceBreakdown ? '▼' : '▶'}</span>
                            </button>
                          </div>

                          {/* Feature 4: Confidence Breakdown (expandable) */}
                          {showConfidenceBreakdown && aiComplexityPreview.metadata?.confidence_breakdown && (
                            <div className="mb-3 p-3 bg-white rounded-lg border-2 border-green-200">
                              <p className="text-xs font-semibold text-gray-700 mb-2">📊 Why this confidence level?</p>
                              <div className="space-y-2">
                                {aiComplexityPreview.metadata.confidence_breakdown.factors.map((factor, i) => (
                                  <div key={i} className="flex items-start gap-2 p-2 bg-gray-50 rounded">
                                    <span className="text-base">{factor.positive ? '✅' : '⚠️'}</span>
                                    <div className="flex-1">
                                      <p className="text-xs font-medium text-gray-800">{factor.factor}</p>
                                      <p className="text-xs text-gray-600">{factor.detail}</p>
                                    </div>
                                    <span className={`text-xs font-bold ${factor.positive ? 'text-green-600' : 'text-red-600'}`}>
                                      {factor.impact}
                                    </span>
                                  </div>
                                ))}
                              </div>
                              <p className="text-xs text-gray-500 mt-2 italic">{aiComplexityPreview.metadata.confidence_breakdown.summary}</p>
                            </div>
                          )}

                          <div className="grid grid-cols-2 gap-3 mb-3">
                            <div className="bg-white p-3 rounded-lg shadow-sm border border-indigo-100">
                              <p className="text-xs text-gray-500 mb-1">Suggested Points</p>
                              <div className="flex items-baseline gap-1">
                                <p className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">{aiComplexityPreview.points}</p>
                                <p className="text-xs text-gray-500">pts</p>
                              </div>
                            </div>
                            <div className="bg-white p-3 rounded-lg shadow-sm border border-indigo-100">
                              <p className="text-xs text-gray-500 mb-1">Complexity</p>
                              <div className="flex items-baseline gap-1">
                                <p className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">{Math.round(aiComplexityPreview.score)}</p>
                                <p className="text-xs text-gray-500">/100</p>
                              </div>
                            </div>
                          </div>

                          <div className="bg-white p-3 rounded-lg shadow-sm border border-indigo-100 mb-2">
                            <p className="text-xs font-semibold text-gray-700 mb-2">Dimension Breakdown</p>
                            <div className="space-y-2">
                              {/* Feature 5: Interactive Dimension Tooltips */}
                              {Object.entries(aiComplexityPreview.dimensions || {}).map(([dim, val]) => (
                                <div key={dim}>
                                  <div
                                    className="flex justify-between items-center mb-1 cursor-pointer hover:bg-indigo-50 p-1 rounded transition-colors"
                                    onClick={() => setSelectedDimension(selectedDimension === dim ? null : dim)}
                                  >
                                    <p className="text-xs text-gray-600 capitalize flex items-center gap-1">
                                      {dim.replace(/_/g, ' ')}
                                      {selectedDimension === dim && <span className="text-indigo-600">ℹ️</span>}
                                    </p>
                                    <p className="text-xs font-semibold text-indigo-600">{val.toFixed(1)}/10</p>
                                  </div>
                                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                                    <div
                                      className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all duration-300"
                                      style={{ width: `${(val / 10) * 100}%` }}
                                    />
                                  </div>
                                  {/* Feature 5: Dimension Explanation Tooltip */}
                                  {selectedDimension === dim && aiComplexityPreview.metadata?.dimension_explanations?.[dim] && (
                                    <div className="mt-1 p-2 bg-indigo-50 border border-indigo-200 rounded text-xs">
                                      <p className="text-indigo-900 font-medium">
                                        💡 {aiComplexityPreview.metadata.dimension_explanations[dim].reasoning}
                                      </p>
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>

                          <div className="bg-white p-3 rounded-lg shadow-sm border border-indigo-100">
                            <p className="text-xs text-gray-700 leading-relaxed">{aiComplexityPreview.explanation}</p>
                          </div>
                        </div>
                      )}
                      {aiPreviewLoading && (
                        <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200 flex items-center gap-2">
                          <div className="animate-spin h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full"></div>
                          <p className="text-sm text-blue-700">Analyzing task complexity...</p>
                        </div>
                      )}

                      <div className="mb-4">
                        <label htmlFor="projectId" className="block text-sm font-medium text-gray-700 mb-1">
                          Project
                        </label>
                        <select
                          id="projectId"
                          name="projectId"
                          required
                          value={newTask.projectId}
                          onChange={handleTaskInputChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 text-gray-900"
                        >
                          <option value="">-- Select a Project --</option>
                          {projects
                            .filter(project =>
                              project.status !== 'completed' &&
                              project.status !== 'cancelled' &&
                              project.status !== 'on-hold'
                            )
                            .map((project) => (
                              <option key={project._id} value={project._id}>
                                {project.name}
                              </option>
                            ))}
                        </select>
                        {projects.length === 0 && (
                          <p className="mt-2 text-sm text-red-600">
                            ⚠️ No projects available. Create a new project first.
                          </p>
                        )}
                        {projects.length > 0 && projects.filter(p => p.status !== 'completed' && p.status !== 'cancelled' && p.status !== 'on-hold').length === 0 && (
                          <p className="mt-2 text-sm text-yellow-600">
                            ⚠️ All projects are completed, cancelled, or on-hold. Create a new active project to add tasks.
                          </p>
                        )}
                      </div>

                      <div className="mb-4">
                        <label htmlFor="assignedToId" className="block text-sm font-medium text-gray-700 mb-1">
                          Assign To
                        </label>
                        <select
                          id="assignedToId"
                          name="assignedToId"
                          required
                          value={newTask.assignedToId}
                          onChange={handleTaskInputChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 text-gray-900"
                        >
                          <option value="">-- Select Team Member --</option>
                          {individuals
                            .sort((a, b) => `${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`))
                            .map((individual) => (
                              <option key={individual._id} value={individual._id}>
                                {individual.firstName} {individual.lastName} ({individual.employeeId})
                                {individual.specializations && individual.specializations.length > 0
                                  ? ` - ${individual.specializations.join(', ')}`
                                  : individual.skills && individual.skills.length > 0
                                    ? ` - ${individual.skills.slice(0, 2).join(', ')}`
                                    : ''
                                }
                              </option>
                            ))}
                        </select>
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
                          value={newTask.deadline}
                          onChange={handleTaskInputChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 text-gray-900"
                        />
                      </div>

                      <div className="mb-4">
                        <label htmlFor="points" className="block text-sm font-medium text-gray-700 mb-1">
                          Points
                          {aiComplexityPreview && (
                            <span className="ml-2 text-xs text-blue-600">
                              (AI suggests: {aiComplexityPreview.points} pts)
                            </span>
                          )}
                        </label>
                        <div className="flex gap-2">
                          <input
                            type="number"
                            id="points"
                            name="points"
                            min="1"
                            required
                            value={newTask.points}
                            onChange={handleTaskInputChange}
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 text-gray-900"
                          />
                          {aiComplexityPreview && (
                            <button
                              type="button"
                              onClick={() => {
                                handleTaskInputChange({
                                  target: { name: 'points', value: aiComplexityPreview.points }
                                });
                              }}
                              className="px-3 py-2 bg-blue-50 text-blue-600 border border-blue-300 rounded-md hover:bg-blue-100 text-xs font-medium whitespace-nowrap"
                            >
                              Use AI
                            </button>
                          )}
                        </div>
                      </div>

                      <div className="mb-4">
                        <label htmlFor="priority" className="block text-sm font-medium text-gray-700 mb-1">
                          Priority
                        </label>
                        <select
                          id="priority"
                          name="priority"
                          required
                          value={newTask.priority}
                          onChange={handleTaskInputChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 text-gray-900"
                        >
                          <option value="low">Low</option>
                          <option value="medium">Medium</option>
                          <option value="high">High</option>
                          <option value="urgent">Urgent</option>
                        </select>
                      </div>
                    </div>

                    <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                      <button
                        type="submit"
                        className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-primary-600 text-base font-medium text-white hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 sm:ml-3 sm:w-auto sm:text-sm"
                      >
                        Create Task
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowCreateTaskModal(false)}
                        className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:w-auto sm:text-sm"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          )
        }

        {/* Create Checkpoint Modal */}
        {
          showCreateCheckpointModal && (
            <div className="fixed inset-0 z-50 overflow-y-auto">
              <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                <div className="fixed inset-0 transition-opacity" aria-hidden="true">
                  <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
                </div>

                <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

                <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
                  <form onSubmit={handleCreateCheckpoint}>
                    <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                      <h3 className="text-lg font-medium text-gray-900 mb-4">Create New Checkpoint</h3>

                      <div className="mb-4">
                        <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                          Checkpoint Title
                        </label>
                        <input
                          type="text"
                          id="title"
                          name="title"
                          required
                          value={newCheckpoint.title}
                          onChange={handleCheckpointInputChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                        />
                      </div>

                      <div className="mb-4">
                        <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                          Description (Optional)
                        </label>
                        <textarea
                          id="description"
                          name="description"
                          value={newCheckpoint.description}
                          onChange={handleCheckpointInputChange}
                          rows={3}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                        />
                      </div>

                      <input type="hidden" name="taskId" value={newCheckpoint.taskId} />
                    </div>

                    <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                      <button
                        type="submit"
                        className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-primary-600 text-base font-medium text-white hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 sm:ml-3 sm:w-auto sm:text-sm"
                      >
                        Create Checkpoint
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowCreateCheckpointModal(false)}
                        className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:w-auto sm:text-sm"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          )
        }

        {/* Delete Task Modal */}
        {
          showDeleteTaskModal && selectedTask && (
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
                        <h3 className="text-lg font-medium text-gray-900 mb-2">Delete Task</h3>
                        <p className="text-gray-500">
                          Are you sure you want to delete <span className="font-medium">{selectedTask.title}</span>? All checkpoints and progress will be permanently removed. This action cannot be undone.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                    <button
                      type="button"
                      onClick={handleDeleteTask}
                      className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:ml-3 sm:w-auto sm:text-sm"
                    >
                      Delete
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowDeleteTaskModal(false);
                        setSelectedTask(null);
                      }}
                      className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:w-auto sm:text-sm"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )
        }

        {/* Create Project Modal - Modern Design */}
        {
          showCreateProjectModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
              <div className="bg-card rounded-xl shadow-2xl border border-border w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
                {/* Modal Header */}
                <div className="flex justify-between items-center p-6 border-b border-border sticky top-0 bg-card z-10">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <Bot className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-foreground">Create New Project</h3>
                      <p className="text-xs text-muted-foreground">AI-powered task generation enabled</p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setShowCreateProjectModal(false);
                      setNewProject({ name: '', description: '', deadline: '', documentation: '' });
                      setSrsFile(null);
                      setSrsFileName('');
                    }}
                    className="text-muted-foreground hover:text-foreground transition-colors p-1 hover:bg-muted rounded-lg"
                  >
                    <X size={20} />
                  </button>
                </div>

                {/* Modal Body */}
                <form onSubmit={handleCreateProject}>
                  <div className="p-6 space-y-5">
                    {/* AI Info Banner */}
                    <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border border-primary/20 rounded-lg p-4">
                      <div className="flex items-start gap-3">
                        <Sparkles className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                        <div className="text-sm">
                          <p className="font-medium text-foreground mb-1">AI Automation Active</p>
                          <p className="text-muted-foreground text-xs">
                            Tasks will be intelligently generated and organized into bunches (Frontend, Backend, AI, Testing) for parallel team execution.
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Project Name */}
                    <div>
                      <label htmlFor="project-name" className="block text-sm font-medium text-foreground mb-2">
                        Project Name <span className="text-destructive">*</span>
                      </label>
                      <input
                        type="text"
                        id="project-name"
                        name="name"
                        required
                        value={newProject.name}
                        onChange={handleProjectInputChange}
                        className="input-modern w-full"
                        placeholder="e.g., E-commerce Platform Redesign"
                      />
                    </div>

                    {/* Description */}
                    <div>
                      <label htmlFor="project-description" className="block text-sm font-medium text-foreground mb-2">
                        Project Description <span className="text-destructive">*</span>
                      </label>
                      <textarea
                        id="project-description"
                        name="description"
                        required
                        value={newProject.description}
                        onChange={handleProjectInputChange}
                        rows={4}
                        className="input-modern w-full resize-none"
                        placeholder="Describe your project in detail. The AI will use this to generate relevant tasks..."
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Tip: Include tech stack, key features, and requirements for better AI task generation
                      </p>
                    </div>

                    {/* Deadline */}
                    <div>
                      <label htmlFor="project-deadline" className="block text-sm font-medium text-foreground mb-2">
                        Project Deadline <span className="text-destructive">*</span>
                      </label>
                      <input
                        type="date"
                        id="project-deadline"
                        name="deadline"
                        required
                        value={newProject.deadline}
                        onChange={handleProjectInputChange}
                        className="input-modern w-full"
                      />
                    </div>

                    {/* SRS Upload */}
                    <div>
                      <label htmlFor="srsDocument" className="block text-sm font-medium text-foreground mb-2">
                        Upload SRS Document (Optional)
                      </label>
                      <div className="border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-primary/50 transition-all bg-muted/30 hover:bg-muted/50">
                        <input
                          type="file"
                          id="srsDocument"
                          name="srsDocument"
                          accept=".pdf"
                          onChange={handleSrsFileChange}
                          className="hidden"
                        />
                        <label htmlFor="srsDocument" className="cursor-pointer block">
                          <div className="flex flex-col items-center">
                            {srsFileName ? (
                              <>
                                <div className="p-3 rounded-full bg-primary/10 mb-3">
                                  <FileText className="w-8 h-8 text-primary" />
                                </div>
                                <p className="text-sm font-medium text-foreground mb-1">{srsFileName}</p>
                                <p className="text-xs text-muted-foreground">Click to change file</p>
                              </>
                            ) : (
                              <>
                                <div className="p-3 rounded-full bg-muted mb-3">
                                  <svg
                                    className="w-8 h-8 text-muted-foreground"
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
                                </div>
                                <p className="text-sm font-medium text-foreground mb-1">
                                  <span className="text-primary">Click to upload</span> or drag and drop
                                </p>
                                <p className="text-xs text-muted-foreground">PDF files only (max 10MB)</p>
                              </>
                            )}
                          </div>
                        </label>
                      </div>
                    </div>

                    {/* Additional Documentation */}
                    <div>
                      <label htmlFor="project-documentation" className="block text-sm font-medium text-foreground mb-2">
                        Additional Documentation (Optional)
                      </label>
                      <textarea
                        id="project-documentation"
                        name="documentation"
                        value={newProject.documentation}
                        onChange={handleProjectInputChange}
                        rows={3}
                        className="input-modern w-full resize-none"
                        placeholder="Add links to design files, requirements docs, or any other relevant resources..."
                      />
                    </div>
                  </div>

                  {/* Modal Footer */}
                  <div className="flex justify-end gap-3 p-6 border-t border-border bg-muted/30">
                    <button
                      type="button"
                      onClick={() => {
                        setShowCreateProjectModal(false);
                        setNewProject({ name: '', description: '', deadline: '', documentation: '' });
                        setSrsFile(null);
                        setSrsFileName('');
                      }}
                      className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground bg-transparent border border-border rounded-lg hover:bg-muted transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-6 py-2 text-sm font-medium text-white bg-primary hover:bg-primary/90 rounded-lg transition-colors flex items-center gap-2 shadow-lg shadow-primary/20"
                    >
                      <Zap className="w-4 h-4" />
                      Create with AI
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )
        }

        {/* Executive Tasks Modal */}
        {showExecutiveTasksModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4" onClick={() => setShowExecutiveTasksModal(false)}>
            <div className="bg-gradient-to-b from-gray-900 to-black rounded-xl shadow-2xl max-w-4xl w-full max-h-[85vh] overflow-hidden border border-white/10" onClick={(e) => e.stopPropagation()}>
              <div className="flex justify-between items-center p-6 border-b border-white/10">
                <div>
                  <h2 className="text-2xl font-bold text-white flex items-center">
                    <Target className="h-6 w-6 mr-2 text-blue-400" />
                    Your Executive Tasks
                  </h2>
                  <p className="text-sm text-gray-400 mt-1">Tasks assigned to you by CEO/Co-Founder</p>
                </div>
                <button
                  onClick={() => setShowExecutiveTasksModal(false)}
                  className="p-2 hover:bg-white/10 rounded-full transition-colors"
                >
                  <X className="h-6 w-6 text-gray-400" />
                </button>
              </div>

              {/* Task Category Filter */}
              <div className="px-6 pt-4 pb-2 border-b border-white/5">
                <div className="flex gap-2">
                  <button
                    onClick={() => setExecutiveTaskFilter('all')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${executiveTaskFilter === 'all'
                      ? 'bg-white/10 border border-white text-white shadow-[0_0_15px_rgba(255,255,255,0.3)]'
                      : 'bg-black/20 border border-white/10 text-gray-400 hover:border-white/20'
                      }`}
                  >
                    All Tasks
                  </button>
                  <button
                    onClick={() => setExecutiveTaskFilter('project')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${executiveTaskFilter === 'project'
                      ? 'bg-white/10 border border-white text-white shadow-[0_0_15px_rgba(255,255,255,0.3)]'
                      : 'bg-black/20 border border-white/10 text-gray-400 hover:border-white/20'
                      }`}
                  >
                    Tasks for Project
                  </button>
                  <button
                    onClick={() => setExecutiveTaskFilter('other')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${executiveTaskFilter === 'other'
                      ? 'bg-white/10 border border-white text-white shadow-[0_0_15px_rgba(255,255,255,0.3)]'
                      : 'bg-black/20 border border-white/10 text-gray-400 hover:border-white/20'
                      }`}
                  >
                    Tasks for Other
                  </button>
                </div>
              </div>

              <div className="overflow-y-auto max-h-[calc(85vh-88px)]">
                {loadingExecutiveTasks ? (
                  <div className="flex justify-center items-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
                  </div>
                ) : executiveTasks.length === 0 ? (
                  <div className="text-center py-12">
                    <Target className="h-16 w-16 text-gray-600 mx-auto mb-4" />
                    <p className="text-gray-400 text-lg">No executive tasks assigned yet</p>
                    <p className="text-gray-500 text-sm mt-2">Tasks from CEO/Co-Founder will appear here</p>
                  </div>
                ) : (
                  <div className="p-6 space-y-4">
                    {executiveTasks
                      .filter(task => {
                        if (executiveTaskFilter === 'project') return task.projectId;
                        if (executiveTaskFilter === 'other') return !task.projectId;
                        return true; // 'all'
                      })
                      .map((task) => (
                        <div
                          key={task._id}
                          className="bg-gradient-to-r from-gray-800/50 to-gray-900/50 rounded-lg border border-white/10 p-5 hover:border-blue-500/30 transition-all"
                        >
                          <div className="flex justify-between items-start mb-3">
                            <div className="flex-1">
                              <h3 className="text-lg font-semibold text-white mb-2">{task.description}</h3>
                              <div className="grid grid-cols-2 gap-3 text-sm">
                                <div className="flex items-center text-gray-400">
                                  <UserCheck className="h-4 w-4 mr-2 text-blue-400" />
                                  <span>Assigned by: <span className="text-white">{task.assignedBy ? `${task.assignedBy.firstName} ${task.assignedBy.lastName}` : 'Unknown'}</span></span>
                                </div>
                                {task.projectId && (
                                  <div className="flex items-center text-gray-400">
                                    <FileText className="h-4 w-4 mr-2 text-green-400" />
                                    <span>Project: <span className="text-white">{task.projectId.name}</span></span>
                                  </div>
                                )}
                                <div className="flex items-center text-gray-400">
                                  <Clock className="h-4 w-4 mr-2 text-yellow-400" />
                                  <span>Deadline: <span className="text-white">{new Date(task.executiveDeadline).toLocaleDateString()}</span></span>
                                </div>
                                <div className="flex items-center text-gray-400">
                                  <CheckCircle className="h-4 w-4 mr-2 text-purple-400" />
                                  <span>Status: <span className={`font-medium ${task.status === 'pending' ? 'text-yellow-400' :
                                    task.status === 'accepted' ? 'text-blue-400' :
                                      task.status === 'delegated' ? 'text-green-400' :
                                        'text-gray-400'
                                    }`}>{task.status.toUpperCase()}</span></span>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Action Buttons for Project Tasks */}
                          {task.projectId && task.status === 'pending' && (
                            <div className="mt-4 pt-4 border-t border-white/10">
                              <button
                                onClick={() => handleDelegateExecutiveTask(task)}
                                className="w-full px-4 py-2 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white rounded-lg transition-colors flex items-center justify-center text-sm font-medium shadow-lg shadow-blue-500/20"
                              >
                                <Plus className="h-4 w-4 mr-2" />
                                Create Task
                              </button>
                            </div>
                          )}

                          {/* Action Buttons for Other Tasks (non-project) */}
                          {!task.projectId && task.status === 'pending' && (
                            <div className="flex gap-3 mt-4 pt-4 border-t border-white/10">
                              <button
                                onClick={() => handleAcceptExecutiveTask(task._id)}
                                className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center justify-center text-sm font-medium"
                              >
                                <CheckCircle className="h-4 w-4 mr-2" />
                                Accept Task
                              </button>
                              <button
                                onClick={() => handleDelegateExecutiveTask(task)}
                                className="flex-1 px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white rounded-lg transition-colors flex items-center justify-center text-sm font-medium shadow-lg shadow-green-500/20"
                              >
                                <Users className="h-4 w-4 mr-2" />
                                Delegate to Developer
                              </button>
                            </div>
                          )}

                          {task.status === 'accepted' && (
                            <div className="flex gap-3 mt-4 pt-4 border-t border-white/10">
                              <button
                                onClick={() => handleDelegateExecutiveTask(task)}
                                className="w-full px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white rounded-lg transition-colors flex items-center justify-center text-sm font-medium shadow-lg shadow-green-500/20"
                              >
                                <Users className="h-4 w-4 mr-2" />
                                Delegate to Developer
                              </button>
                            </div>
                          )}

                          {task.status === 'delegated' && task.delegatedTask && (
                            <div className="mt-4 pt-4 border-t border-white/10">
                              <p className="text-sm text-gray-400 mb-2">Delegated to:</p>
                              <div className="bg-black/30 rounded-lg p-3 text-sm">
                                <div className="flex items-center justify-between">
                                  <span className="text-white font-medium">
                                    {task.delegatedTask.assignedTo
                                      ? `${task.delegatedTask.assignedTo.firstName} ${task.delegatedTask.assignedTo.lastName}`
                                      : 'Unknown'}
                                  </span>
                                  <span className="text-gray-400">Deadline: {new Date(task.delegatedTask.deadline).toLocaleDateString()}</span>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    {executiveTasks.filter(task => {
                      if (executiveTaskFilter === 'project') return task.projectId;
                      if (executiveTaskFilter === 'other') return !task.projectId;
                      return true;
                    }).length === 0 && (
                        <div className="text-center py-12">
                          <Target className="h-12 w-12 text-gray-600 mx-auto mb-3" />
                          <p className="text-gray-400">No {executiveTaskFilter === 'project' ? 'project' : executiveTaskFilter === 'other' ? 'other' : ''} tasks found</p>
                          <p className="text-gray-500 text-sm mt-1">Try selecting a different category</p>
                        </div>
                      )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </DashboardLayout >
    </>
  );
};

export default ManagerDashboard;