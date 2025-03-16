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
import { Color } from '@tiptap/extension-color';
import TextStyle from '@tiptap/extension-text-style';
import { generateReport } from './utils/reportGenerator';
import axios from 'axios';

/**
 * If your metrics analysis uses a "RubricScore" type, define it below
 * or import from your own code.
 */
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

const STORAGE_KEYS = {
  EDITOR_CONTENT: 'essay-editor-content',
  COMMENTS: 'essay-editor-comments',
  UI_STATE: 'essay-editor-ui-state',
};

// Default content for new users
const DEFAULT_CONTENT = `
  <h2>Welcome to the Essay Editor</h2>
  <p>This is a rich text editor designed for reviewing and editing essays.</p>
  <ul>
    <li>Try creating bullet points</li>
    <li>Or format your text</li>
  </ul>
  <blockquote>Add quotes for important passages</blockquote>
`;

const Editor = () => {
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
  const [showHistory, setShowHistory] = useState(false);
  const [essayHistory, setEssayHistory] = useState<any[]>([]);

  // Initialize editor with saved content
  const editor = useEditor({
    extensions: [
      StarterKit,
      Highlight.configure({
        multicolor: true,
      }),
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
      const words = text.trim().split(/\s+/);
      setWordCount(text.trim() ? words.length : 0);

      try {
        localStorage.setItem(STORAGE_KEYS.EDITOR_CONTENT, editor.getHTML());
      } catch (error) {
        console.error('Error saving content to localStorage', error);
      }
    },
  });

  // Ensure editor is fully loaded before rendering components
  useEffect(() => {
    if (editor) {
      const text = editor.getText();
      setWordCount(text.trim() ? text.trim().split(/\s+/).length : 0);
      setIsLoaded(true);
    }
  }, [editor]);

  // Sync comments to localStorage whenever `comments` changes
  useEffect(() => {
    if (comments.length > 0) {
      localStorage.setItem(STORAGE_KEYS.COMMENTS, JSON.stringify(comments));
    } else {
      // If no comments, remove them from localStorage so they're truly "flushed"
      localStorage.removeItem(STORAGE_KEYS.COMMENTS);
    }
  }, [comments]);

  // Listen for commentClick events (from the Tiptap plugin) so we can open the sidebar, etc.
  useEffect(() => {
    const handleCommentClick = (e: CustomEvent) => {
      // Show comments, hide others
      setShowComments(true);
      setShowInsights(false);
      setShowMetrics(false);
      setActiveCommentId(e.detail.id);
    };

    document.addEventListener('commentClick', handleCommentClick as EventListener);
    return () => {
      document.removeEventListener('commentClick', handleCommentClick as EventListener);
    };
  }, []);

  // Fetch previous essays from your server
  async function fetchHistory() {
    try {
      const res = await axios.get('http://localhost:5000/api/list-essays');
      setEssayHistory(res.data || []);
    } catch (error) {
      console.error('Failed to fetch essay history:', error);
    }
  }

  function handleLoadHistory() {
    setShowHistory(!showHistory);
    if (!showHistory) {
      fetchHistory();
    }
  }

  /**
   * When the user selects an old essay from the list:
   * - Overwrite the Editor content
   * - CLEAR (flush) all comments (both state + localStorage).
   */
  function handleSelectEssay(essayBody: string) {
    editor?.commands.setContent(essayBody);

    // Flush comments
    setComments([]);
    localStorage.removeItem(STORAGE_KEYS.COMMENTS);

    // Hide the history dropdown
    setShowHistory(false);
  }

  const handleGenerateReport = () => {
    if (!editor) return;
    generateReport({
      essayContent: editor.getHTML(),
      comments,
      wordCount,
      analysis: currentAnalysis, // Use the stored analysis
    });
  };

  return (
    <div className="border rounded-md overflow-hidden bg-white">
      {/* Top Bar */}
      <div className="flex items-center justify-between bg-slate-100 px-3 py-2 border-b">
        <div className="flex items-center gap-3">
          <h2 className="text-slate-700 font-medium">Essay Editor</h2>

          {/* View History Button + Dropdown */}
          <div className="relative inline-block">
            <button
              onClick={handleLoadHistory}
              className="bg-blue-600 text-white px-3 py-1 rounded"
            >
              View History
            </button>
            {showHistory && (
              <div className="absolute left-0 mt-2 w-64 bg-white border border-gray-200 rounded shadow-lg z-10">
                <span className="block px-3 py-2 font-bold border-b bg-gray-50">Previously Uploaded</span>
                {essayHistory.length > 0 ? (
                  essayHistory.map((essay) => (
                    <button
                      key={essay.id}
                      onClick={() => handleSelectEssay(essay.essay_body)}
                      className="block w-full text-left py-2 px-3 hover:bg-blue-50"
                    >
                      {essay.title || `Essay #${essay.id}`}
                    </button>
                  ))
                ) : (
                  <div className="py-2 px-3 text-gray-500">No essays found.</div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Top Bar Right-Side Buttons */}
        <div className="flex gap-2">
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

          <button
            onClick={handleGenerateReport}
            className="bg-blue-600 text-white px-3 py-1 rounded"
          >
            Generate Report
          </button>
        </div>
      </div>

      {/* Show Menu Bar after Editor is loaded */}
      {isLoaded && editor ? <MenuBar editor={editor} /> : <div className="p-4 text-gray-500">Loading editor...</div>}

      <div className="flex">
        {/* Main Editor Section */}
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

        {/* Right Sidebar Conditionals */}
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
            <EditorStats wordCount={wordCount} editor={editor} />
          </div>
        )}
      </div>

      {/* Metrics Panel */}
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
