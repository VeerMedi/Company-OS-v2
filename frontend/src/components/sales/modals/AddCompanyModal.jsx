import React, { useState, useEffect } from 'react';
import { AlertCircle, CheckCircle, UserCheck } from 'lucide-react';
import { showToast } from '../../../utils/toast';
import api from '../../../utils/api';

const AddCompanyModal = ({ 
  show, 
  onClose, 
  formData, 
  setFormData, 
  researchDocument,
  setResearchDocument,
  onSubmit 
}) => {
  const [hosUsers, setHosUsers] = useState([]);
  const [loadingHOS, setLoadingHOS] = useState(false);

  // Fetch HOS users when modal opens
  useEffect(() => {
    if (show) {
      fetchHOSUsers();
    }
  }, [show]);

  const fetchHOSUsers = async () => {
    setLoadingHOS(true);
    try {
      const response = await api.get('/users/head-of-sales');
      setHosUsers(response.data.data || []);
    } catch (error) {
      console.error('Error fetching HOS users:', error);
      showToast.error('Failed to load Head of Sales users');
    } finally {
      setLoadingHOS(false);
    }
  };

  if (!show) return null;

  const handleClose = () => {
    setResearchDocument(null);
    setFormData({
      companyName: '',
      overview: '',
      industry: '',
      employeeCount: 'unknown',
      location: {
        city: '',
        state: '',
        country: 'India'
      },
      geographicalHotspots: '',
      annualRevenueUSD: '',
      website: '',
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
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto my-8">
        <div className="p-6 sticky top-0 bg-white border-b z-10">
          <h2 className="text-xl font-bold">Submit Company for Approval</h2>
          <p className="text-sm text-gray-600 mt-2">
            Submit a new company to the Head of Sales for approval. Provide as much detail as possible to help with the approval process.
          </p>
        </div>
        <form onSubmit={onSubmit} className="p-6 space-y-6">
          {/* HOS Selection */}
          <div className="border-b pb-4 bg-blue-50 p-4 rounded-lg">
            <div className="flex items-center gap-2 mb-3">
              <UserCheck className="h-5 w-5 text-blue-600" />
              <h3 className="text-lg font-semibold text-blue-900">Select Head of Sales for Review</h3>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Assign to Head of Sales *
              </label>
              <select
                required
                value={formData.assignedHOS || ''}
                onChange={(e) => setFormData({...formData, assignedHOS: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white"
                disabled={loadingHOS}
              >
                <option value="">
                  {loadingHOS ? 'Loading...' : 'Select a Head of Sales to review this submission'}
                </option>
                {hosUsers.map((hos) => (
                  <option key={hos._id} value={hos._id}>
                    {hos.firstName} {hos.lastName} {hos.employeeId ? `(${hos.employeeId})` : ''} - {hos.email}
                  </option>
                ))}
              </select>
              {hosUsers.length === 0 && !loadingHOS && (
                <p className="mt-2 text-sm text-amber-600 flex items-center gap-1">
                  <AlertCircle className="h-4 w-4" />
                  No active Head of Sales users found. Please contact administration.
                </p>
              )}
              <p className="mt-2 text-xs text-gray-600">
                The selected Head of Sales will receive this company submission for review and approval.
              </p>
            </div>
          </div>

          {/* Basic Information */}
          <div className="border-b pb-4">
            <h3 className="text-lg font-semibold mb-3">Basic Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Company Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.companyName}
                  onChange={(e) => setFormData({...formData, companyName: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="Enter company name"
                />
              </div>
              
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Company Overview / Description
                </label>
                <textarea
                  rows="3"
                  value={formData.overview}
                  onChange={(e) => setFormData({...formData, overview: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="Brief overview of the company, what they do, their market position, etc."
                ></textarea>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Industry
                </label>
                <input
                  type="text"
                  value={formData.industry}
                  onChange={(e) => setFormData({...formData, industry: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="e.g., Technology, Healthcare, Manufacturing"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Website
                </label>
                <input
                  type="url"
                  value={formData.website}
                  onChange={(e) => setFormData({...formData, website: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="https://example.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Working Employees
                </label>
                <select
                  value={formData.employeeCount}
                  onChange={(e) => setFormData({...formData, employeeCount: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
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
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Annual Revenue (USD)
                </label>
                <input
                  type="text"
                  value={formData.annualRevenueUSD}
                  onChange={(e) => setFormData({...formData, annualRevenueUSD: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="e.g., $1M - $5M, $10M+, 5-10Cr"
                />
              </div>
            </div>
          </div>

          {/* Location & Geography */}
          <div className="border-b pb-4">
            <h3 className="text-lg font-semibold mb-3">Location & Geography</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Country / Region
                </label>
                <input
                  type="text"
                  value={formData.location.country}
                  onChange={(e) => setFormData({
                    ...formData,
                    location: {...formData.location, country: e.target.value}
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="e.g., India, USA, UK"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Geographical Hotspots
                </label>
                <input
                  type="text"
                  value={formData.geographicalHotspots}
                  onChange={(e) => setFormData({...formData, geographicalHotspots: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="e.g., Mumbai, Bangalore, Delhi NCR"
                />
              </div>
            </div>
          </div>

          {/* Technology & Operations */}
          <div className="border-b pb-4">
            <h3 className="text-lg font-semibold mb-3">Technology & Operations</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Current Tech Stack
                </label>
                <textarea
                  rows="2"
                  value={formData.currentTechStack}
                  onChange={(e) => setFormData({...formData, currentTechStack: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="List the technologies, software, and tools they currently use"
                ></textarea>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Current Pain Points
                </label>
                <textarea
                  rows="3"
                  value={formData.currentPainPoints}
                  onChange={(e) => setFormData({...formData, currentPainPoints: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="What challenges are they facing? What problems can we solve?"
                ></textarea>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Automation / SaaS Solutions Used
                </label>
                <textarea
                  rows="2"
                  value={formData.automationSaaSUsed}
                  onChange={(e) => setFormData({...formData, automationSaaSUsed: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="List any automation tools, SaaS platforms, or services they're using"
                ></textarea>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Key Challenges
                </label>
                <textarea
                  rows="2"
                  value={formData.keyChallenges}
                  onChange={(e) => setFormData({...formData, keyChallenges: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="Main business challenges and obstacles they're facing"
                ></textarea>
              </div>
            </div>
          </div>

          {/* Value Proposition & Strategy */}
          <div className="border-b pb-4">
            <h3 className="text-lg font-semibold mb-3">Value Proposition & Strategy</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  How Hustle House Can Help (Pitch Angle)
                </label>
                <textarea
                  rows="3"
                  value={formData.howHustleHouseCanHelp}
                  onChange={(e) => setFormData({...formData, howHustleHouseCanHelp: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="Describe how our solutions can address their needs and add value"
                ></textarea>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Expected ROI Impact (Qualitative/%)
                </label>
                <input
                  type="text"
                  value={formData.expectedROIImpact}
                  onChange={(e) => setFormData({...formData, expectedROIImpact: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="e.g., 30% cost reduction, 2x productivity, 50% time savings"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Proof of Concept
                </label>
                <textarea
                  rows="2"
                  value={formData.proofOfConcept}
                  onChange={(e) => setFormData({...formData, proofOfConcept: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="Ideas for POC, pilot projects, or trial implementations"
                ></textarea>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Latest Company/Industry News
                </label>
                <textarea
                  rows="2"
                  value={formData.latestNews}
                  onChange={(e) => setFormData({...formData, latestNews: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="Recent news, funding rounds, expansions, industry trends affecting them"
                ></textarea>
              </div>
            </div>
          </div>

          {/* Priority & Notes */}
          <div className="border-b pb-4">
            <h3 className="text-lg font-semibold mb-3">Priority & Additional Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  WRT ROI - Priority Level
                </label>
                <select
                  value={formData.wrtRoiPriorityLevel}
                  onChange={(e) => setFormData({...formData, wrtRoiPriorityLevel: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="critical">Critical</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Potential Value (₹)
                </label>
                <input
                  type="number"
                  value={formData.potentialValue}
                  onChange={(e) => setFormData({...formData, potentialValue: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="Estimated deal value"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Additional Notes / Comments
                </label>
                <textarea
                  rows="3"
                  value={formData.additionalNotes}
                  onChange={(e) => setFormData({...formData, additionalNotes: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="Any additional information, context, or important notes"
                ></textarea>
              </div>
            </div>
          </div>

          {/* Research Information (Optional - for backward compatibility) */}
          <div className="border-b pb-4">
            <h3 className="text-lg font-semibold mb-3">Additional Research Information (Optional)</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Key Decision Makers
                </label>
                <textarea
                  rows="2"
                  value={formData.research.keyDecisionMakers}
                  onChange={(e) => setFormData({
                    ...formData,
                    research: {...formData.research, keyDecisionMakers: e.target.value}
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="Names and roles of key decision makers"
                ></textarea>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Budget
                  </label>
                  <input
                    type="text"
                    value={formData.research.budget}
                    onChange={(e) => setFormData({
                      ...formData,
                      research: {...formData.research, budget: e.target.value}
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="Estimated budget"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Timeline
                  </label>
                  <input
                    type="text"
                    value={formData.research.timeline}
                    onChange={(e) => setFormData({
                      ...formData,
                      research: {...formData.research, timeline: e.target.value}
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="Expected timeline"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Upload Research Document
                </label>
                <div className="mt-1">
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv"
                    onChange={(e) => {
                      const file = e.target.files[0];
                      if (file) {
                        if (file.size > 10 * 1024 * 1024) {
                          showToast.error('File size must be less than 10MB');
                          e.target.value = '';
                          return;
                        }
                        setResearchDocument(file);
                      }
                    }}
                    className="block w-full text-sm text-gray-500
                      file:mr-4 file:py-2 file:px-4
                      file:rounded-md file:border-0
                      file:text-sm file:font-semibold
                      file:bg-primary-50 file:text-primary-700
                      hover:file:bg-primary-100
                      cursor-pointer"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    PDF, DOC, DOCX, XLS, XLSX, PPT, PPTX, TXT, CSV (Max 10MB)
                  </p>
                  {researchDocument && (
                    <div className="mt-2 flex items-center gap-2 text-sm text-green-600">
                      <CheckCircle className="h-4 w-4" />
                      <span>{researchDocument.name}</span>
                      <button
                        type="button"
                        onClick={() => setResearchDocument(null)}
                        className="text-red-600 hover:text-red-700 ml-2"
                      >
                        Remove
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary"
            >
              Submit for Approval
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddCompanyModal;
