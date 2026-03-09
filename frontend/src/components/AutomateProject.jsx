import React, { useState, useEffect } from 'react';
import { Upload, Calendar, Bot, FileText, Clock, CheckCircle, X, AlertCircle, Users } from 'lucide-react';
import { showToast } from '../utils/toast';
import api from '../utils/api';

const AutomateProject = ({ isOpen, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    projectName: '',
    description: '',
    deadline: '',
    pdfFile: null,
    assignedManagerId: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [managers, setManagers] = useState([]);
  const [loadingManagers, setLoadingManagers] = useState(false);

  // Fetch available managers when component opens
  useEffect(() => {
    if (isOpen) {
      fetchManagers();
    }
  }, [isOpen]);

  const fetchManagers = async () => {
    setLoadingManagers(true);
    try {
      const response = await api.get('/projects/managers');
      setManagers(response.data.data || []);
    } catch (error) {
      console.error('Error fetching managers:', error);
      showToast.error('Failed to load managers');
      setManagers([]);
    } finally {
      setLoadingManagers(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFileSelect = (file) => {
    if (file && file.type === 'application/pdf') {
      setFormData(prev => ({
        ...prev,
        pdfFile: file
      }));
      showToast.success('PDF file selected successfully');
    } else {
      showToast.error('Please select a valid PDF file');
    }
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    const files = e.dataTransfer.files;
    if (files && files[0]) {
      handleFileSelect(files[0]);
    }
  };

  const handleFileInput = (e) => {
    const file = e.target.files[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.projectName.trim()) {
      showToast.error('Project name is required');
      return;
    }
    
    if (!formData.description.trim()) {
      showToast.error('Project description is required');
      return;
    }
    
    if (!formData.deadline) {
      showToast.error('Project deadline is required');
      return;
    }

    if (!formData.assignedManagerId) {
      showToast.error('Please select a manager for the project');
      return;
    }
    
    if (!formData.pdfFile) {
      showToast.error('PDF file is required');
      return;
    }

    setIsSubmitting(true);
    
    try {
      // Create FormData for file upload
      const uploadData = new FormData();
      uploadData.append('projectName', formData.projectName);
      uploadData.append('description', formData.description);
      uploadData.append('deadline', formData.deadline);
      uploadData.append('assignedManagerId', formData.assignedManagerId);
      uploadData.append('pdfFile', formData.pdfFile);

      // Call backend endpoint that will handle n8n integration
      const response = await api.post('/projects/automate', uploadData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      const assignedManager = response.data.data?.assignedManager;
      const managerName = assignedManager ? assignedManager.name : 'the assigned manager';
      
      showToast.success(`Project automation started! Project assigned to ${managerName}. Tasks will be available for assignment shortly.`);
      
      // Reset form
      setFormData({
        projectName: '',
        description: '',
        deadline: '',
        pdfFile: null,
        assignedManagerId: ''
      });
      
      if (onSuccess) {
        onSuccess(response.data);
      }
      
      onClose();
      
    } catch (error) {
      console.error('Automation error:', error);
      showToast.error(error.response?.data?.message || 'Failed to start project automation');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity" aria-hidden="true">
          <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
        </div>

        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full">
          <form onSubmit={handleSubmit}>
            <div className="bg-white px-6 pt-6 pb-4">
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-3">
                  <div className="flex-shrink-0 w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Bot className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">Automate Project Creation</h3>
                    <p className="text-sm text-gray-500">AI-powered task breakdown from project description</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Form Fields */}
              <div className="space-y-6">
                {/* Project Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Project Name
                  </label>
                  <input
                    type="text"
                    name="projectName"
                    value={formData.projectName}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter project name"
                    required
                  />
                </div>

                {/* Project Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Project Description
                  </label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Brief description of the project"
                    required
                  />
                </div>

                {/* Assigned Manager */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Assign Manager
                  </label>
                  <div className="relative">
                    <select
                      name="assignedManagerId"
                      value={formData.assignedManagerId}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none"
                      required
                      disabled={loadingManagers}
                    >
                      <option value="">
                        {loadingManagers ? 'Loading managers...' : 'Select a manager'}
                      </option>
                      {managers.map((manager) => (
                        <option key={manager._id} value={manager._id}>
                          {manager.firstName} {manager.lastName} ({manager.employeeId})
                        </option>
                      ))}
                    </select>
                    <Users className="absolute right-3 top-2.5 h-5 w-5 text-gray-400 pointer-events-none" />
                  </div>
                  {managers.length === 0 && !loadingManagers && (
                    <p className="text-sm text-amber-600 mt-1">
                      No available managers found. Please contact an administrator.
                    </p>
                  )}
                </div>

                {/* Deadline */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Project Deadline
                  </label>
                  <div className="relative">
                    <input
                      type="date"
                      name="deadline"
                      value={formData.deadline}
                      onChange={handleInputChange}
                      min={new Date().toISOString().split('T')[0]}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                    <Calendar className="absolute right-3 top-2.5 h-5 w-5 text-gray-400 pointer-events-none" />
                  </div>
                </div>

                {/* PDF Upload */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Project Documentation (PDF)
                  </label>
                  <div
                    className={`relative border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                      dragActive 
                        ? 'border-blue-400 bg-blue-50' 
                        : formData.pdfFile
                        ? 'border-green-400 bg-green-50'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}
                  >
                    <input
                      type="file"
                      accept=".pdf"
                      onChange={handleFileInput}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                    
                    {formData.pdfFile ? (
                      <div className="flex items-center justify-center space-x-3">
                        <CheckCircle className="w-8 h-8 text-green-500" />
                        <div>
                          <p className="text-sm font-medium text-green-800">{formData.pdfFile.name}</p>
                          <p className="text-xs text-green-600">{formatFileSize(formData.pdfFile.size)}</p>
                        </div>
                      </div>
                    ) : (
                      <div>
                        <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                        <div className="text-sm text-gray-600">
                          <span className="font-medium text-blue-600 hover:text-blue-500">Click to upload</span> or drag and drop
                        </div>
                        <p className="text-xs text-gray-500 mt-1">PDF files only (max 10MB)</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Info Box */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-start space-x-3">
                    <AlertCircle className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" />
                    <div className="text-sm text-blue-800">
                      <p className="font-medium mb-1">How it works:</p>
                      <ul className="list-disc list-inside space-y-1 text-xs">
                        <li>AI analyzes your PDF and project description</li>
                        <li>Generates detailed tasks with deadlines</li>
                        <li>Tasks are sent to assigned managers for review</li>
                        <li>Managers can then assign tasks to individuals</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Processing Time Notice */}
            <div className="px-6 py-2 bg-yellow-50 border-t border-yellow-200">
              <div className="flex items-center text-sm text-yellow-800">
                <Clock className="w-4 h-4 mr-2 flex-shrink-0" />
                <span>PDF processing typically takes 2-3 minutes. Please be patient while AI analyzes your document.</span>
              </div>
            </div>

            {/* Footer */}
            <div className="bg-gray-50 px-6 py-4 sm:flex sm:flex-row-reverse">
              <button
                type="submit"
                disabled={isSubmitting || !formData.projectName || !formData.description || !formData.deadline || !formData.pdfFile}
                className="w-full inline-flex justify-center items-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Processing PDF & Generating Tasks...
                  </>
                ) : (
                  <>
                    <Bot className="w-4 h-4 mr-2" />
                    Start Automation
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
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

export default AutomateProject;