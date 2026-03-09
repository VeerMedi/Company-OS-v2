import React, { useState, useEffect } from 'react';
import { motion, LayoutGroup } from 'framer-motion';
import {
    Users, Search, Mail, Phone, Briefcase, UserCheck, Shield, Clock,
    Zap, Activity, Filter, Calendar, Mail as MailIcon, Phone as PhoneIcon,
    ArrowRight, TrendingUp, Target, PieChart as PieChartIcon
} from 'lucide-react';
import {
    AreaChart, Area, ResponsiveContainer, BarChart, Bar, Tooltip,
    XAxis, YAxis, CartesianGrid, PieChart, Pie, Cell, LineChart, Line
} from 'recharts';
import api from '../utils/api';

// --- Shared Components ---
const MinimalTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-zinc-900/95 backdrop-blur-md px-4 py-3 rounded-xl border border-white/10 shadow-2xl">
                {label && <p className="text-zinc-400 text-xs font-medium tracking-wide mb-2">{label}</p>}
                {payload.map((item, index) => (
                    <div key={index} className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color || item.fill }} />
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

const AttendanceTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
        const data = payload[0].payload;
        return (
            <div className="bg-zinc-900/95 backdrop-blur-md px-4 py-3 rounded-xl border border-white/10 shadow-2xl">
                {label && <p className="text-zinc-400 text-xs font-bold tracking-wide mb-2">{label}</p>}
                <div className="space-y-1">
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-white" />
                        <span className="text-white font-semibold text-sm">Percentage: {data.percentage}%</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-emerald-500" />
                        <span className="text-emerald-400 font-semibold text-sm">Present: {data.present}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-red-500" />
                        <span className="text-red-400 font-semibold text-sm">Absent: {data.absent}</span>
                    </div>
                </div>
            </div>
        );
    }
    return null;
};

const WidgetHeader = ({ title, subtitle }) => (
    <div className="flex items-start justify-between mb-3 z-10 relative">
        <div>
            <h3 className="text-transparent bg-clip-text bg-gradient-to-r from-white to-zinc-400 font-bold text-sm tracking-wide">{title}</h3>
            {subtitle && <p className="text-zinc-500 text-[10px] mt-0.5 font-medium tracking-wider uppercase">{subtitle}</p>}
        </div>
    </div>
);

