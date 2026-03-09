import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  Trophy,
  Medal,
  Award,
  TrendingUp,
  Users,
  Target,
  CheckCircle,
  Clock,
  Star,
  Calendar,
  Filter,
  Download,
  Eye,
  ArrowUp,
  ArrowDown,
  Trash2,
  UserPlus,
  X,
  Search,
  Zap,
  Maximize2,
  Minimize2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import api from '../utils/api';
import { filterEmployees, FILTERED_EMPLOYEES } from '../utils/employeeFilter';
import { showToast } from '../utils/toast';
import PerformanceDetailModal from '../components/PerformanceDetailModal';

// --- Animations ---
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.1
    }
  }
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      type: "spring",
      stiffness: 100,
      damping: 10
    }
  }
};

// --- Reusable Widget Component ---
const PerformanceWidget = ({ title, subtitle, size, onSizeChange, children, color = "violet", variants }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartY, setDragStartY] = useState(0);
  const [initialSize, setInitialSize] = useState(size);

  const getGridClass = () => {
    switch (size) {
      case 'small': return 'col-span-12 md:col-span-6 lg:col-span-3 row-span-1 h-[220px]';
      case 'medium': return 'col-span-12 md:col-span-12 lg:col-span-6 row-span-1 h-[220px]';
      case 'large': return 'col-span-12 md:col-span-12 lg:col-span-6 row-span-2 h-[464px]';
      default: return 'col-span-12 md:col-span-6 lg:col-span-3 row-span-1 h-[220px]';
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
      onSizeChange('medium');
      setInitialSize('medium');
      setDragStartY(currentY);
    } else if (deltaY > 50 && initialSize === 'medium') {
      onSizeChange('large');
      setInitialSize('large');
      setDragStartY(currentY);
    } else if (deltaY < -50 && initialSize === 'large') {
      onSizeChange('medium');
      setInitialSize('medium');
      setDragStartY(currentY);
    } else if (deltaY < -50 && initialSize === 'medium') {
      onSizeChange('small');
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
      variants={variants}
      className={`relative rounded-[24px] bg-gradient-to-b from-[#18181b] to-[#09090b] border border-white/5 shadow-2xl overflow-hidden group outline-none focus:outline-none ${getGridClass()}`}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
    >
      <div className={`absolute inset-0 bg-gradient-to-tr from-${color}-500/5 via-${color}-500/5 to-${color}-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none`} />

      <div className="relative p-6 h-full flex flex-col z-10">
        <div className="flex items-start justify-between mb-3 z-10 relative">
          <div>
            <h3 className="text-transparent bg-clip-text bg-gradient-to-r from-white to-zinc-400 font-bold text-sm tracking-wide">{title}</h3>
            {subtitle && <p className="text-zinc-500 text-[10px] mt-0.5 font-medium tracking-wider uppercase">{subtitle}</p>}
          </div>
        </div>
        <div className="flex-1 min-h-0 relative flex flex-col z-0">
          {children}
        </div>
      </div>

      {/* Resize Handle */}
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

const HRPerformance = () => {
  const { user } = useAuth();
  const [performanceData, setPerformanceData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedPeriod, setSelectedPeriod] = useState('all-time');
  const [sortBy, setSortBy] = useState('totalPoints');
  const [sortOrder, setSortOrder] = useState('desc');
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddEmployeeModal, setShowAddEmployeeModal] = useState(false);
  const [showRemoveConfirm, setShowRemoveConfirm] = useState(false);
  const [employeeToRemove, setEmployeeToRemove] = useState(null);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [newEmployee, setNewEmployee] = useState({
    name: '',
    email: '',
    department: '',
    employeeId: ''
  });

  const [widgetStates, setWidgetStates] = useState(() => {
    const saved = localStorage.getItem('hrPerformanceWidgetStates');
    return saved ? JSON.parse(saved) : {
      overview: 'medium',
      metrics: 'medium'
    };
  });

  useEffect(() => {
    localStorage.setItem('hrPerformanceWidgetStates', JSON.stringify(widgetStates));
  }, [widgetStates]);

  const handleWidgetSizeChange = (key, size) => {
    setWidgetStates(prev => ({ ...prev, [key]: size }));
  };

  // Fetch performance data
  const fetchPerformanceData = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await api.get(`/hr/performance/all?period=${selectedPeriod}&page=1&limit=100`);
      const employees = response.data.data || [];
      setPerformanceData(employees);
      setError(null);
    } catch (error) {
      console.error('[HRPerformance] Error fetching performance data:', error);
      setPerformanceData([]);
      const errorMessage = error.response?.data?.message || 'Failed to load performance data. Please try again.';
      setError(errorMessage);
      showToast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [selectedPeriod]);

  useEffect(() => {
    fetchPerformanceData();
  }, [fetchPerformanceData]);

  // Sort and filter performance data
  const getSortedAndFilteredData = () => {
    let filteredData = performanceData.filter(individual => {
      const nameMatch = individual.name?.toLowerCase().includes(searchTerm.toLowerCase());
      const emailMatch = individual.email?.toLowerCase().includes(searchTerm.toLowerCase());
      return nameMatch || emailMatch;
    });

    filteredData.sort((a, b) => {
      let sortField = sortBy;
      if (sortBy === 'totalPoints') sortField = 'totalPointsEarned';

      let aValue = a[sortField];
      let bValue = b[sortField];

      if (aValue === undefined) aValue = 0;
      if (bValue === undefined) bValue = 0;

      if (sortBy === 'name') {
        aValue = String(aValue).toLowerCase();
        bValue = String(bValue).toLowerCase();
      }

      if (sortOrder === 'asc') return aValue > bValue ? 1 : -1;
      return aValue < bValue ? 1 : -1;
    });

    return filteredData.map((individual, index) => ({
      ...individual,
      rank: index + 1
    }));
  };

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  const getPerformanceLevel = (completionRate) => {
    if (completionRate >= 90) return { label: 'Excellent', color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' };
    if (completionRate >= 75) return { label: 'Good', color: 'text-blue-400 bg-blue-500/10 border-blue-500/20' };
    if (completionRate >= 60) return { label: 'Average', color: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20' };
    return { label: 'Below Avg', color: 'text-red-400 bg-red-500/10 border-red-500/20' };
  };

  const handleAddEmployee = async (e) => {
    e.preventDefault();
    try {
      showToast.success(`Add employee functionality: ${newEmployee.name}`);
      setShowAddEmployeeModal(false);
      setNewEmployee({ name: '', email: '', department: '', employeeId: '' });
    } catch (error) {
      showToast.error('Failed to add employee');
    }
  };

  const handleRemoveEmployee = async () => {
    if (!employeeToRemove) return;
    try {
      showToast.success(`Remove employee functionality: ${employeeToRemove.name}`);
      setShowRemoveConfirm(false);
      setEmployeeToRemove(null);
    } catch (error) {
      showToast.error('Failed to remove employee');
    }
  };

  const handleViewDetails = async (employee) => {
    // Show modal immediately with basic info
    setSelectedEmployee(employee);
    setShowDetailModal(true);

    try {
      const employeeId = employee.employeeId || employee._id;
      if (!employeeId) return;

      const response = await api.get(`/hr/performance/${employeeId}?period=${selectedPeriod}`);
      // Merge the new detailed data with the existing basic info (preserving name, etc.)
      setSelectedEmployee(prev => {
        if (!prev) return response.data.data;
        // Ensure we don't return a new object if the modal was closed
        return { ...prev, ...response.data.data };
      });
    } catch (error) {
      showToast.error('Failed to load updated details: ' + (error.response?.data?.message || error.message));
    }
  };

  const exportPerformanceData = () => {
    const csvContent = [
      ['Rank', 'Name', 'Email', 'Total Points', 'Completed Tasks', 'Total Tasks', 'Completion Rate %', 'On-Time Rate %', 'Productivity Score'],
      ...getSortedAndFilteredData().map(individual => [
        individual.rank || 0,
        individual.name,
        individual.email,
        individual.totalPointsEarned || 0,
        individual.completedTasks || 0,
        individual.totalTasks || 0,
        individual.completionRate || 0,
        individual.onTimeDeliveryRate || 0,
        individual.productivityScore || 0
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `performance-report-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const sortedData = getSortedAndFilteredData();

  // Calculate Stats
  const avgCompletion = sortedData.length > 0
    ? Math.round(sortedData.reduce((sum, emp) => sum + emp.completionRate, 0) / sortedData.length)
    : 0;

  const totalPoints = sortedData.reduce((sum, emp) => sum + (emp.totalPointsEarned || emp.totalPoints || 0), 0);
  const totalTasks = sortedData.reduce((sum, emp) => sum + emp.completedTasks, 0);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <motion.div
      className="space-y-6"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Header */}
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-black text-white flex items-center tracking-tight">
            Performance Dashboard
          </h1>
          <p className="mt-1 text-zinc-400 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
            Track and analyze individual employee performance metrics
          </p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={() => setShowAddEmployeeModal(true)}
            className="flex items-center px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all shadow-lg shadow-blue-500/20 font-medium"
          >
            <UserPlus className="w-4 h-4 mr-2" />
            <span>Add Employee</span>
          </button>
          <button
            onClick={exportPerformanceData}
            className="flex items-center px-4 py-2 bg-zinc-800/50 text-zinc-300 rounded-xl hover:bg-zinc-700/50 transition-colors border border-white/5 font-medium"
          >
            <Download className="w-4 h-4 mr-2" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-zinc-900/50 backdrop-blur-md rounded-2xl shadow-xl border border-white/5 p-4">
        <div className="flex flex-col md:flex-row md:items-center space-y-4 md:space-y-0 md:space-x-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-zinc-400" />
            <input
              type="text"
              placeholder="Search employees..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-zinc-800/50 border border-zinc-700/50 rounded-xl text-sm text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
            />
          </div>
          <div className="w-full md:w-48">
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="w-full px-3 py-2.5 bg-zinc-800/50 border border-zinc-700/50 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
            >
              <option value="all-time">All Time</option>
              <option value="this-year">This Year</option>
              <option value="this-quarter">This Quarter</option>
              <option value="this-month">This Month</option>
              <option value="last-30-days">Last 30 Days</option>
            </select>
          </div>
        </div>
      </div>

      {/* Widgets Grid */}
      <div className="grid grid-cols-12 gap-6 auto-rows-min grid-flow-dense">
        {/* Widget 1: Team Overview */}
        <PerformanceWidget
          title="Team Statistics"
          subtitle="Active Staff & Efficiency"
          size={widgetStates.overview}
          onSizeChange={(s) => handleWidgetSizeChange('overview', s)}
          color="blue"
          variants={itemVariants}
        >
          {widgetStates.overview === 'large' ? (
            // Large: Show Performance Line Graph (Recharts)
            <div className="flex flex-col h-full">
              <div className="text-xs text-zinc-500 font-bold uppercase tracking-wider mb-2">Team Performance Flow</div>
              <div className="flex-1 min-h-0">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={sortedData.slice(0, 8).map((emp) => ({
                      name: emp.name.split(' ')[0],
                      rate: emp.completionRate || 0,
                      fullName: emp.name,
                      points: emp.totalPointsEarned || emp.totalPoints || 0
                    }))}
                    margin={{ top: 10, right: 10, bottom: 5, left: 0 }}
                  >
                    <defs>
                      <filter id="whiteGlow" x="-50%" y="-50%" width="200%" height="200%">
                        <feGaussianBlur in="SourceAlpha" stdDeviation="3" result="blur" />
                        <feFlood floodColor="white" result="color" />
                        <feComposite in="color" in2="blur" operator="in" result="shadow" />
                        <feMerge>
                          <feMergeNode in="shadow" />
                          <feMergeNode in="SourceGraphic" />
                        </feMerge>
                      </filter>
                    </defs>
                    <CartesianGrid
                      strokeDasharray="0"
                      stroke="rgba(255,255,255,0.05)"
                      vertical={false}
                    />
                    <XAxis
                      dataKey="name"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: '#71717a', fontSize: 10, fontWeight: 600 }}
                      dy={5}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: '#71717a', fontSize: 10, fontWeight: 600 }}
                      domain={[0, 100]}
                      ticks={[0, 25, 50, 75, 100]}
                      dx={-5}
                    />
                    <Tooltip
                      cursor={{ stroke: 'rgba(255,255,255,0.1)', strokeWidth: 1 }}
                      content={({ active, payload }) => {
                        if (!active || !payload || !payload.length) return null;
                        const data = payload[0].payload;
                        return (
                          <div className="bg-[#09090b] px-4 py-3 rounded-xl border border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.5)] min-w-[140px]">
                            <div className="flex items-center justify-between mb-2 pb-2 border-b border-white/5">
                              <span className="text-zinc-400 text-[10px] font-bold uppercase tracking-widest">{data.fullName}</span>
                            </div>
                            <div className="flex items-baseline gap-1.5">
                              <span className="text-2xl font-black text-white">{data.rate}%</span>
                              <span className="text-xs font-bold text-zinc-500 uppercase tracking-wide">Complete</span>
                            </div>
                            <div className="mt-2 text-[9px] text-zinc-600 font-medium">
                              {data.points.toLocaleString()} points earned
                            </div>
                          </div>
                        );
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="rate"
                      stroke="white"
                      strokeWidth={3}
                      dot={{
                        fill: 'white',
                        r: 4,
                        filter: 'url(#whiteGlow)'
                      }}
                      activeDot={{
                        fill: 'white',
                        r: 6,
                        filter: 'url(#whiteGlow)'
                      }}
                      filter="url(#whiteGlow)"
                      animationDuration={2000}
                      animationEasing="ease-in-out"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              {/* Legend */}
              <div className="mt-2 flex items-center justify-center gap-4 text-[9px] text-zinc-500">
                <div className="flex items-center gap-1">
                  <div className="w-3 h-0.5 bg-white" style={{ boxShadow: '0 0 4px rgba(255,255,255,0.8)' }}></div>
                  <span>Completion Rate</span>
                </div>
                <span>•</span>
                <span>Top {Math.min(sortedData.length, 8)} Performers</span>
              </div>
            </div>
          ) : widgetStates.overview === 'medium' ? (
            // Medium: Show Performance Tiers Only (White Theme)
            <div className="flex flex-col h-full justify-center">
              <div className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider mb-4 text-center">Performance Distribution</div>
              <div className="grid grid-cols-4 gap-3 px-2">
                <div className="bg-white/10 rounded-xl p-3 border border-white/20 flex flex-col items-center justify-center hover:bg-white/15 transition-all group">
                  <span className="text-lg mb-1 group-hover:scale-110 transition-transform">⭐</span>
                  <span className="text-xl font-black text-white">{sortedData.filter(e => e.completionRate >= 90).length}</span>
                  <span className="text-[9px] text-zinc-400 uppercase font-bold mt-1">Exc</span>
                </div>
                <div className="bg-white/10 rounded-xl p-3 border border-white/20 flex flex-col items-center justify-center hover:bg-white/15 transition-all group">
                  <span className="text-lg mb-1 group-hover:scale-110 transition-transform">✓</span>
                  <span className="text-xl font-black text-white">{sortedData.filter(e => e.completionRate >= 75 && e.completionRate < 90).length}</span>
                  <span className="text-[9px] text-zinc-400 uppercase font-bold mt-1">Good</span>
                </div>
                <div className="bg-white/10 rounded-xl p-3 border border-white/20 flex flex-col items-center justify-center hover:bg-white/15 transition-all group">
                  <span className="text-lg mb-1 group-hover:scale-110 transition-transform">○</span>
                  <span className="text-xl font-black text-white">{sortedData.filter(e => e.completionRate >= 60 && e.completionRate < 75).length}</span>
                  <span className="text-[9px] text-zinc-400 uppercase font-bold mt-1">Avg</span>
                </div>
                <div className="bg-white/10 rounded-xl p-3 border border-white/20 flex flex-col items-center justify-center hover:bg-white/15 transition-all group">
                  <span className="text-lg mb-1 group-hover:scale-110 transition-transform">△</span>
                  <span className="text-xl font-black text-white">{sortedData.filter(e => e.completionRate < 60).length}</span>
                  <span className="text-[9px] text-zinc-400 uppercase font-bold mt-1">Low</span>
                </div>
              </div>
            </div>
          ) : (
            // Small: Show Grid Stats
            <div className="flex flex-col h-full justify-center">
              <div className="grid grid-cols-2 gap-4 h-full">
                <div className="bg-blue-500/5 rounded-2xl p-4 border border-blue-500/10 flex flex-col justify-center items-center relative overflow-hidden group hover:border-blue-500/30 transition-all">
                  <div className="absolute inset-0 bg-blue-500/10 blur-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="text-white text-5xl font-black leading-none drop-shadow-xl relative z-10">{sortedData.length}</div>
                  <div className="text-[11px] text-zinc-400 font-bold uppercase tracking-widest mt-2 relative z-10 text-center">Active Employees</div>
                </div>
                <div className="bg-emerald-500/5 rounded-2xl p-4 border border-emerald-500/10 flex flex-col justify-center items-center relative overflow-hidden group hover:border-emerald-500/30 transition-all">
                  <div className="absolute inset-0 bg-emerald-500/10 blur-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="text-white text-5xl font-black leading-none drop-shadow-xl relative z-10">{avgCompletion}%</div>
                  <div className="text-[11px] text-zinc-400 font-bold uppercase tracking-widest mt-2 relative z-10 text-center">Avg Completion</div>
                </div>
              </div>
            </div>
          )}
        </PerformanceWidget>

        {/* Widget 2: Productivity Metrics */}
        <PerformanceWidget
          title="Productivity"
          subtitle="Points & Tasks Analysis"
          size={widgetStates.metrics}
          onSizeChange={(s) => handleWidgetSizeChange('metrics', s)}
          color="amber"
          variants={itemVariants}
        >
          {widgetStates.metrics === 'large' ? (
            // Large: Show Productivity Trend Chart
            <div className="flex flex-col h-full justify-between">
              <div className="text-xs text-zinc-500 font-bold uppercase tracking-wider mb-3">Productivity Distribution</div>
              <div className="flex-1 flex flex-col justify-around gap-4">
                {/* Points Distribution */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-zinc-400">Points Distribution</span>
                    <span className="text-xs font-black text-white">{totalPoints.toLocaleString()} Total</span>
                  </div>
                  <div className="relative h-3 bg-white/5 rounded-full overflow-hidden">
                    {sortedData.slice(0, 10).reduce((acc, emp, idx) => {
                      const points = emp.totalPointsEarned || emp.totalPoints || 0;
                      const percentage = (points / totalPoints) * 100;
                      // White/Monochrome Palette
                      const colors = ['bg-white', 'bg-zinc-200', 'bg-zinc-300', 'bg-zinc-400', 'bg-zinc-500', 'bg-zinc-300', 'bg-zinc-400', 'bg-zinc-200', 'bg-zinc-500', 'bg-white'];

                      acc.segments.push(
                        <div
                          key={emp.employeeId || idx}
                          className={`absolute inset-y-0 ${colors[idx % colors.length]}`}
                          style={{
                            left: `${acc.currentPos}%`,
                            width: `${percentage}%`
                          }}
                          title={`${emp.name}: ${points.toLocaleString()} pts`}
                        />
                      );
                      acc.currentPos += percentage;
                      return acc;
                    }, { segments: [], currentPos: 0 }).segments}
                  </div>
                </div>

                {/* Task Completion by Top Performers */}
                <div className="space-y-2">
                  <div className="text-xs font-bold text-zinc-400 mb-2">Task Completion - Top 5</div>
                  {sortedData.slice(0, 5).map((emp, idx) => {
                    const completionPercentage = emp.completionRate || 0;
                    return (
                      <div key={emp.employeeId || idx} className="flex items-center gap-2">
                        <div className="w-20 text-xs text-zinc-400 truncate">{emp.name.split(' ')[0]}</div>
                        <div className="flex-1 relative h-1.5 bg-white/5 rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${completionPercentage}%` }}
                            transition={{ duration: 1, delay: idx * 0.1 }}
                            className={`absolute inset-y-0 left-0 rounded-full ${completionPercentage >= 90 ? 'bg-emerald-500' :
                              completionPercentage >= 75 ? 'bg-blue-500' :
                                completionPercentage >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                              }`}
                            style={{
                              boxShadow: `0 0 8px ${completionPercentage >= 90 ? 'rgba(16, 185, 129, 0.5)' :
                                completionPercentage >= 75 ? 'rgba(59, 130, 246, 0.5)' :
                                  completionPercentage >= 60 ? 'rgba(234, 179, 8, 0.5)' : 'rgba(239, 68, 68, 0.5)'
                                }`
                            }}
                          />
                        </div>
                        <div className="w-12 text-right text-xs font-bold text-white">{completionPercentage}%</div>
                      </div>
                    );
                  })}
                </div>

                {/* Average Metrics */}
                <div className="grid grid-cols-3 gap-2">
                  <div className="bg-amber-500/5 rounded-xl p-2 border border-amber-500/10 text-center">
                    <div className="text-lg font-black text-white">{Math.round(totalPoints / sortedData.length || 0)}</div>
                    <div className="text-[9px] text-zinc-500 font-bold uppercase">Avg Points</div>
                  </div>
                  <div className="bg-purple-500/5 rounded-xl p-2 border border-purple-500/10 text-center">
                    <div className="text-lg font-black text-white">{Math.round(totalTasks / sortedData.length || 0)}</div>
                    <div className="text-[9px] text-zinc-500 font-bold uppercase">Avg Tasks</div>
                  </div>
                  <div className="bg-blue-500/5 rounded-xl p-2 border border-blue-500/10 text-center">
                    <div className="text-lg font-black text-white">{avgCompletion}%</div>
                    <div className="text-[9px] text-zinc-500 font-bold uppercase">Avg Rate</div>
                  </div>
                </div>
              </div>
            </div>
          ) : widgetStates.metrics === 'medium' ? (
            // Medium: Productivity Overview (White Theme - 4 Grid)
            <div className="flex flex-col h-full justify-center">
              <div className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider mb-4 text-center">Productivity Overview</div>
              <div className="grid grid-cols-4 gap-3 px-2">
                <div className="bg-white/10 rounded-xl p-3 border border-white/20 flex flex-col items-center justify-center hover:bg-white/15 transition-all group">
                  <Zap size={18} className="text-white mb-2 group-hover:scale-110 transition-transform" />
                  <span className="text-lg font-black text-white">{totalPoints.toLocaleString()}</span>
                  <span className="text-[9px] text-zinc-400 uppercase font-bold mt-1">Total Pts</span>
                </div>
                <div className="bg-white/10 rounded-xl p-3 border border-white/20 flex flex-col items-center justify-center hover:bg-white/15 transition-all group">
                  <CheckCircle size={18} className="text-white mb-2 group-hover:scale-110 transition-transform" />
                  <span className="text-lg font-black text-white">{totalTasks.toLocaleString()}</span>
                  <span className="text-[9px] text-zinc-400 uppercase font-bold mt-1">Tasks</span>
                </div>
                <div className="bg-white/10 rounded-xl p-3 border border-white/20 flex flex-col items-center justify-center hover:bg-white/15 transition-all group">
                  <TrendingUp size={18} className="text-white mb-2 group-hover:scale-110 transition-transform" />
                  <span className="text-lg font-black text-white">{Math.round(totalPoints / (sortedData.length || 1))}</span>
                  <span className="text-[9px] text-zinc-400 uppercase font-bold mt-1">Avg Pts</span>
                </div>
                <div className="bg-white/10 rounded-xl p-3 border border-white/20 flex flex-col items-center justify-center hover:bg-white/15 transition-all group">
                  <Users size={18} className="text-white mb-2 group-hover:scale-110 transition-transform" />
                  <span className="text-lg font-black text-white">{Math.round(totalTasks / (sortedData.length || 1))}</span>
                  <span className="text-[9px] text-zinc-400 uppercase font-bold mt-1">Avg Tasks</span>
                </div>
              </div>
            </div>
          ) : (
            // Small: Show Grid Stats
            <div className="flex flex-col h-full justify-center">
              <div className="grid grid-cols-2 gap-4 h-full">
                <div className="bg-amber-500/5 rounded-2xl p-4 border border-amber-500/10 flex flex-col justify-center items-center relative overflow-hidden group hover:border-amber-500/30 transition-all">
                  <div className="absolute inset-0 bg-amber-500/10 blur-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="text-white text-3xl font-black leading-none drop-shadow-xl relative z-10">{totalPoints.toLocaleString()}</div>
                  <div className="text-[11px] text-zinc-400 font-bold uppercase tracking-widest mt-2 relative z-10 text-center">Total Points</div>
                </div>
                <div className="bg-purple-500/5 rounded-2xl p-4 border border-purple-500/10 flex flex-col justify-center items-center relative overflow-hidden group hover:border-purple-500/30 transition-all">
                  <div className="absolute inset-0 bg-purple-500/10 blur-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="text-white text-4xl font-black leading-none drop-shadow-xl relative z-10">{totalTasks.toLocaleString()}</div>
                  <div className="text-[11px] text-zinc-400 font-bold uppercase tracking-widest mt-2 relative z-10 text-center">Tasks Completed</div>
                </div>
              </div>
            </div>
          )}
        </PerformanceWidget>
      </div>

      {/* Performance Rankings Table */}
      <motion.div
        className="bg-zinc-900 border border-white/5 rounded-3xl overflow-hidden shadow-2xl mt-8"
        variants={itemVariants}
      >
        <div className="px-8 py-6 border-b border-white/5 flex justify-between items-center bg-zinc-900/50">
          <h3 className="text-xl font-bold text-white flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-500/20 text-blue-400"><Award size={20} /></div>
            Performance Rankings
          </h3>
          <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider bg-white/5 px-3 py-1 rounded-full">
            Total {sortedData.length} records
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-white/5 text-left">
            <thead className="bg-white/[0.02]">
              <tr>
                <th className="px-8 py-5 text-[11px] font-bold text-zinc-500 uppercase tracking-wider">Rank</th>
                <th
                  className="px-6 py-5 text-[11px] font-bold text-zinc-500 uppercase tracking-wider cursor-pointer hover:text-white transition-colors"
                  onClick={() => handleSort('name')}
                >
                  <div className="flex items-center gap-1">
                    Employee Profile
                    {sortBy === 'name' && (sortOrder === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />)}
                  </div>
                </th>
                <th
                  className="px-6 py-5 text-[11px] font-bold text-zinc-500 uppercase tracking-wider cursor-pointer hover:text-white transition-colors text-center"
                  onClick={() => handleSort('totalPoints')}
                >
                  <div className="flex items-center justify-center gap-1">
                    Points Earned
                    {sortBy === 'totalPoints' && (sortOrder === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />)}
                  </div>
                </th>
                <th
                  className="px-6 py-5 text-[11px] font-bold text-zinc-500 uppercase tracking-wider cursor-pointer hover:text-white transition-colors text-center"
                  onClick={() => handleSort('completedTasks')}
                >
                  <div className="flex items-center justify-center gap-1">
                    Tasks
                    {sortBy === 'completedTasks' && (sortOrder === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />)}
                  </div>
                </th>
                <th
                  className="px-6 py-5 text-[11px] font-bold text-zinc-500 uppercase tracking-wider cursor-pointer hover:text-white transition-colors text-center"
                  onClick={() => handleSort('completionRate')}
                >
                  <div className="flex items-center justify-center gap-1">
                    Rate
                    {sortBy === 'completionRate' && (sortOrder === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />)}
                  </div>
                </th>
                <th className="px-6 py-5 text-[11px] font-bold text-zinc-500 uppercase tracking-wider text-center">Status</th>
                <th className="px-8 py-5 text-[11px] font-bold text-zinc-500 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {sortedData.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-12 text-center text-zinc-500">
                    <div className="flex flex-col items-center justify-center gap-3">
                      <div className="p-4 rounded-full bg-zinc-800/50"><Users size={32} className="opacity-50" /></div>
                      <p className="font-medium">No performance data found</p>
                    </div>
                  </td>
                </tr>
              ) : sortedData.map((individual, index) => {
                const performanceLevel = getPerformanceLevel(individual.completionRate);
                return (
                  <tr key={individual.employeeId || individual.id || index} className="group hover:bg-white/[0.02] transition-colors">
                    <td className="px-8 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {individual.rank <= 3 ? (
                          <span className="text-xl filter drop-shadow-md transform scale-125">
                            {individual.rank === 1 ? '🥇' : individual.rank === 2 ? '🥈' : '🥉'}
                          </span>
                        ) : (
                          <span className="w-7 h-7 flex items-center justify-center text-xs font-bold text-zinc-500 bg-white/5 rounded-full border border-white/5">
                            #{individual.rank}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm text-white shadow-lg ${index % 4 === 0 ? 'bg-gradient-to-br from-blue-500 to-indigo-600' :
                          index % 4 === 1 ? 'bg-gradient-to-br from-purple-500 to-pink-600' :
                            index % 4 === 2 ? 'bg-gradient-to-br from-emerald-500 to-teal-600' :
                              'bg-gradient-to-br from-orange-500 to-red-600'
                          }`}>
                          {individual.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                        </div>
                        <div>
                          <div className="font-bold text-white text-sm group-hover:text-blue-400 transition-colors">{individual.name}</div>
                          <div className="text-[11px] text-zinc-500 font-mono mt-0.5">{individual.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <div className="font-black text-white text-lg">{(individual.totalPointsEarned || individual.totalPoints || 0).toLocaleString()}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <div className="text-sm text-zinc-300 font-medium">
                        <span className="text-white">{individual.completedTasks}</span>
                        <span className="opacity-50 mx-1">/</span>
                        <span className="text-zinc-500">{individual.totalTasks}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <div className="inline-flex items-center justify-center">
                        <div className="w-16 bg-white/5 rounded-full h-1.5 mr-3 overflow-hidden">
                          <div
                            className={`h-1.5 rounded-full ${individual.completionRate >= 80 ? 'bg-emerald-500' :
                              individual.completionRate >= 60 ? 'bg-yellow-500' :
                                'bg-red-500'
                              }`}
                            style={{ width: `${Math.min(individual.completionRate, 100)}%` }}
                          ></div>
                        </div>
                        <span className="text-xs font-bold text-zinc-300">{individual.completionRate}%</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <span className={`px-2.5 py-1 rounded-lg text-[10px] uppercase font-black tracking-widest border ${performanceLevel.color}`}>
                        {performanceLevel.label}
                      </span>
                    </td>
                    <td className="px-8 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end space-x-2">
                        <button
                          onClick={() => handleViewDetails(individual)}
                          className="p-2 text-zinc-400 hover:text-white hover:bg-white/10 rounded-xl transition-all border border-transparent hover:border-white/10"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            setEmployeeToRemove(individual);
                            setShowRemoveConfirm(true);
                          }}
                          className="p-2 text-zinc-400 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-all border border-transparent hover:border-red-500/10"
                          title="Remove Employee"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* Add Employee Modal */}
      {showAddEmployeeModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-zinc-900 border border-white/10 rounded-xl max-w-md w-full mx-4 shadow-2xl">
            <form onSubmit={handleAddEmployee}>
              <div className="p-6 border-b border-white/10">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-bold text-white">Add New Employee</h3>
                  <button
                    type="button"
                    onClick={() => setShowAddEmployeeModal(false)}
                    className="text-zinc-400 hover:text-white transition-colors"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>

              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1.5">Name</label>
                  <input
                    type="text"
                    value={newEmployee.name}
                    onChange={(e) => setNewEmployee({ ...newEmployee, name: e.target.value })}
                    className="w-full px-3 py-2 bg-zinc-800/50 border border-zinc-700 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1.5">Email</label>
                  <input
                    type="email"
                    value={newEmployee.email}
                    onChange={(e) => setNewEmployee({ ...newEmployee, email: e.target.value })}
                    className="w-full px-3 py-2 bg-zinc-800/50 border border-zinc-700 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-zinc-400 mb-1.5">Department</label>
                    <input
                      type="text"
                      value={newEmployee.department}
                      onChange={(e) => setNewEmployee({ ...newEmployee, department: e.target.value })}
                      className="w-full px-3 py-2 bg-zinc-800/50 border border-zinc-700 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-zinc-400 mb-1.5">Employee ID</label>
                    <input
                      type="text"
                      value={newEmployee.employeeId}
                      onChange={(e) => setNewEmployee({ ...newEmployee, employeeId: e.target.value })}
                      className="w-full px-3 py-2 bg-zinc-800/50 border border-zinc-700 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="p-6 pt-0 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowAddEmployeeModal(false)}
                  className="px-4 py-2 bg-zinc-700 text-zinc-300 rounded-xl hover:bg-zinc-600 text-sm font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 text-sm font-medium transition-colors shadow-lg shadow-blue-500/20"
                >
                  Add Employee
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Remove Confirmation Modal */}
      {showRemoveConfirm && employeeToRemove && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-zinc-900 border border-white/10 rounded-xl max-w-sm w-full mx-4 shadow-2xl p-6">
            <h3 className="text-lg font-bold text-white mb-2">Confirm Removal</h3>
            <p className="text-zinc-400 text-sm mb-6">
              Are you sure you want to remove <strong className="text-white">{employeeToRemove.name}</strong> from the performance system?
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowRemoveConfirm(false);
                  setEmployeeToRemove(null);
                }}
                className="px-4 py-2 bg-zinc-800/50 text-zinc-300 rounded-xl hover:bg-zinc-700/50 text-sm font-medium transition-colors border border-white/5"
              >
                Cancel
              </button>
              <button
                onClick={handleRemoveEmployee}
                className="px-4 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700 text-sm font-medium transition-colors shadow-lg shadow-red-500/20"
              >
                Remove
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Performance Detail Modal */}
      <PerformanceDetailModal
        employee={selectedEmployee}
        isOpen={showDetailModal}
        onClose={() => {
          setShowDetailModal(false);
          setSelectedEmployee(null);
        }}
      />
    </motion.div>
  );
};

export default HRPerformance;






