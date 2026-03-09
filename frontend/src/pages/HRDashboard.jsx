import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence, LayoutGroup } from 'framer-motion';
import {
  Users,
  Trophy,
  Clock,
  Briefcase,
  Calendar,
  CreditCard,
  ArrowUpRight,
  Maximize2,
  Minimize2,
  CheckCircle,
  XCircle,
  Activity,
  Star,
  AlertCircle,
  TrendingUp,
  FileText,
  DollarSign,
  ClipboardCheck,
  BarChart3,
  Award,
  MoreHorizontal,
  MoreVertical,
  Target
} from 'lucide-react';

const formatRevenue = (amount) => {
  if (!amount) return '₹0';
  if (amount >= 10000000) return `₹${(amount / 10000000).toFixed(2)}Cr`;
  if (amount >= 100000) return `₹${(amount / 100000).toFixed(2)}L`;
  return `₹${amount.toLocaleString('en-IN')}`;
};
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Legend
} from 'recharts';
import DashboardLayout from '../components/DashboardLayout';
import HRPerformance from './HRPerformance';
import PayrollManagement from '../components/PayrollManagement';
import HRPayroll from './HRPayroll';
import PayrollReminderPopup from '../components/PayrollReminderPopup';
import LeaveManagement from '../components/LeaveManagement';
import AttendanceManagement from '../components/AttendanceManagement';
import AttendancePunch from '../components/AttendancePunch';
import EmployeeRecords from '../pages/EmployeeRecords';
import PerformanceAnalytics from '../components/hr/PerformanceAnalytics';
import ProjectReports from '../components/hr/ProjectReports';
import TeamReviews from '../components/hr/TeamReviews';
import TeamOverview from '../components/manager/TeamOverview';
import ClientManagementDashboard from '../components/ClientManagementDashboard';
import api from '../utils/api';
import { formatDate } from '../utils/helpers';
import { filterEmployees } from '../utils/employeeFilter';
import { showToast } from '../utils/toast';

// --- Minimalist Chart Customization ---

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
              {item.unit && <span className="text-zinc-500 text-xs ml-1">{item.unit}</span>}
            </span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

// --- Widget Component (Premium Dark Aesthetic) ---

