// scoreCalculationService.js

class ScoreCalculationService {
    constructor() {
        this.metrics = {
            grammar: 0,
            style: 0,
            tone: 0,
            overallScore: 0,
        };
    }

    calculateGrammarScore(errors) {
        const totalErrors = errors.length;
        this.metrics.grammar = Math.max(0, 100 - totalErrors * 2); // Example scoring logic
    }

    calculateStyleScore(styleAnalysis) {
        // Example scoring logic based on style analysis
        this.metrics.style = styleAnalysis.score;
    }

    calculateToneScore(toneAnalysis) {
        // Example scoring logic based on tone analysis
        this.metrics.tone = toneAnalysis.score;
    }

    calculateOverallScore() {
        const totalScore = this.metrics.grammar + this.metrics.style + this.metrics.tone;
        this.metrics.overallScore = totalScore / 3; // Average score
    }

    getMetrics() {
        return this.metrics;
    }

    resetMetrics() {
        this.metrics = {
            grammar: 0,
            style: 0,
            tone: 0,
            overallScore: 0,
        };
    }
}

module.exports = new ScoreCalculationService();