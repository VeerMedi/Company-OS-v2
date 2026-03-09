import React, { useState, useEffect } from 'react';
import { motion, LayoutGroup } from 'framer-motion';
import {
    DollarSign, TrendingUp, Building2, Users, Target, Briefcase, CreditCard, PieChart as PieChartIcon
} from 'lucide-react';
import {
    AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid, LineChart, Line, LabelList
} from 'recharts';

// Helper functions
const formatCurrency = (value) => `₹${(value || 0).toLocaleString('en-IN')}`;
const formatRevenue = (amount) => {
    if (!amount) return '₹0';
    if (amount >= 10000000) return `₹${(amount / 10000000).toFixed(2)}Cr`;
    if (amount >= 100000) return `₹${(amount / 100000).toFixed(2)}L`;
    return `₹${amount.toLocaleString('en-IN')}`;
};

// Minimal Tooltip
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

// Widget Header
const WidgetHeader = ({ title, subtitle }) => (
    <div className="flex items-start justify-between mb-3 z-10 relative">
        <div>
            <h3 className="text-transparent bg-clip-text bg-gradient-to-r from-white to-zinc-400 font-bold text-sm tracking-wide">{title}</h3>
            {subtitle && <p className="text-zinc-500 text-[10px] mt-0.5 font-medium tracking-wider uppercase">{subtitle}</p>}
        </div>
    </div>
);

