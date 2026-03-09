import React, { useState, useEffect, useMemo } from 'react';
import { motion, LayoutGroup } from 'framer-motion';
import {
    Users,
    TrendingUp,
    DollarSign,
    Target,
    CheckCircle,
    Building2,
    Award,
    Activity,
    Plus
} from 'lucide-react';
import CreateRevenueTargetModal from './sales/modals/CreateRevenueTargetModal';
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
        switch (size) {
            case 'small': return 'col-span-1 row-span-1 h-[220px]';
            case 'medium': return 'col-span-1 md:col-span-2 lg:col-span-2 row-span-1 h-[220px]';
            case 'large':
                // Only targets widget spans full width (4 columns)
                if (id === 'targets') {
                    return 'col-span-1 md:col-span-4 lg:col-span-4 row-span-2 h-[464px]';
                }
                // All other widgets including revenue use normal 2-column large
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
const SalesSummaryWidgets = ({ salesData }) => {
    // Widget States with localStorage persistence
    const [widgetStates, setWidgetStates] = useState(() => {
        const defaults = {
            leads: 'medium',
            revenue: 'medium',
            companies: 'small',
            achievement: 'small',
            targets: 'large'
        };

        const saved = localStorage.getItem('salesDashboardWidgetSizes_v2');
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                return { ...defaults, ...parsed };
            } catch (e) {
                console.error('Failed to parse saved widget sizes:', e);
            }
        }
        return defaults;
    });

    const [showAddTargetModal, setShowAddTargetModal] = useState(false);

    useEffect(() => {
        localStorage.setItem('salesDashboardWidgetSizes_v2', JSON.stringify(widgetStates));
    }, [widgetStates]);

    const handleWidgetSizeChange = (id, newSize) => {
        setWidgetStates(prev => ({ ...prev, [id]: newSize }));
    };

    // Real Data from API with fallbacks
    const leadsData = useMemo(() => ({
        total: salesData?.leads?.total || 0,
        active: salesData?.leads?.active || 0,
        qualified: salesData?.leads?.qualified || 0,
        won: salesData?.leads?.won || 0,
        funnel: salesData?.leads?.funnel || [
            { stage: 'Prospects', count: 0, percentage: 0 },
            { stage: 'Contacted', count: 0, percentage: 0 },
            { stage: 'Qualified', count: 0, percentage: 0 },
            { stage: 'Proposal', count: 0, percentage: 0 },
            { stage: 'Won', count: 0, percentage: 0 },
        ]
    }), [salesData]);

    const revenueData = useMemo(() => ({
        total: salesData?.revenue?.total || 0,
        target: salesData?.revenue?.target || 0,
        trend: salesData?.revenue?.trend || Array.from({ length: 24 }).map((_, i) => ({
            month: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][i % 12],
            amount: 0
        }))
    }), [salesData]);

    const companiesData = useMemo(() => ({
        total: salesData?.companies?.total || 0,
        approved: salesData?.companies?.approved || 0,
        pending: salesData?.companies?.pending || 0,
        distribution: salesData?.companies?.distribution || [
            { name: 'Approved', value: 0, color: '#10b981' },
            { name: 'Pending', value: 0, color: '#f59e0b' }
        ],
        trend: salesData?.companies?.trend || Array.from({ length: 7 }).map((_, i) => ({
            label: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul'][i],
            value: 0
        }))
    }), [salesData]);

    const tasksData = salesData?.tasks || {
        total: 0,
        completed: 0,
        pending: 0,
        percentage: 0
    };

    const teamData = salesData?.team || [];

    const conversionData = salesData?.conversion || {
        rate: 0,
        trend: []
    };

    const targetsList = useMemo(() => {
        const rawTargets = salesData?.targets || [];
        const targets = Array.isArray(rawTargets) ? rawTargets : (rawTargets.list || []);
        return targets;
    }, [salesData?.targets]);


    return (
        <div className="p-2">
            <div className="mb-8 flex justify-end items-center px-2">
                <div className="flex items-center space-x-2 bg-black/40 px-3 py-1.5 rounded-full border border-white/5 backdrop-blur-sm">
                    <span className="relative flex h-2.5 w-2.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                    </span>
                    <span className="text-xs font-mono text-zinc-300 font-medium tracking-wide">LIVE UPDATES</span>
                </div>
            </div>

            <LayoutGroup>
                <motion.div layout className="grid grid-cols-1 md:grid-cols-4 gap-6 auto-rows-min grid-flow-dense pb-10">

                    {/* Widget 1: Leads - Pipeline Flow Style */}
                    <Widget id="leads" title="Leads" subtitle="Sales Pipeline" size={widgetStates.leads} onSizeChange={handleWidgetSizeChange}>
                        {widgetStates.leads === 'small' ? (
                            <div className="flex flex-col items-center justify-center h-full relative">
                                <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90">
                                    {/* Radial Ticks Background */}
                                    {Array.from({ length: 24 }).map((_, i) => (
                                        <line
                                            key={i}
                                            x1="50" y1="5" x2="50" y2="15"
                                            transform={`rotate(${i * (360 / 24)} 50 50)`}
                                            stroke="#27272a" strokeWidth="3" strokeLinecap="round"
                                        />
                                    ))}
                                    {/* Active Ticks (Mock 75%) */}
                                    {Array.from({ length: 24 }).map((_, i) => (
                                        <motion.line
                                            key={`active-${i}`}
                                            x1="50" y1="5" x2="50" y2="15"
                                            transform={`rotate(${i * (360 / 24)} 50 50)`}
                                            stroke="white" strokeWidth="3" strokeLinecap="round"
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: i < 18 ? 1 : 0 }} // 18/24 = 75%
                                            transition={{ delay: i * 0.05, duration: 0.2 }}
                                            style={{ filter: 'drop-shadow(0 0 2px white)' }}
                                        />
                                    ))}
                                </svg>
                                <div className="absolute inset-0 flex flex-col items-center justify-center">
                                    <span className="text-2xl font-bold text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.5)]">{leadsData.total}</span>
                                    <span className="text-[8px] text-zinc-500 uppercase tracking-widest mt-1">Leads</span>
                                </div>
                            </div>
                        ) : widgetStates.leads === 'medium' ? (
                            <div className="flex h-full">
                                {/* Left: Big Stats */}
                                <div className="w-1/2 flex flex-col justify-center px-5 border-r border-white/5">
                                    <div className="text-zinc-500 text-[10px] bg-white/5 w-fit px-2 py-1 rounded mb-2">● Live Pipeline</div>
                                    <div className="text-white text-5xl font-bold tracking-tighter drop-shadow-[0_0_15px_rgba(255,255,255,0.3)]">
                                        {leadsData.total}
                                    </div>
                                    <div className="text-zinc-400 text-xs mt-1">Total Active Leads</div>
                                </div>
                                {/* Right: Vertical Pipeline Cards */}
                                <div className="w-1/2 flex flex-col justify-center gap-2 px-4">
                                    <div className="flex items-center justify-between bg-white/5 p-2 rounded-lg border border-white/5">
                                        <div className="text-[10px] text-zinc-400 uppercase tracking-wider">Active</div>
                                        <div className="font-bold text-white">{leadsData.active}</div>
                                    </div>
                                    <div className="flex items-center justify-between bg-white/5 p-2 rounded-lg border border-white/5">
                                        <div className="text-[10px] text-zinc-400 uppercase tracking-wider">Won</div>
                                        <div className="font-bold text-white">{leadsData.won}</div>
                                    </div>
                                    <div className="flex items-center justify-between bg-white/10 p-2 rounded-lg border border-white/10">
                                        <div className="text-[10px] text-zinc-200 uppercase tracking-wider font-bold">Conv. Rate</div>
                                        <div className="font-bold text-white shadow-white drop-shadow-[0_0_8px_rgba(255,255,255,0.5)]">28%</div>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            // Large view (unchanged for now or reused)
                            <div className="flex flex-col h-full">
                                <div className="flex justify-between items-start mb-6">
                                    <div>
                                        <div className="text-white text-6xl font-bold tracking-tighter drop-shadow-[0_0_20px_rgba(255,255,255,0.3)]">
                                            {leadsData.total}
                                        </div>
                                        <div className="text-zinc-500 text-xs uppercase tracking-widest mt-1">Total Leads</div>
                                    </div>
                                    <div className="flex gap-8">
                                        <div>
                                            <div className="flex items-center gap-2 mb-1">
                                                <div className="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]"></div>
                                                <span className="text-zinc-400 text-xs uppercase tracking-wider">Active</span>
                                            </div>
                                            <div className="text-2xl font-bold text-white">{leadsData.active}</div>
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2 mb-1">
                                                <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]"></div>
                                                <span className="text-zinc-400 text-xs uppercase tracking-wider">Won</span>
                                            </div>
                                            <div className="text-2xl font-bold text-white">{leadsData.won}</div>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex-1 flex items-end justify-between gap-2">
                                    {leadsData.funnel.map((item, index) => (
                                        <div key={index} className="flex flex-col items-center gap-2 group cursor-pointer flex-1">
                                            <div className="relative w-full flex justify-center items-end h-[120px]">
                                                <motion.div
                                                    initial={{ height: 0 }}
                                                    animate={{ height: `${item.percentage}%` }}
                                                    transition={{ duration: 0.8, delay: index * 0.1, ease: "easeOut" }}
                                                    className="w-full mx-1 rounded-t-sm bg-gradient-to-t from-white/5 to-white/60 relative"
                                                >
                                                    {/* Number on top */}
                                                    <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-white font-bold text-sm drop-shadow-md">
                                                        {item.count}
                                                    </div>
                                                </motion.div>
                                            </div>
                                            <span className="text-[10px] text-zinc-500 uppercase tracking-wider font-medium group-hover:text-white transition-colors">{item.stage}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </Widget>

                    {/* Widget 2: Revenue - Finance Curve Style */}
                    <Widget id="revenue" title="Revenue" subtitle="Performance" size={widgetStates.revenue} onSizeChange={handleWidgetSizeChange}>
                        {widgetStates.revenue === 'small' ? (
                            <div className="flex flex-col items-center justify-center h-full relative p-2">
                                {/* Vertical Frequency Bars */}
                                <div className="flex items-end justify-center gap-2 h-20 w-full mb-2">
                                    {[0.5, 0.8, 1, 0.7, 0.9, 0.6].map((scale, i) => (
                                        <motion.div
                                            key={i}
                                            initial={{ height: "30%" }}
                                            animate={{ height: `${scale * 100}%` }}
                                            transition={{ duration: 0.8, repeat: Infinity, repeatType: "reverse", delay: i * 0.1 }}
                                            className="w-3 bg-white rounded-t-sm"
                                            style={{
                                                opacity: 0.8 + (scale * 0.2),
                                                boxShadow: '0 0 12px rgba(255,255,255,0.5)'
                                            }}
                                        />
                                    ))}
                                </div>
                                <div className="flex flex-col items-center">
                                    <span className="text-sm font-bold text-white tracking-widest">{formatRevenue(revenueData.total).replace('₹', '')}</span>
                                    <span className="text-[6px] text-zinc-500 uppercase tracking-widest mt-1">Revenue</span>
                                </div>
                            </div>
                        ) : widgetStates.revenue === 'medium' ? (
                            <div className="relative h-full flex flex-col p-4">
                                {/* Header */}
                                {/* Header */}
                                <div className="flex justify-between items-center mb-2 relative z-10 w-full">
                                    <div className="flex items-baseline gap-2">
                                        <span className="text-zinc-400 font-bold text-lg">Revenue</span>
                                        <span className="text-white text-2xl font-bold tracking-tight">
                                            {formatRevenue(revenueData.total)}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <div className="flex items-center justify-center w-5 h-5 rounded-full bg-white/10 border border-white/20">
                                            <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                                            </svg>
                                        </div>
                                        <span className="text-white text-sm font-bold opacity-90">+73%</span>
                                    </div>
                                </div>

                                {/* Spectrum Bar Chart */}
                                <div className="flex-1 flex flex-col justify-end">
                                    <div className="flex items-end justify-between gap-1 h-[70%] w-full">
                                        {(() => {
                                            // Dynamic Data Binding
                                            const data = revenueData.trend || []; // Use actual data
                                            const maxVal = Math.max(...data.map(d => d.amount), 1); // Find max for scaling

                                            return data.map((item, index) => {
                                                const height = (item.amount / maxVal) * 100; // Calculate height %

                                                return (
                                                    <div key={index} className="flex-1 flex flex-col justify-end h-full relative group/bar items-center">
                                                        <motion.div
                                                            initial={{ height: 0 }}
                                                            animate={{ height: `${height}%` }}
                                                            transition={{ duration: 0.8, delay: index * 0.03, ease: "easeOut" }}
                                                            className="w-full max-w-[6px] rounded-full mx-auto cursor-pointer relative"
                                                            style={{
                                                                backgroundColor: `rgba(255, 255, 255, ${0.2 + (height / 100) * 0.8})`
                                                            }}
                                                        >
                                                            {/* Tooltip */}
                                                            <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-zinc-900 border border-white/10 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover/bar:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-20 flex flex-col items-center gap-0.5">
                                                                <span className="text-zinc-400 text-[8px] uppercase tracking-wider">{item.month}</span>
                                                                <span className="font-bold">{formatRevenue(item.amount)}</span>
                                                            </div>
                                                        </motion.div>
                                                    </div>
                                                );
                                            });
                                        })()}
                                    </div>
                                    {/* Axis Labels */}
                                    <div className="flex justify-between text-[10px] text-white/50 font-medium mt-2 px-1">
                                        <span>{new Date().getFullYear() - 2}</span>
                                        <span>{new Date().getFullYear() - 1}</span>
                                        <span>{new Date().getFullYear()}</span>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            // Large view
                            <div className="flex flex-col h-full relative overflow-hidden">
                                <div className="flex justify-between items-start mb-4 relative z-10">
                                    <div>
                                        <div className="text-6xl font-bold text-white tracking-tighter drop-shadow-[0_0_20px_rgba(255,255,255,0.4)]">
                                            {formatRevenue(revenueData.total)}
                                        </div>
                                        <div className="text-zinc-500 text-sm font-medium mt-1">Total Revenue Generated</div>
                                    </div>
                                    <div className="flex flex-col items-end">
                                        <div className="text-emerald-400 font-bold bg-emerald-400/10 px-3 py-1 rounded-full border border-emerald-400/20 mb-2">
                                            +73% of Target
                                        </div>
                                        <div className="text-zinc-400 text-xs">Target: {formatRevenue(revenueData.target)}</div>
                                    </div>
                                </div>
                                <div className="flex-1 w-full relative -mx-4 -mb-4">
                                    <ResponsiveContainer width="110%" height="110%">
                                        <AreaChart data={revenueData.trend}>
                                            <defs>
                                                <linearGradient id="revenueGradientLarge" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#ffffff" stopOpacity={0.3} />
                                                    <stop offset="95%" stopColor="#ffffff" stopOpacity={0} />
                                                </linearGradient>
                                            </defs>
                                            <Tooltip
                                                contentStyle={{ backgroundColor: '#18181b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
                                                itemStyle={{ color: '#fff' }}
                                                cursor={{ stroke: '#ffffff', strokeWidth: 1, strokeDasharray: '4 4' }}
                                                formatter={(value) => [formatRevenue(value), 'Revenue']}
                                                labelFormatter={(label) => {
                                                    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                                                    return revenueData.trend[label]?.month || `Month ${label + 1}`;
                                                }}
                                            />
                                            <Area
                                                type="monotone"
                                                dataKey="amount"
                                                stroke="#ffffff"
                                                strokeWidth={4}
                                                fill="url(#revenueGradientLarge)"
                                                animationDuration={2000}
                                            />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                        )}
                    </Widget>

                    {/* Widget 3: Companies (Already updated to Pinterest Style) */}
                    <Widget id="companies" title="Companies" subtitle="Database" size={widgetStates.companies} onSizeChange={handleWidgetSizeChange}>
                        {widgetStates.companies === 'small' ? (
                            <div className="flex flex-col items-center justify-end h-full relative pb-4">
                                <svg viewBox="0 0 100 55" className="w-full h-full" style={{ overflow: 'visible' }}>
                                    {/* Semi Circle Track */}
                                    <path d="M 5 50 A 45 45 0 0 1 95 50" stroke="#27272a" strokeWidth="10" fill="none" strokeLinecap="round" />
                                    {/* Progress Arc */}
                                    <motion.path
                                        d="M 5 50 A 45 45 0 0 1 95 50"
                                        stroke="white" strokeWidth="10" fill="none" strokeLinecap="round"
                                        initial={{ pathLength: 0 }}
                                        animate={{ pathLength: 1 }} // Full semi-circle
                                        transition={{ duration: 1.5, ease: "easeOut" }}
                                        style={{ filter: 'drop-shadow(0 0 8px rgba(255,255,255,0.5))' }}
                                    />
                                </svg>
                                <div className="absolute inset-0 flex flex-col items-center justify-end pb-0">
                                    <span className="text-3xl font-bold text-white drop-shadow-md mb-2">{companiesData.total}</span>
                                    <span className="text-[8px] text-zinc-500 uppercase tracking-widest mb-6">Companies</span>
                                </div>
                            </div>
                        ) : widgetStates.companies === 'medium' ? (
                            <div className="flex items-center justify-between h-full px-2">{/* Left side - Vertical Bar Chart */}
                                {/* Left side - Vertical Bar Chart */}
                                <div className="flex-1 flex items-end justify-center gap-2 pb-4 px-2" style={{ minHeight: '140px' }}>
                                    {/* ... Logic from previous step ... */}
                                    {(() => {
                                        const data = companiesData.trend || [];
                                        const maxVal = Math.max(...data.map(d => d.value), 1);

                                        return data.map((item, index) => {
                                            const height = (item.value / maxVal) * 140; // Scale to max 140px

                                            return (
                                                <div key={index} className="flex flex-col items-center gap-1 flex-1 max-w-[32px]">
                                                    <div className="relative group/tooltip w-full">
                                                        <motion.div
                                                            initial={{ height: 0 }}
                                                            animate={{ height: `${height * 0.7}px` }}
                                                            transition={{ duration: 0.8, delay: index * 0.05, ease: "easeOut" }}
                                                            className="w-full rounded-full bg-white hover:scale-105 cursor-pointer placeholder-wave"
                                                            style={{
                                                                boxShadow: '0 0 8px rgba(255, 255, 255, 0.5), 0 0 15px rgba(255, 255, 255, 0.2)',
                                                                opacity: 0.7 + (height / 140) * 0.3
                                                            }}
                                                        />
                                                        {/* Tooltip */}
                                                        <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-zinc-900 border border-white/10 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover/tooltip:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-20">
                                                            {item.value}
                                                        </div>
                                                    </div>
                                                    <span className="text-[10px] text-zinc-500">{item.label}</span>
                                                </div>
                                            )
                                        });
                                    })()}
                                </div>
                                {/* Right side - Stats */}
                                <div className="flex flex-col justify-center pl-4 border-l border-white/10 w-[40%]">
                                    <div className="text-white text-4xl font-bold tracking-tighter drop-shadow-[0_0_15px_rgba(255,255,255,0.5)]">
                                        {companiesData.total}
                                    </div>
                                    <div className="text-zinc-500 text-[10px] uppercase tracking-widest mt-1 font-bold">Companies</div>
                                    <div className="mt-3 space-y-2">
                                        <div className="flex flex-col">
                                            <span className="text-zinc-500 text-[8px] uppercase">Approved</span>
                                            <span className="text-white font-bold">{companiesData.approved}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            // Large View (Previous implementation)
                            <div className="flex flex-col h-full">
                                {/* Large - Full Stats with Bar Chart */}
                                <div className="flex items-center justify-between mb-6">
                                    <div>
                                        <div className="text-white text-6xl font-bold tracking-tighter drop-shadow-[0_0_20px_rgba(255,255,255,0.5)]">
                                            {companiesData.total}
                                        </div>
                                        <div className="text-zinc-500 text-xs uppercase tracking-widest mt-1">Total Companies</div>
                                    </div>
                                    <div className="text-emerald-400 text-2xl font-bold">+12.5%</div>
                                </div>

                                {/* Vertical Bar Chart */}
                                <div className="flex-1 flex items-end justify-center gap-3 pb-4 px-4" style={{ minHeight: '180px' }}>
                                    {(() => {
                                        const months = [];
                                        const today = new Date();
                                        for (let i = 11; i >= 0; i--) {
                                            const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
                                            months.push(d.toLocaleString('default', { month: 'short' }));
                                        }

                                        // Mock data mapped to dynamic last 12 months
                                        const trendValues = [28, 32, 30, 38, 35, 42, 36, 45, 43, 46, 48, 50];
                                        const heights = [60, 85, 70, 105, 95, 115, 90, 125, 120, 130, 140, 145];

                                        return months.map((month, index) => ({
                                            label: month,
                                            value: trendValues[index],
                                            height: heights[index]
                                        })).map((bar, index) => (
                                            <div key={index} className="flex flex-col items-center gap-2 flex-1 max-w-[45px]">
                                                <div className="relative group/tooltip w-full">
                                                    <div
                                                        className="w-full rounded-full bg-white transition-all duration-300 hover:scale-110 cursor-pointer"
                                                        style={{
                                                            height: `${bar.height}px`,
                                                            boxShadow: '0 0 8px rgba(255, 255, 255, 0.5), 0 0 15px rgba(255, 255, 255, 0.2)',
                                                            opacity: 0.75 + (bar.height / 145) * 0.25
                                                        }}
                                                    />
                                                    {/* Tooltip - only shows for this specific bar */}
                                                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 opacity-0 group-hover/tooltip:opacity-100 transition-opacity duration-200 pointer-events-none z-[100] whitespace-nowrap">
                                                        <div className="bg-zinc-900/95 backdrop-blur-md px-3 py-2 rounded-lg border border-white/10 shadow-2xl">
                                                            <div className="text-zinc-400 text-[9px] font-medium tracking-wide">{bar.label}</div>
                                                            <div className="text-white font-bold text-sm mt-0.5">{bar.value} companies</div>
                                                        </div>
                                                        <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-px">
                                                            <div className="w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-zinc-900/95"></div>
                                                        </div>
                                                    </div>
                                                </div>
                                                <span className="text-zinc-600 text-[9px] font-medium uppercase tracking-wider">{bar.label}</span>
                                            </div>
                                        ));
                                    })()}
                                </div>

                                {/* Stats Grid */}
                                <div className="grid grid-cols-2 gap-4 mt-4">
                                    <div className="bg-white/5 rounded-lg p-3 border border-white/5">
                                        <div className="text-zinc-500 text-[9px] uppercase tracking-widest font-bold mb-1">Approved</div>
                                        <div className="text-emerald-400 text-xl font-bold">{companiesData.approved}</div>
                                    </div>
                                    <div className="bg-white/5 rounded-lg p-3 border border-white/5">
                                        <div className="text-zinc-500 text-[9px] uppercase tracking-widest font-bold mb-1">Pending</div>
                                        <div className="text-amber-400 text-xl font-bold">{companiesData.pending}</div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </Widget>

                    {/* Widget 4: Achievement - Double Ring Style */}
                    <Widget id="achievement" title="Achievement" subtitle="Target Progress" size={widgetStates.achievement} onSizeChange={handleWidgetSizeChange}>
                        {widgetStates.achievement === 'small' ? (
                            <div className="h-full py-2 aspect-square relative mx-auto">
                                <svg viewBox="0 0 112 112" className="w-full h-full" style={{ overflow: 'visible' }}>
                                    <defs>
                                        <filter id="squareGlow">
                                            <feGaussianBlur in="SourceGraphic" stdDeviation="2" result="blur" />
                                            <feMerge>
                                                <feMergeNode in="blur" />
                                                <feMergeNode in="SourceGraphic" />
                                            </feMerge>
                                        </filter>
                                    </defs>
                                    {/* Rounded Square Track */}
                                    <rect x="5" y="5" width="102" height="102" rx="24" ry="24" stroke="#27272a" strokeWidth="6" fill="transparent" />
                                    {/* Progress Path */}
                                    <motion.rect
                                        x="5" y="5" width="102" height="102" rx="24" ry="24"
                                        stroke="white" strokeWidth="6" fill="transparent" strokeLinecap="round"
                                        pathLength="1"
                                        initial={{ pathLength: 0 }}
                                        animate={{ pathLength: revenueData.total / (revenueData.target || 1) }}
                                        transition={{ duration: 1.5, ease: "easeOut" }}
                                        style={{ filter: 'url(#squareGlow)' }}
                                    />
                                    {/* Centered Text */}
                                </svg>
                                <div className="absolute inset-0 flex items-center justify-center flex-col">
                                    <span className="text-2xl font-bold text-white tracking-tight drop-shadow-md">
                                        {Math.round((revenueData.total / (revenueData.target || 1)) * 100)}%
                                    </span>
                                    <span className="text-[7px] text-zinc-500 uppercase tracking-widest mt-1 font-bold">Target</span>
                                </div>
                            </div>
                        ) : widgetStates.achievement === 'medium' ? (
                            <div className="flex items-center justify-center h-full gap-8 px-4">
                                <div className="flex flex-col justify-center gap-3">
                                    <div>
                                        <div className="text-zinc-500 text-[9px] uppercase tracking-widest font-bold mb-0.5 ml-1">Achieved</div>
                                        <div className="text-4xl font-bold text-white tracking-tight drop-shadow-md">{formatRevenue(revenueData.total)}</div>
                                    </div>
                                    <div>
                                        <div className="text-zinc-500 text-[9px] uppercase tracking-widest font-bold mb-0.5 ml-1">Goal</div>
                                        <div className="text-2xl font-bold text-zinc-400 tracking-tight">{formatRevenue(revenueData.target)}</div>
                                    </div>
                                </div>
                                <div className="h-full py-2 aspect-square relative scale-125 -translate-y-1">
                                    <svg viewBox="0 0 112 112" className="w-full h-full" style={{ overflow: 'visible' }}>
                                        <defs>
                                            <filter id="whiteGlow" x="-50%" y="-50%" width="200%" height="200%">
                                                <feGaussianBlur in="SourceGraphic" stdDeviation="2" result="blur" />
                                                <feColorMatrix in="blur" type="matrix" values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 1 0" result="coloredBlur" />
                                                <feMerge>
                                                    <feMergeNode in="coloredBlur" />
                                                    <feMergeNode in="SourceGraphic" />
                                                </feMerge>
                                            </filter>
                                            <linearGradient id="whiteGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                                                <stop offset="0%" stopColor="#ffffff" />
                                                <stop offset="100%" stopColor="#d4d4d8" />
                                            </linearGradient>
                                        </defs>

                                        {/* Dark Background Disk */}
                                        <circle cx="56" cy="56" r="48" fill="#000000" fillOpacity="0.4" />

                                        {/* Ticked Background Ring */}
                                        <circle
                                            cx="56" cy="56" r="48"
                                            stroke="#27272a"
                                            strokeWidth="8"
                                            fill="transparent"
                                            strokeDasharray="2 4"
                                            transform="rotate(-90 56 56)"
                                        />

                                        {/* White Progress Ring */}
                                        <motion.circle
                                            cx="56" cy="56" r="48"
                                            stroke="url(#whiteGradient)"
                                            strokeWidth="8"
                                            strokeLinecap="butt"
                                            fill="transparent"
                                            strokeDasharray={`${2 * Math.PI * 48}`}
                                            initial={{ strokeDashoffset: 2 * Math.PI * 48 }}
                                            animate={{ strokeDashoffset: 2 * Math.PI * 48 * (1 - ((revenueData.total / (revenueData.target || 1)))) }}
                                            transition={{ duration: 1.5, ease: "easeOut" }}
                                            transform="rotate(-90 56 56)"
                                            style={{ filter: 'drop-shadow(0 0 6px rgba(255, 255, 255, 0.4))' }}
                                        />

                                        {/* Arrow Head Indicator */}
                                        {(() => {
                                            const percentage = revenueData.total / (revenueData.target || 1);
                                            const angle = percentage * 360;
                                            return (
                                                <motion.g
                                                    initial={{ rotate: 0 }}
                                                    animate={{ rotate: angle }}
                                                    transition={{ duration: 1.5, ease: "easeOut" }}
                                                    style={{ originX: "56px", originY: "56px" }}
                                                >
                                                    {/* Triangle Tip at Top (rotated by g) */}
                                                    <polygon points="56,4 52,14 60,14" fill="#ffffff" style={{ filter: 'drop-shadow(0 0 4px rgba(255, 255, 255, 0.6))' }} />
                                                </motion.g>
                                            );
                                        })()}

                                        {/* Inner Glossy Ring Effect (Optional subtle detail) */}
                                        <circle cx="56" cy="56" r="36" stroke="#ffffff" strokeWidth="1" strokeOpacity="0.1" fill="transparent" strokeDasharray="4 4" />
                                    </svg>

                                    {/* Centered Text */}
                                    <div className="absolute inset-0 flex items-center justify-center flex-col pt-1">
                                        <span className="text-3xl font-black text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.4)] tracking-tighter leading-none">
                                            {Math.round((revenueData.total / (revenueData.target || 1)) * 100)}%
                                        </span>
                                        <span className="text-[7px] text-zinc-500 uppercase font-black tracking-widest mt-1">Progress</span>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            // Large View reused
                            <div className="flex flex-col items-center justify-center h-full">
                                <div className="relative">
                                    <svg viewBox="0 0 200 200" className="transform -rotate-90 w-64 h-64" style={{ overflow: 'visible' }}>
                                        <defs>
                                            <filter id="achievementNeonGlowLarge" x="-50%" y="-50%" width="200%" height="200%">
                                                <feGaussianBlur in="SourceAlpha" stdDeviation="5" result="blur" />
                                                <feFlood floodColor="#ffffff" floodOpacity="0.7" result="color" />
                                                <feComposite in="color" in2="blur" operator="in" result="glow" />
                                                <feMerge>
                                                    <feMergeNode in="glow" />
                                                    <feMergeNode in="SourceGraphic" />
                                                </feMerge>
                                            </filter>
                                        </defs>
                                        <circle cx="100" cy="100" r="85" stroke="#18181b" strokeWidth="15" fill="transparent" />
                                        <motion.circle
                                            cx="100" cy="100" r="85"
                                            stroke="#ffffff" strokeWidth="15" strokeLinecap="round"
                                            fill="transparent"
                                            strokeDasharray={`${2 * Math.PI * 85}`}
                                            initial={{ strokeDashoffset: 2 * Math.PI * 85 }}
                                            animate={{ strokeDashoffset: 2 * Math.PI * 85 * (1 - ((revenueData.total / (revenueData.target || 1)))) }}
                                            transition={{ duration: 1.5, ease: "easeOut" }}
                                            style={{ filter: 'url(#achievementNeonGlowLarge)' }}
                                        />
                                    </svg>
                                    <div className="absolute inset-0 flex items-center justify-center flex-col">
                                        <span className="text-7xl font-bold text-white tracking-tighter drop-shadow-[0_0_20px_rgba(255,255,255,0.6)]">
                                            {Math.round((revenueData.total / (revenueData.target || 1)) * 100)}%
                                        </span>
                                        <span className="text-xs text-zinc-500 font-bold tracking-widest uppercase mt-2">of Target</span>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-6 w-full px-8 mt-4">
                                    <div className="bg-white/5 rounded-lg p-4 border border-white/5">
                                        <div className="text-zinc-500 text-[10px] uppercase tracking-widest font-bold mb-1">Achieved</div>
                                        <div className="text-white text-2xl font-bold">{formatRevenue(revenueData.total)}</div>
                                    </div>
                                    <div className="bg-white/5 rounded-lg p-4 border border-white/5">
                                        <div className="text-zinc-500 text-[10px] uppercase tracking-widest font-bold mb-1">Target</div>
                                        <div className="text-white text-2xl font-semibold opacity-60">{formatRevenue(revenueData.target)}</div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </Widget>



                    {/* Revenue Targets Widget */}
                    <Widget
                        id="targets"
                        title="Revenue Targets"
                        subtitle={widgetStates.targets === 'small' ? 'Active' : `Active Targets (${targetsList.length})`}
                        size={widgetStates.targets}
                        onSizeChange={handleWidgetSizeChange}
                    >
                        {widgetStates.targets === 'small' ? (
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
                                            <span className="text-white text-[11px] font-bold tracking-tight">Active Matrix</span>
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
                                        className="relative"
                                    >
                                        <span className="text-6xl font-black text-white tracking-tighter drop-shadow-[0_0_20px_rgba(255,255,255,0.3)]">
                                            {Math.round(targetsList.reduce((acc, t) => acc + (t.progressPercentage || 0), 0) / (targetsList.length || 1))}%
                                        </span>
                                        <div className="absolute -bottom-1 left-0 w-full h-[2px] bg-white/20 overflow-hidden rounded-full">
                                            <motion.div
                                                initial={{ x: '-100%' }}
                                                animate={{ x: '0%' }}
                                                transition={{ duration: 1.5, ease: "circOut" }}
                                                className="h-full bg-white shadow-[0_0_10px_white]"
                                                style={{ width: `${Math.round(targetsList.reduce((acc, t) => acc + (t.progressPercentage || 0), 0) / (targetsList.length || 1))}%` }}
                                            />
                                        </div>
                                    </motion.div>
                                    <span className="text-[9px] text-zinc-500 font-bold uppercase tracking-[0.3em] mt-3 opacity-60">Avg Achievement</span>
                                </div>

                                <div className="w-full bg-white/5 rounded-xl border border-white/5 p-2 flex justify-between items-center z-10 backdrop-blur-sm">
                                    <div className="flex flex-col">
                                        <span className="text-[8px] text-zinc-500 font-black uppercase tracking-widest">Active</span>
                                        <span className="text-white font-black text-xs">{targetsList.length}</span>
                                    </div>
                                    <div className="h-6 w-[1px] bg-white/10" />
                                    <div className="flex flex-col items-end text-right">
                                        <span className="text-[8px] text-zinc-500 font-black uppercase tracking-widest">Target</span>
                                        <span className="text-white font-black text-xs">
                                            {formatRevenue(targetsList.reduce((acc, t) => acc + (t.targetAmount || t.revenueTarget || 0), 0))}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ) : widgetStates.targets === 'medium' ? (
                            <div className="h-full flex flex-col p-4">
                                <div className="grid grid-cols-2 gap-4 h-full overflow-y-auto custom-scrollbar pr-1">
                                    {targetsList.map((target, idx) => (
                                        <motion.div
                                            key={idx}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: idx * 0.1 }}
                                            className="group relative bg-[#1c1c1f]/40 rounded-2xl p-4 border border-white/5 hover:border-white/20 hover:bg-[#1c1c1f]/60 transition-all duration-500 overflow-hidden"
                                        >
                                            {/* Accent Glow */}
                                            <div className="absolute -top-10 -right-10 w-24 h-24 bg-white/5 blur-3xl rounded-full" />

                                            <div className="relative z-10">
                                                <div className="flex justify-between items-start mb-3">
                                                    <div className="flex flex-col">
                                                        <span className="text-white/90 font-bold text-xs tracking-tight uppercase">
                                                            {target.targetPeriod === 'Quarterly' ? `Q${Math.ceil((target.targetMonth || 3) / 3)}` : target.targetPeriod} Target
                                                        </span>
                                                        <span className="text-[9px] text-zinc-500 font-bold uppercase tracking-wider">
                                                            FY {target.targetYear}
                                                        </span>
                                                    </div>
                                                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center border transition-colors ${idx % 2 === 0 ? 'bg-white/5 border-white/10' : 'bg-white/10 border-white/20'}`}>
                                                        {target.targetPeriod === 'Quarterly' ? <Building2 size={14} className="text-white/60" /> : <Target size={14} className="text-white/80" />}
                                                    </div>
                                                </div>

                                                <div className="space-y-3">
                                                    <div>
                                                        <div className="flex justify-between items-baseline mb-1">
                                                            <span className="text-white font-black text-lg tracking-tighter">
                                                                {formatRevenue(target.achievedAmount || target.revenueAchieved)}
                                                            </span>
                                                            <span className="text-zinc-500 text-[9px] font-bold">
                                                                / {formatRevenue(target.targetAmount || target.revenueTarget)}
                                                            </span>
                                                        </div>
                                                        <div className="h-1.5 w-full bg-black/40 rounded-full overflow-hidden p-[1px]">
                                                            <motion.div
                                                                initial={{ width: 0 }}
                                                                animate={{ width: `${target.progressPercentage}%` }}
                                                                transition={{ duration: 1.5, ease: "circOut", delay: 0.5 + (idx * 0.1) }}
                                                                className="h-full bg-white rounded-full relative shadow-[0_0_10px_rgba(255,255,255,0.4)]"
                                                            >
                                                                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full animate-[shimmer_2s_infinite]" />
                                                            </motion.div>
                                                        </div>
                                                    </div>

                                                    <div className="flex items-center justify-between pt-1">
                                                        <div className="flex flex-col">
                                                            <span className="text-[8px] text-zinc-600 font-black uppercase tracking-widest">Progress</span>
                                                            <span className="text-white font-black text-[10px] tracking-tight">{target.progressPercentage}%</span>
                                                        </div>
                                                        <div className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-widest border transition-all ${(target.hosResponse?.status === 'accepted' || target.hosResponse?.status === 'approved')
                                                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 shadow-[0_0_10px_rgba(16,185,129,0.1)]'
                                                            : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                                                            }`}>
                                                            {(target.hosResponse?.status === 'accepted' || target.hosResponse?.status === 'approved') ? 'Active' : 'Pending'}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </motion.div>
                                    ))}
                                    {targetsList.length === 0 && (
                                        <div className="col-span-2 flex flex-col items-center justify-center h-40 text-zinc-500 opacity-40">
                                            <Target size={32} className="mb-2" />
                                            <p className="text-sm font-medium tracking-widest uppercase">No Active Campaigns</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ) : (
                            <div className="h-full flex flex-col p-4 w-full">
                                <div className="flex justify-between items-center mb-4 px-2">
                                    <h3 className="text-zinc-400 text-sm font-medium uppercase tracking-widest">Target History</h3>
                                    <button
                                        onClick={() => setShowAddTargetModal(true)}
                                        className="flex items-center gap-2 px-3 py-1.5 bg-white/10 text-white border border-white/20 rounded-full text-xs font-bold hover:bg-white hover:text-black hover:border-white transition-all duration-300"
                                    >
                                        <Plus size={14} />
                                        <span>New Target</span>
                                    </button>
                                </div>
                                <div className="flex-1 overflow-auto custom-scrollbar w-full">
                                    <table className="w-full text-left">
                                        <thead className="sticky top-0 bg-[#09090b] z-10">
                                            <tr className="border-b border-white/10 text-zinc-500 text-[10px] uppercase font-bold tracking-wider">
                                                <th className="pb-3 pl-2">Period & Timeline</th>
                                                <th className="pb-3">Target</th>
                                                <th className="pb-3">Achieved</th>
                                                <th className="pb-3 w-1/4">Progress</th>
                                                <th className="pb-3 pr-2 text-right">Status</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-white/5">
                                            {targetsList.map((target, idx) => (
                                                <tr key={idx} className="group hover:bg-white/5 transition-colors">
                                                    <td className="py-3 pl-2">
                                                        <div className="flex flex-col">
                                                            <span className="text-white font-medium text-sm">
                                                                {target.targetPeriod || 'Monthly'} {target.targetYear}
                                                            </span>
                                                            <span className="text-zinc-500 text-[10px] uppercase tracking-tighter font-bold">
                                                                {target.startDate ? formatDate(target.startDate) : 'N/A'} — {target.endDate ? formatDate(target.endDate) : 'N/A'}
                                                            </span>
                                                        </div>
                                                    </td>
                                                    <td className="py-3 text-zinc-300 font-medium text-sm">
                                                        {formatRevenue(target.targetAmount || target.revenueTarget)}
                                                    </td>
                                                    <td className="py-3 text-emerald-400 font-medium text-sm">
                                                        {formatRevenue(target.achievedAmount || target.revenueAchieved)}
                                                    </td>
                                                    <td className="py-3 pr-4">
                                                        <div className="flex items-center gap-3">
                                                            <div className="flex-1 bg-black/40 h-2 rounded-full overflow-hidden border border-white/5">
                                                                <div
                                                                    className="h-full bg-white shadow-[0_0_8px_rgba(255,255,255,0.5)] rounded-full relative overflow-hidden group-hover:shadow-[0_0_12px_rgba(255,255,255,0.6)] transition-all"
                                                                    style={{ width: `${target.progressPercentage}%` }}
                                                                >
                                                                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent translate-x-[-100%] animate-[shimmer_2s_infinite]"></div>
                                                                </div>
                                                            </div>
                                                            <span className="text-white font-bold text-xs w-8 text-right">{target.progressPercentage}%</span>
                                                        </div>
                                                    </td>
                                                    <td className="py-3 pr-2 text-right">
                                                        <span className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase ${(target.hosResponse?.status === 'accepted' || target.hosResponse?.status === 'approved') ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                                                            'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                                                            }`}>
                                                            {(target.hosResponse?.status === 'accepted' || target.hosResponse?.status === 'approved') ? 'Active' : target.hosResponse?.status || 'Pending'}
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))}
                                            {targetsList.length === 0 && (
                                                <tr>
                                                    <td colSpan="5" className="text-center text-zinc-500 text-sm py-4">No active targets</td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}
                    </Widget>
                </motion.div>
            </LayoutGroup>

            {/* Add Target Modal */}
            <CreateRevenueTargetModal
                show={showAddTargetModal}
                onClose={() => setShowAddTargetModal(false)}
                teamMembers={salesData?.salesTeam || []}
                onSuccess={() => {
                    // Ideally trigger a refresh if possible
                    console.log('Target created successfully');
                }}
            />
        </div >
    );
};



export default SalesSummaryWidgets;
