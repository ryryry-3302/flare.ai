import React from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Highlight from '@tiptap/extension-highlight';
import MenuBar from './MenuBar';

const Editor: React.FC = () => {
  // Initialize the editor with some default content or keep it blank
  const editor = useEditor({
    extensions: [
      StarterKit,
      Highlight.configure({ multicolor: true }), 
    ],
    content: `
      <h2>Welcome to the Essay Review Tool</h2>
      <p>Type or paste an essay here, then use the highlight feature or styling tools to mark it up.</p>
    `
  });

  return (
    <div>
      <MenuBar editor={editor} />
      <EditorContent editor={editor} className="tiptap-editor" />
    </div>
  );
};

export default Editor;
