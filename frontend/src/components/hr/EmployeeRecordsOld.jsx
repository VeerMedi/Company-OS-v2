import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Users,
    Search,
    Plus,
    Edit,
    Eye,
    Mail,
    Phone,
    Calendar,
    Briefcase,
    MapPin,
    Filter,
    Download,
    UserCheck,
    UserX,
    X,
    FileText,
    Award
} from 'lucide-react';
import api from '../../utils/api';
import toast from 'react-hot-toast';

const EmployeeRecords = () => {
    const navigate = useNavigate();
    const [employees, setEmployees] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterDepartment, setFilterDepartment] = useState('all');
    const [filterRole, setFilterRole] = useState('all');
    const [filterStatus, setFilterStatus] = useState('all');
    const [selectedEmployee, setSelectedEmployee] = useState(null);
    const [showDetailsModal, setShowDetailsModal] = useState(false);
    const [showAddModal, setShowAddModal] = useState(false);

    const [stats, setStats] = useState({
        total: 0,
        active: 0,
        inactive: 0,
        departments: 0
    });

    const [newEmployee, setNewEmployee] = useState({
        firstName: '',
        lastName: '',
        email: '',
        phoneNumber: '',
        role: '',
        department: '',
        joiningDate: new Date().toISOString().split('T')[0],
        salary: '',
        password: '',
        dateOfBirth: '',
        address: '',
        instituteName: '',
        highestQualification: '',
        bankName: '',
        branchName: '',
        accountNumber: '',
        ifscCode: '',
        aadhaarNumber: '',
        panNumber: ''
    });
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        fetchEmployees();

        // Auto-refresh every 60 seconds
        const refreshInterval = setInterval(fetchEmployees, 60000);
        return () => clearInterval(refreshInterval);
    }, []);

    const fetchEmployees = async () => {
        try {
            const response = await api.get('/users/all');

            if (response.data.success) {
                const employeeData = response.data.data;
                setEmployees(employeeData);

                // Calculate statistics
                calculateStats(employeeData);
            }
        } catch (error) {
            console.error('Error fetching employees:', error);
            if (employees.length === 0) {
                toast.error('Failed to load employee data');
            }
        } finally {
            setLoading(false);
        }
    };

    const calculateStats = (data) => {
        // Safety check: ensure data is an array
        if (!Array.isArray(data)) {
            setStats({ total: 0, active: 0, inactive: 0, departments: 0 });
            return;
        }

        const active = data.filter(emp => emp.status === 'active' || !emp.status).length;
        const departments = new Set(data.map(emp => emp.department).filter(Boolean)).size;

        setStats({
            total: data.length,
            active,
            inactive: data.length - active,
            departments
        });
    };

    // Get unique departments and roles for filters - with safety checks
    const departments = Array.isArray(employees) ? [...new Set(employees.map(emp => emp.department).filter(Boolean))] : [];
    const roles = Array.isArray(employees) ? [...new Set(employees.map(emp => emp.role).filter(Boolean))] : [];

    // Filter employees
    const filteredEmployees = (Array.isArray(employees) ? employees : []).filter(emp => {
        const matchesSearch =
            `${emp.firstName} ${emp.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
            emp.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            emp.employeeId?.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesDepartment = filterDepartment === 'all' || emp.department === filterDepartment;
        const matchesRole = filterRole === 'all' || emp.role === filterRole;
        const matchesStatus = filterStatus === 'all' ||
            (filterStatus === 'active' && (emp.status === 'active' || !emp.status)) ||
            (filterStatus === 'inactive' && emp.status === 'inactive');

        return matchesSearch && matchesDepartment && matchesRole && matchesStatus;
    });

    const handleViewDetails = (employee) => {
        setSelectedEmployee(employee);
        setShowDetailsModal(true);
    };

    const getStatusBadge = (status) => {
        const isActive = status === 'active' || !status;
        return (
            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${isActive
                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                : 'bg-zinc-700/50 text-zinc-400 border border-zinc-600/30'
                }`}>
                {isActive ? <UserCheck className="h-3 w-3 mr-1" /> : <UserX className="h-3 w-3 mr-1" />}
                {isActive ? 'Active' : 'Inactive'}
            </span>
        );
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    const handleAddEmployee = async (e) => {
        e.preventDefault();

        // Validation
        if (!newEmployee.firstName || !newEmployee.lastName || !newEmployee.email || !newEmployee.role) {
            toast.error('Please fill in all required fields');
            return;
        }

        try {
            setSubmitting(true);

            // Generate 5-character alphanumeric ID
            const generateShortId = () => {
                const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
                let result = '';
                for (let i = 0; i < 5; i++) {
                    result += chars.charAt(Math.floor(Math.random() * chars.length));
                }
                return result;
            };

            const payload = {
                ...newEmployee,
                employeeId: generateShortId(), // 5-char unique ID
                education: {
                    instituteName: newEmployee.instituteName,
                    highestQualification: newEmployee.highestQualification
                },
                bankDetails: {
                    bankName: newEmployee.bankName,
                    branchName: newEmployee.branchName,
                    accountNumber: newEmployee.accountNumber,
                    ifscCode: newEmployee.ifscCode,
                    accountHolderName: `${newEmployee.firstName} ${newEmployee.lastName}`
                },
                aadhaarDetails: {
                    number: newEmployee.aadhaarNumber
                },
                panDetails: {
                    number: newEmployee.panNumber
                },
                // Ensure dateOfBirth is valid or fallback (though validation might require it)
                dateOfBirth: newEmployee.dateOfBirth || new Date().toISOString()
            };

            // Switch to /users/create if /users/register is not working/found
            // But preserving existing route if user says it works. 
            // NOTE: We found /users/create in backend, not /users/register. 
            // We will TRY /users/create first.

            const response = await api.post('/users/create', payload);

            if (response.data.success) {
                toast.success('Employee added successfully!');
                setShowAddModal(false);
                fetchEmployees(); // Refresh the employee list

                // Reset form
                setNewEmployee({
                    firstName: '',
                    lastName: '',
                    email: '',
                    phoneNumber: '',
                    role: '',
                    department: '',
                    joiningDate: new Date().toISOString().split('T')[0],
                    salary: '',
                    password: '',
                    dateOfBirth: '',
                    address: '',
                    instituteName: '',
                    highestQualification: '',
                    bankName: '',
                    branchName: '',
                    accountNumber: '',
                    ifscCode: '',
                    aadhaarNumber: '',
                    panNumber: ''
                });
            }
        } catch (error) {
            console.error('Error adding employee:', error);
            toast.error(error.response?.data?.message || 'Failed to add employee');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-black p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-white tracking-tight">Employee Records</h1>
                    <p className="text-zinc-400 mt-1">Manage all employee information and records</p>
                </div>
                <button
                    onClick={() => setShowAddModal(true)}
                    className="flex items-center gap-2 px-4 py-2.5 bg-zinc-100 text-zinc-900 rounded-xl hover:bg-white transition-all font-medium"
                >
                    <Plus className="h-5 w-5" />
                    Add Employee
                </button>
            </div>

            {/* Statistics Cards - Updated to CEO Dashboard Style (Dark/Glass) */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-gradient-to-b from-zinc-900 to-zinc-950 rounded-2xl p-6 text-white shadow-xl border border-white/5 relative overflow-hidden group">
                    <div className="absolute inset-0 bg-gradient-to-tr from-blue-600/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    <div className="flex items-center justify-between relative z-10">
                        <div>
                            <p className="text-zinc-400 text-sm font-medium tracking-wide">Total Employees</p>
                            <p className="text-3xl font-bold mt-2 tracking-tight">{stats.total}</p>
                        </div>
                        <div className="h-12 w-12 bg-blue-500/10 border border-blue-500/20 rounded-xl flex items-center justify-center">
                            <Users className="h-6 w-6 text-blue-400" />
                        </div>
                    </div>
                </div>

                <div className="bg-gradient-to-b from-zinc-900 to-zinc-950 rounded-2xl p-6 text-white shadow-xl border border-white/5 relative overflow-hidden group">
                    <div className="absolute inset-0 bg-gradient-to-tr from-emerald-600/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    <div className="flex items-center justify-between relative z-10">
                        <div>
                            <p className="text-zinc-400 text-sm font-medium tracking-wide">Active</p>
                            <p className="text-3xl font-bold mt-2 tracking-tight">{stats.active}</p>
                        </div>
                        <div className="h-12 w-12 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center justify-center">
                            <UserCheck className="h-6 w-6 text-emerald-400" />
                        </div>
                    </div>
                </div>

                <div className="bg-gradient-to-b from-zinc-900 to-zinc-950 rounded-2xl p-6 text-white shadow-xl border border-white/5 relative overflow-hidden group">
                    <div className="absolute inset-0 bg-gradient-to-tr from-zinc-600/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    <div className="flex items-center justify-between relative z-10">
                        <div>
                            <p className="text-zinc-400 text-sm font-medium tracking-wide">Inactive</p>
                            <p className="text-3xl font-bold mt-2 tracking-tight">{stats.inactive}</p>
                        </div>
                        <div className="h-12 w-12 bg-zinc-500/10 border border-zinc-500/20 rounded-xl flex items-center justify-center">
                            <UserX className="h-6 w-6 text-zinc-400" />
                        </div>
                    </div>
                </div>

                <div className="bg-gradient-to-b from-zinc-900 to-zinc-950 rounded-2xl p-6 text-white shadow-xl border border-white/5 relative overflow-hidden group">
                    <div className="absolute inset-0 bg-gradient-to-tr from-purple-600/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    <div className="flex items-center justify-between relative z-10">
                        <div>
                            <p className="text-zinc-400 text-sm font-medium tracking-wide">Departments</p>
                            <p className="text-3xl font-bold mt-2 tracking-tight">{stats.departments}</p>
                        </div>
                        <div className="h-12 w-12 bg-purple-500/10 border border-purple-500/20 rounded-xl flex items-center justify-center">
                            <Briefcase className="h-6 w-6 text-purple-400" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Filters and Search */}
            <div className="bg-zinc-900/50 backdrop-blur-md rounded-2xl p-6 border border-white/5">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    {/* Search */}
                    <div className="md:col-span-1">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-zinc-500" />
                            <input
                                type="text"
                                placeholder="Search employees..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2.5 bg-black/50 border border-zinc-800 rounded-xl focus:outline-none focus:border-zinc-600 text-white placeholder-zinc-600 transition-colors"
                            />
                        </div>
                    </div>

                    {/* Department Filter */}
                    <div>
                        <select
                            value={filterDepartment}
                            onChange={(e) => setFilterDepartment(e.target.value)}
                            className="w-full px-4 py-2.5 bg-black/50 border border-zinc-800 rounded-xl focus:outline-none focus:border-zinc-600 text-zinc-300 transition-colors appearance-none"
                        >
                            <option value="all">All Departments</option>
                            {departments.map(dept => (
                                <option key={dept} value={dept}>{dept}</option>
                            ))}
                        </select>
                    </div>

                    {/* Role Filter */}
                    <div>
                        <select
                            value={filterRole}
                            onChange={(e) => setFilterRole(e.target.value)}
                            className="w-full px-4 py-2.5 bg-black/50 border border-zinc-800 rounded-xl focus:outline-none focus:border-zinc-600 text-zinc-300 transition-colors appearance-none"
                        >
                            <option value="all">All Roles</option>
                            {roles.map(role => (
                                <option key={role} value={role}>{role.replace('-', ' ')}</option>
                            ))}
                        </select>
                    </div>

                    {/* Status Filter */}
                    <div>
                        <select
                            value={filterStatus}
                            onChange={(e) => setFilterStatus(e.target.value)}
                            className="w-full px-4 py-2.5 bg-black/50 border border-zinc-800 rounded-xl focus:outline-none focus:border-zinc-600 text-zinc-300 transition-colors appearance-none"
                        >
                            <option value="all">All Status</option>
                            <option value="active">Active</option>
                            <option value="inactive">Inactive</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Employee Table */}
            {loading ? (
                <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-zinc-500"></div>
                </div>
            ) : filteredEmployees.length === 0 ? (
                <div className="bg-zinc-900/30 backdrop-blur-md rounded-2xl p-12 text-center border border-white/5">
                    <Users className="h-16 w-16 text-zinc-700 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-white mb-2">No employees found</h3>
                    <p className="text-zinc-500">
                        {searchTerm ? 'Try adjusting your search or filters' : 'Add your first employee to get started'}
                    </p>
                </div>
            ) : (
                <div className="bg-zinc-900/30 backdrop-blur-md rounded-2xl border border-white/5 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-zinc-800/50">
                            <thead className="bg-zinc-900/80">
                                <tr>
                                    <th className="px-6 py-4 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">
                                        Employee
                                    </th>
                                    <th className="px-6 py-4 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">
                                        Role
                                    </th>
                                    <th className="px-6 py-4 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">
                                        Department
                                    </th>
                                    <th className="px-6 py-4 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">
                                        Contact
                                    </th>
                                    <th className="px-6 py-4 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">
                                        Status
                                    </th>
                                    <th className="px-6 py-4 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-zinc-800/50">
                                {filteredEmployees.map((employee) => (
                                    <tr key={employee._id} className="hover:bg-zinc-900/50 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center">
                                                <div className="h-10 w-10 rounded-full bg-zinc-800 border border-white/5 flex items-center justify-center text-zinc-300 font-medium text-sm">
                                                    {employee.firstName?.charAt(0)}{employee.lastName?.charAt(0)}
                                                </div>
                                                <div className="ml-4">
                                                    <div className="text-sm font-medium text-white">
                                                        {employee.firstName} {employee.lastName}
                                                    </div>
                                                    <div className="text-xs text-zinc-500 mt-0.5">{employee.employeeId || 'N/A'}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-zinc-400 capitalize">
                                                {employee.role?.replace('-', ' ') || 'N/A'}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-zinc-800 text-zinc-400 border border-white/5">
                                                {employee.department || 'N/A'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex flex-col">
                                                <span className="text-sm text-zinc-300">{employee.email}</span>
                                                {employee.phoneNumber && (
                                                    <span className="text-xs text-zinc-500 mt-0.5">{employee.phoneNumber}</span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {getStatusBadge(employee.status)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={() => handleViewDetails(employee)}
                                                    className="p-2 text-zinc-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors border border-transparent hover:border-white/5"
                                                    title="View Details"
                                                >
                                                    <Eye className="h-4 w-4" />
                                                </button>
                                                <button
                                                    onClick={() => navigate(`/profile?userId=${employee._id}`)}
                                                    className="p-2 text-zinc-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors border border-transparent hover:border-white/5"
                                                    title="View Profile"
                                                >
                                                    <FileText className="h-4 w-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Results Count */}
            {!loading && filteredEmployees.length > 0 && (
                <div className="text-center text-sm text-zinc-600">
                    Showing {filteredEmployees.length} of {employees.length} employees
                </div>
            )}

            {/* Employee Details Modal */}
            {showDetailsModal && selectedEmployee && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-zinc-950 border border-white/10 rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
                        <div className="p-8">
                            <div className="flex items-center justify-between mb-8">
                                <h2 className="text-2xl font-bold text-white tracking-tight">Employee Details</h2>
                                <button
                                    onClick={() => setShowDetailsModal(false)}
                                    className="text-zinc-500 hover:text-white p-2 hover:bg-white/5 rounded-lg transition-colors"
                                >
                                    <X className="h-6 w-6" />
                                </button>
                            </div>

                            <div className="space-y-8">
                                {/* Personal Information */}
                                <div>
                                    <h3 className="text-sm font-medium text-zinc-400 uppercase tracking-wider mb-4">Personal Information</h3>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="bg-zinc-900/50 p-4 rounded-xl border border-white/5">
                                            <label className="text-xs text-zinc-500 uppercase tracking-wider font-semibold">Full Name</label>
                                            <p className="text-zinc-300 font-medium mt-1">
                                                {selectedEmployee.firstName} {selectedEmployee.lastName}
                                            </p>
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
                                            <p className="text-zinc-300 font-medium mt-1">{selectedEmployee.dateOfBirth ? formatDate(selectedEmployee.dateOfBirth) : 'N/A'}</p>
                                        </div>
                                        <div className="bg-zinc-900/50 p-4 rounded-xl border border-white/5">
                                            <label className="text-xs text-zinc-500 uppercase tracking-wider font-semibold">Address</label>
                                            <p className="text-zinc-300 font-medium mt-1 truncate" title={selectedEmployee.address}>
                                                {selectedEmployee.address || 'N/A'}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Employment Information */}
                                <div>
                                    <h3 className="text-sm font-medium text-zinc-400 uppercase tracking-wider mb-4">Employment Information</h3>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="bg-zinc-900/50 p-4 rounded-xl border border-white/5">
                                            <label className="text-xs text-zinc-500 uppercase tracking-wider font-semibold">Role</label>
                                            <p className="text-zinc-300 font-medium capitalize mt-1">
                                                {selectedEmployee.role?.replace('-', ' ') || 'N/A'}
                                            </p>
                                        </div>
                                        <div className="bg-zinc-900/50 p-4 rounded-xl border border-white/5">
                                            <label className="text-xs text-zinc-500 uppercase tracking-wider font-semibold">Designation</label>
                                            <p className="text-white font-medium mt-1">{selectedEmployee.designation || 'N/A'}</p>
                                        </div>
                                        <div className="bg-zinc-900/50 p-4 rounded-xl border border-white/5">
                                            <label className="text-xs text-zinc-500 uppercase tracking-wider font-semibold">Department</label>
                                            <p className="text-zinc-300 font-medium mt-1">{selectedEmployee.department || 'N/A'}</p>
                                        </div>
                                        <div className="bg-zinc-900/50 p-4 rounded-xl border border-white/5">
                                            <label className="text-xs text-zinc-500 uppercase tracking-wider font-semibold">Reporting To</label>
                                            <p className="text-white font-medium mt-1">{selectedEmployee.reportingToName || 'N/A'}</p>
                                        </div>
                                        <div className="bg-zinc-900/50 p-4 rounded-xl border border-white/5">
                                            <label className="text-xs text-zinc-500 uppercase tracking-wider font-semibold">Join Date</label>
                                            <p className="text-zinc-300 font-medium mt-1">{formatDate(selectedEmployee.joiningDate || selectedEmployee.createdAt)}</p>
                                        </div>
                                        <div className="bg-zinc-900/50 p-4 rounded-xl border border-white/5">
                                            <label className="text-xs text-zinc-500 uppercase tracking-wider font-semibold">Status</label>
                                            <div className="mt-1">{getStatusBadge(selectedEmployee.status)}</div>
                                        </div>
                                        {selectedEmployee.specializations && selectedEmployee.specializations.length > 0 && (
                                            <div className="col-span-2 bg-zinc-900/50 p-4 rounded-xl border border-white/5">
                                                <label className="text-xs text-zinc-500 uppercase tracking-wider font-semibold">Specializations</label>
                                                <div className="flex flex-wrap gap-2 mt-2">
                                                    {selectedEmployee.specializations.map((spec, idx) => (
                                                        <span key={idx} className="px-2.5 py-1 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-lg text-xs font-medium">
                                                            {spec}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
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

                            <div className="flex gap-3 mt-8 pt-6 border-t border-white/5">
                                <button
                                    onClick={() => navigate(`/profile?userId=${selectedEmployee._id}`)}
                                    className="flex-1 px-4 py-3 bg-white text-black font-semibold rounded-xl hover:bg-zinc-200 transition-colors"
                                >
                                    View Full Profile
                                </button>
                                <button
                                    onClick={() => setShowDetailsModal(false)}
                                    className="flex-1 px-4 py-3 bg-zinc-900 text-white font-medium rounded-xl hover:bg-zinc-800 transition-colors border border-white/10"
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Add Employee Modal */}
            {showAddModal && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-zinc-950 border border-white/10 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
                        <form onSubmit={handleAddEmployee} className="p-8" autoComplete="off">
                            <div className="flex items-center justify-between mb-8">
                                <h2 className="text-2xl font-bold text-white tracking-tight">Add New Employee</h2>
                                <button
                                    type="button"
                                    onClick={() => setShowAddModal(false)}
                                    className="text-zinc-500 hover:text-white p-2 hover:bg-white/5 rounded-lg transition-colors"
                                >
                                    <X className="h-6 w-6" />
                                </button>
                            </div>

                            <div className="space-y-6">
                                {/* Personal Information */}
                                <div>
                                    <h3 className="text-sm font-medium text-zinc-400 uppercase tracking-wider mb-4">Personal Information</h3>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs text-zinc-500 uppercase tracking-wider font-semibold mb-2">
                                                First Name *
                                            </label>
                                            <input
                                                type="text"
                                                required
                                                value={newEmployee.firstName}
                                                onChange={(e) => setNewEmployee({ ...newEmployee, firstName: e.target.value })}
                                                className="w-full bg-zinc-900/50 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-zinc-600 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition-all"
                                                placeholder="Enter first name"
                                                autoComplete="new-password"
                                                name="random-name-field"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs text-zinc-500 uppercase tracking-wider font-semibold mb-2">
                                                Last Name *
                                            </label>
                                            <input
                                                type="text"
                                                required
                                                value={newEmployee.lastName}
                                                onChange={(e) => setNewEmployee({ ...newEmployee, lastName: e.target.value })}
                                                className="w-full bg-zinc-900/50 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-zinc-600 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition-all"
                                                placeholder="Enter last name"
                                                autoComplete="new-password"
                                                name="random-lastname-field"
                                            />
                                        </div>
                                        <div className="col-span-2">
                                            <label className="block text-xs text-zinc-500 uppercase tracking-wider font-semibold mb-2">
                                                Email *
                                            </label>
                                            <input
                                                type="email"
                                                required
                                                value={newEmployee.email}
                                                onChange={(e) => setNewEmployee({ ...newEmployee, email: e.target.value })}
                                                className="w-full bg-zinc-900/50 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-zinc-600 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition-all"
                                                placeholder="employee@example.com"
                                                autoComplete="new-password"
                                                name="random-email-field"
                                            />
                                        </div>
                                        <div className="col-span-2">
                                            <label className="block text-xs text-zinc-500 uppercase tracking-wider font-semibold mb-2">
                                                Phone Number
                                            </label>
                                            <input
                                                type="tel"
                                                value={newEmployee.phoneNumber}
                                                onChange={(e) => setNewEmployee({ ...newEmployee, phoneNumber: e.target.value })}
                                                className="w-full bg-zinc-900/50 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-zinc-600 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition-all"
                                                placeholder="+91 XXXXX XXXXX"
                                                autoComplete="new-password"
                                                name="random-phone-field"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Employment Information */}
                                <div>
                                    <h3 className="text-sm font-medium text-zinc-400 uppercase tracking-wider mb-4">Employment Information</h3>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs text-zinc-500 uppercase tracking-wider font-semibold mb-2">
                                                Role *
                                            </label>
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
                                            <label className="block text-xs text-zinc-500 uppercase tracking-wider font-semibold mb-2">
                                                Department
                                            </label>
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
                                        <div>
                                            <label className="block text-xs text-zinc-500 uppercase tracking-wider font-semibold mb-2">
                                                Joining Date
                                            </label>
                                            <input
                                                type="date"
                                                value={newEmployee.joiningDate}
                                                onChange={(e) => setNewEmployee({ ...newEmployee, joiningDate: e.target.value })}
                                                className="w-full bg-zinc-900/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition-all"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs text-zinc-500 uppercase tracking-wider font-semibold mb-2">
                                                Salary (₹)
                                            </label>
                                            <input
                                                type="number"
                                                value={newEmployee.salary}
                                                onChange={(e) => setNewEmployee({ ...newEmployee, salary: e.target.value })}
                                                className="w-full bg-zinc-900/50 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-zinc-600 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition-all"
                                                placeholder="50000"
                                                autoComplete="new-password"
                                                name="random-salary-field"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Address Information */}
                                <div>
                                    <h3 className="text-sm font-medium text-zinc-400 uppercase tracking-wider mb-4">Address Information</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs text-zinc-500 uppercase tracking-wider font-semibold mb-2">
                                                Date of Birth *
                                            </label>
                                            <input
                                                type="date"
                                                required
                                                value={newEmployee.dateOfBirth}
                                                onChange={(e) => setNewEmployee({ ...newEmployee, dateOfBirth: e.target.value })}
                                                className="w-full bg-zinc-900/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition-all"
                                            />
                                        </div>
                                        <div className="md:col-span-2">
                                            <label className="block text-xs text-zinc-500 uppercase tracking-wider font-semibold mb-2">
                                                Address
                                            </label>
                                            <textarea
                                                value={newEmployee.address}
                                                onChange={(e) => setNewEmployee({ ...newEmployee, address: e.target.value })}
                                                className="w-full bg-zinc-900/50 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-zinc-600 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition-all h-24 resize-none"
                                                placeholder="Enter full address"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Education */}
                                <div>
                                    <h3 className="text-sm font-medium text-zinc-400 uppercase tracking-wider mb-4">Education</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs text-zinc-500 uppercase tracking-wider font-semibold mb-2">
                                                Institute Name
                                            </label>
                                            <input
                                                type="text"
                                                value={newEmployee.instituteName}
                                                onChange={(e) => setNewEmployee({ ...newEmployee, instituteName: e.target.value })}
                                                className="w-full bg-zinc-900/50 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-zinc-600 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition-all"
                                                placeholder="University/College"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs text-zinc-500 uppercase tracking-wider font-semibold mb-2">
                                                Highest Qualification
                                            </label>
                                            <input
                                                type="text"
                                                value={newEmployee.highestQualification}
                                                onChange={(e) => setNewEmployee({ ...newEmployee, highestQualification: e.target.value })}
                                                className="w-full bg-zinc-900/50 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-zinc-600 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition-all"
                                                placeholder="e.g. B.Tech, MBA"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Bank Details */}
                                <div>
                                    <h3 className="text-sm font-medium text-zinc-400 uppercase tracking-wider mb-4">Bank Details</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs text-zinc-500 uppercase tracking-wider font-semibold mb-2">
                                                Bank Name
                                            </label>
                                            <input
                                                type="text"
                                                value={newEmployee.bankName}
                                                onChange={(e) => setNewEmployee({ ...newEmployee, bankName: e.target.value })}
                                                className="w-full bg-zinc-900/50 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-zinc-600 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition-all"
                                                placeholder="Enter bank name"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs text-zinc-500 uppercase tracking-wider font-semibold mb-2">
                                                Branch Name
                                            </label>
                                            <input
                                                type="text"
                                                value={newEmployee.branchName}
                                                onChange={(e) => setNewEmployee({ ...newEmployee, branchName: e.target.value })}
                                                className="w-full bg-zinc-900/50 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-zinc-600 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition-all"
                                                placeholder="Enter branch name"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs text-zinc-500 uppercase tracking-wider font-semibold mb-2">
                                                Account Number
                                            </label>
                                            <input
                                                type="text"
                                                value={newEmployee.accountNumber}
                                                onChange={(e) => setNewEmployee({ ...newEmployee, accountNumber: e.target.value })}
                                                className="w-full bg-zinc-900/50 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-zinc-600 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition-all"
                                                placeholder="Enter account number"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs text-zinc-500 uppercase tracking-wider font-semibold mb-2">
                                                IFSC Code
                                            </label>
                                            <input
                                                type="text"
                                                value={newEmployee.ifscCode}
                                                onChange={(e) => setNewEmployee({ ...newEmployee, ifscCode: e.target.value })}
                                                className="w-full bg-zinc-900/50 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-zinc-600 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition-all"
                                                placeholder="Enter IFSC code"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Identity Documents */}
                                <div>
                                    <h3 className="text-sm font-medium text-zinc-400 uppercase tracking-wider mb-4">Identity Documents</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs text-zinc-500 uppercase tracking-wider font-semibold mb-2">
                                                Aadhaar Number
                                            </label>
                                            <input
                                                type="text"
                                                value={newEmployee.aadhaarNumber}
                                                onChange={(e) => setNewEmployee({ ...newEmployee, aadhaarNumber: e.target.value })}
                                                className="w-full bg-zinc-900/50 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-zinc-600 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition-all"
                                                placeholder="12-digit Aadhaar number"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs text-zinc-500 uppercase tracking-wider font-semibold mb-2">
                                                PAN Number
                                            </label>
                                            <input
                                                type="text"
                                                value={newEmployee.panNumber}
                                                onChange={(e) => setNewEmployee({ ...newEmployee, panNumber: e.target.value })}
                                                className="w-full bg-zinc-900/50 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-zinc-600 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition-all"
                                                placeholder="10-character PAN number"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Security */}
                                <div>
                                    <h3 className="text-sm font-medium text-zinc-400 uppercase tracking-wider mb-4">Login Credentials</h3>
                                    <div>
                                        <label className="block text-xs text-zinc-500 uppercase tracking-wider font-semibold mb-2">
                                            Temporary Password
                                        </label>
                                        <input
                                            type="password"
                                            value={newEmployee.password}
                                            onChange={(e) => setNewEmployee({ ...newEmployee, password: e.target.value })}
                                            className="w-full bg-zinc-900/50 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-zinc-600 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition-all"
                                            placeholder="Leave empty for default password (Change@123)"
                                            autoComplete="new-password"
                                            name="random-password-field"
                                        />
                                        <p className="mt-2 text-xs text-zinc-600">
                                            Employee will be required to change this password on first login.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="flex gap-3 mt-8 pt-6 border-t border-white/5">
                                <button
                                    type="button"
                                    onClick={() => setShowAddModal(false)}
                                    disabled={submitting}
                                    className="flex-1 px-4 py-3 bg-zinc-900 text-white font-medium rounded-xl hover:bg-zinc-800 transition-colors border border-white/10 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="flex-1 px-4 py-3 bg-white text-black font-semibold rounded-xl hover:bg-zinc-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                >
                                    {submitting ? (
                                        <>
                                            <div className="animate-spin h-4 w-4 border-2 border-black border-t-transparent rounded-full"></div>
                                            Adding...
                                        </>
                                    ) : (
                                        <>
                                            <Plus className="h-5 w-5" />
                                            Add Employee
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default EmployeeRecords;
