import React, { useState, useEffect, useRef } from 'react';
import { Calendar, Clock, Users, UserCheck, UserX, AlertTriangle, Filter, Upload, Download, X, Maximize2, Minimize2, ChevronDown, ChevronRight } from 'lucide-react';
import api from '../utils/api.js';
import { showToast } from '../utils/toast';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, AreaChart, Area, PieChart, Pie, Cell, CartesianGrid } from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';

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
const AttendanceWidget = ({ title, subtitle, size, onSizeChange, children, color = "zinc", variants }) => {
  const isSmall = size === 'small';
  const isMedium = size === 'medium';
  const isLarge = size === 'large';

  // Drag State
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartY, setDragStartY] = useState(0);
  const [initialSize, setInitialSize] = useState(size);

  // Dynamic grid column span based on size (Matching Co-Founder proportions on a 12-col grid)
  const getGridClass = () => {
    if (isSmall) return 'col-span-12 md:col-span-6 lg:col-span-3 row-span-1 h-[220px]';
    if (isMedium) return 'col-span-12 md:col-span-12 lg:col-span-6 row-span-1 h-[220px]';
    return 'col-span-12 md:col-span-12 lg:col-span-6 row-span-2 h-[464px]';
  };

  const colors = {
    blue: "from-blue-500/20 to-indigo-500/5 border-blue-500/20 shadow-blue-500/10",
    emerald: "from-emerald-500/20 to-teal-500/5 border-emerald-500/20 shadow-emerald-500/10",
    amber: "from-amber-500/20 to-orange-500/5 border-amber-500/20 shadow-amber-500/10",
    rose: "from-rose-500/20 to-pink-500/5 border-rose-500/20 shadow-rose-500/10",
    violet: "from-violet-500/20 to-purple-500/5 border-violet-500/20 shadow-violet-500/10",
    zinc: "from-zinc-500/20 to-zinc-500/5 border-zinc-500/20 shadow-zinc-500/10",
  };

  // --- Drag Logic ---
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

    e.preventDefault(); // Prevent scrolling on touch
    const currentY = e.clientY || e.touches?.[0]?.clientY || 0;
    const deltaY = currentY - dragStartY;

    // Threshold for resizing
    if (deltaY > 50 && initialSize === 'small') {
      onSizeChange('medium');
      setInitialSize('medium');
      setDragStartY(currentY); // Reset anchor
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
    document.body.style.webkitUserSelect = '';
  };

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleDragMove);
      window.addEventListener('mouseup', handleDragEnd);
      window.addEventListener('touchmove', handleDragMove, { passive: false });
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
      {/* Ambient Glow */}
      <div className={`absolute inset-0 bg-gradient-to-tr from-${color}-500/5 via-${color}-500/5 to-${color}-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none`} />

      <div className="relative p-6 h-full flex flex-col z-10">
        {/* Header */}
        <div className="flex items-start justify-between mb-3 z-10 relative">
          <div>
            <h3 className="text-transparent bg-clip-text bg-gradient-to-r from-white to-zinc-400 font-bold text-sm tracking-wide">{title}</h3>
            {subtitle && <p className="text-zinc-500 text-[10px] mt-0.5 font-medium tracking-wider uppercase">{subtitle}</p>}
          </div>
          {/* Header Controls REMOVED as requested */}
        </div>

        <div className="flex-1 min-h-0 relative flex flex-col z-0">
          {children}
        </div>
      </div>

      {/* Resizer Handle Visual (Bottom Right) - Now Draggable */}
      <div
        className={`absolute bottom-1 right-1 w-8 h-8 flex items-center justify-center cursor-ns-resize z-20 opacity-0 group-hover:opacity-100 transition-all duration-200 ${isDragging ? 'opacity-100 scale-110' : ''}`}
        onMouseDown={handleDragStart}
        onTouchStart={handleDragStart}
        style={{ touchAction: 'none' }} // Prevent browser scrolling on the handle
      >
        <div className="flex flex-col gap-[2px] items-end justify-center p-1">
          <div className="flex gap-[2px]">
            <div className={`w-[3px] h-[3px] rounded-full transition-colors ${isDragging ? 'bg-indigo-400' : 'bg-white/30'}`} />
          </div>
          <div className="flex gap-[2px]">
            <div className={`w-[3px] h-[3px] rounded-full transition-colors ${isDragging ? 'bg-indigo-400' : 'bg-white/30'}`} />
            <div className={`w-[3px] h-[3px] rounded-full transition-colors ${isDragging ? 'bg-indigo-400' : 'bg-white/30'}`} />
          </div>
          <div className="flex gap-[2px]">
            <div className={`w-[3px] h-[3px] rounded-full transition-colors ${isDragging ? 'bg-indigo-400' : 'bg-white/30'}`} />
            <div className={`w-[3px] h-[3px] rounded-full transition-colors ${isDragging ? 'bg-indigo-400' : 'bg-white/30'}`} />
            <div className={`w-[3px] h-[3px] rounded-full transition-colors ${isDragging ? 'bg-indigo-400' : 'bg-white/30'}`} />
          </div>
        </div>
      </div>
    </motion.div>
  );
};


