import React, { useState, useEffect } from 'react';
import {
  Users,
  Plus,
  Search,
  Filter,
  Download,
  DollarSign,
  Calendar,
  CheckCircle,
  Clock,
  AlertCircle,
  Edit,
  Trash2,
  Eye,
  TrendingUp,
  TrendingDown,
  BarChart3,
  FileText,
  CreditCard,
  Calculator,
  Zap,
  RefreshCw,
  Info
} from 'lucide-react';
import api from '../utils/api';
import { formatDate } from '../utils/helpers';
import { showToast } from '../utils/toast';

const AutomatedPayrollManagement = () => {
  const [payrolls, setPayrolls] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [summary, setSummary] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Filter and pagination states
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedEmployee, setSelectedEmployee] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  
  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showAutomatedModal, setShowAutomatedModal] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [selectedPayroll, setSelectedPayroll] = useState(null);
  
  // Automated payroll states
  const [calculationResult, setCalculationResult] = useState(null);
  const [payrollPreview, setPayrollPreview] = useState(null);
  const [employeeBankDetails, setEmployeeBankDetails] = useState(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [autoFetchBank, setAutoFetchBank] = useState(true);
  
  // Form state for creating/editing payroll
  const [formData, setFormData] = useState({
    employeeId: '',
    salaryMonth: new Date().toISOString().slice(0, 7), // YYYY-MM format
    basicSalary: '',
    allowances: {
      hra: '',
      transport: '',
      medical: '',
      performance: '',
      other: ''
    },
    deductions: {
      tax: '',
      providentFund: '',
      insurance: '',
      loan: '',
      other: ''
    },
    bonusAmount: '',
    remarks: ''
  });

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
    processing: RefreshCw,
    paid: CheckCircle,
    'on-hold': AlertCircle
  };

  useEffect(() => {
    fetchPayrolls();
    fetchEmployees();
    fetchSummary();
  }, [selectedMonth, selectedYear, selectedEmployee, selectedStatus, currentPage]);

  const fetchPayrolls = async () => {
    try {
      setIsLoading(true);
      const params = {
        page: currentPage,
        limit: 10,
        ...(selectedMonth && selectedYear && { month: selectedMonth, year: selectedYear }),
        ...(selectedEmployee && { employeeId: selectedEmployee }),
        ...(selectedStatus && { status: selectedStatus })
      };

      const response = await api.get('/payroll', { params });
      setPayrolls(response.data.data);
      setTotalPages(response.data.pagination.pages);
    } catch (err) {
      setError('Failed to fetch payroll records');
      showToast.error('Failed to fetch payroll records');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchEmployees = async () => {
    try {
      const response = await api.get('/payroll/employees');
      setEmployees(response.data.data);
    } catch (err) {
      console.error('Failed to fetch employees:', err);
    }
  };

  const fetchSummary = async () => {
    try {
      const response = await api.get('/payroll/summary', {
        params: { month: selectedMonth, year: selectedYear }
      });
      setSummary(response.data.data);
    } catch (err) {
      console.error('Failed to fetch summary:', err);
    }
  };

  // Fetch employee bank details when employee is selected
  const fetchEmployeeBankDetails = async (employeeId) => {
    if (!employeeId || !autoFetchBank) return;

    try {
      const response = await api.get(`/payroll/employee/${employeeId}/bank-details`);
      setEmployeeBankDetails(response.data.data);
    } catch (err) {
      console.error('Failed to fetch bank details:', err);
      setEmployeeBankDetails(null);
    }
  };

  // Calculate automated payroll
  const calculateAutomatedPayroll = async () => {
    if (!formData.employeeId || !formData.salaryMonth || !formData.basicSalary) {
      showToast.error('Please fill in Employee, Salary Month, and Basic Salary');
      return;
    }

    try {
      setIsCalculating(true);
      const response = await api.post('/payroll/calculate', formData);
      setCalculationResult(response.data);
      setShowPreviewModal(true);
    } catch (err) {
      showToast.error(err.response?.data?.message || 'Failed to calculate payroll');
    } finally {
      setIsCalculating(false);
    }
  };

  // Create automated payroll
  const createAutomatedPayroll = async () => {
    try {
      const response = await api.post('/payroll/create-automated', formData);
      showToast.success('Automated payroll created successfully');
      setShowAutomatedModal(false);
      setShowPreviewModal(false);
      setCalculationResult(null);
      resetForm();
      fetchPayrolls();
      fetchSummary();
    } catch (err) {
      showToast.error(err.response?.data?.message || 'Failed to create automated payroll');
    }
  };

  // Handle employee selection change
  const handleEmployeeChange = (employeeId) => {
    setFormData({ ...formData, employeeId });
    if (employeeId && autoFetchBank) {
      fetchEmployeeBankDetails(employeeId);
    }
  };

  const resetForm = () => {
    setFormData({
      employeeId: '',
      salaryMonth: new Date().toISOString().slice(0, 7),
      basicSalary: '',
      allowances: {
        hra: '',
        transport: '',
        medical: '',
        performance: '',
        other: ''
      },
      deductions: {
        tax: '',
        providentFund: '',
        insurance: '',
        loan: '',
        other: ''
      },
      bonusAmount: '',
      remarks: ''
    });
    setCalculationResult(null);
    setEmployeeBankDetails(null);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount || 0);
  };

  // Salary Breakdown Component
  const SalaryBreakdown = ({ breakdown }) => {
    if (!breakdown) return null;

    const { salaryCalculation, attendance, bankDetails } = breakdown;

    return (
      <div className="space-y-6">
        {/* Employee Info */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h4 className="font-semibold text-gray-800 mb-2">Employee Information</h4>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-600">Name:</span> {breakdown.employee.name}
            </div>
            <div>
              <span className="text-gray-600">Employee ID:</span> {breakdown.employee.employeeId}
            </div>
            <div>
              <span className="text-gray-600">Email:</span> {breakdown.employee.email}
            </div>
            <div>
              <span className="text-gray-600">Attendance:</span> {attendance.attendancePercentage}%
            </div>
          </div>
        </div>

        {/* Salary Calculation */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Earnings */}
          <div className="bg-green-50 p-4 rounded-lg">
            <h4 className="font-semibold text-green-800 mb-3">Earnings</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Basic Salary:</span>
                <span className="font-medium">{formatCurrency(salaryCalculation.basicSalary.adjusted)}</span>
              </div>
              {salaryCalculation.basicSalary.adjusted !== salaryCalculation.basicSalary.original && (
                <div className="text-xs text-gray-600 italic">
                  {salaryCalculation.basicSalary.reason}
                </div>
              )}
              <div className="flex justify-between">
                <span>HRA:</span>
                <span className="font-medium">{formatCurrency(salaryCalculation.allowances.breakdown.hra)}</span>
              </div>
              <div className="flex justify-between">
                <span>Transport:</span>
                <span className="font-medium">{formatCurrency(salaryCalculation.allowances.breakdown.transport)}</span>
              </div>
              <div className="flex justify-between">
                <span>Medical:</span>
                <span className="font-medium">{formatCurrency(salaryCalculation.allowances.breakdown.medical)}</span>
              </div>
              {salaryCalculation.allowances.breakdown.performance > 0 && (
                <div className="flex justify-between">
                  <span>Performance:</span>
                  <span className="font-medium">{formatCurrency(salaryCalculation.allowances.breakdown.performance)}</span>
                </div>
              )}
              {salaryCalculation.bonus > 0 && (
                <div className="flex justify-between">
                  <span>Bonus:</span>
                  <span className="font-medium">{formatCurrency(salaryCalculation.bonus)}</span>
                </div>
              )}
              {salaryCalculation.overtime.amount > 0 && (
                <div className="flex justify-between">
                  <span>Overtime ({salaryCalculation.overtime.hours}h):</span>
                  <span className="font-medium">{formatCurrency(salaryCalculation.overtime.amount)}</span>
                </div>
              )}
              <div className="border-t pt-2 flex justify-between font-semibold text-green-800">
                <span>Gross Salary:</span>
                <span>{formatCurrency(salaryCalculation.grossSalary)}</span>
              </div>
            </div>
          </div>

          {/* Deductions */}
          <div className="bg-red-50 p-4 rounded-lg">
            <h4 className="font-semibold text-red-800 mb-3">Deductions</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Income Tax:</span>
                <span className="font-medium">{formatCurrency(salaryCalculation.deductions.breakdown.tax)}</span>
              </div>
              <div className="flex justify-between">
                <span>Provident Fund:</span>
                <span className="font-medium">{formatCurrency(salaryCalculation.deductions.breakdown.providentFund)}</span>
              </div>
              <div className="flex justify-between">
                <span>Insurance:</span>
                <span className="font-medium">{formatCurrency(salaryCalculation.deductions.breakdown.insurance)}</span>
              </div>
              {salaryCalculation.deductions.breakdown.loan > 0 && (
                <div className="flex justify-between">
                  <span>Loan:</span>
                  <span className="font-medium">{formatCurrency(salaryCalculation.deductions.breakdown.loan)}</span>
                </div>
              )}
              {salaryCalculation.deductions.breakdown.other > 0 && (
                <div className="flex justify-between">
                  <span>Other:</span>
                  <span className="font-medium">{formatCurrency(salaryCalculation.deductions.breakdown.other)}</span>
                </div>
              )}
              <div className="border-t pt-2 flex justify-between font-semibold text-red-800">
                <span>Total Deductions:</span>
                <span>{formatCurrency(salaryCalculation.deductions.total)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Net Salary */}
        <div className="bg-blue-50 p-4 rounded-lg">
          <div className="flex justify-between items-center">
            <h4 className="font-semibold text-blue-800">Net Salary</h4>
            <span className="text-2xl font-bold text-blue-800">
              {formatCurrency(salaryCalculation.netSalary)}
            </span>
          </div>
        </div>

        {/* Bank Details */}
        {bankDetails && (
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="font-semibold text-gray-800 mb-3">Bank Details</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Bank Name:</span> {bankDetails.bankName || 'N/A'}
              </div>
              <div>
                <span className="text-gray-600">Account Number:</span> {bankDetails.accountNumber || 'N/A'}
              </div>
              <div>
                <span className="text-gray-600">IFSC Code:</span> {bankDetails.ifscCode || 'N/A'}
              </div>
              <div>
                <span className="text-gray-600">Account Holder:</span> {bankDetails.accountHolderName || 'N/A'}
              </div>
            </div>
          </div>
        )}

        {/* Working Days */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h4 className="font-semibold text-gray-800 mb-3">Attendance Details</h4>
          <div className="grid grid-cols-4 gap-4 text-sm text-center">
            <div>
              <div className="text-lg font-semibold text-blue-600">{attendance.workingDays.total}</div>
              <div className="text-gray-600">Total Days</div>
            </div>
            <div>
              <div className="text-lg font-semibold text-green-600">{attendance.workingDays.present}</div>
              <div className="text-gray-600">Present Days</div>
            </div>
            <div>
              <div className="text-lg font-semibold text-orange-600">{attendance.workingDays.leave}</div>
              <div className="text-gray-600">Leave Days</div>
            </div>
            <div>
              <div className="text-lg font-semibold text-red-600">{attendance.workingDays.absent}</div>
              <div className="text-gray-600">Absent Days</div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Automated Payroll Management</h1>
        <p className="text-gray-600">Manage employee payroll with automated calculations based on attendance, leave, and bank details</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-xl shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Employees</p>
              <p className="text-2xl font-bold text-gray-900">{summary.totalEmployees || 0}</p>
            </div>
            <Users className="h-8 w-8 text-blue-600" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Gross Payroll</p>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(summary.totalGrossSalary)}</p>
            </div>
            <DollarSign className="h-8 w-8 text-green-600" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Net Payroll</p>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(summary.totalNetSalary)}</p>
            </div>
            <CreditCard className="h-8 w-8 text-purple-600" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Pending Payments</p>
              <p className="text-2xl font-bold text-gray-900">{summary.pendingCount || 0}</p>
            </div>
            <Clock className="h-8 w-8 text-orange-600" />
          </div>
        </div>
      </div>

      {/* Filters and Actions */}
      <div className="bg-white rounded-xl shadow-sm border mb-6">
        <div className="p-6 border-b">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {months.map((month, index) => (
                  <option key={month} value={index + 1}>{month}</option>
                ))}
              </select>

              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {[...Array(5)].map((_, i) => {
                  const year = new Date().getFullYear() - i;
                  return <option key={year} value={year}>{year}</option>;
                })}
              </select>

              <select
                value={selectedEmployee}
                onChange={(e) => setSelectedEmployee(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent min-w-48"
              >
                <option value="">All Employees</option>
                {employees.map(emp => (
                  <option key={emp._id} value={emp._id}>
                    {emp.firstName} {emp.lastName} ({emp.employeeId})
                  </option>
                ))}
              </select>

              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">All Status</option>
                <option value="pending">Pending</option>
                <option value="processing">Processing</option>
                <option value="paid">Paid</option>
                <option value="on-hold">On Hold</option>
              </select>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowAutomatedModal(true)}
                className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white px-4 py-2 rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all shadow-sm"
              >
                <Zap className="h-4 w-4" />
                Create Automated Payroll
              </button>

              <button
                onClick={() => setShowCreateModal(true)}
                className="flex items-center gap-2 bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
              >
                <Plus className="h-4 w-4" />
                Manual Payroll
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Payroll List */}
      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : error ? (
        <div className="text-center py-12">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <p className="text-gray-600">{error}</p>
        </div>
      ) : payrolls.length === 0 ? (
        <div className="text-center py-12">
          <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">No payroll records found for the selected criteria</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Employee
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Period
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Gross Salary
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
                {payrolls.map((payroll) => {
                  const StatusIcon = statusIcons[payroll.paymentStatus];
                  return (
                    <tr key={payroll._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {payroll.employeeId.firstName} {payroll.employeeId.lastName}
                          </div>
                          <div className="text-sm text-gray-500">
                            {payroll.employeeId.employeeId} • {payroll.employeeId.email}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatDate(payroll.salaryMonth)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatCurrency(payroll.grossSalary)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600">
                        {formatCurrency(payroll.netSalary)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[payroll.paymentStatus]}`}>
                          <StatusIcon className="h-3 w-3" />
                          {payroll.paymentStatus.charAt(0).toUpperCase() + payroll.paymentStatus.slice(1)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => {
                              setSelectedPayroll(payroll);
                              setShowViewModal(true);
                            }}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => {
                              // Open edit modal logic
                            }}
                            className="text-yellow-600 hover:text-yellow-900"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          {payroll.paymentStatus === 'pending' && (
                            <button
                              onClick={() => {
                                // Mark as paid logic
                              }}
                              className="text-green-600 hover:text-green-900"
                              title="Mark as Paid"
                            >
                              <CheckCircle className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="px-6 py-3 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-700">
                  Page {currentPage} of {totalPages}
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                    className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Automated Payroll Modal */}
      {showAutomatedModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                  <Zap className="h-5 w-5 text-blue-600" />
                  Create Automated Payroll
                </h2>
                <button
                  onClick={() => {
                    setShowAutomatedModal(false);
                    resetForm();
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Basic Information */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Employee *
                  </label>
                  <select
                    value={formData.employeeId}
                    onChange={(e) => handleEmployeeChange(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  >
                    <option value="">Select Employee</option>
                    {employees.map(emp => (
                      <option key={emp._id} value={emp._id}>
                        {emp.firstName} {emp.lastName} ({emp.employeeId})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Salary Month *
                  </label>
                  <input
                    type="month"
                    value={formData.salaryMonth}
                    onChange={(e) => setFormData({ ...formData, salaryMonth: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Basic Salary *
                  </label>
                  <input
                    type="number"
                    value={formData.basicSalary}
                    onChange={(e) => setFormData({ ...formData, basicSalary: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter basic salary"
                    required
                  />
                </div>
              </div>

              {/* Bank Details Auto-fetch */}
              {employeeBankDetails && (
                <div className="bg-green-50 p-4 rounded-lg">
                  <h4 className="font-medium text-green-800 mb-2 flex items-center gap-2">
                    <CheckCircle className="h-4 w-4" />
                    Bank Details (Auto-fetched from Employee Profile)
                  </h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Bank Name:</span> {employeeBankDetails.bankDetails.bankName || 'N/A'}
                    </div>
                    <div>
                      <span className="text-gray-600">Account Number:</span> {employeeBankDetails.bankDetails.accountNumber || 'N/A'}
                    </div>
                    <div>
                      <span className="text-gray-600">IFSC Code:</span> {employeeBankDetails.bankDetails.ifscCode || 'N/A'}
                    </div>
                    <div>
                      <span className="text-gray-600">Account Holder:</span> {employeeBankDetails.bankDetails.accountHolderName || 'N/A'}
                    </div>
                  </div>
                </div>
              )}

              {/* Optional Adjustments */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Optional Adjustments</h3>
                
                {/* Allowances */}
                <div className="mb-4">
                  <h4 className="font-medium text-gray-700 mb-2">Allowances (Leave blank for auto-calculation)</h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    <div>
                      <label className="text-sm text-gray-600">HRA</label>
                      <input
                        type="number"
                        value={formData.allowances.hra}
                        onChange={(e) => setFormData({
                          ...formData,
                          allowances: { ...formData.allowances, hra: e.target.value }
                        })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                        placeholder="Auto: 30% of basic"
                      />
                    </div>
                    <div>
                      <label className="text-sm text-gray-600">Transport</label>
                      <input
                        type="number"
                        value={formData.allowances.transport}
                        onChange={(e) => setFormData({
                          ...formData,
                          allowances: { ...formData.allowances, transport: e.target.value }
                        })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                        placeholder="Auto: ₹2,000"
                      />
                    </div>
                    <div>
                      <label className="text-sm text-gray-600">Medical</label>
                      <input
                        type="number"
                        value={formData.allowances.medical}
                        onChange={(e) => setFormData({
                          ...formData,
                          allowances: { ...formData.allowances, medical: e.target.value }
                        })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                        placeholder="Auto: ₹1,500"
                      />
                    </div>
                  </div>
                </div>

                {/* Deductions */}
                <div className="mb-4">
                  <h4 className="font-medium text-gray-700 mb-2">Deductions (Leave blank for auto-calculation)</h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    <div>
                      <label className="text-sm text-gray-600">Income Tax</label>
                      <input
                        type="number"
                        value={formData.deductions.tax}
                        onChange={(e) => setFormData({
                          ...formData,
                          deductions: { ...formData.deductions, tax: e.target.value }
                        })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                        placeholder="Auto-calculated"
                      />
                    </div>
                    <div>
                      <label className="text-sm text-gray-600">Provident Fund</label>
                      <input
                        type="number"
                        value={formData.deductions.providentFund}
                        onChange={(e) => setFormData({
                          ...formData,
                          deductions: { ...formData.deductions, providentFund: e.target.value }
                        })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                        placeholder="Auto: 12% of basic"
                      />
                    </div>
                    <div>
                      <label className="text-sm text-gray-600">Loan Deduction</label>
                      <input
                        type="number"
                        value={formData.deductions.loan}
                        onChange={(e) => setFormData({
                          ...formData,
                          deductions: { ...formData.deductions, loan: e.target.value }
                        })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                        placeholder="0"
                      />
                    </div>
                  </div>
                </div>

                {/* Bonus */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Bonus Amount
                  </label>
                  <input
                    type="number"
                    value={formData.bonusAmount}
                    onChange={(e) => setFormData({ ...formData, bonusAmount: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter bonus amount"
                  />
                </div>

                {/* Remarks */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Remarks
                  </label>
                  <textarea
                    value={formData.remarks}
                    onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows={3}
                    placeholder="Enter any remarks or notes"
                  />
                </div>
              </div>

              {/* Info Box */}
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="flex items-start gap-3">
                  <Info className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div className="text-sm text-blue-800">
                    <p className="font-medium mb-1">Automated Calculations Include:</p>
                    <ul className="list-disc list-inside space-y-1 text-blue-700">
                      <li>Working days calculation based on attendance records</li>
                      <li>Leave days deduction from approved leave applications</li>
                      <li>Overtime calculation from attendance records</li>
                      <li>Automatic tax calculation based on salary slabs</li>
                      <li>Bank details auto-fetch from employee profile</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="px-6 py-4 border-t bg-gray-50 flex justify-between">
              <button
                onClick={() => {
                  setShowAutomatedModal(false);
                  resetForm();
                }}
                className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>

              <div className="flex gap-3">
                <button
                  onClick={calculateAutomatedPayroll}
                  disabled={isCalculating || !formData.employeeId || !formData.basicSalary}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isCalculating ? (
                    <RefreshCw className="h-4 w-4 animate-spin" />
                  ) : (
                    <Calculator className="h-4 w-4" />
                  )}
                  Calculate & Preview
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Preview Modal */}
      {showPreviewModal && calculationResult && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-6xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900">Payroll Calculation Preview</h2>
                <button
                  onClick={() => setShowPreviewModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="p-6">
              <SalaryBreakdown breakdown={calculationResult.breakdown} />
            </div>

            <div className="px-6 py-4 border-t bg-gray-50 flex justify-between">
              <button
                onClick={() => setShowPreviewModal(false)}
                className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Back to Edit
              </button>

              <button
                onClick={createAutomatedPayroll}
                className="flex items-center gap-2 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <CheckCircle className="h-4 w-4" />
                Create Payroll
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Payroll Modal */}
      {showViewModal && selectedPayroll && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900">Payroll Details</h2>
                <button
                  onClick={() => setShowViewModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="p-6">
              {/* Employee Info */}
              <div className="grid grid-cols-2 gap-6 mb-6">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-3">Employee Information</h3>
                  <div className="space-y-2 text-sm">
                    <div><span className="font-medium">Name:</span> {selectedPayroll.employeeId?.firstName} {selectedPayroll.employeeId?.lastName}</div>
                    <div><span className="font-medium">Employee ID:</span> {selectedPayroll.employeeCode}</div>
                    <div><span className="font-medium">Email:</span> {selectedPayroll.employeeId?.email}</div>
                    <div><span className="font-medium">Department:</span> {selectedPayroll.employeeId?.department}</div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-3">Payroll Information</h3>
                  <div className="space-y-2 text-sm">
                    <div><span className="font-medium">Salary Month:</span> {formatDate(selectedPayroll.salaryMonth)}</div>
                    <div><span className="font-medium">Payment Status:</span> 
                      <span className={`ml-2 px-2 py-1 rounded-full text-xs ${statusColors[selectedPayroll.paymentStatus]}`}>
                        {selectedPayroll.paymentStatus}
                      </span>
                    </div>
                    <div><span className="font-medium">Payment Method:</span> {selectedPayroll.paymentMethod}</div>
                    {selectedPayroll.paymentDate && (
                      <div><span className="font-medium">Payment Date:</span> {formatDate(selectedPayroll.paymentDate)}</div>
                    )}
                  </div>
                </div>
              </div>

              {/* Salary Breakdown */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                {/* Earnings */}
                <div className="bg-green-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-green-800 mb-3">Earnings</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Basic Salary:</span>
                      <span className="font-medium">{formatCurrency(selectedPayroll.basicSalary)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>HRA:</span>
                      <span className="font-medium">{formatCurrency(selectedPayroll.allowances?.hra || 0)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Transport:</span>
                      <span className="font-medium">{formatCurrency(selectedPayroll.allowances?.transport || 0)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Medical:</span>
                      <span className="font-medium">{formatCurrency(selectedPayroll.allowances?.medical || 0)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Performance:</span>
                      <span className="font-medium">{formatCurrency(selectedPayroll.allowances?.performance || 0)}</span>
                    </div>
                    {selectedPayroll.bonus > 0 && (
                      <div className="flex justify-between">
                        <span>Bonus:</span>
                        <span className="font-medium">{formatCurrency(selectedPayroll.bonus)}</span>
                      </div>
                    )}
                    {selectedPayroll.overtime?.amount > 0 && (
                      <div className="flex justify-between">
                        <span>Overtime:</span>
                        <span className="font-medium">{formatCurrency(selectedPayroll.overtime.amount)}</span>
                      </div>
                    )}
                    <div className="border-t pt-2 flex justify-between font-semibold text-green-800">
                      <span>Gross Salary:</span>
                      <span>{formatCurrency(selectedPayroll.grossSalary)}</span>
                    </div>
                  </div>
                </div>

                {/* Deductions */}
                <div className="bg-red-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-red-800 mb-3">Deductions</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Income Tax:</span>
                      <span className="font-medium">{formatCurrency(selectedPayroll.deductions?.tax || 0)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Provident Fund:</span>
                      <span className="font-medium">{formatCurrency(selectedPayroll.deductions?.providentFund || 0)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Insurance:</span>
                      <span className="font-medium">{formatCurrency(selectedPayroll.deductions?.insurance || 0)}</span>
                    </div>
                    {(selectedPayroll.deductions?.loan || 0) > 0 && (
                      <div className="flex justify-between">
                        <span>Loan:</span>
                        <span className="font-medium">{formatCurrency(selectedPayroll.deductions.loan)}</span>
                      </div>
                    )}
                    <div className="border-t pt-2 flex justify-between font-semibold text-red-800">
                      <span>Total Deductions:</span>
                      <span>{formatCurrency(selectedPayroll.totalDeductions)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Net Salary */}
              <div className="bg-blue-50 p-4 rounded-lg mb-6">
                <div className="flex justify-between items-center">
                  <h4 className="font-semibold text-blue-800">Net Salary</h4>
                  <span className="text-2xl font-bold text-blue-800">
                    {formatCurrency(selectedPayroll.netSalary)}
                  </span>
                </div>
              </div>

              {/* Working Days */}
              <div className="bg-gray-50 p-4 rounded-lg mb-6">
                <h4 className="font-semibold text-gray-800 mb-3">Attendance Details</h4>
                <div className="grid grid-cols-4 gap-4 text-sm text-center">
                  <div>
                    <div className="text-lg font-semibold text-blue-600">{selectedPayroll.workingDays?.total || 0}</div>
                    <div className="text-gray-600">Total Days</div>
                  </div>
                  <div>
                    <div className="text-lg font-semibold text-green-600">{selectedPayroll.workingDays?.present || 0}</div>
                    <div className="text-gray-600">Present Days</div>
                  </div>
                  <div>
                    <div className="text-lg font-semibold text-orange-600">{selectedPayroll.workingDays?.leave || 0}</div>
                    <div className="text-gray-600">Leave Days</div>
                  </div>
                  <div>
                    <div className="text-lg font-semibold text-red-600">{selectedPayroll.workingDays?.absent || 0}</div>
                    <div className="text-gray-600">Absent Days</div>
                  </div>
                </div>
              </div>

              {/* Bank Details */}
              {selectedPayroll.bankDetails && (
                <div className="bg-gray-50 p-4 rounded-lg mb-6">
                  <h4 className="font-semibold text-gray-800 mb-3">Bank Details</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Bank Name:</span> {selectedPayroll.bankDetails.bankName || 'N/A'}
                    </div>
                    <div>
                      <span className="text-gray-600">Account Number:</span> {selectedPayroll.bankDetails.accountNumber || 'N/A'}
                    </div>
                    <div>
                      <span className="text-gray-600">IFSC Code:</span> {selectedPayroll.bankDetails.ifscCode || 'N/A'}
                    </div>
                    {selectedPayroll.bankDetails.transactionId && (
                      <div>
                        <span className="text-gray-600">Transaction ID:</span> {selectedPayroll.bankDetails.transactionId}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Remarks */}
              {selectedPayroll.remarks && (
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-gray-800 mb-2">Remarks</h4>
                  <p className="text-sm text-gray-700">{selectedPayroll.remarks}</p>
                </div>
              )}
            </div>

            <div className="px-6 py-4 border-t bg-gray-50 flex justify-end">
              <button
                onClick={() => setShowViewModal(false)}
                className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AutomatedPayrollManagement;