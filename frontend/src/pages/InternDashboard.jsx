import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
    GraduationCap,
    CheckSquare,
    User,
    Bot,
    Award,
    TrendingUp,
    ChevronRight,
    Target,
    Clock,
    Code,
    UserCheck
} from 'lucide-react';
import api from '../utils/api';
import { formatDate } from '../utils/helpers';
import { showToast } from '../utils/toast';
import DashboardLayout from '../components/DashboardLayout';
import AttendancePunch from '../components/AttendancePunch';
import TaskDetailModal from '../components/TaskDetailModal';

const InternDashboard = () => {
    const { user } = useAuth();
    const navigate = useNavigate();

    const [tasks, setTasks] = useState([]);
    const [mentor, setMentor] = useState(null);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        total: 0,
        completed: 0,
        inProgress: 0,
        learningPoints: 0
    });
    
    // Persist current view in localStorage
    const [currentView, setCurrentView] = useState(() => {
        const savedView = localStorage.getItem('internDashboardView');
        return savedView || 'dashboard';
    });

    // Save view to localStorage whenever it changes
    useEffect(() => {
        localStorage.setItem('internDashboardView', currentView);
    }, [currentView]);

    // Task detail modal state
    const [selectedTaskId, setSelectedTaskId] = useState(null);
    const [showTaskDetailModal, setShowTaskDetailModal] = useState(false);

    useEffect(() => {
        fetchTasks();
        fetchMentor();
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
            showToast.error('Failed to fetch tasks');
        } finally {
            setLoading(false);
        }
    };

    const fetchMentor = async () => {
        try {
            if (user?.reportingTo) {
                const response = await api.get(`/users/${user.reportingTo}`);
                if (response.data.success) {
                    setMentor(response.data.data.user);
                }
            }
        } catch (error) {
            console.error('Error fetching mentor:', error);
        }
    };

    const calculateStats = (taskList) => {
        const completed = taskList.filter(t => t.status === 'completed').length;
        const inProgress = taskList.filter(t => t.status === 'in-progress').length;
        const learningPoints = taskList
            .filter(t => t.status === 'completed')
            .reduce((sum, t) => sum + (t.points || 0), 0);

        setStats({
            total: taskList.length,
            completed,
            inProgress,
            learningPoints
        });
    };

    const handleStatusUpdate = async (taskId, newStatus) => {
        try {
            const response = await api.put(`/tasks/${taskId}/status`, { status: newStatus });
            if (response.data.success) {
                showToast.success('Task status updated successfully');
                fetchTasks();
            }
        } catch (error) {
            console.error('Error updating task status:', error);
            showToast.error('Failed to update task status');
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'completed':
                return 'bg-green-500/20 text-green-300 border-green-500/30';
            case 'in-progress':
                return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
            case 'not-started':
                return 'bg-gray-500/20 text-gray-300 border-gray-500/30';
            default:
                return 'bg-gray-500/20 text-gray-300 border-gray-500/30';
        }
    };

    const sidebarActions = [
        {
            label: 'My Learning',
            icon: GraduationCap,
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
            label: 'My Profile',
            icon: User,
            onClick: () => navigate('/profile'),
            active: false
        }
    ];

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-black">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-yellow-500 mx-auto"></div>
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
                                    Welcome, {user?.firstName}! 🎓
                                </h1>
                                <p className="text-zinc-400 text-lg">
                                    {user?.designation || 'Intern'} • {user?.specializations?.join(', ') || 'Learning & Growing'}
                                </p>
                            </div>
                            {mentor && (
                                <div className="bg-yellow-500/10 border border-yellow-500/20 px-4 py-3 rounded-xl">
                                    <p className="text-xs text-yellow-400 font-medium mb-1">Your Mentor</p>
                                    <p className="text-lg font-bold text-yellow-300">{mentor.firstName} {mentor.lastName}</p>
                                    <p className="text-xs text-zinc-400">{mentor.designation}</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    {/* Stats Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                        <div className="bg-gradient-to-br from-yellow-600 to-orange-700 rounded-2xl p-6 text-white shadow-xl transform hover:scale-105 transition-all duration-200">
                            <div className="flex items-center justify-between mb-4">
                                <div className="bg-white/20 p-3 rounded-xl backdrop-blur-sm">
                                    <CheckSquare className="h-8 w-8" />
                                </div>
                                <GraduationCap className="h-6 w-6 text-yellow-200" />
                            </div>
                            <p className="text-yellow-100 text-sm font-medium mb-1">Learning Tasks</p>
                            <p className="text-4xl font-bold">{stats.total}</p>
                        </div>

                        <div className="bg-gradient-to-br from-green-600 to-emerald-700 rounded-2xl p-6 text-white shadow-xl transform hover:scale-105 transition-all duration-200">
                            <div className="flex items-center justify-between mb-4">
                                <div className="bg-white/20 p-3 rounded-xl backdrop-blur-sm">
                                    <Target className="h-8 w-8" />
                                </div>
                                <TrendingUp className="h-6 w-6 text-green-200" />
                            </div>
                            <p className="text-green-100 text-sm font-medium mb-1">Completed</p>
                            <p className="text-4xl font-bold">{stats.completed}</p>
                        </div>

                        <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl p-6 text-white shadow-xl transform hover:scale-105 transition-all duration-200">
                            <div className="flex items-center justify-between mb-4">
                                <div className="bg-white/20 p-3 rounded-xl backdrop-blur-sm">
                                    <Clock className="h-8 w-8" />
                                </div>
                                <TrendingUp className="h-6 w-6 text-blue-200" />
                            </div>
                            <p className="text-blue-100 text-sm font-medium mb-1">In Progress</p>
                            <p className="text-4xl font-bold">{stats.inProgress}</p>
                        </div>

                        <div className="bg-gradient-to-br from-purple-600 to-pink-700 rounded-2xl p-6 text-white shadow-xl transform hover:scale-105 transition-all duration-200">
                            <div className="flex items-center justify-between mb-4">
                                <div className="bg-white/20 p-3 rounded-xl backdrop-blur-sm">
                                    <Award className="h-8 w-8" />
                                </div>
                                <Target className="h-6 w-6 text-purple-200" />
                            </div>
                            <p className="text-purple-100 text-sm font-medium mb-1">Learning Points</p>
                            <p className="text-4xl font-bold">{stats.learningPoints}</p>
                        </div>
                    </div>

                    {/* Mentor & Specializations Section */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                        {/* Mentor Card */}
                        {mentor && (
                            <div className="bg-zinc-900/50 backdrop-blur-md rounded-2xl p-6 border border-white/10">
                                <div className="flex items-center space-x-3 mb-4">
                                    <UserCheck className="h-6 w-6 text-yellow-400" />
                                    <h2 className="text-xl font-bold text-white">Your Mentor</h2>
                                </div>
                                <div
                                    className="bg-zinc-800/50 border border-white/5 rounded-xl p-5 hover:border-yellow-500/30 cursor-pointer transition-all"
                                    onClick={() => navigate(`/profile?userId=${mentor._id}`)}
                                >
                                    <div className="flex items-start justify-between mb-3">
                                        <div className="flex items-center space-x-3">
                                            <div className="h-14 w-14 rounded-full bg-gradient-to-br from-yellow-500 to-orange-600 flex items-center justify-center text-white font-bold text-xl">
                                                {mentor.firstName?.charAt(0)}{mentor.lastName?.charAt(0)}
                                            </div>
                                            <div>
                                                <p className="text-white font-semibold text-lg">{mentor.firstName} {mentor.lastName}</p>
                                                <p className="text-sm text-zinc-400">{mentor.designation}</p>
                                                <p className="text-xs text-zinc-500">{mentor.employeeId}</p>
                                            </div>
                                        </div>
                                        <ChevronRight className="h-5 w-5 text-zinc-600" />
                                    </div>
                                    {mentor.specializations && mentor.specializations.length > 0 && (
                                        <div className="pt-3 border-t border-white/5">
                                            <p className="text-xs text-zinc-500 mb-2">Expert in:</p>
                                            <div className="flex flex-wrap gap-2">
                                                {mentor.specializations.map((spec, idx) => (
                                                    <span key={idx} className="text-xs px-2 py-1 bg-yellow-500/10 text-yellow-300 rounded border border-yellow-500/20">
                                                        {spec}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Specializations Card */}
                        {user?.specializations && user.specializations.length > 0 && (
                            <div className="bg-zinc-900/50 backdrop-blur-md rounded-2xl p-6 border border-white/10">
                                <div className="flex items-center space-x-3 mb-4">
                                    <Code className="h-6 w-6 text-blue-400" />
                                    <h2 className="text-xl font-bold text-white">Learning Focus</h2>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {user.specializations.map((spec, index) => (
                                        <span
                                            key={index}
                                            className="px-4 py-2 bg-blue-500/10 text-blue-300 rounded-xl text-sm font-semibold border border-blue-500/20"
                                        >
                                            {spec}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Learning Tasks Section */}
                    <div className="bg-zinc-900/30 backdrop-blur-md rounded-2xl border border-white/5 p-6">
                        <div className="flex items-center space-x-3 mb-6">
                            <GraduationCap className="h-6 w-6 text-yellow-400" />
                            <h2 className="text-2xl font-bold text-white">My Learning Tasks</h2>
                        </div>

                        {tasks.length === 0 ? (
                            <div className="text-center py-12">
                                <CheckSquare className="h-16 w-16 text-zinc-700 mx-auto mb-4" />
                                <p className="text-zinc-400 text-lg font-medium">No tasks yet</p>
                                <p className="text-zinc-600 text-sm mt-2">Your mentor will assign learning tasks soon</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                {tasks.map((task) => (
                                    <div
                                        key={task._id}
                                        className="bg-zinc-800/30 border border-white/5 rounded-xl p-6 hover:border-yellow-500/30 hover:shadow-xl transition-all duration-200 cursor-pointer"
                                        onClick={() => {
                                            setSelectedTaskId(task._id);
                                            setShowTaskDetailModal(true);
                                        }}
                                    >
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
                                            <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getStatusColor(task.status)}`}>
                                                {task.status?.replace('-', ' ').toUpperCase()}
                                            </span>
                                            {task.points && (
                                                <span className="px-3 py-1 rounded-full text-xs font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                                                    {task.points} PTS
                                                </span>
                                            )}
                                        </div>

                                        {/* Quick Actions */}
                                        {task.status !== 'completed' && (
                                            <div className="mt-4 pt-4 border-t border-white/5">
                                                <div className="flex space-x-2">
                                                    {['not-started', 'assigned', 'pending-assignment'].includes(task.status) && (
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleStatusUpdate(task._id, 'in-progress');
                                                            }}
                                                            className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold transition-colors duration-200"
                                                        >
                                                            Start Learning
                                                        </button>
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

                    {/* Progress Summary */}
                    {stats.completed > 0 && (
                        <div className="mt-8 bg-gradient-to-br from-green-900/20 to-emerald-900/20 rounded-2xl p-6 border border-green-500/20">
                            <div className="flex items-center space-x-3 mb-4">
                                <Award className="h-6 w-6 text-green-400" />
                                <h2 className="text-xl font-bold text-white">Learning Progress</h2>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="bg-black/30 rounded-xl p-4">
                                    <p className="text-sm text-zinc-400 mb-1">Completion Rate</p>
                                    <p className="text-3xl font-bold text-green-400">
                                        {Math.round((stats.completed / stats.total) * 100)}%
                                    </p>
                                </div>
                                <div className="bg-black/30 rounded-xl p-4">
                                    <p className="text-sm text-zinc-400 mb-1">Tasks Completed</p>
                                    <p className="text-3xl font-bold text-blue-400">{stats.completed}</p>
                                </div>
                                <div className="bg-black/30 rounded-xl p-4">
                                    <p className="text-sm text-zinc-400 mb-1">Points Earned</p>
                                    <p className="text-3xl font-bold text-purple-400">{stats.learningPoints}</p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

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
        </DashboardLayout>
    );
};

export default InternDashboard;
