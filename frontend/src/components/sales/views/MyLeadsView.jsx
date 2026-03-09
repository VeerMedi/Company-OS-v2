import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Phone, Eye, MessageSquare, Upload, AlertCircle, Search } from 'lucide-react';
import { getLeadTypeColor, getStageColor, getStatusColor } from '../salesUtils';
import AddFollowUpModal from '../modals/AddFollowUpModal';
import FollowUpEvidenceModal from '../modals/FollowUpEvidenceModal';

const MyLeadsView = ({ myLeads = [], onUpdateStage, onUpdateStatus, onAddFollowUp, onSubmitEvidence }) => {
  const navigate = useNavigate();
  const [showAddFollowUpModal, setShowAddFollowUpModal] = useState(false);
  const [showEvidenceModal, setShowEvidenceModal] = useState(false);
  const [selectedLead, setSelectedLead] = useState(null);
  const [selectedFollowUp, setSelectedFollowUp] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [followUpData, setFollowUpData] = useState({
    contactMethod: 'email',
    scheduledDate: '',
    scheduledTime: '',
    summary: '',
    messageSent: '',
    conclusion: '',
    nextStep: '',
    nextFollowUpDate: ''
  });

  const handleAddFollowUp = async (e) => {
    e.preventDefault();
    if (!selectedLead) return;

    const success = await onAddFollowUp(selectedLead._id, followUpData);
    if (success) {
      setShowAddFollowUpModal(false);
      setSelectedLead(null);
      setFollowUpData({
        contactMethod: 'email',
        scheduledDate: '',
        scheduledTime: '',
        summary: '',
        messageSent: '',
        conclusion: '',
        nextStep: '',
        nextFollowUpDate: ''
      });
    }
  };

  const handleSubmitEvidence = async (leadId, followUpId, formData) => {
    const success = await onSubmitEvidence(leadId, followUpId, formData);
    if (success) {
      setShowEvidenceModal(false);
      setSelectedLead(null);
      setSelectedFollowUp(null);
    }
    return success;
  };

  // Get pending follow-ups for a lead (not completed, evidence not submitted)
  const getPendingFollowUps = (lead) => {
    if (!lead.followUps || lead.followUps.length === 0) return [];
    return lead.followUps.filter(fu => !fu.evidenceSubmitted && fu.status === 'pending');
  };

  // Get the most recent pending follow-up
  const getRecentPendingFollowUp = (lead) => {
    const pending = getPendingFollowUps(lead);
    if (pending.length === 0) return null;
    return pending[pending.length - 1]; // Get the most recent one
  };

  // Filter leads based on search term
  const filteredLeads = useMemo(() => {
    if (!searchTerm.trim()) return myLeads;
    
    const searchLower = searchTerm.toLowerCase();
    return myLeads.filter(lead => {
      const clientName = lead.name?.toLowerCase() || '';
      const designation = lead.designation?.toLowerCase() || '';
      const companyName = lead.company?.companyName?.toLowerCase() || '';
      const industry = lead.company?.industry?.toLowerCase() || '';
      const service = lead.serviceInterest?.toLowerCase() || '';
      const phone = lead.phone?.toLowerCase() || '';
      const email = lead.email?.toLowerCase() || '';
      const stage = lead.stage?.toLowerCase() || '';
      const status = lead.status?.toLowerCase() || '';
      
      return clientName.includes(searchLower) ||
             designation.includes(searchLower) ||
             companyName.includes(searchLower) ||
             industry.includes(searchLower) ||
             service.includes(searchLower) ||
             phone.includes(searchLower) ||
             email.includes(searchLower) ||
             stage.includes(searchLower) ||
             status.includes(searchLower);
    });
  }, [myLeads, searchTerm]);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">My Leads</h2>
        
        {/* Search Bar */}
        <div className="relative w-96">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by client, company, service, phone, email..."
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
          />
        </div>
      </div>

      {myLeads.length === 0 ? (
        <div className="dashboard-card text-center py-12">
          <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">No leads assigned yet</p>
        </div>
      ) : filteredLeads.length === 0 ? (
        <div className="dashboard-card text-center py-12">
          <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">No leads found matching "{searchTerm}"</p>
          <button
            onClick={() => setSearchTerm('')}
            className="mt-4 text-primary-600 hover:text-primary-800 text-sm font-medium"
          >
            Clear search
          </button>
        </div>
      ) : (
        <div className="dashboard-card overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Client
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Company
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Service
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Value
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Stage
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredLeads.map((lead) => {
                const pendingFollowUps = getPendingFollowUps(lead);
                const recentPendingFollowUp = getRecentPendingFollowUp(lead);
                const hasPendingEvidence = pendingFollowUps.length > 0;

                return (
                  <tr key={lead._id} className={`hover:bg-gray-50 ${hasPendingEvidence ? 'bg-yellow-50' : ''}`}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{lead.name}</div>
                      <div className="text-sm text-gray-500">{lead.designation}</div>
                      <div className="text-xs text-gray-400 mt-1">
                        <Phone className="inline h-3 w-3 mr-1" />
                        {lead.phone}
                      </div>
                      {hasPendingEvidence && (
                        <div className="mt-2 flex items-center gap-1 text-xs text-amber-600">
                          <AlertCircle className="h-3 w-3" />
                          <span className="font-medium">{pendingFollowUps.length} pending evidence</span>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {lead.company ? (
                        <div>
                          <div className="text-sm font-medium text-gray-900">{lead.company.companyName}</div>
                          <div className="text-xs text-gray-500">{lead.company.industry}</div>
                        </div>
                      ) : (
                        <span className="text-sm text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{lead.serviceInterest}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                      ₹{(lead.potentialValue || 0).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full capitalize ${getLeadTypeColor(lead.leadType)}`}>
                        {lead.leadType}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-3 py-1 text-xs font-medium rounded-full capitalize ${getStageColor(lead.stage)}`}>
                        {lead.stage === 'closed-won' ? 'Closed Won' : lead.stage === 'closed-lost' ? 'Closed Lost' : lead.stage}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <select
                        value={lead.status}
                        onChange={(e) => onUpdateStatus(lead._id, e.target.value)}
                        className={`text-xs px-2 py-1 rounded-full capitalize ${getStatusColor(lead.status)} border-none focus:outline-none focus:ring-2 focus:ring-primary-500`}
                      >
                        <option value="active">Active</option>
                        <option value="on-hold">On Hold</option>
                        <option value="won">Won</option>
                        <option value="lost">Lost</option>
                      </select>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div className="flex gap-2">
                        <button
                          onClick={() => navigate(`/lead/${lead._id}`)}
                          className="text-primary-600 hover:text-primary-900"
                          title="View Details"
                        >
                          <Eye className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => {
                            setSelectedLead(lead);
                            setShowAddFollowUpModal(true);
                          }}
                          className="text-green-600 hover:text-green-900"
                          title="Add Follow-up"
                        >
                          <MessageSquare className="h-5 w-5" />
                        </button>
                        {hasPendingEvidence && recentPendingFollowUp && (
                          <button
                            onClick={() => {
                              setSelectedLead(lead);
                              setSelectedFollowUp(recentPendingFollowUp);
                              setShowEvidenceModal(true);
                            }}
                            className="text-amber-600 hover:text-amber-900 animate-pulse"
                            title="Submit Evidence"
                          >
                            <Upload className="h-5 w-5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <AddFollowUpModal
        show={showAddFollowUpModal}
        onClose={() => {
          setShowAddFollowUpModal(false);
          setSelectedLead(null);
        }}
        lead={selectedLead}
        followUpData={followUpData}
        setFollowUpData={setFollowUpData}
        onSubmit={handleAddFollowUp}
      />

      <FollowUpEvidenceModal
        show={showEvidenceModal}
        onClose={() => {
          setShowEvidenceModal(false);
          setSelectedLead(null);
          setSelectedFollowUp(null);
        }}
        lead={selectedLead}
        followUp={selectedFollowUp}
        onSubmit={handleSubmitEvidence}
      />
    </div>
  );
};

export default MyLeadsView;
