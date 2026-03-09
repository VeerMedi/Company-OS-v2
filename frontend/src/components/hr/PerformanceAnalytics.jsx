import React, { useState, useEffect } from 'react';
import {
    BarChart3,
    TrendingUp,
    TrendingDown,
    Award,
    Users,
    Target,
    Activity,
    Calendar,
    Filter
} from 'lucide-react';
import api from '../../utils/api';
import toast from 'react-hot-toast';

const PerformanceAnalytics = () => {
    const [loading, setLoading] = useState(true);
    const [companyMetrics, setCompanyMetrics] = useState({
        totalEmployees: 0,
        avgPerformance: 0,
        taskCompletionRate: 0,
        totalPoints: 0
    });
    const [individuals, setIndividuals] = useState([]);
    const [departments, setDepartments] = useState([]);
    const [dateRange, setDateRange] = useState('30'); // days

    useEffect(() => {
        fetchPerformanceData();

        // Auto-refresh every 60 seconds
        const refreshInterval = setInterval(fetchPerformanceData, 60000);
        return () => clearInterval(refreshInterval);
    }, [dateRange]);

    const fetchPerformanceData = async () => {
        try {
            // Fetch all individuals for performance data
            const response = await api.get('/users/individuals');

            if (response.data.success) {
                const employeeData = response.data.data;
                setIndividuals(employeeData);

                // Calculate company metrics
                calculateCompanyMetrics(employeeData);

                // Calculate department metrics
                calculateDepartmentMetrics(employeeData);
            }
        } catch (error) {
            console.error('Error fetching performance data:', error);
            if (individuals.length === 0) {
                toast.error('Failed to load performance data');
            }
        } finally {
            setLoading(false);
        }
    };

    const calculateCompanyMetrics = (employees) => {
        const totalPoints = employees.reduce((sum, emp) => sum + (emp.totalPoints || 0), 0);
        const avgPoints = employees.length > 0 ? totalPoints / employees.length : 0;

        setCompanyMetrics({
            totalEmployees: employees.length,
            avgPerformance: Math.round(avgPoints),
            taskCompletionRate: 85, // Placeholder - calculate from actual data
            totalPoints
        });
    };

    const calculateDepartmentMetrics = (employees) => {
        const deptMap = {};

        employees.forEach(emp => {
            const dept = emp.department || 'Unassigned';
            if (!deptMap[dept]) {
                deptMap[dept] = {
                    name: dept,
                    employees: 0,
                    totalPoints: 0,
                    avgPoints: 0
                };
            }
            deptMap[dept].employees++;
            deptMap[dept].totalPoints += emp.totalPoints || 0;
        });

        const deptArray = Object.values(deptMap).map(dept => ({
            ...dept,
            avgPoints: Math.round(dept.totalPoints / dept.employees)
        })).sort((a, b) => b.avgPoints - a.avgPoints);

        setDepartments(deptArray);
    };

    // Sort individuals by performance
    const topPerformers = [...individuals]
        .sort((a, b) => (b.totalPoints || 0) - (a.totalPoints || 0))
        .slice(0, 10);

    const getPerformanceTrend = (points) => {
        const avg = companyMetrics.avgPerformance;
        if (points > avg * 1.2) return { icon: TrendingUp, color: 'text-emerald-400', label: 'Excellent' };
        if (points > avg) return { icon: TrendingUp, color: 'text-blue-400', label: 'Above Average' };
        if (points > avg * 0.8) return { icon: Activity, color: 'text-amber-400', label: 'Average' };
        return { icon: TrendingDown, color: 'text-red-400', label: 'Needs Improvement' };
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-white">Performance Analytics</h1>
                    <p className="text-zinc-400 mt-1">Company-wide and individual performance insights</p>
                </div>
                <div>
                    <select
                        value={dateRange}
                        onChange={(e) => setDateRange(e.target.value)}
                        className="px-4 py-2 bg-zinc-800/50 border border-zinc-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                    >
                        <option value="7">Last 7 Days</option>
                        <option value="30">Last 30 Days</option>
                        <option value="90">Last 90 Days</option>
                        <option value="365">Last Year</option>
                    </select>
                </div>
            </div>

            {loading ? (
                <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
                </div>
            ) : (
                <>
                    {/* Company Metrics */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                        <div className="bg-gradient-to-br from-blue-600 to-blue-800 rounded-xl p-6 text-white shadow-lg border border-white/5">
                            <div className="flex items-center justify-between mb-2">
                                <p className="text-blue-100 text-sm font-medium">Total Employees</p>
                                <Users className="h-5 w-5 text-blue-100" />
                            </div>
                            <p className="text-3xl font-bold">{companyMetrics.totalEmployees}</p>
                        </div>

                        <div className="bg-gradient-to-br from-purple-600 to-purple-800 rounded-xl p-6 text-white shadow-lg border border-white/5">
                            <div className="flex items-center justify-between mb-2">
                                <p className="text-purple-100 text-sm font-medium">Total Points</p>
                                <Award className="h-5 w-5 text-purple-100" />
                            </div>
                            <p className="text-3xl font-bold">{companyMetrics.totalPoints}</p>
                        </div>

                        <div className="bg-gradient-to-br from-emerald-600 to-emerald-800 rounded-xl p-6 text-white shadow-lg border border-white/5">
                            <div className="flex items-center justify-between mb-2">
                                <p className="text-emerald-100 text-sm font-medium">Avg Performance</p>
                                <BarChart3 className="h-5 w-5 text-emerald-100" />
                            </div>
                            <p className="text-3xl font-bold">{companyMetrics.avgPerformance}</p>
                            <p className="text-emerald-100 text-xs mt-1">points per employee</p>
                        </div>

                        <div className="bg-gradient-to-br from-orange-600 to-orange-800 rounded-xl p-6 text-white shadow-lg border border-white/5">
                            <div className="flex items-center justify-between mb-2">
                                <p className="text-orange-100 text-sm font-medium">Completion Rate</p>
                                <Target className="h-5 w-5 text-orange-100" />
                            </div>
                            <p className="text-3xl font-bold">{companyMetrics.taskCompletionRate}%</p>
                        </div>
                    </div>

                    {/* Department Performance */}
                    <div className="bg-zinc-800/50 backdrop-blur-md rounded-xl p-6 shadow-lg border border-white/5">
                        <h3 className="text-lg font-semibold text-white mb-4">Department Performance</h3>
                        <div className="space-y-4">
                            {departments.map((dept, index) => (
                                <div key={dept.name} className="flex items-center justify-between hover:bg-zinc-700/20 p-2 rounded-lg transition-colors">
                                    <div className="flex items-center gap-4 flex-1">
                                        <div className={`h-8 w-8 rounded-lg flex items-center justify-center font-bold text-sm ${index === 0 ? 'bg-amber-500/20 text-amber-500' :
                                            index === 1 ? 'bg-zinc-500/20 text-zinc-400' :
                                                index === 2 ? 'bg-orange-500/20 text-orange-500' :
                                                    'bg-blue-500/20 text-blue-500'
                                            }`}>
                                            #{index + 1}
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-sm font-medium text-white">{dept.name}</p>
                                            <p className="text-xs text-zinc-400">{dept.employees} employees</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <div className="text-right">
                                            <p className="text-lg font-bold text-white">{dept.avgPoints}</p>
                                            <p className="text-xs text-zinc-400">avg points</p>
                                        </div>
                                        <div className="w-32 bg-zinc-700 rounded-full h-2">
                                            <div
                                                className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full"
                                                style={{ width: `${Math.min((dept.avgPoints / (companyMetrics.avgPerformance * 1.5)) * 100, 100)}%` }}
                                            />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Top Performers */}
                    <div className="bg-zinc-800/50 backdrop-blur-md rounded-xl p-6 shadow-lg border border-white/5">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold text-white">Top Performers</h3>
                            <Award className="h-5 w-5 text-amber-500" />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {topPerformers.map((performer, index) => {
                                const trend = getPerformanceTrend(performer.totalPoints || 0);
                                const TrendIcon = trend.icon;

                                return (
                                    <div key={performer._id} className="bg-zinc-900/40 border border-white/5 rounded-xl p-4 hover:border-blue-500/30 transition-colors relative group">
                                        {index < 3 && (
                                            <div className="absolute top-2 right-2">
                                                <div className={`h-6 w-6 rounded-full flex items-center justify-center font-bold text-xs ${index === 0 ? 'bg-amber-500/20 text-amber-500' :
                                                    index === 1 ? 'bg-zinc-500/20 text-zinc-400' :
                                                        'bg-orange-500/20 text-orange-500'
                                                    }`}>
                                                    #{index + 1}
                                                </div>
                                            </div>
                                        )}
                                        <div className="flex items-center gap-3 mb-3">
                                            <div className="h-12 w-12 rounded-full bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center text-white font-bold text-lg shadow-lg">
                                                {performer.firstName?.charAt(0)}{performer.lastName?.charAt(0)}
                                            </div>
                                            <div className="flex-1">
                                                <h4 className="font-semibold text-white group-hover:text-blue-400 transition-colors">
                                                    {performer.firstName} {performer.lastName}
                                                </h4>
                                                <p className="text-xs text-zinc-400 capitalize">
                                                    {performer.role?.replace('-', ' ')}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center justify-between pt-3 border-t border-white/5">
                                            <div>
                                                <p className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">{performer.totalPoints || 0}</p>
                                                <p className="text-xs text-zinc-500">points</p>
                                            </div>
                                            <div className="text-right">
                                                <div className={`flex items-center gap-1 ${trend.color}`}>
                                                    <TrendIcon className="h-4 w-4" />
                                                    <span className="text-xs font-medium">{trend.label}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Performance Distribution */}
                    <div className="bg-zinc-800/50 backdrop-blur-md rounded-xl p-6 shadow-lg border border-white/5">
                        <h3 className="text-lg font-semibold text-white mb-4">Performance Distribution</h3>
                        <div className="grid grid-cols-4 gap-4">
                            <div className="text-center p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
                                <p className="text-2xl font-bold text-emerald-400">
                                    {individuals.filter(i => (i.totalPoints || 0) > companyMetrics.avgPerformance * 1.2).length}
                                </p>
                                <p className="text-sm text-zinc-400 mt-1">Excellent</p>
                            </div>
                            <div className="text-center p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl">
                                <p className="text-2xl font-bold text-blue-400">
                                    {individuals.filter(i => {
                                        const pts = i.totalPoints || 0;
                                        return pts > companyMetrics.avgPerformance && pts <= companyMetrics.avgPerformance * 1.2;
                                    }).length}
                                </p>
                                <p className="text-sm text-zinc-400 mt-1">Above Average</p>
                            </div>
                            <div className="text-center p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl">
                                <p className="text-2xl font-bold text-amber-400">
                                    {individuals.filter(i => {
                                        const pts = i.totalPoints || 0;
                                        return pts > companyMetrics.avgPerformance * 0.8 && pts <= companyMetrics.avgPerformance;
                                    }).length}
                                </p>
                                <p className="text-sm text-zinc-400 mt-1">Average</p>
                            </div>
                            <div className="text-center p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
                                <p className="text-2xl font-bold text-red-400">
                                    {individuals.filter(i => (i.totalPoints || 0) <= companyMetrics.avgPerformance * 0.8).length}
                                </p>
                                <p className="text-sm text-zinc-400 mt-1">Needs Improvement</p>
                            </div>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

export default PerformanceAnalytics;
