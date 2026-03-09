import React from 'react';
import { CheckCircle } from 'lucide-react';
import { formatDate } from '../../../utils/helpers';

const CreateLeadModal = ({ 
  show, 
  onClose, 
  companies, 
  formData, 
  setFormData, 
  onSubmit 
}) => {
  if (!show) return null;

  const handleClose = () => {
    setFormData({
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
    onClose();
  };

  const selectedCompany = companies.find(c => c._id === formData.companyId);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <h2 className="text-xl font-bold mb-4">Create New Lead</h2>
          <form onSubmit={onSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Select Company *
              </label>
              <select
                required
                value={formData.companyId}
                onChange={(e) => setFormData({...formData, companyId: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="">Choose a company...</option>
                {companies.filter(c => c.approvalStatus === 'approved').map((company) => (
                  <option key={company._id} value={company._id}>
                    {company.companyName} - {company.industry}
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-500 mt-1">Only approved companies are shown</p>
              
              {selectedCompany && (
                <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-md">
                  <div className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                    <div className="text-sm">
                      <p className="font-medium text-green-900">{selectedCompany.companyName}</p>
                      <p className="text-green-700">{selectedCompany.industry}</p>
                      {selectedCompany.approvedBy && (
                        <p className="text-xs text-green-600 mt-1">
                          ✓ Approved by {selectedCompany.approvedBy.firstName} {selectedCompany.approvedBy.lastName}
                          {selectedCompany.approvalDate && ` on ${formatDate(selectedCompany.approvalDate)}`}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Client Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.clientName}
                  onChange={(e) => setFormData({...formData, clientName: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="Contact person name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Client Email
                </label>
                <input
                  type="email"
                  value={formData.clientEmail}
                  onChange={(e) => setFormData({...formData, clientEmail: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Client Phone *
                </label>
                <input
                  type="tel"
                  required
                  value={formData.clientPhone}
                  onChange={(e) => setFormData({...formData, clientPhone: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Service Type *
                </label>
                <input
                  type="text"
                  required
                  value={formData.serviceType}
                  onChange={(e) => setFormData({...formData, serviceType: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="What service are you selling?"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Estimated Value (₹) *
                </label>
                <input
                  type="number"
                  required
                  value={formData.estimatedValue}
                  onChange={(e) => setFormData({...formData, estimatedValue: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Lead Type
                </label>
                <select
                  value={formData.leadType}
                  onChange={(e) => setFormData({...formData, leadType: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="hot">Hot</option>
                  <option value="warm">Warm</option>
                  <option value="cold">Cold</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Expected Close Date
                </label>
                <input
                  type="date"
                  value={formData.expectedCloseDate}
                  onChange={(e) => setFormData({...formData, expectedCloseDate: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Notes
              </label>
              <textarea
                rows="3"
                value={formData.notes}
                onChange={(e) => setFormData({...formData, notes: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="Additional information about the lead..."
              ></textarea>
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
                Create Lead
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CreateLeadModal;
