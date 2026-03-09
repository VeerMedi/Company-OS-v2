import React, { useState, useEffect } from 'react';
import { DollarSign, TrendingUp, Target, CheckCircle, XCircle, Clock, Plus, Edit, Eye } from 'lucide-react';
import CreateRevenueTargetModal from './sales/modals/CreateRevenueTargetModal';
import api from '../utils/api';
import { showToast } from '../utils/toast';
import { formatCurrency, formatDate } from '../utils/helpers';

const RevenueTargetManagement = ({ userRole = 'co-founder' }) => {
  const [targets, setTargets] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showStrategyModal, setShowStrategyModal] = useState(false);
  const [selectedTarget, setSelectedTarget] = useState(null);
  const [hosList, setHosList] = useState([]);



  const [strategy, setStrategy] = useState({
    targetLocations: [{ location: '', targetAmount: '', reasoning: '' }],
    expectedCompanies: '',
    expectedLeads: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const endpoint = userRole === 'co-founder'
        ? '/revenue/targets?setBy=me'
        : '/revenue/targets?assignedTo=me';

      const response = await api.get(endpoint);
      setTargets(response.data.data || []);

      // Fetch HOS users for co-founder
      if (userRole === 'co-founder') {
        const hosRes = await api.get('/users?role=head-of-sales');
        setHosList(hosRes.data.data || []);
      }
    } catch (error) {
      console.error('Error fetching targets:', error);
      showToast.error('Failed to load revenue targets');
    } finally {
      setIsLoading(false);
    }
  };



  const handleHOSRespond = async (targetId, status, message) => {
    try {
      await api.put(`/revenue/targets/${targetId}/respond`, { status, message });
      showToast.success('Response submitted successfully');
      fetchData();
    } catch (error) {
      showToast.error('Failed to submit response');
    }
  };

  const handleProposeStrategy = async (e) => {
    e.preventDefault();
    try {
      await api.put(`/revenue/targets/${selectedTarget._id}/strategy`, strategy);
      showToast.success('Strategy proposed successfully');
      setShowStrategyModal(false);
      fetchData();
    } catch (error) {
      showToast.error('Failed to propose strategy');
    }
  };

  const handleReviewStrategy = async (targetId, approved, feedback) => {
    try {
      await api.put(`/revenue/targets/${targetId}/review`, { approved, feedback });
      showToast.success(approved ? 'Strategy approved' : 'Strategy revision requested');
      fetchData();
    } catch (error) {
      showToast.error('Failed to review strategy');
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      approved: 'bg-blue-100 text-blue-800',
      'in-progress': 'bg-purple-100 text-purple-800',
      completed: 'bg-green-100 text-green-800',
      expired: 'bg-red-100 text-red-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
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
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Revenue Targets</h2>
          <p className="text-gray-600 mt-1">
            {userRole === 'co-founder' ? 'Set and monitor revenue goals' : 'View and respond to assigned targets'}
          </p>
        </div>
        {userRole === 'co-founder' && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
          >
            <Plus className="w-5 h-5" />
            Create Target
          </button>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Targets</p>
              <p className="text-2xl font-bold text-gray-900">{targets.length}</p>
            </div>
            <Target className="w-8 h-8 text-blue-600" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Target Amount</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(targets.reduce((sum, t) => sum + t.targetAmount, 0))}
              </p>
            </div>
            <DollarSign className="w-8 h-8 text-green-600" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Achieved</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(targets.reduce((sum, t) => sum + t.achievedAmount, 0))}
              </p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Overall Progress</p>
              <p className="text-2xl font-bold text-gray-900">
                {targets.length > 0
                  ? Math.round((targets.reduce((sum, t) => sum + t.achievedAmount, 0) / targets.reduce((sum, t) => sum + t.targetAmount, 0)) * 100)
                  : 0}%
              </p>
            </div>
            <TrendingUp className="w-8 h-8 text-purple-600" />
          </div>
        </div>
      </div>

      {/* Targets List */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Revenue Targets</h3>
        </div>
        <div className="divide-y divide-gray-200">
          {targets.length === 0 ? (
            <div className="px-6 py-12 text-center text-gray-500">
              No revenue targets found. {userRole === 'co-founder' && 'Create your first target to get started.'}
            </div>
          ) : (
            targets.map((target) => (
              <div key={target._id} className="px-6 py-4 hover:bg-gray-50">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h4 className="text-lg font-semibold text-gray-900">
                        {target.targetPeriod.charAt(0).toUpperCase() + target.targetPeriod.slice(1)} Target
                      </h4>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(target.status)}`}>
                        {target.status}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="text-gray-600">Period</p>
                        <p className="font-medium text-gray-900">
                          {formatDate(target.startDate)} - {formatDate(target.endDate)}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-600">Target Amount</p>
                        <p className="font-medium text-gray-900">{formatCurrency(target.targetAmount)}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Achieved</p>
                        <p className="font-medium text-green-600">{formatCurrency(target.achievedAmount)}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Progress</p>
                        <div className="flex items-center gap-2">
                          <div className="flex-1 bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-primary-600 h-2 rounded-full"
                              style={{ width: `${target.progressPercentage}%` }}
                            ></div>
                          </div>
                          <span className="font-medium text-gray-900">{target.progressPercentage}%</span>
                        </div>
                      </div>
                    </div>
                    {target.notes && (
                      <p className="mt-2 text-sm text-gray-600">{target.notes}</p>
                    )}
                    {userRole === 'head-of-sales' && target.hosResponse && (
                      <div className="mt-2 p-3 bg-blue-50 rounded-lg">
                        <p className="text-sm text-gray-700">
                          <span className="font-medium">Your Response:</span> {target.hosResponse.status} - {target.hosResponse.message}
                        </p>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    {userRole === 'head-of-sales' && target.status === 'pending' && !target.hosResponse?.status && (
                      <>
                        <button
                          onClick={() => handleHOSRespond(target._id, 'accepted', 'Target accepted')}
                          className="p-2 text-green-600 hover:bg-green-50 rounded-lg"
                          title="Accept"
                        >
                          <CheckCircle className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => {
                            setSelectedTarget(target);
                            setShowStrategyModal(true);
                          }}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                          title="Propose Strategy"
                        >
                          <Edit className="w-5 h-5" />
                        </button>
                      </>
                    )}
                    {userRole === 'co-founder' && target.strategy?.proposedAt && !target.strategy?.approvedByCoFounder && (
                      <>
                        <button
                          onClick={() => handleReviewStrategy(target._id, true, 'Strategy approved')}
                          className="p-2 text-green-600 hover:bg-green-50 rounded-lg"
                          title="Approve Strategy"
                        >
                          <CheckCircle className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => handleReviewStrategy(target._id, false, 'Needs revision')}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                          title="Request Revision"
                        >
                          <XCircle className="w-5 h-5" />
                        </button>
                      </>
                    )}
                    <button className="p-2 text-gray-600 hover:bg-gray-50 rounded-lg" title="View Details">
                      <Eye className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Create Target Modal */}
      <CreateRevenueTargetModal
        show={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={fetchData}
        teamMembers={hosList}
      />

      {/* Strategy Modal */}
      {showStrategyModal && selectedTarget && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Propose Strategy</h3>
            </div>
            <form onSubmit={handleProposeStrategy} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Expected Companies</label>
                  <input
                    type="number"
                    value={strategy.expectedCompanies}
                    onChange={(e) => setStrategy({ ...strategy, expectedCompanies: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    placeholder="50"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Expected Leads</label>
                  <input
                    type="number"
                    value={strategy.expectedLeads}
                    onChange={(e) => setStrategy({ ...strategy, expectedLeads: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    placeholder="200"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Target Locations</label>
                {strategy.targetLocations.map((loc, index) => (
                  <div key={index} className="grid grid-cols-3 gap-3 mb-3">
                    <input
                      type="text"
                      value={loc.location}
                      onChange={(e) => {
                        const newLocs = [...strategy.targetLocations];
                        newLocs[index].location = e.target.value;
                        setStrategy({ ...strategy, targetLocations: newLocs });
                      }}
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                      placeholder="Bangalore"
                    />
                    <input
                      type="number"
                      value={loc.targetAmount}
                      onChange={(e) => {
                        const newLocs = [...strategy.targetLocations];
                        newLocs[index].targetAmount = e.target.value;
                        setStrategy({ ...strategy, targetLocations: newLocs });
                      }}
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                      placeholder="5000000"
                    />
                    <input
                      type="text"
                      value={loc.reasoning}
                      onChange={(e) => {
                        const newLocs = [...strategy.targetLocations];
                        newLocs[index].reasoning = e.target.value;
                        setStrategy({ ...strategy, targetLocations: newLocs });
                      }}
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                      placeholder="Strong tech market"
                    />
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => setStrategy({
                    ...strategy,
                    targetLocations: [...strategy.targetLocations, { location: '', targetAmount: '', reasoning: '' }]
                  })}
                  className="text-sm text-primary-600 hover:text-primary-700"
                >
                  + Add Location
                </button>
              </div>
              <div className="flex gap-3 justify-end pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowStrategyModal(false);
                    setSelectedTarget(null);
                  }}
                  className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                >
                  Propose Strategy
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default RevenueTargetManagement;
