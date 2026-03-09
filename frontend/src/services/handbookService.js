import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';

const handbookService = {
  /**
   * Get all handbooks (filtered by user role)
   */
  getAll: async (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.department) params.append('department', filters.department);
    if (filters.status) params.append('status', filters.status);
    
    const response = await axios.get(`${API_URL}/api/handbooks?${params}`);
    return response.data;
  },

  /**
   * Get specific handbook by ID
   */
  getById: async (id) => {
    const response = await axios.get(`${API_URL}/api/handbooks/${id}`);
    return response.data;
  },

  /**
   * Get handbook by department
   */
  getByDepartment: async (department) => {
    const response = await axios.get(`${API_URL}/api/handbooks/department/${department}`);
    return response.data;
  },

  /**
   * Create new handbook
   */
  create: async (handbookData) => {
    const response = await axios.post(`${API_URL}/api/handbooks`, handbookData);
    return response.data;
  },

  /**
   * Update handbook
   */
  update: async (id, handbookData) => {
    const response = await axios.put(`${API_URL}/api/handbooks/${id}`, handbookData);
    return response.data;
  },

  /**
   * Submit handbook for approval
   */
  submitForApproval: async (id) => {
    const response = await axios.post(`${API_URL}/api/handbooks/${id}/submit-approval`);
    return response.data;
  },

  /**
   * Approve handbook
   */
  approve: async (id, approvalNotes) => {
    const response = await axios.post(`${API_URL}/api/handbooks/${id}/approve`, {
      approvalNotes
    });
    return response.data;
  },

  /**
   * Publish handbook (triggers RAG sync)
   */
  publish: async (id) => {
    const response = await axios.post(`${API_URL}/api/handbooks/${id}/publish`);
    return response.data;
  },

  /**
   * Get version history
   */
  getVersions: async (id) => {
    const response = await axios.get(`${API_URL}/api/handbooks/${id}/versions`);
    return response.data;
  },

  /**
   * Rollback to specific version
   */
  rollback: async (id, versionNumber) => {
    const response = await axios.post(`${API_URL}/api/handbooks/${id}/rollback/${versionNumber}`);
    return response.data;
  },

  /**
   * Archive handbook
   */
  archive: async (id) => {
    const response = await axios.delete(`${API_URL}/api/handbooks/${id}`);
    return response.data;
  },

  /**
   * Manually sync handbook to RAG
   */
  syncToRAG: async (id) => {
    const response = await axios.post(`${API_URL}/api/handbooks/${id}/sync-rag`);
    return response.data;
  },

  /**
   * Sync all published handbooks to RAG
   */
  syncAllToRAG: async () => {
    const response = await axios.post(`${API_URL}/api/handbooks/sync-all`);
    return response.data;
  }
};

export default handbookService;
