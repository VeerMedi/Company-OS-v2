import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
    AlertCircle,
    Activity,
    Users,
    CheckCircle,
    XCircle,
    Calendar,
    TrendingUp,
    TrendingDown,
    FileText,
    MessageSquare,
    DollarSign,
    Mail,
    Video,
    FolderOpen,
    ArrowRight,
    ExternalLink,
    Download,
    Clock
} from 'lucide-react';
import api from '../../utils/api';

const ClientDashboardHome = () => {
    const [dashboardData, setDashboardData] = useState({
        actionRequired: [],
        projectHealthScore: 0,
        teamPulse: { online: 0, total: 0, members: [] },
        supportStatus: { operational: true, message: 'All systems operational' },
        nextMeeting: null,
        velocity: { planned: 0, actual: 0 },
        deliverables: [],
        updates: [],
        pendingPayment: 0
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        try {
            const { data } = await api.get('/clients/dashboard');
            if (data && data.data) {
                setDashboardData({
                    actionRequired: data.data.actionRequired || [],
                    projectHealthScore: data.data.client?.projectHealthScore || 75,
                    teamPulse: {
                        online: data.data.teamPulse?.online || 0,
                        total: data.data.teamPulse?.total || 0,
                        members: data.data.teamPulse?.members || []
                    },
                    supportStatus: data.data.supportStatus || { operational: true, message: 'All systems operational' },
                    nextMeeting: data.data.meetings?.[0] || null,
                    velocity: data.data.velocity || { planned: 0, actual: 0 },
                    deliverables: data.data.recentDeliverables || [],
                    updates: data.data.updates || [],
                    pendingPayment: data.data.pendingPayment || 0
                });
            }
        } catch (error) {
            console.error('Failed to fetch dashboard data:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="w-16 h-16 border-4 border-white/10 border-t-emerald-500 rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Row 1: Action Required + Project Health + Team Pulse */}
            <div className="grid grid-cols-3 gap-6">
                {/* 1. Action Required */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="col-span-1 bg-zinc-900 border border-amber-500/30 rounded-3xl p-6 relative overflow-hidden"
                >
                    <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-3xl" />
                    <div className="relative z-10">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-black text-white">Action Required</h3>
                            <AlertCircle className="text-amber-500" size={24} />
                        </div>
                        <div className="space-y-3">
                            {dashboardData.actionRequired.length > 0 ? (
                                dashboardData.actionRequired.map((task, idx) => (
                                    <div key={idx} className="bg-black/40 rounded-xl p-3 border border-white/10">
                                        <p className="text-white font-bold text-sm">{task.title}</p>
                                        <p className="text-xs text-zinc-400 mt-1">Due: {task.dueDate}</p>
                                        <button className="mt-2 px-3 py-1 bg-amber-500/20 text-amber-400 text-xs font-bold rounded-lg hover:bg-amber-500/30 transition-all">
                                            Take Action
                                        </button>
                                    </div>
                                ))
                            ) : (
                                <p className="text-zinc-400 text-sm">No pending actions</p>
                            )}
                        </div>
                    </div>
                </motion.div>

                {/* 2. Project Health Score */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="col-span-1 bg-gradient-to-br from-emerald-900/20 to-zinc-900 border border-emerald-500/30 rounded-3xl p-6"
                >
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-black text-white">Project Health</h3>
                        <Activity className="text-emerald-500" size={24} />
                    </div>
                    <div className="flex items-center justify-center py-8">
                        <div className="relative">
                            <svg className="w-32 h-32 transform -rotate-90">
                                <circle
                                    cx="64"
                                    cy="64"
                                    r="56"
                                    stroke="currentColor"
                                    strokeWidth="8"
                                    fill="none"
                                    className="text-white/10"
                                />
                                <circle
                                    cx="64"
                                    cy="64"
                                    r="56"
                                    stroke="currentColor"
                                    strokeWidth="8"
                                    fill="none"
                                    strokeDasharray={`${2 * Math.PI * 56}`}
                                    strokeDashoffset={`${2 * Math.PI * 56 * (1 - dashboardData.projectHealthScore / 100)}`}
                                    className="text-emerald-500 transition-all duration-1000"
                                    strokeLinecap="round"
                                />
                            </svg>
                            <div className="absolute inset-0 flex items-center justify-center">
                                <div className="text-center">
                                    <p className="text-4xl font-black text-white">{dashboardData.projectHealthScore}</p>
                                    <p className="text-xs text-zinc-400">out of 100</p>
                                </div>
                            </div>
                        </div>
                    </div>
                    <p className="text-center text-sm text-zinc-400">
                        {dashboardData.projectHealthScore >= 80 ? '✅ Excellent' :
                            dashboardData.projectHealthScore >= 60 ? '⚠️ Good' : '❌ Needs Attention'}
                    </p>
                </motion.div>

                {/* 3. Team Pulse */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="col-span-1 bg-zinc-900 border border-cyan-500/30 rounded-3xl p-6"
                >
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-black text-white">Team Pulse</h3>
                        <Users className="text-cyan-500" size={24} />
                    </div>
                    <div className="text-center py-4">
                        <div className="flex items-center justify-center gap-2 mb-4">
                            <div className="w-3 h-3 bg-emerald-500 rounded-full animate-pulse" />
                            <p className="text-5xl font-black text-white">{dashboardData.teamPulse.online}</p>
                            <p className="text-2xl text-zinc-400">/ {dashboardData.teamPulse.total}</p>
                        </div>
                        <p className="text-sm text-zinc-400">Team members online</p>
                    </div>
                    <div className="flex flex-wrap gap-2 mt-4">
                        {(dashboardData.teamPulse.members || []).slice(0, 6).map((member, idx) => (
                            <div key={idx} className="w-10 h-10 rounded-full bg-cyan-500/20 border-2 border-cyan-500 flex items-center justify-center text-white font-bold">
                                {member.charAt(0)}
                            </div>
                        ))}
                    </div>
                </motion.div>
            </div>

            {/* Row 2: Support Status + Weekly Sync + Production Velocity */}
            <div className="grid grid-cols-3 gap-6">
                {/* 4. Support Status */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="bg-zinc-900 border border-white/10 rounded-3xl p-6"
                >
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-black text-white">Support Status</h3>
                        {dashboardData.supportStatus.operational ? (
                            <CheckCircle className="text-emerald-500" size={24} />
                        ) : (
                            <XCircle className="text-red-500" size={24} />
                        )}
                    </div>
                    <div className={`p-4 rounded-xl ${dashboardData.supportStatus.operational ? 'bg-emerald-500/10 border border-emerald-500/30' : 'bg-red-500/10 border border-red-500/30'}`}>
                        <p className={`font-bold ${dashboardData.supportStatus.operational ? 'text-emerald-400' : 'text-red-400'}`}>
                            {dashboardData.supportStatus.message}
                        </p>
                    </div>
                </motion.div>

                {/* 5. Weekly Sync */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="bg-zinc-900 border border-purple-500/30 rounded-3xl p-6"
                >
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-black text-white">Weekly Sync</h3>
                        <Calendar className="text-purple-500" size={24} />
                    </div>
                    {dashboardData.nextMeeting ? (
                        <div className="space-y-3">
                            <div className="text-center py-2">
                                <p className="text-sm text-zinc-400">Next Meeting</p>
                                <p className="text-xl font-black text-white mt-1">{dashboardData.nextMeeting.date}</p>
                                <p className="text-sm text-purple-400">{dashboardData.nextMeeting.time}</p>
                            </div>
                            <button className="w-full px-4 py-2 bg-purple-500 text-white font-bold rounded-xl hover:bg-purple-600 transition-all flex items-center justify-center gap-2">
                                <Video size={16} />
                                Join Meeting
                            </button>
                        </div>
                    ) : (
                        <p className="text-zinc-400 text-sm text-center py-8">No upcoming meetings</p>
                    )}
                </motion.div>

                {/* 6. Production Velocity */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="bg-zinc-900 border border-blue-500/30 rounded-3xl p-6"
                >
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-black text-white">Velocity</h3>
                        <TrendingUp className="text-blue-500" size={24} />
                    </div>
                    <div className="space-y-4">
                        <div>
                            <div className="flex justify-between text-sm mb-2">
                                <span className="text-zinc-400">Planned</span>
                                <span className="text-white font-bold">{dashboardData.velocity.planned}%</span>
                            </div>
                            <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                                <div className="h-full bg-blue-500/50" style={{ width: `${dashboardData.velocity.planned}%` }} />
                            </div>
                        </div>
                        <div>
                            <div className="flex justify-between text-sm mb-2">
                                <span className="text-zinc-400">Actual</span>
                                <span className="text-white font-bold">{dashboardData.velocity.actual}%</span>
                            </div>
                            <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                                <div className="h-full bg-blue-500" style={{ width: `${dashboardData.velocity.actual}%` }} />
                            </div>
                        </div>
                    </div>
                </motion.div>
            </div>

            {/* Row 3: Recent Deliverables + Latest Updates */}
            <div className="grid grid-cols-2 gap-6">
                {/* 7. Recent Deliverables */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 }}
                    className="bg-zinc-900 border border-white/10 rounded-3xl p-6"
                >
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-black text-white">Recent Deliverables</h3>
                        <FileText className="text-zinc-400" size={24} />
                    </div>
                    <div className="space-y-3 max-h-64 overflow-y-auto">
                        {dashboardData.deliverables.length > 0 ? (
                            dashboardData.deliverables.map((file, idx) => (
                                <div key={idx} className="flex items-center justify-between p-3 bg-black/40 rounded-xl border border-white/10 hover:border-white/20 transition-all">
                                    <div className="flex items-center gap-3">
                                        <FileText size={16} className="text-zinc-400" />
                                        <div>
                                            <p className="text-white font-bold text-sm">{file.name}</p>
                                            <p className="text-xs text-zinc-400">{file.date}</p>
                                        </div>
                                    </div>
                                    <button className="p-2 hover:bg-white/10 rounded-lg transition-all">
                                        <Download size={16} className="text-zinc-400" />
                                    </button>
                                </div>
                            ))
                        ) : (
                            <p className="text-zinc-400 text-sm text-center py-8">No deliverables yet</p>
                        )}
                    </div>
                </motion.div>

                {/* 8. Latest Updates */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.7 }}
                    className="bg-zinc-900 border border-white/10 rounded-3xl p-6"
                >
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-black text-white">Latest Updates</h3>
                        <MessageSquare className="text-zinc-400" size={24} />
                    </div>
                    <div className="space-y-3 max-h-64 overflow-y-auto">
                        {dashboardData.updates.length > 0 ? (
                            dashboardData.updates.map((update, idx) => (
                                <div key={idx} className="p-3 bg-black/40 rounded-xl border border-white/10">
                                    <div className="flex items-start gap-3">
                                        <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center text-white font-bold text-xs">
                                            {update.user.charAt(0)}
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-white font-bold text-sm">{update.user}</p>
                                            <p className="text-zinc-400 text-xs mt-1">{update.message}</p>
                                            <p className="text-xs text-zinc-500 mt-2 flex items-center gap-1">
                                                <Clock size={12} />
                                                {update.time}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <p className="text-zinc-400 text-sm text-center py-8">No recent updates</p>
                        )}
                    </div>
                </motion.div>
            </div>

            {/* Row 4: Pending Payment + Quick Actions */}
            <div className="grid grid-cols-2 gap-6">
                {/* 9. Pending Payment Alert */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.8 }}
                    className="bg-gradient-to-br from-red-900/20 to-zinc-900 border border-red-500/30 rounded-3xl p-6"
                >
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-black text-white">Pending Payment</h3>
                        <DollarSign className="text-red-500" size={24} />
                    </div>
                    {dashboardData.pendingPayment > 0 ? (
                        <div className="space-y-4">
                            <div className="text-center py-4">
                                <p className="text-4xl font-black text-white">₹{dashboardData.pendingPayment.toLocaleString()}</p>
                                <p className="text-sm text-zinc-400 mt-2">Outstanding invoice amount</p>
                            </div>
                            <button className="w-full px-4 py-3 bg-red-500 text-white font-bold rounded-xl hover:bg-red-600 transition-all">
                                Pay Now
                            </button>
                        </div>
                    ) : (
                        <div className="text-center py-8">
                            <CheckCircle className="text-emerald-500 mx-auto mb-2" size={32} />
                            <p className="text-emerald-400 font-bold">All payments up to date!</p>
                        </div>
                    )}
                </motion.div>

                {/* 10. Quick Actions */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.9 }}
                    className="bg-zinc-900 border border-white/10 rounded-3xl p-6"
                >
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-black text-white">Quick Actions</h3>
                        <ExternalLink className="text-zinc-400" size={24} />
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                        <button className="p-4 bg-black/40 rounded-xl border border-white/10 hover:border-white/30 transition-all text-center">
                            <Mail className="text-blue-400 mx-auto mb-2" size={24} />
                            <p className="text-white text-xs font-bold">Email</p>
                        </button>
                        <button className="p-4 bg-black/40 rounded-xl border border-white/10 hover:border-white/30 transition-all text-center">
                            <Calendar className="text-purple-400 mx-auto mb-2" size={24} />
                            <p className="text-white text-xs font-bold">Calendar</p>
                        </button>
                        <button className="p-4 bg-black/40 rounded-xl border border-white/10 hover:border-white/30 transition-all text-center">
                            <FolderOpen className="text-amber-400 mx-auto mb-2" size={24} />
                            <p className="text-white text-xs font-bold">Files</p>
                        </button>
                    </div>
                </motion.div>
            </div>
        </div>
    );
};

export default ClientDashboardHome;