const WidgetHeader = ({ title, subtitle }) => (
  <div className="flex items-start justify-between mb-3 z-10 relative">
    <div>
      <h3 className="text-transparent bg-clip-text bg-gradient-to-r from-white to-zinc-400 font-bold text-sm tracking-wide">{title}</h3>
      {subtitle && <p className="text-zinc-500 text-[10px] mt-0.5 font-medium tracking-wider uppercase">{subtitle}</p>}
    </div>
  </div>
);

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
    // Prevent text selection during drag
    document.body.style.userSelect = 'none';
    document.body.style.webkitUserSelect = 'none';
  };

  const handleDragMove = (e) => {
    if (!isDragging) return;

    e.preventDefault();
    const currentY = e.clientY || e.touches?.[0]?.clientY || 0;
    const deltaY = currentY - dragStartY;

    // Threshold for size change (50px drag distance)
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
    // Re-enable text selection
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
      {/* Subtle Gradient Glow on Hover */}
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

// --- Helper Functions for Dynamic Data ---

// Helper function to calculate next payday (6th of current or next month)
const calculateNextPayday = () => {
  const today = new Date();
  const currentDay = today.getDate();
  const payDay = 6;

  let nextPayDate;
  if (currentDay < payDay) {
    // Payday is this month
    nextPayDate = new Date(today.getFullYear(), today.getMonth(), payDay);
  } else {
    // Payday is next month
    nextPayDate = new Date(today.getFullYear(), today.getMonth() + 1, payDay);
  }

  return nextPayDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

// Helper function to calculate days until next payday
const calculateDaysUntilPayday = () => {
  const today = new Date();
  const currentDay = today.getDate();
  const payDay = 6;

  let nextPayDate;
  if (currentDay < payDay) {
    nextPayDate = new Date(today.getFullYear(), today.getMonth(), payDay);
  } else {
    nextPayDate = new Date(today.getFullYear(), today.getMonth() + 1, payDay);
  }

  const diffTime = nextPayDate - today;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
};

// Helper function to generate performance trend data based on actual avg
const generatePerformanceTrend = (avgScore) => {
  const baseScore = avgScore || 85;
  const days = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
  return days.map((day, index) => {
    // Create a realistic weekly trend: lower on Monday, peak mid-week, dip on weekend
    const variance = index === 0 ? -5 : // Monday (lower)
      index === 2 ? 5 :   // Wednesday (peak)
        index === 4 ? 3 :   // Friday (good)
          index >= 5 ? -10 :  // Weekend (lower)
            0;
    const randomVariance = (Math.random() - 0.5) * 4; // Small random variation
    const currentScore = Math.round(Math.max(0, Math.min(100, baseScore + variance + randomVariance)));

    // Previous week score (slightly lower, flowing pattern)
    const prevVariance = index === 0 ? -3 :
      index === 2 ? 3 :
        index === 4 ? 2 :
          index >= 5 ? -8 :
            0;
    const prevScore = Math.round(Math.max(0, Math.min(100, (baseScore - 5) + prevVariance + (Math.random() - 0.5) * 3)));

    return {
      day,
      score: currentScore,
      previous: prevScore
    };
  });
};

// Helper function to generate attendance trend based on actual percentage
const generateAttendanceTrend = (avgPercentage) => {
  const basePercentage = avgPercentage || 90;
  const days = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
  return days.map((day, index) => {
    // Realistic attendance pattern: high weekdays, low weekends
    const variance = index >= 5 ? -50 : // Weekend (very low)
      index === 0 ? -5 : // Monday (slightly lower)
        index === 4 ? -3 : // Friday (slightly lower)
          2; // Mid-week (slightly higher)
    const randomVariance = (Math.random() - 0.5) * 5;
    return {
      day,
      val: Math.round(Math.max(0, Math.min(100, basePercentage + variance + randomVariance)))
    };
  });
};

const HRDashboard = () => {
  const { user } = useAuth();
  
  // Persist current view in localStorage to maintain state across page reloads
  const [currentView, setCurrentView] = useState(() => {
    const savedView = localStorage.getItem('hrDashboardView');
    return savedView || 'dashboard';
  });

  // Save view to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('hrDashboardView', currentView);
  }, [currentView]);

  // Real Data States
  const [performanceData, setPerformanceData] = useState([]);
  const [projectsData, setProjectsData] = useState([]);
  const [leavesData, setLeavesData] = useState({ pending: 0, approved: 0 });
  const [pendingLeaveRequests, setPendingLeaveRequests] = useState([]);
  const [attendanceData, setAttendanceData] = useState({ percentage: 92, present: 0, total: 0 });
  const [payrollData, setPayrollData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Widget States with localStorage persistence
  const [widgetStates, setWidgetStates] = useState(() => {
    // Try to load saved sizes from localStorage
    const saved = localStorage.getItem('hrDashboardWidgetSizes');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Failed to parse saved widget sizes:', e);
      }
    }
    // Default sizes
    return {
      performance: 'large',
      employees: 'medium',
      attendance: 'large',
      projects: 'medium',
      leaves: 'medium',
      payroll: 'small'
    };
  });

  // Save widget sizes to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('hrDashboardWidgetSizes', JSON.stringify(widgetStates));
  }, [widgetStates]);

  // Fetch real performance data
  useEffect(() => {
    const fetchDashboardData = async () => {
      setIsLoading(true);
      try {
        // MOCK DATA FOR UI TESTING
        const MOCK_PERFORMANCE = Array(10).fill(null).map((_, i) => ({
          employeeId: `EMP-${i}`,
          firstName: `Employee`,
          lastName: `${i}`,
          department: ['Engineering', 'Design', 'Marketing', 'Sales'][i % 4],
          points: Math.floor(Math.random() * 100),
          tasksCompleted: Math.floor(Math.random() * 20),
          completionRate: 70 + Math.floor(Math.random() * 30)
        }));

        const MOCK_PROJECTS = [
          { _id: '1', name: 'Website Redesign', status: 'In Progress', progress: 75, deadline: '2023-12-31' },
          { _id: '2', name: 'Mobile App', status: 'In Progress', progress: 45, deadline: '2024-01-15' },
          { _id: '3', name: 'Marketing Campaign', status: 'Review', progress: 90, deadline: '2023-11-30' },
          { _id: '4', name: 'Internal Tool', status: 'Planning', progress: 15, deadline: '2024-02-20' },
        ];

        const MOCK_LEAVES_STATS = { pendingRequests: 5, approvedRequests: 12, totalRequests: 20 };

        const MOCK_ATTENDANCE = {
          totalEmployees: 50,
          present: 42,
          absent: 3,
          late: 5,
        };

        const MOCK_PAYROLL = {
          netSalary: 2500000,
          totalEmployees: 48,
        };

        const MOCK_PENDING_LEAVES = [
          { _id: 'l1', employee: { firstName: 'Sarah', lastName: 'Connor' }, leaveType: 'Sick Leave', startDate: '2023-11-20' },
          { _id: 'l2', employee: { firstName: 'John', lastName: 'Doe' }, leaveType: 'Casual Leave', startDate: '2023-11-22' },
          { _id: 'l3', employee: { firstName: 'Alice', lastName: 'Smith' }, leaveType: 'Vacation', startDate: '2023-12-01' },
        ];

        // Simulate failed/skipped real API calls and use Mock Data

        // Performance data
        setPerformanceData(MOCK_PERFORMANCE);

        // Projects data
        setProjectsData(MOCK_PROJECTS);

        // Leaves data
        setLeavesData({
          pending: MOCK_LEAVES_STATS.pendingRequests,
          approved: MOCK_LEAVES_STATS.approvedRequests,
          total: MOCK_LEAVES_STATS.totalRequests
        });

        // Pending leave requests for widget
        setPendingLeaveRequests(MOCK_PENDING_LEAVES);

        // Attendance data
        const total = MOCK_ATTENDANCE.totalEmployees;
        const present = MOCK_ATTENDANCE.present;
        const percentage = Math.round((present / total) * 100);
        setAttendanceData({
          percentage: percentage,
          present,
          total,
          absent: MOCK_ATTENDANCE.absent,
          late: MOCK_ATTENDANCE.late
        });

        // Payroll data
        setPayrollData({
          totalPayout: MOCK_PAYROLL.netSalary,
          employeeCount: MOCK_PAYROLL.totalEmployees,
          nextPayday: calculateNextPayday(),
          daysUntilPayday: calculateDaysUntilPayday()
        });

      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        // Fallback to empty states if even mock data fails (unlikely here)
        setPerformanceData([]);
        setProjectsData([]);
        setLeavesData({ pending: 0, approved: 0, total: 0 });
        setPendingLeaveRequests([]);
        setAttendanceData({ percentage: 0, present: 0, total: 0 });
        setPayrollData(null);
      } finally {
        setIsLoading(false);
      }
    };

    if (currentView === 'dashboard') {
      fetchDashboardData();
    }
  }, [currentView]);

  // Calculate metrics from real data
  const metrics = {
    totalEmployees: performanceData.length,
    avgCompletionRate: performanceData.length > 0
      ? Math.round(performanceData.reduce((sum, emp) => sum + emp.completionRate, 0) / performanceData.length)
      : 0,
    totalPoints: performanceData.reduce((sum, emp) => sum + emp.totalPoints, 0),
    completedTasks: performanceData.reduce((sum, emp) => sum + emp.completedTasks, 0),
    // Department distribution (calculate from real data)
    deptDistribution: performanceData.length > 0
      ? calculateDepartmentDistribution(performanceData)
      : [],
    // Dynamic performance trend based on actual avg
    performanceTrend: generatePerformanceTrend(
      performanceData.length > 0
        ? Math.round(performanceData.reduce((sum, emp) => sum + emp.completionRate, 0) / performanceData.length)
        : 85
    ),
    // Dynamic attendance trend based on today's percentage
    attendanceTrend: generateAttendanceTrend(attendanceData.percentage)
  };

  // Helper function to calculate department distribution
  function calculateDepartmentDistribution(employees) {
    const deptCounts = {};
    employees.forEach(emp => {
      const dept = emp.department || 'Other';
      const shortDept = dept.substring(0, 3);
      deptCounts[shortDept] = (deptCounts[shortDept] || 0) + 1;
    });

    return Object.entries(deptCounts).map(([name, value]) => ({ name, value }));
  }

  const handleWidgetSizeChange = (id, newSize) => {
    setWidgetStates(prev => ({ ...prev, [id]: newSize }));
  };

  const sidebarActions = [
    { label: 'Dashboard', icon: Users, onClick: () => setCurrentView('dashboard'), active: currentView === 'dashboard', themeColor: '34, 197, 94' },
    { label: 'My Attendance', icon: Clock, onClick: () => setCurrentView('my-attendance'), active: currentView === 'my-attendance', themeColor: '59, 130, 246' },
    { label: 'Attendance Mgmt', icon: ClipboardCheck, onClick: () => setCurrentView('attendance'), active: currentView === 'attendance', themeColor: '139, 92, 246' },
    { label: 'Performance', icon: Trophy, onClick: () => setCurrentView('performance'), active: currentView === 'performance', themeColor: '251, 191, 36' },
    { label: 'Employee Records', icon: FileText, onClick: () => setCurrentView('employees'), active: currentView === 'employees', themeColor: '236, 72, 153' },
    { label: 'Payroll', icon: DollarSign, onClick: () => setCurrentView('payroll'), active: currentView === 'payroll', themeColor: '16, 185, 129' },
    { label: 'Leave Management', icon: Calendar, onClick: () => setCurrentView('leave'), active: currentView === 'leave', themeColor: '239, 68, 68' },
    { label: 'Project Reports', icon: BarChart3, onClick: () => setCurrentView('projects'), active: currentView === 'projects', themeColor: '99, 102, 241' },
    { label: 'Team Reviews', icon: Award, onClick: () => setCurrentView('reviews'), active: currentView === 'reviews', themeColor: '249, 115, 22' },
    { label: 'Client CMS', icon: Target, onClick: () => setCurrentView('client-management'), active: currentView === 'client-management', themeColor: '34, 211, 238' }
  ];

  if (currentView !== 'dashboard') {
    const ComponentMap = {
      employees: EmployeeRecords,
      analytics: PerformanceAnalytics,
      projects: ProjectReports,
      reviews: TeamOverview,
      performance: HRPerformance,
      attendance: AttendanceManagement,
      'my-attendance': AttendancePunch,
      payroll: HRPayroll,
      leave: LeaveManagement,
      'client-management': ClientManagementDashboard
    };
    const Component = ComponentMap[currentView];
    return <DashboardLayout sidebarActions={sidebarActions} onBack={() => setCurrentView('dashboard')} showBackButtonOverride={true}><Component /></DashboardLayout>;
  }

  return (
    <>
      <PayrollReminderPopup userRole={user?.role} />
      <DashboardLayout sidebarActions={sidebarActions} showBackButtonOverride={false}>
        <div className="p-2">
          <div className="mb-8 flex justify-between items-center px-2">
            <div>
              <h1 className="text-3xl font-bold text-white tracking-tight drop-shadow-lg">Summary</h1>
              <p className="text-zinc-500 text-sm mt-1">{formatDate(new Date())}</p>
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
            <motion.div
              layout
              initial={{ opacity: 0, scale: 0.95, filter: "blur(10px)" }}
              animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 auto-rows-min grid-flow-dense pb-10"
            >

              {/* --- Widget 1: PERFORMANCE (Area Chart - Sky Blue Glow - More Faded) --- */}
              <Widget
                id="performance"
                title="Performance"
                subtitle="Team Metrics"
                size={widgetStates.performance}
                onSizeChange={handleWidgetSizeChange}
              >
                {/* Visual Logic from CoFounder adapted to HR Data */}
                {(() => {
                  // Map HR Data to Co-Founder Structure
                  const mappedPerformance = {
                    avgProductivity: metrics.avgCompletionRate || 0,
                    topDepartment: (metrics.deptDistribution && metrics.deptDistribution.length > 0) ? metrics.deptDistribution[0].name : 'Engineering',
                    topPerformers: (performanceData || []).map((p, i) => ({
                      id: p.employeeId || i,
                      name: `${p.firstName} ${p.lastName}`,
                      department: p.department,
                      score: p.points || 0,
                      trend: `+${Math.floor((p.completionRate || 0) / 10)}%`, // Mock trend logic
                      tasksCompleted: p.tasksCompleted || 0,
                      avatar: `${(p.firstName || '')[0]}${(p.lastName || '')[0]}`.toUpperCase()
                    })).sort((a, b) => b.score - a.score)
                  };

                  // Rename for clarity and to avoid TDZ
                  const mappedPerformanceData = mappedPerformance;

                  return (
                    <>
                      {widgetStates.performance === 'small' ? (
                        <div className="flex flex-col justify-center h-full">
                          {(mappedPerformanceData.topPerformers && mappedPerformanceData.topPerformers.length > 0) ? (
                            <>
                              <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-3">
                                  <div className="w-14 h-14 rounded-xl bg-white flex items-center justify-center font-bold text-black text-lg shadow-[0_0_15px_rgba(255,255,255,0.5)]">
                                    {mappedPerformanceData.topPerformers[0].avatar}
                                  </div>
                                  <div>
                                    <div className="text-white font-bold text-sm">{mappedPerformanceData.topPerformers[0].name}</div>
                                    <div className="text-zinc-500 text-xs">{mappedPerformanceData.topPerformers[0].department}</div>
                                  </div>
                                </div>
                              </div>
                              <div className="grid grid-cols-3 gap-3">
                                <div>
                                  <div className="text-zinc-500 text-[10px] font-bold uppercase mb-1">Score</div>
                                  <div className="text-white text-2xl font-bold">{mappedPerformanceData.topPerformers[0].score}</div>
                                </div>
                                <div className="text-center">
                                  <div className="text-zinc-500 text-[10px] font-bold uppercase mb-1">Trend</div>
                                  <div className="text-emerald-400 text-2xl font-bold">{mappedPerformanceData.topPerformers[0].trend}</div>
                                </div>
                                <div className="text-right">
                                  <div className="text-zinc-500 text-[10px] font-bold uppercase mb-1">Tasks</div>
                                  <div className="text-white text-2xl font-bold">{mappedPerformanceData.topPerformers[0].tasksCompleted}</div>
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
                              <div className="text-zinc-500 text-[10px] font-medium">Avg: <span className="text-white font-bold text-xs">{mappedPerformanceData.avgProductivity}</span></div>
                            </div>
                          </div>

                          {/* Performer Cards - 3 Columns */}
                          <div className="grid grid-cols-3 gap-2">
                            {mappedPerformanceData.topPerformers.slice(0, 3).map((performer, index) => {
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
                              <div className="text-white text-xl font-bold">{mappedPerformanceData.avgProductivity || 0}%</div>
                            </div>
                            <div className="bg-blue-500/10 rounded-xl p-3 border border-blue-500/20">
                              <div className="text-blue-400 text-[10px] font-bold uppercase mb-1">Top Dept</div>
                              <div className="text-white text-sm font-bold truncate">{mappedPerformanceData.topDepartment || 'N/A'}</div>
                            </div>
                            <div className="bg-purple-500/10 rounded-xl p-3 border border-purple-500/20">
                              <div className="text-purple-400 text-[10px] font-bold uppercase mb-1">Active</div>
                              <div className="text-white text-xl font-bold">{(mappedPerformanceData.topPerformers || []).length}</div>
                            </div>
                          </div>
                          <div className="flex-1 grid grid-cols-2 gap-3 overflow-y-auto">
                            {(mappedPerformanceData.topPerformers || []).slice(0, 10).map((performer, idx) => (
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
                    </>
                  );
                })()}
              </Widget>

              {/* --- Widget 2: EMPLOYEES (Bar Graph - Vibrant Violet) --- */}
              <Widget id="employees" title="Employees" subtitle="Workforce" size={widgetStates.employees} onSizeChange={handleWidgetSizeChange}>
                {(() => {
                  // Local logic for employees widget
                  const total = metrics.totalEmployees || 0;
                  const deptStats = metrics.deptDistribution || [];
                  const employeeList = performanceData || [];

                  return (
                    <>
                      {/* SMALL: Just the Total Count */}
                      {widgetStates.employees === 'small' && (
                        <div className="flex flex-col items-center justify-center h-full relative">
                          <div className="absolute inset-0 bg-gradient-to-tr from-white/10 via-transparent to-transparent opacity-50 rounded-[24px]" />
                          <div className="relative z-10 flex flex-col items-center">
                            <div className="text-6xl font-black text-white tracking-tighter drop-shadow-[0_0_25px_rgba(255,255,255,0.4)]">
                              {total}
                            </div>
                            <div className="text-zinc-200 font-bold text-[10px] uppercase tracking-[0.2em] mt-2 border border-white/20 px-3 py-1 rounded-full bg-white/10 backdrop-blur-sm shadow-[0_0_10px_rgba(255,255,255,0.1)]">
                              Active Members
                            </div>
                          </div>
                        </div>
                      )}

                      {/* MEDIUM: Department Stats Breakdown */}
                      {widgetStates.employees === 'medium' && (
                        <div className="flex flex-row h-full items-stretch relative overflow-hidden">
                          {/* Left: Expanded Total Staff */}
                          <div className="w-[40%] flex flex-col justify-end pb-4 pl-4 z-10 relative">
                            <div className="text-7xl font-black text-white tracking-tighter drop-shadow-[0_0_20px_rgba(255,255,255,0.3)] leading-[0.85] mb-2 scale-105 origin-left">
                              {total}
                            </div>
                            <div className="text-zinc-500 text-[10px] uppercase tracking-[0.25em] font-bold pl-1">Total Staff</div>
                          </div>

                          {/* Right: Department Stats List - Fuller Use of Space */}
                          <div className="flex-1 h-full border-l border-white/5 pl-2 relative">
                            <div className="absolute inset-0 bg-gradient-to-l from-black/20 to-transparent pointer-events-none" />
                            <div className="h-full overflow-y-auto custom-scrollbar p-2 flex flex-col justify-center gap-2">
                              {deptStats.map((dept, idx) => (
                                <div key={idx} className="flex flex-col bg-white/[0.03] border border-white/5 rounded-lg px-3 py-2.5 hover:bg-white/[0.06] transition-all group w-full">
                                  <div className="flex justify-between items-baseline mb-1.5">
                                    <span className="text-zinc-400 text-[10px] uppercase font-bold tracking-wider">{dept.name}</span>
                                    <span className="text-white font-bold text-xs">{dept.value}</span>
                                  </div>
                                  <div className="w-full bg-zinc-800/50 h-1 rounded-full overflow-hidden">
                                    <div
                                      className="h-full bg-white rounded-full shadow-[0_0_10px_rgba(255,255,255,0.4)] group-hover:shadow-[0_0_15px_rgba(255,255,255,0.6)] transition-all duration-500 ease-out"
                                      style={{ width: `${(dept.value / total) * 100}%` }}
                                    />
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}

                      {/* LARGE: Detailed Employee Directory */}
                      {widgetStates.employees === 'large' && (
                        <div className="flex flex-col h-full">
                          <div className="flex justify-between items-end mb-4">
                            <div>
                              <div className="text-4xl font-bold text-white tracking-tighter">{total}</div>
                              <div className="text-zinc-500 text-[10px] uppercase tracking-wider font-bold">Directory</div>
                            </div>
                            {/* Online Status Badge */}
                            <div className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs text-zinc-300 backdrop-blur-sm">
                              <span className="text-emerald-400 font-bold mr-1 text-[10px] shadow-[0_0_8px_rgba(52,211,153,0.5)]">●</span> {Math.floor(total * 0.9)} Online
                            </div>
                          </div>

                          <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
                            <div className="space-y-2">
                              {employeeList.map((emp, i) => (
                                <div key={emp.employeeId || i} className="group flex items-center justify-between p-3 rounded-xl bg-zinc-900/40 border border-white/5 hover:bg-zinc-900/80 hover:border-white/10 transition-all duration-200">
                                  <div className="flex items-center gap-3 min-w-0">
                                    {/* Avatar */}
                                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-zinc-700 to-black flex items-center justify-center text-sm font-bold text-white shadow-lg border border-white/10 group-hover:scale-105 transition-transform shrink-0">
                                      {`${(emp.firstName || '')[0]}${(emp.lastName || '')[0]}`.toUpperCase()}
                                    </div>
                                    <div className="min-w-0">
                                      {/* Name */}
                                      <div className="text-white text-sm font-bold truncate group-hover:text-zinc-200 transition-colors">
                                        {emp.firstName} {emp.lastName}
                                      </div>
                                      {/* Dept & ID */}
                                      <div className="flex items-center gap-2 mt-0.5">
                                        <span className="text-[9px] text-zinc-400 font-medium uppercase tracking-wide bg-white/5 px-1.5 py-0.5 rounded border border-white/5 whitespace-nowrap">
                                          {emp.department}
                                        </span>
                                        <span className="text-[10px] text-zinc-600">•</span>
                                        <span className="text-[10px] text-zinc-500 whitespace-nowrap">ID: {emp.employeeId}</span>
                                      </div>
                                    </div>
                                  </div>

                                  {/* Performance Bar */}
                                  <div className="flex flex-col items-end gap-1 ml-4 w-28 shrink-0">
                                    <div className="flex justify-between w-full text-[9px] uppercase font-bold tracking-wider">
                                      <span className="text-zinc-500 group-hover:text-zinc-400 transition-colors">Performance</span>
                                      <span className="text-white">{emp.completionRate || 0}%</span>
                                    </div>
                                    <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden border border-white/5">
                                      <div
                                        className="h-full bg-white rounded-full group-hover:shadow-[0_0_8px_rgba(255,255,255,0.7)] transition-all duration-500 ease-out"
                                        style={{ width: `${emp.completionRate || 0}%` }}
                                      />
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}
                    </>
                  );
                })()}
              </Widget>

              {/* --- Widget 3: ATTENDANCE (Clean Layout - No Boxes) --- */}
              <Widget id="attendance" title="Attendance" subtitle="Activity & Trends" size={widgetStates.attendance} onSizeChange={handleWidgetSizeChange}>

                {/* SMALL VIEW */}
                {widgetStates.attendance === 'small' && (
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
                          strokeDashoffset={`${2 * Math.PI * 48 * (1 - (attendanceData.percentage / 100))}`}
                          className="transition-all duration-1000 ease-out"
                          style={{ filter: 'url(#attendanceNeonSmall)' }}
                        />
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center flex-col">
                        <span className="text-3xl font-bold text-white tracking-tighter drop-shadow-md">{attendanceData.present}</span>
                        <span className="text-[9px] text-zinc-500 font-bold tracking-widest uppercase mt-1">PRESENT</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* MEDIUM & LARGE VIEWS */}
                {widgetStates.attendance !== 'small' && (
                  <div className="flex flex-col h-full">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-4xl font-bold text-white tracking-tighter drop-shadow-[0_0_10px_rgba(255,255,255,0.4)]">
                          {attendanceData.present}
                          <span className="text-lg text-zinc-600 font-medium ml-1">/ {attendanceData.total}</span>
                        </div>
                        <div className="text-xs text-zinc-400 mt-4 flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse shadow-[0_0_8px_rgba(255,255,255,1)]"></span>
                          {attendanceData.percentage}% On Time
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
                                { name: 'Present', value: attendanceData.present, fill: '#ffffff' },
                                { name: 'Absent', value: attendanceData.total - attendanceData.present, fill: '#27272a' }
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
                          <span className="text-2xl font-bold text-white">{attendanceData.percentage}%</span>
                        </div>
                      </div>

                      <div className="flex flex-col justify-start gap-3 w-1/3 -mt-2">
                        <div className="bg-white/5 rounded-lg p-2.5 border-l-2 border-white backdrop-blur-sm">
                          <div className="text-white text-sm font-bold">{attendanceData.present}</div>
                          <div className="text-zinc-500 text-[9px] uppercase tracking-wider">Present</div>
                        </div>
                        <div className="bg-zinc-900/50 rounded-lg p-2.5 border-l-2 border-zinc-700">
                          <div className="text-zinc-400 text-sm font-bold">{attendanceData.total - attendanceData.present}</div>
                          <div className="text-zinc-600 text-[9px] uppercase tracking-wider">Absent</div>
                        </div>
                      </div>
                    </div>

                    {widgetStates.attendance === 'large' && (
                      <div className="h-32 mt-4 pt-4 border-t border-white/5 flex-shrink-0">
                        <div className="text-xs text-zinc-400 mb-2 uppercase tracking-widest font-bold">Weekly Trend</div>
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={metrics.attendanceTrend}>
                            <defs>
                              <linearGradient id="attendanceGradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#ffffff" stopOpacity={0.15} />
                                <stop offset="95%" stopColor="#ffffff" stopOpacity={0} />
                              </linearGradient>
                            </defs>
                            <CartesianGrid vertical={false} stroke="#ffffff" strokeOpacity={0.05} strokeDasharray="3 3" />
                            <XAxis dataKey="day" tick={{ fill: '#52525b', fontSize: 10, fontWeight: 600 }} axisLine={false} tickLine={false} dy={5} />
                            <Tooltip content={<MinimalTooltip />} />
                            <Area type="monotone" dataKey="val" stroke="#52525b" fill="url(#attendanceGradient)" strokeWidth={2} />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                    )}
                  </div>
                )}
              </Widget>

              {/* --- Widget 4: ACTIVE PROJECTS (Co-Founder Style) --- */}
              <Widget id="projects" title="Projects" subtitle="Active Pipeline" size={widgetStates.projects} onSizeChange={handleWidgetSizeChange}>
                {(() => {
                  // Helper logic for this specific widget instance
                  const projectStats = {
                    total: projectsData.length,
                    inProgress: projectsData.filter(p => p.status === 'In Progress' || p.status === 'in-progress').length,
                    completed: projectsData.filter(p => p.status === 'Completed' || p.status === 'completed' || p.status === 'Review').length,
                    onHold: projectsData.filter(p => p.status === 'Planning' || p.status === 'on-hold').length,
                    dueSoon: projectsData.filter(p => {
                      if (p.status === 'Completed' || p.status === 'completed') return false;
                      const deadline = new Date(p.deadline);
                      const now = new Date();
                      const diffTime = deadline - now;
                      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                      return diffDays >= 0 && diffDays <= 7;
                    }).length
                  };

                  const projectChartData = [
                    { name: 'In Progress', value: projectStats.inProgress },
                    { name: 'Completed', value: projectStats.completed },
                    { name: 'On Hold', value: projectStats.onHold }
                  ];

                  return widgetStates.projects === 'small' ? (
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
                            style={{ width: `${(projectStats.completed / (projectStats.total || 1)) * 100}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col h-full">
                      <div className="flex justify-between items-end mb-6">
                        <div className="flex flex-col items-center min-w-[40%]">
                          <div className="text-5xl font-bold text-white tracking-tighter leading-none drop-shadow-[0_0_15px_rgba(255,255,255,0.3)]">
                            {projectStats.total}
                          </div>
                          <div className="text-zinc-500 text-[9px] uppercase tracking-widest font-bold mt-1 text-center">Total Projects</div>
                        </div>
                        <div className="flex flex-col gap-1 items-end">
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
                                <div className="h-full bg-white rounded-full shadow-[0_0_8px_rgba(255,255,255,0.3)]" style={{ width: `${(projectStats.inProgress / (projectStats.total || 1)) * 100}%` }}></div>
                              </div>
                            </div>

                            {/* Completed Card */}
                            <div className="bg-zinc-900/40 rounded-lg p-2 border border-white/5 relative overflow-hidden flex flex-col justify-between shadow-sm">
                              <div className="relative z-10">
                                <div className="text-xl font-bold text-emerald-400 mb-0.5 leading-none">{projectStats.completed}</div>
                                <div className="text-zinc-500 text-[7px] uppercase tracking-wider font-bold mb-1.5">Done</div>
                              </div>
                              <div className="w-full h-1 bg-zinc-800 rounded-full overflow-hidden relative z-10">
                                <div className="h-full bg-emerald-500 rounded-full shadow-[0_0_8px_rgba(16,185,129,0.3)]" style={{ width: `${(projectStats.completed / (projectStats.total || 1)) * 100}%` }}></div>
                              </div>
                            </div>

                            {/* On Hold Card */}
                            <div className="bg-zinc-900/40 rounded-lg p-2 border border-white/5 relative overflow-hidden flex flex-col justify-between shadow-sm">
                              <div className="relative z-10">
                                <div className="text-xl font-bold text-zinc-400 mb-0.5 leading-none">{projectStats.onHold}</div>
                                <div className="text-zinc-500 text-[7px] uppercase tracking-wider font-bold mb-1.5">Hold</div>
                              </div>
                              <div className="w-full h-1 bg-zinc-800 rounded-full overflow-hidden relative z-10">
                                <div className="h-full bg-zinc-500 rounded-full" style={{ width: `${(projectStats.onHold / (projectStats.total || 1)) * 100}%` }}></div>
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
                  );
                })()}
              </Widget>

              {/* --- Widget 5: Payroll (Timeline Countdown) --- */}
              <Widget id="payroll" title="Payroll" subtitle="Financial Overview" size={widgetStates.payroll} onSizeChange={handleWidgetSizeChange}>
                {(() => {
                  // Bridge data mapping
                  const localPayrollData = {
                    totalNetSalary: payrollData?.totalPayout || 0,
                    totalGrossSalary: Math.round((payrollData?.totalPayout || 0) * 1.3),
                    totalEmployees: payrollData?.employeeCount || attendanceData.totalEmployees || 0,
                    pendingCount: 0 // Mock pending count
                  };
                  // Shadowing locally for ease of copy-paste
                  const payrollDataShadow = localPayrollData;

                  return (
                    <>
                      {widgetStates.payroll === 'small' ? (
                        <div className="flex flex-col h-full pt-2 relative">
                          <div className="flex justify-end items-start -mt-3">
                            {(payrollDataShadow.pendingCount || 0) > 0 ? (
                              <div className="bg-amber-500/10 border border-amber-500/20 px-2 py-1 rounded-md flex items-center gap-1.5 shadow-[0_0_10px_rgba(245,158,11,0.3)]">
                                <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse shadow-[0_0_6px_rgba(245,158,11,0.6)]"></div>
                                <span className="text-amber-400 text-[9px] font-bold uppercase drop-shadow-[0_0_8px_rgba(245,158,11,0.5)]">{payrollDataShadow.pendingCount} Pending</span>
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
                              {formatRevenue(payrollDataShadow.totalNetSalary || 0)}
                            </div>
                            <div className="text-zinc-500 text-[10px] mt-1 uppercase tracking-wider font-bold">Total Net Disbursal</div>
                          </div>

                          <div className="absolute bottom-4 left-0 right-0">
                            <div className="flex justify-between text-[9px] text-zinc-500 mb-1.5">
                              <span className="font-medium text-zinc-400">Processing Status</span>
                              <span className="font-bold text-white">
                                {Math.round((((payrollDataShadow.totalEmployees || 0) - (payrollDataShadow.pendingCount || 0)) / (payrollDataShadow.totalEmployees || 1)) * 100)}%
                              </span>
                            </div>
                            <div className="w-full bg-zinc-800 h-1.5 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-white rounded-full shadow-[0_0_8px_rgba(255,255,255,0.4)]"
                                style={{ width: `${Math.round((((payrollDataShadow.totalEmployees || 0) - (payrollDataShadow.pendingCount || 0)) / (payrollDataShadow.totalEmployees || 1)) * 100)}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      ) : widgetStates.payroll === 'medium' ? (
                        <div className="flex items-center gap-6 h-full">
                          {/* Left Side - Header */}
                          <div className="flex flex-col justify-center -mt-4">
                            <div className="text-4xl font-bold text-white tracking-tighter drop-shadow-md mb-1">
                              {formatRevenue(payrollDataShadow.totalNetSalary || 0)}
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
                                <span className="text-white text-xs font-bold">{formatRevenue((payrollDataShadow.totalNetSalary || 0) * 0.8)}</span>
                              </div>
                              <div className="w-full h-2 bg-zinc-800 rounded-full overflow-hidden">
                                <div className="h-full bg-white rounded-full w-[80%] shadow-[0_0_8px_rgba(255,255,255,0.4)]"></div>
                              </div>
                            </div>

                            <div className="group">
                              <div className="flex justify-between items-end mb-1.5">
                                <span className="text-zinc-300 text-[10px] font-bold uppercase">Taxes & TDS</span>
                                <span className="text-white text-xs font-bold">{formatRevenue((payrollDataShadow.totalGrossSalary || 0) - (payrollDataShadow.totalNetSalary || 0))}</span>
                              </div>
                              <div className="w-full h-2 bg-zinc-800 rounded-full overflow-hidden">
                                <div className="h-full bg-white/70 rounded-full w-[15%]"></div>
                              </div>
                            </div>

                            <div className="group">
                              <div className="flex justify-between items-end mb-1.5">
                                <span className="text-zinc-300 text-[10px] font-bold uppercase">Allowances</span>
                                <span className="text-white text-xs font-bold">{formatRevenue((payrollDataShadow.totalNetSalary || 0) * 0.2)}</span>
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
                                {formatRevenue(payrollDataShadow.totalNetSalary || 0)}
                              </div>
                              <div className="text-zinc-500 text-xs mt-1">Total Net Disbursal</div>
                            </div>
                            <div className="flex gap-2">
                              {(payrollDataShadow.pendingCount || 0) > 0 && (
                                <div className="bg-amber-900/20 border border-amber-500/20 px-3 py-1.5 rounded-lg flex flex-col items-center justify-center min-w-[80px] text-center">
                                  <div className="text-amber-500 text-lg font-bold leading-none">{payrollDataShadow.pendingCount}</div>
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
                                    <span className="text-white font-bold">{formatRevenue(payrollDataShadow.totalGrossSalary || 0)}</span>
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
                                    <span className="text-white font-bold">{payrollDataShadow.totalEmployees || 0}</span>
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
                                      {formatRevenue((payrollDataShadow.totalGrossSalary || 0) - (payrollDataShadow.totalNetSalary || 0))}
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
                    </>
                  );
                })()}
              </Widget>

              {/* --- Widget 6: Leave Requests (List) --- */}
              <Widget id="leaves" title="Leaves" subtitle="Pending Approvals" size={widgetStates.leaves} onSizeChange={handleWidgetSizeChange}>
                {(() => {
                  // Map HR Data to Co-Founder Structure
                  const localLeavesList = pendingLeaveRequests.map((l, i) => ({
                    id: l._id || i,
                    status: 'pending',
                    type: l.leaveType || 'Leave',
                    avatar: `${(l.employee?.firstName || '')[0]}${(l.employee?.lastName || '')[0]}`.toUpperCase(),
                    name: `${l.employee?.firstName || ''} ${l.employee?.lastName || ''}`,
                    days: Math.floor(Math.random() * 3) + 1 // Mock days duration
                  }));

                  return (
                    <>
                      {widgetStates.leaves === 'small' ? (
                        <div className="flex flex-col justify-between h-full relative px-1 py-1">
                          <div className="flex justify-between items-start">
                            <div className="pt-1 pl-1 flex flex-col items-center min-w-[30%]">
                              <div className="text-white text-5xl font-bold tracking-tighter drop-shadow-[0_0_15px_rgba(255,255,255,0.4)]">
                                {localLeavesList.length}
                              </div>
                              <div className="text-zinc-500 text-xs mt-1 uppercase tracking-widest font-bold ml-1 text-center">Pending</div>
                            </div>

                            {/* Right Side Stats - Clean List Style */}
                            <div className="flex flex-col gap-3 mt-2 mr-2">
                              <div className="flex items-center justify-end gap-2 group cursor-default">
                                <div className="text-right">
                                  <div className="text-white text-lg font-bold leading-none">{localLeavesList.filter(l => l.type.includes('Sick') || l.type.includes('Emergency')).length}</div>
                                  <div className="text-zinc-500 text-[8px] uppercase tracking-wider mt-0.5 group-hover:text-zinc-300 transition-colors">Sick</div>
                                </div>
                                <div className="w-1 h-8 rounded-full bg-gradient-to-b from-white to-zinc-800 opacity-50"></div>
                              </div>
                              <div className="flex items-center justify-end gap-2 group cursor-default">
                                <div className="text-right">
                                  <div className="text-amber-400 text-lg font-bold leading-none">{localLeavesList.filter(l => !l.type.includes('Sick') && !l.type.includes('Emergency')).length}</div>
                                  <div className="text-amber-600 text-[8px] uppercase tracking-wider mt-0.5 group-hover:text-amber-500 transition-colors">Casual</div>
                                </div>
                                <div className="w-1 h-8 rounded-full bg-gradient-to-b from-amber-400 to-amber-900 opacity-50"></div>
                              </div>
                            </div>
                          </div>

                          {/* Bottom Avatar Stack */}
                          <div className="flex items-end justify-between mb-2 px-1">
                            <div className="flex -space-x-3">
                              {localLeavesList.slice(0, 4).map((leave, i) => (
                                <div key={leave.id} className="w-9 h-9 rounded-full bg-zinc-900 border-2 border-zinc-800 flex items-center justify-center text-xs font-bold text-white shadow-lg transition-transform hover:-translate-y-1 hover:scale-110 z-10 hover:z-20 cursor-pointer" style={{ zIndex: 10 - i }}>
                                  {leave.avatar}
                                </div>
                              ))}
                              {localLeavesList.length > 4 && (
                                <div className="w-9 h-9 rounded-full bg-zinc-900 border-2 border-zinc-800 flex items-center justify-center text-[10px] text-zinc-400 font-bold shadow-lg z-0 hover:text-white transition-colors cursor-pointer">
                                  +{localLeavesList.length - 4}
                                </div>
                              )}
                            </div>
                            <div
                              className="text-[9px] text-zinc-600 font-bold uppercase tracking-widest flex items-center gap-1 hover:text-white transition-colors cursor-pointer"
                              onClick={(e) => { e.stopPropagation(); handleWidgetSizeChange('leaves', 'large'); }}
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
                                {localLeavesList.length}
                              </div>
                              <div className="text-zinc-500 text-xs font-bold uppercase tracking-[0.2em] mt-2 mb-6">
                                Requests
                              </div>
                            </div>

                            {/* Right Side: Full Height List */}
                            <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
                              <div className="space-y-2 pb-2">
                                {localLeavesList.slice(0, widgetStates.leaves === 'large' ? 6 : 4).map((leave) => (
                                  <div key={leave.id} className="bg-white/[0.03] backdrop-blur-sm rounded-xl p-2.5 flex items-center justify-between group hover:bg-white/[0.08] transition-all duration-300 border border-white/5 hover:border-white/20 relative overflow-hidden">
                                    <div className="flex items-center gap-3 relative z-10">
                                      <div className="h-8 w-8 rounded-full bg-gradient-to-br from-zinc-800 to-black border border-white/10 flex items-center justify-center text-xs text-zinc-300 group-hover:scale-110 transition-transform font-bold">
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
                    </>
                  );
                })()}
              </Widget>

            </motion.div>
          </LayoutGroup>
        </div >
      </DashboardLayout >
    </>
  );
};

export default HRDashboard;