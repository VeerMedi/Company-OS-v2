import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, AlertCircle, Building2, Eye, CheckCircle, Search, Trash2 } from 'lucide-react';
import { formatDate } from '../../../utils/helpers';
import { getPriorityColor } from '../salesUtils';
import AddCompanyModal from '../modals/AddCompanyModal';
import CreateLeadModal from '../modals/CreateLeadModal';

const CompaniesView = ({ myCompanies = [], onSubmitCompany, onCreateLead, onDeleteCompany }) => {
  const navigate = useNavigate();
  const [showAddCompanyModal, setShowAddCompanyModal] = useState(false);
  const [showCreateLeadModal, setShowCreateLeadModal] = useState(false);
  const [researchDocument, setResearchDocument] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  
  const [companyFormData, setCompanyFormData] = useState({
    companyName: '',
    overview: '',
    industry: '',
    website: '',
    location: {
      city: '',
      state: '',
      country: 'India'
    },
    employeeCount: 'unknown',
    revenue: 'unknown',
    annualRevenueUSD: '',
    geographicalHotspots: '',
    currentTechStack: '',
    currentPainPoints: '',
    automationSaaSUsed: '',
    expectedROIImpact: '',
    keyChallenges: '',
    howHustleHouseCanHelp: '',
    additionalNotes: '',
    wrtRoiPriorityLevel: 'medium',
    proofOfConcept: '',
    latestNews: '',
    potentialValue: '',
    priority: 'medium',
    revenueTarget: '',
    assignedHOS: '',
    research: {
      keyDecisionMakers: '',
      painPoints: '',
      competitors: '',
      budget: '',
      timeline: '',
      potentialServices: ''
    }
  });

  const [newLeadForm, setNewLeadForm] = useState({
    companyId: '',
    clientName: '',
    clientEmail: '',
    clientPhone: '',
    serviceType: '',
    estimatedValue: '',
    leadType: 'warm',
    expectedCloseDate: '',
    notes: ''
  });

  const handleSubmitCompany = async (e) => {
    e.preventDefault();
    const success = await onSubmitCompany(companyFormData, researchDocument);
    if (success) {
      setShowAddCompanyModal(false);
    }
  };

  const handleCreateLead = async (e) => {
    e.preventDefault();
    const success = await onCreateLead(newLeadForm);
    if (success) {
      setShowCreateLeadModal(false);
      setNewLeadForm({
        companyId: '',
        clientName: '',
        clientEmail: '',
        clientPhone: '',
        serviceType: '',
        estimatedValue: '',
        leadType: 'warm',
        expectedCloseDate: '',
        notes: ''
      });
    }
  };

  const handleDeleteCompany = async (companyId, companyName) => {
    if (window.confirm(`Are you sure you want to delete "${companyName}"? This action cannot be undone.`)) {
      await onDeleteCompany(companyId);
    }
  };

  // Filter companies based on search and status
  const filteredCompanies = myCompanies.filter((company) => {
    const matchesSearch = searchQuery === '' || 
      company.companyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      company.industry?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      company.location?.city?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || company.approvalStatus === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Companies</h2>
        <button
          onClick={() => setShowAddCompanyModal(true)}
          className="btn-primary flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Add Company
        </button>
      </div>

      {/* Search and Filter Section */}
      <div className="dashboard-card">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <input
              type="text"
              placeholder="Search by company name, industry, or location..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>
          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
        </div>
        {searchQuery || statusFilter !== 'all' ? (
          <div className="mt-3 text-sm text-gray-600">
            Showing {filteredCompanies.length} of {myCompanies.length} companies
          </div>
        ) : null}
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
          <div className="text-sm text-blue-800">
            <p className="font-medium mb-1">About Company Submissions</p>
            <p>Companies you submit will be reviewed by the Head of Sales (HOS) for approval. Once approved, you can start working on converting them into leads and sales opportunities.</p>
          </div>
        </div>
      </div>

      {filteredCompanies.filter(c => c.approvalStatus === 'approved').length > 0 && (
        <div className="dashboard-card">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Approved Companies - Ready for Leads</h3>
            <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
              {filteredCompanies.filter(c => c.approvalStatus === 'approved').length} approved
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredCompanies
              .filter(c => c.approvalStatus === 'approved')
              .map((company) => (
                <div
                  key={company._id}
                  className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h4 className="font-semibold text-gray-900">{company.companyName}</h4>
                      <p className="text-sm text-gray-500">{company.industry}</p>
                    </div>
                    <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full">
                      Approved
                    </span>
                  </div>
                  <div className="text-sm text-gray-600 mb-3">
                    <div>📍 {company.location?.city || company.location?.state || '-'}</div>
                    {company.potentialValue > 0 && (
                      <div className="font-medium text-green-600">
                        ₹{company.potentialValue.toLocaleString()}
                      </div>
                    )}
                    {company.approvedBy && (
                      <div className="text-xs text-gray-500 mt-1">
                        ✓ Approved by {company.approvedBy.firstName} {company.approvedBy.lastName}
                      </div>
                    )}
                    {company.approvalNotes && (
                      <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded text-xs">
                        <p className="font-medium text-blue-900 mb-1">Manager Notes:</p>
                        <p className="text-blue-700">{company.approvalNotes}</p>
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => {
                      setNewLeadForm({
                        ...newLeadForm,
                        companyId: company._id
                      });
                      setShowCreateLeadModal(true);
                    }}
                    className="w-full btn-primary text-sm flex items-center justify-center gap-2"
                  >
                    <Plus className="h-4 w-4" />
                    Add Lead
                  </button>
                </div>
              ))}
          </div>
        </div>
      )}

      {myCompanies.length === 0 ? (
        <div className="dashboard-card text-center py-12">
          <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500 mb-4">No companies submitted yet</p>
          <button
            onClick={() => setShowAddCompanyModal(true)}
            className="btn-primary inline-flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Add Your First Company
          </button>
        </div>
      ) : filteredCompanies.length === 0 ? (
        <div className="dashboard-card text-center py-12">
          <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500 mb-4">No companies match your search criteria</p>
          <button
            onClick={() => {
              setSearchQuery('');
              setStatusFilter('all');
            }}
            className="text-primary-600 hover:text-primary-700 font-medium"
          >
            Clear Filters
          </button>
        </div>
      ) : (
        <div className="dashboard-card overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Company
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Industry
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Location
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Potential Value
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Priority
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Approval Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredCompanies.map((company) => (
                <tr key={company._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{company.companyName}</div>
                    {company.website && (
                      <a
                        href={company.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-primary-600 hover:underline"
                      >
                        {company.website}
                      </a>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {company.industry || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {company.location?.city || company.location?.state || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {company.potentialValue > 0 ? `₹${company.potentialValue.toLocaleString()}` : '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full capitalize ${getPriorityColor(company.priority)}`}>
                      {company.priority}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      company.approvalStatus === 'approved' ? 'bg-green-100 text-green-800' :
                      company.approvalStatus === 'rejected' ? 'bg-red-100 text-red-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {company.approvalStatus}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <div className="flex gap-2">
                      {company.approvalStatus === 'approved' && (
                        <button
                          onClick={() => {
                            setNewLeadForm({
                              ...newLeadForm,
                              companyId: company._id
                            });
                            setShowCreateLeadModal(true);
                          }}
                          className="text-green-600 hover:text-green-900"
                          title="Create Lead"
                        >
                          <Plus className="h-5 w-5" />
                        </button>
                      )}
                      {company.approvalStatus !== 'approved' && onDeleteCompany && (
                        <button
                          onClick={() => handleDeleteCompany(company._id, company.companyName)}
                          className="text-red-600 hover:text-red-900"
                          title="Delete Company"
                        >
                          <Trash2 className="h-5 w-5" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <AddCompanyModal
        show={showAddCompanyModal}
        onClose={() => setShowAddCompanyModal(false)}
        formData={companyFormData}
        setFormData={setCompanyFormData}
        researchDocument={researchDocument}
        setResearchDocument={setResearchDocument}
        onSubmit={handleSubmitCompany}
      />

      <CreateLeadModal
        show={showCreateLeadModal}
        onClose={() => setShowCreateLeadModal(false)}
        companies={myCompanies}
        formData={newLeadForm}
        setFormData={setNewLeadForm}
        onSubmit={handleCreateLead}
      />
    </div>
  );
};

export default CompaniesView;
