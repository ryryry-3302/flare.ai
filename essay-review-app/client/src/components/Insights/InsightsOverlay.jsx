import React from 'react';
import './InsightsOverlay.css'; // Assuming you have a CSS file for styling

const InsightsOverlay = ({ insights, onClose }) => {
    return (
        <div className="insights-overlay">
            <div className="overlay-content">
                <h2>Insights and Metrics</h2>
                <button className="close-button" onClick={onClose}>Close</button>
                <div className="insights-list">
                    {insights.map((insight, index) => (
                        <div key={index} className="insight-item">
                            <h3>{insight.title}</h3>
                            <p>{insight.description}</p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default InsightsOverlay;