const express = require('express');
const router = express.Router();
const analysisController = require('../controllers/analysisController');

// Route to analyze an essay
router.post('/analyze', analysisController.analyzeEssay);

// Route to get common misunderstandings
router.get('/common-mistakes', analysisController.getCommonMistakes);

// Route to get tone/style analysis
router.post('/tone-analysis', analysisController.analyzeTone);

// Route to get overused words
router.post('/overused-words', analysisController.getOverusedWords);

// Route to get translation
router.post('/translate', analysisController.translateText);

// Route to get voice analysis
router.post('/voice', analysisController.analyzeVoice);

module.exports = router;