import React, { useState, useEffect } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Highlight from '@tiptap/extension-highlight';
import MenuBar from './MenuBar';
import BulletList from '@tiptap/extension-bullet-list';
import OrderedList from '@tiptap/extension-ordered-list';
import Blockquote from '@tiptap/extension-blockquote';
import ListItem from '@tiptap/extension-list-item';
import { FaChartBar, FaChartLine, FaFont, FaClock, FaComment, FaFileAlt } from 'react-icons/fa';
import MetricsPanel from './components/MetricsPanel';
import EditorStats from './components/EditorStats';
import CommentsSidebar, { CommentData } from './components/CommentsSidebar';
import { Comment, CommentMark } from './extensions/CommentExtension';
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
  const [comments, setComments] = useState<CommentData[]>([]);
  const [activeCommentId, setActiveCommentId] = useState<string | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  
  // Load UI state from localStorage
  useEffect(() => {
    try {
      const savedUIState = localStorage.getItem(STORAGE_KEYS.UI_STATE);
      if (savedUIState) {
        const { showInsights: savedShowInsights, showComments: savedShowComments } = JSON.parse(savedUIState);
        setShowInsights(savedShowInsights);
        setShowComments(savedShowComments);
      }
    } catch (error) {
      console.error('Error loading UI state from localStorage', error);
    }
  }, []);
  
  // Save UI state to localStorage
  useEffect(() => {
    // Only save after the component has fully mounted
    if (isLoaded) {
      try {
        localStorage.setItem(
          STORAGE_KEYS.UI_STATE, 
          JSON.stringify({ showInsights, showComments })
        );
      } catch (error) {
        console.error('Error saving UI state to localStorage', error);
      }
    }
  }, [showInsights, showComments, isLoaded]);
  
  // Load comments from localStorage
  useEffect(() => {
    try {
      const savedComments = localStorage.getItem(STORAGE_KEYS.COMMENTS);
      if (savedComments) {
        const parsedComments = JSON.parse(savedComments);
        // Convert string dates back to Date objects
        const processedComments = parsedComments.map((comment: any) => ({
          ...comment,
          timestamp: new Date(comment.timestamp)
        }));
        setComments(processedComments);
      }
    } catch (error) {
      console.error('Error loading comments from localStorage', error);
    }
  }, []);
  
  // Save comments to localStorage
  useEffect(() => {
    // Only save after the component has fully mounted
    if (isLoaded) {
      try {
        localStorage.setItem(STORAGE_KEYS.COMMENTS, JSON.stringify(comments));
      } catch (error) {
        console.error('Error saving comments to localStorage', error);
      }
    }
  }, [comments, isLoaded]);
  
  // Load content from localStorage or use default
  const getSavedContent = () => {
    try {
      const savedContent = localStorage.getItem(STORAGE_KEYS.EDITOR_CONTENT);
      return savedContent || DEFAULT_CONTENT;
    } catch (error) {
      console.error('Error loading content from localStorage', error);
      return DEFAULT_CONTENT;
    }
  };
  
  // Initialize editor with saved content
  const editor = useEditor({
    extensions: [
      StarterKit,
      Highlight,
      BulletList,
      OrderedList,
      Blockquote,
      ListItem,
      CommentMark,
      Comment,
    ],
    content: getSavedContent(),
    onUpdate: ({ editor }) => {
      // Update word count when content changes
      const text = editor.getText();
      const words = text.trim().split(/\s+/);
      setWordCount(text.trim() ? words.length : 0);
      
      // Save content to localStorage
      try {
        localStorage.setItem(STORAGE_KEYS.EDITOR_CONTENT, editor.getHTML());
      } catch (error) {
        console.error('Error saving content to localStorage', error);
      }
    },
    onTransaction: () => {
      // This ensures we save content even when marks are applied without text changes
      if (editor && isLoaded) {
        try {
          localStorage.setItem(STORAGE_KEYS.EDITOR_CONTENT, editor.getHTML());
        } catch (error) {
          console.error('Error saving content to localStorage', error);
        }
      }
    }
  });
  
  // Initial word count calculation and mark component as loaded
  useEffect(() => {
    if (editor) {
      const text = editor.getText();
      const words = text.trim().split(/\s+/);
      setWordCount(text.trim() ? words.length : 0);
      setIsLoaded(true);
    }
  }, [editor]);
  
  const handleGenerateReport = () => {
    if (!editor) return;
  
    generateReport({
      essayContent: editor.getHTML(),
      comments,
      wordCount
    });
  };

  // Rest of the component remains the same
  return (
    <div className="border rounded-md overflow-hidden bg-white">
      {/* UI remains the same */}
      <div className="flex items-center justify-between bg-slate-100 px-3 py-2 border-b">
        <h2 className="text-slate-700 font-medium">Essay Editor</h2>
        <div className="flex gap-2">
          <button
            onClick={() => {
              // If comments is currently closed, open it and ensure insights is closed
              if (!showComments) {
                setShowComments(true);
                setShowInsights(false);
              } else {
                // If comments is open, just close it
                setShowComments(false);
              }
            }}
            className={`flex items-center gap-1 px-3 py-1 text-sm font-medium rounded transition-colors ${
              showComments 
                ? 'bg-blue-600 text-white hover:bg-blue-700' 
                : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
            }`}
          >
            <FaComment className="w-4 h-4" />
            {showComments ? 'Hide' : 'Comments'}
            {comments.length > 0 && <span className="ml-1 bg-white text-blue-600 rounded-full w-5 h-5 flex items-center justify-center text-xs">{comments.length}</span>}
          </button>
          
          <button
            onClick={() => {
              // If insights is currently closed, open it and ensure comments is closed
              if (!showInsights) {
                setShowInsights(true);
                setShowComments(false);
              } else {
                // If insights is open, just close it
                setShowInsights(false);
              }
            }}
            className={`flex items-center gap-1 px-3 py-1 text-sm font-medium rounded transition-colors ${
              showInsights 
                ? 'bg-blue-600 text-white hover:bg-blue-700' 
                : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
            }`}
          >
            <FaChartLine className="w-4 h-4" />
            {showInsights ? 'Hide' : 'Insights'}
          </button>
          
          <button
            onClick={() => setShowMetrics(true)}
            className="flex items-center gap-1 px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded transition-colors"
          >
            <FaChartBar className="w-4 h-4" />
            Analysis
          </button>

          <button
            onClick={handleGenerateReport}
            className="flex items-center gap-1 px-3 py-1 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded transition-colors"
          >
            <FaFileAlt className="w-4 h-4" />
            Generate Report
          </button>
        </div>
      </div>
      
      <MenuBar editor={editor} />
      
      <div className="flex">
        {/* Main editor */}
        <div className={`${showInsights || showComments ? 'w-2/3' : 'w-full'} transition-all duration-300`}>
          <EditorContent 
            editor={editor} 
            className="prose max-w-none p-4 focus:outline-none min-h-[300px]"
          />
          
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
        
        {/* Right sidebar - conditionally show comments or insights */}
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
      
      {showMetrics && <MetricsPanel onClose={() => setShowMetrics(false)} />}
    </div>
  );
};

export default Editor;