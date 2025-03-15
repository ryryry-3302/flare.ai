// src/EditorStats.tsx
import React, { useEffect, useState } from 'react';
import { FaBookOpen, FaCheck, FaQuoteRight, FaChartLine } from 'react-icons/fa';
import { motion } from 'framer-motion';
import { Editor } from '@tiptap/react';

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

const EditorStats: React.FC<EditorStatsProps> = ({ wordCount, editor }) => {
  const [sentenceCount, setSentenceCount] = useState(0);
  const [paragraphCount, setParagraphCount] = useState(0);
  const [wordLengthDistribution, setWordLengthDistribution] = useState<number[]>([]);
  const [mostFrequentWords, setMostFrequentWords] = useState<{ word: string; count: number }[]>([]);

  // Common words to filter out
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

  }, [editor, wordCount]);

  /** More nuanced reading level via Flesch–Kincaid Grade Level */
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

    // Flesch–Kincaid Grade Level
    const fkGrade =
      0.39 * (wordCountLocal / sentenceCountLocal) +
      11.8 * (syllableTotal / wordCountLocal) -
      15.59;

    // Map numeric grade level to your categories
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
      
      {/* Key stats */}
      <div className="grid grid-cols-2 gap-3 mb-6">
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
          transition={{ delay: 0.2 }}
          className="bg-white p-3 rounded-md shadow-sm"
        >
          <div className="text-xs text-slate-500 uppercase font-semibold">Sentences</div>
          <div className="text-2xl font-bold">{sentenceCount}</div>
        </motion.div>

        {/* Paragraph Count */}
        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="bg-white p-3 rounded-md shadow-sm"
        >
          <div className="text-xs text-slate-500 uppercase font-semibold">Paragraphs</div>
          <div className="text-2xl font-bold">{paragraphCount}</div>
        </motion.div>

        {/* Reading Level */}
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
      
      {/* Word Length Distribution */}
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
          <span>10+</span>
        </div>
      </motion.div>
      
      {/* Most Frequent Words */}
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
