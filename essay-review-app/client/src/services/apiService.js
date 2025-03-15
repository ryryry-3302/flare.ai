import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000';

const apiService = {
    analyzeEssay: async (essayText) => {
        try {
            const response = await axios.post(`${API_BASE_URL}/api/analyze`, { text: essayText });
            return response.data;
        } catch (error) {
            console.error('Error analyzing essay:', error);
            throw error;
        }
    },

    getUserInsights: async (userId) => {
        try {
            const response = await axios.get(`${API_BASE_URL}/api/users/${userId}/insights`);
            return response.data;
        } catch (error) {
            console.error('Error fetching user insights:', error);
            throw error;
        }
    },

    submitEssay: async (userId, essayData) => {
        try {
            const response = await axios.post(`${API_BASE_URL}/api/users/${userId}/essays`, essayData);
            return response.data;
        } catch (error) {
            console.error('Error submitting essay:', error);
            throw error;
        }
    },

    getCommonMistakes: async () => {
        try {
            const response = await axios.get(`${API_BASE_URL}/api/mistakes`);
            return response.data;
        } catch (error) {
            console.error('Error fetching common mistakes:', error);
            throw error;
        }
    },

    getTranslation: async (text, targetLanguage) => {
        try {
            const response = await axios.post(`${API_BASE_URL}/api/translate`, { text, targetLanguage });
            return response.data;
        } catch (error) {
            console.error('Error fetching translation:', error);
            throw error;
        }
    },

    getVoiceOptions: async () => {
        try {
            const response = await axios.get(`${API_BASE_URL}/api/voice-options`);
            return response.data;
        } catch (error) {
            console.error('Error fetching voice options:', error);
            throw error;
        }
    }
};

export default apiService;