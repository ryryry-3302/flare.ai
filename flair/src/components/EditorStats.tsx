// src/EditorStats.tsx

import React, { useEffect, useState } from 'react';
import { 
  FaBookOpen, 
  FaCheck, 
  FaQuoteRight, 
  FaChartLine,
  FaStopwatch,    // NEW icon for longest sentence
  FaFont,         // NEW icon for longest word
  FaSpinner, 
  FaLightbulb 
} from 'react-icons/fa';
import { motion } from 'framer-motion';
import { Editor } from '@tiptap/react';
import axios from 'axios';

/** Count approximate syllables in a single word (helper) */
function countSyllablesInWord(rawWord: string): number {
  const word = rawWord.toLowerCase().replace(/[^a-z]/g, '');
  if (!word) return 0;

  const vowels = 'aeiou';
  let syllableCount = 0;
  let prevIsVowel = false;

  for (let i = 0; i < word.length; i++) {
    const isVowel = vowels.includes(word[i]);
    if (isVowel && !prevIsVowel) {
      syllableCount++;
      prevIsVowel = true;
    } else if (!isVowel) {
      prevIsVowel = false;
    }
  }

  // Attempt to handle silent "e"
  if (word.endsWith('e') && syllableCount > 1) {
    syllableCount--;
  }

  return Math.max(syllableCount, 1);
}

interface EditorStatsProps {
  wordCount: number;
  editor: Editor | null;
}

interface WritingHero {
  name: string;
  description: string;
  strengths: string[];
  tips: string[];
  icon: string;
}

