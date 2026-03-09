import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  Target, 
  CheckCircle, 
  DollarSign,
  Users,
  Calendar,
  Award,
  Activity
} from 'lucide-react';
import api from '../utils/api';
import { showToast } from '../utils/toast';

const SalesPerformanceStats = () => {
  const [stats, setStats] = useState({
    activeLeads: 0,
    qualifiedLeads: 0,
    closedWon: 0,
    conversionRate: 0,
    totalValue: 0,
    averageDealSize: 0,
    assignedTasks: 0,
    completedTasks: 0,
    pendingTasks: 0,
    companiesAdded: 0,
    monthlyTarget: 0,
    monthlyAchieved: 0
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    setIsLoading(true);
    try {
      const response = await api.get('/sales/my-stats');
      setStats(response.data.data || stats);
    } catch (error) {
      console.error('Error fetching stats:', error);
      showToast.error('Failed to load performance stats');
    } finally {
      setIsLoading(false);
    }
  };

  const calculateTaskCompletion = () => {
    const total = stats.assignedTasks;
    const completed = stats.completedTasks;
    return total > 0 ? ((completed / total) * 100).toFixed(1) : 0;
  };

  const calculateTargetProgress = () => {
    return stats.monthlyTarget > 0 
      ? ((stats.monthlyAchieved / stats.monthlyTarget) * 100).toFixed(1) 
      : 0;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">My Performance</h2>
        <p className="text-gray-600 mt-1">Track your sales performance and progress</p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg shadow-lg p-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-blue-100 text-sm">Active Leads</p>
              <p className="text-3xl font-bold">{stats.activeLeads}</p>
            </div>
            <Users className="w-12 h-12 text-blue-200" />
          </div>
          <div className="text-sm text-blue-100">
            {stats.qualifiedLeads} qualified
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg shadow-lg p-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-green-100 text-sm">Closed Won</p>
              <p className="text-3xl font-bold">{stats.closedWon}</p>
            </div>
            <CheckCircle className="w-12 h-12 text-green-200" />
          </div>
          <div className="text-sm text-green-100">
            {stats.conversionRate}% conversion rate
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg shadow-lg p-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-purple-100 text-sm">Pipeline Value</p>
              <p className="text-3xl font-bold">₹{(stats.totalValue / 100000).toFixed(1)}L</p>
            </div>
            <DollarSign className="w-12 h-12 text-purple-200" />
          </div>
          <div className="text-sm text-purple-100">
            Avg: ₹{(stats.averageDealSize / 100000).toFixed(1)}L
          </div>
        </div>

        <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg shadow-lg p-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-orange-100 text-sm">Tasks</p>
              <p className="text-3xl font-bold">{stats.completedTasks}/{stats.assignedTasks}</p>
            </div>
            <Activity className="w-12 h-12 text-orange-200" />
          </div>
          <div className="text-sm text-orange-100">
            {calculateTaskCompletion()}% completion
          </div>
        </div>
      </div>

      {/* Progress Bars */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Monthly Target Progress */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Target className="w-5 h-5 text-primary-600" />
              <h3 className="text-lg font-semibold text-gray-900">Monthly Target</h3>
            </div>
            <span className="text-sm text-gray-600">
              {calculateTargetProgress()}%
            </span>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-gray-600">
              <span>Achieved: ₹{stats.monthlyAchieved.toLocaleString()}</span>
              <span>Target: ₹{stats.monthlyTarget.toLocaleString()}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
              <div
                className={`h-3 rounded-full transition-all duration-300 ${
                  calculateTargetProgress() >= 100
                    ? 'bg-green-600'
                    : calculateTargetProgress() >= 75
                    ? 'bg-blue-600'
                    : calculateTargetProgress() >= 50
                    ? 'bg-yellow-600'
                    : 'bg-red-600'
                }`}
                style={{ width: `${Math.min(calculateTargetProgress(), 100)}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* Task Completion Progress */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-primary-600" />
              <h3 className="text-lg font-semibold text-gray-900">Task Completion</h3>
            </div>
            <span className="text-sm text-gray-600">
              {calculateTaskCompletion()}%
            </span>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-gray-600">
              <span>Completed: {stats.completedTasks}</span>
              <span>Total: {stats.assignedTasks}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
              <div
                className="bg-gradient-to-r from-blue-500 to-purple-600 h-3 rounded-full transition-all duration-300"
                style={{ width: `${Math.min(calculateTaskCompletion(), 100)}%` }}
              ></div>
            </div>
            <div className="flex items-center justify-between text-xs text-gray-600 mt-2">
              <span className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
                Pending: {stats.pendingTasks}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Activity Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-3 bg-blue-100 rounded-lg">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.companiesAdded}</p>
              <p className="text-sm text-gray-600">Companies Added</p>
            </div>
          </div>
          <p className="text-xs text-gray-500">This month</p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-3 bg-green-100 rounded-lg">
              <Award className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.qualifiedLeads}</p>
              <p className="text-sm text-gray-600">Qualified Leads</p>
            </div>
          </div>
          <p className="text-xs text-gray-500">Ready for proposal</p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-3 bg-purple-100 rounded-lg">
              <TrendingUp className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">₹{(stats.averageDealSize / 100000).toFixed(1)}L</p>
              <p className="text-sm text-gray-600">Avg Deal Size</p>
            </div>
          </div>
          <p className="text-xs text-gray-500">Per closed deal</p>
        </div>
      </div>

      {/* Performance Insights */}
      <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-lg shadow p-6">
        <div className="flex items-center gap-2 mb-4">
          <Activity className="w-5 h-5 text-indigo-600" />
          <h3 className="text-lg font-semibold text-gray-900">Performance Insights</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white rounded-lg p-4">
            <p className="text-sm text-gray-600 mb-1">Your Conversion Rate</p>
            <p className="text-3xl font-bold text-indigo-600">{stats.conversionRate}%</p>
            <p className="text-xs text-gray-500 mt-1">
              {stats.conversionRate >= 20 
                ? '🎉 Excellent! Above average' 
                : stats.conversionRate >= 10 
                ? '👍 Good performance' 
                : '💪 Keep pushing!'}
            </p>
          </div>
          <div className="bg-white rounded-lg p-4">
            <p className="text-sm text-gray-600 mb-1">Target Achievement</p>
            <p className="text-3xl font-bold text-purple-600">{calculateTargetProgress()}%</p>
            <p className="text-xs text-gray-500 mt-1">
              {calculateTargetProgress() >= 100 
                ? '🏆 Target exceeded!' 
                : calculateTargetProgress() >= 75 
                ? '🎯 Almost there!' 
                : '⚡ Keep going!'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SalesPerformanceStats;
