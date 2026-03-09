import React, { useState, useEffect, useMemo } from 'react';
import { motion, LayoutGroup } from 'framer-motion';
import {
    Users,
    Briefcase,
    Clock,
    CheckCircle,
    DollarSign,
    Building2,
    TrendingUp,
    Target,
    UserCheck,
    CreditCard,
    Award,
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
    CartesianGrid,
    RadialBarChart,
    RadialBar,
    FunnelChart,
    Funnel,
    LabelList,
    Legend,
    PolarAngleAxis,
    PolarRadiusAxis,
    PolarGrid
} from 'recharts';
import { formatDate } from '../utils/helpers';
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

// Widget Component with Drag Handle
const Widget = ({
    id,
    title,
    subtitle,
    size,
    onSizeChange,
    children,
    allowOverflow = false
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
const CEOSummaryWidgets = ({ dashboardData }) => {
    // Widget States with localStorage persistence
    const [widgetStates, setWidgetStates] = useState(() => {
        const defaults = {
            employees: 'medium',
            revenue: 'medium',
            projects: 'medium',
            attendance: 'small',
            banking: 'small',
            performance: 'small',
            expenses: 'small',
            clients: 'small'
        };

        const saved = localStorage.getItem('ceoDashboardWidgetSizes_v1');
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

    // Create Task Modal State
    const [showCreateTaskModal, setShowCreateTaskModal] = useState(false);
    const [taskViewMode, setTaskViewMode] = useState('create-project'); // 'create-project', 'create-other', 'review'
    const [assignedTasks, setAssignedTasks] = useState([]);
    const [loadingTasks, setLoadingTasks] = useState(false);
    const [expandedTaskId, setExpandedTaskId] = useState(null);
    const [taskType, setTaskType] = useState('project'); // 'project' or 'other'
    const [managers, setManagers] = useState([]);
    const [projects, setProjects] = useState([]);
    const [newExecutiveTask, setNewExecutiveTask] = useState({
        description: '',
        assignedTo: '',
        assignedToType: '', // 'manager' or 'hr'
        projectId: '',
        deadline: ''
    });
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        localStorage.setItem('ceoDashboardWidgetSizes_v1', JSON.stringify(widgetStates));
    }, [widgetStates]);

    // Fetch Managers/HR and Projects
    useEffect(() => {
        const fetchData = async () => {
            try {
                const [usersRes, projectsRes] = await Promise.all([
                    api.get('/users'),
                    api.get('/projects')
                ]);
                
                // Filter managers and HR
                const users = usersRes.data.data?.users || usersRes.data.users || usersRes.data || [];
                const managersAndHR = Array.isArray(users) ? users.filter(
                    user => user.role === 'manager' || user.role === 'hr'
                ) : [];
                setManagers(managersAndHR);
                setProjects(projectsRes.data.data || projectsRes.data || []);
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
        console.log(`Widget ${id} changing from ${widgetStates[id]} to ${newSize}`);
        setWidgetStates(prev => ({ ...prev, [id]: newSize }));
    };

    // State for Large Employee Widget Hover
    const [hoveredDept, setHoveredDept] = useState(null);

    // ========== MOCK DATA FOR TESTING & VISUALIZATION ==========

    // Mock Employees Data
    const mockEmployees = {
        total: 247,
        present: 215,
        percentage: 87,
        byDepartment: [
            { name: 'Development', count: 85, color: '#ffffff' },
            { name: 'Sales', count: 52, color: '#a1a1aa' },
            { name: 'Design', count: 38, color: '#52525b' },
            { name: 'HR', count: 28, color: '#3f3f46' },
            { name: 'Others', count: 44, color: '#27272a' }
        ]
    };

    // Process/Format Revenue Data from API
    const realRevenue = useMemo(() => {
        let dataSource = dashboardData?.revenueData;

        // CHECK: If API data is missing or empty, use the SAME mock fallback as ProfitRenewDashboard
        // This ensures the widgets show consistent data (e.g. ₹2.75M) instead of 0
        const hasData = dataSource?.targets && dataSource.targets.length > 0;

        if (!hasData) {
            dataSource = {
                overview: { totalRevenue: 1250000 },
                targets: [
                    {
                        _id: 'mock-1',
                        targetPeriod: 'monthly',
                        targetAmount: 2000000,
                        achievedAmount: 1250000,
                        status: 'in-progress'
                    },
                    {
                        _id: 'mock-2',
                        targetPeriod: 'quarterly',
                        targetAmount: 5000000,
                        achievedAmount: 1500000,
                        status: 'in-progress'
                    }
                ]
            };
        }

        const { targets, overview } = dataSource;

        // Calculate Total Revenue = Sum of achieved amounts of all targets
        let totalAchieved = 0;
        let totalTarget = 0;

        if (targets && targets.length > 0) {
            totalAchieved = targets.reduce((sum, t) => sum + (t.achievedAmount || 0), 0);
            totalTarget = targets.reduce((sum, t) => sum + (t.targetAmount || 0), 0);
        } else if (overview?.totalRevenue) {
            totalAchieved = overview.totalRevenue;
            totalTarget = totalAchieved * 1.25;
        }

        // Calculate trend (Simulate trend based on the total achieved)
        const mockTrend = [
            { month: 'Jan', amount: totalAchieved * 0.7 },
            { month: 'Feb', amount: totalAchieved * 0.75 },
            { month: 'Mar', amount: totalAchieved * 0.8 },
            { month: 'Apr', amount: totalAchieved * 0.9 },
            { month: 'May', amount: totalAchieved * 0.85 },
            { month: 'Jun', amount: totalAchieved * 0.95 },
            { month: 'Jul', amount: totalAchieved * 1.0 },
            { month: 'Aug', amount: totalAchieved * 1.1 },
            { month: 'Sep', amount: totalAchieved * 1.05 },
            { month: 'Oct', amount: totalAchieved * 1.15 },
            { month: 'Nov', amount: totalAchieved * 1.0 },
            { month: 'Dec', amount: totalAchieved }
        ];

        return {
            total: totalAchieved, // Should be 2,750,000 via fallback
            target: totalTarget || 1,
            achieved: totalAchieved,
            trend: mockTrend,
            growth: 15.3 // Matching dashboard
        };
    }, [dashboardData]);





    const [revenue, setRevenue] = useState(realRevenue || {
        total: 2400000,
        target: 3000000,
        achieved: 2400000,
        trend: [
            { month: 'Jan', amount: 120000 },
            { month: 'Feb', amount: 150000 },
            { month: 'Mar', amount: 180000 },
            { month: 'Apr', amount: 220000 },
            { month: 'May', amount: 250000 },
            { month: 'Jun', amount: 280000 },
            { month: 'Jul', amount: 320000 },
            { month: 'Aug', amount: 350000 },
            { month: 'Sep', amount: 380000 },
            { month: 'Oct', amount: 420000 },
            { month: 'Nov', amount: 450000 },
            { month: 'Dec', amount: 480000 },
        ],
        growth: 15.3
    });

    // Update state when realRevenue changes
    useEffect(() => {

        if (realRevenue) {
            setRevenue(realRevenue);
        }
    }, [realRevenue]);
    // Mock Projects Data
    const mockProjects = [
        { _id: '1', name: 'Enterprise CRM', status: 'in-progress', progress: 75, deadline: '2026-01-15' },
        { _id: '2', name: 'Mobile App Redesign', status: 'in-progress', progress: 45, deadline: '2026-03-01' },
        { _id: '3', name: 'Data Migration', status: 'completed', progress: 100, deadline: '2025-12-20' },
        { _id: '4', name: 'Analytics Dashboard', status: 'on-hold', progress: 30, deadline: '2026-04-10' },
        { _id: '5', name: 'Payment Gateway', status: 'in-progress', progress: 60, deadline: '2026-02-28' },
        { _id: '6', name: 'HR Portal', status: 'in-progress', progress: 20, deadline: '2026-03-15' }
    ];

    // Mock Attendance Data
    const mockAttendance = {
        present: 215,
        total: 247,
        percentage: 87,
        trend: [
            { day: 'Mon', percentage: 94 },
            { day: 'Tue', percentage: 92 },
            { day: 'Wed', percentage: 89 },
            { day: 'Thu', percentage: 93 },
            { day: 'Fri', percentage: 95 },
            { day: 'Sat', percentage: 85 }
        ]
    };

    // Mock Banking Data
    const mockBanking = {
        balance: 18500000,
        transactions: [
            { month: 'Jan', balance: 15000000 },
            { month: 'Feb', balance: 16200000 },
            { month: 'Mar', balance: 17500000 },
            { month: 'Apr', balance: 16800000 },
            { month: 'May', balance: 17900000 },
            { month: 'Jun', balance: 18500000 }
        ],
        breakdown: [
            { name: 'Operational', value: 8500000, fill: '#ffffff' },
            { name: 'Investments', value: 5500000, fill: '#a1a1aa' },
            { name: 'Payroll', value: 3000000, fill: '#52525b' }
        ]
    };

    // Mock Performance Data
    const mockPerformance = {
        overall: 94,
        metrics: [
            { name: 'Quality', score: 96 },
            { name: 'Delivery', score: 92 },
            { name: 'Innovation', score: 94 },
            { name: 'Growth', score: 95 }
        ]
    };

    // Mock Expenses Data
    const mockExpenses = {
        total: 29900,
        paid: 24500,
        pending: 4500,
        pendingCount: 1,
        trend: 12.5,
        categories: [
            { name: 'Software Licenses', amount: 12000, color: '#ffffff' },      // Pure White (Neon)
            { name: 'Infrastructure', amount: 8500, color: '#e4e4e7' },          // Zinc-200 (Very Light)
            { name: 'AI Services', amount: 4900, color: '#a1a1aa' },             // Zinc-400 (Medium)
            { name: 'Communication', amount: 4500, color: '#52525b' }            // Zinc-600 (Darker)
        ]
    };

    // Mock Clients Data
    const mockClients = {
        total: 12,
        active: 8,
        inContact: 3,
        newThisMonth: 3,
        growth: 25,
        byIndustry: [
            { name: 'Technology', count: 5, color: '#ffffff' },
            { name: 'Finance', count: 3, color: '#a1a1aa' },
            { name: 'Healthcare', count: 2, color: '#52525b' },
            { name: 'Retail', count: 2, color: '#3f3f46' }
        ]
    };

    // Use real clients data if available
    const clients = useMemo(() => {
        if (dashboardData?.business?.clients) {
            const { clients: allClients, clientIndustryBreakdown } = dashboardData.business;
            const active = allClients.filter(c => c.status === 'approved').length;
            const inContact = allClients.filter(c => c.status === 'in-contact').length;
            const industryData = Object.entries(clientIndustryBreakdown || {}).map(([name, count]) => ({
                name,
                count,
                color: name === 'Technology' ? '#ffffff' : '#a1a1aa'
            }));

            return {
                total: allClients.length,
                active,
                inContact,
                newThisMonth: allClients.filter(c => {
                    const created = new Date(c.createdAt);
                    const now = new Date();
                    return created.getMonth() === now.getMonth() && created.getFullYear() === now.getFullYear();
                }).length,
                growth: 25, // Can mock growth for now
                byIndustry: industryData.length > 0 ? industryData : mockClients.byIndustry
            };
        }
        return mockClients;
    }, [dashboardData]);

    // Calculate metrics using live project data if available
    const projectStats = useMemo(() => {
        const sourceData = dashboardData?.business?.projects || mockProjects;
        const total = sourceData.length;
        const active = sourceData.filter(p => ['active', 'in-progress'].includes(p.status)).length;
        const completed = sourceData.filter(p => p.status === 'completed').length;
        const delayed = sourceData.filter(p => p.status === 'delayed').length;
        const onHold = sourceData.filter(p => p.status === 'on-hold').length;

        const now = new Date();
        const dueSoon = sourceData.filter(p => {
            if (p.status === 'completed') return false;
            const deadline = new Date(p.deadline);
            const diffTime = deadline - now;
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            return diffDays >= 0 && diffDays <= 7;
        }).length;

        // Mock 12-month trend data
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const activity = months.map(month => ({
            month,
            value: Math.floor(Math.random() * 8) + 4, // Active count (4-11)
            due: Math.floor(Math.random() * 4) // Due count (0-3)
        }));

        return { total, active, completed, onHold, delayed, dueSoon, list: sourceData, activity };
    }, [dashboardData, mockProjects]);

    const projectChartData = [
        { name: 'Active', value: projectStats.active, color: '#ffffff' },
        { name: 'Completed', value: projectStats.completed, color: '#a1a1aa' },
        { name: 'On Hold', value: projectStats.onHold, color: '#52525b' }
    ];


    const attendance = mockAttendance;
    const banking = mockBanking;
    const performance = mockPerformance;
    const expenses = mockExpenses;
    // clients is already defined by useMemo above

    // Use real employee data from API if available, otherwise fallback to mock
    const employees = useMemo(() => {
        if (dashboardData?.team) {
            const { totalEmployees, attendanceRate, departmentBreakdown } = dashboardData.team;

            // Convert department breakdown object to array for chart
            const byDepartment = Object.entries(departmentBreakdown || {}).map(([name, count]) => ({
                name,
                count,
                color: '#ffffff' // White color theme
            }));

            return {
                total: totalEmployees || 0,
                present: attendanceRate?.present || 0,
                percentage: attendanceRate?.value || 0,
                byDepartment: byDepartment.length > 0 ? byDepartment : mockEmployees.byDepartment
            };
        }
        // Fallback to mock data
        return mockEmployees;
    }, [dashboardData]);

    return (
        <div className="p-2">
            <div className="mb-8 flex justify-between items-center px-2">
                <div>
                    <h1 className="text-3xl font-bold text-white tracking-tight drop-shadow-lg">Executive Summary</h1>
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

                    {/* Widget 1: Employees */}
                    <Widget id="employees" title="Employees" subtitle="Company Workforce" size={widgetStates.employees} onSizeChange={handleWidgetSizeChange}>
                        {widgetStates.employees === 'small' ? (
                            <div className="flex items-center justify-between h-full px-6 py-3">
                                {/* Left Side - Large Circular Progress */}
                                <div className="relative w-24 h-24">
                                    <svg viewBox="0 0 96 96" className="transform -rotate-90 w-full h-full">
                                        {/* Background Circle */}
                                        <circle cx="48" cy="48" r="42" stroke="#27272a" strokeWidth="6" fill="transparent" />
                                        {/* Progress Circle */}
                                        <circle
                                            cx="48" cy="48" r="42"
                                            stroke="url(#whiteGradientSmall)"
                                            strokeWidth="6"
                                            strokeLinecap="round"
                                            fill="transparent"
                                            strokeDasharray={`${2 * Math.PI * 42}`}
                                            strokeDashoffset={`${2 * Math.PI * 42 * (1 - employees.present / employees.total)}`}
                                            className="transition-all duration-1000"
                                            style={{ filter: 'drop-shadow(0 0 6px rgba(255, 255, 255, 0.6))' }}
                                        />
                                        <defs>
                                            <linearGradient id="whiteGradientSmall" x1="0%" y1="0%" x2="100%" y2="100%">
                                                <stop offset="0%" stopColor="#ffffff" />
                                                <stop offset="100%" stopColor="#a1a1aa" />
                                            </linearGradient>
                                        </defs>
                                    </svg>
                                    {/* Center Percentage */}
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <span className="text-white text-lg font-bold drop-shadow-[0_0_10px_rgba(255,255,255,0.8)]">
                                            {Math.round((employees.present / employees.total) * 100)}%
                                        </span>
                                    </div>
                                </div>

                                {/* Right Side - Count and Active Badge */}
                                <div className="flex flex-col gap-3 items-end">
                                    {/* Total Count - Top Right */}
                                    <div className="flex flex-col items-center">
                                        <div className="text-white text-4xl font-bold tracking-tighter drop-shadow-[0_0_15px_rgba(255,255,255,0.6)]">{employees.total}</div>
                                        <div className="text-zinc-500 text-[9px] uppercase tracking-wider font-bold">Total Staff</div>
                                    </div>

                                    {/* Active Badge */}
                                    <div className="flex flex-col items-center justify-center bg-zinc-900/60 rounded-xl px-4 py-2 border border-white/10 backdrop-blur-sm min-w-[80px]">
                                        <div className="text-white text-2xl font-bold drop-shadow-[0_0_8px_rgba(255,255,255,0.6)] leading-none mb-1">{employees.present}</div>
                                        <div className="flex items-center gap-1.5">
                                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)] animate-pulse"></div>
                                            <div className="text-zinc-400 text-[8px] uppercase tracking-wider font-bold">Active</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="flex flex-col h-full">
                                {widgetStates.employees === 'large' ? (
                                    <>
                                        <div className="relative flex justify-center items-center mb-0 min-h-[50px]">
                                            <div className="flex flex-col items-center -translate-y-6">
                                                <div className="text-white text-6xl font-bold tracking-tighter drop-shadow-[0_0_20px_rgba(255,255,255,0.6)]">{employees.total}</div>
                                                <div className="text-zinc-500 text-[10px] uppercase tracking-widest mt-0 font-bold">Total Employees</div>
                                            </div>
                                            <div className="absolute right-0 top-0 -mt-6">
                                                <div className="flex items-center gap-1.5 bg-white/5 rounded-md px-2 py-1 border border-white/10 backdrop-blur-sm">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse shadow-[0_0_8px_rgba(255,255,255,0.8)]"></div>
                                                    <div className="text-white text-[10px] font-bold">{employees.present} Present</div>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex-1 -mx-2 mb-0.5">
                                            <div className="relative h-full w-full flex items-end justify-around px-8 pb-8">
                                                {/* Hover Detail Overlay */}
                                                {hoveredDept && (
                                                    <div className="absolute top-0 left-1/2 -translate-x-1/2 z-20 pointer-events-none">
                                                        <div className="bg-zinc-900/90 backdrop-blur-md px-4 py-2 rounded-xl border border-white/20 shadow-[0_0_15px_rgba(255,255,255,0.15)] flex flex-col items-center animate-in fade-in zoom-in duration-200">
                                                            <span className="text-white text-lg font-bold drop-shadow-[0_0_8px_rgba(255,255,255,0.6)]">
                                                                {hoveredDept.count} Employees
                                                            </span>
                                                            <span className="text-zinc-400 text-[10px] uppercase tracking-wider font-bold">
                                                                {hoveredDept.name}
                                                            </span>
                                                        </div>
                                                    </div>
                                                )}

                                                {employees.byDepartment.map((dept, idx) => {
                                                    const maxCount = Math.max(...employees.byDepartment.map(d => d.count));
                                                    const heightPercent = (dept.count / maxCount) * 100;
                                                    const isHovered = hoveredDept?.name === dept.name;

                                                    return (
                                                        <div
                                                            key={dept.name}
                                                            className="flex flex-col items-center gap-3 group cursor-pointer relative"
                                                            onMouseEnter={() => setHoveredDept(dept)}
                                                            onMouseLeave={() => setHoveredDept(null)}
                                                        >
                                                            {/* Waveform Bar with Dot */}
                                                            <div className="relative flex flex-col items-center transition-transform duration-300 group-hover:scale-110 group-hover:-translate-y-2">
                                                                {/* Glowing Dot on Top */}
                                                                <div
                                                                    className={`w-4 h-4 rounded-full bg-white shadow-[0_0_15px_rgba(255,255,255,0.8)] mb-1 z-10 transition-all duration-300 ${isHovered ? 'shadow-[0_0_25px_rgba(255,255,255,1)] scale-110' : ''}`}
                                                                    style={{ filter: isHovered ? 'drop-shadow(0 0 12px rgba(255, 255, 255, 1))' : 'drop-shadow(0 0 8px rgba(255, 255, 255, 0.9))' }}
                                                                ></div>

                                                                {/* Vertical Line/Bar */}
                                                                <div
                                                                    className={`w-2 bg-gradient-to-b from-white via-zinc-300 to-zinc-500 rounded-full transition-all duration-300 shadow-[0_0_10px_rgba(255,255,255,0.5)] ${isHovered ? 'from-white via-zinc-200 to-zinc-400 shadow-[0_0_15px_rgba(255,255,255,0.8)]' : ''}`}
                                                                    style={{
                                                                        height: `${heightPercent * 1.5}px`,
                                                                        minHeight: '20px',
                                                                        filter: isHovered ? 'drop-shadow(0 0 10px rgba(255, 255, 255, 0.6))' : 'drop-shadow(0 0 6px rgba(255, 255, 255, 0.4))'
                                                                    }}
                                                                ></div>
                                                            </div>

                                                            {/* Label and Count */}
                                                            <div className={`flex flex-col items-center gap-1 mt-2 transition-opacity duration-300 ${hoveredDept && !isHovered ? 'opacity-30' : 'opacity-100'}`}>
                                                                <div className="text-white text-sm font-bold drop-shadow-[0_0_8px_rgba(255,255,255,0.6)]">
                                                                    {dept.count}
                                                                </div>
                                                                <div className="text-zinc-500 text-[9px] uppercase tracking-wider font-bold">
                                                                    {dept.name}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    </>
                                ) : (
                                    /* Medium Widget - Left-Right Layout */
                                    /* Medium Widget - Left-Right Layout */
                                    <div className="flex items-center h-full gap-4 px-4">
                                        {/* Left Side - Total Count */}
                                        <div className="flex flex-col justify-center items-center flex-1">
                                            <div className="text-white text-5xl font-bold tracking-tighter drop-shadow-[0_0_15px_rgba(255,255,255,0.6)]">{employees.total}</div>
                                            <div className="text-zinc-500 text-xs mt-2 uppercase tracking-wider font-bold">Total Employees</div>

                                            {/* Present Badge */}
                                            <div className="mt-4 inline-flex items-center gap-1.5 bg-white/5 rounded-md px-2 py-1 border border-white/10 backdrop-blur-sm w-fit">
                                                <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse shadow-[0_0_8px_rgba(255,255,255,0.8)]"></div>
                                                <div className="text-white text-[10px] font-bold">{employees.present} Present</div>
                                            </div>
                                        </div>

                                        {/* Right Side - Department Cards Stacked Vertically */}
                                        <div className="flex flex-col gap-2 flex-1 -mt-8">
                                            {employees.byDepartment.slice(0, 3).map((dept, idx) => (
                                                <div key={dept.name} className="bg-zinc-900/40 rounded-lg p-2 border border-white/10 relative overflow-hidden flex items-center justify-between shadow-sm">
                                                    <div className="flex items-center gap-2 flex-1">
                                                        <div className="text-lg font-bold text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.5)]">{dept.count}</div>
                                                        <div className="text-zinc-500 text-[8px] uppercase tracking-wider font-bold">{dept.name}</div>
                                                    </div>
                                                    <div className="w-16 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                                                        <div className="h-full bg-gradient-to-r from-white to-zinc-300 rounded-full shadow-[0_0_10px_rgba(255,255,255,0.5)]" style={{ width: `${(dept.count / employees.total) * 100}%` }}></div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </Widget>

                    {/* Widget 2: Revenue */}
                    <Widget id="revenue" title="Revenue" subtitle="Performance (YTD)" size={widgetStates.revenue} onSizeChange={handleWidgetSizeChange}>
                        {widgetStates.revenue === 'small' ? (
                            <div className="flex flex-col h-full relative overflow-hidden">
                                <div className="z-10 flex flex-col items-center justify-center h-full pb-4 pt-6">
                                    <div className="text-white text-4xl font-bold tracking-tighter"
                                        style={{ textShadow: '0 0 12px rgba(255,255,255,0.6), 0 0 24px rgba(255,255,255,0.3)' }}>
                                        {formatRevenue(revenue.total)}
                                    </div>
                                    <div className="text-zinc-500 text-[9px] uppercase tracking-wider font-bold mb-3 mt-1">Total Revenue</div>

                                    <div className="flex items-center gap-2 bg-zinc-900/80 rounded-xl px-3 py-1.5 border border-white/10 backdrop-blur-md shadow-lg z-20">
                                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)] animate-pulse"></div>
                                        <div className="text-white text-xs font-bold">
                                            {Math.round(((revenue.achieved || 0) / (revenue.target || 1)) * 100)}%
                                        </div>
                                        <div className="text-zinc-500 text-[8px] uppercase font-bold">Target</div>
                                    </div>
                                </div>

                                {/* Background Chart Accent */}
                                <div className="absolute bottom-0 left-0 right-0 h-28 opacity-40 pointer-events-none"
                                    style={{ maskImage: 'linear-gradient(to top, black, transparent)', WebkitMaskImage: 'linear-gradient(to top, black, transparent)' }}>
                                    <ResponsiveContainer width="100%" height="100%">
                                        <AreaChart data={revenue.trend}>
                                            <defs>
                                                <linearGradient id="revenueSmallGradient" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="0%" stopColor="#ffffff" stopOpacity={0.8} />
                                                    <stop offset="100%" stopColor="#ffffff" stopOpacity={0} />
                                                </linearGradient>
                                            </defs>
                                            <Area
                                                type="monotone"
                                                dataKey="amount"
                                                stroke="#ffffff"
                                                strokeWidth={2}
                                                fill="url(#revenueSmallGradient)"
                                                isAnimationActive={true}
                                            />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                        ) : widgetStates.revenue === 'medium' ? (
                            <div className="flex h-full w-full p-4 gap-6 items-center">
                                {/* Left Side - Stats */}
                                <div className="flex flex-col justify-center min-w-[140px]">
                                    <div className="text-zinc-500 text-xs font-medium mb-1">Sales Report</div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <div className="text-white text-4xl font-bold tracking-tighter drop-shadow-[0_0_10px_rgba(255,255,255,0.4)]">
                                            {formatRevenue(revenue.total)}
                                        </div>
                                        <div className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-1.5 py-0.5 rounded text-[10px] font-bold flex items-center">
                                            ↑ 18%
                                        </div>
                                    </div>
                                    <div className="text-zinc-600 text-[10px] font-medium">
                                        Avg. score {formatRevenue(revenue.total / 12)}
                                    </div>
                                </div>

                                {/* Right Side - Vertical Bar Chart */}
                                <div className="flex-1 flex items-end justify-between h-32 px-4 pb-2 gap-2">
                                    {revenue.trend.map((item, idx) => {
                                        // Visual wave pattern to match the reference image aesthetics
                                        const waveHeights = [25, 45, 75, 50, 30, 60, 90, 65, 40, 55, 70, 45];
                                        const heightPercent = waveHeights[idx % waveHeights.length];

                                        return (
                                            <div key={idx} className="flex flex-col items-center gap-2 h-full justify-end w-full group cursor-pointer">
                                                {/* Bar */}
                                                <div
                                                    className="w-[3px] rounded-full transition-all duration-500 ease-out relative overflow-hidden"
                                                    style={{ height: `${heightPercent}%` }}
                                                >
                                                    <div className="absolute inset-0 bg-gradient-to-t from-zinc-800 via-zinc-400 to-white opacity-80 group-hover:opacity-100 transition-opacity duration-300"></div>
                                                </div>
                                                {/* Dot */}
                                                <div className="w-[2px] h-[2px] rounded-full bg-zinc-600 group-hover:bg-white group-hover:shadow-[0_0_8px_rgba(255,255,255,0.8)] transition-all duration-300 transform group-hover:scale-150" />
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        ) : (
                            <div className="flex flex-col h-full">
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <div className="text-white text-4xl font-bold tracking-tighter">{formatRevenue(revenue.total)}</div>
                                        <div className="text-zinc-500 text-xs mt-1">Total Revenue (12 Months)</div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-white text-2xl font-bold">{Math.round(((revenue.achieved || 0) / (revenue.target || 1)) * 100)}%</div>
                                        <div className="text-zinc-500 text-[9px]">ACHIEVED</div>
                                    </div>
                                </div>
                                <div className="flex-1">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <AreaChart data={revenue.trend}>
                                            <defs>
                                                <linearGradient id="revenueGradientLarge" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#ffffff" stopOpacity={0.4} />
                                                    <stop offset="95%" stopColor="#ffffff" stopOpacity={0} />
                                                </linearGradient>
                                            </defs>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                                            <XAxis
                                                dataKey="month"
                                                tick={{ fill: '#71717a', fontSize: 11 }}
                                                interval={0}
                                                padding={{ left: 10, right: 10 }}
                                            />
                                            <Tooltip content={<MinimalTooltip />} />
                                            <Area type="monotone" dataKey="amount" stroke="#ffffff" strokeWidth={3} fill="url(#revenueGradientLarge)" />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                        )}
                    </Widget>

                    {/* Widget 3: Projects */}
                    <Widget id="projects" title="Projects" subtitle="Active Portfolio" size={widgetStates.projects} onSizeChange={handleWidgetSizeChange} allowOverflow={true}>
                        {widgetStates.projects === 'small' ? (
                            <div className="flex flex-col h-full relative overflow-visible py-2 px-3">
                                {/* Center - Wavy Rings Animation */}
                                <div className="flex-1 flex items-center justify-center relative z-10 w-full overflow-visible">
                                    <div className="relative w-32 h-32 flex items-center justify-center">
                                        {/* Organic Ring 1 (Smooth Blob) */}
                                        <motion.svg
                                            viewBox="0 0 100 100"
                                            className="absolute w-full h-full drop-shadow-[0_0_8px_rgba(255,255,255,0.6)]"
                                            animate={{ rotate: 360 }}
                                            transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                                        >
                                            <path
                                                d="M50 10 C 75 10 95 25 95 55 C 95 85 70 95 50 95 C 20 95 5 75 5 50 C 5 20 25 10 50 10 Z"
                                                fill="none"
                                                stroke="white"
                                                strokeWidth="1.5"
                                                strokeLinecap="round"
                                                className="opacity-90"
                                            />
                                        </motion.svg>

                                        {/* Organic Ring 2 (Offset Blob) */}
                                        <motion.svg
                                            viewBox="0 0 100 100"
                                            className="absolute w-[105%] h-[105%] drop-shadow-[0_0_5px_rgba(255,255,255,0.4)]"
                                            animate={{ rotate: -360 }}
                                            transition={{ duration: 14, repeat: Infinity, ease: "linear" }}
                                        >
                                            <path
                                                d="M55 5 C 85 5 95 35 95 50 C 95 80 75 92 50 92 C 25 92 10 70 10 50 C 10 25 35 5 55 5 Z"
                                                fill="none"
                                                stroke="white"
                                                strokeWidth="1.5"
                                                strokeLinecap="round"
                                                className="opacity-80"
                                            />
                                        </motion.svg>

                                        {/* Inner Text */}
                                        <div className="flex flex-col items-center justify-center z-20 absolute inset-0">
                                            <div className="text-white text-lg font-bold tracking-wide drop-shadow-[0_0_15px_rgba(255,255,255,0.6)]">Active</div>
                                            <div className="text-zinc-400 text-[9px] font-bold uppercase tracking-wider mt-0.5">{projectStats.active} Projects</div>
                                        </div>
                                    </div>
                                </div>


                            </div>
                        ) : widgetStates.projects === 'medium' ? (
                            <div className="flex flex-col h-full">
                                <div className="relative flex justify-center items-center mb-0 min-h-[50px]">
                                    <div className="flex flex-col items-center -translate-y-6">
                                        <div className="text-white text-6xl font-bold tracking-tighter drop-shadow-[0_0_15px_rgba(255,255,255,0.4)]">{projectStats.total}</div>
                                        <div className="text-zinc-500 text-[10px] uppercase tracking-widest mt-0 font-bold">Total Projects</div>
                                    </div>
                                    <div className="absolute right-0 top-0 -mt-6 flex flex-col items-end gap-1.5">
                                        <div className="flex items-center gap-1.5 bg-zinc-800/80 rounded-md px-2 py-1 border border-white/10 shadow-lg backdrop-blur-sm">
                                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_6px_rgba(16,185,129,0.5)]"></div>
                                            <div className="text-white text-[10px] font-bold">{projectStats.active} Active</div>
                                        </div>
                                        <div className="flex items-center gap-1.5 bg-rose-500/10 rounded-md px-2 py-1 border border-rose-500/20 backdrop-blur-sm">
                                            <div className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse"></div>
                                            <div className="text-rose-400 text-[10px] font-bold">{projectStats.dueSoon} Due Soon</div>
                                        </div>
                                    </div>
                                </div>

                                <div className="relative flex-1 w-full min-h-0 mt-2 z-50">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <AreaChart data={projectStats.activity || []} margin={{ top: 5, right: 10, left: 10, bottom: 0 }}>
                                            <defs>
                                                <linearGradient id="projectsGradient" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#ffffff" stopOpacity={0.3} />
                                                    <stop offset="95%" stopColor="#ffffff" stopOpacity={0} />
                                                </linearGradient>
                                            </defs>
                                            <Tooltip
                                                allowEscapeViewBox={{ x: true, y: true }}
                                                cursor={{ stroke: 'white', strokeWidth: 1, strokeDasharray: '4 4' }}
                                                content={({ active, payload }) => {
                                                    if (active && payload && payload.length) {
                                                        const data = payload[0].payload;
                                                        return (
                                                            <div className="bg-zinc-950/90 border border-white/10 p-2.5 rounded-lg shadow-xl backdrop-blur-md min-w-[100px]">
                                                                <div className="text-zinc-500 text-[10px] font-bold uppercase mb-1.5 tracking-wider">{data.month} Stats</div>
                                                                <div className="flex flex-col gap-1.5">
                                                                    <div className="flex justify-between items-center gap-3">
                                                                        <div className="flex items-center gap-1.5">
                                                                            <div className="w-1.5 h-1.5 rounded-full bg-white"></div>
                                                                            <span className="text-zinc-300 text-[10px] font-medium">Active</span>
                                                                        </div>
                                                                        <span className="text-white text-xs font-bold">{data.value}</span>
                                                                    </div>
                                                                    <div className="flex justify-between items-center gap-3">
                                                                        <div className="flex items-center gap-1.5">
                                                                            <div className="w-1.5 h-1.5 rounded-full bg-rose-500"></div>
                                                                            <span className="text-zinc-300 text-[10px] font-medium">Due</span>
                                                                        </div>
                                                                        <span className="text-rose-400 text-xs font-bold">{data.due}</span>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        );
                                                    }
                                                    return null;
                                                }}
                                            />
                                            <Area
                                                type="monotone"
                                                dataKey="value"
                                                stroke="#ffffff"
                                                strokeWidth={2}
                                                fill="url(#projectsGradient)"
                                                animationDuration={1500}
                                            />
                                        </AreaChart>
                                    </ResponsiveContainer>
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
                                            <div className="text-white text-[10px] font-bold">{projectStats.active} Active</div>
                                        </div>
                                        <div className="flex items-center gap-1.5 bg-rose-500/10 rounded-md px-2 py-1 border border-rose-500/20 backdrop-blur-sm">
                                            <div className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse"></div>
                                            <div className="text-rose-400 text-[10px] font-bold">{projectStats.dueSoon} Due Soon</div>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex-1 -mx-2 mb-0.5">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={projectChartData} barSize={64}>
                                            <defs>
                                                <linearGradient id="projBarGradient" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="0%" stopColor="#ffffff" stopOpacity={1} />
                                                    <stop offset="100%" stopColor="#52525b" stopOpacity={0.8} />
                                                </linearGradient>
                                            </defs>
                                            <CartesianGrid vertical={false} stroke="#ffffff" strokeOpacity={0.05} strokeDasharray="3 3" />
                                            <XAxis dataKey="name" tick={{ fill: '#71717a', fontSize: 10, fontWeight: 500 }} axisLine={false} tickLine={false} dy={5} />
                                            <Tooltip cursor={{ fill: 'rgba(255,255,255,0.03)' }} content={<MinimalTooltip />} />
                                            <Bar dataKey="value" radius={[4, 4, 0, 0]} fill="url(#projBarGradient)" animationDuration={1500} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                                <div className="mt-4 pt-4 border-t border-white/5 grid grid-cols-2 gap-4">
                                    {projectStats.list.slice(0, 2).map(p => (
                                        <div key={p._id || p.id} className="bg-zinc-800/50 rounded-lg p-3 flex justify-between items-center border border-white/5">
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
                            </div>
                        )}
                    </Widget>

                    {/* Widget 4: Attendance */}
                    <Widget id="attendance" title="Attendance" subtitle="Today's Status" size={widgetStates.attendance} onSizeChange={handleWidgetSizeChange} allowOverflow={true}>
                        {widgetStates.attendance === 'small' ? (
                            <div className="flex flex-col justify-center h-full items-center relative">
                                <div className="relative w-28 h-28 flex items-center justify-center">
                                    <svg viewBox="0 0 112 112" className="transform -rotate-90 w-full h-full" style={{ overflow: 'visible' }}>
                                        <circle cx="56" cy="56" r="48" stroke="#18181b" strokeWidth="10" fill="transparent" />
                                        <circle
                                            cx="56" cy="56" r="48"
                                            stroke="#ffffff" strokeWidth="10" strokeLinecap="round"
                                            fill="transparent"
                                            strokeDasharray={`${2 * Math.PI * 48}`}
                                            strokeDashoffset={`${2 * Math.PI * 48 * (1 - attendance.present / attendance.total)}`}
                                            className="transition-all duration-1000 ease-out"
                                            style={{ filter: 'drop-shadow(0 0 6px rgba(255, 255, 255, 0.6))' }}
                                        />
                                    </svg>
                                    <div className="absolute inset-0 flex items-center justify-center flex-col">
                                        <span className="text-3xl font-bold text-white tracking-tighter drop-shadow-md">{attendance.present}</span>
                                        <span className="text-[9px] text-zinc-500 font-bold tracking-widest uppercase mt-1">PRESENT</span>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="flex flex-col h-full">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <div className="text-4xl font-bold text-white tracking-tighter drop-shadow-[0_0_10px_rgba(255,255,255,0.4)]">
                                            {attendance.present}
                                            <span className="text-lg text-zinc-600 font-medium ml-1">/ {attendance.total}</span>
                                        </div>
                                        <div className="text-xs text-zinc-400 mt-4 flex items-center gap-2">
                                            <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse shadow-[0_0_8px_rgba(255,255,255,1)]"></span>
                                            {attendance.percentage}% On Time
                                        </div>
                                    </div>
                                </div>

                                <div className={`flex-1 flex gap-6 min-h-0 ${widgetStates.attendance === 'large' ? 'items-start' : 'items-center -mt-12'}`}>
                                    <div className={`flex-1 relative overflow-visible ${widgetStates.attendance === 'large' ? 'h-40' : 'h-32'}`}>
                                        <ResponsiveContainer width="100%" height="100%" className="overflow-visible">
                                            <PieChart style={{ overflow: 'visible' }}>
                                                <defs>
                                                    <filter id="attendanceNeonGlowPremiumCEO" x="-50%" y="-50%" width="200%" height="200%">
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
                                                        { name: 'Present', value: attendance.present, fill: '#ffffff' },
                                                        { name: 'Absent', value: attendance.total - attendance.present, fill: '#27272a' }
                                                    ]}
                                                    cx="65%"
                                                    cy={widgetStates.attendance === 'large' ? '45%' : '40%'}
                                                    innerRadius={widgetStates.attendance === 'large' ? '55%' : '55%'}
                                                    outerRadius={widgetStates.attendance === 'large' ? '75%' : '75%'}
                                                    paddingAngle={0}
                                                    dataKey="value"
                                                    cornerRadius={0}
                                                    startAngle={90}
                                                    endAngle={-270}
                                                    stroke="none"
                                                >
                                                    <Cell fill="#ffffff" style={{ filter: 'url(#attendanceNeonGlowPremiumCEO)' }} />
                                                    <Cell fill="#27272a" />
                                                </Pie>
                                                <Tooltip content={<MinimalTooltip />} />
                                            </PieChart>
                                        </ResponsiveContainer>
                                        <div className="absolute inset-0 flex items-center justify-center flex-col pointer-events-none"
                                            style={{ transform: 'translate(15%, -5%)' }}>
                                            <span className="text-2xl font-bold text-white">{Math.round((attendance.present / attendance.total) * 100)}%</span>
                                        </div>
                                    </div>

                                    <div className={`flex flex-col justify-start gap-3 w-1/3 ${widgetStates.attendance === 'large' ? '-mt-2' : '-mt-8'}`}>
                                        <div className="bg-white/5 rounded-lg p-2.5 border-l-2 border-white backdrop-blur-sm">
                                            <div className="text-white text-sm font-bold">{attendance.present}</div>
                                            <div className="text-zinc-500 text-[9px] uppercase tracking-wider">Present</div>
                                        </div>
                                        <div className="bg-zinc-900/50 rounded-lg p-2.5 border-l-2 border-zinc-700">
                                            <div className="text-zinc-400 text-sm font-bold">{attendance.total - attendance.present}</div>
                                            <div className="text-zinc-600 text-[9px] uppercase tracking-wider">Absent</div>
                                        </div>
                                    </div>
                                </div>

                                {widgetStates.attendance === 'large' && (
                                    <div className="h-32 mt-4 pt-4 border-t border-white/5 flex-shrink-0">
                                        <div className="text-xs text-zinc-400 mb-2 uppercase tracking-widest font-bold">Weekly Trend</div>
                                        <ResponsiveContainer width="100%" height="100%">
                                            <AreaChart data={attendance.trend}>
                                                <defs>
                                                    <linearGradient id="attendanceGradientCEO" x1="0" y1="0" x2="0" y2="1">
                                                        <stop offset="5%" stopColor="#ffffff" stopOpacity={0.15} />
                                                        <stop offset="95%" stopColor="#ffffff" stopOpacity={0} />
                                                    </linearGradient>
                                                </defs>
                                                <CartesianGrid vertical={false} stroke="#ffffff" strokeOpacity={0.05} strokeDasharray="3 3" />
                                                <XAxis dataKey="day" tick={{ fill: '#52525b', fontSize: 10, fontWeight: 600 }} axisLine={false} tickLine={false} dy={5} />
                                                <Tooltip content={<MinimalTooltip />} />
                                                <Area type="monotone" dataKey="percentage" stroke="#52525b" fill="url(#attendanceGradientCEO)" strokeWidth={2} />
                                            </AreaChart>
                                        </ResponsiveContainer>
                                    </div>
                                )}
                            </div>
                        )}
                    </Widget>

                    {/* Widget 5: Banking */}
                    <Widget id="banking" title="Banking" subtitle="Current Balance" size={widgetStates.banking} onSizeChange={handleWidgetSizeChange}>
                        {widgetStates.banking === 'small' ? (
                            <div className="flex flex-col justify-center h-full">
                                <div className="text-white text-5xl font-bold tracking-tighter drop-shadow-md">
                                    {formatRevenue(banking.balance)}
                                </div>
                                <div className="text-zinc-500 text-xs mt-2">Available Balance</div>
                            </div>
                        ) : widgetStates.banking === 'medium' ? (
                            <div className="flex flex-col h-full justify-center px-4">
                                <div className="flex flex-col gap-3">
                                    <div className="flex justify-between items-end px-1">
                                        <span className="text-zinc-400 text-[10px] uppercase tracking-widest font-bold">Current Balance</span>
                                        <span className="text-white text-2xl font-bold tracking-tight">{formatRevenue(banking.balance)}</span>
                                    </div>
                                    <div className="flex items-center gap-[4px] h-12 mask-gradient-x">
                                        {[...Array(40)].map((_, i) => {
                                            // Create a symmetrical wave pattern
                                            const center = 20;
                                            const dist = Math.abs(i - center);
                                            const baseHeight = Math.max(20, 100 - (dist * 4) + (Math.sin(i * 0.8) * 20));
                                            const height = Math.min(100, baseHeight);

                                            // Mock fill percentage for aesthetic (e.g. 75%)
                                            const fillPercentage = 75;
                                            const isFilled = (i / 40) * 100 < fillPercentage;

                                            return (
                                                <motion.div
                                                    key={i}
                                                    className={`flex-1 rounded-sm ${isFilled ? 'bg-white shadow-[0_0_8px_rgba(255,255,255,0.6)]' : 'bg-zinc-800/50'}`}
                                                    initial={{ height: '5%' }}
                                                    animate={{ height: `${height}%` }}
                                                    transition={{
                                                        type: "spring",
                                                        stiffness: 300,
                                                        damping: 20,
                                                        delay: i * 0.02
                                                    }}
                                                />
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="flex flex-col h-full">
                                <div>
                                    <div className="text-white text-4xl font-bold tracking-tighter drop-shadow-[0_0_10px_rgba(255,255,255,0.5)]">
                                        {formatRevenue(banking.balance)}
                                    </div>
                                    <div className="text-zinc-500 text-[10px] uppercase tracking-widest mt-0.5 font-bold">Current Balance</div>
                                </div>
                                <div className="flex-1 mt-4 flex items-center justify-between">
                                    <div className="w-[50%] h-full relative px-9">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <FunnelChart>
                                                <Tooltip content={<MinimalTooltip />} cursor={{ fill: 'transparent' }} />
                                                <Funnel
                                                    data={banking.breakdown}
                                                    dataKey="value"
                                                    isAnimationActive
                                                    lastShapeType="rectangle"
                                                >
                                                    {banking.breakdown.map((entry, index) => (
                                                        <Cell key={`cell-${index}`} fill={entry.fill} stroke="none" />
                                                    ))}
                                                </Funnel>
                                            </FunnelChart>
                                        </ResponsiveContainer>
                                    </div>
                                    <div className="w-[50%] flex flex-col justify-center gap-4 pl-8">
                                        <div className="text-xs text-zinc-500 uppercase tracking-widest font-bold mb-1">Expenditure</div>
                                        {banking.breakdown.map((item, index) => (
                                            <div key={index} className="flex items-center gap-3">
                                                <div className="w-3 h-3 rounded-full ring-2 ring-white/10" style={{ backgroundColor: item.fill, boxShadow: `0 0 10px ${item.fill}80` }}></div>
                                                <div>
                                                    <div className="text-zinc-200 text-sm font-bold leading-none">{item.name}</div>
                                                    <div className="text-zinc-500 text-xs font-medium mt-1">{formatRevenue(item.value)}</div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}
                    </Widget>

                    {/* Widget 6: Performance */}
                    <Widget
                        id="performance"
                        title="Performance"
                        subtitle="Key Metrics"
                        size={widgetStates.performance}
                        onSizeChange={handleWidgetSizeChange}
                    >
                        {widgetStates.performance === 'small' ? (
                            <div className="flex flex-col justify-center h-full">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-14 h-14 rounded-xl bg-white flex items-center justify-center font-bold text-black text-lg shadow-[0_0_15px_rgba(255,255,255,0.5)]">
                                            <Award size={24} />
                                        </div>
                                        <div>
                                            <div className="text-white font-bold text-sm">{performance.metrics[0].name}</div>
                                            <div className="text-zinc-500 text-xs">Primary Metric</div>
                                        </div>
                                    </div>
                                </div>
                                <div className="grid grid-cols-3 gap-3">
                                    <div>
                                        <div className="text-zinc-500 text-[10px] font-bold uppercase mb-1">Score</div>
                                        <div className="text-white text-2xl font-bold">{performance.metrics[0].score}</div>
                                    </div>
                                    <div className="text-center">
                                        <div className="text-zinc-500 text-[10px] font-bold uppercase mb-1">Trend</div>
                                        <div className="text-emerald-400 text-2xl font-bold">↑ 2.4</div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-zinc-500 text-[10px] font-bold uppercase mb-1">Status</div>
                                        <div className="text-white text-xl font-bold">Good</div>
                                    </div>
                                </div>
                            </div>
                        ) : widgetStates.performance === 'medium' ? (
                            <div className="flex flex-col h-full justify-center">
                                {/* Header */}
                                <div className="relative flex justify-center items-center mb-5 -mt-3">
                                    <div className="text-white text-xl font-black uppercase tracking-[0.2em] drop-shadow-[0_0_10px_rgba(255,255,255,0.8)]">
                                        Top Metrics
                                    </div>
                                    <div className="absolute right-0 top-0 bg-white/5 rounded px-2 py-1 border border-white/10">
                                        <div className="text-zinc-500 text-[10px] font-medium">Avg: <span className="text-white font-bold text-xs">{performance.overall}%</span></div>
                                    </div>
                                </div>

                                {/* Metric Cards - 3 Columns */}
                                <div className="grid grid-cols-3 gap-2">
                                    {performance.metrics.slice(0, 3).map((metric, index) => {
                                        const dotCount = Math.round(metric.score / 10);
                                        const dots = Array.from({ length: 10 }, (_, i) => i < dotCount);

                                        return (
                                            <div key={metric.name} className="bg-zinc-900/40 rounded-xl p-2 border border-white/5 relative overflow-hidden group hover:bg-zinc-900/60 transition-all">
                                                {/* Top Row: Icon & Name */}
                                                <div className="flex items-center gap-1.5 mb-2">
                                                    <div className={`w-5 h-5 rounded flex items-center justify-center font-bold text-[8px] ${index === 0 ? 'bg-white text-black shadow-lg shadow-white/20' :
                                                        index === 1 ? 'bg-zinc-400 text-black' :
                                                            'bg-zinc-700 text-white'
                                                        }`}>
                                                        {index === 0 ? <Award size={12} /> : index === 1 ? <Target size={12} /> : <TrendingUp size={12} />}
                                                    </div>
                                                    <div className="text-zinc-400 text-[9px] font-bold truncate max-w-[60px]">{metric.name}</div>
                                                </div>

                                                {/* Bottom Row: Score (Left) & Dots (Right) */}
                                                <div className="flex items-end justify-between">
                                                    <div>
                                                        <div className="text-white text-2xl font-bold leading-none tracking-tighter mb-0.5">{metric.score}</div>
                                                        <div className="text-emerald-400 text-[9px] font-bold">↑ {index === 0 ? '2.4' : '1.8'}</div>
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
                                        <div className="text-white text-xl font-bold">{performance.overall}%</div>
                                    </div>
                                    <div className="bg-blue-500/10 rounded-xl p-3 border border-blue-500/20">
                                        <div className="text-blue-400 text-[10px] font-bold uppercase mb-1">Top Metric</div>
                                        <div className="text-white text-sm font-bold truncate">{performance.metrics[0].name}</div>
                                    </div>
                                    <div className="bg-purple-500/10 rounded-xl p-3 border border-purple-500/20">
                                        <div className="text-purple-400 text-[10px] font-bold uppercase mb-1">Metrics Tracked</div>
                                        <div className="text-white text-xl font-bold">{performance.metrics.length}</div>
                                    </div>
                                </div>
                                <div className="flex-1 grid grid-cols-2 gap-3 overflow-y-auto content-start pr-1 custom-scrollbar">
                                    {performance.metrics.map((metric, idx) => (
                                        <div key={metric.name} className="flex items-center gap-3 bg-zinc-900/40 rounded-xl p-3 border border-white/5 hover:bg-zinc-800/60 transition-colors group">
                                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold text-white shadow-lg ${idx === 0 ? 'bg-gradient-to-br from-yellow-400 to-amber-600 shadow-amber-500/20' :
                                                idx === 1 ? 'bg-gradient-to-br from-gray-300 to-gray-500 shadow-gray-400/20' :
                                                    idx === 2 ? 'bg-gradient-to-br from-amber-700 to-amber-900 shadow-amber-900/20' :
                                                        'bg-zinc-800 text-zinc-400'
                                                }`}>
                                                {idx === 0 ? <Award size={20} /> : idx === 1 ? <Target size={20} /> : idx === 2 ? <TrendingUp size={20} /> : <CheckCircle size={20} />}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="text-white font-bold text-sm truncate group-hover:text-blue-400 transition-colors">{metric.name}</div>
                                                <div className="text-zinc-500 text-[10px] font-medium uppercase tracking-wider">
                                                    {idx === 0 ? 'Market Leader' : 'Key Performance'}
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <div className="text-white font-bold text-lg leading-none">{metric.score}</div>
                                                <div className="text-emerald-500 text-[10px] font-bold mt-0.5">% Score</div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </Widget>

                    {/* Widget 7: Expenses */}
                    <Widget id="expenses" title="Expenses" subtitle="Monthly Breakdown" size={widgetStates.expenses} onSizeChange={handleWidgetSizeChange}>
                        {widgetStates.expenses === 'small' ? (
                            <div className="flex flex-col justify-center h-full relative">
                                <div className="text-white text-5xl font-bold tracking-tighter drop-shadow-md -mt-10">
                                    {formatRevenue(expenses.total)}
                                </div>
                                <div className="text-zinc-500 text-xs mt-2">Total Expenses</div>

                                <div className="absolute -top-12 right-0">
                                    <div className="text-center bg-red-500/10 rounded-lg px-2 py-1.5 border border-red-500/20 backdrop-blur-sm">
                                        <div className="text-red-400 text-sm font-bold">+{expenses.trend}%</div>
                                        <div className="text-red-600 text-[8px] uppercase tracking-wider">vs Last</div>
                                    </div>
                                </div>

                                <div className="absolute bottom-1 left-0 right-0">
                                    <div className="text-[10px] text-zinc-500 uppercase tracking-wider font-bold mb-1">Top Category</div>
                                    <div className="flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: expenses.categories[0].color }}></div>
                                        <div className="text-xs text-white">{expenses.categories[0].name}</div>
                                        <div className="text-xs text-emerald-400 ml-auto">{formatRevenue(expenses.categories[0].amount)}</div>
                                    </div>
                                </div>
                            </div>
                        ) : widgetStates.expenses === 'medium' ? (
                            <div className="flex items-center justify-between h-full px-2 relative">
                                {/* Left Side: Stats */}
                                <div className="flex flex-col justify-center translate-y-1 relative z-10 pl-2">
                                    <div className="text-white text-4xl font-bold tracking-tighter drop-shadow-[0_0_10px_rgba(255,255,255,0.5)]">
                                        {formatRevenue(expenses.total)}
                                    </div>
                                    <div className="text-zinc-500 text-[10px] uppercase tracking-widest mt-0.5 font-bold">Total Expenses</div>
                                    <div className="flex items-center gap-2 mt-6">
                                        <div className="bg-red-500/10 text-red-400 border border-red-500/20 px-1.5 py-0.5 rounded text-[10px] font-bold">
                                            +{expenses.trend}%
                                        </div>
                                        <div className="text-zinc-500 text-[10px]">
                                            {expenses.pendingCount} Pending
                                        </div>
                                    </div>
                                </div>

                                {/* Right Side: Radial Bar Chart */}
                                <div className="flex-1 flex items-center justify-center -mr-4 h-full">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <RadialBarChart
                                            cx="50%"
                                            cy="50%"
                                            innerRadius="30%"
                                            outerRadius="100%"
                                            barSize={8}
                                            data={expenses.categories.map(cat => ({
                                                name: cat.name,
                                                value: (cat.amount / expenses.total) * 100, // Percentage of total
                                                fill: cat.color
                                            })).sort((a, b) => b.value - a.value)}
                                            startAngle={90}
                                            endAngle={-270}
                                        >
                                            <PolarAngleAxis type="number" domain={[0, 100]} tick={false} axisLine={false} />
                                            <PolarRadiusAxis type="number" domain={[0, 100]} tick={false} axisLine={false} />
                                            <RadialBar
                                                minAngle={15}
                                                background={{ fill: 'none' }}
                                                clockWise
                                                dataKey="value"
                                                cornerRadius={10}
                                                stroke="none"
                                            />
                                            <Tooltip
                                                contentStyle={{ backgroundColor: '#18181b', borderRadius: '8px', border: '1px solid #333' }}
                                                itemStyle={{ color: '#fff' }}
                                                formatter={(value) => [`${value.toFixed(1)}%`, 'Share']}
                                                cursor={{ fill: 'transparent', stroke: 'none' }}
                                            />
                                        </RadialBarChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                        ) : (
                            <div className="flex flex-col h-full relative">
                                <div className="flex items-start justify-between absolute top-0 left-0 right-0 z-10">
                                    <div>
                                        <div className="text-white text-4xl font-bold tracking-tighter">{formatRevenue(expenses.total)}</div>
                                        <div className="text-zinc-500 text-xs mt-1">Monthly Expenses</div>
                                    </div>
                                </div>

                                <div className="flex-1 flex items-center justify-center mt-8">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <RadialBarChart
                                            cx="50%"
                                            cy="50%"
                                            innerRadius="20%"
                                            outerRadius="80%"
                                            barSize={12}
                                            data={expenses.categories.map(cat => ({
                                                name: cat.name,
                                                value: (cat.amount / expenses.total) * 100,
                                                fill: cat.color,
                                                amount: cat.amount
                                            })).sort((a, b) => b.value - a.value)} // Sort by size
                                            startAngle={90}
                                            endAngle={-270}
                                            style={{ filter: 'drop-shadow(0 0 8px rgba(255, 255, 255, 0.3))' }}
                                        >
                                            <PolarAngleAxis type="number" domain={[0, 100]} tick={false} axisLine={false} />
                                            <PolarRadiusAxis type="number" domain={[0, 100]} tick={false} axisLine={false} />
                                            <RadialBar
                                                minAngle={15}
                                                background={{ fill: 'none' }}
                                                clockWise
                                                dataKey="value"
                                                cornerRadius={10}
                                                stroke="none"
                                            />
                                            <Legend
                                                iconSize={10}
                                                width={140}
                                                height={160}
                                                layout="vertical"
                                                verticalAlign="middle"
                                                align="right"
                                                wrapperStyle={{ right: 0, top: '50%', transform: 'translateY(-50%)', lineHeight: '24px' }}
                                                content={({ payload }) => (
                                                    <ul className="flex flex-col gap-2">
                                                        {payload.map((entry, index) => (
                                                            <li key={`item-${index}`} className="flex items-center justify-between text-xs w-full">
                                                                <div className="flex items-center gap-2">
                                                                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: entry.color }}></div>
                                                                    <span className="text-zinc-400">{entry.value}</span>
                                                                </div>
                                                                <span className="text-white font-medium ml-4">
                                                                    {/* We need to find the payload data to get the amount/percent */}
                                                                    {/* entry.payload.value is likely the % */}
                                                                    {/* Actually entry.payload contains the original data object in newer Recharts versions, 
                                                                        but let's rely on entry.payload.value for now or pass custom formatter */}
                                                                    {Math.round(entry.payload.value)}%
                                                                </span>
                                                            </li>
                                                        ))}
                                                    </ul>
                                                )}
                                            />
                                            <Tooltip
                                                contentStyle={{ backgroundColor: '#18181b', borderRadius: '8px', border: '1px solid #333' }}
                                                itemStyle={{ color: '#fff' }}
                                                formatter={(value, name, props) => [`${formatRevenue(props.payload.amount)} (${value.toFixed(1)}%)`, props.payload.name]}
                                                cursor={{ fill: 'transparent', stroke: 'none' }}
                                            />
                                        </RadialBarChart>
                                    </ResponsiveContainer>
                                </div>

                                {/* Bottom Metric Cards */}
                                <div className="mt-4 pt-4 border-t border-white/5 grid grid-cols-3 gap-3 relative z-10">
                                    <div className="bg-zinc-900/40 rounded-lg p-3 border border-white/5">
                                        <div className="text-zinc-400 text-[9px] uppercase tracking-wider font-bold">Paid</div>
                                        <div className="text-white text-xl font-bold mt-1">{formatRevenue(expenses.paid)}</div>
                                    </div>
                                    <div className="bg-zinc-900/40 rounded-lg p-3 border border-white/5">
                                        <div className="text-zinc-400 text-[9px] uppercase tracking-wider font-bold">Pending</div>
                                        <div className="text-red-400 text-xl font-bold mt-1">{formatRevenue(expenses.pending)}</div>
                                    </div>
                                    <div className="bg-zinc-900/40 rounded-lg p-3 border border-white/5">
                                        <div className="text-zinc-400 text-[9px] uppercase tracking-wider font-bold">Top: AI</div>
                                        <div className="text-violet-400 text-xl font-bold mt-1">{formatRevenue(expenses.categories.find(c => c.name === 'AI Services')?.amount || 0)}</div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </Widget>

                    {/* Widget 8: Clients */}
                    <Widget id="clients" title="Clients" subtitle="Client Portfolio" size={widgetStates.clients} onSizeChange={handleWidgetSizeChange}>
                        {widgetStates.clients === 'small' ? (
                            <div className="flex flex-col justify-center h-full items-center">
                                <div className="relative">
                                    <div className="text-white text-6xl font-bold tracking-tighter drop-shadow-[0_0_20px_rgba(255,255,255,0.3)]">
                                        {clients.total}
                                    </div>
                                    <div className="absolute -top-1 -right-4 w-2 h-2 bg-white rounded-full shadow-[0_0_10px_#ffffff] animate-pulse"></div>
                                </div>
                                <div className="text-zinc-500 text-[10px] tracking-[0.2em] font-medium mt-2 uppercase">Total Clients</div>
                                <div className="mt-4 flex gap-3 text-[10px] font-medium">
                                    <span className="text-zinc-300 drop-shadow-[0_0_5px_rgba(255,255,255,0.2)]">{clients.active} Active</span>
                                    <span className="text-zinc-600">|</span>
                                    <span className="text-zinc-500">{clients.inContact} Contacting</span>
                                </div>
                            </div>
                        ) : widgetStates.clients === 'medium' ? (
                            <div className="flex h-full items-center">
                                {/* Part 1: Main Stat (30%) */}
                                <div className="w-[28%] flex flex-col items-center justify-center border-r border-white/5 h-full pr-4">
                                    <div className="text-white text-5xl font-bold tracking-tighter drop-shadow-[0_0_15px_rgba(255,255,255,0.3)]">
                                        {clients.total}
                                    </div>
                                    <div className="text-zinc-500 text-[9px] font-bold uppercase tracking-[0.2em] mt-1">Total Clients</div>
                                </div>

                                {/* Part 2: Key Stats (36%) */}
                                <div className="w-[36%] flex flex-col justify-center gap-1.5 border-r border-white/5 h-full px-4">
                                    <div className="flex items-center justify-between group">
                                        <div className="flex items-center gap-2">
                                            <div className="w-1.5 h-1.5 rounded-full bg-blue-400"></div>
                                            <span className="text-zinc-500 text-[9px] font-bold uppercase">Active</span>
                                        </div>
                                        <span className="text-white font-bold text-xs">{clients.active}</span>
                                    </div>
                                    <div className="flex items-center justify-between group">
                                        <div className="flex items-center gap-2">
                                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400"></div>
                                            <span className="text-zinc-500 text-[9px] font-bold uppercase">Contacting</span>
                                        </div>
                                        <span className="text-white font-bold text-xs">{clients.inContact}</span>
                                    </div>
                                    <div className="mt-1 flex items-center justify-between bg-white/5 rounded-md px-2 py-1 border border-white/5">
                                        <span className="text-zinc-400 text-[8px] font-bold uppercase">Growth</span>
                                        <span className="text-white font-bold text-[10px]">+{clients.growth}%</span>
                                    </div>
                                </div>

                                {/* Part 3: Flow Visualization (36%) - Candlestick Pill Style */}
                                <div className="flex-1 h-full pl-3 py-1 flex flex-col justify-center translate-y-2">
                                    <div className="text-[8px] text-zinc-600 font-bold uppercase tracking-widest mb-1 text-right pr-2">Distribution</div>
                                    <div className="h-20 w-full relative flex items-end justify-center gap-[6px] px-4 group/bars">
                                        {/* Custom Candlestick Bars */}
                                        {clients.byIndustry.slice(0, 8).map((item, index) => {
                                            const maxCount = Math.max(...clients.byIndustry.map(i => i.count)) || 1;
                                            const heightPercentage = (item.count / maxCount) * 100;
                                            const opacity = 0.7 + (heightPercentage / 100) * 0.3;
                                            const percentOfTotal = Math.round((item.count / clients.total) * 100);

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
                                                            <div className="text-zinc-400 text-[9px] font-medium tracking-wide">{item.name}</div>
                                                            <div className="text-white font-bold text-sm mt-0.5">{item.count} clients</div>
                                                            <div className="text-emerald-400 text-[9px] mt-0.5">{percentOfTotal}%</div>
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
                                        <div className="text-3xl font-bold text-white">{clients.total}</div>
                                        <div className="text-zinc-500 text-xs">Total Clients</div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-white font-bold text-xl">+{clients.growth}%</div>
                                        <div className="text-zinc-500 text-[9px]">GROWTH</div>
                                    </div>
                                </div>

                                <div className="flex-1 flex gap-4 min-h-0 pl-2">
                                    {/* Funnel Chart - using BarChart horizontal */}
                                    <div className="flex-1">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <BarChart layout="vertical" data={clients.byIndustry} margin={{ left: 10, right: 10, top: 0, bottom: 0 }} barSize={16}>
                                                <CartesianGrid horizontal={false} stroke="#27272a" strokeDasharray="3 3" />
                                                <XAxis type="number" hide />
                                                <YAxis dataKey="name" type="category" width={80} tick={{ fill: '#d4d4d8', fontSize: 11, fontWeight: 500 }} axisLine={false} tickLine={false} interval={0} />
                                                <Tooltip cursor={{ fill: 'rgba(255,255,255,0.05)' }} content={<MinimalTooltip />} />
                                                <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                                                    {clients.byIndustry.map((entry, index) => (
                                                        <Cell key={`cell-${index}`} fill={['#333', '#444', '#666', '#a1a1aa', '#fff'][index % 5]} />
                                                    ))}
                                                </Bar>
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </div>

                                    {/* Conversion Stats on side for Large */}
                                    {widgetStates.clients === 'large' && (
                                        <div className="w-1/3 flex flex-col justify-center gap-2 border-l border-white/5 pl-4">
                                            <div className="text-xs text-zinc-400 mb-1">Breakdown</div>
                                            <div className="flex justify-between items-center text-[10px]">
                                                <span className="text-zinc-500">Active</span>
                                                <span className="text-white font-bold">{clients.active}</span>
                                            </div>
                                            <div className="w-full bg-zinc-800 h-1 rounded-full overflow-hidden mb-2">
                                                <div className="bg-white h-full" style={{ width: `${(clients.active / clients.total) * 100}%` }} />
                                            </div>

                                            <div className="flex justify-between items-center text-[10px]">
                                                <span className="text-zinc-500">Contacting</span>
                                                <span className="text-white font-bold">{clients.inContact}</span>
                                            </div>
                                            <div className="w-full bg-zinc-800 h-1 rounded-full overflow-hidden mb-2">
                                                <div className="bg-zinc-400 h-full" style={{ width: `${(clients.inContact / clients.total) * 100}%` }} />
                                            </div>

                                            <div className="flex justify-between items-center text-[10px]">
                                                <span className="text-zinc-500">New</span>
                                                <span className="text-zinc-600 font-bold">{clients.newThisMonth}</span>
                                            </div>
                                            <div className="w-full bg-zinc-800 h-1 rounded-full overflow-hidden">
                                                <div className="bg-zinc-600 h-full" style={{ width: `${(clients.newThisMonth / clients.total) * 100}%` }} />
                                            </div>
                                        </div>
                                    )}
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

                        <div className="p-6">
                            {/* Task Type Selection */}
                            <div className="mb-5">
                                <label className="block text-sm font-medium text-zinc-300 mb-3">
                                    Task Type
                                </label>
                                <div className="grid grid-cols-3 gap-3">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setTaskViewMode('create-project');
                                            setTaskType('project');
                                        }}
                                        className={`px-4 py-3 rounded-lg border transition-all ${
                                            taskViewMode === 'create-project'
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
                                            setTaskViewMode('create-other');
                                            setTaskType('other');
                                            setNewExecutiveTask({ ...newExecutiveTask, projectId: '' });
                                        }}
                                        className={`px-4 py-3 rounded-lg border transition-all ${
                                            taskViewMode === 'create-other'
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
                                            setTaskViewMode('review');
                                            fetchAssignedTasks();
                                        }}
                                        className={`px-4 py-3 rounded-lg border transition-all ${
                                            taskViewMode === 'review'
                                                ? 'bg-white/10 border-white text-white shadow-[0_0_20px_rgba(255,255,255,0.4)]'
                                                : 'bg-black/30 border-white/10 text-zinc-400 hover:border-white/20 hover:shadow-[0_0_20px_rgba(255,255,255,0.3)]'
                                        }`}
                                    >
                                        <div className="text-sm font-medium">Review Assigned Tasks</div>
                                        <div className="text-xs mt-1 opacity-75">View all tasks to Manager/HR</div>
                                    </button>
                                </div>
                            </div>

                            {/* Conditional Rendering Based on View Mode */}
                            {taskViewMode === 'review' ? (
                                <div className="max-h-[55vh] overflow-y-auto">
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
                                                <div 
                                                    key={task._id} 
                                                    className="bg-black/30 border border-white/10 rounded-xl overflow-hidden hover:border-white/20 transition-all cursor-pointer"
                                                    onClick={() => setExpandedTaskId(expandedTaskId === task._id ? null : task._id)}
                                                >
                                                    <div className="p-4">
                                                        <div className="flex items-start justify-between mb-2">
                                                            <div className="flex-1">
                                                                <h3 className="text-white font-semibold mb-2">{task.description}</h3>
                                                                <div className="flex flex-wrap gap-2 text-xs">
                                                                    <div className="flex items-center gap-1 text-zinc-400">
                                                                        <UserCheck className="h-3 w-3" />
                                                                        <span><span className="text-white">{task.assignedTo?.firstName} {task.assignedTo?.lastName}</span> ({task.assignedToType?.toUpperCase()})</span>
                                                                    </div>
                                                                    {task.projectId && (
                                                                        <div className="flex items-center gap-1 text-zinc-400">
                                                                            <Briefcase className="h-3 w-3" />
                                                                            <span className="text-white">{task.projectId.name}</span>
                                                                        </div>
                                                                    )}
                                                                    <div className="flex items-center gap-1 text-zinc-400">
                                                                        <Clock className="h-3 w-3" />
                                                                        <span className="text-white">{new Date(task.executiveDeadline).toLocaleDateString()}</span>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                                                                task.status === 'completed' ? 'bg-green-500/20 text-green-300' :
                                                                task.status === 'delegated' ? 'bg-blue-500/20 text-blue-300' :
                                                                task.status === 'accepted' ? 'bg-yellow-500/20 text-yellow-300' :
                                                                'bg-zinc-500/20 text-zinc-300'
                                                            }`}>
                                                                {task.status.toUpperCase()}
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Expanded Details */}
                                                    {expandedTaskId === task._id && (
                                                        <div className="px-4 pb-4 space-y-3 border-t border-white/10 pt-3">
                                                            {/* Task Description Full */}
                                                            <div>
                                                                <div className="text-xs text-zinc-500 mb-1">Full Description:</div>
                                                                <div className="text-sm text-white bg-black/30 p-3 rounded-lg">{task.description}</div>
                                                            </div>

                                                            {/* Assigned By */}
                                                            <div className="grid grid-cols-2 gap-3">
                                                                <div>
                                                                    <div className="text-xs text-zinc-500 mb-1">Assigned By:</div>
                                                                    <div className="text-sm text-white">{task.assignedBy?.firstName} {task.assignedBy?.lastName}</div>
                                                                    <div className="text-xs text-zinc-400 capitalize">{task.assignedByRole}</div>
                                                                </div>
                                                                <div>
                                                                    <div className="text-xs text-zinc-500 mb-1">Assigned To:</div>
                                                                    <div className="text-sm text-white">{task.assignedTo?.firstName} {task.assignedTo?.lastName}</div>
                                                                    <div className="text-xs text-zinc-400">{task.assignedTo?.email}</div>
                                                                </div>
                                                            </div>

                                                            {/* Project Details */}
                                                            {task.projectId && (
                                                                <div>
                                                                    <div className="text-xs text-zinc-500 mb-1">Project Details:</div>
                                                                    <div className="bg-black/30 p-3 rounded-lg">
                                                                        <div className="text-sm text-white font-medium mb-1">{task.projectId.name}</div>
                                                                        {task.projectId.description && (
                                                                            <div className="text-xs text-zinc-400">{task.projectId.description}</div>
                                                                        )}
                                                                        {task.projectId.clientName && (
                                                                            <div className="text-xs text-zinc-400 mt-1">Client: {task.projectId.clientName}</div>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            )}

                                                            {/* Deadlines */}
                                                            <div className="grid grid-cols-2 gap-3">
                                                                <div>
                                                                    <div className="text-xs text-zinc-500 mb-1">Executive Deadline:</div>
                                                                    <div className="text-sm text-white">{new Date(task.executiveDeadline).toLocaleString()}</div>
                                                                </div>
                                                                {task.delegatedTask && (
                                                                    <div>
                                                                        <div className="text-xs text-zinc-500 mb-1">Developer Deadline:</div>
                                                                        <div className="text-sm text-white">{new Date(task.delegatedTask.deadline).toLocaleString()}</div>
                                                                    </div>
                                                                )}
                                                            </div>

                                                            {/* Delegated Task Info */}
                                                            {task.delegatedTask && (
                                                                <div>
                                                                    <div className="text-xs text-zinc-500 mb-1">Delegated To:</div>
                                                                    <div className="bg-blue-500/10 border border-blue-500/30 p-3 rounded-lg">
                                                                        <div className="flex items-center gap-2 mb-2">
                                                                            <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center">
                                                                                <Users className="h-4 w-4 text-blue-400" />
                                                                            </div>
                                                                            <div>
                                                                                <div className="text-sm text-white font-medium">{task.delegatedTask.assignedTo?.firstName} {task.delegatedTask.assignedTo?.lastName}</div>
                                                                                <div className="text-xs text-blue-300 capitalize">{task.delegatedTask.assignedTo?.role}</div>
                                                                            </div>
                                                                        </div>
                                                                        {task.delegatedTask.points && (
                                                                            <div className="text-xs text-zinc-400">Points: <span className="text-blue-400 font-medium">{task.delegatedTask.points}</span></div>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            )}

                                                            {/* Notes */}
                                                            {task.notes && (
                                                                <div>
                                                                    <div className="text-xs text-zinc-500 mb-1">Notes:</div>
                                                                    <div className="text-sm text-white bg-black/30 p-3 rounded-lg">{task.notes}</div>
                                                                </div>
                                                            )}

                                                            {/* Timestamps */}
                                                            <div className="flex justify-between text-xs text-zinc-500 pt-2 border-t border-white/10">
                                                                <div>Created: {new Date(task.createdAt).toLocaleString()}</div>
                                                                <div>Updated: {new Date(task.updatedAt).toLocaleString()}</div>
                                                            </div>
                                                        </div>
                                                    )}

                                                    {task.delegatedTask && expandedTaskId !== task._id && (
                                                        <div className="px-4 pb-3 text-xs">
                                                            <div className="text-zinc-400">Delegated to: <span className="text-white">{task.delegatedTask.assignedTo?.firstName} {task.delegatedTask.assignedTo?.lastName}</span></div>
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <form onSubmit={handleCreateExecutiveTask} className="space-y-5">
                            {/* Task Description */}
                            <div>
                                <label className="block text-sm font-medium text-zinc-300 mb-2">
                                    Task Description
                                </label>
                                <textarea
                                    required
                                    value={newExecutiveTask.description}
                                    onChange={(e) => setNewExecutiveTask({ ...newExecutiveTask, description: e.target.value })}
                                    rows={3}
                                    className="w-full px-4 py-3 bg-black/50 border border-white/10 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-white/20 transition-all"
                                    placeholder="Brief task description..."
                                />
                            </div>

                            {/* Assign To Manager/HR */}
                            <div>
                                <label className="block text-sm font-medium text-zinc-300 mb-2">
                                    Assign To (Manager/HR)
                                </label>
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
                                    <label className="block text-sm font-medium text-zinc-300 mb-2">
                                        Related Project
                                    </label>
                                    <select
                                        required={taskType === 'project'}
                                        value={newExecutiveTask.projectId}
                                        onChange={(e) => setNewExecutiveTask({ ...newExecutiveTask, projectId: e.target.value })}
                                        className="w-full px-4 py-3 bg-black/50 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-white/20 transition-all"
                                    >
                                        <option value="">-- Select Project --</option>
                                        {projects.map((project) => (
                                            <option key={project._id} value={project._id} className="bg-zinc-900">
                                                {project.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            {/* Deadline */}
                            <div>
                                <label className="block text-sm font-medium text-zinc-300 mb-2">
                                    Deadline
                                </label>
                                <input
                                    type="date"
                                    required
                                    value={newExecutiveTask.deadline}
                                    onChange={(e) => setNewExecutiveTask({ ...newExecutiveTask, deadline: e.target.value })}
                                    min={new Date().toISOString().split('T')[0]}
                                    className="w-full px-4 py-3 bg-black/50 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-white/20 transition-all"
                                />
                            </div>

                            {/* Submit Button */}
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
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div >
    );
};

export default CEOSummaryWidgets;
