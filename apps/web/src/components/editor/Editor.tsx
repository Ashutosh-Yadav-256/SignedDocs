import React, { useState, useEffect } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Collaboration from '@tiptap/extension-collaboration';
import Placeholder from '@tiptap/extension-placeholder';
import Typography from '@tiptap/extension-typography';
import * as Y from 'yjs';
import { EditorToolbar } from './EditorToolbar.js';
import { Clock, ShieldCheck, User } from 'lucide-react';

export interface EditorProps {
  ydoc: Y.Doc;
  onFlushCommit?: () => void;
  documentTitle: string;
  authorName?: string;
  authorFingerprint?: string;
  authorColor?: string;
}

export const Editor: React.FC<EditorProps> = ({
  ydoc,
  onFlushCommit,
  documentTitle,
  authorName = 'Ashutosh Yadav',
  authorFingerprint = 'hermes:author',
  authorColor = '#7A8B7B',
}) => {
  const [wordCount, setWordCount] = useState(0);
  const [charCount, setCharCount] = useState(0);
  const [readTimeMinutes, setReadTimeMinutes] = useState(1);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        history: false, // History managed by Yjs CRDT
      }),
      Collaboration.configure({
        document: ydoc,
        field: 'default',
      }),
      Placeholder.configure({
        placeholder: 'Tell your story... All words are cryptographically signed to the immutable Merkle DAG.',
      }),
      Typography,
    ],
    editorProps: {
      attributes: {
        class: 'prose max-w-none focus:outline-none min-h-[560px] text-charcoal',
      },
    },
    onUpdate: ({ editor }) => {
      const text = editor.getText();
      const words = text.trim().split(/\s+/).filter((w) => w.length > 0).length;
      setWordCount(words);
      setCharCount(text.length);
      setReadTimeMinutes(Math.max(1, Math.ceil(words / 200)));
    },
  });

  useEffect(() => {
    if (editor) {
      const text = editor.getText();
      const words = text.trim().split(/\s+/).filter((w) => w.length > 0).length;
      setWordCount(words);
      setCharCount(text.length);
      setReadTimeMinutes(Math.max(1, Math.ceil(words / 200)));
    }
  }, [editor]);

  return (
    <div className="flex flex-col bg-cream-light border border-cream-border rounded-lg overflow-hidden">
      {/* Formatting Toolbar */}
      <EditorToolbar editor={editor} onFlushCommit={onFlushCommit} />

      {/* Medium-Style Long-Form Publication Canvas */}
      <div className="w-full px-5 sm:px-10 md:px-14 py-8 max-w-3xl mx-auto">
        {/* Article Byline Metadata Header */}
        <div className="border-b border-cream-border pb-6 mb-8 font-sans">
          {/* Document Title Header */}
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-charcoal font-serif mb-4 leading-tight">
            {documentTitle}
          </h1>

          {/* Author Byline Row */}
          <div className="flex flex-wrap items-center justify-between gap-4 pt-1">
            <div className="flex items-center space-x-3">
              {/* Author Avatar */}
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center text-cream font-bold text-sm"
                style={{ backgroundColor: authorColor }}
              >
                {authorName.slice(0, 1).toUpperCase()}
              </div>

              <div className="space-y-0.5">
                <div className="flex items-center space-x-2">
                  <span className="font-semibold text-sm text-charcoal">{authorName}</span>
                  <span className="text-xs text-sage flex items-center gap-1 bg-sage/10 px-1.5 py-0.5 rounded border border-sage/30 font-medium">
                    <ShieldCheck className="w-3 h-3" />
                    ECDSA P-256
                  </span>
                </div>

                <div className="flex items-center space-x-2 text-xs text-charcoal-muted">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {readTimeMinutes} min read
                  </span>
                  <span>•</span>
                  <span>{new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                  <span>•</span>
                  <span className="font-mono text-[10px] text-charcoal-muted">
                    {authorFingerprint.slice(0, 14)}...
                  </span>
                </div>
              </div>
            </div>

            {/* Word Count / Live Provenance Tag */}
            <div className="flex items-center space-x-2 text-xs text-charcoal-muted font-mono bg-cream px-2.5 py-1 rounded border border-cream-border">
              <span>{wordCount} words</span>
              <span>•</span>
              <span>{charCount} chars</span>
            </div>
          </div>
        </div>

        {/* Editor Body */}
        <div className="article-body">
          <EditorContent editor={editor} />
        </div>
      </div>
    </div>
  );
};
