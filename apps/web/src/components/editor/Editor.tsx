import React from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Collaboration from '@tiptap/extension-collaboration';
import Placeholder from '@tiptap/extension-placeholder';
import Typography from '@tiptap/extension-typography';
import * as Y from 'yjs';
import { EditorToolbar } from './EditorToolbar.js';

export interface EditorProps {
  ydoc: Y.Doc;
  onFlushCommit?: () => void;
  documentTitle: string;
}

export const Editor: React.FC<EditorProps> = ({ ydoc, onFlushCommit, documentTitle }) => {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        history: false, // History is managed directly by Yjs Collaboration extension!
      }),
      Collaboration.configure({
        document: ydoc,
        field: 'default',
      }),
      Placeholder.configure({
        placeholder: `Write in "${documentTitle}"... All edits are cryptographically hashed and signed to the Merkle DAG.`,
      }),
      Typography,
    ],
    editorProps: {
      attributes: {
        class: 'prose prose-invert max-w-none focus:outline-none p-6 min-h-[500px] text-slate-200',
      },
    },
  });

  return (
    <div className="flex flex-col h-full rounded-2xl glass-panel border border-slate-800 shadow-2xl overflow-hidden">
      <EditorToolbar editor={editor} onFlushCommit={onFlushCommit} />
      <div className="flex-1 overflow-y-auto px-4 py-2">
        <EditorContent editor={editor} />
      </div>
    </div>
  );
};
