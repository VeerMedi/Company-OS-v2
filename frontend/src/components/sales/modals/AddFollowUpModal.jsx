import React, { useState } from 'react';

const AddFollowUpModal = ({ 
  show, 
  onClose, 
  lead, 
  followUpData, 
  setFollowUpData, 
  onSubmit 
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!show || !lead) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await onSubmit(e);
    } finally {
      setIsSubmitting(false);
    }
  };

  const contactMethods = [
    { value: 'linkedin', label: 'LinkedIn', icon: '💼' },
    { value: 'email', label: 'Email', icon: '📧' },
    { value: 'call', label: 'Phone Call', icon: '📞' },
    { value: 'meeting', label: 'Meeting', icon: '🤝' },
    { value: 'whatsapp', label: 'WhatsApp', icon: '💬' },
    { value: 'other', label: 'Other', icon: '📝' }
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Add Follow-up</h2>
            <p className="text-sm text-gray-600 mt-2">
              Lead: <span className="font-medium text-gray-900">{lead.name}</span>
              {lead.company && <span className="text-gray-400"> @ {lead.company.companyName}</span>}
            </p>
            <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
              <p className="text-sm text-yellow-800">
                <strong>⚠️ Evidence Required:</strong> You must submit evidence (screenshot, email, etc.) after completing this follow-up.
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Contact Method */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Contact Method <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {contactMethods.map(method => (
                  <button
                    key={method.value}
                    type="button"
                    onClick={() => setFollowUpData({...followUpData, contactMethod: method.value})}
                    className={`p-3 border-2 rounded-lg text-sm font-medium transition-all ${
                      followUpData.contactMethod === method.value
                        ? 'border-primary-500 bg-primary-50 text-primary-700'
                        : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <span className="text-xl mr-2">{method.icon}</span>
                    {method.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Date and Time */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  required
                  value={followUpData.scheduledDate}
                  onChange={(e) => setFollowUpData({...followUpData, scheduledDate: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Time <span className="text-red-500">*</span>
                </label>
                <input
                  type="time"
                  required
                  value={followUpData.scheduledTime}
                  onChange={(e) => setFollowUpData({...followUpData, scheduledTime: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
            </div>

            {/* Summary */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Summary <span className="text-red-500">*</span>
              </label>
              <textarea
                rows="3"
                required
                value={followUpData.summary}
                onChange={(e) => setFollowUpData({...followUpData, summary: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="Brief overview of what this follow-up is about..."
              ></textarea>
            </div>

            {/* Message/Content Sent */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Message/Content Sent
              </label>
              <textarea
                rows="4"
                value={followUpData.messageSent}
                onChange={(e) => setFollowUpData({...followUpData, messageSent: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="What message or content will you send? (email body, call script, meeting agenda, etc.)"
              ></textarea>
            </div>

            {/* Conclusion */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Expected Outcome/Conclusion
              </label>
              <textarea
                rows="2"
                value={followUpData.conclusion}
                onChange={(e) => setFollowUpData({...followUpData, conclusion: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="What do you expect to achieve from this follow-up?"
              ></textarea>
            </div>

            {/* Next Step */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Next Step <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={followUpData.nextStep}
                onChange={(e) => setFollowUpData({...followUpData, nextStep: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="What's the next action to take after this follow-up?"
              />
            </div>

            {/* Scheduled Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Scheduled Date (Optional)
              </label>
              <input
                type="date"
                value={followUpData.nextFollowUpDate}
                onChange={(e) => setFollowUpData({...followUpData, nextFollowUpDate: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
              <p className="text-xs text-gray-500 mt-1">
                When do you plan to do this follow-up action?
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="px-5 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="btn-primary px-5 py-2 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <>
                    <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Adding...
                  </>
                ) : (
                  'Add Follow-up'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AddFollowUpModal;
