import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence, LayoutGroup } from 'framer-motion';
import {
    X,
    ArrowUpRight,
    ArrowUp,
    User,
    Users,
    Mail,
    Shield,
    Briefcase,
    Calendar,
    MapPin,
    Phone,
    FileText,
    Clock,
    CheckCircle2,
    AlertCircle,
    Building2,
    Hash,
    TrendingUp,
    DollarSign,
    BarChart2,
    Target,
    FolderKanban,
    ChevronLeft,
    ChevronRight
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
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';

// Minimal Tooltip Component - CoFounder Dashboard Style
// Minimal Tooltip Component - CoFounder Dashboard Style
const MinimalTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
        // Special layout for Tasks Chart
        const data = payload[0].payload;
        if (data && data.tasks !== undefined) {
            return (
                <div className="bg-[#09090b] px-4 py-3 rounded-xl border border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.5)] min-w-[140px]">
                    <div className="flex items-center justify-between mb-2 pb-2 border-b border-white/5">
                        <span className="text-zinc-400 text-[10px] font-bold uppercase tracking-widest">{data.day}</span>
                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${data.active ? 'bg-cyan-500/10 text-cyan-400' : 'bg-zinc-800 text-zinc-500'}`}>
                            {data.active ? 'Current Week' : 'Last Week'}
                        </span>
                    </div>
                    <div className="flex items-baseline gap-1.5">
                        <span className="text-2xl font-black text-white">{data.tasks}</span>
                        <span className="text-xs font-bold text-zinc-500 uppercase tracking-wide">Tasks Done</span>
                    </div>
                </div>
            );
        }

        // Special layout for Project Hours Graph
        if (data && data.hours !== undefined) {
            return (
                <div className="bg-[#09090b] px-4 py-3 rounded-xl border border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.5)] min-w-[140px]">
                    <div className="flex items-center justify-between mb-2 pb-2 border-b border-white/5">
                        <span className="text-zinc-400 text-[10px] font-bold uppercase tracking-widest">{data.day}</span>
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 uppercase tracking-wider">
                            Logged
                        </span>
                    </div>
                    <div className="flex items-baseline gap-1.5">
                        <span className="text-2xl font-black text-white">{data.hours}</span>
                        <span className="text-xs font-bold text-zinc-500 uppercase tracking-wide">Hours</span>
                    </div>
                    <div className="mt-2 text-[9px] text-zinc-600 font-medium">
                        {data.hours > 6 ? 'High Productivity 🚀' : 'Standard Activity'}
                    </div>
                </div>
            );
        }

        // Generic fallback for other charts
        return (
            <div className="bg-black/90 backdrop-blur-xl px-3 py-2 rounded-lg border border-white/5 shadow-2xl">
                {label && typeof label === 'string' && (
                    <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest mb-1 px-0.5">
                        {label}
                    </p>
                )}
                {payload.map((item, index) => (
                    <div className="flex flex-col" key={index}>
                        <div className="flex items-center gap-2">
                            <div
                                className="w-1.5 h-1.5 rounded-full"
                                style={{ backgroundColor: item.color || item.fill }}
                            />
                            <span className="text-white font-bold text-xs uppercase tracking-wider">
                                {item.name || 'Value'}
                            </span>
                        </div>
                        <div className="mt-1 flex flex-col gap-0.5 pl-3.5">
                            <span className="text-white font-black text-sm">
                                {Array.isArray(item.value)
                                    ? `${item.value[0]} - ${item.value[1]}`
                                    : typeof item.value === 'number'
                                        ? item.value.toLocaleString()
                                        : item.value
                                }
                            </span>
                        </div>
                    </div>
                ))}
            </div>
        );
    }
    return null;
};

// Widget Header Component - CoFounder Dashboard Style
const WidgetHeader = ({ title, subtitle, icon: Icon }) => (
    <div className="flex items-start justify-between mb-3 z-10 relative">
        <div>
            <h3 className="text-transparent bg-clip-text bg-gradient-to-r from-white to-zinc-400 font-bold text-sm tracking-wide flex items-center gap-2">
                {Icon && <Icon size={14} className="text-cyan-400" />}
                {title}
            </h3>
            {subtitle && <p className="text-zinc-500 text-[10px] mt-0.5 font-medium tracking-wider uppercase">{subtitle}</p>}
        </div>
    </div>
);

// Resizable Widget Component with Drag Handle - Exact CoFounder Dashboard Style
const AnalyticsWidget = ({
    id,
    title,
    subtitle,
    icon,
    size,
    onSizeChange,
    children,
}) => {
    const [isDragging, setIsDragging] = useState(false);
    const [dragStartY, setDragStartY] = useState(0);
    const [initialSize, setInitialSize] = useState(size);

    useEffect(() => {
        setInitialSize(size);
    }, [size]);

    const getGridClass = () => {
        switch (size) {
            case 'small': return 'col-span-1 row-span-1 h-[220px]';
            case 'medium': return 'col-span-2 row-span-1 h-[220px]';
            case 'large': return 'col-span-2 row-span-2 h-[464px]';
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
            className={`relative rounded-[20px] bg-gradient-to-b from-[#18181b] to-[#09090b] border border-white/5 shadow-2xl overflow-hidden group outline-none focus:outline-none ${getGridClass()}`}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
        >
            <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/0 to-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />

            <motion.div layout className="relative p-4 h-full flex flex-col">
                <WidgetHeader title={title} subtitle={subtitle} icon={icon} />
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
                        <div className={`w-[3px] h-[3px] rounded-full transition-all ${isDragging ? 'bg-cyan-400' : 'bg-white/50'}`} />
                    </div>
                    <div className="flex gap-[2px]">
                        <div className={`w-[3px] h-[3px] rounded-full transition-all ${isDragging ? 'bg-cyan-400' : 'bg-white/50'}`} />
                        <div className={`w-[3px] h-[3px] rounded-full transition-all ${isDragging ? 'bg-cyan-400' : 'bg-white/50'}`} />
                    </div>
                    <div className="flex gap-[2px]">
                        <div className={`w-[3px] h-[3px] rounded-full transition-all ${isDragging ? 'bg-cyan-400' : 'bg-white/50'}`} />
                        <div className={`w-[3px] h-[3px] rounded-full transition-all ${isDragging ? 'bg-cyan-400' : 'bg-white/50'}`} />
                        <div className={`w-[3px] h-[3px] rounded-full transition-all ${isDragging ? 'bg-cyan-400' : 'bg-white/50'}`} />
                    </div>
                </div>
            </div>
        </motion.div>
    );
};

const QuickDetailsPanel = ({ item, onClose }) => {
    const navigate = useNavigate();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(false);

    const [error, setError] = useState(null);
    const [isExpanded, setIsExpanded] = useState(false);
    const [isClosing, setIsClosing] = useState(false);
    const [payrollDate, setPayrollDate] = useState(new Date());


    // Widget Sizes State with localStorage persistence - CoFounder Dashboard Style
    const [widgetSizes, setWidgetSizes] = useState(() => {
        const defaults = {
            attendance: 'small',
            tasks: 'small',
            projects: 'small',
            progress: 'small',
            payroll: 'small'
        };
        const saved = localStorage.getItem('employeeAnalyticsWidgetSizes_v1');
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

    // Project Widget Sizes State
    const [projectWidgetSizes, setProjectWidgetSizes] = useState(() => {
        const defaults = {
            projectProgress: 'small',
            projectTimeline: 'small',
            projectTasks: 'small',
            projectTeam: 'small'
        };
        const saved = localStorage.getItem('projectAnalyticsWidgetSizes_v3');
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

    // Save widget sizes to localStorage
    useEffect(() => {
        localStorage.setItem('employeeAnalyticsWidgetSizes_v1', JSON.stringify(widgetSizes));
    }, [widgetSizes]);

    // Save project widget sizes to localStorage
    useEffect(() => {
        localStorage.setItem('projectAnalyticsWidgetSizes_v3', JSON.stringify(projectWidgetSizes));
    }, [projectWidgetSizes]);

    // Handle widget size change
    const handleWidgetSizeChange = (id, newSize) => {
        setWidgetSizes(prev => ({ ...prev, [id]: newSize }));
    };

    // Handle project widget size change
    const handleProjectWidgetSizeChange = (id, newSize) => {
        setProjectWidgetSizes(prev => ({ ...prev, [id]: newSize }));
    };

    // Generate dynamic task activity data (Last Week + Current Week)
    // Generate dynamic task activity data (Last Week + Current Week)
    const taskActivityData = useMemo(() => {
        const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const now = new Date();
        const currentDayIndex = now.getDay();
        const activity = [];

        let globalIndex = 0;

        // Visualizer pattern generator
        const getWaveValues = (index) => {
            const center = 50;
            // Sine wave pattern for flow
            const wave = Math.sin(index * 0.6) * 20;
            // Random noise for organic look
            const noise = (Math.random() - 0.5) * 20;

            // Calculate dynamic height
            let height = 30 + Math.abs(wave) + noise;
            height = Math.max(15, Math.min(80, height)); // Clamp height

            const min = center - (height / 2);
            const max = center + (height / 2);

            return [min, max];
        };

        // Last Week (Full 7 days)
        for (let i = 0; i < 7; i++) {
            const dayName = days[i];
            const tasksBase = Math.floor(Math.random() * 5) + 3;
            activity.push({
                day: dayName,
                week: 'Last Week',
                tasks: tasksBase,
                h: getWaveValues(globalIndex++),
                fullDay: `${dayName} (Last Week)`
            });
        }

        // Current Week (Up to today)
        for (let i = 0; i <= currentDayIndex; i++) {
            const dayName = days[i];
            const tasksBase = Math.floor(Math.random() * 7) + 5;
            activity.push({
                day: dayName,
                week: 'Running Week',
                tasks: tasksBase,
                h: getWaveValues(globalIndex++),
                active: true,
                fullDay: `${dayName} (This Week)`
            });
        }
        return activity;
    }, [item?.id]);

    useEffect(() => {
        if (item) {
            setIsClosing(false);
            setIsExpanded(false); // Reset expansion state when opening new item
        }
    }, [item]);

    useEffect(() => {
        if (item?.id) {
            fetchDetails();
        } else {
            setData(null);
            setError(null);
        }
    }, [item]);

    // Lock body scroll when panel is open
    // Lock body scroll when panel is open
    useEffect(() => {
        if (item) {
            const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
            document.body.style.paddingRight = `${scrollbarWidth}px`;
            document.body.style.overflow = 'hidden';
        }
        return () => {
            document.body.style.overflow = '';
            document.body.style.paddingRight = '';
        };
    }, [item]);

    const fetchDetails = async () => {
        setLoading(true);
        setError(null);
        try {
            const endpoint = item.type === 'user' ? `/users/${item.id}` : `/projects/${item.id}`;
            const response = await api.get(endpoint);

            if (response.data?.success && response.data?.data) {
                // Handle both user and project data structures
                const details = response.data.data.user || response.data.data;
                setData(details);
            } else {
                throw new Error('Failed to fetch details');
            }
        } catch (err) {
            console.error('Fetch details error:', err);
            setError('Could not load details. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleViewFullRecord = () => {
        if (!item) return;

        // Navigate based on type
        if (item.type === 'user') {
            navigate('/users');
        } else if (item.type === 'project') {
            navigate('/hr/performance');
        }

        onClose(); // Close the panel after navigation
    };

    if (!item) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[200] flex items-start justify-end p-6 pt-12 pointer-events-none">
                {/* Backdrop - Blocks background clicks */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={isClosing ? { opacity: 0 } : { opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={() => setIsClosing(true)}
                    className="absolute inset-0 bg-black/60 backdrop-blur-md cursor-pointer pointer-events-auto"
                />

                {/* Panel - Floating content on blur backdrop */}
                <motion.div
                    initial={{ x: '110%', opacity: 0 }}
                    animate={isClosing ? { x: '120%', opacity: 0 } : { x: 0, opacity: 1 }}
                    exit={{ x: '110%', opacity: 0 }}
                    onAnimationComplete={(definition) => {
                        // If we just finished the closing animation, call the actual onClose prop
                        if (isClosing) {
                            onClose();
                        }
                    }}
                    transition={{ type: 'spring', damping: 28, stiffness: 220 }}
                    className={`relative w-full ${isExpanded ? 'max-w-full h-full' : 'max-w-sm h-[calc(100vh-6rem)]'} flex flex-col overflow-visible pointer-events-auto transition-all duration-500 ease-in-out ${isExpanded ? 'bg-transparent' : 'bg-black rounded-[24px] shadow-2xl'}`}
                >
                    {/* Close Button - Always visible at top right regardless of expansion */}
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            setIsClosing(true);
                        }}
                        className="absolute top-6 right-6 z-[250] p-3 bg-black/40 hover:bg-black/60 backdrop-blur-xl rounded-full text-white/80 hover:text-white transition-all active:scale-90 border border-white/10 shadow-2xl"
                        title="Close"
                    >
                        <X size={20} />
                    </button>


                    {/* Content - No scroll here, let inner sections handle it */}
                    <div className="flex-1 flex flex-row overflow-visible min-h-0">
                        {loading ? (
                            <div className="flex flex-col items-center justify-center h-full gap-5">
                                <div className="w-12 h-12 border-4 border-primary-500/20 border-t-primary-500 rounded-full animate-spin shadow-glow-sm" />
                                <p className="text-gray-400 text-xs font-medium tracking-wide animate-pulse">Synchronizing Data...</p>
                            </div>
                        ) : error ? (
                            <div className="flex flex-col items-center justify-center h-full p-10 text-center">
                                <div className="p-5 bg-red-500/10 rounded-full text-red-400 mb-5 shadow-inner">
                                    <AlertCircle size={32} />
                                </div>
                                <h3 className="text-white font-bold text-lg mb-2">Sync Failed</h3>
                                <p className="text-gray-400 text-sm mb-8 leading-relaxed">{error}</p>
                                <button
                                    onClick={fetchDetails}
                                    className="px-8 py-3 gradient-primary text-white rounded-2xl text-sm font-bold shadow-glow-sm active:scale-95 transition-transform"
                                >
                                    Try Again
                                </button>
                            </div>
                        ) : data && (

                            <div className="h-full flex flex-row w-full">
                                {item.type === 'user' ? (
                                    <>
                                        {/* Left Panel: Full Details - HORIZONTAL LAYOUT */}
                                        <div className={`flex-1 overflow-x-auto overflow-y-auto custom-scrollbar transition-all duration-500 ${isExpanded ? 'w-auto opacity-100' : 'w-0 opacity-0 overflow-hidden'}`}>
                                            {/* Header */}
                                            <div className="px-6 pt-16 pb-4">
                                                <h2 className="text-xl font-black text-white tracking-tight">Personal File</h2>
                                                <p className="text-gray-500 text-xs mt-1">Comprehensive employee records</p>
                                            </div>

                                            {/* Horizontal Scrollable Sections */}
                                            <div className="flex flex-row gap-3 px-6 pb-6 w-full justify-between">

                                                {/* Column 1: Personal Details */}
                                                <div className="flex-1 min-w-[220px] max-w-[260px] space-y-2">
                                                    <h3 className="text-[10px] font-bold text-cyan-400 uppercase tracking-widest flex items-center gap-2 mb-3">
                                                        <User size={12} /> Personal
                                                    </h3>
                                                    <div className="space-y-2">
                                                        <div className="flex justify-between items-center py-1 border-b border-white/5">
                                                            <span className="text-[10px] text-gray-500 uppercase tracking-wider font-bold">First Name</span>
                                                            <span className="text-sm font-semibold text-white">{data.firstName}</span>
                                                        </div>
                                                        <div className="flex justify-between items-center py-1 border-b border-white/5">
                                                            <span className="text-[10px] text-gray-500 uppercase tracking-wider font-bold">Last Name</span>
                                                            <span className="text-sm font-semibold text-white">{data.lastName}</span>
                                                        </div>
                                                        <div className="flex justify-between items-center py-1 border-b border-white/5">
                                                            <span className="text-[10px] text-gray-500 uppercase tracking-wider font-bold">Email</span>
                                                            <span className="text-sm font-semibold text-white truncate max-w-[150px]" title={data.email}>{data.email}</span>
                                                        </div>
                                                        <div className="flex justify-between items-center py-1 border-b border-white/5">
                                                            <span className="text-[10px] text-gray-500 uppercase tracking-wider font-bold">Phone</span>
                                                            <span className="text-sm font-semibold text-white">{data.phoneNumber || 'N/A'}</span>
                                                        </div>
                                                        <div className="flex justify-between items-center py-1 border-b border-white/5">
                                                            <span className="text-[10px] text-gray-500 uppercase tracking-wider font-bold">DOB</span>
                                                            <span className="text-sm font-semibold text-white">{data.dateOfBirth ? new Date(data.dateOfBirth).toLocaleDateString() : 'N/A'}</span>
                                                        </div>
                                                        <div className="flex justify-between items-center py-1">
                                                            <span className="text-[10px] text-gray-500 uppercase tracking-wider font-bold">Address</span>
                                                            <span className="text-sm font-semibold text-white truncate max-w-[150px]" title={typeof data.address === 'string' ? data.address : ''}>
                                                                {typeof data.address === 'string' ? data.address : data.address ? `${data.address.city || 'N/A'}` : 'N/A'}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Column 2: Employment */}
                                                <div className="flex-1 min-w-[200px] max-w-[240px] space-y-2">
                                                    <h3 className="text-[10px] font-bold text-cyan-400 uppercase tracking-widest flex items-center gap-2 mb-3">
                                                        <Briefcase size={12} /> Employment
                                                    </h3>
                                                    <div className="space-y-2">
                                                        <div className="flex justify-between items-center py-1 border-b border-white/5">
                                                            <span className="text-[10px] text-gray-500 uppercase tracking-wider font-bold">Department</span>
                                                            <span className="text-sm font-semibold text-white">{data.department || 'N/A'}</span>
                                                        </div>
                                                        <div className="flex justify-between items-center py-1 border-b border-white/5">
                                                            <span className="text-[10px] text-gray-500 uppercase tracking-wider font-bold">Designation</span>
                                                            <span className="text-sm font-semibold text-white">{data.roleDisplay || data.role || 'N/A'}</span>
                                                        </div>
                                                        <div className="flex justify-between items-center py-1 border-b border-white/5">
                                                            <span className="text-[10px] text-gray-500 uppercase tracking-wider font-bold">Joined</span>
                                                            <span className="text-sm font-semibold text-white">{new Date(data.createdAt).toLocaleDateString()}</span>
                                                        </div>
                                                        <div className="flex justify-between items-center py-1 border-b border-white/5">
                                                            <span className="text-[10px] text-gray-500 uppercase tracking-wider font-bold">Reports To</span>
                                                            <span className="text-sm font-semibold text-white">Management</span>
                                                        </div>
                                                        <div className="flex justify-between items-center py-1">
                                                            <span className="text-[10px] text-gray-500 uppercase tracking-wider font-bold">Status</span>
                                                            <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold ${data.isActive ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                                                                {data.isActive ? 'Active' : 'Inactive'}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Column 3: Education */}
                                                <div className="flex-1 min-w-[180px] max-w-[220px] space-y-2">
                                                    <h3 className="text-[10px] font-bold text-cyan-400 uppercase tracking-widest flex items-center gap-2 mb-3">
                                                        <FileText size={12} /> Education
                                                    </h3>
                                                    {data.education && (data.education.instituteName || data.education.highestQualification) ? (
                                                        <div className="space-y-3">
                                                            <div className="p-3 bg-white/[0.02] rounded-xl border border-white/5">
                                                                <p className="text-sm font-semibold text-white">{data.education.instituteName || 'N/A'}</p>
                                                                <p className="text-xs text-gray-400 mt-1">{data.education.highestQualification || 'Degree not specified'}</p>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <p className="text-gray-500 text-sm italic">No records</p>
                                                    )}
                                                </div>

                                                {/* Column 4: Documents & Bank */}
                                                <div className="flex-1 min-w-[200px] max-w-[240px] space-y-2">
                                                    <h3 className="text-[10px] font-bold text-cyan-400 uppercase tracking-widest flex items-center gap-2 mb-3">
                                                        <Shield size={12} /> Documents
                                                    </h3>
                                                    <div className="space-y-2">
                                                        <div className="flex justify-between items-center py-1 border-b border-white/5">
                                                            <span className="text-[10px] text-gray-500 uppercase tracking-wider font-bold">PAN</span>
                                                            <span className="text-sm font-semibold text-white font-mono">{data.panDetails?.number || 'N/A'}</span>
                                                        </div>
                                                        <div className="flex justify-between items-center py-1 border-b border-white/5">
                                                            <span className="text-[10px] text-gray-500 uppercase tracking-wider font-bold">Aadhaar</span>
                                                            <span className="text-sm font-semibold text-white font-mono">
                                                                {data.aadhaarDetails?.number ? `XXXX-XXXX-${data.aadhaarDetails.number.slice(-4)}` : 'N/A'}
                                                            </span>
                                                        </div>
                                                        <div className="flex justify-between items-center py-1 border-b border-white/5">
                                                            <span className="text-[10px] text-gray-500 uppercase tracking-wider font-bold">Bank</span>
                                                            <span className="text-sm font-semibold text-white">{data.bankDetails?.bankName || 'N/A'}</span>
                                                        </div>
                                                        <div className="flex justify-between items-center py-1">
                                                            <span className="text-[10px] text-gray-500 uppercase tracking-wider font-bold">Account</span>
                                                            <span className="text-sm font-semibold text-white font-mono">{data.bankDetails?.accountNumber || 'N/A'}</span>
                                                        </div>
                                                    </div>
                                                </div>

                                            </div>

                                            {/* ========== EMPLOYEE ANALYTICS GRAPHS - CoFounder Dashboard Style ========== */}
                                            <div className="px-6 pb-6 mt-4">
                                                <div className="flex items-center justify-between mb-4">
                                                    <div>
                                                        <h2 className="text-lg font-bold text-white tracking-tight">Analytics Overview</h2>
                                                        <p className="text-zinc-500 text-[10px] mt-0.5 font-medium tracking-wider uppercase">Performance Metrics</p>
                                                    </div>
                                                    <div className="flex items-center space-x-2 bg-black/40 px-3 py-1.5 rounded-full border border-white/5 backdrop-blur-sm">
                                                        <span className="relative flex h-2 w-2">
                                                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                                            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                                                        </span>
                                                        <span className="text-[9px] font-mono text-zinc-300 font-medium tracking-wide">LIVE</span>
                                                    </div>
                                                </div>

                                                {/* Resizable Widgets Grid with LayoutGroup */}
                                                <LayoutGroup>
                                                    <motion.div layout className="grid grid-cols-4 gap-4 auto-rows-min">

                                                        {/* Widget 1: Attendance & Leave */}
                                                        <AnalyticsWidget
                                                            id="attendance"
                                                            title="Attendance"
                                                            subtitle="Today's Status"
                                                            icon={Calendar}
                                                            size={widgetSizes.attendance}
                                                            onSizeChange={handleWidgetSizeChange}
                                                        >
                                                            {widgetSizes.attendance === 'small' ? (

                                                                <div className="flex flex-col h-full relative">
                                                                    <div className="flex-1 flex flex-col items-center justify-center -mt-2">
                                                                        <div className="relative">
                                                                            <span className="text-7xl font-black text-white tracking-tighter drop-shadow-2xl">
                                                                                98%
                                                                            </span>
                                                                            <div className="absolute top-2 -right-3 w-2 h-2 rounded-full bg-emerald-400 blur-[1px] opacity-80 animate-pulse" />
                                                                        </div>
                                                                        <span className="text-[10px] text-zinc-500 font-bold tracking-[0.2em] uppercase mt-2">
                                                                            On Time Rate
                                                                        </span>
                                                                    </div>
                                                                    <div className="mt-auto pt-3 border-t border-white/5 flex items-center justify-center gap-3 text-[10px] font-medium text-zinc-400">
                                                                        <span>22 Present</span>
                                                                        <span className="text-zinc-700">|</span>
                                                                        <span>0 Late</span>
                                                                    </div>
                                                                </div>
                                                            ) : (

                                                                <div className="flex flex-col h-full">
                                                                    <div className="relative flex justify-center items-start mb-2 -mt-5 px-1 flex-shrink-0 min-h-[50px]">
                                                                        {/* Centered Main Stat */}
                                                                        <div className="flex flex-col items-center z-10">
                                                                            <div className="text-5xl font-black text-white tracking-tighter drop-shadow-[0_0_15px_rgba(255,255,255,0.3)]">
                                                                                09:30
                                                                                <span className="text-zinc-600 text-lg font-bold ml-1">AM</span>
                                                                            </div>
                                                                            <div className="text-zinc-500 text-[10px] uppercase font-bold mt-1 flex items-center gap-2 tracking-widest bg-white/5 px-3 py-0.5 rounded-full border border-white/5">
                                                                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,1)]" />
                                                                                Avg. Check-in
                                                                            </div>
                                                                        </div>

                                                                        {/* Right Aligned Stat */}
                                                                        <div className="absolute right-0 top-1 text-right">
                                                                            <div className="text-white text-xl font-bold tracking-tight">176h</div>
                                                                            <div className="text-zinc-600 text-[9px] uppercase font-extrabold tracking-wider">Total Hours</div>
                                                                        </div>
                                                                    </div>

                                                                    {widgetSizes.attendance === 'medium' && (
                                                                        <div className="flex-1 min-h-0 w-full px-2 pb-2 bg-transparent overflow-visible">
                                                                            <ResponsiveContainer width="100%" height="100%" className="overflow-visible">
                                                                                <BarChart
                                                                                    data={[
                                                                                        // Last Week (6 Days)
                                                                                        { day: 'Mon', hours: 8.5, status: 'On Time', checkIn: '09:00 AM', fullDay: 'Last Monday', week: 'Last Week' },
                                                                                        { day: 'Tue', hours: 9.2, status: 'On Time', checkIn: '09:15 AM', fullDay: 'Last Tuesday', week: 'Last Week' },
                                                                                        { day: 'Wed', hours: 7.8, status: 'Late', checkIn: '10:30 AM', fullDay: 'Last Wednesday', week: 'Last Week' },
                                                                                        { day: 'Thu', hours: 9.5, status: 'On Time', checkIn: '08:45 AM', fullDay: 'Last Thursday', week: 'Last Week' },
                                                                                        { day: 'Fri', hours: 8.0, status: 'On Time', checkIn: '09:00 AM', fullDay: 'Last Friday', week: 'Last Week' },
                                                                                        { day: 'Sat', hours: 4.5, status: 'Half Day', checkIn: '10:00 AM', fullDay: 'Last Saturday', week: 'Last Week' },

                                                                                        // Current Week (Completed Days)
                                                                                        { day: 'Mon', hours: 9.0, status: 'On Time', checkIn: '09:10 AM', fullDay: 'This Monday', week: 'Current Week' },
                                                                                        { day: 'Tue', hours: 8.8, status: 'On Time', checkIn: '09:20 AM', fullDay: 'This Tuesday', week: 'Current Week' },
                                                                                        { day: 'Wed', hours: 6.5, status: 'Early Leave', checkIn: '09:00 AM', fullDay: 'This Wednesday', week: 'Current Week' },
                                                                                    ]}
                                                                                    barSize={20}
                                                                                    margin={{ top: 20, right: 20, bottom: 0, left: 20 }}
                                                                                >
                                                                                    <defs>
                                                                                        <filter id="neonGlow" x="-50%" y="-50%" width="200%" height="200%">
                                                                                            <feGaussianBlur in="SourceAlpha" stdDeviation="3.5" result="blur" />
                                                                                            <feFlood floodColor="white" result="color" />
                                                                                            <feComposite in="color" in2="blur" operator="in" result="shadow" />
                                                                                            <feMerge>
                                                                                                <feMergeNode in="shadow" />
                                                                                                <feMergeNode in="SourceGraphic" />
                                                                                            </feMerge>
                                                                                        </filter>
                                                                                    </defs>
                                                                                    <XAxis
                                                                                        dataKey="day"
                                                                                        axisLine={false}
                                                                                        tickLine={false}
                                                                                        tick={{ fill: '#71717a', fontSize: 9, fontWeight: 700 }}
                                                                                        dy={10}
                                                                                        interval={0}
                                                                                    />
                                                                                    <YAxis hide domain={[0, 'dataMax + 4']} />
                                                                                    <Tooltip
                                                                                        cursor={{ fill: 'rgba(255,255,255,0.05)', radius: 4 }}
                                                                                        content={({ active, payload, coordinate }) => {
                                                                                            if (!active || !payload || !payload.length) return null;
                                                                                            const data = payload[0].payload;
                                                                                            return (
                                                                                                <div className="transform -translate-y-[130%] bg-[#09090b] border border-white/10 px-3 py-1.5 rounded-lg shadow-xl z-50 whitespace-nowrap">
                                                                                                    <span className="text-sm font-bold text-white tracking-tight">{data.hours} hrs</span>
                                                                                                </div>
                                                                                            );
                                                                                        }}
                                                                                    />
                                                                                    <Bar
                                                                                        dataKey="hours"
                                                                                        radius={[4, 4, 4, 4]}
                                                                                        shape={(props) => {
                                                                                            const { x, y, width, height, payload } = props;
                                                                                            const isCurrentWeek = payload.week === 'Current Week';
                                                                                            const opacity = isCurrentWeek ? 1 : 0.6;

                                                                                            return (
                                                                                                <g className="group cursor-pointer">
                                                                                                    {/* Background Track */}
                                                                                                    <rect
                                                                                                        x={x}
                                                                                                        y={props.background.y}
                                                                                                        width={width}
                                                                                                        height={props.background.height}
                                                                                                        rx={4}
                                                                                                        fill="#18181b"
                                                                                                        className="transition-colors group-hover:fill-[#27272a]"
                                                                                                    />

                                                                                                    {/* Active Fill Bar */}
                                                                                                    <rect
                                                                                                        x={x}
                                                                                                        y={y}
                                                                                                        width={width}
                                                                                                        height={height}
                                                                                                        rx={4}
                                                                                                        fill="#ffffff"
                                                                                                        opacity={opacity}
                                                                                                        style={isCurrentWeek ? { filter: 'url(#neonGlow)' } : {}}
                                                                                                        className={`transition-all duration-300 ${!isCurrentWeek ? 'group-hover:opacity-100 group-hover:drop-shadow-[0_0_8px_rgba(255,255,255,0.4)]' : ''}`}
                                                                                                    />
                                                                                                </g>
                                                                                            );
                                                                                        }}
                                                                                    />
                                                                                </BarChart>
                                                                            </ResponsiveContainer>
                                                                        </div>
                                                                    )}                                                              {/* Detailed Log - Large View Only */}
                                                                    {widgetSizes.attendance === 'large' && (
                                                                        <div className="flex-1 overflow-y-auto mt-2 pr-2 custom-scrollbar">
                                                                            <div className="flex items-center justify-between mb-3 sticky top-0 bg-[#09090b] pb-2 z-10 border-b border-white/5">
                                                                                <h4 className="text-xs font-bold text-white uppercase tracking-widest pl-1">
                                                                                    Attendance Log
                                                                                </h4>
                                                                                <span className="text-[10px] text-zinc-500 bg-white/5 px-2 py-1 rounded-md border border-white/5">
                                                                                    This Month
                                                                                </span>
                                                                            </div>

                                                                            <div className="space-y-2">
                                                                                {[
                                                                                    { date: 'Today, 10 Jan', in: '09:15 AM', out: '--:--', status: 'Active', hours: 'Running' },
                                                                                    { date: 'Yesterday, 09 Jan', in: '09:30 AM', out: '06:30 PM', status: 'On Time', hours: '9h 00m' },
                                                                                    { date: 'Wed, 08 Jan', in: '09:25 AM', out: '06:45 PM', status: 'On Time', hours: '9h 20m' },
                                                                                    { date: 'Tue, 07 Jan', in: '09:40 AM', out: '06:15 PM', status: 'Late', hours: '8h 35m' },
                                                                                    { date: 'Mon, 06 Jan', in: '09:10 AM', out: '06:20 PM', status: 'On Time', hours: '9h 10m' },
                                                                                    { date: 'Sat, 04 Jan', in: '10:00 AM', out: '02:00 PM', status: 'Half Day', hours: '4h 00m' },
                                                                                    { date: 'Fri, 03 Jan', in: '09:30 AM', out: '06:30 PM', status: 'On Time', hours: '9h 00m' }
                                                                                ].map((log, i) => (
                                                                                    <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 hover:border-white/10 transition-all group cursor-default">
                                                                                        <div>
                                                                                            <div className="text-sm font-bold text-white group-hover:text-emerald-400 transition-colors">{log.date}</div>
                                                                                            <div className="text-[10px] text-zinc-500 uppercase tracking-wider flex items-center gap-2 mt-0.5">
                                                                                                <span className="text-zinc-400">{log.in}</span>
                                                                                                <span className="text-zinc-600">-</span>
                                                                                                <span className="text-zinc-400">{log.out}</span>
                                                                                            </div>
                                                                                        </div>
                                                                                        <div className="text-right flex flex-col items-end gap-1">
                                                                                            <div className={`text-[9px] font-bold px-2 py-0.5 rounded uppercase border w-fit ${log.status === 'Active' ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 animate-pulse' :
                                                                                                log.status === 'Late' ? 'bg-amber-500/10 border-amber-500/30 text-amber-500' :
                                                                                                    'bg-zinc-500/10 border-zinc-500/30 text-zinc-400'
                                                                                                }`}>
                                                                                                {log.status}
                                                                                            </div>
                                                                                            <span className="text-[9px] text-zinc-500 font-medium">{log.hours}</span>
                                                                                        </div>
                                                                                    </div>
                                                                                ))}
                                                                            </div>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            )}
                                                        </AnalyticsWidget>

                                                        {/* Widget 2: Tasks */}
                                                        <AnalyticsWidget
                                                            id="tasks"
                                                            title="Tasks"
                                                            subtitle="Assigned Work"
                                                            icon={CheckCircle2}
                                                            size={widgetSizes.tasks}
                                                            onSizeChange={handleWidgetSizeChange}
                                                        >
                                                            {widgetSizes.tasks === 'small' ? (
                                                                <div className="flex flex-col h-full relative">
                                                                    {/* Main Content Centered */}
                                                                    <div className="flex-1 flex flex-col items-center justify-center -mt-2">
                                                                        <div className="relative">
                                                                            <span className="text-7xl font-black text-white tracking-tighter drop-shadow-2xl">
                                                                                22
                                                                            </span>
                                                                            {/* Decorative Dot */}
                                                                            <div className="absolute top-2 -right-3 w-2 h-2 rounded-full bg-cyan-400 blur-[1px] opacity-80 animate-pulse" />
                                                                        </div>
                                                                        <span className="text-[10px] text-zinc-500 font-bold tracking-[0.2em] uppercase mt-2">
                                                                            Tasks Completed
                                                                        </span>
                                                                    </div>

                                                                    {/* Footer Stats */}
                                                                    <div className="mt-auto pt-3 border-t border-white/5 flex items-center justify-center gap-3 text-[10px] font-medium text-zinc-400">
                                                                        <span>28 Total</span>
                                                                        <span className="text-zinc-700">|</span>
                                                                        <span>6 Pending</span>
                                                                    </div>
                                                                </div>
                                                            ) : (
                                                                <div className="flex flex-col h-full">
                                                                    <div className="flex justify-between items-start mb-2 px-1 flex-shrink-0">
                                                                        <div>
                                                                            <div className="text-4xl font-bold text-white tracking-tighter">22 <span className="text-zinc-500 text-2xl">/ 28</span></div>
                                                                            <div className="text-zinc-500 text-[10px] uppercase font-bold mt-1">Total Tasks</div>
                                                                        </div>
                                                                        <div className="text-right">
                                                                            <div className="text-emerald-400 text-xl font-bold">78%</div>
                                                                            <div className="text-zinc-500 text-[9px] uppercase">Rate</div>
                                                                        </div>
                                                                    </div>

                                                                    {/* Graph Area - Only visible in Medium view */}
                                                                    {widgetSizes.tasks === 'medium' && (
                                                                        <div className="flex-1 min-h-0 px-2 overflow-visible">
                                                                            <ResponsiveContainer width="100%" height="100%" className="overflow-visible">
                                                                                <BarChart data={taskActivityData} barSize={12} margin={{ top: 20, right: 20, bottom: 0, left: 20 }}>
                                                                                    <defs>
                                                                                        <filter id="cyanGlow" x="-50%" y="-50%" width="200%" height="200%">
                                                                                            <feGaussianBlur in="SourceAlpha" stdDeviation="3.5" result="blur" />
                                                                                            <feFlood floodColor="#22d3ee" result="color" />
                                                                                            <feComposite in="color" in2="blur" operator="in" result="shadow" />
                                                                                            <feMerge>
                                                                                                <feMergeNode in="shadow" />
                                                                                                <feMergeNode in="SourceGraphic" />
                                                                                            </feMerge>
                                                                                        </filter>
                                                                                    </defs>
                                                                                    <XAxis dataKey="day" hide padding={{ left: 10, right: 10 }} />
                                                                                    <YAxis hide domain={[0, 'dataMax + 4']} />
                                                                                    <Tooltip
                                                                                        cursor={{ fill: 'transparent' }}
                                                                                        content={(props) => (
                                                                                            <div className="transform -translate-y-[120%] z-50">
                                                                                                <MinimalTooltip {...props} />
                                                                                            </div>
                                                                                        )}
                                                                                    />
                                                                                    <Bar
                                                                                        dataKey="h"
                                                                                        name="Activity"
                                                                                        fill="#ffffff"
                                                                                        shape={(props) => {
                                                                                            const { x, y, width, height, fill, payload } = props;
                                                                                            const isActive = payload.active;
                                                                                            const barColor = isActive ? '#22d3ee' : '#3f3f46';
                                                                                            const opacity = isActive ? 1 : 0.5;

                                                                                            return (
                                                                                                <g className="transition-all duration-500">
                                                                                                    <rect
                                                                                                        x={x + width / 2 - 2}
                                                                                                        y={y}
                                                                                                        width={4}
                                                                                                        height={height}
                                                                                                        fill={barColor}
                                                                                                        opacity={opacity}
                                                                                                        rx={2}
                                                                                                    />
                                                                                                    <circle
                                                                                                        cx={x + width / 2}
                                                                                                        cy={y}
                                                                                                        r={4}
                                                                                                        fill={barColor}
                                                                                                        opacity={opacity}
                                                                                                        style={isActive ? { filter: 'url(#cyanGlow)' } : {}}
                                                                                                        className={!isActive ? '' : ''}
                                                                                                    />
                                                                                                    <circle
                                                                                                        cx={x + width / 2}
                                                                                                        cy={y + height}
                                                                                                        r={4}
                                                                                                        fill={barColor}
                                                                                                        opacity={opacity}
                                                                                                        style={isActive ? { filter: 'url(#cyanGlow)' } : {}}
                                                                                                        className={!isActive ? '' : ''}
                                                                                                    />
                                                                                                </g>
                                                                                            );
                                                                                        }}
                                                                                    />
                                                                                </BarChart>
                                                                            </ResponsiveContainer>
                                                                        </div>
                                                                    )}

                                                                    {/* Extended Details (List) - Only visible in Large view (Replaces Graph) */}
                                                                    {widgetSizes.tasks === 'large' && (
                                                                        <div className="flex-1 overflow-y-auto mt-2 pr-2 custom-scrollbar">
                                                                            <div className="flex items-center justify-between mb-3 sticky top-0 bg-[#09090b] pb-2 z-10 border-b border-white/5">
                                                                                <h4 className="text-xs font-bold text-white uppercase tracking-widest pl-1">
                                                                                    Active Tasks
                                                                                </h4>
                                                                                <span className="text-[10px] text-zinc-500 bg-white/5 px-2 py-1 rounded-md border border-white/5">
                                                                                    Priority Sort
                                                                                </span>
                                                                            </div>

                                                                            <div className="space-y-2">
                                                                                {[
                                                                                    { title: 'Update Dashboard UI', project: 'Internal Tool', status: 'In Progress', priority: 'High', due: 'Today' },
                                                                                    { title: 'Fix Login API', project: 'Client Portal', status: 'Pending', priority: 'High', due: 'Tomorrow' },
                                                                                    { title: 'Client Meeting Prep', project: 'Marketing', status: 'Done', priority: 'Medium', due: 'Yesterday' },
                                                                                    { title: 'Database Optimization', project: 'Backend', status: 'Done', priority: 'Low', due: '2 days ago' },
                                                                                    { title: 'Mobile Responsiveness', project: 'Website', status: 'In Progress', priority: 'Medium', due: 'Fri' },
                                                                                    { title: 'Analytics Integration', project: 'Dashboard', status: 'In Progress', priority: 'High', due: 'Next Week' },
                                                                                    { title: 'User Onboarding Flow', project: 'Product', status: 'Pending', priority: 'High', due: 'Mon' },
                                                                                    { title: 'Server Maintenance', project: 'DevOps', status: 'Done', priority: 'Low', due: 'Last Week' }
                                                                                ].map((task, i) => (
                                                                                    <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 hover:border-white/10 transition-all group cursor-default">
                                                                                        <div className="flex items-center gap-3">
                                                                                            <div className={`w-2 h-2 rounded-full shadow-[0_0_8px_currentColor] flex-shrink-0 ${task.status === 'In Progress' ? 'bg-cyan-400 text-cyan-400 animate-pulse' : task.status === 'Done' ? 'bg-emerald-500 text-emerald-500' : 'bg-amber-500 text-amber-500'}`} />
                                                                                            <div className="min-w-0">
                                                                                                <div className="text-sm font-bold text-white group-hover:text-cyan-400 transition-colors truncate">{task.title}</div>
                                                                                                <div className="text-[10px] text-zinc-500 uppercase tracking-wider flex items-center gap-2 truncate">
                                                                                                    <span className="truncate">{task.project}</span>
                                                                                                    <span className="w-1 h-1 rounded-full bg-zinc-700 flex-shrink-0" />
                                                                                                    <span className={task.priority === 'High' ? 'text-rose-400' : 'text-zinc-500'}>{task.priority} Priority</span>
                                                                                                </div>
                                                                                            </div>
                                                                                        </div>
                                                                                        <div className="text-right pl-2">
                                                                                            <div className={`text-[9px] font-bold px-2 py-1 rounded-lg uppercase border whitespace-nowrap ${task.status === 'In Progress' ? 'bg-cyan-500/5 border-cyan-500/20 text-cyan-400' :
                                                                                                task.status === 'Done' ? 'bg-emerald-500/5 border-emerald-500/20 text-emerald-400' :
                                                                                                    'bg-amber-500/5 border-amber-500/20 text-amber-500'
                                                                                                }`}>
                                                                                                {task.status}
                                                                                            </div>
                                                                                        </div>
                                                                                    </div>
                                                                                ))}
                                                                            </div>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            )}
                                                        </AnalyticsWidget>

                                                        {/* Widget 3: Projects */}
                                                        {/* Widget 3: Projects */}
                                                        <AnalyticsWidget
                                                            id="projects"
                                                            title="Projects"
                                                            subtitle="Active Work"
                                                            icon={FolderKanban}
                                                            size={widgetSizes.projects}
                                                            onSizeChange={handleWidgetSizeChange}
                                                        >
                                                            {widgetSizes.projects === 'small' ? (
                                                                <div className="flex flex-col justify-between h-full py-2">
                                                                    <div className="flex justify-end">
                                                                        <span className="text-[9px] font-bold bg-white/10 text-white px-1.5 py-0.5 rounded border border-white/10">2 Critical</span>
                                                                    </div>
                                                                    <div className="flex flex-col items-center -mt-4">
                                                                        <div className="text-6xl font-black text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.5)] tracking-tighter leading-none">4</div>
                                                                        <div className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest mt-1">Active Projects</div>
                                                                    </div>
                                                                    <div className="w-full h-3 bg-zinc-800 rounded-full overflow-hidden">
                                                                        <div className="h-full bg-white w-3/4 rounded-full shadow-[0_0_10px_rgba(255,255,255,0.8)]"></div>
                                                                    </div>
                                                                </div>
                                                            ) : (
                                                                widgetSizes.projects === 'large' ? (
                                                                    <div className="flex flex-col h-full">
                                                                        <div className="flex justify-between items-center mb-4 px-1 shrink-0">
                                                                            <div>
                                                                                <div className="text-4xl font-bold text-white tracking-tighter">4</div>
                                                                                <div className="text-zinc-500 text-[10px] uppercase font-bold mt-1">Active Projects</div>
                                                                            </div>
                                                                            <div className="flex items-center gap-2">
                                                                                <div className="bg-emerald-500/10 border border-emerald-500/20 px-2 py-1 rounded text-[10px] text-emerald-400 font-bold">2 On Track</div>
                                                                                <div className="bg-amber-500/10 border border-amber-500/20 px-2 py-1 rounded text-[10px] text-amber-400 font-bold">1 Review</div>
                                                                            </div>
                                                                        </div>

                                                                        <div className="flex flex-col flex-1 min-h-0 gap-4">
                                                                            {/* Sexy White Neon Graph */}
                                                                            <div className="h-32 bg-zinc-900/50 border border-white/5 rounded-xl relative overflow-hidden shrink-0">
                                                                                <div className="absolute top-2 left-3 z-10 flex flex-col">
                                                                                    <span className="text-[10px] text-white font-bold uppercase tracking-wider">Project Hours</span>
                                                                                    <span className="text-[9px] text-zinc-500">Last 7 Days</span>
                                                                                </div>
                                                                                <ResponsiveContainer width="100%" height="100%">
                                                                                    <AreaChart data={[
                                                                                        { day: 'Mon', hours: 5.5 }, { day: 'Tue', hours: 7.2 }, { day: 'Wed', hours: 4.8 },
                                                                                        { day: 'Thu', hours: 8.5 }, { day: 'Fri', hours: 6.0 }, { day: 'Sat', hours: 3.5 }, { day: 'Sun', hours: 2.0 }
                                                                                    ]}>
                                                                                        <defs>
                                                                                            <linearGradient id="whiteNeonGrad" x1="0" y1="0" x2="0" y2="1">
                                                                                                <stop offset="0%" stopColor="#ffffff" stopOpacity={0.3} />
                                                                                                <stop offset="100%" stopColor="#ffffff" stopOpacity={0} />
                                                                                            </linearGradient>
                                                                                        </defs>
                                                                                        <Tooltip cursor={{ stroke: 'rgba(255,255,255,0.2)', strokeWidth: 1 }} content={<MinimalTooltip />} />
                                                                                        <Area
                                                                                            type="monotone"
                                                                                            dataKey="hours"
                                                                                            name="Hours"
                                                                                            stroke="#ffffff"
                                                                                            strokeWidth={3}
                                                                                            fill="url(#whiteNeonGrad)"
                                                                                            className="drop-shadow-[0_0_12px_rgba(255,255,255,0.6)]"
                                                                                        />
                                                                                    </AreaChart>
                                                                                </ResponsiveContainer>
                                                                            </div>

                                                                            {/* Detailed Project List */}
                                                                            <div className="flex-1 overflow-y-auto pr-1 space-y-2 custom-scrollbar">
                                                                                {[
                                                                                    { title: 'Website Redesign', client: 'Internal', status: 'Active', progress: 75, due: '14 Jan', color: 'emerald' },
                                                                                    { title: 'Mobile App', client: 'StartUp Inc', status: 'Review', progress: 90, due: '20 Jan', color: 'amber' },
                                                                                    { title: 'Marketing Q3', client: 'Growth Team', status: 'Planning', progress: 10, due: '01 Feb', color: 'zinc' },
                                                                                    { title: 'Dashboard API', client: 'Tech Corp', status: 'Active', progress: 45, due: '28 Jan', color: 'emerald' }
                                                                                ].map((p, i) => (
                                                                                    <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors group">
                                                                                        <div className="flex flex-col gap-0.5">
                                                                                            <span className="text-xs font-bold text-white group-hover:text-cyan-400 transition-colors">{p.title}</span>
                                                                                            <div className="flex items-center gap-2">
                                                                                                <span className="text-[9px] text-zinc-500 uppercase tracking-wider">{p.client}</span>
                                                                                                <span className="w-0.5 h-2 bg-zinc-700"></span>
                                                                                                <span className="text-[9px] text-zinc-400 flex items-center gap-1">
                                                                                                    <Clock size={8} /> Due {p.due}
                                                                                                </span>
                                                                                            </div>
                                                                                        </div>
                                                                                        <div className="flex flex-col items-end gap-1">
                                                                                            <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase ${p.status === 'Active' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                                                                                                p.status === 'Review' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                                                                                                    'bg-zinc-500/10 text-zinc-400 border border-zinc-500/20'
                                                                                                }`}>{p.status}</span>
                                                                                            <div className="w-16 h-1 bg-zinc-800 rounded-full overflow-hidden mt-1">
                                                                                                <div style={{ width: `${p.progress}%` }} className={`h-full rounded-full ${p.color === 'emerald' ? 'bg-emerald-400' : p.color === 'amber' ? 'bg-amber-400' : 'bg-zinc-400'
                                                                                                    }`} />
                                                                                            </div>
                                                                                        </div>
                                                                                    </div>
                                                                                ))}
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                ) : (
                                                                    <div className="flex flex-row items-center justify-between h-full px-2 gap-6">
                                                                        {/* Left Side: Summary */}
                                                                        <div className="flex flex-col justify-center min-w-[120px]">
                                                                            <div className="text-6xl font-bold text-white tracking-tighter drop-shadow-lg">4</div>
                                                                            <div className="text-zinc-500 text-[10px] uppercase font-bold mt-1 tracking-widest">Active Projects</div>
                                                                            <div className="mt-4 px-3 py-1 bg-white/5 border border-white/10 rounded-full w-fit">
                                                                                <span className="text-[10px] font-bold text-zinc-400">Jan 2026</span>
                                                                            </div>
                                                                        </div>

                                                                        {/* Right Side: List (Expense Style) */}
                                                                        <div className="flex-1 flex flex-col justify-center gap-5 border-l border-white/5 pl-6">
                                                                            {[
                                                                                { title: 'WEBSITE REDESIGN', value: '75%', color: 'bg-white shadow-[0_0_10px_rgba(255,255,255,0.8)]', width: '75%' },
                                                                                { title: 'MOBILE APP', value: '90%', color: 'bg-zinc-400', width: '90%' },
                                                                                { title: 'MARKETING Q3', value: '10%', color: 'bg-zinc-600', width: '10%' }
                                                                            ].map((item, i) => (
                                                                                <div key={i} className="flex flex-col gap-1.5 w-full">
                                                                                    <div className="flex justify-between items-end">
                                                                                        <span className="text-[10px] font-bold text-white tracking-wider">{item.title}</span>
                                                                                        <span className="text-[10px] font-bold text-zinc-400">{item.value}</span>
                                                                                    </div>
                                                                                    <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden w-full">
                                                                                        <div className={`h-full rounded-full ${item.color}`} style={{ width: item.width }} />
                                                                                    </div>
                                                                                </div>
                                                                            ))}
                                                                        </div>
                                                                    </div>
                                                                )
                                                            )}
                                                        </AnalyticsWidget>

                                                        {/* Widget 4: Progress */}
                                                        <AnalyticsWidget
                                                            id="progress"
                                                            title="Progress"
                                                            subtitle="Performance Trend"
                                                            icon={TrendingUp}
                                                            size={widgetSizes.progress}
                                                            onSizeChange={handleWidgetSizeChange}
                                                        >
                                                            {widgetSizes.progress === 'small' ? (
                                                                <div className="flex flex-col justify-center h-full text-center relative pointer-events-none">
                                                                    <div className="text-5xl font-bold text-white tracking-tighter drop-shadow-md">87%</div>
                                                                    <div className="flex items-center justify-center gap-1.5 mt-2">
                                                                        <div className="flex items-center text-emerald-400 text-xs font-bold bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
                                                                            <TrendingUp size={10} className="mr-1" /> +12%
                                                                        </div>
                                                                        <span className="text-[9px] text-zinc-500 uppercase font-bold">vs Last Month</span>
                                                                    </div>
                                                                </div>
                                                            ) : (
                                                                widgetSizes.progress === 'medium' ? (
                                                                    // Medium Layout - Grade & Score Focused
                                                                    <div className="flex flex-col h-full justify-between relative">
                                                                        {/* Decorative Grade Background - Clipped safely */}
                                                                        <div className="absolute inset-0 overflow-hidden pointer-events-none rounded-[20px]">
                                                                            <div className="absolute -right-4 -top-4 text-[120px] font-black text-white/5 rotate-12 select-none">
                                                                                A
                                                                            </div>
                                                                        </div>

                                                                        <div className="flex justify-between items-start relative z-10 px-2">
                                                                            <div className="flex flex-col">
                                                                                <span className="text-5xl font-black text-white tracking-tighter drop-shadow-[0_0_15px_rgba(255,255,255,0.6)]">92</span>
                                                                                <span className="text-[10px] text-zinc-400 uppercase font-bold tracking-wider mt-1">
                                                                                    Total Score
                                                                                </span>
                                                                            </div>
                                                                            <div className="flex flex-col items-end">
                                                                                <div className="w-12 h-12 rounded-xl bg-white flex items-center justify-center text-3xl font-black text-black shadow-[0_0_20px_rgba(255,255,255,0.3)] border border-white/50">
                                                                                    A
                                                                                </div>
                                                                                <span className="text-[9px] font-bold text-white mt-1 uppercase tracking-wider drop-shadow-md">Excellent</span>
                                                                            </div>
                                                                        </div>

                                                                        <div className="mt-auto relative z-10">
                                                                            <div className="flex items-center gap-2 mb-2 bg-white/10 border border-white/20 px-2 py-1.5 rounded-lg w-fit shadow-[0_0_10px_rgba(255,255,255,0.1)]">
                                                                                <TrendingUp size={12} className="text-white" />
                                                                                <span className="text-xs font-bold text-white">1.2x Multiplier</span>
                                                                            </div>
                                                                            <div className="w-full h-1 bg-zinc-800 rounded-full overflow-hidden">
                                                                                <div className="h-full bg-white w-[92%] rounded-full shadow-[0_0_10px_rgba(255,255,255,0.8)]"></div>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                ) : (
                                                                    // Large Layout - Full Performance Report
                                                                    <div className="flex flex-col h-full">
                                                                        <div className="flex justify-between items-center mb-5 border-b border-white/5 pb-3">
                                                                            <div className="flex items-center gap-3">
                                                                                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center text-2xl font-black text-white shadow-lg">
                                                                                    A
                                                                                </div>
                                                                                <div>
                                                                                    <div className="text-xl font-bold text-white leading-none">Outstanding</div>
                                                                                    <div className="text-zinc-500 text-[10px] mt-1 uppercase tracking-wider font-bold">Latest Evaluation</div>
                                                                                </div>
                                                                            </div>
                                                                            <div className="text-right">
                                                                                <div className="text-2xl font-black text-white drop-shadow-md">92<span className="text-sm text-zinc-500 font-medium">/100</span></div>
                                                                                <div className="text-emerald-400 text-[10px] font-bold uppercase tracking-wide">Top 5% Performer</div>
                                                                            </div>
                                                                        </div>

                                                                        <div className="flex-1 space-y-3 overflow-y-auto pr-1">
                                                                            {[
                                                                                { label: 'Code Quality', score: 96, color: 'bg-emerald-500', text: 'text-emerald-400' },
                                                                                { label: 'Delivery Speed', score: 88, color: 'bg-blue-500', text: 'text-blue-400' },
                                                                                { label: 'Problem Solving', score: 94, color: 'bg-purple-500', text: 'text-purple-400' },
                                                                                { label: 'Clean Code', score: 91, color: 'bg-amber-500', text: 'text-amber-400' }
                                                                            ].map((metric, i) => (
                                                                                <div key={i} className="group">
                                                                                    <div className="flex justify-between items-end mb-1">
                                                                                        <span className="text-zinc-400 text-[10px] font-bold uppercase tracking-wide group-hover:text-white transition-colors">{metric.label}</span>
                                                                                        <span className={`text-xs font-bold ${metric.text}`}>{metric.score}/100</span>
                                                                                    </div>
                                                                                    <div className="w-full h-2 bg-zinc-800 rounded-full overflow-hidden">
                                                                                        <div
                                                                                            className={`h-full ${metric.color} rounded-full relative group-hover:brightness-125 transition-all duration-300`}
                                                                                            style={{ width: `${metric.score}%`, boxShadow: `0 0 10px ${metric.color}80` }}
                                                                                        >
                                                                                            <div className="absolute inset-0 bg-white/20"></div>
                                                                                        </div>
                                                                                    </div>
                                                                                </div>
                                                                            ))}
                                                                        </div>

                                                                        <div className="mt-3 pt-3 border-t border-white/5 flex justify-between items-center">
                                                                            <span className="text-[10px] text-zinc-500 font-medium">Next Review: <span className="text-white">Oct 2026</span></span>
                                                                            <div className="flex -space-x-1.5">
                                                                                {[1, 2, 3].map(i => (
                                                                                    <div key={i} className={`w-5 h-5 rounded-full border border-black flex items-center justify-center text-[8px] font-bold text-white ${i === 0 ? 'bg-emerald-600' : 'bg-zinc-700'}`}>
                                                                                        {i === 0 ? 'A' : 'B'}
                                                                                    </div>
                                                                                ))}
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                )
                                                            )}
                                                        </AnalyticsWidget>

                                                        {/* Widget 5: Payroll */}
                                                        <AnalyticsWidget
                                                            id="payroll"
                                                            title="Payroll"
                                                            subtitle="Compensation"
                                                            icon={DollarSign}
                                                            size={widgetSizes.payroll}
                                                            onSizeChange={handleWidgetSizeChange}
                                                        >
                                                            {widgetSizes.payroll === 'small' ? (
                                                                <div className="flex flex-col justify-center h-full relative">
                                                                    <div className="text-center">
                                                                        <div className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold mb-1">Net Salary</div>
                                                                        <div className="text-4xl font-bold text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.3)]">
                                                                            ₹{((data.salaryTemplate?.basicSalary || 45000) / 1000).toFixed(0)}K
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            ) : widgetSizes.payroll === 'medium' ? (
                                                                // Medium Payroll Widget - Split Layout (Active Users Style)
                                                                <div className="flex h-full relative overflow-hidden bg-[#09090b] z-20 p-2 gap-4">
                                                                    {/* Background Decor */}
                                                                    <div className="absolute top-1/2 left-10 w-24 h-24 bg-emerald-500/5 rounded-full blur-[50px] pointer-events-none" />

                                                                    {/* Left Side: Net Pay Main Stat */}
                                                                    <div className="w-[35%] flex flex-col justify-center items-center relative pr-4 border-r border-white/5">
                                                                        <div className="flex items-center gap-2 mb-2">
                                                                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)] animate-pulse" />
                                                                            <span className="text-[10px] font-bold text-emerald-500 tracking-wider">PAID</span>
                                                                        </div>

                                                                        <div className="text-4xl font-black text-white tracking-tighter drop-shadow-[0_0_20px_rgba(255,255,255,0.15)]">
                                                                            42.5<span className="text-xl text-zinc-600">k</span>
                                                                        </div>

                                                                        <div className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest mt-1">
                                                                            Jan 2026
                                                                        </div>
                                                                    </div>

                                                                    {/* Right Side: Breakdown & Progress */}
                                                                    <div className="flex-1 flex flex-col justify-center min-w-0">
                                                                        {/* Progress Section */}
                                                                        <div className="mb-4">
                                                                            <div className="flex justify-between items-end mb-2">
                                                                                <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider">Pay Ratio</span>
                                                                                <span className="text-xl font-black text-white">96%</span>
                                                                            </div>
                                                                            <div className="w-full h-1.5 bg-zinc-800/50 rounded-full overflow-hidden">
                                                                                <div className="h-full w-[96%] bg-white rounded-full shadow-[0_0_10px_rgba(255,255,255,0.5)]" />
                                                                            </div>
                                                                        </div>

                                                                        {/* Cards Row */}
                                                                        <div className="grid grid-cols-2 gap-2">
                                                                            {/* Earnings Card */}
                                                                            <div className="bg-zinc-800/30 rounded-xl p-2 border border-white/5">
                                                                                <div className="text-[9px] text-zinc-500 font-bold uppercase mb-1">Earnings</div>
                                                                                <div className="text-sm font-bold text-emerald-400">₹44.5k</div>
                                                                            </div>
                                                                            {/* Deductions Card */}
                                                                            <div className="bg-zinc-800/30 rounded-xl p-2 border border-white/5">
                                                                                <div className="text-[9px] text-zinc-500 font-bold uppercase mb-1">Deductions</div>
                                                                                <div className="text-sm font-bold text-rose-400">₹2.0k</div>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                </div>

                                                            ) : (
                                                                // Large Payroll Widget - Premium Calendar View
                                                                <div className="flex flex-col h-full">
                                                                    {/* Header: Month Navigator */}
                                                                    <div className="flex justify-between items-center mb-4 px-1">
                                                                        <div className="flex flex-col">
                                                                            <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest">Salary History</span>
                                                                            <span className="text-xl font-bold text-white tracking-tight">
                                                                                {payrollDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                                                                            </span>
                                                                        </div>
                                                                        <div className="flex items-center gap-2">
                                                                            {/* Reset Button */}
                                                                            <button
                                                                                onClick={(e) => { e.stopPropagation(); setPayrollDate(new Date()); }}
                                                                                className="px-2 py-1 bg-white/5 hover:bg-white/10 border border-white/10 rounded-md text-[10px] font-bold text-zinc-400 hover:text-white transition-colors uppercase tracking-wider"
                                                                                title="Reset to Current Month"
                                                                            >
                                                                                Reset
                                                                            </button>

                                                                            <div className="flex items-center gap-1 bg-white/5 border border-white/10 rounded-lg p-1">
                                                                                <button
                                                                                    onClick={(e) => { e.stopPropagation(); setPayrollDate(new Date(payrollDate.setMonth(payrollDate.getMonth() - 1))); }}
                                                                                    className="p-1 hover:bg-white/10 rounded-md text-zinc-400 hover:text-white transition-colors"
                                                                                >
                                                                                    <ChevronLeft size={14} />
                                                                                </button>
                                                                                <button
                                                                                    onClick={(e) => { e.stopPropagation(); setPayrollDate(new Date(payrollDate.setMonth(payrollDate.getMonth() + 1))); }}
                                                                                    className="p-1 hover:bg-white/10 rounded-md text-zinc-400 hover:text-white transition-colors"
                                                                                >
                                                                                    <ChevronRight size={14} />
                                                                                </button>
                                                                            </div>
                                                                        </div>
                                                                    </div>

                                                                    {/* Calendar Grid */}
                                                                    <div className="flex-1 min-h-0 bg-zinc-900/30 border border-white/5 rounded-xl p-3 flex flex-col">
                                                                        {/* Weekday Headers */}
                                                                        <div className="grid grid-cols-7 mb-2">
                                                                            {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map(d => (
                                                                                <div key={d} className="text-center text-[10px] font-bold text-zinc-600">{d}</div>
                                                                            ))}
                                                                        </div>

                                                                        {/* Days Grid */}
                                                                        <div className="grid grid-cols-7 grid-rows-6 gap-1 flex-1">
                                                                            {(() => {
                                                                                const daysInMonth = new Date(payrollDate.getFullYear(), payrollDate.getMonth() + 1, 0).getDate();
                                                                                const firstDay = new Date(payrollDate.getFullYear(), payrollDate.getMonth(), 1).getDay();
                                                                                const days = [];

                                                                                // Empty slots for start of month
                                                                                for (let i = 0; i < firstDay; i++) {
                                                                                    days.push(<div key={`empty-${i}`} className="w-full h-full" />);
                                                                                }

                                                                                // Day cells
                                                                                for (let d = 1; d <= daysInMonth; d++) {
                                                                                    const isSalaryDay = d === 5; // Mock: Salary always on 5th
                                                                                    const isToday = new Date().toDateString() === new Date(payrollDate.getFullYear(), payrollDate.getMonth(), d).toDateString();

                                                                                    days.push(
                                                                                        <div
                                                                                            key={d}
                                                                                            className={`group/date relative w-full h-full rounded-lg flex items-center justify-center text-xs font-medium transition-all duration-300
                                                                                                ${isSalaryDay
                                                                                                    ? 'bg-white text-black font-bold shadow-[0_0_15px_rgba(255,255,255,0.4)] cursor-pointer hover:scale-110 hover:z-50 z-10'
                                                                                                    : isToday
                                                                                                        ? 'bg-white/10 text-white border border-white/20'
                                                                                                        : 'text-zinc-500 hover:bg-white/5 hover:text-zinc-300'
                                                                                                }`}
                                                                                        >
                                                                                            {d}
                                                                                            {/* Salary Day Indicator Dot */}
                                                                                            {isSalaryDay && (
                                                                                                <div className="absolute top-1 right-1 w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_5px_rgba(16,185,129,0.8)]" />
                                                                                            )}

                                                                                            {/* Hover Tooltip for Salary Day - Positioned BELOW to avoid clipping */}
                                                                                            {isSalaryDay && (
                                                                                                <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 w-48 opacity-0 group-hover/date:opacity-100 transition-opacity duration-200 pointer-events-none z-[60]">
                                                                                                    <div className="bg-[#09090b] border border-white/20 rounded-xl p-3 shadow-[0_10px_40px_rgba(0,0,0,0.8)] relative">
                                                                                                        {/* Arrow pointing up */}
                                                                                                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 -mb-[1px] border-8 border-transparent border-b-[#09090b]" />

                                                                                                        <div className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider mb-2 border-b border-white/10 pb-1">
                                                                                                            {payrollDate.toLocaleDateString('en-US', { month: 'short' })} Salary Credited
                                                                                                        </div>
                                                                                                        <div className="flex justify-between items-end mb-2">
                                                                                                            <span className="text-sm font-bold text-emerald-400">Net Pay</span>
                                                                                                            <span className="text-lg font-black text-white px-2 py-0.5 bg-zinc-800 rounded">₹42,500</span>
                                                                                                        </div>
                                                                                                        <div className="space-y-1">
                                                                                                            <div className="flex justify-between text-[10px]">
                                                                                                                <span className="text-zinc-500">Base</span>
                                                                                                                <span className="text-zinc-300">₹35,000</span>
                                                                                                            </div>
                                                                                                            <div className="flex justify-between text-[10px]">
                                                                                                                <span className="text-zinc-500">Bonus</span>
                                                                                                                <span className="text-emerald-500">+₹9,500</span>
                                                                                                            </div>
                                                                                                            <div className="flex justify-between text-[10px]">
                                                                                                                <span className="text-zinc-500">Deductions</span>
                                                                                                                <span className="text-rose-500">-₹2,000</span>
                                                                                                            </div>
                                                                                                        </div>
                                                                                                    </div>
                                                                                                </div>
                                                                                            )}
                                                                                        </div>
                                                                                    );
                                                                                }
                                                                                return days;
                                                                            })()}
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </AnalyticsWidget>

                                                    </motion.div>
                                                </LayoutGroup>
                                            </div>
                                        </div>

                                        {/* Right Panel: Original Profile Card */}
                                        <div className="relative w-[384px] h-full shrink-0">
                                            {/* Toggle Button - Fixed to Left Edge of Profile Card (Outside overflow-hidden) */}
                                            <motion.button
                                                onClick={(e) => { e.stopPropagation(); setIsExpanded(!isExpanded); }}
                                                whileHover={{ scale: 1.1 }}
                                                whileTap={{ scale: 0.95 }}
                                                className="absolute -left-5 top-1/2 -translate-y-1/2 z-[100] w-10 h-10 rounded-full bg-zinc-900 border border-white/10 shadow-2xl flex items-center justify-center cursor-pointer hover:bg-zinc-800 hover:border-cyan-500/30 transition-all duration-300 group"
                                                title={isExpanded ? "Collapse Details" : "Expand Details"}
                                            >
                                                <motion.div
                                                    animate={{ rotate: isExpanded ? 45 : -135 }}
                                                    transition={{ type: "spring", stiffness: 300, damping: 20 }}
                                                >
                                                    <ArrowUpRight
                                                        size={18}
                                                        className={`transition-colors duration-300 ${isExpanded ? 'text-cyan-400' : 'text-white/60 group-hover:text-white'}`}
                                                    />
                                                </motion.div>
                                                {/* Pulse ring */}
                                                <div className="absolute inset-0 rounded-full border-2 border-cyan-400/0 group-hover:border-cyan-400/30 group-hover:animate-ping" />
                                            </motion.button>

                                            {/* Actual Right Panel Content (Inner Div with overflow-hidden) */}
                                            <div className="relative w-full h-full bg-black rounded-[24px] overflow-hidden shadow-2xl">
                                                {/* 1. Fixed Hero Image Layer (z-0) */}
                                                <div className="absolute top-0 left-0 right-0 h-[500px] z-0 pointer-events-none">
                                                    {data.profilePhoto ? (
                                                        <img
                                                            src={data.profilePhoto.startsWith('http')
                                                                ? data.profilePhoto
                                                                : `http://localhost:5001${data.profilePhoto.startsWith('/') ? '' : '/'}${data.profilePhoto}`}
                                                            alt={`${data.firstName} ${data.lastName}`}
                                                            className="w-full h-full object-cover"
                                                        />
                                                    ) : (
                                                        <div className="w-full h-full gradient-primary flex items-center justify-center">
                                                            <span className="text-8xl font-black text-white/30">
                                                                {data.firstName?.[0]}{data.lastName?.[0]}
                                                            </span>
                                                        </div>
                                                    )}
                                                    {/* Base gradient for text readability */}
                                                    <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-90" />
                                                </div>

                                                {/* 2. Fixed Top Fade Mask (z-20) */}
                                                <div className="absolute top-0 left-0 right-0 h-40 bg-gradient-to-b from-black via-black/60 to-transparent z-20 pointer-events-none" />





                                                {/* 4. Scrollable Content Layer (z-10) */}
                                                <div className="absolute inset-0 z-10 overflow-y-auto custom-scrollbar pointer-events-auto">
                                                    {/* Spacer to push content down - transparent */}
                                                    <div className="h-[340px] w-full bg-transparent pointer-events-none" />

                                                    {/* Scrolling Content Wrapper */}
                                                    <div className="relative z-10 flex flex-col bg-gradient-to-b from-transparent via-black/80 to-black/90 -mt-32 pt-32 px-6">

                                                        {/* Name Section - Scrolls with content */}
                                                        <div className="pb-8 pl-2">
                                                            <div className="flex items-center gap-3 mb-2">
                                                                <h1 className="text-4xl font-black text-white leading-tight tracking-tight shadow-black drop-shadow-lg">
                                                                    {data.firstName} {data.lastName}
                                                                </h1>
                                                                {/* Role Badge */}
                                                                <span className="px-3 py-1 bg-cyan-500/20 backdrop-blur-md border border-cyan-400/30 text-cyan-300 rounded-lg text-[10px] font-black uppercase tracking-wider shadow-lg shadow-cyan-900/20">
                                                                    {data.roleDisplay || data.role}
                                                                </span>
                                                            </div>
                                                        </div>

                                                        {/* Stats Row - Clean, No Backgrounds */}
                                                        <div className="grid grid-cols-3 gap-2 pb-8 border-b border-white/5 mb-8 mx-2">
                                                            {/* Employee ID */}
                                                            <div className="text-center group">
                                                                <Hash size={14} className="text-cyan-400 mx-auto mb-2 opacity-80 group-hover:opacity-100 transition-opacity" />
                                                                <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold mb-1">ID</p>
                                                                <p className="text-xs font-bold text-white tracking-wide truncate px-1">{data.employeeId || 'N/A'}</p>
                                                            </div>

                                                            {/* Live Status */}
                                                            <div className="text-center group">
                                                                <div className={`w-2.5 h-2.5 rounded-full mx-auto mb-2.5 ${data.isActive ? 'bg-green-400 shadow-[0_0_10px_rgba(74,222,128,0.5)]' : 'bg-red-400'} transition-all`} />
                                                                <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold mb-1">Status</p>
                                                                <p className={`text-sm font-bold ${data.isActive ? 'text-green-400' : 'text-red-400'} tracking-wide`}>
                                                                    {data.isActive ? 'Active' : 'Locked'}
                                                                </p>
                                                            </div>

                                                            {/* Join Date */}
                                                            <div className="text-center group">
                                                                <Calendar size={14} className="text-cyan-400 mx-auto mb-2 opacity-80 group-hover:opacity-100 transition-opacity" />
                                                                <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold mb-1">Joined</p>
                                                                <p className="text-sm font-bold text-white tracking-wide">
                                                                    {new Date(data.createdAt).toLocaleDateString(undefined, { month: 'short', year: 'numeric' })}
                                                                </p>
                                                            </div>
                                                        </div>

                                                        {/* Info Section - Glass Card */}
                                                        <div className="space-y-6 p-8 pb-12 bg-black/60 backdrop-blur-2xl rounded-[40px] border border-white/5 shadow-2xl min-h-[300px]">
                                                            {/* Email Pill - Clean Text */}
                                                            <div className="flex items-center gap-4 px-2 hover:translate-x-1 transition-transform group cursor-default">
                                                                <div className="p-2 bg-white/5 rounded-full text-gray-400 group-hover:text-cyan-400 transition-colors">
                                                                    <Mail size={16} />
                                                                </div>
                                                                <span className="text-sm text-gray-300 font-medium truncate group-hover:text-white transition-colors">{data.email}</span>
                                                            </div>

                                                            {/* Division Card - Clean Text */}
                                                            <div className="flex items-center gap-4 px-2 hover:translate-x-1 transition-transform group cursor-default">
                                                                <div className="p-2 bg-white/5 rounded-full text-gray-400 group-hover:text-cyan-400 transition-colors">
                                                                    <Briefcase size={16} />
                                                                </div>
                                                                <div className="flex-1 min-w-0">
                                                                    <p className="text-[10px] text-gray-500 uppercase tracking-wider font-bold mb-0.5">Division</p>
                                                                    <p className="text-base font-bold text-white truncate">{data.department || 'General Management'}</p>
                                                                </div>
                                                            </div>

                                                            {/* Permissions Section - Clean Grid */}
                                                            <div className="pt-2 px-2">
                                                                <div className="flex items-center gap-2 mb-4">
                                                                    <Shield size={14} className="text-cyan-500" />
                                                                    <h3 className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">
                                                                        Access Privileges
                                                                    </h3>
                                                                </div>
                                                                <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                                                                    {data.permissions?.length > 0 ? data.permissions.map(perm => (
                                                                        <div
                                                                            key={perm}
                                                                            className="py-2.5 border-b border-white/10 text-[11px] text-gray-400 font-bold uppercase tracking-wide flex items-center gap-2 hover:text-cyan-300 transition-colors"
                                                                        >
                                                                            <div className="w-1 h-1 bg-cyan-500/50 rounded-full" />
                                                                            {perm.replace(/_/g, ' ')}
                                                                        </div>
                                                                    )) : (
                                                                        <p className="col-span-2 text-xs text-gray-500 italic text-center py-4">
                                                                            No specialized privileges
                                                                        </p>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        {/* Left Panel: Full Project Details with Analytics Widgets */}
                                        <div className={`flex-1 overflow-x-auto overflow-y-auto custom-scrollbar transition-all duration-500 ${isExpanded ? 'w-auto opacity-100' : 'w-0 opacity-0 overflow-hidden'}`}>
                                            {/* Header */}
                                            <div className="px-6 pt-16 pb-4">
                                                <h2 className="text-xl font-black text-white tracking-tight">Project Details</h2>
                                                <p className="text-gray-500 text-xs mt-1">Comprehensive project information</p>
                                            </div>

                                            {/* Horizontal Info Sections */}
                                            <div className="flex flex-row gap-3 px-6 pb-6 w-full justify-between">

                                                {/* Column 1: Project Info */}
                                                <div className="flex-1 min-w-[220px] max-w-[260px] space-y-2">
                                                    <h3 className="text-[10px] font-bold text-cyan-400 uppercase tracking-widest flex items-center gap-2 mb-3">
                                                        <FolderKanban size={12} /> Project Info
                                                    </h3>
                                                    <div className="space-y-2">
                                                        <div className="flex justify-between items-center py-1 border-b border-white/5">
                                                            <span className="text-[10px] text-gray-500 uppercase tracking-wider font-bold">Project Name</span>
                                                            <span className="text-sm font-semibold text-white truncate max-w-[120px]" title={data.name}>{data.name}</span>
                                                        </div>
                                                        <div className="flex justify-between items-center py-1 border-b border-white/5">
                                                            <span className="text-[10px] text-gray-500 uppercase tracking-wider font-bold">Status</span>
                                                            <span className={`text-sm font-semibold ${data.status === 'completed' ? 'text-emerald-400' : data.status === 'in-progress' ? 'text-blue-400' : 'text-zinc-400'}`}>
                                                                {data.status?.replace(/-/g, ' ') || 'N/A'}
                                                            </span>
                                                        </div>
                                                        <div className="flex justify-between items-center py-1 border-b border-white/5">
                                                            <span className="text-[10px] text-gray-500 uppercase tracking-wider font-bold">Deadline</span>
                                                            <span className="text-sm font-semibold text-white">
                                                                {data.deadline ? new Date(data.deadline).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }) : 'N/A'}
                                                            </span>
                                                        </div>
                                                        <div className="flex justify-between items-center py-1 border-b border-white/5">
                                                            <span className="text-[10px] text-gray-500 uppercase tracking-wider font-bold">Progress</span>
                                                            <span className="text-sm font-semibold text-white">{data.progress || 0}%</span>
                                                        </div>
                                                        <div className="flex justify-between items-center py-1">
                                                            <span className="text-[10px] text-gray-500 uppercase tracking-wider font-bold">Project ID</span>
                                                            <span className="text-sm font-semibold text-white font-mono">{data._id?.slice(-6) || 'N/A'}</span>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Column 2: Team & Lead */}
                                                <div className="flex-1 min-w-[200px] max-w-[240px] space-y-2">
                                                    <h3 className="text-[10px] font-bold text-cyan-400 uppercase tracking-widest flex items-center gap-2 mb-3">
                                                        <Users size={12} /> Team & Leadership
                                                    </h3>
                                                    <div className="space-y-2">
                                                        <div className="flex justify-between items-center py-1 border-b border-white/5">
                                                            <span className="text-[10px] text-gray-500 uppercase tracking-wider font-bold">Project Lead</span>
                                                            <span className="text-sm font-semibold text-white truncate max-w-[120px]">
                                                                {data.assignedManager ? `${data.assignedManager.firstName} ${data.assignedManager.lastName}` : data.managerName || 'Unassigned'}
                                                            </span>
                                                        </div>
                                                        <div className="flex justify-between items-center py-1 border-b border-white/5">
                                                            <span className="text-[10px] text-gray-500 uppercase tracking-wider font-bold">Team Size</span>
                                                            <span className="text-sm font-semibold text-white">{data.teamSize || data.team?.length || 0} Members</span>
                                                        </div>
                                                        <div className="flex justify-between items-center py-1 border-b border-white/5">
                                                            <span className="text-[10px] text-gray-500 uppercase tracking-wider font-bold">Client</span>
                                                            <span className="text-sm font-semibold text-white truncate max-w-[120px]" title={data.client}>{data.client || 'Internal'}</span>
                                                        </div>
                                                        <div className="flex justify-between items-center py-1">
                                                            <span className="text-[10px] text-gray-500 uppercase tracking-wider font-bold">Budget</span>
                                                            <span className="text-sm font-semibold text-white">
                                                                {data.budget ? `₹${(data.budget / 100000).toFixed(1)}L` : 'N/A'}
                                                            </span>
                                                        </div>
                                                    </div>

                                                    {/* Team Members List */}
                                                    {data.team && data.team.length > 0 && (
                                                        <div className="mt-4 space-y-2">
                                                            <h4 className="text-[9px] text-zinc-500 uppercase tracking-wider font-bold">Team Members</h4>
                                                            {data.team.slice(0, 3).map((member, idx) => (
                                                                <div key={idx} className="p-2 bg-white/[0.02] rounded-lg border border-white/5">
                                                                    <p className="text-xs font-semibold text-white">{member.name}</p>
                                                                    <p className="text-[9px] text-zinc-500 mt-0.5">{member.role}</p>
                                                                </div>
                                                            ))}
                                                            {data.team.length > 3 && (
                                                                <p className="text-[9px] text-zinc-500 italic">+{data.team.length - 3} more</p>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Column 3: Tasks */}
                                                <div className="flex-1 min-w-[180px] max-w-[220px] space-y-2">
                                                    <h3 className="text-[10px] font-bold text-cyan-400 uppercase tracking-widest flex items-center gap-2 mb-3">
                                                        <CheckCircle2 size={12} /> Tasks
                                                    </h3>
                                                    <div className="space-y-3">
                                                        <div className="p-3 bg-white/[0.02] rounded-xl border border-white/5">
                                                            <div className="text-2xl font-bold text-white mb-1">{data.tasks?.total || data.tasks?.length || 0}</div>
                                                            <div className="text-xs text-zinc-500 uppercase tracking-wider">Total Tasks</div>
                                                        </div>
                                                        <div className="p-3 bg-emerald-500/5 rounded-xl border border-emerald-500/20">
                                                            <div className="text-xl font-bold text-emerald-400 mb-1">{data.tasks?.completed || 0}</div>
                                                            <div className="text-xs text-emerald-500 uppercase tracking-wider">Completed</div>
                                                        </div>
                                                        <div className="p-3 bg-orange-500/5 rounded-xl border border-orange-500/20">
                                                            <div className="text-xl font-bold text-orange-400 mb-1">{data.tasks?.pending || 0}</div>
                                                            <div className="text-xs text-orange-500 uppercase tracking-wider">Pending</div>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Column 4: Milestones */}
                                                <div className="flex-1 min-w-[200px] max-w-[240px] space-y-2">
                                                    <h3 className="text-[10px] font-bold text-cyan-400 uppercase tracking-widest flex items-center gap-2 mb-3">
                                                        <Target size={12} /> Milestones
                                                    </h3>
                                                    <div className="space-y-2">
                                                        {data.milestones && data.milestones.length > 0 ? (
                                                            data.milestones.slice(0, 4).map((milestone, idx) => (
                                                                <div key={idx} className="p-3 bg-white/[0.02] rounded-xl border border-white/5">
                                                                    <div className="flex items-center justify-between mb-1">
                                                                        <p className="text-xs font-semibold text-white truncate">{milestone.name}</p>
                                                                        <span className={`px-2 py-0.5 rounded text-[8px] uppercase font-bold ${milestone.status?.toLowerCase() === 'completed' ? 'bg-emerald-500/20 text-emerald-400' :
                                                                            milestone.status?.toLowerCase() === 'in progress' ? 'bg-blue-500/20 text-blue-400' :
                                                                                'bg-zinc-500/20 text-zinc-400'
                                                                            }`}>
                                                                            {milestone.status}
                                                                        </span>
                                                                    </div>
                                                                    <p className="text-[9px] text-zinc-500 flex items-center gap-1">
                                                                        <Calendar size={9} />
                                                                        {milestone.date ? new Date(milestone.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }) : 'N/A'}
                                                                    </p>
                                                                </div>
                                                            ))
                                                        ) : (
                                                            <p className="text-zinc-500 text-sm italic">No milestones defined</p>
                                                        )}
                                                    </div>
                                                </div>

                                            </div>

                                            {/* Analytics Widgets Section */}
                                            <div className="px-6 pb-6 mt-4">
                                                <div className="flex items-center justify-between mb-4">
                                                    <div>
                                                        <h2 className="text-lg font-bold text-white tracking-tight">Analytics Overview</h2>
                                                        <p className="text-zinc-500 text-[10px] mt-0.5 font-medium tracking-wider uppercase">Project Metrics</p>
                                                    </div>
                                                </div>

                                                {/* 4 Analytics Widgets Grid */}
                                                <div className="grid grid-cols-4 gap-4 auto-rows-min grid-flow-dense">

                                                    {/* Widget 1: Progress */}
                                                    <AnalyticsWidget
                                                        id="projectProgress"
                                                        title="Progress"
                                                        subtitle="Completion"
                                                        icon={TrendingUp}
                                                        size={projectWidgetSizes.projectProgress}
                                                        onSizeChange={handleProjectWidgetSizeChange}
                                                    >
                                                        <div className="flex flex-col h-full relative">
                                                            {projectWidgetSizes.projectProgress === 'small' ? (
                                                                <div className="flex items-center justify-between h-full pr-2">
                                                                    <div className="flex flex-col justify-center">
                                                                        <div className="text-white text-5xl font-bold tracking-tighter drop-shadow-md">
                                                                            {data.progress || 0}%
                                                                        </div>
                                                                        <div className="text-zinc-500 text-[10px] font-bold uppercase tracking-wider mt-1">Total Progress</div>
                                                                        <div className="text-emerald-400 text-[10px] font-bold mt-0.5 shadow-emerald-500/20 drop-shadow-sm">
                                                                            On Track
                                                                        </div>
                                                                    </div>
                                                                    {/* Right: Activity/Velocity Bars */}
                                                                    <div className="flex gap-1 items-end h-10 mb-2">
                                                                        {[35, 60, 45, 80, 55].map((h, i) => (
                                                                            <div key={i} className="w-1.5 bg-zinc-800/50 rounded-full overflow-hidden h-full relative border border-white/5">
                                                                                <div
                                                                                    style={{ height: `${h}%` }}
                                                                                    className={`absolute bottom-0 w-full rounded-full transition-all duration-500 ${i === 3 ? 'bg-white shadow-[0_0_10px_rgba(255,255,255,0.8)]' : 'bg-white/40 hover:bg-white'}`}
                                                                                />
                                                                            </div>
                                                                        ))}
                                                                    </div>
                                                                </div>
                                                            ) : projectWidgetSizes.projectProgress === 'medium' ? (
                                                                <div className="flex flex-col h-full">
                                                                    <div className="flex justify-between items-start mb-2 px-1">
                                                                        <div>
                                                                            <div className="text-white text-3xl font-bold tracking-tighter">
                                                                                {data.progress || 0}%
                                                                            </div>
                                                                            <div className="text-zinc-500 text-[10px] uppercase font-bold tracking-wider mt-0.5">Daily Velocity</div>
                                                                        </div>
                                                                        <div className="bg-emerald-500/10 border border-emerald-500/20 rounded px-1.5 py-0.5">
                                                                            <span className="text-emerald-400 text-[10px] font-bold">+2.4%</span>
                                                                        </div>
                                                                    </div>
                                                                    <div className="flex-1 min-h-0 relative">
                                                                        <ResponsiveContainer width="100%" height="100%">
                                                                            <AreaChart data={[
                                                                                { day: 'M', val: 12 }, { day: 'T', val: 18 }, { day: 'W', val: 10 },
                                                                                { day: 'T', val: 24 }, { day: 'F', val: 15 }, { day: 'S', val: 22 }
                                                                            ]} margin={{ top: 5, right: 0, left: -25, bottom: 0 }}>
                                                                                <defs>
                                                                                    <linearGradient id="mediumTrendGrad" x1="0" y1="0" x2="0" y2="1">
                                                                                        <stop offset="5%" stopColor="#ffffff" stopOpacity={0.3} />
                                                                                        <stop offset="95%" stopColor="#ffffff" stopOpacity={0} />
                                                                                    </linearGradient>
                                                                                </defs>
                                                                                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                                                                                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: '#71717a', fontSize: 9 }} dy={5} />
                                                                                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#71717a', fontSize: 9 }} />
                                                                                <Tooltip
                                                                                    cursor={{ stroke: 'white', strokeWidth: 1, strokeDasharray: '4 4' }}
                                                                                    content={({ active, payload }) => {
                                                                                        if (active && payload && payload.length) {
                                                                                            return (
                                                                                                <div className="bg-zinc-900 border border-white/10 p-1.5 rounded shadow-xl">
                                                                                                    <div className="text-[10px] text-zinc-400 font-bold mb-0.5">Vol</div>
                                                                                                    <div className="text-sm font-bold text-white">{payload[0].value}%</div>
                                                                                                </div>
                                                                                            );
                                                                                        }
                                                                                        return null;
                                                                                    }}
                                                                                />
                                                                                <Area
                                                                                    type="monotone"
                                                                                    dataKey="val"
                                                                                    stroke="#ffffff"
                                                                                    strokeWidth={2}
                                                                                    fill="url(#mediumTrendGrad)"
                                                                                    activeDot={{ r: 4, fill: "white", stroke: "rgba(255,255,255,0.5)", strokeWidth: 4 }}
                                                                                />
                                                                            </AreaChart>
                                                                        </ResponsiveContainer>
                                                                    </div>
                                                                </div>
                                                            ) : (
                                                                <div className="flex flex-col h-full gap-4">
                                                                    {/* Top Stats Row */}
                                                                    <div className="flex justify-between items-end border-b border-white/5 pb-4">
                                                                        <div className="flex items-center gap-4">
                                                                            <div className="w-16 h-16 rounded-full relative flex items-center justify-center">
                                                                                <svg className="w-full h-full transform -rotate-90">
                                                                                    <circle cx="32" cy="32" r="28" stroke="#27272a" strokeWidth="6" fill="transparent" />
                                                                                    <circle cx="32" cy="32" r="28" stroke="#ffffff" strokeWidth="6" fill="transparent"
                                                                                        strokeDasharray={2 * Math.PI * 28}
                                                                                        strokeDashoffset={2 * Math.PI * 28 * (1 - ((data.progress || 0) / 100))}
                                                                                        strokeLinecap="round"
                                                                                        className="drop-shadow-[0_0_8px_rgba(255,255,255,0.5)]"
                                                                                    />
                                                                                </svg>
                                                                                <div className="absolute inset-0 flex items-center justify-center text-sm font-bold text-white">
                                                                                    {data.progress || 0}%
                                                                                </div>
                                                                            </div>
                                                                            <div>
                                                                                <div className="text-xl font-bold text-white tracking-tight">On Track</div>
                                                                                <div className="text-zinc-500 text-[10px] font-bold uppercase tracking-wider mt-1">Status Report</div>
                                                                            </div>
                                                                        </div>
                                                                        <div className="text-right">
                                                                            <div className="text-[10px] text-zinc-500 font-bold uppercase mb-1">Estimated Completion</div>
                                                                            <div className="text-sm font-bold text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded border border-emerald-500/20">
                                                                                {data.deadline ? new Date(data.deadline).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : 'TBD'}
                                                                            </div>
                                                                        </div>
                                                                    </div>

                                                                    {/* Middle: Phases Breakdown */}
                                                                    <div className="grid grid-cols-4 gap-2">
                                                                        {[
                                                                            { name: 'Plan', status: 'Done', color: 'bg-emerald-500' },
                                                                            { name: 'Design', status: 'Done', color: 'bg-emerald-500' },
                                                                            { name: 'Dev', status: 'Active', color: 'bg-white animate-pulse' },
                                                                            { name: 'Test', status: 'Pending', color: 'bg-zinc-700' },
                                                                        ].map((phase, i) => (
                                                                            <div key={i} className="bg-white/5 rounded-lg p-2 border border-white/5 flex flex-col gap-2">
                                                                                <div className={`w-1.5 h-1.5 rounded-full ${phase.color} shadow-[0_0_8px_currentColor]`} />
                                                                                <div>
                                                                                    <div className="text-[10px] font-bold text-white">{phase.name}</div>
                                                                                    <div className="text-[8px] text-zinc-500 uppercase">{phase.status}</div>
                                                                                </div>
                                                                            </div>
                                                                        ))}
                                                                    </div>

                                                                    {/* Bottom: Detailed Chart */}
                                                                    <div className="flex-1 min-h-0 bg-zinc-900/30 rounded-xl border border-white/5 relative overflow-hidden flex flex-col p-3">
                                                                        <div className="flex justify-between items-center mb-2">
                                                                            <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Planned vs Actual</span>
                                                                            <div className="flex gap-2">
                                                                                <div className="flex items-center gap-1 text-[8px] text-zinc-400"><span className="w-1.5 h-1.5 rounded-full bg-zinc-600 block" /> Planned</div>
                                                                                <div className="flex items-center gap-1 text-[8px] text-white"><span className="w-1.5 h-1.5 rounded-full bg-white block" /> Actual</div>
                                                                            </div>
                                                                        </div>
                                                                        <div className="flex-1">
                                                                            <ResponsiveContainer width="100%" height="100%">
                                                                                <AreaChart data={[
                                                                                    { name: 'Week 1', planned: 20, actual: 22 },
                                                                                    { name: 'Week 2', planned: 40, actual: 38 },
                                                                                    { name: 'Week 3', planned: 60, actual: 65 },
                                                                                    { name: 'Week 4', planned: 80, actual: (data.progress || 75) },
                                                                                ]}>
                                                                                    <defs>
                                                                                        <linearGradient id="colorActual" x1="0" y1="0" x2="0" y2="1">
                                                                                            <stop offset="5%" stopColor="#ffffff" stopOpacity={0.3} />
                                                                                            <stop offset="95%" stopColor="#ffffff" stopOpacity={0} />
                                                                                        </linearGradient>
                                                                                    </defs>
                                                                                    <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                                                                                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#52525b', fontSize: 10 }} dy={5} />
                                                                                    <Tooltip
                                                                                        contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', borderRadius: '8px' }}
                                                                                        itemStyle={{ fontSize: '11px', fontWeight: 'bold' }}
                                                                                        labelStyle={{ display: 'none' }}
                                                                                    />
                                                                                    <Area type="monotone" dataKey="planned" stroke="#52525b" strokeWidth={2} strokeDasharray="4 4" fill="transparent" />
                                                                                    <Area type="monotone" dataKey="actual" stroke="#ffffff" strokeWidth={3} fill="url(#colorActual)" />
                                                                                </AreaChart>
                                                                            </ResponsiveContainer>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </AnalyticsWidget>

                                                    {/* Widget 2: Timeline */}
                                                    <AnalyticsWidget
                                                        id="projectTimeline"
                                                        title="Timeline"
                                                        subtitle="Schedule"
                                                        icon={Calendar}
                                                        size={projectWidgetSizes.projectTimeline}
                                                        onSizeChange={handleProjectWidgetSizeChange}
                                                    >
                                                        <div className="flex flex-col h-full relative">
                                                            {projectWidgetSizes.projectTimeline === 'small' ? (
                                                                <div className="flex flex-col justify-center items-center h-full relative pt-8">
                                                                    <div className="text-white text-5xl font-bold tracking-tighter drop-shadow-md -mt-2">
                                                                        {data.milestones?.length || 6}
                                                                    </div>
                                                                    <div className="text-zinc-500 text-xs mt-1 uppercase font-bold tracking-wider">Total Phases</div>

                                                                    {/* Top Stats: Done vs Active */}
                                                                    <div className="absolute top-0 right-0 flex gap-2">
                                                                        <div className="text-center bg-emerald-500/10 rounded px-1.5 py-1 border border-emerald-500/20">
                                                                            <div className="text-emerald-400 text-xs font-bold leading-none mb-0.5">
                                                                                {data.milestones?.filter(m => m.status === 'Completed').length || 1}
                                                                            </div>
                                                                            <div className="text-emerald-500/70 text-[6px] uppercase font-bold">Done</div>
                                                                        </div>
                                                                        <div className="text-center bg-blue-500/10 rounded px-1.5 py-1 border border-blue-500/20">
                                                                            <div className="text-blue-400 text-xs font-bold leading-none mb-0.5">
                                                                                {data.milestones?.filter(m => m.status === 'In Progress').length || 1}
                                                                            </div>
                                                                            <div className="text-blue-500/70 text-[6px] uppercase font-bold">Active</div>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            ) : projectWidgetSizes.projectTimeline === 'medium' ? (
                                                                // Medium: Next Milestone Focus
                                                                <div className="flex flex-col h-full justify-between">
                                                                    <div className="flex justify-between items-start border-b border-white/5 pb-2">
                                                                        <div className="flex flex-col">
                                                                            <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Up Next</span>
                                                                            <span className="text-lg font-bold text-white tracking-tight truncate max-w-[140px]">
                                                                                {data.milestones?.find(m => m.status === 'In Progress')?.name || 'Design Review'}
                                                                            </span>
                                                                        </div>
                                                                        <div className="p-1.5 bg-white/5 rounded-lg border border-white/10 text-center min-w-[50px]">
                                                                            <div className="text-[9px] text-zinc-400 uppercase font-bold">Due</div>
                                                                            <div className="text-xs font-bold text-white">
                                                                                {data.milestones?.find(m => m.status === 'In Progress')?.date ?
                                                                                    new Date(data.milestones.find(m => m.status === 'In Progress').date).getDate() : '14'}
                                                                                <span className="text-[9px] text-zinc-500 ml-0.5">
                                                                                    {data.milestones?.find(m => m.status === 'In Progress')?.date ?
                                                                                        new Date(data.milestones.find(m => m.status === 'In Progress').date).toLocaleString('default', { month: 'short' }) : 'Jan'}
                                                                                </span>
                                                                            </div>
                                                                        </div>
                                                                    </div>

                                                                    <div className="flex-1 flex flex-col justify-center gap-3">
                                                                        <div className="flex items-center gap-2">
                                                                            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
                                                                            <span className="text-xs font-medium text-zinc-300">On Track to complete</span>
                                                                        </div>
                                                                        {/* Progress to next milestone */}
                                                                        <div className="space-y-1">
                                                                            <div className="flex justify-between text-[9px] uppercase font-bold text-zinc-500">
                                                                                <span>Progress</span>
                                                                                <span className="text-white">85%</span>
                                                                            </div>
                                                                            <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                                                                                <div className="h-full bg-gradient-to-r from-white to-zinc-300 w-[85%] rounded-full shadow-[0_0_15px_rgba(255,255,255,0.8)]" />
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            ) : (
                                                                // Large: Full Vertical Timeline
                                                                <div className="flex flex-col h-full">
                                                                    <div className="flex justify-between items-center mb-4 border-b border-white/5 pb-2">
                                                                        <div>
                                                                            <div className="text-xl font-bold text-white tracking-tight">Project Timeline</div>
                                                                            <div className="text-zinc-500 text-[10px] font-bold uppercase tracking-wider mt-0.5">Key Milestones & Deliverables</div>
                                                                        </div>
                                                                        <div className="flex gap-2">
                                                                            <span className="px-2 py-1 rounded bg-emerald-500/10 border border-emerald-500/20 text-[10px] font-bold text-emerald-400">
                                                                                {data.milestones?.filter(m => m.status === 'Completed').length || 1} Done
                                                                            </span>
                                                                            <span className="px-2 py-1 rounded bg-blue-500/10 border border-blue-500/20 text-[10px] font-bold text-blue-400">
                                                                                {data.milestones?.filter(m => m.status === 'In Progress').length || 1} Active
                                                                            </span>
                                                                        </div>
                                                                    </div>

                                                                    <div className="flex-1 overflow-y-auto pr-2 pl-2 custom-scrollbar space-y-0">
                                                                        {(data.milestones || [
                                                                            { name: 'Project Kickoff', date: '2025-12-01', status: 'Completed', progress: 100 },
                                                                            { name: 'Design System', date: '2025-12-15', status: 'Completed', progress: 100 },
                                                                            { name: 'Frontend Dev', date: '2026-01-14', status: 'In Progress', progress: 65 },
                                                                            { name: 'Backend Integration', date: '2026-01-28', status: 'Pending', progress: 0 },
                                                                            { name: 'User Testing', date: '2026-02-10', status: 'Pending', progress: 0 },
                                                                            { name: 'Final Release', date: '2026-02-28', status: 'Pending', progress: 0 },
                                                                        ]).map((event, idx, arr) => (
                                                                            <div key={idx} className="flex gap-4 relative group">
                                                                                {/* Line Connector */}
                                                                                {idx !== arr.length - 1 && (
                                                                                    <div className="absolute left-[9px] top-6 bottom-[-24px] w-[2px] bg-zinc-800 group-hover:bg-white/10 transition-colors" />
                                                                                )}

                                                                                {/* Status Dot */}
                                                                                <div className={`relative z-10 w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5
                                                                                    ${event.status === 'Completed' ? 'bg-emerald-500 text-black shadow-[0_0_10px_rgba(16,185,129,0.6)]' :
                                                                                        event.status === 'In Progress' ? 'bg-white border-4 border-zinc-900 shadow-[0_0_15px_rgba(255,255,255,0.6)]' :
                                                                                            'bg-zinc-800 border-2 border-zinc-700'
                                                                                    }`}>
                                                                                    {event.status === 'Completed' && <CheckCircle2 size={12} strokeWidth={3} />}
                                                                                    {event.status === 'In Progress' && <div className="w-1.5 h-1.5 rounded-full bg-black animate-pulse" />}
                                                                                </div>

                                                                                {/* Content */}
                                                                                <div className={`flex-1 pb-6 ${idx === arr.length - 1 ? 'pb-1' : ''}`}>
                                                                                    <div className="flex justify-between items-start">
                                                                                        <div>
                                                                                            <h4 className={`text-sm font-bold ${event.status === 'Pending' ? 'text-zinc-500' : 'text-white group-hover:text-cyan-400'} transition-colors`}>
                                                                                                {event.name}
                                                                                            </h4>
                                                                                            <span className="text-[10px] text-zinc-500 font-medium">
                                                                                                {new Date(event.date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                                                                                            </span>
                                                                                        </div>
                                                                                        <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider
                                                                                            ${event.status === 'Completed' ? 'bg-emerald-500/10 text-emerald-500' :
                                                                                                event.status === 'In Progress' ? 'bg-white/10 text-white' :
                                                                                                    'bg-zinc-800 text-zinc-500'
                                                                                            }`}>
                                                                                            {event.status}
                                                                                        </span>
                                                                                    </div>
                                                                                </div>
                                                                            </div>
                                                                        ))}
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </AnalyticsWidget>

                                                    {/* Widget 3: Tasks */}
                                                    <AnalyticsWidget
                                                        id="projectTasks"
                                                        title="Tasks"
                                                        subtitle="Deliverables"
                                                        icon={CheckCircle2}
                                                        size={projectWidgetSizes.projectTasks}
                                                        onSizeChange={handleProjectWidgetSizeChange}
                                                    >
                                                        <div className="flex flex-col h-full relative">
                                                            {projectWidgetSizes.projectTasks === 'small' ? (
                                                                <div className="flex flex-col justify-center h-full items-center relative">
                                                                    {/* Small: Progress Ring - Clean Version */}
                                                                    <div className="relative w-24 h-24 flex items-center justify-center">
                                                                        <svg className="w-full h-full transform -rotate-90 overflow-visible">
                                                                            {/* Track */}
                                                                            <circle cx="50%" cy="50%" r="42" stroke="#27272a" strokeWidth="8" fill="transparent" />
                                                                            {/* Progress */}
                                                                            <circle cx="50%" cy="50%" r="42" stroke="#ffffff" strokeWidth="8" fill="transparent"
                                                                                strokeDasharray={2 * Math.PI * 42}
                                                                                strokeDashoffset={2 * Math.PI * 42 * (1 - ((data.tasks?.completed || 12) / (data.tasks?.total || 28)))}
                                                                                strokeLinecap="round"
                                                                                className="drop-shadow-[0_0_10px_rgba(255,255,255,0.5)]"
                                                                            />
                                                                        </svg>
                                                                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                                                                            <span className="text-4xl font-bold text-white leading-none">{data.tasks?.pending || 16}</span>
                                                                            <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest mt-1">Left</span>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            ) : projectWidgetSizes.projectTasks === 'medium' ? (
                                                                // Medium: Stats Grid
                                                                <div className="flex h-full items-center gap-4">
                                                                    {/* Left: Total Count (Increased Size) */}
                                                                    {/* Left: Total Count (Increased Size) */}
                                                                    <div className="flex-1 flex flex-col justify-center items-center">
                                                                        <div className="text-5xl font-bold text-white tracking-tighter drop-shadow-md">
                                                                            {data.tasks?.total || 28}
                                                                        </div>
                                                                        <div className="text-[10px] text-zinc-500 font-bold uppercase tracking-[0.2em] mt-1 text-center">
                                                                            Total Tasks
                                                                        </div>
                                                                    </div>

                                                                    {/* Right: Vertical List of Stats */}
                                                                    <div className="w-[55%] flex flex-col gap-2 justify-center">
                                                                        {/* Completed Row */}
                                                                        <div className="bg-zinc-900/40 rounded border border-white/5 p-2 px-3 flex items-center justify-between group hover:bg-white/5 transition-colors">
                                                                            <div className="flex flex-col mr-2">
                                                                                <div className="text-xs font-bold text-white group-hover:text-emerald-400 transition-colors">
                                                                                    Completed
                                                                                </div>
                                                                                <div className="text-[8px] text-zinc-500 font-medium">
                                                                                    All Done
                                                                                </div>
                                                                            </div>
                                                                            <div className="text-lg font-bold text-emerald-400">
                                                                                {data.tasks?.completed || 12}
                                                                            </div>
                                                                        </div>

                                                                        {/* In Review Row */}
                                                                        <div className="bg-zinc-900/40 rounded border border-white/5 p-2 px-3 flex items-center justify-between group hover:bg-white/5 transition-colors">
                                                                            <div className="flex flex-col mr-2">
                                                                                <div className="text-xs font-bold text-white group-hover:text-blue-400 transition-colors">
                                                                                    In Review
                                                                                </div>
                                                                                <div className="text-[8px] text-zinc-500 font-medium">
                                                                                    Pending QA
                                                                                </div>
                                                                            </div>
                                                                            <div className="text-lg font-bold text-blue-400">
                                                                                {data.tasks?.inProgress || 8}
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            ) : (
                                                                // Large: Detailed Task List
                                                                <div className="flex flex-col h-full">
                                                                    <div className="flex justify-between items-center mb-4 border-b border-white/5 pb-2">
                                                                        <div>
                                                                            <div className="text-xl font-bold text-white tracking-tight">Project Tasks</div>
                                                                            <div className="text-zinc-500 text-[10px] font-bold uppercase tracking-wider mt-0.5">Priority & Status</div>
                                                                        </div>
                                                                        <div className="flex items-center gap-2">
                                                                            <span className="text-xs font-bold text-zinc-400">{data.tasks?.completed || 12}/{data.tasks?.total || 28}</span>
                                                                            <div className="w-16 h-1.5 bg-zinc-800 rounded-full">
                                                                                <div className="h-full bg-white rounded-full shadow-[0_0_8px_rgba(255,255,255,0.4)]"
                                                                                    style={{ width: `${((data.tasks?.completed || 12) / (data.tasks?.total || 28)) * 100}%` }}
                                                                                />
                                                                            </div>
                                                                        </div>
                                                                    </div>

                                                                    <div className="flex-1 overflow-y-auto pr-1 custom-scrollbar">
                                                                        <div className="space-y-1">
                                                                            {(data.tasksList || [
                                                                                { id: 1, title: 'Finalize Homepage Design', priority: 'High', status: 'Done', assignee: 'Alex' },
                                                                                { id: 2, title: 'API Integration for Auth', priority: 'High', status: 'In Progress', assignee: 'Sarah' },
                                                                                { id: 3, title: 'Setup CI/CD Pipeline', priority: 'Medium', status: 'Pending', assignee: 'Mike' },
                                                                                { id: 4, title: 'Write Documentation', priority: 'Low', status: 'Pending', assignee: 'Lisa' },
                                                                                { id: 5, title: 'Mobile Responsiveness', priority: 'High', status: 'Pending', assignee: 'Alex' },
                                                                                { id: 6, title: 'Fix Navigation Bug', priority: 'Medium', status: 'Review', assignee: 'Sarah' },
                                                                            ]).map((task, i) => (
                                                                                <div key={i} className="flex items-center gap-3 p-2 rounded hover:bg-white/5 transition-colors group">
                                                                                    <div className={`w-4 h-4 rounded-full border flex items-center justify-center
                                                                                        ${task.status === 'Done' ? 'bg-emerald-500 border-emerald-500' : 'border-zinc-600 group-hover:border-white'}`}>
                                                                                        {task.status === 'Done' && <CheckCircle2 size={10} className="text-black" strokeWidth={4} />}
                                                                                    </div>
                                                                                    <div className="flex-1 min-w-0">
                                                                                        <div className={`text-xs font-medium truncate ${task.status === 'Done' ? 'text-zinc-500 line-through' : 'text-zinc-200'}`}>
                                                                                            {task.title}
                                                                                        </div>
                                                                                    </div>
                                                                                    <div className={`px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider
                                                                                        ${task.priority === 'High' ? 'bg-red-500/10 text-red-500' :
                                                                                            task.priority === 'Medium' ? 'bg-yellow-500/10 text-yellow-500' :
                                                                                                'bg-blue-500/10 text-blue-500'}`}>
                                                                                        {task.priority}
                                                                                    </div>
                                                                                    <div className="w-5 h-5 rounded-full bg-zinc-800 border border-white/10 flex items-center justify-center text-[8px] font-bold text-zinc-400">
                                                                                        {task.assignee.charAt(0)}
                                                                                    </div>
                                                                                </div>
                                                                            ))}
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </AnalyticsWidget>

                                                    {/* Widget 4: Team */}
                                                    <AnalyticsWidget
                                                        id="projectTeam"
                                                        title="Team"
                                                        subtitle="Members"
                                                        icon={Users}
                                                        size={projectWidgetSizes.projectTeam}
                                                        onSizeChange={handleProjectWidgetSizeChange}
                                                    >
                                                        <div className="flex flex-col h-full relative">
                                                            {projectWidgetSizes.projectTeam === 'small' ? (
                                                                <div className="flex flex-col justify-center h-full items-center relative">
                                                                    {/* Small: Avatar Stack */}
                                                                    <div className="flex -space-x-4 mb-2 pt-2">
                                                                        {[
                                                                            { letter: 'M', color: 'bg-zinc-800 text-zinc-300' },
                                                                            { letter: 'S', color: 'bg-zinc-700 text-zinc-200' },
                                                                            { letter: 'A', color: 'bg-zinc-600 text-white' }
                                                                        ].map((u, i) => (
                                                                            <div key={i} className={`w-11 h-11 rounded-full border-2 border-[#09090b] flex items-center justify-center text-sm font-bold shadow-lg ${u.color} z-${i}`}>
                                                                                {u.letter}
                                                                            </div>
                                                                        ))}
                                                                        <div className="w-11 h-11 rounded-full border-2 border-[#09090b] flex items-center justify-center text-xs font-bold bg-white text-black shadow-[0_0_10px_rgba(255,255,255,0.4)] z-10">
                                                                            +{((data.team?.length || 8) - 3)}
                                                                        </div>
                                                                    </div>
                                                                    <div className="flex flex-col items-center">
                                                                        <span className="text-3xl font-bold text-white tracking-tighter drop-shadow-md">
                                                                            {data.team?.length || 8}
                                                                        </span>
                                                                        <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest -mt-0.5">Active</span>
                                                                    </div>
                                                                </div>
                                                            ) : projectWidgetSizes.projectTeam === 'medium' ? (
                                                                // Medium: Roles Breakdown (Reference Style)
                                                                <div className="flex h-full gap-2">
                                                                    {/* Left: Total Stats */}
                                                                    <div className="flex-1 flex flex-col justify-center items-center">
                                                                        <div className="text-5xl font-bold text-white tracking-tighter drop-shadow-[0_0_15px_rgba(255,255,255,0.4)]">
                                                                            {data.team?.length || 8}
                                                                        </div>
                                                                        <div className="text-[9px] text-zinc-500 font-bold uppercase tracking-[0.2em] mt-1 text-center">
                                                                            Total Members
                                                                        </div>
                                                                        <div className="mt-3 bg-zinc-800/80 rounded-full px-3 py-1 flex items-center gap-2 border border-white/5 shadow-inner">
                                                                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_currentColor]" />
                                                                            <span className="text-[9px] font-bold text-zinc-300">{(data.team?.length || 8) - 1} Active</span>
                                                                        </div>
                                                                    </div>

                                                                    {/* Right: Role Breakdowns */}
                                                                    <div className="w-[55%] flex flex-col justify-center gap-2">
                                                                        {[
                                                                            { role: 'DEVELOPERS', count: 4, percent: 50 },
                                                                            { role: 'DESIGNERS', count: 2, percent: 30 },
                                                                            { role: 'MANAGERS', count: 2, percent: 20 }
                                                                        ].map((item, i) => (
                                                                            <div key={i} className="flex items-center justify-between p-2 py-2.5 rounded-lg border border-white/5 bg-zinc-900/60 hover:bg-white/5 transition-colors group">
                                                                                <div className="flex items-center gap-3">
                                                                                    <span className="text-sm font-bold text-white w-2">{item.count}</span>
                                                                                    <span className="text-[8px] font-bold text-zinc-500 uppercase tracking-widest">{item.role}</span>
                                                                                </div>
                                                                                {/* Progress Bar */}
                                                                                <div className="w-8 h-1 bg-zinc-700/50 rounded-full overflow-hidden">
                                                                                    <div
                                                                                        className="h-full bg-white rounded-full group-hover:bg-cyan-400 transition-colors duration-300 shadow-[0_0_5px_rgba(255,255,255,0.5)]"
                                                                                        style={{ width: `${item.percent}%` }}
                                                                                    />
                                                                                </div>
                                                                            </div>
                                                                        ))}
                                                                    </div>
                                                                </div>
                                                            ) : (
                                                                // Large: Detailed Team List
                                                                <div className="flex flex-col h-full">
                                                                    <div className="flex justify-between items-center mb-4 border-b border-white/5 pb-2">
                                                                        <div>
                                                                            <div className="text-xl font-bold text-white tracking-tight">Project Team</div>
                                                                            <div className="text-zinc-500 text-[10px] font-bold uppercase tracking-wider mt-0.5">Key Contributors & Leads</div>
                                                                        </div>
                                                                        <div className="px-2 py-1 bg-white/5 rounded border border-white/10">
                                                                            <span className="text-xs font-bold text-white">{data.team?.length || 8} Total</span>
                                                                        </div>
                                                                    </div>

                                                                    <div className="flex-1 overflow-y-auto pr-1 custom-scrollbar">
                                                                        <div className="space-y-1">
                                                                            {([
                                                                                { name: 'Mohit Inert', role: 'Dev Manager', status: 'Online', isLead: true, avatar: 'M' },
                                                                                { name: 'Sarah Jenkins', role: 'Lead Designer', status: 'Online', isLead: false, avatar: 'S' },
                                                                                { name: 'Alex Rivera', role: 'Frontend Dev', status: 'In Meeting', isLead: false, avatar: 'A' },
                                                                                { name: 'Mike Chen', role: 'Backend Dev', status: 'Offline', isLead: false, avatar: 'M' },
                                                                                { name: 'Lisa Ray', role: 'QA Engineer', status: 'Online', isLead: false, avatar: 'L' },
                                                                                { name: 'David Kim', role: 'Product Owner', status: 'Offline', isLead: false, avatar: 'D' },
                                                                            ]).map((member, i) => (
                                                                                <div key={i} className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/5 transition-all group border border-transparent hover:border-white/5">
                                                                                    <div className="relative">
                                                                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border
                                                                                            ${member.isLead
                                                                                                ? 'bg-white text-black border-white shadow-[0_0_15px_rgba(255,255,255,0.4)]'
                                                                                                : 'bg-zinc-800 text-zinc-400 border-white/10 group-hover:border-white/30'}`}>
                                                                                            {member.avatar}
                                                                                        </div>
                                                                                        <div className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-black
                                                                                            ${member.status === 'Online' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]' :
                                                                                                member.status === 'In Meeting' ? 'bg-yellow-500' : 'bg-zinc-600'}`}
                                                                                        />
                                                                                    </div>

                                                                                    <div className="flex-1 min-w-0">
                                                                                        <div className="flex items-center gap-2">
                                                                                            <span className={`text-sm font-bold truncate ${member.isLead ? 'text-white' : 'text-zinc-300'}`}>
                                                                                                {member.name}
                                                                                            </span>
                                                                                            {member.isLead && (
                                                                                                <span className="px-1.5 py-0.5 rounded-[4px] bg-white/10 border border-white/20 text-[8px] font-bold text-white uppercase tracking-wider">
                                                                                                    Lead
                                                                                                </span>
                                                                                            )}
                                                                                        </div>
                                                                                        <div className="text-[10px] text-zinc-500 font-medium truncate">
                                                                                            {member.role}
                                                                                        </div>
                                                                                    </div>

                                                                                    <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                                                                                        <div className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 cursor-pointer">
                                                                                            <Users size={12} className="text-white" />
                                                                                        </div>
                                                                                    </div>
                                                                                </div>
                                                                            ))}
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </AnalyticsWidget>

                                                </div>
                                            </div>
                                        </div>

                                        {/* Right Panel: Project Card */}
                                        <div className="relative w-[384px] h-full shrink-0">
                                            {/* Toggle Button */}
                                            <motion.button
                                                onClick={(e) => { e.stopPropagation(); setIsExpanded(!isExpanded); }}
                                                whileHover={{ scale: 1.1 }}
                                                whileTap={{ scale: 0.95 }}
                                                className="absolute -left-5 top-1/2 -translate-y-1/2 z-[100] w-10 h-10 rounded-full bg-zinc-900 border border-white/10 shadow-2xl flex items-center justify-center cursor-pointer hover:bg-zinc-800 hover:border-cyan-500/30 transition-all duration-300 group"
                                                title={isExpanded ? "Collapse Details" : "Expand Details"}
                                            >
                                                <motion.div
                                                    animate={{ rotate: isExpanded ? 45 : -135 }}
                                                    transition={{ type: "spring", stiffness: 300, damping: 20 }}
                                                >
                                                    <ArrowUpRight
                                                        size={18}
                                                        className={`transition-colors duration-300 ${isExpanded ? 'text-cyan-400' : 'text-white/60 group-hover:text-white'}`}
                                                    />
                                                </motion.div>
                                                <div className="absolute inset-0 rounded-full border-2 border-cyan-400/0 group-hover:border-cyan-400/30 group-hover:animate-ping" />
                                            </motion.button>

                                            {/* Actual Right Panel Content */}
                                            <div className="relative w-full h-full bg-black rounded-[24px] overflow-hidden shadow-2xl">
                                                {/* Project Icon Background */}
                                                <div className="absolute top-0 left-0 right-0 h-[300px] z-0 pointer-events-none bg-gradient-to-b from-zinc-900 to-black flex items-center justify-center">
                                                    <div className="w-32 h-32 rounded-3xl bg-white/10 flex items-center justify-center text-white font-black text-6xl shadow-2xl">
                                                        {data.name?.charAt(0) || 'P'}
                                                    </div>
                                                </div>

                                                {/* Top Fade Mask */}
                                                <div className="absolute top-0 left-0 right-0 h-40 bg-gradient-to-b from-black via-black/60 to-transparent z-20 pointer-events-none" />

                                                {/* Scrollable Content */}
                                                <div className="absolute inset-0 z-10 overflow-y-auto custom-scrollbar pointer-events-auto">
                                                    {/* Spacer */}
                                                    <div className="h-[240px] w-full bg-transparent pointer-events-none" />

                                                    {/* Content Wrapper */}
                                                    <div className="relative z-10 flex flex-col bg-gradient-to-b from-transparent via-black/80 to-black/90 -mt-20 pt-20 px-6">

                                                        {/* Project Name */}
                                                        <div className="pb-6 pl-2">
                                                            <h1 className="text-3xl font-black text-white leading-tight tracking-tight shadow-black drop-shadow-lg mb-2">
                                                                {data.name}
                                                            </h1>
                                                            <span className={`px-3 py-1 rounded-lg text-[10px] uppercase font-black tracking-widest border ${data.status === 'completed' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                                                                data.status === 'in-progress' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                                                                    'bg-zinc-500/10 text-zinc-400 border-zinc-500/20'
                                                                } shadow-sm`}>
                                                                {data.status?.replace(/-/g, ' ') || 'Active'}
                                                            </span>
                                                        </div>

                                                        {/* Stats Row */}
                                                        <div className="grid grid-cols-3 gap-2 pb-6 border-b border-white/5 mb-6 mx-2">
                                                            {/* Project ID */}
                                                            <div className="text-center group">
                                                                <Hash size={14} className="text-cyan-400 mx-auto mb-2 opacity-80 group-hover:opacity-100 transition-opacity" />
                                                                <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold mb-1">ID</p>
                                                                <p className="text-xs font-bold text-white tracking-wide truncate px-1 font-mono">{data._id?.slice(-6) || 'N/A'}</p>
                                                            </div>

                                                            {/* Progress */}
                                                            <div className="text-center group">
                                                                <TrendingUp size={14} className="text-cyan-400 mx-auto mb-2 opacity-80 group-hover:opacity-100 transition-opacity" />
                                                                <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold mb-1">Progress</p>
                                                                <p className="text-sm font-bold text-white tracking-wide">{data.progress || 0}%</p>
                                                            </div>

                                                            {/* Deadline */}
                                                            <div className="text-center group">
                                                                <Calendar size={14} className="text-cyan-400 mx-auto mb-2 opacity-80 group-hover:opacity-100 transition-opacity" />
                                                                <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold mb-1">Deadline</p>
                                                                <p className="text-sm font-bold text-white tracking-wide">
                                                                    {data.deadline ? new Date(data.deadline).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : 'N/A'}
                                                                </p>
                                                            </div>
                                                        </div>

                                                        {/* Info Section */}
                                                        <div className="space-y-4 p-6 pb-12 bg-black/60 backdrop-blur-2xl rounded-[32px] border border-white/5 shadow-2xl min-h-[200px]">
                                                            {/* Project Lead */}
                                                            <div className="flex items-center gap-4 px-2 hover:translate-x-1 transition-transform group cursor-default">
                                                                <div className="p-2 bg-white/5 rounded-full text-gray-400 group-hover:text-cyan-400 transition-colors">
                                                                    <User size={16} />
                                                                </div>
                                                                <div className="flex-1 min-w-0">
                                                                    <p className="text-[10px] text-gray-500 uppercase tracking-wider font-bold mb-0.5">Project Lead</p>
                                                                    <p className="text-sm font-bold text-white truncate">
                                                                        {data.assignedManager ? `${data.assignedManager.firstName} ${data.assignedManager.lastName}` : data.managerName || 'Unassigned'}
                                                                    </p>
                                                                </div>
                                                            </div>

                                                            {/* Client */}
                                                            <div className="flex items-center gap-4 px-2 hover:translate-x-1 transition-transform group cursor-default">
                                                                <div className="p-2 bg-white/5 rounded-full text-gray-400 group-hover:text-cyan-400 transition-colors">
                                                                    <Building2 size={16} />
                                                                </div>
                                                                <div className="flex-1 min-w-0">
                                                                    <p className="text-[10px] text-gray-500 uppercase tracking-wider font-bold mb-0.5">Client</p>
                                                                    <p className="text-sm font-bold text-white truncate">{data.client || 'Internal Project'}</p>
                                                                </div>
                                                            </div>

                                                            {/* Tasks Summary */}
                                                            <div className="pt-2 px-2">
                                                                <div className="flex items-center gap-2 mb-3">
                                                                    <CheckCircle2 size={14} className="text-cyan-500" />
                                                                    <h3 className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">
                                                                        Task Summary
                                                                    </h3>
                                                                </div>
                                                                <div className="grid grid-cols-2 gap-2">
                                                                    <div className="py-2 px-3 bg-white/5 rounded-lg border border-white/5 text-center">
                                                                        <div className="text-lg font-bold text-white">{data.tasks?.total || data.tasks?.length || 0}</div>
                                                                        <div className="text-[9px] text-zinc-500 uppercase">Total</div>
                                                                    </div>
                                                                    <div className="py-2 px-3 bg-emerald-500/10 rounded-lg border border-emerald-500/20 text-center">
                                                                        <div className="text-lg font-bold text-emerald-400">{data.tasks?.completed || 0}</div>
                                                                        <div className="text-[9px] text-emerald-500 uppercase">Done</div>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </>
                                )}
                            </div>
                        )}
                    </div>


                </motion.div >
            </div >
        </AnimatePresence >
    );
};

const InfoCard = ({ icon: Icon, label, value, status, statusColor }) => (
    <div className="p-4 bg-white/5 border border-white/10 rounded-2xl flex items-center gap-3">
        <div className="p-2 bg-gray-800 rounded-lg text-gray-400">
            <Icon size={16} />
        </div>
        <div className="min-w-0">
            <p className="text-[10px] text-gray-500 uppercase tracking-wider font-medium">{label}</p>
            <p className={`text-sm font-semibold truncate ${status !== undefined ? (status ? 'text-green-400' : 'text-red-400') :
                (statusColor || 'text-white')
                }`}>
                {value}
            </p>
        </div>
    </div>
);

export default QuickDetailsPanel;
