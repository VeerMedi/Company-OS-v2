import React, { useState, useEffect } from 'react';
import { Award, Download, FileText, Lock, DollarSign } from 'lucide-react';
import api from '../../utils/api';
import toast from 'react-hot-toast';

const HRPerformanceView = () => {
    const [evaluations, setEvaluations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filterPeriod, setFilterPeriod] = useState('current-month');

    useEffect(() => {
        fetchApprovedEvaluations();
    }, [filterPeriod]);

    const fetchApprovedEvaluations = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            params.append('status', 'approved,sent_to_hr,payroll_generated');
            if (filterPeriod !== 'all') params.append('period', filterPeriod);

            const response = await api.get(`/performance-evaluations?${params.toString()}`);
            setEvaluations(response.data.data || []);
        } catch (error) {
            console.error('Error fetching evaluations:', error);
            toast.error('Failed to load approved evaluations');
        } finally {
            setLoading(false);
        }
    };

    const handleExport = () => {
        toast.success('Export feature coming soon!');
    };

    const getStatusBadge = (status) => {
        const badges = {
            'approved': { color: 'bg-green-100 text-green-700', label: 'Approved' },
            'sent_to_hr': { color: 'bg-orange-100 text-orange-700', label: 'Sent to HR' },
            'payroll_generated': { color: 'bg-teal-100 text-teal-700', label: 'Payroll Done' }
        };

        const badge = badges[status] || badges.approved;

        return (
            <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold ${badge.color}`}>
                {badge.label}
            </span>
        );
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">Approved Performance Evaluations</h2>
                    <p className="text-gray-600 mt-1">View and export approved evaluations for payroll processing</p>
                </div>
                <button
                    onClick={handleExport}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium flex items-center gap-2"
                >
                    <Download className="h-5 w-5" />
                    Export Report
                </button>
            </div>

            {/* Filter */}
            <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
                <div className="flex items-center gap-4">
                    <label className="text-sm font-medium text-gray-700">Period:</label>
                    <select
                        value={filterPeriod}
                        onChange={(e) => setFilterPeriod(e.target.value)}
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="current-month">Current Month</option>
                        <option value="current-quarter">Current Quarter</option>
                        <option value="all">All Time</option>
                    </select>
                </div>
            </div>

            {/* Evaluations Table */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase">Employee</th>
                                <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase">Period</th>
                                <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase">Score</th>
                                <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase">Grade</th>
                                <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase">Multiplier</th>
                                <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase">Approved By</th>
                                <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase">Status</th>
                                <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {evaluations.length === 0 ? (
                                <tr>
                                    <td colSpan="8" className="px-6 py-12 text-center text-gray-500">
                                        No approved evaluations found
                                    </td>
                                </tr>
                            ) : (
                                evaluations.map((evaluation) => (
                                    <tr key={evaluation._id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center">
                                                <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold">
                                                    {evaluation.employee.firstName[0]}{evaluation.employee.lastName[0]}
                                                </div>
                                                <div className="ml-3">
                                                    <div className="text-sm font-bold text-gray-900">
                                                        {evaluation.employee.firstName} {evaluation.employee.lastName}
                                                    </div>
                                                    <div className="text-xs text-gray-500">{evaluation.employee.employeeId}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            {new Date(evaluation.evaluationPeriod.startDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-2xl font-bold text-gray-900">{evaluation.derivedFields.totalScore}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className={`h-8 w-8 rounded-full flex items-center justify-center text-white font-bold ${evaluation.derivedFields.grade === 'A' ? 'bg-green-500' :
                                                    evaluation.derivedFields.grade === 'B' ? 'bg-blue-500' :
                                                        evaluation.derivedFields.grade === 'C' ? 'bg-yellow-500' :
                                                            evaluation.derivedFields.grade === 'D' ? 'bg-orange-500' :
                                                                'bg-red-500'
                                                }`}>
                                                {evaluation.derivedFields.grade}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className="text-lg font-bold text-green-600">
                                                {evaluation.derivedFields.payrollMultiplier}x
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            {evaluation.managerApproval?.approvedBy?.firstName} {evaluation.managerApproval?.approvedBy?.lastName}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {getStatusBadge(evaluation.status)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                                            <div className="flex items-center gap-2">
                                                <button
                                                    className="text-blue-600 hover:text-blue-800"
                                                    title="View Details"
                                                >
                                                    <FileText className="h-4 w-4" />
                                                </button>
                                                {evaluation.status === 'sent_to_hr' && (
                                                    <button
                                                        className="text-green-600 hover:text-green-800"
                                                        title="Generate Payroll"
                                                    >
                                                        <DollarSign className="h-4 w-4" />
                                                    </button>
                                                )}
                                                {evaluation.status === 'payroll_generated' && (
                                                    <Lock className="h-4 w-4 text-gray-400" title="Locked" />
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

            {/* Summary Stats */}
            {evaluations.length > 0 && (
                <div className="grid grid-cols-4 gap-4">
                    <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg p-6 text-white">
                        <p className="text-blue-100 text-sm mb-2">Total Evaluations</p>
                        <p className="text-4xl font-bold">{evaluations.length}</p>
                    </div>
                    <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg p-6 text-white">
                        <p className="text-green-100 text-sm mb-2">Average Score</p>
                        <p className="text-4xl font-bold">
                            {Math.round(evaluations.reduce((sum, e) => sum + e.derivedFields.totalScore, 0) / evaluations.length)}
                        </p>
                    </div>
                    <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg p-6 text-white">
                        <p className="text-purple-100 text-sm mb-2">Grade A Count</p>
                        <p className="text-4xl font-bold">
                            {evaluations.filter(e => e.derivedFields.grade === 'A').length}
                        </p>
                    </div>
                    <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg p-6 text-white">
                        <p className="text-orange-100 text-sm mb-2">Pending Payroll</p>
                        <p className="text-4xl font-bold">
                            {evaluations.filter(e => e.status === 'sent_to_hr').length}
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
};

export default HRPerformanceView;
