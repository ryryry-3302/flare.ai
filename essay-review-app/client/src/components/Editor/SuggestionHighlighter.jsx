import React from 'react';

const SuggestionHighlighter = ({ suggestions, text }) => {
    const highlightText = (text, suggestions) => {
        let highlightedText = text;
        suggestions.forEach((suggestion) => {
            const { start, end, replacement } = suggestion;
            const originalText = text.substring(start, end);
            const highlighted = `<span class="highlight" title="${replacement}">${originalText}</span>`;
            highlightedText = highlightedText.replace(originalText, highlighted);
        });
        return highlightedText;
    };

    return (
        <div
            className="suggestion-highlighter"
            dangerouslySetInnerHTML={{ __html: highlightText(text, suggestions) }}
        />
    );
};

export default SuggestionHighlighter;