import React, { useState, useEffect } from 'react';
import {
  Building2,
  Users,
  Target,
  TrendingUp,
  Calendar,
  AlertCircle,
  CheckCircle,
  Clock,
  Phone,
  Mail,
  DollarSign,
  Eye,
  ChevronDown,
  ChevronUp,
  Filter,
  Search,
  Activity
} from 'lucide-react';
import api from '../utils/api';
import { showToast } from '../utils/toast';
import { formatDate } from '../utils/helpers';

const ComprehensiveMonitoring = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [overview, setOverview] = useState(null);
  const [selectedTarget, setSelectedTarget] = useState(null);
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [selectedRep, setSelectedRep] = useState('all');
  const [salesReps, setSalesReps] = useState([]);
  const [viewMode, setViewMode] = useState('overview'); // overview, target-detail, company-detail
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterPriority, setFilterPriority] = useState('all');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedItems, setExpandedItems] = useState({});
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    fetchSalesReps();
  }, []);

  useEffect(() => {
    fetchOverview();
  }, [selectedRep, filterStatus, filterPriority, dateRange]);

  const fetchSalesReps = async () => {
    try {
      const response = await api.get('/hos-monitoring/sales-reps');
      setSalesReps(response.data.data || []);
    } catch (error) {
      console.error('Error fetching sales reps:', error);
      showToast.error('Failed to fetch sales representatives');
    }
  };

  const fetchOverview = async () => {
    setIsLoading(true);
    try {
      const params = {};
      if (selectedRep && selectedRep !== 'all') params.salesRepId = selectedRep;
      if (filterStatus && filterStatus !== 'all') params.status = filterStatus;
      if (filterPriority && filterPriority !== 'all') params.priority = filterPriority;
      if (dateRange.start) params.startDate = dateRange.start;
      if (dateRange.end) params.endDate = dateRange.end;

      const response = await api.get('/hos-monitoring/overview', { params });
      setOverview(response.data.data);
    } catch (error) {
      console.error('Error fetching overview:', error);
      showToast.error('Failed to fetch monitoring data');
    } finally {
      setIsLoading(false);
    }
  };

  const clearFilters = () => {
    setSelectedRep('all');
    setFilterStatus('all');
    setFilterPriority('all');
    setDateRange({ start: '', end: '' });
    setSearchQuery('');
  };

  const fetchTargetDetails = async (targetId) => {
    try {
      const response = await api.get(`/hos-monitoring/target/${targetId}/detailed`);
      setSelectedTarget(response.data.data);
      setViewMode('target-detail');
    } catch (error) {
      console.error('Error fetching target details:', error);
      showToast.error('Failed to fetch target details');
    }
  };

  const fetchCompanyPipeline = async (companyId) => {
    try {
      const response = await api.get(`/hos-monitoring/company/${companyId}/pipeline`);
      setSelectedCompany(response.data.data);
      setViewMode('company-detail');
    } catch (error) {
      console.error('Error fetching company pipeline:', error);
      showToast.error('Failed to fetch company details');
    }
  };

  const toggleExpand = (id) => {
    setExpandedItems(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  // Overview View
  if (viewMode === 'overview' && overview) {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Complete Sales Monitoring</h2>
            <p className="text-sm text-gray-500 mt-1">Track targets, companies, leads, and pipeline</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="btn-secondary text-sm flex items-center gap-2"
            >
              <Filter className="h-4 w-4" />
              {showFilters ? 'Hide Filters' : 'Show Filters'}
            </button>
            <button
              onClick={fetchOverview}
              className="btn-secondary text-sm flex items-center gap-2"
            >
              <Activity className="h-4 w-4" />
              Refresh
            </button>
          </div>
        </div>

        {/* Filters Section */}
        {showFilters && (
          <div className="dashboard-card bg-gray-50">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              {/* Sales Rep Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Users className="inline w-4 h-4 mr-1" />
                  Sales Representative
                </label>
                <select
                  value={selectedRep}
                  onChange={(e) => setSelectedRep(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="all">All Sales Reps</option>
                  {salesReps.map((rep) => (
                    <option key={rep._id} value={rep._id}>
                      {rep.firstName} {rep.lastName}
                    </option>
                  ))}
                </select>
              </div>

              {/* Status Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Activity className="inline w-4 h-4 mr-1" />
                  Lead Status
                </label>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="all">All Status</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="won">Won</option>
                  <option value="lost">Lost</option>
                </select>
              </div>

              {/* Priority Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <AlertCircle className="inline w-4 h-4 mr-1" />
                  Priority
                </label>
                <select
                  value={filterPriority}
                  onChange={(e) => setFilterPriority(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="all">All Priorities</option>
                  <option value="critical">Critical</option>
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
              </div>

              {/* Date Range */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Calendar className="inline w-4 h-4 mr-1" />
                  Start Date
                </label>
                <input
                  type="date"
                  value={dateRange.start}
                  onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Calendar className="inline w-4 h-4 mr-1" />
                  End Date
                </label>
                <input
                  type="date"
                  value={dateRange.end}
                  onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
            </div>

            {/* Active Filters Summary & Clear Button */}
            <div className="mt-4 pt-4 border-t border-gray-200 flex justify-between items-center">
              <div className="flex flex-wrap gap-2">
                {selectedRep !== 'all' && (
                  <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                    Sales Rep: {salesReps.find(r => r._id === selectedRep)?.firstName} {salesReps.find(r => r._id === selectedRep)?.lastName}
                  </span>
                )}
                {filterStatus !== 'all' && (
                  <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm capitalize">
                    Status: {filterStatus}
                  </span>
                )}
                {filterPriority !== 'all' && (
                  <span className="px-3 py-1 bg-orange-100 text-orange-800 rounded-full text-sm capitalize">
                    Priority: {filterPriority}
                  </span>
                )}
                {dateRange.start && (
                  <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm">
                    From: {new Date(dateRange.start).toLocaleDateString()}
                  </span>
                )}
                {dateRange.end && (
                  <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm">
                    To: {new Date(dateRange.end).toLocaleDateString()}
                  </span>
                )}
              </div>
              <button
                onClick={clearFilters}
                className="btn-secondary text-sm"
              >
                Clear All Filters
              </button>
            </div>
          </div>
        )}

        {/* Summary Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
          <StatCard
            icon={Target}
            label="Active Targets"
            value={overview.summary.activeTargets}
            color="blue"
          />
          <StatCard
            icon={Building2}
            label="Companies"
            value={overview.summary.totalCompanies}
            color="purple"
          />
          <StatCard
            icon={Users}
            label="Total Leads"
            value={overview.summary.totalLeads}
            color="indigo"
          />
          <StatCard
            icon={TrendingUp}
            label="Active Leads"
            value={overview.summary.activeLeads}
            color="green"
          />
          <StatCard
            icon={CheckCircle}
            label="Won Deals"
            value={overview.summary.wonDeals}
            color="green"
          />
          <StatCard
            icon={AlertCircle}
            label="Lost Deals"
            value={overview.summary.lostDeals}
            color="red"
          />
          <StatCard
            icon={DollarSign}
            label="Revenue"
            value={`₹${(overview.summary.totalRevenue / 1000).toFixed(0)}K`}
            color="green"
          />
          <StatCard
            icon={DollarSign}
            label="Pipeline Value"
            value={`₹${(overview.summary.pipelineValue / 1000).toFixed(0)}K`}
            color="blue"
          />
        </div>

        {/* Attention Required */}
        {overview.attentionRequired && overview.attentionRequired.length > 0 && (
          <div className="dashboard-card border-2 border-orange-200 bg-orange-50">
            <div className="flex items-center gap-2 mb-4">
              <AlertCircle className="h-5 w-5 text-orange-600" />
              <h3 className="text-lg font-semibold text-orange-900">
                Items Requiring Attention ({overview.attentionRequired.length})
              </h3>
            </div>
            <div className="space-y-3">
              {overview.attentionRequired.slice(0, 5).map((item, idx) => (
                <div key={idx} className="bg-white rounded-lg p-4 border border-orange-200">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h4 className="font-semibold text-gray-900">{item.companyName}</h4>
                      <p className="text-sm text-gray-600">
                        {item.assignedTo?.firstName} {item.assignedTo?.lastName}
                      </p>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      item.priority === 'critical' ? 'bg-red-100 text-red-800' :
                      item.priority === 'high' ? 'bg-orange-100 text-orange-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {item.priority}
                    </span>
                  </div>
                  <ul className="space-y-1">
                    {item.reasons.map((reason, i) => (
                      <li key={i} className="text-sm text-orange-700 flex items-start gap-2">
                        <span className="text-orange-500 mt-1">•</span>
                        <span>{reason}</span>
                      </li>
                    ))}
                  </ul>
                  <button
                    onClick={() => fetchCompanyPipeline(item.companyId)}
                    className="mt-3 text-sm text-primary-600 hover:text-primary-800 font-medium"
                  >
                    View Details →
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Followup Tracking */}
        {overview.followupTracking && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Overdue Followups */}
            {overview.followupTracking.overdue.length > 0 && (
              <div className="dashboard-card border-2 border-red-200 bg-red-50">
                <div className="flex items-center gap-2 mb-4">
                  <Clock className="h-5 w-5 text-red-600" />
                  <h3 className="text-lg font-semibold text-red-900">
                    Overdue Followups ({overview.followupTracking.counts.overdue})
                  </h3>
                </div>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {overview.followupTracking.overdue.slice(0, 10).map((followup, idx) => (
                    <FollowupCard key={idx} followup={followup} isOverdue={true} />
                  ))}
                </div>
              </div>
            )}

            {/* Upcoming Followups */}
            <div className="dashboard-card">
              <div className="flex items-center gap-2 mb-4">
                <Calendar className="h-5 w-5 text-blue-600" />
                <h3 className="text-lg font-semibold text-gray-900">
                  Upcoming Followups ({overview.followupTracking.counts.upcoming})
                </h3>
              </div>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {overview.followupTracking.upcoming.map((followup, idx) => (
                  <FollowupCard key={idx} followup={followup} />
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Target Mapping - Hierarchical View */}
        <div className="dashboard-card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Target → Company → Lead Hierarchy</h3>
          <div className="space-y-4">
            {overview.targetMapping && overview.targetMapping.map((mapping, idx) => (
              <TargetMappingCard
                key={idx}
                mapping={mapping}
                onViewDetails={fetchTargetDetails}
                onViewCompany={fetchCompanyPipeline}
                expanded={expandedItems[`target-${mapping.target.id}`]}
                onToggle={() => toggleExpand(`target-${mapping.target.id}`)}
              />
            ))}
          </div>
        </div>

        {/* Sales Rep Performance */}
        <div className="dashboard-card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Sales Rep Performance</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Sales Rep</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Targets</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Companies</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Leads</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Won</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Revenue</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Pipeline</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Conv Rate</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {overview.repPerformance && overview.repPerformance.map((rep, idx) => (
                  <tr key={idx} className="hover:bg-gray-50">
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{rep.salesRep.name}</div>
                      <div className="text-xs text-gray-500">{rep.salesRep.email}</div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                      {rep.activeTargets}/{rep.targets}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">{rep.companies}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                      {rep.activeLeads}/{rep.leads}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-green-600 font-medium">
                      {rep.wonDeals}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 font-medium">
                      ₹{(rep.wonRevenue / 1000).toFixed(0)}K
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-blue-600">
                      ₹{(rep.pipelineValue / 1000).toFixed(0)}K
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        parseFloat(rep.conversionRate) >= 50 ? 'bg-green-100 text-green-800' :
                        parseFloat(rep.conversionRate) >= 30 ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {rep.conversionRate}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pipeline Details by Stage */}
        <div className="dashboard-card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Pipeline by Stage</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {overview.pipelineDetails && overview.pipelineDetails.map((stage, idx) => (
              <PipelineStageCard
                key={idx}
                stage={stage}
                expanded={expandedItems[`stage-${stage.stage}`]}
                onToggle={() => toggleExpand(`stage-${stage.stage}`)}
              />
            ))}
          </div>
        </div>

        {/* Recent Activities */}
        <div className="dashboard-card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activities</h3>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {overview.recentActivities && overview.recentActivities.slice(0, 20).map((activity, idx) => (
              <ActivityCard key={idx} activity={activity} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Target Detail View
  if (viewMode === 'target-detail' && selectedTarget) {
    return (
      <div className="space-y-6">
        <button
          onClick={() => {
            setViewMode('overview');
            setSelectedTarget(null);
          }}
          className="text-primary-600 hover:text-primary-800 font-medium text-sm"
        >
          ← Back to Overview
        </button>

        <div className="dashboard-card">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Target Details</h2>
          
          {/* Target Info */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div>
              <div className="text-sm text-gray-600">Sales Rep</div>
              <div className="font-semibold text-gray-900">
                {selectedTarget.target.userId.firstName} {selectedTarget.target.userId.lastName}
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-600">Period</div>
              <div className="font-semibold text-gray-900 capitalize">{selectedTarget.target.targetPeriod}</div>
            </div>
            <div>
              <div className="text-sm text-gray-600">Start Date</div>
              <div className="font-semibold text-gray-900">{formatDate(selectedTarget.target.startDate)}</div>
            </div>
            <div>
              <div className="text-sm text-gray-600">End Date</div>
              <div className="font-semibold text-gray-900">{formatDate(selectedTarget.target.endDate)}</div>
            </div>
          </div>

          {/* Progress */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <ProgressCard
              label="Revenue"
              target={selectedTarget.progress.revenue.target}
              achieved={selectedTarget.progress.revenue.achieved}
              percentage={selectedTarget.progress.revenue.percentage}
              prefix="₹"
            />
            <ProgressCard
              label="Companies"
              target={selectedTarget.progress.companies.target}
              achieved={selectedTarget.progress.companies.achieved}
              percentage={selectedTarget.progress.companies.percentage}
            />
            <ProgressCard
              label="Leads"
              target={selectedTarget.progress.leads.target}
              achieved={selectedTarget.progress.leads.achieved}
              percentage={selectedTarget.progress.leads.percentage}
            />
            <ProgressCard
              label="Conversions"
              target={selectedTarget.progress.conversions.target}
              achieved={selectedTarget.progress.conversions.achieved}
              percentage={selectedTarget.progress.conversions.percentage}
            />
          </div>
        </div>

        {/* Company Hierarchy */}
        <div className="dashboard-card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Companies & Leads ({selectedTarget.hierarchy.length} companies)
          </h3>
          <div className="space-y-4">
            {selectedTarget.hierarchy.map((item, idx) => (
              <CompanyHierarchyCard
                key={idx}
                item={item}
                onViewCompany={fetchCompanyPipeline}
                expanded={expandedItems[`company-${item.company.id}`]}
                onToggle={() => toggleExpand(`company-${item.company.id}`)}
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Company Detail View
  if (viewMode === 'company-detail' && selectedCompany) {
    return (
      <div className="space-y-6">
        <button
          onClick={() => {
            setViewMode('overview');
            setSelectedCompany(null);
          }}
          className="text-primary-600 hover:text-primary-800 font-medium text-sm"
        >
          ← Back to Overview
        </button>

        <div className="dashboard-card">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">{selectedCompany.company.companyName}</h2>
          <p className="text-gray-600">{selectedCompany.company.industry}</p>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
            <StatCard
              icon={Users}
              label="Total Leads"
              value={selectedCompany.stats.totalLeads}
              color="blue"
            />
            <StatCard
              icon={TrendingUp}
              label="Active Leads"
              value={selectedCompany.stats.activeLeads}
              color="green"
            />
            <StatCard
              icon={CheckCircle}
              label="Won Deals"
              value={selectedCompany.stats.wonDeals}
              color="green"
            />
            <StatCard
              icon={DollarSign}
              label="Won Revenue"
              value={`₹${(selectedCompany.stats.wonRevenue / 1000).toFixed(0)}K`}
              color="green"
            />
          </div>
        </div>

        {/* Pipeline Breakdown */}
        <div className="dashboard-card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Pipeline Breakdown</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {Object.entries(selectedCompany.pipeline).map(([stage, leads]) => (
              <div key={stage} className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-gray-900">{leads.length}</div>
                <div className="text-sm text-gray-600 capitalize mt-1">{stage.replace('closed', 'Closed ')}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Leads List */}
        <div className="dashboard-card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">All Leads</h3>
          <div className="space-y-3">
            {selectedCompany.leads.map((lead, idx) => (
              <LeadDetailCard
                key={idx}
                lead={lead}
                expanded={expandedItems[`lead-${lead._id}`]}
                onToggle={() => toggleExpand(`lead-${lead._id}`)}
              />
            ))}
          </div>
        </div>

        {/* Recent Activities */}
        <div className="dashboard-card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activities</h3>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {selectedCompany.recentActivities.map((activity, idx) => (
              <ActivityCard key={idx} activity={activity} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return null;
};

// Helper Components
const StatCard = ({ icon: Icon, label, value, color }) => (
  <div className="dashboard-card">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-xs text-gray-600">{label}</p>
        <p className="text-xl font-bold text-gray-900">{value}</p>
      </div>
      <Icon className={`h-8 w-8 text-${color}-600`} />
    </div>
  </div>
);

const FollowupCard = ({ followup, isOverdue = false }) => (
  <div className={`p-3 rounded-lg border ${isOverdue ? 'bg-red-50 border-red-200' : 'bg-white border-gray-200'}`}>
    <div className="flex justify-between items-start mb-2">
      <div className="flex-1">
        <div className="font-medium text-gray-900">{followup.leadName}</div>
        <div className="text-sm text-gray-600">{followup.company}</div>
      </div>
      <span className="px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-800 capitalize">
        {followup.type}
      </span>
    </div>
    <div className="text-sm text-gray-700 mb-1">{followup.notes}</div>
    <div className="flex items-center justify-between text-xs text-gray-500">
      <span>{formatDate(followup.date)}</span>
      <span>{followup.assignedTo}</span>
    </div>
  </div>
);

const TargetMappingCard = ({ mapping, onViewDetails, onViewCompany, expanded, onToggle }) => (
  <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
    <div className="flex justify-between items-start mb-3">
      <div className="flex-1">
        <div className="font-semibold text-gray-900">
          {mapping.target.salesRep.firstName} {mapping.target.salesRep.lastName} - {mapping.target.period}
        </div>
        <div className="text-sm text-gray-600">
          {formatDate(mapping.target.startDate)} - {formatDate(mapping.target.endDate)}
        </div>
      </div>
      <button onClick={onToggle} className="text-gray-600 hover:text-gray-900">
        {expanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
      </button>
    </div>

    <div className="grid grid-cols-4 gap-3 mb-3">
      <div className="text-center p-2 bg-white rounded">
        <div className="text-xs text-gray-600">Revenue</div>
        <div className="text-sm font-semibold text-gray-900">
          ₹{(mapping.achieved.revenue / 1000).toFixed(0)}K / ₹{(mapping.goals.revenue / 1000).toFixed(0)}K
        </div>
      </div>
      <div className="text-center p-2 bg-white rounded">
        <div className="text-xs text-gray-600">Companies</div>
        <div className="text-sm font-semibold text-gray-900">
          {mapping.achieved.companies} / {mapping.goals.companies}
        </div>
      </div>
      <div className="text-center p-2 bg-white rounded">
        <div className="text-xs text-gray-600">Leads</div>
        <div className="text-sm font-semibold text-gray-900">
          {mapping.achieved.leads} / {mapping.goals.leads}
        </div>
      </div>
      <div className="text-center p-2 bg-white rounded">
        <div className="text-xs text-gray-600">Conversions</div>
        <div className="text-sm font-semibold text-gray-900">
          {mapping.achieved.conversions} / {mapping.goals.conversions}
        </div>
      </div>
    </div>

    {expanded && (
      <div className="mt-3 pt-3 border-t border-gray-200">
        <div className="text-sm font-medium text-gray-700 mb-2">Companies ({mapping.companies.length})</div>
        <div className="space-y-2">
          {mapping.companies.map((company, idx) => (
            <div key={idx} className="flex justify-between items-center p-2 bg-white rounded text-sm">
              <div>
                <span className="font-medium">{company.name}</span>
                <span className="text-gray-500 ml-2">({company.industry})</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-gray-600">{company.leadsCount} leads</span>
                <span className="text-green-600 font-medium">{company.wonDeals} won</span>
                <button
                  onClick={() => onViewCompany(company.id)}
                  className="text-primary-600 hover:text-primary-800"
                >
                  <Eye className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
        <button
          onClick={() => onViewDetails(mapping.target.id)}
          className="mt-3 text-sm text-primary-600 hover:text-primary-800 font-medium"
        >
          View Full Target Details →
        </button>
      </div>
    )}
  </div>
);

const PipelineStageCard = ({ stage, expanded, onToggle }) => {
  const stageColors = {
    lead: 'blue',
    qualified: 'indigo',
    proposal: 'yellow',
    negotiation: 'orange',
    closedWon: 'green',
    closedLost: 'red'
  };
  
  const color = stageColors[stage.stage] || 'gray';

  return (
    <div className={`border-2 border-${color}-200 rounded-lg p-4 bg-${color}-50`}>
      <div className="flex justify-between items-center mb-2">
        <h4 className="font-semibold text-gray-900 capitalize">{stage.stage.replace('closed', 'Closed ')}</h4>
        <button onClick={onToggle} className="text-gray-600 hover:text-gray-900">
          {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </button>
      </div>
      <div className="text-2xl font-bold text-gray-900 mb-1">{stage.count}</div>
      <div className="text-sm text-gray-600">₹{(stage.value / 1000).toFixed(0)}K</div>

      {expanded && stage.leads.length > 0 && (
        <div className="mt-3 pt-3 border-t border-gray-200 space-y-2">
          {stage.leads.slice(0, 5).map((lead, idx) => (
            <div key={idx} className="text-sm bg-white p-2 rounded">
              <div className="font-medium">{lead.name}</div>
              <div className="text-gray-600">{lead.company}</div>
              <div className="text-gray-500 text-xs mt-1">
                {lead.daysSinceContact} days since contact
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const CompanyHierarchyCard = ({ item, onViewCompany, expanded, onToggle }) => (
  <div className="border border-gray-200 rounded-lg p-4 bg-white">
    <div className="flex justify-between items-start mb-3">
      <div className="flex-1">
        <h4 className="font-semibold text-gray-900">{item.company.name}</h4>
        <p className="text-sm text-gray-600">{item.company.industry}</p>
      </div>
      <button onClick={onToggle} className="text-gray-600 hover:text-gray-900">
        {expanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
      </button>
    </div>

    <div className="grid grid-cols-4 gap-2 mb-3 text-sm">
      <div>
        <div className="text-gray-600">Total Leads</div>
        <div className="font-semibold">{item.statistics.totalLeads}</div>
      </div>
      <div>
        <div className="text-gray-600">Active</div>
        <div className="font-semibold text-green-600">{item.statistics.activeLeads}</div>
      </div>
      <div>
        <div className="text-gray-600">Won</div>
        <div className="font-semibold text-green-600">{item.statistics.wonDeals}</div>
      </div>
      <div>
        <div className="text-gray-600">Revenue</div>
        <div className="font-semibold">₹{(item.statistics.wonValue / 1000).toFixed(0)}K</div>
      </div>
    </div>

    {expanded && (
      <div className="mt-3 pt-3 border-t border-gray-200 space-y-2">
        {item.leads.map((lead, idx) => (
          <div key={idx} className="p-3 bg-gray-50 rounded">
            <div className="flex justify-between items-start mb-2">
              <div>
                <div className="font-medium text-gray-900">{lead.name}</div>
                <div className="text-sm text-gray-600">{lead.designation}</div>
              </div>
              <span className={`px-2 py-1 rounded text-xs font-medium ${
                lead.stage === 'closedWon' ? 'bg-green-100 text-green-800' :
                lead.stage === 'closedLost' ? 'bg-red-100 text-red-800' :
                'bg-blue-100 text-blue-800'
              }`}>
                {lead.stage}
              </span>
            </div>
            <div className="grid grid-cols-3 gap-2 text-sm">
              <div>
                <span className="text-gray-600">Value:</span>
                <span className="font-medium ml-1">₹{(lead.potentialValue / 1000).toFixed(0)}K</span>
              </div>
              <div>
                <span className="text-gray-600">Probability:</span>
                <span className="font-medium ml-1">{lead.probability}%</span>
              </div>
              <div>
                <span className="text-gray-600">Followups:</span>
                <span className="font-medium ml-1">{lead.followUps.length}</span>
              </div>
            </div>
          </div>
        ))}
        <button
          onClick={() => onViewCompany(item.company.id)}
          className="text-sm text-primary-600 hover:text-primary-800 font-medium"
        >
          View Full Company Pipeline →
        </button>
      </div>
    )}
  </div>
);

const ProgressCard = ({ label, target, achieved, percentage, prefix = '' }) => (
  <div className="bg-white rounded-lg p-4 border border-gray-200">
    <div className="text-sm text-gray-600 mb-1">{label}</div>
    <div className="text-2xl font-bold text-gray-900 mb-2">
      {prefix}{achieved.toLocaleString()} / {prefix}{target.toLocaleString()}
    </div>
    <div className="w-full bg-gray-200 rounded-full h-2 mb-1">
      <div
        className={`h-2 rounded-full ${
          parseFloat(percentage) >= 100 ? 'bg-green-600' :
          parseFloat(percentage) >= 75 ? 'bg-blue-600' :
          parseFloat(percentage) >= 50 ? 'bg-yellow-600' :
          'bg-red-600'
        }`}
        style={{ width: `${Math.min(parseFloat(percentage), 100)}%` }}
      />
    </div>
    <div className="text-sm text-gray-600">{percentage}% Complete</div>
  </div>
);

const LeadDetailCard = ({ lead, expanded, onToggle }) => (
  <div className="border border-gray-200 rounded-lg p-4 bg-white">
    <div className="flex justify-between items-start">
      <div className="flex-1">
        <div className="font-semibold text-gray-900">{lead.name}</div>
        <div className="text-sm text-gray-600">{lead.designation}</div>
      </div>
      <div className="flex items-center gap-2">
        <span className={`px-2 py-1 rounded text-xs font-medium ${
          lead.stage === 'closedWon' ? 'bg-green-100 text-green-800' :
          lead.stage === 'closedLost' ? 'bg-red-100 text-red-800' :
          'bg-blue-100 text-blue-800'
        }`}>
          {lead.stage}
        </span>
        <button onClick={onToggle} className="text-gray-600 hover:text-gray-900">
          {expanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
        </button>
      </div>
    </div>

    {expanded && (
      <div className="mt-4 pt-4 border-t border-gray-200">
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <div className="text-sm text-gray-600">Potential Value</div>
            <div className="font-semibold">₹{lead.potentialValue?.toLocaleString()}</div>
          </div>
          <div>
            <div className="text-sm text-gray-600">Probability</div>
            <div className="font-semibold">{lead.probability}%</div>
          </div>
        </div>

        {lead.followUps && lead.followUps.length > 0 && (
          <div>
            <div className="text-sm font-medium text-gray-700 mb-2">Followups ({lead.followUps.length})</div>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {lead.followUps.slice(0, 5).map((followup, idx) => (
                <div key={idx} className="text-sm p-2 bg-gray-50 rounded">
                  <div className="flex justify-between items-start mb-1">
                    <span className="font-medium capitalize">{followup.type}</span>
                    <span className="text-xs text-gray-500">{formatDate(followup.createdAt)}</span>
                  </div>
                  <div className="text-gray-700">{followup.notes}</div>
                  {followup.outcome && (
                    <div className="text-gray-600 mt-1">Outcome: {followup.outcome}</div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    )}
  </div>
);

const ActivityCard = ({ activity }) => (
  <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
    <div className="flex justify-between items-start">
      <div className="flex-1">
        <div className="font-medium text-gray-900">{activity.description}</div>
        {activity.leadName && (
          <div className="text-sm text-gray-600">
            {activity.leadName} - {activity.companyName}
          </div>
        )}
        {activity.notes && (
          <div className="text-sm text-gray-700 mt-1">{activity.notes}</div>
        )}
      </div>
      <div className="text-xs text-gray-500 whitespace-nowrap ml-4">
        {formatDate(activity.date)}
      </div>
    </div>
  </div>
);

export default ComprehensiveMonitoring;
