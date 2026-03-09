import React, { useState, useEffect } from 'react';
import { 
  Users, 
  TrendingUp, 
  DollarSign, 
  Calendar, 
  Phone, 
  Mail, 
  Plus, 
  Eye,
  Edit2,
  MessageSquare,
  CheckCircle,
  XCircle,
  Clock,
  ArrowRight
} from 'lucide-react';
import api from '../utils/api';
import { showToast } from '../utils/toast';
import { formatDate } from '../utils/helpers';

const LeadPipelineManagement = ({ userRole = 'individual' }) => {
  const [leads, setLeads] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedLead, setSelectedLead] = useState(null);
  const [selectedStage, setSelectedStage] = useState('all');

  const stages = [
    { id: 'lead', label: 'Lead', color: 'bg-gray-100 text-gray-800', icon: Users },
    { id: 'qualified', label: 'Qualified', color: 'bg-blue-100 text-blue-800', icon: CheckCircle },
    { id: 'proposal', label: 'Proposal', color: 'bg-purple-100 text-purple-800', icon: MessageSquare },
    { id: 'negotiation', label: 'Negotiation', color: 'bg-yellow-100 text-yellow-800', icon: TrendingUp },
    { id: 'closedWon', label: 'Closed Won', color: 'bg-green-100 text-green-800', icon: CheckCircle },
    { id: 'closedLost', label: 'Closed Lost', color: 'bg-red-100 text-red-800', icon: XCircle }
  ];

  const [newLead, setNewLead] = useState({
    contactPerson: { name: '', email: '', phone: '', designation: '' },
    company: '',
    estimatedValue: '',
    expectedCloseDate: '',
    source: 'website',
    notes: ''
  });

  useEffect(() => {
    fetchLeads();
  }, []);

  const fetchLeads = async () => {
    setIsLoading(true);
    try {
      const endpoint = userRole === 'head-of-sales'
        ? '/leads?status=active'
        : '/leads?assignedTo=me';
      
      const response = await api.get(endpoint);
      setLeads(response.data.data || []);
    } catch (error) {
      console.error('Error fetching leads:', error);
      showToast.error('Failed to load leads');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateLead = async (e) => {
    e.preventDefault();
    try {
      await api.post('/leads', newLead);
      showToast.success('Lead created successfully');
      setShowCreateModal(false);
      resetForm();
      fetchLeads();
    } catch (error) {
      showToast.error(error.response?.data?.message || 'Failed to create lead');
    }
  };

  const handleStageChange = async (leadId, newStage) => {
    try {
      await api.put(`/leads/${leadId}/stage`, { stage: newStage });
      showToast.success('Lead stage updated');
      fetchLeads();
    } catch (error) {
      showToast.error('Failed to update stage');
    }
  };

  const handleAddFollowUp = async (leadId, followUpData) => {
    try {
      await api.post(`/leads/${leadId}/follow-up`, followUpData);
      showToast.success('Follow-up added');
      fetchLeads();
    } catch (error) {
      showToast.error('Failed to add follow-up');
    }
  };

  const resetForm = () => {
    setNewLead({
      contactPerson: { name: '', email: '', phone: '', designation: '' },
      company: '',
      estimatedValue: '',
      expectedCloseDate: '',
      source: 'website',
      notes: ''
    });
  };

  const getLeadsByStage = (stage) => {
    if (stage === 'all') return leads;
    return leads.filter(lead => lead.stage === stage);
  };

  const calculateConversionRate = () => {
    const total = leads.length;
    const won = leads.filter(l => l.stage === 'closedWon').length;
    return total > 0 ? ((won / total) * 100).toFixed(1) : 0;
  };

  const calculateTotalValue = () => {
    return leads
      .filter(l => l.stage !== 'closedLost')
      .reduce((sum, lead) => sum + (lead.potentialValue || 0), 0);
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
          <h2 className="text-2xl font-bold text-gray-900">Lead Pipeline</h2>
          <p className="text-gray-600 mt-1">Track and manage your sales leads through the pipeline</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
        >
          <Plus className="w-5 h-5" />
          Add Lead
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Leads</p>
              <p className="text-2xl font-bold text-gray-900">{leads.length}</p>
            </div>
            <Users className="w-8 h-8 text-blue-600" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Pipeline Value</p>
              <p className="text-2xl font-bold text-green-600">₹{calculateTotalValue().toLocaleString()}</p>
            </div>
            <DollarSign className="w-8 h-8 text-green-600" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Conversion Rate</p>
              <p className="text-2xl font-bold text-purple-600">{calculateConversionRate()}%</p>
            </div>
            <TrendingUp className="w-8 h-8 text-purple-600" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Closed Won</p>
              <p className="text-2xl font-bold text-green-600">
                {leads.filter(l => l.stage === 'closedWon').length}
              </p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
        </div>
      </div>

      {/* Stage Filter */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex gap-2 overflow-x-auto">
          <button
            onClick={() => setSelectedStage('all')}
            className={`px-4 py-2 rounded-lg whitespace-nowrap ${
              selectedStage === 'all'
                ? 'bg-primary-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            All ({leads.length})
          </button>
          {stages.map((stage) => (
            <button
              key={stage.id}
              onClick={() => setSelectedStage(stage.id)}
              className={`px-4 py-2 rounded-lg whitespace-nowrap ${
                selectedStage === stage.id
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {stage.label} ({getLeadsByStage(stage.id).length})
            </button>
          ))}
        </div>
      </div>

      {/* Pipeline View */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">
            {selectedStage === 'all' ? 'All Leads' : stages.find(s => s.id === selectedStage)?.label}
          </h3>
        </div>
        <div className="divide-y divide-gray-200">
          {getLeadsByStage(selectedStage).length === 0 ? (
            <div className="px-6 py-12 text-center text-gray-500">
              No leads found in this stage. Add your first lead to get started.
            </div>
          ) : (
            getLeadsByStage(selectedStage).map((lead) => {
              const stageInfo = stages.find(s => s.id === lead.stage);
              const StageIcon = stageInfo?.icon || Users;
              
              return (
                <div key={lead._id} className="px-6 py-4 hover:bg-gray-50">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <StageIcon className="w-5 h-5 text-gray-600" />
                        <h4 className="text-lg font-semibold text-gray-900">
                          {lead.contactPerson?.name}
                        </h4>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${stageInfo?.color}`}>
                          {stageInfo?.label}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mt-3">
                        <div>
                          <p className="text-gray-600">Company</p>
                          <p className="font-medium text-gray-900">{lead.company?.companyName || 'N/A'}</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Potential Value</p>
                          <p className="font-medium text-green-600">₹{(lead.potentialValue || 0).toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Expected Close</p>
                          <p className="font-medium text-gray-900">
                            {lead.expectedCloseDate ? formatDate(lead.expectedCloseDate) : 'Not set'}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-600">Source</p>
                          <p className="font-medium text-gray-900 capitalize">{lead.source}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 mt-3 text-sm text-gray-600">
                        {lead.contactPerson?.email && (
                          <div className="flex items-center gap-1">
                            <Mail className="w-4 h-4" />
                            <span>{lead.contactPerson.email}</span>
                          </div>
                        )}
                        {lead.contactPerson?.phone && (
                          <div className="flex items-center gap-1">
                            <Phone className="w-4 h-4" />
                            <span>{lead.contactPerson.phone}</span>
                          </div>
                        )}
                      </div>
                      {lead.lastFollowUp && (
                        <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                          <p className="text-sm text-gray-700">
                            <span className="font-medium">Last Follow-up:</span> {lead.lastFollowUp.notes}
                            <span className="text-gray-500 ml-2">
                              ({formatDate(lead.lastFollowUp.date)})
                            </span>
                          </p>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2 ml-4">
                      {/* Stage Movement Buttons */}
                      {lead.stage === 'lead' && (
                        <button
                          onClick={() => handleStageChange(lead._id, 'qualified')}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                          title="Qualify"
                        >
                          <ArrowRight className="w-5 h-5" />
                        </button>
                      )}
                      {lead.stage === 'qualified' && (
                        <button
                          onClick={() => handleStageChange(lead._id, 'proposal')}
                          className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg"
                          title="Send Proposal"
                        >
                          <ArrowRight className="w-5 h-5" />
                        </button>
                      )}
                      {lead.stage === 'proposal' && (
                        <button
                          onClick={() => handleStageChange(lead._id, 'negotiation')}
                          className="p-2 text-yellow-600 hover:bg-yellow-50 rounded-lg"
                          title="Start Negotiation"
                        >
                          <ArrowRight className="w-5 h-5" />
                        </button>
                      )}
                      {lead.stage === 'negotiation' && (
                        <>
                          <button
                            onClick={() => handleStageChange(lead._id, 'closedWon')}
                            className="p-2 text-green-600 hover:bg-green-50 rounded-lg"
                            title="Close Won"
                          >
                            <CheckCircle className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => handleStageChange(lead._id, 'closedLost')}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                            title="Close Lost"
                          >
                            <XCircle className="w-5 h-5" />
                          </button>
                        </>
                      )}
                      <button
                        onClick={() => {
                          setSelectedLead(lead);
                          setShowDetailsModal(true);
                        }}
                        className="p-2 text-gray-600 hover:bg-gray-50 rounded-lg"
                        title="View Details"
                      >
                        <Eye className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Create Lead Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-200 sticky top-0 bg-white">
              <h3 className="text-lg font-semibold text-gray-900">Add New Lead</h3>
            </div>
            <form onSubmit={handleCreateLead} className="p-6 space-y-4">
              {/* Contact Person */}
              <div>
                <h4 className="text-md font-semibold text-gray-900 mb-3">Contact Person</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                    <input
                      type="text"
                      value={newLead.contactPerson.name}
                      onChange={(e) => setNewLead({ 
                        ...newLead, 
                        contactPerson: { ...newLead.contactPerson, name: e.target.value }
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Designation</label>
                    <input
                      type="text"
                      value={newLead.contactPerson.designation}
                      onChange={(e) => setNewLead({ 
                        ...newLead, 
                        contactPerson: { ...newLead.contactPerson, designation: e.target.value }
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                      placeholder="CTO, Manager, etc."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                    <input
                      type="email"
                      value={newLead.contactPerson.email}
                      onChange={(e) => setNewLead({ 
                        ...newLead, 
                        contactPerson: { ...newLead.contactPerson, email: e.target.value }
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                    <input
                      type="tel"
                      value={newLead.contactPerson.phone}
                      onChange={(e) => setNewLead({ 
                        ...newLead, 
                        contactPerson: { ...newLead.contactPerson, phone: e.target.value }
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                </div>
              </div>

              {/* Lead Details */}
              <div>
                <h4 className="text-md font-semibold text-gray-900 mb-3">Lead Details</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Company</label>
                    <input
                      type="text"
                      value={newLead.company}
                      onChange={(e) => setNewLead({ ...newLead, company: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                      placeholder="Company name or ID"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Potential Value (₹) *</label>
                    <input
                      type="number"
                      value={newLead.estimatedValue}
                      onChange={(e) => setNewLead({ ...newLead, estimatedValue: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Expected Close Date</label>
                    <input
                      type="date"
                      value={newLead.expectedCloseDate}
                      onChange={(e) => setNewLead({ ...newLead, expectedCloseDate: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Source</label>
                    <select
                      value={newLead.source}
                      onChange={(e) => setNewLead({ ...newLead, source: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    >
                      <option value="website">Website</option>
                      <option value="referral">Referral</option>
                      <option value="cold-call">Cold Call</option>
                      <option value="linkedin">LinkedIn</option>
                      <option value="email">Email Campaign</option>
                      <option value="event">Event</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <textarea
                  value={newLead.notes}
                  onChange={(e) => setNewLead({ ...newLead, notes: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  rows="3"
                  placeholder="Additional information about the lead..."
                ></textarea>
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
                  Create Lead
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Lead Details Modal */}
      {showDetailsModal && selectedLead && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-200 sticky top-0 bg-white">
              <h3 className="text-lg font-semibold text-gray-900">Lead Details</h3>
            </div>
            <div className="p-6 space-y-6">
              {/* Contact Info */}
              <div>
                <h4 className="text-md font-semibold text-gray-900 mb-3">Contact Information</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-600">Name</p>
                    <p className="font-medium text-gray-900">{selectedLead.contactPerson?.name}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Designation</p>
                    <p className="font-medium text-gray-900">{selectedLead.contactPerson?.designation || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Email</p>
                    <p className="font-medium text-gray-900">{selectedLead.contactPerson?.email}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Phone</p>
                    <p className="font-medium text-gray-900">{selectedLead.contactPerson?.phone || 'N/A'}</p>
                  </div>
                </div>
              </div>

              {/* Stage History */}
              {selectedLead.stageHistory && selectedLead.stageHistory.length > 0 && (
                <div>
                  <h4 className="text-md font-semibold text-gray-900 mb-3">Stage History</h4>
                  <div className="space-y-2">
                    {selectedLead.stageHistory.map((history, index) => (
                      <div key={index} className="flex items-center gap-3 text-sm p-3 bg-gray-50 rounded-lg">
                        <Clock className="w-4 h-4 text-gray-600" />
                        <span className="font-medium">{history.stage}</span>
                        <span className="text-gray-600">→</span>
                        <span className="text-gray-600">{formatDate(history.changedAt)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Follow-ups */}
              {selectedLead.followUps && selectedLead.followUps.length > 0 && (
                <div>
                  <h4 className="text-md font-semibold text-gray-900 mb-3">Follow-ups</h4>
                  <div className="space-y-3">
                    {selectedLead.followUps.map((followUp, index) => (
                      <div key={index} className="p-4 bg-blue-50 rounded-lg border border-blue-100">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-1 bg-blue-200 text-blue-800 text-xs font-medium rounded capitalize">
                              {followUp.contactMethod || followUp.type || 'N/A'}
                            </span>
                            {followUp.evidenceSubmitted ? (
                              <span className="px-2 py-1 bg-green-200 text-green-800 text-xs font-medium rounded flex items-center gap-1">
                                <CheckCircle className="w-3 h-3" />
                                Evidence Submitted
                              </span>
                            ) : followUp.evidenceRequired ? (
                              <span className="px-2 py-1 bg-orange-200 text-orange-800 text-xs font-medium rounded flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                Pending Evidence
                              </span>
                            ) : null}
                          </div>
                          <p className="text-xs text-gray-600">
                            {formatDate(followUp.scheduledDate || followUp.date)}
                            {followUp.scheduledTime && ` at ${followUp.scheduledTime}`}
                          </p>
                        </div>
                        
                        <div className="space-y-2">
                          {(followUp.summary || followUp.notes) && (
                            <div>
                              <p className="text-xs font-medium text-gray-600">Summary</p>
                              <p className="text-sm text-gray-900">{followUp.summary || followUp.notes}</p>
                            </div>
                          )}
                          
                          {followUp.messageSent && (
                            <div>
                              <p className="text-xs font-medium text-gray-600">Message Sent</p>
                              <p className="text-sm text-gray-900">{followUp.messageSent}</p>
                            </div>
                          )}
                          
                          {(followUp.conclusion || followUp.outcome) && (
                            <div>
                              <p className="text-xs font-medium text-gray-600">Conclusion/Outcome</p>
                              <p className="text-sm text-gray-900">{followUp.conclusion || followUp.outcome}</p>
                            </div>
                          )}
                          
                          {(followUp.nextStep || followUp.nextAction) && (
                            <div>
                              <p className="text-xs font-medium text-gray-600">Next Step</p>
                              <p className="text-sm text-gray-900">{followUp.nextStep || followUp.nextAction}</p>
                            </div>
                          )}
                          
                          {followUp.nextFollowUpDate && (
                            <div>
                              <p className="text-xs font-medium text-gray-600">Scheduled Date</p>
                              <p className="text-sm text-gray-900">{formatDate(followUp.nextFollowUpDate)}</p>
                            </div>
                          )}
                          
                          {followUp.evidenceNotes && (
                            <div>
                              <p className="text-xs font-medium text-gray-600">Evidence Notes</p>
                              <p className="text-sm text-gray-900">{followUp.evidenceNotes}</p>
                            </div>
                          )}
                          
                          {followUp.evidenceFiles && followUp.evidenceFiles.length > 0 && (
                            <div>
                              <p className="text-xs font-medium text-gray-600">Evidence Files</p>
                              <div className="flex flex-wrap gap-2 mt-1">
                                {followUp.evidenceFiles.map((file, fileIndex) => (
                                  <span key={fileIndex} className="text-xs bg-white px-2 py-1 rounded border border-blue-200">
                                    {file.originalName || file.filename}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                          
                          {followUp.completedAt && (
                            <div className="pt-2 border-t border-blue-200">
                              <p className="text-xs text-gray-600">
                                Completed on {formatDate(followUp.completedAt)}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <div className="px-6 py-4 border-t border-gray-200 flex justify-end">
              <button
                onClick={() => {
                  setShowDetailsModal(false);
                  setSelectedLead(null);
                }}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LeadPipelineManagement;
