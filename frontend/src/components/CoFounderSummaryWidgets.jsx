import React, { useState, useEffect, useCallback } from 'react';
import { motion, LayoutGroup } from 'framer-motion';
import {
    Users,
    Briefcase,
    Clock,
    CheckCircle,
    Calendar,
    DollarSign,
    Building2,
    TrendingUp,
    Target,
    UserCheck,
    CreditCard,
    Trophy,
    Plus,
    X
} from 'lucide-react';
import {
    AreaChart,
    Area,
    BarChart,
    Bar,
    PieChart,
    Pie,
    Cell,
    ResponsiveContainer,
    XAxis,
    YAxis,
    Tooltip,
    CartesianGrid
} from 'recharts';
import { formatDate } from '../utils/helpers';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import { showToast as toast } from '../utils/toast';

// Helper for formatting revenue
const formatRevenue = (amount) => {
    if (!amount) return '₹0';
    if (amount >= 10000000) return `₹${(amount / 10000000).toFixed(2)}Cr`;
    if (amount >= 100000) return `₹${(amount / 100000).toFixed(2)}L`;
    return `₹${amount.toLocaleString('en-IN')}`;
};

// Minimal Tooltip Component
const MinimalTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-zinc-900/95 backdrop-blur-md px-4 py-3 rounded-xl border border-white/10 shadow-2xl">
                {label && (
                    <p className="text-zinc-400 text-xs font-medium tracking-wide mb-2">
                        {label}
                    </p>
                )}
                {payload.map((item, index) => (
                    <div key={index} className="flex items-center gap-2">
                        <div
                            className="w-2 h-2 rounded-full"
                            style={{ backgroundColor: item.color || item.fill }}
                        />
                        <span className="text-white font-semibold text-sm">
                            {item.name || 'Value'}: {typeof item.value === 'number' ? item.value.toLocaleString() : item.value}
                        </span>
                    </div>
                ))}
            </div>
        );
    }
    return null;
};

// Widget Header Component
const WidgetHeader = ({ title, subtitle }) => (
    <div className="flex items-start justify-between mb-3 z-10 relative">
        <div>
            <h3 className="text-transparent bg-clip-text bg-gradient-to-r from-white to-zinc-400 font-bold text-sm tracking-wide">{title}</h3>
            {subtitle && <p className="text-zinc-500 text-[10px] mt-0.5 font-medium tracking-wider uppercase">{subtitle}</p>}
        </div>
    </div>
);

// Widget Component with Drag Handle (EXACT COPY FROM HR DASHBOARD)
const Widget = ({
    id,
    title,
    subtitle,
    size,
    onSizeChange,
    children,
}) => {
    const [isDragging, setIsDragging] = useState(false);
    const [dragStartY, setDragStartY] = useState(0);
    const [initialSize, setInitialSize] = useState(size);

    const getGridClass = () => {
        switch (size) {
            case 'small': return 'col-span-1 row-span-1 h-[220px]';
            case 'medium': return 'col-span-1 md:col-span-2 lg:col-span-2 row-span-1 h-[220px]';
            case 'large': return 'col-span-1 md:col-span-2 lg:col-span-2 row-span-2 h-[464px]';
            default: return 'col-span-1 h-[220px]';
        }
    };

    const handleDragStart = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
        setDragStartY(e.clientY || e.touches?.[0]?.clientY || 0);
        setInitialSize(size);
        document.body.style.userSelect = 'none';
        document.body.style.webkitUserSelect = 'none';
    };

    const handleDragMove = (e) => {
        if (!isDragging) return;

        e.preventDefault();
        const currentY = e.clientY || e.touches?.[0]?.clientY || 0;
        const deltaY = currentY - dragStartY;

        if (deltaY > 50 && initialSize === 'small') {
            onSizeChange(id, 'medium');
            setInitialSize('medium');
            setDragStartY(currentY);
        } else if (deltaY > 50 && initialSize === 'medium') {
            onSizeChange(id, 'large');
            setInitialSize('large');
            setDragStartY(currentY);
        } else if (deltaY < -50 && initialSize === 'large') {
            onSizeChange(id, 'medium');
            setInitialSize('medium');
            setDragStartY(currentY);
        } else if (deltaY < -50 && initialSize === 'medium') {
            onSizeChange(id, 'small');
            setInitialSize('small');
            setDragStartY(currentY);
        }
    };

    const handleDragEnd = () => {
        setIsDragging(false);
        document.body.style.userSelect = '';
        document.body.style.webkitUserSelect = '';
    };

    useEffect(() => {
        if (isDragging) {
            window.addEventListener('mousemove', handleDragMove);
            window.addEventListener('mouseup', handleDragEnd);
            window.addEventListener('touchmove', handleDragMove);
            window.addEventListener('touchend', handleDragEnd);

            return () => {
                window.removeEventListener('mousemove', handleDragMove);
                window.removeEventListener('mouseup', handleDragEnd);
                window.removeEventListener('touchmove', handleDragMove);
                window.removeEventListener('touchend', handleDragEnd);
            };
        }
    }, [isDragging, dragStartY, initialSize]);

    return (
        <motion.div
            layout
            className={`relative rounded-[24px] bg-gradient-to-b from-[#18181b] to-[#09090b] border border-white/5 shadow-2xl overflow-hidden group outline-none focus:outline-none ${getGridClass()}`}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
        >
            <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/0 to-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />

            <motion.div layout className="relative p-6 h-full flex flex-col">
                <WidgetHeader title={title} subtitle={subtitle} />
                <div className="flex-1 min-h-0 relative flex flex-col z-0">
                    {children}
                </div>
            </motion.div>

            {/* Draggable Handle at Bottom-Right Corner */}
            <div
                className={`absolute bottom-1 right-1 w-8 h-8 flex items-center justify-center cursor-ns-resize z-20 opacity-0 hover:opacity-100 transition-all duration-200 ${isDragging ? 'opacity-100 scale-110' : ''} select-none`}
                onMouseDown={handleDragStart}
                onTouchStart={handleDragStart}
                style={{ userSelect: 'none', WebkitUserSelect: 'none' }}
            >
                <div className="flex flex-col gap-[2px] items-end justify-center p-1">
                    <div className="flex gap-[2px]">
                        <div className={`w-[3px] h-[3px] rounded-full transition-all ${isDragging ? 'bg-blue-400' : 'bg-white/50'}`} />
                    </div>
                    <div className="flex gap-[2px]">
                        <div className={`w-[3px] h-[3px] rounded-full transition-all ${isDragging ? 'bg-blue-400' : 'bg-white/50'}`} />
                        <div className={`w-[3px] h-[3px] rounded-full transition-all ${isDragging ? 'bg-blue-400' : 'bg-white/50'}`} />
                    </div>
                    <div className="flex gap-[2px]">
                        <div className={`w-[3px] h-[3px] rounded-full transition-all ${isDragging ? 'bg-blue-400' : 'bg-white/50'}`} />
                        <div className={`w-[3px] h-[3px] rounded-full transition-all ${isDragging ? 'bg-blue-400' : 'bg-white/50'}`} />
                        <div className={`w-[3px] h-[3px] rounded-full transition-all ${isDragging ? 'bg-blue-400' : 'bg-white/50'}`} />
                    </div>
                </div>
            </div>
        </motion.div>
    );
};

