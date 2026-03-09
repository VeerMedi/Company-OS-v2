import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Building2, Target, BarChart3, TrendingUp, DollarSign, CheckCircle } from 'lucide-react';
import { formatDate } from '../../../utils/helpers';
import { getLeadTypeColor, getStageColor, getPriorityColor } from '../salesUtils';
import StatsCard from '../StatsCard';

const DashboardOverview = ({ 
  user, 
  stats = {}, 
  myLeads = [], 
  myCompanies = [], 
  myTargets = [],
  onNavigate
}) => {
  const navigate = useNavigate();

  const dashboardStats = [
    {
      name: 'Total Leads',
      value: stats.total || 0,
      icon: Users,
      color: 'bg-blue-100 text-blue-600'
    },
    {
      name: 'Active Leads',
      value: stats.active || 0,
      icon: TrendingUp,
      color: 'bg-green-100 text-green-600'
    },
    {
      name: 'Won Deals',
      value: stats.won || 0,
      icon: CheckCircle,
      color: 'bg-purple-100 text-purple-600'
    },
    {
      name: 'Revenue in Pipeline',
      value: `₹${(stats.totalValue || 0).toLocaleString()}`,
      icon: DollarSign,
      color: 'bg-yellow-100 text-yellow-600'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-700 rounded-lg shadow-sm">
        <div className="px-6 py-8 text-white">
          <h1 className="text-3xl font-bold">Welcome, {user?.firstName}!</h1>
          <p className="mt-2 text-primary-100">
            Sales Dashboard - Manage your leads and track your performance
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {dashboardStats.map((stat) => (
          <StatsCard
            key={stat.name}
            icon={stat.icon}
            name={stat.name}
            value={stat.value}
            color={stat.color}
          />
        ))}
      </div>

      {/* Quick Access Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <button
          onClick={() => onNavigate && onNavigate('leads-pipeline')}
          className="dashboard-card hover:shadow-lg transition-shadow text-left"
        >
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-100 rounded-lg">
              <Users className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <div className="font-semibold text-gray-900">View All Leads</div>
              <div className="text-sm text-gray-500">Manage your sales pipeline</div>
            </div>
          </div>
        </button>

        <button
          onClick={() => onNavigate && onNavigate('companies')}
          className="dashboard-card hover:shadow-lg transition-shadow text-left"
        >
          <div className="flex items-center gap-4">
            <div className="p-3 bg-purple-100 rounded-lg">
              <Building2 className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <div className="font-semibold text-gray-900">Companies</div>
              <div className="text-sm text-gray-500">Submit for HOS approval</div>
            </div>
          </div>
        </button>

        <button
          onClick={() => onNavigate && onNavigate('my-targets')}
          className="dashboard-card hover:shadow-lg transition-shadow text-left"
        >
          <div className="flex items-center gap-4">
            <div className="p-3 bg-green-100 rounded-lg">
              <Target className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <div className="font-semibold text-gray-900">My Targets</div>
              <div className="text-sm text-gray-500">Track your sales goals</div>
            </div>
          </div>
        </button>

        <button
          onClick={() => navigate('/profile')}
          className="dashboard-card hover:shadow-lg transition-shadow text-left"
        >
          <div className="flex items-center gap-4">
            <div className="p-3 bg-orange-100 rounded-lg">
              <BarChart3 className="h-6 w-6 text-orange-600" />
            </div>
            <div>
              <div className="font-semibold text-gray-900">My Profile</div>
              <div className="text-sm text-gray-500">View your information</div>
            </div>
          </div>
        </button>
      </div>

      {/* Active Leads Overview */}
      <div className="dashboard-card">
        <h3 className="text-lg font-semibold mb-4">Active Leads Overview</h3>
        {myLeads.filter(l => l.status === 'active').length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Users className="h-12 w-12 mx-auto mb-2 text-gray-400" />
            <p>No active leads at the moment</p>
          </div>
        ) : (
          <div className="space-y-3">
            {myLeads
              .filter(l => l.status === 'active')
              .slice(0, 5)
              .map((lead) => (
                <div
                  key={lead._id}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer"
                  onClick={() => navigate(`/lead/${lead._id}`)}
                >
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">{lead.name}</div>
                    <div className="text-sm text-gray-500">{lead.serviceInterest}</div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full capitalize ${getLeadTypeColor(lead.leadType)}`}>
                      {lead.leadType}
                    </span>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full capitalize ${getStageColor(lead.stage)}`}>
                      {lead.stage.replace('-', ' ')}
                    </span>
                    <div className="text-right">
                      <div className="font-semibold text-gray-900">
                        ₹{(lead.potentialValue || 0).toLocaleString()}
                      </div>
                      {lead.expectedCloseDate && (
                        <div className="text-xs text-gray-500">
                          {formatDate(lead.expectedCloseDate)}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
          </div>
        )}
      </div>

      {/* My Companies Overview */}
      {myCompanies.length > 0 && (
        <div className="dashboard-card">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">My Companies</h3>
            <div className="flex gap-2 text-sm">
              <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full font-medium">
                {myCompanies.filter(c => c.approvalStatus === 'approved').length} Approved
              </span>
              <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full font-medium">
                {myCompanies.filter(c => c.approvalStatus === 'pending').length} Pending
              </span>
            </div>
          </div>

          {/* Approved Companies */}
          {myCompanies.filter(c => c.approvalStatus === 'approved').length > 0 && (
            <div className="mb-4">
              <h4 className="text-sm font-semibold text-gray-700 mb-2">✓ Approved - Ready for Leads</h4>
              <div className="space-y-2">
                {myCompanies
                  .filter(c => c.approvalStatus === 'approved')
                  .slice(0, 3)
                  .map((company) => (
                    <div
                      key={company._id}
                      className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg hover:bg-green-100 cursor-pointer"
                      onClick={() => onNavigate && onNavigate('companies')}
                    >
                      <div className="flex-1">
                        <div className="font-medium text-gray-900">{company.companyName}</div>
                        <div className="text-sm text-gray-500">{company.industry || 'No industry specified'}</div>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full capitalize ${getPriorityColor(company.priority)}`}>
                          {company.priority}
                        </span>
                        <div className="text-right">
                          {company.potentialValue > 0 && (
                            <div className="font-semibold text-gray-900">
                              ₹{company.potentialValue.toLocaleString()}
                            </div>
                          )}
                          <div className="text-xs text-gray-500">
                            {company.location?.city || company.location?.state || '-'}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* Pending Companies */}
          {myCompanies.filter(c => c.approvalStatus === 'pending').length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-gray-700 mb-2">⏳ Pending Approval</h4>
              <div className="space-y-2">
                {myCompanies
                  .filter(c => c.approvalStatus === 'pending')
                  .slice(0, 3)
                  .map((company) => (
                    <div
                      key={company._id}
                      className="flex items-center justify-between p-3 bg-yellow-50 border border-yellow-200 rounded-lg hover:bg-yellow-100 cursor-pointer"
                      onClick={() => onNavigate && onNavigate('companies')}
                    >
                      <div className="flex-1">
                        <div className="font-medium text-gray-900">{company.companyName}</div>
                        <div className="text-sm text-gray-500">{company.industry || 'No industry specified'}</div>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full capitalize ${getPriorityColor(company.priority)}`}>
                          {company.priority}
                        </span>
                        <div className="text-right">
                          {company.potentialValue > 0 && (
                            <div className="font-semibold text-gray-900">
                              ₹{company.potentialValue.toLocaleString()}
                            </div>
                          )}
                          <div className="text-xs text-gray-500">
                            {company.location?.city || company.location?.state || '-'}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}

          <button
            onClick={() => onNavigate && onNavigate('companies')}
            className="mt-4 text-sm text-primary-600 hover:text-primary-700 font-medium"
          >
            View all companies →
          </button>
        </div>
      )}

      {/* Current Targets */}
      {myTargets.filter(t => t.status === 'active').length > 0 && (
        <div className="dashboard-card">
          <h3 className="text-lg font-semibold mb-4">Current Targets</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {myTargets
              .filter(t => t.status === 'active')
              .map((target) => (
                <div key={target._id} className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <div className="font-medium text-gray-900 capitalize">
                        {target.targetPeriod} Target
                      </div>
                      <div className="text-xs text-gray-500">
                        {formatDate(target.startDate)} - {formatDate(target.endDate)}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-primary-600">
                        {target.progressPercentage}%
                      </div>
                    </div>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                    <div
                      className={`h-2 rounded-full ${
                        target.progressPercentage >= 100 ? 'bg-green-500' :
                        target.progressPercentage >= 75 ? 'bg-blue-500' :
                        target.progressPercentage >= 50 ? 'bg-yellow-500' :
                        'bg-red-500'
                      }`}
                      style={{ width: `${Math.min(target.progressPercentage, 100)}%` }}
                    ></div>
                  </div>
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>₹{target.revenueAchieved.toLocaleString()}</span>
                    <span>/ ₹{target.revenueTarget.toLocaleString()}</span>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardOverview;
