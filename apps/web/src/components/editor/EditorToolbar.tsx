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
} from 'lucide-react';

export interface EditorToolbarProps {
  editor: Editor | null;
  onFlushCommit?: () => void;
  isSaving?: boolean;
}

export const EditorToolbar: React.FC<EditorToolbarProps> = ({
  editor,
  onFlushCommit,
}) => {
  if (!editor) return null;

  return (
    <div className="sticky top-16 z-20 flex flex-wrap items-center justify-between gap-1.5 border-b border-cream-border bg-white px-4 py-2 font-sans w-full">
      <div className="flex flex-wrap items-center gap-1">
        {/* Headings */}
        <button
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          className={`rounded p-1.5 text-xs font-medium transition-colors ${
            editor.isActive('heading', { level: 1 })
              ? 'bg-cream-subtle text-charcoal border border-charcoal/30'
              : 'text-charcoal-muted hover:bg-cream-subtle hover:text-charcoal'
          }`}
          title="Heading 1"
          type="button"
        >
          <Heading1 className="h-4 w-4" />
        </button>

        <button
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          className={`rounded p-1.5 text-xs font-medium transition-colors ${
            editor.isActive('heading', { level: 2 })
              ? 'bg-cream-subtle text-charcoal border border-charcoal/30'
              : 'text-charcoal-muted hover:bg-cream-subtle hover:text-charcoal'
          }`}
          title="Heading 2"
          type="button"
        >
          <Heading2 className="h-4 w-4" />
        </button>

        <button
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          className={`rounded p-1.5 text-xs font-medium transition-colors ${
            editor.isActive('heading', { level: 3 })
              ? 'bg-cream-subtle text-charcoal border border-charcoal/30'
              : 'text-charcoal-muted hover:bg-cream-subtle hover:text-charcoal'
          }`}
          title="Heading 3"
          type="button"
        >
          <Heading3 className="h-4 w-4" />
        </button>

        <div className="h-4 w-px bg-cream-border mx-1" />

        {/* Basic formatting */}
        <button
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={`rounded p-1.5 text-xs font-medium transition-colors ${
            editor.isActive('bold')
              ? 'bg-cream-subtle text-charcoal border border-charcoal/30'
              : 'text-charcoal-muted hover:bg-cream-subtle hover:text-charcoal'
          }`}
          title="Bold (Ctrl+B)"
          type="button"
        >
          <Bold className="h-4 w-4" />
        </button>

        <button
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={`rounded p-1.5 text-xs font-medium transition-colors ${
            editor.isActive('italic')
              ? 'bg-cream-subtle text-charcoal border border-charcoal/30'
              : 'text-charcoal-muted hover:bg-cream-subtle hover:text-charcoal'
          }`}
          title="Italic (Ctrl+I)"
          type="button"
        >
          <Italic className="h-4 w-4" />
        </button>

        <button
          onClick={() => editor.chain().focus().toggleCode().run()}
          className={`rounded p-1.5 text-xs font-medium transition-colors ${
            editor.isActive('code')
              ? 'bg-cream-subtle text-charcoal border border-charcoal/30'
              : 'text-charcoal-muted hover:bg-cream-subtle hover:text-charcoal'
          }`}
          title="Inline Code"
          type="button"
        >
          <Code className="h-4 w-4" />
        </button>

        <div className="h-4 w-px bg-cream-border mx-1" />

        {/* Lists & Blocks */}
        <button
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={`rounded p-1.5 text-xs font-medium transition-colors ${
            editor.isActive('bulletList')
              ? 'bg-cream-subtle text-charcoal border border-charcoal/30'
              : 'text-charcoal-muted hover:bg-cream-subtle hover:text-charcoal'
          }`}
          title="Bullet List"
          type="button"
        >
          <List className="h-4 w-4" />
        </button>

        <button
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={`rounded p-1.5 text-xs font-medium transition-colors ${
            editor.isActive('orderedList')
              ? 'bg-cream-subtle text-charcoal border border-charcoal/30'
              : 'text-charcoal-muted hover:bg-cream-subtle hover:text-charcoal'
          }`}
          title="Numbered List"
          type="button"
        >
          <ListOrdered className="h-4 w-4" />
        </button>

        <button
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          className={`rounded p-1.5 text-xs font-medium transition-colors ${
            editor.isActive('blockquote')
              ? 'bg-cream-subtle text-charcoal border border-charcoal/30'
              : 'text-charcoal-muted hover:bg-cream-subtle hover:text-charcoal'
          }`}
          title="Blockquote"
          type="button"
        >
          <Quote className="h-4 w-4" />
        </button>

        <button
          onClick={() => editor.chain().focus().setHorizontalRule().run()}
          className="rounded p-1.5 text-xs text-charcoal-muted hover:bg-cream-subtle hover:text-charcoal transition-colors"
          title="Divider Line"
          type="button"
        >
          <Minus className="h-4 w-4" />
        </button>

        <div className="h-4 w-px bg-cream-border mx-1" />

        {/* Undo/Redo */}
        <button
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().undo()}
          className="rounded p-1.5 text-xs text-charcoal-muted hover:bg-cream-subtle hover:text-charcoal disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          title="Undo"
          type="button"
        >
          <Undo className="h-4 w-4" />
        </button>

        <button
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().redo()}
          className="rounded p-1.5 text-xs text-charcoal-muted hover:bg-cream-subtle hover:text-charcoal disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          title="Redo"
          type="button"
        >
          <Redo className="h-4 w-4" />
        </button>
      </div>

      {/* Right Action: Sign & Commit Now */}
      {onFlushCommit && (
        <button
          onClick={onFlushCommit}
          className="flex items-center space-x-1.5 rounded bg-charcoal text-cream-50 hover:bg-charcoal/90 px-3 py-1.5 text-xs font-medium transition-colors border border-charcoal shrink-0"
          title="Sign commit with WebCrypto ECDSA private key and append to Merkle DAG"
          type="button"
        >
          <Sparkles className="h-3.5 w-3.5 text-cream-50" />
          <span>Sign Commit</span>
        </button>
      )}
    </div>
  );
};
