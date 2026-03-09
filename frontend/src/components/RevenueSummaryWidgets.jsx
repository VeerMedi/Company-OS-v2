import React, { useState, useEffect, useMemo } from 'react';
import { motion, LayoutGroup } from 'framer-motion';
import {
    DollarSign,
    TrendingUp,
    Target,
    PieChart as PieChartIcon,
    ArrowUpRight,
    ArrowDownRight,
    Calendar,
    Users,
    Activity,
    Clock,
    CheckCircle2,
    XCircle,
    Building2,
    Briefcase
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
    CartesianGrid,
    LineChart,
    Line
} from 'recharts';
import { formatDate } from '../utils/helpers';

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
                            {item.name || 'Value'}: {typeof item.value === 'number' ?
                                (item.name?.toLowerCase().includes('revenue') ? formatRevenue(item.value) : item.value.toLocaleString())
                                : item.value}
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
    <div className="flex items-start justify-between mb-3 z-10 relative px-1">
        <div>
            <h3 className="text-transparent bg-clip-text bg-gradient-to-r from-white to-zinc-400 font-bold text-sm tracking-wide">{title}</h3>
            {subtitle && <p className="text-zinc-500 text-[10px] mt-0.5 font-medium tracking-wider uppercase">{subtitle}</p>}
        </div>
    </div>
);

// Widget Component with Drag Handle
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
        const isWideWidget = id === 'monthlyTrend' || id === 'activeTargets' || id === 'totalRevenue';
        switch (size) {
            case 'small': return 'col-span-1 row-span-1 h-[220px]';
            case 'medium': return 'col-span-1 md:col-span-2 lg:col-span-2 row-span-1 h-[220px]';
            case 'large':
                if (isWideWidget) {
                    return 'col-span-1 md:col-span-4 lg:col-span-4 row-span-2 h-[464px]';
                }
                return 'col-span-1 md:col-span-2 lg:col-span-2 row-span-2 h-[464px]';
            default: return 'col-span-1 h-[220px]';
        }
    };

    const handleDragStart = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
        setDragStartY(e.clientY || e.touches?.[0]?.clientY || 0);
        setInitialSize(size);
    };

    const handleDragMove = (e) => {
        if (!isDragging) return;
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
    };

    useEffect(() => {
        if (isDragging) {
            window.addEventListener('mousemove', handleDragMove);
            window.addEventListener('mouseup', handleDragEnd);
            return () => {
                window.removeEventListener('mousemove', handleDragMove);
                window.removeEventListener('mouseup', handleDragEnd);
            };
        }
    }, [isDragging]);

    return (
        <motion.div
            layout
            className={`relative rounded-[24px] bg-gradient-to-b from-[#18181b] to-[#09090b] border border-white/5 shadow-2xl overflow-hidden group outline-none ${getGridClass()}`}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
        >
            <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/0 to-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />

            <motion.div layout className="relative p-6 h-full flex flex-col">
                <WidgetHeader title={title} subtitle={subtitle} />
                <div className="flex-1 min-h-0 relative flex flex-col z-0">
                    {children}
                </div>
            </motion.div>

            {/* Draggable Handle */}
            <div
                className="absolute bottom-1 right-1 w-8 h-8 flex items-center justify-center cursor-ns-resize z-20 opacity-0 group-hover:opacity-100 transition-opacity"
                onMouseDown={handleDragStart}
            >
                <div className="flex flex-col gap-[2px] items-end">
                    <div className="w-1 h-1 bg-white/20 rounded-full" />
                    <div className="flex gap-[2px]">
                        <div className="w-1 h-1 bg-white/20 rounded-full" />
                        <div className="w-1 h-1 bg-white/20 rounded-full" />
                    </div>
                </div>
            </div>
        </motion.div>
    );
};

