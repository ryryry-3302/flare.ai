import React, { useState, useEffect } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';

import StarterKit from '@tiptap/starter-kit';
import Highlight from '@tiptap/extension-highlight';
import Underline from '@tiptap/extension-underline';
import Strike from '@tiptap/extension-strike';

import MenuBar from './MenuBar';
import BulletList from '@tiptap/extension-bullet-list';
import OrderedList from '@tiptap/extension-ordered-list';
import Blockquote from '@tiptap/extension-blockquote';
import ListItem from '@tiptap/extension-list-item';

import { FaChartLine, FaFont, FaClock, FaComment, FaChartBar } from 'react-icons/fa';
import MetricsPanel from './components/MetricsPanel';
import EditorStats from './components/EditorStats';

import CommentsSidebar, { CommentData } from './components/CommentsSidebar';
import { Comment, CommentMark } from './extensions/CommentExtension';
import TextStyle from '@tiptap/extension-text-style';
import { Color } from '@tiptap/extension-color';

import { generateReport, WritingHero } from './utils/reportGenerator'; // or your path
import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';

/** If your metrics analysis uses a "RubricScore" type, define it below or import from your own code. */
interface RubricScore {
  category: string;
  score: number;
  explanation: string[];
  comments?: {
    comment: string;
    start_index: number;
    end_index: number;
  }[];
}

// Storage keys for local persistence
const STORAGE_KEYS = {
  EDITOR_CONTENT: 'essay-editor-content',
  COMMENTS: 'essay-editor-comments',
};

/** Some default content for first-timers */
const DEFAULT_CONTENT = `
  <h2>Welcome to the Essay Editor</h2>
  <p>This is a rich text editor designed for reviewing and editing essays.</p>
  <ul>
    <li>Try creating bullet points</li>
    <li>Or format your text</li>
  </ul>
  <blockquote>Add quotes for important passages</blockquote>
`;

