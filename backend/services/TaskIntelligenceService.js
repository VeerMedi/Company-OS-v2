/**
 * Task Intelligence Service
 * Integrates with Python Task Intelligence API for automatic complexity scoring
 */

const axios = require('axios');

const TASK_INTELLIGENCE_API_URL = process.env.TASK_INTELLIGENCE_API_URL || 'http://localhost:8000';

/**
 * Analyze task complexity using AI engine
 * @param {Object} taskData - Task information
 * @param {string} taskData.title - Task title
 * @param {string} taskData.description - Task description
 * @param {string} taskData.phase - Task phase/bunch (e.g., "Backend Development")
 * @param {Array} taskData.dependencies - Array of dependency task IDs
 * @param {string} taskData.position - Position in project ('early', 'mid', 'late')
 * @returns {Promise<Object>} Complexity analysis result
 */
const analyzeTaskComplexity = async (taskData) => {
    try {
        const response = await axios.post(`${TASK_INTELLIGENCE_API_URL}/api/score-task`, {
            title: taskData.title,
            description: taskData.description,
            phase: taskData.phase || 'Backend Development', // Default phase
            dependencies: taskData.dependencies || [],
            position: taskData.position || 'mid'
        }, {
            timeout: 5000 // 5 second timeout
        });

        return {
            success: true,
            data: {
                points: response.data.points,
                complexityScore: response.data.score,
                dimensions: response.data.dimensions,
                explanation: response.data.explanation,
                breakdown: response.data.breakdown
            }
        };
    } catch (error) {
        console.error('Task Intelligence API Error:', error.message);
        
        // Return fallback scoring if API fails
        return {
            success: false,
            error: error.message,
            data: {
                points: calculateFallbackPoints(taskData),
                complexityScore: null,
                dimensions: null,
                explanation: 'Automatic scoring unavailable. Points assigned based on priority.',
                breakdown: null
            }
        };
    }
};

/**
 * Fallback scoring when AI API is unavailable
 * Uses simple priority-based calculation
 */
const calculateFallbackPoints = (taskData) => {
    const priorityPoints = {
        'low': 5,
        'medium': 10,
        'high': 20,
        'urgent': 30
    };
    
    return priorityPoints[taskData.priority] || 10;
};

/**
 * Check if Task Intelligence API is available
 * @returns {Promise<boolean>}
 */
const checkApiHealth = async () => {
    try {
        const response = await axios.get(`${TASK_INTELLIGENCE_API_URL}/api/health`, {
            timeout: 2000
        });
        return response.data.status === 'healthy';
    } catch (error) {
        return false;
    }
};

/**
 * Map task category to phase name for intelligence engine
 */
const mapCategoryToPhase = (taskCategory) => {
    const mapping = {
        'development': 'Backend Development',
        'design': 'Design & UI/UX',
        'testing': 'Testing & QA',
        'devops': 'DevOps & Deployment',
        'sales': 'Sales & Marketing',
        'hr': 'HR & Management',
        'management': 'Management'
    };
    
    return mapping[taskCategory] || 'Backend Development';
};

module.exports = {
    analyzeTaskComplexity,
    checkApiHealth,
    mapCategoryToPhase,
    calculateFallbackPoints
};
