import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  ArrowLeft,
  Mail,
  Phone,
  Building,
  Calendar,
  DollarSign,
  TrendingUp,
  FileText,
  MessageSquare,
  Activity,
  Edit,
  Save,
  X,
  Upload
} from 'lucide-react';
import DashboardLayout from '../components/DashboardLayout';
import AddFollowUpModal from '../components/sales/modals/AddFollowUpModal';
import FollowUpEvidenceModal from '../components/sales/modals/FollowUpEvidenceModal';
import api from '../utils/api';
import { formatDate } from '../utils/helpers';
import { showToast } from '../utils/toast';

const SalesLeadDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [lead, setLead] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editedLead, setEditedLead] = useState({});
  const [showFollowUpModal, setShowFollowUpModal] = useState(false);
  const [showEvidenceModal, setShowEvidenceModal] = useState(false);
  const [selectedFollowUp, setSelectedFollowUp] = useState(null);
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

  useEffect(() => {
    fetchLeadDetails();
  }, [id]);

  const fetchLeadDetails = async () => {
    try {
      const response = await api.get(`/leads/${id}`);
      setLead(response.data.data.lead || response.data.data);
      setEditedLead(response.data.data.lead || response.data.data);
      setIsLoading(false);
    } catch (error) {
      console.error('Error fetching lead details:', error);
      showToast.error('Failed to load lead details');
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      await api.put(`/leads/${id}`, editedLead);
      showToast.success('Lead updated successfully');
      setIsEditing(false);
      fetchLeadDetails();
    } catch (error) {
      console.error('Error updating lead:', error);
      showToast.error('Failed to update lead');
    }
  };

  const handleAddFollowUp = async (e) => {
    e.preventDefault();
    try {
      await api.post(`/leads/${id}/follow-up`, followUpData);
      showToast.success('Follow-up added successfully. Don\'t forget to submit evidence!');
      setShowFollowUpModal(false);
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
      fetchLeadDetails();
    } catch (error) {
      console.error('Error adding follow-up:', error);
      showToast.error('Failed to add follow-up');
    }
  };

  const handleSubmitEvidence = async (leadId, followUpId, formData) => {
    try {
      await api.post(`/leads/${leadId}/follow-up/${followUpId}/evidence`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      showToast.success('Evidence submitted successfully! 🎉');
      setShowEvidenceModal(false);
      setSelectedFollowUp(null);
      fetchLeadDetails();
      return true;
    } catch (error) {
      console.error('Error submitting evidence:', error);
      showToast.error(error.response?.data?.message || 'Failed to submit evidence');
      return false;
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">Loading...</div>
        </div>
      </DashboardLayout>
    );
  }

  if (!lead) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <p className="text-gray-500">Lead not found</p>
          <button
            onClick={() => navigate(-1)}
            className="btn-primary mt-4"
          >
            Go Back
          </button>
        </div>
      </DashboardLayout>
    );
  }

  const getStageColor = (stage) => {
    const colors = {
      'lead': 'bg-gray-100 text-gray-800',
      'qualified': 'bg-blue-100 text-blue-800',
      'proposal': 'bg-yellow-100 text-yellow-800',
      'negotiation': 'bg-orange-100 text-orange-800',
      'closed-won': 'bg-green-100 text-green-800',
      'closed-lost': 'bg-red-100 text-red-800'
    };
    return colors[stage] || 'bg-gray-100 text-gray-800';
  };

  const getStatusColor = (status) => {
    const colors = {
      'active': 'bg-blue-100 text-blue-800',
      'on-hold': 'bg-yellow-100 text-yellow-800',
      'won': 'bg-green-100 text-green-800',
      'lost': 'bg-red-100 text-red-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate(-1)}
              className="p-2 hover:bg-gray-100 rounded-lg"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{lead.name}</h1>
              <p className="text-gray-500">{lead.company?.companyName || lead.designation}</p>
            </div>
          </div>
          <div className="flex gap-2">
            {isEditing ? (
              <>
                <button
                  onClick={() => {
                    setIsEditing(false);
                    setEditedLead(lead);
                  }}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 flex items-center gap-2"
                >
                  <X className="h-4 w-4" />
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  className="btn-primary flex items-center gap-2"
                >
                  <Save className="h-4 w-4" />
                  Save Changes
                </button>
              </>
            ) : (
              <button
                onClick={() => setIsEditing(true)}
                className="btn-primary flex items-center gap-2"
              >
                <Edit className="h-4 w-4" />
                Edit
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Lead Information */}
            <div className="dashboard-card">
              <h2 className="text-lg font-semibold mb-4">Lead Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">
                    Client Name
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={editedLead.name}
                      onChange={(e) => setEditedLead({...editedLead, name: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  ) : (
                    <p className="text-gray-900">{lead.name}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">
                    Company
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={editedLead.designation || ''}
                      onChange={(e) => setEditedLead({...editedLead, designation: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  ) : (
                    <p className="text-gray-900">{lead.company?.companyName || lead.designation || 'N/A'}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">
                    Email
                  </label>
                  {isEditing ? (
                    <input
                      type="email"
                      value={editedLead.email}
                      onChange={(e) => setEditedLead({...editedLead, email: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  ) : (
                    <div className="flex items-center gap-2 text-gray-900">
                      <Mail className="h-4 w-4 text-gray-400" />
                      {lead.email}
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">
                    Phone
                  </label>
                  {isEditing ? (
                    <input
                      type="tel"
                      value={editedLead.phone}
                      onChange={(e) => setEditedLead({...editedLead, phone: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  ) : (
                    <div className="flex items-center gap-2 text-gray-900">
                      <Phone className="h-4 w-4 text-gray-400" />
                      {lead.phone}
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">
                    Service Type
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={editedLead.serviceInterest}
                      onChange={(e) => setEditedLead({...editedLead, serviceInterest: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  ) : (
                    <p className="text-gray-900">{lead.serviceInterest}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">
                    Lead Source
                  </label>
                  {isEditing ? (
                    <select
                      value={editedLead.leadSource}
                      onChange={(e) => setEditedLead({...editedLead, leadSource: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    >
                      <option value="website">Website</option>
                      <option value="referral">Referral</option>
                      <option value="cold-call">Cold Call</option>
                      <option value="social-media">Social Media</option>
                      <option value="event">Event</option>
                      <option value="partner">Partner</option>
                      <option value="other">Other</option>
                    </select>
                  ) : (
                    <p className="text-gray-900 capitalize">{lead.leadSource ? lead.leadSource.replace('-', ' ') : 'Not specified'}</p>
                  )}
                </div>
              </div>

              {lead.requirements && (
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-600 mb-1">
                    Requirements
                  </label>
                  {isEditing ? (
                    <textarea
                      rows="3"
                      value={editedLead.requirements || ''}
                      onChange={(e) => setEditedLead({...editedLead, requirements: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  ) : (
                    <p className="text-gray-900">{lead.requirements}</p>
                  )}
                </div>
              )}

              {lead.notes && (
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-600 mb-1">
                    Notes
                  </label>
                  {isEditing ? (
                    <textarea
                      rows="3"
                      value={editedLead.notes || ''}
                      onChange={(e) => setEditedLead({...editedLead, notes: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  ) : (
                    <p className="text-gray-900">{lead.notes}</p>
                  )}
                </div>
              )}
            </div>

            {/* Follow-ups */}
            <div className="dashboard-card">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">Follow-ups</h2>
                <button
                  onClick={() => setShowFollowUpModal(true)}
                  className="btn-primary flex items-center gap-2"
                >
                  <MessageSquare className="h-4 w-4" />
                  Add Follow-up
                </button>
              </div>

              {lead.followUps && lead.followUps.length > 0 ? (
                <div className="space-y-4">
                  {lead.followUps.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).map((followUp, index) => (
                    <div 
                      key={index} 
                      className={`border-l-4 pl-4 py-3 rounded-r-lg ${
                        followUp.evidenceSubmitted 
                          ? 'border-green-500 bg-green-50' 
                          : followUp.evidenceRequired 
                            ? 'border-amber-500 bg-amber-50' 
                            : 'border-primary-500 bg-blue-50'
                      }`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Calendar className="h-4 w-4 text-gray-400" />
                            <span className="text-sm font-medium text-gray-900">
                              {followUp.scheduledDate ? formatDate(followUp.scheduledDate) : formatDate(followUp.date)}
                              {followUp.scheduledTime && <span className="text-gray-500 ml-2">at {followUp.scheduledTime}</span>}
                            </span>
                            {followUp.contactMethod && (
                              <span className={`px-2 py-0.5 text-xs font-medium rounded-full capitalize ${
                                followUp.contactMethod === 'linkedin' ? 'bg-blue-100 text-blue-700' :
                                followUp.contactMethod === 'email' ? 'bg-yellow-100 text-yellow-700' :
                                followUp.contactMethod === 'call' ? 'bg-green-100 text-green-700' :
                                followUp.contactMethod === 'meeting' ? 'bg-purple-100 text-purple-700' :
                                followUp.contactMethod === 'whatsapp' ? 'bg-emerald-100 text-emerald-700' :
                                'bg-gray-100 text-gray-700'
                              }`}>
                                {followUp.contactMethod}
                              </span>
                            )}
                            {followUp.evidenceSubmitted && (
                              <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-green-100 text-green-700">
                                ✓ Completed
                              </span>
                            )}
                            {!followUp.evidenceSubmitted && followUp.evidenceRequired && (
                              <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-amber-100 text-amber-700">
                                ⏳ Pending Evidence
                              </span>
                            )}
                          </div>
                          
                          {followUp.summary && (
                            <div className="mb-2">
                              <p className="text-sm font-medium text-gray-700">Summary:</p>
                              <p className="text-sm text-gray-600">{followUp.summary}</p>
                            </div>
                          )}
                          
                          {followUp.notes && !followUp.summary && (
                            <p className="text-sm text-gray-600 mb-2">{followUp.notes}</p>
                          )}
                          
                          {followUp.messageSent && (
                            <div className="mb-2">
                              <p className="text-sm font-medium text-gray-700">Message Sent:</p>
                              <p className="text-sm text-gray-600 italic">{followUp.messageSent}</p>
                            </div>
                          )}
                          
                          {followUp.conclusion && (
                            <div className="mb-2">
                              <p className="text-sm font-medium text-gray-700">Conclusion:</p>
                              <p className="text-sm text-gray-600">{followUp.conclusion}</p>
                            </div>
                          )}
                          
                          {followUp.nextStep && (
                            <p className="text-sm text-primary-600 font-medium mb-2">
                              Next Step: {followUp.nextStep}
                            </p>
                          )}
                          
                          {followUp.nextAction && !followUp.nextStep && (
                            <p className="text-sm text-primary-600 font-medium mb-2">
                              Next: {followUp.nextAction}
                            </p>
                          )}
                          
                          {followUp.evidenceSubmitted && followUp.evidenceFiles && followUp.evidenceFiles.length > 0 && (
                            <div className="mt-2 p-2 bg-white rounded border border-green-200">
                              <p className="text-xs font-medium text-green-700 mb-1">
                                📎 Evidence Submitted: {followUp.evidenceFiles.length} file(s)
                              </p>
                              {followUp.evidenceNotes && (
                                <p className="text-xs text-gray-600 italic">{followUp.evidenceNotes}</p>
                              )}
                            </div>
                          )}
                        </div>
                        
                        <div className="flex flex-col items-end gap-2">
                          <div className="text-xs text-gray-500">
                            by {followUp.createdBy?.firstName} {followUp.createdBy?.lastName}
                          </div>
                          
                          {!followUp.evidenceSubmitted && followUp.evidenceRequired && (
                            <button
                              onClick={() => {
                                setSelectedFollowUp(followUp);
                                setShowEvidenceModal(true);
                              }}
                              className="flex items-center gap-1 px-3 py-1 text-xs font-medium text-white bg-amber-500 hover:bg-amber-600 rounded-md transition-colors animate-pulse"
                            >
                              <Upload className="h-3 w-3" />
                              Submit Evidence
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-8">No follow-ups recorded yet</p>
              )}
            </div>

            {/* Activity Log */}
            <div className="dashboard-card">
              <h2 className="text-lg font-semibold mb-4">Activity Log</h2>
              {lead.activities && lead.activities.length > 0 ? (
                <div className="space-y-3">
                  {lead.activities.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)).map((activity, index) => (
                    <div key={index} className="flex items-start gap-3">
                      <Activity className="h-4 w-4 text-primary-500 mt-1" />
                      <div className="flex-1">
                        <p className="text-sm text-gray-900 capitalize">
                          {activity.action ? activity.action.replace('_', ' ') : 'Activity'}
                        </p>
                        {activity.description && (
                          <p className="text-xs text-gray-500">{activity.description}</p>
                        )}
                        <p className="text-xs text-gray-400 mt-1">
                          {formatDate(activity.timestamp)} by{' '}
                          {activity.performedBy?.firstName} {activity.performedBy?.lastName}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-8">No activities recorded</p>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Status Card */}
            <div className="dashboard-card">
              <h3 className="text-sm font-semibold text-gray-600 mb-3">Status</h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Stage</label>
                  {isEditing ? (
                    <select
                      value={editedLead.stage}
                      onChange={(e) => setEditedLead({...editedLead, stage: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    >
                      <option value="lead">Lead</option>
                      <option value="qualified">Qualified</option>
                      <option value="proposal">Proposal</option>
                      <option value="negotiation">Negotiation</option>
                      <option value="closed-won">Closed Won</option>
                      <option value="closed-lost">Closed Lost</option>
                    </select>
                  ) : (
                    <span className={`inline-block px-3 py-1 text-sm font-medium rounded-full capitalize ${getStageColor(lead.stage)}`}>
                      {lead.stage ? lead.stage.replace('-', ' ') : 'N/A'}
                    </span>
                  )}
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Status</label>
                  {isEditing ? (
                    <select
                      value={editedLead.status}
                      onChange={(e) => setEditedLead({...editedLead, status: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    >
                      <option value="active">Active</option>
                      <option value="on-hold">On Hold</option>
                      <option value="won">Won</option>
                      <option value="lost">Lost</option>
                    </select>
                  ) : (
                    <span className={`inline-block px-3 py-1 text-sm font-medium rounded-full capitalize ${getStatusColor(lead.status)}`}>
                      {lead.status}
                    </span>
                  )}
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Lead Type</label>
                  {isEditing ? (
                    <select
                      value={editedLead.leadType}
                      onChange={(e) => setEditedLead({...editedLead, leadType: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    >
                      <option value="hot">Hot</option>
                      <option value="warm">Warm</option>
                      <option value="cold">Cold</option>
                    </select>
                  ) : (
                    <span className={`inline-block px-3 py-1 text-sm font-medium rounded-full capitalize ${
                      lead.leadType === 'hot' ? 'bg-red-100 text-red-800' :
                      lead.leadType === 'warm' ? 'bg-orange-100 text-orange-800' :
                      'bg-blue-100 text-blue-800'
                    }`}>
                      {lead.leadType}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Financial Info */}
            <div className="dashboard-card">
              <h3 className="text-sm font-semibold text-gray-600 mb-3">Financial Details</h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Estimated Value</label>
                  {isEditing ? (
                    <input
                      type="number"
                      value={editedLead.potentialValue}
                      onChange={(e) => setEditedLead({...editedLead, potentialValue: Number(e.target.value)})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  ) : (
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-gray-400" />
                      <span className="text-lg font-semibold text-gray-900">
                        ₹{(lead.potentialValue || 0).toLocaleString()}
                      </span>
                    </div>
                  )}
                </div>
                {lead.actualValue > 0 && (
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Actual Value</label>
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-gray-400" />
                      <span className="text-lg font-semibold text-green-600">
                        ₹{lead.actualValue.toLocaleString()}
                      </span>
                    </div>
                  </div>
                )}
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Probability</label>
                  {isEditing ? (
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={editedLead.probability}
                      onChange={(e) => setEditedLead({...editedLead, probability: Number(e.target.value)})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  ) : (
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-gray-400" />
                      <span className="text-gray-900">{lead.probability}%</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Timeline */}
            <div className="dashboard-card">
              <h3 className="text-sm font-semibold text-gray-600 mb-3">Timeline</h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Contact Date</label>
                  <p className="text-sm text-gray-900">{formatDate(lead.contactDate)}</p>
                </div>
                {lead.expectedCloseDate && (
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Expected Close</label>
                    {isEditing ? (
                      <input
                        type="date"
                        value={editedLead.expectedCloseDate?.split('T')[0] || ''}
                        onChange={(e) => setEditedLead({...editedLead, expectedCloseDate: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                      />
                    ) : (
                      <p className="text-sm text-gray-900">{formatDate(lead.expectedCloseDate)}</p>
                    )}
                  </div>
                )}
                {lead.actualCloseDate && (
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Actual Close</label>
                    <p className="text-sm text-gray-900">{formatDate(lead.actualCloseDate)}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Assigned To */}
            <div className="dashboard-card">
              <h3 className="text-sm font-semibold text-gray-600 mb-3">Assignment</h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Assigned To</label>
                  <p className="text-sm text-gray-900">
                    {lead.assignedTo?.firstName} {lead.assignedTo?.lastName}
                  </p>
                  <p className="text-xs text-gray-500">{lead.assignedTo?.email}</p>
                </div>
                {lead.headOfSales && (
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Head of Sales</label>
                    <p className="text-sm text-gray-900">
                      {lead.headOfSales?.firstName} {lead.headOfSales?.lastName}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Follow-up Modal */}
      <AddFollowUpModal
        show={showFollowUpModal}
        onClose={() => {
          setShowFollowUpModal(false);
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
        }}
        lead={lead}
        followUpData={followUpData}
        setFollowUpData={setFollowUpData}
        onSubmit={handleAddFollowUp}
      />

      {/* Evidence Submission Modal */}
      <FollowUpEvidenceModal
        show={showEvidenceModal}
        onClose={() => {
          setShowEvidenceModal(false);
          setSelectedFollowUp(null);
        }}
        lead={lead}
        followUp={selectedFollowUp}
        onSubmit={handleSubmitEvidence}
      />
    </DashboardLayout>
  );
};

export default SalesLeadDetails;
