import React, { useState, useEffect } from 'react';
import { Building2, Upload, CheckCircle, XCircle, Clock, Eye, FileText, Plus, Edit2 } from 'lucide-react';
import api from '../utils/api';
import { showToast } from '../utils/toast';
import { formatDate } from '../utils/helpers';

const CompanyTargetManagement = ({ userRole = 'individual' }) => {
  const [companies, setCompanies] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [showDocumentModal, setShowDocumentModal] = useState(false);

  const [newCompany, setNewCompany] = useState({
    companyName: '',
    industry: '',
    website: '',
    location: { city: '', state: '', country: 'India' },
    employeeCount: 'unknown',
    revenue: 'unknown',
    potentialValue: '',
    priority: 'medium',
    research: {
      keyDecisionMakers: '',
      painPoints: '',
      competitors: '',
      budget: '',
      timeline: '',
      notes: ''
    }
  });

  const [approvalData, setApprovalData] = useState({
    approved: true,
    notes: ''
  });

  useEffect(() => {
    fetchCompanies();
  }, []);

  const fetchCompanies = async () => {
    setIsLoading(true);
    try {
      const endpoint = userRole === 'head-of-sales'
        ? '/companies/pending-approval'
        : '/companies?assignedTo=me';
      
      const response = await api.get(endpoint);
      setCompanies(response.data.data || []);
    } catch (error) {
      console.error('Error fetching companies:', error);
      showToast.error('Failed to load companies');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateCompany = async (e) => {
    e.preventDefault();
    try {
      await api.post('/companies', newCompany);
      showToast.success('Company added successfully');
      setShowCreateModal(false);
      resetForm();
      fetchCompanies();
    } catch (error) {
      showToast.error(error.response?.data?.message || 'Failed to add company');
    }
  };

  const handleApproveReject = async (e) => {
    e.preventDefault();
    try {
      await api.put(`/companies/${selectedCompany._id}/review`, approvalData);
      showToast.success(approvalData.approved ? 'Company approved' : 'Company rejected');
      setShowApprovalModal(false);
      setSelectedCompany(null);
      fetchCompanies();
    } catch (error) {
      showToast.error('Failed to process approval');
    }
  };

  const handleUploadDocument = async (companyId, file, documentType, description) => {
    try {
      const formData = new FormData();
      formData.append('document', file);
      formData.append('documentType', documentType);
      formData.append('description', description);

      await api.post(`/companies/${companyId}/documents`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      showToast.success('Document uploaded successfully');
      fetchCompanies();
    } catch (error) {
      showToast.error('Failed to upload document');
    }
  };

  const resetForm = () => {
    setNewCompany({
      companyName: '',
      industry: '',
      website: '',
      location: { city: '', state: '', country: 'India' },
      employeeCount: 'unknown',
      revenue: 'unknown',
      potentialValue: '',
      priority: 'medium',
      research: {
        keyDecisionMakers: '',
        painPoints: '',
        competitors: '',
        budget: '',
        timeline: '',
        notes: ''
      }
    });
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      approved: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800',
      'needs-revision': 'bg-orange-100 text-orange-800',
      identified: 'bg-blue-100 text-blue-800',
      researching: 'bg-purple-100 text-purple-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getPriorityColor = (priority) => {
    const colors = {
      low: 'text-gray-600',
      medium: 'text-blue-600',
      high: 'text-orange-600',
      critical: 'text-red-600'
    };
    return colors[priority] || 'text-gray-600';
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
          <h2 className="text-2xl font-bold text-gray-900">
            {userRole === 'head-of-sales' ? 'Company Approvals' : 'Target Companies'}
          </h2>
          <p className="text-gray-600 mt-1">
            {userRole === 'head-of-sales' 
              ? 'Review and approve company targets submitted by sales team'
              : 'Identify and research target companies for pursuit'}
          </p>
        </div>
        {userRole !== 'head-of-sales' && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
          >
            <Plus className="w-5 h-5" />
            Add Company
          </button>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Companies</p>
              <p className="text-2xl font-bold text-gray-900">{companies.length}</p>
            </div>
            <Building2 className="w-8 h-8 text-blue-600" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Pending Approval</p>
              <p className="text-2xl font-bold text-yellow-600">
                {companies.filter(c => c.approvalStatus === 'pending').length}
              </p>
            </div>
            <Clock className="w-8 h-8 text-yellow-600" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Approved</p>
              <p className="text-2xl font-bold text-green-600">
                {companies.filter(c => c.approvalStatus === 'approved').length}
              </p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">High Priority</p>
              <p className="text-2xl font-bold text-orange-600">
                {companies.filter(c => c.priority === 'high' || c.priority === 'critical').length}
              </p>
            </div>
            <Building2 className="w-8 h-8 text-orange-600" />
          </div>
        </div>
      </div>

      {/* Companies List */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Companies</h3>
        </div>
        <div className="divide-y divide-gray-200">
          {companies.length === 0 ? (
            <div className="px-6 py-12 text-center text-gray-500">
              No companies found. {userRole !== 'head-of-sales' && 'Add your first target company to get started.'}
            </div>
          ) : (
            companies.map((company) => (
              <div key={company._id} className="px-6 py-4 hover:bg-gray-50">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <Building2 className={`w-5 h-5 ${getPriorityColor(company.priority)}`} />
                      <h4 className="text-lg font-semibold text-gray-900">{company.companyName}</h4>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(company.approvalStatus)}`}>
                        {company.approvalStatus}
                      </span>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(company.status)}`}>
                        {company.status}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mt-3">
                      <div>
                        <p className="text-gray-600">Industry</p>
                        <p className="font-medium text-gray-900">{company.industry || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Location</p>
                        <p className="font-medium text-gray-900">
                          {company.location?.city}, {company.location?.state}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-600">Potential Value</p>
                        <p className="font-medium text-green-600">₹{company.potentialValue?.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Documents</p>
                        <p className="font-medium text-gray-900">{company.studyDocuments?.length || 0}</p>
                      </div>
                    </div>
                    {company.research?.keyDecisionMakers && (
                      <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                        <p className="text-sm text-gray-700">
                          <span className="font-medium">Key Decision Makers:</span> {company.research.keyDecisionMakers}
                        </p>
                      </div>
                    )}
                    {company.approvalNotes && (
                      <div className="mt-2 p-3 bg-blue-50 rounded-lg">
                        <p className="text-sm text-gray-700">
                          <span className="font-medium">Approval Notes:</span> {company.approvalNotes}
                        </p>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    {userRole === 'head-of-sales' && company.approvalStatus === 'pending' && (
                      <>
                        <button
                          onClick={() => {
                            setSelectedCompany(company);
                            setApprovalData({ approved: true, notes: '' });
                            setShowApprovalModal(true);
                          }}
                          className="p-2 text-green-600 hover:bg-green-50 rounded-lg"
                          title="Approve"
                        >
                          <CheckCircle className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => {
                            setSelectedCompany(company);
                            setApprovalData({ approved: false, notes: '' });
                            setShowApprovalModal(true);
                          }}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                          title="Reject"
                        >
                          <XCircle className="w-5 h-5" />
                        </button>
                      </>
                    )}
                    {userRole !== 'head-of-sales' && company.approvalStatus === 'needs-revision' && (
                      <button
                        onClick={() => {
                          setSelectedCompany(company);
                          setShowDocumentModal(true);
                        }}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                        title="Update Research"
                      >
                        <Edit2 className="w-5 h-5" />
                      </button>
                    )}
                    <button
                      onClick={() => {
                        setSelectedCompany(company);
                        setShowDocumentModal(true);
                      }}
                      className="p-2 text-gray-600 hover:bg-gray-50 rounded-lg"
                      title="View/Upload Documents"
                    >
                      <FileText className="w-5 h-5" />
                    </button>
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

      {/* Create Company Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-200 sticky top-0 bg-white">
              <h3 className="text-lg font-semibold text-gray-900">Add Target Company</h3>
            </div>
            <form onSubmit={handleCreateCompany} className="p-6 space-y-6">
              {/* Basic Info */}
              <div>
                <h4 className="text-md font-semibold text-gray-900 mb-3">Basic Information</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Company Name *</label>
                    <input
                      type="text"
                      value={newCompany.companyName}
                      onChange={(e) => setNewCompany({ ...newCompany, companyName: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Industry</label>
                    <input
                      type="text"
                      value={newCompany.industry}
                      onChange={(e) => setNewCompany({ ...newCompany, industry: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                      placeholder="Technology, Healthcare, etc."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Website</label>
                    <input
                      type="url"
                      value={newCompany.website}
                      onChange={(e) => setNewCompany({ ...newCompany, website: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                      placeholder="https://example.com"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                    <select
                      value={newCompany.priority}
                      onChange={(e) => setNewCompany({ ...newCompany, priority: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                      <option value="critical">Critical</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Location */}
              <div>
                <h4 className="text-md font-semibold text-gray-900 mb-3">Location</h4>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                    <input
                      type="text"
                      value={newCompany.location.city}
                      onChange={(e) => setNewCompany({ 
                        ...newCompany, 
                        location: { ...newCompany.location, city: e.target.value }
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
                    <input
                      type="text"
                      value={newCompany.location.state}
                      onChange={(e) => setNewCompany({ 
                        ...newCompany, 
                        location: { ...newCompany.location, state: e.target.value }
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Country</label>
                    <input
                      type="text"
                      value={newCompany.location.country}
                      onChange={(e) => setNewCompany({ 
                        ...newCompany, 
                        location: { ...newCompany.location, country: e.target.value }
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                </div>
              </div>

              {/* Company Details */}
              <div>
                <h4 className="text-md font-semibold text-gray-900 mb-3">Company Details</h4>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Employee Count</label>
                    <select
                      value={newCompany.employeeCount}
                      onChange={(e) => setNewCompany({ ...newCompany, employeeCount: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    >
                      <option value="unknown">Unknown</option>
                      <option value="1-10">1-10</option>
                      <option value="11-50">11-50</option>
                      <option value="51-200">51-200</option>
                      <option value="201-500">201-500</option>
                      <option value="501-1000">501-1000</option>
                      <option value="1000+">1000+</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Revenue Range</label>
                    <select
                      value={newCompany.revenue}
                      onChange={(e) => setNewCompany({ ...newCompany, revenue: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    >
                      <option value="unknown">Unknown</option>
                      <option value="<1Cr">&lt;1Cr</option>
                      <option value="1-5Cr">1-5Cr</option>
                      <option value="5-10Cr">5-10Cr</option>
                      <option value="10-50Cr">10-50Cr</option>
                      <option value="50-100Cr">50-100Cr</option>
                      <option value="100Cr+">100Cr+</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Potential Value (₹)</label>
                    <input
                      type="number"
                      value={newCompany.potentialValue}
                      onChange={(e) => setNewCompany({ ...newCompany, potentialValue: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                      placeholder="500000"
                    />
                  </div>
                </div>
              </div>

              {/* Research */}
              <div>
                <h4 className="text-md font-semibold text-gray-900 mb-3">Research & Analysis</h4>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Key Decision Makers</label>
                    <input
                      type="text"
                      value={newCompany.research.keyDecisionMakers}
                      onChange={(e) => setNewCompany({ 
                        ...newCompany, 
                        research: { ...newCompany.research, keyDecisionMakers: e.target.value }
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                      placeholder="CTO, CEO names and titles"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Pain Points</label>
                    <textarea
                      value={newCompany.research.painPoints}
                      onChange={(e) => setNewCompany({ 
                        ...newCompany, 
                        research: { ...newCompany.research, painPoints: e.target.value }
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                      rows="2"
                      placeholder="Current challenges and problems"
                    ></textarea>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Budget Estimate</label>
                    <input
                      type="text"
                      value={newCompany.research.budget}
                      onChange={(e) => setNewCompany({ 
                        ...newCompany, 
                        research: { ...newCompany.research, budget: e.target.value }
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                      placeholder="5-10L annually"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Additional Notes</label>
                    <textarea
                      value={newCompany.research.notes}
                      onChange={(e) => setNewCompany({ 
                        ...newCompany, 
                        research: { ...newCompany.research, notes: e.target.value }
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                      rows="3"
                      placeholder="Additional research findings..."
                    ></textarea>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 justify-end pt-4 border-t">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false);
                    resetForm();
                  }}
                  className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                >
                  Add Company
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Approval Modal */}
      {showApprovalModal && selectedCompany && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-lg w-full">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                {approvalData.approved ? 'Approve Company' : 'Reject Company'}
              </h3>
            </div>
            <form onSubmit={handleApproveReject} className="p-6 space-y-4">
              <div>
                <p className="text-sm text-gray-700 mb-4">
                  Company: <span className="font-semibold">{selectedCompany.companyName}</span>
                </p>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <textarea
                  value={approvalData.notes}
                  onChange={(e) => setApprovalData({ ...approvalData, notes: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  rows="3"
                  placeholder="Add feedback or notes..."
                  required
                ></textarea>
              </div>
              <div className="flex gap-3 justify-end">
                <button
                  type="button"
                  onClick={() => {
                    setShowApprovalModal(false);
                    setSelectedCompany(null);
                  }}
                  className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={`px-4 py-2 text-white rounded-lg ${
                    approvalData.approved 
                      ? 'bg-green-600 hover:bg-green-700' 
                      : 'bg-red-600 hover:bg-red-700'
                  }`}
                >
                  {approvalData.approved ? 'Approve' : 'Reject'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CompanyTargetManagement;
