import React, { useState, useEffect } from 'react';
import { motion, LayoutGroup } from 'framer-motion';
import {
    TrendingUp, Target, Calendar, DollarSign, RefreshCw, ArrowUpRight,
    ArrowDownRight, PieChart as PieChartIcon, Activity, CheckCircle, Clock
} from 'lucide-react';
import {
    AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, ResponsiveContainer,
    XAxis, YAxis, Tooltip, CartesianGrid, LineChart, Line
} from 'recharts';
import api from '../utils/api';

// --- Shared Components (Copied from BankingWidgets for consistency) ---

const formatCurrency = (value) => `₹${(value || 0).toLocaleString('en-IN')}`;

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

        // Custom resizing logic based on widget type
        const isWideWidget = id === 'renewDetails';

        if (deltaY > 50 && initialSize === 'small') {
            onSizeChange(id, 'medium');
            setInitialSize('medium');
            setDragStartY(currentY);
        } else if (deltaY > 50 && initialSize === 'medium') {
            if (isWideWidget) {
                // Wide widget: Medium -> Full
                onSizeChange(id, 'full');
                setInitialSize('full');
            } else {
                // Normal widget: Medium -> Large
                onSizeChange(id, 'large');
                setInitialSize('large');
            }
            setDragStartY(currentY);
        } else if (deltaY > 50 && initialSize === 'large' && !isWideWidget) {
            // Normal widget stops at Large
        }
        else if (deltaY < -50 && initialSize === 'full') {
            // Wide widget: Full -> Medium
            onSizeChange(id, 'medium');
            setInitialSize('medium');
            setDragStartY(currentY);
        } else if (deltaY < -50 && initialSize === 'large') {
            // Normal widget: Large -> Medium
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

const ProfitRenewDashboard = () => {
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState(null);
    const [widgetStates, setWidgetStates] = useState(() => {
        const defaults = {
            monthlyProfit: 'large',
            activeRenewals: 'medium',
            revenueTrend: 'medium',
            renewDetails: 'full'
        };
        const saved = localStorage.getItem('profitDashboardWidgetSizes_v1');
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
        localStorage.setItem('profitDashboardWidgetSizes_v1', JSON.stringify(widgetStates));
    }, [widgetStates]);

    const [isEditing, setIsEditing] = useState(false);
    const [editedTargets, setEditedTargets] = useState([]);

    const handleWidgetSizeChange = (id, newSize) => {
        setWidgetStates(prev => ({ ...prev, [id]: newSize }));
    };

    const handleEditToggle = () => {
        if (!isEditing) {
            setEditedTargets([...renewDetails]);
        }
        setIsEditing(!isEditing);
    };

    const handleSaveTargets = () => {
        // In a real app, this would call the API
        setData(prev => ({
            ...prev,
            targets: editedTargets
        }));
        setIsEditing(false);
    };

    const handleTargetChange = (id, field, value) => {
        setEditedTargets(prev => prev.map(t =>
            t._id === id ? { ...t, [field]: (field === 'status' ? value : parseFloat(value) || 0) } : t
        ));
    };

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                const response = await api.get('/revenue/dashboard/hos');
                if (response.data.success) {
                    const apiData = response.data.data;
                    const hasData = apiData.targets && apiData.targets.length > 0;
                    if (!hasData) {
                        // Mock Data
                        setData({
                            overview: { totalRevenue: 1250000 },
                            targets: [
                                { _id: '1', targetPeriod: 'Monthly', startDate: new Date().toISOString(), endDate: new Date().toISOString(), targetAmount: 2000000, achievedAmount: 1250000, progressPercentage: 62.5, status: 'in-progress' },
                                { _id: '2', targetPeriod: 'Quarterly', startDate: new Date().toISOString(), endDate: new Date().toISOString(), targetAmount: 5000000, achievedAmount: 1500000, progressPercentage: 30, status: 'in-progress' }
                            ]
                        });
                    } else {
                        setData(apiData);
                    }
                }
            } catch (err) {
                console.error('Error', err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const { targets, overview } = data || {};
    const monthlyProfit = overview?.totalRevenue || 0;
    const renewDetails = targets || [];

    // --- Mock Data with Month Names ---
    const profitData = [
        { month: 'Jan', value: 4000 },
        { month: 'Feb', value: 3000 },
        { month: 'Mar', value: 5000 },
        { month: 'Apr', value: 2780 },
        { month: 'May', value: 4890 },
        { month: 'Jun', value: 2390 },
    ];
    const renewalProgress = 75; // 75% Renewals
    const achievementProgress = 62; // 62% Achievement

    if (loading) return <div className="p-10 text-white">Loading Dashboard...</div>;

    const getStatusStyle = (status) => {
        switch (status) {
            case 'completed': return 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20';
            case 'in-progress': return 'bg-blue-500/10 text-blue-500 border border-blue-500/20';
            case 'expired': return 'bg-red-500/10 text-red-500 border border-red-500/20';
            case 'pending': return 'bg-yellow-500/10 text-yellow-500 border border-yellow-500/20';
            default: return 'bg-zinc-500/10 text-zinc-500 border border-zinc-500/20';
        }
    };

    return (
        <div className="w-full font-sans">
            {/* Header */}
            <div className="flex items-center gap-2 mb-8 ml-1">
                <TrendingUp className="text-white" />
                <div>
                    <h1 className="text-2xl font-bold text-white">Profit & Renew</h1>
                    <p className="text-zinc-500 text-sm">Monitor profit performance and renewal targets</p>
                </div>
            </div>

            <LayoutGroup>
                <motion.div layout className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 auto-rows-[220px]">

                    {/* Widget 1: Monthly Profit */}
                    <Widget id="monthlyProfit" title="Monthly Profit" subtitle="Revenue Overview" size={widgetStates.monthlyProfit} onSizeChange={handleWidgetSizeChange}>
                        {widgetStates.monthlyProfit === 'small' ? (
                            <div className="flex flex-col justify-between h-full relative cursor-default overflow-hidden group">
                                <div className="z-10 px-2 mt-2">
                                    <div className="text-zinc-400 text-[10px] uppercase font-bold tracking-wider mb-1">Current Month</div>
                                    <div className="text-white text-3xl font-bold tracking-tight">{formatCurrency(monthlyProfit)}</div>
                                </div>
                                <div className="absolute bottom-0 left-0 right-0 h-16 opacity-30 group-hover:opacity-50 transition-opacity duration-500">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <AreaChart data={profitData}>
                                            <defs>
                                                <linearGradient id="smallSpark" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="0%" stopColor="#fff" stopOpacity={0.8} />
                                                    <stop offset="100%" stopColor="#fff" stopOpacity={0} />
                                                </linearGradient>
                                            </defs>
                                            <Area type="monotone" dataKey="value" stroke="#fff" strokeWidth={2} fill="url(#smallSpark)" />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                </div>
                                <div className="z-10 px-2 mb-3 flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_#10b981]"></div>
                                    <span className="text-emerald-400 text-xs font-bold">+12% vs last mo</span>
                                </div>
                            </div>
                        ) : widgetStates.monthlyProfit === 'medium' ? (
                            <div className="flex h-full gap-4 items-center">
                                {/* Left Side: Details */}
                                <div className="flex-1 flex flex-col justify-center pl-2">
                                    <div className="mb-4">
                                        <div className="text-zinc-500 text-[10px] uppercase font-bold mb-1">Total Revenue</div>
                                        <div className="text-4xl font-bold text-white tracking-tight">{formatCurrency(monthlyProfit)}</div>
                                    </div>
                                    <div className="flex gap-4">
                                        <div>
                                            <div className="text-zinc-500 text-[9px] uppercase font-bold">Target</div>
                                            <div className="text-white font-bold text-sm">₹15.5L</div>
                                        </div>
                                        <div>
                                            <div className="text-zinc-500 text-[9px] uppercase font-bold">Growth</div>
                                            <div className="text-emerald-400 font-bold text-sm">+22%</div>
                                        </div>
                                    </div>
                                </div>
                                {/* Right Side: Simple Chart */}
                                <div className="w-1/3 h-full pt-4 pb-2 pr-2">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <AreaChart data={profitData}>
                                            <defs>
                                                <linearGradient id="mediumSpark" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="0%" stopColor="#fff" stopOpacity={0.4} />
                                                    <stop offset="100%" stopColor="#fff" stopOpacity={0} />
                                                </linearGradient>
                                            </defs>
                                            <Area type="monotone" dataKey="value" stroke="#fff" strokeWidth={2} fill="url(#mediumSpark)" />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                        ) : (
                            // Large View (Smooth Area Chart Trend with Labels)
                            <div className="flex flex-col h-full">
                                <div className="flex justify-between items-end mb-4 px-2">
                                    <div>
                                        <div className="text-4xl font-bold text-white">{formatCurrency(monthlyProfit)}</div>
                                        <div className="text-zinc-500 text-xs mt-1 uppercase tracking-widest font-bold">6 Month Revenue Trend</div>
                                    </div>
                                    <div className="flex gap-4">
                                        <div className="text-right">
                                            <div className="text-white font-bold text-xl">24%</div>
                                            <div className="text-zinc-600 text-[9px] uppercase font-bold">Margin</div>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-emerald-400 font-bold text-xl">+12%</div>
                                            <div className="text-zinc-600 text-[9px] uppercase font-bold">Growth</div>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex-1 w-full relative group">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <AreaChart data={profitData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                                            <defs>
                                                <linearGradient id="largeAreaGrad" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="0%" stopColor="#fff" stopOpacity={0.3} />
                                                    <stop offset="100%" stopColor="#fff" stopOpacity={0} />
                                                </linearGradient>
                                            </defs>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                                            <XAxis
                                                dataKey="month"
                                                axisLine={false}
                                                tickLine={false}
                                                tick={{ fill: '#71717a', fontSize: 10, fontWeight: 500 }}
                                                dy={10}
                                            />
                                            <Tooltip content={<MinimalTooltip />} cursor={{ stroke: 'rgba(255,255,255,0.2)', strokeWidth: 1, strokeDasharray: '4 4' }} />
                                            <Area
                                                type="monotone"
                                                dataKey="value"
                                                stroke="#fff"
                                                strokeWidth={3}
                                                fill="url(#largeAreaGrad)"
                                                activeDot={{ r: 6, fill: "#fff", stroke: "#000", strokeWidth: 2 }}
                                                className="drop-shadow-[0_0_10px_rgba(255,255,255,0.2)]"
                                            />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                        )}
                    </Widget>

                    {/* Widget 2: Active Renewals */}
                    <Widget id="activeRenewals" title="Active Renewals" subtitle="Target Tracking" size={widgetStates.activeRenewals} onSizeChange={handleWidgetSizeChange}>
                        {widgetStates.activeRenewals === 'small' ? (
                            <div className="flex flex-col items-center justify-center h-full relative cursor-default group overflow-visible">
                                <div className="relative w-24 h-24">
                                    <svg className="w-full h-full rotate-[-90deg] overflow-visible">
                                        <circle cx="50%" cy="50%" r="40" stroke="#27272a" strokeWidth="6" fill="transparent" />
                                        <circle
                                            cx="50%" cy="50%" r="40"
                                            stroke="#ffffff" strokeWidth="6"
                                            fill="transparent"
                                            strokeDasharray="251.2"
                                            strokeDashoffset={251.2 * (1 - renewalProgress / 100)}
                                            strokeLinecap="round"
                                            className="drop-shadow-[0_0_10px_rgba(255,255,255,0.8)] filter"
                                        />
                                    </svg>
                                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                                        <span className="text-3xl font-bold text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.5)]">{renewDetails.length}</span>
                                        <span className="text-[9px] text-zinc-500 uppercase tracking-widest mt-1">Active</span>
                                    </div>
                                </div>
                            </div>
                        ) : widgetStates.activeRenewals === 'medium' ? (
                            <div className="flex w-full h-full items-center justify-between px-3">
                                {/* Left: Main Count & Label */}
                                <div className="flex flex-col justify-center items-start pl-6">
                                    <div className="relative">
                                        <div className="absolute -inset-4 bg-white/5 blur-xl rounded-full opacity-50"></div>
                                        <div className="text-5xl font-bold text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.5)] tracking-tighter relative z-10">
                                            {renewDetails.length}
                                        </div>
                                    </div>
                                    <div className="text-zinc-500 text-[10px] uppercase font-bold tracking-widest mt-2 border-l-2 border-white/20 pl-2">
                                        Active<br />Renewals
                                    </div>
                                </div>

                                {/* Right: Bar Graph */}
                                <div className="flex-1 h-full pl-6 pt-6 pb-1">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={[
                                            { name: 'Done', value: 4, fill: '#ffffff' },
                                            { name: 'Process', value: 3, fill: '#a1a1aa' },
                                            { name: 'Pending', value: 2, fill: '#52525b' }
                                        ]}>
                                            <XAxis
                                                dataKey="name"
                                                axisLine={false}
                                                tickLine={false}
                                                tick={{ fill: '#71717a', fontSize: 8, fontWeight: 700, textTransform: 'uppercase' }}
                                                dy={5}
                                            />
                                            <Tooltip content={<MinimalTooltip />} cursor={{ fill: 'transparent' }} />
                                            <Bar dataKey="value" radius={[4, 4, 4, 4]} barSize={24}>
                                                <Cell fill="#ffffff" className="drop-shadow-[0_0_8px_white]" />
                                                <Cell fill="#a1a1aa" />
                                                <Cell fill="#52525b" />
                                            </Bar>
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                        ) : (
                            // Large View (Detailed Breakdown)
                            <div className="flex flex-col h-full bg-zinc-900/0">
                                <div className="flex justify-between items-start mb-2 px-2">
                                    <div>
                                        <div className="text-3xl font-bold text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.5)]">{renewDetails.length}</div>
                                        <div className="text-zinc-500 text-xs mt-1 uppercase tracking-widest font-bold">Active Targets</div>
                                    </div>
                                    <div className="flex flex-col items-end">
                                        <div className="text-white font-bold text-xl drop-shadow-[0_0_8px_white]">92%</div>
                                        <div className="text-zinc-600 text-[9px] uppercase font-bold">Retention Rate</div>
                                    </div>
                                </div>
                                <div className="flex-1 flex gap-4 items-center">
                                    <div className="flex-1 h-full min-h-[140px] overflow-visible">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <PieChart>
                                                <Pie
                                                    data={[
                                                        { name: 'Completed', value: 45, fill: '#ffffff' },
                                                        { name: 'In Progress', value: 25, fill: '#a1a1aa' },
                                                        { name: 'Pending', value: 20, fill: '#52525b' },
                                                        { name: 'Expired', value: 10, fill: '#27272a' },
                                                    ]}
                                                    cx="50%" cy="50%" innerRadius={50} outerRadius={70}
                                                    paddingAngle={5}
                                                    dataKey="value"
                                                    stroke="none"
                                                >
                                                    {[
                                                        { fill: '#ffffff' }, // White Glow
                                                        { fill: '#a1a1aa' }, // Zinc 400
                                                        { fill: '#52525b' }, // Zinc 600
                                                        { fill: '#27272a' }  // Zinc 800
                                                    ].map((entry, index) => (
                                                        <Cell
                                                            key={`cell-${index}`}
                                                            fill={entry.fill}
                                                            className={index === 0 ? "drop-shadow-[0_0_10px_rgba(255,255,255,0.6)]" : ""}
                                                            stroke="none"
                                                        />
                                                    ))}
                                                </Pie>
                                                <Tooltip content={<MinimalTooltip />} />
                                            </PieChart>
                                        </ResponsiveContainer>
                                    </div>
                                    <div className="w-[140px] flex flex-col justify-center gap-3 pr-4">
                                        {[
                                            { label: 'Completed', count: 45, color: 'bg-white shadow-[0_0_8px_white]' },
                                            { label: 'In Progress', count: 25, color: 'bg-zinc-400' },
                                            { label: 'Pending', count: 20, color: 'bg-zinc-600' },
                                            { label: 'Expired', count: 10, color: 'bg-zinc-800' }
                                        ].map((item, i) => (
                                            <div key={i} className="flex items-center justify-between text-xs">
                                                <div className="flex items-center gap-2">
                                                    <div className={`w-2 h-2 rounded-full ${item.color}`} />
                                                    <span className="text-zinc-400">{item.label}</span>
                                                </div>
                                                <span className="text-white font-bold">{item.count}%</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}
                    </Widget>

                    {/* Widget 3: Renew Details Table (Full Width) */}
                    <Widget id="renewDetails" title="Renew Details" subtitle="Target History" size={widgetStates.renewDetails} onSizeChange={handleWidgetSizeChange} allowOverflow={true}>
                        {widgetStates.renewDetails === 'small' ? (
                            <div className="flex flex-col items-center justify-center h-full">
                                <div className="text-white text-3xl font-bold">{renewDetails.length}</div>
                                <div className="text-zinc-500 text-xs">Total Targets</div>
                            </div>
                        ) : widgetStates.renewDetails === 'medium' ? (
                            <div className="flex flex-col h-full gap-2">
                                <div className="flex justify-between items-end border-b border-white/5 pb-2">
                                    <div className="text-xs text-zinc-400">Recent Targets</div>
                                    <div className="text-white font-bold">{renewDetails.length}</div>
                                </div>
                                <div className="flex-1 overflow-y-auto">
                                    {renewDetails.slice(0, 3).map(t => (
                                        <div key={t._id} className="flex justify-between items-center py-2 border-b border-zinc-800/50 last:border-0">
                                            <span className="text-zinc-300 text-xs">{t.targetPeriod}</span>
                                            <span className={`text-[10px] uppercase ${getStatusStyle(t.status).split(' ')[1]}`}>{t.status}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            // Full / Large View (Table)
                            <div className="flex flex-col h-full">
                                <div className="flex justify-end mb-2 gap-2">
                                    {isEditing ? (
                                        <>
                                            <button
                                                onClick={() => setIsEditing(false)}
                                                className="px-3 py-1.5 bg-zinc-800 text-zinc-400 text-[10px] font-bold uppercase tracking-wider rounded-lg hover:bg-zinc-700 transition-colors border border-white/5"
                                            >
                                                Cancel
                                            </button>
                                            <button
                                                onClick={handleSaveTargets}
                                                className="px-3 py-1.5 bg-white text-black text-[10px] font-bold uppercase tracking-wider rounded-lg hover:bg-zinc-100 transition-colors shadow-[0_0_15px_rgba(255,255,255,0.3)]"
                                            >
                                                Save Changes
                                            </button>
                                        </>
                                    ) : (
                                        <button
                                            onClick={handleEditToggle}
                                            className="px-3 py-1.5 bg-zinc-800 text-white text-[10px] font-bold uppercase tracking-wider rounded-lg hover:bg-zinc-700 transition-colors border border-white/5"
                                        >
                                            Edit Details
                                        </button>
                                    )}
                                </div>
                                <div className="overflow-x-auto flex-1 min-h-0">
                                    <table className="w-full text-left border-collapse">
                                        <thead>
                                            <tr className="border-b border-white/5">
                                                <th className="py-3 px-2 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Period & Timeline</th>
                                                <th className="py-3 px-2 text-[10px] font-bold text-zinc-500 uppercase tracking-widest text-right">Target</th>
                                                <th className="py-3 px-2 text-[10px] font-bold text-zinc-500 uppercase tracking-widest text-right">Achieved</th>
                                                <th className="py-3 px-2 text-[10px] font-bold text-zinc-500 uppercase tracking-widest pl-8">Progress</th>
                                                <th className="py-3 px-2 text-[10px] font-bold text-zinc-500 uppercase tracking-widest text-right">Status</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {renewDetails.length > 0 ? renewDetails.map((target) => (
                                                <tr key={target._id} className="border-b border-zinc-800/30 group hover:bg-white/5 transition-colors">
                                                    <td className="py-3 px-2">
                                                        <div className="text-white font-bold text-xs tracking-wide">{target.targetPeriod}</div>
                                                        <div className="text-zinc-500 text-[9px] uppercase mt-0.5">{target.startDate && new Date(target.startDate).toLocaleDateString()}</div>
                                                    </td>
                                                    <td className="py-3 px-2 text-right">
                                                        {isEditing ? (
                                                            <input
                                                                type="number"
                                                                value={editedTargets.find(et => et._id === target._id)?.targetAmount || 0}
                                                                onChange={(e) => handleTargetChange(target._id, 'targetAmount', e.target.value)}
                                                                className="w-20 bg-black/40 border border-white/10 rounded px-1.5 py-0.5 text-right text-white font-medium text-xs focus:border-white/30 outline-none"
                                                            />
                                                        ) : (
                                                            <div className="text-white font-medium text-xs">{formatCurrency(target.targetAmount)}</div>
                                                        )}
                                                    </td>
                                                    <td className="py-3 px-2 text-right">
                                                        {isEditing ? (
                                                            <input
                                                                type="number"
                                                                value={editedTargets.find(et => et._id === target._id)?.achievedAmount || 0}
                                                                onChange={(e) => handleTargetChange(target._id, 'achievedAmount', e.target.value)}
                                                                className="w-20 bg-black/40 border border-white/10 rounded px-1.5 py-0.5 text-right text-white/80 font-medium text-xs focus:border-white/30 outline-none"
                                                            />
                                                        ) : (
                                                            <div className="text-white/80 font-medium text-xs">{formatCurrency(target.achievedAmount)}</div>
                                                        )}
                                                    </td>
                                                    <td className="py-3 px-2 pl-8">
                                                        <div className="flex items-center gap-2">
                                                            <div className="flex-1 h-1 bg-zinc-800 rounded-full overflow-hidden max-w-[80px]">
                                                                <div className="h-full bg-white rounded-full shadow-[0_0_8px_rgba(255,255,255,0.5)]" style={{ width: `${Math.min(target.progressPercentage || 0, 100)}%` }}></div>
                                                            </div>
                                                            <div className="text-[9px] text-zinc-400 font-medium w-6">{target.progressPercentage}%</div>
                                                        </div>
                                                    </td>
                                                    <td className="py-3 px-2 text-right">
                                                        {isEditing ? (
                                                            <select
                                                                value={editedTargets.find(et => et._id === target._id)?.status || 'pending'}
                                                                onChange={(e) => handleTargetChange(target._id, 'status', e.target.value)}
                                                                className="bg-black/40 border border-white/10 rounded px-1.5 py-0.5 text-right text-white font-bold text-[10px] uppercase outline-none focus:border-white/30"
                                                            >
                                                                <option value="completed">Completed</option>
                                                                <option value="in-progress">In-Progress</option>
                                                                <option value="pending">Pending</option>
                                                                <option value="expired">Expired</option>
                                                            </select>
                                                        ) : (
                                                            <span className={`px-2 py-0.5 rounded-full text-[9px] uppercase font-bold tracking-wide border ${getStatusStyle(target.status)}`}>
                                                                {target.status}
                                                            </span>
                                                        )}
                                                    </td>
                                                </tr>
                                            )) : (
                                                <tr>
                                                    <td colSpan="5" className="py-8 text-center text-zinc-500 text-xs">No active targets found</td>
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
        </div>
    );
};

export default ProfitRenewDashboard;
