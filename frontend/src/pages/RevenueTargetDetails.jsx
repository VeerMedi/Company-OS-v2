import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Target, DollarSign, Calendar, Users, CheckCircle, Clock, Building2, TrendingUp, Mail, Phone } from 'lucide-react';
import api from '../utils/api';
import { showToast } from '../utils/toast';
import { formatCurrency, formatDate } from '../utils/helpers';

const RevenueTargetDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [target, setTarget] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [companies, setCompanies] = useState([]);
  const [leads, setLeads] = useState([]);

  useEffect(() => {
    fetchTargetDetails();
  }, [id]);

  const fetchTargetDetails = async () => {
    setIsLoading(true);
    try {
      const response = await api.get(`/revenue/targets/${id}`);
      const targetData = response.data.data;
      setTarget(targetData);

      // Fetch associated companies and leads if assignedReps exist
      if (targetData.assignedReps?._id) {
        try {
          const companiesRes = await api.get(`/companies?assignedTo=${targetData.assignedReps._id}`);
          setCompanies(companiesRes.data.data || []);

          const leadsRes = await api.get(`/leads?assignedTo=${targetData.assignedReps._id}`);
          setLeads(leadsRes.data.data || []);
        } catch (err) {
          console.error('Error fetching related data:', err);
        }
      }
    } catch (error) {
      console.error('Error fetching target details:', error);
      showToast.error('Failed to load revenue target details');
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      'pending': { color: 'bg-yellow-100 text-yellow-800', icon: Clock },
      'accepted': { color: 'bg-green-100 text-green-800', icon: CheckCircle },
      'strategy-submitted': { color: 'bg-blue-100 text-blue-800', icon: TrendingUp },
      'strategy-approved': { color: 'bg-green-100 text-green-800', icon: CheckCircle },
      'in-progress': { color: 'bg-blue-100 text-blue-800', icon: TrendingUp },
      'completed': { color: 'bg-green-100 text-green-800', icon: CheckCircle }
    };

    const config = statusConfig[status] || statusConfig['pending'];
    const Icon = config.icon;

    return (
      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${config.color}`}>
        <Icon className="w-4 h-4 mr-1" />
        {status.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
      </span>
    );
  };

  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!target) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Revenue Target Not Found</h2>
          <p className="text-gray-600 mb-4">The requested revenue target could not be found.</p>
          <button
            onClick={() => navigate('/dashboard')}
            className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back
          </button>
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold text-gray-900">Revenue Target Details</h1>
            {getStatusBadge(target.status)}
          </div>
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Target Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Target Overview Card */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                <Target className="w-5 h-5 mr-2 text-primary-600" />
                Target Overview
              </h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Target Period</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {target.targetMonth !== undefined && target.targetYear 
                      ? `${monthNames[target.targetMonth]} ${target.targetYear}`
                      : `${formatDate(target.startDate)} - ${formatDate(target.endDate)}`
                    }
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Target Amount</p>
                  <p className="text-2xl font-bold text-primary-600">
                    {formatCurrency(target.targetAmount, target.currency)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Current Achievement</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {formatCurrency(target.currentAchievement || 0, target.currency)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Progress</p>
                  <div className="flex items-center">
                    <div className="flex-1 bg-gray-200 rounded-full h-2 mr-2">
                      <div
                        className="bg-primary-600 h-2 rounded-full"
                        style={{ width: `${Math.min((target.currentAchievement / target.targetAmount) * 100, 100)}%` }}
                      ></div>
                    </div>
                    <span className="text-sm font-medium text-gray-900">
                      {Math.round((target.currentAchievement / target.targetAmount) * 100)}%
                    </span>
                  </div>
                </div>
              </div>
              {target.notes && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <p className="text-sm text-gray-500 mb-1">Notes</p>
                  <p className="text-gray-900">{target.notes}</p>
                </div>
              )}
            </div>

            {/* Strategy Details Card */}
            {target.strategy && (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                  <TrendingUp className="w-5 h-5 mr-2 text-primary-600" />
                  Strategy Details
                </h2>
                <div className="space-y-4">
                  {/* Target Locations */}
                  {target.strategy.targetLocations && target.strategy.targetLocations.length > 0 && (
                    <div>
                      <p className="text-sm font-medium text-gray-700 mb-2">Target Locations</p>
                      <div className="space-y-2">
                        {target.strategy.targetLocations.map((loc, idx) => (
                          <div key={idx} className="bg-gray-50 rounded-lg p-3">
                            <div className="flex justify-between items-start mb-1">
                              <p className="font-medium text-gray-900">{loc.location}</p>
                              <p className="text-primary-600 font-semibold">
                                {formatCurrency(loc.targetAmount, target.currency)}
                              </p>
                            </div>
                            {loc.reasoning && (
                              <p className="text-sm text-gray-600">{loc.reasoning}</p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Expected Metrics */}
                  <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-200">
                    {target.strategy.expectedCompanies && (
                      <div>
                        <p className="text-sm text-gray-500">Expected Companies</p>
                        <p className="text-lg font-semibold text-gray-900">
                          {target.strategy.expectedCompanies}
                        </p>
                      </div>
                    )}
                    {target.strategy.expectedLeads && (
                      <div>
                        <p className="text-sm text-gray-500">Expected Leads</p>
                        <p className="text-lg font-semibold text-gray-900">
                          {target.strategy.expectedLeads}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Related Data */}
            <div className="grid grid-cols-2 gap-4">
              {/* Companies Card */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                  <Building2 className="w-5 h-5 mr-2 text-primary-600" />
                  Companies
                </h3>
                <p className="text-3xl font-bold text-primary-600">{companies.length}</p>
                <p className="text-sm text-gray-500 mt-1">Total companies assigned</p>
              </div>

              {/* Leads Card */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                  <Users className="w-5 h-5 mr-2 text-primary-600" />
                  Leads
                </h3>
                <p className="text-3xl font-bold text-primary-600">{leads.length}</p>
                <p className="text-sm text-gray-500 mt-1">Total leads assigned</p>
              </div>
            </div>
          </div>

          {/* Right Column - People Info */}
          <div className="space-y-6">
            {/* Assigned To Card */}
            {target.assignedTo && (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Assigned To (HOS)</h2>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-gray-500">Name</p>
                    <p className="text-base font-medium text-gray-900">
                      {target.assignedTo.firstName} {target.assignedTo.lastName}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Email</p>
                    <a
                      href={`mailto:${target.assignedTo.email}`}
                      className="text-base text-primary-600 hover:text-primary-700 flex items-center"
                    >
                      <Mail className="w-4 h-4 mr-1" />
                      {target.assignedTo.email}
                    </a>
                  </div>
                  {target.assignedTo.phone && (
                    <div>
                      <p className="text-sm text-gray-500">Phone</p>
                      <a
                        href={`tel:${target.assignedTo.phone}`}
                        className="text-base text-primary-600 hover:text-primary-700 flex items-center"
                      >
                        <Phone className="w-4 h-4 mr-1" />
                        {target.assignedTo.phone}
                      </a>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Assigned Sales Rep Card */}
            {target.assignedReps && (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Assigned Sales Rep</h2>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-gray-500">Name</p>
                    <p className="text-base font-medium text-gray-900">
                      {target.assignedReps.firstName} {target.assignedReps.lastName}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Email</p>
                    <a
                      href={`mailto:${target.assignedReps.email}`}
                      className="text-base text-primary-600 hover:text-primary-700 flex items-center"
                    >
                      <Mail className="w-4 h-4 mr-1" />
                      {target.assignedReps.email}
                    </a>
                  </div>
                  {target.assignedReps.phone && (
                    <div>
                      <p className="text-sm text-gray-500">Phone</p>
                      <a
                        href={`tel:${target.assignedReps.phone}`}
                        className="text-base text-primary-600 hover:text-primary-700 flex items-center"
                      >
                        <Phone className="w-4 h-4 mr-1" />
                        {target.assignedReps.phone}
                      </a>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Set By Card */}
            {target.setBy && (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Created By</h2>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-gray-500">Name</p>
                    <p className="text-base font-medium text-gray-900">
                      {target.setBy.firstName} {target.setBy.lastName}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Email</p>
                    <a
                      href={`mailto:${target.setBy.email}`}
                      className="text-base text-primary-600 hover:text-primary-700 flex items-center"
                    >
                      <Mail className="w-4 h-4 mr-1" />
                      {target.setBy.email}
                    </a>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Date Created</p>
                    <p className="text-base text-gray-900">
                      {formatDate(target.createdAt)}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RevenueTargetDetails;
