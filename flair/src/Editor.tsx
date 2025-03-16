import React, { useState, useEffect } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Highlight from '@tiptap/extension-highlight';
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
import Underline from '@tiptap/extension-underline';
import { Color } from '@tiptap/extension-color';
import { generateReport } from './utils/reportGenerator';

// Storage keys
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
    const saved = localStorage.getItem('essay-editor-comments');
    return saved ? JSON.parse(saved) : [];
  });
  const [activeCommentId, setActiveCommentId] = useState<string | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [currentAnalysis, setCurrentAnalysis] = useState<RubricScore[]>([]);

  // Initialize editor with saved content
  const editor = useEditor({
    extensions: [
      StarterKit,
      Highlight.configure({
        multicolor: true,
      }),
      Underline,
      BulletList,
      OrderedList,
      Blockquote,
      ListItem,
      CommentMark,
      Comment,
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

  // Add effect to save comments
  useEffect(() => {
    if (comments.length > 0) {
      localStorage.setItem('essay-editor-comments', JSON.stringify(comments));
    }
  }, [comments]);

  const handleGenerateReport = () => {
    if (!editor) return;
    generateReport({
      essayContent: editor.getHTML(),
      comments,
      wordCount,
      analysis: currentAnalysis // Use the stored analysis
    });
  };

  return (
    <div className="border rounded-md overflow-hidden bg-white">
      {/* Top Bar */}
      <div className="flex items-center justify-between bg-slate-100 px-3 py-2 border-b">
        <h2 className="text-slate-700 font-medium">Essay Editor</h2>
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

          {/* New Metrics button */}
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

      {/* Wait for editor to load before showing MenuBar */}
      {isLoaded && editor ? <MenuBar editor={editor} /> : <div className="p-4 text-gray-500">Loading editor...</div>}

      <div className="flex">
        {/* Main Editor */}
        <div className={`${showInsights || showComments ? 'w-2/3' : 'w-full'} transition-all duration-300`}>
          <EditorContent editor={editor} className="prose max-w-none p-4 min-h-[300px]" />

          {/* Word count footer */}
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

        {/* Right Sidebar */}
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
          comments={comments} // Add this line
          wordCount={wordCount} // Pass in the current Editor word count
        />
      )}
    </div>
  );
};

export default Editor;
