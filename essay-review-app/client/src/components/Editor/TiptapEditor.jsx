import React, { useEffect, useRef, useState, useContext } from 'react';
import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { EditorContext } from '../../context/EditorContext';
import { useAIAnalysis } from '../../hooks/useAIAnalysis';
import SuggestionHighlighter from './SuggestionHighlighter';
import FormattingBar from './FormattingBar';

const TiptapEditor = () => {
    const { editorState, setEditorState } = useContext(EditorContext);
    const editor = useEditor({
        extensions: [StarterKit],
        content: editorState,
        onUpdate: ({ editor }) => {
            setEditorState(editor.getHTML());
        },
    });

    const [suggestions, setSuggestions] = useState([]);

    const handleAnalyzeText = async () => {
        const analysisResults = await useAIAnalysis(editor.getText());
        setSuggestions(analysisResults.suggestions);
    };

    useEffect(() => {
        if (editor) {
            editor.on('blur', handleAnalyzeText);
        }
    }, [editor]);

    return (
        <div className="tiptap-editor">
            <FormattingBar editor={editor} />
            <EditorContent editor={editor} />
            <SuggestionHighlighter suggestions={suggestions} />
        </div>
    );
};

export default TiptapEditor;