import React, { createContext, useState, useContext } from 'react';

const EditorContext = createContext();

export const EditorProvider = ({ children }) => {
    const [editorContent, setEditorContent] = useState('');
    const [suggestions, setSuggestions] = useState([]);
    const [metrics, setMetrics] = useState({});
    const [score, setScore] = useState(0);

    const updateContent = (content) => {
        setEditorContent(content);
    };

    const updateSuggestions = (newSuggestions) => {
        setSuggestions(newSuggestions);
    };

    const updateMetrics = (newMetrics) => {
        setMetrics(newMetrics);
    };

    const updateScore = (newScore) => {
        setScore(newScore);
    };

    return (
        <EditorContext.Provider
            value={{
                editorContent,
                suggestions,
                metrics,
                score,
                updateContent,
                updateSuggestions,
                updateMetrics,
                updateScore,
            }}
        >
            {children}
        </EditorContext.Provider>
    );
};

export const useEditorContext = () => {
    return useContext(EditorContext);
};