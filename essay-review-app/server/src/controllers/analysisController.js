const express = require('express');
const router = express.Router();
const grammarService = require('../services/grammarService');
const styleAnalysisService = require('../services/styleAnalysisService');
const scoreCalculationService = require('../services/scoreCalculationService');
const translationService = require('../services/translationService');
const voiceService = require('../services/voiceService');

// Analyze essay text
router.post('/analyze', async (req, res) => {
    const { text, userAge, writingGrade } = req.body;

    try {
        const grammarErrors = await grammarService.extractErrors(text);
        const styleAnalysis = await styleAnalysisService.analyzeStyle(text);
        const metrics = await scoreCalculationService.calculateMetrics(text, userAge, writingGrade);
        const translation = await translationService.translateText(text);
        const voiceAnalysis = await voiceService.analyzeVoice(text);

        res.json({
            grammarErrors,
            styleAnalysis,
            metrics,
            translation,
            voiceAnalysis
        });
    } catch (error) {
        res.status(500).json({ message: 'Error analyzing essay', error: error.message });
    }
});

module.exports = router;