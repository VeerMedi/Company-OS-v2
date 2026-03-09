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
    AlertCircle,
    ChevronRight,
    Filter,
    BarChart3,
    Code,
    Zap,
    Star,
    Bot
} from 'lucide-react';
import api from '../utils/api';
import { formatDate } from '../utils/helpers';
import { showToast as toast } from '../utils/toast';
import DashboardLayout from '../components/DashboardLayout';

const IndividualDeveloperDashboard = () => {
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

    useEffect(() => {
        fetchTasks();
    }, []);

    const fetchTasks = async () => {
        try {
            setLoading(true);
            const response = await api.get('/tasks/my-tasks');
            if (response.data.success) {
                const fetchedTasks = response.data.data;
                setTasks(fetchedTasks);
                calculateStats(fetchedTasks);
            }
        } catch (error) {
            console.error('Error fetching tasks:', error);
            toast.error('Failed to fetch tasks');
        } finally {
            setLoading(false);
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
            const response = await api.put(`/tasks/${taskId}/status`, { status: newStatus });
            if (response.data.success) {
                toast.success('Task status updated successfully');
                fetchTasks(); // Refresh tasks
            }
        } catch (err) {
            console.error('Error updating task status:', err);
            toast.error('Failed to update task status');
        }
    };

    const getFilteredTasks = () => {
        switch (activeFilter) {
            case 'in-progress':
                return tasks.filter(t => t.status === 'in-progress');
            case 'completed':
                return tasks.filter(t => t.status === 'completed');
            case 'pending':
                return tasks.filter(t => t.status === 'not-started');
            default:
                return tasks;
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

    const getStatusColor = (status) => {
        switch (status) {
            case 'completed':
                return 'bg-green-100 text-green-800 border-green-200';
            case 'in-progress':
                return 'bg-blue-100 text-blue-800 border-blue-200';
            case 'not-started':
                return 'bg-gray-100 text-gray-800 border-gray-200';
            default:
                return 'bg-gray-100 text-gray-800 border-gray-200';
        }
    };

    const getPriorityColor = (priority) => {
        switch (priority) {
            case 'high':
                return 'bg-red-100 text-red-800 border-red-200';
            case 'medium':
                return 'bg-yellow-100 text-yellow-800 border-yellow-200';
            case 'low':
                return 'bg-green-100 text-green-800 border-green-200';
            default:
                return 'bg-gray-100 text-gray-800 border-gray-200';
        }
    };

    const getDeadlineColor = (deadline) => {
        const daysUntil = Math.ceil((new Date(deadline) - new Date()) / (1000 * 60 * 60 * 24));
        if (daysUntil < 0) return 'text-red-600';
        if (daysUntil <= 2) return 'text-orange-600';
        if (daysUntil <= 5) return 'text-yellow-600';
        return 'text-gray-600';
    };

    // Sidebar actions for developers
    const sidebarActions = [
        {
            label: 'My Tasks',
            icon: CheckSquare,
            onClick: () => navigate('/individual-developer'),
            active: true
        },
        {
            label: 'Performance',
            icon: Target,
            onClick: () => navigate('/profile?tab=performance'),
            active: false
        },
        {
            label: 'My Profile',
            icon: User,
            onClick: () => navigate('/profile'),
            active: false
        },
        {
            label: 'Settings',
            icon: Calendar,
            onClick: () => navigate('/settings'),
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
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600 font-medium">Loading your dashboard...</p>
                </div>
            </div>
        );
    }

    return (
        <DashboardLayout sidebarActions={sidebarActions} showBackButtonOverride={false}>
            <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
                {/* Header */}
                <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-purple-700 text-white shadow-xl">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                        <div className="flex items-center justify-between">
                            <div>
                                <h1 className="text-3xl font-bold mb-2">
                                    Welcome back, {user?.firstName}! 👋
                                </h1>
                                <p className="text-blue-100 text-lg">
                                    {user?.jobCategory === 'developer' && user?.skills?.includes('AI/ML')
                                        ? '🤖 AI & Automation Developer'
                                        : '💻 Web Developer'
                                    }
                                </p>
                            </div>
                            <button
                                onClick={() => navigate('/profile')}
                                className="flex items-center space-x-2 bg-white/20 hover:bg-white/30 backdrop-blur-sm px-6 py-3 rounded-xl transition-all duration-200 border border-white/30"
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
                        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-6 text-white shadow-xl transform hover:scale-105 transition-all duration-200">
                            <div className="flex items-center justify-between mb-4">
                                <div className="bg-white/20 p-3 rounded-xl backdrop-blur-sm">
                                    <CheckSquare className="h-8 w-8" />
                                </div>
                                <TrendingUp className="h-6 w-6 text-blue-200" />
                            </div>
                            <p className="text-blue-100 text-sm font-medium mb-1">Total Tasks</p>
                            <p className="text-4xl font-bold">{stats.total}</p>
                        </div>

                        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-2xl p-6 text-white shadow-xl transform hover:scale-105 transition-all duration-200">
                            <div className="flex items-center justify-between mb-4">
                                <div className="bg-white/20 p-3 rounded-xl backdrop-blur-sm">
                                    <CheckCircle className="h-8 w-8" />
                                </div>
                                <Star className="h-6 w-6 text-green-200" />
                            </div>
                            <p className="text-green-100 text-sm font-medium mb-1">Completed</p>
                            <p className="text-4xl font-bold">{stats.completed}</p>
                        </div>

                        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl p-6 text-white shadow-xl transform hover:scale-105 transition-all duration-200">
                            <div className="flex items-center justify-between mb-4">
                                <div className="bg-white/20 p-3 rounded-xl backdrop-blur-sm">
                                    <Clock className="h-8 w-8" />
                                </div>
                                <Zap className="h-6 w-6 text-purple-200" />
                            </div>
                            <p className="text-purple-100 text-sm font-medium mb-1">In Progress</p>
                            <p className="text-4xl font-bold">{stats.inProgress}</p>
                        </div>

                        <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl p-6 text-white shadow-xl transform hover:scale-105 transition-all duration-200">
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

                    {/* Skills Section */}
                    <div className="bg-white rounded-2xl shadow-lg p-6 mb-8 border border-gray-100">
                        <div className="flex items-center space-x-3 mb-4">
                            <Code className="h-6 w-6 text-blue-600" />
                            <h2 className="text-xl font-bold text-gray-900">Your Skills</h2>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {user?.skills?.map((skill, index) => (
                                <span
                                    key={index}
                                    className="px-4 py-2 bg-gradient-to-r from-blue-50 to-purple-50 text-blue-700 rounded-full text-sm font-semibold border border-blue-200 shadow-sm"
                                >
                                    {skill}
                                </span>
                            ))}
                        </div>
                    </div>

                    {/* Task Management Section */}
                    <div className="bg-white rounded-2xl shadow-lg border border-gray-100">
                        <div className="p-6 border-b border-gray-200">
                            <div className="flex items-center justify-between mb-6">
                                <div className="flex items-center space-x-3">
                                    <BarChart3 className="h-6 w-6 text-blue-600" />
                                    <h2 className="text-2xl font-bold text-gray-900">My Tasks</h2>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <Filter className="h-5 w-5 text-gray-400" />
                                    <span className="text-sm text-gray-500 font-medium">Filter:</span>
                                </div>
                            </div>

                            {/* Filter Tabs */}
                            <div className="flex space-x-2 overflow-x-auto">
                                {[
                                    { id: 'all', label: 'All Tasks', count: stats.total },
                                    { id: 'in-progress', label: 'In Progress', count: stats.inProgress },
                                    { id: 'pending', label: 'Pending', count: stats.pending },
                                    { id: 'completed', label: 'Completed', count: stats.completed }
                                ].map((filter) => (
                                    <button
                                        key={filter.id}
                                        onClick={() => setActiveFilter(filter.id)}
                                        className={`px-6 py-3 rounded-xl font-semibold text-sm transition-all duration-200 whitespace-nowrap ${activeFilter === filter.id
                                            ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg transform scale-105'
                                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                            }`}
                                    >
                                        {filter.label} ({filter.count})
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Task List */}
                        <div className="p-6">
                            {filteredTasks.length === 0 ? (
                                <div className="text-center py-12">
                                    <CheckCircle className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                                    <p className="text-gray-500 text-lg font-medium">No tasks found</p>
                                    <p className="text-gray-400 text-sm mt-2">
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
                                            className={`bg-gradient-to-br ${isCofounderTask(task) ? 'from-purple-50 to-purple-100 border-purple-400 hover:border-purple-500' : 'from-white to-gray-50 border-gray-200 hover:border-blue-300'} border-2 rounded-xl p-6 hover:shadow-xl transition-all duration-200 cursor-pointer ${isCofounderTask(task) ? 'ring-2 ring-purple-200' : ''}`}
                                            onClick={() => navigate(`/task/${task._id}`)}
                                        >
                                            {/* Cofounder Task Banner */}
                                            {isCofounderTask(task) && (
                                                <div className="flex items-center gap-2 mb-3 pb-3 border-b border-purple-200">
                                                    <Zap className="h-4 w-4 text-purple-600" />
                                                    <span className="text-xs font-bold text-purple-700 uppercase tracking-wide">
                                                        Executive Priority Task
                                                    </span>
                                                </div>
                                            )}

                                            <div className="flex items-start justify-between mb-4">
                                                <h3 className="text-lg font-bold text-gray-900 flex-1 pr-4">
                                                    {task.title}
                                                </h3>
                                                <ChevronRight className="h-5 w-5 text-gray-400 flex-shrink-0" />
                                            </div>

                                            <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                                                {task.description}
                                            </p>

                                            <div className="flex flex-wrap gap-2 mb-4">
                                                <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getStatusColor(task.status)}`}>
                                                    {task.status?.replace('-', ' ').toUpperCase()}
                                                </span>
                                                <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getPriorityColor(task.priority)}`}>
                                                    {task.priority?.toUpperCase()} PRIORITY
                                                </span>
                                                {task.points && (
                                                    <span className="px-3 py-1 rounded-full text-xs font-bold bg-purple-100 text-purple-800 border border-purple-200">
                                                        {task.points} PTS
                                                    </span>
                                                )}
                                            </div>

                                            <div className="flex items-center justify-between text-sm">
                                                <div className="flex items-center space-x-2">
                                                    <Calendar className="h-4 w-4 text-gray-400" />
                                                    <span className={`font-medium ${getDeadlineColor(task.deadline)}`}>
                                                        Due: {formatDate(task.deadline)}
                                                    </span>
                                                </div>
                                                {task.requiredSkills && task.requiredSkills.length > 0 && (
                                                    <div className="flex items-center space-x-1">
                                                        <Code className="h-4 w-4 text-blue-500" />
                                                        <span className="text-xs text-gray-500">
                                                            {task.requiredSkills.length} skills
                                                        </span>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Quick Actions */}
                                            {task.status !== 'completed' && (
                                                <div className="mt-4 pt-4 border-t border-gray-200">
                                                    <div className="flex space-x-2">
                                                        {task.status === 'not-started' && (
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    handleStatusUpdate(task._id, 'in-progress');
                                                                }}
                                                                className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold transition-colors duration-200"
                                                            >
                                                                Start Task
                                                            </button>
                                                        )}
                                                        {task.status === 'in-progress' && (
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    handleStatusUpdate(task._id, 'completed');
                                                                }}
                                                                className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-semibold transition-colors duration-200"
                                                            >
                                                                Mark Complete
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
                    </div>

                    {/* Performance Section */}
                    {stats.completed > 0 && (
                        <div className="mt-8 bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl shadow-lg p-6 border border-green-200">
                            <div className="flex items-center space-x-3 mb-4">
                                <Award className="h-6 w-6 text-green-600" />
                                <h2 className="text-xl font-bold text-gray-900">Performance</h2>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="bg-white rounded-xl p-4 shadow-sm">
                                    <p className="text-sm text-gray-600 mb-1">Completion Rate</p>
                                    <p className="text-3xl font-bold text-green-600">
                                        {Math.round((stats.completed / stats.total) * 100)}%
                                    </p>
                                </div>
                                <div className="bg-white rounded-xl p-4 shadow-sm">
                                    <p className="text-sm text-gray-600 mb-1">Tasks Completed</p>
                                    <p className="text-3xl font-bold text-blue-600">{stats.completed}</p>
                                </div>
                                <div className="bg-white rounded-xl p-4 shadow-sm">
                                    <p className="text-sm text-gray-600 mb-1">Total Points</p>
                                    <p className="text-3xl font-bold text-purple-600">{stats.totalPoints}</p>
                                </div>
                            </div>
                            <button
                                onClick={() => navigate('/profile?tab=performance')}
                                className="mt-6 w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-xl font-semibold hover:shadow-lg transition-all duration-200 flex items-center justify-center space-x-2"
                            >
                                <BarChart3 className="h-5 w-5" />
                                <span>View Detailed Performance Insights</span>
                                <ChevronRight className="h-5 w-5" />
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </DashboardLayout>
    );
};

export default IndividualDeveloperDashboard;
