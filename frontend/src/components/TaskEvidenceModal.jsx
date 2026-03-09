import React, { useState } from 'react';
import { X, Upload, Link, Image, Video, FileText, CheckCircle } from 'lucide-react';

const TaskEvidenceModal = ({ 
  isOpen, 
  onClose, 
  task, 
  newStatus, 
  onSubmit 
}) => {
  const [evidenceData, setEvidenceData] = useState({
    description: '',
    evidenceType: 'screenshot', // screenshot, url, video, document
    files: [],
    urls: [],
    notes: ''
  });
  
  const [previewUrls, setPreviewUrls] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const evidenceTypes = [
    {
      value: 'screenshot',
      label: 'Screenshot',
      icon: Image,
      description: 'Upload screenshot images',
      accept: 'image/*',
      multiple: true
    },
    {
      value: 'video',
      label: 'Screen Recording',
      icon: Video,
      description: 'Upload screen recording videos',
      accept: 'video/*',
      multiple: false
    },
    {
      value: 'url',
      label: 'URL/Link',
      icon: Link,
      description: 'Add links as evidence',
      accept: null,
      multiple: true
    },
    {
      value: 'document',
      label: 'Document',
      icon: FileText,
      description: 'Upload documents',
      accept: '.pdf,.doc,.docx,.txt',
      multiple: true
    }
  ];

  const getStatusMessage = () => {
    switch (newStatus) {
      case 'accept':
        return 'Accepting this task';
      case 'review':
        return 'Submitting task for review';
      case 'completed':
        return 'Marking task as completed';
      case 'cant-complete':
        return "Marking task as can't complete";
      default:
        return 'Updating task status';
    }
  };

  const handleEvidenceTypeChange = (type) => {
    setEvidenceData(prev => ({
      ...prev,
      evidenceType: type,
      files: [],
      urls: []
    }));
    setPreviewUrls([]);
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    const newFiles = [...evidenceData.files, ...files];
    
    setEvidenceData(prev => ({
      ...prev,
      files: newFiles
    }));

    // Create preview URLs for images
    if (evidenceData.evidenceType === 'screenshot') {
      files.forEach(file => {
        if (file.type.startsWith('image/')) {
          const reader = new FileReader();
          reader.onloadend = () => {
            setPreviewUrls(prev => [...prev, reader.result]);
          };
          reader.readAsDataURL(file);
        }
      });
    }
  };

  const handleUrlAdd = () => {
    setEvidenceData(prev => ({
      ...prev,
      urls: [...prev.urls, '']
    }));
  };

  const handleUrlChange = (index, value) => {
    const newUrls = [...evidenceData.urls];
    newUrls[index] = value;
    setEvidenceData(prev => ({
      ...prev,
      urls: newUrls
    }));
  };

  const handleUrlRemove = (index) => {
    const newUrls = evidenceData.urls.filter((_, i) => i !== index);
    setEvidenceData(prev => ({
      ...prev,
      urls: newUrls
    }));
  };

  const handleFileRemove = (index) => {
    const newFiles = evidenceData.files.filter((_, i) => i !== index);
    const newPreviews = previewUrls.filter((_, i) => i !== index);
    
    setEvidenceData(prev => ({
      ...prev,
      files: newFiles
    }));
    setPreviewUrls(newPreviews);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const formData = new FormData();
      formData.append('taskId', task._id);
      formData.append('newStatus', newStatus);
      formData.append('description', evidenceData.description);
      formData.append('evidenceType', evidenceData.evidenceType);
      formData.append('notes', evidenceData.notes);
      
      // Add files
      evidenceData.files.forEach((file, index) => {
        formData.append(`files`, file);
      });
      
      // Add URLs
      evidenceData.urls.forEach((url, index) => {
        if (url.trim()) {
          formData.append(`urls[${index}]`, url.trim());
        }
      });

      await onSubmit(formData);
      handleClose();
    } catch (error) {
      console.error('Error submitting evidence:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setEvidenceData({
      description: '',
      evidenceType: 'screenshot',
      files: [],
      urls: [],
      notes: ''
    });
    setPreviewUrls([]);
    setIsSubmitting(false);
    onClose();
  };

  const selectedType = evidenceTypes.find(type => type.value === evidenceData.evidenceType);
  const SelectedIcon = selectedType?.icon || Image;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        {/* Backdrop */}
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={handleClose} />
        
        {/* Modal */}
        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full">
          <form onSubmit={handleSubmit}>
            {/* Header */}
            <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  <CheckCircle className="h-6 w-6 text-green-500 mr-2" />
                  <h3 className="text-lg font-medium text-gray-900">
                    {getStatusMessage()}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={handleClose}
                  className="text-gray-400 hover:text-gray-500"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              {/* Task Info */}
              <div className="mb-4 p-3 bg-gray-50 rounded-md">
                <h4 className="font-medium text-gray-900">{task.title}</h4>
                <p className="text-sm text-gray-600 mt-1">{task.description}</p>
              </div>

              {/* Description */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {newStatus === 'cant-complete' ? 'Reason for not completing *' : 'Description *'}
                </label>
                <textarea
                  value={evidenceData.description}
                  onChange={(e) => setEvidenceData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder={
                    newStatus === 'cant-complete' 
                      ? "Explain why you can't complete this task and what assistance you need..."
                      : "Describe what you've completed or your progress..."
                  }
                  rows={3}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              {/* Evidence Type Selection - Hide for can't complete */}
              {newStatus !== 'cant-complete' && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Evidence Type
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {evidenceTypes.map((type) => {
                      const TypeIcon = type.icon;
                      return (
                        <button
                          key={type.value}
                          type="button"
                          onClick={() => handleEvidenceTypeChange(type.value)}
                          className={`p-3 border rounded-md text-left transition-colors ${
                            evidenceData.evidenceType === type.value
                              ? 'border-blue-500 bg-blue-50 text-blue-700'
                              : 'border-gray-300 hover:border-gray-400'
                          }`}
                        >
                          <div className="flex items-center">
                            <TypeIcon className="h-4 w-4 mr-2" />
                            <span className="font-medium">{type.label}</span>
                          </div>
                          <p className="text-xs text-gray-500 mt-1">{type.description}</p>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* File Upload Section - Hide for can't complete */}
              {newStatus !== 'cant-complete' && (evidenceData.evidenceType === 'screenshot' || evidenceData.evidenceType === 'video' || evidenceData.evidenceType === 'document') && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Upload {selectedType.label}
                  </label>
                  
                  <div className="border-2 border-dashed border-gray-300 rounded-md p-4">
                    <div className="text-center">
                      <SelectedIcon className="mx-auto h-8 w-8 text-gray-400" />
                      <div className="mt-2">
                        <label htmlFor="file-upload" className="cursor-pointer">
                          <span className="text-blue-600 hover:text-blue-500 font-medium">Upload files</span>
                          <input
                            id="file-upload"
                            name="file-upload"
                            type="file"
                            className="sr-only"
                            accept={selectedType.accept}
                            multiple={selectedType.multiple}
                            onChange={handleFileChange}
                          />
                        </label>
                        <p className="text-xs text-gray-500 mt-1">
                          {selectedType.accept || 'Any file type'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* File Previews */}
                  {evidenceData.files.length > 0 && (
                    <div className="mt-3">
                      <div className="grid grid-cols-2 gap-2">
                        {evidenceData.files.map((file, index) => (
                          <div key={index} className="relative border rounded-md p-2">
                            {evidenceData.evidenceType === 'screenshot' && previewUrls[index] && (
                              <img 
                                src={previewUrls[index]} 
                                alt={`Preview ${index + 1}`}
                                className="w-full h-20 object-cover rounded"
                              />
                            )}
                            <div className="flex items-center justify-between mt-1">
                              <span className="text-xs text-gray-600 truncate">
                                {file.name}
                              </span>
                              <button
                                type="button"
                                onClick={() => handleFileRemove(index)}
                                className="text-red-500 hover:text-red-700"
                              >
                                <X className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* URL Section - Hide for can't complete */}
              {newStatus !== 'cant-complete' && evidenceData.evidenceType === 'url' && (
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-medium text-gray-700">
                      URLs/Links
                    </label>
                    <button
                      type="button"
                      onClick={handleUrlAdd}
                      className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                    >
                      + Add URL
                    </button>
                  </div>
                  
                  {evidenceData.urls.map((url, index) => (
                    <div key={index} className="flex items-center space-x-2 mb-2">
                      <input
                        type="url"
                        value={url}
                        onChange={(e) => handleUrlChange(index, e.target.value)}
                        placeholder="https://example.com"
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                      <button
                        type="button"
                        onClick={() => handleUrlRemove(index)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                  
                  {evidenceData.urls.length === 0 && (
                    <div className="text-center py-4 border border-gray-200 rounded-md">
                      <p className="text-gray-500 text-sm">No URLs added yet</p>
                      <button
                        type="button"
                        onClick={handleUrlAdd}
                        className="mt-2 text-blue-600 hover:text-blue-700 text-sm font-medium"
                      >
                        Add your first URL
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Additional Notes */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {newStatus === 'cant-complete' ? 'What help do you need?' : 'Additional Notes (Optional)'}
                </label>
                <textarea
                  value={evidenceData.notes}
                  onChange={(e) => setEvidenceData(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder={
                    newStatus === 'cant-complete'
                      ? "Describe what specific help or resources you need to complete this task..."
                      : "Any additional information for the manager..."
                  }
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            {/* Footer */}
            <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
              <button
                type="submit"
                disabled={isSubmitting || !evidenceData.description.trim()}
                className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Submitting...
                  </>
                ) : (
                  newStatus === 'accept' ? 'Accept Task' : 
                  newStatus === 'cant-complete' ? "Can't Complete" :
                  'Update Task'
                )}
              </button>
              <button
                type="button"
                onClick={handleClose}
                className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:w-auto sm:text-sm"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default TaskEvidenceModal;