const Widget = ({ id, title, subtitle, size, onSizeChange, children, allowOverflow = false }) => {
    const [isDragging, setIsDragging] = useState(false);
    const [dragStartY, setDragStartY] = useState(0);
    const [initialSize, setInitialSize] = useState(size);

    const getGridClass = () => {
        switch (size) {
            case 'small': return 'col-span-1 row-span-1 h-[220px]';
            case 'medium': return 'col-span-1 md:col-span-2 lg:col-span-2 row-span-1 h-[220px]';
            case 'large': return 'col-span-1 md:col-span-2 lg:col-span-2 row-span-2 h-[464px]';
            case 'full': return 'col-span-1 md:col-span-2 lg:col-span-4 row-span-2 h-[464px]';
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
            className={`relative rounded-[24px] bg-gradient-to-b from-[#18181b] to-[#09090b] border border-white/5 shadow-2xl ${allowOverflow ? 'overflow-visible z-50' : 'overflow-hidden'} group outline-none focus:outline-none ${getGridClass()}`}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
        >
            <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/0 to-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
            <motion.div layout className="relative p-6 h-full flex flex-col">
                <WidgetHeader title={title} subtitle={subtitle} />
                <div className="flex-1 min-h-0 relative flex flex-col">
                    {children}
                </div>
            </motion.div>
            <div
                className={`absolute bottom-1 right-1 w-8 h-8 flex items-center justify-center cursor-ns-resize z-20 opacity-0 hover:opacity-100 transition-all duration-200 ${isDragging ? 'opacity-100 scale-110' : ''}`}
                onMouseDown={handleDragStart}
                onTouchStart={handleDragStart}
            >
                <div className="flex flex-col gap-[2px] items-end justify-center p-1">
                    <div className="flex gap-[2px]"><div className={`w-[3px] h-[3px] rounded-full transition-all ${isDragging ? 'bg-blue-400' : 'bg-white/50'}`} /></div>
                    <div className="flex gap-[2px]"><div className={`w-[3px] h-[3px] rounded-full transition-all ${isDragging ? 'bg-blue-400' : 'bg-white/50'}`} /><div className={`w-[3px] h-[3px] rounded-full transition-all ${isDragging ? 'bg-blue-400' : 'bg-white/50'}`} /></div>
                    <div className="flex gap-[2px]"><div className={`w-[3px] h-[3px] rounded-full transition-all ${isDragging ? 'bg-blue-400' : 'bg-white/50'}`} /><div className={`w-[3px] h-[3px] rounded-full transition-all ${isDragging ? 'bg-blue-400' : 'bg-white/50'}`} /><div className={`w-[3px] h-[3px] rounded-full transition-all ${isDragging ? 'bg-blue-400' : 'bg-white/50'}`} /></div>
                </div>
            </div>
        </motion.div>
    );
};

const ManagementDashboard = () => {
    const [employees, setEmployees] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [activeDepartment, setActiveDepartment] = useState('All');
    const [searchQuery, setSearchQuery] = useState('');
    const [departmentStats, setDepartmentStats] = useState({});
    const [attendanceData, setAttendanceData] = useState({ percentage: 0, present: 0, total: 0 });
    const [selectedEmployee, setSelectedEmployee] = useState(null);
    const [showEmployeeModal, setShowEmployeeModal] = useState(false);

    const [widgetStates, setWidgetStates] = useState(() => {
        const defaults = {
            teamSize: 'small',
            departments: 'small',
            activeUsers: 'small',
            management: 'small',
            attendance: 'small'
        };
        const saved = localStorage.getItem('managementDashboardWidgetSizes_v2');
        if (saved) {
            try {
                return { ...defaults, ...JSON.parse(saved) };
            } catch (e) {
                return defaults;
            }
        }
        return defaults;
    });

    useEffect(() => {
        localStorage.setItem('managementDashboardWidgetSizes_v2', JSON.stringify(widgetStates));
    }, [widgetStates]);

    // Prevent background scroll when modal is open
    useEffect(() => {
        if (showEmployeeModal) {
            document.body.classList.add('modal-open');
        } else {
            document.body.classList.remove('modal-open');
        }
        return () => {
            document.body.classList.remove('modal-open');
        };
    }, [showEmployeeModal]);

    useEffect(() => {
        fetchEmployees();
        fetchTodayAttendance();
    }, []);

    const fetchEmployees = async () => {
        try {
            setIsLoading(true);
            const response = await api.get('/users/all');
            const data = response.data.data || [];
            setEmployees(data);
            calculateStats(data);
        } catch (error) {
            console.error('Error fetching employees:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const fetchTodayAttendance = async () => {
        try {
            const today = new Date();
            const dateStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
            const response = await api.get(`/attendance/all?date=${dateStr}`);

            if (response.data && response.data.success && response.data.data.summary) {
                const summary = response.data.data.summary;
                const total = summary.totalEmployees || 0;
                const present = summary.present || 0;
                const percentage = total > 0 ? Math.round((present / total) * 100) : 0;

                setAttendanceData({
                    percentage,
                    present,
                    total,
                    absent: summary.absent || 0,
                    late: summary.late || 0
                });
            }
        } catch (error) {
            console.error('Error fetching attendance:', error);
        }
    };

    const calculateStats = (data) => {
        const stats = data.reduce((acc, curr) => {
            const dept = curr.department || 'Unassigned';
            acc[dept] = (acc[dept] || 0) + 1;
            return acc;
        }, {});
        setDepartmentStats(stats);
    };

    const getDepartments = () => {
        return ['All', ...Object.keys(departmentStats).sort()];
    };

    const filteredEmployees = employees.filter(emp => {
        const matchesSearch = (
            emp.firstName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            emp.lastName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            emp.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            emp.role?.toLowerCase().includes(searchQuery.toLowerCase())
        );

        const matchesDept = activeDepartment === 'All' || (emp.department || 'Unassigned') === activeDepartment;

        return matchesSearch && matchesDept;
    });

    const handleWidgetSizeChange = (id, newSize) => {
        setWidgetStates(prev => ({ ...prev, [id]: newSize }));
    };

    const getRoleBadgeStyle = (role) => {
        const styles = {
            'ceo': 'bg-violet-500/10 text-violet-400 border-violet-500/20',
            'co-founder': 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
            'head-of-sales': 'bg-blue-500/10 text-blue-400 border-blue-500/20',
            'manager': 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
            'team-lead': 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
            'developer': 'bg-orange-500/10 text-orange-400 border-orange-500/20',
            'intern': 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
            'hr': 'bg-pink-500/10 text-pink-400 border-pink-500/20',
            'individual': 'bg-zinc-800 text-zinc-400 border-zinc-700'
        };
        return styles[role?.toLowerCase()] || 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20';
    };

    const getRoleDisplay = (role) => {
        if (!role) return 'Unknown';
        return role.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
    };

    // --- Mock Data for Graphs ---
    const teamGrowthData = [
        { month: 'Jul', value: 82 }, { month: 'Aug', value: 85 }, { month: 'Sep', value: 84 },
        { month: 'Oct', value: 88 }, { month: 'Nov', value: 92 }, { month: 'Dec', value: employees.length || 95 }
    ];

    const attendanceTrendData = [
        { day: 'Mon', percentage: 92, present: 87, absent: 8 },
        { day: 'Tue', percentage: 95, present: 90, absent: 5 },
        { day: 'Wed', percentage: 88, present: 83, absent: 12 },
        { day: 'Thu', percentage: 91, present: 86, absent: 9 },
        { day: 'Fri', percentage: 89, present: 84, absent: 11 },
        { day: 'Sat', percentage: 45, present: 43, absent: 52 },
        { day: 'Sun', percentage: 0, present: 0, absent: 95 }
    ];

    const departmentChartData = Object.entries(departmentStats).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);

    const managementRoles = employees.filter(e => ['ceo', 'co-founder', 'manager', 'head-of-sales'].includes(e.role));
    const roleDistribution = managementRoles.reduce((acc, curr) => {
        const role = getRoleDisplay(curr.role);
        acc[role] = (acc[role] || 0) + 1;
        return acc;
    }, {});
    const roleChartData = Object.entries(roleDistribution).map(([name, value]) => ({ name, value }));

    const COLORS = ['#ffffff', '#a1a1aa', '#71717a', '#52525b', '#3f3f46'];

    if (isLoading) return <div className="p-10 text-white flex items-center justify-center h-64"><Activity className="animate-spin mr-2" /> Loading Directory...</div>;

    return (
        <div className="w-full font-sans space-y-8 animate-in fade-in duration-700">
            {/* Page Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 ml-1">
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-white shadow-xl">
                        <Users size={24} />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold text-white tracking-tight text-glow">Management Suite</h1>
                        <p className="text-zinc-500 text-sm font-medium">Interactive intelligence for team health and departmental growth</p>
                    </div>
                </div>
            </div>

            {/* Widget Grid */}
            <LayoutGroup>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-6 auto-rows-fr">

                    {/* Widget 1: Total Team Size (Achievement Style) */}
                    <Widget id="teamSize" title="Total Team Size" subtitle="Headcount Status" size={widgetStates.teamSize} onSizeChange={handleWidgetSizeChange}>
                        {widgetStates.teamSize === 'small' ? (
                            <div className="flex flex-col items-center justify-center h-full -mt-2">
                                <div className="relative w-28 h-28 border border-white/10 rounded-[32px] flex flex-col items-center justify-center bg-white/[0.02]">
                                    {/* Glowing Border Dot Animation */}
                                    <div className="absolute inset-0 rounded-[32px] border border-white/10 overflow-hidden">
                                        <motion.div
                                            animate={{ top: ['0%', '0%', '100%', '100%', '0%'], left: ['0%', '100%', '100%', '0%', '0%'] }}
                                            transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                                            className="absolute w-1.5 h-1.5 bg-white rounded-full shadow-[0_0_8px_white] -translate-x-1/2 -translate-y-1/2"
                                        />
                                    </div>
                                    <div className="text-white text-3xl font-black drop-shadow-md">{employees.length}</div>
                                    <div className="text-zinc-600 text-[8px] font-black uppercase tracking-widest mt-1">Total</div>
                                </div>
                            </div>
                        ) : widgetStates.teamSize === 'medium' ? (
                            <div className="flex items-center h-full gap-8 px-4">
                                <div className="relative w-32 h-32 border border-white/10 rounded-[40px] flex flex-col items-center justify-center bg-white/[0.02]">
                                    <div className="absolute inset-0 rounded-[40px] border border-white/5 overflow-hidden">
                                        <motion.div
                                            animate={{ top: ['0%', '0%', '100%', '100%', '0%'], left: ['0%', '100%', '100%', '0%', '0%'] }}
                                            transition={{ duration: 5, repeat: Infinity, ease: "linear" }}
                                            className="absolute w-2 h-2 bg-white rounded-full shadow-[0_0_12px_white] -translate-x-1/2 -translate-y-1/2"
                                        />
                                    </div>
                                    <div className="text-white text-4xl font-black">{employees.length}</div>
                                    <div className="text-zinc-600 text-[10px] font-black uppercase tracking-widest mt-1">Headcount</div>
                                </div>
                                <div className="flex-1 space-y-4">
                                    <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                                        <div className="text-zinc-500 text-[10px] font-black uppercase tracking-widest mb-1">Growth Forecast</div>
                                        <div className="text-white text-xl font-bold">+12% Monthly</div>
                                    </div>
                                    <div className="flex gap-2">
                                        <div className="h-1 flex-1 bg-white/20 rounded-full overflow-hidden">
                                            <div className="h-full bg-white w-3/4" />
                                        </div>
                                        <div className="text-zinc-500 text-[10px] font-black">75%</div>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="flex flex-col h-full">
                                <div className="flex justify-between items-center mb-4">
                                    <div>
                                        <div className="text-white text-3xl font-black">{employees.length}</div>
                                        <div className="text-zinc-600 text-[9px] font-black uppercase tracking-widest">Total Employees</div>
                                    </div>
                                    <div className="flex gap-2">
                                        <div className="bg-emerald-500/10 px-3 py-1.5 rounded-lg border border-emerald-500/20">
                                            <div className="text-emerald-400 text-xs font-bold">+4.2%</div>
                                            <div className="text-emerald-600 text-[8px] uppercase font-black">Growth</div>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex-1 min-h-0 -mx-2 mb-4">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <AreaChart data={teamGrowthData} margin={{ left: 20, right: 10, top: 5, bottom: 10 }}>
                                            <defs>
                                                <linearGradient id="teamGradientLarge" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#ffffff" stopOpacity={0.3} />
                                                    <stop offset="95%" stopColor="#ffffff" stopOpacity={0} />
                                                </linearGradient>
                                            </defs>
                                            <CartesianGrid vertical={false} stroke="#ffffff" strokeOpacity={0.05} strokeDasharray="3 3" />
                                            <XAxis dataKey="month" tick={{ fill: '#a1a1aa', fontSize: 11, fontWeight: 700 }} axisLine={false} tickLine={false} />
                                            <Tooltip content={<MinimalTooltip />} />
                                            <Area
                                                type="monotone"
                                                dataKey="value"
                                                stroke="#ffffff"
                                                strokeWidth={3}
                                                fill="url(#teamGradientLarge)"
                                                animationDuration={1500}
                                            />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                </div>
                                <div className="grid grid-cols-3 gap-2 mb-2">
                                    <div className="bg-white/5 rounded-lg p-2 border border-white/5">
                                        <div className="text-zinc-500 text-[8px] uppercase font-black tracking-widest">New Hires</div>
                                        <div className="text-emerald-400 text-xs font-bold mt-1">+8</div>
                                    </div>
                                    <div className="bg-white/5 rounded-lg p-2 border border-white/5">
                                        <div className="text-zinc-500 text-[8px] uppercase font-black tracking-widest">Attrition</div>
                                        <div className="text-red-400 text-xs font-bold mt-1">-4</div>
                                    </div>
                                    <div className="bg-white/5 rounded-lg p-2 border border-white/5">
                                        <div className="text-zinc-500 text-[8px] uppercase font-black tracking-widest">Net Growth</div>
                                        <div className="text-white text-xs font-bold mt-1">+4</div>
                                    </div>
                                </div>
                                <div className="grid grid-cols-3 gap-2">
                                    <div className="bg-white/5 rounded-lg p-2 border border-white/5">
                                        <div className="text-zinc-500 text-[8px] uppercase font-black tracking-widest">Turnover</div>
                                        <div className="text-white text-xs font-bold mt-1">4.2%</div>
                                    </div>
                                    <div className="bg-white/5 rounded-lg p-2 border border-white/5">
                                        <div className="text-zinc-500 text-[8px] uppercase font-black tracking-widest">Avg Tenure</div>
                                        <div className="text-white text-xs font-bold mt-1">3.8y</div>
                                    </div>
                                    <div className="bg-white/5 rounded-lg p-2 border border-white/5">
                                        <div className="text-zinc-500 text-[8px] uppercase font-black tracking-widest">Diversity</div>
                                        <div className="text-white text-xs font-bold mt-1">68%</div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </Widget>



                    {/* Widget 2: Departments (Leads Segmented Gauge Style) */}
                    <Widget id="departments" title="Departments" subtitle="Distribution Matrix" size={widgetStates.departments} onSizeChange={handleWidgetSizeChange}>
                        {widgetStates.departments === 'small' ? (
                            <div className="flex flex-col items-center justify-center h-full mt-2">
                                <div className="relative w-36 h-36 flex items-center justify-center">
                                    {/* Segmented Gauge Effect */}
                                    <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90">
                                        {[...Array(24)].map((_, i) => (
                                            <rect
                                                key={i}
                                                x="48" y="5"
                                                width="4" height="12"
                                                rx="2"
                                                fill={i < (Object.keys(departmentStats).length / 10) * 24 ? "white" : "#27272a"}
                                                transform={`rotate(${i * (360 / 24)} 50 50)`}
                                                style={{
                                                    filter: i < (Object.keys(departmentStats).length / 10) * 24 ? 'drop-shadow(0 0 3px white)' : 'none',
                                                    opacity: i < (Object.keys(departmentStats).length / 10) * 24 ? 1 : 0.3
                                                }}
                                            />
                                        ))}
                                    </svg>
                                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                                        <div className="text-white text-4xl font-black drop-shadow-md">{Object.keys(departmentStats).length}</div>
                                        <div className="text-zinc-600 text-[9px] font-black uppercase tracking-widest mt-1">Units</div>
                                    </div>
                                </div>
                            </div>
                        ) : widgetStates.departments === 'medium' ? (
                            <div className="flex items-center h-full gap-6 px-2">
                                <div className="flex flex-col justify-center border-r border-white/5 pr-6 pl-2">
                                    <div className="text-white text-5xl font-black tracking-tighter drop-shadow-[0_0_10px_rgba(255,255,255,0.3)]">
                                        {departmentChartData.length}
                                    </div>
                                    <div className="text-zinc-600 text-[8px] font-black uppercase tracking-[0.2em] mt-1">Total Units</div>
                                </div>
                                <div className="flex-1 overflow-y-auto no-scrollbar py-2 pr-2">
                                    <div className="space-y-3">
                                        {departmentChartData.slice(0, 3).map((dept, i) => (
                                            <div key={i} className="flex flex-col gap-1.5">
                                                <div className="flex justify-between items-center text-[10px] font-bold">
                                                    <span className="text-zinc-400 uppercase tracking-widest">{dept.name}</span>
                                                    <span className="text-zinc-200">{dept.value}</span>
                                                </div>
                                                <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                                                    <motion.div
                                                        initial={{ width: 0 }}
                                                        animate={{ width: `${(dept.value / employees.length) * 100}%` }}
                                                        transition={{ duration: 1.5, ease: "easeOut" }}
                                                        className="h-full bg-white shadow-[0_0_8px_rgba(255,255,255,0.4)]"
                                                    />
                                                </div>
                                            </div>
                                        ))}
                                        {departmentChartData.length > 3 && (
                                            <div className="text-[8px] text-zinc-600 font-black uppercase tracking-widest text-right mt-1">
                                                + {departmentChartData.length - 3} More Units
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="flex flex-col h-full">
                                <div className="flex justify-between items-center mb-4">
                                    <div>
                                        <div className="text-white text-3xl font-black">{departmentChartData.length}</div>
                                        <div className="text-zinc-600 text-[9px] font-black uppercase tracking-widest">Business Units</div>
                                    </div>
                                    <div className="flex gap-2">
                                        <div className="bg-white/5 px-3 py-1.5 rounded-lg border border-white/10">
                                            <div className="text-white text-xs font-bold">{employees.length}</div>
                                            <div className="text-zinc-600 text-[8px] uppercase font-black">Total Staff</div>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex-1 min-h-0 -mx-2 mb-4">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={departmentChartData} layout="vertical" margin={{ left: -10, right: 20 }}>
                                            <XAxis type="number" hide />
                                            <YAxis dataKey="name" type="category" tick={{ fill: '#71717a', fontSize: 9, fontWeight: 700 }} width={70} axisLine={false} tickLine={false} />
                                            <Tooltip cursor={{ fill: 'rgba(255,255,255,0.03)' }} content={<MinimalTooltip />} />
                                            <Bar dataKey="value" fill="#ffffff" radius={[0, 4, 4, 0]} barSize={16} animationDuration={1000}>
                                                {departmentChartData.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} style={{ filter: `drop-shadow(0px 0px 4px rgba(255,255,255,${0.2 + index * 0.05}))` }} />
                                                ))}
                                            </Bar>
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                                <div className="grid grid-cols-3 gap-2">
                                    <div className="bg-white/5 rounded-lg p-2 border border-white/5">
                                        <div className="text-zinc-500 text-[8px] uppercase font-black tracking-widest">Largest</div>
                                        <div className="text-white text-xs font-bold mt-1">{departmentChartData[0]?.name || 'N/A'}</div>
                                    </div>
                                    <div className="bg-white/5 rounded-lg p-2 border border-white/5">
                                        <div className="text-zinc-500 text-[8px] uppercase font-black tracking-widest">Avg Size</div>
                                        <div className="text-white text-xs font-bold mt-1">{Math.round(employees.length / departmentChartData.length)}</div>
                                    </div>
                                    <div className="bg-white/5 rounded-lg p-2 border border-white/5">
                                        <div className="text-zinc-500 text-[8px] uppercase font-black tracking-widest">Growth</div>
                                        <div className="text-emerald-400 text-xs font-bold mt-1">+8%</div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </Widget>

                    {/* Widget 3: Active Users (Revenue Targets Style) */}
                    <Widget id="activeUsers" title="Active Users" subtitle="Real-time Status" size={widgetStates.activeUsers} onSizeChange={handleWidgetSizeChange}>
                        {widgetStates.activeUsers === 'small' ? (
                            <div className="flex flex-col h-full justify-center items-center text-center pb-2">
                                <div className="flex items-center gap-2 mb-3">
                                    <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)] animate-pulse" />
                                    <div className="text-white text-[9px] font-black uppercase tracking-widest">Active Matrix</div>
                                </div>
                                <div className="relative">
                                    <div className="text-white text-6xl font-black tracking-tighter border-b-4 border-white inline-block px-2">
                                        {employees.filter(e => e.isActive !== false).length}
                                    </div>
                                    <div className="absolute -right-8 top-1/2 -translate-y-1/2 opacity-20">
                                        <div className="w-6 h-6 rounded-full border border-white/20 flex items-center justify-center">
                                            <div className="w-1.5 h-1.5 rounded-full bg-white/40" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ) : widgetStates.activeUsers === 'medium' ? (
                            <div className="flex items-center h-full gap-6 px-2">
                                <div className="flex flex-col justify-center border-r border-white/5 pr-6 pl-2">
                                    <div className="flex items-center gap-2 mb-2">
                                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_#10b981] animate-pulse" />
                                        <div className="text-zinc-500 text-[8px] font-black uppercase tracking-widest">Live</div>
                                    </div>
                                    <div className="text-white text-5xl font-black tracking-tighter drop-shadow-[0_0_10px_rgba(255,255,255,0.3)]">
                                        {employees.filter(e => e.isActive !== false).length}
                                    </div>
                                    <div className="text-zinc-600 text-[8px] font-black uppercase tracking-[0.2em] mt-1">Active Now</div>
                                </div>
                                <div className="flex-1 flex flex-col justify-center gap-4">
                                    <div className="flex items-center justify-between">
                                        <div className="text-zinc-500 text-[9px] font-black uppercase tracking-widest">Sync Rate</div>
                                        <div className="text-white text-lg font-black">92%</div>
                                    </div>
                                    <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                                        <motion.div
                                            initial={{ width: 0 }}
                                            animate={{ width: '92%' }}
                                            transition={{ duration: 1.5, ease: "easeOut" }}
                                            className="h-full bg-white shadow-[0_0_8px_white]"
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-2 mt-2">
                                        <div className="bg-white/5 rounded-lg p-2 border border-white/5">
                                            <div className="text-zinc-600 text-[7px] uppercase font-black tracking-widest">Online</div>
                                            <div className="text-emerald-400 text-sm font-bold mt-0.5">{employees.filter(e => e.isActive !== false).length}</div>
                                        </div>
                                        <div className="bg-white/5 rounded-lg p-2 border border-white/5">
                                            <div className="text-zinc-600 text-[7px] uppercase font-black tracking-widest">Offline</div>
                                            <div className="text-zinc-500 text-sm font-bold mt-0.5">{employees.filter(e => e.isActive === false).length}</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="flex flex-col h-full relative p-4">
                                {/* Matrix Grid Pattern */}
                                <div className="absolute inset-0 opacity-5 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)', backgroundSize: '16px 16px' }} />

                                <div className="relative z-10 flex flex-col h-full">
                                    <div className="flex justify-between items-start mb-6">
                                        <div>
                                            <div className="flex items-center gap-2 mb-2">
                                                <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_10px_#10b981] animate-pulse" />
                                                <div className="text-zinc-500 text-[10px] font-black uppercase tracking-[0.2em]">STATUS</div>
                                            </div>
                                            <div className="text-white text-base font-black uppercase tracking-widest">Active Matrix</div>
                                        </div>
                                        <div className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center bg-white/5 opacity-30">
                                            <div className="w-5 h-5 rounded-full border border-white/20 flex items-center justify-center">
                                                <div className="w-2 h-2 rounded-full bg-white/50" />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-center mb-6">
                                        <div className="text-center">
                                            <div className="text-white text-7xl font-black tracking-tighter border-b-8 border-white inline-block pb-1">
                                                {employees.filter(e => e.isActive !== false).length}
                                            </div>
                                            <div className="text-zinc-600 text-[10px] font-black uppercase tracking-widest mt-2">Currently Active</div>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-3 gap-3 mb-4">
                                        <div className="bg-emerald-500/10 rounded-lg p-3 border border-emerald-500/20">
                                            <div className="text-emerald-600 text-[8px] uppercase font-black tracking-widest">Active</div>
                                            <div className="text-emerald-400 text-xl font-black mt-1">{employees.filter(e => e.isActive !== false).length}</div>
                                        </div>
                                        <div className="bg-amber-500/10 rounded-lg p-3 border border-amber-500/20">
                                            <div className="text-amber-600 text-[8px] uppercase font-black tracking-widest">Idle</div>
                                            <div className="text-amber-400 text-xl font-black mt-1">2</div>
                                        </div>
                                        <div className="bg-zinc-800/50 rounded-lg p-3 border border-white/5">
                                            <div className="text-zinc-600 text-[8px] uppercase font-black tracking-widest">Offline</div>
                                            <div className="text-zinc-500 text-xl font-black mt-1">{employees.filter(e => e.isActive === false).length}</div>
                                        </div>
                                    </div>

                                    <div className="flex-1 min-h-0">
                                        <div className="text-zinc-500 text-[9px] font-black uppercase tracking-widest mb-2">Activity Trend (7 Days)</div>
                                        <ResponsiveContainer width="100%" height="100%">
                                            <LineChart data={[
                                                { day: 'Mon', active: 8 }, { day: 'Tue', active: 9 }, { day: 'Wed', active: 7 },
                                                { day: 'Thu', active: 9 }, { day: 'Fri', active: employees.filter(e => e.isActive !== false).length },
                                                { day: 'Sat', active: 3 }, { day: 'Sun', active: 2 }
                                            ]}>
                                                <CartesianGrid vertical={false} stroke="#ffffff" strokeOpacity={0.03} />
                                                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: '#52525b', fontSize: 9, fontWeight: 700 }} />
                                                <Tooltip content={<MinimalTooltip />} />
                                                <Line
                                                    type="monotone"
                                                    dataKey="active"
                                                    stroke="#10b981"
                                                    strokeWidth={3}
                                                    dot={{ fill: '#121214', stroke: '#10b981', strokeWidth: 2, r: 4 }}
                                                    activeDot={{ r: 6, fill: '#10b981', stroke: '#121214', strokeWidth: 2 }}
                                                />
                                            </LineChart>
                                        </ResponsiveContainer>
                                    </div>

                                    <div className="flex items-center gap-4 mt-4 pt-4 border-t border-white/5">
                                        <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
                                            <div className="h-full bg-white w-[92%] shadow-[0_0_8px_white]" />
                                        </div>
                                        <div className="text-white font-black text-sm">92% Sync</div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </Widget>

                    {/* Widget 4: Management (Pie/Ring Design) */}
                    <Widget id="management" title="Management" subtitle="Leadership Team" size={widgetStates.management} onSizeChange={handleWidgetSizeChange}>
                        {widgetStates.management === 'small' ? (
                            <div className="flex flex-col items-center justify-center h-full -mt-2">
                                <div className="text-white text-5xl font-bold tracking-tight">
                                    {managementRoles.length}
                                </div>
                                <div className="text-zinc-500 text-[9px] uppercase font-black tracking-widest mt-3 flex items-center gap-1.5 px-3 py-1 bg-white/5 rounded-full border border-white/5">
                                    <Shield size={10} className="text-zinc-600" /> Decision Makers
                                </div>
                            </div>
                        ) : widgetStates.management === 'medium' ? (
                            <div className="flex items-center h-full gap-6 px-2">
                                <div className="flex flex-col justify-center border-r border-white/5 pr-6 pl-2">
                                    <Shield className="text-zinc-600 mb-2" size={20} />
                                    <div className="text-white text-5xl font-black tracking-tighter drop-shadow-[0_0_10px_rgba(255,255,255,0.3)]">
                                        {managementRoles.length}
                                    </div>
                                    <div className="text-zinc-600 text-[8px] font-black uppercase tracking-[0.2em] mt-1">Leaders</div>
                                </div>
                                <div className="flex-1 overflow-y-auto no-scrollbar py-2 pr-2">
                                    <div className="space-y-3">
                                        {roleChartData.map((role, i) => (
                                            <div key={i} className="flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                                                    <span className="text-zinc-400 text-[10px] uppercase tracking-widest font-bold">{role.name}</span>
                                                </div>
                                                <span className="text-white text-sm font-black">{role.value}</span>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="mt-4 pt-3 border-t border-white/5">
                                        <div className="text-zinc-600 text-[8px] uppercase font-black tracking-widest mb-2">Hierarchy</div>
                                        <div className="flex items-center gap-1">
                                            {[...Array(managementRoles.length)].map((_, i) => (
                                                <div key={i} className="flex-1 h-1 bg-white/20 rounded-full" />
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="flex flex-col h-full">
                                <div className="flex justify-between items-center mb-4">
                                    <div>
                                        <div className="text-white text-3xl font-black">{managementRoles.length}</div>
                                        <div className="text-zinc-600 text-[9px] font-black uppercase tracking-widest">Leadership Team</div>
                                    </div>
                                    <div className="flex gap-2">
                                        <div className="bg-white/5 px-3 py-1.5 rounded-lg border border-white/10">
                                            <div className="text-white text-xs font-bold">{roleChartData.length}</div>
                                            <div className="text-zinc-600 text-[8px] uppercase font-black">Roles</div>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex gap-4 mb-4 flex-1 min-h-0">
                                    <div className="flex-1 relative">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <PieChart>
                                                <Pie
                                                    data={roleChartData}
                                                    cx="50%"
                                                    cy="50%"
                                                    innerRadius="55%"
                                                    outerRadius="80%"
                                                    paddingAngle={5}
                                                    dataKey="value"
                                                    stroke="none"
                                                >
                                                    {roleChartData.map((entry, index) => (
                                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} style={{ filter: `drop-shadow(0 0 4px ${COLORS[index % COLORS.length]})` }} />
                                                    ))}
                                                </Pie>
                                                <Tooltip content={<MinimalTooltip />} />
                                            </PieChart>
                                        </ResponsiveContainer>
                                        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                                            <div className="text-white text-3xl font-black">{managementRoles.length}</div>
                                            <div className="text-zinc-600 text-[8px] font-black uppercase tracking-widest">Total</div>
                                        </div>
                                    </div>
                                    <div className="flex-1 overflow-y-auto no-scrollbar space-y-2">
                                        {roleChartData.map((role, i) => (
                                            <div key={i} className="bg-white/5 rounded-lg p-3 border border-white/5">
                                                <div className="flex items-center justify-between mb-1">
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length], boxShadow: `0 0 6px ${COLORS[i % COLORS.length]}` }} />
                                                        <span className="text-white text-xs font-bold">{role.name}</span>
                                                    </div>
                                                    <span className="text-white text-lg font-black">{role.value}</span>
                                                </div>
                                                <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                                                    <div className="h-full" style={{ width: `${(role.value / managementRoles.length) * 100}%`, backgroundColor: COLORS[i % COLORS.length] }} />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                <div className="grid grid-cols-3 gap-2">
                                    <div className="bg-white/5 rounded-lg p-2 border border-white/5">
                                        <div className="text-zinc-500 text-[8px] uppercase font-black tracking-widest">Span</div>
                                        <div className="text-white text-xs font-bold mt-1">{Math.round(employees.length / managementRoles.length)}</div>
                                    </div>
                                    <div className="bg-white/5 rounded-lg p-2 border border-white/5">
                                        <div className="text-zinc-500 text-[8px] uppercase font-black tracking-widest">Avg Exp</div>
                                        <div className="text-white text-xs font-bold mt-1">5.2y</div>
                                    </div>
                                    <div className="bg-white/5 rounded-lg p-2 border border-white/5">
                                        <div className="text-zinc-500 text-[8px] uppercase font-black tracking-widest">Retention</div>
                                        <div className="text-emerald-400 text-xs font-bold mt-1">94%</div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </Widget>

                    {/* Widget 5: Attendance (Line Chart & Matrix Design) */}
                    <Widget id="attendance" title="Today's Attendance" subtitle="Daily Sync Rate" size={widgetStates.attendance} onSizeChange={handleWidgetSizeChange}>
                        {widgetStates.attendance === 'small' ? (
                            <div className="flex flex-col items-center justify-center h-full -mt-2 text-center">
                                <div className="text-white text-5xl font-bold tracking-tighter drop-shadow-[0_0_10px_rgba(255,255,255,0.3)]">
                                    {attendanceData.percentage}%
                                </div>
                                <div className="mt-4 flex items-center justify-center gap-2">
                                    <div className="w-16 h-1.5 bg-white/5 rounded-full overflow-hidden border border-white/5">
                                        <div className="h-full bg-white shadow-[0_0_8px_white]" style={{ width: `${attendanceData.percentage}%` }} />
                                    </div>
                                    <span className="text-[9px] text-zinc-500 font-black uppercase tracking-widest">
                                        {attendanceData.present}/{attendanceData.total}
                                    </span>
                                </div>
                            </div>
                        ) : widgetStates.attendance === 'medium' ? (
                            <div className="flex items-center h-full gap-6 px-2">
                                <div className="flex flex-col justify-center border-r border-white/5 pr-6 pl-2">
                                    <Clock className="text-zinc-600 mb-2" size={20} />
                                    <div className="text-white text-5xl font-black tracking-tighter drop-shadow-[0_0_10px_rgba(255,255,255,0.3)]">
                                        {attendanceData.percentage}%
                                    </div>
                                    <div className="text-zinc-600 text-[8px] font-black uppercase tracking-[0.2em] mt-1">Today</div>
                                </div>
                                <div className="flex-1 flex flex-col justify-center gap-4">
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="bg-emerald-500/10 rounded-lg p-2 border border-emerald-500/20">
                                            <div className="text-emerald-600 text-[8px] uppercase font-black tracking-widest">Present</div>
                                            <div className="text-emerald-400 text-xl font-black mt-0.5">{attendanceData.present}</div>
                                        </div>
                                        <div className="bg-red-500/10 rounded-lg p-2 border border-red-500/20">
                                            <div className="text-red-600 text-[8px] uppercase font-black tracking-widest">Absent</div>
                                            <div className="text-red-400 text-xl font-black mt-0.5">{attendanceData.absent || 0}</div>
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between text-[9px]">
                                        <span className="text-zinc-500 font-black uppercase tracking-widest">On-Time</span>
                                        <span className="text-white font-bold">92%</span>
                                    </div>
                                    <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                                        <motion.div
                                            initial={{ width: 0 }}
                                            animate={{ width: '92%' }}
                                            transition={{ duration: 1.5, ease: "easeOut" }}
                                            className="h-full bg-white shadow-[0_0_8px_white]"
                                        />
                                    </div>
                                    {attendanceData.late > 0 && (
                                        <div className="text-amber-500 text-[8px] font-bold uppercase tracking-widest">
                                            {attendanceData.late} Late Arrivals
                                        </div>
                                    )}
                                </div>
                            </div>
                        ) : (
                            <div className="flex flex-col h-full">
                                <div className="flex justify-between items-center mb-4">
                                    <div className="text-white text-3xl font-black">{attendanceData.percentage}%</div>
                                    <div className="px-2 py-1 bg-white/5 border border-white/10 rounded-lg text-[10px] text-zinc-400 font-bold uppercase tracking-widest">Weekly Score</div>
                                </div>
                                <div className="flex-1 min-h-0 -mx-4">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <LineChart data={attendanceTrendData} margin={{ left: 20, right: 10, top: 5, bottom: 10 }}>
                                            <CartesianGrid vertical={false} stroke="#ffffff" strokeOpacity={0.03} />
                                            <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: '#a1a1aa', fontSize: 11, fontWeight: 700 }} />
                                            <Tooltip content={<AttendanceTooltip />} />
                                            <Line
                                                type="monotone"
                                                dataKey="percentage"
                                                stroke="#ffffff"
                                                strokeWidth={4}
                                                dot={{ fill: '#121214', stroke: '#ffffff', strokeWidth: 2, r: 4 }}
                                                activeDot={{ r: 6, fill: '#ffffff', stroke: '#121214', strokeWidth: 2 }}
                                                animationDuration={2000}
                                            />
                                        </LineChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                        )}
                    </Widget>
                </div>
            </LayoutGroup>

            {/* Main Content Area: Directory */}
            <div className="bg-[#18181b] border border-white/5 rounded-[32px] overflow-hidden shadow-2xl relative mt-4">
                <div className="absolute inset-0 bg-gradient-to-tr from-white/0 to-white/[0.02] pointer-events-none" />

                {/* Toolbar & Filter */}
                <div className="p-8 border-b border-white/5">
                    <div className="flex flex-col lg:flex-row justify-between items-center gap-8 mb-8">
                        <div className="relative flex-1 max-w-md w-full group">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 w-4 h-4 group-focus-within:text-white transition-colors" />
                            <input
                                type="text"
                                placeholder="Search by name, role or email..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 pl-12 pr-6 text-sm text-white placeholder:text-zinc-600 focus:border-white/20 focus:bg-white/10 outline-none transition-all shadow-inner"
                            />
                        </div>

                        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar max-w-full pb-1">
                            {getDepartments().map(dept => (
                                <button
                                    key={dept}
                                    onClick={() => setActiveDepartment(dept)}
                                    className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border ${activeDepartment === dept
                                        ? 'bg-white text-black border-white shadow-[0_0_20px_rgba(255,255,255,0.2)]'
                                        : 'bg-white/5 text-zinc-500 border-white/5 hover:bg-white/10 hover:text-white'
                                        }`}
                                >
                                    {dept} {dept !== 'All' && `(${departmentStats[dept]})`}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Directory Table */}
                <div className="overflow-x-auto min-h-[500px] custom-scrollbar">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-white/5 bg-[#0d0d0f]/50">
                                <th className="py-5 px-8 text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em]">Employee</th>
                                <th className="py-5 px-4 text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em]">Role & Designation</th>
                                <th className="py-5 px-4 text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em]">Team / Dept</th>
                                <th className="py-5 px-4 text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em]">Contact Information</th>
                                <th className="py-5 px-4 text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] text-center">Status</th>
                                <th className="py-5 px-8 text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/[0.03]">
                            {filteredEmployees.map((emp) => (
                                <tr key={emp._id} className="group hover:bg-white/[0.02] transition-all duration-300">
                                    <td className="py-6 px-8">
                                        <div className="flex items-center gap-4">
                                            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-white/10 to-white/5 flex items-center justify-center text-white font-bold text-base shadow-lg group-hover:scale-105 transition-transform border border-white/10">
                                                {emp.firstName?.charAt(0)}{emp.lastName?.charAt(0)}
                                            </div>
                                            <div>
                                                <div className="text-white font-bold text-base tracking-tight mb-0.5">{emp.firstName} {emp.lastName}</div>
                                                <div className="text-zinc-600 text-[10px] font-black flex items-center gap-1.5 uppercase tracking-widest">
                                                    Joined {new Date(emp.createdAt).toLocaleDateString('en-IN', { month: 'short', day: '2-digit', year: 'numeric' })}
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="py-6 px-4">
                                        <div className="flex flex-col gap-1.5">
                                            <span className={`w-fit px-2.5 py-0.5 rounded-lg text-[9px] uppercase font-black tracking-wider border ${getRoleBadgeStyle(emp.role)}`}>
                                                {getRoleDisplay(emp.role)}
                                            </span>
                                            {emp.designation && <div className="text-zinc-400 text-[10px] font-medium tracking-tight ml-0.5">{emp.designation}</div>}
                                            <div className="text-zinc-600 text-[9px] font-bold uppercase tracking-tighter ml-0.5">{emp.employeeId || 'ID PENDING'}</div>
                                        </div>
                                    </td>
                                    <td className="py-6 px-4 text-zinc-400">
                                        <div className="text-white font-bold text-sm tracking-tight mb-0.5">{emp.department || 'Executive'}</div>
                                        {emp.reportingToName && (
                                            <div className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest flex items-center gap-1">
                                                <Zap size={10} fill="currentColor" className="text-zinc-600" />
                                                Report: {emp.reportingToName}
                                            </div>
                                        )}
                                        {emp.specializations && emp.specializations.length > 0 && (
                                            <div className="flex flex-wrap gap-1.5 mt-2">
                                                {emp.specializations.map((spec, idx) => (
                                                    <span key={idx} className="text-[9px] px-1.5 py-0.5 bg-white/5 text-zinc-400 rounded-md border border-white/5 font-bold uppercase tracking-tighter hover:text-white transition-colors">
                                                        {spec}
                                                    </span>
                                                ))}
                                            </div>
                                        )}
                                    </td>
                                    <td className="py-6 px-4">
                                        <div className="space-y-1.5">
                                            <div className="flex items-center gap-2 text-zinc-400 text-xs font-semibold group/mail cursor-pointer hover:text-white transition-colors">
                                                <Mail size={12} className="text-zinc-600 group-hover/mail:text-white" />
                                                {emp.email}
                                            </div>
                                            {emp.phoneNumber && (
                                                <div className="flex items-center gap-2 text-zinc-400 text-xs font-semibold group/phone cursor-pointer hover:text-white transition-colors">
                                                    <Phone size={12} className="text-zinc-600 group-hover/phone:text-white" />
                                                    {emp.phoneNumber}
                                                </div>
                                            )}
                                        </div>
                                    </td>
                                    <td className="py-6 px-4 text-center">
                                        <span className={`px-3 py-1 rounded-lg text-[9px] uppercase font-black tracking-widest border shadow-sm ${emp.isActive !== false
                                            ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                                            : 'bg-red-500/10 text-red-500 border-red-500/20'
                                            }`}>
                                            {emp.isActive !== false ? 'Active' : 'Inactive'}
                                        </span>
                                    </td>
                                    <td className="py-6 px-8 text-right">
                                        <button
                                            onClick={() => {
                                                setSelectedEmployee(emp);
                                                setShowEmployeeModal(true);
                                            }}
                                            className="p-2 bg-white/5 text-zinc-500 hover:text-white hover:bg-white/10 rounded-xl transition-all border border-white/5 hover:border-white/20 active:scale-95 ml-auto flex items-center justify-center"
                                        >
                                            <ArrowRight size={18} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Employee Detail Modal */}
            {showEmployeeModal && selectedEmployee && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setShowEmployeeModal(false)}>
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        onClick={(e) => e.stopPropagation()}
                        className="modal-content bg-[#18181b] border border-white/10 rounded-[32px] p-8 max-w-2xl w-full shadow-2xl relative overflow-y-auto max-h-[90vh]"
                    >
                        <div className="absolute inset-0 bg-gradient-to-tr from-white/0 to-white/[0.02] pointer-events-none" />

                        <div className="relative z-10">
                            <div className="flex items-start justify-between mb-6">
                                <div className="flex items-center gap-4">
                                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-white/10 to-white/5 flex items-center justify-center text-white font-bold text-2xl shadow-lg border border-white/10">
                                        {selectedEmployee.firstName?.charAt(0)}{selectedEmployee.lastName?.charAt(0)}
                                    </div>
                                    <div>
                                        <h2 className="text-white text-2xl font-black tracking-tight">{selectedEmployee.firstName} {selectedEmployee.lastName}</h2>
                                        <p className="text-zinc-500 text-sm font-medium">{selectedEmployee.email}</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setShowEmployeeModal(false)}
                                    className="p-2 bg-white/5 hover:bg-white/10 rounded-xl transition-all border border-white/5 hover:border-white/20"
                                >
                                    <svg className="w-5 h-5 text-zinc-400 hover:text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>

                            <div className="grid grid-cols-2 gap-4 mb-6">
                                <div className="bg-white/5 rounded-2xl p-4 border border-white/5">
                                    <div className="text-zinc-500 text-xs font-black uppercase tracking-widest mb-2">Role</div>
                                    <div className={`w-fit px-3 py-1 rounded-lg text-xs uppercase font-black tracking-wider border ${getRoleBadgeStyle(selectedEmployee.role)}`}>
                                        {getRoleDisplay(selectedEmployee.role)}
                                    </div>
                                </div>
                                <div className="bg-white/5 rounded-2xl p-4 border border-white/5">
                                    <div className="text-zinc-500 text-xs font-black uppercase tracking-widest mb-2">Department</div>
                                    <div className="text-white font-bold">{selectedEmployee.department || 'Executive'}</div>
                                </div>
                                <div className="bg-white/5 rounded-2xl p-4 border border-white/5">
                                    <div className="text-zinc-500 text-xs font-black uppercase tracking-widest mb-2">Phone</div>
                                    <div className="text-white font-semibold">{selectedEmployee.phoneNumber || 'N/A'}</div>
                                </div>
                                <div className="bg-white/5 rounded-2xl p-4 border border-white/5">
                                    <div className="text-zinc-500 text-xs font-black uppercase tracking-widest mb-2">Status</div>
                                    <span className={`px-3 py-1 rounded-lg text-xs uppercase font-black tracking-widest border ${selectedEmployee.isActive !== false ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-red-500/10 text-red-500 border-red-500/20'}`}>
                                        {selectedEmployee.isActive !== false ? 'Active' : 'Inactive'}
                                    </span>
                                </div>
                            </div>

                            {selectedEmployee.reportingToName && (
                                <div className="bg-white/5 rounded-2xl p-4 border border-white/5 mb-4">
                                    <div className="text-zinc-500 text-xs font-black uppercase tracking-widest mb-2">Reports To</div>
                                    <div className="text-white font-bold">{selectedEmployee.reportingToName}</div>
                                </div>
                            )}

                            {selectedEmployee.specializations && selectedEmployee.specializations.length > 0 && (
                                <div className="bg-white/5 rounded-2xl p-4 border border-white/5 mb-4">
                                    <div className="text-zinc-500 text-xs font-black uppercase tracking-widest mb-3">Specializations</div>
                                    <div className="flex flex-wrap gap-2">
                                        {selectedEmployee.specializations.map((spec, idx) => (
                                            <span key={idx} className="text-xs px-3 py-1 bg-white/10 text-white rounded-lg border border-white/10 font-bold">
                                                {spec}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div className="bg-white/5 rounded-2xl p-4 border border-white/5">
                                <div className="text-zinc-500 text-xs font-black uppercase tracking-widest mb-2">Joined</div>
                                <div className="text-white font-bold">{new Date(selectedEmployee.createdAt).toLocaleDateString('en-IN', { month: 'long', day: 'numeric', year: 'numeric' })}</div>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </div>
    );
};

export default ManagementDashboard;
