import React, { useState, useEffect } from 'react';
import {
    Users, UserCheck, UserX, Clock, AlertTriangle, TrendingUp, Calendar,
    ChevronLeft, ChevronRight, Zap, Target, Award
} from 'lucide-react';
import api from '../utils/api';
import { showToast } from '../utils/toast';
import {
    AreaChart, Area, BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
    XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';

const CoFounderAttendanceOverview = () => {
    const [selectedDate, setSelectedDate] = useState(() => {
        const today = new Date();
        return today.toISOString().split('T')[0];
    });
    const [attendanceData, setAttendanceData] = useState(null);
    const [weeklyData, setWeeklyData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [hoveredData, setHoveredData] = useState(null);

    useEffect(() => {
        fetchAttendanceOverview();
        fetchWeeklyTrend();
    }, [selectedDate]);

    const fetchAttendanceOverview = async () => {
        try {
            setLoading(true);
            const response = await api.get('/attendance/all', {
                params: { date: selectedDate }
            });

            if (response.data.success) {
                const { attendance, summary } = response.data.data;

                // Calculate additional metrics
                const totalEmployees = summary.totalEmployees || 0;
                const present = summary.present || 0;
                const absent = summary.absent || 0;
                const late = summary.late || 0;

                // Get employee details for hover
                const presentEmployees = attendance.filter(a => a.status === 'present').map(a => a.employee);
                const absentEmployees = attendance.filter(a => a.status === 'absent').map(a => a.employee);
                const lateEmployees = attendance.filter(a => a.status === 'late').map(a => a.employee);

                // Calculate working hours
                const totalWorkingHours = attendance.reduce((sum, a) => sum + (a.totalWorkingHours || 0), 0);
                const totalOvertimeHours = attendance.reduce((sum, a) => sum + (a.overtime?.hours || 0), 0);

                // Calculate punctuality (employees who came on time)
                const onTimeEmployees = attendance.filter(a =>
                    a.status === 'present' && !a.isLate
                ).length;

                setAttendanceData({
                    totalEmployees,
                    present,
                    absent,
                    late,
                    onLeave: summary.onLeave || 0,
                    attendancePercentage: totalEmployees > 0 ? ((present / totalEmployees) * 100).toFixed(1) : 0,
                    totalWorkingHours: Math.round(totalWorkingHours / 60), // Convert to hours
                    overtimeHours: Math.round(totalOvertimeHours / 60),
                    punctuality: totalEmployees > 0 ? ((onTimeEmployees / totalEmployees) * 100).toFixed(1) : 0,
                    presentEmployees,
                    absentEmployees,
                    lateEmployees,
                    onTimeEmployees
                });
            }
        } catch (error) {
            console.error('Error fetching attendance overview:', error);
            showToast.error('Failed to load attendance data');
        } finally {
            setLoading(false);
        }
    };

    const fetchWeeklyTrend = async () => {
        try {
            // Generate last 7 days data
            const days = [];
            for (let i = 6; i >= 0; i--) {
                const date = new Date();
                date.setDate(date.getDate() - i);
                days.push(date.toISOString().split('T')[0]);
            }

            const weeklyDataPromises = days.map(async (date) => {
                const response = await api.get('/attendance/all', { params: { date } });
                if (response.data.success) {
                    const { summary } = response.data.data;
                    const dayName = new Date(date).toLocaleDateString('en-US', { weekday: 'short' });
                    return {
                        date,
                        day: dayName,
                        present: summary.present || 0,
                        absent: summary.absent || 0,
                        late: summary.late || 0,
                        total: summary.totalEmployees || 0,
                        percentage: summary.totalEmployees > 0
                            ? ((summary.present / summary.totalEmployees) * 100).toFixed(1)
                            : 0
                    };
                }
                return null;
            });

            const weeklyResults = await Promise.all(weeklyDataPromises);
            setWeeklyData(weeklyResults.filter(d => d !== null));
        } catch (error) {
            console.error('Error fetching weekly trend:', error);
        }
    };

    const changeDate = (days) => {
        const currentDate = new Date(selectedDate);
        currentDate.setDate(currentDate.getDate() + days);
        setSelectedDate(currentDate.toISOString().split('T')[0]);
    };

    // Custom tooltip for charts
    const CustomTooltip = ({ active, payload, employees, type }) => {
        if (active && payload && payload.length) {
            const data = payload[0];
            return (
                <div className="bg-white/95 backdrop-blur-sm p-4 rounded-xl shadow-xl border border-gray-200">
                    <p className="font-semibold text-gray-900 mb-2">{data.name || type}</p>
                    <p className="text-2xl font-bold text-blue-600 mb-2">{data.value}</p>
                    {employees && employees.length > 0 && (
                        <div className="mt-2 max-h-48 overflow-y-auto">
                            <p className="text-xs font-medium text-gray-600 mb-1">Employees:</p>
                            <div className="space-y-1">
                                {employees.map((emp, idx) => (
                                    <div key={idx} className="text-xs text-gray-700 bg-gray-50 px-2 py-1 rounded">
                                        • {emp.firstName} {emp.lastName} ({emp.employeeId})
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            );
        }
        return null;
    };

    // Pie chart data
    const pieData = attendanceData ? [
        { name: 'Present', value: attendanceData.present, color: '#10b981' },
        { name: 'Absent', value: attendanceData.absent, color: '#ef4444' },
        { name: 'Late', value: attendanceData.late, color: '#f59e0b' },
        { name: 'On Leave', value: attendanceData.onLeave, color: '#3b82f6' }
    ] : [];

    if (loading || !attendanceData) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header with Date Navigation */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-white">Attendance Overview</h1>
                    <p className="text-zinc-400 mt-1">Monitor team attendance and performance metrics</p>
                </div>

                {/* Date Navigator */}
                <div className="flex items-center space-x-3 bg-white/10 backdrop-blur-md rounded-xl p-2 border border-white/20">
                    <button
                        onClick={() => changeDate(-1)}
                        className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                    >
                        <ChevronLeft className="h-5 w-5 text-white" />
                    </button>
                    <div className="flex items-center space-x-2 px-4">
                        <Calendar className="h-5 w-5 text-white" />
                        <input
                            type="date"
                            value={selectedDate}
                            onChange={(e) => setSelectedDate(e.target.value)}
                            className="bg-transparent text-white font-medium focus:outline-none cursor-pointer"
                        />
                    </div>
                    <button
                        onClick={() => changeDate(1)}
                        className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                    >
                        <ChevronRight className="h-5 w-5 text-white" />
                    </button>
                </div>
            </div>

            {/* Main Stat Widgets - White Theme */}
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {/* Present Days Widget */}
                <div className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-all border border-gray-100">
                    <div className="flex items-start justify-between mb-4">
                        <div className="p-3 bg-emerald-50 rounded-xl">
                            <UserCheck className="h-6 w-6 text-emerald-600" />
                        </div>
                        <div className="flex items-center space-x-1 text-sm">
                            <TrendingUp className="h-4 w-4 text-emerald-600" />
                            <span className="font-medium text-emerald-600">
                                {attendanceData.attendancePercentage}%
                            </span>
                        </div>
                    </div>
                    <h3 className="text-gray-600 text-sm font-medium mb-1">Present Today</h3>
                    <div className="flex items-baseline space-x-2">
                        <p className="text-3xl font-bold text-gray-900">{attendanceData.present}</p>
                        <span className="text-gray-500 text-sm">/ {attendanceData.totalEmployees}</span>
                    </div>
                    <div className="mt-4 pt-4 border-t border-gray-100">
                        <p className="text-xs text-gray-500">
                            {attendanceData.presentEmployees.length} employees checked in
                        </p>
                    </div>
                </div>

                {/* Late Days Widget */}
                <div className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-all border border-gray-100">
                    <div className="flex items-start justify-between mb-4">
                        <div className="p-3 bg-amber-50 rounded-xl">
                            <AlertTriangle className="h-6 w-6 text-amber-600" />
                        </div>
                        <div className="flex items-center space-x-1 text-sm">
                            <span className="font-medium text-amber-600">
                                {attendanceData.totalEmployees > 0
                                    ? ((attendanceData.late / attendanceData.totalEmployees) * 100).toFixed(0)
                                    : 0}%
                            </span>
                        </div>
                    </div>
                    <h3 className="text-gray-600 text-sm font-medium mb-1">Late Arrivals</h3>
                    <div className="flex items-baseline space-x-2">
                        <p className="text-3xl font-bold text-gray-900">{attendanceData.late}</p>
                        <span className="text-gray-500 text-sm">employees</span>
                    </div>
                    <div className="mt-4 pt-4 border-t border-gray-100">
                        <p className="text-xs text-gray-500">Need attention</p>
                    </div>
                </div>

                {/* Absent Days Widget */}
                <div className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-all border border-gray-100">
                    <div className="flex items-start justify-between mb-4">
                        <div className="p-3 bg-red-50 rounded-xl">
                            <UserX className="h-6 w-6 text-red-600" />
                        </div>
                        <div className="flex items-center space-x-1 text-sm">
                            <span className="font-medium text-red-600">
                                {attendanceData.totalEmployees > 0
                                    ? ((attendanceData.absent / attendanceData.totalEmployees) * 100).toFixed(0)
                                    : 0}%
                            </span>
                        </div>
                    </div>
                    <h3 className="text-gray-600 text-sm font-medium mb-1">Absent Today</h3>
                    <div className="flex items-baseline space-x-2">
                        <p className="text-3xl font-bold text-gray-900">{attendanceData.absent}</p>
                        <span className="text-gray-500 text-sm">employees</span>
                    </div>
                    <div className="mt-4 pt-4 border-t border-gray-100">
                        <p className="text-xs text-gray-500">Missing from work</p>
                    </div>
                </div>

                {/* Attendance % Widget */}
                <div className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-all border border-gray-100">
                    <div className="flex items-start justify-between mb-4">
                        <div className="p-3 bg-blue-50 rounded-xl">
                            <Target className="h-6 w-6 text-blue-600" />
                        </div>
                        <div className="flex items-center space-x-1 text-sm">
                            <TrendingUp className="h-4 w-4 text-blue-600" />
                            <span className="font-medium text-blue-600">Excellent</span>
                        </div>
                    </div>
                    <h3 className="text-gray-600 text-sm font-medium mb-1">Attendance Rate</h3>
                    <div className="flex items-baseline space-x-2">
                        <p className="text-3xl font-bold text-gray-900">{attendanceData.attendancePercentage}</p>
                        <span className="text-gray-500 text-sm">%</span>
                    </div>
                    <div className="mt-4 pt-4 border-t border-gray-100">
                        <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                                className="bg-blue-600 h-2 rounded-full transition-all"
                                style={{ width: `${attendanceData.attendancePercentage}%` }}
                            ></div>
                        </div>
                    </div>
                </div>

                {/* Total Working Hours Widget */}
                <div className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-all border border-gray-100">
                    <div className="flex items-start justify-between mb-4">
                        <div className="p-3 bg-purple-50 rounded-xl">
                            <Clock className="h-6 w-6 text-purple-600" />
                        </div>
                        <div className="flex items-center space-x-1 text-sm">
                            <Zap className="h-4 w-4 text-purple-600" />
                        </div>
                    </div>
                    <h3 className="text-gray-600 text-sm font-medium mb-1">Total Hours</h3>
                    <div className="flex items-baseline space-x-2">
                        <p className="text-3xl font-bold text-gray-900">{attendanceData.totalWorkingHours}</p>
                        <span className="text-gray-500 text-sm">hrs</span>
                    </div>
                    <div className="mt-4 pt-4 border-t border-gray-100">
                        <p className="text-xs text-gray-500">Productive hours logged</p>
                    </div>
                </div>

                {/* Overtime Hours Widget */}
                <div className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-all border border-gray-100">
                    <div className="flex items-start justify-between mb-4">
                        <div className="p-3 bg-indigo-50 rounded-xl">
                            <Zap className="h-6 w-6 text-indigo-600" />
                        </div>
                        <div className="flex items-center space-x-1 text-sm">
                            <span className="font-medium text-indigo-600">Extra</span>
                        </div>
                    </div>
                    <h3 className="text-gray-600 text-sm font-medium mb-1">Overtime</h3>
                    <div className="flex items-baseline space-x-2">
                        <p className="text-3xl font-bold text-gray-900">{attendanceData.overtimeHours}</p>
                        <span className="text-gray-500 text-sm">hrs</span>
                    </div>
                    <div className="mt-4 pt-4 border-t border-gray-100">
                        <p className="text-xs text-gray-500">Beyond regular hours</p>
                    </div>
                </div>

                {/* Punctuality Widget */}
                <div className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-all border border-gray-100">
                    <div className="flex items-start justify-between mb-4">
                        <div className="p-3 bg-teal-50 rounded-xl">
                            <Award className="h-6 w-6 text-teal-600" />
                        </div>
                        <div className="flex items-center space-x-1 text-sm">
                            <TrendingUp className="h-4 w-4 text-teal-600" />
                        </div>
                    </div>
                    <h3 className="text-gray-600 text-sm font-medium mb-1">Punctuality</h3>
                    <div className="flex items-baseline space-x-2">
                        <p className="text-3xl font-bold text-gray-900">{attendanceData.punctuality}</p>
                        <span className="text-gray-500 text-sm">%</span>
                    </div>
                    <div className="mt-4 pt-4 border-t border-gray-100">
                        <p className="text-xs text-gray-500">{attendanceData.onTimeEmployees} on-time arrivals</p>
                    </div>
                </div>

                {/* Total Employees Widget */}
                <div className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-all border border-gray-100">
                    <div className="flex items-start justify-between mb-4">
                        <div className="p-3 bg-gray-100 rounded-xl">
                            <Users className="h-6 w-6 text-gray-600" />
                        </div>
                    </div>
                    <h3 className="text-gray-600 text-sm font-medium mb-1">Total Team</h3>
                    <div className="flex items-baseline space-x-2">
                        <p className="text-3xl font-bold text-gray-900">{attendanceData.totalEmployees}</p>
                        <span className="text-gray-500 text-sm">employees</span>
                    </div>
                    <div className="mt-4 pt-4 border-t border-gray-100">
                        <p className="text-xs text-gray-500">Active workforce</p>
                    </div>
                </div>
            </div>

            {/* Graphs Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Weekly Trend Line Chart */}
                <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
                    <h3 className="text-lg font-bold text-gray-900 mb-4">7-Day Attendance Trend</h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={weeklyData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                            <XAxis dataKey="day" stroke="#6b7280" style={{ fontSize: '12px' }} />
                            <YAxis stroke="#6b7280" style={{ fontSize: '12px' }} />
                            <Tooltip content={<CustomTooltip />} />
                            <Legend />
                            <Line type="monotone" dataKey="present" stroke="#10b981" strokeWidth={2} name="Present" dot={{ fill: '#10b981', r: 4 }} />
                            <Line type="monotone" dataKey="absent" stroke="#ef4444" strokeWidth={2} name="Absent" dot={{ fill: '#ef4444', r: 4 }} />
                            <Line type="monotone" dataKey="late" stroke="#f59e0b" strokeWidth={2} name="Late" dot={{ fill: '#f59e0b', r: 4 }} />
                        </LineChart>
                    </ResponsiveContainer>
                </div>

                {/* Attendance Distribution Pie Chart */}
                <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
                    <h3 className="text-lg font-bold text-gray-900 mb-4">Today's Distribution</h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                            <Pie
                                data={pieData}
                                cx="50%"
                                cy="50%"
                                labelLine={false}
                                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                                outerRadius={100}
                                fill="#8884d8"
                                dataKey="value"
                            >
                                {pieData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                            </Pie>
                            <Tooltip content={({ active, payload }) => {
                                if (active && payload && payload.length) {
                                    const data = payload[0].payload;
                                    let employees = [];
                                    if (data.name === 'Present') employees = attendanceData.presentEmployees;
                                    if (data.name === 'Absent') employees = attendanceData.absentEmployees;
                                    if (data.name === 'Late') employees = attendanceData.lateEmployees;

                                    return <CustomTooltip active={active} payload={payload} employees={employees} type={data.name} />;
                                }
                                return null;
                            }} />
                        </PieChart>
                    </ResponsiveContainer>
                </div>

                {/* Weekly Comparison Bar Chart */}
                <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
                    <h3 className="text-lg font-bold text-gray-900 mb-4">Weekly Attendance Comparison</h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={weeklyData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                            <XAxis dataKey="day" stroke="#6b7280" style={{ fontSize: '12px' }} />
                            <YAxis stroke="#6b7280" style={{ fontSize: '12px' }} />
                            <Tooltip content={<CustomTooltip />} />
                            <Legend />
                            <Bar dataKey="present" fill="#10b981" name="Present" radius={[8, 8, 0, 0]} />
                            <Bar dataKey="absent" fill="#ef4444" name="Absent" radius={[8, 8, 0, 0]} />
                            <Bar dataKey="late" fill="#f59e0b" name="Late" radius={[8, 8, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                {/* Attendance Percentage Area Chart */}
                <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
                    <h3 className="text-lg font-bold text-gray-900 mb-4">Attendance Rate Trend</h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <AreaChart data={weeklyData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                            <XAxis dataKey="day" stroke="#6b7280" style={{ fontSize: '12px' }} />
                            <YAxis stroke="#6b7280" style={{ fontSize: '12px' }} domain={[0, 100]} />
                            <Tooltip content={<CustomTooltip />} />
                            <Area
                                type="monotone"
                                dataKey="percentage"
                                stroke="#3b82f6"
                                fill="#3b82f6"
                                fillOpacity={0.3}
                                strokeWidth={2}
                                name="Attendance %"
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Absent Employees List */}
            {attendanceData.absentEmployees.length > 0 && (
                <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
                    <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                        <UserX className="h-5 w-5 mr-2 text-red-600" />
                        Absent Today ({attendanceData.absentEmployees.length})
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {attendanceData.absentEmployees.map((emp, idx) => (
                            <div key={idx} className="flex items-center space-x-3 p-3 bg-red-50 rounded-lg border border-red-100">
                                <div className="w-10 h-10 rounded-full bg-red-200 flex items-center justify-center text-red-700 font-semibold">
                                    {emp.firstName[0]}{emp.lastName[0]}
                                </div>
                                <div className="flex-1">
                                    <p className="font-medium text-gray-900">{emp.firstName} {emp.lastName}</p>
                                    <p className="text-xs text-gray-500">{emp.employeeId} • {emp.department || 'N/A'}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Late Employees List */}
            {attendanceData.lateEmployees.length > 0 && (
                <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
                    <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                        <AlertTriangle className="h-5 w-5 mr-2 text-amber-600" />
                        Late Arrivals ({attendanceData.lateEmployees.length})
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {attendanceData.lateEmployees.map((emp, idx) => (
                            <div key={idx} className="flex items-center space-x-3 p-3 bg-amber-50 rounded-lg border border-amber-100">
                                <div className="w-10 h-10 rounded-full bg-amber-200 flex items-center justify-center text-amber-700 font-semibold">
                                    {emp.firstName[0]}{emp.lastName[0]}
                                </div>
                                <div className="flex-1">
                                    <p className="font-medium text-gray-900">{emp.firstName} {emp.lastName}</p>
                                    <p className="text-xs text-gray-500">{emp.employeeId} • {emp.department || 'N/A'}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default CoFounderAttendanceOverview;
