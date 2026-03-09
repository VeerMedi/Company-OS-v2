import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    TrendingUp,
    TrendingDown,
    Award,
    Target,
    CheckCircle,
    Clock,
    BarChart3,
    Activity,
    User,
    ChevronDown,
    ChevronUp,
    Maximize2,
    Minimize2,
    Filter,
    Zap
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, AreaChart, Area, PieChart, Pie, Cell } from 'recharts';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import PerformanceDetailModal from '../PerformanceDetailModal';

// --- Animations ---
const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.1,
            delayChildren: 0.1
        }
    }
};

const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
        y: 0,
        opacity: 1,
        transition: {
            type: "spring",
            stiffness: 100,
            damping: 10
        }
    }
};

// --- Reusable Widget Component (Copied from AttendanceManagement & CoFounder) ---
const PerformanceWidget = ({ title, subtitle, size, onSizeChange, children, color = "violet", variants }) => {
    const isSmall = size === 'small';
    const isMedium = size === 'medium';
    const isLarge = size === 'large';

    const getGridClass = () => {
        if (isSmall) return 'col-span-12 md:col-span-6 lg:col-span-3 row-span-1 h-[220px]';
        if (isMedium) return 'col-span-12 md:col-span-12 lg:col-span-6 row-span-1 h-[220px]';
        return 'col-span-12 md:col-span-12 lg:col-span-6 row-span-2 h-[464px]';
    };

    return (
        <motion.div
            layout
            variants={variants}
            className={`relative rounded-[24px] bg-gradient-to-b from-[#18181b] to-[#09090b] border border-white/5 shadow-2xl overflow-hidden group outline-none focus:outline-none ${getGridClass()}`}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
        >
            <div className={`absolute inset-0 bg-gradient-to-tr from-${color}-500/5 via-${color}-500/5 to-${color}-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none`} />

            <div className="relative p-6 h-full flex flex-col z-10">
                <div className="flex items-start justify-between mb-3 z-10 relative">
                    <div>
                        <h3 className="text-transparent bg-clip-text bg-gradient-to-r from-white to-zinc-400 font-bold text-sm tracking-wide">{title}</h3>
                        {subtitle && <p className="text-zinc-500 text-[10px] mt-0.5 font-medium tracking-wider uppercase">{subtitle}</p>}
                    </div>
                    {/* Header Controls */}
                    <div className="absolute top-0 right-0 z-20 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                        <button
                            onClick={() => onSizeChange(size === 'small' ? 'medium' : size === 'medium' ? 'large' : 'small')}
                            className="p-1.5 rounded-full bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white transition-colors"
                            title="Toggle Size"
                        >
                            {isLarge ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
                        </button>
                    </div>
                </div>
                <div className="flex-1 min-h-0 relative flex flex-col z-0">
                    {children}
                </div>
            </div>
        </motion.div>
    );
};

const PerformanceTracking = () => {
    const navigate = useNavigate();
    const [teamPerformance, setTeamPerformance] = useState(null);
    const [individuals, setIndividuals] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedMember, setSelectedMember] = useState(null);
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [sortBy, setSortBy] = useState('points'); // points, completion, name

    // Derived Stats
    const [stats, setStats] = useState({
        avgCompletion: 0,
        totalCompletedTasks: 0
    });

    const [widgetStates, setWidgetStates] = useState({
        overview: 'medium',
        metrics: 'medium'
    });

    const handleWidgetSizeChange = (key, size) => {
        setWidgetStates(prev => ({ ...prev, [key]: size }));
    };

    useEffect(() => {
        fetchPerformanceData();
    }, []);

    const fetchPerformanceData = async () => {
        try {
            setLoading(true);
            const performanceResponse = await api.get('/performance/individuals');
            if (performanceResponse.data.success) {
                const membersWithPerformance = performanceResponse.data.data.map(member => ({
                    _id: member.id,
                    firstName: member.name.split(' ')[0],
                    lastName: member.name.split(' ').slice(1).join(' '),
                    email: member.email,
                    role: 'individual',
                    totalPoints: member.totalPoints,
                    activeTasks: member.totalTasks - member.completedTasks,
                    completedTasks: member.completedTasks,
                    completionRate: member.completionRate,
                    productivityScore: member.productivityScore
                }));

                setIndividuals(membersWithPerformance);
                calculateTeamPerformance(membersWithPerformance);
            }
        } catch (error) {
            console.error('Error fetching performance data:', error);
            toast.error('Failed to load performance data');
        } finally {
            setLoading(false);
        }
    };

    const calculateTeamPerformance = (members) => {
        const totalPoints = members.reduce((sum, m) => sum + (m.totalPoints || 0), 0);
        const avgPoints = members.length > 0 ? totalPoints / members.length : 0;
        const totalCompleted = members.reduce((sum, m) => sum + (m.completedTasks || 0), 0);
        const avgCompletion = members.length > 0
            ? members.reduce((sum, m) => sum + (m.completionRate || 0), 0) / members.length
            : 0;

        setTeamPerformance({
            totalMembers: members.length,
            totalPoints,
            avgPoints: Math.round(avgPoints),
            topPerformer: members.reduce((top, m) => (m.totalPoints || 0) > (top?.totalPoints || 0) ? m : top, members[0])
        });

        setStats({
            avgCompletion: Math.round(avgCompletion),
            totalCompletedTasks: totalCompleted
        });
    };

    const sortedIndividuals = [...individuals].sort((a, b) => {
        if (sortBy === 'points') return (b.totalPoints || 0) - (a.totalPoints || 0);
        if (sortBy === 'name') return `${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`);
        return 0;
    });

    return (
        <div className="space-y-8 p-2">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-black text-white tracking-tight">Performance Tracking</h1>
                <p className="text-zinc-400 mt-1 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-violet-500 animate-pulse" />
                    Monitor Real-time Team Metrics
                </p>
            </div>

            {loading ? (
                <div className="flex items-center justify-center py-20">
                    <div className="w-10 h-10 border-4 border-violet-500/30 border-t-violet-500 rounded-full animate-spin"></div>
                </div>
            ) : (
                <>
                    {/* Widgets Grid */}
                    <motion.div
                        className="grid grid-cols-12 gap-6 auto-rows-min grid-flow-dense"
                        variants={containerVariants}
                        initial="hidden"
                        animate="visible"
                    >
                        {/* Widget 1: Team Overview */}
                        <PerformanceWidget
                            title="Team Overview"
                            subtitle="Active Staff & Completion"
                            size={widgetStates.overview}
                            onSizeChange={(s) => handleWidgetSizeChange('overview', s)}
                            color="violet"
                            variants={itemVariants}
                        >
                            <div className="flex flex-col h-full justify-center">
                                <div className="grid grid-cols-2 gap-4 h-full">
                                    <div className="bg-violet-500/5 rounded-2xl p-4 border border-violet-500/10 flex flex-col justify-center items-center relative overflow-hidden group hover:border-violet-500/30 transition-all">
                                        <div className="absolute inset-0 bg-violet-500/10 blur-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
                                        <div className="text-white text-5xl font-black leading-none drop-shadow-xl relative z-10">{teamPerformance?.totalMembers || 0}</div>
                                        <div className="text-[11px] text-zinc-400 font-bold uppercase tracking-widest mt-2 relative z-10 text-center">Active Employees</div>
                                    </div>
                                    <div className="bg-fuchsia-500/5 rounded-2xl p-4 border border-fuchsia-500/10 flex flex-col justify-center items-center relative overflow-hidden group hover:border-fuchsia-500/30 transition-all">
                                        <div className="absolute inset-0 bg-fuchsia-500/10 blur-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
                                        <div className="text-white text-5xl font-black leading-none drop-shadow-xl relative z-10">{stats.avgCompletion}%</div>
                                        <div className="text-[11px] text-zinc-400 font-bold uppercase tracking-widest mt-2 relative z-10 text-center">Avg Completion</div>
                                    </div>
                                </div>
                            </div>
                        </PerformanceWidget>

                        {/* Widget 2: Productivity Stats */}
                        <PerformanceWidget
                            title="Productivity Metrics"
                            subtitle="Points & Tasks"
                            size={widgetStates.metrics}
                            onSizeChange={(s) => handleWidgetSizeChange('metrics', s)}
                            color="cyan"
                            variants={itemVariants}
                        >
                            <div className="flex flex-col h-full justify-center">
                                <div className="grid grid-cols-2 gap-4 h-full">
                                    <div className="bg-cyan-500/5 rounded-2xl p-4 border border-cyan-500/10 flex flex-col justify-center items-center relative overflow-hidden group hover:border-cyan-500/30 transition-all">
                                        <div className="absolute inset-0 bg-cyan-500/10 blur-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
                                        <div className="text-white text-5xl font-black leading-none drop-shadow-xl relative z-10">{teamPerformance?.totalPoints || 0}</div>
                                        <div className="text-[11px] text-zinc-400 font-bold uppercase tracking-widest mt-2 relative z-10 text-center">Total Points</div>
                                    </div>
                                    <div className="bg-blue-500/5 rounded-2xl p-4 border border-blue-500/10 flex flex-col justify-center items-center relative overflow-hidden group hover:border-blue-500/30 transition-all">
                                        <div className="absolute inset-0 bg-blue-500/10 blur-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
                                        <div className="text-white text-5xl font-black leading-none drop-shadow-xl relative z-10">{stats.totalCompletedTasks}</div>
                                        <div className="text-[11px] text-zinc-400 font-bold uppercase tracking-widest mt-2 relative z-10 text-center">Tasks Completed</div>
                                    </div>
                                </div>
                            </div>
                        </PerformanceWidget>
                    </motion.div>

                    {/* Rankings Table */}
                    <div className="bg-zinc-900 border border-white/5 rounded-3xl overflow-hidden shadow-2xl mt-8">
                        <div className="px-8 py-6 border-b border-white/5 flex items-center justify-between bg-zinc-900/50">
                            <div>
                                <h2 className="text-xl font-bold text-white flex items-center gap-3">
                                    <div className="p-2 rounded-lg bg-yellow-500/20 text-yellow-500"><Award size={20} /></div>
                                    Performance Rankings
                                </h2>
                                <p className="text-sm text-zinc-500 mt-1 ml-11">Individual performance breakdown</p>
                            </div>

                            <div className="flex gap-2">
                                <button onClick={() => setSortBy('points')} className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all border ${sortBy === 'points' ? 'bg-zinc-800 text-white border-white/10' : 'bg-transparent text-zinc-500 border-transparent hover:text-zinc-300'}`}>
                                    By Points
                                </button>
                                <button onClick={() => setSortBy('name')} className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all border ${sortBy === 'name' ? 'bg-zinc-800 text-white border-white/10' : 'bg-transparent text-zinc-500 border-transparent hover:text-zinc-300'}`}>
                                    By Name
                                </button>
                            </div>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-white/[0.02] border-b border-white/5">
                                        <th className="px-8 py-5 text-[11px] font-bold text-zinc-500 uppercase tracking-wider">Rank</th>
                                        <th className="px-6 py-5 text-[11px] font-bold text-zinc-500 uppercase tracking-wider">Team Member</th>
                                        <th className="px-6 py-5 text-[11px] font-bold text-zinc-500 uppercase tracking-wider text-center">Points</th>
                                        <th className="px-6 py-5 text-[11px] font-bold text-zinc-500 uppercase tracking-wider text-center">Tasks</th>
                                        <th className="px-6 py-5 text-[11px] font-bold text-zinc-500 uppercase tracking-wider text-center">Status</th>
                                        <th className="px-8 py-5 text-[11px] font-bold text-zinc-500 uppercase tracking-wider text-right">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {sortedIndividuals.map((member, index) => (
                                        <tr key={member._id} className="group hover:bg-white/[0.02] transition-colors">
                                            <td className="px-8 py-4">
                                                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-sm border ${index === 0 ? 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20' :
                                                    index === 1 ? 'bg-zinc-700/50 text-zinc-300 border-zinc-600/30' :
                                                        index === 2 ? 'bg-orange-700/20 text-orange-400 border-orange-600/30' :
                                                            'bg-zinc-800/30 text-zinc-500 border-white/5'
                                                    }`}>
                                                    {index + 1}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center text-white font-bold text-sm shadow-lg shadow-violet-500/20">
                                                        {member.firstName?.charAt(0)}{member.lastName?.charAt(0)}
                                                    </div>
                                                    <div>
                                                        <div className="font-bold text-white text-sm group-hover:text-violet-400 transition-colors">{member.firstName} {member.lastName}</div>
                                                        <div className="text-[11px] text-zinc-500 font-mono mt-0.5">{member.email}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <div className="font-black text-white">{member.totalPoints}</div>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <div className="text-zinc-400 text-sm font-medium">
                                                    <span className="text-white">{member.completedTasks}</span> / {member.activeTasks + member.completedTasks}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <span className={`px-3 py-1 rounded-lg text-[9px] uppercase font-black tracking-widest border ${(member.totalPoints || 0) >= (teamPerformance?.avgPoints || 0)
                                                    ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                                                    : 'bg-orange-500/10 text-orange-500 border-orange-500/20'
                                                    }`}>
                                                    {(member.totalPoints || 0) >= (teamPerformance?.avgPoints || 0) ? 'Top Tier' : 'Growing'}
                                                </span>
                                            </td>
                                            <td className="px-8 py-4 text-right">
                                                <button
                                                    onClick={() => {
                                                        setSelectedMember({
                                                            id: member._id,
                                                            name: `${member.firstName} ${member.lastName}`,
                                                            email: member.email,
                                                            totalPoints: member.totalPoints || 0,
                                                            completedTasks: 0,
                                                            totalTasks: member.activeTasks || 0,
                                                            completionRate: 0
                                                        });
                                                        setShowDetailModal(true);
                                                    }}
                                                    className="px-4 py-2 bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white rounded-xl transition-all border border-white/5 hover:border-white/20 text-xs font-bold uppercase tracking-wider"
                                                >
                                                    Details
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>


                    {/* Performance Detail Modal */}
                    <PerformanceDetailModal
                        employee={selectedMember}
                        isOpen={showDetailModal}
                        onClose={() => {
                            setShowDetailModal(false);
                            setSelectedMember(null);
                        }}
                    />
                </>
            )}
        </div>
    );
};

export default PerformanceTracking;

