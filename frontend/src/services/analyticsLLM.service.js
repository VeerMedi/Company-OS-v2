import axios from 'axios';

const ANALYTICS_LLM_API = `${import.meta.env.VITE_BACKEND_URL}/api/analytics`;

class AnalyticsLLMService {
  /**
   * Check if Analytics LLM server is running
   */
  async checkHealth() {
    try {
      const response = await axios.get(`${ANALYTICS_LLM_API}/health`, {
        timeout: 15000
      });
      console.log('Analytics LLM Health:', response.data);
      return response.data;
    } catch (error) {
      console.error('Analytics LLM health check failed:', error.message);
      return null;
    }
  }

  /**
   * Get all projects with analytics
   */
  async getProjects() {
    try {
      console.log('Fetching projects from Analytics LLM...');
      const response = await axios.get(`${ANALYTICS_LLM_API}/projects`, {
        timeout: 10000
      });
      console.log('Projects fetched:', response.data.length);
      return response.data;
    } catch (error) {
      console.error('Error fetching projects analytics:', error.message);
      throw error;
    }
  }

  /**
   * Get employee performance reports
   */
  async getEmployees(days = 30) {
    try {
      console.log('Fetching employees from Analytics LLM...');
      const response = await axios.get(`${ANALYTICS_LLM_API}/employees`, {
        params: { days },
        timeout: 10000
      });
      console.log('Employees fetched:', response.data.length);
      return response.data;
    } catch (error) {
      console.error('Error fetching employee analytics:', error.message);
      throw error;
    }
  }

  /**
   * Get complete analytics summary
   */
  async getSummary(category = 'service-delivery') {
    try {
      console.log(`Fetching summary from Analytics LLM for category: ${category}...`);
      const response = await axios.get(`${ANALYTICS_LLM_API}/summary`, {
        params: { category },
        timeout: 45000 // Increased from 15s to 45s
      });
      console.log('Summary fetched:', {
        projects: response.data.projects?.length || 0,
        employees: response.data.employees?.length || 0,
        stats: response.data.summary_stats
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching analytics summary:', error.message);
      if (error.response) {
        console.error('Response error:', error.response.data);
      }
      throw error;
    }
  }

  /**
   * Get LLM-generated insights
   */
   async getInsights(category = 'service-delivery') {
    try {
      console.log(`Fetching AI insights from Analytics LLM for category: ${category}...`);
      const response = await axios.get(`${ANALYTICS_LLM_API}/insights`, {
        params: { category },
        timeout: 120000 // Increased from 60s to 120s for LLM generation
      });
      console.log('Insights fetched:', {
        projects: response.data.metadata?.total_projects || 0,
        employees: response.data.metadata?.total_employees || 0,
        model: response.data.metadata?.model_used
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching LLM insights:', error.message);
      if (error.response) {
        console.error('Response error:', error.response.data);
      }
      throw error;
    }
  }

  /**
   * Refresh cache and get fresh data
   */
  async refreshCache() {
    try {
      console.log('Refreshing Analytics LLM cache...');
      const response = await axios.post(`${ANALYTICS_LLM_API}/refresh`, {}, {
        timeout: 5000
      });
      console.log('Cache refreshed:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error refreshing cache:', error.message);
      throw error;
    }
  }
}

export default new AnalyticsLLMService();
