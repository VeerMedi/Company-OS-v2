import React, { useState } from 'react';
import { Upload, X, FileText, Image as ImageIcon, File } from 'lucide-react';

const FollowUpEvidenceModal = ({ 
  show, 
  onClose, 
  lead, 
  followUp,
  onSubmit 
}) => {
  const [evidenceFiles, setEvidenceFiles] = useState([]);
  const [evidenceNotes, setEvidenceNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!show || !lead || !followUp) return null;

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    setEvidenceFiles(prev => [...prev, ...files]);
  };

  const removeFile = (index) => {
    setEvidenceFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!evidenceNotes.trim()) {
      alert('Please provide evidence notes/summary');
      return;
    }

    setIsSubmitting(true);
    
    const formData = new FormData();
    evidenceFiles.forEach(file => {
      formData.append('evidence', file);
    });
    formData.append('evidenceNotes', evidenceNotes);

    const success = await onSubmit(lead._id, followUp._id, formData);
    
    if (success) {
      setEvidenceFiles([]);
      setEvidenceNotes('');
      onClose();
    }
    
    setIsSubmitting(false);
  };

  const getFileIcon = (file) => {
    if (file.type.startsWith('image/')) {
      return <ImageIcon className="h-5 w-5 text-blue-500" />;
    } else if (file.type.includes('pdf')) {
      return <FileText className="h-5 w-5 text-red-500" />;
    }
    return <File className="h-5 w-5 text-gray-500" />;
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Submit Follow-up Evidence</h2>
            <p className="text-sm text-gray-600 mt-2">
              Lead: <span className="font-medium text-gray-900">{lead.name}</span>
              {lead.company && <span className="text-gray-400"> @ {lead.company.companyName}</span>}
            </p>
          </div>

          {/* Follow-up Details */}
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h3 className="font-semibold text-blue-900 mb-2">Follow-up Details</h3>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-blue-700">Contact Method:</span>
                <span className="font-medium text-blue-900 capitalize">{followUp.contactMethod}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-blue-700">Date:</span>
                <span className="font-medium text-blue-900">
                  {formatDate(followUp.scheduledDate)} at {followUp.scheduledTime}
                </span>
              </div>
              {followUp.summary && (
                <div className="mt-2 pt-2 border-t border-blue-200">
                  <span className="text-blue-700">Summary:</span>
                  <p className="text-blue-900 mt-1">{followUp.summary}</p>
                </div>
              )}
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* File Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Upload Evidence
              </label>
              <p className="text-xs text-gray-500 mb-3">
                Screenshots, emails, chat logs, meeting notes, or any proof of follow-up completion
              </p>
              
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-primary-400 transition-colors">
                <input
                  type="file"
                  multiple
                  accept="image/*,.pdf,.doc,.docx,.txt"
                  onChange={handleFileChange}
                  className="hidden"
                  id="evidence-upload"
                />
                <label 
                  htmlFor="evidence-upload"
                  className="cursor-pointer flex flex-col items-center"
                >
                  <Upload className="h-10 w-10 text-gray-400 mb-2" />
                  <span className="text-sm font-medium text-gray-700">
                    Click to upload evidence files
                  </span>
                  <span className="text-xs text-gray-500 mt-1">
                    PNG, JPG, PDF, DOC (max 10MB each)
                  </span>
                </label>
              </div>

              {/* File List */}
              {evidenceFiles.length > 0 && (
                <div className="mt-4 space-y-2">
                  {evidenceFiles.map((file, index) => (
                    <div 
                      key={index}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200"
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        {getFileIcon(file)}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {file.name}
                          </p>
                          <p className="text-xs text-gray-500">
                            {formatFileSize(file.size)}
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeFile(index)}
                        className="ml-2 p-1 text-red-500 hover:bg-red-50 rounded"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Evidence Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Evidence Notes <span className="text-red-500">*</span>
              </label>
              <textarea
                rows="4"
                value={evidenceNotes}
                onChange={(e) => setEvidenceNotes(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="Provide additional context about the evidence (e.g., 'Screenshot of LinkedIn message sent', 'Meeting notes attached', etc.)"
              ></textarea>
            </div>

            {/* Info Box */}
            <div className="p-4 bg-green-50 border border-green-200 rounded-md">
              <p className="text-sm text-green-800">
                <strong>📌 Note:</strong> Your Head of Sales will be notified when you submit this evidence. Make sure all information is accurate and complete.
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="px-5 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 font-medium transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting || !evidenceNotes.trim()}
                className="btn-primary px-5 py-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Submitting...' : 'Submit Evidence'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default FollowUpEvidenceModal;
