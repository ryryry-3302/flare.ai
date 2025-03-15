// This file contains functions for generating rubrics based on provided resources.

const generateRubric = (criteria) => {
    const rubric = {
        criteria: [],
        overallScore: 0,
    };

    criteria.forEach((criterion) => {
        rubric.criteria.push({
            description: criterion.description,
            score: criterion.score,
            feedback: criterion.feedback,
        });
    });

    rubric.overallScore = calculateOverallScore(rubric.criteria);
    return rubric;
};

const calculateOverallScore = (criteria) => {
    const totalScore = criteria.reduce((acc, criterion) => acc + criterion.score, 0);
    return totalScore / criteria.length;
};

const createFeedback = (rubric) => {
    return rubric.criteria.map((criterion) => {
        return `${criterion.description}: ${criterion.feedback}`;
    }).join('\n');
};

module.exports = {
    generateRubric,
    createFeedback,
};