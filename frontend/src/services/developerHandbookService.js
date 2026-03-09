import axios from 'axios';

// Use relative URL to leverage Vite proxy configuration
// Vite will proxy /api/analytics/* to http://localhost:5002
const API_BASE_URL = '';

const developerHandbookService = {
    /**
     * Query the developer handbook RAG system
     * @param {string} question - The developer's question
     * @param {Array} conversationHistory - Previous conversation turns
     * @returns {Promise} Response with answer and sources
     */
    async query(question, conversationHistory = []) {
        console.log('🔵 [RAG Service] Query called with:', { question, conversationHistory });
        console.log('🔵 [RAG Service] API URL:', `${API_BASE_URL}/api/analytics/rag/query`);
        
        try {
            // Using the correct RAG query endpoint
            const requestData = {
                question,
                conversation_history: conversationHistory
            };
            
            console.log('🔵 [RAG Service] Sending request with data:', requestData);
            
            const response = await axios.post(`${API_BASE_URL}/api/analytics/rag/query`, requestData);
            
            console.log('✅ [RAG Service] Response received:', response.data);
            return response.data;
        } catch (error) {
            console.error('❌ [RAG Service] Error querying developer handbook:', error);
            console.error('❌ [RAG Service] Error details:', {
                message: error.message,
                response: error.response?.data,
                status: error.response?.status
            });
            throw error;
        }
    },

    /**
     * Sync handbook data to vector database
     * @param {boolean} reset - Whether to reset existing data
     * @returns {Promise} Sync status
     */
    async syncHandbook(reset = false) {
        try {
            // Using the correct RAG sync endpoint
            const response = await axios.post(`${API_BASE_URL}/api/analytics/rag/sync`, {
                reset
            });
            return response.data;
        } catch (error) {
            console.error('Error syncing handbook:', error);
            throw error;
        }
    },

    /**
     * Check health of developer handbook API
     * @returns {Promise} Health status
     */
    async healthCheck() {
        console.log('🔵 [RAG Service] Health check called');
        console.log('🔵 [RAG Service] Health URL:', `${API_BASE_URL}/api/analytics/rag/health`);
        
        try {
            // Using the correct RAG health endpoint
            const response = await axios.get(`${API_BASE_URL}/api/analytics/rag/health`, {
                timeout: 3000 // 3 second timeout
            });
            
            console.log('✅ [RAG Service] Health check response:', response.data);
            return response.data;
        } catch (error) {
            console.error('❌ [RAG Service] Health check failed:', error);
            console.error('❌ [RAG Service] Error details:', {
                message: error.message,
                code: error.code
            });
            return { status: 'unavailable' };
        }
    },

    /**
     * Get vector database statistics
     * @returns {Promise} Database stats
     */
    async getStats() {
        try {
            // Using the RAG health endpoint which includes vector database stats
            const response = await axios.get(`${API_BASE_URL}/api/analytics/rag/health`);
            return response.data.vector_database || {};
        } catch (error) {
            console.error('Error getting RAG stats:', error);
            throw error;
        }
    }
};

export default developerHandbookService;
