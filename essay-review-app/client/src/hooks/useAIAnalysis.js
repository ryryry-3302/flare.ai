import { useState, useEffect } from 'react';
import axios from 'axios';

const useAIAnalysis = (text) => {
    const [analysisResult, setAnalysisResult] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchAnalysis = async () => {
            setLoading(true);
            setError(null);
            try {
                const response = await axios.post('/api/analyze', { text });
                setAnalysisResult(response.data);
            } catch (err) {
                setError(err);
            } finally {
                setLoading(false);
            }
        };

        if (text) {
            fetchAnalysis();
        }
    }, [text]);

    return { analysisResult, loading, error };
};

export default useAIAnalysis;