// Widget Component
const Widget = ({ id, title, subtitle, size, onSizeChange, children }) => {
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
            className={`relative rounded-[24px] bg-gradient-to-b from-[#18181b] to-[#09090b] border border-white/5 shadow-2xl overflow-hidden group ${getGridClass()}`}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
        >
            <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/0 to-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
            <motion.div layout className="relative p-6 h-full flex flex-col">
                <WidgetHeader title={title} subtitle={subtitle} />
                <div className="flex-1 min-h-0 relative flex flex-col z-0">
                    {children}
                </div>
            </motion.div>
            <div
                className={`absolute bottom-1 right-1 w-8 h-8 flex items-center justify-center cursor-ns-resize z-20 opacity-0 hover:opacity-100 transition-all duration-200 ${isDragging ? 'opacity-100 scale-110' : ''}`}
                onMouseDown={handleDragStart}
                onTouchStart={handleDragStart}
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
const BankingFinancialWidgets = ({ data }) => {
    const [widgetStates, setWidgetStates] = useState(() => {
        const defaults = {
            availableBalance: 'medium',
            monthlyRevenue: 'medium',
            monthlyProfit: 'small',
            monthlyExpenses: 'small',
            activeClients: 'small',
            activeProjects: 'small',
            activeLeads: 'small',
            teamSize: 'small',
            pipelineValue: 'small',
            revenueBreakdown: 'medium',
            businessMetrics: 'medium'
        };
        const saved = localStorage.getItem('bankingDashboardWidgetSizes_v1');
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
        localStorage.setItem('bankingDashboardWidgetSizes_v1', JSON.stringify(widgetStates));
    }, [widgetStates]);

    const handleWidgetSizeChange = (id, newSize) => {
        setWidgetStates(prev => ({ ...prev, [id]: newSize }));
    };

    // Extract data
    const financials = data?.financials || {};
    const business = data?.business || {};
    const sales = data?.sales || {};
    const team = data?.team || {};

    const currentFunds = financials?.currentFunds?.value || 0;
    const totalRevenue = financials?.monthlyRevenue?.value || 0;
    const monthlyExpenses = financials?.monthlyExpenses?.value || 0;
    const monthlyProfit = financials?.monthlyProfit?.value || 0;
    const profitMargin = financials?.monthlyProfit?.margin || 0;
    const revenueGrowth = financials?.monthlyRevenue?.growth || 0;
    const ytdRevenue = financials?.ytdRevenue?.value || 0;

    const activeClients = business?.activeClients?.value || 0;
    const totalClients = business?.activeClients?.total || 0;
    const activeProjects = business?.activeProjects?.value || 0;
    const pipelineValue = business?.pipelineValue?.value || 0;

    const activeLeads = sales?.activeLeads?.value || 0;
    const conversionRate = sales?.conversionRate?.value || 0;
    const leadFlow = sales?.leadFlow || {};

    const totalEmployees = team?.totalEmployees || 0;
    const attendanceRate = team?.attendanceRate?.value || 0;

    // Generate sparkline data
    const generateSparkline = (trend = 'neutral', points = 12) => {
        const data = [];
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        let current = 50;
        for (let i = 0; i < points; i++) {
            let change = (Math.random() - 0.5) * 10;
            if (trend === 'up') change += 2;
            if (trend === 'down') change -= 2;
            current = Math.max(10, current + change);
            // Use modulo to cycle through months if points > 12, but start from index 0
            data.push({ month: months[i % 12], value: current });
        }
        return data;
    };

    const revenueTrendData = generateSparkline('up', 12);
    const expensesTrendData = generateSparkline('neutral', 12);
    const profitTrendData = generateSparkline('up', 12);

    return (
        <div className="p-2">
            <div className="mb-8 flex justify-between items-center px-2">
                <div>
                    <h1 className="text-3xl font-bold text-white tracking-tight drop-shadow-lg">Banking & Financial Overview</h1>
                    <p className="text-zinc-500 text-sm mt-1">Real-time financial insights</p>
                </div>
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

                    {/* Widget 1: Available Balance */}
                    <Widget id="availableBalance" title="Available Balance" subtitle="Current Funds" size={widgetStates.availableBalance} onSizeChange={handleWidgetSizeChange}>
                        {widgetStates.availableBalance === 'small' ? (
                            <div className="flex flex-col justify-center h-full items-center">
                                {/* Vertical bars like Revenue widget */}
                                <div className="flex items-end justify-center gap-1.5 h-24 mb-3">
                                    {[65, 45, 80, 55, 70, 50].map((height, idx) => (
                                        <div key={idx} className="w-4 bg-gradient-to-t from-white to-zinc-400 rounded-t"
                                            style={{
                                                height: `${height}%`,
                                                boxShadow: `0 0 ${4 + height / 15}px rgba(255,255,255,${0.3 + height / 200})`
                                            }}
                                        />
                                    ))}
                                </div>
                                <div className="text-white text-3xl font-bold tracking-tighter">{formatRevenue(currentFunds)}</div>
                                <div className="text-zinc-500 text-[9px] uppercase tracking-widest font-bold mt-1">AVAILABLE</div>
                            </div>
                        ) : widgetStates.availableBalance === 'medium' ? (
                            <div className="flex flex-col h-full relative overflow-hidden">
                                <div className="flex justify-between items-start z-10">
                                    <div>
                                        <div className="text-white text-4xl font-bold tracking-tighter drop-shadow-[0_0_10px_rgba(255,255,255,0.5)]">{formatRevenue(currentFunds)}</div>
                                        <div className="text-zinc-500 text-[10px] uppercase tracking-widest mt-0.5 font-bold">AVAILABLE BALANCE</div>
                                    </div>
                                    <div className="bg-white/10 text-white px-2 py-1 rounded-md text-[10px] font-bold backdrop-blur-sm border border-white/10 shadow-sm">
                                        +8.2%
                                    </div>
                                </div>
                                <div className="absolute -bottom-4 -left-4 -right-4 h-[65%] opacity-60 group-hover:opacity-100 transition-opacity duration-500">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <AreaChart data={revenueTrendData}>
                                            <defs>
                                                <linearGradient id="balanceGradientMedium" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="0%" stopColor="#ffffff" stopOpacity={0.2} />
                                                    <stop offset="100%" stopColor="#ffffff" stopOpacity={0} />
                                                </linearGradient>
                                            </defs>
                                            <Area
                                                type="monotone"
                                                dataKey="value"
                                                stroke="#ffffff"
                                                strokeWidth={2}
                                                fill="url(#balanceGradientMedium)"
                                                style={{ filter: 'drop-shadow(0 0 4px rgba(255,255,255,0.2))' }}
                                            />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                        ) : (
                            <div className="flex flex-col h-full">
                                <div className="flex justify-between items-start mb-2">
                                    <div>
                                        <div className="text-white text-5xl font-bold tracking-tighter drop-shadow-[0_0_15px_rgba(255,255,255,0.3)]">{formatRevenue(currentFunds)}</div>
                                        <div className="text-zinc-500 text-xs mt-1">Available Balance</div>
                                    </div>
                                    <div className="bg-white/10 text-white border border-white/20 px-3 py-1.5 rounded-lg text-sm font-bold backdrop-blur-sm">+8.2%</div>
                                </div>
                                <div className="flex-1 min-h-0 relative -mx-2">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <AreaChart data={revenueTrendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                            <defs>
                                                <linearGradient id="balanceGradientLarge" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#ffffff" stopOpacity={0.2} />
                                                    <stop offset="95%" stopColor="#ffffff" stopOpacity={0} />
                                                </linearGradient>
                                            </defs>
                                            <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#71717a', fontSize: 10, fontWeight: 600 }} />
                                            <Tooltip content={<MinimalTooltip />} />
                                            <Area type="monotone" dataKey="value" stroke="#ffffff" strokeWidth={3} fillOpacity={1} fill="url(#balanceGradientLarge)" style={{ filter: 'drop-shadow(0 0 8px rgba(255,255,255,0.4))' }} animationDuration={1500} />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                </div>
                                <div className="mt-3 grid grid-cols-3 gap-3">
                                    <div className="bg-zinc-800/40 border border-white/10 rounded-xl p-3 flex justify-between items-center group hover:bg-zinc-800/60 transition-colors cursor-default">
                                        <div>
                                            <div className="text-zinc-500 text-[9px] uppercase tracking-widest font-bold mb-0.5">Avg Balance</div>
                                            <div className="text-white text-lg font-bold tracking-tight">{formatRevenue(currentFunds * 0.92)}</div>
                                        </div>
                                        <div className="p-2 rounded-lg bg-white/5 text-white group-hover:scale-110 transition-transform">
                                            <DollarSign size={16} />
                                        </div>
                                    </div>
                                    <div className="bg-zinc-800/40 border border-white/10 rounded-xl p-3 flex justify-between items-center group hover:bg-zinc-800/60 transition-colors cursor-default">
                                        <div>
                                            <div className="text-zinc-500 text-[9px] uppercase tracking-widest font-bold mb-0.5">Peak Balance</div>
                                            <div className="text-white text-lg font-bold tracking-tight">{formatRevenue(currentFunds * 1.15)}</div>
                                        </div>
                                        <div className="p-2 rounded-lg bg-white/5 text-white group-hover:scale-110 transition-transform">
                                            <TrendingUp size={16} />
                                        </div>
                                    </div>
                                    <div className="bg-zinc-800/40 border border-white/10 rounded-xl p-3 flex justify-between items-center group hover:bg-zinc-800/60 transition-colors cursor-default">
                                        <div>
                                            <div className="text-zinc-500 text-[9px] uppercase tracking-widest font-bold mb-0.5">Low Balance</div>
                                            <div className="text-white text-lg font-bold tracking-tight">{formatRevenue(currentFunds * 0.78)}</div>
                                        </div>
                                        <div className="p-2 rounded-lg bg-white/5 text-white group-hover:scale-110 transition-transform">
                                            <Briefcase size={16} />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </Widget>

                    {/* Widget 2: Monthly Revenue */}
                    <Widget id="monthlyRevenue" title="Monthly Revenue" subtitle={`${revenueGrowth > 0 ? '+' : ''}${revenueGrowth}% growth`} size={widgetStates.monthlyRevenue} onSizeChange={handleWidgetSizeChange}>
                        {widgetStates.monthlyRevenue === 'small' ? (
                            <div className="flex flex-col justify-center h-full items-center">
                                {/* Achievement box like Revenue dashboard */}
                                <div className="relative w-28 h-28 rounded-2xl bg-gradient-to-br from-zinc-800/50 to-zinc-900/80 border border-white/10 flex items-center justify-center mb-2">
                                    <div className="text-center">
                                        <div className="text-5xl font-bold text-white tracking-tighter">{revenueGrowth}%</div>
                                        <div className="text-[8px] text-zinc-500 uppercase tracking-widest font-bold mt-1">TARGET</div>
                                    </div>
                                    {/* Corner accent */}
                                    <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-white shadow-[0_0_8px_rgba(255,255,255,0.6)]"></div>
                                </div>
                                <div className="text-zinc-500 text-[9px] uppercase tracking-widest font-bold">ACHIEVEMENT</div>
                            </div>
                        ) : widgetStates.monthlyRevenue === 'medium' ? (
                            <div className="flex flex-col h-full relative overflow-hidden group">
                                <div className="flex justify-between items-start z-10">
                                    <div>
                                        <div className="text-white text-4xl font-bold tracking-tighter drop-shadow-[0_0_10px_rgba(255,255,255,0.5)]">{formatRevenue(totalRevenue)}</div>
                                        <div className="text-zinc-500 text-[10px] uppercase tracking-widest mt-0.5 font-bold">MONTHLY REVENUE</div>
                                    </div>
                                    <div className="bg-white/10 text-white px-2 py-1 rounded-md text-[10px] font-bold backdrop-blur-sm border border-white/10 shadow-sm">
                                        {revenueGrowth > 0 ? '+' : ''}{revenueGrowth}%
                                    </div>
                                </div>

                                <div className="absolute top-12 left-0 right-0 bottom-0 pt-4 px-1">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={revenueTrendData} barSize={12}>
                                            <defs>
                                                <linearGradient id="revenueMediumBar" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="0%" stopColor="#ffffff" stopOpacity={0.8} />
                                                    <stop offset="100%" stopColor="#ffffff" stopOpacity={0.2} />
                                                </linearGradient>
                                            </defs>
                                            <Tooltip
                                                cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                                                contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', borderRadius: '8px' }}
                                                itemStyle={{ color: '#fff' }}
                                                labelStyle={{ display: 'none' }}
                                                formatter={(value) => [formatRevenue(value), 'Revenue']}
                                            />
                                            <Bar dataKey="value" fill="url(#revenueMediumBar)" radius={[2, 2, 0, 0]}>
                                                {revenueTrendData.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} style={{ filter: 'drop-shadow(0 0 2px rgba(255,255,255,0.1))' }} />
                                                ))}
                                            </Bar>
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                        ) : (
                            <div className="flex h-full gap-6">
                                {/* Left Side: Revenue Trend (60%) */}
                                <div className="flex-1 relative rounded-2xl bg-black/20 border border-white/5 overflow-hidden group">
                                    <div className="absolute top-4 left-4 z-10">
                                        <div className="text-zinc-500 text-[10px] uppercase tracking-widest font-bold">Revenue Trend</div>
                                        <div className="text-white text-2xl font-bold mt-0.5">{formatRevenue(totalRevenue)}</div>
                                    </div>
                                    <div className="absolute inset-0 pt-12">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <BarChart data={revenueTrendData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }} barSize={32}>
                                                <defs>
                                                    <linearGradient id="revenueBarGradient" x1="0" y1="0" x2="0" y2="1">
                                                        <stop offset="0%" stopColor="#ffffff" stopOpacity={1} />
                                                        <stop offset="100%" stopColor="#71717a" stopOpacity={0.6} />
                                                    </linearGradient>
                                                </defs>
                                                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} opacity={0.5} />
                                                <XAxis
                                                    dataKey="month"
                                                    tick={{ fill: '#71717a', fontSize: 10, fontWeight: 600 }}
                                                    axisLine={false}
                                                    tickLine={false}
                                                    dy={10}
                                                />
                                                <Tooltip
                                                    cursor={{ fill: 'rgba(255,255,255,0.05)', radius: 8 }}
                                                    content={({ active, payload, label }) => {
                                                        if (active && payload && payload.length) {
                                                            return (
                                                                <div className="bg-zinc-900/95 border border-white/10 p-3 rounded-lg shadow-2xl backdrop-blur-md">
                                                                    <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-wider mb-1">{label}</p>
                                                                    <div className="flex items-center gap-2">
                                                                        <div className="w-2 h-2 rounded-full bg-white"></div>
                                                                        <p className="text-white text-base font-bold tracking-tight">
                                                                            {formatRevenue(payload[0].value)}
                                                                        </p>
                                                                    </div>
                                                                </div>
                                                            );
                                                        }
                                                        return null;
                                                    }}
                                                />
                                                <Bar dataKey="value" radius={[8, 8, 8, 8]} fill="url(#revenueBarGradient)">
                                                    {revenueTrendData.map((entry, index) => (
                                                        <Cell key={`cell-${index}`} style={{ filter: `drop-shadow(0px 2px 8px rgba(255,255,255,${0.1 + index * 0.01}))` }} />
                                                    ))}
                                                </Bar>
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>

                                {/* Right Side: Details (40%) */}
                                <div className="w-[35%] flex flex-col gap-3 justify-center">
                                    <div className="bg-zinc-800/40 hover:bg-zinc-800/60 border border-white/10 p-3 rounded-xl backdrop-blur-sm relative overflow-hidden group transition-all duration-300">
                                        <div className="flex justify-between items-center relative z-10">
                                            <div>
                                                <div className="text-zinc-500 text-[9px] uppercase tracking-widest font-bold mb-0.5">YTD Revenue</div>
                                                <div className="text-white text-lg font-bold tracking-tight">{formatRevenue(ytdRevenue)}</div>
                                            </div>
                                            <div className="p-2 rounded-lg bg-white/5 text-white">
                                                <DollarSign size={16} />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="bg-zinc-800/40 hover:bg-zinc-800/60 border border-white/10 p-3 rounded-xl backdrop-blur-sm relative overflow-hidden group transition-all duration-300">
                                        <div className="flex justify-between items-center relative z-10">
                                            <div>
                                                <div className="text-zinc-500 text-[9px] uppercase tracking-widest font-bold mb-0.5">Target</div>
                                                <div className="text-white text-lg font-bold tracking-tight">{formatRevenue(totalRevenue * 1.1)}</div>
                                            </div>
                                            <div className="p-2 rounded-lg bg-white/5 text-white">
                                                <Target size={16} />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="bg-zinc-800/40 hover:bg-zinc-800/60 border border-white/10 p-3 rounded-xl backdrop-blur-sm relative overflow-hidden group transition-all duration-300">
                                        <div className="flex justify-between items-center relative z-10">
                                            <div>
                                                <div className="text-zinc-500 text-[9px] uppercase tracking-widest font-bold mb-0.5">Monthly Growth</div>
                                                <div className="text-white text-lg font-bold tracking-tight">{revenueGrowth > 0 ? '+' : ''}{revenueGrowth}%</div>
                                            </div>
                                            <div className="p-2 rounded-lg bg-white/5 text-white">
                                                <TrendingUp size={16} />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </Widget>

                    {/* Widget 3: Monthly Profit */}
                    <Widget id="monthlyProfit" title="Monthly Profit" subtitle={`${profitMargin}% margin`} size={widgetStates.monthlyProfit} onSizeChange={handleWidgetSizeChange}>
                        {widgetStates.monthlyProfit === 'small' ? (
                            <div className="flex items-center justify-between h-full">
                                <div className="flex flex-col justify-center">
                                    <div className="text-white text-4xl font-bold tracking-tighter drop-shadow-[0_0_15px_rgba(255,255,255,0.3)]">
                                        {formatRevenue(monthlyProfit)}
                                    </div>
                                    <div className="flex items-center gap-2 mt-2">
                                        <div className="text-emerald-400 text-xs font-bold px-1.5 py-0.5 bg-emerald-500/10 rounded-md border border-emerald-500/20">
                                            {profitMargin}%
                                        </div>
                                        <span className="text-zinc-600 text-[10px]">margin</span>
                                    </div>
                                </div>
                                <div className="relative w-20 h-20">
                                    <svg viewBox="0 0 80 80" className="transform -rotate-90 w-full h-full">
                                        <circle cx="40" cy="40" r="32" stroke="#18181b" strokeWidth="8" fill="transparent" />
                                        <circle
                                            cx="40" cy="40" r="32"
                                            stroke="#10b981" strokeWidth="8" strokeLinecap="round"
                                            fill="transparent"
                                            strokeDasharray={`${2 * Math.PI * 32}`}
                                            strokeDashoffset={`${2 * Math.PI * 32 * (1 - profitMargin / 100)}`}
                                            style={{ filter: 'drop-shadow(0 0 4px rgba(16,185,129,0.5))' }}
                                        />
                                    </svg>
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <span className="text-lg font-bold text-emerald-400">{profitMargin}%</span>
                                    </div>
                                </div>
                            </div>
                        ) : widgetStates.monthlyProfit === 'medium' ? (
                            <div className="flex flex-col h-full relative justify-center gap-3 pb-6">
                                {/* Top Centered Amount */}
                                <div className="flex flex-col items-center justify-center">
                                    <div className="relative group cursor-default">
                                        <div className="absolute -inset-4 bg-white/5 blur-xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                                        <div className="text-white text-5xl font-bold tracking-tighter drop-shadow-[0_0_15px_rgba(255,255,255,0.4)] relative z-10 transition-transform duration-300 group-hover:scale-105">
                                            {formatRevenue(monthlyProfit)}
                                        </div>
                                    </div>
                                    <div className="text-zinc-500 text-[10px] uppercase tracking-[0.3em] font-bold mt-1.5 border-b border-white/5 pb-1">Net Monthly Profit</div>
                                </div>

                                {/* 3 stat boxes with unique styling */}
                                <div className="grid grid-cols-3 gap-3 w-full px-1">
                                    <div className="bg-black/20 border border-white/10 rounded-xl p-2 flex flex-col items-center justify-center backdrop-blur-md group hover:bg-white/5 transition-all duration-300 hover:-translate-y-1 relative overflow-hidden">
                                        <div className="absolute inset-0 bg-gradient-to-t from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                        <div className="text-zinc-500 text-[8px] uppercase font-bold mb-1 tracking-wider z-10">Projects</div>
                                        <div className="text-white font-bold text-xl z-10">{Math.floor(activeProjects * 0.7)}</div>
                                    </div>

                                    <div className="bg-black/20 border border-white/10 rounded-xl p-2 flex flex-col items-center justify-center backdrop-blur-md group hover:bg-white/5 transition-all duration-300 hover:-translate-y-1 relative overflow-hidden">
                                        <div className="absolute inset-0 bg-gradient-to-t from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                        <div className="text-zinc-500 text-[8px] uppercase font-bold mb-1 tracking-wider z-10">Score</div>
                                        <div className="text-white font-bold text-xl z-10">{profitMargin}</div>
                                    </div>

                                    <div className="bg-black/20 border border-white/10 rounded-xl p-2 flex flex-col items-center justify-center backdrop-blur-md group hover:bg-white/5 transition-all duration-300 hover:-translate-y-1 relative overflow-hidden">
                                        <div className="absolute inset-0 bg-gradient-to-t from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                        <div className="text-zinc-500 text-[8px] uppercase font-bold mb-1 tracking-wider z-10">Margin</div>
                                        <div className="text-white font-bold text-xl z-10">{profitMargin}%</div>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="flex flex-col h-full bg-zinc-900/0">
                                <div className="flex justify-between items-start mb-6 px-2">
                                    <div>
                                        <div className="text-white text-5xl font-bold tracking-tighter drop-shadow-[0_0_15px_rgba(255,255,255,0.3)]">{formatRevenue(monthlyProfit)}</div>
                                        <div className="text-zinc-500 text-xs mt-1 uppercase tracking-widest font-bold">Total Monthly Profit</div>
                                    </div>
                                    <div className="flex flex-col items-end">
                                        <div className="text-white text-2xl font-bold">{profitMargin}%</div>
                                        <div className="text-zinc-500 text-[10px] uppercase font-bold">MARGIN</div>
                                    </div>
                                </div>
                                <div className="flex-1 w-full">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={revenueTrendData} margin={{ top: 20, right: 10, left: 10, bottom: 0 }} barSize={45}>
                                            <defs>
                                                <linearGradient id="profitBarGradient" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="0%" stopColor="#d4d4d8" stopOpacity={1} />
                                                    <stop offset="100%" stopColor="#3f3f46" stopOpacity={1} />
                                                </linearGradient>
                                            </defs>
                                            <XAxis
                                                dataKey="month"
                                                axisLine={false}
                                                tickLine={false}
                                                tick={{ fill: '#a1a1aa', fontSize: 11, fontWeight: 600, dy: 10 }}
                                            />
                                            <Tooltip
                                                cursor={{ fill: 'rgba(255,255,255,0.03)', radius: 8 }}
                                                content={<MinimalTooltip />}
                                            />
                                            <Bar dataKey="value" radius={[12, 12, 12, 12]} fill="url(#profitBarGradient)">
                                                {revenueTrendData.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} style={{ filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.5))' }} />
                                                ))}
                                            </Bar>
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                        )}
                    </Widget>

                    {/* Widget 4: Monthly Expenses */}
                    <Widget id="monthlyExpenses" title="Monthly Expenses" subtitle="Operating Costs" size={widgetStates.monthlyExpenses} onSizeChange={handleWidgetSizeChange}>
                        {widgetStates.monthlyExpenses === 'small' ? (
                            <div className="flex flex-col h-full justify-center items-center">
                                {/* Main amount - Payroll style */}
                                <div className="text-white text-5xl font-bold tracking-tighter drop-shadow-[0_0_15px_rgba(255,255,255,0.3)] mb-3">
                                    {formatRevenue(monthlyExpenses)}
                                </div>
                                <div className="text-zinc-500 text-[9px] uppercase tracking-widest font-bold mb-4">TOTAL EXPENSES</div>

                                {/* Status badge */}
                                <div className="flex items-center gap-2 bg-emerald-500/10 px-3 py-1.5 rounded-full border border-emerald-500/20">
                                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_6px_rgba(16,185,129,0.6)]"></div>
                                    <span className="text-emerald-400 text-[10px] font-bold uppercase tracking-wider">PROCESSING</span>
                                </div>

                                {/* Processing status bar */}
                                <div className="w-full mt-4 px-4">
                                    <div className="h-1 bg-zinc-800/50 rounded-full overflow-hidden">
                                        <div className="h-full bg-gradient-to-r from-emerald-500 to-emerald-300 rounded-full w-[65%] shadow-[0_0_8px_rgba(16,185,129,0.4)]"></div>
                                    </div>
                                </div>
                            </div>
                        ) : widgetStates.monthlyExpenses === 'medium' ? (
                            <div className="flex h-full items-center gap-6 px-2">
                                {/* Left Side */}
                                <div className="w-[30%] flex flex-col justify-center items-start gap-2">
                                    <div className="text-white text-5xl font-bold tracking-tighter drop-shadow-[0_0_15px_rgba(255,255,255,0.3)]">{formatRevenue(monthlyExpenses)}</div>
                                    <div className="inline-flex py-2 px-5 rounded-full border border-white/10 bg-zinc-800/50 text-white text-[10px] font-bold tracking-wider w-fit hover:bg-zinc-800 transition-colors cursor-default shadow-lg">
                                        JAN 2026
                                    </div>
                                </div>

                                {/* Right Side */}
                                <div className="flex-1 flex flex-col justify-center gap-4">
                                    {/* Item 1 */}
                                    <div className="group">
                                        <div className="flex justify-between items-end mb-1.5">
                                            <span className="text-zinc-400 text-[10px] uppercase font-bold tracking-wider group-hover:text-white transition-colors">Salaries</span>
                                            <span className="text-white font-bold text-xs">{formatRevenue(monthlyExpenses * 0.6)}</span>
                                        </div>
                                        <div className="h-1.5 w-full bg-zinc-800 rounded-full overflow-hidden border border-white/5">
                                            <div className="h-full bg-white w-[60%] rounded-full shadow-[0_0_10px_rgba(255,255,255,0.5)] transition-all duration-500 group-hover:w-[62%]"></div>
                                        </div>
                                    </div>

                                    {/* Item 2 */}
                                    <div className="group">
                                        <div className="flex justify-between items-end mb-1.5">
                                            <span className="text-zinc-400 text-[10px] uppercase font-bold tracking-wider group-hover:text-white transition-colors">Operations</span>
                                            <span className="text-white font-bold text-xs">{formatRevenue(monthlyExpenses * 0.25)}</span>
                                        </div>
                                        <div className="h-1.5 w-full bg-zinc-800 rounded-full overflow-hidden border border-white/5">
                                            <div className="h-full bg-zinc-400 w-[25%] rounded-full transition-all duration-500 group-hover:w-[27%]"></div>
                                        </div>
                                    </div>

                                    {/* Item 3 */}
                                    <div className="group">
                                        <div className="flex justify-between items-end mb-1.5">
                                            <span className="text-zinc-400 text-[10px] uppercase font-bold tracking-wider group-hover:text-white transition-colors">Marketing</span>
                                            <span className="text-white font-bold text-xs">{formatRevenue(monthlyExpenses * 0.15)}</span>
                                        </div>
                                        <div className="h-1.5 w-full bg-zinc-800 rounded-full overflow-hidden border border-white/5">
                                            <div className="h-full bg-zinc-600 w-[15%] rounded-full transition-all duration-500 group-hover:w-[17%]"></div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="flex flex-col h-full">
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <div className="text-white text-5xl font-bold tracking-tighter drop-shadow-[0_0_15px_rgba(255,255,255,0.3)]">{formatRevenue(monthlyExpenses)}</div>
                                        <div className="text-zinc-500 text-xs mt-1">Monthly Expenses</div>
                                    </div>
                                </div>
                                <div className="flex-1">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <LineChart data={expensesTrendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} opacity={0.5} />
                                            <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#71717a', fontSize: 10, fontWeight: 600 }} />
                                            <Tooltip
                                                cursor={{ stroke: 'rgba(255,255,255,0.1)', strokeWidth: 2 }}
                                                content={<MinimalTooltip />}
                                            />
                                            <Line
                                                type="monotone"
                                                dataKey="value"
                                                stroke="#ffffff"
                                                strokeWidth={4}
                                                dot={{ fill: '#18181b', stroke: '#ffffff', strokeWidth: 2, r: 4 }}
                                                activeDot={{ r: 6, fill: '#ffffff', stroke: '#18181b', strokeWidth: 2 }}
                                                animationDuration={1500}
                                            />
                                        </LineChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                        )}
                    </Widget>

                    {/* Widget 5: Active Clients */}
                    <Widget id="activeClients" title="Active Clients" subtitle="Client Base" size={widgetStates.activeClients} onSizeChange={handleWidgetSizeChange}>
                        {widgetStates.activeClients === 'small' ? (
                            <div className="flex flex-col justify-center h-full items-center">
                                <div className="text-white text-5xl font-bold tracking-tighter drop-shadow-[0_0_15px_rgba(255,255,255,0.4)] mb-3">
                                    {totalClients}
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
                                        <div className="text-4xl font-bold text-white tracking-tighter drop-shadow-md">{totalClients}</div>
                                    </div>
                                    <div className="text-right -mt-9">
                                        <div className="text-emerald-400 font-bold text-sm drop-shadow-[0_0_8px_rgba(52,211,153,0.3)]">+{totalClients - activeClients}</div>
                                    </div>
                                </div>

                                <div className={`${widgetStates.activeClients === 'large' ? 'h-48' : 'h-28 flex-1'} flex-shrink-0 flex items-start gap-4 ${widgetStates.activeClients === 'large' ? 'mt-2' : '-mt-10'}`}>
                                    <div className={`w-1/2 ${widgetStates.activeClients === 'large' ? 'h-full' : 'h-[140%] -mt-8'} relative`}>
                                        {/* Glowing Ring Effect behind chart */}
                                        <div className="absolute inset-0 rounded-full bg-white/5 blur-2xl transform scale-75"></div>
                                        <ResponsiveContainer width="100%" height="100%">
                                            <PieChart style={{ overflow: 'visible' }}>
                                                <defs>
                                                    <filter id="clientsNeonGlowPremium" x="-100%" y="-100%" width="300%" height="300%">
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
                                                    data={[
                                                        { name: 'Corporates', value: activeClients, fill: '#ffffff' },
                                                        { name: 'SMEs', value: Math.floor((totalClients - activeClients) * 0.7), fill: '#a1a1aa' },
                                                        { name: 'Individuals', value: Math.floor((totalClients - activeClients) * 0.3), fill: '#52525b' }
                                                    ]}
                                                    cx="70%"
                                                    cy="45%"
                                                    innerRadius="55%"
                                                    outerRadius="75%"
                                                    paddingAngle={0}
                                                    dataKey="value"
                                                    cornerRadius={0}
                                                    stroke="none"
                                                >
                                                    {[
                                                        { name: 'Corporates', value: activeClients, fill: '#ffffff' },
                                                        { name: 'SMEs', value: Math.floor((totalClients - activeClients) * 0.7), fill: '#a1a1aa' },
                                                        { name: 'Individuals', value: Math.floor((totalClients - activeClients) * 0.3), fill: '#52525b' }
                                                    ].map((entry, index) => (
                                                        <Cell
                                                            key={`cell-${index}`}
                                                            fill={entry.fill}
                                                            style={index === 0 ? { filter: 'url(#clientsNeonGlowPremium)' } : {}}
                                                        />
                                                    ))}
                                                </Pie>
                                                <Tooltip content={<MinimalTooltip />} />
                                            </PieChart>
                                        </ResponsiveContainer>
                                        {/* Inner Text - Active Count */}
                                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none" style={{ left: '70%', top: '45%', transform: 'translate(-50%, -50%)' }}>
                                            <div className="text-center">
                                                <div className="text-xl font-bold text-white leading-none drop-shadow-md">{activeClients}</div>
                                                <span className="text-[9px] text-zinc-500 font-bold uppercase tracking-wider">Active</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="w-1/2 flex flex-col justify-start gap-3 -mt-4 pl-16">
                                        {[
                                            { name: 'Corporates', value: activeClients, color: '#ffffff' },
                                            { name: 'SMEs', value: Math.floor((totalClients - activeClients) * 0.7), color: '#a1a1aa' },
                                            { name: 'Individuals', value: Math.floor((totalClients - activeClients) * 0.3), color: '#52525b' }
                                        ].map((item, idx) => (
                                            <div key={idx} className="flex items-center justify-between w-full group cursor-default">
                                                <div className="flex items-center gap-2.5">
                                                    <div className={`w-2 h-2 rounded-full transition-all duration-300 ${idx === 0 ? 'animate-pulse' : ''}`} style={{ backgroundColor: item.color, boxShadow: `0 0 8px ${item.color}40` }} />
                                                    <span className="text-zinc-400 text-[11px] font-medium group-hover:text-white transition-colors">{item.name}</span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-zinc-500 text-[10px] font-medium">{item.value}</span>
                                                    <span className="text-white font-bold text-xs tabular-nums">{Math.round((item.value / (totalClients || 1)) * 100)}%</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {widgetStates.activeClients === 'large' && (
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

                    {/* Widget 6: Active Projects */}
                    <Widget id="activeProjects" title="Active Projects" subtitle="In Progress" size={widgetStates.activeProjects} onSizeChange={handleWidgetSizeChange}>
                        {widgetStates.activeProjects === 'small' ? (
                            <div className="flex flex-col justify-center h-full relative">
                                <div className="text-white text-5xl font-bold tracking-tighter drop-shadow-md -mt-10">{activeProjects}</div>
                                <div className="text-zinc-500 text-xs mt-2">Total Projects</div>

                                {/* Mini Stats - Right Corner */}
                                <div className="absolute top-0 right-0 flex gap-2">
                                    <div className="text-center bg-white/5 rounded-lg px-2 py-1.5 border border-white/10">
                                        <div className="text-white text-base font-bold">{Math.floor(activeProjects * 0.8)}</div>
                                        <div className="text-zinc-500 text-[8px] uppercase tracking-wider">Active</div>
                                    </div>
                                    <div className="text-center bg-emerald-500/10 rounded-lg px-2 py-1.5 border border-emerald-500/20">
                                        <div className="text-emerald-400 text-base font-bold">{Math.floor(activeProjects * 0.2)}</div>
                                        <div className="text-emerald-600 text-[8px] uppercase tracking-wider">Done</div>
                                    </div>
                                </div>

                                {/* Progress Bar */}
                                <div className="absolute bottom-1 left-0 right-0">
                                    <div className="h-5 bg-zinc-800/50 rounded-full overflow-hidden backdrop-blur-sm">
                                        <div
                                            className="h-full bg-gradient-to-r from-white via-zinc-300 to-zinc-400 rounded-full transition-all duration-1000 shadow-[0_0_10px_rgba(255,255,255,0.3)]"
                                            style={{ width: '80%' }}
                                        ></div>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="flex flex-col h-full">
                                <div className="relative flex justify-center items-center mb-0 min-h-[50px]">
                                    <div className="flex flex-col items-center -translate-y-6">
                                        <div className="text-white text-6xl font-bold tracking-tighter drop-shadow-[0_0_15px_rgba(255,255,255,0.4)]">{activeProjects}</div>
                                        <div className="text-zinc-500 text-[10px] uppercase tracking-widest mt-0 font-bold">Total Projects</div>
                                    </div>
                                    <div className="absolute right-0 top-0 -mt-6 flex flex-col items-end gap-1.5">
                                        <div className="flex items-center gap-1.5 bg-zinc-800/80 rounded-md px-2 py-1 border border-white/10 shadow-lg backdrop-blur-sm">
                                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_6px_rgba(16,185,129,0.5)]"></div>
                                            <div className="text-white text-[10px] font-bold">{Math.floor(activeProjects * 0.8)} Active</div>
                                        </div>
                                        <div className="flex items-center gap-1.5 bg-rose-500/10 rounded-md px-2 py-1 border border-rose-500/20 backdrop-blur-sm">
                                            <div className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse"></div>
                                            <div className="text-rose-400 text-[10px] font-bold">{Math.floor(activeProjects * 0.1)} Due Soon</div>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex-1 -mx-2 mb-0.5">
                                    {widgetStates.activeProjects === 'large' ? (
                                        <ResponsiveContainer width="100%" height="100%">
                                            <BarChart data={[
                                                { name: 'Jan', value: 4 },
                                                { name: 'Feb', value: 6 },
                                                { name: 'Mar', value: 8 },
                                                { name: 'Apr', value: 5 },
                                                { name: 'May', value: activeProjects }
                                            ]} barSize={64}>
                                                <defs>
                                                    <linearGradient id="barGradientProjects" x1="0" y1="0" x2="0" y2="1">
                                                        <stop offset="0%" stopColor="#ffffff" stopOpacity={1} />
                                                        <stop offset="100%" stopColor="#52525b" stopOpacity={0.8} />
                                                    </linearGradient>
                                                </defs>
                                                <CartesianGrid vertical={false} stroke="#ffffff" strokeOpacity={0.05} strokeDasharray="3 3" />
                                                <XAxis dataKey="name" tick={{ fill: '#71717a', fontSize: 10, fontWeight: 500 }} axisLine={false} tickLine={false} dy={5} />
                                                <Tooltip cursor={{ fill: 'rgba(255,255,255,0.03)' }} content={<MinimalTooltip />} />
                                                <Bar dataKey="value" radius={[4, 4, 0, 0]} fill="url(#barGradientProjects)" animationDuration={1500}>
                                                    {[
                                                        { name: 'Jan', value: 4 },
                                                        { name: 'Feb', value: 6 },
                                                        { name: 'Mar', value: 8 },
                                                        { name: 'Apr', value: 5 },
                                                        { name: 'May', value: activeProjects }
                                                    ].map((entry, index) => (
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
                                                    <div className="text-xl font-bold text-white mb-0.5 leading-none">{Math.floor(activeProjects * 0.8)}</div>
                                                    <div className="text-zinc-500 text-[7px] uppercase tracking-wider font-bold mb-1.5">Active</div>
                                                </div>
                                                <div className="w-full h-1 bg-zinc-800 rounded-full overflow-hidden relative z-10">
                                                    <div className="h-full bg-white rounded-full shadow-[0_0_8px_rgba(255,255,255,0.3)]" style={{ width: '80%' }}></div>
                                                </div>
                                            </div>

                                            {/* Completed Card */}
                                            <div className="bg-zinc-900/40 rounded-lg p-2 border border-white/5 relative overflow-hidden flex flex-col justify-between shadow-sm">
                                                <div className="relative z-10">
                                                    <div className="text-xl font-bold text-emerald-400 mb-0.5 leading-none">{Math.floor(activeProjects * 0.1)}</div>
                                                    <div className="text-zinc-500 text-[7px] uppercase tracking-wider font-bold mb-1.5">Done</div>
                                                </div>
                                                <div className="w-full h-1 bg-zinc-800 rounded-full overflow-hidden relative z-10">
                                                    <div className="h-full bg-emerald-500 rounded-full shadow-[0_0_8px_rgba(16,185,129,0.3)]" style={{ width: '10%' }}></div>
                                                </div>
                                            </div>

                                            {/* On Hold Card */}
                                            <div className="bg-zinc-900/40 rounded-lg p-2 border border-white/5 relative overflow-hidden flex flex-col justify-between shadow-sm">
                                                <div className="relative z-10">
                                                    <div className="text-xl font-bold text-zinc-400 mb-0.5 leading-none">{Math.floor(activeProjects * 0.1)}</div>
                                                    <div className="text-zinc-500 text-[7px] uppercase tracking-wider font-bold mb-1.5">Hold</div>
                                                </div>
                                                <div className="w-full h-1 bg-zinc-800 rounded-full overflow-hidden relative z-10">
                                                    <div className="h-full bg-zinc-500 rounded-full" style={{ width: '10%' }}></div>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {widgetStates.activeProjects === 'large' && (
                                    <div className="mt-4 pt-4 border-t border-white/5 grid grid-cols-2 gap-4">
                                        {[
                                            { name: 'Website Redesign', deadline: '2 days', progress: 75 },
                                            { name: 'Mobile App', deadline: '1 week', progress: 40 }
                                        ].map((p, i) => (
                                            <div key={i} className="bg-zinc-800/50 rounded-lg p-3 flex justify-between items-center border border-white/5">
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

                    {/* Widget 7: Active Leads */}
                    <Widget id="activeLeads" title="Active Leads" subtitle="Sales Pipeline" size={widgetStates.activeLeads} onSizeChange={handleWidgetSizeChange}>
                        {widgetStates.activeLeads === 'small' ? (
                            <div className="flex flex-col justify-center h-full items-center">
                                <div className="relative">
                                    <div className="text-white text-6xl font-bold tracking-tighter drop-shadow-[0_0_20px_rgba(255,255,255,0.3)]">
                                        {activeLeads}
                                    </div>
                                    <div className="absolute -top-1 -right-4 w-2 h-2 bg-white rounded-full shadow-[0_0_10px_#ffffff] animate-pulse"></div>
                                </div>
                                <div className="text-zinc-500 text-[10px] tracking-[0.2em] font-medium mt-2 uppercase">Total Leads</div>
                                <div className="mt-4 flex gap-3 text-[10px] font-medium">
                                    <span className="text-zinc-300 drop-shadow-[0_0_5px_rgba(255,255,255,0.2)]">{Math.floor(activeLeads * 0.65)} Active</span>
                                    <span className="text-zinc-600">|</span>
                                    <span className="text-zinc-500">{Math.floor(activeLeads * (conversionRate / 100))} Won</span>
                                </div>
                            </div>
                        ) : widgetStates.activeLeads === 'medium' ? (
                            <div className="flex h-full items-center">
                                {/* Part 1: Main Stat (30%) */}
                                <div className="w-[28%] flex flex-col items-center justify-center border-r border-white/5 h-full pr-4">
                                    <div className="text-white text-5xl font-bold tracking-tighter drop-shadow-[0_0_15px_rgba(255,255,255,0.3)]">
                                        {activeLeads}
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
                                        <span className="text-white font-bold text-xs">{Math.floor(activeLeads * 0.65)}</span>
                                    </div>
                                    <div className="flex items-center justify-between group">
                                        <div className="flex items-center gap-2">
                                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400"></div>
                                            <span className="text-zinc-500 text-[9px] font-bold uppercase">Won</span>
                                        </div>
                                        <span className="text-white font-bold text-xs">{Math.floor(activeLeads * (conversionRate / 100))}</span>
                                    </div>
                                    <div className="mt-1 flex items-center justify-between bg-white/5 rounded-md px-2 py-1 border border-white/5">
                                        <span className="text-zinc-400 text-[8px] font-bold uppercase">Conversion</span>
                                        <span className="text-white font-bold text-[10px]">{conversionRate}%</span>
                                    </div>
                                </div>

                                {/* Part 3: Flow Visualization (36%) - Candlestick Pill Style */}
                                <div className="flex-1 h-full pl-3 py-1 flex flex-col justify-center translate-y-2">
                                    <div className="text-[8px] text-zinc-600 font-bold uppercase tracking-widest mb-1 text-right pr-2">Pipeline Flow</div>
                                    <div className="h-20 w-full relative flex items-end justify-center gap-[6px] px-4 group/bars">
                                        {/* Custom Candlestick Bars - Pinterest Style with Tooltip */}
                                        {[
                                            { stage: 'Inquiry', count: activeLeads, percentage: 100 },
                                            { stage: 'Qualified', count: Math.floor(activeLeads * 0.8), percentage: 80 },
                                            { stage: 'Proposal', count: Math.floor(activeLeads * 0.5), percentage: 50 },
                                            { stage: 'Negotiation', count: Math.floor(activeLeads * 0.3), percentage: 30 },
                                            { stage: 'Closed', count: Math.floor(activeLeads * (conversionRate / 100)), percentage: conversionRate }
                                        ].map((stage, index) => {
                                            const heightPercentage = stage.percentage;
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
                                        <div className="text-3xl font-bold text-white">{activeLeads}</div>
                                        <div className="text-zinc-500 text-xs">Total Leads</div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-white font-bold text-xl">{conversionRate}%</div>
                                        <div className="text-zinc-500 text-[9px]">CONVERSION</div>
                                    </div>
                                </div>

                                <div className="flex-1 flex gap-4 min-h-0 pl-2">
                                    {/* Funnel Chart - using BarChart horizontal */}
                                    <div className="flex-1">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <BarChart layout="vertical" data={[
                                                { stage: 'Inquiry', count: activeLeads, percentage: 100 },
                                                { stage: 'Qualified', count: Math.floor(activeLeads * 0.8), percentage: 80 },
                                                { stage: 'Proposal', count: Math.floor(activeLeads * 0.5), percentage: 50 },
                                                { stage: 'Negotiation', count: Math.floor(activeLeads * 0.3), percentage: 30 },
                                                { stage: 'Closed', count: Math.floor(activeLeads * (conversionRate / 100)), percentage: conversionRate }
                                            ]} margin={{ left: 10, right: 10, top: 0, bottom: 0 }} barSize={16}>
                                                <CartesianGrid horizontal={false} stroke="#27272a" strokeDasharray="3 3" />
                                                <XAxis type="number" hide />
                                                <YAxis dataKey="stage" type="category" width={80} tick={{ fill: '#d4d4d8', fontSize: 11, fontWeight: 500 }} axisLine={false} tickLine={false} interval={0} />
                                                <Tooltip cursor={{ fill: 'rgba(255,255,255,0.05)' }} content={<MinimalTooltip />} />
                                                <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                                                    {[
                                                        { stage: 'Inquiry', count: activeLeads, percentage: 100 },
                                                        { stage: 'Qualified', count: Math.floor(activeLeads * 0.8), percentage: 80 },
                                                        { stage: 'Proposal', count: Math.floor(activeLeads * 0.5), percentage: 50 },
                                                        { stage: 'Negotiation', count: Math.floor(activeLeads * 0.3), percentage: 30 },
                                                        { stage: 'Closed', count: Math.floor(activeLeads * (conversionRate / 100)), percentage: conversionRate }
                                                    ].map((entry, index) => (
                                                        <Cell key={`cell-${index}`} fill={['#333', '#444', '#666', '#a1a1aa', '#fff'][index % 5]} />
                                                    ))}
                                                </Bar>
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>
                            </div>
                        )}
                    </Widget>

                    {/* Widget 8: Team Size */}
                    <Widget id="teamSize" title="Team Size" subtitle="Total Employees" size={widgetStates.teamSize} onSizeChange={handleWidgetSizeChange}>
                        {widgetStates.teamSize === 'small' ? (
                            <div className="flex flex-col justify-center h-full items-center relative">
                                <div className="relative w-28 h-28 flex items-center justify-center">
                                    <svg viewBox="0 0 112 112" className="transform -rotate-90 w-full h-full" style={{ overflow: 'visible' }}>
                                        <defs>
                                            <filter id="teamNeonSmall" x="-50%" y="-50%" width="200%" height="200%">
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
                                            strokeDashoffset={`${2 * Math.PI * 48 * (1 - attendanceRate / 100)}`}
                                            className="transition-all duration-1000 ease-out"
                                            style={{ filter: 'url(#teamNeonSmall)' }}
                                        />
                                    </svg>
                                    <div className="absolute inset-0 flex items-center justify-center flex-col">
                                        <span className="text-3xl font-bold text-white tracking-tighter drop-shadow-md">{Math.floor(totalEmployees * (attendanceRate / 100))}</span>
                                        <span className="text-[9px] text-zinc-500 font-bold tracking-widest uppercase mt-1">PRESENT</span>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="flex flex-col h-full">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <div className="text-4xl font-bold text-white tracking-tighter drop-shadow-[0_0_10px_rgba(255,255,255,0.4)]">
                                            {Math.floor(totalEmployees * (attendanceRate / 100))}
                                            <span className="text-lg text-zinc-600 font-medium ml-1">/ {totalEmployees}</span>
                                        </div>
                                        <div className="text-xs text-zinc-400 mt-4 flex items-center gap-2">
                                            <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse shadow-[0_0_8px_rgba(255,255,255,1)]"></span>
                                            {attendanceRate}% On Time
                                        </div>
                                    </div>
                                </div>

                                <div className={`flex-1 flex gap-6 min-h-0 items-start ${widgetStates.teamSize === 'large' ? '' : '-mt-[4.5rem]'}`}>
                                    <div className={`flex-1 relative ${widgetStates.teamSize === 'large' ? 'h-40' : 'h-32'}`}>
                                        <ResponsiveContainer width="100%" height="100%">
                                            <PieChart style={{ overflow: 'visible' }}>
                                                <defs>
                                                    <filter id="teamNeonGlowPremium" x="-50%" y="-50%" width="200%" height="200%">
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
                                                        { name: 'Present', value: Math.floor(totalEmployees * (attendanceRate / 100)), fill: '#ffffff' },
                                                        { name: 'Absent', value: totalEmployees - Math.floor(totalEmployees * (attendanceRate / 100)), fill: '#27272a' }
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
                                                    <Cell fill="#ffffff" style={{ filter: 'url(#teamNeonGlowPremium)' }} />
                                                    <Cell fill="#27272a" />
                                                </Pie>
                                                <Tooltip content={<MinimalTooltip />} />
                                            </PieChart>
                                        </ResponsiveContainer>
                                        <div className="absolute inset-0 flex items-center justify-center flex-col pointer-events-none"
                                            style={{ transform: 'translate(15%, -5%)' }}>
                                            <span className="text-2xl font-bold text-white">{attendanceRate}%</span>
                                        </div>
                                    </div>

                                    <div className="flex flex-col justify-start gap-3 w-1/3 -mt-2">
                                        <div className="bg-white/5 rounded-lg p-2.5 border-l-2 border-white backdrop-blur-sm">
                                            <div className="text-white text-sm font-bold">{Math.floor(totalEmployees * (attendanceRate / 100))}</div>
                                            <div className="text-zinc-500 text-[9px] uppercase tracking-wider">Present</div>
                                        </div>
                                        <div className="bg-zinc-900/50 rounded-lg p-2.5 border-l-2 border-zinc-700">
                                            <div className="text-zinc-400 text-sm font-bold">{totalEmployees - Math.floor(totalEmployees * (attendanceRate / 100))}</div>
                                            <div className="text-zinc-600 text-[9px] uppercase tracking-wider">Absent</div>
                                        </div>
                                    </div>
                                </div>

                                {widgetStates.teamSize === 'large' && (
                                    <div className="h-32 mt-4 pt-4 border-t border-white/5 flex-shrink-0">
                                        <div className="text-xs text-zinc-400 mb-2 uppercase tracking-widest font-bold">Weekly Trend</div>
                                        <ResponsiveContainer width="100%" height="100%">
                                            <AreaChart data={[
                                                { day: 'Mon', percentage: 92 },
                                                { day: 'Tue', percentage: 94 },
                                                { day: 'Wed', percentage: 91 },
                                                { day: 'Thu', percentage: 95 },
                                                { day: 'Fri', percentage: 89 },
                                                { day: 'Sat', percentage: 80 }
                                            ]}>
                                                <defs>
                                                    <linearGradient id="teamGradient" x1="0" y1="0" x2="0" y2="1">
                                                        <stop offset="5%" stopColor="#ffffff" stopOpacity={0.15} />
                                                        <stop offset="95%" stopColor="#ffffff" stopOpacity={0} />
                                                    </linearGradient>
                                                </defs>
                                                <CartesianGrid vertical={false} stroke="#ffffff" strokeOpacity={0.05} strokeDasharray="3 3" />
                                                <XAxis dataKey="day" tick={{ fill: '#52525b', fontSize: 10, fontWeight: 600 }} axisLine={false} tickLine={false} dy={5} />
                                                <Tooltip content={<MinimalTooltip />} />
                                                <Area type="monotone" dataKey="percentage" stroke="#52525b" fill="url(#teamGradient)" strokeWidth={2} />
                                            </AreaChart>
                                        </ResponsiveContainer>
                                    </div>
                                )}
                            </div>
                        )}
                    </Widget>

                    {/* Widget 9: Pipeline Value */}
                    <Widget id="pipelineValue" title="Pipeline Value" subtitle="Potential Revenue" size={widgetStates.pipelineValue} onSizeChange={handleWidgetSizeChange}>
                        {widgetStates.pipelineValue === 'small' ? (
                            <div className="flex flex-col justify-between h-full relative px-1 py-1">
                                <div className="flex justify-between items-start">
                                    <div className="pt-1 pl-1">
                                        <div className="text-white text-5xl font-bold tracking-tighter drop-shadow-[0_0_15px_rgba(255,255,255,0.4)]">
                                            {formatRevenue(pipelineValue).split('₹')[1]}
                                        </div>
                                        <div className="text-zinc-500 text-xs mt-1 uppercase tracking-widest font-bold ml-1">Pipeline</div>
                                    </div>

                                    {/* Right Side Stats - Clean List Style */}
                                    <div className="flex flex-col gap-3 mt-2 mr-2">
                                        <div className="flex items-center justify-end gap-2 group cursor-default">
                                            <div className="text-right">
                                                <div className="text-white text-lg font-bold leading-none">{Math.floor(activeLeads * 0.2)}</div>
                                                <div className="text-zinc-500 text-[8px] uppercase tracking-wider mt-0.5 group-hover:text-zinc-300 transition-colors">High</div>
                                            </div>
                                            <div className="w-1 h-8 rounded-full bg-gradient-to-b from-white to-zinc-800 opacity-50"></div>
                                        </div>
                                        <div className="flex items-center justify-end gap-2 group cursor-default">
                                            <div className="text-right">
                                                <div className="text-amber-400 text-lg font-bold leading-none">{Math.floor(activeLeads * 0.8)}</div>
                                                <div className="text-amber-600 text-[8px] uppercase tracking-wider mt-0.5 group-hover:text-amber-500 transition-colors">Std</div>
                                            </div>
                                            <div className="w-1 h-8 rounded-full bg-gradient-to-b from-amber-400 to-amber-900 opacity-50"></div>
                                        </div>
                                    </div>
                                </div>

                                {/* Bottom Avatar Stack */}
                                <div className="flex items-end justify-between mb-2 px-1">
                                    <div className="flex -space-x-3">
                                        {[1, 2, 3, 4].map((i) => (
                                            <div key={i} className="w-9 h-9 rounded-full bg-zinc-900 border-2 border-zinc-800 flex items-center justify-center text-xs font-bold text-zinc-400 shadow-lg transition-transform hover:-translate-y-1 hover:scale-110 z-10 hover:z-20 cursor-pointer" style={{ zIndex: 10 - i }}>
                                                {['A', 'T', 'G', 'L'][i - 1]}
                                            </div>
                                        ))}
                                        {activeLeads > 4 && (
                                            <div className="w-9 h-9 rounded-full bg-zinc-900 border-2 border-zinc-800 flex items-center justify-center text-[10px] text-zinc-400 font-bold shadow-lg z-0 hover:text-white transition-colors cursor-pointer">
                                                +{activeLeads - 4}
                                            </div>
                                        )}
                                    </div>
                                    <div
                                        className="text-[9px] text-zinc-600 font-bold uppercase tracking-widest flex items-center gap-1 hover:text-white transition-colors cursor-pointer"
                                        onClick={(e) => { e.stopPropagation(); onSizeChange('pipelineValue', 'large'); }}
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
                                        <div className="text-white text-5xl font-bold tracking-tighter drop-shadow-[0_0_15px_rgba(255,255,255,0.3)]">
                                            {formatRevenue(pipelineValue)}
                                        </div>
                                        <div className="text-zinc-500 text-xs font-bold uppercase tracking-[0.2em] mt-2 mb-6">
                                            Total Value
                                        </div>
                                    </div>

                                    {/* Right Side: Full Height List */}
                                    <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
                                        <div className="space-y-2 pb-2">
                                            {[
                                                { name: 'Mega Corp', value: '$500k', type: 'High Value', avatar: 'M' },
                                                { name: 'Tech Start', value: '$120k', type: 'Standard', avatar: 'T' },
                                                { name: 'Global Inc', value: '$350k', type: 'High Value', avatar: 'G' },
                                                { name: 'Local Biz', value: '$50k', type: 'Standard', avatar: 'L' },
                                                { name: 'Startup X', value: '$80k', type: 'Standard', avatar: 'S' },
                                                { name: 'Alpha Co', value: '$25k', type: 'Standard', avatar: 'A' }
                                            ].slice(0, widgetStates.pipelineValue === 'large' ? 6 : 4).map((deal, idx) => (
                                                <div key={idx} className="bg-white/[0.03] backdrop-blur-sm rounded-xl p-2.5 flex items-center justify-between group hover:bg-white/[0.08] transition-all duration-300 border border-white/5 hover:border-white/20 relative overflow-hidden">
                                                    <div className="flex items-center gap-3 relative z-10">
                                                        <div className="h-8 w-8 rounded-full bg-gradient-to-br from-zinc-800 to-black border border-white/10 flex items-center justify-center text-base text-zinc-300 group-hover:scale-110 transition-transform">
                                                            {deal.avatar}
                                                        </div>
                                                        <div>
                                                            <div className="text-zinc-200 text-[11px] font-bold group-hover:text-white transition-colors leading-none">{deal.name}</div>
                                                            <div className="text-zinc-500 text-[9px] font-medium tracking-wide mt-1">{deal.type}</div>
                                                        </div>
                                                    </div>
                                                    <span className="text-white font-bold text-xs">{deal.value}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                {widgetStates.pipelineValue === 'large' && (
                                    <div className="mt-4 pt-4 border-t border-white/5 flex gap-3 flex-shrink-0">
                                        <div className="flex-1 bg-zinc-900/40 rounded-xl p-2 text-center border border-white/5 backdrop-blur-md">
                                            <div className="text-white font-bold text-lg drop-shadow-md">{Math.floor(activeLeads * 0.2)}</div>
                                            <div className="text-[9px] text-zinc-500 font-bold uppercase tracking-wider">High Value</div>
                                        </div>
                                        <div className="flex-1 bg-zinc-900/40 rounded-xl p-2 text-center border border-white/5 backdrop-blur-md">
                                            <div className="text-zinc-300 font-bold text-lg">{Math.floor(activeLeads * 0.8)}</div>
                                            <div className="text-[9px] text-zinc-500 font-bold uppercase tracking-wider">Standard</div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </Widget>

                    {/* Widget 10: Revenue Breakdown */}
                    <Widget id="revenueBreakdown" title="Revenue Breakdown" subtitle="Financial Summary" size={widgetStates.revenueBreakdown} onSizeChange={handleWidgetSizeChange}>
                        {widgetStates.revenueBreakdown === 'small' ? (
                            <div className="flex flex-col justify-center h-full">
                                <div className="text-white text-5xl font-bold tracking-tighter drop-shadow-md">
                                    {formatRevenue(totalRevenue).split('₹')[1]}
                                </div>
                                <div className="text-zinc-500 text-xs mt-2">Monthly Revenue</div>
                                <div className="text-emerald-400 text-sm mt-1">
                                    {Math.round((totalRevenue / (totalRevenue * 1.1)) * 100)}% of target
                                </div>
                            </div>
                        ) : widgetStates.revenueBreakdown === 'medium' ? (
                            <div className="flex items-center justify-between h-full px-2 relative truncate">
                                <div className="flex flex-col justify-center translate-y-1 relative z-10 pl-2">
                                    <div className="text-white text-4xl font-bold tracking-tighter drop-shadow-[0_0_10px_rgba(255,255,255,0.5)]">
                                        {formatRevenue(totalRevenue)}
                                    </div>
                                    <div className="text-zinc-500 text-[10px] uppercase tracking-widest mt-0.5 font-bold">Total Revenue</div>
                                    <div className="flex items-center gap-2 mt-6">
                                        <div className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-1.5 py-0.5 rounded text-[10px] font-bold">
                                            +{revenueGrowth}%
                                        </div>
                                        <div className="text-zinc-500 text-[10px]">
                                            {Math.round((totalRevenue / (totalRevenue * 1.1)) * 100)}% of Target
                                        </div>
                                    </div>
                                </div>
                                <div className="absolute right-0 top-0 bottom-0 w-3/5">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <AreaChart data={revenueTrendData}>
                                            <defs>
                                                <linearGradient id="breakdownGradientSmall" x1="0" y1="0" x2="0" y2="1">
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
                                                dataKey="value"
                                                stroke="#ffffff"
                                                strokeWidth={2}
                                                strokeOpacity={0.8}
                                                fill="url(#breakdownGradientSmall)"
                                                isAnimationActive={true}
                                                animationDuration={1500}
                                            />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                        ) : (
                            <div className="flex h-full gap-6">
                                {/* Left Side: Trend Chart (60%) */}
                                <div className="flex-1 relative rounded-2xl bg-black/20 border border-white/5 overflow-hidden group">
                                    <div className="absolute top-4 left-4 z-10">
                                        <div className="text-zinc-500 text-[10px] uppercase tracking-widest font-bold">Revenue Trend</div>
                                        <div className="text-white text-2xl font-bold mt-0.5">{formatRevenue(totalRevenue)}</div>
                                    </div>
                                    <div className="absolute inset-0 pt-12">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <AreaChart data={revenueTrendData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                                                <defs>
                                                    <linearGradient id="breakdownGradientLarge" x1="0" y1="0" x2="0" y2="1">
                                                        <stop offset="5%" stopColor="#ffffff" stopOpacity={0.3} />
                                                        <stop offset="95%" stopColor="#ffffff" stopOpacity={0} />
                                                    </linearGradient>
                                                </defs>
                                                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                                                <XAxis dataKey="month" tick={{ fill: '#52525b', fontSize: 10 }} axisLine={false} tickLine={false} />
                                                <Tooltip content={<MinimalTooltip />} />
                                                <Area
                                                    type="monotone"
                                                    dataKey="value"
                                                    stroke="#ffffff"
                                                    strokeWidth={3}
                                                    fill="url(#breakdownGradientLarge)"
                                                    isAnimationActive={true}
                                                    animationDuration={1500}
                                                />
                                            </AreaChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>

                                {/* Right Side: Detailed Breakdown (40%) */}
                                <div className="w-[35%] flex flex-col gap-3 justify-center">
                                    {/* Current Funds */}
                                    <div className="bg-zinc-800/40 hover:bg-zinc-800/60 border border-white/10 p-3 rounded-xl backdrop-blur-sm relative overflow-hidden group transition-all duration-300">
                                        <div className="flex justify-between items-center relative z-10">
                                            <div>
                                                <div className="text-zinc-500 text-[9px] uppercase tracking-widest font-bold mb-0.5">Current Funds</div>
                                                <div className="text-white text-lg font-bold tracking-tight">{formatRevenue(currentFunds)}</div>
                                            </div>
                                            <div className="p-2 rounded-lg bg-white/5 text-white">
                                                <DollarSign size={16} />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Monthly Revenue */}
                                    <div className="bg-zinc-800/40 hover:bg-zinc-800/60 border border-white/10 p-3 rounded-xl backdrop-blur-sm relative overflow-hidden group transition-all duration-300">
                                        <div className="flex justify-between items-center relative z-10">
                                            <div>
                                                <div className="text-zinc-500 text-[9px] uppercase tracking-widest font-bold mb-0.5">Monthly Revenue</div>
                                                <div className="text-white text-lg font-bold tracking-tight">{formatRevenue(totalRevenue)}</div>
                                            </div>
                                            <div className="p-2 rounded-lg bg-white/5 text-white">
                                                <TrendingUp size={16} />
                                            </div>
                                        </div>
                                    </div>

                                    {/* YTD Revenue */}
                                    <div className="bg-zinc-800/40 hover:bg-zinc-800/60 border border-white/10 p-3 rounded-xl backdrop-blur-sm relative overflow-hidden group transition-all duration-300">
                                        <div className="flex justify-between items-center relative z-10">
                                            <div>
                                                <div className="text-zinc-500 text-[9px] uppercase tracking-widest font-bold mb-0.5">YTD Revenue</div>
                                                <div className="text-white text-lg font-bold tracking-tight">{formatRevenue(ytdRevenue)}</div>
                                            </div>
                                            <div className="p-2 rounded-lg bg-white/5 text-white">
                                                <Building2 size={16} />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Monthly Profit */}
                                    <div className="bg-zinc-800/40 hover:bg-zinc-800/60 border border-white/10 p-3 rounded-xl backdrop-blur-sm relative overflow-hidden group transition-all duration-300">
                                        <div className="flex justify-between items-center relative z-10">
                                            <div>
                                                <div className="text-zinc-500 text-[9px] uppercase tracking-widest font-bold mb-0.5">Monthly Profit</div>
                                                <div className="text-white text-lg font-bold tracking-tight">{formatRevenue(monthlyProfit)}</div>
                                            </div>
                                            <div className="p-2 rounded-lg bg-white/5 text-white">
                                                <PieChartIcon size={16} />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </Widget>

                    {/* Widget 11: Business Metrics */}
                    <Widget id="businessMetrics" title="Business Metrics" subtitle="Key Performance" size={widgetStates.businessMetrics} onSizeChange={handleWidgetSizeChange}>
                        {widgetStates.businessMetrics === 'small' ? (
                            <div className="flex flex-col justify-center h-full items-center">
                                <div className="relative">
                                    <div className="text-white text-6xl font-bold tracking-tighter drop-shadow-[0_0_20px_rgba(255,255,255,0.3)]">
                                        {activeClients + activeProjects}
                                    </div>
                                    <div className="absolute -top-1 -right-4 w-2 h-2 bg-white rounded-full shadow-[0_0_10px_#ffffff] animate-pulse"></div>
                                </div>
                                <div className="text-zinc-500 text-[10px] tracking-[0.2em] font-medium mt-2 uppercase">Total Metrics</div>
                                <div className="mt-4 flex gap-3 text-[10px] font-medium">
                                    <span className="text-zinc-300 drop-shadow-[0_0_5px_rgba(255,255,255,0.2)]">{activeProjects} Prj</span>
                                    <span className="text-zinc-600">|</span>
                                    <span className="text-zinc-500">{activeClients} Cli</span>
                                </div>
                            </div>
                        ) : widgetStates.businessMetrics === 'medium' ? (
                            <div className="flex h-full items-center">
                                {/* Part 1: Main Stat (30%) */}
                                <div className="w-[28%] flex flex-col items-center justify-center border-r border-white/5 h-full pr-4">
                                    <div className="text-white text-5xl font-bold tracking-tighter drop-shadow-[0_0_15px_rgba(255,255,255,0.3)]">
                                        {activeClients + activeProjects}
                                    </div>
                                    <div className="text-zinc-500 text-[9px] font-bold uppercase tracking-[0.2em] mt-1">Total</div>
                                </div>

                                {/* Part 2: Key Stats (36%) */}
                                <div className="w-[36%] flex flex-col justify-center gap-1.5 border-r border-white/5 h-full px-4">
                                    <div className="flex items-center justify-between group">
                                        <div className="flex items-center gap-2">
                                            <div className="w-1.5 h-1.5 rounded-full bg-blue-400"></div>
                                            <span className="text-zinc-500 text-[9px] font-bold uppercase">Projects</span>
                                        </div>
                                        <span className="text-white font-bold text-xs">{activeProjects}</span>
                                    </div>
                                    <div className="flex items-center justify-between group">
                                        <div className="flex items-center gap-2">
                                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400"></div>
                                            <span className="text-zinc-500 text-[9px] font-bold uppercase">Clients</span>
                                        </div>
                                        <span className="text-white font-bold text-xs">{activeClients}</span>
                                    </div>
                                    <div className="mt-1 flex items-center justify-between bg-white/5 rounded-md px-2 py-1 border border-white/5">
                                        <span className="text-zinc-400 text-[8px] font-bold uppercase">Conv.</span>
                                        <span className="text-white font-bold text-[10px]">{Math.round((activeClients / (activeLeads || 1)) * 100)}%</span>
                                    </div>
                                </div>

                                {/* Part 3: Flow Visualization (36%) */}
                                <div className="flex-1 h-full pl-3 py-1 flex flex-col justify-center translate-y-2">
                                    <div className="text-[8px] text-zinc-600 font-bold uppercase tracking-widest mb-1 text-right pr-2">Pipeline</div>
                                    <div className="h-20 w-full relative flex items-end justify-center gap-[6px] px-4 group/bars">
                                        {[
                                            { stage: 'Leads', count: activeLeads },
                                            { stage: 'Prj', count: activeProjects },
                                            { stage: 'Cli', count: activeClients }
                                        ].map((stage, index) => {
                                            const total = activeLeads || 1;
                                            const heightPercentage = Math.max(10, Math.min(100, (stage.count / total) * 100));
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
                                                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 opacity-0 group-hover/bar:opacity-100 transition-opacity duration-200 pointer-events-none z-50 whitespace-nowrap">
                                                        <div className="bg-zinc-900/95 backdrop-blur-md px-3 py-2 rounded-lg border border-white/10 shadow-2xl">
                                                            <div className="text-zinc-400 text-[9px] font-medium tracking-wide">{stage.stage}</div>
                                                            <div className="text-white font-bold text-sm mt-0.5">{stage.count}</div>
                                                        </div>
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
                            <div className="flex h-full gap-6">
                                {/* Left Side: Funnel Chart (60%) */}
                                <div className="flex-1 flex flex-col items-center justify-center p-4 bg-zinc-900/30 rounded-2xl border border-white/5 relative overflow-hidden">
                                    <div className="absolute top-4 left-4 z-10 w-full pr-4 flex justify-between">
                                        <div>
                                            <div className="text-zinc-500 text-[10px] uppercase tracking-widest font-bold">Total Metrics</div>
                                            <div className="text-white text-2xl font-bold mt-0.5">{activeClients + activeProjects}</div>
                                        </div>
                                    </div>
                                    <div className="w-full h-full pt-10">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <BarChart layout="vertical" data={[
                                                { stage: 'Leads', count: activeLeads },
                                                { stage: 'Projects', count: activeProjects },
                                                { stage: 'Clients', count: activeClients }
                                            ]} margin={{ left: 0, right: 30, top: 0, bottom: 0 }} barSize={24}>
                                                <CartesianGrid horizontal={false} stroke="#27272a" strokeDasharray="3 3" />
                                                <XAxis type="number" hide />
                                                <YAxis dataKey="stage" type="category" width={80} tick={{ fill: '#a1a1aa', fontSize: 11, fontWeight: 600 }} axisLine={false} tickLine={false} interval={0} />
                                                <Tooltip content={<MinimalTooltip />} />
                                                <Bar dataKey="count" radius={[0, 6, 6, 0]}>
                                                    {[0, 1, 2].map((entry, index) => (
                                                        <Cell key={`cell-${index}`} fill={['#71717a', '#a1a1aa', '#ffffff'][index]} />
                                                    ))}
                                                    <LabelList dataKey="count" position="right" fill="#fff" fontSize={12} fontWeight="bold" />
                                                </Bar>
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>

                                {/* Right Side: Detailed Metrics (40%) */}
                                <div className="w-[35%] flex flex-col gap-3 justify-center">
                                    {/* Active Clients */}
                                    <div className="bg-zinc-800/40 hover:bg-zinc-800/60 border border-white/10 p-3 rounded-xl backdrop-blur-sm relative overflow-hidden group transition-all duration-300">
                                        <div className="flex justify-between items-center relative z-10">
                                            <div>
                                                <div className="text-zinc-500 text-[9px] uppercase tracking-widest font-bold mb-0.5">Active Clients</div>
                                                <div className="text-white text-lg font-bold tracking-tight">{activeClients} / {totalClients}</div>
                                            </div>
                                            <div className="p-2 rounded-lg bg-white/5 text-white">
                                                <Users size={16} />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Active Projects */}
                                    <div className="bg-zinc-800/40 hover:bg-zinc-800/60 border border-white/10 p-3 rounded-xl backdrop-blur-sm relative overflow-hidden group transition-all duration-300">
                                        <div className="flex justify-between items-center relative z-10">
                                            <div>
                                                <div className="text-zinc-500 text-[9px] uppercase tracking-widest font-bold mb-0.5">Active Projects</div>
                                                <div className="text-white text-lg font-bold tracking-tight">{activeProjects}</div>
                                            </div>
                                            <div className="p-2 rounded-lg bg-white/5 text-white">
                                                <Briefcase size={16} />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Active Leads */}
                                    <div className="bg-zinc-800/40 hover:bg-zinc-800/60 border border-white/10 p-3 rounded-xl backdrop-blur-sm relative overflow-hidden group transition-all duration-300">
                                        <div className="flex justify-between items-center relative z-10">
                                            <div>
                                                <div className="text-zinc-500 text-[9px] uppercase tracking-widest font-bold mb-0.5">Active Leads</div>
                                                <div className="text-white text-lg font-bold tracking-tight">{activeLeads}</div>
                                            </div>
                                            <div className="p-2 rounded-lg bg-white/5 text-white">
                                                <Target size={16} />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Conversion Rate */}
                                    <div className="bg-zinc-800/40 hover:bg-zinc-800/60 border border-white/10 p-3 rounded-xl backdrop-blur-sm relative overflow-hidden group transition-all duration-300">
                                        <div className="flex justify-between items-center relative z-10">
                                            <div>
                                                <div className="text-zinc-500 text-[9px] uppercase tracking-widest font-bold mb-0.5">Conversion Rate</div>
                                                <div className="text-white text-lg font-bold tracking-tight">{conversionRate}%</div>
                                            </div>
                                            <div className="p-2 rounded-lg bg-white/5 text-white">
                                                <TrendingUp size={16} />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </Widget>

                </motion.div>
            </LayoutGroup >
        </div >
    );
};

export default BankingFinancialWidgets;
