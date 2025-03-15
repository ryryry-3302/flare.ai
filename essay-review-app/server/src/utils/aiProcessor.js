const axios = require('axios');

const AI_API_URL = 'https://api.example.com/ai'; // Replace with actual AI API URL

async function analyzeText(text) {
    try {
        const response = await axios.post(`${AI_API_URL}/analyze`, { text });
        return response.data;
    } catch (error) {
        console.error('Error analyzing text:', error);
        throw new Error('AI analysis failed');
    }
}

async function extractTone(text) {
    try {
        const response = await axios.post(`${AI_API_URL}/tone`, { text });
        return response.data;
    } catch (error) {
        console.error('Error extracting tone:', error);
        throw new Error('Tone extraction failed');
    }
}

async function getCommonMistakes(text) {
    try {
        const response = await axios.post(`${AI_API_URL}/common-mistakes`, { text });
        return response.data;
    } catch (error) {
        console.error('Error getting common mistakes:', error);
        throw new Error('Common mistakes retrieval failed');
    }
}

async function getOverusedWords(text) {
    try {
        const response = await axios.post(`${AI_API_URL}/overused-words`, { text });
        return response.data;
    } catch (error) {
        console.error('Error getting overused words:', error);
        throw new Error('Overused words retrieval failed');
    }
}

module.exports = {
    analyzeText,
    extractTone,
    getCommonMistakes,
    getOverusedWords,
};