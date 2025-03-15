import React, { useState } from 'react';
import { Editor } from '@tiptap/react';
import { 
  FaBold, 
  FaItalic, 
  FaHighlighter, 
  FaUndo, 
  FaRedo,
  FaListUl,
  FaListOl,
  FaQuoteRight,
  FaHeading,
  FaLink,
  FaUpload,
  FaChartBar
} from 'react-icons/fa';
import * as Tooltip from '@radix-ui/react-tooltip';
import QRCodeUploadModal from './components/QRUploadModal';
import MetricsPanel from './components/MetricsPanel';

type MenuBarProps = {
  editor: Editor | null;
};

const MenuBar: React.FC<MenuBarProps> = ({ editor }) => {
  const [showQRCodeModal, setShowQRCodeModal] = useState(false);
  const [showMetricsPanel, setShowMetricsPanel] = useState(false);
  const [metricsRegenerateKey, setMetricsRegenerateKey] = useState(0);

  if (!editor) {
    return null;
  }

  const handleShowMetrics = () => {
    // Increment regeneration key to trigger new scores
    setMetricsRegenerateKey(prev => prev + 1);
    setShowMetricsPanel(true);
  };

  const handleFileUploaded = (file: File, extractedText?: string) => {
    // If we have extracted text, insert it into the editor
    if (extractedText) {
      editor.chain().focus().insertContent(extractedText).run();
    } 
    // If it's an image and we want to insert it (optional)
    else {
      editor.chain().focus().insertContent("Error extracting text").run();
    }
  };

  return (
    <>
      <div className="mb-4 p-2 bg-white border border-slate-200 rounded-md shadow-sm flex flex-wrap items-center gap-1">
        {/* Text formatting */}
        <div className="flex items-center gap-1 mr-2 border-r border-slate-200 pr-2">
          <Tooltip.Provider>
            <Tooltip.Root>
              <Tooltip.Trigger asChild>
                <button
                  type="button"
                  onClick={() => editor.chain().focus().toggleBold().run()}
                  className={`p-2 rounded hover:bg-slate-100 transition-colors ${
                    editor.isActive('bold') ? 'bg-slate-200 text-slate-900' : 'text-slate-700'
                  }`}
                  title="Bold"
                >
                  <FaBold className="w-4 h-4" />
                </button>
              </Tooltip.Trigger>
              <Tooltip.Portal>
                <Tooltip.Content className="bg-slate-800 text-white px-2 py-1 rounded text-xs">
                  Bold
                  <Tooltip.Arrow className="fill-slate-800" />
                </Tooltip.Content>
              </Tooltip.Portal>
            </Tooltip.Root>
          </Tooltip.Provider>

          <button
            type="button"
            onClick={() => editor.chain().focus().toggleItalic().run()}
            className={`p-2 rounded hover:bg-slate-100 transition-colors ${
              editor.isActive('italic') ? 'bg-slate-200 text-slate-900' : 'text-slate-700'
            }`}
            title="Italic"
          >
            <FaItalic className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() => editor.chain().focus().toggleHighlight().run()}
            className={`p-2 rounded hover:bg-slate-100 transition-colors ${
              editor.isActive('highlight') ? 'bg-slate-200 text-slate-900' : 'text-slate-700'
            }`}
            title="Highlight"
          >
            <FaHighlighter className="w-4 h-4" />
          </button>
        </div>

        {/* Structure elements */}
        <div className="flex items-center gap-1 mr-2 border-r border-slate-200 pr-2">
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            className={`p-2 rounded hover:bg-slate-100 transition-colors ${
              editor.isActive('heading', { level: 2 }) ? 'bg-slate-200 text-slate-900' : 'text-slate-700'
            }`}
            title="Heading"
          >
            <FaHeading className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            className={`p-2 rounded hover:bg-slate-100 transition-colors ${
              editor.isActive('bulletList') ? 'bg-slate-200 text-slate-900' : 'text-slate-700'
            }`}
            title="Bullet List"
          >
            <FaListUl className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            className={`p-2 rounded hover:bg-slate-100 transition-colors ${
              editor.isActive('orderedList') ? 'bg-slate-200 text-slate-900' : 'text-slate-700'
            }`}
            title="Numbered List"
          >
            <FaListOl className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
            className={`p-2 rounded hover:bg-slate-100 transition-colors ${
              editor.isActive('blockquote') ? 'bg-slate-200 text-slate-900' : 'text-slate-700'
            }`}
            title="Quote"
          >
            <FaQuoteRight className="w-4 h-4" />
          </button>
        </div>

        <div className="flex items-center gap-1">
          {/* Upload Button */}
          <Tooltip.Provider>
            <Tooltip.Root>
              <Tooltip.Trigger asChild>
                <button
                  type="button"
                  onClick={() => setShowQRCodeModal(true)}
                  className="p-2 rounded hover:bg-slate-100 transition-colors text-slate-700"
                >
                  <FaUpload className="w-4 h-4" />
                </button>
              </Tooltip.Trigger>
              <Tooltip.Portal>
                <Tooltip.Content className="bg-slate-800 text-white px-2 py-1 rounded text-xs">
                  Upload Photo
                  <Tooltip.Arrow className="fill-slate-800" />
                </Tooltip.Content>
              </Tooltip.Portal>
            </Tooltip.Root>
          </Tooltip.Provider>
          
          {/* Metrics Button */}
          <Tooltip.Provider>
            <Tooltip.Root>
              <Tooltip.Trigger asChild>
                <button
                  type="button"
                  onClick={handleShowMetrics}
                  className="p-2 rounded hover:bg-slate-100 transition-colors text-slate-700"
                >
                  <FaChartBar className="w-4 h-4" />
                </button>
              </Tooltip.Trigger>
              <Tooltip.Portal>
                <Tooltip.Content className="bg-slate-800 text-white px-2 py-1 rounded text-xs">
                  View Metrics
                  <Tooltip.Arrow className="fill-slate-800" />
                </Tooltip.Content>
              </Tooltip.Portal>
            </Tooltip.Root>
          </Tooltip.Provider>
        </div>

        {/* History */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => editor.chain().focus().undo().run()}
            disabled={!editor.can().undo()}
            className={`p-2 rounded hover:bg-slate-100 transition-colors ${
              !editor.can().undo() ? 'opacity-50 cursor-not-allowed' : 'text-slate-700'
            }`}
            title="Undo"
          >
            <FaUndo className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() => editor.chain().focus().redo().run()}
            disabled={!editor.can().redo()}
            className={`p-2 rounded hover:bg-slate-100 transition-colors ${
              !editor.can().redo() ? 'opacity-50 cursor-not-allowed' : 'text-slate-700'
            }`}
            title="Redo"
          >
            <FaRedo className="w-4 h-4" />
          </button>
        </div>
      </div>
      
      {/* QR Code Upload Modal */}
      {showQRCodeModal && (
        <QRCodeUploadModal 
          onClose={() => setShowQRCodeModal(false)}
          onFileUploaded={handleFileUploaded}
        />
      )}
      
      {/* Metrics Panel */}
      {showMetricsPanel && (
        <MetricsPanel 
          onClose={() => setShowMetricsPanel(false)}
          regenerateKey={metricsRegenerateKey}
        />
      )}
    </>
  );
};

export default MenuBar;