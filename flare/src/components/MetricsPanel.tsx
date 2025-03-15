import React, { useState } from 'react';
import { FaTimes, FaCheck, FaBookOpen, FaChartLine, FaPen, FaSortAmountUp, FaVolumeUp } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';

// Define rubric levels
const rubricLevels = {
  1: { name: "Beginning", color: "#ef4444" },      // red-500
  2: { name: "Developing", color: "#f97316" },     // orange-500
  3: { name: "Proficient", color: "#eab308" },     // yellow-500
  4: { name: "Advanced", color: "#22c55e" },       // green-500
  5: { name: "Exceptional", color: "#3b82f6" },    // blue-500
};

// Detailed descriptions for each rubric category at each level
const rubricDescriptions = {
  ideas: {
    1: "Limited development of ideas; lacks clarity and focus.",
    2: "Basic ideas present but underdeveloped; limited support.",
    3: "Clear main idea with adequate supporting details.",
    4: "Well-developed ideas with strong supporting evidence.",
    5: "Exceptional depth of ideas with compelling, relevant support."
  },
  organization: {
    1: "Difficult to follow; lacks structure and transitions.",
    2: "Attempted organization with weak transitions.",
    3: "Clear structure with basic transitions between ideas.",
    4: "Strong organization with effective transitions.",
    5: "Masterful organization enhances the essay's impact."
  },
  voice: {
    1: "Voice is flat or inappropriate for the purpose.",
    2: "Inconsistent or developing voice.",
    3: "Clear, appropriate voice for the topic.",
    4: "Engaging voice that enhances the writing.",
    5: "Distinctive, compelling voice perfectly suited to purpose."
  },
  wordChoice: {
    1: "Limited vocabulary with frequent errors.",
    2: "Basic vocabulary with occasional misuse.",
    3: "Appropriate word choice with some variety.",
    4: "Precise, varied vocabulary enhances meaning.",
    5: "Rich, nuanced vocabulary with masterful precision."
  },
  sentenceFluency: {
    1: "Choppy, awkward sentences disrupt reading.",
    2: "Simple sentences with limited variety.",
    3: "Clear sentences with some variety in structure.",
    4: "Varied sentence structure enhances flow and meaning.",
    5: "Artful sentence construction creates fluid, engaging reading."
  },
  conventions: {
    1: "Frequent errors in grammar, punctuation, and spelling.",
    2: "Several errors that occasionally distract the reader.",
    3: "Few errors that don't interfere with meaning.",
    4: "Strong command of conventions with minimal errors.",
    5: "Nearly flawless mechanics strengthen the writing."
  }
};

// Generate random score for each category
const generateRubricScore = () => Math.floor(Math.random() * 5) + 1; // 1-5

// Helper to create initial random scores only once
const createInitialScores = () => ({
  ideas: generateRubricScore(),
  organization: generateRubricScore(),
  wordChoice: generateRubricScore(),
  sentenceFluency: generateRubricScore(),
  voice: generateRubricScore(),
  conventions: generateRubricScore(),
});

