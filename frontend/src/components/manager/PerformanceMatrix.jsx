import React, { useState, useEffect } from 'react';
import {
    Award,
    CheckCircle,
    XCircle,
    Edit2,
    Send,
    Clock,
    TrendingUp,
    FileText,
    Lock,
    Target,
    Users,
    BarChart3,
    PieChart
} from 'lucide-react';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import PerformanceEditModal from './PerformanceEditModal';
import PerformanceAuditModal from './PerformanceAuditModal';
import PerformanceDetailModal from './PerformanceDetailModal';

const PerformanceMatrix = () => {
    const [evaluations, setEvaluations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedEvaluation, setSelectedEvaluation] = useState(null);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showAuditModal, setShowAuditModal] = useState(false);
    const [filterStatus, setFilterStatus] = useState('all');
    const [filterPeriod, setFilterPeriod] = useState('current-month');

    // New state for performance reports
    const [selectedEmployee, setSelectedEmployee] = useState('all');
    const [employees, setEmployees] = useState([]);
    const [reportData, setReportData] = useState(null);
    const [reportLoading, setReportLoading] = useState(true);

    // Detail Modal State
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [detailedEmployeeData, setDetailedEmployeeData] = useState(null);

    useEffect(() => {
        fetchPerformanceReport();
    }, [selectedEmployee, filterPeriod]);

    useEffect(() => {
        fetchEvaluations();
    }, [filterStatus, filterPeriod, selectedEmployee]);

    const fetchPerformanceReport = async () => {
        try {
            setReportLoading(true);
            const params = {
                employeeId: selectedEmployee,
                period: filterPeriod
            };

            const response = await api.get('/performance-reports', { params });

            if (response.data.success) {
                setReportData(response.data.data);
                setEmployees(response.data.data.employees || []);
            }
        } catch (error) {
            console.error('Error fetching performance report:', error);
        } finally {
            setReportLoading(false);
        }
    };

    const fetchEvaluations = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (filterStatus !== 'all') params.append('status', filterStatus);
            if (filterPeriod !== 'all') params.append('period', filterPeriod);
            if (selectedEmployee !== 'all') params.append('employeeId', selectedEmployee);

            const response = await api.get(`/performance-evaluations?${params.toString()}`);
            setEvaluations(response.data.data || []);
        } catch (error) {
            console.error('Error fetching evaluations:', error);
            toast.error('Failed to load performance evaluations');
        } finally {
            setLoading(false);
        }
    };

    const handleViewFullReport = (employee) => {
        // Find if we already have detailed data for this employee in reportData
        if (selectedEmployee === employee.id && reportData?.employeeDetails) {
            setDetailedEmployeeData({
                employee: employee,
                data: reportData
            });
            setShowDetailModal(true);
        } else {
            // Need to fetch fresh data for this specific employee first
            toast.promise(
                api.get('/performance-reports', {
                    params: { employeeId: employee.id, period: filterPeriod }
                }).then(res => {
                    setDetailedEmployeeData({
                        employee: employee,
                        data: res.data.data
                    });
                    setShowDetailModal(true);
                }),
                {
                    loading: 'Preparing full report...',
                    success: 'Report ready!',
                    error: 'Could not load background data'
                }
            );
        }
    };

    const handleApprove = async (evaluationId) => {
        const comments = prompt('Add approval comments (optional):');

        try {
            await api.post(`/performance-evaluations/${evaluationId}/approve`, { comments });
            toast.success('Evaluation approved successfully!');
            fetchEvaluations();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to approve evaluation');
        }
    };

    const handleReject = async (evaluationId) => {
        const reason = prompt('Please provide a reason for rejection:');

        if (!reason) {
            toast.error('Rejection reason is required');
            return;
        }

        try {
            await api.post(`/performance-evaluations/${evaluationId}/reject`, { reason });
            toast.success('Evaluation rejected and sent back to draft');
            fetchEvaluations();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to reject evaluation');
        }
    };

    const handleSendToHR = async (evaluationId) => {
        if (!confirm('Send this approved evaluation to HR?')) return;

        try {
            await api.post(`/performance-evaluations/${evaluationId}/send-to-hr`);
            toast.success('Evaluation sent to HR successfully!');
            fetchEvaluations();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to send to HR');
        }
    };

    const getStatusBadge = (status) => {
        const badges = {
            'draft': { color: 'bg-gray-100 text-gray-700', icon: Clock, label: 'Draft' },
            'edited': { color: 'bg-blue-100 text-blue-700', icon: Edit2, label: 'Edited' },
            'approved': { color: 'bg-green-100 text-green-700', icon: CheckCircle, label: 'Approved' },
            'locked': { color: 'bg-purple-100 text-purple-700', icon: Lock, label: 'Locked' },
            'sent_to_hr': { color: 'bg-orange-100 text-orange-700', icon: Send, label: 'Sent to HR' },
            'payroll_generated': { color: 'bg-teal-100 text-teal-700', icon: Award, label: 'Payroll Done' }
        };

        const badge = badges[status] || badges.draft;
        const Icon = badge.icon;

        return (
            <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold ${badge.color}`}>
                <Icon className="h-3 w-3" />
                {badge.label}
            </span>
        );
    };

    const getGradeBadge = (grade) => {
        const colors = {
            'A': 'bg-green-500',
            'B': 'bg-blue-500',
            'C': 'bg-yellow-500',
            'D': 'bg-orange-500',
            'F': 'bg-red-500'
        };

        return (
            <div className={`h-8 w-8 rounded-full ${colors[grade] || 'bg-gray-500'} flex items-center justify-center text-white font-bold`}>
                {grade}
            </div>
        );
    };

    const canEdit = (evaluation) => {
        return !['approved', 'locked', 'sent_to_hr', 'payroll_generated'].includes(evaluation.status);
    };

    const canApprove = (evaluation) => {
        return ['draft', 'edited'].includes(evaluation.status);
    };

    const canSendToHR = (evaluation) => {
        return evaluation.status === 'approved';
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">Employee Performance Matrix</h2>
                    <p className="text-gray-600 mt-1">Manage team performance evaluations and approvals</p>
                </div>
                <button
                    onClick={() => {/* Create new evaluation */ }}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium shadow-sm transition-all active:scale-95"
                >
                    + Create Evaluation
                </button>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Period</label>
                        <select
                            value={filterPeriod}
                            onChange={(e) => setFilterPeriod(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 transition-all"
                        >
                            <option value="current-month">Current Month</option>
                            <option value="current-quarter">Current Quarter</option>
                            <option value="all-time">All Time</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Filter Table Status</label>
                        <select
                            value={filterStatus}
                            onChange={(e) => setFilterStatus(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 transition-all"
                        >
                            <option value="all">All Statuses</option>
                            <option value="draft">Draft</option>
                            <option value="edited">Edited</option>
                            <option value="approved">Approved</option>
                            <option value="sent_to_hr">Sent to HR</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Summary Statistics */}
            {reportLoading ? (
                <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-dashed border-gray-200">
                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mb-4"></div>
                    <p className="text-gray-500 font-medium">Crunching team data...</p>
                </div>
            ) : reportData ? (
                <>
                    {/* Summary Cards */}
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                            <div className="flex items-center gap-2 mb-2">
                                <Target className="h-4 w-4 text-blue-600" />
                                <p className="text-xs text-gray-600 font-bold uppercase tracking-wider">Total Tasks</p>
                            </div>
                            <p className="text-2xl font-black text-gray-900">{reportData.summary.totalTasks}</p>
                        </div>

                        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                            <div className="flex items-center gap-2 mb-2">
                                <CheckCircle className="h-4 w-4 text-green-600" />
                                <p className="text-xs text-gray-600 font-bold uppercase tracking-wider">Completed</p>
                            </div>
                            <p className="text-2xl font-black text-green-600">{reportData.summary.completedTasks}</p>
                        </div>

                        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                            <div className="flex items-center gap-2 mb-2">
                                <Clock className="h-4 w-4 text-blue-400" />
                                <p className="text-xs text-gray-600 font-bold uppercase tracking-wider">In Progress</p>
                            </div>
                            <p className="text-2xl font-black text-blue-500">{reportData.summary.inProgressTasks}</p>
                        </div>

                        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                            <div className="flex items-center gap-2 mb-2">
                                <TrendingUp className="h-4 w-4 text-red-600" />
                                <p className="text-xs text-gray-600 font-bold uppercase tracking-wider">Overdue</p>
                            </div>
                            <p className="text-2xl font-black text-red-600">{reportData.summary.overdueTasks}</p>
                        </div>

                        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                            <div className="flex items-center gap-2 mb-2">
                                <Award className="h-4 w-4 text-purple-600" />
                                <p className="text-xs text-gray-600 font-bold uppercase tracking-wider">Total Points</p>
                            </div>
                            <p className="text-2xl font-black text-purple-600 tracking-tight">{reportData.summary.totalPoints}</p>
                        </div>

                        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                            <div className="flex items-center gap-2 mb-2">
                                <Users className="h-4 w-4 text-orange-600" />
                                <p className="text-xs text-gray-600 font-bold uppercase tracking-wider">Team Size</p>
                            </div>
                            <p className="text-2xl font-black text-orange-600">{reportData.summary.teamSize}</p>
                        </div>
                    </div>

                    {/* Charts Section */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Task Distribution */}
                        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
                            <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                                <PieChart className="h-5 w-5 text-blue-600" />
                                Task Distribution
                            </h3>
                            <div className="space-y-4">
                                {Object.entries(reportData.taskDistribution).map(([status, count]) => (
                                    <div key={status}>
                                        <div className="flex justify-between text-sm mb-1">
                                            <span className="text-gray-600 font-medium">{status}</span>
                                            <span className="font-bold text-gray-900">{count}</span>
                                        </div>
                                        <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
                                            <div
                                                className={`h-full rounded-full transition-all duration-1000 ${status === 'Completed' ? 'bg-green-500' :
                                                    status === 'In Progress' ? 'bg-blue-500' :
                                                        status === 'Review' ? 'bg-yellow-500' :
                                                            status === 'Overdue' ? 'bg-red-500' :
                                                                'bg-gray-400'
                                                    }`}
                                                style={{ width: `${reportData.summary.totalTasks > 0 ? (count / reportData.summary.totalTasks) * 100 : 0}%` }}
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Top Performers */}
                        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
                            <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                                <TrendingUp className="h-5 w-5 text-purple-600" />
                                Performance Leaderboard
                            </h3>
                            <div className="space-y-3">
                                {reportData.topPerformers?.length > 0 ? (
                                    reportData.topPerformers.slice(0, 5).map((performer, index) => (
                                        <div key={performer.id || index} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-transparent hover:border-gray-200 transition-all">
                                            <div className="flex items-center gap-3">
                                                <div className={`h-10 w-10 rounded-full flex items-center justify-center font-black text-sm shadow-sm ${index === 0 ? 'bg-yellow-400 text-yellow-900' :
                                                    index === 1 ? 'bg-gray-300 text-gray-700' :
                                                        index === 2 ? 'bg-orange-300 text-orange-900' :
                                                            'bg-white text-gray-500 border border-gray-200'
                                                    }`}>
                                                    {index + 1}
                                                </div>
                                                <div>
                                                    <p className="font-bold text-gray-900">{performer.name}</p>
                                                    <p className="text-[10px] text-gray-400 font-bold uppercase">{performer.role}</p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-sm font-black text-purple-600">{performer.points} pts</p>
                                                <p className="text-[10px] text-gray-500 font-bold uppercase">{performer.tasks} COMPLETED</p>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="flex flex-col items-center justify-center py-10 opacity-50">
                                        <Award className="h-12 w-12 text-gray-300 mb-2" />
                                        <p className="text-gray-500 text-sm">No medals earned yet</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Employee List Section */}
                    <div className="mt-8">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                                <Users className="h-5 w-5 text-orange-500" />
                                Select Team Member
                            </h3>
                            {selectedEmployee !== 'all' && (
                                <button
                                    onClick={() => setSelectedEmployee('all')}
                                    className="text-xs font-bold text-blue-600 hover:underline"
                                >
                                    Reset Selection
                                </button>
                            )}
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {/* All Employees Card */}
                            <div
                                onClick={() => setSelectedEmployee('all')}
                                className={`group relative bg-white rounded-2xl p-6 border-2 cursor-pointer transition-all duration-300 shadow-sm hover:shadow-md ${selectedEmployee === 'all'
                                    ? 'border-blue-600 ring-4 ring-blue-50 bg-blue-50/30'
                                    : 'border-gray-100 hover:border-blue-200'
                                    }`}
                            >
                                <div className="flex items-center justify-between mb-4">
                                    <div className="h-12 w-12 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600 group-hover:scale-110 transition-transform">
                                        <Users className="h-6 w-6" />
                                    </div>
                                    {selectedEmployee === 'all' && (
                                        <div className="h-6 w-6 rounded-full bg-blue-600 flex items-center justify-center shadow-lg animate-in zoom-in">
                                            <CheckCircle className="h-4 w-4 text-white" />
                                        </div>
                                    )}
                                </div>
                                <h4 className="font-black text-gray-900 text-lg">Team Overview</h4>
                                <p className="text-xs text-gray-500 font-medium">Combined metrics for all colleagues</p>
                            </div>

                            {/* Individual Employee Cards */}
                            {employees.map((employee) => {
                                const performer = reportData.topPerformers?.find(p => p.id === employee.id);
                                const isSelected = selectedEmployee === employee.id;

                                return (
                                    <div
                                        key={employee.id}
                                        onClick={() => setSelectedEmployee(employee.id)}
                                        className={`group relative bg-white rounded-2xl p-6 border-2 cursor-pointer transition-all duration-300 shadow-sm hover:shadow-md ${isSelected
                                            ? 'border-blue-600 ring-4 ring-blue-50 bg-blue-50/30'
                                            : 'border-gray-100 hover:border-blue-200'
                                            }`}
                                    >
                                        <div className="flex items-center justify-between mb-4">
                                            <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center text-gray-600 font-black text-lg group-hover:scale-110 transition-transform">
                                                {employee.name.split(' ').map(n => n[0]).join('')}
                                            </div>
                                            {isSelected && (
                                                <div className="h-6 w-6 rounded-full bg-blue-600 flex items-center justify-center shadow-lg animate-in zoom-in">
                                                    <CheckCircle className="h-4 w-4 text-white" />
                                                </div>
                                            )}
                                        </div>
                                        <h4 className="font-black text-gray-900 text-lg truncate">{employee.name}</h4>
                                        <div className="flex items-center gap-2 mt-1 mb-4">
                                            <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest ${employee.role === 'developer' ? 'bg-green-100 text-green-700' :
                                                employee.role === 'team-lead' ? 'bg-purple-100 text-purple-700' :
                                                    'bg-gray-100 text-gray-600'
                                                }`}>
                                                {employee.role}
                                            </span>
                                        </div>

                                        <div className="flex justify-between items-end mt-4 mb-4">
                                            <div className="text-[10px] font-bold text-gray-400 uppercase">
                                                Points: <span className="text-purple-600">{performer?.points || 0}</span>
                                            </div>
                                            <div className="text-[10px] font-bold text-gray-400 uppercase">
                                                Tasks: <span className="text-gray-900">{performer?.completedTasks || 0}</span>
                                            </div>
                                        </div>

                                        <div className="mt-4">
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleViewFullReport(employee);
                                                }}
                                                className="w-full py-2.5 bg-gray-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-black transition-all flex items-center justify-center gap-2 group-hover:shadow-lg active:scale-95"
                                            >
                                                <FileText className="h-3.5 w-3.5" />
                                                View Detailed Report
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Evaluations Table Section */}
                    <div className="mt-12 bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                            <h3 className="font-bold text-gray-900 flex items-center gap-2">
                                <Award className="h-5 w-5 text-yellow-500" />
                                Official Performance Matrix
                            </h3>
                            <span className="px-3 py-1 bg-gray-100 rounded-full text-[10px] font-bold text-gray-500">
                                {evaluations.length} RECORDS FOUND
                            </span>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50/50">
                                    <tr>
                                        <th className="px-6 py-4 text-left text-[10px] font-black text-gray-500 uppercase tracking-widest">Employee</th>
                                        <th className="px-6 py-4 text-left text-[10px] font-black text-gray-500 uppercase tracking-widest">Period</th>
                                        <th className="px-6 py-4 text-left text-[10px] font-black text-gray-500 uppercase tracking-widest text-center">Score</th>
                                        <th className="px-6 py-4 text-left text-[10px] font-black text-gray-500 uppercase tracking-widest text-center">Grade</th>
                                        <th className="px-6 py-4 text-left text-[10px] font-black text-gray-500 uppercase tracking-widest">Status</th>
                                        <th className="px-6 py-4 text-right text-[10px] font-black text-gray-500 uppercase tracking-widest">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-100">
                                    {evaluations.length === 0 ? (
                                        <tr>
                                            <td colSpan="6" className="px-6 py-12 text-center text-gray-400 font-medium">
                                                No formal evaluations found for this criteria.
                                            </td>
                                        </tr>
                                    ) : (
                                        evaluations.map((evaluation) => (
                                            <tr key={evaluation._id} className="hover:bg-gray-50/50 transition-colors">
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="flex items-center">
                                                        <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-xs">
                                                            {evaluation.employee.firstName[0]}{evaluation.employee.lastName[0]}
                                                        </div>
                                                        <div className="ml-3">
                                                            <div className="text-sm font-bold text-gray-900">
                                                                {evaluation.employee.firstName} {evaluation.employee.lastName}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-500 font-medium">
                                                    {new Date(evaluation.evaluationPeriod.startDate).toLocaleDateString()} - {new Date(evaluation.evaluationPeriod.endDate).toLocaleDateString()}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-center">
                                                    <div className="text-lg font-black text-gray-900">{evaluation.derivedFields.totalScore}</div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-center">
                                                    {getGradeBadge(evaluation.derivedFields.grade)}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    {getStatusBadge(evaluation.status)}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-right">
                                                    <div className="flex items-center justify-end gap-2">
                                                        {canEdit(evaluation) && (
                                                            <button
                                                                onClick={() => {
                                                                    setSelectedEvaluation(evaluation);
                                                                    setShowEditModal(true);
                                                                }}
                                                                className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                                title="Edit"
                                                            >
                                                                <Edit2 className="h-4 w-4" />
                                                            </button>
                                                        )}
                                                        <button
                                                            onClick={() => {
                                                                setSelectedEvaluation(evaluation);
                                                                setShowAuditModal(true);
                                                            }}
                                                            className="p-1.5 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
                                                            title="History"
                                                        >
                                                            <FileText className="h-4 w-4" />
                                                        </button>
                                                        {canApprove(evaluation) && (
                                                            <button
                                                                onClick={() => handleApprove(evaluation._id)}
                                                                className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                                                                title="Approve"
                                                            >
                                                                <CheckCircle className="h-4 w-4" />
                                                            </button>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </>
            ) : (
                <div className="bg-white rounded-2xl p-20 text-center shadow-sm border border-gray-200">
                    <FileText className="h-16 w-16 text-gray-200 mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-gray-900 mb-2">Patience is a virtue</h3>
                    <p className="text-gray-500 max-w-sm mx-auto">We're waiting for team metrics to sync. Try choosing a broader period if nothing shows up.</p>
                </div>
            )}

            {/* Performance Detail Modal */}
            <PerformanceDetailModal
                isOpen={showDetailModal}
                onClose={() => setShowDetailModal(false)}
                employee={detailedEmployeeData?.employee}
                data={detailedEmployeeData?.data}
            />

            {/* Legacy Modals */}
            {showEditModal && selectedEvaluation && (
                <PerformanceEditModal
                    evaluation={selectedEvaluation}
                    onClose={() => {
                        setShowEditModal(false);
                        setSelectedEvaluation(null);
                    }}
                    onSave={() => {
                        fetchEvaluations();
                        setShowEditModal(false);
                        setSelectedEvaluation(null);
                    }}
                />
            )}

            {showAuditModal && selectedEvaluation && (
                <PerformanceAuditModal
                    evaluationId={selectedEvaluation._id}
                    employeeName={`${selectedEvaluation.employee.firstName} ${selectedEvaluation.employee.lastName}`}
                    onClose={() => {
                        setShowAuditModal(false);
                        setSelectedEvaluation(null);
                    }}
                />
            )}
        </div>
    );
};

export default PerformanceMatrix;
