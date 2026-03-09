import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
    CheckSquare,
    CheckCircle,
    Clock,
    Calendar,
    User,
    Target,
    Award,
    TrendingUp,
    ChevronRight,
    Filter,
    BarChart3,
    Code,
    Zap,
    Star,
    Bot,
    Users,
    Package
} from 'lucide-react';
import api from '../utils/api';
import { formatDate } from '../utils/helpers';
import { showToast as toast } from '../utils/toast';
import DelegateTaskModal from '../components/developer/DelegateTaskModal';
import SubmitEvidenceModal from '../components/developer/SubmitEvidenceModal';
import DashboardLayout from '../components/DashboardLayout';
import BunchCard from '../components/developer/BunchCard';
import AttendancePunch from '../components/AttendancePunch';

import TaskDetailModal from '../components/TaskDetailModal';
import EmployeeLeaveManagement from '../components/EmployeeLeaveManagement';
import LeaveApprovalSection from '../components/developer/LeaveApprovalSection';

const DeveloperDashboard = () => {
    const { user } = useAuth();
    const navigate = useNavigate();

    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeFilter, setActiveFilter] = useState('all');
    const [stats, setStats] = useState({
        total: 0,
        completed: 0,
        inProgress: 0,
        pending: 0,
        totalPoints: 0
    });

    const [mentees, setMentees] = useState([]);
    const [bunches, setBunches] = useState([]);
    const [bunchesLoading, setBunchesLoading] = useState(true);
    const [showDelegateModal, setShowDelegateModal] = useState(false);
    const [selectedTaskForDelegation, setSelectedTaskForDelegation] = useState(null);
    const [showEvidenceModal, setShowEvidenceModal] = useState(false);
    const [selectedTaskForEvidence, setSelectedTaskForEvidence] = useState(null);
    const [showCompleted, setShowCompleted] = useState(false);
    
    // Persist current view in localStorage
    const [currentView, setCurrentView] = useState(() => {
        const savedView = localStorage.getItem('developerDashboardView');
        return savedView || 'dashboard';
    });

    // Save view to localStorage whenever it changes
    useEffect(() => {
        localStorage.setItem('developerDashboardView', currentView);
    }, [currentView]);

    // Task detail modal state
    const [selectedTaskId, setSelectedTaskId] = useState(null);
    const [showTaskDetailModal, setShowTaskDetailModal] = useState(false);

    useEffect(() => {
        fetchTasks();
        fetchMentees();
        if (user.role === 'developer' || user.role === 'team-lead') {
            fetchBunches();
        }
    }, []);

    const fetchTasks = async () => {
        try {
            setLoading(true);
            const response = await api.get('/tasks/my-tasks');
            console.log('👨‍💻 Developer Tasks Response:', response.data);
            if (response.data.success) {
                const fetchedTasks = response.data.data;
                console.log('👨‍💻 Number of tasks:', fetchedTasks.length);
                console.log('👨‍💻 Tasks:', fetchedTasks);
                
                // Sort tasks: newest first (by createdAt or _id)
                const sortedTasks = fetchedTasks.sort((a, b) => {
                    const dateA = new Date(a.createdAt || a._id);
                    const dateB = new Date(b.createdAt || b._id);
                    return dateB - dateA; // Descending order (newest first)
                });
                
                setTasks(sortedTasks);
                calculateStats(sortedTasks);
            }
        } catch (error) {
            console.error('Error fetching tasks:', error);
            toast.error('Failed to fetch tasks');
        } finally {
            setLoading(false);
        }
    };

    const fetchMentees = async () => {
        try {
            const response = await api.get('/users/my-mentees');
            if (response.data.success) {
                setMentees(response.data.data || []);
            }
        } catch (error) {
            console.error('Error fetching mentees:', error);
        }
    };

    const fetchBunches = async () => {
        try {
            setBunchesLoading(true);
            const response = await api.get('/task-bunches/my-bunches');
            if (response.data.success) {
                setBunches(response.data.data || []);
            }
        } catch (error) {
            console.error('Error fetching bunches:', error);
            toast.error('Failed to fetch task bunches');
        } finally {
            setBunchesLoading(false);
        }
    };



    const calculateStats = (taskList) => {
        const completed = taskList.filter(t => t.status === 'completed').length;
        const inProgress = taskList.filter(t => t.status === 'in-progress').length;
        const pending = taskList.filter(t => t.status === 'not-started').length;
        const totalPoints = taskList
            .filter(t => t.status === 'completed')
            .reduce((sum, t) => sum + (t.points || 0), 0);

        setStats({
            total: taskList.length,
            completed,
            inProgress,
            pending,
            totalPoints
        });
    };

    const handleStatusUpdate = async (taskId, newStatus) => {
        try {
            // Optimistically update UI immediately (no reload, no toast)
            setTasks(prevTasks =>
                prevTasks.map(t =>
                    t._id === taskId ? { ...t, status: newStatus } : t
                )
            );

            setBunches(prevBunches =>
                prevBunches.map(bunch => ({
                    ...bunch,
                    tasks: bunch.tasks?.map(t =>
                        t._id === taskId ? { ...t, status: newStatus } : t
                    ) || bunch.tasks
                }))
            );

            // Update backend silently
            await api.patch(`/tasks/${taskId}/status`, { status: newStatus });
        } catch (error) {
            console.error('Error updating task status:', error);
            // Revert on error
            fetchTasks();
            fetchBunches();
            toast.error('Failed to update task status');
        }
    };

    const handleDelegateTask = (task) => {
        setSelectedTaskForDelegation(task);
        setShowDelegateModal(true);
    };

    const handleDelegationComplete = () => {
        fetchTasks(); // Refresh tasks after delegation
        setShowDelegateModal(false);
        setSelectedTaskForDelegation(null);
    };

    const handleAcceptTask = async (taskId) => {
        try {
            // Optimistically update UI immediately (no reload, no toast)
            setTasks(prevTasks =>
                prevTasks.map(t =>
                    t._id === taskId ? { ...t, status: 'in-progress', acceptedAt: new Date() } : t
                )
            );

            setBunches(prevBunches =>
                prevBunches.map(bunch => ({
                    ...bunch,
                    tasks: bunch.tasks?.map(t =>
                        t._id === taskId ? { ...t, status: 'in-progress', acceptedAt: new Date() } : t
                    ) || bunch.tasks
                }))
            );

            // Update backend silently
            await api.patch(`/tasks/${taskId}/accept`);
        } catch (error) {
            console.error('Error accepting task:', error);
            // Revert on error
            fetchTasks();
            fetchBunches();
            toast.error('Failed to accept task');
        }
    };

    const handleSubmitTask = (taskId) => {
        // Find the task to submit
        const task = tasks.find(t => t._id === taskId) ||
            bunches.flatMap(b => b.tasks).find(t => t._id === taskId);

        if (task) {
            setSelectedTaskForEvidence(task);
            setShowEvidenceModal(true);
        }
    };

    const handleEvidenceSubmitComplete = () => {
        fetchTasks();
        fetchBunches();
        setShowEvidenceModal(false);
        setSelectedTaskForEvidence(null);
    };

    const getFilteredTasks = () => {
        // If explicitly filtering for completed tasks, return them regardless of showCompleted flag
        if (activeFilter === 'completed') {
            return tasks.filter(t => t.status === 'completed');
        }

        let filtered = tasks;

        // Hide completed tasks by default for other views unless explicitly showing them
        if (!showCompleted) {
            filtered = filtered.filter(t => t.status !== 'completed');
        }

        switch (activeFilter) {
            case 'in-progress':
                return filtered.filter(t => t.status === 'in-progress');
            case 'pending':
                return filtered.filter(t => t.status === 'not-started');
            default:
                return filtered;
        }
    };

    // Sort tasks: cofounder_rag tasks first (sorted by priority/deadline), then regular tasks
    const getSortedTasks = (taskList) => {
        const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 };

        const cofounderTasks = taskList.filter(t => t.source === 'cofounder_rag');
        const regularTasks = taskList.filter(t => t.source !== 'cofounder_rag');

        const sortByPriorityAndDeadline = (a, b) => {
            const priorityDiff = (priorityOrder[a.priority] || 2) - (priorityOrder[b.priority] || 2);
            if (priorityDiff !== 0) return priorityDiff;
            return new Date(a.deadline) - new Date(b.deadline);
        };

        cofounderTasks.sort(sortByPriorityAndDeadline);
        regularTasks.sort(sortByPriorityAndDeadline);

        return [...cofounderTasks, ...regularTasks];
    };

    // Check if task is from cofounder RAG
    const isCofounderTask = (task) => task.source === 'cofounder_rag';

    const getTaskStatusColor = (status) => {
        const colors = {
            'not-started': 'bg-gray-500/20 text-gray-300 border-gray-500/30',
            'in-progress': 'bg-blue-500/20 text-blue-300 border-blue-500/30',
            'review': 'bg-purple-500/20 text-purple-300 border-purple-500/30',
            'completed': 'bg-green-500/20 text-green-300 border-green-500/30',
            'needs-revision': 'bg-orange-500/20 text-orange-300 border-orange-500/30',
            'cant-complete': 'bg-red-500/20 text-red-300 border-red-500/30'
        };
        return colors[status] || colors['not-started'];
    };
    const getPriorityColor = (priority) => {
        switch (priority) {
            case 'high':
            case 'urgent':
                return 'bg-red-500/20 text-red-300 border-red-500/30';
            case 'medium':
                return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30';
            case 'low':
                return 'bg-green-500/20 text-green-300 border-green-500/30';
            default:
                return 'bg-gray-500/20 text-gray-300 border-gray-500/30';
        }
    };

    const sidebarActions = [
        {
            label: 'My Tasks',
            icon: CheckSquare,
            onClick: () => setCurrentView('dashboard'),
            active: currentView === 'dashboard'
        },
        {
            label: 'My Attendance',
            icon: Clock,
            onClick: () => setCurrentView('my-attendance'),
            active: currentView === 'my-attendance'
        },
        {
            label: 'My Leaves',
            icon: Calendar,
            onClick: () => setCurrentView('my-leaves'),
            active: currentView === 'my-leaves'
        },
        ...(['developer', 'team-lead'].includes(user.role) ? [{
            label: 'Approve Leaves',
            icon: CheckCircle,
            onClick: () => setCurrentView('leave-approvals'),
            active: currentView === 'leave-approvals'
        }] : []),
        {
            label: 'My Profile',
            icon: User,
            onClick: () => navigate('/profile'),
            active: false
        },
        {
            label: 'AI Handbook',
            icon: Bot,
            onClick: () => navigate('/ai-handbook'),
            active: false
        }
    ];

    const filteredTasks = getSortedTasks(getFilteredTasks());

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-black">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-500 mx-auto"></div>
                    <p className="mt-4 text-zinc-400 font-medium">Loading your dashboard...</p>
                </div>
            </div>
        );
    }

    // Render attendance view
    if (currentView === 'my-attendance') {
        return (
            <DashboardLayout sidebarActions={sidebarActions} showBackButtonOverride={false}>
                <AttendancePunch />
            </DashboardLayout>
        );
    }

    // Render leaves view
    if (currentView === 'my-leaves') {
        return (
            <DashboardLayout sidebarActions={sidebarActions} showBackButtonOverride={false}>
                <EmployeeLeaveManagement />
            </DashboardLayout>
        );
    }

    // Render leave approvals view
    if (currentView === 'leave-approvals') {
        return (
            <DashboardLayout sidebarActions={sidebarActions} showBackButtonOverride={false}>
                <LeaveApprovalSection />
            </DashboardLayout>
        );
    }

    // Render main dashboard
    return (
        <DashboardLayout sidebarActions={sidebarActions} showBackButtonOverride={false}>
            <div className="min-h-screen bg-black">
                {/* Header */}
                <div className="bg-gradient-to-b from-zinc-900 to-black border-b border-white/5">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                        <div className="flex items-center justify-between">
                            <div>
                                <h1 className="text-3xl font-bold text-white mb-2">
                                    Welcome back, {user?.firstName}! 👨‍💻
                                </h1>
                                <p className="text-zinc-400 text-lg">
                                    {user?.designation || 'Developer'} • {user?.specializations?.join(', ') || 'Fullstack'}
                                </p>
                            </div>
                            <button
                                onClick={() => navigate('/profile')}
                                className="flex items-center space-x-2 bg-white/10 hover:bg-white/20 backdrop-blur-sm px-6 py-3 rounded-xl transition-all duration-200 border border-white/10 text-white"
                            >
                                <User className="h-5 w-5" />
                                <span className="font-medium">View Profile</span>
                            </button>
                        </div>
                    </div>
                </div>

                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    {/* Stats Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                        <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl p-6 text-white shadow-xl transform hover:scale-105 transition-all duration-200">
                            <div className="flex items-center justify-between mb-4">
                                <div className="bg-white/20 p-3 rounded-xl backdrop-blur-sm">
                                    <CheckSquare className="h-8 w-8" />
                                </div>
                                <TrendingUp className="h-6 w-6 text-blue-200" />
                            </div>
                            <p className="text-blue-100 text-sm font-medium mb-1">Total Tasks</p>
                            <p className="text-4xl font-bold">{stats.total}</p>
                        </div>

                        <div className="bg-gradient-to-br from-green-600 to-emerald-700 rounded-2xl p-6 text-white shadow-xl transform hover:scale-105 transition-all duration-200">
                            <div className="flex items-center justify-between mb-4">
                                <div className="bg-white/20 p-3 rounded-xl backdrop-blur-sm">
                                    <CheckCircle className="h-8 w-8" />
                                </div>
                                <Star className="h-6 w-6 text-green-200" />
                            </div>
                            <p className="text-green-100 text-sm font-medium mb-1">Completed</p>
                            <p className="text-4xl font-bold">{stats.completed}</p>
                        </div>

                        <div className="bg-gradient-to-br from-purple-600 to-purple-700 rounded-2xl p-6 text-white shadow-xl transform hover:scale-105 transition-all duration-200">
                            <div className="flex items-center justify-between mb-4">
                                <div className="bg-white/20 p-3 rounded-xl backdrop-blur-sm">
                                    <Clock className="h-8 w-8" />
                                </div>
                                <Zap className="h-6 w-6 text-purple-200" />
                            </div>
                            <p className="text-purple-100 text-sm font-medium mb-1">In Progress</p>
                            <p className="text-4xl font-bold">{stats.inProgress}</p>
                        </div>

                        <div className="bg-gradient-to-br from-orange-600 to-orange-700 rounded-2xl p-6 text-white shadow-xl transform hover:scale-105 transition-all duration-200">
                            <div className="flex items-center justify-between mb-4">
                                <div className="bg-white/20 p-3 rounded-xl backdrop-blur-sm">
                                    <Award className="h-8 w-8" />
                                </div>
                                <Target className="h-6 w-6 text-orange-200" />
                            </div>
                            <p className="text-orange-100 text-sm font-medium mb-1">Points Earned</p>
                            <p className="text-4xl font-bold">{stats.totalPoints}</p>
                        </div>
                    </div>

                    {/* Mentees Section */}
                    {mentees.length > 0 && (
                        <div className="bg-zinc-900/50 backdrop-blur-md rounded-2xl p-6 mb-8 border border-white/10">
                            <div className="flex items-center space-x-3 mb-4">
                                <Users className="h-6 w-6 text-cyan-400" />
                                <h2 className="text-xl font-bold text-white">Your Mentees</h2>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {mentees.map((mentee) => (
                                    <div key={mentee._id} className="bg-zinc-800/50 border border-white/5 rounded-xl p-5 hover:border-cyan-500/30 transition-all group relative overflow-hidden">
                                        <div className="absolute top-0 right-0 p-3 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button
                                                onClick={() => navigate(`/profile/${mentee._id}`)}
                                                className="p-2 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 rounded-lg transition-colors"
                                            >
                                                <User className="w-4 h-4" />
                                            </button>
                                        </div>

                                        <div className="flex items-start space-x-4">
                                            <div className="relative">
                                                <div className="h-12 w-12 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-cyan-900/20">
                                                    {mentee.firstName?.charAt(0)}{mentee.lastName?.charAt(0)}
                                                </div>
                                                <div className="absolute -bottom-1 -right-1 h-4 w-4 bg-emerald-500 rounded-full border-2 border-zinc-900" title="Active"></div>
                                            </div>

                                            <div className="flex-1 min-w-0">
                                                <h3 className="text-white font-bold text-lg truncate pr-6">
                                                    {mentee.firstName} {mentee.lastName}
                                                </h3>

                                                <div className="flex items-center gap-2 mb-2">
                                                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 uppercase tracking-wide">
                                                        {mentee.role || 'Intern'}
                                                    </span>
                                                    {mentee.employeeId && (
                                                        <span className="text-zinc-500 text-xs font-mono">
                                                            {mentee.employeeId}
                                                        </span>
                                                    )}
                                                </div>

                                                <div className="space-y-1.5">
                                                    <div className="flex items-center text-zinc-400 text-xs">
                                                        <Code className="w-3.5 h-3.5 mr-2 text-zinc-500" />
                                                        <span className="truncate">{mentee.specializations?.join(', ') || 'No Specializations'}</span>
                                                    </div>
                                                    <div className="flex items-center text-zinc-400 text-xs">
                                                        <Target className="w-3.5 h-3.5 mr-2 text-zinc-500" />
                                                        <span className="truncate">{mentee.designation || 'Trainee'}</span>
                                                    </div>
                                                    <div className="flex items-center text-zinc-400 text-xs">
                                                        <Users className="w-3.5 h-3.5 mr-2 text-zinc-500" />
                                                        <span className="truncate">{mentee.email}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Skills Section */}
                    {user?.specializations && user.specializations.length > 0 && (
                        <div className="bg-zinc-900/50 backdrop-blur-md rounded-2xl p-6 mb-8 border border-white/10">
                            <div className="flex items-center space-x-3 mb-4">
                                <Code className="h-6 w-6 text-blue-400" />
                                <h2 className="text-xl font-bold text-white">Your Specializations</h2>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {user.specializations.map((spec, index) => (
                                    <span
                                        key={index}
                                        className="px-4 py-2 bg-blue-500/10 text-blue-300 rounded-full text-sm font-semibold border border-blue-500/20"
                                    >
                                        {spec}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}



                    {/* My Task Bunches Section - Hidden for Interns */}
                    {(user.role === 'developer' || user.role === 'team-lead') && bunches.length > 0 && (
                        <div className="bg-zinc-900/50 backdrop-blur-md rounded-2xl p-6 mb-8 border border-white/10">
                            <div className="mb-6">
                                <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center gap-3">
                                        <div className="bg-emerald-500/10 p-3 rounded-xl">
                                            <Package className="h-6 w-6 text-emerald-400" />
                                        </div>
                                        <div>
                                            <h2 className="text-2xl font-bold text-white">My Task Bunches</h2>
                                            <p className="text-sm text-zinc-400 mt-1">Your assigned work grouped by modules</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="px-4 py-2 bg-emerald-500/20 text-emerald-300 rounded-xl text-sm font-bold border border-emerald-500/30 shadow-lg">
                                            {bunches.length} {bunches.length === 1 ? 'Bunch' : 'Bunches'}
                                        </span>
                                    </div>
                                </div>
                            </div>
                            {bunchesLoading ? (
                                <div className="flex items-center justify-center py-12">
                                    <div className="animate-spin rounded-full h-8 w-8 border-2 border-emerald-500 border-t-transparent"></div>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {bunches.map((bunch) => (
                                        <BunchCard
                                            key={bunch._id}
                                            bunch={bunch}
                                            onTaskUpdate={handleStatusUpdate}
                                            onAcceptTask={handleAcceptTask}
                                            onSubmitTask={handleSubmitTask}
                                            onDelegateTask={(user.role === 'developer' || user.role === 'team-lead') ? handleDelegateTask : null}
                                        />
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Task Management Section */}
                    <div className="bg-zinc-900/30 backdrop-blur-md rounded-2xl border border-white/5">
                        <div className="p-6 border-b border-white/5">
                            <div className="flex items-center justify-between mb-6">
                                <div className="flex items-center space-x-3">
                                    <BarChart3 className="h-6 w-6 text-blue-400" />
                                    <h2 className="text-2xl font-bold text-white">My Tasks</h2>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <Filter className="h-5 w-5 text-zinc-500" />
                                    <span className="text-sm text-zinc-400 font-medium">Filter:</span>
                                </div>
                            </div>

                            {/* Filter Tabs */}
                            <div className="flex space-x-2 overflow-x-auto">
                                {[
                                    { id: 'all', label: 'All Tasks', count: stats.total },
                                    { id: 'in-progress', label: 'In Progress', count: stats.inProgress },
                                    { id: 'pending', label: 'Pending', count: stats.pending },
                                    { id: 'completed', label: 'Completed', count: stats.completed },
                                    { id: 'attendance', label: 'My Attendance', icon: Clock, view: 'my-attendance' },
                                    { id: 'leaves', label: 'My Leaves', icon: Calendar, view: 'my-leaves' }
                                ].map((filter) => (
                                    <button
                                        key={filter.id}
                                        onClick={() => {
                                            if (filter.view) {
                                                setCurrentView(filter.view);
                                            } else {
                                                setActiveFilter(filter.id);
                                                setCurrentView('dashboard'); // Switch back to dashboard view for task filters
                                            }
                                        }}
                                        className={`px-6 py-3 rounded-xl font-semibold text-sm transition-all duration-200 whitespace-nowrap ${(filter.view && currentView === filter.view) || (!filter.view && activeFilter === filter.id && currentView === 'dashboard')
                                            ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-lg transform scale-105'
                                            : 'bg-zinc-800/50 text-zinc-300 hover:bg-zinc-700/50 border border-white/5'
                                            }`}
                                    >
                                        {filter.icon && <filter.icon className="h-5 w-5 mr-2" />}
                                        {filter.label} {filter.count !== undefined && `(${filter.count})`}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {currentView === 'dashboard' && (
                            <>
                                {/* Task List */}
                                <div className="p-6">
                                    {filteredTasks.length === 0 ? (
                                        <div className="text-center py-12">
                                            <CheckCircle className="h-16 w-16 text-zinc-700 mx-auto mb-4" />
                                            <p className="text-zinc-400 text-lg font-medium">No tasks found</p>
                                            <p className="text-zinc-600 text-sm mt-2">
                                                {activeFilter === 'all'
                                                    ? "You don't have any tasks assigned yet"
                                                    : `No ${activeFilter.replace('-', ' ')} tasks`
                                                }
                                            </p>
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                            {filteredTasks.map((task) => (
                                                <div
                                                    key={task._id}
                                                    className={`bg-zinc-800/30 border rounded-xl p-6 hover:shadow-xl transition-all duration-200 cursor-pointer ${isCofounderTask(task)
                                                        ? 'border-purple-500/50 bg-gradient-to-br from-purple-900/20 to-zinc-800/30 ring-2 ring-purple-500/20'
                                                        : 'border-white/5 hover:border-blue-500/30'
                                                        }`}
                                                    onClick={() => {
                                                        setSelectedTaskId(task._id);
                                                        setShowTaskDetailModal(true);
                                                    }}
                                                >
                                                    {/* Cofounder Task Banner */}
                                                    {isCofounderTask(task) && (
                                                        <div className="flex items-center gap-2 mb-3 pb-3 border-b border-purple-500/30">
                                                            <Zap className="h-4 w-4 text-purple-400" />
                                                            <span className="text-xs font-bold text-purple-300 uppercase tracking-wide">
                                                                Executive Priority Task
                                                            </span>
                                                        </div>
                                                    )}
                                                    <div className="flex items-start justify-between mb-4">
                                                        <h3 className="text-lg font-bold text-white flex-1 pr-4">
                                                            {task.title}
                                                        </h3>
                                                        <ChevronRight className="h-5 w-5 text-zinc-600 flex-shrink-0" />
                                                    </div>

                                                    <p className="text-zinc-400 text-sm mb-4 line-clamp-2">
                                                        {task.description}
                                                    </p>

                                                    <div className="flex flex-wrap gap-2 mb-4">
                                                        <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getTaskStatusColor(task.status)}`}>
                                                            {task.status?.replace('-', ' ').toUpperCase()}
                                                        </span>
                                                        <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getPriorityColor(task.priority)}`}>
                                                            {task.priority?.toUpperCase()} PRIORITY
                                                        </span>
                                                        {task.points && (
                                                            <span className="px-3 py-1 rounded-full text-xs font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                                                                {task.points} PTS
                                                            </span>
                                                        )}
                                                    </div>

                                                    {/* Delegation Info */}
                                                    <div className="mt-3 space-y-1.5">
                                                        {task.assignedBy && (
                                                            <div className="text-xs text-zinc-400 flex items-center gap-2 mt-2">
                                                                <div className="flex items-center gap-1.5 bg-zinc-700/30 px-2 py-1 rounded-lg border border-white/5">
                                                                    <User className="h-3 w-3 text-zinc-400" />
                                                                    <span>Assigned by: <span className="text-zinc-200 font-medium">{task.assignedBy.firstName} {task.assignedBy.lastName}</span></span>
                                                                </div>
                                                                {task.assignedBy.role && (
                                                                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide border ${task.assignedBy.role === 'manager' ? 'bg-purple-500/10 text-purple-400 border-purple-500/20' :
                                                                        task.assignedBy.role === 'team-lead' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                                                                            task.assignedBy.role === 'co-founder' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                                                                                task.assignedBy.role === 'hr' ? 'bg-pink-500/10 text-pink-400 border-pink-500/20' :
                                                                                    'bg-zinc-500/10 text-zinc-400 border-zinc-500/20'
                                                                        }`}>
                                                                        {task.assignedBy.role.replace('-', ' ')}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        )}
                                                        {task.delegatedBy && (
                                                            <div className="text-xs bg-blue-500/10 text-blue-300 flex items-center gap-1.5 px-2 py-1 rounded border border-blue-500/30">
                                                                <Users className="h-3 w-3" />
                                                                <span>Delegated by: <span className="font-medium">{task.delegatedBy.firstName} {task.delegatedBy.lastName}</span></span>
                                                                <span className="px-1.5 py-0.5 bg-blue-500/30 text-blue-200 rounded text-xs">Developer</span>
                                                            </div>
                                                        )}
                                                    </div>

                                                    <div className="flex items-center justify-between text-sm mt-3">
                                                        <div className="flex items-center space-x-2">
                                                            <Calendar className="h-4 w-4 text-zinc-500" />
                                                            <span className="text-zinc-400 font-medium">
                                                                Due: {formatDate(task.deadline)}
                                                            </span>
                                                        </div>
                                                    </div>

                                                    {/* Quick Actions */}
                                                    {task.status !== 'completed' && (
                                                        <div className="mt-4 pt-4 border-t border-white/5">
                                                            <div className="flex space-x-2">
                                                                {task.status === 'not-started' && (
                                                                    <>
                                                                        <button
                                                                            onClick={(e) => {
                                                                                e.stopPropagation();
                                                                                handleStatusUpdate(task._id, 'in-progress');
                                                                            }}
                                                                            className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold transition-colors duration-200"
                                                                        >
                                                                            Start Task
                                                                        </button>
                                                                        {(user.role === 'developer' || user.role === 'team-lead') && (
                                                                            <button
                                                                                onClick={(e) => {
                                                                                    e.stopPropagation();
                                                                                    handleDelegateTask(task);
                                                                                }}
                                                                                className="px-4 py-2 bg-zinc-700 hover:bg-zinc-600 text-white rounded-lg text-sm font-semibold transition-colors duration-200 flex items-center gap-2"
                                                                            >
                                                                                <Users className="h-4 w-4" />
                                                                                Delegate
                                                                            </button>
                                                                        )}
                                                                    </>
                                                                )}
                                                                {task.status === 'in-progress' && (
                                                                    <button
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            setSelectedTaskId(task._id);
                                                                            setShowTaskDetailModal(true);
                                                                        }}
                                                                        className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-semibold transition-colors duration-200"
                                                                    >
                                                                        Submit Evidence
                                                                    </button>
                                                                )}
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </>
                        )}

                        {/* Performance Insights Section */}
                        {currentView === 'dashboard' && stats.completed > 0 && (
                            <div className="mt-8 bg-gradient-to-br from-emerald-900/20 to-green-900/10 rounded-2xl p-6 border border-emerald-500/20">
                                <div className="flex items-center space-x-3 mb-6">
                                    <Award className="h-6 w-6 text-emerald-400" />
                                    <h2 className="text-xl font-bold text-white">Performance Insights</h2>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <div className="bg-zinc-900/50 backdrop-blur-sm rounded-xl p-4 border border-white/10">
                                        <p className="text-sm text-zinc-400 mb-2 font-medium">Completion Rate</p>
                                        <p className="text-4xl font-bold text-emerald-400">
                                            {Math.round((stats.completed / stats.total) * 100)}%
                                        </p>
                                    </div>
                                    <div className="bg-zinc-900/50 backdrop-blur-sm rounded-xl p-4 border border-white/10">
                                        <p className="text-sm text-zinc-400 mb-2 font-medium">Tasks Completed</p>
                                        <p className="text-4xl font-bold text-blue-400">{stats.completed}</p>
                                    </div>
                                    <div className="bg-zinc-900/50 backdrop-blur-sm rounded-xl p-4 border border-white/10">
                                        <p className="text-sm text-zinc-400 mb-2 font-medium">Total Points</p>
                                        <p className="text-4xl font-bold text-purple-400">{stats.totalPoints}</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => navigate('/profile?tab=performance')}
                                    className="mt-6 w-full bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-200 flex items-center justify-center space-x-2 shadow-lg"
                                >
                                    <BarChart3 className="h-5 w-5" />
                                    <span>View Detailed Performance Insights</span>
                                    <ChevronRight className="h-5 w-5" />
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Delegation Modal */}
                {showDelegateModal && selectedTaskForDelegation && (
                    <DelegateTaskModal
                        task={selectedTaskForDelegation}
                        onClose={() => setShowDelegateModal(false)}
                        onSuccess={handleDelegationComplete}
                    />
                )}

                {/* Evidence Submission Modal */}
                {showEvidenceModal && selectedTaskForEvidence && (
                    <SubmitEvidenceModal
                        task={selectedTaskForEvidence}
                        onClose={() => setShowEvidenceModal(false)}
                        onSuccess={handleEvidenceSubmitComplete}
                    />
                )}

                {/* Task Detail Modal */}
                <TaskDetailModal
                    taskId={selectedTaskId}
                    isOpen={showTaskDetailModal}
                    onClose={() => {
                        setShowTaskDetailModal(false);
                        setSelectedTaskId(null);
                    }}
                    onTaskUpdate={(taskId, newStatus) => {
                        fetchTasks();
                    }}
                />
            </div>
        </DashboardLayout>
    );
};

export default DeveloperDashboard;
