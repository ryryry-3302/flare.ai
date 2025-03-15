import React from 'react';
import { Editor } from '@tiptap/react';

type MenuBarProps = {
  editor: Editor | null;
};

const MenuBar: React.FC<MenuBarProps> = ({ editor }) => {
  if (!editor) {
    return null;
  }

  return (
    <div className="mb-2 flex items-center space-x-2">
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleBold().run()}
        className={`px-2 py-1 border rounded 
          ${editor.isActive('bold') ? 'bg-gray-200 font-bold' : 'bg-white'}`}
      >
        Bold
      </button>

      <button
        type="button"
        onClick={() => editor.chain().focus().toggleItalic().run()}
        className={`px-2 py-1 border rounded 
          ${editor.isActive('italic') ? 'bg-gray-200 italic' : 'bg-white'}`}
      >
        Italic
      </button>

      <button
        type="button"
        onClick={() => editor.chain().focus().toggleHighlight().run()}
        className={`px-2 py-1 border rounded 
          ${editor.isActive('highlight') ? 'bg-gray-200' : 'bg-white'}`}
      >
        Highlight
      </button>

      <button
        type="button"
        onClick={() => editor.chain().focus().undo().run()}
        className="px-2 py-1 border rounded bg-white"
      >
        Undo
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().redo().run()}
        className="px-2 py-1 border rounded bg-white"
      >
        Redo
      </button>
    </div>
  );
};

export default MenuBar;
