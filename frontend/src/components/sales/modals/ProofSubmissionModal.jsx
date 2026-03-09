import React from 'react';

const ProofSubmissionModal = ({ 
  show, 
  onClose, 
  lead, 
  targetStage, 
  proofData, 
  setProofData, 
  onSubmit 
}) => {
  if (!show || !lead) return null;

  const handleClose = () => {
    setProofData({
      proofType: 'call-summary',
      proofLink: '',
      proofSummary: '',
      proofDocument: null
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <h2 className="text-xl font-bold mb-4">Submit Proof of Progress</h2>
          <div className="bg-blue-50 rounded-lg p-3 mb-4">
            <p className="text-sm text-blue-800">
              <strong>Lead:</strong> {lead.name} ({lead.designation})
              {lead.company && (
                <>
                  <br />
                  <strong>Company:</strong> {lead.company.companyName}
                </>
              )}
              <br />
              <strong>Moving to:</strong> <span className="capitalize">{targetStage.replace('-', ' ')}</span>
            </p>
          </div>

          <form onSubmit={onSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Proof Type *
              </label>
              <select
                required
                value={proofData.proofType}
                onChange={(e) => setProofData({...proofData, proofType: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="call-summary">Call Summary</option>
                <option value="meeting-summary">Meeting Summary</option>
                <option value="email-thread">Email Thread</option>
                <option value="proposal-sent">Proposal Sent</option>
                <option value="contract-signed">Contract Signed</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Proof Link (Optional)
              </label>
              <input
                type="url"
                value={proofData.proofLink}
                onChange={(e) => setProofData({...proofData, proofLink: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="https://example.com/document"
              />
              <p className="text-xs text-gray-500 mt-1">
                Link to Google Doc, recording, or any relevant resource
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Summary/Notes *
              </label>
              <textarea
                required
                rows="4"
                value={proofData.proofSummary}
                onChange={(e) => setProofData({...proofData, proofSummary: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="Describe what happened, key discussion points, next steps, etc."
              ></textarea>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Upload Document (Optional)
              </label>
              <input
                type="file"
                accept=".pdf,.doc,.docx,.txt,.png,.jpg,.jpeg"
                onChange={(e) => {
                  const file = e.target.files[0];
                  if (file && file.size > 10 * 1024 * 1024) {
                    alert('File size must be less than 10MB');
                    e.target.value = '';
                    return;
                  }
                  setProofData({...proofData, proofDocument: file});
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
                PDF, DOC, DOCX, TXT, Images (Max 10MB)
              </p>
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
                Submit & Move Lead
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ProofSubmissionModal;
