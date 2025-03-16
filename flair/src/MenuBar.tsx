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
  FaUpload,
  FaUnderline, 
  FaStrikethrough,
  FaPalette,
  FaEraser // <-- Add this new icon
} from 'react-icons/fa';
import * as Tooltip from '@radix-ui/react-tooltip';
import * as Popover from '@radix-ui/react-popover';
import QRCodeUploadModal from './components/QRUploadModal';
import { ColorSelector } from './components/ColorSelector';

type MenuBarProps = {
  editor: Editor | null;
};

const MenuBar: React.FC<MenuBarProps> = ({ editor }) => {
  const [showQRCodeModal, setShowQRCodeModal] = useState(false);

  // For highlight color
  const [highlightColor, setHighlightColor] = useState('#fef08a'); // default highlight is yellow

  // For text color
  const [selectedTextColor, setSelectedTextColor] = useState('#333');

  // Some palette to pick from
  const colors = [

    
    // Main colors
    '#DB4437', // Red
    '#FF5722', // Deep Orange
    '#FF9800', // Orange
    '#FFCA28', // Amber
    '#FDD835', // Yellow
    
    // Greens and blues
    '#66BB6A', // Green
    '#26A69A', // Teal
    '#29B6F6', // Light Blue
    '#2196F3', // Blue
    '#5C6BC0', // Indigo
    
    // Purples and pinks
    '#7E57C2', // Deep Purple
    '#AB47BC', // Purple
    '#EC407A', // Pink
  ];

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
            documentContent.push({
              type: 'paragraph',
              content: [{ type: 'text', text: paragraph }]
            });
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
      <div className="mb-1 p-2 bg-white border border-slate-200 rounded-md shadow-sm flex flex-wrap items-center gap-1 relative">
        {/* Upload button - moved to the far left */}
        <div className="flex items-center gap-1 mr-2 border-r border-slate-200 pr-2">
          <Tooltip.Provider>
            <Tooltip.Root>
              <Tooltip.Trigger asChild>
                <button
                  type="button"
                  onClick={() => setShowQRCodeModal(true)}
                  className="p-2 rounded hover:bg-slate-100 transition-colors text-slate-700 flex items-center gap-1"
                >
                  <FaUpload className="w-4 h-4" />
                  <span className="text-sm">Upload File</span>
                </button>
              </Tooltip.Trigger>
              <Tooltip.Portal>
                <Tooltip.Content className="bg-slate-800 text-white px-2 py-1 rounded text-xs">
                  Upload Photo/PDF
                  <Tooltip.Arrow className="fill-slate-800" />
                </Tooltip.Content>
              </Tooltip.Portal>
            </Tooltip.Root>
          </Tooltip.Provider>
        </div>

        {/* Text formatting */}
        <div className="flex items-center gap-1 mr-2 border-r border-slate-200 pr-2">
          {/* Bold */}
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

          {/* Italic */}
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

          {/* Underline */}
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

          {/* Strike-through */}
          <Tooltip.Provider>
            <Tooltip.Root>
              <Tooltip.Trigger asChild>
                <button
                  type="button"
                  onClick={() => editor.chain().focus().toggleStrike().run()}
                  className={`p-2 rounded hover:bg-slate-100 transition-colors ${
                    editor.isActive('strike') ? 'bg-slate-200 text-slate-900' : 'text-slate-700'
                  }`}
                >
                  <FaStrikethrough className="w-4 h-4" />
                </button>
              </Tooltip.Trigger>
              <Tooltip.Portal>
                <Tooltip.Content 
                  className="bg-slate-800 text-white px-2 py-1 rounded text-xs flex flex-col items-center"
                  sideOffset={5}
                >
                  <div>Strike-through</div>
                  <Tooltip.Arrow className="fill-slate-800" />
                </Tooltip.Content>
              </Tooltip.Portal>
            </Tooltip.Root>
          </Tooltip.Provider>

          {/* Text color button - with prettier palette */}
          <Popover.Root>
            <Popover.Trigger asChild>
              <button
                type="button"
                className="p-2 rounded hover:bg-slate-100 transition-colors text-slate-700"
              >
                <div className="relative">
                  <FaPalette className="w-4 h-4" />
                  <div 
                    className="w-2 h-2 rounded-full absolute -bottom-0.5 -right-0.5 border border-white"
                    style={{ backgroundColor: selectedTextColor }}
                  />
                </div>
              </button>
            </Popover.Trigger>
            <Popover.Portal>
              <Popover.Content
                className="z-50 bg-white border border-slate-200 rounded shadow-md p-3 w-48"
                sideOffset={5}
              >
                <div className="grid grid-cols-5 gap-2">

                  
                  {/* Color grid */}
                  {colors.slice(1).map(color => (
                    <button
                      key={color}
                      onClick={() => {
                        setSelectedTextColor(color);
                        editor.chain().focus().setColor(color).run();
                      }}
                      className="w-7 h-7 rounded-full border border-slate-300 hover:scale-110 transition-transform"
                      style={{ backgroundColor: color }}
                      title={color}
                    />
                  ))}
                </div>
                
                {/* Reset button */}
                <div className="mt-2 pt-2 border-t border-slate-200">
                  <button
                    onClick={() => {
                      editor.chain().focus().unsetColor().run();
                      setSelectedTextColor('#000000');
                    }}
                    className="text-xs text-slate-600 hover:text-blue-600 flex items-center justify-center w-full"
                  >
                    Reset to default
                  </button>
                </div>
                <Popover.Arrow className="fill-white" />
              </Popover.Content>
            </Popover.Portal>
          </Popover.Root>

          {/* Highlight + highlight-color selection */}
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
                  <div 
                    className="w-4 h-4 rounded-full border border-current"
                    style={{ backgroundColor: highlightColor }} 
                  />
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
            
            {/* Clear Formatting Button - moved after highlighter */}
            <Tooltip.Provider>
              <Tooltip.Root>
                <Tooltip.Trigger asChild>
                  <button
                    type="button"
                    onClick={() => editor.chain().focus().clearNodes().unsetAllMarks().run()}
                    className="p-2 rounded hover:bg-slate-100 transition-colors"
                  >
                    <FaEraser className="w-4 h-4" />
                  </button>
                </Tooltip.Trigger>
                <Tooltip.Portal>
                  <Tooltip.Content 
                    className="bg-slate-800 text-white px-2 py-1 rounded text-xs flex flex-col items-center"
                    sideOffset={5}
                  >
                    <div>Clear Formatting</div>
                    <Tooltip.Arrow className="fill-slate-800" />
                  </Tooltip.Content>
                </Tooltip.Portal>
              </Tooltip.Root>
            </Tooltip.Provider>
          </div>
        </div>

        {/* Structure elements */}
        <div className="flex items-center gap-1 mr-2 border-r border-slate-200 pr-2">
          {/* Heading */}
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

          {/* Bullet List */}
          <Tooltip.Provider>
            <Tooltip.Root>
              <Tooltip.Trigger asChild>
                <button
                  type="button"
                  onClick={() => editor.chain().focus().toggleBulletList().run()}
                  className={`p-2 rounded hover:bg-slate-100 transition-colors ${
                    editor.isActive('bulletList') ? 'bg-slate-200 text-slate-900' : 'text-slate-700'
                  }`}
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

          {/* Numbered List */}
          <Tooltip.Provider>
            <Tooltip.Root>
              <Tooltip.Trigger asChild>
                <button
                  type="button"
                  onClick={() => editor.chain().focus().toggleOrderedList().run()}
                  className={`p-2 rounded hover:bg-slate-100 transition-colors ${
                    editor.isActive('orderedList') ? 'bg-slate-200 text-slate-900' : 'text-slate-700'
                  }`}
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

          {/* Quote */}
          <Tooltip.Provider>
            <Tooltip.Root>
              <Tooltip.Trigger asChild>
                <button
                  type="button"
                  onClick={() => editor.chain().focus().toggleBlockquote().run()}
                  className={`p-2 rounded hover:bg-slate-100 transition-colors ${
                    editor.isActive('blockquote') ? 'bg-slate-200 text-slate-900' : 'text-slate-700'
                  }`}
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

        {/* Undo and Redo Buttons */}
        <Tooltip.Provider>
          <Tooltip.Root>
            <Tooltip.Trigger asChild>
              <button
                type="button"
                onClick={() => editor.chain().focus().undo().run()}
                className="p-2 rounded hover:bg-slate-100 transition-colors"
              >
                <FaUndo className="w-4 h-4" />
              </button>
            </Tooltip.Trigger>
            <Tooltip.Portal>
              <Tooltip.Content 
                className="bg-slate-800 text-white px-2 py-1 rounded text-xs flex flex-col items-center"
                sideOffset={5}
              >
                <div>Undo</div>
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
                onClick={() => editor.chain().focus().redo().run()}
                className="p-2 rounded hover:bg-slate-100 transition-colors"
              >
                <FaRedo className="w-4 h-4" />
              </button>
            </Tooltip.Trigger>
            <Tooltip.Portal>
              <Tooltip.Content 
                className="bg-slate-800 text-white px-2 py-1 rounded text-xs flex flex-col items-center"
                sideOffset={5}
              >
                <div>Redo</div>
                <Tooltip.Arrow className="fill-slate-800" />
              </Tooltip.Content>
            </Tooltip.Portal>
          </Tooltip.Root>
        </Tooltip.Provider>
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