const EditorStats: React.FC<EditorStatsProps> = ({ wordCount, editor }) => {
  const [sentenceCount, setSentenceCount] = useState(0);
  const [paragraphCount, setParagraphCount] = useState(0);
  const [wordLengthDistribution, setWordLengthDistribution] = useState<number[]>([]);
  const [mostFrequentWords, setMostFrequentWords] = useState<{ word: string; count: number }[]>([]);

  // NEW states
  const [longestSentence, setLongestSentence] = useState(0);
  const [longestWord, setLongestWord] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [writingHero, setWritingHero] = useState<WritingHero | null>(null);

  // Common words to filter out from frequency
  const commonWords = ['the', 'and', 'that', 'have', 'for', 'not', 'you', 'with', 'this', 'but'];

  useEffect(() => {
    if (!editor) return;

    // Get text content from the TipTap editor
    const text = editor.getText();

    // ----- 1) Sentence Count -----
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
    setSentenceCount(sentences.length);

    // ----- 2) Paragraph Count -----
    // Using TipTap's doc nodes directly
    const paragraphs = editor.state.doc.content.content.filter(
      node => node.type.name === 'paragraph' && node.textContent.trim().length > 0
    );
    setParagraphCount(paragraphs.length);

    // ----- 3) Word Length Distribution -----
    const words = text.split(/\s+/).filter(w => w.trim().length > 0);
    const distribution = Array(10).fill(0);

    words.forEach((word) => {
      const cleanWord = word.replace(/[.,!?;:'"()\[\]{}]/g, '');
      const length = cleanWord.length;
      if (length > 0 && length <= 10) {
        distribution[length - 1]++;
      } else if (length > 10) {
        distribution[9]++; // Group >10 length words into last bucket
      }
    });

    // Normalize distribution for simpler bar-graph style
    const maxCount = Math.max(...distribution);
    const normalizedDistribution = distribution.map(count =>
      maxCount > 0 ? Math.ceil((count / maxCount) * 10) : 0
    );
    setWordLengthDistribution(normalizedDistribution);

    // ----- 4) Most Frequent Words -----
    const wordCounts: Record<string, number> = {};
    words.forEach(word => {
      const cleanWord = word.toLowerCase().replace(/[.,!?;:'"()\[\]{}]/g, '');
      // Filter out short words (<3 letters) and common words
      if (cleanWord.length >= 3 && !commonWords.includes(cleanWord)) {
        wordCounts[cleanWord] = (wordCounts[cleanWord] || 0) + 1;
      }
    });

    const sortedWords = Object.entries(wordCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([w, c]) => ({ word: w, count: c }));
    setMostFrequentWords(sortedWords);

    // ----- 5) Longest Sentence (NEW) -----
    let maxSentenceWords = 0;
    sentences.forEach(s => {
      const scount = s.trim().split(/\s+/).filter(Boolean).length;
      if (scount > maxSentenceWords) {
        maxSentenceWords = scount;
      }
    });
    setLongestSentence(maxSentenceWords);

    // ----- 6) Longest Word (NEW) -----
    let lw = '';
    words.forEach(w => {
      const cleanW = w.replace(/[^\w]/g, '');
      if (cleanW.length > lw.length) {
        lw = cleanW;
      }
    });
    setLongestWord(lw);

    if (editor && wordCount > 50) {
      analyzeWritingStyle();
    }

  }, [editor, wordCount]);

  const analyzeWritingStyle = async () => {
    if (!editor) return;
    
    try {
      setIsLoading(true);
      setError(null);
      
      const essayText = editor.getText();
      
      if (essayText.length < 50) {
        setError("Your essay is too short for style analysis. Write more to get personalized insights.");
        setIsLoading(false);
        return;
      }
      
      const response = await axios.post('http://localhost:5000/api/writing-style', {
        essay: essayText
      });
      
      if (response.data.success && response.data.hero) {
        setWritingHero(response.data.hero);
      } else {
        setError("Couldn't determine your writing style. Please try again.");
      }
      
    } catch (error: any) {
      console.error('Error analyzing writing style:', error);
      setError(error.response?.data?.error || "Failed to analyze writing style");
    } finally {
      setIsLoading(false);
    }
  };

  /** Flesch–Kincaid Grade Level => a reading level category */
  const getReadingLevel = () => {
    if (!editor) return 'Elementary';

    const text = editor.getText().trim();
    if (!text) return 'Elementary';

    const wordsArray = text.split(/\s+/).map((w) => w.trim()).filter(Boolean);
    const wordCountLocal = wordsArray.length;
    if (wordCountLocal === 0) return 'Elementary';

    const sentencesArray = text.split(/[.!?]+/).map((s) => s.trim()).filter(Boolean);
    const sentenceCountLocal = sentencesArray.length || 1;

    // Count total syllables
    let syllableTotal = 0;
    for (const w of wordsArray) {
      syllableTotal += countSyllablesInWord(w);
    }

    // Flesch–Kincaid Grade calculation
    const fkGrade =
      0.39 * (wordCountLocal / sentenceCountLocal) +
      11.8 * (syllableTotal / wordCountLocal) -
      15.59;

    // Map numeric grade level to categories
    if (fkGrade >= 16) {
      return 'Graduate';
    } else if (fkGrade >= 13) {
      return 'College';
    } else if (fkGrade >= 9) {
      return 'High School';
    } else if (fkGrade >= 6) {
      return 'Middle School';
    }
    return 'Elementary';
  };

  const readingLevel = getReadingLevel();

  return (
    <motion.div 
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 50 }}
      className="h-full flex flex-col"
    >
      <h3 className="text-lg font-semibold mb-4 text-slate-800">Live Essay Insights</h3>
      
      {/* Key stats: now 6 items in a 3-col grid */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        {/* Word Count */}
        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="bg-white p-3 rounded-md shadow-sm"
        >
          <div className="text-xs text-slate-500 uppercase font-semibold">Words</div>
          <div className="text-2xl font-bold">{wordCount}</div>
        </motion.div>

        {/* Sentence Count */}
        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.15 }}
          className="bg-white p-3 rounded-md shadow-sm"
        >
          <div className="text-xs text-slate-500 uppercase font-semibold">Sentences</div>
          <div className="text-2xl font-bold">{sentenceCount}</div>
        </motion.div>

        {/* Paragraph Count */}
        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="bg-white p-3 rounded-md shadow-sm"
        >
          <div className="text-xs text-slate-500 uppercase font-semibold">Paragraphs</div>
          <div className="text-2xl font-bold">{paragraphCount}</div>
        </motion.div>

        {/* Reading Level */}
        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.25 }}
          className="bg-white p-3 rounded-md shadow-sm"
        >
          <div className="text-xs text-slate-500 uppercase font-semibold">Reading Level</div>
          <div className="text-lg font-bold">{readingLevel}</div>
        </motion.div>

        {/* Longest Sentence (NEW) */}
        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="bg-white p-3 rounded-md shadow-sm"
        >
          <div className="text-xs text-slate-500 uppercase font-semibold flex items-center gap-1">
            <FaStopwatch className="text-purple-500" />
            Longest Sentence
          </div>
          <div className="text-2xl font-bold">{longestSentence || 0}</div>
        </motion.div>

        {/* Longest Word (NEW) */}
        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.35 }}
          className="bg-white p-3 rounded-md shadow-sm"
        >
          <div className="text-xs text-slate-500 uppercase font-semibold flex items-center gap-1">
            <FaFont className="text-pink-500" />
            Longest Word
          </div>
          <div className="text-lg font-bold break-all">
            {longestWord || '—'}
          </div>
        </motion.div>
      </div>
      
      {/* Word Length Distribution */}
      <motion.div 
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.45 }}
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
          <span>10+</span>
        </div>
      </motion.div>
      
      {/* Most Frequent Words */}
      <motion.div 
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.5 }}
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

      {isLoading ? (
        <div className="flex flex-col items-center justify-center flex-grow">
          <FaSpinner className="text-blue-500 text-3xl mb-3 animate-spin" />
          <p className="text-slate-600">Analyzing your writing style...</p>
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center flex-grow">
          <div className="bg-red-50 text-red-600 p-4 rounded-lg max-w-md">
            <p>{error}</p>
            {wordCount < 50 && (
              <p className="mt-2">Keep writing! You need at least 50 words for analysis.</p>
            )}
          </div>
        </div>
      ) : writingHero ? (
        <div className="flex-grow">
          <div className="bg-blue-50 rounded-lg p-5 mb-5">
            <div className="flex items-center mb-4">
              <span className="text-4xl mr-3">{writingHero.icon}</span>
              <h3 className="text-xl font-bold text-blue-700">{writingHero.name}</h3>
            </div>
            <p className="text-slate-700 mb-4">{writingHero.description}</p>
            
            <h4 className="font-bold text-slate-700 mb-2">Your Writing Strengths:</h4>
            <ul className="list-disc pl-5 mb-4">
              {writingHero.strengths.map((strength, index) => (
                <li key={index} className="text-slate-600 mb-1">{strength}</li>
              ))}
            </ul>
            
            <h4 className="font-bold text-slate-700 mb-2">Tips to Improve:</h4>
            <ul className="list-disc pl-5">
              {writingHero.tips.map((tip, index) => (
                <li key={index} className="text-slate-600 mb-1">{tip}</li>
              ))}
            </ul>
          </div>
          
          <button 
            onClick={analyzeWritingStyle}
            className="flex items-center justify-center gap-2 w-full py-2 bg-white border border-blue-300 rounded-md text-blue-600 hover:bg-blue-50 transition-colors"
          >
            <FaLightbulb className="text-yellow-500" />
            Refresh Analysis
          </button>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center flex-grow">
          <button 
            onClick={analyzeWritingStyle}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            <FaLightbulb className="text-yellow-300" />
            Analyze My Writing Style
          </button>
          <p className="text-slate-500 mt-3 text-center max-w-xs">
            Discover your writing superhero identity and get personalized tips!
          </p>
        </div>
      )}
    </motion.div>
  );
};

export default EditorStats;
