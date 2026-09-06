import React from 'react';
import { Editor } from '@tiptap/react';
import {
  Bold,
  Italic,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  Code,
  Undo,
  Redo,
  Sparkles,
  Minus,
  CheckSquare,
} from 'lucide-react';

export interface EditorToolbarProps {
  editor: Editor | null;
  onFlushCommit?: () => void;
  isSaving?: boolean;
}

export const EditorToolbar: React.FC<EditorToolbarProps> = ({
  editor,
  onFlushCommit,
  isSaving,
}) => {
  if (!editor) return null;

  return (
    <div className="flex flex-wrap items-center justify-between gap-1 border-b border-slate-800 bg-slate-900/80 px-4 py-2 backdrop-blur-md">
      <div className="flex flex-wrap items-center gap-1">
        {/* Headings */}
        <button
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          className={`rounded p-1.5 text-xs font-semibold transition-colors ${
            editor.isActive('heading', { level: 1 })
              ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
              : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
          }`}
          title="Heading 1"
        >
          <Heading1 className="h-4 w-4" />
        </button>

        <button
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          className={`rounded p-1.5 text-xs font-semibold transition-colors ${
            editor.isActive('heading', { level: 2 })
              ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
              : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
          }`}
          title="Heading 2"
        >
          <Heading2 className="h-4 w-4" />
        </button>

        <button
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          className={`rounded p-1.5 text-xs font-semibold transition-colors ${
            editor.isActive('heading', { level: 3 })
              ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
              : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
          }`}
          title="Heading 3"
        >
          <Heading3 className="h-4 w-4" />
        </button>

        <div className="h-4 w-px bg-slate-800 mx-1" />

        {/* Basic formatting */}
        <button
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={`rounded p-1.5 text-xs font-semibold transition-colors ${
            editor.isActive('bold')
              ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
              : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
          }`}
          title="Bold (Ctrl+B)"
        >
          <Bold className="h-4 w-4" />
        </button>

        <button
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={`rounded p-1.5 text-xs font-semibold transition-colors ${
            editor.isActive('italic')
              ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
              : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
          }`}
          title="Italic (Ctrl+I)"
        >
          <Italic className="h-4 w-4" />
        </button>

        <button
          onClick={() => editor.chain().focus().toggleCode().run()}
          className={`rounded p-1.5 text-xs font-semibold transition-colors ${
            editor.isActive('code')
              ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
              : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
          }`}
          title="Inline Code"
        >
          <Code className="h-4 w-4" />
        </button>

        <div className="h-4 w-px bg-slate-800 mx-1" />

        {/* Lists & Blocks */}
        <button
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={`rounded p-1.5 text-xs font-semibold transition-colors ${
            editor.isActive('bulletList')
              ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
              : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
          }`}
          title="Bullet List"
        >
          <List className="h-4 w-4" />
        </button>

        <button
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={`rounded p-1.5 text-xs font-semibold transition-colors ${
            editor.isActive('orderedList')
              ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
              : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
          }`}
          title="Ordered List"
        >
          <ListOrdered className="h-4 w-4" />
        </button>

        <button
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          className={`rounded p-1.5 text-xs font-semibold transition-colors ${
            editor.isActive('blockquote')
              ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
              : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
          }`}
          title="Blockquote"
        >
          <Quote className="h-4 w-4" />
        </button>

        <button
          onClick={() => editor.chain().focus().setHorizontalRule().run()}
          className="rounded p-1.5 text-xs text-slate-400 hover:bg-slate-800 hover:text-slate-200 transition-colors"
          title="Horizontal Rule"
        >
          <Minus className="h-4 w-4" />
        </button>

        <div className="h-4 w-px bg-slate-800 mx-1" />

        {/* Undo/Redo */}
        <button
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().undo()}
          className="rounded p-1.5 text-xs text-slate-400 hover:bg-slate-800 hover:text-slate-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          title="Undo"
        >
          <Undo className="h-4 w-4" />
        </button>

        <button
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().redo()}
          className="rounded p-1.5 text-xs text-slate-400 hover:bg-slate-800 hover:text-slate-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          title="Redo"
        >
          <Redo className="h-4 w-4" />
        </button>
      </div>

      {/* Right Action: Sign & Commit Now */}
      {onFlushCommit && (
        <button
          onClick={onFlushCommit}
          className="flex items-center space-x-1.5 rounded-lg bg-cyan-500/10 border border-cyan-500/30 px-3 py-1 text-xs font-medium text-cyan-400 hover:bg-cyan-500/20 transition-all"
          title="Immediately sign canonical commit with ECDSA and append to DAG"
        >
          <Sparkles className="h-3.5 w-3.5" />
          <span>Sign Commit Node</span>
        </button>
      )}
    </div>
  );
};
