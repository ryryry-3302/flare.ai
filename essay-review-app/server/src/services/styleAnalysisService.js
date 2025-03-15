// essay-review-app/server/src/services/styleAnalysisService.js

const toneDescriptions = {
    formal: "A formal tone is characterized by a professional and serious approach, often used in academic or business writing.",
    informal: "An informal tone is casual and conversational, suitable for personal communication.",
    persuasive: "A persuasive tone aims to convince the reader, often using emotional appeals and strong arguments.",
    descriptive: "A descriptive tone focuses on painting a vivid picture with detailed descriptions, often used in creative writing.",
    narrative: "A narrative tone tells a story, often using a personal voice and engaging the reader's emotions."
};

const analyzeStyle = (text) => {
    // Placeholder for style analysis logic
    // This function should analyze the text and return the detected tone/style
    return {
        tone: "formal", // Example output
        excerpts: [
            { excerpt: "This is an example of formal writing.", reason: "Use of complex vocabulary and structure." }
        ]
    };
};

const getOverusedWords = (text) => {
    // Placeholder for logic to identify overused words
    const words = text.split(/\s+/);
    const wordCount = {};
    words.forEach(word => {
        wordCount[word] = (wordCount[word] || 0) + 1;
    });
    return Object.entries(wordCount).filter(([_, count]) => count > 2); // Example threshold
};

const getSuggestions = (text) => {
    // Placeholder for generating suggestions based on style analysis
    return {
        alternatives: ["use 'utilize' instead of 'use'"],
        commonMistakes: ["Avoid using 'very' too often."],
        furtherReading: ["Read works by authors like XYZ for similar styles."]
    };
};

module.exports = {
    toneDescriptions,
    analyzeStyle,
    getOverusedWords,
    getSuggestions
};