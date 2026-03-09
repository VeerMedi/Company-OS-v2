import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Users,
    Building2,
    TrendingUp,
    UserPlus,
    Search,
    Filter,
    Download,
    Eye,
    Edit,
    Trash2,
    X,
    Mail,
    Phone,
    Calendar,
    Briefcase,
    CheckCircle,
    XCircle,
    AlertCircle,
    Award,
    RotateCcw,
    History,
    Clock
} from 'lucide-react';
import {
    PieChart,
    Pie,
    Cell,
    ResponsiveContainer,
    AreaChart,
    Area,
    XAxis,
    YAxis,
    Tooltip,
    BarChart,
    Bar
} from 'recharts';
import HRWidget from '../components/hr/HRWidget';
import api from '../utils/api';
import { showToast } from '../utils/toast';

// Animations
const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
        opacity: 1,
        y: 0,
        transition: {
            duration: 0.6,
            ease: "easeOut",
            staggerChildren: 0.1,
            delayChildren: 0.2
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

// Minimal Tooltip
const MinimalTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-[#09090b] px-4 py-3 rounded-xl border border-white/10 shadow-2xl">
                <p className="text-white font-bold text-sm">{payload[0].value}</p>
                <p className="text-zinc-500 text-xs">{payload[0].name}</p>
            </div>
        );
    }
    return null;
};

