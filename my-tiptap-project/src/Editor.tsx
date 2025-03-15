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
  
  const generateReport = () => {
    // Create a new window for the report
    const reportWindow = window.open('', '_blank');
    
    if (!reportWindow) {
      alert('Please allow popups for this site to generate reports');
      return;
    }
    
    // Get text content and comments
    const essayContent = editor?.getHTML() || '';
    
    // Generate random scores for demo purposes
    const generateScore = () => Math.floor(Math.random() * 21) + 80; // 80-100 range
    
    const grades = {
      grammar: generateScore(),
      vocabulary: generateScore(),
      fluency: generateScore(),
      coherence: generateScore(),
      overall: 0
    };
    
    // Calculate overall score
    grades.overall = Math.round(
      (grades.grammar + grades.vocabulary + grades.fluency + grades.coherence) / 4
    );
    
    // Get letter grade
    const getLetterGrade = (score: number) => {
      if (score >= 90) return 'A';
      if (score >= 80) return 'B';
      if (score >= 70) return 'C';
      if (score >= 60) return 'D';
      return 'F';
    };
    
    // Current date
    const today = new Date();
    const dateString = today.toLocaleDateString('en-US', {
      year: 'numeric', 
      month: 'long', 
      day: 'numeric'
    });
    
    // First, process the essay content to add markers
    let markedEssayContent = essayContent;

    // Ensure we have comments with highlighted text - a safer approach
    const validComments = comments.filter(comment => comment.highlightedText && comment.highlightedText.trim().length > 0);

    // If we don't have highlighted text info in the comments, inform the user
    if (validComments.length === 0 && comments.length > 0) {
      // Add a note to the report that comments won't be linked
      reportWindow.document.write(`
        <div style="background-color: #fee2e2; color: #991b1b; padding: 12px; margin-bottom: 20px; border-radius: 4px;">
          <p style="margin: 0;">Note: Comment highlighting cannot be displayed in this report because the highlighted text data is missing from your comments.</p>
        </div>
      `);
    } else {
      // We have valid comments with highlighted text
      
      // Create a DOM parser to safely process HTML
      const parser = new DOMParser();
      const doc = parser.parseFromString(essayContent, 'text/html');
      
      // Function to find and mark text nodes that match our target
      function markTextInNode(node, targetText, commentId, commentNumber) {
        if (node.nodeType === Node.TEXT_NODE) {
          const content = node.textContent || '';
          if (content.includes(targetText)) {
            // Create a wrapper span for the highlighted text
            const wrapper = document.createElement('span');
            wrapper.className = 'essay-comment-mark';
            wrapper.setAttribute('data-comment-id', commentId);
            
            // Set text content to the matched part
            wrapper.textContent = targetText;
            
            // Create a link for the comment number that jumps to the comment
            const link = document.createElement('a');
            link.className = 'comment-number';
            link.href = `#comment-${commentNumber}`; // Add anchor link
            link.textContent = `[${commentNumber}]`;
            wrapper.appendChild(link);
            
            // Replace the text node with the marked-up version
            const beforeText = content.substring(0, content.indexOf(targetText));
            const afterText = content.substring(content.indexOf(targetText) + targetText.length);
            
            if (beforeText) {
              node.parentNode.insertBefore(document.createTextNode(beforeText), node);
            }
            
            node.parentNode.insertBefore(wrapper, node);
            
            if (afterText) {
              node.textContent = afterText;
              // Continue searching in the remaining text
              markTextInNode(node, targetText, commentId, commentNumber);
            } else {
              node.parentNode.removeChild(node);
            }
            
            return true;
          }
        } else if (node.nodeType === Node.ELEMENT_NODE && 
                  !['script', 'style', 'textarea'].includes(node.tagName.toLowerCase())) {
          // Process child nodes recursively
          for (let i = 0; i < node.childNodes.length; i++) {
            // If we found and marked the text, we're done with this comment
            if (markTextInNode(node.childNodes[i], targetText, commentId, commentNumber)) {
              return true;
            }
          }
        }
        return false;
      }
      
      // Mark each comment's highlighted text in the document
      validComments.forEach((comment, index) => {
        if (comment.highlightedText) {
          const commentNumber = index + 1;
          markTextInNode(doc.body, comment.highlightedText, comment.id, commentNumber);
        }
      });
      
      // Get the processed HTML with our comment markers
      markedEssayContent = doc.body.innerHTML;
    }

    // Write the report content
    reportWindow.document.write(`
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <title>Essay Evaluation Report</title>
        <style>
          body {
            font-family: 'Arial', sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
          }
          .header {
            text-align: center;
            margin-bottom: 30px;
            padding-bottom: 20px;
            border-bottom: 2px solid #eaeaea;
            scroll-margin-top: 20px;
            id: top;
          }
          .title {
            font-size: 24px;
            font-weight: bold;
            margin-bottom: 5px;
          }
          .date {
            font-size: 14px;
            color: #666;
          }
          .section {
            margin-bottom: 30px;
          }
          .section-title {
            font-size: 20px;
            font-weight: bold;
            margin-bottom: 15px;
            padding-bottom: 8px;
            border-bottom: 1px solid #eaeaea;
          }
          .essay-content {
            background-color: #f9f9f9;
            padding: 20px;
            border-radius: 5px;
            margin-bottom: 20px;
            font-family: 'Times New Roman', serif;
          }
          .metrics {
            display: flex;
            flex-wrap: wrap;
            gap: 20px;
            margin-bottom: 20px;
          }
          .metric-card {
            flex: 1;
            min-width: 150px;
            padding: 15px;
            background-color: #f5f5f5;
            border-radius: 5px;
            text-align: center;
          }
          .metric-value {
            font-size: 28px;
            font-weight: bold;
            color: #2563eb;
            margin-bottom: 5px;
          }
          .metric-label {
            font-size: 14px;
            color: #666;
          }
          .overall-grade {
            background-color: #2563eb;
            color: white;
          }
          .comment-box {
            background-color: #fffbeb;
            border-left: 4px solid #fbbf24;
            padding: 15px;
            margin-bottom: 15px;
            border-radius: 0 5px 5px 0;
          }
          .comment-author {
            font-weight: bold;
            margin-bottom: 5px;
          }
          .comment-content {
            margin-bottom: 5px;
          }
          .improvement-list {
            list-style-type: disc;
            padding-left: 20px;
          }
          .improvement-list li {
            margin-bottom: 8px;
          }
          .print-button {
            display: block;
            background-color: #2563eb;
            color: white;
            border: none;
            padding: 10px 20px;
            font-size: 16px;
            border-radius: 5px;
            cursor: pointer;
            margin: 20px auto;
          }
          @media print {
            .print-button {
              display: none;
            }
            body {
              padding: 0;
              margin: 0;
            }
          }
          .comment-highlight {
            background-color: rgba(255, 220, 0, 0.2);
            position: relative;
            border-bottom: 2px dotted #fbbf24;
            padding: 2px 0;
          }
          .resolved .comment-content {
            text-decoration: line-through;
            color: #888;
          }
          .essay-comment-mark {
            background-color: #fff8e1;
            border-bottom: 2px dotted #fbbf24;
            padding: 0 2px;
            position: relative;
          }
          .comment-number {
            color: #2563eb;
            font-weight: bold;
            font-size: 0.7em;
            vertical-align: super;
            margin-left: 1px;
            text-decoration: none;
          }
          .comment-number:hover {
            text-decoration: underline;
          }
          .comment-back-to-top {
            margin-top: 10px;
            text-align: right;
          }
          .highlighted-text {
            font-style: italic;
            color: #4b5563;
            margin-bottom: 10px;
            padding: 8px 15px;
            background-color: #fffbeb;
            border-left: 3px solid #fbbf24;
            border-radius: 0 4px 4px 0;
          }
          .text-highlight {
            background-color: rgba(251, 191, 36, 0.2);
            padding: 2px 0;
          }
          .comment-box {
            counter-increment: comment-counter;
            position: relative;
            margin-bottom: 20px;
          }
          .comment-box::before {
            content: "[" counter(comment-counter) "]";
            position: absolute;
            top: 15px;
            right: 15px;
            color: #2563eb;
            font-weight: bold;
          }
          body {
            counter-reset: comment-counter;
          }
        </style>
      </head>
      <body>
        <div class="header" id="top">
          <div class="title">Essay Evaluation Report</div>
          <div class="date">${dateString}</div>
        </div>
        
        <div class="section">
          <div class="section-title">Essay Content</div>
          <div class="essay-content">
            ${markedEssayContent}
          </div>
          <div style="font-size: 14px; text-align: right; color: #666;">
            Word Count: ${wordCount} words
          </div>
        </div>
        
        <div class="section">
          <div class="section-title">Performance Metrics</div>
          <div class="metrics">
            <div class="metric-card overall-grade">
              <div class="metric-value">${grades.overall} (${getLetterGrade(grades.overall)})</div>
              <div class="metric-label" style="color: #ccc;">Overall Grade</div>
            </div>
            <div class="metric-card">
              <div class="metric-value">${grades.grammar}</div>
              <div class="metric-label">Grammar</div>
            </div>
            <div class="metric-card">
              <div class="metric-value">${grades.vocabulary}</div>
              <div class="metric-label">Vocabulary</div>
            </div>
            <div class="metric-card">
              <div class="metric-value">${grades.fluency}</div>
              <div class="metric-label">Fluency</div>
            </div>
            <div class="metric-card">
              <div class="metric-value">${grades.coherence}</div>
              <div class="metric-label">Coherence</div>
            </div>
          </div>
        </div>
        
        <div class="section">
          <div class="section-title">Teacher's Comments</div>
          ${comments.length > 0 ? 
            `<div style="counter-reset: comment-counter;">
              ${comments.map((comment, index) => {
                const commentNumber = index + 1;
                return `
                  <div id="comment-${commentNumber}" class="comment-box${comment.resolved ? ' resolved' : ''}">
                    ${comment.highlightedText ? `
                      <div class="highlighted-text">
                        "<span class="text-highlight">${comment.highlightedText}</span>"
                      </div>
                    ` : ''}
                    <div class="comment-author">Teacher noted:</div>
                    <div class="comment-content">${comment.content}</div>
                    ${comment.resolved ? 
                      '<div class="resolved-tag" style="font-size: 0.8em; color: #047857; margin-top: 5px;">✓ This issue has been resolved</div>' : 
                      ''}
                    <div class="comment-back-to-top">
                      <a href="#top" style="font-size: 0.8em; color: #2563eb; text-decoration: none;">↑ Back to essay</a>
                    </div>
                  </div>
                `;
              }).join('')}
            </div>` : 
            '<p>No specific comments were added to this essay.</p>'
          }
        </div>
        
        <div class="section">
          <div class="section-title">Suggestions for Improvement</div>
          <ul class="improvement-list">
            <li>Focus on varied vocabulary and more precise word choice.</li>
            <li>Work on paragraph transitions to improve overall flow.</li>
            <li>Pay attention to comma usage and sentence structure.</li>
            <li>Consider adding more supporting examples to strengthen your arguments.</li>
          </ul>
        </div>
        
        <button class="print-button" onclick="window.print(); return false;">Print Report</button>
      </body>
      </html>
    `);
    
    reportWindow.document.close();
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
            onClick={generateReport}
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