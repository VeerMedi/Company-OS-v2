import React, { useState, useEffect } from 'react';
import {
  Users,
  DollarSign,
  Calendar,
  Search,
  Eye,
  BarChart3,
  TrendingUp,
  Clock,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import api from '../utils/api';
import { formatDate } from '../utils/helpers';
import { showToast } from '../utils/toast';

const TeamPayrollView = () => {
  const [payrolls, setPayrolls] = useState([]);
  const [summary, setSummary] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Filter states
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPayroll, setSelectedPayroll] = useState(null);
  const [showViewModal, setShowViewModal] = useState(false);

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const statusColors = {
    pending: 'bg-yellow-100 text-yellow-800',
    processing: 'bg-blue-100 text-blue-800',
    paid: 'bg-green-100 text-green-800',
    'on-hold': 'bg-red-100 text-red-800'
  };

  const statusIcons = {
    pending: Clock,
    processing: TrendingUp,
    paid: CheckCircle,
    'on-hold': AlertCircle
  };

  // Fetch data on component mount and when filters change
  useEffect(() => {
    fetchTeamPayrolls();
  }, [selectedMonth, selectedYear]);

  const fetchTeamPayrolls = async () => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams({
        month: selectedMonth,
        year: selectedYear
      });

      const response = await api.get(`/payroll/team?${params}`);
      setPayrolls(response.data.data);
      
      // Calculate summary
      const totalGross = response.data.data.reduce((sum, p) => sum + p.grossSalary, 0);
      const totalNet = response.data.data.reduce((sum, p) => sum + p.netSalary, 0);
      const paidCount = response.data.data.filter(p => p.paymentStatus === 'paid').length;
      const pendingCount = response.data.data.filter(p => p.paymentStatus === 'pending').length;
      
      setSummary({
        totalEmployees: response.data.data.length,
        totalGrossSalary: totalGross,
        totalNetSalary: totalNet,
        paidCount,
        pendingCount
      });
    } catch (err) {
      setError('Failed to fetch team payroll records');
      showToast.error('Failed to fetch team payroll records');
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0
    }).format(amount || 0);
  };

  const filteredPayrolls = payrolls.filter(payroll => {
    if (!payroll.employeeId) return false;
    
    const searchMatch = searchTerm === '' || 
      payroll.employeeId.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payroll.employeeId.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payroll.employeeId.employeeId.toLowerCase().includes(searchTerm.toLowerCase());
    
    return searchMatch;
  });

  const openViewModal = (payroll) => {
    setSelectedPayroll(payroll);
    setShowViewModal(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Team Payroll</h1>
          <p className="text-gray-600">View payroll information for your team members</p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Team Members</p>
              <p className="text-2xl font-bold text-gray-900">{summary.totalEmployees || 0}</p>
            </div>
            <Users className="w-8 h-8 text-blue-600" />
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Payroll</p>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(summary.totalNetSalary)}</p>
            </div>
            <DollarSign className="w-8 h-8 text-green-600" />
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Paid</p>
              <p className="text-2xl font-bold text-green-600">{summary.paidCount || 0}</p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Pending</p>
              <p className="text-2xl font-bold text-orange-600">{summary.pendingCount || 0}</p>
            </div>
            <Clock className="w-8 h-8 text-orange-600" />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-6 rounded-lg shadow border">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Month</label>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2"
            >
              {months.map((month, index) => (
                <option key={index} value={index + 1}>{month}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Year</label>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2"
            >
              {[2023, 2024, 2025, 2026].map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
              <input
                type="text"
                placeholder="Search team members..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Payroll Table */}
      <div className="bg-white rounded-lg shadow border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Employee
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Month
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Basic Salary
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Net Salary
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {isLoading ? (
                <tr>
                  <td colSpan="6" className="px-6 py-4 text-center">
                    <div className="flex justify-center">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                    </div>
                  </td>
                </tr>
              ) : filteredPayrolls.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-4 text-center text-gray-500">
                    No payroll records found for your team
                  </td>
                </tr>
              ) : (
                filteredPayrolls.map((payroll) => {
                  const StatusIcon = statusIcons[payroll.paymentStatus] || Clock;
                  return (
                    <tr key={payroll._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                              <span className="text-sm font-medium text-gray-700">
                                {payroll.employeeId?.firstName?.[0] || 'N'}{payroll.employeeId?.lastName?.[0] || 'A'}
                              </span>
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {payroll.employeeId?.firstName || 'N/A'} {payroll.employeeId?.lastName || ''}
                            </div>
                            <div className="text-sm text-gray-500">
                              {payroll.employeeId?.employeeId || 'N/A'} • {payroll.employeeId?.role || 'individual'}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {payroll.salaryPeriod}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatCurrency(payroll.basicSalary)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {formatCurrency(payroll.netSalary)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[payroll.paymentStatus]}`}>
                          <StatusIcon className="w-3 h-3 mr-1" />
                          {payroll.paymentStatus.charAt(0).toUpperCase() + payroll.paymentStatus.slice(1).replace('-', ' ')}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => openViewModal(payroll)}
                          className="text-blue-600 hover:text-blue-900"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* View Modal */}
      {showViewModal && selectedPayroll && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  Payroll Details - {selectedPayroll.employeeId?.firstName} {selectedPayroll.employeeId?.lastName}
                </h3>
                <button
                  onClick={() => setShowViewModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ×
                </button>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Employee ID</label>
                    <p className="text-sm text-gray-900">{selectedPayroll.employeeId?.employeeId}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Month</label>
                    <p className="text-sm text-gray-900">{selectedPayroll.salaryPeriod}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Basic Salary</label>
                    <p className="text-sm text-gray-900">{formatCurrency(selectedPayroll.basicSalary)}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Gross Salary</label>
                    <p className="text-sm text-gray-900">{formatCurrency(selectedPayroll.grossSalary)}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Total Deductions</label>
                    <p className="text-sm text-gray-900">{formatCurrency(selectedPayroll.totalDeductions)}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Net Salary</label>
                    <p className="text-sm font-semibold text-gray-900">{formatCurrency(selectedPayroll.netSalary)}</p>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Present Days</label>
                    <p className="text-sm text-gray-900">{selectedPayroll.workingDays?.present || 0}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Total Days</label>
                    <p className="text-sm text-gray-900">{selectedPayroll.workingDays?.total || 0}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Attendance</label>
                    <p className="text-sm text-gray-900">{selectedPayroll.attendancePercentage}%</p>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Payment Status</label>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[selectedPayroll.paymentStatus]}`}>
                    {selectedPayroll.paymentStatus.charAt(0).toUpperCase() + selectedPayroll.paymentStatus.slice(1).replace('-', ' ')}
                  </span>
                </div>

                {selectedPayroll.remarks && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Remarks</label>
                    <p className="text-sm text-gray-900">{selectedPayroll.remarks}</p>
                  </div>
                )}
              </div>

              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => setShowViewModal(false)}
                  className="bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeamPayrollView;