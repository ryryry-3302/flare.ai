import React from 'react';

const FormattingBar = ({ onFormat }) => {
    const handleBold = () => {
        onFormat('bold');
    };

    const handleItalic = () => {
        onFormat('italic');
    };

    const handleUnderline = () => {
        onFormat('underline');
    };

    const handleStrikeThrough = () => {
        onFormat('strikeThrough');
    };

    const handleBulletList = () => {
        onFormat('bulletList');
    };

    const handleNumberedList = () => {
        onFormat('numberedList');
    };

    return (
        <div className="formatting-bar">
            <button onClick={handleBold}>B</button>
            <button onClick={handleItalic}>I</button>
            <button onClick={handleUnderline}>U</button>
            <button onClick={handleStrikeThrough}>S</button>
            <button onClick={handleBulletList}>•</button>
            <button onClick={handleNumberedList}>1.</button>
        </div>
    );
};

export default FormattingBar;