const MetricsPanel: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  // Generate random scores only once when this component mounts (i.e. when user clicks the panel button)
  const [rubricScores] = useState(createInitialScores);

  // Track which category has an active tooltip
  const [activeTooltip, setActiveTooltip] = useState<string | null>(null);

  // Calculate overall score (1-5 scale)
  const overallScore = 
    Object.values(rubricScores).reduce((sum, score) => sum + score, 0) / 
    Object.keys(rubricScores).length;
  
  // Format for display (round to nearest tenth)
  const formattedOverallScore = overallScore.toFixed(1);
  
  // Calculate letter grade
  const getLetterGrade = (score: number) => {
    if (score >= 4.5) return 'A+';
    if (score >= 4.0) return 'A';
    if (score >= 3.7) return 'A-';
    if (score >= 3.3) return 'B+';
    if (score >= 3.0) return 'B';
    if (score >= 2.7) return 'B-';
    if (score >= 2.3) return 'C+';
    if (score >= 2.0) return 'C';
    if (score >= 1.7) return 'C-';
    if (score >= 1.3) return 'D+';
    if (score >= 1.0) return 'D';
    return 'F';
  };

  // Category display names and icons
  const categoryConfig = {
    ideas: { name: "Ideas & Content", icon: <FaPen /> },
    organization: { name: "Organization", icon: <FaSortAmountUp /> },
    voice: { name: "Voice", icon: <FaVolumeUp /> },
    wordChoice: { name: "Word Choice", icon: <FaBookOpen /> },
    sentenceFluency: { name: "Sentence Fluency", icon: <FaChartLine /> },
    conventions: { name: "Conventions", icon: <FaCheck /> }
  };
  
  // Get improvement suggestions based on lowest scores
  const getImprovementSuggestions = () => {
    const entries = Object.entries(rubricScores) as [keyof typeof rubricScores, number][];
    const sortedByScore = [...entries].sort((a, b) => a[1] - b[1]);
    const lowestCategories = sortedByScore.slice(0, 3);
    
    return lowestCategories.map(([category, score]) => {
      const categoryName = categoryConfig[category].name;
      const nextLevel = Math.min(score + 1, 5);
      const improvementText = rubricDescriptions[category as keyof typeof rubricDescriptions][nextLevel as keyof typeof rubricDescriptions[typeof category]];
      
      return {
        category: categoryName,
        suggestion: `To improve ${categoryName}, aim to: ${improvementText}`
      };
    });
  };
  
  const suggestions = getImprovementSuggestions();

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
    >
      <motion.div 
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="bg-white rounded-lg shadow-xl w-full max-w-3xl overflow-hidden"
      >
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="text-xl font-bold text-slate-800">Essay Analysis</h2>
          <button 
            onClick={onClose}
            className="p-2 rounded-full hover:bg-slate-100 transition-colors"
          >
            <FaTimes className="w-5 h-5 text-slate-600" />
          </button>
        </div>
        
        <div className="p-6">
          {/* Overall score */}
          <div className="mb-8 flex items-center justify-center">
            <div className="relative w-40 h-40 flex items-center justify-center">
              <svg className="absolute inset-0" viewBox="0 0 100 100">
                <circle 
                  className="text-slate-200" 
                  strokeWidth="10"
                  stroke="currentColor"
                  fill="transparent"
                  r="40" 
                  cx="50" 
                  cy="50" 
                />
                <motion.circle 
                  initial={{ strokeDashoffset: `${2 * Math.PI * 40}` }}
                  animate={{ strokeDashoffset: `${2 * Math.PI * 40 * (1 - overallScore / 5)}` }}
                  transition={{ duration: 1, ease: "easeOut" }}
                  className="text-blue-600" 
                  strokeWidth="10"
                  stroke="currentColor"
                  fill="transparent"
                  r="40" 
                  cx="50" 
                  cy="50" 
                  strokeDasharray={`${2 * Math.PI * 40}`}
                  strokeLinecap="round"
                  transform="rotate(-90 50 50)"
                />
              </svg>
              <div className="z-10 text-center">
                <motion.div 
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.5, duration: 0.3 }}
                  className="text-4xl font-bold text-slate-800"
                >
                  {formattedOverallScore}
                </motion.div>
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.8 }}
                  className="text-lg font-bold text-blue-600"
                >
                  {getLetterGrade(overallScore)}
                </motion.div>
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 1 }}
                  className="text-sm text-slate-500 mt-1"
                >
                  Average score
                </motion.div>
              </div>
            </div>
          </div>
          
          {/* Rubric scores */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold mb-4">Writing Rubric Scores</h3>
            <div className="space-y-4">
              {Object.entries(rubricScores).map(([category, score], index) => {
                const categoryKey = category as keyof typeof rubricScores;
                const { name, icon } = categoryConfig[categoryKey];
                const scoreKey = score as keyof typeof rubricLevels;
                
                return (
                  <div 
                    key={category} 
                    className="relative"
                    onMouseEnter={() => setActiveTooltip(category)}
                    onMouseLeave={() => setActiveTooltip(null)}
                  >
                    <div className="flex justify-between items-center mb-1">
                      <div className="flex items-center">
                        <div className={`p-1.5 rounded-full bg-slate-200 text-slate-700 mr-2`}>
                          {icon}
                        </div>
                        <div className="font-medium">{name}</div>
                      </div>
                      <div className="flex items-center">
                        <span className="mr-2 font-bold" style={{ color: rubricLevels[scoreKey].color }}>
                          {score}
                        </span>
                        <span className="text-sm text-slate-500">
                          ({rubricLevels[scoreKey].name})
                        </span>
                      </div>
                    </div>
                    
                    {/* Rubric level bar */}
                    <div className="h-2.5 bg-slate-200 rounded-full flex overflow-hidden">
                      {[1, 2, 3, 4, 5].map((level) => (
                        <motion.div
                          key={level}
                          initial={{ scaleX: 0, originX: 0 }}
                          animate={{ scaleX: level <= score ? 1 : 0 }}
                          transition={{ 
                            delay: 0.2 + (index * 0.1) + ((level - 1) * 0.05),
                            duration: 0.3
                          }}
                          className="h-full w-1/5 origin-left"
                          style={{
                            backgroundColor: rubricLevels[level as keyof typeof rubricLevels].color,
                            marginLeft: level > 1 ? '2px' : 0
                          }}
                        />
                      ))}
                    </div>
                    
                    {/* Tooltip */}
                    <AnimatePresence>
                      {activeTooltip === category && (
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 5 }}
                          transition={{ duration: 0.2 }}
                          className="absolute z-10 bg-slate-800 text-white text-sm p-3 rounded-md shadow-lg mt-1 w-full max-w-md"
                        >
                          <div className="font-semibold mb-1">
                            {rubricLevels[scoreKey].name} ({score}/5)
                          </div>
                          <div>
                            {
                              rubricDescriptions[categoryKey][
                                score as keyof typeof rubricDescriptions[typeof categoryKey]
                              ]
                            }
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </div>
          </div>
          
          {/* Feedback section */}
          <div className="mt-8 p-4 bg-slate-50 rounded-md">
            <h3 className="font-bold mb-2">Improvement Suggestions</h3>
            <ul className="list-disc pl-5 space-y-2 text-sm">
              {suggestions.map((item, index) => (
                <li key={index}>{item.suggestion}</li>
              ))}
            </ul>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default MetricsPanel;
