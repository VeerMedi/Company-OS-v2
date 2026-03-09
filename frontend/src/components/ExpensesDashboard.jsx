import React, { useState, useEffect } from 'react';
import { motion, LayoutGroup } from 'framer-motion';
import api from '../utils/api';
import {
    CreditCard, Plus, DollarSign, Tag, Search, FileText, Eye, TrendingUp,
    ShoppingBag, Receipt, AlertCircle, PieChart as PieChartIcon, ArrowUpRight, Activity
} from 'lucide-react';
import {
    PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend,
    BarChart, Bar, XAxis, YAxis, CartesianGrid, AreaChart, Area
} from 'recharts';

// --- Shared Components ---
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

        const isWideWidget = id === 'recentTransactions';

        if (deltaY > 50 && initialSize === 'small') {
            onSizeChange(id, 'medium');
            setInitialSize('medium');
            setDragStartY(currentY);
        } else if (deltaY > 50 && initialSize === 'medium') {
            if (isWideWidget) {
                onSizeChange(id, 'full');
                setInitialSize('full');
            } else {
                onSizeChange(id, 'large');
                setInitialSize('large');
            }
            setDragStartY(currentY);
        } else if (deltaY < -50 && initialSize === 'full') {
            onSizeChange(id, 'medium');
            setInitialSize('medium');
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

const ExpensesDashboard = () => {
    const [expenses, setExpenses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [widgetStates, setWidgetStates] = useState(() => {
        const defaults = {
            totalExpenses: 'medium',
            aiSubscriptions: 'small',
            pendingPayments: 'small',
            breakdown: 'large',
            recentTransactions: 'full'
        };
        const saved = localStorage.getItem('expensesDashboardWidgetSizes_v1');
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
        localStorage.setItem('expensesDashboardWidgetSizes_v1', JSON.stringify(widgetStates));
    }, [widgetStates]);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isEdit, setIsEdit] = useState(false);
    const [selectedExpenseId, setSelectedExpenseId] = useState(null);
    const [formData, setFormData] = useState({
        date: new Date().toISOString().split('T')[0],
        description: '',
        category: 'Office Supplies',
        amount: '',
        status: 'Paid',
        paymentMethod: 'Credit Card'
    });
    const [searchTerm, setSearchTerm] = useState('');

    const handleWidgetSizeChange = (id, newSize) => {
        setWidgetStates(prev => ({ ...prev, [id]: newSize }));
    };

    useEffect(() => {
        fetchExpenses();
    }, []);

    const fetchExpenses = async () => {
        try {
            setLoading(true);
            const response = await api.get('/expenses');
            // If API returns empty, use mock data
            if (response.data && response.data.length > 0) {
                setExpenses(response.data);
            } else {
                setExpenses(mockData);
            }
            setError(null);
        } catch (err) {
            console.error('Error fetching expenses:', err);
            setError('Failed to load expenses. Using demo data.');
            setExpenses(mockData);
        } finally {
            setLoading(false);
        }
    };

    const mockData = [
        { _id: '1', date: '2025-01-05', description: 'OpenAI API Subscription', category: 'AI Services', amount: 45000, status: 'Paid', paymentMethod: 'Corporate Card' },
        { _id: '2', date: '2025-01-04', description: 'AWS Cloud Infrastructure', category: 'Infrastructure', amount: 125000, status: 'Paid', paymentMethod: 'Bank Transfer' },
        { _id: '3', date: '2025-01-03', description: 'Midjourney Pro Plan', category: 'AI Services', amount: 2400, status: 'Paid', paymentMethod: 'Credit Card' },
        { _id: '4', date: '2025-01-02', description: 'Slack Enterprise Grid', category: 'Software Licenses', amount: 85000, status: 'Pending', paymentMethod: 'Invoice' },
        { _id: '5', date: '2025-01-01', description: 'Google Workspace', category: 'Software Licenses', amount: 12000, status: 'Paid', paymentMethod: 'Corporate Card' },
        { _id: '6', date: '2024-12-28', description: 'Meta Ads Campaign', category: 'Marketing', amount: 250000, status: 'Paid', paymentMethod: 'Bank Transfer' },
        { _id: '7', date: '2024-12-25', description: 'Office Rent & Utilities', category: 'Other', amount: 150000, status: 'Paid', paymentMethod: 'Direct Debit' },
        { _id: '8', date: '2024-12-20', description: 'Anthropic Claude API', category: 'AI Services', amount: 15000, status: 'Pending', paymentMethod: 'Invoice' },
        { _id: '9', date: '2024-12-15', description: 'LinkedIn Talent Solutions', category: 'Marketing', amount: 45000, status: 'Paid', paymentMethod: 'Bank Transfer' },
        { _id: '10', date: '2024-12-10', description: 'Adobe Creative Cloud', category: 'Software Licenses', amount: 8500, status: 'Paid', paymentMethod: 'Corporate Card' }
    ];

    // Generate Sparkline Data
    const generateSparkline = (trend = 'neutral', points = 15) => {
        const data = [];
        let current = 50;
        for (let i = 0; i < points; i++) {
            let change = (Math.random() - 0.5) * 10;
            if (trend === 'up') change += 2;
            if (trend === 'down') change -= 2;
            current = Math.max(10, current + change);
            data.push({ value: current });
        }
        return data;
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleAddClick = () => {
        setIsEdit(false);
        setFormData({
            date: new Date().toISOString().split('T')[0],
            description: '',
            category: 'Office Supplies',
            amount: '',
            status: 'Paid',
            paymentMethod: 'Credit Card'
        });
        setIsModalOpen(true);
    };

    const handleEditClick = (expense) => {
        setIsEdit(true);
        setSelectedExpenseId(expense._id);
        setFormData({
            date: expense.date,
            description: expense.description,
            category: expense.category,
            amount: expense.amount,
            status: expense.status,
            paymentMethod: expense.paymentMethod
        });
        setIsModalOpen(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            if (isEdit) {
                // Update existing expense
                const response = await api.put(`/expenses/${selectedExpenseId}`, {
                    ...formData,
                    amount: Number(formData.amount)
                });
                setExpenses(prev => prev.map(exp =>
                    exp._id === selectedExpenseId ? response.data : exp
                ));
            } else {
                // Create new expense
                const response = await api.post('/expenses', {
                    ...formData,
                    amount: Number(formData.amount)
                });
                setExpenses([response.data, ...expenses]);
            }

            setIsModalOpen(false);
            setFormData({
                date: new Date().toISOString().split('T')[0],
                description: '',
                category: 'Office Supplies',
                amount: '',
                status: 'Paid',
                paymentMethod: 'Credit Card'
            });
            setIsEdit(false);
            setSelectedExpenseId(null);

            // Refresh data from server
            await fetchExpenses();
        } catch (error) {
            console.error('Error saving expense:', error);
            alert('Failed to save expense. Please try again.');
        }
    };

    const totalExpenses = expenses.reduce((sum, item) => sum + item.amount, 0);
    const aiExpenses = expenses.filter(e => e.category === 'AI Services').reduce((sum, i) => sum + i.amount, 0);
    const pendingCount = expenses.filter(e => e.status === 'Pending').length;
    const pendingAmount = expenses.filter(e => e.status === 'Pending').reduce((sum, i) => sum + i.amount, 0);

    const filteredExpenses = expenses.filter(exp =>
        exp.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        exp.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
        exp.paymentMethod.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const categoryData = filteredExpenses.reduce((acc, curr) => {
        const existing = acc.find(item => item.name === curr.category);
        if (existing) {
            existing.value += curr.amount;
        } else {
            acc.push({ name: curr.category, value: curr.amount });
        }
        return acc;
    }, []);

    const COLORS = ['#ffffff', '#a1a1aa', '#71717a', '#52525b', '#3f3f46', '#27272a'];

    const sparkData = [
        { name: 'Jan 01', value: 4000 }, { name: 'Jan 02', value: 3000 }, { name: 'Jan 03', value: 5000 },
        { name: 'Jan 04', value: 2780 }, { name: 'Jan 05', value: 4890 }, { name: 'Jan 06', value: 2390 },
        { name: 'Jan 07', value: 3490 }, { name: 'Jan 08', value: 2000 }, { name: 'Jan 09', value: 2780 },
        { name: 'Jan 10', value: 1890 }, { name: 'Jan 11', value: 2390 }, { name: 'Jan 12', value: 3490 },
        { name: 'Jan 13', value: 4000 }, { name: 'Jan 14', value: 3000 }
    ];

    if (loading) return <div className="p-10 text-white">Loading Dashboard...</div>;

    return (
        <div className="w-full font-sans">
            {/* Header */}
            <div className="flex items-center justify-between mb-8 ml-1">
                <div className="flex items-center gap-2">
                    <ShoppingBag className="text-white" />
                    <div>
                        <h1 className="text-2xl font-bold text-white">Expenses & Purchases</h1>
                        <p className="text-zinc-500 text-sm">Track overheads, AI costs and pending vendor payments</p>
                    </div>
                </div>
                <button
                    onClick={handleAddClick}
                    className="px-4 py-2 bg-white text-black text-sm font-bold rounded-xl hover:bg-zinc-200 transition-all flex items-center gap-2 shadow-[0_0_20px_rgba(255,255,255,0.2)]"
                >
                    <Plus size={18} />
                    New Expense
                </button>
            </div>

            <LayoutGroup>
                <motion.div layout className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 auto-rows-[220px]">

                    {/* Widget 1: Total Expenses */}
                    <Widget id="totalExpenses" title="Total Expenses" subtitle="Monthly Outflow" size={widgetStates.totalExpenses} onSizeChange={handleWidgetSizeChange}>
                        {widgetStates.totalExpenses === 'small' ? (
                            <div className="flex flex-col items-center justify-center h-full relative">
                                <div className="z-10 text-center -mt-10">
                                    <div className="text-zinc-500 text-[9px] uppercase font-bold tracking-[0.2em] mb-1">Monthly Outflow</div>
                                    <div className="text-white text-3xl font-bold tracking-tight drop-shadow-[0_0_15px_rgba(255,255,255,0.2)]">
                                        {formatCurrency(totalExpenses)}
                                    </div>
                                </div>
                                <div className="absolute inset-0 top-1/2 opacity-10 pointer-events-none">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <AreaChart data={sparkData}>
                                            <Area type="monotone" dataKey="value" stroke="#fff" strokeWidth={1} fill="#fff" fillOpacity={0.2} />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                        ) : widgetStates.totalExpenses === 'medium' ? (
                            <div className="flex h-full items-center justify-between px-2 gap-8">
                                <div className="flex flex-col flex-shrink-0">
                                    <div className="text-4xl font-bold text-white tracking-tight leading-none mb-2">
                                        {formatCurrency(totalExpenses)}
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="flex items-center gap-1 text-emerald-400 text-[10px] font-bold">
                                            <TrendingUp size={12} /> +14.2%
                                        </div>
                                        <div className="text-zinc-500 text-[9px] uppercase font-bold tracking-wider">vs Last Month</div>
                                    </div>
                                    <div className="mt-4 grid grid-cols-2 gap-4">
                                        <div>
                                            <div className="text-zinc-500 text-[8px] uppercase font-bold mb-0.5 tracking-tighter">Budget</div>
                                            <div className="text-white text-xs font-bold">₹15.00L</div>
                                        </div>
                                        <div>
                                            <div className="text-zinc-500 text-[8px] uppercase font-bold mb-0.5 tracking-tighter">Variance</div>
                                            <div className="text-zinc-400 text-xs font-bold">₹2.50L</div>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex-1 h-2/3 pt-4 pr-1">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={sparkData} barCategoryGap="25%">
                                            <Bar dataKey="value" fill="#fff" radius={[2, 2, 0, 0]} opacity={0.6} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                        ) : (
                            <div className="flex flex-col h-full">
                                <div className="flex justify-between items-start mb-6">
                                    <div>
                                        <div className="text-4xl font-bold text-white tracking-tighter">{formatCurrency(totalExpenses)}</div>
                                        <div className="text-zinc-500 text-xs font-medium mt-1">Total company outflow for current cycle</div>
                                    </div>
                                    <div className="px-3 py-1 bg-white/5 border border-white/10 rounded-full text-zinc-400 text-[10px] font-bold uppercase tracking-widest">
                                        Target: ₹15L
                                    </div>
                                </div>
                                <div className="flex-1 min-h-0 bg-white/5 rounded-2xl border border-white/5 p-4 relative overflow-hidden">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <AreaChart data={sparkData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                            <defs>
                                                <linearGradient id="expGradient" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="0%" stopColor="#fff" stopOpacity={0.4} />
                                                    <stop offset="100%" stopColor="#fff" stopOpacity={0} />
                                                </linearGradient>
                                            </defs>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ffffff05" />
                                            <XAxis
                                                dataKey="name"
                                                axisLine={false}
                                                tickLine={false}
                                                tick={{ fill: '#71717a', fontSize: 9, fontWeight: 600 }}
                                                interval={2}
                                            />
                                            <Tooltip content={<MinimalTooltip />} cursor={{ stroke: '#ffffff20' }} />
                                            <Area
                                                type="monotone"
                                                dataKey="value"
                                                stroke="#fff"
                                                strokeWidth={3}
                                                fill="url(#expGradient)"
                                                filter="drop-shadow(0 0 8px rgba(255,255,255,0.4))"
                                            />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                        )}
                    </Widget>

                    {/* Widget 2: AI Subscriptions */}
                    <Widget id="aiSubscriptions" title="AI Subscriptions" subtitle="Active Services" size={widgetStates.aiSubscriptions} onSizeChange={handleWidgetSizeChange}>
                        {widgetStates.aiSubscriptions === 'small' ? (
                            <div className="flex flex-col h-full justify-center">
                                <div className="text-3xl font-bold text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.3)]">{formatCurrency(aiExpenses)}</div>
                                <div className="flex items-center gap-2 mt-2">
                                    <div className="w-1.5 h-1.5 rounded-full bg-white shadow-[0_0_5px_white]"></div>
                                    <div className="text-zinc-500 text-[10px] uppercase font-bold tracking-widest">5 Active API Keys</div>
                                </div>
                            </div>
                        ) : widgetStates.aiSubscriptions === 'medium' ? (
                            <div className="flex h-full items-center gap-4 px-2">
                                <div className="flex-1">
                                    <div className="text-3xl font-bold text-white mb-4">{formatCurrency(aiExpenses)}</div>
                                    <div className="space-y-2">
                                        <div className="flex justify-between items-center text-[10px]">
                                            <span className="text-zinc-500 uppercase font-bold">OpenAI</span>
                                            <span className="text-white font-bold">₹2.5K</span>
                                        </div>
                                        <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                                            <div className="h-full bg-white" style={{ width: '40%' }}></div>
                                        </div>
                                        <div className="flex justify-between items-center text-[10px]">
                                            <span className="text-zinc-500 uppercase font-bold">Midjourney</span>
                                            <span className="text-zinc-300 font-bold">₹2.4K</span>
                                        </div>
                                        <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                                            <div className="h-full bg-zinc-400" style={{ width: '38%' }}></div>
                                        </div>
                                    </div>
                                </div>
                                <div className="w-1/3 h-full pt-4 pr-1">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={sparkData}>
                                            <Bar dataKey="value" fill="#fff" radius={[3, 3, 0, 0]} barSize={12} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                        ) : (
                            <div className="flex flex-col h-full">
                                <div className="flex justify-between items-end mb-6">
                                    <div className="text-3xl font-bold text-white">{formatCurrency(aiExpenses)}</div>
                                    <div className="text-zinc-500 text-[10px] uppercase font-bold tracking-[0.2em] mb-1">Cost Intensity</div>
                                </div>
                                <div className="flex-1 bg-white/5 rounded-2xl border border-white/5 p-4">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={[
                                            { name: 'OAI', val: 2500 },
                                            { name: 'MJ', val: 2400 },
                                            { name: 'AWS', val: 8500 },
                                            { name: 'Slack', val: 4500 }
                                        ]}>
                                            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#52525b', fontSize: 10 }} />
                                            <Tooltip content={<MinimalTooltip />} cursor={{ fill: 'transparent' }} />
                                            <Bar dataKey="val" fill="#fff" radius={[6, 6, 0, 0]} barSize={32}>
                                                <Cell fill="#ffffff" />
                                                <Cell fill="#a1a1aa" />
                                                <Cell fill="#71717a" />
                                                <Cell fill="#52525b" />
                                            </Bar>
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                        )}
                    </Widget>

                    {/* Widget 3: Pending Payments */}
                    <Widget id="pendingPayments" title="Pending" subtitle="Outstanding Invoices" size={widgetStates.pendingPayments} onSizeChange={handleWidgetSizeChange}>
                        {widgetStates.pendingPayments === 'small' ? (
                            <div className="flex flex-col h-full items-center justify-center text-center">
                                <div className="text-4xl font-bold text-white">{pendingCount}</div>
                                <div className="text-zinc-500 text-[10px] uppercase font-bold tracking-widest mt-1">Total Pending</div>
                                <div className="mt-2 flex items-center gap-1.5 px-3 py-1 bg-white/5 rounded-full border border-white/10">
                                    <Activity size={10} className="text-white" />
                                    <span className="text-white text-[10px] font-bold">{formatCurrency(pendingAmount)}</span>
                                </div>
                            </div>
                        ) : widgetStates.pendingPayments === 'medium' ? (
                            <div className="flex h-full items-center gap-4 px-2">
                                <div className="flex-1 flex flex-col justify-center">
                                    <div className="text-zinc-500 text-[9px] uppercase font-bold mb-1">Amount Due</div>
                                    <div className="text-2xl font-bold text-white mb-3 tracking-tighter">{formatCurrency(pendingAmount)}</div>
                                    <div className="p-3 bg-white/5 rounded-xl border border-white/10 group-hover:bg-white/10 transition-colors">
                                        <div className="flex items-center justify-between mb-1.5">
                                            <span className="text-zinc-500 text-[8px] uppercase font-bold tracking-widest">Next Due</span>
                                            <span className="text-[10px] font-bold text-white">2 Days</span>
                                        </div>
                                        <div className="text-[10px] text-zinc-300 font-medium truncate">AWS Cloud Invoice #822</div>
                                    </div>
                                </div>
                                <div className="w-px bg-white/10 h-2/3 self-center"></div>
                                <div className="flex flex-col justify-center items-center px-4">
                                    <div className="text-2xl font-bold text-white">{pendingCount}</div>
                                    <div className="text-zinc-500 text-[8px] uppercase font-bold mt-1">Items</div>
                                </div>
                            </div>
                        ) : (
                            <div className="flex flex-col h-full group">
                                <div className="flex justify-between items-start mb-6">
                                    <div className="text-3xl font-bold text-white flex items-center gap-3">
                                        {formatCurrency(pendingAmount)}
                                        <div className="px-2 py-0.5 bg-white/10 rounded text-[10px] font-bold border border-white/10">{pendingCount}</div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-zinc-500 text-[10px] uppercase font-bold tracking-tighter">Avg Maturity</div>
                                        <div className="text-white font-bold text-sm">8.2 Days</div>
                                    </div>
                                </div>
                                <div className="flex-1 space-y-2 overflow-y-auto pr-2 custom-scrollbar">
                                    {expenses.filter(e => e.status === 'Pending').map(e => (
                                        <div key={e._id} className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/5 hover:bg-white/10 transition-colors">
                                            <div className="flex flex-col gap-0.5">
                                                <span className="text-white text-xs font-bold">{e.description}</span>
                                                <span className="text-zinc-500 text-[9px] uppercase font-bold tracking-wider">{e.paymentMethod} • Due {new Date(e.date).toLocaleDateString()}</span>
                                            </div>
                                            <div className="text-white font-bold text-sm">{formatCurrency(e.amount)}</div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </Widget>

                    {/* Widget 4: Breakdown */}
                    <Widget id="breakdown" title="Breakdown" subtitle="Category Intensity" size={widgetStates.breakdown} onSizeChange={handleWidgetSizeChange}>
                        {widgetStates.breakdown === 'small' ? (
                            <div className="w-full h-full relative flex items-center justify-center overflow-visible">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={categoryData}
                                            innerRadius={30} outerRadius={45} paddingAngle={5}
                                            dataKey="value" stroke="none"
                                        >
                                            {categoryData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Pie>
                                    </PieChart>
                                </ResponsiveContainer>
                                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                                    <div className="text-[10px] font-bold text-white">Top</div>
                                    <div className="text-[8px] text-zinc-500 uppercase font-black tracking-tighter">Services</div>
                                </div>
                            </div>
                        ) : widgetStates.breakdown === 'medium' ? (
                            <div className="flex h-full items-center gap-4">
                                <div className="w-1/2 h-full relative overflow-visible">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie
                                                data={categoryData}
                                                innerRadius={40} outerRadius={55} paddingAngle={5}
                                                dataKey="value" stroke="none"
                                            >
                                                {categoryData.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                ))}
                                            </Pie>
                                        </PieChart>
                                    </ResponsiveContainer>
                                </div>
                                <div className="flex-1 flex flex-col gap-2 justify-center pr-2">
                                    {categoryData.slice(0, 4).map((cat, i) => (
                                        <div key={cat.name} className="flex items-center justify-between text-[10px]">
                                            <div className="flex items-center gap-2">
                                                <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }}></div>
                                                <span className="text-zinc-400 font-medium truncate max-w-[80px]">{cat.name}</span>
                                            </div>
                                            <span className="text-white font-bold">{((cat.value / totalExpenses) * 100).toFixed(0)}%</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <div className="flex flex-col h-full bg-zinc-900/0">
                                <div className="flex-1 flex gap-6 min-h-0">
                                    <div className="flex-1 relative overflow-visible flex items-center justify-center">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <PieChart>
                                                <Pie
                                                    data={categoryData}
                                                    innerRadius={70} outerRadius={110} paddingAngle={8}
                                                    dataKey="value" stroke="none"
                                                >
                                                    {categoryData.map((entry, index) => (
                                                        <Cell
                                                            key={`cell-${index}`}
                                                            fill={COLORS[index % COLORS.length]}
                                                            className={index === 0 ? "drop-shadow-[0_0_10px_rgba(255,255,255,0.6)]" : ""}
                                                        />
                                                    ))}
                                                </Pie>
                                                <Tooltip content={<MinimalTooltip />} />
                                            </PieChart>
                                        </ResponsiveContainer>
                                        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                                            <div className="text-3xl font-bold text-white drop-shadow-[0_0_5px_white]">100%</div>
                                            <div className="text-[9px] text-zinc-500 uppercase font-black tracking-[0.2em] mt-1">TOTAL MIX</div>
                                        </div>
                                    </div>
                                    <div className="w-[160px] flex flex-col justify-center gap-4 pr-4">
                                        {categoryData.map((cat, i) => (
                                            <div key={cat.name} className="flex items-center justify-between text-xs">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                                                    <span className="text-zinc-400 font-medium">{cat.name}</span>
                                                </div>
                                                <span className="text-white font-bold font-mono tracking-tighter">{((cat.value / totalExpenses) * 100).toFixed(0)}%</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                <div className="mt-8 pt-6 border-t border-white/5 grid grid-cols-2 gap-4">
                                    <div className="bg-white/5 rounded-2xl p-4 border border-white/5">
                                        <div className="text-zinc-500 text-[10px] uppercase font-bold mb-1 tracking-widest">Efficiency</div>
                                        <div className="text-white text-xl font-bold">88.4%</div>
                                    </div>
                                    <div className="bg-white/5 rounded-2xl p-4 border border-white/5">
                                        <div className="text-zinc-500 text-[10px] uppercase font-bold mb-1 tracking-widest">Optimized</div>
                                        <div className="text-white text-xl font-bold">₹1.2L Saved</div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </Widget>

                    {/* Widget 5: Recent Transactions (Full Width) */}
                    <Widget id="recentTransactions" title="Recent Transactions" subtitle="Expensed History" size={widgetStates.recentTransactions} onSizeChange={handleWidgetSizeChange} allowOverflow={true}>
                        <div className="flex flex-col h-full">
                            <div className="flex justify-between items-center mb-4 gap-4">
                                <div className="relative flex-1 max-w-xs group">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 w-4 h-4 group-focus-within:text-white transition-colors" />
                                    <input
                                        type="text"
                                        placeholder="Search ledger..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="w-full bg-white/5 border border-white/5 rounded-xl py-2 pl-10 pr-4 text-xs text-white placeholder:text-zinc-600 focus:border-white/20 focus:bg-white/10 outline-none transition-all"
                                    />
                                </div>
                                <button className="px-3 py-1.5 bg-zinc-800 text-white text-[10px] font-bold uppercase tracking-wider rounded-lg hover:bg-zinc-700 transition-colors border border-white/5">
                                    Export Ledger
                                </button>
                            </div>
                            <div className="overflow-x-auto flex-1 min-h-0 custom-scrollbar">
                                <table className="w-full text-left border-collapse">
                                    <thead className="sticky top-0 bg-[#09090b] z-10">
                                        <tr className="border-b border-white/5">
                                            <th className="py-3 px-2 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Date</th>
                                            <th className="py-3 px-2 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Description</th>
                                            <th className="py-3 px-2 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Category</th>
                                            <th className="py-3 px-2 text-[10px] font-bold text-zinc-500 uppercase tracking-widest text-right">Amount</th>
                                            <th className="py-3 px-2 text-[10px] font-bold text-zinc-500 uppercase tracking-widest text-center">Status</th>
                                            <th className="py-3 px-2 text-[10px] font-bold text-zinc-500 uppercase tracking-widest text-right">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredExpenses.map((expense) => (
                                            <tr key={expense._id} className="border-b border-zinc-800/30 group hover:bg-white/5 transition-colors">
                                                <td className="py-3 px-2">
                                                    <div className="text-zinc-400 text-[10px] font-medium">{new Date(expense.date).toLocaleDateString()}</div>
                                                </td>
                                                <td className="py-3 px-2">
                                                    <div className="text-white font-bold text-xs tracking-wide">{expense.description}</div>
                                                    <div className="text-zinc-500 text-[8px] uppercase mt-0.5">{expense.paymentMethod}</div>
                                                </td>
                                                <td className="py-3 px-2">
                                                    <span className="px-2 py-0.5 bg-white/5 border border-white/5 rounded text-[10px] text-zinc-400 font-bold uppercase">{expense.category}</span>
                                                </td>
                                                <td className="py-3 px-2 text-right">
                                                    <div className="text-white font-bold text-xs">{formatCurrency(expense.amount)}</div>
                                                </td>
                                                <td className="py-3 px-2 text-center">
                                                    <span className={`px-2 py-0.5 rounded-full text-[9px] uppercase font-extrabold tracking-tighter border ${expense.status === 'Paid' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-orange-500/10 text-orange-500 border-orange-500/20'}`}>
                                                        {expense.status}
                                                    </span>
                                                </td>
                                                <td className="py-3 px-2 text-right">
                                                    <button
                                                        onClick={() => handleEditClick(expense)}
                                                        className="p-1 px-2 bg-white/5 text-zinc-500 hover:text-white hover:bg-white/10 rounded-md transition-all text-[10px] font-bold uppercase"
                                                    >
                                                        Edit
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </Widget>

                </motion.div>
            </LayoutGroup>

            {/* Add Expense Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 overflow-y-auto">
                    <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                        <div className="fixed inset-0 transition-opacity" aria-hidden="true">
                            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setIsModalOpen(false)}></div>
                        </div>
                        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
                        <div className="inline-block align-bottom bg-[#18181b] border border-white/10 rounded-[24px] text-left overflow-hidden shadow-2xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
                            <form onSubmit={handleSubmit}>
                                <div className="px-6 pt-5 pb-4 sm:p-8 sm:pb-6">
                                    <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                                        <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
                                            <Receipt size={18} className="text-white" />
                                        </div>
                                        {isEdit ? 'Edit Transaction' : 'Record Transaction'}
                                    </h3>
                                    <div className="space-y-5">
                                        <div>
                                            <label className="block text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] mb-2">Description</label>
                                            <input type="text" name="description" required value={formData.description} onChange={handleInputChange} className="w-full bg-white/5 border border-white/5 rounded-xl py-3 px-4 text-sm text-white focus:border-white/20 focus:bg-white/10 outline-none transition-all" placeholder="e.g. Server Hosting" />
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] mb-2">Amount (₹)</label>
                                                <input type="number" name="amount" required value={formData.amount} onChange={handleInputChange} className="w-full bg-white/5 border border-white/5 rounded-xl py-3 px-4 text-sm text-white focus:border-white/20 focus:bg-white/10 outline-none transition-all" />
                                            </div>
                                            <div>
                                                <label className="block text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] mb-2">Date</label>
                                                <input type="date" name="date" required value={formData.date} onChange={handleInputChange} className="w-full bg-white/5 border border-white/5 rounded-xl py-3 px-4 text-sm text-white focus:border-white/20 focus:bg-white/10 outline-none transition-all [color-scheme:dark]" />
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] mb-2">Category</label>
                                                <select name="category" value={formData.category} onChange={handleInputChange} className="w-full bg-white/5 border border-white/5 rounded-xl py-3 px-4 text-sm text-white focus:border-white/20 focus:bg-white/10 outline-none transition-all">
                                                    <option>Office Supplies</option>
                                                    <option>AI Services</option>
                                                    <option>Software Licenses</option>
                                                    <option>Infrastructure</option>
                                                    <option>Marketing</option>
                                                    <option>Travel</option>
                                                    <option>Other</option>
                                                </select>
                                            </div>
                                            <div>
                                                <label className="block text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] mb-2">Payment Status</label>
                                                <select name="status" value={formData.status} onChange={handleInputChange} className="w-full bg-white/5 border border-white/5 rounded-xl py-3 px-4 text-sm text-white focus:border-white/20 focus:bg-white/10 outline-none transition-all">
                                                    <option>Paid</option>
                                                    <option>Pending</option>
                                                </select>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="bg-white/5 px-6 py-4 sm:px-8 sm:flex sm:flex-row-reverse border-t border-white/5">
                                    <button type="submit" className="w-full sm:ml-3 sm:w-auto px-6 py-2.5 bg-white text-black font-bold rounded-xl hover:bg-zinc-200 transition-all text-sm">{isEdit ? 'Update Entry' : 'Add to Ledger'}</button>
                                    <button type="button" onClick={() => setIsModalOpen(false)} className="w-full sm:mt-0 sm:ml-3 sm:w-auto mt-3 px-6 py-2.5 bg-zinc-800 text-white font-bold rounded-xl hover:bg-zinc-700 transition-all text-sm">Cancel</button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ExpensesDashboard;