const Editor: React.FC = () => {
  const [showMetrics, setShowMetrics] = useState(false);
  const [showInsights, setShowInsights] = useState(false);
  const [showComments, setShowComments] = useState(false);

  const [wordCount, setWordCount] = useState(0);
  const [comments, setComments] = useState<CommentData[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.COMMENTS);
    return saved ? JSON.parse(saved) : [];
  });
  const [activeCommentId, setActiveCommentId] = useState<string | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [currentAnalysis, setCurrentAnalysis] = useState<RubricScore[]>([]);
  const [currentWritingHero, setCurrentWritingHero] = useState<WritingHero | null>(null);

  // Tiptap editor setup
  const editor = useEditor({
    extensions: [
      StarterKit,
      Highlight.configure({ multicolor: true }),
      Underline,
      Strike,
      BulletList,
      OrderedList,
      Blockquote,
      ListItem,
      CommentMark,
      Comment,
      TextStyle,
      Color,
    ],
    content: localStorage.getItem(STORAGE_KEYS.EDITOR_CONTENT) || DEFAULT_CONTENT,
    onUpdate: ({ editor }) => {
      const text = editor.getText();
      // Update word count
      const words = text.trim().split(/\s+/);
      setWordCount(text.trim() ? words.length : 0);

      // Persist content
      try {
        localStorage.setItem(STORAGE_KEYS.EDITOR_CONTENT, editor.getHTML());
      } catch (error) {
        console.error('Error saving content to localStorage', error);
      }
    },
  });

  // Wait until editor fully loads
  useEffect(() => {
    if (editor) {
      const text = editor.getText();
      setWordCount(text.trim() ? text.trim().split(/\s+/).length : 0);
      setIsLoaded(true);
    }
  }, [editor]);

  // Persist comments to localStorage
  useEffect(() => {
    if (comments.length) {
      localStorage.setItem(STORAGE_KEYS.COMMENTS, JSON.stringify(comments));
    } else {
      localStorage.removeItem(STORAGE_KEYS.COMMENTS);
    }
  }, [comments]);

  // Listen for "commentClick" events from Tiptap plugin
  useEffect(() => {
    const handleCommentClick = (e: CustomEvent) => {
      setShowComments(true); // open comments
      setShowInsights(false);
      setShowMetrics(false);
      setActiveCommentId(e.detail.id);
    };

    document.addEventListener('commentClick', handleCommentClick as EventListener);
    return () => {
      document.removeEventListener('commentClick', handleCommentClick as EventListener);
    };
  }, []);

  /** ==========  Grammar Check Logic  ========== */
  const handleGrammarCheck = async () => {
    if (!editor) return;

    try {
      const text = editor.getText();
      if (!text || text.trim().length < 10) {
        alert('Essay text is too short to check grammar.');
        return;
      }

      // Call the Flask endpoint
      const response = await axios.post('http://localhost:5000/api/grammar-check', {
        essay: text,
      });

      if (response.data.success && response.data.corrections) {
        const corrections = response.data.corrections as {
          error: string;
          starting_index: number;
          corrected: string;
        }[];

        // We'll highlight each "error" text with a comment so user can see suggested correction
        // For safety, sort them in ascending order of `starting_index` to avoid confusion
        const sorted = corrections.slice().sort((a, b) => a.starting_index - b.starting_index);

        // Because the user might have typed or changed text, 
        // we interpret the indexes as best as we can. 
        // But if your text hasn't changed, these indexes will match exactly.

        // We'll highlight them with a comment for now (not auto-correcting text).
        // If you want to auto-correct, you'd do an editor.replaceRange or something similar.
        sorted.forEach((item) => {
          const from = item.starting_index;
          const to = from + item.error.length;

          // Safety check
          if (from >= 0 && to <= text.length && from < to) {
            // Create unique ID for the new comment
            const commentId = uuidv4();

            // Apply Tiptap selection
            editor.chain().setTextSelection({ from, to }).run();

            // Use the comment extension to highlight the selection
            editor.chain().setComment(commentId).run();

            // Add to our comments state so it appears in the sidebar
            setComments((prev) => [
              ...prev,
              {
                id: commentId,
                content: `Possible fix: “${item.corrected}”`,
                highlightedText: item.error,
                resolved: false,
                timestamp: Date.now(),
              },
            ]);
          } else {
            console.warn('Grammar check index out of range:', item);
          }
        });

        alert('Grammar check complete! See new highlights in Comments.');
      } else {
        alert('No corrections found or server error.');
      }
    } catch (err) {
      console.error('Grammar check failed:', err);
      alert('Grammar check error. See console for details.');
    }
  };

  /** ==========  Generate PDF-like Report  ========== */
  const handleGenerateReport = async () => {
    if (!editor) return;
    
    // If we don't have a writing hero yet, try to fetch one
    if (!currentWritingHero) {
      try {
        const essayText = editor.getText();
        
        if (essayText.length >= 50) {
          const response = await axios.post('http://localhost:5000/api/writing-style', {
            essay: essayText
          });
          
          if (response.data.success && response.data.hero) {
            setCurrentWritingHero(response.data.hero);
          }
        }
      } catch (error) {
        console.error('Error fetching writing style hero for report:', error);
        // Continue generating report even if we can't get the writing style
      }
    }
  
    // Generate the report with all available data including the writing hero
    generateReport({
      essayContent: editor.getHTML(),
      comments,
      wordCount,
      analysis: currentAnalysis,
      writingHero: currentWritingHero || undefined // Pass the writing hero if available
    });
  };

  return (
    <div className="border rounded-md overflow-hidden bg-white">
      {/* ========== Top Bar ========== */}
      <div className="flex items-center justify-between bg-slate-100 px-3 py-2 border-b">
        <h2 className="text-slate-700 font-medium">Essay Editor</h2>

        <div className="flex items-center gap-2">
          {/* Trigger Comments */}
          <button
            onClick={() => {
              setShowComments(!showComments);
              if (!showComments) {
                setShowInsights(false);
                setShowMetrics(false);
              }
            }}
            className={`flex items-center gap-1 px-3 py-1 text-sm font-medium rounded transition-colors ${
              showComments ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-700'
            }`}
          >
            <FaComment className="w-4 h-4" />
            {showComments ? 'Hide' : 'Comments'}
            {comments.length > 0 && (
              <span className="ml-1 bg-white text-blue-600 rounded-full w-5 h-5 flex items-center justify-center text-xs">
                {comments.length}
              </span>
            )}
          </button>

          {/* Insights */}
          <button
            onClick={() => {
              setShowInsights(!showInsights);
              if (!showInsights) {
                setShowComments(false);
                setShowMetrics(false);
              }
            }}
            className={`flex items-center gap-1 px-3 py-1 text-sm font-medium rounded transition-colors ${
              showInsights ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-700'
            }`}
          >
            <FaChartLine className="w-4 h-4" />
            {showInsights ? 'Hide' : 'Insights'}
          </button>

          {/* Metrics */}
          <button
            onClick={() => {
              setShowMetrics(!showMetrics);
              if (!showMetrics) {
                setShowComments(false);
                setShowInsights(false);
              }
            }}
            className={`flex items-center gap-1 px-3 py-1 text-sm font-medium rounded transition-colors ${
              showMetrics ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-700'
            }`}
          >
            <FaChartBar className="w-4 h-4" />
            {showMetrics ? 'Hide Metrics' : 'Metrics'}
          </button>

          {/* Grammar Check */}
          <button
            onClick={handleGrammarCheck}
            className="px-3 py-1 rounded bg-purple-600 text-white font-medium transition-colors hover:bg-purple-700"
          >
            Check Grammar
          </button>

          {/* Generate Report */}
          <button
            onClick={handleGenerateReport}
            className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 transition-colors"
          >
            Generate Report
          </button>
        </div>
      </div>

      {/* ========== MenuBar ========== */}
      {isLoaded && editor ? (
        <MenuBar editor={editor} />
      ) : (
        <div className="p-4 text-gray-500">Loading editor...</div>
      )}

      <div className="flex">
        {/* ========== Main Editor ========== */}
        <div className={`${showInsights || showComments ? 'w-2/3' : 'w-full'} transition-all duration-300`}>
          <EditorContent editor={editor} className="prose max-w-none p-4 min-h-[300px]" />

          {/* Word Count Footer */}
          <div className="flex items-center justify-between px-4 py-2 border-t bg-slate-50 text-sm text-slate-600">
            <div className="flex items-center gap-2">
              <FaFont className="w-3.5 h-3.5" />
              <span>{wordCount} words</span>
            </div>
            <div className="flex items-center gap-2">
              <FaClock className="w-3.5 h-3.5" />
              <span>~{Math.ceil(wordCount / 200)} min read</span>
            </div>
          </div>
        </div>

        {/* ========== Right-Side Panels ========== */}
        {showComments && (
          <div className="w-1/3 border-l">
            <CommentsSidebar
              editor={editor}
              comments={comments}
              setComments={setComments}
              activeCommentId={activeCommentId}
              setActiveCommentId={setActiveCommentId}
            />
          </div>
        )}

        {showInsights && !showComments && (
          <div className="w-1/3 border-l p-4 bg-slate-50">
            <EditorStats 
              wordCount={wordCount} 
              editor={editor} 
              onAnalysisComplete={(hero) => setCurrentWritingHero(hero)}
            />
          </div>
        )}
      </div>

      {/* ========== Metrics Panel ========== */}
      {showMetrics && editor && (
        <MetricsPanel
          onClose={() => setShowMetrics(false)}
          editor={editor}
          initialAnalysis={currentAnalysis}
          onAnalysisComplete={setCurrentAnalysis}
          comments={comments}
          wordCount={wordCount}
        />
      )}
    </div>
  );
};

export default Editor;