// Main Component
const CoFounderSummaryWidgets = ({ projects, salesData, attendanceSummary, payrollSummary }) => {
    const { user } = useAuth();

    // Widget States with localStorage persistence
    const [widgetStates, setWidgetStates] = useState(() => {
        const defaults = {
            projects: 'medium',
            revenue: 'medium',
            attendance: 'small',
            leaves: 'medium',
            companies: 'small',
            leads: 'small',
            payroll: 'small',
            performance: 'small'
        };

        const saved = localStorage.getItem('cofounderDashboardWidgetSizes_v5');
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                return { ...defaults, ...parsed };
            } catch (e) {
                // Silently fail and use defaults
            }
        }
        return defaults;
    });

    // Create Task Modal State
    const [showCreateTaskModal, setShowCreateTaskModal] = useState(false);
    const [showReviewTasksModal, setShowReviewTasksModal] = useState(false);
    const [taskViewMode, setTaskViewMode] = useState('create-project'); // 'create-project', 'create-other', 'review'
    const [assignedTasks, setAssignedTasks] = useState([]);
    const [loadingTasks, setLoadingTasks] = useState(false);
    const [expandedTaskId, setExpandedTaskId] = useState(null);
    const [taskType, setTaskType] = useState('project'); // 'project' or 'other'
    const [managers, setManagers] = useState([]);
    const [projectsList, setProjectsList] = useState([]);
    const [newExecutiveTask, setNewExecutiveTask] = useState({
        description: '',
        assignedTo: '',
        assignedToType: '',
        projectId: '',
        deadline: ''
    });
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        localStorage.setItem('cofounderDashboardWidgetSizes_v5', JSON.stringify(widgetStates));
    }, [widgetStates]);

    // Fetch Managers/HR and Projects
    useEffect(() => {
        const fetchData = async () => {
            try {
                const [usersRes, projectsRes] = await Promise.all([
                    api.get('/users'),
                    api.get('/projects')
                ]);

                const users = usersRes.data.data?.users || usersRes.data.users || usersRes.data || [];
                const managersAndHR = Array.isArray(users) ? users.filter(
                    user => user.role === 'manager' || user.role === 'hr'
                ) : [];
                setManagers(managersAndHR);
                setProjectsList(projectsRes.data.data || projectsRes.data || []);
            } catch (error) {
                console.error('Error fetching data:', error);
            }
        };

        if (showCreateTaskModal) {
            fetchData();
        }
    }, [showCreateTaskModal]);

    // Fetch All Assigned Tasks
    const fetchAssignedTasks = async () => {
        setLoadingTasks(true);
        try {
            const response = await api.get('/executive-tasks/all');
            setAssignedTasks(response.data.data || []);
        } catch (error) {
            console.error('Error fetching assigned tasks:', error);
            toast.error('Failed to load assigned tasks');
        } finally {
            setLoadingTasks(false);
        }
    };

    // Handle Create Executive Task
    const handleCreateExecutiveTask = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            await api.post('/executive-tasks', newExecutiveTask);

            toast.success('Task assigned successfully!');
            setShowCreateTaskModal(false);
            setTaskType('project');
            setNewExecutiveTask({
                description: '',
                assignedTo: '',
                assignedToType: '',
                projectId: '',
                deadline: ''
            });
        } catch (error) {
            console.error('Error creating task:', error);
            toast.error('Failed to create task');
        } finally {
            setLoading(false);
        }
    };

    const handleWidgetSizeChange = (id, newSize) => {
        setWidgetStates(prev => ({ ...prev, [id]: newSize }));
    };

    // ========== DATA PREPARATION WITH FALLBACKS ==========

    // Projects Data - use actual data or fallback to empty array
    const projectsData = projects && projects.length > 0 ? projects : [];

    // Revenue Data - use salesData or fallback
    const revenueData = salesData?.revenue || {
        total: 0,
        target: 0,
        achieved: 0,
        trend: []
    };

    // Attendance Data - use attendanceSummary or fallback
    const attendanceData = attendanceSummary && Object.keys(attendanceSummary).length > 0 ? {
        present: attendanceSummary.present || 0,
        totalEmployees: attendanceSummary.totalEmployees || 0,
        percentage: attendanceSummary.percentage || 0,
        trend: attendanceSummary.trend || []
    } : {
        present: 0,
        totalEmployees: 0,
        percentage: 0,
        trend: []
    };

    // Leaves Data - placeholder until proper API integration
    const leavesData = [];

    // Companies Data - use salesData or fallback
    const companiesData = salesData?.companies || {
        total: 0,
        approved: 0,
        pending: 0,
        distribution: []
    };

    // Leads Data - use salesData or fallback
    const leadsData = salesData?.leads || {
        total: 0,
        active: 0,
        won: 0,
        lost: 0,
        funnel: []
    };

    // Payroll Data - use payrollSummary or fallback
    const payrollData = payrollSummary || {
        totalGrossSalary: 0,
        totalNetSalary: 0,
        pendingCount: 0,
        totalEmployees: 0,
        status: {
            pending: 0,
            paid: 0
        }
    };

    // Performance Data - placeholder until proper API integration
    const performanceData = {
        topPerformers: [],
        avgProductivity: 0,
        topDepartment: 'N/A',
        weeklyTrend: []
    };

    // Calculate metrics
    const projectStats = React.useMemo(() => {
        const total = projectsData.length;
        const inProgress = projectsData.filter(p => p.status === 'in-progress').length;
        const completed = projectsData.filter(p => p.status === 'completed').length;
        const onHold = projectsData.filter(p => p.status === 'on-hold').length;

        // Calculate Due Soon (next 7 days)
        const now = new Date();
        const dueSoon = projectsData.filter(p => {
            if (p.status === 'completed') return false;
            const deadline = new Date(p.deadline);
            const diffTime = deadline - now;
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            return diffDays >= 0 && diffDays <= 7;
        }).length;

        return { total, inProgress, completed, onHold, dueSoon };
    }, [projectsData]);

    const projectChartData = [
        { name: 'In Progress', value: projectStats.inProgress, color: '#ffffff' },
        { name: 'Completed', value: projectStats.completed, color: '#a1a1aa' },
        { name: 'On Hold', value: projectStats.onHold, color: '#52525b' }
    ];

    return (
        <div className="p-2">
            <div className="mb-8 flex justify-between items-center px-2">
                <div>
                    <h1 className="text-3xl font-bold text-white tracking-tight drop-shadow-lg">Summary</h1>
                    <p className="text-zinc-500 text-sm mt-1">{formatDate(new Date())}</p>
                </div>
                <div className="flex items-center space-x-3">
                    <div className="flex items-center space-x-2 bg-black/40 px-3 py-1.5 rounded-full border border-white/5 backdrop-blur-sm">
                        <span className="relative flex h-2.5 w-2.5">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                        </span>
                        <span className="text-xs font-mono text-zinc-300 font-medium tracking-wide">LIVE UPDATES</span>
                    </div>
                    <button
                        onClick={() => setShowCreateTaskModal(true)}
                        className="flex items-center space-x-2 px-4 py-2 bg-white text-black rounded-full font-semibold text-sm hover:bg-white/90 transition-all duration-300 shadow-[0_0_20px_rgba(255,255,255,0.3)] hover:shadow-[0_0_30px_rgba(255,255,255,0.5)]"
                    >
                        <Plus className="h-4 w-4" />
                        <span>Create Task</span>
                    </button>
                </div>
            </div>

            <LayoutGroup>
                <motion.div layout className="grid grid-cols-1 md:grid-cols-4 gap-6 auto-rows-min grid-flow-dense pb-10">

                    {/* Widget 1: Projects */}
                    <Widget id="projects" title="Projects" subtitle="Active Pipeline" size={widgetStates.projects} onSizeChange={handleWidgetSizeChange}>
                        {widgetStates.projects === 'small' ? (
                            <div className="flex flex-col justify-center h-full relative">
                                <div className="text-white text-5xl font-bold tracking-tighter drop-shadow-md -mt-10">{projectStats.total}</div>
                                <div className="text-zinc-500 text-xs mt-2">Total Projects</div>

                                {/* Mini Stats - Right Corner */}
                                <div className="absolute top-0 right-0 flex gap-2">
                                    <div className="text-center bg-white/5 rounded-lg px-2 py-1.5 border border-white/10">
                                        <div className="text-white text-base font-bold">{projectStats.inProgress}</div>
                                        <div className="text-zinc-500 text-[8px] uppercase tracking-wider">Active</div>
                                    </div>
                                    <div className="text-center bg-emerald-500/10 rounded-lg px-2 py-1.5 border border-emerald-500/20">
                                        <div className="text-emerald-400 text-base font-bold">{projectStats.completed}</div>
                                        <div className="text-emerald-600 text-[8px] uppercase tracking-wider">Done</div>
                                    </div>
                                </div>

                                {/* Progress Bar */}
                                <div className="absolute bottom-1 left-0 right-0">
                                    <div className="h-5 bg-zinc-800/50 rounded-full overflow-hidden backdrop-blur-sm">
                                        <div
                                            className="h-full bg-gradient-to-r from-white via-zinc-300 to-zinc-400 rounded-full transition-all duration-1000 shadow-[0_0_10px_rgba(255,255,255,0.3)]"
                                            style={{ width: `${(projectStats.completed / projectStats.total) * 100}%` }}
                                        ></div>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="flex flex-col h-full">
                                <div className="relative flex justify-center items-center mb-0 min-h-[50px]">
                                    <div className="flex flex-col items-center -translate-y-6">
                                        <div className="text-white text-6xl font-bold tracking-tighter drop-shadow-[0_0_15px_rgba(255,255,255,0.4)]">{projectStats.total}</div>
                                        <div className="text-zinc-500 text-[10px] uppercase tracking-widest mt-0 font-bold">Total Projects</div>
                                    </div>
                                    <div className="absolute right-0 top-0 -mt-6 flex flex-col items-end gap-1.5">
                                        <div className="flex items-center gap-1.5 bg-zinc-800/80 rounded-md px-2 py-1 border border-white/10 shadow-lg backdrop-blur-sm">
                                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_6px_rgba(16,185,129,0.5)]"></div>
                                            <div className="text-white text-[10px] font-bold">{projectStats.inProgress} Active</div>
                                        </div>
                                        <div className="flex items-center gap-1.5 bg-rose-500/10 rounded-md px-2 py-1 border border-rose-500/20 backdrop-blur-sm">
                                            <div className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse"></div>
                                            <div className="text-rose-400 text-[10px] font-bold">{projectStats.dueSoon} Due Soon</div>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex-1 -mx-2 mb-0.5">
                                    {widgetStates.projects === 'large' ? (
                                        <ResponsiveContainer width="100%" height="100%">
                                            <BarChart data={projectChartData} barSize={64}>
                                                <defs>
                                                    <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                                                        <stop offset="0%" stopColor="#ffffff" stopOpacity={1} />
                                                        <stop offset="100%" stopColor="#52525b" stopOpacity={0.8} />
                                                    </linearGradient>
                                                </defs>
                                                <CartesianGrid vertical={false} stroke="#ffffff" strokeOpacity={0.05} strokeDasharray="3 3" />
                                                <XAxis dataKey="name" tick={{ fill: '#71717a', fontSize: 10, fontWeight: 500 }} axisLine={false} tickLine={false} dy={5} />
                                                <Tooltip cursor={{ fill: 'rgba(255,255,255,0.03)' }} content={<MinimalTooltip />} />
                                                <Bar dataKey="value" radius={[4, 4, 0, 0]} fill="url(#barGradient)" animationDuration={1500}>
                                                    {projectChartData.map((entry, index) => (
                                                        <Cell key={`cell-${index}`} style={{ filter: `drop-shadow(0px -2px 4px rgba(255,255,255,${0.1 + index * 0.05}))` }} />
                                                    ))}
                                                </Bar>
                                            </BarChart>
                                        </ResponsiveContainer>
                                    ) : (
                                        <div className="grid grid-cols-3 gap-2 px-2 h-full pb-1">
                                            {/* Active Card */}
                                            <div className="bg-zinc-900/40 rounded-lg p-2 border border-white/5 relative overflow-hidden flex flex-col justify-between shadow-sm">
                                                <div className="relative z-10">
                                                    <div className="text-xl font-bold text-white mb-0.5 leading-none">{projectStats.inProgress}</div>
                                                    <div className="text-zinc-500 text-[7px] uppercase tracking-wider font-bold mb-1.5">Active</div>
                                                </div>
                                                <div className="w-full h-1 bg-zinc-800 rounded-full overflow-hidden relative z-10">
                                                    <div className="h-full bg-white rounded-full shadow-[0_0_8px_rgba(255,255,255,0.3)]" style={{ width: `${(projectStats.inProgress / projectStats.total) * 100}%` }}></div>
                                                </div>
                                            </div>

                                            {/* Completed Card */}
                                            <div className="bg-zinc-900/40 rounded-lg p-2 border border-white/5 relative overflow-hidden flex flex-col justify-between shadow-sm">
                                                <div className="relative z-10">
                                                    <div className="text-xl font-bold text-emerald-400 mb-0.5 leading-none">{projectStats.completed}</div>
                                                    <div className="text-zinc-500 text-[7px] uppercase tracking-wider font-bold mb-1.5">Done</div>
                                                </div>
                                                <div className="w-full h-1 bg-zinc-800 rounded-full overflow-hidden relative z-10">
                                                    <div className="h-full bg-emerald-500 rounded-full shadow-[0_0_8px_rgba(16,185,129,0.3)]" style={{ width: `${(projectStats.completed / projectStats.total) * 100}%` }}></div>
                                                </div>
                                            </div>

                                            {/* On Hold Card */}
                                            <div className="bg-zinc-900/40 rounded-lg p-2 border border-white/5 relative overflow-hidden flex flex-col justify-between shadow-sm">
                                                <div className="relative z-10">
                                                    <div className="text-xl font-bold text-zinc-400 mb-0.5 leading-none">{projectStats.onHold}</div>
                                                    <div className="text-zinc-500 text-[7px] uppercase tracking-wider font-bold mb-1.5">Hold</div>
                                                </div>
                                                <div className="w-full h-1 bg-zinc-800 rounded-full overflow-hidden relative z-10">
                                                    <div className="h-full bg-zinc-500 rounded-full" style={{ width: `${(projectStats.onHold / projectStats.total) * 100}%` }}></div>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {widgetStates.projects === 'large' && (
                                    <div className="mt-4 pt-4 border-t border-white/5 grid grid-cols-2 gap-4">
                                        {projectsData.slice(0, 2).map(p => (
                                            <div key={p._id} className="bg-zinc-800/50 rounded-lg p-3 flex justify-between items-center border border-white/5">
                                                <div>
                                                    <div className="text-white text-xs font-medium">{p.name}</div>
                                                    <div className="text-zinc-500 text-[10px]">Due: {p.deadline}</div>
                                                </div>
                                                <div className="h-8 w-8 rounded-full border border-white/10 flex items-center justify-center text-[10px] text-zinc-300 bg-zinc-900">
                                                    {p.progress}%
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </Widget>

                    {/* Widget 2: Revenue */}
                    <Widget id="revenue" title="Revenue" subtitle="Performance" size={widgetStates.revenue} onSizeChange={handleWidgetSizeChange}>
                        {widgetStates.revenue === 'small' ? (
                            <div className="flex flex-col justify-center h-full">
                                <div className="text-white text-5xl font-bold tracking-tighter drop-shadow-md">
                                    ₹{((revenueData.total || 0) / 100000).toFixed(1)}L
                                </div>
                                <div className="text-zinc-500 text-xs mt-2">Total Revenue</div>
                                <div className="text-emerald-400 text-sm mt-1">
                                    {Math.round(((revenueData.achieved || 0) / (revenueData.target || 1)) * 100)}% of target
                                </div>
                            </div>
                        ) : widgetStates.revenue === 'medium' ? (
                            <div className="flex items-center justify-between h-full px-2 relative truncate">
                                <div className="flex flex-col justify-center translate-y-1 relative z-10 pl-2">
                                    <div className="text-white text-4xl font-bold tracking-tighter drop-shadow-[0_0_10px_rgba(255,255,255,0.5)]">
                                        {formatRevenue(revenueData.total)}
                                    </div>
                                    <div className="text-zinc-500 text-[10px] uppercase tracking-widest mt-0.5 font-bold">Total Revenue</div>
                                    <div className="flex items-center gap-2 mt-6">
                                        <div className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-1.5 py-0.5 rounded text-[10px] font-bold">
                                            +12.5%
                                        </div>
                                        <div className="text-zinc-500 text-[10px]">
                                            83% of Target
                                        </div>
                                    </div>
                                </div>
                                <div className="absolute right-0 top-0 bottom-0 w-3/5">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <AreaChart data={revenueData.trend && revenueData.trend.length > 0 ? revenueData.trend : []}>
                                            <defs>
                                                <linearGradient id="revenueGradientSmall" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#ffffff" stopOpacity={0.5} />
                                                    <stop offset="95%" stopColor="#ffffff" stopOpacity={0} />
                                                </linearGradient>
                                            </defs>
                                            <XAxis dataKey="month" hide />
                                            <Tooltip
                                                content={<MinimalTooltip />}
                                                cursor={{ stroke: 'white', strokeWidth: 1, strokeDasharray: '4 4' }}
                                            />
                                            <Area
                                                type="monotone"
                                                dataKey="amount"
                                                stroke="#ffffff"
                                                strokeWidth={2}
                                                strokeOpacity={0.8}
                                                fill="url(#revenueGradientSmall)"
                                                isAnimationActive={true}
                                                animationDuration={1500}
                                            />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                        ) : (
                            <div className="flex flex-col h-full">
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <div className="text-white text-4xl font-bold tracking-tighter">
                                            {formatRevenue(revenueData.total)}
                                        </div>
                                        <div className="text-zinc-500 text-xs mt-1">Total Revenue (6 Months)</div>
                                    </div>
                                    <div className="flex gap-4">
                                        <div className="text-right">
                                            <div className="text-white text-2xl font-bold">
                                                {formatRevenue(revenueData.target)}
                                            </div>
                                            <div className="text-zinc-500 text-[9px]">TARGET</div>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-white text-2xl font-bold">
                                                {Math.round(((revenueData.achieved || 0) / (revenueData.target || 1)) * 100)}%
                                            </div>
                                            <div className="text-zinc-500 text-[9px]">ACHIEVED</div>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex-1">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <AreaChart data={revenueData.trend && revenueData.trend.length > 0 ? revenueData.trend : []}>
                                            <defs>
                                                <linearGradient id="revenueGradientLarge" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#ffffff" stopOpacity={0.4} />
                                                    <stop offset="95%" stopColor="#ffffff" stopOpacity={0} />
                                                </linearGradient>
                                            </defs>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                                            <XAxis dataKey="month" tick={{ fill: '#71717a', fontSize: 11 }} />
                                            <Tooltip content={<MinimalTooltip />} />
                                            <Area
                                                type="monotone"
                                                dataKey="amount"
                                                stroke="#ffffff"
                                                strokeWidth={3}
                                                fill="url(#revenueGradientLarge)"
                                            />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                </div>
                                <div className="mt-2 grid grid-cols-3 gap-2">
                                    <div className="flex-1 bg-zinc-800/50 rounded-lg p-3 text-center border border-white/5">
                                        <div className="text-zinc-400 text-[10px] uppercase font-medium">Avg/Month</div>
                                        <div className="text-white font-bold mt-1 text-sm">₹14.9L</div>
                                    </div>
                                    <div className="flex-1 bg-zinc-800/50 rounded-lg p-3 text-center border border-white/5">
                                        <div className="text-zinc-400 text-[10px] uppercase font-medium">Target</div>
                                        <div className="text-white font-bold mt-1 text-sm">₹1.0Cr</div>
                                    </div>
                                    <div className="flex-1 bg-zinc-800/50 rounded-lg p-3 text-center border border-white/5">
                                        <div className="text-zinc-400 text-[10px] uppercase font-medium">Best</div>
                                        <div className="text-white font-bold mt-1 text-sm">Mar</div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </Widget>

                    {/* Widget 3: Attendance */}
                    <Widget id="attendance" title="Attendance" subtitle="Today's Status" size={widgetStates.attendance} onSizeChange={handleWidgetSizeChange}>
                        {widgetStates.attendance === 'small' ? (
                            <div className="flex flex-col justify-center h-full items-center relative">
                                <div className="relative w-28 h-28 flex items-center justify-center">
                                    <svg viewBox="0 0 112 112" className="transform -rotate-90 w-full h-full" style={{ overflow: 'visible' }}>
                                        <defs>
                                            <filter id="attendanceNeonSmall" x="-50%" y="-50%" width="200%" height="200%">
                                                <feGaussianBlur in="SourceAlpha" stdDeviation="3" result="blur" />
                                                <feFlood floodColor="#ffffff" floodOpacity="0.6" result="color" />
                                                <feComposite in="color" in2="blur" operator="in" result="glow" />
                                                <feMerge>
                                                    <feMergeNode in="glow" />
                                                    <feMergeNode in="SourceGraphic" />
                                                </feMerge>
                                            </filter>
                                        </defs>
                                        <circle cx="56" cy="56" r="48" stroke="#18181b" strokeWidth="10" fill="transparent" />
                                        <circle
                                            cx="56" cy="56" r="48"
                                            stroke="#ffffff" strokeWidth="10" strokeLinecap="round"
                                            fill="transparent"
                                            strokeDasharray={`${2 * Math.PI * 48}`}
                                            strokeDashoffset={`${2 * Math.PI * 48 * (1 - (attendanceData.present || 0) / (attendanceData.totalEmployees || 1))}`}
                                            className="transition-all duration-1000 ease-out"
                                            style={{ filter: 'url(#attendanceNeonSmall)' }}
                                        />
                                    </svg>
                                    <div className="absolute inset-0 flex items-center justify-center flex-col">
                                        <span className="text-3xl font-bold text-white tracking-tighter drop-shadow-md">{attendanceData.present || 0}</span>
                                        <span className="text-[9px] text-zinc-500 font-bold tracking-widest uppercase mt-1">PRESENT</span>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="flex flex-col h-full">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <div className="text-4xl font-bold text-white tracking-tighter drop-shadow-[0_0_10px_rgba(255,255,255,0.4)]">
                                            {attendanceData.present || 0}
                                            <span className="text-lg text-zinc-600 font-medium ml-1">/ {attendanceData.totalEmployees || 0}</span>
                                        </div>
                                        <div className="text-xs text-zinc-400 mt-4 flex items-center gap-2">
                                            <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse shadow-[0_0_8px_rgba(255,255,255,1)]"></span>
                                            92% On Time
                                        </div>
                                    </div>
                                </div>

                                <div className={`flex-1 flex gap-6 min-h-0 items-start ${widgetStates.attendance === 'large' ? '' : '-mt-[4.5rem]'}`}>
                                    <div className={`flex-1 relative ${widgetStates.attendance === 'large' ? 'h-40' : 'h-32'}`}>
                                        <ResponsiveContainer width="100%" height="100%">
                                            <PieChart style={{ overflow: 'visible' }}>
                                                <defs>
                                                    <filter id="attendanceNeonGlowPremium" x="-50%" y="-50%" width="200%" height="200%">
                                                        <feGaussianBlur in="SourceAlpha" stdDeviation="5" result="blur" />
                                                        <feOffset in="blur" dx="0" dy="0" result="offsetBlur" />
                                                        <feFlood floodColor="#ffffff" floodOpacity="0.7" result="glowColor" />
                                                        <feComposite in="glowColor" in2="offsetBlur" operator="in" result="glow" />
                                                        <feMerge>
                                                            <feMergeNode in="glow" />
                                                            <feMergeNode in="SourceGraphic" />
                                                        </feMerge>
                                                    </filter>
                                                </defs>
                                                <Pie
                                                    data={[
                                                        { name: 'Present', value: attendanceData.present || 0, fill: '#ffffff' },
                                                        { name: 'Absent', value: (attendanceData.totalEmployees || 0) - (attendanceData.present || 0), fill: '#27272a' }
                                                    ]}
                                                    cx="65%"
                                                    cy="45%"
                                                    innerRadius="55%"
                                                    outerRadius="75%"
                                                    paddingAngle={0}
                                                    dataKey="value"
                                                    cornerRadius={0}
                                                    startAngle={90}
                                                    endAngle={-270}
                                                    stroke="none"
                                                >
                                                    <Cell fill="#ffffff" style={{ filter: 'url(#attendanceNeonGlowPremium)' }} />
                                                    <Cell fill="#27272a" />
                                                </Pie>
                                                <Tooltip content={<MinimalTooltip />} />
                                            </PieChart>
                                        </ResponsiveContainer>
                                        <div className="absolute inset-0 flex items-center justify-center flex-col pointer-events-none"
                                            style={{ transform: 'translate(15%, -5%)' }}>
                                            <span className="text-2xl font-bold text-white">{Math.round(((attendanceData.present || 0) / (attendanceData.totalEmployees || 1)) * 100)}%</span>
                                        </div>
                                    </div>

                                    <div className="flex flex-col justify-start gap-3 w-1/3 -mt-2">
                                        <div className="bg-white/5 rounded-lg p-2.5 border-l-2 border-white backdrop-blur-sm">
                                            <div className="text-white text-sm font-bold">{attendanceData.present || 0}</div>
                                            <div className="text-zinc-500 text-[9px] uppercase tracking-wider">Present</div>
                                        </div>
                                        <div className="bg-zinc-900/50 rounded-lg p-2.5 border-l-2 border-zinc-700">
                                            <div className="text-zinc-400 text-sm font-bold">{(attendanceData.totalEmployees || 0) - (attendanceData.present || 0)}</div>
                                            <div className="text-zinc-600 text-[9px] uppercase tracking-wider">Absent</div>
                                        </div>
                                    </div>
                                </div>

                                {widgetStates.attendance === 'large' && (
                                    <div className="h-32 mt-4 pt-4 border-t border-white/5 flex-shrink-0">
                                        <div className="text-xs text-zinc-400 mb-2 uppercase tracking-widest font-bold">Weekly Trend</div>
                                        <ResponsiveContainer width="100%" height="100%">
                                            <AreaChart data={attendanceData.trend && attendanceData.trend.length > 0 ? attendanceData.trend : []}>
                                                <defs>
                                                    <linearGradient id="attendanceGradient" x1="0" y1="0" x2="0" y2="1">
                                                        <stop offset="5%" stopColor="#ffffff" stopOpacity={0.15} />
                                                        <stop offset="95%" stopColor="#ffffff" stopOpacity={0} />
                                                    </linearGradient>
                                                </defs>
                                                <CartesianGrid vertical={false} stroke="#ffffff" strokeOpacity={0.05} strokeDasharray="3 3" />
                                                <XAxis dataKey="day" tick={{ fill: '#52525b', fontSize: 10, fontWeight: 600 }} axisLine={false} tickLine={false} dy={5} />
                                                <Tooltip content={<MinimalTooltip />} />
                                                <Area type="monotone" dataKey="percentage" stroke="#52525b" fill="url(#attendanceGradient)" strokeWidth={2} />
                                            </AreaChart>
                                        </ResponsiveContainer>
                                    </div>
                                )}
                            </div>
                        )}
                    </Widget>

                    {/* Widget 4: Leaves */}
                    <Widget id="leaves" title="Leaves" subtitle="Pending Approvals" size={widgetStates.leaves} onSizeChange={handleWidgetSizeChange}>
                        {widgetStates.leaves === 'small' ? (
                            <div className="flex flex-col justify-between h-full relative px-1 py-1">
                                <div className="flex justify-between items-start">
                                    <div className="pt-1 pl-1">
                                        <div className="text-white text-5xl font-bold tracking-tighter drop-shadow-[0_0_15px_rgba(255,255,255,0.4)]">
                                            {leavesData.filter(l => l.status === 'pending').length}
                                        </div>
                                        <div className="text-zinc-500 text-xs mt-1 uppercase tracking-widest font-bold ml-1">Pending</div>
                                    </div>

                                    {/* Right Side Stats - Clean List Style */}
                                    <div className="flex flex-col gap-3 mt-2 mr-2">
                                        <div className="flex items-center justify-end gap-2 group cursor-default">
                                            <div className="text-right">
                                                <div className="text-white text-lg font-bold leading-none">{leavesData.filter(l => l.status === 'pending' && (l.type.includes('Sick') || l.type.includes('Emergency'))).length}</div>
                                                <div className="text-zinc-500 text-[8px] uppercase tracking-wider mt-0.5 group-hover:text-zinc-300 transition-colors">Sick</div>
                                            </div>
                                            <div className="w-1 h-8 rounded-full bg-gradient-to-b from-white to-zinc-800 opacity-50"></div>
                                        </div>
                                        <div className="flex items-center justify-end gap-2 group cursor-default">
                                            <div className="text-right">
                                                <div className="text-amber-400 text-lg font-bold leading-none">{leavesData.filter(l => l.status === 'pending' && !l.type.includes('Sick') && !l.type.includes('Emergency')).length}</div>
                                                <div className="text-amber-600 text-[8px] uppercase tracking-wider mt-0.5 group-hover:text-amber-500 transition-colors">Casual</div>
                                            </div>
                                            <div className="w-1 h-8 rounded-full bg-gradient-to-b from-amber-400 to-amber-900 opacity-50"></div>
                                        </div>
                                    </div>
                                </div>

                                {/* Bottom Avatar Stack */}
                                <div className="flex items-end justify-between mb-2 px-1">
                                    <div className="flex -space-x-3">
                                        {leavesData.filter(l => l.status === 'pending').slice(0, 4).map((leave, i) => (
                                            <div key={leave.id} className="w-9 h-9 rounded-full bg-zinc-900 border-2 border-zinc-800 flex items-center justify-center text-base shadow-lg transition-transform hover:-translate-y-1 hover:scale-110 z-10 hover:z-20 cursor-pointer" style={{ zIndex: 10 - i }}>
                                                {leave.avatar}
                                            </div>
                                        ))}
                                        {leavesData.filter(l => l.status === 'pending').length > 4 && (
                                            <div className="w-9 h-9 rounded-full bg-zinc-900 border-2 border-zinc-800 flex items-center justify-center text-[10px] text-zinc-400 font-bold shadow-lg z-0 hover:text-white transition-colors cursor-pointer">
                                                +{leavesData.filter(l => l.status === 'pending').length - 4}
                                            </div>
                                        )}
                                    </div>
                                    <div
                                        className="text-[9px] text-zinc-600 font-bold uppercase tracking-widest flex items-center gap-1 hover:text-white transition-colors cursor-pointer"
                                        onClick={(e) => { e.stopPropagation(); onSizeChange('leaves', 'large'); }}
                                    >
                                        View All <div className="w-1 h-1 rounded-full bg-current"></div>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="flex flex-col h-full overflow-hidden">
                                <div className="flex min-h-0 h-full gap-6">
                                    {/* Left Side: Large Stat */}
                                    <div className="flex flex-col justify-center items-center min-w-[120px] translate-y-4">
                                        <div className="text-white text-6xl font-bold tracking-tighter drop-shadow-[0_0_15px_rgba(255,255,255,0.3)]">
                                            {leavesData.filter(l => l.status === 'pending').length}
                                        </div>
                                        <div className="text-zinc-500 text-xs font-bold uppercase tracking-[0.2em] mt-2 mb-6">
                                            Requests
                                        </div>
                                    </div>

                                    {/* Right Side: Full Height List */}
                                    <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
                                        <div className="space-y-2 pb-2">
                                            {leavesData.slice(0, widgetStates.leaves === 'large' ? 6 : 4).map((leave) => (
                                                <div key={leave.id} className="bg-white/[0.03] backdrop-blur-sm rounded-xl p-2.5 flex items-center justify-between group hover:bg-white/[0.08] transition-all duration-300 border border-white/5 hover:border-white/20 relative overflow-hidden">
                                                    <div className="flex items-center gap-3 relative z-10">
                                                        <div className="h-8 w-8 rounded-full bg-gradient-to-br from-zinc-800 to-black border border-white/10 flex items-center justify-center text-base text-zinc-300 group-hover:scale-110 transition-transform">
                                                            {leave.avatar}
                                                        </div>
                                                        <div>
                                                            <div className="text-zinc-200 text-[11px] font-bold group-hover:text-white transition-colors leading-none">{leave.name}</div>
                                                            <div className="text-zinc-500 text-[9px] font-medium tracking-wide mt-1">{leave.type.split(' ')[0]} • <span className="text-zinc-400">{leave.days}d</span></div>
                                                        </div>
                                                    </div>
                                                    <button className="h-6 w-6 rounded-full bg-white/5 text-zinc-500 flex items-center justify-center hover:bg-white hover:text-black transition-all duration-300 border border-white/5">
                                                        <CheckCircle size={12} />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                {widgetStates.leaves === 'large' && (
                                    <div className="mt-4 pt-4 border-t border-white/5 flex gap-3 flex-shrink-0">
                                        <div className="flex-1 bg-zinc-900/40 rounded-xl p-2 text-center border border-white/5 backdrop-blur-md">
                                            <div className="text-white font-bold text-lg drop-shadow-md">12</div>
                                            <div className="text-[9px] text-zinc-500 font-bold uppercase tracking-wider">On Leave</div>
                                        </div>
                                        <div className="flex-1 bg-zinc-900/40 rounded-xl p-2 text-center border border-white/5 backdrop-blur-md">
                                            <div className="text-zinc-300 font-bold text-lg">8</div>
                                            <div className="text-[9px] text-zinc-500 font-bold uppercase tracking-wider">Returning</div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </Widget>

                    {/* Widget 5: Companies */}
                    <Widget id="companies" title="Companies" subtitle="Client Base" size={widgetStates.companies} onSizeChange={handleWidgetSizeChange}>
                        {widgetStates.companies === 'small' ? (
                            <div className="flex flex-col justify-center h-full items-center">
                                <div className="text-white text-5xl font-bold tracking-tighter drop-shadow-[0_0_15px_rgba(255,255,255,0.4)] mb-3">
                                    {companiesData.total || 0}
                                </div>
                                <div className="flex -space-x-3">
                                    {[1, 2, 3].map(i => (
                                        <div key={i} className="h-8 w-8 rounded-full bg-zinc-800 border-2 border-[#121212] flex items-center justify-center shadow-lg transform hover:-translate-y-1 transition-transform duration-300">
                                            <span className="text-[10px] text-zinc-400 font-bold">{String.fromCharCode(64 + i)}</span>
                                        </div>
                                    ))}
                                    <div className="h-8 w-8 rounded-full bg-white text-black border-2 border-[#121212] flex items-center justify-center font-bold text-[10px] shadow-[0_0_10px_rgba(255,255,255,0.5)] z-10">
                                        +
                                    </div>
                                </div>
                                <div className="text-zinc-500 text-[10px] mt-3 font-medium tracking-wide">ACTIVE CLIENTS</div>
                            </div>
                        ) : (
                            <div className="flex flex-col h-full">
                                <div className="flex justify-between items-start mb-1">
                                    <div>
                                        <div className="text-4xl font-bold text-white tracking-tighter drop-shadow-md">{companiesData.total || 0}</div>
                                    </div>
                                    <div className="text-right -mt-9">
                                        <div className="text-emerald-400 font-bold text-sm drop-shadow-[0_0_8px_rgba(52,211,153,0.3)]">+{companiesData.pending || 0}</div>
                                    </div>
                                </div>

                                <div className={`${widgetStates.companies === 'large' ? 'h-48' : 'h-28 flex-1'} flex-shrink-0 flex items-start gap-4 ${widgetStates.companies === 'large' ? 'mt-2' : '-mt-10'}`}>
                                    <div className={`w-1/2 ${widgetStates.companies === 'large' ? 'h-full' : 'h-[140%] -mt-8'} relative`}>
                                        {/* Glowing Ring Effect behind chart */}
                                        <div className="absolute inset-0 rounded-full bg-white/5 blur-2xl transform scale-75"></div>
                                        <ResponsiveContainer width="100%" height="100%">
                                            <PieChart style={{ overflow: 'visible' }}>
                                                <defs>
                                                    <filter id="companiesNeonGlowPremium" x="-100%" y="-100%" width="300%" height="300%">
                                                        <feGaussianBlur in="SourceAlpha" stdDeviation="5" result="blur" />
                                                        <feFlood floodColor="#ffffff" floodOpacity="0.6" result="glowColor" />
                                                        <feComposite in="glowColor" in2="blur" operator="in" result="glow" />
                                                        <feMerge>
                                                            <feMergeNode in="glow" />
                                                            <feMergeNode in="SourceGraphic" />
                                                        </feMerge>
                                                    </filter>
                                                </defs>
                                                <Pie
                                                    data={companiesData.distribution && companiesData.distribution.length > 0 ? companiesData.distribution : []}
                                                    cx="70%"
                                                    cy="45%"
                                                    innerRadius="55%"
                                                    outerRadius="75%"
                                                    paddingAngle={0}
                                                    dataKey="value"
                                                    cornerRadius={0}
                                                    stroke="none"
                                                >
                                                    {(companiesData.distribution || []).map((entry, index) => (
                                                        <Cell
                                                            key={`cell-${index}`}
                                                            fill={entry.color}
                                                            style={{ filter: 'url(#companiesNeonGlowPremium)' }}
                                                        />
                                                    ))}
                                                </Pie>
                                                <Tooltip content={<MinimalTooltip />} />
                                            </PieChart>
                                        </ResponsiveContainer>
                                        {/* Inner Text - Active Count */}
                                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none" style={{ left: '70%', top: '45%', transform: 'translate(-50%, -50%)' }}>
                                            <div className="text-center">
                                                <div className="text-xl font-bold text-white leading-none drop-shadow-md">{companiesData.approved || 0}</div>
                                                <span className="text-[9px] text-zinc-500 font-bold uppercase tracking-wider">Active</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="w-1/2 flex flex-col justify-start gap-3 -mt-4 pl-16">
                                        {(companiesData.distribution || []).map((item, idx) => (
                                            <div key={idx} className="flex items-center justify-between w-full group cursor-default">
                                                <div className="flex items-center gap-2.5">
                                                    <div className={`w-2 h-2 rounded-full transition-all duration-300 ${idx === 0 ? 'animate-pulse' : ''}`} style={{ backgroundColor: item.color, boxShadow: `0 0 8px ${item.color}40` }} />
                                                    <span className="text-zinc-400 text-[11px] font-medium group-hover:text-white transition-colors">{item.name}</span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-zinc-500 text-[10px] font-medium">{item.value}</span>
                                                    <span className="text-white font-bold text-xs tabular-nums">{Math.round((item.value / (companiesData.total || 1)) * 100)}%</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {widgetStates.companies === 'large' && (
                                    <div className="mt-3 pt-3 border-t border-white/5 flex-1 min-h-0 flex flex-col">
                                        <div className="text-[10px] text-zinc-500 mb-2 uppercase tracking-wider font-bold">Top Clients</div>
                                        <div className="space-y-1 overflow-y-auto custom-scrollbar pr-1 -mr-1">
                                            {['TechCorp Inc.', 'Global Finance', 'RetailGiants', 'InnovateX', 'Alpha Dynamics', 'Nebula Systems'].map((client, idx) => (
                                                <div key={idx} className="flex justify-between items-center p-1.5 bg-white/[0.03] rounded hover:bg-white/[0.05] transition-colors cursor-pointer group">
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-5 h-5 rounded-full bg-gradient-to-br from-zinc-600 to-zinc-800 flex items-center justify-center text-[8px] font-bold text-white shadow-sm group-hover:scale-110 transition-transform">
                                                            {client[0]}
                                                        </div>
                                                        <span className="text-xs text-zinc-300 group-hover:text-white transition-colors">{client}</span>
                                                    </div>
                                                    <span className="text-xs text-white font-medium">$12.5k</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </Widget>

                    {/* Widget 6: Leads */}
                    <Widget id="leads" title="Leads" subtitle="Sales Pipeline" size={widgetStates.leads} onSizeChange={handleWidgetSizeChange}>
                        {widgetStates.leads === 'small' ? (
                            <div className="flex flex-col justify-center h-full items-center">
                                <div className="relative">
                                    <div className="text-white text-6xl font-bold tracking-tighter drop-shadow-[0_0_20px_rgba(255,255,255,0.3)]">
                                        {leadsData.total || 0}
                                    </div>
                                    <div className="absolute -top-1 -right-4 w-2 h-2 bg-white rounded-full shadow-[0_0_10px_#ffffff] animate-pulse"></div>
                                </div>
                                <div className="text-zinc-500 text-[10px] tracking-[0.2em] font-medium mt-2 uppercase">Total Leads</div>
                                <div className="mt-4 flex gap-3 text-[10px] font-medium">
                                    <span className="text-zinc-300 drop-shadow-[0_0_5px_rgba(255,255,255,0.2)]">{leadsData.active || 0} Active</span>
                                    <span className="text-zinc-600">|</span>
                                    <span className="text-zinc-500">{leadsData.won || 0} Won</span>
                                </div>
                            </div>
                        ) : widgetStates.leads === 'medium' ? (
                            <div className="flex h-full items-center">
                                {/* Part 1: Main Stat (30%) */}
                                <div className="w-[28%] flex flex-col items-center justify-center border-r border-white/5 h-full pr-4">
                                    <div className="text-white text-5xl font-bold tracking-tighter drop-shadow-[0_0_15px_rgba(255,255,255,0.3)]">
                                        {leadsData.total || 0}
                                    </div>
                                    <div className="text-zinc-500 text-[9px] font-bold uppercase tracking-[0.2em] mt-1">Total Leads</div>
                                </div>

                                {/* Part 2: Key Stats (36%) */}
                                <div className="w-[36%] flex flex-col justify-center gap-1.5 border-r border-white/5 h-full px-4">
                                    <div className="flex items-center justify-between group">
                                        <div className="flex items-center gap-2">
                                            <div className="w-1.5 h-1.5 rounded-full bg-blue-400"></div>
                                            <span className="text-zinc-500 text-[9px] font-bold uppercase">Active</span>
                                        </div>
                                        <span className="text-white font-bold text-xs">{leadsData.active || 0}</span>
                                    </div>
                                    <div className="flex items-center justify-between group">
                                        <div className="flex items-center gap-2">
                                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400"></div>
                                            <span className="text-zinc-500 text-[9px] font-bold uppercase">Won</span>
                                        </div>
                                        <span className="text-white font-bold text-xs">{leadsData.won || 0}</span>
                                    </div>
                                    <div className="mt-1 flex items-center justify-between bg-white/5 rounded-md px-2 py-1 border border-white/5">
                                        <span className="text-zinc-400 text-[8px] font-bold uppercase">Conversion</span>
                                        <span className="text-white font-bold text-[10px]">{Math.round(((leadsData.won || 0) / (leadsData.total || 1)) * 100)}%</span>
                                    </div>
                                </div>

                                {/* Part 3: Flow Visualization (36%) - Candlestick Pill Style */}
                                <div className="flex-1 h-full pl-3 py-1 flex flex-col justify-center translate-y-2">
                                    <div className="text-[8px] text-zinc-600 font-bold uppercase tracking-widest mb-1 text-right pr-2">Pipeline Flow</div>
                                    <div className="h-20 w-full relative flex items-end justify-center gap-[6px] px-4 group/bars">
                                        {/* Custom Candlestick Bars - Pinterest Style with Tooltip */}
                                        {(leadsData.funnel || []).slice(0, 8).map((stage, index) => {
                                            const heightPercentage = (stage.count / (leadsData.total || 1)) * 100;
                                            const opacity = 0.7 + (heightPercentage / 100) * 0.3;
                                            return (
                                                <div
                                                    key={index}
                                                    className="flex-1 max-w-[10px] rounded-full bg-white transition-all duration-300 hover:scale-110 cursor-pointer relative group/bar"
                                                    style={{
                                                        height: `${heightPercentage}%`,
                                                        opacity: opacity,
                                                        boxShadow: `0 0 12px rgba(255, 255, 255, ${opacity * 0.6}), 0 0 24px rgba(255, 255, 255, ${opacity * 0.3})`
                                                    }}
                                                >
                                                    {/* Hover Tooltip */}
                                                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 opacity-0 group-hover/bar:opacity-100 transition-opacity duration-200 pointer-events-none z-50 whitespace-nowrap">
                                                        <div className="bg-zinc-900/95 backdrop-blur-md px-3 py-2 rounded-lg border border-white/10 shadow-2xl">
                                                            <div className="text-zinc-400 text-[9px] font-medium tracking-wide">{stage.stage}</div>
                                                            <div className="text-white font-bold text-sm mt-0.5">{stage.count} leads</div>
                                                            <div className="text-emerald-400 text-[9px] mt-0.5">{stage.percentage}%</div>
                                                        </div>
                                                        {/* Arrow */}
                                                        <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-px">
                                                            <div className="w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-zinc-900/95"></div>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="flex flex-col h-full">
                                <div className="flex justify-between items-center mb-4">
                                    <div>
                                        <div className="text-3xl font-bold text-white">{leadsData.total || 0}</div>
                                        <div className="text-zinc-500 text-xs">Total Leads</div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-white font-bold text-xl">{Math.round(((leadsData.won || 0) / (leadsData.total || 1)) * 100)}%</div>
                                        <div className="text-zinc-500 text-[9px]">CONVERSION</div>
                                    </div>
                                </div>

                                <div className="flex-1 flex gap-4 min-h-0 pl-2">
                                    {/* Funnel Chart - using BarChart horizontal */}
                                    <div className="flex-1">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <BarChart layout="vertical" data={leadsData.funnel && leadsData.funnel.length > 0 ? leadsData.funnel : []} margin={{ left: 10, right: 10, top: 0, bottom: 0 }} barSize={16}>
                                                <CartesianGrid horizontal={false} stroke="#27272a" strokeDasharray="3 3" />
                                                <XAxis type="number" hide />
                                                <YAxis dataKey="stage" type="category" width={80} tick={{ fill: '#d4d4d8', fontSize: 11, fontWeight: 500 }} axisLine={false} tickLine={false} interval={0} />
                                                <Tooltip cursor={{ fill: 'rgba(255,255,255,0.05)' }} content={<MinimalTooltip />} />
                                                <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                                                    {(leadsData.funnel || []).map((entry, index) => (
                                                        <Cell key={`cell-${index}`} fill={['#333', '#444', '#666', '#a1a1aa', '#fff'][index % 5]} />
                                                    ))}
                                                </Bar>
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </div>

                                    {/* Conversion Stats on side for Large */}
                                    {widgetStates.leads === 'large' && (
                                        <div className="w-1/3 flex flex-col justify-center gap-2 border-l border-white/5 pl-4">
                                            <div className="text-xs text-zinc-400 mb-1">Breakdown</div>
                                            <div className="flex justify-between items-center text-[10px]">
                                                <span className="text-zinc-500">Active</span>
                                                <span className="text-white font-bold">{leadsData.active || 0}</span>
                                            </div>
                                            <div className="w-full bg-zinc-800 h-1 rounded-full overflow-hidden mb-2">
                                                <div className="bg-white h-full" style={{ width: `${((leadsData.active || 0) / (leadsData.total || 1)) * 100}%` }} />
                                            </div>

                                            <div className="flex justify-between items-center text-[10px]">
                                                <span className="text-zinc-500">Won</span>
                                                <span className="text-white font-bold">{leadsData.won || 0}</span>
                                            </div>
                                            <div className="w-full bg-zinc-800 h-1 rounded-full overflow-hidden mb-2">
                                                <div className="bg-zinc-400 h-full" style={{ width: `${((leadsData.won || 0) / (leadsData.total || 1)) * 100}%` }} />
                                            </div>

                                            <div className="flex justify-between items-center text-[10px]">
                                                <span className="text-zinc-500">Lost</span>
                                                <span className="text-zinc-600 font-bold">{leadsData.lost || 0}</span>
                                            </div>
                                            <div className="w-full bg-zinc-800 h-1 rounded-full overflow-hidden">
                                                <div className="bg-zinc-600 h-full" style={{ width: `${((leadsData.lost || 0) / (leadsData.total || 1)) * 100}%` }} />
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </Widget>

                    {/* Widget 7: Payroll */}
                    <Widget id="payroll" title="Payroll" subtitle="Financial Overview" size={widgetStates.payroll} onSizeChange={handleWidgetSizeChange}>
                        {widgetStates.payroll === 'small' ? (
                            <div className="flex flex-col h-full pt-2 relative">
                                <div className="flex justify-end items-start -mt-3">
                                    {(payrollData.pendingCount || 0) > 0 ? (
                                        <div className="bg-amber-500/10 border border-amber-500/20 px-2 py-1 rounded-md flex items-center gap-1.5 shadow-[0_0_10px_rgba(245,158,11,0.3)]">
                                            <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse shadow-[0_0_6px_rgba(245,158,11,0.6)]"></div>
                                            <span className="text-amber-400 text-[9px] font-bold uppercase drop-shadow-[0_0_8px_rgba(245,158,11,0.5)]">{payrollData.pendingCount} Pending</span>
                                        </div>
                                    ) : (
                                        <div className="bg-emerald-500/10 border border-emerald-500/20 px-2 py-1 rounded-md flex items-center gap-1.5 shadow-[0_0_10px_rgba(16,185,129,0.3)]">
                                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.6)]"></div>
                                            <span className="text-emerald-400 text-[9px] font-bold uppercase drop-shadow-[0_0_8px_rgba(16,185,129,0.5)]">All Paid</span>
                                        </div>
                                    )}
                                </div>

                                <div className="-mt-3">
                                    <div className="text-white text-4xl font-bold tracking-tighter drop-shadow-md">
                                        {formatRevenue(payrollData.totalNetSalary || 0)}
                                    </div>
                                    <div className="text-zinc-500 text-[10px] mt-1 uppercase tracking-wider font-bold">Total Net Disbursal</div>
                                </div>

                                <div className="absolute bottom-4 left-0 right-0">
                                    <div className="flex justify-between text-[9px] text-zinc-500 mb-1.5">
                                        <span className="font-medium text-zinc-400">Processing Status</span>
                                        <span className="font-bold text-white">
                                            {Math.round((((payrollData.totalEmployees || 0) - (payrollData.pendingCount || 0)) / (payrollData.totalEmployees || 1)) * 100)}%
                                        </span>
                                    </div>
                                    <div className="w-full bg-zinc-800 h-1.5 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-white rounded-full shadow-[0_0_8px_rgba(255,255,255,0.4)]"
                                            style={{ width: `${Math.round((((payrollData.totalEmployees || 0) - (payrollData.pendingCount || 0)) / (payrollData.totalEmployees || 1)) * 100)}%` }}
                                        />
                                    </div>
                                </div>
                            </div>
                        ) : widgetStates.payroll === 'medium' ? (
                            <div className="flex items-center gap-6 h-full">
                                {/* Left Side - Header */}
                                <div className="flex flex-col justify-center -mt-4">
                                    <div className="text-4xl font-bold text-white tracking-tighter drop-shadow-md mb-1">
                                        {formatRevenue(payrollData.totalNetSalary || 0)}
                                    </div>
                                    <div className="text-zinc-400 text-[10px] font-bold uppercase tracking-widest mb-3">Current Payroll</div>
                                    <div className="bg-white/10 border border-white/20 px-3 py-1.5 rounded-md backdrop-blur-md inline-block">
                                        <span className="text-white text-[10px] font-bold uppercase tracking-wider">Aug 2025</span>
                                    </div>
                                </div>

                                {/* Right Side - Progress Bars */}
                                <div className="flex-1 space-y-4 -mt-6">
                                    <div className="group">
                                        <div className="flex justify-between items-end mb-1.5">
                                            <span className="text-zinc-300 text-[10px] font-bold uppercase">Base Salary</span>
                                            <span className="text-white text-xs font-bold">{formatRevenue((payrollData.totalNetSalary || 0) * 0.8)}</span>
                                        </div>
                                        <div className="w-full h-2 bg-zinc-800 rounded-full overflow-hidden">
                                            <div className="h-full bg-white rounded-full w-[80%] shadow-[0_0_8px_rgba(255,255,255,0.4)]"></div>
                                        </div>
                                    </div>

                                    <div className="group">
                                        <div className="flex justify-between items-end mb-1.5">
                                            <span className="text-zinc-300 text-[10px] font-bold uppercase">Taxes & TDS</span>
                                            <span className="text-white text-xs font-bold">{formatRevenue((payrollData.totalGrossSalary || 0) - (payrollData.totalNetSalary || 0))}</span>
                                        </div>
                                        <div className="w-full h-2 bg-zinc-800 rounded-full overflow-hidden">
                                            <div className="h-full bg-white/70 rounded-full w-[15%]"></div>
                                        </div>
                                    </div>

                                    <div className="group">
                                        <div className="flex justify-between items-end mb-1.5">
                                            <span className="text-zinc-300 text-[10px] font-bold uppercase">Allowances</span>
                                            <span className="text-white text-xs font-bold">{formatRevenue((payrollData.totalNetSalary || 0) * 0.2)}</span>
                                        </div>
                                        <div className="w-full h-2 bg-zinc-800 rounded-full overflow-hidden">
                                            <div className="h-full bg-white/40 rounded-full w-[20%]"></div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="flex flex-col h-full">
                                <div className="flex items-center justify-between mb-4">
                                    <div>
                                        <div className="text-4xl font-bold text-white tracking-tighter drop-shadow-md">
                                            {formatRevenue(payrollData.totalNetSalary || 0)}
                                        </div>
                                        <div className="text-zinc-500 text-xs mt-1">Total Net Disbursal</div>
                                    </div>
                                    <div className="flex gap-2">
                                        {(payrollData.pendingCount || 0) > 0 && (
                                            <div className="bg-amber-900/20 border border-amber-500/20 px-3 py-1.5 rounded-lg flex flex-col items-center justify-center min-w-[80px] text-center">
                                                <div className="text-amber-500 text-lg font-bold leading-none">{payrollData.pendingCount}</div>
                                                <div className="text-amber-600/80 text-[8px] uppercase font-bold mt-0.5">Pending Payments</div>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="flex-1 flex gap-6 items-center">
                                    {/* Breakdown Stats */}
                                    <div className="w-1/3 space-y-3">
                                        <div className="bg-zinc-800/40 rounded-lg p-3 border border-white/5 flex justify-between items-center group hover:bg-zinc-800/60 transition-colors">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 rounded-full bg-emerald-500/10 text-emerald-500 group-hover:scale-110 transition-transform">
                                                    <DollarSign size={16} />
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-zinc-400 text-[10px] uppercase font-bold">Gross Salary</span>
                                                    <span className="text-white font-bold">{formatRevenue(payrollData.totalGrossSalary || 0)}</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="bg-zinc-800/40 rounded-lg p-3 border border-white/5 flex justify-between items-center group hover:bg-zinc-800/60 transition-colors">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 rounded-full bg-blue-500/10 text-blue-500 group-hover:scale-110 transition-transform">
                                                    <Users size={16} />
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-zinc-400 text-[10px] uppercase font-bold">Employees</span>
                                                    <span className="text-white font-bold">{payrollData.totalEmployees || attendanceData.totalEmployees || 0}</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="bg-zinc-800/40 rounded-lg p-3 border border-white/5 flex justify-between items-center group hover:bg-zinc-800/60 transition-colors">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 rounded-full bg-purple-500/10 text-purple-500 group-hover:scale-110 transition-transform">
                                                    <CreditCard size={16} />
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-zinc-400 text-[10px] uppercase font-bold">Taxes & Deductions</span>
                                                    <span className="text-white font-bold text-xs opacity-70">
                                                        {formatRevenue((payrollData.totalGrossSalary || 0) - (payrollData.totalNetSalary || 0))}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Chart (Visual Neon Bar Trend - Different from Revenue) */}
                                    <div className="flex-1 h-32 relative group">
                                        {/* Neon Glow Background Effect */}
                                        <div className="absolute inset-x-4 bottom-0 h-16 bg-white/5 blur-2xl rounded-t-full opacity-20 pointer-events-none"></div>

                                        <ResponsiveContainer width="100%" height="100%">
                                            <BarChart data={[
                                                { name: 'Jul', fullName: 'July 2025', gross: 3800000, net: 3500000, tax: 300000 },
                                                { name: 'Aug', fullName: 'August 2025', gross: 4100000, net: 3800000, tax: 300000 },
                                                { name: 'Sep', fullName: 'September 2025', gross: 4300000, net: 4000000, tax: 300000 },
                                                { name: 'Oct', fullName: 'October 2025', gross: 4200000, net: 3900000, tax: 300000 },
                                                { name: 'Nov', fullName: 'November 2025', gross: 4400000, net: 4100000, tax: 300000 },
                                                { name: 'Dec', fullName: 'December 2025', gross: 4500000, net: 4250000, tax: 250000 }
                                            ]} barSize={12} margin={{ top: 20 }}>
                                                <defs>
                                                    <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                                                        <stop offset="0%" stopColor="#ffffff" stopOpacity={0.9} />
                                                        <stop offset="100%" stopColor="#ffffff" stopOpacity={0.1} />
                                                    </linearGradient>
                                                </defs>
                                                <Tooltip
                                                    cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                                                    content={({ active, payload }) => {
                                                        if (active && payload && payload.length) {
                                                            const data = payload[0].payload;
                                                            return (
                                                                <div className="bg-zinc-950/90 border border-white/10 p-3 rounded-lg shadow-2xl backdrop-blur-xl min-w-[140px]">
                                                                    <p className="text-zinc-400 text-[10px] uppercase font-bold mb-2 tracking-wider">{data.fullName}</p>
                                                                    <div className="space-y-1.5">
                                                                        <div className="flex justify-between items-center gap-4 text-[10px]">
                                                                            <div className="flex items-center gap-1.5">
                                                                                <div className="w-1.5 h-1.5 rounded-full bg-white/20"></div>
                                                                                <span className="text-zinc-400">Gross</span>
                                                                            </div>
                                                                            <span className="text-white font-mono font-bold">{formatRevenue(data.gross)}</span>
                                                                        </div>
                                                                        <div className="flex justify-between items-center gap-4 text-[10px]">
                                                                            <div className="flex items-center gap-1.5">
                                                                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                                                                                <span className="text-zinc-400">Net Pay</span>
                                                                            </div>
                                                                            <span className="text-emerald-400 font-mono font-bold">{formatRevenue(data.net)}</span>
                                                                        </div>
                                                                        <div className="flex justify-between items-center gap-4 text-[10px] border-t border-white/5 pt-1.5 mt-1">
                                                                            <div className="flex items-center gap-1.5">
                                                                                <div className="w-1.5 h-1.5 rounded-full bg-rose-500"></div>
                                                                                <span className="text-zinc-400">Tax</span>
                                                                            </div>
                                                                            <span className="text-rose-400 font-mono font-bold">-{formatRevenue(data.tax)}</span>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            );
                                                        }
                                                        return null;
                                                    }}
                                                />
                                                <Bar
                                                    dataKey="net"
                                                    fill="url(#barGradient)"
                                                    radius={[6, 6, 0, 0]}
                                                    animationDuration={1500}
                                                    style={{ filter: 'drop-shadow(0 0 6px rgba(255,255,255,0.4))' }}
                                                />
                                            </BarChart>
                                        </ResponsiveContainer>

                                        <div className="absolute -top-8 right-0 py-1 px-3 bg-white/10 backdrop-blur-md rounded-full border border-white/20">
                                            <div className="flex items-center gap-2">
                                                <TrendingUp size={12} className="text-white" />
                                                <span className="text-white text-[10px] font-bold">Stable Growth</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </Widget>

                    {/* Widget 8: Performance */}
                    <Widget
                        id="performance"
                        title="Performance"
                        subtitle="Team Metrics"
                        size={widgetStates.performance}
                        onSizeChange={handleWidgetSizeChange}
                    >
                        {widgetStates.performance === 'small' ? (
                            <div className="flex flex-col justify-center h-full">
                                {(performanceData.topPerformers && performanceData.topPerformers.length > 0) ? (
                                    <>
                                        <div className="flex items-center justify-between mb-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-14 h-14 rounded-xl bg-white flex items-center justify-center font-bold text-black text-lg shadow-[0_0_15px_rgba(255,255,255,0.5)]">
                                                    {performanceData.topPerformers[0].avatar}
                                                </div>
                                                <div>
                                                    <div className="text-white font-bold text-sm">{performanceData.topPerformers[0].name}</div>
                                                    <div className="text-zinc-500 text-xs">{performanceData.topPerformers[0].department}</div>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-3 gap-3">
                                            <div>
                                                <div className="text-zinc-500 text-[10px] font-bold uppercase mb-1">Score</div>
                                                <div className="text-white text-2xl font-bold">{performanceData.topPerformers[0].score}</div>
                                            </div>
                                            <div className="text-center">
                                                <div className="text-zinc-500 text-[10px] font-bold uppercase mb-1">Trend</div>
                                                <div className="text-emerald-400 text-2xl font-bold">{mockPerformance.topPerformers[0].trend}</div>
                                            </div>
                                            <div className="text-right">
                                                <div className="text-zinc-500 text-[10px] font-bold uppercase mb-1">Tasks</div>
                                                <div className="text-white text-2xl font-bold">{performanceData.topPerformers[0].tasksCompleted}</div>
                                            </div>
                                        </div>
                                    </>
                                ) : (
                                    <div className="text-center text-zinc-500 text-sm">No performance data available</div>
                                )}
                            </div>
                        ) : widgetStates.performance === 'medium' ? (
                            <div className="flex flex-col h-full justify-center">
                                {/* Header */}
                                <div className="relative flex justify-center items-center mb-5 -mt-3">
                                    <div className="text-white text-xl font-black uppercase tracking-[0.2em] drop-shadow-[0_0_10px_rgba(255,255,255,0.8)]">
                                        Top 3 Stars
                                    </div>
                                    <div className="absolute right-0 top-0 bg-white/5 rounded px-2 py-1 border border-white/10">
                                        <div className="text-zinc-500 text-[10px] font-medium">Avg: <span className="text-white font-bold text-xs">{performanceData.avgProductivity}</span></div>
                                    </div>
                                </div>

                                {/* Performer Cards - 3 Columns */}
                                <div className="grid grid-cols-3 gap-2">
                                    {performanceData.topPerformers.slice(0, 3).map((performer, index) => {
                                        const dotCount = Math.round(performer.score / 10);
                                        const dots = Array.from({ length: 10 }, (_, i) => i < dotCount);

                                        return (
                                            <div key={performer.id} className="bg-zinc-900/40 rounded-xl p-2 border border-white/5 relative overflow-hidden group hover:bg-zinc-900/60 transition-all">
                                                {/* Top Row: Avatar & Name */}
                                                <div className="flex items-center gap-1.5 mb-2">
                                                    <div className={`w-5 h-5 rounded flex items-center justify-center font-bold text-[8px] ${index === 0 ? 'bg-white text-black shadow-lg shadow-white/20' :
                                                        index === 1 ? 'bg-zinc-400 text-black' :
                                                            'bg-zinc-700 text-white'
                                                        }`}>
                                                        {performer.avatar}
                                                    </div>
                                                    <div className="text-zinc-400 text-[9px] font-bold truncate max-w-[40px]">{performer.name.split(' ')[0]}</div>
                                                </div>

                                                {/* Bottom Row: Score (Left) & Dots (Right) */}
                                                <div className="flex items-end justify-between">
                                                    <div>
                                                        <div className="text-white text-2xl font-bold leading-none tracking-tighter mb-0.5">{performer.score}</div>
                                                        <div className="text-emerald-400 text-[9px] font-bold">{performer.trend}</div>
                                                    </div>

                                                    {/* Dot Matrix (Right) */}
                                                    <div className="grid grid-cols-2 gap-1 pb-1">
                                                        {dots.map((isActive, dotIndex) => (
                                                            <div
                                                                key={dotIndex}
                                                                className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${isActive
                                                                    ? index === 0
                                                                        ? 'bg-white shadow-[0_0_4px_rgba(255,255,255,0.8)]'
                                                                        : index === 1
                                                                            ? 'bg-zinc-400'
                                                                            : 'bg-zinc-600'
                                                                    : 'bg-zinc-800/30'
                                                                    }`}
                                                            ></div>
                                                        ))}
                                                    </div>
                                                </div>

                                                {/* Hover Gradient */}
                                                <div className={`absolute inset-0 bg-gradient-to-r opacity-0 group-hover:opacity-10 transition-opacity ${index === 0 ? 'from-yellow-500/50 to-transparent' :
                                                    index === 1 ? 'from-zinc-400/50 to-transparent' :
                                                        'from-amber-700/50 to-transparent'
                                                    }`}></div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        ) : (
                            <div className="flex flex-col h-full">
                                <div className="grid grid-cols-3 gap-3 mb-4">
                                    <div className="bg-emerald-500/10 rounded-xl p-3 border border-emerald-500/20">
                                        <div className="text-emerald-400 text-[10px] font-bold uppercase mb-1">Avg Score</div>
                                        <div className="text-white text-xl font-bold">{performanceData.avgProductivity || 0}%</div>
                                    </div>
                                    <div className="bg-blue-500/10 rounded-xl p-3 border border-blue-500/20">
                                        <div className="text-blue-400 text-[10px] font-bold uppercase mb-1">Top Dept</div>
                                        <div className="text-white text-sm font-bold truncate">{performanceData.topDepartment || 'N/A'}</div>
                                    </div>
                                    <div className="bg-purple-500/10 rounded-xl p-3 border border-purple-500/20">
                                        <div className="text-purple-400 text-[10px] font-bold uppercase mb-1">Active</div>
                                        <div className="text-white text-xl font-bold">{(performanceData.topPerformers || []).length}</div>
                                    </div>
                                </div>
                                <div className="flex-1 grid grid-cols-2 gap-3 overflow-y-auto">
                                    {(performanceData.topPerformers || []).map((performer, idx) => (
                                        <div key={performer.id} className="flex items-center gap-2.5 bg-zinc-900/30 rounded-xl p-3 border border-white/5 h-fit">
                                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm ${idx === 0 ? 'bg-gradient-to-br from-yellow-400 to-amber-600 text-white' :
                                                idx === 1 ? 'bg-gradient-to-br from-gray-300 to-gray-500 text-white' :
                                                    idx === 2 ? 'bg-gradient-to-br from-amber-700 to-amber-900 text-white' :
                                                        'bg-white/10 text-zinc-400'
                                                }`}>
                                                {idx + 1}
                                            </div>
                                            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center font-bold text-white text-sm">
                                                {performer.avatar}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="text-white font-bold text-sm truncate">{performer.name}</div>
                                                <div className="text-zinc-500 text-xs">{performer.department}</div>
                                            </div>
                                            <div className="text-right">
                                                <div className="text-emerald-400 font-bold text-lg">{performer.score}</div>
                                                <div className="text-zinc-500 text-[10px]">{performer.tasksCompleted}</div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </Widget>

                </motion.div>
            </LayoutGroup>

            {/* Create Task Modal */}
            {showCreateTaskModal && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[100] p-4" onClick={() => setShowCreateTaskModal(false)}>
                    <div className="bg-gradient-to-b from-zinc-900 to-black border border-white/10 rounded-2xl shadow-2xl max-w-3xl w-full max-h-[85vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                        <div className="flex justify-between items-center p-6 border-b border-white/10">
                            <div>
                                <h2 className="text-2xl font-bold text-white">Create Executive Task</h2>
                                <p className="text-zinc-400 text-sm mt-1">Assign task to Manager/HR</p>
                            </div>
                            <button
                                onClick={() => setShowCreateTaskModal(false)}
                                className="p-2 hover:bg-white/10 rounded-full transition-colors"
                            >
                                <X className="h-5 w-5 text-zinc-400" />
                            </button>
                        </div>

                        <form onSubmit={handleCreateExecutiveTask} className="p-6 space-y-5">
                            {/* Task Type Selection */}
                            <div>
                                <label className="block text-sm font-medium text-zinc-300 mb-3">
                                    Task Type
                                </label>
                                <div className="grid grid-cols-3 gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setTaskType('project')}
                                        className={`px-4 py-3 rounded-lg border transition-all ${taskType === 'project'
                                                ? 'bg-white/10 border-white text-white shadow-[0_0_20px_rgba(255,255,255,0.4)]'
                                                : 'bg-black/30 border-white/10 text-zinc-400 hover:border-white/20'
                                            }`}
                                    >
                                        <div className="text-sm font-medium">Create Task for Project</div>
                                        <div className="text-xs mt-1 opacity-75">Assign task related to a project</div>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setTaskType('other');
                                            setNewExecutiveTask({ ...newExecutiveTask, projectId: '' });
                                        }}
                                        className={`px-4 py-3 rounded-lg border transition-all ${taskType === 'other'
                                                ? 'bg-white/10 border-white text-white shadow-[0_0_20px_rgba(255,255,255,0.4)]'
                                                : 'bg-black/30 border-white/10 text-zinc-400 hover:border-white/20'
                                            }`}
                                    >
                                        <div className="text-sm font-medium">Create Task for Other</div>
                                        <div className="text-xs mt-1 opacity-75">General task without project</div>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setShowCreateTaskModal(false);
                                            setShowReviewTasksModal(true);
                                            fetchAssignedTasks();
                                        }}
                                        className="px-4 py-3 rounded-lg border bg-white/10 border-white/30 text-white hover:bg-white/20 hover:border-white/50 transition-all hover:shadow-[0_0_25px_rgba(255,255,255,0.4)]"
                                    >
                                        <div className="text-sm font-medium">Review Assigned Tasks</div>
                                        <div className="text-xs mt-1 opacity-75">View all tasks to Manager/HR</div>
                                    </button>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-zinc-300 mb-2">Task Description</label>
                                <textarea
                                    required
                                    value={newExecutiveTask.description}
                                    onChange={(e) => setNewExecutiveTask({ ...newExecutiveTask, description: e.target.value })}
                                    rows={3}
                                    className="w-full px-4 py-3 bg-black/50 border border-white/10 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-white/20 transition-all"
                                    placeholder="Brief task description..."
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-zinc-300 mb-2">Assign To (Manager/HR)</label>
                                <select
                                    required
                                    value={newExecutiveTask.assignedTo}
                                    onChange={(e) => {
                                        const selectedUser = managers.find(m => m._id === e.target.value);
                                        setNewExecutiveTask({
                                            ...newExecutiveTask,
                                            assignedTo: e.target.value,
                                            assignedToType: selectedUser?.role || ''
                                        });
                                    }}
                                    className="w-full px-4 py-3 bg-black/50 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-white/20 transition-all"
                                >
                                    <option value="">-- Select Manager/HR --</option>
                                    {managers.map((manager) => (
                                        <option key={manager._id} value={manager._id} className="bg-zinc-900">
                                            {manager.firstName} {manager.lastName} ({manager.role.toUpperCase()})
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Project Selection - Only for Project Tasks */}
                            {taskType === 'project' && (
                                <div>
                                    <label className="block text-sm font-medium text-zinc-300 mb-2">Related Project</label>
                                    <select
                                        required={taskType === 'project'}
                                        value={newExecutiveTask.projectId}
                                        onChange={(e) => setNewExecutiveTask({ ...newExecutiveTask, projectId: e.target.value })}
                                        className="w-full px-4 py-3 bg-black/50 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-white/20 transition-all"
                                    >
                                        <option value="">-- Select Project --</option>
                                        {projectsList.map((project) => (
                                            <option key={project._id} value={project._id} className="bg-zinc-900">
                                                {project.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            <div>
                                <label className="block text-sm font-medium text-zinc-300 mb-2">Deadline</label>
                                <input
                                    type="date"
                                    required
                                    value={newExecutiveTask.deadline}
                                    onChange={(e) => setNewExecutiveTask({ ...newExecutiveTask, deadline: e.target.value })}
                                    min={new Date().toISOString().split('T')[0]}
                                    className="w-full px-4 py-3 bg-black/50 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-white/20 transition-all"
                                />
                            </div>

                            <div className="flex justify-end space-x-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setShowCreateTaskModal(false)}
                                    className="px-5 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="px-5 py-2.5 bg-white text-black rounded-lg font-semibold hover:bg-white/90 transition-all duration-300 shadow-[0_0_20px_rgba(255,255,255,0.3)] hover:shadow-[0_0_30px_rgba(255,255,255,0.5)] disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {loading ? 'Sending...' : 'Send Task'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Review Assigned Tasks Modal */}
            {showReviewTasksModal && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[100] p-4" onClick={() => setShowReviewTasksModal(false)}>
                    <div className="bg-gradient-to-b from-zinc-900 to-black border border-white/10 rounded-2xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
                        <div className="flex justify-between items-center p-6 border-b border-white/10">
                            <div>
                                <h2 className="text-2xl font-bold text-white">Review Assigned Tasks</h2>
                                <p className="text-zinc-400 text-sm mt-1">All tasks assigned to Managers and HR</p>
                            </div>
                            <button
                                onClick={() => setShowReviewTasksModal(false)}
                                className="p-2 hover:bg-white/10 rounded-full transition-colors"
                            >
                                <X className="h-5 w-5 text-zinc-400" />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6">
                            {loadingTasks ? (
                                <div className="flex items-center justify-center py-20">
                                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
                                </div>
                            ) : assignedTasks.length === 0 ? (
                                <div className="text-center py-20">
                                    <div className="text-zinc-400 text-lg">No tasks assigned yet</div>
                                    <p className="text-zinc-500 text-sm mt-2">Create your first executive task to get started</p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {assignedTasks.map((task) => (
                                        <div key={task._id} className="bg-black/30 border border-white/10 rounded-xl p-5 hover:border-white/20 transition-all">
                                            <div className="flex items-start justify-between mb-3">
                                                <div className="flex-1">
                                                    <h3 className="text-white font-semibold text-lg mb-2">{task.description}</h3>
                                                    <div className="flex flex-wrap gap-3 text-sm">
                                                        <div className="flex items-center gap-2 text-zinc-400">
                                                            <UserCheck className="h-4 w-4" />
                                                            <span>Assigned to: <span className="text-white">{task.assignedTo?.firstName} {task.assignedTo?.lastName}</span> ({task.assignedToType?.toUpperCase()})</span>
                                                        </div>
                                                        {task.projectId && (
                                                            <div className="flex items-center gap-2 text-zinc-400">
                                                                <Briefcase className="h-4 w-4" />
                                                                <span>Project: <span className="text-white">{task.projectId.name}</span></span>
                                                            </div>
                                                        )}
                                                        <div className="flex items-center gap-2 text-zinc-400">
                                                            <Clock className="h-4 w-4" />
                                                            <span>Deadline: <span className="text-white">{new Date(task.executiveDeadline).toLocaleDateString()}</span></span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className={`px-3 py-1 rounded-full text-xs font-medium ${task.status === 'completed' ? 'bg-green-500/20 text-green-300' :
                                                        task.status === 'delegated' ? 'bg-blue-500/20 text-blue-300' :
                                                            task.status === 'accepted' ? 'bg-yellow-500/20 text-yellow-300' :
                                                                'bg-zinc-500/20 text-zinc-300'
                                                    }`}>
                                                    {task.status.toUpperCase()}
                                                </div>
                                            </div>
                                            {task.delegatedTask && (
                                                <div className="mt-3 pt-3 border-t border-white/10">
                                                    <div className="text-xs text-zinc-400 mb-2">Delegated To:</div>
                                                    <div className="flex items-center gap-2 text-sm">
                                                        <div className="w-6 h-6 rounded-full bg-blue-500/20 flex items-center justify-center">
                                                            <Users className="h-3 w-3 text-blue-400" />
                                                        </div>
                                                        <span className="text-white">{task.delegatedTask.assignedTo?.firstName} {task.delegatedTask.assignedTo?.lastName}</span>
                                                        <span className="text-zinc-500">({task.delegatedTask.assignedTo?.role})</span>
                                                    </div>
                                                </div>
                                            )}
                                            <div className="mt-3 text-xs text-zinc-500">
                                                Created: {new Date(task.createdAt).toLocaleString()}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div >
    );
};

export default CoFounderSummaryWidgets;
