import React, { useState, useEffect } from 'react';
import {
  DollarSign,
  Calendar,
  Search,
  Eye,
  Download,
  TrendingUp,
  Clock,
  CheckCircle,
  AlertCircle,
  BarChart3,
  FileText,
  User
} from 'lucide-react';
import api from '../utils/api';
import { formatDate } from '../utils/helpers';
import { showToast } from '../utils/toast';

const MyPayroll = () => {
  const [payrolls, setPayrolls] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedPayroll, setSelectedPayroll] = useState(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

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

  // Fetch data on component mount
  useEffect(() => {
    fetchMyPayrolls();
  }, [currentPage]);

  const fetchMyPayrolls = async () => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams({
        page: currentPage,
        limit: 12
      });

      const response = await api.get(`/payroll/my-payroll?${params}`);
      setPayrolls(response.data.data);
      setTotalPages(response.data.pagination?.pages || 1);
    } catch (err) {
      if (err.response?.status === 403) {
        setError('You do not have access to payroll information');
      } else {
        setError('Failed to fetch your payroll records');
        showToast.error('Failed to fetch your payroll records');
      }
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

  const openViewModal = (payroll) => {
    setSelectedPayroll(payroll);
    setShowViewModal(true);
  };

  const calculateSummary = () => {
    if (payrolls.length === 0) return { totalEarned: 0, avgSalary: 0, lastPayment: null };
    
    const totalEarned = payrolls.reduce((sum, p) => sum + p.netSalary, 0);
    const avgSalary = totalEarned / payrolls.length;
    const lastPayment = payrolls.find(p => p.paymentStatus === 'paid');
    
    return { totalEarned, avgSalary, lastPayment };
  };

  const summary = calculateSummary();

  if (error && error.includes('access')) {
    return (
      <div className="text-center py-12">
        <DollarSign className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-lg font-medium text-gray-900">Access Restricted</h3>
        <p className="mt-1 text-gray-500">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Payroll</h1>
          <p className="text-gray-600">View your salary history and payment details</p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg shadow border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Earned</p>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(summary.totalEarned)}</p>
            </div>
            <DollarSign className="w-8 h-8 text-green-600" />
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Average Salary</p>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(summary.avgSalary)}</p>
            </div>
            <BarChart3 className="w-8 h-8 text-blue-600" />
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Last Payment</p>
              <p className="text-lg font-bold text-gray-900">
                {summary.lastPayment ? formatDate(summary.lastPayment.paymentDate) : 'No payments yet'}
              </p>
            </div>
            <Calendar className="w-8 h-8 text-purple-600" />
          </div>
        </div>
      </div>

      {/* Payroll History */}
      <div className="bg-white rounded-lg shadow border overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Salary History</h2>
        </div>
        
        {isLoading ? (
          <div className="p-6 text-center">
            <div className="flex justify-center">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            </div>
          </div>
        ) : payrolls.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            <FileText className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Payroll Records</h3>
            <p>You don't have any payroll records yet.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {payrolls.map((payroll) => {
              const StatusIcon = statusIcons[payroll.paymentStatus] || Clock;
              return (
                <div key={payroll._id} className="p-6 hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center">
                        <div className="flex-shrink-0">
                          <Calendar className="h-8 w-8 text-gray-400" />
                        </div>
                        <div className="ml-4">
                          <h3 className="text-lg font-medium text-gray-900">
                            {payroll.salaryPeriod}
                          </h3>
                          <div className="mt-1 flex items-center space-x-4 text-sm text-gray-500">
                            <span>Basic: {formatCurrency(payroll.basicSalary)}</span>
                            <span>•</span>
                            <span>Gross: {formatCurrency(payroll.grossSalary)}</span>
                            <span>•</span>
                            <span>Net: {formatCurrency(payroll.netSalary)}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[payroll.paymentStatus]}`}>
                        <StatusIcon className="w-3 h-3 mr-1" />
                        {payroll.paymentStatus.charAt(0).toUpperCase() + payroll.paymentStatus.slice(1).replace('-', ' ')}
                      </span>
                      
                      <button
                        onClick={() => openViewModal(payroll)}
                        className="text-blue-600 hover:text-blue-900 flex items-center space-x-1"
                      >
                        <Eye className="w-4 h-4" />
                        <span>View</span>
                      </button>
                    </div>
                  </div>
                  
                  <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500">Attendance:</span>
                      <p className="font-medium">{payroll.attendancePercentage}%</p>
                    </div>
                    <div>
                      <span className="text-gray-500">Working Days:</span>
                      <p className="font-medium">{payroll.workingDays?.present || 0}/{payroll.workingDays?.total || 0}</p>
                    </div>
                    <div>
                      <span className="text-gray-500">Deductions:</span>
                      <p className="font-medium">{formatCurrency(payroll.totalDeductions)}</p>
                    </div>
                    <div>
                      <span className="text-gray-500">Payment Date:</span>
                      <p className="font-medium">
                        {payroll.paymentDate ? formatDate(payroll.paymentDate) : 'Pending'}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
            <div className="flex-1 flex justify-between sm:hidden">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
              >
                Previous
              </button>
              <button
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
              >
                Next
              </button>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  Page <span className="font-medium">{currentPage}</span> of{' '}
                  <span className="font-medium">{totalPages}</span>
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                  {[...Array(totalPages)].map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentPage(index + 1)}
                      className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                        currentPage === index + 1
                          ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                          : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                      }`}
                    >
                      {index + 1}
                    </button>
                  ))}
                </nav>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* View Modal */}
      {showViewModal && selectedPayroll && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  Salary Slip - {selectedPayroll.salaryPeriod}
                </h3>
                <button
                  onClick={() => setShowViewModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ×
                </button>
              </div>

              <div className="space-y-6">
                {/* Basic Information */}
                <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Salary Period</label>
                    <p className="text-sm text-gray-900">{selectedPayroll.salaryPeriod}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Payment Status</label>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[selectedPayroll.paymentStatus]}`}>
                      {selectedPayroll.paymentStatus.charAt(0).toUpperCase() + selectedPayroll.paymentStatus.slice(1).replace('-', ' ')}
                    </span>
                  </div>
                </div>

                {/* Earnings */}
                <div>
                  <h4 className="text-md font-semibold text-gray-900 mb-3">Earnings</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Basic Salary</label>
                      <p className="text-sm text-gray-900">{formatCurrency(selectedPayroll.basicSalary)}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">HRA</label>
                      <p className="text-sm text-gray-900">{formatCurrency(selectedPayroll.allowances?.hra || 0)}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Transport Allowance</label>
                      <p className="text-sm text-gray-900">{formatCurrency(selectedPayroll.allowances?.transport || 0)}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Medical Allowance</label>
                      <p className="text-sm text-gray-900">{formatCurrency(selectedPayroll.allowances?.medical || 0)}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Performance Bonus</label>
                      <p className="text-sm text-gray-900">{formatCurrency(selectedPayroll.allowances?.performance || 0)}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Other Allowances</label>
                      <p className="text-sm text-gray-900">{formatCurrency(selectedPayroll.allowances?.other || 0)}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Bonus</label>
                      <p className="text-sm text-gray-900">{formatCurrency(selectedPayroll.bonus || 0)}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Overtime</label>
                      <p className="text-sm text-gray-900">{formatCurrency(selectedPayroll.overtime?.amount || 0)}</p>
                    </div>
                  </div>
                  <div className="mt-3 pt-3 border-t border-gray-200">
                    <div className="flex justify-between">
                      <span className="font-medium">Gross Salary:</span>
                      <span className="font-semibold">{formatCurrency(selectedPayroll.grossSalary)}</span>
                    </div>
                  </div>
                </div>

                {/* Deductions */}
                <div>
                  <h4 className="text-md font-semibold text-gray-900 mb-3">Deductions</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Tax</label>
                      <p className="text-sm text-gray-900">{formatCurrency(selectedPayroll.deductions?.tax || 0)}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Provident Fund</label>
                      <p className="text-sm text-gray-900">{formatCurrency(selectedPayroll.deductions?.providentFund || 0)}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Insurance</label>
                      <p className="text-sm text-gray-900">{formatCurrency(selectedPayroll.deductions?.insurance || 0)}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Loan</label>
                      <p className="text-sm text-gray-900">{formatCurrency(selectedPayroll.deductions?.loan || 0)}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Other Deductions</label>
                      <p className="text-sm text-gray-900">{formatCurrency(selectedPayroll.deductions?.other || 0)}</p>
                    </div>
                  </div>
                  <div className="mt-3 pt-3 border-t border-gray-200">
                    <div className="flex justify-between">
                      <span className="font-medium">Total Deductions:</span>
                      <span className="font-semibold">{formatCurrency(selectedPayroll.totalDeductions)}</span>
                    </div>
                  </div>
                </div>

                {/* Net Salary */}
                <div className="p-4 bg-green-50 rounded-lg">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-semibold text-gray-900">Net Salary:</span>
                    <span className="text-xl font-bold text-green-600">{formatCurrency(selectedPayroll.netSalary)}</span>
                  </div>
                </div>

                {/* Attendance */}
                <div>
                  <h4 className="text-md font-semibold text-gray-900 mb-3">Attendance</h4>
                  <div className="grid grid-cols-4 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Total Days</label>
                      <p className="text-sm text-gray-900">{selectedPayroll.workingDays?.total || 0}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Present</label>
                      <p className="text-sm text-gray-900">{selectedPayroll.workingDays?.present || 0}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Leave</label>
                      <p className="text-sm text-gray-900">{selectedPayroll.workingDays?.leave || 0}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Attendance %</label>
                      <p className="text-sm text-gray-900">{selectedPayroll.attendancePercentage}%</p>
                    </div>
                  </div>
                </div>

                {selectedPayroll.remarks && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Remarks</label>
                    <p className="text-sm text-gray-900 bg-gray-50 p-3 rounded">{selectedPayroll.remarks}</p>
                  </div>
                )}
              </div>

              <div className="mt-6 flex justify-end space-x-3">
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

export default MyPayroll;