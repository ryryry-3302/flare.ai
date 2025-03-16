import React, { useState, useEffect, useRef } from 'react';
import { Editor } from '@tiptap/react';
import { FaTimes, FaSpinner, FaFileAlt, FaSync } from 'react-icons/fa';
import { motion } from 'framer-motion';
import { generateReport } from '../utils/reportGenerator';
import * as Tooltip from '@radix-ui/react-tooltip';

interface MetricsPanelProps {
  onClose: () => void;
  regenerateKey?: number;
  editor: Editor | null;
  initialAnalysis?: RubricScore[]; // Add this
  onAnalysisComplete?: (analysis: RubricScore[]) => void; // Add this
}

interface Comment {
  comment: string;
  start_index: number;
  end_index: number;
}

interface RubricScore {
  category: string;
  score: number;
  explanation: string[];
  comments: Comment[];
}

const categoryColors: Record<string, string> = {
  "Content (Ideas and Development)": "bg-blue-100 border-blue-500",
  "Structure (Organization)": "bg-green-100 border-green-500",
  "Stance (Voice and Tone)": "bg-purple-100 border-purple-500",
  "Word Choice (Diction)": "bg-yellow-100 border-yellow-500",
  "Sentence Fluency": "bg-indigo-100 border-indigo-500",
  "Conventions": "bg-red-100 border-red-500",
};

const getScoreColor = (score: number): string => {
  if (score >= 4.5) return 'text-green-600';
  if (score >= 3.5) return 'text-blue-600';
  if (score >= 2.5) return 'text-yellow-600';
  return 'text-red-600';
};

// Update the ScoreBar component

const ScoreBar: React.FC<{ score: number; maxScore: number }> = ({ score, maxScore }) => {
  const percentage = (score / maxScore) * 100;
  const barColor = getScoreColor(score).replace('text-', 'bg-');
  
  return (
    <div className="w-full bg-gray-200 rounded-full h-2.5 my-2">
      <div 
        className={`${barColor} h-2.5 rounded-full transition-all duration-500 ease-out`}
        style={{ width: `${percentage}%` }}
      />
    </div>
  );
};

