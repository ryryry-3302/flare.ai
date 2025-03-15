import React, { useEffect } from 'react';
import { FaBookOpen, FaCheck, FaQuoteRight, FaChartLine } from 'react-icons/fa';
import { motion } from 'framer-motion';

// Mock data - replace with real analysis later
interface RandomData {
  length: number;
  min: number;
  max: number;
}

const getRandomData = (length: number, min: number, max: number): number[] => {
  return Array.from({ length }, (): number => Math.floor(Math.random() * (max - min + 1)) + min);
};

interface EditorStatsProps {
  wordCount: number;
}

const EditorStats: React.FC<EditorStatsProps> = ({ wordCount }) => {
  // Mock data for visualizations
  const wordLengthDistribution = getRandomData(10, 1, 10);
  const mostFrequentWords = [
    { word: 'the', count: 12 },
    { word: 'is', count: 8 },
    { word: 'essay', count: 6 },
    { word: 'writing', count: 5 },
    { word: 'important', count: 4 },
  ];

  // Calculate stats
  const sentenceCount = Math.max(1, Math.floor(wordCount / 15)); // Approximate
  const paragraphCount = Math.max(1, Math.floor(wordCount / 50)); // Approximate
  const readingLevel = ['Elementary', 'Middle School', 'High School', 'College', 'Graduate'][
    Math.min(4, Math.floor(wordCount / 100))
  ];

  return (
    <motion.div 
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 50 }}
      className="h-full flex flex-col"
    >
      <h3 className="text-lg font-semibold mb-4 text-slate-800">Live Essay Insights</h3>
      
      {/* Key stats */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="bg-white p-3 rounded-md shadow-sm"
        >
          <div className="text-xs text-slate-500 uppercase font-semibold">Words</div>
          <div className="text-2xl font-bold">{wordCount}</div>
        </motion.div>
        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="bg-white p-3 rounded-md shadow-sm"
        >
          <div className="text-xs text-slate-500 uppercase font-semibold">Sentences</div>
          <div className="text-2xl font-bold">{sentenceCount}</div>
        </motion.div>
        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="bg-white p-3 rounded-md shadow-sm"
        >
          <div className="text-xs text-slate-500 uppercase font-semibold">Paragraphs</div>
          <div className="text-2xl font-bold">{paragraphCount}</div>
        </motion.div>
        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="bg-white p-3 rounded-md shadow-sm"
        >
          <div className="text-xs text-slate-500 uppercase font-semibold">Reading Level</div>
          <div className="text-lg font-bold">{readingLevel}</div>
        </motion.div>
      </div>
      
      {/* Word length distribution */}
      <motion.div 
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="bg-white p-3 rounded-md shadow-sm mb-4"
      >
        <div className="flex items-center gap-2 mb-2">
          <FaChartLine className="text-blue-500" />
          <h4 className="font-semibold">Word Length Distribution</h4>
        </div>
        <div className="flex items-end h-32 gap-1">
          {wordLengthDistribution.map((value, index) => (
            <div 
              key={index} 
              className="bg-blue-500 rounded-t w-full"
              style={{ height: `${(value / 10) * 100}%` }}
            />
          ))}
        </div>
        <div className="flex justify-between text-xs text-slate-500 mt-1">
          <span>1</span>
          <span>5</span>
          <span>10</span>
        </div>
      </motion.div>
      
      {/* Most frequent words */}
      <motion.div 
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.6 }}
        className="bg-white p-3 rounded-md shadow-sm"
      >
        <div className="flex items-center gap-2 mb-2">
          <FaBookOpen className="text-green-500" />
          <h4 className="font-semibold">Most Used Words</h4>
        </div>
        <ul className="space-y-1">
          {mostFrequentWords.map((item, index) => (
            <li key={index} className="flex justify-between items-center">
              <span className="font-medium">{item.word}</span>
              <div className="flex items-center">
                <div 
                  className="bg-green-100 h-4 mr-2 rounded"
                  style={{ width: `${item.count * 6}px` }} 
                />
                <span className="text-sm text-slate-500">{item.count}</span>
              </div>
            </li>
          ))}
        </ul>
      </motion.div>
    </motion.div>
  );
};

export default EditorStats;