const EmployeeRecords = () => {
    const navigate = useNavigate();
    const [employees, setEmployees] = useState([]);
    const [departments, setDepartments] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterDepartment, setFilterDepartment] = useState('all');
    const [filterStatus, setFilterStatus] = useState('all');
    const [showAddModal, setShowAddModal] = useState(false);
    const [selectedEmployee, setSelectedEmployee] = useState(null);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [showRestoreModal, setShowRestoreModal] = useState(false);
    const [deletedEmployees, setDeletedEmployees] = useState([]);
    const [newEmployee, setNewEmployee] = useState({
        firstName: '',
        lastName: '',
        email: '',
        password: '',
        phoneNumber: '',
        role: '',
        department: '',
        joiningDate: new Date().toISOString().split('T')[0],
        dateOfBirth: '',
        address: ''
    });

    // Widget sizes state
    const [widgetSizes, setWidgetSizes] = useState(() => {
        try {
            const saved = localStorage.getItem('employeeRecordsWidgetSizes_v3');
            const parsed = saved ? JSON.parse(saved) : null;
            // Use saved preferences if available, otherwise default to large
            return parsed || {
                overview: 'large',
                departments: 'large'
            };
        } catch (e) {
            return {
                overview: 'large',
                departments: 'large'
            };
        }
    });

    useEffect(() => {
        localStorage.setItem('employeeRecordsWidgetSizes_v3', JSON.stringify(widgetSizes));
    }, [widgetSizes]);

    const handleWidgetSizeChange = (id, size) => {
        setWidgetSizes(prev => ({ ...prev, [id]: size }));
    };

    // Fetch employees
    const fetchEmployees = useCallback(async () => {
        try {
            setIsLoading(true);
            const response = await api.get('/users/all');
            if (response.data?.success) {
                const employeeData = response.data.data || [];
                // Ensure it's an array
                setEmployees(Array.isArray(employeeData) ? employeeData : []);
            }
        } catch (error) {
            console.error('Error fetching employees:', error);
            showToast.error('Failed to load employees');
            setEmployees([]); // Set empty array on error
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchEmployees();
    }, [fetchEmployees]);

    // Calculate stats (treat undefined isActive as true/active)
    const employeeArray = Array.isArray(employees) ? employees : [];
    const stats = {
        total: employeeArray.length,
        active: employeeArray.filter(e => e.isActive !== false).length,
        inactive: employeeArray.filter(e => e.isActive === false).length,
        departments: [...new Set(employeeArray.map(e => e.department).filter(Boolean))].length
    };

    // Department distribution
    const departmentData = [...new Set(employeeArray.map(e => e.department).filter(Boolean))]
        .map(dept => ({
            name: dept,
            value: employeeArray.filter(e => e.department === dept).length,
            employees: employeeArray.filter(e => e.department === dept)
        }));

    // Weekly activity data (mock)
    const weeklyData = [
        { day: 'Mon', count: 12 },
        { day: 'Tue', count: 15 },
        { day: 'Wed', count: 18 },
        { day: 'Thu', count: 14 },
        { day: 'Fri', count: 20 },
        { day: 'Sat', count: 8 },
        { day: 'Sun', count: 5 }
    ];

    // Filter employees (treat undefined isActive as true/active)
    const filteredEmployees = employeeArray.filter(emp => {
        const matchesSearch = emp.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            emp.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            emp.email?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesDept = filterDepartment === 'all' || emp.department === filterDepartment;
        const isActive = emp.isActive !== false; // Treat undefined as active
        const matchesStatus = filterStatus === 'all' ||
            (filterStatus === 'active' && isActive) ||
            (filterStatus === 'inactive' && !isActive);
        return matchesSearch && matchesDept && matchesStatus;
    });

    const COLORS = ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#06b6d4'];

    // Button handlers
    const handleViewEmployee = (employee) => {
        setSelectedEmployee(employee);
    };

    const exportToCSV = () => {
        try {
            const csvData = filteredEmployees.map(emp => ({
                'First Name': emp.firstName || '',
                'Last Name': emp.lastName || '',
                'Email': emp.email || '',
                'Phone': emp.phoneNumber || '',
                'Role': emp.role || '',
                'Department': emp.department || '',
                'Status': emp.isActive !== false ? 'Active' : 'Inactive',
                'Join Date': emp.joiningDate ? new Date(emp.joiningDate).toLocaleDateString() : ''
            }));

            const headers = Object.keys(csvData[0]).join(',');
            const rows = csvData.map(row => Object.values(row).join(','));
            const csv = [headers, ...rows].join('\n');

            const blob = new Blob([csv], { type: 'text/csv' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `employees_${new Date().toISOString().split('T')[0]}.csv`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);

            showToast.success('Employee data exported successfully!');
        } catch (error) {
            console.error('Export error:', error);
            showToast.error('Failed to export data');
        }
    };

    const handleEditEmployee = (employee) => {
        showToast.info('Edit functionality coming soon!');
    };

    const handleAddEmployee = async (e) => {
        e.preventDefault();
        try {
            const payload = {
                firstName: newEmployee.firstName,
                lastName: newEmployee.lastName,
                email: newEmployee.email,
                password: newEmployee.password,
                phoneNumber: newEmployee.phoneNumber,
                role: newEmployee.role,
                department: newEmployee.department,
                joiningDate: newEmployee.joiningDate,
                dateOfBirth: newEmployee.dateOfBirth,
                address: newEmployee.address
            };

            const response = await api.post('/users/create', payload);
            if (response.data.success) {
                showToast.success('Employee added successfully!');
                setShowAddModal(false);
                setNewEmployee({
                    firstName: '',
                    lastName: '',
                    email: '',
                    password: '',
                    phoneNumber: '',
                    role: '',
                    department: '',
                    joiningDate: new Date().toISOString().split('T')[0],
                    dateOfBirth: '',
                    address: ''
                });
                fetchEmployees();
            }
        } catch (error) {
            console.error('Error adding employee:', error);
            showToast.error(error.response?.data?.message || 'Failed to add employee');
        }
    };

    const handleDeleteEmployee = (employee) => {
        setSelectedEmployee(employee);
        setShowDeleteConfirm(true);
    };

    const confirmDelete = async () => {
        try {
            await api.delete(`/users/${selectedEmployee._id}`);
            showToast.success('Employee moved to trash');
            setShowDeleteConfirm(false);
            setSelectedEmployee(null);
            fetchEmployees();
        } catch (error) {
            showToast.error('Failed to delete employee');
        }
    };

    const fetchDeletedEmployees = async () => {
        try {
            const response = await api.get('/users/deleted/list');
            if (response.data.success) {
                // Debug to confirm API response
                if (response.data.count > 0) showToast.success(`Found ${response.data.count} in trash`);
                else showToast.error('Trash is empty (Server says 0)');

                setDeletedEmployees(response.data.data);
                setShowRestoreModal(true);
            }
        } catch (error) {
            console.error('Fetch deleted error:', error);
            showToast.error('Failed to fetch deleted employees');
        }
    };

    const handleRestore = async (id) => {
        try {
            const response = await api.put(`/users/${id}/restore`);
            if (response.data.success) {
                showToast.success('Employee restored successfully');
                // Refresh deleted list to remove the restored one
                const updatedDeleted = deletedEmployees.filter(emp => emp._id !== id);
                setDeletedEmployees(updatedDeleted);
                if (updatedDeleted.length === 0) setShowRestoreModal(false);
                fetchEmployees();
            }
        } catch (error) {
            showToast.error(error.response?.data?.message || 'Failed to restore employee');
        }
    };

    // Lock body scroll when modal is open
    // Lock body scroll when modal is open
    useEffect(() => {
        if (selectedEmployee || showDeleteConfirm || showAddModal || showRestoreModal) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [selectedEmployee, showDeleteConfirm, showAddModal, showRestoreModal]);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    return (
        <>
            <style>{`
                .custom-scrollbar::-webkit-scrollbar {
                    width: 8px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: rgba(255, 255, 255, 0.05);
                    border-radius: 10px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: rgba(255, 255, 255, 0.2);
                    border-radius: 10px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: rgba(255, 255, 255, 0.3);
                }
            `}</style>
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
                            Employee Records
                        </h1>
                        <p className="mt-1 text-zinc-400 flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                            Comprehensive employee management system
                        </p>
                    </div>
                    <div className="flex space-x-3">
                        <button
                            onClick={fetchDeletedEmployees}
                            className="flex items-center px-4 py-2 bg-zinc-800/50 text-zinc-300 rounded-xl hover:bg-zinc-700/50 transition-colors border border-white/5 font-medium"
                            title="Restore Deleted Employees"
                        >
                            <History className="w-4 h-4 mr-2" />
                            <span>Restore</span>
                        </button>
                        <button
                            onClick={() => setShowAddModal(true)}
                            className="flex items-center px-6 py-3 bg-white text-black rounded-xl hover:bg-white/90 transition-all font-bold shadow-[0_0_20px_rgba(255,255,255,0.3)] hover:shadow-[0_0_30px_rgba(255,255,255,0.5)] border-2 border-white/20"
                        >
                            <UserPlus className="w-5 h-5 mr-2" />
                            <span>Add Employee</span>
                        </button>
                        <button
                            onClick={exportToCSV}
                            className="flex items-center px-4 py-2 bg-zinc-800/50 text-zinc-300 rounded-xl hover:bg-zinc-700/50 transition-colors border border-white/5 font-medium"
                        >
                            <Download className="w-4 h-4 mr-2" />
                            <span>Export</span>
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
                                value={filterDepartment}
                                onChange={(e) => setFilterDepartment(e.target.value)}
                                className="w-full px-3 py-2.5 bg-zinc-800/50 border border-zinc-700/50 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
                            >
                                <option value="all">All Departments</option>
                                {departmentData.map(dept => (
                                    <option key={dept.name} value={dept.name}>{dept.name}</option>
                                ))}
                            </select>
                        </div>
                        <div className="w-full md:w-48">
                            <select
                                value={filterStatus}
                                onChange={(e) => setFilterStatus(e.target.value)}
                                className="w-full px-3 py-2.5 bg-zinc-800/50 border border-zinc-700/50 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
                            >
                                <option value="all">All Status</option>
                                <option value="active">Active</option>
                                <option value="inactive">Inactive</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Widgets Grid */}
                <div className="grid grid-cols-12 gap-6 auto-rows-min grid-flow-dense">
                    {/* Widget 1: Employee Overview */}
                    <HRWidget
                        id="overview"
                        title="Employee Overview"
                        subtitle="Workforce Statistics"
                        icon={Users}
                        size={widgetSizes.overview}
                        onSizeChange={handleWidgetSizeChange}
                        color="blue"
                    >
                        {widgetSizes.overview === 'small' ? (
                            <div className="flex flex-col h-full justify-center items-center">
                                <div className="text-6xl font-black text-white tracking-tighter drop-shadow-2xl">
                                    {stats.total}
                                </div>
                                <div className="text-[10px] text-zinc-500 font-bold tracking-[0.2em] uppercase mt-2">
                                    Total Employees
                                </div>
                            </div>
                        ) : widgetSizes.overview === 'medium' ? (
                            <div className="flex flex-col h-full justify-center">
                                <div className="grid grid-cols-2 gap-4 h-full">
                                    <div className="bg-emerald-500/5 rounded-2xl p-4 border border-emerald-500/10 flex flex-col justify-center items-center relative overflow-hidden group hover:border-emerald-500/30 transition-all">
                                        <div className="absolute inset-0 bg-emerald-500/10 blur-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
                                        <div className="text-white text-5xl font-black leading-none drop-shadow-xl relative z-10">{stats.active}</div>
                                        <div className="text-[11px] text-zinc-400 font-bold uppercase tracking-widest mt-2 relative z-10 text-center">Active</div>
                                    </div>
                                    <div className="bg-red-500/5 rounded-2xl p-4 border border-red-500/10 flex flex-col justify-center items-center relative overflow-hidden group hover:border-red-500/30 transition-all">
                                        <div className="absolute inset-0 bg-red-500/10 blur-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
                                        <div className="text-white text-5xl font-black leading-none drop-shadow-xl relative z-10">{stats.inactive}</div>
                                        <div className="text-[11px] text-zinc-400 font-bold uppercase tracking-widest mt-2 relative z-10 text-center">Inactive</div>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="flex flex-col h-full">
                                <div className="grid grid-cols-3 gap-3 mb-4">
                                    <div className="bg-blue-500/5 rounded-xl p-3 border border-blue-500/10">
                                        <div className="text-white text-3xl font-black">{stats.total}</div>
                                        <div className="text-[9px] text-zinc-500 font-bold uppercase tracking-wider mt-1">Total</div>
                                    </div>
                                    <div className="bg-emerald-500/5 rounded-xl p-3 border border-emerald-500/10">
                                        <div className="text-white text-3xl font-black">{stats.active}</div>
                                        <div className="text-[9px] text-zinc-500 font-bold uppercase tracking-wider mt-1">Active</div>
                                    </div>
                                    <div className="bg-red-500/5 rounded-xl p-3 border border-red-500/10">
                                        <div className="text-white text-3xl font-black">{stats.inactive}</div>
                                        <div className="text-[9px] text-zinc-500 font-bold uppercase tracking-wider mt-1">Inactive</div>
                                    </div>
                                </div>
                                <div className="flex-1 min-h-0">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <AreaChart data={weeklyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                            <defs>
                                                <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#ffffff" stopOpacity={0.3} />
                                                    <stop offset="95%" stopColor="#ffffff" stopOpacity={0} />
                                                </linearGradient>
                                            </defs>
                                            <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: '#71717a', fontSize: 10 }} />
                                            <YAxis hide />
                                            <Tooltip content={<MinimalTooltip />} />
                                            <Area type="monotone" dataKey="count" stroke="#ffffff" strokeWidth={3} fill="url(#colorCount)" />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                        )}
                    </HRWidget>

                    {/* Widget 2: Department Overview */}
                    <HRWidget
                        id="departments"
                        title="Department Overview"
                        subtitle="Team Distribution"
                        icon={Building2}
                        size={widgetSizes.departments}
                        onSizeChange={handleWidgetSizeChange}
                        color="purple"
                    >
                        {widgetSizes.departments === 'small' ? (
                            <div className="flex flex-col h-full justify-center items-center">
                                <div className="text-6xl font-black text-white tracking-tighter drop-shadow-2xl">
                                    {stats.departments}
                                </div>
                                <div className="text-[10px] text-zinc-500 font-bold tracking-[0.2em] uppercase mt-2">
                                    Departments
                                </div>
                            </div>
                        ) : widgetSizes.departments === 'medium' ? (
                            <div className="flex flex-col h-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={departmentData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                        <XAxis
                                            dataKey="name"
                                            axisLine={false}
                                            tickLine={false}
                                            tick={{ fill: '#a1a1aa', fontSize: 10, fontWeight: 'bold' }}
                                            interval={0}
                                        />
                                        <Tooltip
                                            cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                                            content={({ active, payload }) => {
                                                if (active && payload && payload.length) {
                                                    return (
                                                        <div className="bg-zinc-900 border border-white/10 p-2 rounded-lg shadow-xl">
                                                            <p className="text-white text-xs font-bold">{payload[0].payload.name}</p>
                                                            <p className="text-white text-sm font-black">{payload[0].value} Employees</p>
                                                        </div>
                                                    );
                                                }
                                                return null;
                                            }}
                                        />
                                        <Bar
                                            dataKey="value"
                                            radius={[6, 6, 6, 6]}
                                            barSize={40}
                                        >
                                            {departmentData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill="rgba(255, 255, 255, 0.8)" stroke="#ffffff" strokeWidth={2} style={{ filter: 'drop-shadow(0 0 10px rgba(255,255,255,0.5))' }} />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        ) : (
                            <div className="flex flex-col h-full">
                                <div className="flex-1 min-h-0 grid grid-cols-2 gap-4">
                                    <div className="flex items-center justify-center min-h-0">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <PieChart>
                                                <Pie
                                                    data={departmentData}
                                                    cx="50%"
                                                    cy="50%"
                                                    innerRadius={60}
                                                    outerRadius={80}
                                                    paddingAngle={2}
                                                    dataKey="value"
                                                    stroke="#ffffff"
                                                    strokeWidth={2}
                                                >
                                                    {departmentData.map((entry, index) => (
                                                        <Cell key={`cell-${index}`} fill="rgba(255, 255, 255, 0.1)" />
                                                    ))}
                                                </Pie>
                                                <Tooltip content={<MinimalTooltip />} />
                                            </PieChart>
                                        </ResponsiveContainer>
                                    </div>
                                    <div className="flex flex-col justify-start space-y-3 overflow-y-auto custom-scrollbar pr-2 min-h-0">
                                        {departmentData.map((dept, idx) => (
                                            <div key={dept.name} className="bg-white/5 rounded-xl p-4 hover:bg-white/10 transition-all border border-white/10 hover:border-white/20 hover:shadow-[0_0_15px_rgba(255,255,255,0.1)]">
                                                <div className="flex items-center justify-between mb-3">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-4 h-4 rounded-full bg-white shadow-[0_0_10px_rgba(255,255,255,0.5)]" />
                                                        <span className="text-base font-bold text-white">{dept.name}</span>
                                                    </div>
                                                    <span className="text-2xl font-black text-white">{dept.value}</span>
                                                </div>
                                                <div className="text-[10px] text-white/60 font-medium">
                                                    {dept.employees.slice(0, 3).map(e => `${e.firstName} ${e.lastName}`).join(', ')}
                                                    {dept.employees.length > 3 && ` +${dept.employees.length - 3} more`}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}
                    </HRWidget>
                </div>

                {/* Employee List */}
                <motion.div
                    className="bg-zinc-900 border border-white/5 rounded-3xl overflow-hidden shadow-2xl"
                    variants={itemVariants}
                >
                    <div className="px-8 py-6 border-b border-white/5 flex justify-between items-center bg-zinc-900/50">
                        <h3 className="text-xl font-bold text-white flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-blue-500/20 text-blue-400"><Users size={20} /></div>
                            Employee Directory
                        </h3>
                        <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider bg-white/5 px-3 py-1 rounded-full">
                            {filteredEmployees.length} records
                        </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-6">
                        {filteredEmployees.map((employee, index) => (
                            <motion.div
                                key={employee._id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.05 }}
                                className="bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur-sm rounded-2xl p-5 border-2 border-white/10 hover:border-white/30 transition-all group hover:shadow-[0_0_30px_rgba(255,255,255,0.2)] shadow-[0_0_15px_rgba(255,255,255,0.1)]"
                            >
                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-sm text-white shadow-lg ${index % 4 === 0 ? 'bg-gradient-to-br from-blue-500 to-indigo-600' :
                                            index % 4 === 1 ? 'bg-gradient-to-br from-purple-500 to-pink-600' :
                                                index % 4 === 2 ? 'bg-gradient-to-br from-emerald-500 to-teal-600' :
                                                    'bg-gradient-to-br from-orange-500 to-red-600'
                                            }`}>
                                            {employee.firstName?.charAt(0)}{employee.lastName?.charAt(0)}
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-white text-sm group-hover:text-blue-400 transition-colors">
                                                {employee.firstName} {employee.lastName}
                                            </h4>
                                            <p className="text-[10px] text-zinc-500 font-medium">{employee.role}</p>
                                        </div>
                                    </div>
                                    <span className={`px-2 py-1 rounded-lg text-[9px] uppercase font-black tracking-wider ${employee.isActive !== false ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'
                                        }`}>
                                        {employee.isActive !== false ? 'Active' : 'Inactive'}
                                    </span>
                                </div>

                                <div className="space-y-2 mb-4">
                                    <div className="flex items-center gap-2 text-xs text-zinc-400">
                                        <Mail size={12} />
                                        <span className="truncate">{employee.email}</span>
                                    </div>
                                    {employee.phoneNumber && (
                                        <div className="flex items-center gap-2 text-xs text-zinc-400">
                                            <Phone size={12} />
                                            <span>{employee.phoneNumber}</span>
                                        </div>
                                    )}
                                    {employee.department && (
                                        <div className="flex items-center gap-2 text-xs text-zinc-400">
                                            <Briefcase size={12} />
                                            <span>{employee.department}</span>
                                        </div>
                                    )}
                                </div>

                                <div className="flex gap-2">
                                    <button
                                        onClick={() => handleViewEmployee(employee)}
                                        className="flex-1 p-2 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 rounded-lg transition-all text-xs font-medium flex items-center justify-center gap-1"
                                    >
                                        <Eye size={12} />
                                        View
                                    </button>
                                    <button
                                        onClick={() => navigate(`/profile?userId=${employee._id}`, { state: { from: '/hr/employees' } })}
                                        className="flex-1 p-2 bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 rounded-lg transition-all text-xs font-medium flex items-center justify-center gap-1"
                                    >
                                        <Eye size={12} />
                                        View Profile
                                    </button>
                                    <button
                                        onClick={() => handleDeleteEmployee(employee)}
                                        className="p-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg transition-all"
                                    >
                                        <Trash2 size={12} />
                                    </button>
                                </div>
                            </motion.div>
                        ))}
                    </div>

                    {filteredEmployees.length === 0 && (
                        <div className="text-center py-12">
                            <Users size={48} className="mx-auto text-zinc-600 mb-4" />
                            <p className="text-zinc-400">No employees found</p>
                        </div>
                    )}
                </motion.div>

                {/* Employee Details Modal */}
                {selectedEmployee && !showDeleteConfirm && (
                    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setSelectedEmployee(null)}>
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="bg-zinc-950 border border-white/10 rounded-2xl max-w-3xl w-full max-h-[90vh] shadow-2xl relative flex flex-col"
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* Fixed Header */}
                            <div className="flex items-center justify-between p-8 pb-4 border-b border-white/5 flex-shrink-0">
                                <h2 className="text-2xl font-bold text-white tracking-tight">Employee Details</h2>
                                <button onClick={() => setSelectedEmployee(null)} className="text-zinc-500 hover:text-white p-2 hover:bg-white/5 rounded-lg transition-colors">
                                    <X className="h-6 w-6" />
                                </button>
                            </div>

                            {/* Scrollable Content */}
                            <div className="overflow-y-auto px-8 custom-scrollbar flex-1">
                                <div className="space-y-8 pt-6">
                                    {/* Personal Information */}
                                    <div>
                                        <h3 className="text-sm font-medium text-zinc-400 uppercase tracking-wider mb-4">Personal Information</h3>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="bg-zinc-900/50 p-4 rounded-xl border border-white/5">
                                                <label className="text-xs text-zinc-500 uppercase tracking-wider font-semibold">Full Name</label>
                                                <p className="text-zinc-300 font-medium mt-1">{selectedEmployee.firstName} {selectedEmployee.lastName}</p>
                                            </div>
                                            <div className="bg-zinc-900/50 p-4 rounded-xl border border-white/5">
                                                <label className="text-xs text-zinc-500 uppercase tracking-wider font-semibold">Employee ID</label>
                                                <p className="text-zinc-300 font-medium mt-1">{selectedEmployee.employeeId || 'N/A'}</p>
                                            </div>
                                            <div className="bg-zinc-900/50 p-4 rounded-xl border border-white/5">
                                                <label className="text-xs text-zinc-500 uppercase tracking-wider font-semibold">Email</label>
                                                <p className="text-zinc-300 font-medium mt-1">{selectedEmployee.email}</p>
                                            </div>
                                            <div className="bg-zinc-900/50 p-4 rounded-xl border border-white/5">
                                                <label className="text-xs text-zinc-500 uppercase tracking-wider font-semibold">Phone</label>
                                                <p className="text-zinc-300 font-medium mt-1">{selectedEmployee.phoneNumber || 'N/A'}</p>
                                            </div>
                                            <div className="bg-zinc-900/50 p-4 rounded-xl border border-white/5">
                                                <label className="text-xs text-zinc-500 uppercase tracking-wider font-semibold">Date of Birth</label>
                                                <p className="text-zinc-300 font-medium mt-1">{selectedEmployee.dateOfBirth ? new Date(selectedEmployee.dateOfBirth).toLocaleDateString() : 'N/A'}</p>
                                            </div>
                                            <div className="bg-zinc-900/50 p-4 rounded-xl border border-white/5">
                                                <label className="text-xs text-zinc-500 uppercase tracking-wider font-semibold">Address</label>
                                                <p className="text-zinc-300 font-medium mt-1 truncate" title={selectedEmployee.address}>{selectedEmployee.address || 'N/A'}</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Employment Information */}
                                    <div>
                                        <h3 className="text-sm font-medium text-zinc-400 uppercase tracking-wider mb-4">Employment Information</h3>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="bg-zinc-900/50 p-4 rounded-xl border border-white/5">
                                                <label className="text-xs text-zinc-500 uppercase tracking-wider font-semibold">Role</label>
                                                <p className="text-zinc-300 font-medium capitalize mt-1">{selectedEmployee.role?.replace('-', ' ') || 'N/A'}</p>
                                            </div>
                                            <div className="bg-zinc-900/50 p-4 rounded-xl border border-white/5">
                                                <label className="text-xs text-zinc-500 uppercase tracking-wider font-semibold">Department</label>
                                                <p className="text-zinc-300 font-medium mt-1">{selectedEmployee.department || 'N/A'}</p>
                                            </div>
                                            <div className="bg-zinc-900/50 p-4 rounded-xl border border-white/5">
                                                <label className="text-xs text-zinc-500 uppercase tracking-wider font-semibold">Join Date</label>
                                                <p className="text-zinc-300 font-medium mt-1">{selectedEmployee.joiningDate ? new Date(selectedEmployee.joiningDate).toLocaleDateString() : new Date(selectedEmployee.createdAt).toLocaleDateString()}</p>
                                            </div>
                                            <div className="bg-zinc-900/50 p-4 rounded-xl border border-white/5">
                                                <label className="text-xs text-zinc-500 uppercase tracking-wider font-semibold">Status</label>
                                                <div className="mt-1">
                                                    <span className={`inline-block px-2 py-1 rounded-lg text-xs font-bold ${selectedEmployee.isActive !== false ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
                                                        {selectedEmployee.isActive !== false ? 'Active' : 'Inactive'}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Education Information */}
                                    <div>
                                        <h3 className="text-sm font-medium text-zinc-400 uppercase tracking-wider mb-4">Education</h3>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="bg-zinc-900/50 p-4 rounded-xl border border-white/5">
                                                <label className="text-xs text-zinc-500 uppercase tracking-wider font-semibold">Institute</label>
                                                <p className="text-zinc-300 font-medium mt-1">{selectedEmployee.education?.instituteName || 'N/A'}</p>
                                            </div>
                                            <div className="bg-zinc-900/50 p-4 rounded-xl border border-white/5">
                                                <label className="text-xs text-zinc-500 uppercase tracking-wider font-semibold">Qualification</label>
                                                <p className="text-zinc-300 font-medium mt-1">{selectedEmployee.education?.highestQualification || 'N/A'}</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Bank Information */}
                                    <div>
                                        <h3 className="text-sm font-medium text-zinc-400 uppercase tracking-wider mb-4">Bank Details</h3>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="bg-zinc-900/50 p-4 rounded-xl border border-white/5">
                                                <label className="text-xs text-zinc-500 uppercase tracking-wider font-semibold">Bank Name</label>
                                                <p className="text-zinc-300 font-medium mt-1">{selectedEmployee.bankDetails?.bankName || 'N/A'}</p>
                                            </div>
                                            <div className="bg-zinc-900/50 p-4 rounded-xl border border-white/5">
                                                <label className="text-xs text-zinc-500 uppercase tracking-wider font-semibold">Branch</label>
                                                <p className="text-zinc-300 font-medium mt-1">{selectedEmployee.bankDetails?.branchName || 'N/A'}</p>
                                            </div>
                                            <div className="bg-zinc-900/50 p-4 rounded-xl border border-white/5">
                                                <label className="text-xs text-zinc-500 uppercase tracking-wider font-semibold">Account Number</label>
                                                <p className="text-zinc-300 font-medium mt-1">{selectedEmployee.bankDetails?.accountNumber || 'N/A'}</p>
                                            </div>
                                            <div className="bg-zinc-900/50 p-4 rounded-xl border border-white/5">
                                                <label className="text-xs text-zinc-500 uppercase tracking-wider font-semibold">IFSC Code</label>
                                                <p className="text-zinc-300 font-medium mt-1">{selectedEmployee.bankDetails?.ifscCode || 'N/A'}</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Identity Information */}
                                    <div>
                                        <h3 className="text-sm font-medium text-zinc-400 uppercase tracking-wider mb-4">Identity</h3>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="bg-zinc-900/50 p-4 rounded-xl border border-white/5">
                                                <label className="text-xs text-zinc-500 uppercase tracking-wider font-semibold">Aadhaar</label>
                                                <p className="text-white font-medium mt-1">{selectedEmployee.aadhaarDetails?.number || 'N/A'}</p>
                                            </div>
                                            <div className="bg-zinc-900/50 p-4 rounded-xl border border-white/5">
                                                <label className="text-xs text-zinc-500 uppercase tracking-wider font-semibold">PAN</label>
                                                <p className="text-white font-medium mt-1">{selectedEmployee.panDetails?.number || 'N/A'}</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Performance Summary */}
                                    <div>
                                        <h3 className="text-sm font-medium text-zinc-400 uppercase tracking-wider mb-4">Performance Summary</h3>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="bg-gradient-to-br from-purple-500/10 to-purple-600/5 border border-purple-500/10 p-4 rounded-xl">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <Award className="h-4 w-4 text-purple-400" />
                                                    <span className="text-xs text-purple-300 font-medium uppercase tracking-wider">Total Points</span>
                                                </div>
                                                <p className="text-2xl font-bold text-white">{selectedEmployee.totalPoints || 0}</p>
                                            </div>
                                            <div className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 border border-blue-500/10 p-4 rounded-xl">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <Briefcase className="h-4 w-4 text-blue-400" />
                                                    <span className="text-xs text-blue-300 font-medium uppercase tracking-wider">Active Tasks</span>
                                                </div>
                                                <p className="text-2xl font-bold text-white">{selectedEmployee.activeTasks || 0}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Fixed Footer */}
                            <div className="flex gap-3 p-8 pt-4 border-t border-white/5 flex-shrink-0">
                                <button
                                    onClick={() => setSelectedEmployee(null)}
                                    className="flex-1 px-4 py-3 bg-zinc-900 text-white font-medium rounded-xl hover:bg-zinc-800 transition-colors border border-white/10"
                                >
                                    Close
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}

                {/* Delete Confirmation Modal */}
                {showDeleteConfirm && selectedEmployee && (
                    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="bg-zinc-900 border border-red-500/20 rounded-2xl max-w-md w-full p-6 shadow-2xl"
                        >
                            <div className="text-center">
                                <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <AlertCircle size={32} className="text-red-400" />
                                </div>
                                <h3 className="text-xl font-bold text-white mb-2">Move to Trash?</h3>
                                <p className="text-zinc-400 mb-6">Are you sure you want to remove {selectedEmployee.firstName} {selectedEmployee.lastName}? You can restore this profile within 24 hours.</p>
                                <div className="flex gap-3">
                                    <button
                                        onClick={() => { setShowDeleteConfirm(false); setSelectedEmployee(null); }}
                                        className="flex-1 px-4 py-2 bg-zinc-800 text-white rounded-xl hover:bg-zinc-700 transition-colors font-medium"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={confirmDelete}
                                        className="flex-1 px-4 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors font-medium"
                                    >
                                        Delete
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}

                {/* Add Employee Modal */}
                {showAddModal && (
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="bg-zinc-950 border border-white/10 rounded-2xl max-w-2xl w-full shadow-2xl relative flex flex-col overflow-hidden"
                            style={{ maxHeight: '90vh' }}
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* Fixed Header */}
                            <div className="flex items-center justify-center py-10 px-6 border-b border-white/10 relative flex-shrink-0">
                                <h2 className="text-xl font-bold text-white tracking-wide uppercase drop-shadow-[0_0_10px_rgba(255,255,255,0.3)]">Add New Employee</h2>
                                <button
                                    onClick={() => setShowAddModal(false)}
                                    className="absolute right-6 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white p-2 hover:bg-white/5 rounded-lg transition-colors"
                                >
                                    <X className="h-5 w-5" />
                                </button>
                            </div>

                            {/* Scrollable Form */}
                            <form onSubmit={handleAddEmployee} className="overflow-y-auto px-8 custom-scrollbar flex-1">
                                <div className="space-y-6 pt-6 pb-6">
                                    {/* Personal Information */}
                                    <div>
                                        <h3 className="text-sm font-medium text-zinc-400 uppercase tracking-wider mb-4">Personal Information</h3>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-xs text-zinc-500 uppercase tracking-wider font-semibold mb-2">First Name *</label>
                                                <input
                                                    type="text"
                                                    required
                                                    value={newEmployee.firstName}
                                                    onChange={(e) => setNewEmployee({ ...newEmployee, firstName: e.target.value })}
                                                    className="w-full bg-zinc-900/50 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-zinc-600 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition-all"
                                                    placeholder="Enter first name"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs text-zinc-500 uppercase tracking-wider font-semibold mb-2">Last Name *</label>
                                                <input
                                                    type="text"
                                                    required
                                                    value={newEmployee.lastName}
                                                    onChange={(e) => setNewEmployee({ ...newEmployee, lastName: e.target.value })}
                                                    className="w-full bg-zinc-900/50 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-zinc-600 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition-all"
                                                    placeholder="Enter last name"
                                                />
                                            </div>
                                            <div className="col-span-2">
                                                <label className="block text-xs text-zinc-500 uppercase tracking-wider font-semibold mb-2">Email *</label>
                                                <input
                                                    type="email"
                                                    required
                                                    value={newEmployee.email}
                                                    onChange={(e) => setNewEmployee({ ...newEmployee, email: e.target.value })}
                                                    className="w-full bg-zinc-900/50 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-zinc-600 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition-all"
                                                    placeholder="manager@hustlesystem.com"
                                                />
                                            </div>
                                            <div className="col-span-2">
                                                <label className="block text-xs text-zinc-500 uppercase tracking-wider font-semibold mb-2">Password *</label>
                                                <input
                                                    type="password"
                                                    required
                                                    value={newEmployee.password}
                                                    onChange={(e) => setNewEmployee({ ...newEmployee, password: e.target.value })}
                                                    className="w-full bg-zinc-900/50 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-zinc-600 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition-all"
                                                    placeholder="krishna123"
                                                />
                                            </div>
                                            <div className="col-span-2">
                                                <label className="block text-xs text-zinc-500 uppercase tracking-wider font-semibold mb-2">Phone Number</label>
                                                <input
                                                    type="tel"
                                                    value={newEmployee.phoneNumber}
                                                    onChange={(e) => setNewEmployee({ ...newEmployee, phoneNumber: e.target.value })}
                                                    className="w-full bg-zinc-900/50 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-zinc-600 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition-all"
                                                    placeholder="+91 XXXXX XXXXX"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs text-zinc-500 uppercase tracking-wider font-semibold mb-2">Date of Birth</label>
                                                <input
                                                    type="date"
                                                    value={newEmployee.dateOfBirth}
                                                    onChange={(e) => setNewEmployee({ ...newEmployee, dateOfBirth: e.target.value })}
                                                    className="w-full bg-zinc-900/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition-all"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs text-zinc-500 uppercase tracking-wider font-semibold mb-2">Joining Date</label>
                                                <input
                                                    type="date"
                                                    value={newEmployee.joiningDate}
                                                    onChange={(e) => setNewEmployee({ ...newEmployee, joiningDate: e.target.value })}
                                                    className="w-full bg-zinc-900/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition-all"
                                                />
                                            </div>
                                            <div className="col-span-2">
                                                <label className="block text-xs text-zinc-500 uppercase tracking-wider font-semibold mb-2">Address</label>
                                                <textarea
                                                    value={newEmployee.address}
                                                    onChange={(e) => setNewEmployee({ ...newEmployee, address: e.target.value })}
                                                    className="w-full bg-zinc-900/50 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-zinc-600 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition-all h-20 resize-none"
                                                    placeholder="Enter full address"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Employment Information */}
                                    <div>
                                        <h3 className="text-sm font-medium text-zinc-400 uppercase tracking-wider mb-4">Employment Information</h3>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-xs text-zinc-500 uppercase tracking-wider font-semibold mb-2">Role *</label>
                                                <select
                                                    required
                                                    value={newEmployee.role}
                                                    onChange={(e) => setNewEmployee({ ...newEmployee, role: e.target.value })}
                                                    className="w-full bg-zinc-900/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition-all"
                                                >
                                                    <option value="">Select Role</option>
                                                    <option value="individual">Individual</option>
                                                    <option value="manager">Manager</option>
                                                    <option value="hr">HR</option>
                                                    <option value="head-of-sales">Head of Sales</option>
                                                    <option value="service-delivery">Service Delivery</option>
                                                    <option value="service-onboarding">Service Onboarding</option>
                                                    <option value="co-founder">Co-Founder</option>
                                                    <option value="ceo">CEO</option>
                                                </select>
                                            </div>
                                            <div>
                                                <label className="block text-xs text-zinc-500 uppercase tracking-wider font-semibold mb-2">Department</label>
                                                <select
                                                    value={newEmployee.department}
                                                    onChange={(e) => setNewEmployee({ ...newEmployee, department: e.target.value })}
                                                    className="w-full bg-zinc-900/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition-all"
                                                >
                                                    <option value="">Select Department</option>
                                                    <option value="Management">Management</option>
                                                    <option value="Human Resources">Human Resources</option>
                                                    <option value="Operations">Operations</option>
                                                    <option value="Marketing">Marketing</option>
                                                    <option value="Sales">Sales</option>
                                                    <option value="Finance">Finance</option>
                                                    <option value="IT">IT</option>
                                                    <option value="Design">Design</option>
                                                    <option value="Production">Production</option>
                                                </select>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Form Footer */}
                                <div className="flex gap-3 pt-6 pb-6 border-t border-white/5 sticky bottom-0 bg-zinc-950">
                                    <button
                                        type="button"
                                        onClick={() => setShowAddModal(false)}
                                        className="flex-1 px-4 py-3 bg-zinc-900 text-white font-medium rounded-xl hover:bg-zinc-800 transition-colors border border-white/10"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="flex-1 px-4 py-3 bg-white text-black font-bold rounded-xl hover:bg-zinc-200 transition-all shadow-[0_0_15px_rgba(255,255,255,0.3)] hover:shadow-[0_0_25px_rgba(255,255,255,0.5)]"
                                    >
                                        Add Employee
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}

                {/* Restore / Recycle Bin Modal */}
                {showRestoreModal && (
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="bg-zinc-950 border border-white/10 rounded-2xl max-w-2xl w-full shadow-2xl relative flex flex-col overflow-hidden"
                            style={{ maxHeight: '80vh' }}
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="flex items-center justify-between p-6 border-b border-white/10 flex-shrink-0">
                                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                                    <RotateCcw className="w-5 h-5 text-blue-400" />
                                    Restore Employees
                                </h2>
                                <button onClick={() => setShowRestoreModal(false)} className="text-zinc-500 hover:text-white transition-colors">
                                    <X className="w-6 h-6" />
                                </button>
                            </div>

                            <div className="p-6 overflow-y-auto custom-scrollbar flex-1">
                                {deletedEmployees.length === 0 ? (
                                    <div className="text-center py-12 text-zinc-500">
                                        <Trash2 className="w-12 h-12 mx-auto mb-3 opacity-20" />
                                        <p>No recently deleted employees found.</p>
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {deletedEmployees.map(emp => {
                                            const deletedDate = new Date(emp.deletedAt);
                                            const timeLeft = 24 - (new Date() - deletedDate) / (1000 * 60 * 60);
                                            const isExpired = timeLeft <= 0;

                                            return (
                                                <div key={emp._id} className="flex items-center justify-between p-4 bg-zinc-900/50 border border-white/5 rounded-xl hover:border-white/10 transition-colors">
                                                    <div>
                                                        <h3 className="text-white font-medium">{emp.firstName} {emp.lastName}</h3>
                                                        <div className="flex items-center gap-3 mt-1 text-xs text-zinc-400">
                                                            <span className="uppercase tracking-wider">{emp.role}</span>
                                                            <span className="w-1 h-1 bg-zinc-700 rounded-full" />
                                                            <span className={`flex items-center gap-1 ${isExpired ? 'text-red-400' : 'text-blue-400'}`}>
                                                                <Clock className="w-3 h-3" />
                                                                {isExpired ? 'Expired' : `${Math.max(0, Math.floor(timeLeft))}h remaining`}
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <button
                                                        onClick={() => handleRestore(emp._id)}
                                                        disabled={isExpired}
                                                        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${isExpired
                                                            ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
                                                            : 'bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 border border-blue-500/20'
                                                            }`}
                                                    >
                                                        <RotateCcw className="w-3 h-3" />
                                                        Restore
                                                    </button>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    </div>
                )}
            </motion.div>
        </>
    );
};

export default EmployeeRecords;