// Main Component
const RevenueSummaryWidgets = ({ revenueData }) => {
    const [widgetStates, setWidgetStates] = useState(() => {
        const defaults = {
            totalRevenue: 'small',
            monthlyTrend: 'medium',
            targetProgress: 'small',
            deptBreakdown: 'medium',
            activeTargets: 'large',
            pendingResponses: 'medium',
            topPerformers: 'medium'
        };
        const saved = localStorage.getItem('revenueDashboardWidgetSizes_v1');
        return saved ? { ...defaults, ...JSON.parse(saved) } : defaults;
    });

    useEffect(() => {
        localStorage.setItem('revenueDashboardWidgetSizes_v1', JSON.stringify(widgetStates));
    }, [widgetStates]);

    const handleWidgetSizeChange = (id, newSize) => {
        setWidgetStates(prev => ({ ...prev, [id]: newSize }));
    };

    // Mock Data for Revenue Dashboard
    const mockData = useMemo(() => ({
        totalRevenue: 12500000,
        lastMonthRevenue: 10800000,
        trend: Array.from({ length: 12 }).map((_, i) => ({
            month: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][i],
            revenue: 800000 + Math.random() * 400000,
            target: 1000000
        })),
        departments: [
            { name: 'Hardware', value: 4500000, color: '#ffffff' },
            { name: 'Software', value: 3200000, color: '#a1a1aa' },
            { name: 'Consulting', value: 2800000, color: '#71717a' },
            { name: 'Support', value: 2000000, color: '#3f3f46' }
        ],
        activeTargets: [
            { id: 1, period: 'Q1 2026', amount: 5000000, achieved: 3200000, status: 'on-track', progress: 64, startDate: '2026-01-01', endDate: '2026-03-31' },
            { id: 2, period: 'Monthly (Jan)', amount: 1500000, achieved: 1200000, status: 'at-risk', progress: 80, startDate: '2026-01-01', endDate: '2026-01-31' },
            { id: 3, period: 'Yearly 2026', amount: 20000000, achieved: 4500000, status: 'on-track', progress: 22.5, startDate: '2026-01-01', endDate: '2026-12-31' }
        ],
        pendingResponses: [
            { id: 101, type: 'Revision Requested', target: 'Monthly (Feb)', amount: 1800000, user: 'Amit Sharma', date: '2026-01-02' },
            { id: 102, type: 'Proposal Sent', target: 'Quarterly (Q2)', amount: 6000000, user: 'Priya Verma', date: '2026-01-01' }
        ],
        performers: [
            { name: 'Rahul S.', revenue: 4200000, deals: 12, avatar: 'RS' },
            { name: 'Sneha K.', revenue: 3800000, deals: 15, avatar: 'SK' },
            { name: 'Vikram R.', revenue: 2900000, deals: 9, avatar: 'VR' },
            { name: 'Anjali D.', revenue: 2500000, deals: 11, avatar: 'AD' }
        ],
        sparkline: Array.from({ length: 10 }).map((_, i) => ({ value: 10 + Math.random() * 20 }))
    }), []);

    return (
        <div className="w-full">
            <LayoutGroup>
                <motion.div
                    layout
                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 auto-rows-min"
                >
                    {/* Widget 1: Total Revenue (Small) */}
                    <Widget
                        id="totalRevenue"
                        title="Total Revenue"
                        subtitle="Overall Earnings"
                        size={widgetStates.totalRevenue}
                        onSizeChange={handleWidgetSizeChange}
                    >
                        <div className="h-full flex flex-col justify-end">
                            <div className="flex items-baseline gap-2 mb-1">
                                <span className="text-4xl font-black text-white tracking-tighter drop-shadow-[0_0_15px_rgba(255,255,255,0.3)]">
                                    {formatRevenue(mockData.totalRevenue)}
                                </span>
                                <div className="flex items-center text-emerald-400 text-xs font-bold px-1.5 py-0.5 bg-emerald-500/10 rounded-md border border-emerald-500/20">
                                    <ArrowUpRight size={12} className="mr-0.5" />
                                    12%
                                </div>
                            </div>
                            <div className="h-12 w-full mt-4">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={mockData.sparkline}>
                                        <Area
                                            type="monotone"
                                            dataKey="value"
                                            stroke="#ffffff"
                                            strokeWidth={2}
                                            fill="transparent"
                                            style={{ filter: 'drop-shadow(0 0 5px rgba(255,255,255,0.3))' }}
                                        />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </Widget>

                    {/* Widget 2: Monthly Trend (Medium) */}
                    <Widget
                        id="monthlyTrend"
                        title="Monthly Trend"
                        subtitle="Revenue vs Target"
                        size={widgetStates.monthlyTrend}
                        onSizeChange={handleWidgetSizeChange}
                    >
                        <div className="h-full w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={mockData.trend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#ffffff" stopOpacity={0.1} />
                                            <stop offset="95%" stopColor="#ffffff" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <XAxis
                                        dataKey="month"
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fill: '#71717a', fontSize: 10, fontWeight: 600 }}
                                    />
                                    <Tooltip content={<MinimalTooltip />} />
                                    <Area
                                        type="monotone"
                                        dataKey="revenue"
                                        stroke="#ffffff"
                                        strokeWidth={3}
                                        fillOpacity={1}
                                        fill="url(#revGrad)"
                                        style={{ filter: 'drop-shadow(0 0 8px rgba(255,255,255,0.4))' }}
                                        animationDuration={1500}
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey="target"
                                        stroke="#52525b"
                                        strokeWidth={2}
                                        strokeDasharray="5 5"
                                        fill="transparent"
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </Widget>

                    {/* Widget 3: Target Progress (Small) */}
                    <Widget
                        id="targetProgress"
                        title="Target Progress"
                        subtitle="Current Period"
                        size={widgetStates.targetProgress}
                        onSizeChange={handleWidgetSizeChange}
                    >
                        <div className="h-full flex flex-col items-center justify-between p-4 relative overflow-hidden group">
                            {/* Digital Background Grid */}
                            <div className="absolute inset-0 opacity-10 pointer-events-none"
                                style={{ backgroundImage: 'radial-gradient(rgba(255,255,255,0.2) 1px, transparent 1px)', backgroundSize: '12px 12px' }} />

                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-white/20 to-transparent" />

                            <div className="w-full flex justify-between items-start z-10">
                                <div className="flex flex-col">
                                    <span className="text-[10px] text-zinc-500 font-black uppercase tracking-[0.2em] leading-none mb-1">Status</span>
                                    <div className="flex items-center gap-1.5">
                                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_#10b981] animate-pulse" />
                                        <span className="text-white text-[11px] font-bold tracking-tight">System Online</span>
                                    </div>
                                </div>
                                <div className="bg-white/5 p-1.5 rounded-lg border border-white/10 group-hover:border-white/30 transition-colors">
                                    <Target size={14} className="text-white/60" />
                                </div>
                            </div>

                            <div className="flex flex-col items-center justify-center z-10 py-2">
                                <motion.div
                                    initial={{ scale: 0.9, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    className="relative text-center"
                                >
                                    <div className="flex items-baseline justify-center">
                                        <span className="text-6xl font-black text-white tracking-tighter drop-shadow-[0_0_20px_rgba(255,255,255,0.3)]">75</span>
                                        <span className="text-2xl font-black text-white ml-0.5 opacity-50">%</span>
                                    </div>
                                    <div className="absolute -bottom-1 left-0 w-full h-[2px] bg-white/20 overflow-hidden rounded-full">
                                        <motion.div
                                            initial={{ x: '-100%' }}
                                            animate={{ x: '10%' }}
                                            transition={{ duration: 1.5, ease: "circOut" }}
                                            className="h-full bg-white shadow-[0_0_10px_white] w-[75%]"
                                        />
                                    </div>
                                </motion.div>
                                <span className="text-[9px] text-zinc-500 font-bold uppercase tracking-[0.3em] mt-3 opacity-60">Avg Achievement</span>
                            </div>

                            <div className="w-full bg-white/5 rounded-xl border border-white/5 p-2 flex justify-between items-center z-10 backdrop-blur-sm">
                                <div className="flex flex-col">
                                    <span className="text-[8px] text-zinc-500 font-black uppercase tracking-widest">Active</span>
                                    <span className="text-white font-black text-xs">03</span>
                                </div>
                                <div className="h-6 w-[1px] bg-white/10" />
                                <div className="flex flex-col items-end text-right">
                                    <span className="text-[8px] text-zinc-500 font-black uppercase tracking-widest">Goal</span>
                                    <span className="text-white font-black text-xs">$250k</span>
                                </div>
                            </div>
                        </div>
                    </Widget>

                    {/* Widget 4: Department Breakdown (Medium) */}
                    <Widget
                        id="deptBreakdown"
                        title="Department Breakdown"
                        subtitle="Revenue Split"
                        size={widgetStates.deptBreakdown}
                        onSizeChange={handleWidgetSizeChange}
                    >
                        <div className="h-full w-full flex items-center">
                            <div className="w-1/2 h-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={mockData.departments}
                                            innerRadius={45}
                                            outerRadius={65}
                                            paddingAngle={5}
                                            dataKey="value"
                                        >
                                            {mockData.departments.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.color} />
                                            ))}
                                        </Pie>
                                        <Tooltip content={<MinimalTooltip />} />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                            <div className="w-1/2 space-y-2 pl-4">
                                {mockData.departments.map((dept, i) => (
                                    <div key={i} className="flex flex-col">
                                        <div className="flex items-center gap-2">
                                            <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: dept.color }} />
                                            <span className="text-white text-[10px] font-bold tracking-wider uppercase">{dept.name}</span>
                                        </div>
                                        <span className="text-zinc-400 text-xs font-medium ml-3.5">{formatRevenue(dept.value)}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </Widget>

                    {/* Widget 5: Active Targets (Large) */}
                    <Widget
                        id="activeTargets"
                        title="Active Targets"
                        subtitle="Tracking & Monitoring"
                        size={widgetStates.activeTargets}
                        onSizeChange={handleWidgetSizeChange}
                    >
                        <div className="h-full flex flex-col">
                            {widgetStates.activeTargets === 'medium' ? (
                                <div className="grid grid-cols-2 gap-4 h-full overflow-y-auto custom-scrollbar pr-1">
                                    {mockData.activeTargets.map((target, idx) => (
                                        <motion.div
                                            key={idx}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: idx * 0.1 }}
                                            className="group relative bg-[#1c1c1f]/40 rounded-2xl p-4 border border-white/5 hover:border-white/20 hover:bg-[#1c1c1f]/60 transition-all duration-500 overflow-hidden"
                                        >
                                            <div className="relative z-10">
                                                <div className="flex justify-between items-start mb-3">
                                                    <div className="flex flex-col">
                                                        <span className="text-white/90 font-bold text-xs tracking-tight uppercase">{target.period}</span>
                                                        <span className="text-[8px] text-zinc-500 font-black uppercase tracking-widest">Revenue Mission</span>
                                                    </div>
                                                    <div className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest border border-white/10 ${target.status === 'on-track' ? 'text-emerald-400 bg-emerald-500/5' : 'text-red-400 bg-red-500/5'}`}>
                                                        {target.status}
                                                    </div>
                                                </div>
                                                <div className="space-y-3">
                                                    <div>
                                                        <div className="flex justify-between items-baseline mb-1">
                                                            <span className="text-white font-black text-base tracking-tighter">{formatRevenue(target.achieved)}</span>
                                                            <span className="text-zinc-500 text-[8px] font-bold">/ {formatRevenue(target.amount)}</span>
                                                        </div>
                                                        <div className="h-1 w-full bg-black/40 rounded-full overflow-hidden">
                                                            <motion.div
                                                                initial={{ width: 0 }}
                                                                animate={{ width: `${target.progress}%` }}
                                                                transition={{ duration: 1, ease: "easeOut" }}
                                                                className="h-full bg-white shadow-[0_0_8px_rgba(255,255,255,0.3)]"
                                                            />
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-1.5 text-zinc-500 text-[8px] font-black uppercase tracking-tighter">
                                                        <Calendar size={8} />
                                                        {formatDate(target.startDate)} — {formatDate(target.endDate)}
                                                    </div>
                                                </div>
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>
                            ) : (
                                <div className="space-y-4 pr-2 overflow-y-auto custom-scrollbar flex-1 pt-2">
                                    {mockData.activeTargets.map((target, i) => (
                                        <div key={i} className="bg-white/5 rounded-2xl p-5 border border-white/5 hover:border-white/10 transition-all group">
                                            <div className="flex justify-between items-start mb-4">
                                                <div>
                                                    <h4 className="text-white font-bold text-lg tracking-tight mb-1">{target.period}</h4>
                                                    <div className="flex flex-col gap-1">
                                                        <div className="flex items-center gap-1.5 text-zinc-500 text-[10px] font-black uppercase tracking-widest">
                                                            <Calendar size={10} className="text-white/40" />
                                                            {formatDate(target.startDate)} — {formatDate(target.endDate)}
                                                        </div>
                                                        <div className="flex items-center gap-4 mt-1">
                                                            <span className="text-zinc-500 text-xs font-medium">Target: {formatRevenue(target.amount)}</span>
                                                            <span className="text-white text-xs font-bold">Achieved: {formatRevenue(target.achieved)}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${target.status === 'on-track' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'
                                                    }`}>
                                                    {target.status}
                                                </span>
                                            </div>
                                            <div className="relative h-2.5 w-full bg-white/5 rounded-full overflow-hidden">
                                                <motion.div
                                                    className="absolute inset-y-0 left-0 bg-white"
                                                    initial={{ width: 0 }}
                                                    animate={{ width: `${target.progress}%` }}
                                                    transition={{ duration: 1.5, ease: "easeOut", delay: i * 0.2 }}
                                                    style={{ filter: 'drop-shadow(0 0 5px rgba(255,255,255,0.5))' }}
                                                />
                                            </div>
                                            <div className="flex justify-between mt-2">
                                                <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">Progress</span>
                                                <span className="text-xs text-white font-black">{target.progress}%</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </Widget>

                    {/* Widget 6: Pending Responses (Medium) */}
                    <Widget
                        id="pendingResponses"
                        title="Pending Responses"
                        subtitle="Action Required"
                        size={widgetStates.pendingResponses}
                        onSizeChange={handleWidgetSizeChange}
                    >
                        <div className="h-full space-y-3 overflow-y-auto custom-scrollbar pr-1">
                            {mockData.pendingResponses.map((item, i) => (
                                <div key={i} className="bg-white/5 rounded-xl p-3 border border-white/5 hover:bg-white/10 transition-colors">
                                    <div className="flex justify-between items-center mb-2">
                                        <span className="text-white text-[10px] font-black uppercase tracking-wider px-2 py-0.5 bg-white/10 rounded-md">
                                            {item.type}
                                        </span>
                                        <span className="text-zinc-500 text-[10px] font-medium">{item.date}</span>
                                    </div>
                                    <div className="flex justify-between items-end">
                                        <div>
                                            <p className="text-white font-bold text-sm tracking-tight">{item.user}</p>
                                            <p className="text-zinc-500 text-xs font-medium">{item.target} - {formatRevenue(item.amount)}</p>
                                        </div>
                                        <div className="flex gap-2">
                                            <button className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500 hover:text-white transition-all">
                                                <CheckCircle2 size={14} />
                                            </button>
                                            <button className="p-1.5 rounded-lg bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500 hover:text-white transition-all">
                                                <XCircle size={14} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </Widget>

                    {/* Widget 7: Top Performers (Medium) */}
                    <Widget
                        id="topPerformers"
                        title="Top Performers"
                        subtitle="Revenue Leaderboard"
                        size={widgetStates.topPerformers}
                        onSizeChange={handleWidgetSizeChange}
                    >
                        <div className="h-full space-y-3 overflow-y-auto custom-scrollbar pr-1">
                            {mockData.performers.map((user, i) => (
                                <div key={i} className="flex items-center gap-3 p-2 group hover:bg-white/5 rounded-xl transition-all">
                                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-white/10 to-white/5 border border-white/10 flex items-center justify-center text-white font-black text-xs group-hover:from-white group-hover:to-zinc-200 group-hover:text-black transition-all">
                                        {user.avatar}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <p className="text-white font-bold text-sm tracking-tight truncate">{user.name}</p>
                                                <p className="text-zinc-500 text-[10px] font-medium tracking-wide">{user.deals} Deals Won</p>
                                            </div>
                                            <p className="text-white font-black text-sm tracking-tighter">{formatRevenue(user.revenue)}</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </Widget>
                </motion.div>
            </LayoutGroup>
        </div>
    );
};

export default RevenueSummaryWidgets;
