import React, { useState, useEffect } from 'react';
import { Award, TrendingUp, Calendar, CheckCircle } from 'lucide-react';
import api from '../../utils/api';
import toast from 'react-hot-toast';

const EmployeePerformanceSummary = ({ employeeId }) => {
    const [evaluations, setEvaluations] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchMyEvaluations();
    }, [employeeId]);

    const fetchMyEvaluations = async () => {
        setLoading(true);
        try {
            const currentEmployeeId = employeeId || 'me'; // Use 'me' for current user
            const response = await api.get(`/performance-evaluations/employee/${currentEmployeeId}`);
            setEvaluations(response.data.data || []);
        } catch (error) {
            console.error('Error fetching evaluations:', error);
            toast.error('Failed to load performance history');
        } finally {
            setLoading(false);
        }
    };

    const getGradeColor = (grade) => {
        const colors = {
            'A': 'from-green-500 to-green-600',
            'B': 'from-blue-500 to-blue-600',
            'C': 'from-yellow-500 to-yellow-600',
            'D': 'from-orange-500 to-orange-600',
            'F': 'from-red-500 to-red-600'
        };
        return colors[grade] || 'from-gray-500 to-gray-600';
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    if (evaluations.length === 0) {
        return (
            <div className="text-center py-12">
                <Award className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Performance Evaluations Yet</h3>
                <p className="text-gray-600">Your approved performance evaluations will appear here</p>
            </div>
        );
    }

    const latestEvaluation = evaluations[0];

    return (
        <div className="space-y-6">
            {/* Latest Evaluation Card */}
            <div className={`bg-gradient-to-br ${getGradeColor(latestEvaluation.derivedFields.grade)} rounded-2xl p-8 text-white shadow-2xl`}>
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <p className="text-white/80 text-sm mb-1">Latest Performance Grade</p>
                        <h2 className="text-6xl font-bold">{latestEvaluation.derivedFields.grade}</h2>
                    </div>
                    <div className="h-24 w-24 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                        <Award className="h-12 w-12" />
                    </div>
                </div>

                <div className="grid grid-cols-3 gap-4 mt-6">
                    <div className="bg-white/10 rounded-lg p-4 backdrop-blur-sm">
                        <p className="text-white/80 text-xs mb-1">Total Score</p>
                        <p className="text-3xl font-bold">{latestEvaluation.derivedFields.totalScore}</p>
                    </div>
                    <div className="bg-white/10 rounded-lg p-4 backdrop-blur-sm">
                        <p className="text-white/80 text-xs mb-1">Multiplier</p>
                        <p className="text-3xl font-bold">{latestEvaluation.derivedFields.payrollMultiplier}x</p>
                    </div>
                    <div className="bg-white/10 rounded-lg p-4 backdrop-blur-sm">
                        <p className="text-white/80 text-xs mb-1">Period</p>
                        <p className="text-sm font-bold">
                            {new Date(latestEvaluation.evaluationPeriod.endDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                        </p>
                    </div>
                </div>
            </div>

            {/* Metrics Breakdown */}
            <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Performance Breakdown</h3>
                <div className="space-y-4">
                    {Object.entries(latestEvaluation.metrics).filter(([key]) => !['penalties', 'bonuses'].includes(key)).map(([key, value]) => (
                        <div key={key}>
                            <div className="flex justify-between items-center mb-2">
                                <span className="text-sm font-medium text-gray-700 capitalize">
                                    {key.replace(/([A-Z])/g, ' $1').trim()}
                                </span>
                                <span className="text-lg font-bold text-gray-900">{value.score}</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                                <div
                                    className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all"
                                    style={{ width: `${value.score}%` }}
                                />
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Historical Trend */}
            {evaluations.length > 1 && (
                <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
                    <h3 className="text-lg font-bold text-gray-900 mb-4">Performance History</h3>
                    <div className="space-y-3">
                        {evaluations.map((evaluation, index) => (
                            <div key={evaluation._id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                                <div className="flex items-center gap-4">
                                    <div className={`h-12 w-12 rounded-full bg-gradient-to-br ${getGradeColor(evaluation.derivedFields.grade)} flex items-center justify-center text-white font-bold text-xl`}>
                                        {evaluation.derivedFields.grade}
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-gray-900">
                                            {new Date(evaluation.evaluationPeriod.startDate).toLocaleDateString()} -
                                            {new Date(evaluation.evaluationPeriod.endDate).toLocaleDateString()}
                                        </p>
                                        <p className="text-xs text-gray-600">
                                            Approved: {new Date(evaluation.managerApproval.approvedAt).toLocaleDateString()}
                                        </p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-2xl font-bold text-gray-900">{evaluation.derivedFields.totalScore}</p>
                                    <p className="text-xs text-gray-600">{evaluation.derivedFields.payrollMultiplier}x multiplier</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default EmployeePerformanceSummary;
