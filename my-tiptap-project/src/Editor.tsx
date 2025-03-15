import React, { useState, useEffect } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Highlight from '@tiptap/extension-highlight';
import MenuBar from './MenuBar';
import BulletList from '@tiptap/extension-bullet-list';
import OrderedList from '@tiptap/extension-ordered-list';
import Blockquote from '@tiptap/extension-blockquote';
import ListItem from '@tiptap/extension-list-item';
import { FaChartBar, FaChartLine, FaFont, FaClock } from 'react-icons/fa';
import MetricsPanel from './components/MetricsPanel';
import EditorStats from './components/EditorStats';

const Editor = () => {
  const [showMetrics, setShowMetrics] = useState(false);
  const [showInsights, setShowInsights] = useState(false);
  const [wordCount, setWordCount] = useState(0);
  
  const editor = useEditor({
    extensions: [
      StarterKit,
      Highlight,
      BulletList,
      OrderedList,
      Blockquote,
      ListItem,
    ],
    content: `
      <h2>Welcome to the Essay Editor</h2>
      <p>This is a rich text editor designed for reviewing and editing essays.</p>
      <ul>
        <li>Try creating bullet points</li>
        <li>Or format your text</li>
      </ul>
      <blockquote>Add quotes for important passages</blockquote>
    `,
    onUpdate: ({ editor }) => {
      // Update word count when content changes
      const text = editor.getText();
      const words = text.trim().split(/\s+/);
      setWordCount(text.trim() ? words.length : 0);
    }
  });

  // Initial word count calculation
  useEffect(() => {
    if (editor) {
      const text = editor.getText();
      const words = text.trim().split(/\s+/);
      setWordCount(text.trim() ? words.length : 0);
    }
  }, [editor]);

  return (
    <div className="border rounded-md overflow-hidden bg-white">
      <div className="flex items-center justify-between bg-slate-100 px-3 py-2 border-b">
        <h2 className="text-slate-700 font-medium">Essay Editor</h2>
        <div className="flex gap-2">
          <button
            onClick={() => setShowInsights(!showInsights)}
            className="flex items-center gap-1 px-3 py-1 bg-slate-200 hover:bg-slate-300 text-slate-700 text-sm font-medium rounded transition-colors"
          >
            <FaChartLine className="w-4 h-4" />
            Live Insights
          </button>
          <button
            onClick={() => setShowMetrics(true)}
            className="flex items-center gap-1 px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded transition-colors"
          >
            <FaChartBar className="w-4 h-4" />
            View Analysis
          </button>
        </div>
      </div>
      
      <MenuBar editor={editor} />
      
      <div className="flex">
        {/* Main editor */}
        <div className={`${showInsights ? 'w-2/3' : 'w-full'} transition-all duration-300`}>
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
        
        {/* Live insights panel (collapsible) */}
        {showInsights && (
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