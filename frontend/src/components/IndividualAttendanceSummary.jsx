import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './common/Card.jsx';
import { Calendar, Clock, Users, UserCheck, UserX, AlertTriangle, TrendingUp, DollarSign, ChevronLeft, ChevronRight } from 'lucide-react';
import api from '../utils/api.js';

const IndividualAttendanceSummary = ({ employeeId }) => {
  const [attendanceData, setAttendanceData] = useState(null);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // State for month/year selection
  const currentDate = new Date();
  const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear());

  useEffect(() => {
    if (employeeId) {
      fetchAttendanceData();
    }
  }, [employeeId, selectedMonth, selectedYear]);

  const navigateMonth = (direction) => {
    if (direction === 'prev') {
      if (selectedMonth === 1) {
        setSelectedMonth(12);
        setSelectedYear(selectedYear - 1);
      } else {
        setSelectedMonth(selectedMonth - 1);
      }
    } else {
      if (selectedMonth === 12) {
        setSelectedMonth(1);
        setSelectedYear(selectedYear + 1);
      } else {
        setSelectedMonth(selectedMonth + 1);
      }
    }
  };

  const getMonthName = (month) => {
    const months = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    return months[month - 1];
  };

  const fetchAttendanceData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Calculate date range for the selected month/year
      const startDate = new Date(selectedYear, selectedMonth - 1, 1);
      const endDate = new Date(selectedYear, selectedMonth, 0);
      
      const params = {
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0]
      };

      console.log('Fetching individual attendance data for employee:', employeeId, 'params:', params);
      
      const response = await api.get(`/attendance/employee/${employeeId}`, { params });

      if (response.data && response.data.success) {
        const attendanceRecords = response.data.data.attendance || [];
        const backendSummary = response.data.data.summary || {};
        
        setAttendanceData(attendanceRecords);
        
        // Use backend summary and enhance it with payroll calculations
        const enhancedSummary = enhanceSummaryForPayroll(backendSummary, startDate, endDate);
        setSummary(enhancedSummary);
      } else {
        throw new Error(response.data?.message || 'Failed to fetch attendance data');
      }
    } catch (error) {
      console.error('Error fetching individual attendance data:', error);
      setError(error.message);
      setAttendanceData([]);
      setSummary(null);
    } finally {
      setLoading(false);
    }
  };

  const enhanceSummaryForPayroll = (backendSummary, startDate, endDate) => {
    const totalDaysInMonth = new Date(endDate.getFullYear(), endDate.getMonth() + 1, 0).getDate();
    
    // Use backend summary as base
    const summary = {
      totalDays: totalDaysInMonth,
      workingDays: backendSummary.workingDaysInPeriod || 22,
      presentDays: (backendSummary.presentDays || 0) + (backendSummary.lateDays || 0) + (backendSummary.earlyDepartureDays || 0),
      absentDays: backendSummary.absentDays || 0,
      halfDays: backendSummary.partialDays || 0,
      lateDays: backendSummary.lateDays || 0,
      earlyDepartureDays: backendSummary.earlyDepartureDays || 0,
      leaveDays: backendSummary.leaveDays || 0,
      holidayDays: backendSummary.holidayDays || 0,
      totalWorkingHours: Math.floor((backendSummary.totalWorkingMinutes || 0) / 60),
      totalWorkingMinutes: (backendSummary.totalWorkingMinutes || 0) % 60,
      totalOvertimeHours: Math.floor((backendSummary.totalOvertimeMinutes || 0) / 60),
      totalOvertimeMinutes: (backendSummary.totalOvertimeMinutes || 0) % 60,
      totalLateMinutes: backendSummary.totalLateMinutes || 0,
      totalEarlyDepartureMinutes: backendSummary.totalEarlyDepartureMinutes || 0,
      attendancePercentage: backendSummary.attendancePercentage || 0,
      punctualityPercentage: backendSummary.punctualityPercentage || 0
    };

    // Calculate payroll impact
    summary.payrollImpact = {
      // Deductions for absent days (assuming 1 day salary per absent day)
      absentDayDeduction: summary.absentDays,
      // Deductions for half days (assuming 0.5 day salary per half day)
      halfDayDeduction: summary.halfDays * 0.5,
      // Overtime pay (in hours)
      overtimePay: Math.floor((backendSummary.totalOvertimeMinutes || 0) / 60),
      // Late deductions (assuming deduction for excessive lateness)
      lateDeduction: Math.floor((summary.totalLateMinutes) / 60), // Deduct 1 hour for every 60 minutes late
      // Early departure deductions
      earlyDepartureDeduction: Math.floor((summary.totalEarlyDepartureMinutes) / 60)
    };

    return summary;
  };

  const formatTime = (minutes) => {
    if (!minutes || minutes <= 0) return '0h 0m';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="bg-red-50 border-red-200">
        <CardContent className="p-4">
          <div className="text-red-600 text-center">
            <AlertTriangle className="h-8 w-8 mx-auto mb-2" />
            <p>Error loading attendance data: {error}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!summary) {
    return (
      <Card>
        <CardContent className="p-4">
          <div className="text-gray-500 text-center">
            <Calendar className="h-8 w-8 mx-auto mb-2" />
            <p>No attendance data available</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Month Navigation Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center">
              <Calendar className="h-5 w-5 mr-2" />
              Attendance Summary
            </CardTitle>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigateMonth('prev')}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                disabled={loading}
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <div className="text-lg font-semibold text-gray-900">
                {getMonthName(selectedMonth)} {selectedYear}
              </div>
              <button
                onClick={() => navigateMonth('next')}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                disabled={loading || (selectedYear === currentDate.getFullYear() && selectedMonth > currentDate.getMonth() + 1)}
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Working Days Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Clock className="h-5 w-5 mr-2" />
            Working Days Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="text-sm font-medium text-gray-600 mb-1">Total Days</div>
              <div className="text-2xl font-bold text-blue-600">{summary.totalDays}</div>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <div className="text-sm font-medium text-gray-600 mb-1">Present Days</div>
              <div className="text-2xl font-bold text-green-600">{summary.presentDays}</div>
            </div>
            <div className="bg-red-50 p-4 rounded-lg">
              <div className="text-sm font-medium text-gray-600 mb-1">Leave Days</div>
              <div className="text-2xl font-bold text-red-600">{summary.leaveDays}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Detailed Attendance Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Absent Days</p>
                <p className="text-2xl font-bold text-red-600">{summary.absentDays}</p>
              </div>
              <UserX className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Half Days</p>
                <p className="text-2xl font-bold text-orange-600">{summary.halfDays}</p>
              </div>
              <Clock className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Late Days</p>
                <p className="text-2xl font-bold text-yellow-600">{summary.lateDays}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Attendance %</p>
                <p className="text-2xl font-bold text-green-600">{summary.attendancePercentage}%</p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Overtime Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Clock className="h-5 w-5 mr-2" />
            Working Hours & Overtime
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="text-sm font-medium text-gray-600 mb-1">Total Working Hours</div>
              <div className="text-lg font-bold text-blue-600">
                {summary.totalWorkingHours}h {summary.totalWorkingMinutes}m
              </div>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg">
              <div className="text-sm font-medium text-gray-600 mb-1">Overtime Hours</div>
              <div className="text-lg font-bold text-purple-600">
                {summary.totalOvertimeHours}h {summary.totalOvertimeMinutes}m
              </div>
            </div>
            <div className="bg-yellow-50 p-4 rounded-lg">
              <div className="text-sm font-medium text-gray-600 mb-1">Total Late (mins)</div>
              <div className="text-lg font-bold text-yellow-600">{summary.totalLateMinutes}</div>
            </div>
            <div className="bg-orange-50 p-4 rounded-lg">
              <div className="text-sm font-medium text-gray-600 mb-1">Early Departure (mins)</div>
              <div className="text-lg font-bold text-orange-600">{summary.totalEarlyDepartureMinutes}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Payroll Impact */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <DollarSign className="h-5 w-5 mr-2" />
            Payroll Impact Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold text-red-600 mb-3">Deductions</h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Absent Days:</span>
                  <span className="font-medium text-red-600">-{summary.payrollImpact.absentDayDeduction} days</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Half Days:</span>
                  <span className="font-medium text-red-600">-{summary.payrollImpact.halfDayDeduction} days</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Late Hours:</span>
                  <span className="font-medium text-red-600">-{summary.payrollImpact.lateDeduction} hours</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Early Departure:</span>
                  <span className="font-medium text-red-600">-{summary.payrollImpact.earlyDepartureDeduction} hours</span>
                </div>
              </div>
            </div>
            <div>
              <h4 className="font-semibold text-green-600 mb-3">Additions</h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Overtime Hours:</span>
                  <span className="font-medium text-green-600">+{summary.payrollImpact.overtimePay} hours</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Punctuality Bonus:</span>
                  <span className="font-medium text-green-600">
                    {summary.punctualityPercentage >= 95 ? '+1 day' : 'Not eligible'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Performance Metrics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <TrendingUp className="h-5 w-5 mr-2" />
            Performance Metrics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{summary.attendancePercentage}%</div>
              <div className="text-sm text-gray-600">Attendance Rate</div>
              <div className={`text-xs mt-1 ${summary.attendancePercentage >= 90 ? 'text-green-600' : summary.attendancePercentage >= 75 ? 'text-yellow-600' : 'text-red-600'}`}>
                {summary.attendancePercentage >= 90 ? 'Excellent' : summary.attendancePercentage >= 75 ? 'Good' : 'Needs Improvement'}
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{summary.punctualityPercentage}%</div>
              <div className="text-sm text-gray-600">Punctuality Rate</div>
              <div className={`text-xs mt-1 ${summary.punctualityPercentage >= 95 ? 'text-green-600' : summary.punctualityPercentage >= 85 ? 'text-yellow-600' : 'text-red-600'}`}>
                {summary.punctualityPercentage >= 95 ? 'Excellent' : summary.punctualityPercentage >= 85 ? 'Good' : 'Needs Improvement'}
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{summary.totalWorkingHours + summary.totalOvertimeHours}h</div>
              <div className="text-sm text-gray-600">Total Hours</div>
              <div className="text-xs mt-1 text-gray-600">Including Overtime</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default IndividualAttendanceSummary;