const MetricsPanel: React.FC<MetricsPanelProps> = ({ 
  onClose, 
  regenerateKey = 0, 
  editor,
  initialAnalysis = [],
  onAnalysisComplete
}) => {
  const [isLoading, setIsLoading] = useState(initialAnalysis.length === 0);
  const [error, setError] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<RubricScore[]>(initialAnalysis);
  const [wordCount, setWordCount] = useState(0);
  const [isRegenerating, setIsRegenerating] = useState(false);

  const essayTextRef = useRef<string>('');

  useEffect(() => {
    if (editor) {
      try {
        // Capture the text immediately to avoid timing issues
        const rawText = editor.getText();
        const html = editor.getHTML();
        
        console.log("Editor state:", { 
          rawTextLength: rawText?.length,
          htmlLength: html?.length,
          isEmpty: editor.isEmpty
        });
        
        // Try multiple methods to get content
        if (rawText && rawText.trim().length > 0) {
          essayTextRef.current = rawText;
        } else if (html && html !== '<p></p>') {
          // If getText() returns empty but HTML exists, use a simplified version of HTML
          const tempDiv = document.createElement('div');
          tempDiv.innerHTML = html;
          essayTextRef.current = tempDiv.textContent || '';
        } else {
          // If both methods fail, check if we can get content directly from the editor state
          const docContent = editor.state.doc.textContent;
          essayTextRef.current = docContent || '';
        }
        
        console.log("Captured essay text, length:", essayTextRef.current.length);
        
        // If we still have no text, set an error
        if (!essayTextRef.current || essayTextRef.current.trim().length === 0) {
          console.warn("No content could be extracted from the editor");
          setError("No essay content to analyze. Please add some text to your essay first.");
          setIsLoading(false);
        }
      } catch (err) {
        console.error("Error capturing essay text:", err);
        setError("Failed to get essay text from editor");
        setIsLoading(false);
      }
    } else {
      console.error("Editor is null on initial render");
      setError("Editor not available");
      setIsLoading(false);
    }
  }, [editor]);

  useEffect(() => {
    const analyzeEssay = async () => {
      if (!essayTextRef.current || essayTextRef.current.trim().length === 0) {
        return;
      }
  
      setIsLoading(true);
      setError(null);
  
      try {
        console.log("Sending essay for analysis...");
        const response = await fetch('http://localhost:5000/api/analyze-essay', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            essay: essayTextRef.current
          }),
        });
  
        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Analysis failed: ${errorText}`);
        }
  
        const data = await response.json();
        console.log("Received analysis:", data);
        
        if (data.success && data.analysis) {
          // Update word count
          setWordCount(essayTextRef.current.split(/\s+/).filter(Boolean).length);
          
          // Update analysis and notify parent
          updateAnalysis(data.analysis);
          
          console.log("Analysis complete, sending to parent:", data.analysis);
        } else {
          throw new Error(data.error || 'Failed to analyze essay');
        }
      } catch (err) {
        console.error('Error analyzing essay:', err);
        setError(err instanceof Error ? err.message : String(err));
      } finally {
        setIsLoading(false);
      }
    };
  
    // Only analyze if we're regenerating OR if we have no existing analysis
    if (isRegenerating || (analysis.length === 0 && !error)) {
      analyzeEssay();
      setIsRegenerating(false);
    }
  }, [regenerateKey, isRegenerating]); // Only run when regenerateKey or isRegenerating changes

  const handleRegenerate = () => {
    setIsRegenerating(true);
  };

  // Update the analysis setter to also call onAnalysisComplete
  const updateAnalysis = (newAnalysis: RubricScore[]) => {
    setAnalysis(newAnalysis);
    onAnalysisComplete?.(newAnalysis);
  };

  // Add handleDownloadReport function inside MetricsPanel component
  const handleDownloadReport = () => {
    if (!editor || !analysis.length) return;
    
    generateReport({
      essayContent: editor.getHTML(),
      comments: [], // Add your comments if available
      wordCount,
      analysis: analysis // Pass the current analysis data
    });
  };

  return (
    <motion.div className="fixed inset-0 bg-black bg-opacity-50 flex items-start justify-center z-50 overflow-y-auto py-8">
      <motion.div className="bg-white rounded-lg shadow-xl w-full max-w-3xl mx-4 overflow-hidden">
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="text-xl font-bold text-slate-800">Essay Analysis</h2>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-100">
            <FaTimes className="w-5 h-5 text-slate-600" />
          </button>
        </div>
        <div className="p-6 max-h-[80vh] overflow-y-auto">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center min-h-[400px]">
              <FaSpinner className="w-12 h-12 text-blue-500 animate-spin mb-4" />
              <p className="text-gray-600 text-lg">Analyzing your essay...</p>
            </div>
          ) : error ? (
            <div className="bg-red-50 border border-red-200 rounded-md p-4 text-red-700">{error}</div>
          ) : (
            <>
              <div className="mb-6 text-right">
                <span className="text-sm text-gray-500">Word Count: {wordCount}</span>
              </div>
              <div className="mb-8">
                {/* Overall Score Card */}
                <div className="bg-gradient-to-br from-blue-50 to-white rounded-xl p-8 shadow-lg mb-8 border border-blue-100">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h3 className="text-2xl font-bold text-gray-800">Overall Score</h3>
                      <p className="text-sm text-gray-500 mt-1">Based on {analysis.length} scoring categories</p>
                    </div>
                    <div className="text-right">
                      <div className="text-5xl font-bold text-blue-600">
                        {(analysis.reduce((sum, item) => sum + item.score, 0) / analysis.length).toFixed(1)}
                        <span className="text-xl text-gray-400 ml-1">/5</span>
                      </div>
                      <p className="text-sm text-gray-500 mt-1">
                        {wordCount} words analyzed
                      </p>
                    </div>
                  </div>
                  
                  <div className="relative">
                    <ScoreBar 
                      score={analysis.reduce((sum, item) => sum + item.score, 0) / analysis.length}
                      maxScore={5}
                    />
                    <div className="flex justify-between text-xs text-gray-500 mt-2">
                      <span>Poor</span>
                      <span>Fair</span>
                      <span>Good</span>
                      <span>Excellent</span>
                    </div>
                  </div>

                </div>

                {/* Individual Score Cards */}
                <div className="space-y-4">
                  {analysis.map((rubric, index) => (
                    <Tooltip.Provider delayDuration={0} key={index}>
                      <Tooltip.Root>
                        <div className={`bg-white rounded-lg p-4 shadow-sm border-l-4 ${categoryColors[rubric.category]}`}>
                          <div className="flex justify-between items-center mb-2">
                            <h3 className="font-semibold text-gray-800">{rubric.category}</h3>
                            <span className={`text-lg font-bold ${getScoreColor(rubric.score)}`}>
                              {rubric.score}/5
                            </span>
                          </div>
                          <ScoreBar score={rubric.score} maxScore={5} />
                          
                          {/* Explanation Summary */}
                          <p className="text-sm text-gray-600 mt-2 line-clamp-2">
                            {rubric.explanation[0]}
                          </p>
                          
                          <Tooltip.Trigger asChild>
                            <button 
                              className="mt-2 text-sm text-blue-600 hover:text-blue-700 hover:underline focus:outline-none"
                            >
                              View Full Details
                            </button>
                          </Tooltip.Trigger>
                          
                          <Tooltip.Portal>
                            <Tooltip.Content
                              className="bg-white p-4 rounded-lg shadow-lg border border-gray-200 max-w-sm z-50"
                              sideOffset={5}
                              collisionPadding={20}
                              sticky="always"
                              side="right"
                            >
                              <div className="space-y-2">
                                <h4 className="font-semibold text-gray-800 mb-2">Detailed Feedback</h4>
                                {rubric.explanation.map((exp, i) => (
                                  <p key={i} className="text-sm text-gray-600 mb-2">{exp}</p>
                                ))}
                                {rubric.comments.length > 0 && (
                                  <div className="mt-3 pt-3 border-t border-gray-200">
                                    <p className="font-medium text-sm text-gray-700 mb-2">Specific Comments:</p>
                                    <ul className="list-disc pl-4">
                                      {rubric.comments.map((comment, i) => (
                                        <li key={i} className="text-sm text-gray-600 mb-1">
                                          {comment.comment}
                                        </li>
                                      ))}
                                    </ul>
                                  </div>
                                )}
                              </div>
                              <Tooltip.Arrow className="fill-white" />
                            </Tooltip.Content>
                          </Tooltip.Portal>
                        </div>
                      </Tooltip.Root>
                    </Tooltip.Provider>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
        {!isLoading && !error && (
          <div className="p-4 border-t bg-gray-50 flex justify-between items-center">
            <div className="text-sm text-gray-500">
              Last analyzed: {new Date().toLocaleTimeString()}
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleDownloadReport}
                className="flex items-center gap-1 px-3 py-1 bg-green-600 text-white text-sm font-medium rounded hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={isLoading || !analysis.length}
              >
                <FaFileAlt className="w-4 h-4" />
                Generate Report
              </button>
              {!isLoading && (
                <button
                  onClick={handleRegenerate}
                  disabled={isRegenerating}
                  className="flex items-center gap-1 px-3 py-1 bg-blue-600 text-white text-sm font-medium rounded hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <FaSync className={`w-4 h-4 ${isRegenerating ? 'animate-spin' : ''}`} />
                  {isRegenerating ? 'Regenerating...' : 'Regenerate'}
                </button>
              )}
              <button 
                onClick={onClose}
                className="flex items-center gap-1 px-3 py-1 border border-gray-300 text-gray-700 text-sm font-medium rounded hover:bg-gray-100 transition-colors"
              >
                <FaTimes className="w-4 h-4" />
                Close
              </button>
            </div>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
};

export default MetricsPanel;
