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
  FaUnderline // Add this import
} from 'react-icons/fa';
import * as Tooltip from '@radix-ui/react-tooltip';
import QRCodeUploadModal from './components/QRUploadModal';
import * as Popover from '@radix-ui/react-popover';
import { ColorSelector } from './components/ColorSelector';

type MenuBarProps = {
  editor: Editor | null;
};

const MenuBar: React.FC<MenuBarProps> = ({ editor }) => {
  const [showQRCodeModal, setShowQRCodeModal] = useState(false);
  const [highlightColor, setHighlightColor] = useState('#fef08a'); // Default yellow

  if (!editor) {
    return null;
  }

  const handleFileUploaded = (file: File, extractedText?: string) => {
    if (extractedText) {
      try {
        const hasPageMarkers = extractedText.includes('--- Page');
        let sections = hasPageMarkers 
          ? extractedText.split(/---\s*Page \d+\s*---/).filter(Boolean)
          : [extractedText];

        let documentContent: any[] = [];

        sections.forEach((section, sectionIndex) => {
          if (hasPageMarkers && sectionIndex > 0) {
            documentContent.push({ type: 'horizontalRule' });
          }
          
          const paragraphs = section.split('\n\n').map(p => p.trim()).filter(Boolean);
          
          paragraphs.forEach(paragraph => {
            documentContent.push({ type: 'paragraph', content: [{ type: 'text', text: paragraph }] });
          });
        });

        const content = { type: 'doc', content: documentContent };
        editor.chain().focus().setContent(content).run();
      } catch (error) {
        console.error('Error formatting text:', error);
        editor.chain().focus().insertContent(extractedText).run();
      }
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
                >
                  <FaBold className="w-4 h-4" />
                </button>
              </Tooltip.Trigger>
              <Tooltip.Portal>
                <Tooltip.Content 
                  className="bg-slate-800 text-white px-2 py-1 rounded text-xs flex flex-col items-center"
                  sideOffset={5}
                >
                  <div>Bold</div>
                  <div className="text-slate-400">Ctrl + B</div>
                  <Tooltip.Arrow className="fill-slate-800" />
                </Tooltip.Content>
              </Tooltip.Portal>
            </Tooltip.Root>
          </Tooltip.Provider>

          <Tooltip.Provider>
            <Tooltip.Root>
              <Tooltip.Trigger asChild>
                <button
                  type="button"
                  onClick={() => editor.chain().focus().toggleItalic().run()}
                  className={`p-2 rounded hover:bg-slate-100 transition-colors ${
                    editor.isActive('italic') ? 'bg-slate-200 text-slate-900' : 'text-slate-700'
                  }`}
                >
                  <FaItalic className="w-4 h-4" />
                </button>
              </Tooltip.Trigger>
              <Tooltip.Portal>
                <Tooltip.Content 
                  className="bg-slate-800 text-white px-2 py-1 rounded text-xs flex flex-col items-center"
                  sideOffset={5}
                >
                  <div>Italic</div>
                  <div className="text-slate-400">Ctrl + I</div>
                  <Tooltip.Arrow className="fill-slate-800" />
                </Tooltip.Content>
              </Tooltip.Portal>
            </Tooltip.Root>
          </Tooltip.Provider>

          <Tooltip.Provider>
            <Tooltip.Root>
              <Tooltip.Trigger asChild>
                <button
                  type="button"
                  onClick={() => editor.chain().focus().toggleUnderline().run()}
                  className={`p-2 rounded hover:bg-slate-100 transition-colors ${
                    editor.isActive('underline') ? 'bg-slate-200 text-slate-900' : 'text-slate-700'
                  }`}
                >
                  <FaUnderline className="w-4 h-4" />
                </button>
              </Tooltip.Trigger>
              <Tooltip.Portal>
                <Tooltip.Content 
                  className="bg-slate-800 text-white px-2 py-1 rounded text-xs flex flex-col items-center"
                  sideOffset={5}
                >
                  <div>Underline</div>
                  <div className="text-slate-400">Ctrl + U</div>
                  <Tooltip.Arrow className="fill-slate-800" />
                </Tooltip.Content>
              </Tooltip.Portal>
            </Tooltip.Root>
          </Tooltip.Provider>

          {/* Highlight and Color Selection */}
          <div className="flex items-center gap-0.5">
            <Tooltip.Provider>
              <Tooltip.Root>
                <Tooltip.Trigger asChild>
                  <button
                    type="button"
                    onClick={() => editor.chain().focus().toggleHighlight({ color: highlightColor }).run()}
                    className={`p-2 rounded-l hover:bg-slate-100 transition-colors ${
                      editor.isActive('highlight') ? 'bg-slate-200 text-slate-900' : 'text-slate-700'
                    }`}
                  >
                    <div className="relative">
                      <FaHighlighter className="w-4 h-4" />
                      <div 
                        className="w-2 h-2 rounded-full absolute -bottom-0.5 -right-0.5 border border-white"
                        style={{ backgroundColor: highlightColor }}
                      />
                    </div>
                  </button>
                </Tooltip.Trigger>
                <Tooltip.Portal>
                  <Tooltip.Content 
                    className="bg-slate-800 text-white px-2 py-1 rounded text-xs flex flex-col items-center"
                    sideOffset={5}
                  >
                    <div>Highlight</div>
                    <div className="text-slate-400">Ctrl + H</div>
                    <Tooltip.Arrow className="fill-slate-800" />
                  </Tooltip.Content>
                </Tooltip.Portal>
              </Tooltip.Root>
            </Tooltip.Provider>

            <Popover.Root>
              <Popover.Trigger asChild>
                <button
                  type="button"
                  className="p-2 rounded-r border-l border-slate-200 hover:bg-slate-100 transition-colors text-slate-700"
                >
                  <div className="w-4 h-4 rounded-full border border-current"
                      style={{ backgroundColor: highlightColor }} />
                </button>
              </Popover.Trigger>
              <Popover.Portal>
                <Popover.Content
                  className="z-50"
                  sideOffset={5}
                  align="end"
                >
                  <ColorSelector
                    onColorSelect={(color) => {
                      setHighlightColor(color);
                      if (editor.isActive('highlight')) {
                        editor.chain().focus().toggleHighlight({ color }).run();
                      }
                    }}
                  />
                  <Popover.Arrow className="fill-white" />
                </Popover.Content>
              </Popover.Portal>
            </Popover.Root>
          </div>
        </div>

        {/* Structure elements */}
        <div className="flex items-center gap-1 mr-2 border-r border-slate-200 pr-2">
          <Tooltip.Provider>
            <Tooltip.Root>
              <Tooltip.Trigger asChild>
                <button
                  type="button"
                  onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
                  className={`p-2 rounded hover:bg-slate-100 transition-colors ${
                    editor.isActive('heading', { level: 2 }) ? 'bg-slate-200 text-slate-900' : 'text-slate-700'
                  }`}
                >
                  <FaHeading className="w-4 h-4" />
                </button>
              </Tooltip.Trigger>
              <Tooltip.Portal>
                <Tooltip.Content 
                  className="bg-slate-800 text-white px-2 py-1 rounded text-xs flex flex-col items-center"
                  sideOffset={5}
                >
                  <div>Heading</div>
                  <div className="text-slate-400">Ctrl + Alt + H</div>
                  <Tooltip.Arrow className="fill-slate-800" />
                </Tooltip.Content>
              </Tooltip.Portal>
            </Tooltip.Root>
          </Tooltip.Provider>

          <Tooltip.Provider>
            <Tooltip.Root>
              <Tooltip.Trigger asChild>
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
              </Tooltip.Trigger>
              <Tooltip.Portal>
                <Tooltip.Content 
                  className="bg-slate-800 text-white px-2 py-1 rounded text-xs flex flex-col items-center"
                  sideOffset={5}
                >
                  <div>Bullet List</div>
                  <div className="text-slate-400">Ctrl + Alt + B</div>
                  <Tooltip.Arrow className="fill-slate-800" />
                </Tooltip.Content>
              </Tooltip.Portal>
            </Tooltip.Root>
          </Tooltip.Provider>

          <Tooltip.Provider>
            <Tooltip.Root>
              <Tooltip.Trigger asChild>
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
              </Tooltip.Trigger>
              <Tooltip.Portal>
                <Tooltip.Content 
                  className="bg-slate-800 text-white px-2 py-1 rounded text-xs flex flex-col items-center"
                  sideOffset={5}
                >
                  <div>Numbered List</div>
                  <div className="text-slate-400">Ctrl + Alt + N</div>
                  <Tooltip.Arrow className="fill-slate-800" />
                </Tooltip.Content>
              </Tooltip.Portal>
            </Tooltip.Root>
          </Tooltip.Provider>

          <Tooltip.Provider>
            <Tooltip.Root>
              <Tooltip.Trigger asChild>
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
              </Tooltip.Trigger>
              <Tooltip.Portal>
                <Tooltip.Content 
                  className="bg-slate-800 text-white px-2 py-1 rounded text-xs flex flex-col items-center"
                  sideOffset={5}
                >
                  <div>Quote</div>
                  <div className="text-slate-400">Ctrl + Alt + Q</div>
                  <Tooltip.Arrow className="fill-slate-800" />
                </Tooltip.Content>
              </Tooltip.Portal>
            </Tooltip.Root>
          </Tooltip.Provider>
        </div>

        {/* Upload button */}
        <div className="flex items-center gap-1">
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
        </div>
      </div>

      {showQRCodeModal && (
        <QRCodeUploadModal 
          onClose={() => setShowQRCodeModal(false)}
          onFileUploaded={handleFileUploaded}
        />
      )}
    </>
  );
};

export default MenuBar;
