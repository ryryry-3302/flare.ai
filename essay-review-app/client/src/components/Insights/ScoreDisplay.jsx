import React from 'react';

const ScoreDisplay = ({ score, maxScore }) => {
    const percentage = ((score / maxScore) * 100).toFixed(2);

    return (
        <div className="score-display">
            <h2>Your Essay Score</h2>
            <p className="score">{score} / {maxScore}</p>
            <p className="percentage">{percentage}%</p>
            <div className="score-bar">
                <div 
                    className="score-fill" 
                    style={{ width: `${percentage}%` }} 
                />
            </div>
        </div>
    );
};

export default ScoreDisplay;