const AttendanceManagement = () => {
  const [attendanceData, setAttendanceData] = useState([]);
  const [summary, setSummary] = useState({});
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(() => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  });

  const [widgetStates, setWidgetStates] = useState(() => {
    const saved = localStorage.getItem('attendanceManagementWidgetStates');
    return saved ? JSON.parse(saved) : {
      employeeStats: 'small',
      statusStats: 'small'
    };
  });

  useEffect(() => {
    localStorage.setItem('attendanceManagementWidgetStates', JSON.stringify(widgetStates));
  }, [widgetStates]);

  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importResults, setImportResults] = useState(null);
  const [showPreview, setShowPreview] = useState(false);
  const [previewData, setPreviewData] = useState(null);
  const [parsedRecords, setParsedRecords] = useState([]);
  const [showTrackAttendance, setShowTrackAttendance] = useState(false);
  const [trackingData, setTrackingData] = useState(null);
  const [loadingTracking, setLoadingTracking] = useState(false);
  const [showRecalculateModal, setShowRecalculateModal] = useState(false);
  const [recalculating, setRecalculating] = useState(false);
  const [showDeleteImportsModal, setShowDeleteImportsModal] = useState(false);
  const [recentImports, setRecentImports] = useState([]);
  const [loadingImports, setLoadingImports] = useState(false);
  const [deletingBatch, setDeletingBatch] = useState(null);
  
  // Office time selection for attendance tracking
  const [selectedOfficeTime, setSelectedOfficeTime] = useState(() => {
    const saved = localStorage.getItem('selectedOfficeTime');
    return saved || 'standard';
  });

  // Custom office time inputs
  const [customStartTime, setCustomStartTime] = useState(() => {
    const saved = localStorage.getItem('customStartTime');
    return saved || '09:30';
  });

  const [customEndTime, setCustomEndTime] = useState(() => {
    const saved = localStorage.getItem('customEndTime');
    return saved || '18:00';
  });

  // Save selected office time to localStorage
  useEffect(() => {
    localStorage.setItem('selectedOfficeTime', selectedOfficeTime);
  }, [selectedOfficeTime]);

  useEffect(() => {
    localStorage.setItem('customStartTime', customStartTime);
  }, [customStartTime]);

  useEffect(() => {
    localStorage.setItem('customEndTime', customEndTime);
  }, [customEndTime]);

  const officeTimeOptions = [
    { id: 'standard', label: 'Standard (9:30 AM - 6:00 PM)', start: '09:30', end: '18:00', hours: 8.5 },
    { id: 'early', label: 'Early Shift (8:00 AM - 4:30 PM)', start: '08:00', end: '16:30', hours: 8.5 },
    { id: 'late', label: 'Late Shift (11:00 AM - 7:30 PM)', start: '11:00', end: '19:30', hours: 8.5 },
    { id: 'flexible', label: 'Flexible (Any 8 hours)', start: 'flexible', end: 'flexible', hours: 8 },
    { id: 'custom', label: 'Custom Time (Set Your Own)', start: 'custom', end: 'custom', hours: 0 }
  ];
  
  const fileInputRef = useRef(null);

  // --- Mock Data Generators (Bridging gaps where API might lack historical data) ---
  const generateMonthlyData = () => [
    { name: 'Jan', total: 42 }, { name: 'Feb', total: 45 }, { name: 'Mar', total: 48 },
    { name: 'Apr', total: 46 }, { name: 'May', total: 50 }, { name: 'Jun', total: 52 },
    { name: 'Jul', total: 55 }, { name: 'Aug', total: 58 }, { name: 'Sep', total: 57 },
    { name: 'Oct', total: 60 }, { name: 'Nov', total: 62 }, { name: 'Dec', total: 65 }
  ];

  const generateWeeklyData = () => [
    { day: 'Mon', present: 58, absent: 2, late: 2 },
    { day: 'Tue', present: 60, absent: 1, late: 1 },
    { day: 'Wed', present: 59, absent: 2, late: 1 },
    { day: 'Thu', present: 61, absent: 0, late: 1 },
    { day: 'Fri', present: 57, absent: 4, late: 1 },
    { day: 'Sat', present: 45, absent: 1, late: 0 },
  ];

  const monthlyData = generateMonthlyData();
  const weeklyData = generateWeeklyData();


  useEffect(() => {
    fetchAttendanceData();
  }, [selectedDate, selectedDepartment, selectedStatus]);

  const fetchAttendanceData = async () => {
    setLoading(true);
    try {
      const params = {
        date: selectedDate,
        ...(selectedDepartment && { department: selectedDepartment }),
        ...(selectedStatus && { status: selectedStatus })
      };

      const response = await api.get('/attendance/all', { params });

      if (response.data && response.data.success) {
        setAttendanceData(response.data.data.attendance || []);
        setSummary(response.data.data.summary || {});
        setDepartments(response.data.data.departments || []);
      } else {
        // Fallback
        setAttendanceData([]);
        setSummary({});
        setDepartments([]);
      }
    } catch (error) {
      console.error('Error fetching attendance data:', error);
      showToast.error('Failed to load data');
      setAttendanceData([]);
      setSummary({});
    } finally {
      setLoading(false);
    }
  };

  const fetchTrackAttendance = async () => {
    try {
      setLoadingTracking(true);
      
      // Get selected office time config
      let selectedConfig = officeTimeOptions.find(o => o.id === selectedOfficeTime);
      
      // If custom is selected, use custom times
      if (selectedOfficeTime === 'custom') {
        selectedConfig = {
          id: 'custom',
          label: `Custom: ${customStartTime} - ${customEndTime}`,
          start: customStartTime,
          end: customEndTime,
          hours: 0 // Will be calculated
        };
      }
      
      // Fetch all employees
      const usersResponse = await api.get('/users/individuals');
      
      if (!usersResponse.data.success) {
        throw new Error('Failed to fetch employees');
      }

      const employees = usersResponse.data.data;
      
      // Calculate date range (current month)
      const now = new Date();
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
      const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      
      // Get total working days in month (Mon-Sat)
      let workingDays = 0;
      for (let d = new Date(firstDay); d <= lastDay; d.setDate(d.getDate() + 1)) {
        const day = d.getDay();
        if (day !== 0) workingDays++; // Exclude Sunday
      }

      // Fetch attendance for each employee
      const employeeStats = await Promise.all(
        employees.map(async (emp) => {
          try {
            // Fetch attendance records for current month (employeeId in URL path)
            const attResponse = await api.get(`/attendance/employee/${emp._id}`, {
              params: {
                startDate: firstDay.toISOString().split('T')[0],
                endDate: lastDay.toISOString().split('T')[0],
                limit: 1000
              }
            });

            // Backend returns: { success, data: { attendance, pagination, summary } }
            let attendanceRecords = attResponse.data?.data?.attendance || [];
            
            // Ensure it's an array
            if (!Array.isArray(attendanceRecords)) {
              console.warn(`Invalid attendance data for ${emp.firstName}:`, attendanceRecords);
              throw new Error('Invalid attendance data format');
            }
            
            // Filter/recalculate based on selected office time
            if (selectedConfig && selectedConfig.start !== 'flexible') {
              // Parse office time thresholds
              const [startHour, startMin] = selectedConfig.start.split(':').map(Number);
              const [endHour, endMin] = selectedConfig.end.split(':').map(Number);
              
              // Recalculate late/early status based on selected shift
              attendanceRecords = attendanceRecords.map(record => {
                if (!record.punchIn?.time) return record;
                
                const punchInTime = new Date(record.punchIn.time);
                const recordDate = new Date(record.date);
                
                // Set threshold for late (start + 30 min grace period)
                const lateThreshold = new Date(recordDate);
                lateThreshold.setHours(startHour, startMin + 30, 0, 0);
                
                // Check if late for this shift
                const isLate = punchInTime > lateThreshold && record.status === 'present';
                
                return {
                  ...record,
                  status: isLate ? 'late' : record.status
                };
              });
            }
            
            // Count present days
            const presentDays = attendanceRecords.filter(a => 
              a.status === 'present' || a.status === 'partial'
            ).length;
            
            const lateDays = attendanceRecords.filter(a => a.status === 'late').length;
            const absentDays = attendanceRecords.filter(a => a.status === 'absent').length;
            const leaveDays = attendanceRecords.filter(a => a.status === 'leave').length;
            
            // Calculate percentage
            const percentage = workingDays > 0 ? Math.round((presentDays / workingDays) * 100) : 0;

            return {
              id: emp._id,
              name: `${emp.firstName} ${emp.lastName}`,
              employeeId: emp.employeeId,
              department: emp.department,
              email: emp.email,
              presentDays,
              lateDays,
              absentDays,
              leaveDays,
              totalDays: attendanceRecords.length,
              workingDays,
              percentage,
              officeTime: selectedConfig.label // Store which office time was used
            };
          } catch (err) {
            console.error(`Error fetching attendance for ${emp.firstName}:`, err);
            return {
              id: emp._id,
              name: `${emp.firstName} ${emp.lastName}`,
              employeeId: emp.employeeId,
              department: emp.department,
              email: emp.email,
              presentDays: 0,
              lateDays: 0,
              absentDays: 0,
              leaveDays: 0,
              totalDays: 0,
              workingDays,
              percentage: 0,
              officeTime: selectedConfig.label
            };
          }
        })
      );

      // Sort by percentage (descending)
      employeeStats.sort((a, b) => b.percentage - a.percentage);

      setTrackingData({
        employees: employeeStats,
        workingDays,
        month: now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
      });
      
      setShowTrackAttendance(true);

    } catch (error) {
      console.error('Track attendance error:', error);
      showToast.error('Failed to fetch attendance tracking data');
    } finally {
      setLoadingTracking(false);
    }
  };

  const handleWidgetSizeChange = (widget, newSize) => {
    setWidgetStates(prev => ({ ...prev, [widget]: newSize }));
  };

  // --- Render Helpers ---
  const formatTime = (timeString) => {
    if (!timeString) return '-';
    return new Date(timeString).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
  };
  const formatWorkingHours = (minutes) => {
    if (!minutes || minutes <= 0) return '0h';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  const getStatusColor = (status) => {
    const map = {
      present: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
      absent: 'text-rose-400 bg-rose-500/10 border-rose-500/20',
      late: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
      'early-departure': 'text-orange-400 bg-orange-500/10 border-orange-500/20',
      leave: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
    };
    return map[status] || 'text-zinc-400 bg-zinc-500/10 border-zinc-500/20';
  };

  // --- Handlers for Import/Export ---
  // --- Handlers for Import/Export ---
  const exportToCSV = () => {
    const headers = ['Employee Name', 'Department', 'Punch In', 'Punch Out', 'Working Hours', 'Status', 'Notes'];
    const csvData = attendanceData.map(record => [
      `${record.employee.firstName} ${record.employee.lastName}`,
      record.employee.department || '',
      formatTime(record.punchIn?.time),
      formatTime(record.punchOut?.time),
      formatWorkingHours(record.totalWorkingHours),
      record.status,
      record.notes || ''
    ]);

    const csvContent = [headers, ...csvData]
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `attendance-${selectedDate}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const downloadCSVTemplate = () => {
    const headers = [
      'Employee Code',
      'Date (YYYY-MM-DD)',
      'Punch In (HH:MM)',
      'Punch Out (HH:MM)',
      'Status',
      'Notes'
    ];

    const sampleData = [
      'EMP001,2025-10-14,09:00,17:30,present,Regular working day',
      'EMP002,2025-10-14,09:15,17:30,late,Late arrival',
      'EMP003,2025-10-14,,,,absent,Did not come to office'
    ];

    const csvContent = [headers.join(','), ...sampleData].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'attendance-import-template.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const downloadTemplate = () => {
    downloadCSVTemplate();
  };

  const parseCSVLine = (line) => {
    const values = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        values.push(current);
        current = '';
      } else {
        current += char;
      }
    }
    values.push(current);

    return values;
  };

  const parseCSVContent = (csvContent) => {
    // Remove BOM character if present
    const cleanContent = csvContent.replace(/^\uFEFF/, '');
    const lines = cleanContent.trim().split('\n');

    if (lines.length < 2) return [];

    // Parse headers and clean them
    const headers = parseCSVLine(lines[0]).map(h =>
      h.trim().replace(/"/g, '').toLowerCase()
    );

    return lines.slice(1).map((line, index) => {
      if (!line.trim()) return null; // Skip empty lines

      const values = parseCSVLine(line);
      const record = {};
      headers.forEach((header, i) => {
        record[header] = values[i] ? values[i].trim().replace(/"/g, '') : '';
      });

      return record;
    }).filter(record => record !== null);
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    if (!file.name.endsWith('.csv')) {
      showToast.error('Please select a CSV file');
      return;
    }

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        setImporting(true);
        const csvContent = e.target.result;
        const parsedData = parseCSVContent(csvContent);

        // Validate and transform data
        const attendanceRecords = parsedData.map(row => {
          const record = {
            employeeCode: row['employee code'] || row['employeecode'] || row['employee_code'] || '',
            date: row['date (yyyy-mm-dd)'] || row['date'] || row['dateyyyy_mm_dd'] || '',
            punchIn: row['punch in (hh:mm)'] || row['punchin'] || row['punch_in'] || '',
            punchOut: row['punch out (hh:mm)'] || row['punchout'] || row['punch_out'] || '',
            status: row['status'] || 'present',
            notes: row['notes'] || ''
          };
          return record;
        }).filter(record => record.employeeCode && record.date);

        if (attendanceRecords.length === 0) {
          throw new Error('No valid attendance records found in CSV');
        }

        // Store parsed records for later import
        setParsedRecords(attendanceRecords);

        // First validate with backend
        const validationResponse = await api.post('/attendance/validate-import', {
          records: attendanceRecords
        });

        if (validationResponse.data && validationResponse.data.success) {
          // Show preview with validation results
          setPreviewData(validationResponse.data.data);
          setShowPreview(true);
          setShowImportModal(false);
        } else {
          throw new Error(validationResponse.data?.message || 'Validation failed');
        }

      } catch (error) {
        console.error('Validation error:', error);
        showToast.error(error.message || 'Failed to validate CSV');
        setImportResults({
          success: 0,
          failed: 0,
          errors: [error.message || 'Failed to validate CSV']
        });
      } finally {
        setImporting(false);
      }
    };

    reader.readAsText(file);
    event.target.value = ''; // Reset file input
  };

  const handleConfirmImport = async () => {
    try {
      setImporting(true);
      
      // Get selected office timing config
      let timingConfig = officeTimeOptions.find(o => o.id === selectedOfficeTime);
      
      // If custom is selected, use custom times
      if (selectedOfficeTime === 'custom') {
        timingConfig = {
          startTime: customStartTime,
          endTime: customEndTime,
          shiftType: 'custom'
        };
      } else {
        timingConfig = {
          startTime: timingConfig.start,
          endTime: timingConfig.end,
          shiftType: timingConfig.id
        };
      }
      
      // Send to backend for actual import with office timing
      const response = await api.post('/attendance/import', {
        records: parsedRecords,
        officeTiming: timingConfig
      });

      if (response.data && response.data.success) {
        setImportResults({
          success: response.data.data.successful || 0,
          failed: response.data.data.failed || 0,
          errors: response.data.data.errors || []
        });

        showToast.success(`Successfully imported ${response.data.data.successful} records with ${timingConfig.shiftType} timing!`);
        
        // Close preview and refresh data
        setShowPreview(false);
        setPreviewData(null);
        setParsedRecords([]);
        fetchAttendanceData();
      } else {
        throw new Error(response.data?.message || 'Import failed');
      }
    } catch (error) {
      console.error('Import error:', error);
      showToast.error(error.message || 'Failed to import attendance');
      setImportResults({
        success: 0,
        failed: 0,
        errors: [error.message || 'Failed to import CSV']
      });
    } finally {
      setImporting(false);
    }
  };

  // Recalculate existing attendance with new office timing
  const handleRecalculate = async () => {
    try {
      setRecalculating(true);
      
      // Get selected office timing config
      let timingConfig;
      if (selectedOfficeTime === 'custom') {
        timingConfig = {
          startTime: customStartTime,
          endTime: customEndTime,
          shiftType: 'custom'
        };
      } else {
        const config = officeTimeOptions.find(o => o.id === selectedOfficeTime);
        timingConfig = {
          startTime: config.start,
          endTime: config.end,
          shiftType: config.id
        };
      }
      
      // Calculate date range (current month)
      const now = new Date();
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
      const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      
      // Call recalculate API
      const response = await api.post('/attendance/recalculate', {
        startDate: firstDay.toISOString().split('T')[0],
        endDate: lastDay.toISOString().split('T')[0],
        officeTiming: timingConfig
      });

      if (response.data && response.data.success) {
        showToast.success(`Recalculated ${response.data.data.updated} attendance records!`);
        setShowRecalculateModal(false);
        fetchAttendanceData();
        // Also refresh track attendance if open
        if (showTrackAttendance) {
          fetchTrackAttendance();
        }
      } else {
        throw new Error(response.data?.message || 'Recalculation failed');
      }
    } catch (error) {
      console.error('Recalculation error:', error);
      showToast.error(error.message || 'Failed to recalculate attendance');
    } finally {
      setRecalculating(false);
    }
  };

  // Fetch recent imports (last 24 hours)
  const fetchRecentImports = async () => {
    try {
      setLoadingImports(true);
      const response = await api.get('/attendance/recent-imports');
      
      if (response.data && response.data.success) {
        setRecentImports(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching recent imports:', error);
      showToast.error('Failed to load recent imports');
    } finally {
      setLoadingImports(false);
    }
  };

  // Delete a specific import batch
  const handleDeleteImportBatch = async (batchId) => {
    try {
      setDeletingBatch(batchId);
      
      const response = await api.delete(`/attendance/import-batch/${encodeURIComponent(batchId)}`);
      
      if (response.data && response.data.success) {
        showToast.success(`Deleted ${response.data.data.deletedCount} records successfully!`);
        
        // Refresh the imports list
        fetchRecentImports();
        
        // Refresh attendance data
        fetchAttendanceData();
        
        // Refresh track attendance if open
        if (showTrackAttendance) {
          fetchTrackAttendance();
        }
      }
    } catch (error) {
      console.error('Error deleting import batch:', error);
      showToast.error(error.response?.data?.message || 'Failed to delete import batch');
    } finally {
      setDeletingBatch(null);
    }
  };

  // Open delete imports modal and fetch data
  const openDeleteImportsModal = () => {
    setShowDeleteImportsModal(true);
    fetchRecentImports();
  };


  if (loading && !attendanceData.length) {
    return <div className="flex h-screen items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-violet-500"></div></div>;
  }

  return (
    <div className="space-y-8 p-2">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight">Attendance & Activity</h1>
          <p className="text-zinc-400 mt-1 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Real-time overview for {new Date(selectedDate).toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <div className="relative">
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-black/20 border border-white/10 rounded-xl px-4 py-2 text-white outline-none focus:border-violet-500/50 transition-colors"
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`p-2.5 rounded-xl border transition-all ${showFilters ? 'bg-violet-500 text-white border-violet-500' : 'bg-black/20 text-zinc-400 border-white/10 hover:text-white'}`}
          >
            <Filter size={18} />
          </button>
        </div>
      </div>

      {/* Filters Panel */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="bg-zinc-900/50 border border-white/10 rounded-2xl overflow-hidden"
          >
            <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* ... Filter Inputs ... */}
              <div>
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2 block">Department</label>
                <select
                  value={selectedDepartment}
                  onChange={(e) => setSelectedDepartment(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-violet-500/50"
                >
                  <option value="">All Departments</option>
                  {departments.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
              {/* Add more filters if needed */}
            </div>
          </motion.div>
        )}
      </AnimatePresence>


      {/* --- WIDGETS GRID --- */}
      <motion.div
        className="grid grid-cols-12 gap-6 auto-rows-min grid-flow-dense pb-6"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >

        {/* Widget 1: Total Employees Stats */}
        <AttendanceWidget
          variants={itemVariants}
          title="Total Workforce"
          subtitle="Real-time Count"
          size={widgetStates.employeeStats}
          onSizeChange={(s) => handleWidgetSizeChange('employeeStats', s)}
          color="violet"
        >
          {widgetStates.employeeStats === 'small' && (
            <div className="flex flex-col items-center justify-start h-full pt-2 relative">
              <div className="text-white text-7xl font-black tracking-tighter drop-shadow-2xl">{summary.totalEmployees || 0}</div>
              <div className="text-zinc-500 text-sm mt-0 uppercase tracking-widest font-bold">Total Employees</div>
              {/* Decorative Icon */}
              <div className="absolute top-[-10px] right-[-10px] opacity-20 text-violet-500 transform rotate-12">
                <Users size={80} strokeWidth={1} />
              </div>
            </div>
          )}

          {widgetStates.employeeStats === 'medium' && (
            <div className="flex h-full gap-6 relative">
              {/* Left Column: Stats */}
              <div className="flex flex-col justify-center items-end min-w-[140px] py-2 text-right">
                <div className="mb-4">
                  <div className="text-6xl font-black text-white tracking-tighter leading-none pr-8">{summary.totalEmployees || 0}</div>
                  <div className="text-zinc-500 text-xs uppercase font-bold tracking-wider mt-1">Active Staff</div>
                </div>

                <div className="flex items-center gap-2 bg-violet-500/5 w-fit px-2.5 py-1.5 rounded-lg border border-violet-500/10">
                  <div className="w-1.5 h-1.5 rounded-full bg-violet-500 animate-pulse" />
                  <span className="text-[10px] font-bold text-violet-300">Live Updates</span>
                </div>
              </div>

              {/* Right Column: Team Distribution */}
              <div className="flex-1 h-full relative border-l border-white/5 pl-6 flex flex-col justify-start pt-5">
                <div className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider opacity-70 mb-3">Team Distribution</div>
                <div className="space-y-3 w-full pr-2">
                  {[
                    { label: 'Design Team', count: 12, color: 'bg-pink-500' },
                    { label: 'Development', count: 24, color: 'bg-cyan-500' },
                    { label: 'Marketing', count: 8, color: 'bg-orange-500' }
                  ].map((item, i) => (
                    <div key={i} className="flex items-center justify-between text-xs group/item cursor-default">
                      <div className="flex items-center gap-3 text-zinc-300 group-hover/item:text-white transition-colors font-medium text-[13px]">
                        <div className={`w-2 h-2 rounded-full ${item.color} shadow-[0_0_8px_currentColor] opacity-80`} />
                        {item.label}
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 w-16 bg-white/5 rounded-full overflow-hidden">
                          <div className={`h-full ${item.color} opacity-50`} style={{ width: `${(item.count / 44) * 100}%` }} />
                        </div>
                        <span className="font-mono font-bold text-white/50 group-hover/item:text-white transition-colors text-xs">{item.count}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {widgetStates.employeeStats === 'large' && (
            <div className="flex flex-col h-full">
              <div className="flex flex-col items-center justify-center mb-6 pt-2">
                <div className="mb-2">
                  <span className="text-[10px] bg-emerald-500/10 text-emerald-400 px-2.5 py-1 rounded-full border border-emerald-500/20 font-bold">+12% vs Last Year</span>
                </div>
                <div className="text-5xl font-bold text-white tracking-tighter mb-1">{summary.totalEmployees || 0}</div>
                <div className="text-zinc-500 text-xs font-bold uppercase tracking-wider">Total Employees (Yearly Growth)</div>
              </div>
              <div className="flex-1 min-h-0">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={monthlyData}>
                    <defs>
                      <linearGradient id="colorTotalWhite" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#ffffff" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#ffffff" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#71717a', fontSize: 11 }} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#71717a', fontSize: 11 }} />
                    <Tooltip contentStyle={{ backgroundColor: '#09090b', borderColor: '#27272a' }} />
                    <Area type="monotone" dataKey="total" stroke="#ffffff" strokeWidth={3} fillOpacity={1} fill="url(#colorTotalWhite)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </AttendanceWidget>

        {/* Widget 2: Attendance Status */}
        <AttendanceWidget
          variants={itemVariants}
          title="Status Overview"
          subtitle="Today's Breakdown"
          size={widgetStates.statusStats}
          onSizeChange={(s) => handleWidgetSizeChange('statusStats', s)}
          color="emerald"
        >
          {widgetStates.statusStats === 'small' && (
            <div className="flex flex-col h-full justify-center">
              <div className="grid grid-cols-2 gap-3 h-full pb-1">
                <div className="bg-emerald-500/5 rounded-2xl p-2 border border-emerald-500/20 flex flex-col justify-center items-center shadow-[0_0_20px_rgba(16,185,129,0.15)] backdrop-blur-sm relative overflow-hidden group">
                  <div className="absolute inset-0 bg-emerald-500/10 blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="text-emerald-400 text-6xl font-black leading-none drop-shadow-lg relative z-10">{summary.present || 0}</div>
                  <div className="text-[10px] text-white/60 font-bold uppercase tracking-widest mt-1 relative z-10">Present</div>
                </div>
                <div className="bg-rose-500/5 rounded-2xl p-2 border border-rose-500/20 flex flex-col justify-center items-center shadow-[0_0_20px_rgba(244,63,94,0.15)] backdrop-blur-sm relative overflow-hidden group">
                  <div className="absolute inset-0 bg-rose-500/10 blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="text-rose-400 text-6xl font-black leading-none drop-shadow-lg relative z-10">{summary.absent || 0}</div>
                  <div className="text-[10px] text-white/60 font-bold uppercase tracking-widest mt-1 relative z-10">Absent</div>
                </div>
              </div>
            </div>
          )}

          {widgetStates.statusStats === 'medium' && (
            <div className="flex items-center h-full justify-between gap-4 px-2">
              <div className="flex-1 h-full bg-emerald-500/5 border border-emerald-500/10 rounded-2xl flex flex-col items-center justify-center relative overflow-hidden group hover:border-emerald-500/30 transition-all">
                <div className="absolute top-0 right-0 p-2 opacity-20"><div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /></div>
                <div className="text-4xl font-black text-emerald-400 mb-1">{summary.present || 0}</div>
                <div className="text-[10px] uppercase font-bold text-white/60 tracking-widest">Present</div>
              </div>
              <div className="flex-1 h-full bg-rose-500/5 border border-rose-500/10 rounded-2xl flex flex-col items-center justify-center relative overflow-hidden group hover:border-rose-500/30 transition-all">
                <div className="text-4xl font-black text-rose-400 mb-1">{summary.absent || 0}</div>
                <div className="text-[10px] uppercase font-bold text-white/60 tracking-widest">Absent</div>
              </div>
              <div className="flex-1 h-full bg-amber-500/5 border border-amber-500/10 rounded-2xl flex flex-col items-center justify-center relative overflow-hidden group hover:border-amber-500/30 transition-all">
                <div className="text-4xl font-black text-amber-400 mb-1">{summary.late || 0}</div>
                <div className="text-[10px] uppercase font-bold text-white/60 tracking-widest">Late</div>
              </div>
              <div className="flex-1 h-full bg-blue-500/5 border border-blue-500/10 rounded-2xl flex flex-col items-center justify-center relative overflow-hidden group hover:border-blue-500/30 transition-all">
                <div className="text-4xl font-black text-blue-400 mb-1">{summary.onLeave || 0}</div>
                <div className="text-[10px] uppercase font-bold text-white/60 tracking-widest">Leave</div>
              </div>
            </div>
          )}

          {widgetStates.statusStats === 'large' && (
            <div className="flex flex-col h-full">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <div className="text-3xl font-bold text-white tracking-tighter">Weekly Breakdown</div>
                  <div className="text-zinc-500 text-[10px] font-bold uppercase tracking-wider">Mon - Sat Activity</div>
                </div>
              </div>
              <div className="flex-1 min-h-0">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={weeklyData} barGap={8}>
                    <defs>
                      <filter id="neonGlowWhite" x="-50%" y="-50%" width="200%" height="200%">
                        <feGaussianBlur in="SourceGraphic" stdDeviation="2" result="blur" />
                        <feColorMatrix in="blur" type="matrix" values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 1 0" result="glow" />
                        <feMerge>
                          <feMergeNode in="glow" />
                          <feMergeNode in="SourceGraphic" />
                        </feMerge>
                      </filter>
                    </defs>
                    <CartesianGrid vertical={false} stroke="#ffffff" strokeOpacity={0.05} strokeDasharray="3 3" />
                    <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: '#a1a1aa', fontSize: 11, fontWeight: 600 }} dy={10} />
                    <Tooltip cursor={{ fill: 'rgba(255,255,255,0.05)' }} contentStyle={{ backgroundColor: '#18181b', borderColor: '#3f3f46' }} />
                    <Bar dataKey="present" fill="#ffffff" radius={[100, 100, 100, 100]} name="Present" barSize={20} filter="url(#neonGlowWhite)" />
                    <Bar dataKey="late" fill="#f59e0b" radius={[100, 100, 100, 100]} name="Late" barSize={20} />
                    <Bar dataKey="absent" fill="#f43f5e" radius={[100, 100, 100, 100]} name="Absent" barSize={20} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </AttendanceWidget>

      </motion.div>

      {/* --- PREMIUM TABLE SECTION --- */}
      <div className="bg-zinc-900 border border-white/5 rounded-3xl overflow-hidden shadow-2xl mt-8">
        <div className="px-8 py-6 border-b border-white/5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-zinc-900/50">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-3">
              <div className="p-2 rounded-lg bg-indigo-500/20 text-indigo-400"><Clock size={20} /></div>
              Attendance Records
            </h2>
            <p className="text-sm text-zinc-500 mt-1 ml-11">Detailed log for {new Date(selectedDate).toLocaleDateString()}</p>
          </div>

          <div className="flex gap-2">
            <button 
              onClick={fetchTrackAttendance} 
              disabled={loadingTracking}
              className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-sm font-medium hover:bg-emerald-700 transition-colors shadow-lg shadow-emerald-600/20 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loadingTracking ? 'Loading...' : 'Track Attendance'}
            </button>
            <button 
              onClick={() => setShowRecalculateModal(true)}
              className="px-4 py-2 bg-violet-600 text-white rounded-xl text-sm font-medium hover:bg-violet-700 transition-colors shadow-lg shadow-violet-600/20"
            >
              Recalculate
            </button>
            <button onClick={downloadTemplate} className="px-4 py-2 bg-zinc-800 text-zinc-300 rounded-xl text-sm font-medium hover:bg-zinc-700 transition-colors border border-white/5">Download Template</button>
            <button onClick={() => setShowImportModal(true)} className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-medium hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-600/20">Import CSV</button>
            <button 
              onClick={openDeleteImportsModal}
              className="px-4 py-2 bg-rose-600 text-white rounded-xl text-sm font-medium hover:bg-rose-700 transition-colors shadow-lg shadow-rose-600/20"
            >
              Delete Recent Imports
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white/[0.02] border-b border-white/5">
                <th className="px-8 py-5 text-[11px] font-bold text-zinc-500 uppercase tracking-wider">Employee Profile</th>
                <th className="px-6 py-5 text-[11px] font-bold text-zinc-500 uppercase tracking-wider">Department</th>
                <th className="px-6 py-5 text-[11px] font-bold text-zinc-500 uppercase tracking-wider text-center">In Time</th>
                <th className="px-6 py-5 text-[11px] font-bold text-zinc-500 uppercase tracking-wider text-center">Out Time</th>
                <th className="px-6 py-5 text-[11px] font-bold text-zinc-500 uppercase tracking-wider text-center">Duration</th>
                <th className="px-6 py-5 text-[11px] font-bold text-zinc-500 uppercase tracking-wider text-center">Status</th>
                <th className="px-6 py-5 text-[11px] font-bold text-zinc-500 uppercase tracking-wider text-right">Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {attendanceData.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-8 py-12 text-center text-zinc-500">
                    <div className="flex flex-col items-center justify-center gap-3">
                      <div className="p-4 rounded-full bg-zinc-800/50"><Clock size={32} className="opacity-50" /></div>
                      <p>No records found for this date.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                attendanceData.map((record, idx) => (
                  <tr key={record._id || idx} className="group hover:bg-white/[0.02] transition-colors">
                    <td className="px-8 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold text-sm shadow-lg shadow-indigo-500/20">
                          {record.employee.firstName?.[0]}{record.employee.lastName?.[0]}
                        </div>
                        <div>
                          <div className="font-bold text-white text-sm group-hover:text-indigo-400 transition-colors">{record.employee.firstName} {record.employee.lastName}</div>
                          <div className="text-[11px] text-zinc-500 font-mono mt-0.5">{record.employee.employeeId}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex px-2 py-1 rounded-md bg-white/5 border border-white/5 text-[11px] font-medium text-zinc-400">
                        {record.employee.department || 'General'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="font-mono text-sm text-zinc-300">{formatTime(record.punchIn?.time)}</span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="font-mono text-sm text-zinc-300">{formatTime(record.punchOut?.time)}</span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-zinc-800 border border-white/5">
                        <Clock size={12} className="text-zinc-500" />
                        <span className="font-mono text-xs font-bold text-white">{formatWorkingHours(record.totalWorkingHours)}</span>
                      </div>
                      {record.overtime?.hours > 0 && (
                        <div className="text-[10px] text-emerald-500 font-bold mt-1">+{formatWorkingHours(record.overtime.hours)} OT</div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wide border ${getStatusColor(record.status)}`}>
                        {record.status?.replace('-', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="text-sm text-zinc-500 line-clamp-1 max-w-[200px] ml-auto italic">
                        {record.notes || '--'}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div >

      {/* Import Modal */}
      {
        showImportModal && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-zinc-900 border border-white/10 rounded-2xl p-6 w-full max-w-md shadow-2xl relative">
              <button onClick={() => setShowImportModal(false)} className="absolute top-4 right-4 text-zinc-500 hover:text-white"><X size={20} /></button>
              <h3 className="text-xl font-bold text-white mb-4">Import Attendance CSV</h3>
              <div className="border-2 border-dashed border-zinc-700 rounded-xl p-8 text-center hover:bg-zinc-800/50 transition-colors cursor-pointer" onClick={() => fileInputRef.current?.click()} >
                <Upload className="mx-auto text-zinc-500 mb-2" size={32} />
                <p className="text-zinc-400 text-sm">Click to upload .csv file</p>
                <input ref={fileInputRef} type="file" accept=".csv" className="hidden" onChange={handleFileUpload} />
              </div>
              {importing && <p className="text-center text-indigo-400 mt-4 text-sm font-medium animate-pulse">Validating...</p>}
            </div>
          </div>
        )
      }

      {/* Preview Modal */}
      {showPreview && previewData && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-zinc-900 border border-white/10 rounded-2xl w-full max-w-4xl shadow-2xl relative max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b border-white/10">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-2xl font-bold text-white">Import Preview</h3>
                  <p className="text-sm text-zinc-400 mt-1">Review before importing</p>
                </div>
                <button onClick={() => { setShowPreview(false); setPreviewData(null); }} className="text-zinc-500 hover:text-white transition-colors">
                  <X size={24} />
                </button>
              </div>

              {/* Summary Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-6">
                <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4">
                  <div className="text-3xl font-bold text-blue-400">{previewData.totalRecords}</div>
                  <div className="text-xs text-blue-300/70 mt-1 font-medium">Total Records</div>
                </div>
                <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4">
                  <div className="text-3xl font-bold text-emerald-400">{previewData.summary.readyToImport}</div>
                  <div className="text-xs text-emerald-300/70 mt-1 font-medium">Ready to Import</div>
                </div>
                <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4">
                  <div className="text-3xl font-bold text-amber-400">{previewData.summary.duplicateAttendance}</div>
                  <div className="text-xs text-amber-300/70 mt-1 font-medium">Duplicates</div>
                </div>
                <div className="bg-rose-500/10 border border-rose-500/20 rounded-xl p-4">
                  <div className="text-3xl font-bold text-rose-400">{previewData.summary.notFoundEmployees}</div>
                  <div className="text-xs text-rose-300/70 mt-1 font-medium">Not Found</div>
                </div>
              </div>
            </div>

            {/* Records List */}
            <div className="flex-1 overflow-y-auto p-6">
              {/* Valid Records */}
              {previewData.validRecords.length > 0 && (
                <div className="mb-6">
                  <h4 className="text-sm font-bold text-emerald-400 mb-3 flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-emerald-400"></div>
                    Valid Records ({previewData.validRecords.length})
                  </h4>
                  <div className="space-y-2">
                    {previewData.validRecords.slice(0, 10).map((record, idx) => (
                      <div key={idx} className="bg-emerald-500/5 border border-emerald-500/20 rounded-lg p-3 text-sm">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400 font-bold text-xs">
                              ✓
                            </div>
                            <div>
                              <div className="text-white font-medium">{record.employeeName}</div>
                              <div className="text-zinc-500 text-xs">Code: {record.employeeCode} • Date: {record.date}</div>
                            </div>
                          </div>
                          <span className="text-xs text-emerald-400 font-medium">{record.reason}</span>
                        </div>
                      </div>
                    ))}
                    {previewData.validRecords.length > 10 && (
                      <div className="text-center text-xs text-zinc-500 py-2">
                        +{previewData.validRecords.length - 10} more records
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Duplicate Records */}
              {previewData.duplicateRecords.length > 0 && (
                <div className="mb-6">
                  <h4 className="text-sm font-bold text-amber-400 mb-3 flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-amber-400"></div>
                    Duplicate Attendance ({previewData.duplicateRecords.length})
                  </h4>
                  <div className="space-y-2">
                    {previewData.duplicateRecords.slice(0, 5).map((record, idx) => (
                      <div key={idx} className="bg-amber-500/5 border border-amber-500/20 rounded-lg p-3 text-sm">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-amber-500/20 flex items-center justify-center text-amber-400 font-bold text-xs">
                              ⚠
                            </div>
                            <div>
                              <div className="text-white font-medium">{record.employeeName}</div>
                              <div className="text-zinc-500 text-xs">Code: {record.employeeCode} • Date: {record.date}</div>
                            </div>
                          </div>
                          <span className="text-xs text-amber-400 font-medium">{record.reason}</span>
                        </div>
                      </div>
                    ))}
                    {previewData.duplicateRecords.length > 5 && (
                      <div className="text-center text-xs text-zinc-500 py-2">
                        +{previewData.duplicateRecords.length - 5} more duplicates
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Invalid Records */}
              {previewData.invalidRecords.length > 0 && (
                <div>
                  <h4 className="text-sm font-bold text-rose-400 mb-3 flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-rose-400"></div>
                    Invalid/Not Found ({previewData.invalidRecords.length})
                  </h4>
                  <div className="space-y-2">
                    {previewData.invalidRecords.slice(0, 5).map((record, idx) => (
                      <div key={idx} className="bg-rose-500/5 border border-rose-500/20 rounded-lg p-3 text-sm">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-rose-500/20 flex items-center justify-center text-rose-400 font-bold text-xs">
                              ✕
                            </div>
                            <div>
                              <div className="text-white font-medium">Code: {record.employeeCode}</div>
                              <div className="text-zinc-500 text-xs">Date: {record.date}</div>
                            </div>
                          </div>
                          <span className="text-xs text-rose-400 font-medium">{record.reason}</span>
                        </div>
                      </div>
                    ))}
                    {previewData.invalidRecords.length > 5 && (
                      <div className="text-center text-xs text-zinc-500 py-2">
                        +{previewData.invalidRecords.length - 5} more invalid records
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="p-6 border-t border-white/10 flex items-center justify-between bg-zinc-900/50">
              <div className="text-sm text-zinc-400">
                {previewData.summary.readyToImport > 0 ? (
                  <span className="text-emerald-400 font-medium">
                    {previewData.summary.readyToImport} records will be imported
                  </span>
                ) : (
                  <span className="text-rose-400 font-medium">No valid records to import</span>
                )}
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => { setShowPreview(false); setPreviewData(null); setShowImportModal(true); }}
                  className="px-4 py-2 bg-zinc-800 text-white rounded-xl text-sm font-medium hover:bg-zinc-700 transition-colors border border-white/5"
                >
                  Cancel
                </button>
                {previewData.summary.readyToImport > 0 && (
                  <button
                    onClick={handleConfirmImport}
                    disabled={importing}
                    className="px-6 py-2 bg-indigo-600 text-white rounded-xl text-sm font-medium hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-600/20 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {importing ? 'Importing...' : `Import ${previewData.summary.readyToImport} Records`}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Track Attendance Modal */}
      {showTrackAttendance && trackingData && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-zinc-900 border border-white/10 rounded-2xl w-full max-w-6xl shadow-2xl relative max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b border-white/10">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-2xl font-bold text-white">Attendance Tracking</h3>
                  <p className="text-sm text-zinc-400 mt-1">
                    {trackingData.month} • {trackingData.workingDays} Working Days
                  </p>
                </div>
                <button 
                  onClick={() => { setShowTrackAttendance(false); setTrackingData(null); }} 
                  className="text-zinc-500 hover:text-white transition-colors"
                >
                  <X size={24} />
                </button>
              </div>

              {/* Summary Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-6">
                <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4">
                  <div className="text-3xl font-bold text-blue-400">{trackingData.employees.length}</div>
                  <div className="text-xs text-blue-300/70 mt-1 font-medium">Total Employees</div>
                </div>
                <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4">
                  <div className="text-3xl font-bold text-emerald-400">
                    {Math.round(trackingData.employees.reduce((sum, e) => sum + e.percentage, 0) / trackingData.employees.length) || 0}%
                  </div>
                  <div className="text-xs text-emerald-300/70 mt-1 font-medium">Avg Attendance</div>
                </div>
                <div className="bg-violet-500/10 border border-violet-500/20 rounded-xl p-4">
                  <div className="text-3xl font-bold text-violet-400">
                    {trackingData.employees.filter(e => e.percentage >= 90).length}
                  </div>
                  <div className="text-xs text-violet-300/70 mt-1 font-medium">Above 90%</div>
                </div>
                <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4">
                  <div className="text-3xl font-bold text-amber-400">
                    {trackingData.employees.filter(e => e.percentage < 75).length}
                  </div>
                  <div className="text-xs text-amber-300/70 mt-1 font-medium">Below 75%</div>
                </div>
              </div>
            </div>

            {/* Employee List */}
            <div className="flex-1 overflow-y-auto p-6">
              <div className="space-y-3">
                {trackingData.employees.map((emp, idx) => (
                  <div 
                    key={emp.id} 
                    className={`bg-zinc-800/50 border rounded-xl p-4 hover:bg-zinc-800 transition-all ${
                      emp.percentage >= 90 ? 'border-emerald-500/20' : 
                      emp.percentage >= 75 ? 'border-blue-500/20' : 
                      'border-rose-500/20'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-4">
                      {/* Employee Info */}
                      <div className="flex items-center gap-4 flex-1">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold text-sm shadow-lg">
                          {emp.name.split(' ').map(n => n[0]).join('')}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-white font-medium">{emp.name}</span>
                            <span className="text-xs text-zinc-500 font-mono">{emp.employeeId}</span>
                          </div>
                          <div className="text-xs text-zinc-500 mt-0.5">{emp.department} • {emp.email}</div>
                        </div>
                      </div>

                      {/* Stats */}
                      <div className="flex items-center gap-6">
                        <div className="text-center">
                          <div className="text-emerald-400 font-bold text-lg">{emp.presentDays}</div>
                          <div className="text-[10px] text-zinc-500 uppercase tracking-wider">Present</div>
                        </div>
                        <div className="text-center">
                          <div className="text-amber-400 font-bold text-lg">{emp.lateDays}</div>
                          <div className="text-[10px] text-zinc-500 uppercase tracking-wider">Late</div>
                        </div>
                        <div className="text-center">
                          <div className="text-rose-400 font-bold text-lg">{emp.absentDays}</div>
                          <div className="text-[10px] text-zinc-500 uppercase tracking-wider">Absent</div>
                        </div>
                        <div className="text-center">
                          <div className="text-blue-400 font-bold text-lg">{emp.leaveDays}</div>
                          <div className="text-[10px] text-zinc-500 uppercase tracking-wider">Leave</div>
                        </div>
                      </div>

                      {/* Percentage */}
                      <div className="text-right min-w-[100px]">
                        <div className={`text-3xl font-black ${
                          emp.percentage >= 90 ? 'text-emerald-400' : 
                          emp.percentage >= 75 ? 'text-blue-400' : 
                          'text-rose-400'
                        }`}>
                          {emp.percentage}%
                        </div>
                        <div className="text-xs text-zinc-500 mt-1">
                          {emp.presentDays}/{emp.workingDays} days
                        </div>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="mt-3 h-2 bg-zinc-700 rounded-full overflow-hidden">
                      <div 
                        className={`h-full transition-all duration-500 ${
                          emp.percentage >= 90 ? 'bg-emerald-500' : 
                          emp.percentage >= 75 ? 'bg-blue-500' : 
                          'bg-rose-500'
                        }`}
                        style={{ width: `${emp.percentage}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-white/10 bg-zinc-900/50 flex justify-end">
              <button
                onClick={() => { setShowTrackAttendance(false); setTrackingData(null); }}
                className="px-6 py-2 bg-indigo-600 text-white rounded-xl text-sm font-medium hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-600/20"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Recalculate Modal */}
      {showRecalculateModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-zinc-900 border border-white/10 rounded-2xl w-full max-w-2xl shadow-2xl">
            <div className="p-6 border-b border-white/10">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-2xl font-bold text-white">Recalculate Attendance</h3>
                  <p className="text-sm text-zinc-400 mt-1">
                    Update existing records with new office timing
                  </p>
                </div>
                <button 
                  onClick={() => setShowRecalculateModal(false)} 
                  className="text-zinc-500 hover:text-white transition-colors"
                >
                  <X size={24} />
                </button>
              </div>

              {/* Office Time Selector */}
              <div className="mt-6">
                <label className="text-sm text-zinc-400 font-medium mb-2 block">Select New Office Time</label>
                <div className="relative">
                  <select
                    value={selectedOfficeTime}
                    onChange={(e) => setSelectedOfficeTime(e.target.value)}
                    className="w-full px-4 py-3 bg-zinc-800/50 border border-white/10 rounded-xl text-white focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all appearance-none cursor-pointer"
                  >
                    {officeTimeOptions.map(option => (
                      <option key={option.id} value={option.id} className="bg-zinc-800 text-white">
                        {option.label}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none" size={18} />
                </div>

                {/* Custom Time Inputs */}
                {selectedOfficeTime === 'custom' && (
                  <div className="mt-4 p-4 bg-zinc-800/30 border border-indigo-500/20 rounded-xl">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs text-zinc-400 font-medium mb-2 block">Start Time</label>
                        <input
                          type="time"
                          value={customStartTime}
                          onChange={(e) => setCustomStartTime(e.target.value)}
                          className="w-full px-4 py-2.5 bg-zinc-900/50 border border-white/10 rounded-lg text-white focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-zinc-400 font-medium mb-2 block">End Time</label>
                        <input
                          type="time"
                          value={customEndTime}
                          onChange={(e) => setCustomEndTime(e.target.value)}
                          className="w-full px-4 py-2.5 bg-zinc-900/50 border border-white/10 rounded-lg text-white focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all"
                        />
                      </div>
                    </div>
                  </div>
                )}

                <div className="mt-4 px-4 py-3 bg-amber-500/10 border border-amber-500/20 rounded-lg">
                  <p className="text-xs text-amber-300">
                    ⚠️ This will recalculate all attendance records for the current month based on the selected office timing. Late/Present/Early departure status will be updated accordingly.
                  </p>
                </div>
              </div>
            </div>

            <div className="p-6 flex gap-3 justify-end">
              <button
                onClick={() => setShowRecalculateModal(false)}
                disabled={recalculating}
                className="px-6 py-2.5 bg-zinc-800 text-zinc-300 rounded-xl font-medium hover:bg-zinc-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                onClick={handleRecalculate}
                disabled={recalculating}
                className="px-6 py-2.5 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 disabled:from-zinc-700 disabled:to-zinc-600 text-white font-medium rounded-xl transition-all shadow-lg hover:shadow-violet-500/25 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {recalculating ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                    Recalculating...
                  </>
                ) : (
                  <>
                    <Clock size={18} />
                    Recalculate
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Recent Imports Modal */}
      {showDeleteImportsModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-gradient-to-br from-zinc-900 to-black border border-white/10 rounded-3xl shadow-2xl max-w-3xl w-full max-h-[80vh] overflow-hidden">
            {/* Header */}
            <div className="p-6 border-b border-white/10">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-2xl font-bold text-white">Delete Recent Imports</h3>
                  <p className="text-sm text-zinc-400 mt-1">Imports from the last 24 hours</p>
                </div>
                <button 
                  onClick={() => setShowDeleteImportsModal(false)}
                  className="text-zinc-400 hover:text-white transition-colors"
                >
                  <X size={24} />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 overflow-y-auto max-h-[60vh]">
              {loadingImports ? (
                <div className="flex justify-center items-center py-12">
                  <div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                </div>
              ) : recentImports.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-zinc-400 text-lg">No recent imports found</p>
                  <p className="text-zinc-500 text-sm mt-2">Imports from the last 24 hours will appear here</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {recentImports.map((importBatch, index) => (
                    <div 
                      key={index}
                      className="bg-zinc-800/50 border border-white/5 rounded-xl p-4 hover:border-white/10 transition-all"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <div className="text-lg font-bold text-white">
                              {importBatch.recordCount} Records
                            </div>
                            <div className="text-xs text-zinc-400">
                              {new Date(importBatch.importTime).toLocaleString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </div>
                          </div>

                          <div className="flex items-center gap-4 text-sm">
                            <div className="text-zinc-400">
                              <span className="font-medium text-white">{importBatch.employeeCount}</span> employees
                            </div>
                            
                            {/* Status breakdown */}
                            <div className="flex items-center gap-2">
                              {Object.entries(importBatch.statusBreakdown).map(([status, count]) => (
                                <div 
                                  key={status}
                                  className={`px-2 py-1 rounded-lg text-xs font-medium ${
                                    status === 'present' ? 'bg-emerald-500/20 text-emerald-300' :
                                    status === 'absent' ? 'bg-rose-500/20 text-rose-300' :
                                    status === 'late' ? 'bg-amber-500/20 text-amber-300' :
                                    status === 'leave' ? 'bg-blue-500/20 text-blue-300' :
                                    'bg-zinc-500/20 text-zinc-300'
                                  }`}
                                >
                                  {status}: {count}
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Employee codes */}
                          <div className="mt-3 flex flex-wrap gap-2">
                            {importBatch.employees.slice(0, 10).map((emp, i) => (
                              <span 
                                key={i}
                                className="text-xs px-2 py-1 bg-zinc-700/50 text-zinc-300 rounded-lg"
                              >
                                {emp}
                              </span>
                            ))}
                            {importBatch.employees.length > 10 && (
                              <span className="text-xs px-2 py-1 text-zinc-500">
                                +{importBatch.employees.length - 10} more
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Delete button */}
                        <button
                          onClick={() => handleDeleteImportBatch(importBatch.batchId)}
                          disabled={deletingBatch === importBatch.batchId}
                          className="ml-4 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                          {deletingBatch === importBatch.batchId ? (
                            <>
                              <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                              Deleting...
                            </>
                          ) : (
                            <>
                              <X size={16} />
                              Delete
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-white/10">
              <button
                onClick={() => setShowDeleteImportsModal(false)}
                className="w-full px-6 py-3 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl font-medium transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

    </div >
  );
};

export default AttendanceManagement;