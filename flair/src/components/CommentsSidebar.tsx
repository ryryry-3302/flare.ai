import React, { useState, useEffect } from 'react';
import { FaComment, FaCheck, FaTimes, FaPlus } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
import { Editor } from '@tiptap/react';
import { v4 as uuidv4 } from 'uuid';

export interface CommentData {
  id: string;
  content: string;
  highlightedText?: string;
  resolved?: boolean;
  timestamp: number;
  selection?: { from: number; to: number };
}

interface CommentsSidebarProps {
  editor: Editor | null;
  comments: CommentData[];
  setComments: React.Dispatch<React.SetStateAction<CommentData[]>>;
  activeCommentId: string | null;
  setActiveCommentId: React.Dispatch<React.SetStateAction<string | null>>;
}

const CommentsSidebar: React.FC<CommentsSidebarProps> = ({
  editor,
  comments,
  setComments,
  activeCommentId,
  setActiveCommentId
}) => {
  const [newComment, setNewComment] = useState('');

  // When a comment is clicked in the document
  useEffect(() => {
    const handleCommentClick = (e: CustomEvent) => {
      setActiveCommentId(e.detail.id);
    };

    document.addEventListener('commentClick', handleCommentClick as EventListener);
    
    return () => {
      document.removeEventListener('commentClick', handleCommentClick as EventListener);
    };
  }, [setActiveCommentId]);

  const addComment = () => {
    if (!editor || !newComment.trim()) return;
    
    const { from, to } = editor.state.selection;
    if (from === to) {
      alert('Please select some text to comment on.');
      return;
    }
    
    // Generate a new, real comment ID
    const id = uuidv4();
    
    // Remove any "pending" highlight first,
    // then apply the real comment mark with the generated ID.
    editor.commands.unsetComment('pending');
    editor.commands.setComment(id);
    
    // Get the selected text
    const selectedText = editor.state.doc.textBetween(from, to);
    
    // Create comment in our data structure
    const comment: CommentData = {
      id,
      content: newComment,
      highlightedText: selectedText,
      resolved: false,
      timestamp: Date.now(),
      selection: { from, to }
    };
    
    setComments([...comments, comment]);
    
    setNewComment('');
    setActiveCommentId(id);
  };

  const resolveComment = (id: string) => {
    setComments(comments.map(c => 
      c.id === id ? { ...c, resolved: true } : c
    ));
  };

  const deleteComment = (id: string) => {
    // Need to remove the mark from the text if we can find it
    if (editor) {
      // This approach is simplified - in a real app you might need more sophisticated
      // logic to find and remove the specific mark
      editor.state.doc.descendants((node, pos) => {
        const marks = node.marks.filter(mark => 
          mark.type.name === 'comment' && mark.attrs.id === id
        );
        
        if (marks.length && node.isText) {
          editor.chain().setTextSelection({ from: pos, to: pos + node.nodeSize }).unsetComment().run();
        }
        
        return true;
      });
    }
    
    setComments(comments.filter(c => c.id !== id));
    
    if (activeCommentId === id) {
      setActiveCommentId(null);
    }
  };

  // Scroll to text when comment is clicked
  const scrollToComment = (comment: CommentData) => {
    if (!editor || !comment.selection) return;
    
    editor.commands.setTextSelection(comment.selection);
    editor.commands.scrollIntoView();
    setActiveCommentId(comment.id);
  };

  const removeAllComments = () => {
    // First, remove all comment marks from the text
    if (editor) {
      editor.state.doc.descendants((node, pos) => {
        const marks = node.marks.filter(mark => 
          mark.type.name === 'comment'
        );
        
        if (marks.length && node.isText) {
          editor.chain()
            .setTextSelection({ from: pos, to: pos + node.nodeSize })
            .unsetComment()
            .run();
        }
        
        return true;
      });
    }
    
    // Then clear the comments array
    setComments([]);
    setActiveCommentId(null);
  };

  // Add a confirmation dialog to prevent accidental deletions
  const handleRemoveAll = () => {
    if (window.confirm('Are you sure you want to remove all comments? This action cannot be undone.')) {
      removeAllComments();
    }
  };

  return (
    <div className="border-l border-slate-200 bg-white h-full overflow-y-auto">
      <div className="p-3 border-b border-slate-200">
        <div className="flex justify-between items-center mb-2">
          <h3 className="text-lg font-semibold">Comments</h3>
          
          {/* Remove All button */}
          {comments.length > 0 && (
            <button
              onClick={handleRemoveAll}
              className="text-xs px-2 py-1 bg-red-50 text-red-600 rounded hover:bg-red-100 transition-colors flex items-center"
              title="Remove all comments"
            >
              <FaTimes className="mr-1" /> Remove All
            </button>
          )}
        </div>
        
        <div className="flex">
          <textarea
            className="flex-grow p-2 border border-slate-300 rounded-l text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
            placeholder="Add a new comment..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            rows={2}
          />
          <button
            className="bg-blue-600 text-white px-3 rounded-r hover:bg-blue-700 transition-colors"
            onClick={addComment}
            disabled={!editor || !newComment.trim()}
          >
            <FaPlus />
          </button>
        </div>
        <p className="text-xs text-slate-500 mt-1">
          Select text in the document before adding a comment
        </p>
      </div>
      
      <div className="p-2">
        {comments.length === 0 ? (
          <div className="text-center py-4 text-slate-500">
            No comments yet
          </div>
        ) : (
          <AnimatePresence>
            {comments.map(comment => (
              <motion.div 
                key={comment.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, height: 0 }}
                className={`mb-2 border p-3 rounded-md ${comment.resolved ? 'bg-slate-50' : 'bg-white'} 
                  ${activeCommentId === comment.id ? 'ring-2 ring-blue-400' : ''}`}
                onClick={() => scrollToComment(comment)}
              >
                <div className="flex justify-between items-start mb-1">
                  <div className="font-medium text-sm flex items-center">
                    <FaComment className="mr-1 text-blue-500" />
                  </div>
                  <div className="text-xs text-slate-500">
                    {new Date(comment.timestamp).toLocaleTimeString([], {
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })}
                  </div>
                </div>
                
                <p className={`text-sm mb-2 ${comment.resolved ? 'text-slate-500 line-through' : ''}`}>
                  {comment.content}
                </p>
                
                <div className="flex justify-end space-x-1">
                  {!comment.resolved && (
                    <button
                      className="text-xs px-2 py-1 bg-green-50 text-green-600 rounded hover:bg-green-100 transition-colors flex items-center"
                      onClick={(e) => {
                        e.stopPropagation();
                        resolveComment(comment.id);
                      }}
                    >
                      <FaCheck className="mr-1" /> Resolve
                    </button>
                  )}
                  <button
                    className="text-xs px-2 py-1 bg-red-50 text-red-600 rounded hover:bg-red-100 transition-colors flex items-center"
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteComment(comment.id);
                    }}
                  >
                    <FaTimes className="mr-1" /> Remove
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
};

export default CommentsSidebar;