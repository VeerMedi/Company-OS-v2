import { useState, useCallback } from 'react';
import api from '../utils/api';
import { showToast } from '../utils/toast';

export const useCompanies = (onDataChange) => {
  const [myCompanies, setMyCompanies] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchCompanies = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await api.get('/companies/my-companies');
      setMyCompanies(response.data.data || []);
    } catch (error) {
      console.error('Error fetching companies:', error);
      showToast.error('Failed to load companies');
      setMyCompanies([]); // Set empty array on error
    } finally {
      setIsLoading(false);
    }
  }, []);

  const submitCompany = useCallback(async (companyData, researchDocument) => {
    try {
      const formData = new FormData();
      
      // Add basic company info
      formData.append('companyName', companyData.companyName);
      formData.append('overview', companyData.overview || '');
      formData.append('industry', companyData.industry || '');
      formData.append('website', companyData.website || '');
      formData.append('employeeCount', companyData.employeeCount || 'unknown');
      formData.append('revenue', companyData.revenue || '');
      formData.append('potentialValue', companyData.potentialValue || '0');
      formData.append('priority', companyData.priority || 'medium');
      
      // Add assigned HOS
      if (companyData.assignedHOS) {
        formData.append('assignedHOS', companyData.assignedHOS);
      }
      
      // Add all new 18 fields
      formData.append('geographicalHotspots', companyData.geographicalHotspots || '');
      formData.append('annualRevenueUSD', companyData.annualRevenueUSD || '');
      formData.append('currentTechStack', companyData.currentTechStack || '');
      formData.append('currentPainPoints', companyData.currentPainPoints || '');
      formData.append('automationSaaSUsed', companyData.automationSaaSUsed || '');
      formData.append('expectedROIImpact', companyData.expectedROIImpact || '');
      formData.append('keyChallenges', companyData.keyChallenges || '');
      formData.append('howHustleHouseCanHelp', companyData.howHustleHouseCanHelp || '');
      formData.append('additionalNotes', companyData.additionalNotes || '');
      formData.append('wrtRoiPriorityLevel', companyData.wrtRoiPriorityLevel || 'medium');
      formData.append('proofOfConcept', companyData.proofOfConcept || '');
      formData.append('latestNews', companyData.latestNews || '');
      
      // Add location
      formData.append('location[city]', companyData.location?.city || '');
      formData.append('location[state]', companyData.location?.state || '');
      formData.append('location[country]', companyData.location?.country || 'India');
      
      // Add research data
      formData.append('research[keyDecisionMakers]', companyData.research?.keyDecisionMakers || '');
      formData.append('research[painPoints]', companyData.research?.painPoints || companyData.currentPainPoints || '');
      formData.append('research[competitors]', companyData.research?.competitors || '');
      formData.append('research[budget]', companyData.research?.budget || '');
      formData.append('research[timeline]', companyData.research?.timeline || '');
      formData.append('research[potentialServices]', companyData.research?.potentialServices || '');
      
      // Add research document if provided
      if (researchDocument) {
        formData.append('researchDocument', researchDocument);
      }

      console.log('🚀 Submitting company with all fields:', Object.fromEntries(formData));

      await api.post('/companies', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      showToast.success('Company submitted for approval!');
      await fetchCompanies();
      // Trigger data change callback to refresh targets
      if (onDataChange) {
        onDataChange();
      }
      return true;
    } catch (error) {
      console.error('Error submitting company:', error);
      showToast.error(error.response?.data?.message || 'Failed to submit company');
      return false;
    }
  }, [fetchCompanies, onDataChange]);

  const deleteCompany = useCallback(async (companyId) => {
    try {
      await api.delete(`/companies/${companyId}`);
      showToast.success('Company deleted successfully');
      await fetchCompanies();
      // Trigger data change callback to refresh targets
      if (onDataChange) {
        onDataChange();
      }
      return true;
    } catch (error) {
      console.error('Error deleting company:', error);
      showToast.error(error.response?.data?.message || 'Failed to delete company');
      return false;
    }
  }, [fetchCompanies, onDataChange]);

  return {
    myCompanies,
    isLoading,
    fetchCompanies,
    submitCompany,
    deleteCompany
  };
};
