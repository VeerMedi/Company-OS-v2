import React, { useState, useEffect } from 'react';
import {
    X,
    Trophy,
    Target,
    CheckCircle,
    Clock,
    Star,
    TrendingUp,
    Award,
    Activity,
    Zap,
    Users,
    Flame
} from 'lucide-react';
import api from '../utils/api';

const PerformanceDetailModal = ({ employee, isOpen, onClose }) => {
    const [performanceData, setPerformanceData] = useState(null);
    const [developerPerf, setDeveloperPerf] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('overview');
    const [error, setError] = useState(null);

    useEffect(() => {
        if (isOpen && employee) {
            console.log('[PerformanceDetailModal] Opening modal for employee:', employee);
            fetchDetailedPerformance();
        } else {
            // Reset loading state when modal closes
            setIsLoading(true);
            setPerformanceData(null);
            setDeveloperPerf(null);
        }
    }, [isOpen, employee]);

    // Lock body scroll when modal is open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isOpen]);

    const fetchDetailedPerformance = async () => {
        console.log('[PerformanceDetailModal] Fetching detailed performance for:', employee);
        setIsLoading(true);
        setError(null);
        try {
            // Set initial data from prop to ensure immediate display
            if (employee) {
                setPerformanceData(employee);
                setDeveloperPerf(employee);
            }

            const id = employee?.employeeId || employee?._id || employee?.id || employee?.userId;

            if (id) {
                const response = await api.get(`/performance/developer-performance/${id}`);
                console.log('[PerformanceDetailModal] Fetched detailed metrics:', response.data);

                if (response.data && response.data.data) {
                    const detailedData = response.data.data;
                    setPerformanceData(prev => ({ ...prev, ...detailedData }));
                    setDeveloperPerf(prev => ({ ...prev, ...detailedData }));
                } else if (response.data) {
                    setPerformanceData(prev => ({ ...prev, ...response.data }));
                    setDeveloperPerf(prev => ({ ...prev, ...response.data }));
                }
            }
        } catch (error) {
            console.error('[PerformanceDetailModal] Error fetching detailed performance:', error);
            // We don't set error state here to allow partial data display from 'employee' prop
        } finally {
            setIsLoading(false);
        }
    };

    if (!isOpen) return null;

    const renderProductivityBreakdown = () => {
        if (!performanceData && !employee) return null;

        const data = performanceData || employee;
        const metrics = data.metrics || {};
        const completionRate = metrics.completionRate || data.completionRate || 0;
        const onTimeRate = metrics.onTimeDeliveryRate || data.onTimeDeliveryRate || 0;
        const productivityScore = metrics.productivityScore || data.productivityScore || 0;

        const components = [
            {
                label: 'Task Completion',
                value: completionRate,
                weight: 40,
                color: 'blue',
                icon: CheckCircle,
                gradient: 'from-blue-500 via-indigo-500 to-blue-500'
            },
            {
                label: 'On-Time Delivery',
                value: onTimeRate,
                weight: 30,
                color: 'emerald',
                icon: Clock,
                gradient: 'from-emerald-500 via-teal-500 to-emerald-500'
            },
            {
                label: 'Productivity Score',
                value: productivityScore,
                weight: 100,
                color: 'violet',
                icon: Zap,
                gradient: 'from-violet-500 via-purple-500 to-violet-500'
            }
        ];

        return (
            <div className="space-y-4">
                {/* Hero Score Card */}
                <div className="relative overflow-hidden rounded-2xl bg-[#09090b] border border-white/10 p-5 group">
                    <div className="absolute inset-0 bg-gradient-to-br from-violet-500/10 via-transparent to-transparent opacity-50 group-hover:opacity-100 transition-opacity duration-700" />
                    <div className="absolute -right-10 -top-10 h-40 w-40 bg-violet-500/20 rounded-full blur-3xl group-hover:bg-violet-500/30 transition-colors duration-700" />

                    <div className="relative flex items-center justify-between z-10">
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <span className="flex h-2 w-2 rounded-full bg-violet-500 animate-pulse shadow-[0_0_8px_rgba(139,92,246,0.6)]"></span>
                                <p className="text-violet-200 text-xs font-bold uppercase tracking-widest">Overall Score</p>
                            </div>
                            <div className="flex items-baseline gap-1">
                                <p className="text-5xl font-black text-white tracking-tighter shadow-black drop-shadow-2xl">{productivityScore}</p>
                                <span className="text-xl font-bold text-violet-400">%</span>
                            </div>
                        </div>
                        <div className="h-14 w-14 rounded-full bg-violet-500/10 border border-violet-500/20 flex items-center justify-center shadow-[0_0_15px_rgba(139,92,246,0.3)] backdrop-blur-md">
                            <Trophy className="h-7 w-7 text-violet-400" />
                        </div>
                    </div>

                    {/* Decorative bottom bar */}
                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-violet-500 via-purple-500 to-indigo-500 opacity-50" />
                </div>

                {/* Metrics Breakdown */}
                <div className="grid gap-3">
                    {components.map((component, index) => {
                        const Icon = component.icon;
                        const contribution = Math.round((component.value * component.weight) / 100);

                        return (
                            <div key={index} className="relative bg-zinc-900/40 rounded-xl p-4 border border-white/5 hover:border-white/10 transition-all hover:bg-zinc-900/60 group">
                                <div className="flex items-center justify-between mb-3">
                                    <div className="flex items-center gap-3">
                                        <div className={`h-9 w-9 rounded-lg bg-${component.color}-500/10 flex items-center justify-center border border-${component.color}-500/20 shadow-[0_0_10px_rgba(0,0,0,0.2)] group-hover:scale-105 transition-transform`}>
                                            <Icon className={`h-4.5 w-4.5 text-${component.color}-400`} />
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-white group-hover:text-${component.color}-200 transition-colors">{component.label}</p>
                                            <div className="flex items-center gap-1.5 mt-0.5">
                                                <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400 border border-white/5">
                                                    {component.weight}% Weight
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-xl font-black text-white">{component.value}%</p>
                                        <p className={`text-[10px] font-bold text-${component.color}-400`}>+{contribution} pts</p>
                                    </div>
                                </div>

                                {/* Unique Glowing Progress Bar */}
                                <div className="relative w-full h-2.5 bg-[#0a0a0c] rounded-full overflow-hidden shadow-inner border border-white/5">
                                    {/* Animated Glow Gradient Background */}
                                    <div
                                        className={`absolute top-0 left-0 h-full rounded-full bg-gradient-to-r ${component.gradient} shadow-[0_0_12px_rgba(0,0,0,0.5)] transition-all duration-1000 ease-out`}
                                        style={{ width: `${component.value}%` }}
                                    >
                                        {/* Shimmer Effect */}
                                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full animate-[shimmer_2s_infinite]" />
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    };

    const renderStreakSection = () => {
        const data = performanceData || employee;
        const streak = data?.streak;

        if (!streak || (!streak.current && !streak.currentStreak)) return null;

        const currentStreak = streak.current || streak.currentStreak || 0;
        const longestStreak = streak.longest || streak.longestStreak || 0;

        return (
            <div className="bg-gradient-to-br from-orange-400 to-red-500 rounded-xl p-4 text-white shadow-lg">
                <div className="flex items-center justify-between">
                    <div>
                        <div className="flex items-center gap-1.5 mb-1">
                            <Flame className="h-4 w-4" />
                            <p className="text-xs font-bold opacity-90 uppercase tracking-wider">Performance Streak</p>
                        </div>
                        <p className="text-4xl font-black mb-0.5">{currentStreak}</p>
                        <p className="text-xs opacity-90 font-medium">days in a row</p>
                    </div>
                    <div className="text-right">
                        <div className="bg-white/20 rounded-lg p-3 backdrop-blur-sm">
                            <p className="text-[10px] font-bold opacity-75 mb-0.5 uppercase">Best Streak</p>
                            <p className="text-2xl font-bold">{longestStreak}</p>
                            <p className="text-[10px] opacity-75 font-medium">days</p>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    const renderDailyTrend = () => {
        if (!developerPerf?.dailyHistory || developerPerf.dailyHistory.length === 0) return null;

        // Get last 7 days
        const last7Days = developerPerf.dailyHistory.slice(-7);
        const maxTasks = Math.max(...last7Days.map(d => d.tasksCompleted), 1);

        return (
            <div className="bg-zinc-800/30 rounded-xl p-4 border border-white/5">
                <h4 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-blue-400" />
                    Last 7 Days Activity
                </h4>
                <div className="flex items-end justify-between gap-2 h-32">
                    {last7Days.map((day, i) => {
                        const height = (day.tasksCompleted / maxTasks) * 100;
                        const date = new Date(day.date);
                        const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });

                        return (
                            <div key={i} className="flex-1 flex flex-col items-center gap-1.5 group">
                                <div className="relative w-full bg-zinc-700/30 rounded-t-lg overflow-hidden" style={{ height: `${Math.max(height, 10)}%` }}>
                                    <div className={`absolute bottom-0 left-0 right-0 top-0 transition-all duration-500 ${day.tasksCompleted > 0 ? 'bg-gradient-to-t from-blue-600 to-blue-400 opacity-80 group-hover:opacity-100' : 'bg-white/5'
                                        }`} />
                                    {day.tasksCompleted > 0 && (
                                        <div className="absolute top-0 inset-x-0 flex justify-center -mt-8 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <div className="bg-zinc-900 text-white text-[10px] px-2 py-0.5 rounded border border-white/10 shadow-xl">
                                                {day.tasksCompleted}
                                            </div>
                                        </div>
                                    )}
                                </div>
                                <p className="text-[10px] font-medium text-zinc-500 group-hover:text-zinc-300 transition-colors uppercase">{dayName}</p>
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    };

    const renderTaskStatistics = () => {
        const data = performanceData || employee;
        const taskStats = data?.taskStats || {};
        const pointsStats = data?.pointsStats || {};

        const stats = [
            {
                label: 'Total Tasks',
                value: taskStats.total || data?.totalTasks || 0,
                icon: Target,
                color: 'blue',
                gradient: 'from-blue-500 to-indigo-600'
            },
            {
                label: 'Completed',
                value: taskStats.completed || data?.completedTasks || 0,
                icon: CheckCircle,
                color: 'emerald',
                gradient: 'from-emerald-500 to-teal-600'
            },
            {
                label: 'In Progress',
                value: taskStats.inProgress || data?.inProgressTasks || 0,
                icon: Activity,
                color: 'purple',
                gradient: 'from-purple-500 to-pink-600'
            },
            {
                label: 'Points Earned',
                value: pointsStats.totalEarned || data?.totalPointsEarned || data?.totalPoints || 0,
                icon: Star,
                color: 'amber',
                gradient: 'from-amber-500 to-orange-600'
            }
        ];

        return (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {stats.map((stat, index) => {
                    const Icon = stat.icon;
                    return (
                        <div key={index} className="group relative bg-zinc-900/40 backdrop-blur-xl border border-white/5 rounded-2xl p-4 overflow-hidden hover:border-white/10 transition-all duration-300 hover:shadow-2xl hover:shadow-black/50 hover:bg-zinc-900/60">
                            {/* Ambient Glow */}
                            <div className={`absolute -right-10 -top-10 h-32 w-32 rounded-full bg-gradient-to-br ${stat.gradient} opacity-0 group-hover:opacity-20 blur-3xl transition-opacity duration-500`} />

                            <div className="relative z-10 flex flex-col h-full justify-between">
                                <div className="flex justify-between items-start mb-3">
                                    <div className={`p-2 rounded-xl bg-${stat.color}-500/10 text-${stat.color}-400 ring-1 ring-${stat.color}-500/20 shadow-[0_0_15px_rgba(0,0,0,0.3)] group-hover:scale-110 transition-transform duration-300`}>
                                        <Icon className="h-5 w-5" />
                                    </div>
                                    {/* Tiny spark animation */}
                                    <div className={`h-1.5 w-1.5 rounded-full bg-${stat.color}-400 shadow-[0_0_8px_currentColor] opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
                                </div>

                                <div>
                                    <p className="text-3xl font-black text-white tracking-tight drop-shadow-lg">{stat.value}</p>
                                    <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mt-1 group-hover:text-zinc-400 transition-colors">{stat.label}</p>
                                </div>
                            </div>

                            {/* Glass reflection */}
                            <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                        </div>
                    );
                })}
            </div>
        );
    };

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
            <div className="bg-[#09090b] border border-white/10 rounded-2xl max-w-3xl w-full max-h-[80vh] overflow-hidden shadow-2xl flex flex-col relative m-auto">
                {/* Header */}
                <div className="bg-zinc-900/50 backdrop-blur-xl border-b border-white/5 px-6 py-5 flex justify-between items-center z-10 shrink-0">
                    <div className="flex items-center gap-5">
                        <div className="relative">
                            {(employee?.avatar || employee?.image || employee?.userId?.avatar || employee?.user?.avatar) ? (
                                <img
                                    src={employee?.avatar || employee?.image || employee?.userId?.avatar || employee?.user?.avatar}
                                    alt={employee?.name || employee?.userId?.name || employee?.user?.name || 'Employee'}
                                    className="h-16 w-16 rounded-2xl object-cover border border-white/10 shadow-inner"
                                />
                            ) : (
                                <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 border border-white/10 flex items-center justify-center shadow-inner">
                                    <span className="text-2xl font-black text-white/90 drop-shadow-md">
                                        {(employee?.name || employee?.userId?.name || employee?.user?.name || '??').split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                                    </span>
                                </div>
                            )}
                            <div className="absolute -bottom-1 -right-1 h-5 w-5 bg-emerald-500 rounded-full border-4 border-[#09090b] shadow-sm" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-white tracking-tight">{employee?.name || employee?.userId?.name || employee?.user?.name || 'Unknown Employee'}</h2>
                            <p className="text-zinc-500 text-sm font-medium">{employee?.email || employee?.userId?.email || employee?.user?.email || 'No email provided'}</p>
                            {(performanceData?.metrics || employee?.metrics || employee?.productivityScore) && (
                                <div className="flex items-center gap-3 mt-2">
                                    <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/20 shadow-sm">
                                        <Zap className="w-3 h-3 text-blue-400" />
                                        <span className="text-xs font-bold text-blue-400">
                                            {performanceData?.metrics?.productivityScore || employee?.productivityScore || employee?.metrics?.productivityScore || 0}% Score
                                        </span>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-zinc-500 hover:text-white hover:bg-white/5 rounded-xl p-2.5 transition-all"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                {/* Tabs */}
                <div className="border-b border-white/5 bg-zinc-900/30 px-6">
                    <nav className="flex space-x-6">
                        {['overview', 'breakdown', 'trends'].map((tab) => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={`py-4 text-sm font-bold capitalize transition-all relative ${activeTab === tab
                                    ? 'text-white'
                                    : 'text-zinc-500 hover:text-zinc-300'
                                    }`}
                            >
                                {tab}
                                {activeTab === tab && (
                                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-t-full" />
                                )}
                            </button>
                        ))}
                    </nav>
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto flex-1 bg-[#09090b]">
                    {(isLoading && !performanceData && !employee) ? (
                        <div className="flex flex-col justify-center items-center h-full min-h-[300px]">
                            <div className="animate-spin rounded-full h-10 w-10 border-2 border-zinc-800 border-t-blue-500 mb-4"></div>
                            <p className="text-zinc-500 text-sm font-medium animate-pulse">Analyzing performance metrics...</p>
                        </div>
                    ) : error && !performanceData ? (
                        <div className="flex flex-col justify-center items-center h-full min-h-[300px]">
                            <div className="bg-red-500/10 p-4 rounded-full mb-4 ring-1 ring-red-500/20">
                                <Activity className="h-8 w-8 text-red-500" />
                            </div>
                            <div className="text-white text-lg font-bold mb-2">Failed to load data</div>
                            <p className="text-zinc-500 text-sm mb-6 max-w-xs text-center">{error}</p>
                            <button
                                onClick={fetchDetailedPerformance}
                                className="px-5 py-2.5 bg-white text-black rounded-xl hover:bg-zinc-200 transition-colors font-bold text-sm"
                            >
                                Retry Connection
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
                            {activeTab === 'overview' && (
                                <div className="space-y-8">
                                    {renderTaskStatistics()}

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        {/* Streak Section */}
                                        {isLoading && !developerPerf?.streak ? (
                                            <div className="bg-zinc-900/40 rounded-xl p-4 border border-white/5 animate-pulse h-[140px]">
                                                <div className="h-4 bg-white/10 rounded w-1/3 mb-4"></div>
                                                <div className="h-8 bg-white/10 rounded w-1/4 mb-2"></div>
                                                <div className="h-3 bg-white/5 rounded w-1/2"></div>
                                            </div>
                                        ) : developerPerf?.streak && (
                                            <div>
                                                <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-wider mb-4">Current Streak</h3>
                                                {renderStreakSection()}
                                            </div>
                                        )}

                                        {/* Activity Graph Preview */}
                                        {isLoading && !developerPerf?.dailyHistory ? (
                                            <div className="bg-zinc-900/40 rounded-xl p-4 border border-white/5 animate-pulse h-[140px]">
                                                <div className="h-4 bg-white/10 rounded w-1/3 mb-4"></div>
                                                <div className="flex items-end gap-2 h-24">
                                                    {[...Array(7)].map((_, i) => (
                                                        <div key={i} className="flex-1 bg-white/5 rounded-t-lg" style={{ height: `${Math.random() * 60 + 20}%` }}></div>
                                                    ))}
                                                </div>
                                            </div>
                                        ) : (developerPerf?.dailyHistory?.length > 0) && (
                                            <div>
                                                <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-wider mb-4">Activity Snapshot</h3>
                                                {renderDailyTrend()}
                                            </div>
                                        )}
                                    </div>

                                    {(isLoading && !performanceData?.recentCompletedTasks) ? (
                                        <div>
                                            <div className="flex items-center justify-between mb-4">
                                                <div className="h-4 bg-white/10 rounded w-32 animate-pulse"></div>
                                                <div className="h-5 bg-white/10 rounded w-20 animate-pulse"></div>
                                            </div>
                                            <div className="space-y-3">
                                                {[...Array(3)].map((_, i) => (
                                                    <div key={i} className="bg-zinc-900/40 rounded-xl p-3 border border-white/5 animate-pulse flex justify-between">
                                                        <div className="flex items-center gap-3">
                                                            <div className="h-8 w-8 bg-white/10 rounded-lg"></div>
                                                            <div className="space-y-2">
                                                                <div className="h-3 bg-white/10 rounded w-32"></div>
                                                                <div className="h-2 bg-white/5 rounded w-24"></div>
                                                            </div>
                                                        </div>
                                                        <div className="h-4 bg-white/10 rounded w-10"></div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ) : (performanceData?.recentCompletedTasks?.length > 0 ||
                                        developerPerf?.recentTasks?.length > 0 ||
                                        performanceData?.recentTasks?.length > 0 ||
                                        performanceData?.tasks?.length > 0
                                    ) && (
                                        <div>
                                            <div className="flex items-center justify-between mb-4">
                                                <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-wider">Recent Activity</h3>
                                                <span className="text-xs font-medium text-zinc-600 px-2 py-1 bg-zinc-900 rounded-lg border border-zinc-800">Last 5 Tasks</span>
                                            </div>
                                            <div className="space-y-3">
                                                {(performanceData?.recentCompletedTasks || developerPerf?.recentTasks || performanceData?.recentTasks || performanceData?.tasks?.slice(0, 5))?.slice(0, 5).map((task, i) => (
                                                    <div key={i} className="group bg-zinc-900/50 rounded-xl p-3 border border-white/5 hover:border-white/10 transition-all hover:bg-zinc-900">
                                                        <div className="flex justify-between items-start">
                                                            <div className="flex items-start gap-3">
                                                                <div className="h-8 w-8 rounded-lg bg-zinc-800 flex items-center justify-center border border-white/5 group-hover:border-blue-500/30 transition-colors">
                                                                    <CheckCircle className="w-4 h-4 text-zinc-600 group-hover:text-blue-400 transition-colors" />
                                                                </div>
                                                                <div>
                                                                    <p className="font-bold text-zinc-200 group-hover:text-white transition-colors text-xs">{task.title}</p>
                                                                    <p className="text-[10px] text-zinc-500 mt-0.5 flex items-center gap-1.5">
                                                                        <span className="w-1 h-1 rounded-full bg-zinc-700"></span>
                                                                        {task.project || 'No project'}
                                                                    </p>
                                                                </div>
                                                            </div>
                                                            <div className="flex flex-col items-end gap-1">
                                                                <span className="text-[10px] font-bold text-zinc-500 font-mono">{task.points || 0} pts</span>
                                                                <span className={`px-1.5 py-0.5 rounded-md text-[9px] font-bold uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/20`}>
                                                                    Done
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {activeTab === 'breakdown' && (
                                <div>
                                    <h3 className="text-lg font-bold text-white mb-6">Productivity Score Formula</h3>
                                    {renderProductivityBreakdown()}
                                </div>
                            )}

                            {activeTab === 'trends' && (
                                <div className="space-y-6">
                                    <h3 className="text-lg font-bold text-white">Performance Trends</h3>
                                    {renderDailyTrend()}

                                    {developerPerf?.monthlyStats && (
                                        <div className="bg-zinc-800/30 rounded-2xl p-6 border border-white/5">
                                            <h4 className="text-md font-bold text-zinc-300 mb-6">This Month Statistics</h4>
                                            <dl className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                <div className="text-center p-6 bg-blue-500/5 rounded-xl border border-blue-500/10 hover:border-blue-500/30 transition-all">
                                                    <dt className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">Tasks Ratio</dt>
                                                    <dd className="text-3xl font-black text-blue-400">
                                                        {developerPerf.monthlyStats.tasksCompletedThisMonth}<span className="text-zinc-600 text-lg">/</span>{developerPerf.monthlyStats.tasksAssignedThisMonth}
                                                    </dd>
                                                </div>
                                                <div className="text-center p-6 bg-purple-500/5 rounded-xl border border-purple-500/10 hover:border-purple-500/30 transition-all">
                                                    <dt className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">Points Earned</dt>
                                                    <dd className="text-3xl font-black text-purple-400">
                                                        {developerPerf.monthlyStats.pointsEarnedThisMonth}
                                                    </dd>
                                                </div>
                                                <div className="text-center p-6 bg-emerald-500/5 rounded-xl border border-emerald-500/10 hover:border-emerald-500/30 transition-all">
                                                    <dt className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">On-Time Completion</dt>
                                                    <dd className="text-3xl font-black text-emerald-400">
                                                        {developerPerf.monthlyStats.onTimeCompletionsThisMonth}
                                                    </dd>
                                                </div>
                                            </dl>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="border-t border-white/10 px-6 py-4 bg-zinc-900/50 backdrop-blur-xl flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="px-6 py-2.5 bg-white text-black hover:bg-zinc-200 rounded-xl font-bold text-sm transition-all shadow-lg hover:shadow-xl hover:scale-[1.02]"
                    >
                        Close Details
                    </button>
                </div>
            </div>
        </div>
    );
};


export default PerformanceDetailModal;
