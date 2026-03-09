import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, AlertCircle, DollarSign, Phone, Mail, Calendar, CheckCircle, Search } from 'lucide-react';
import { formatDate } from '../../../utils/helpers';
import { getLeadTypeColor } from '../salesUtils';
import CreateLeadModal from '../modals/CreateLeadModal';
import ProofSubmissionModal from '../modals/ProofSubmissionModal';

const LeadsPipelineView = ({ 
  myLeads = [], 
  myCompanies = [], 
  onCreateLead,
  onUpdateLeadStage 
}) => {
  const navigate = useNavigate();
  const [showCreateLeadModal, setShowCreateLeadModal] = useState(false);
  const [showProofModal, setShowProofModal] = useState(false);
  const [selectedLeadForMove, setSelectedLeadForMove] = useState(null);
  const [targetStage, setTargetStage] = useState('');
  const [draggedLead, setDraggedLead] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [stageFilter, setStageFilter] = useState('all');
  
  const [proofData, setProofData] = useState({
    proofType: 'call-summary',
    proofLink: '',
    proofSummary: '',
    proofDocument: null
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

  const pipelineStages = [
    { id: 'lead', name: 'Lead', color: 'bg-gray-500' },
    { id: 'qualified', name: 'Qualified', color: 'bg-blue-500' },
    { id: 'proposal', name: 'Proposal', color: 'bg-yellow-500' },
    { id: 'negotiation', name: 'Negotiation', color: 'bg-orange-500' },
    { id: 'closed-won', name: 'Closed Won', color: 'bg-green-500' },
    { id: 'closed-lost', name: 'Closed Lost', color: 'bg-red-500' }
  ];

  const handleDragStart = (lead) => {
    setDraggedLead(lead);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = async (newStage) => {
    if (!draggedLead) return;
    
    const stages = ['lead', 'qualified', 'proposal', 'negotiation', 'closed-won', 'closed-lost'];
    const currentIndex = stages.indexOf(draggedLead.stage);
    const newIndex = stages.indexOf(newStage);
    
    if (newIndex > currentIndex) {
      setSelectedLeadForMove(draggedLead);
      setTargetStage(newStage);
      setShowProofModal(true);
    } else {
      await onUpdateLeadStage(draggedLead._id, newStage);
    }
    
    setDraggedLead(null);
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

  const handleSubmitProof = async (e) => {
    e.preventDefault();
    
    if (!selectedLeadForMove || !targetStage) return;
    
    await onUpdateLeadStage(selectedLeadForMove._id, targetStage, proofData);
    
    setShowProofModal(false);
    setSelectedLeadForMove(null);
    setTargetStage('');
    setProofData({
      proofType: 'call-summary',
      proofLink: '',
      proofSummary: '',
      proofDocument: null
    });
  };

  // Filter leads based on search and stage
  const filteredLeads = myLeads.filter((lead) => {
    const matchesSearch = searchQuery === '' || 
      lead.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lead.contactPerson?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lead.company?.companyName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lead.contactPerson?.email?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStage = stageFilter === 'all' || lead.stage === stageFilter;
    
    return matchesSearch && matchesStage;
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Leads Pipeline</h2>
          <p className="text-sm text-gray-500 mt-1">Drag and drop leads between stages</p>
        </div>
        <button
          onClick={() => setShowCreateLeadModal(true)}
          className="btn-primary flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Create Lead
        </button>
      </div>

      {/* Search and Filter Section */}
      <div className="dashboard-card">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <input
              type="text"
              placeholder="Search by name, company, or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>
          <div>
            <select
              value={stageFilter}
              onChange={(e) => setStageFilter(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="all">All Stages</option>
              {pipelineStages.map(stage => (
                <option key={stage.id} value={stage.id}>{stage.name}</option>
              ))}
            </select>
          </div>
        </div>
        {searchQuery || stageFilter !== 'all' ? (
          <div className="mt-3 text-sm text-gray-600">
            Showing {filteredLeads.length} of {myLeads.length} leads
          </div>
        ) : null}
      </div>

      {/* Kanban Board */}
      <div className="overflow-x-auto pb-4">
        <div className="flex gap-4 min-w-max">
          {pipelineStages.map((stage) => {
            const stageLeads = filteredLeads.filter(lead => lead.stage === stage.id);
            
            return (
              <div
                key={stage.id}
                className="flex-shrink-0 w-80"
                onDragOver={handleDragOver}
                onDrop={() => handleDrop(stage.id)}
              >
                <div className={`${stage.color} text-white rounded-t-lg p-3`}>
                  <div className="flex justify-between items-center">
                    <h3 className="font-semibold">{stage.name}</h3>
                    <span className="bg-white bg-opacity-30 px-2 py-1 rounded-full text-sm">
                      {stageLeads.length}
                    </span>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-b-lg p-3 min-h-[600px] space-y-3">
                  {stageLeads.length === 0 ? (
                    <div className="text-center py-8 text-gray-400 text-sm">
                      No leads in this stage
                    </div>
                  ) : (
                    stageLeads.map((lead) => (
                      <div
                        key={lead._id}
                        draggable
                        onDragStart={() => handleDragStart(lead)}
                        className="bg-white rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow cursor-move border border-gray-200"
                      >
                        <div className="space-y-2">
                          <div className="flex justify-between items-start">
                            <div>
                              <h4 className="font-semibold text-gray-900">{lead.name}</h4>
                              <p className="text-sm text-gray-500">{lead.designation}</p>
                              {lead.company && (
                                <p className="text-xs text-primary-600 mt-1">
                                  🏢 {lead.company.companyName}
                                </p>
                              )}
                            </div>
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${getLeadTypeColor(lead.leadType)}`}>
                              {lead.leadType}
                            </span>
                          </div>

                          <div className="text-sm text-gray-600">
                            <div className="flex items-center gap-1">
                              <DollarSign className="h-3 w-3" />
                              <span className="font-medium">₹{(lead.potentialValue || 0).toLocaleString()}</span>
                            </div>
                          </div>

                          <div className="text-xs text-gray-500">
                            <div className="flex items-center gap-1">
                              <Phone className="h-3 w-3" />
                              <span>{lead.phone}</span>
                            </div>
                            <div className="flex items-center gap-1 mt-1">
                              <Mail className="h-3 w-3" />
                              <span>{lead.email}</span>
                            </div>
                          </div>

                          {lead.serviceInterest && (
                            <div className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded">
                              {lead.serviceInterest}
                            </div>
                          )}

                          {lead.expectedCloseDate && (
                            <div className="text-xs text-gray-500 flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              Expected: {formatDate(lead.expectedCloseDate)}
                            </div>
                          )}

                          {lead.stageProofs && lead.stageProofs.length > 0 && (
                            <div className="text-xs text-green-600 flex items-center gap-1 mt-2">
                              <CheckCircle className="h-3 w-3" />
                              {lead.stageProofs.length} proof(s) submitted
                            </div>
                          )}

                          <button
                            onClick={() => navigate(`/lead/${lead._id}`)}
                            className="text-xs text-primary-600 hover:text-primary-700 font-medium w-full text-center mt-2 py-1 border border-primary-200 rounded hover:bg-primary-50"
                          >
                            View Details
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Instructions */}
      <div className="dashboard-card bg-blue-50">
        <div className="flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
          <div className="text-sm text-blue-800">
            <p className="font-medium mb-1">How to Use the Pipeline</p>
            <ul className="list-disc list-inside space-y-1">
              <li>Drag and drop leads between stages to update their status</li>
              <li>You'll be asked to provide proof when moving forward in the pipeline</li>
              <li>Proof can include call summaries, meeting notes, or relevant documents</li>
              <li>All movements and proofs are tracked for HOS review</li>
            </ul>
          </div>
        </div>
      </div>

      <CreateLeadModal
        show={showCreateLeadModal}
        onClose={() => setShowCreateLeadModal(false)}
        companies={myCompanies}
        formData={newLeadForm}
        setFormData={setNewLeadForm}
        onSubmit={handleCreateLead}
      />

      <ProofSubmissionModal
        show={showProofModal}
        onClose={() => setShowProofModal(false)}
        lead={selectedLeadForMove}
        targetStage={targetStage}
        proofData={proofData}
        setProofData={setProofData}
        onSubmit={handleSubmitProof}
      />
    </div>
  );
};

export default LeadsPipelineView;
