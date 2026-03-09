import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
    Users,
    CheckSquare,
    Target,
    TrendingUp,
    ChevronRight,
    User,
    Bot,
    Award,
    BarChart3,
    Clock,
    Code,
    CheckCircle,
    Calendar
} from 'lucide-react';
import api from '../utils/api';
import { showToast } from '../utils/toast';
import DashboardLayout from '../components/DashboardLayout';
import LeaveApprovalSection from '../components/developer/LeaveApprovalSection';
import EmployeeLeaveManagement from '../components/EmployeeLeaveManagement';

const TeamLeadDashboard = () => {
    const { user } = useAuth();
    const navigate = useNavigate();

    const [teamMembers, setTeamMembers] = useState([]);
    const [teamTasks, setTeamTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    
    // Persist current view in localStorage
    const [currentView, setCurrentView] = useState(() => {
        const savedView = localStorage.getItem('teamLeadDashboardView');
        return savedView || 'dashboard';
    });

    // Save view to localStorage whenever it changes
    useEffect(() => {
        localStorage.setItem('teamLeadDashboardView', currentView);
    }, [currentView]);
    
    const [stats, setStats] = useState({
        teamSize: 0,
        activeTasks: 0,
        completedThisWeek: 0,
        teamPoints: 0
    });

    useEffect(() => {
        fetchTeamData();
    }, []);

    const fetchTeamData = async () => {
        try {
            setLoading(true);
            // Fetch all users to find team members
            const usersResponse = await api.get('/users/all');
            if (usersResponse.data.success) {
                const allUsers = usersResponse.data.data;
                // Find users reporting to this team lead
                const myTeam = allUsers.filter(u => u.reportingTo === user._id);
                setTeamMembers(myTeam);

                // Calculate stats
                setStats(prev => ({
                    ...prev,
                    teamSize: myTeam.length
                }));
            }

            // Fetch tasks (this would need backend support to get team tasks)
            const tasksResponse = await api.get('/tasks/my-tasks');
            if (tasksResponse.data.success) {
                const tasks = tasksResponse.data.data;
                setTeamTasks(tasks);

                const activeTasks = tasks.filter(t => t.status !== 'completed').length;
                const completedThisWeek = tasks.filter(t => {
                    if (t.status !== 'completed') return false;
                    const weekAgo = new Date();
                    weekAgo.setDate(weekAgo.getDate() - 7);
                    return new Date(t.updatedAt) > weekAgo;
                }).length;

                setStats(prev => ({
                    ...prev,
                    activeTasks,
                    completedThisWeek
                }));
            }
        } catch (error) {
            console.error('Error fetching team data:', error);
            showToast.error('Failed to fetch team data');
        } finally {
            setLoading(false);
        }
    };

    const sidebarActions = [
        {
            label: 'Team Overview',
            icon: Users,
            onClick: () => setCurrentView('dashboard'),
            active: currentView === 'dashboard'
        },
        {
            label: 'My Leaves',
            icon: Calendar,
            onClick: () => setCurrentView('my-leaves'),
            active: currentView === 'my-leaves'
        },
        {
            label: 'Approve Leaves',
            icon: CheckCircle,
            onClick: () => setCurrentView('leave-approvals'),
            active: currentView === 'leave-approvals'
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
                    <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-cyan-500 mx-auto"></div>
                    <p className="mt-4 text-zinc-400 font-medium">Loading your dashboard...</p>
                </div>
            </div>
        );
    }

    // Render my leaves view
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

    return (
        <DashboardLayout sidebarActions={sidebarActions} showBackButtonOverride={false}>
            <div className="min-h-screen bg-black">
                {/* Header */}
                <div className="bg-gradient-to-b from-zinc-900 to-black border-b border-white/5">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                        <div className="flex items-center justify-between">
                            <div>
                                <h1 className="text-3xl font-bold text-white mb-2">
                                    Welcome, {user?.firstName}! 👨‍💼
                                </h1>
                                <p className="text-zinc-400 text-lg">
                                    {user?.designation || 'Team Lead'} • Development Team
                                    {user?.specializations && user.specializations.length > 0 && (
                                        <span> • {user.specializations.join(', ')}</span>
                                    )}
                                </p>
                            </div>
                            <div className="flex items-center space-x-3">
                                <div className="bg-cyan-500/10 border border-cyan-500/20 px-4 py-2 rounded-xl">
                                    <p className="text-xs text-cyan-400 font-medium">Team Size</p>
                                    <p className="text-2xl font-bold text-cyan-300">{stats.teamSize}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    {/* Stats Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                        <div className="bg-gradient-to-br from-cyan-600 to-blue-700 rounded-2xl p-6 text-white shadow-xl transform hover:scale-105 transition-all duration-200">
                            <div className="flex items-center justify-between mb-4">
                                <div className="bg-white/20 p-3 rounded-xl backdrop-blur-sm">
                                    <Users className="h-8 w-8" />
                                </div>
                                <TrendingUp className="h-6 w-6 text-cyan-200" />
                            </div>
                            <p className="text-cyan-100 text-sm font-medium mb-1">Team Members</p>
                            <p className="text-4xl font-bold">{stats.teamSize}</p>
                        </div>

                        <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl p-6 text-white shadow-xl transform hover:scale-105 transition-all duration-200">
                            <div className="flex items-center justify-between mb-4">
                                <div className="bg-white/20 p-3 rounded-xl backdrop-blur-sm">
                                    <CheckSquare className="h-8 w-8" />
                                </div>
                                <Clock className="h-6 w-6 text-blue-200" />
                            </div>
                            <p className="text-blue-100 text-sm font-medium mb-1">Active Tasks</p>
                            <p className="text-4xl font-bold">{stats.activeTasks}</p>
                        </div>

                        <div className="bg-gradient-to-br from-green-600 to-emerald-700 rounded-2xl p-6 text-white shadow-xl transform hover:scale-105 transition-all duration-200">
                            <div className="flex items-center justify-between mb-4">
                                <div className="bg-white/20 p-3 rounded-xl backdrop-blur-sm">
                                    <Target className="h-8 w-8" />
                                </div>
                                <BarChart3 className="h-6 w-6 text-green-200" />
                            </div>
                            <p className="text-green-100 text-sm font-medium mb-1">Completed (7 days)</p>
                            <p className="text-4xl font-bold">{stats.completedThisWeek}</p>
                        </div>

                        <div className="bg-gradient-to-br from-purple-600 to-pink-700 rounded-2xl p-6 text-white shadow-xl transform hover:scale-105 transition-all duration-200">
                            <div className="flex items-center justify-between mb-4">
                                <div className="bg-white/20 p-3 rounded-xl backdrop-blur-sm">
                                    <Award className="h-8 w-8" />
                                </div>
                                <TrendingUp className="h-6 w-6 text-purple-200" />
                            </div>
                            <p className="text-purple-100 text-sm font-medium mb-1">Team Performance</p>
                            <p className="text-4xl font-bold">
                                {stats.activeTasks > 0 ? Math.round((stats.completedThisWeek / stats.activeTasks) * 100) : 0}%
                            </p>
                        </div>
                    </div>

                    {/* Team Members Section */}
                    <div className="bg-zinc-900/50 backdrop-blur-md rounded-2xl p-6 mb-8 border border-white/10">
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center space-x-3">
                                <Users className="h-6 w-6 text-cyan-400" />
                                <h2 className="text-2xl font-bold text-white">Your Team</h2>
                            </div>
                            <span className="text-sm text-zinc-400">{teamMembers.length} members</span>
                        </div>

                        {teamMembers.length === 0 ? (
                            <div className="text-center py-12">
                                <Users className="h-16 w-16 text-zinc-700 mx-auto mb-4" />
                                <p className="text-zinc-400 text-lg font-medium">No team members yet</p>
                                <p className="text-zinc-600 text-sm mt-2">Team members will appear here when assigned</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {teamMembers.map((member) => (
                                    <div
                                        key={member._id}
                                        className="bg-zinc-800/50 border border-white/5 rounded-xl p-5 hover:border-cyan-500/30 hover:shadow-lg transition-all cursor-pointer"
                                        onClick={() => navigate(`/profile?userId=${member._id}`)}
                                    >
                                        <div className="flex items-start justify-between mb-3">
                                            <div className="flex items-center space-x-3">
                                                <div className="h-12 w-12 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white font-bold text-lg">
                                                    {member.firstName?.charAt(0)}{member.lastName?.charAt(0)}
                                                </div>
                                                <div>
                                                    <p className="text-white font-semibold">{member.firstName} {member.lastName}</p>
                                                    <p className="text-xs text-zinc-400">{member.employeeId}</p>
                                                </div>
                                            </div>
                                            <ChevronRight className="h-5 w-5 text-zinc-600" />
                                        </div>

                                        <div className="space-y-2">
                                            <div className="flex items-center justify-between">
                                                <span className="text-xs text-zinc-500">Role:</span>
                                                <span className="text-sm text-zinc-300 font-medium capitalize">{member.role?.replace('-', ' ')}</span>
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <span className="text-xs text-zinc-500">Designation:</span>
                                                <span className="text-sm text-zinc-300 font-medium">{member.designation}</span>
                                            </div>
                                            {member.specializations && member.specializations.length > 0 && (
                                                <div className="pt-2 border-t border-white/5">
                                                    <p className="text-xs text-zinc-500 mb-2">Specializations:</p>
                                                    <div className="flex flex-wrap gap-1">
                                                        {member.specializations.map((spec, idx) => (
                                                            <span key={idx} className="text-xs px-2 py-1 bg-cyan-500/10 text-cyan-300 rounded border border-cyan-500/20">
                                                                {spec}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Quick Access */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <button
                            onClick={() => navigate('/tasks')}
                            className="bg-zinc-900/50 backdrop-blur-md border border-white/10 rounded-xl p-6 hover:border-blue-500/30 transition-all text-left group"
                        >
                            <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-4">
                                    <div className="bg-blue-500/10 p-3 rounded-xl">
                                        <CheckSquare className="h-6 w-6 text-blue-400" />
                                    </div>
                                    <div>
                                        <h3 className="text-white font-semibold text-lg">Manage Tasks</h3>
                                        <p className="text-zinc-400 text-sm">View and assign team tasks</p>
                                    </div>
                                </div>
                                <ChevronRight className="h-5 w-5 text-zinc-600 group-hover:text-blue-400 transition-colors" />
                            </div>
                        </button>

                        <button
                            onClick={() => navigate('/profile')}
                            className="bg-zinc-900/50 backdrop-blur-md border border-white/10 rounded-xl p-6 hover:border-cyan-500/30 transition-all text-left group"
                        >
                            <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-4">
                                    <div className="bg-cyan-500/10 p-3 rounded-xl">
                                        <User className="h-6 w-6 text-cyan-400" />
                                    </div>
                                    <div>
                                        <h3 className="text-white font-semibold text-lg">My Profile</h3>
                                        <p className="text-zinc-400 text-sm">View your information</p>
                                    </div>
                                </div>
                                <ChevronRight className="h-5 w-5 text-zinc-600 group-hover:text-cyan-400 transition-colors" />
                            </div>
                        </button>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
};

export default TeamLeadDashboard;
