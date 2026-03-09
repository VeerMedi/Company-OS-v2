import React, { useEffect, useState } from 'react';
import { 
  Target, 
  TrendingUp, 
  TrendingDown, 
  Calendar,
  Award,
  BarChart3,
  Clock,
  DollarSign,
  CheckCircle,
  AlertTriangle,
  Activity,
  Briefcase,
  Trophy,
  ArrowRight,
  Users,
  FileText,
  Building2
} from 'lucide-react';
import { formatDate } from '../../../utils/helpers';

const MyTargetsView = ({ myTargets = [], onFetchAnalytics }) => {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview'); // overview, history, projects

  useEffect(() => {
    const loadAnalytics = async () => {
      setLoading(true);
      const data = await onFetchAnalytics();
      setAnalytics(data);
      setLoading(false);
    };
    
    loadAnalytics();
  }, [onFetchAnalytics]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="dashboard-card text-center py-12">
        <Target className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-500">Unable to load target analytics</p>
      </div>
    );
  }

  const { currentTarget, targets, performance, stageDistribution, historicalPerformance, upcomingDeadlines, recentWins, activeProjects, timeline } = analytics;

  // Helper function to get status color
  const getProgressColor = (percentage) => {
    if (percentage >= 100) return 'text-green-600 bg-green-50 border-green-200';
    if (percentage >= 75) return 'text-blue-600 bg-blue-50 border-blue-200';
    if (percentage >= 50) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    return 'text-red-600 bg-red-50 border-red-200';
  };

  const getProgressBarColor = (percentage) => {
    if (percentage >= 100) return 'bg-green-500';
    if (percentage >= 75) return 'bg-blue-500';
    if (percentage >= 50) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">My Sales Targets</h2>
          <p className="text-sm text-gray-500 mt-1">Track your performance and achieve your goals</p>
        </div>
        {currentTarget && (
          <div className="text-right">
            <div className="text-sm text-gray-500">Current Period</div>
            <div className="text-lg font-semibold text-gray-900 capitalize">
              {currentTarget.targetPeriod}
            </div>
          </div>
        )}
      </div>

      {/* Navigation Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('overview')}
            className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'overview'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <BarChart3 className="inline-block w-4 h-4 mr-2" />
            Overview
          </button>
          <button
            onClick={() => setActiveTab('projects')}
            className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'projects'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <Briefcase className="inline-block w-4 h-4 mr-2" />
            Active Projects
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'history'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <Trophy className="inline-block w-4 h-4 mr-2" />
            History
          </button>
        </nav>
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <>
          {/* Current Target Summary */}
          {currentTarget ? (
            <div className="dashboard-card bg-gradient-to-br from-primary-50 to-white border-2 border-primary-200">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-xl font-bold text-gray-900 capitalize flex items-center">
                    <Target className="w-6 h-6 mr-2 text-primary-600" />
                    {currentTarget.targetPeriod} Target
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">
                    {formatDate(currentTarget.startDate)} - {formatDate(currentTarget.endDate)}
                  </p>
                  {currentTarget.createdBy && (
                    <p className="text-xs text-gray-500 mt-1">
                      Set by: {currentTarget.createdBy.firstName} {currentTarget.createdBy.lastName}
                    </p>
                  )}
                </div>
                <div className="text-right">
                  <div className={`inline-block px-4 py-2 rounded-lg border ${getProgressColor(currentTarget.progressPercentage)}`}>
                    <div className="text-3xl font-bold">{currentTarget.progressPercentage}%</div>
                    <div className="text-xs mt-1">Achieved</div>
                  </div>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="mb-4">
                <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
                  <div
                    className={`h-4 rounded-full transition-all ${getProgressBarColor(currentTarget.progressPercentage)}`}
                    style={{ width: `${Math.min(currentTarget.progressPercentage, 100)}%` }}
                  ></div>
                </div>
              </div>

              {/* Target Metrics Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <div className="bg-white p-3 rounded-lg border">
                  <div className="text-xs text-gray-500 mb-1">Revenue Target</div>
                  <div className="text-lg font-bold text-gray-900">
                    ₹{currentTarget.revenueTarget.toLocaleString()}
                  </div>
                </div>
                <div className="bg-white p-3 rounded-lg border">
                  <div className="text-xs text-gray-500 mb-1">Revenue Achieved</div>
                  <div className="text-lg font-bold text-green-600">
                    ₹{currentTarget.revenueAchieved.toLocaleString()}
                  </div>
                </div>
                <div className="bg-white p-3 rounded-lg border">
                  <div className="text-xs text-gray-500 mb-1">Leads Target</div>
                  <div className="text-lg font-bold text-gray-900">
                    {currentTarget.leadsAchieved} / {currentTarget.leadsTarget}
                  </div>
                </div>
                <div className="bg-white p-3 rounded-lg border">
                  <div className="text-xs text-gray-500 mb-1">Conversions</div>
                  <div className="text-lg font-bold text-gray-900">
                    {currentTarget.conversionsAchieved} / {currentTarget.conversionsTarget}
                  </div>
                </div>
              </div>

              {/* Additional Target Metric - Companies */}
              <div className="bg-white p-4 rounded-lg border">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Building2 className="w-5 h-5 text-orange-600" />
                    <span className="text-sm font-medium text-gray-700">Companies</span>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-gray-900">
                      {performance.approvedCompanies || 0} / {currentTarget.companiesTarget || 0}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {currentTarget.companiesTarget > 0 
                        ? `${Math.round(((performance.approvedCompanies || 0) / currentTarget.companiesTarget) * 100)}% complete`
                        : 'No target set'
                      }
                    </div>
                  </div>
                </div>
                {currentTarget.companiesTarget > 0 && (
                  <div className="mt-3">
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all ${
                          ((performance.approvedCompanies || 0) / currentTarget.companiesTarget) >= 1 ? 'bg-green-500' :
                          ((performance.approvedCompanies || 0) / currentTarget.companiesTarget) >= 0.75 ? 'bg-blue-500' :
                          ((performance.approvedCompanies || 0) / currentTarget.companiesTarget) >= 0.5 ? 'bg-yellow-500' :
                          'bg-red-500'
                        }`}
                        style={{ width: `${Math.min(((performance.approvedCompanies || 0) / currentTarget.companiesTarget) * 100, 100)}%` }}
                      ></div>
                    </div>
                  </div>
                )}
              </div>

              {/* Timeline */}
              <div className="mt-4 p-3 bg-white rounded-lg border">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center">
                    <Clock className="w-4 h-4 mr-2 text-gray-500" />
                    <span className="text-gray-600">
                      {timeline.daysRemaining > 0 ? (
                        <><span className="font-semibold">{timeline.daysRemaining}</span> days remaining</>
                      ) : (
                        <span className="font-semibold text-red-600">Target period ended</span>
                      )}
                    </span>
                  </div>
                  <div className="text-gray-500">
                    {timeline.percentageElapsed}% time elapsed
                  </div>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                  <div
                    className="bg-primary-500 h-2 rounded-full transition-all"
                    style={{ width: `${Math.min(timeline.percentageElapsed, 100)}%` }}
                  ></div>
                </div>
              </div>

              {/* Notes */}
              {currentTarget.notes && (
                <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-start">
                    <FileText className="w-4 h-4 mr-2 text-blue-600 mt-0.5" />
                    <div>
                      <div className="text-xs font-medium text-blue-900 mb-1">Notes from HOS</div>
                      <div className="text-sm text-blue-800">{currentTarget.notes}</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="dashboard-card text-center py-12">
              <Target className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No active target assigned</p>
              <p className="text-sm text-gray-400 mt-2">Contact your Head of Sales for target assignment</p>
            </div>
          )}

          {/* Performance Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="dashboard-card">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-gray-900">Companies</h3>
                <Building2 className="w-5 h-5 text-orange-600" />
              </div>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Total</span>
                  <span className="font-bold text-gray-900">{performance.totalCompanies || 0}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Approved</span>
                  <span className="font-bold text-green-600">{performance.approvedCompanies || 0}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Pending</span>
                  <span className="font-bold text-yellow-600">{performance.pendingCompanies || 0}</span>
                </div>
              </div>
            </div>

            <div className="dashboard-card">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-gray-900">Performance</h3>
                <Activity className="w-5 h-5 text-primary-600" />
              </div>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Total Leads</span>
                  <span className="font-bold text-gray-900">{performance.totalLeads}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Won Deals</span>
                  <span className="font-bold text-green-600">{performance.wonDeals}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Lost Deals</span>
                  <span className="font-bold text-red-600">{performance.lostDeals}</span>
                </div>
                <div className="flex justify-between items-center pt-2 border-t">
                  <span className="text-sm text-gray-600">Conversion Rate</span>
                  <span className="font-bold text-primary-600">{performance.conversionRate}%</span>
                </div>
              </div>
            </div>

            <div className="dashboard-card">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-gray-900">Revenue</h3>
                <DollarSign className="w-5 h-5 text-green-600" />
              </div>
              <div className="space-y-3">
                <div>
                  <div className="text-sm text-gray-600 mb-1">Total Revenue</div>
                  <div className="text-2xl font-bold text-green-600">
                    ₹{performance.totalRevenue.toLocaleString()}
                  </div>
                </div>
                <div className="pt-2 border-t">
                  <div className="text-sm text-gray-600 mb-1">Average Deal Size</div>
                  <div className="text-xl font-bold text-gray-900">
                    ₹{Number(performance.averageDealSize).toLocaleString()}
                  </div>
                </div>
              </div>
            </div>

            <div className="dashboard-card">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-gray-900">Funnel Conversion</h3>
                <TrendingUp className="w-5 h-5 text-blue-600" />
              </div>
              <div className="space-y-2">
                <div>
                  <div className="text-xs text-gray-600 mb-1">Companies → Leads</div>
                  <div className="font-bold text-blue-600">{performance.funnelConversionRate?.companiesToLeads || 0}%</div>
                </div>
                <div>
                  <div className="text-xs text-gray-600 mb-1">Leads → Conversions</div>
                  <div className="font-bold text-purple-600">{performance.funnelConversionRate?.leadsToConversions || 0}%</div>
                </div>
                <div className="pt-2 border-t">
                  <div className="text-xs text-gray-600 mb-1">Overall (C → Conv)</div>
                  <div className="font-bold text-green-600">{performance.funnelConversionRate?.companiesToConversions || 0}%</div>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Wins */}
          {recentWins && recentWins.length > 0 && (
            <div className="dashboard-card">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                  <Trophy className="w-5 h-5 mr-2 text-yellow-500" />
                  Recent Wins
                </h3>
              </div>
              <div className="space-y-3">
                {recentWins.map((win) => (
                  <div key={win.id} className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">{win.clientName}</div>
                      <div className="text-sm text-gray-600">{win.clientCompany} • {win.serviceType}</div>
                      <div className="text-xs text-gray-500 mt-1">
                        {formatDate(win.actualCloseDate)}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-green-600">
                        ₹{win.actualValue.toLocaleString()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Upcoming Deadlines */}
          {upcomingDeadlines && upcomingDeadlines.length > 0 && (
            <div className="dashboard-card">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                  <Calendar className="w-5 h-5 mr-2 text-orange-500" />
                  Upcoming Deadlines
                </h3>
              </div>
              <div className="space-y-3">
                {upcomingDeadlines.map((deadline) => (
                  <div key={deadline.id} className="flex items-center justify-between p-3 bg-gray-50 border rounded-lg">
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">{deadline.clientName}</div>
                      <div className="text-sm text-gray-600">{deadline.clientCompany}</div>
                      <div className="text-xs text-gray-500 mt-1 capitalize">
                        Stage: {deadline.stage.replace('-', ' ')}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-semibold text-gray-900">
                        ₹{deadline.estimatedValue.toLocaleString()}
                      </div>
                      <div className={`text-xs mt-1 ${deadline.daysRemaining <= 7 ? 'text-red-600 font-semibold' : 'text-gray-500'}`}>
                        {deadline.daysRemaining > 0 ? `${deadline.daysRemaining} days left` : 'Overdue'}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* Active Projects Tab */}
      {activeTab === 'projects' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Active Projects & Opportunities</h3>
            <div className="text-sm text-gray-500">
              {activeProjects?.length || 0} active
            </div>
          </div>

          {activeProjects && activeProjects.length > 0 ? (
            <div className="grid grid-cols-1 gap-4">
              {activeProjects.map((project) => (
                <div key={project.id} className="dashboard-card hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center mb-2">
                        <Briefcase className="w-4 h-4 mr-2 text-primary-600" />
                        <h4 className="font-semibold text-gray-900">{project.clientName}</h4>
                      </div>
                      <div className="text-sm text-gray-600 mb-2">{project.clientCompany}</div>
                      <div className="text-sm text-gray-600 mb-3">{project.serviceType}</div>
                      
                      <div className="flex items-center space-x-4 text-sm">
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded capitalize">
                          {project.stage.replace('-', ' ')}
                        </span>
                        <span className="text-gray-500">
                          {project.probability}% probability
                        </span>
                        {project.expectedCloseDate && (
                          <span className="text-gray-500">
                            Expected: {formatDate(project.expectedCloseDate)}
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <div className="text-right ml-4">
                      <div className="text-lg font-bold text-primary-600">
                        ₹{project.estimatedValue.toLocaleString()}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">Est. Value</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="dashboard-card text-center py-12">
              <Briefcase className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No active projects</p>
            </div>
          )}
        </div>
      )}

      {/* History Tab */}
      {activeTab === 'history' && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">Historical Performance</h3>
          
          {historicalPerformance && historicalPerformance.length > 0 ? (
            <div className="space-y-4">
              {historicalPerformance.map((target, index) => (
                <div key={index} className="dashboard-card">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <div className="font-semibold text-gray-900 capitalize flex items-center">
                        {target.achieved ? (
                          <CheckCircle className="w-5 h-5 mr-2 text-green-500" />
                        ) : (
                          <AlertTriangle className="w-5 h-5 mr-2 text-yellow-500" />
                        )}
                        {target.period} Target
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {formatDate(target.startDate)} - {formatDate(target.endDate)}
                      </div>
                    </div>
                    <div className={`text-right px-3 py-1 rounded-lg border ${getProgressColor(target.percentage)}`}>
                      <div className="text-2xl font-bold">{target.percentage}%</div>
                    </div>
                  </div>
                  
                  <div className="w-full bg-gray-200 rounded-full h-3 mb-3">
                    <div
                      className={`h-3 rounded-full ${getProgressBarColor(target.percentage)}`}
                      style={{ width: `${Math.min(target.percentage, 100)}%` }}
                    ></div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <div className="text-gray-500">Target Revenue</div>
                      <div className="font-semibold text-gray-900">
                        ₹{target.targetRevenue.toLocaleString()}
                      </div>
                    </div>
                    <div>
                      <div className="text-gray-500">Achieved Revenue</div>
                      <div className={`font-semibold ${target.achieved ? 'text-green-600' : 'text-yellow-600'}`}>
                        ₹{target.achievedRevenue.toLocaleString()}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="dashboard-card text-center py-12">
              <Trophy className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No historical data available</p>
            </div>
          )}

          {/* All Targets List */}
          {targets && targets.length > 0 && (
            <div className="dashboard-card mt-6">
              <h4 className="font-semibold text-gray-900 mb-4">All Targets</h4>
              <div className="space-y-2">
                {targets.map((target) => (
                  <div key={target._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex-1">
                      <div className="font-medium text-gray-900 capitalize">{target.targetPeriod}</div>
                      <div className="text-xs text-gray-500">
                        {formatDate(target.startDate)} - {formatDate(target.endDate)}
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <span className={`px-2 py-1 text-xs rounded ${
                        target.status === 'active' ? 'bg-green-100 text-green-800' :
                        target.status === 'completed' ? 'bg-blue-100 text-blue-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {target.status}
                      </span>
                      <div className="text-right">
                        <div className="font-semibold text-gray-900">{target.progressPercentage}%</div>
                        <div className="text-xs text-gray-500">Progress</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default MyTargetsView;
