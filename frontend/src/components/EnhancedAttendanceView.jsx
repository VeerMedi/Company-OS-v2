// Enhanced Attendance component for Profile page - Shows TEAM overview for Co-founders and personal attendance for employees
import React, { useState, useEffect } from 'react';
import {
    Users, UserCheck, UserX, Clock, AlertTriangle, TrendingUp, Calendar,
    ChevronLeft, ChevronRight, Zap, Target, Award, CheckCircle2,
    XCircle, Minus, Timer, CalendarDays, BarChart3, Coffee
} from 'lucide-react';
import api from '../utils/api';
import { showToast } from '../utils/toast';
import {
    AreaChart, Area, BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
    XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';

// This component will be used in Profile.jsx to replace renderAttendance()
export const EnhancedAttendanceView = ({ userRole }) => {
    const [selectedDate, setSelectedDate] = useState(() => {
        const today = new Date();
        return today.toISOString().split('T')[0];
    });
    const [attendanceData, setAttendanceData] = useState(null);
    const [weeklyData, setWeeklyData] = useState([]);
    const [loading, setLoading] = useState(true);

    // Check if user is co-founder
    const isCoFounder = userRole && (userRole.toLowerCase() === 'co-founder' || userRole.toLowerCase() === 'cofounder');

    useEffect(() => {
        if (isCoFounder) {
            fetchTeamAttendance();
            fetchWeeklyTrend();
        } else {
            fetchPersonalAttendance();
        }
    }, [selectedDate, isCoFounder]);

    const fetchTeamAttendance = async () => {
        try {
            setLoading(true);
            const response = await api.get('/attendance/all', {
                params: { date: selectedDate }
            });

            if (response.data.success) {
                const { attendance, summary } = response.data.data;

                const totalEmployees = summary.totalEmployees || 0;
                const present = summary.present || 0;
                const absent = summary.absent || 0;
                const late = summary.late || 0;

                const presentEmployees = attendance.filter(a => a.status === 'present').map(a => a.employee);
                const absentEmployees = attendance.filter(a => a.status === 'absent').map(a => a.employee);
                const lateEmployees = attendance.filter(a => a.status === 'late').map(a => a.employee);

                const totalWorkingHours = attendance.reduce((sum, a) => sum + (a.totalWorkingHours || 0), 0);
                const totalOvertimeHours = attendance.reduce((sum, a) => sum + (a.overtime?.hours || 0), 0);

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
                    totalWorkingHours: Math.round(totalWorkingHours / 60),
                    overtimeHours: Math.round(totalOvertimeHours / 60),
                    punctuality: totalEmployees > 0 ? ((onTimeEmployees / totalEmployees) * 100).toFixed(1) : 0,
                    presentEmployees,
                    absentEmployees,
                    lateEmployees,
                    onTimeEmployees
                });
            }
        } catch (error) {
            console.error('Error fetching team attendance:', error);
            showToast.error('Failed to load attendance data');
        } finally {
            setLoading(false);
        }
    };

    const fetchPersonalAttendance = async () => {
        try {
            setLoading(true);
            const response = await api.get('/attendance/monthly', {
                params: {
                    month: selectedDate.split('-')[1],
                    year: selectedDate.split('-')[0]
                }
            });

            if (response.data.success) {
                setAttendanceData(response.data.data);
            }
        } catch (error) {
            console.error('Error fetching personal attendance:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchWeeklyTrend = async () => {
        try {
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

    if (loading || !attendanceData) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    // Render Co-founder Team Overview
    if (isCoFounder) {
        const pieData = [
            { name: 'Present', value: attendanceData.present, color: '#10b981' },
            { name: 'Absent', value: attendanceData.absent, color: '#ef4444' },
            { name: 'Late', value: attendanceData.late, color: '#f59e0b' },
            { name: 'On Leave', value: attendanceData.onLeave, color: '#3b82f6' }
        ];

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

        return (
            <div className="space-y-6">
                {/* Header with Date Navigation */}
                <div className="flex justify-between items-center">
                    <h2 className="text-2xl font-bold text-white">Team Attendance Overview</h2>

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
                    {/* Present Widget */}
                    <div className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-all border border-gray-100">
                        <div className="flex items-start justify-between mb-4">
                            <div className="p-3 bg-emerald-50 rounded-xl">
                                <UserCheck className="h-6 w-6 text-emerald-600" />
                            </div>
                            <span className="text-sm font-medium text-emerald-600">
                                {attendanceData.attendancePercentage}%
                            </span>
                        </div>
                        <h3 className="text-gray-600 text-sm font-medium mb-1">Present Today</h3>
                        <div className="flex items-baseline space-x-2">
                            <p className="text-3xl font-bold text-gray-900">{attendanceData.present}</p>
                            <span className="text-gray-500 text-sm">/ {attendanceData.totalEmployees}</span>
                        </div>
                    </div>

                    {/* Late Widget */}
                    <div className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-all border border-gray-100">
                        <div className="flex items-start justify-between mb-4">
                            <div className="p-3 bg-amber-50 rounded-xl">
                                <AlertTriangle className="h-6 w-6 text-amber-600" />
                            </div>
                        </div>
                        <h3 className="text-gray-600 text-sm font-medium mb-1">Late Arrivals</h3>
                        <p className="text-3xl font-bold text-gray-900">{attendanceData.late}</p>
                    </div>

                    {/* Absent Widget */}
                    <div className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-all border border-gray-100">
                        <div className="flex items-start justify-between mb-4">
                            <div className="p-3 bg-red-50 rounded-xl">
                                <UserX className="h-6 w-6 text-red-600" />
                            </div>
                        </div>
                        <h3 className="text-gray-600 text-sm font-medium mb-1">Absent Today</h3>
                        <p className="text-3xl font-bold text-gray-900">{attendanceData.absent}</p>
                    </div>

                    {/* Attendance % Widget */}
                    <div className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-all border border-gray-100">
                        <div className="flex items-start justify-between mb-4">
                            <div className="p-3 bg-blue-50 rounded-xl">
                                <Target className="h-6 w-6 text-blue-600" />
                            </div>
                        </div>
                        <h3 className="text-gray-600 text-sm font-medium mb-1">Attendance Rate</h3>
                        <p className="text-3xl font-bold text-gray-900">{attendanceData.attendancePercentage}%</p>
                        <div className="mt-3 w-full bg-gray-200 rounded-full h-2">
                            <div
                                className="bg-blue-600 h-2 rounded-full"
                                style={{ width: `${attendanceData.attendancePercentage}%` }}
                            ></div>
                        </div>
                    </div>

                    {/* Working Hours */}
                    <div className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-all border border-gray-100">
                        <div className="flex items-start justify-between mb-4">
                            <div className="p-3 bg-purple-50 rounded-xl">
                                <Clock className="h-6 w-6 text-purple-600" />
                            </div>
                        </div>
                        <h3 className="text-gray-600 text-sm font-medium mb-1">Total Hours</h3>
                        <p className="text-3xl font-bold text-gray-900">{attendanceData.totalWorkingHours}h</p>
                    </div>

                    {/* Overtime */}
                    <div className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-all border border-gray-100">
                        <div className="flex items-start justify-between mb-4">
                            <div className="p-3 bg-indigo-50 rounded-xl">
                                <Zap className="h-6 w-6 text-indigo-600" />
                            </div>
                        </div>
                        <h3 className="text-gray-600 text-sm font-medium mb-1">Overtime</h3>
                        <p className="text-3xl font-bold text-gray-900">{attendanceData.overtimeHours}h</p>
                    </div>

                    {/* Punctuality */}
                    <div className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-all border border-gray-100">
                        <div className="flex items-start justify-between mb-4">
                            <div className="p-3 bg-teal-50 rounded-xl">
                                <Award className="h-6 w-6 text-teal-600" />
                            </div>
                        </div>
                        <h3 className="text-gray-600 text-sm font-medium mb-1">Punctuality</h3>
                        <p className="text-3xl font-bold text-gray-900">{attendanceData.punctuality}%</p>
                    </div>

                    {/* Total Team */}
                    <div className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-all border border-gray-100">
                        <div className="flex items-start justify-between mb-4">
                            <div className="p-3 bg-gray-100 rounded-xl">
                                <Users className="h-6 w-6 text-gray-600" />
                            </div>
                        </div>
                        <h3 className="text-gray-600 text-sm font-medium mb-1">Total Team</h3>
                        <p className="text-3xl font-bold text-gray-900">{attendanceData.totalEmployees}</p>
                    </div>
                </div>

                {/* Graphs */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Weekly Trend */}
                    <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
                        <h3 className="text-lg font-bold text-gray-900 mb-4">7-Day Trend</h3>
                        <ResponsiveContainer width="100%" height={250}>
                            <LineChart data={weeklyData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                                <XAxis dataKey="day" stroke="#6b7280" />
                                <YAxis stroke="#6b7280" />
                                <Tooltip content={<CustomTooltip />} />
                                <Legend />
                                <Line type="monotone" dataKey="present" stroke="#10b981" strokeWidth={2} name="Present" />
                                <Line type="monotone" dataKey="absent" stroke="#ef4444" strokeWidth={2} name="Absent" />
                                <Line type="monotone" dataKey="late" stroke="#f59e0b" strokeWidth={2} name="Late" />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>

                    {/* Pie Chart */}
                    <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
                        <h3 className="text-lg font-bold text-gray-900 mb-4">Today's Distribution</h3>
                        <ResponsiveContainer width="100%" height={250}>
                            <PieChart>
                                <Pie
                                    data={pieData}
                                    cx="50%"
                                    cy="50%"
                                    labelLine={false}
                                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                                    outerRadius={80}
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
                </div>

                {/* Absent Employees */}
                {attendanceData.absentEmployees.length > 0 && (
                    <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
                        <h3 className="text-lg font-bold text-gray-900 mb-4">Absent Today ({attendanceData.absentEmployees.length})</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            {attendanceData.absentEmployees.map((emp, idx) => (
                                <div key={idx} className="flex items-center space-x-3 p-3 bg-red-50 rounded-lg">
                                    <div className="w-10 h-10 rounded-full bg-red-200 flex items-center justify-center text-red-700 font-semibold">
                                        {emp.firstName[0]}{emp.lastName[0]}
                                    </div>
                                    <div>
                                        <p className="font-medium text-gray-900">{emp.firstName} {emp.lastName}</p>
                                        <p className="text-xs text-gray-500">{emp.employeeId}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        );
    }

    // Render personal attendance for regular employees (existing code)
    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold text-white">My Attendance</h2>
            {/* Add existing personal attendance rendering here */}
            <div className="text-center py-20 bg-zinc-900/50 rounded-2xl border border-white/5">
                <CalendarDays className="h-12 w-12 text-zinc-600 mx-auto mb-4" />
                <p className="text-zinc-400">Personal attendance view</p>
            </div>
        </div>
    );
};

export default EnhancedAttendanceView;
