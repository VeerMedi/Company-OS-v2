import { useState, useCallback } from 'react';
import api from '../utils/api';
import { showToast } from '../utils/toast';

export const useLeads = (onDataChange) => {
  const [myLeads, setMyLeads] = useState([]);
  const [stats, setStats] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  const fetchLeads = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await api.get('/leads/my-leads');
      setMyLeads(response.data.data || []);
      setStats(response.data.stats || {});
    } catch (error) {
      console.error('Error fetching leads:', error);
      showToast.error('Failed to load leads');
      setMyLeads([]); // Set empty array on error
      setStats({}); // Set empty object on error
    } finally {
      setIsLoading(false);
    }
  }, []);

  const addFollowUp = useCallback(async (leadId, followUpData) => {
    try {
      await api.post(`/leads/${leadId}/follow-up`, followUpData);
      showToast.success('Follow-up added successfully. Don\'t forget to submit evidence!');
      await fetchLeads();
      return true;
    } catch (error) {
      console.error('Error adding follow-up:', error);
      showToast.error('Failed to add follow-up');
      return false;
    }
  }, [fetchLeads]);

  const submitEvidence = useCallback(async (leadId, followUpId, formData) => {
    try {
      await api.post(`/leads/${leadId}/follow-up/${followUpId}/evidence`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      showToast.success('Evidence submitted successfully! 🎉');
      await fetchLeads();
      return true;
    } catch (error) {
      console.error('Error submitting evidence:', error);
      showToast.error(error.response?.data?.message || 'Failed to submit evidence');
      return false;
    }
  }, [fetchLeads]);

  const updateLeadStage = useCallback(async (leadId, newStage, proofData = null) => {
    try {
      if (proofData) {
        const formData = new FormData();
        formData.append('stage', newStage);
        formData.append('proofType', proofData.proofType);
        formData.append('proofLink', proofData.proofLink || '');
        formData.append('proofSummary', proofData.proofSummary);
        if (proofData.proofDocument) {
          formData.append('proofDocument', proofData.proofDocument);
        }

        await api.put(`/leads/${leadId}/stage`, formData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        });
      } else {
        await api.put(`/leads/${leadId}/stage`, { stage: newStage });
      }
      
      showToast.success('Lead stage updated successfully');
      await fetchLeads();
      // Trigger data change callback to refresh targets
      if (onDataChange) {
        onDataChange();
      }
      return true;
    } catch (error) {
      console.error('Error updating lead stage:', error);
      showToast.error('Failed to update lead stage');
      return false;
    }
  }, [fetchLeads, onDataChange]);

  const updateLeadStatus = useCallback(async (leadId, newStatus) => {
    try {
      const lead = myLeads.find(l => l._id === leadId);
      const updateData = { status: newStatus };
      
      // If marking as won, also update actual value and stage
      if (newStatus === 'won' && lead) {
        updateData.actualValue = lead.potentialValue;
        updateData.stage = 'closedWon';
      } else if (newStatus === 'lost') {
        updateData.stage = 'closedLost';
      }
      
      await api.put(`/leads/${leadId}`, updateData);
      
      if (newStatus === 'won') {
        showToast.success('Congratulations on winning the deal! 🎉');
      } else if (newStatus === 'lost') {
        showToast.info('Lead marked as lost. Better luck next time!');
      } else if (newStatus === 'on-hold') {
        showToast.info('Lead put on hold');
      } else {
        showToast.success('Lead status updated');
      }
      
      await fetchLeads();
      return true;
    } catch (error) {
      console.error('Error updating lead status:', error);
      showToast.error('Failed to update lead status');
      return false;
    }
  }, [fetchLeads, myLeads]);

  const createLead = useCallback(async (leadData) => {
    try {
      await api.post('/leads', {
        company: leadData.companyId,
        name: leadData.clientName || leadData.name,
        designation: leadData.designation || 'Contact Person',
        email: leadData.clientEmail || leadData.email,
        phone: leadData.clientPhone || leadData.phone,
        potentialValue: parseFloat(leadData.estimatedValue || leadData.potentialValue || 0),
        serviceInterest: leadData.serviceType || leadData.serviceInterest,
        expectedCloseDate: leadData.expectedCloseDate || undefined,
        requirements: leadData.notes || leadData.requirements,
        authorityLevel: leadData.authorityLevel || 'influencer',
        decisionPower: leadData.decisionPower || 'medium'
      });
      
      showToast.success('Lead created successfully!');
      await fetchLeads();
      // Trigger data change callback to refresh targets
      if (onDataChange) {
        onDataChange();
      }
      return true;
    } catch (error) {
      console.error('Error creating lead:', error);
      showToast.error(error.response?.data?.message || 'Failed to create lead');
      return false;
    }
  }, [fetchLeads, onDataChange]);

  return {
    myLeads,
    stats,
    isLoading,
    fetchLeads,
    addFollowUp,
    submitEvidence,
    updateLeadStage,
    updateLeadStatus,
    createLead
  };
};
