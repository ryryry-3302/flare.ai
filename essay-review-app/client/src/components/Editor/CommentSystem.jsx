import React, { useState } from 'react';

const CommentSystem = ({ comments, onAddComment }) => {
    const [newComment, setNewComment] = useState('');

    const handleCommentChange = (event) => {
        setNewComment(event.target.value);
    };

    const handleAddComment = () => {
        if (newComment.trim()) {
            onAddComment(newComment);
            setNewComment('');
        }
    };

    return (
        <div className="comment-system">
            <h3>Comments</h3>
            <div className="comments-list">
                {comments.map((comment, index) => (
                    <div key={index} className="comment">
                        {comment}
                    </div>
                ))}
            </div>
            <div className="comment-input">
                <textarea
                    value={newComment}
                    onChange={handleCommentChange}
                    placeholder="Add your comment here..."
                />
                <button onClick={handleAddComment}>Add Comment</button>
            </div>
        </div>
    );
};

export default CommentSystem;