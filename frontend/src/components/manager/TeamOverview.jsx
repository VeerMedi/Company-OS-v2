import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Users,
    UserCheck,
    UserX,
    Search,
    Mail,
    Phone,
    Calendar,
    Award,
    TrendingUp,
    TrendingDown,
    CheckCircle,
    Target,
    Activity,
    Clock,
    MessageCircle,
    X,
    MapPin,
    Briefcase,
    GraduationCap,
    CalendarDays,
    BarChart3,
    CheckSquare,
    Percent
} from 'lucide-react';
import api from '../../utils/api';
import toast from 'react-hot-toast';

const TeamOverview = () => {
    const navigate = useNavigate();
    const [teamMembers, setTeamMembers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('all'); // all, active, on-leave, available
    const [selectedMember, setSelectedMember] = useState(null);
    const [memberDetails, setMemberDetails] = useState(null);
    const [detailsLoading, setDetailsLoading] = useState(false);
    const [teamStats, setTeamStats] = useState({
        total: 0,
        active: 0,
        onLeave: 0,
        available: 0
    });

    useEffect(() => {
        fetchTeamData();

        // Auto-refresh every 30 seconds for real-time updates
        const refreshInterval = setInterval(() => {
            fetchTeamData();
        }, 30000); // 30 seconds

        // Cleanup interval on unmount
        return () => clearInterval(refreshInterval);
    }, []);

    // Auto-refresh member details when modal is open
    useEffect(() => {
        if (selectedMember) {
            const memberRefreshInterval = setInterval(() => {
                fetchMemberDetails(selectedMember);
            }, 30000); // Refresh every 30 seconds
            return () => clearInterval(memberRefreshInterval);
        }
    }, [selectedMember]);

    const fetchTeamData = async () => {
        try {
            setLoading(true);
            // Fetch team members with their stats
            const usersResponse = await api.get('/users/individuals');

            // Fetch tasks, attendance and leaves with error handling
            let tasks = [];
            let attendance = [];
            let leaves = [];

            try {
                const tasksResponse = await api.get('/tasks');
                tasks = tasksResponse.data.data || [];
            } catch (err) {
                console.warn('Tasks API not available:', err.message);
            }

            try {
                // Get attendance for last 3 months to have enough data
                const threeMonthsAgo = new Date();
                threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
                
                // Fetch all attendance records without date filter
                const attendanceResponse = await api.get('/attendance/all?limit=10000');
                console.log('Attendance Response:', attendanceResponse.data);
                
                // Extract attendance array from various possible structures
                attendance = attendanceResponse.data.data?.attendance || 
                            attendanceResponse.data.data || 
                            attendanceResponse.data.attendance || 
                            [];
                if (!Array.isArray(attendance)) {
                    attendance = [];
                }
                console.log('Parsed Attendance Array:', attendance.length, 'records');
            } catch (err) {
                console.warn('Attendance API error:', err.message);
                attendance = [];
            }

            try {
                // Fetch all leave requests with high limit
                const leavesResponse = await api.get('/leave/requests?limit=10000&page=1');
                console.log('Leaves Response:', leavesResponse.data);
                
                // Extract leaves array from various possible structures
                leaves = leavesResponse.data.data?.docs || 
                        leavesResponse.data.data?.leaves || 
                        leavesResponse.data.data || 
                        leavesResponse.data.leaves || 
                        leavesResponse.data || 
                        [];
                if (!Array.isArray(leaves)) {
                    leaves = [];
                }
                console.log('Parsed Leaves Array:', leaves.length, 'records');
                if (leaves.length > 0) {
                    console.log('Sample Leave Record:', JSON.stringify(leaves[0], null, 2));
                    console.log('Leave employee field type:', typeof leaves[0].employee);
                    console.log('Leave employee value:', leaves[0].employee);
                    
                    // Check if Krishna's leaves are in the array (debug only)
                    const krishnaLeaves = leaves.filter(l => {
                        const emp = l.employee?._id || l.employee;
                        const empStr = typeof emp === 'string' ? emp : emp?.toString();
                        // Check by name/email only (safe check without undefined vars)
                        const matchesName = l.employee?.firstName === 'Krishna' && l.employee?.lastName === 'Jaiswal';
                        const matchesEmail = l.employee?.email === 'krishna.mehra@hustle.com';
                        return matchesName || matchesEmail;
                    });
                    console.log('Krishna Jaiswal leaves found (by name/email):', krishnaLeaves.length);
                    if (krishnaLeaves.length > 0) {
                        console.log('Krishna leaves details:', krishnaLeaves.map(l => ({
                            id: l._id,
                            status: l.status,
                            employee: l.employee,
                            employeeId: l.employee?._id || l.employee,
                            totalDays: l.totalDays
                        })));
                    }
                }
            } catch (err) {
                console.warn('Leave API error:', err.message);
                leaves = [];
            }

            if (usersResponse.data.success) {
                const members = usersResponse.data.data;

                console.log('Total Members:', members.length);
                console.log('Total Attendance Records:', attendance.length);
                console.log('Total Leave Records:', leaves.length);
                
                // Debug: Print all leave employee IDs
                console.log('=== ALL LEAVE EMPLOYEE IDs ===');
                leaves.forEach((l, idx) => {
                    const empId = l.employee?._id || l.employee || l.employeeId;
                    console.log(`Leave ${idx + 1}: employee=${empId}, status=${l.status}, days=${l.totalDays}`);
                });
                console.log('=== END LEAVE IDs ===');

                // Enhance members with stats
                const enhancedMembers = members.map(member => {
                    const memberId = member._id.toString();
                    console.log(`\n>>> Processing: ${member.firstName} ${member.lastName}, ID: ${memberId}`);
                    
                    const memberTasks = Array.isArray(tasks) ? tasks.filter(t => {
                        const assignedId = t.assignedTo?._id?.toString() || t.assignedTo?.toString();
                        return assignedId === memberId;
                    }) : [];
                    
                    const completedTasks = memberTasks.filter(t => t.status === 'completed');
                    
                    const memberAttendance = Array.isArray(attendance) ? attendance.filter(a => {
                        const empId = a.employeeId?.toString() || a.employee?._id?.toString() || a.employee?.toString();
                        return empId === memberId;
                    }) : [];
                    
                    const memberLeaves = Array.isArray(leaves) ? leaves.filter(l => {
                        // Handle ALL possible employee field structures
                        let leaveEmpId = null;
                        
                        // Case 1: employee is a populated object with _id
                        if (l.employee && typeof l.employee === 'object' && l.employee._id) {
                            leaveEmpId = typeof l.employee._id === 'string' ? l.employee._id : l.employee._id.toString();
                            
                            // FALLBACK: If ID doesn't match but email matches, accept it (data corruption workaround)
                            if (leaveEmpId !== memberId && l.employee.email === member.email) {
                                console.log(`⚠️ ID mismatch but EMAIL matched! LeaveID: ${l._id}, Expected: ${memberId}, Got: ${leaveEmpId}, Email: ${l.employee.email}`);
                                return true;
                            }
                        }
                        // Case 2: employee is directly a string ID (not populated)
                        else if (typeof l.employee === 'string') {
                            leaveEmpId = l.employee;
                        }
                        // Case 3: employeeId field exists (alternative field name)
                        else if (l.employeeId) {
                            if (typeof l.employeeId === 'object' && l.employeeId._id) {
                                leaveEmpId = typeof l.employeeId._id === 'string' ? l.employeeId._id : l.employeeId._id.toString();
                            } else {
                                leaveEmpId = typeof l.employeeId === 'string' ? l.employeeId : l.employeeId?.toString();
                            }
                        }
                        // Case 4: Check if employee object has email matching member email
                        else if (l.employee && l.employee.email === member.email) {
                            console.log(`✓ Email-based match for leave ${l._id}`);
                            return true;
                        }
                        
                        if (!leaveEmpId) {
                            console.log(`⚠️ Could not extract employee ID from leave:`, l);
                            return false;
                        }
                        
                        const matches = leaveEmpId === memberId;
                        if (matches) {
                            console.log(`✓ Leave MATCHED for ${member.firstName}: leaveEmpId=${leaveEmpId}, memberId=${memberId}, Status=${l.status}, Days=${l.totalDays}`);
                        }
                        return matches;
                    }) : [];

                    console.log(`Result: ${member.firstName} ${member.lastName} - Attendance: ${memberAttendance.length}, Total Leaves: ${memberLeaves.length}`);

                    const currentMonth = new Date().getMonth();
                    const currentYear = new Date().getFullYear();
                    const monthlyAttendance = memberAttendance.filter(a => {
                        const date = new Date(a.date);
                        return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
                    });

                    const presentDays = monthlyAttendance.filter(a => a.status === 'present').length;
                    const totalAvailablePoints = memberTasks.reduce((sum, task) => sum + (task.points || 0), 0);
                    const earnedPoints = completedTasks.reduce((sum, task) => sum + (task.points || 0), 0);

                    // Calculate leave stats
                    const totalLeaves = memberLeaves.length;
                    const approvedLeaves = memberLeaves.filter(l => l.status === 'approved').length;

                    // Check if member is currently on leave
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);

                    const isOnLeaveToday = memberLeaves.some(l => {
                        if (l.status !== 'approved') return false;
                        const startDate = new Date(l.startDate);
                        const endDate = new Date(l.endDate);
                        startDate.setHours(0, 0, 0, 0);
                        endDate.setHours(0, 0, 0, 0);
                        return today >= startDate && today <= endDate;
                    });

                    return {
                        ...member,
                        totalTasks: memberTasks.length,
                        activeTasks: memberTasks.filter(t => ['in-progress', 'pending'].includes(t.status)).length,
                        completedTasks: completedTasks.length,
                        totalAvailablePoints: totalAvailablePoints,
                        earnedPoints: earnedPoints,
                        totalPoints: totalAvailablePoints, // For backward compatibility
                        attendanceRate: monthlyAttendance.length > 0 ? Math.round((presentDays / monthlyAttendance.length) * 100) : 0,
                        presentDays: presentDays,
                        totalDays: monthlyAttendance.length,
                        totalLeaves: totalLeaves,
                        approvedLeaves: approvedLeaves,
                        pendingLeaves: memberLeaves.filter(l => l.status === 'pending').length,
                        isOnLeaveToday: isOnLeaveToday
                    };
                });

                setTeamMembers(enhancedMembers);
                calculateStats(enhancedMembers);
            }
        } catch (error) {
            console.error('Error fetching team data:', error);
            toast.error('Failed to load team data');
        } finally {
            setLoading(false);
        }
    };

    const fetchMemberDetails = async (memberId) => {
        try {
            setDetailsLoading(true);
            const userResponse = await api.get(`/users/${memberId}`);

            let allTasks = [];
            let allAttendance = [];
            let allLeaves = [];

            // Fetch tasks with error handling
            try {
                const tasksResponse = await api.get('/tasks');
                allTasks = Array.isArray(tasksResponse.data.data) ? tasksResponse.data.data : [];
            } catch (err) {
                console.warn('Tasks API not available:', err.message);
                allTasks = [];
            }

            // Fetch attendance with error handling
            try {
                const attendanceResponse = await api.get('/attendance/all?limit=10000');
                console.log('Member Details - Attendance Response:', attendanceResponse.data);
                allAttendance = attendanceResponse.data.data?.attendance || 
                               attendanceResponse.data.data || 
                               attendanceResponse.data.attendance || 
                               [];
                if (!Array.isArray(allAttendance)) {
                    allAttendance = [];
                }
            } catch (err) {
                console.warn('Attendance API error:', err.message);
                allAttendance = [];
            }

            // Fetch leaves with error handling
            try {
                const leavesResponse = await api.get('/leave/requests?limit=10000');
                console.log('Member Details - Leaves Response:', leavesResponse.data);
                allLeaves = leavesResponse.data.data?.docs || 
                           leavesResponse.data.data?.leaves || 
                           leavesResponse.data.data || 
                           leavesResponse.data.leaves || 
                           leavesResponse.data || 
                           [];
                if (!Array.isArray(allLeaves)) {
                    allLeaves = [];
                }
            } catch (err) {
                console.warn('Leave API error:', err.message);
                allLeaves = [];
            }

            const memberData = userResponse.data.data?.user || userResponse.data.user || userResponse.data.data || userResponse.data;

            console.log('Member Data:', memberData);
            console.log('All Tasks:', allTasks.length);
            console.log('All Attendance:', allAttendance.length);
            console.log('All Leaves:', allLeaves.length);

            // Ensure arrays are valid
            allTasks = Array.isArray(allTasks) ? allTasks : [];
            allAttendance = Array.isArray(allAttendance) ? allAttendance : [];
            allLeaves = Array.isArray(allLeaves) ? allLeaves : [];

            const memberIdStr = memberId.toString();

            // Filter member-specific data with proper ID matching
            const memberTasks = allTasks.filter(t => {
                const assignedId = t.assignedTo?._id?.toString() || t.assignedTo?.toString();
                return assignedId === memberIdStr;
            });
            
            const memberAttendance = allAttendance.filter(a => {
                const empId = a.employeeId?.toString() || a.employee?._id?.toString() || a.employee?.toString();
                return empId === memberIdStr;
            });
            
            const memberLeaves = allLeaves.filter(l => {
                // Handle ALL possible employee field structures
                let leaveEmpId = null;
                
                // Case 1: employee is a populated object with _id
                if (l.employee && typeof l.employee === 'object' && l.employee._id) {
                    leaveEmpId = typeof l.employee._id === 'string' ? l.employee._id : l.employee._id.toString();
                }
                // Case 2: employee is directly a string ID (not populated)
                else if (typeof l.employee === 'string') {
                    leaveEmpId = l.employee;
                }
                // Case 3: employeeId field exists (alternative field name)
                else if (l.employeeId) {
                    if (typeof l.employeeId === 'object' && l.employeeId._id) {
                        leaveEmpId = typeof l.employeeId._id === 'string' ? l.employeeId._id : l.employeeId._id.toString();
                    } else {
                        leaveEmpId = typeof l.employeeId === 'string' ? l.employeeId : l.employeeId?.toString();
                    }
                }
                // Case 4: Check if employee object has email matching
                else if (l.employee && l.employee.email === memberData.email) {
                    return true;
                }
                
                if (!leaveEmpId) {
                    return false;
                }
                
                return leaveEmpId === memberIdStr;
            });

            console.log('Filtered - Tasks:', memberTasks.length, 'Attendance:', memberAttendance.length, 'Leaves:', memberLeaves.length);

            // Get current month and year
            const currentMonth = new Date().getMonth();
            const currentYear = new Date().getFullYear();

            // Filter attendance for current month only
            const currentMonthAttendance = memberAttendance.filter(a => {
                const date = new Date(a.date);
                return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
            });

            // Calculate detailed stats
            const completedTasks = memberTasks.filter(t => t.status === 'completed');
            const totalAvailablePoints = memberTasks.reduce((sum, task) => sum + (task.points || 0), 0);
            const earnedPoints = completedTasks.reduce((sum, task) => sum + (task.points || 0), 0);
            const presentDays = currentMonthAttendance.filter(a => a.status === 'present').length;
            const attendanceRate = currentMonthAttendance.length > 0 ? Math.round((presentDays / currentMonthAttendance.length) * 100) : 0;

            setMemberDetails({
                ...memberData,
                tasks: memberTasks,
                attendance: currentMonthAttendance,
                leaves: memberLeaves,
                stats: {
                    totalTasks: memberTasks.length,
                    completedTasks: completedTasks.length,
                    activeTasks: memberTasks.filter(t => ['in-progress', 'pending'].includes(t.status)).length,
                    totalAvailablePoints: totalAvailablePoints,
                    earnedPoints: earnedPoints,
                    presentDays: presentDays,
                    totalAttendanceDays: currentMonthAttendance.length,
                    attendanceRate: attendanceRate,
                    approvedLeaves: memberLeaves.filter(l => l.status === 'approved').length,
                    pendingLeaves: memberLeaves.filter(l => l.status === 'pending').length,
                    totalLeaves: memberLeaves.length
                }
            });
        } catch (error) {
            console.error('Error fetching member details:', error);
            toast.error('Failed to load member details');
        } finally {
            setDetailsLoading(false);
        }
    };

    const calculateStats = (members) => {
        let activeCount = 0;
        let onLeaveCount = 0;

        members.forEach(member => {
            if (member.isActive !== false) {
                activeCount++;
                if (member.isOnLeaveToday) {
                    onLeaveCount++;
                }
            }
        });

        const availableCount = activeCount - onLeaveCount;
        const capacity = activeCount > 0 ? Math.round((availableCount / activeCount) * 100) : 0;

        setTeamStats({
            total: members.length,
            active: activeCount,
            onLeave: onLeaveCount,
            available: availableCount,
            capacity: capacity
        });
    };

    const getStatusBadge = (member) => {
        // This is a placeholder - you can enhance with actual status from backend
        const isActive = member.isActive !== false;

        if (isActive) {
            return (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    <Activity className="h-3 w-3 mr-1" />
                    Active
                </span>
            );
        }

        return (
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                <Clock className="h-3 w-3 mr-1" />
                Offline
            </span>
        );
    };

    const filteredMembers = teamMembers.filter(member => {
        const matchesSearch =
            `${member.firstName} ${member.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
            member.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
            member.employeeId?.toLowerCase().includes(searchTerm.toLowerCase());

        if (filterStatus === 'all') return matchesSearch;
        if (filterStatus === 'active') return matchesSearch && member.isActive !== false;
        if (filterStatus === 'available') return matchesSearch && member.isActive !== false;

        return matchesSearch;
    });

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold text-gray-900">Team Overview</h1>
                <p className="text-gray-600 mt-1">Manage and monitor your team members' performance and availability</p>
            </div>

            {/* Statistics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg p-6 text-white shadow-lg">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-blue-100 text-sm font-medium">Total Team Members</p>
                            <p className="text-3xl font-bold mt-2">{teamStats.total}</p>
                        </div>
                        <div className="h-12 w-12 bg-white bg-opacity-20 rounded-lg flex items-center justify-center">
                            <Users className="h-6 w-6" />
                        </div>
                    </div>
                </div>

                <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg p-6 text-white shadow-lg">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-green-100 text-sm font-medium">Active Members</p>
                            <p className="text-3xl font-bold mt-2">{teamStats.active}</p>
                        </div>
                        <div className="h-12 w-12 bg-white bg-opacity-20 rounded-lg flex items-center justify-center">
                            <UserCheck className="h-6 w-6" />
                        </div>
                    </div>
                </div>

                <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg p-6 text-white shadow-lg">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-orange-100 text-sm font-medium">On Leave</p>
                            <p className="text-3xl font-bold mt-2">{teamStats.onLeave}</p>
                        </div>
                        <div className="h-12 w-12 bg-white bg-opacity-20 rounded-lg flex items-center justify-center">
                            <UserX className="h-6 w-6" />
                        </div>
                    </div>
                </div>

                <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg p-6 text-white shadow-lg">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-purple-100 text-sm font-medium">Capacity</p>
                            <p className="text-3xl font-bold mt-2">{Math.round((teamStats.available / teamStats.total) * 100) || 0}%</p>
                        </div>
                        <div className="h-12 w-12 bg-white bg-opacity-20 rounded-lg flex items-center justify-center">
                            <Activity className="h-6 w-6" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Filters and Search */}
            <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div className="flex-1 max-w-md">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search by name, email, or employee ID..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                    </div>

                    <div className="flex gap-2">
                        <button
                            onClick={() => setFilterStatus('all')}
                            className={`px-4 py-2 rounded-lg font-medium transition-colors ${filterStatus === 'all'
                                ? 'bg-blue-600 text-white'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }`}
                        >
                            All
                        </button>
                        <button
                            onClick={() => setFilterStatus('active')}
                            className={`px-4 py-2 rounded-lg font-medium transition-colors ${filterStatus === 'active'
                                ? 'bg-green-600 text-white'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }`}
                        >
                            Active
                        </button>
                        <button
                            onClick={() => setFilterStatus('available')}
                            className={`px-4 py-2 rounded-lg font-medium transition-colors ${filterStatus === 'available'
                                ? 'bg-purple-600 text-white'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }`}
                        >
                            Available
                        </button>
                    </div>
                </div>
            </div>

            {/* Team Members Grid */}
            {loading ? (
                <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                </div>
            ) : filteredMembers.length === 0 ? (
                <div className="bg-white rounded-lg p-12 text-center shadow-sm border border-gray-200">
                    <Users className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No team members found</h3>
                    <p className="text-gray-600">
                        {searchTerm ? 'Try adjusting your search terms' : 'Team members will appear here once assigned'}
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredMembers.map((member) => (
                        <div
                            key={member._id}
                            className="bg-white rounded-lg p-6 shadow-sm border border-gray-200 hover:shadow-md transition-shadow"
                        >
                            {/* Member Header */}
                            <div className="flex items-start justify-between mb-4">
                                <div className="flex items-center space-x-3">
                                    <div className="h-12 w-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold text-lg">
                                        {member.firstName?.charAt(0)}{member.lastName?.charAt(0)}
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-gray-900">
                                            {member.firstName} {member.lastName}
                                        </h3>
                                        <p className="text-sm text-gray-500 capitalize">
                                            {member.role?.replace('-', ' ')}
                                        </p>
                                    </div>
                                </div>
                                {getStatusBadge(member)}
                            </div>

                            {/* Member Details */}
                            <div className="space-y-2 mb-4">
                                <div className="flex items-center text-sm text-gray-600">
                                    <Mail className="h-4 w-4 mr-2 text-gray-400" />
                                    <span className="truncate">{member.email}</span>
                                </div>
                                {member.phoneNumber && (
                                    <div className="flex items-center text-sm text-gray-600">
                                        <Phone className="h-4 w-4 mr-2 text-gray-400" />
                                        <span>{member.phoneNumber}</span>
                                    </div>
                                )}
                                <div className="flex items-center text-sm text-gray-600">
                                    <Award className="h-4 w-4 mr-2 text-gray-400" />
                                    <span>Employee ID: {member.employeeId || 'N/A'}</span>
                                </div>
                            </div>

                            {/* Performance Indicators */}
                            <div className="grid grid-cols-4 gap-2 mb-4 pt-4 border-t border-gray-200">
                                <div className="text-center">
                                    <p className="text-xs text-gray-500 mb-1">Tasks</p>
                                    <p className="text-lg font-bold text-gray-900">{member.totalTasks || 0}</p>
                                    <p className="text-xs text-gray-400">{member.completedTasks || 0} done</p>
                                </div>
                                <div className="text-center">
                                    <p className="text-xs text-gray-500 mb-1">Points</p>
                                    <p className="text-lg font-bold text-green-600">{member.totalAvailablePoints || 0}</p>
                                    <p className="text-xs text-gray-400">{member.earnedPoints || 0} earned</p>
                                </div>
                                <div className="text-center">
                                    <p className="text-xs text-gray-500 mb-1">Attendance</p>
                                    <p className="text-lg font-bold text-blue-600">{member.attendanceRate || 0}%</p>
                                    <p className="text-xs text-gray-400">{member.presentDays || 0}/{member.totalDays || 0}</p>
                                </div>
                                <div className="text-center">
                                    <p className="text-xs text-gray-500 mb-1">Leaves</p>
                                    <div className="flex flex-col gap-1">
                                        <div className="flex justify-between text-xs px-2">
                                            <span className="text-gray-500">Applied:</span>
                                            <span className="font-bold text-gray-900">{member.totalLeaves || 0}</span>
                                        </div>
                                        <div className="flex justify-between text-xs px-2">
                                            <span className="text-green-600">Approved:</span>
                                            <span className="font-bold text-green-700">{member.approvedLeaves || 0}</span>
                                        </div>
                                        {member.pendingLeaves > 0 && (
                                            <div className="text-xs text-amber-600 font-bold bg-amber-50 px-2 py-1 rounded mt-1 text-center">
                                                {member.pendingLeaves} pending
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Quick Actions */}
                            <div className="flex gap-2 pt-4 border-t border-gray-200">
                                <button
                                    onClick={() => {
                                        setSelectedMember(member);
                                        fetchMemberDetails(member._id);
                                    }}
                                    className="flex-1 px-3 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors text-sm font-medium"
                                >
                                    View Profile
                                </button>
                                <button
                                    className="px-3 py-2 bg-gray-50 text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
                                    title="Message"
                                >
                                    <MessageCircle className="h-4 w-4" />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Results Summary */}
            {!loading && filteredMembers.length > 0 && (
                <div className="text-center text-sm text-gray-600">
                    Showing {filteredMembers.length} of {teamMembers.length} team members
                </div>
            )}

            {/* Detailed Profile Modal */}
            {selectedMember && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[100] p-4" onClick={() => setSelectedMember(null)}>
                    <div className="bg-white rounded-2xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden" onClick={(e) => e.stopPropagation()}>
                        {/* Modal Header */}
                        <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-4 flex items-center justify-between text-white">
                            <div className="flex items-center gap-4">
                                <div className="h-16 w-16 rounded-full bg-white/20 flex items-center justify-center text-2xl font-bold">
                                    {selectedMember.firstName?.charAt(0)}{selectedMember.lastName?.charAt(0)}
                                </div>
                                <div>
                                    <h2 className="text-2xl font-bold">{selectedMember.firstName} {selectedMember.lastName}</h2>
                                    <p className="text-blue-100 capitalize">{selectedMember.role?.replace('-', ' ')}</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setSelectedMember(null)}
                                className="p-2 hover:bg-white/10 rounded-full transition-colors"
                            >
                                <X className="h-6 w-6" />
                            </button>
                        </div>

                        {/* Modal Content */}
                        <div className="p-6 overflow-y-auto max-h-[calc(90vh-100px)]">
                            {detailsLoading ? (
                                <div className="flex items-center justify-center py-20">
                                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                                </div>
                            ) : memberDetails ? (
                                <div className="space-y-6">
                                    {/* Personal Information */}
                                    <div className="bg-gray-50 rounded-xl p-6">
                                        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                                            <UserCheck className="h-5 w-5 text-blue-600" />
                                            Personal Information
                                        </h3>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <p className="text-sm text-gray-500">Full Name</p>
                                                <p className="font-medium text-gray-900">{memberDetails.firstName} {memberDetails.lastName}</p>
                                            </div>
                                            <div>
                                                <p className="text-sm text-gray-500">Employee ID</p>
                                                <p className="font-medium text-gray-900">{memberDetails.employeeId || 'N/A'}</p>
                                            </div>
                                            <div>
                                                <p className="text-sm text-gray-500">Email</p>
                                                <p className="font-medium text-gray-900">{memberDetails.email}</p>
                                            </div>
                                            <div>
                                                <p className="text-sm text-gray-500">Phone</p>
                                                <p className="font-medium text-gray-900">{memberDetails.phoneNumber || 'N/A'}</p>
                                            </div>
                                            {memberDetails.dateOfBirth && (
                                                <div>
                                                    <p className="text-sm text-gray-500">Date of Birth</p>
                                                    <p className="font-medium text-gray-900">{new Date(memberDetails.dateOfBirth).toLocaleDateString()}</p>
                                                </div>
                                            )}
                                            {memberDetails.joiningDate && (
                                                <div>
                                                    <p className="text-sm text-gray-500">Joining Date</p>
                                                    <p className="font-medium text-gray-900">{new Date(memberDetails.joiningDate).toLocaleDateString()}</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Performance Stats */}
                                    <div className="grid grid-cols-4 gap-4">
                                        <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
                                            <div className="flex items-center justify-between mb-2">
                                                <CheckSquare className="h-5 w-5 text-blue-600" />
                                                <span className="text-xs text-blue-600 font-medium">Tasks</span>
                                            </div>
                                            <p className="text-3xl font-bold text-blue-900">{memberDetails.stats.totalTasks}</p>
                                            <p className="text-xs text-blue-600 mt-1">{memberDetails.stats.completedTasks} completed</p>
                                        </div>
                                        <div className="bg-green-50 rounded-xl p-4 border border-green-200">
                                            <div className="flex items-center justify-between mb-2">
                                                <Award className="h-5 w-5 text-green-600" />
                                                <span className="text-xs text-green-600 font-medium">Points</span>
                                            </div>
                                            <p className="text-3xl font-bold text-green-900">{memberDetails.stats.totalAvailablePoints}</p>
                                            <p className="text-xs text-green-600 mt-1">{memberDetails.stats.earnedPoints} earned</p>
                                        </div>
                                        <div className="bg-purple-50 rounded-xl p-4 border border-purple-200">
                                            <div className="flex items-center justify-between mb-2">
                                                <CalendarDays className="h-5 w-5 text-purple-600" />
                                                <span className="text-xs text-purple-600 font-medium">Attendance</span>
                                            </div>
                                            <p className="text-3xl font-bold text-purple-900">{memberDetails.stats.attendanceRate}%</p>
                                            <p className="text-xs text-purple-600 mt-1">{memberDetails.stats.presentDays}/{memberDetails.stats.totalAttendanceDays} days (this month)</p>
                                        </div>
                                        <div className="bg-orange-50 rounded-xl p-4 border border-orange-200">
                                            <div className="flex items-center justify-between mb-2">
                                                <Calendar className="h-5 w-5 text-orange-600" />
                                                <span className="text-xs text-orange-600 font-medium">Leaves</span>
                                            </div>
                                            <div className="flex justify-between items-end">
                                                <div>
                                                    <p className="text-xs text-orange-600 font-medium">Total Applied</p>
                                                    <p className="text-2xl font-bold text-orange-900">{memberDetails.stats.totalLeaves}</p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-xs text-green-600 font-medium">Approved</p>
                                                    <p className="text-2xl font-bold text-green-700">{memberDetails.stats.approvedLeaves}</p>
                                                </div>
                                            </div>
                                            {memberDetails.stats.pendingLeaves > 0 && (
                                                <p className="text-xs text-amber-600 font-bold mt-2 pt-2 border-t border-orange-200">
                                                    {memberDetails.stats.pendingLeaves} pending approval
                                                </p>
                                            )}
                                        </div>
                                    </div>

                                    {/* Recent Tasks */}
                                    <div className="bg-gray-50 rounded-xl p-6">
                                        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                                            <Target className="h-5 w-5 text-blue-600" />
                                            Recent Tasks
                                        </h3>
                                        <div className="space-y-3 max-h-60 overflow-y-auto">
                                            {memberDetails.tasks.slice(0, 10).map((task) => (
                                                <div key={task._id} className="bg-white p-3 rounded-lg border border-gray-200">
                                                    <div className="flex items-start justify-between">
                                                        <div className="flex-1">
                                                            <p className="font-medium text-gray-900 text-sm">{task.description || task.title}</p>
                                                            <p className="text-xs text-gray-500 mt-1">
                                                                Deadline: {task.deadline ? new Date(task.deadline).toLocaleDateString() : 'N/A'}
                                                            </p>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            {task.points && (
                                                                <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-medium">
                                                                    {task.points} pts
                                                                </span>
                                                            )}
                                                            <span className={`px-2 py-1 rounded text-xs font-medium ${task.status === 'completed' ? 'bg-green-100 text-green-700' :
                                                                task.status === 'in-progress' ? 'bg-blue-100 text-blue-700' :
                                                                    'bg-gray-100 text-gray-700'
                                                                }`}>
                                                                {task.status}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                            {memberDetails.tasks.length === 0 && (
                                                <p className="text-center text-gray-500 py-8">No tasks assigned yet</p>
                                            )}
                                        </div>
                                    </div>

                                    {/* Attendance History */}
                                    <div className="bg-gray-50 rounded-xl p-6">
                                        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                                            <CalendarDays className="h-5 w-5 text-blue-600" />
                                            Attendance History (Recent 10)
                                        </h3>
                                        <div className="grid grid-cols-5 gap-2">
                                            {memberDetails.attendance.slice(-10).reverse().map((att, idx) => (
                                                <div key={idx} className={`p-2 rounded-lg text-center ${att.status === 'present' ? 'bg-green-100 text-green-700' :
                                                    att.status === 'absent' ? 'bg-red-100 text-red-700' :
                                                        'bg-yellow-100 text-yellow-700'
                                                    }`}>
                                                    <p className="text-xs font-medium">{new Date(att.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</p>
                                                    <p className="text-xs capitalize mt-1">{att.status}</p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="text-center py-12">
                                    <p className="text-gray-500">Failed to load member details</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TeamOverview;
