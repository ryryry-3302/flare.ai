import React from 'react';
import { FaTimes, FaCheck, FaSpellCheck, FaBookOpen, FaChartLine } from 'react-icons/fa';
import { motion } from 'framer-motion';

// For now, we'll use random values
const generateRandomScore = (min = 60, max = 100) => {
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

const MetricsPanel: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  // Mock metrics data
  const metrics = {
    grammar: generateRandomScore(75, 98),
    vocabulary: generateRandomScore(65, 95),
    fluency: generateRandomScore(70, 90),
    coherence: generateRandomScore(60, 95),
    style: generateRandomScore(70, 90),
    overall: generateRandomScore(65, 95)
  };

  // Calculate letter grade
  const getLetterGrade = (score: number) => {
    if (score >= 90) return 'A';
    if (score >= 80) return 'B';
    if (score >= 70) return 'C';
    if (score >= 60) return 'D';
    return 'F';
  };

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
          {/* Overall score - fixed centering */}
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
                  animate={{ strokeDashoffset: `${2 * Math.PI * 40 * (1 - metrics.overall / 100)}` }}
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
                  className="text-4xl font-bold text-slate-800">
                  {metrics.overall}
                </motion.div>
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.8 }}
                  className="text-lg font-bold text-blue-600">
                  {getLetterGrade(metrics.overall)}
                </motion.div>
              </div>
            </div>
          </div>
          
          {/* Individual metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6">
            <MetricBar 
              label="Grammar" 
              score={metrics.grammar} 
              icon={<FaCheck className="w-5 h-5" />} 
              color="green"
            />
            <MetricBar 
              label="Vocabulary" 
              score={metrics.vocabulary} 
              icon={<FaBookOpen className="w-5 h-5" />}
              color="blue" 
            />
            <MetricBar 
              label="Fluency" 
              score={metrics.fluency} 
              icon={<FaChartLine className="w-5 h-5" />}
              color="purple" 
            />
            <MetricBar 
              label="Coherence" 
              score={metrics.coherence} 
              icon={<FaSpellCheck className="w-5 h-5" />}
              color="amber" 
            />
          </div>
          
          {/* Feedback section */}
          <div className="mt-8 p-4 bg-slate-50 rounded-md">
            <h3 className="font-bold mb-2">Improvement Suggestions</h3>
            <ul className="list-disc pl-5 space-y-2 text-sm">
              <li>Try using more varied vocabulary to express your ideas.</li>
              <li>Watch out for run-on sentences in the second paragraph.</li>
              <li>Consider adding more transition phrases between paragraphs.</li>
            </ul>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

interface MetricBarProps {
  label: string;
  score: number;
  icon: React.ReactNode;
  color: 'green' | 'blue' | 'purple' | 'amber';
}

const MetricBar: React.FC<MetricBarProps> = ({ label, score, icon, color }) => {
  const colorClasses = {
    green: 'bg-green-500',
    blue: 'bg-blue-500',
    purple: 'bg-purple-500',
    amber: 'bg-amber-500'
  };

  return (
    <div className="flex flex-col">
      <div className="flex items-center mb-1">
        <div className={`p-1.5 rounded-full ${colorClasses[color]} text-white mr-2`}>
          {icon}
        </div>
        <div className="font-medium">{label}</div>
        <div className="ml-auto font-bold">{score}%</div>
      </div>
      <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden">
        <div 
          className={`h-full ${colorClasses[color]}`} 
          style={{ width: `${score}%`, transition: 'width 1s ease-in-out' }} 
        />
      </div>
    </div>
  );
};

export default MetricsPanel;