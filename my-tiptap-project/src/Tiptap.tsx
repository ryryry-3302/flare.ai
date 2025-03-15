import { EditorProvider, FloatingMenu, BubbleMenu } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'

// define your extension array
const extensions = [StarterKit]

const content = '<p>Hello World! Start writing your essay here...</p>'

const Tiptap = () => {
  return (
    <div className="w-full max-w-4xl mx-auto">
      <EditorProvider
        extensions={extensions}
        content={content}
        editorProps={{
          attributes: {
            class: 'tiptap-editor focus:outline-none prose prose-slate max-w-none',
          },
        }}
      >
        <FloatingMenu className="bg-white shadow-lg rounded-md p-2 flex gap-1" editor={null}>
          <button className="p-1 hover:bg-slate-100 rounded">H1</button>
          <button className="p-1 hover:bg-slate-100 rounded">H2</button>
          <button className="p-1 hover:bg-slate-100 rounded">List</button>
        </FloatingMenu>
        <BubbleMenu className="bg-white shadow-lg rounded-md p-2 flex gap-1" editor={null}>
          <button className="p-1 hover:bg-slate-100 rounded">Bold</button>
          <button className="p-1 hover:bg-slate-100 rounded">Italic</button>
          <button className="p-1 hover:bg-slate-100 rounded">Link</button>
        </BubbleMenu>
      </EditorProvider>
    </div>
  )
}

export default Tiptap