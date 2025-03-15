import { Extension, Mark, markPasteRule } from '@tiptap/core';
import { Plugin, PluginKey } from '@tiptap/pm/state';
import { v4 as uuidv4 } from 'uuid';

interface CommentOptions {
  HTMLAttributes: Record<string, any>;
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    comment: {
      /**
       * Add a comment mark to selected text
       */
      setComment: (id: string) => ReturnType;
      /**
       * Remove a comment mark
       */
      unsetComment: () => ReturnType;
    };
  }
}

// Create a Comment mark extension
export const CommentMark = Mark.create<CommentOptions>({
  name: 'comment',
  
  addOptions() {
    return {
      HTMLAttributes: {},
    };
  },
  
  addAttributes() {
    return {
      id: {
        default: null,
        parseHTML: element => element.getAttribute('data-comment-id'),
        renderHTML: attributes => {
          if (!attributes.id) {
            return {};
          }
          
          return {
            'data-comment-id': attributes.id,
          };
        },
      },
    };
  },
  
  parseHTML() {
    return [
      {
        tag: 'span[data-comment-id]',
        getAttrs: element => {
          if (typeof element === 'string') return {};
          
          return {
            id: element.getAttribute('data-comment-id'),
          };
        },
      },
    ];
  },
  
  renderHTML({ HTMLAttributes }) {
    return ['span', { ...HTMLAttributes, class: 'comment-marker bg-yellow-100' }, 0];
  },
  
  addCommands() {
    return {
      setComment: id => ({ commands }) => {
        return commands.setMark(this.name, { id });
      },
      unsetComment: () => ({ commands }) => {
        return commands.unsetMark(this.name);
      },
    };
  },
});

// Main Comment Extension that includes the mark and adds UI functionality
export const Comment = Extension.create({
  name: 'comment',
  
  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: new PluginKey('comment'),
        props: {
          handleClick(view, pos) {
            const { doc } = view.state;
            const commentMarks = doc.type.schema.marks.comment;
            
            if (!commentMarks) return false;
            
            const resolvedPos = doc.resolve(pos);
            const marks = resolvedPos.marks();
            
            // Find comment mark on click position
            const commentMark = marks.find(mark => mark.type === commentMarks);
            
            if (commentMark) {
              // Dispatch a custom event that we can listen to in our React components
              const event = new CustomEvent('commentClick', { 
                detail: { id: commentMark.attrs.id, position: pos } 
              });
              document.dispatchEvent(event);
              
              return true;
            }
            
            return false;
          },
        },
      }),
    ];
  },
});