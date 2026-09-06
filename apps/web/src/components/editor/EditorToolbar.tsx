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
  isSaving,
}) => {
  if (!editor) return null;

  return (
    <div className="w-full bg-[#FFFFFF] border-b border-cream-border px-3 sm:px-4 py-2 flex flex-wrap items-center justify-between gap-1.5 z-10 font-sans select-none">
      <div className="flex flex-wrap items-center gap-1">
        {/* Headings */}
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          className={`rounded px-2 py-1 text-xs font-semibold transition-colors ${
            editor.isActive('heading', { level: 1 })
              ? 'bg-cream text-charcoal border border-charcoal/30'
              : 'text-charcoal-muted hover:bg-cream hover:text-charcoal'
          }`}
          title="Heading 1"
        >
          <Heading1 className="h-4 w-4" />
        </button>

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          className={`rounded px-2 py-1 text-xs font-semibold transition-colors ${
            editor.isActive('heading', { level: 2 })
              ? 'bg-cream text-charcoal border border-charcoal/30'
              : 'text-charcoal-muted hover:bg-cream hover:text-charcoal'
          }`}
          title="Heading 2"
        >
          <Heading2 className="h-4 w-4" />
        </button>

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          className={`rounded px-2 py-1 text-xs font-semibold transition-colors ${
            editor.isActive('heading', { level: 3 })
              ? 'bg-cream text-charcoal border border-charcoal/30'
              : 'text-charcoal-muted hover:bg-cream hover:text-charcoal'
          }`}
          title="Heading 3"
        >
          <Heading3 className="h-4 w-4" />
        </button>

        <div className="h-4 w-px bg-cream-border mx-1 hidden sm:block" />

        {/* Basic formatting */}
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={`rounded p-1.5 text-xs font-medium transition-colors ${
            editor.isActive('bold')
              ? 'bg-cream text-charcoal border border-charcoal/30'
              : 'text-charcoal-muted hover:bg-cream hover:text-charcoal'
          }`}
          title="Bold (Ctrl+B)"
        >
          <Bold className="h-4 w-4" />
        </button>

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={`rounded p-1.5 text-xs font-medium transition-colors ${
            editor.isActive('italic')
              ? 'bg-cream text-charcoal border border-charcoal/30'
              : 'text-charcoal-muted hover:bg-cream hover:text-charcoal'
          }`}
          title="Italic (Ctrl+I)"
        >
          <Italic className="h-4 w-4" />
        </button>

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleCode().run()}
          className={`rounded p-1.5 text-xs font-medium transition-colors ${
            editor.isActive('code')
              ? 'bg-cream text-charcoal border border-charcoal/30'
              : 'text-charcoal-muted hover:bg-cream hover:text-charcoal'
          }`}
          title="Inline Code"
        >
          <Code className="h-4 w-4" />
        </button>

        <div className="h-4 w-px bg-cream-border mx-1 hidden sm:block" />

        {/* Lists & Blocks */}
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={`rounded p-1.5 text-xs font-medium transition-colors ${
            editor.isActive('bulletList')
              ? 'bg-cream text-charcoal border border-charcoal/30'
              : 'text-charcoal-muted hover:bg-cream hover:text-charcoal'
          }`}
          title="Bullet List"
        >
          <List className="h-4 w-4" />
        </button>

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={`rounded p-1.5 text-xs font-medium transition-colors ${
            editor.isActive('orderedList')
              ? 'bg-cream text-charcoal border border-charcoal/30'
              : 'text-charcoal-muted hover:bg-cream hover:text-charcoal'
          }`}
          title="Numbered List"
        >
          <ListOrdered className="h-4 w-4" />
        </button>

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          className={`rounded p-1.5 text-xs font-medium transition-colors ${
            editor.isActive('blockquote')
              ? 'bg-cream text-charcoal border border-charcoal/30'
              : 'text-charcoal-muted hover:bg-cream hover:text-charcoal'
          }`}
          title="Blockquote"
        >
          <Quote className="h-4 w-4" />
        </button>

        <button
          type="button"
          onClick={() => editor.chain().focus().setHorizontalRule().run()}
          className="rounded p-1.5 text-xs text-charcoal-muted hover:bg-cream hover:text-charcoal transition-colors"
          title="Divider Line"
        >
          <Minus className="h-4 w-4" />
        </button>

        <div className="h-4 w-px bg-cream-border mx-1 hidden sm:block" />

        {/* Undo/Redo */}
        <button
          type="button"
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().undo()}
          className="rounded p-1.5 text-xs text-charcoal-muted hover:bg-cream hover:text-charcoal disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          title="Undo"
        >
          <Undo className="h-4 w-4" />
        </button>

        <button
          type="button"
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().redo()}
          className="rounded p-1.5 text-xs text-charcoal-muted hover:bg-cream hover:text-charcoal disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          title="Redo"
        >
          <Redo className="h-4 w-4" />
        </button>
      </div>

      {/* Right Action: Sign & Commit Now */}
      {onFlushCommit && (
        <button
          type="button"
          onClick={onFlushCommit}
          className="flex items-center space-x-1.5 rounded bg-charcoal text-cream hover:bg-charcoal/90 px-3 py-1.5 text-xs font-semibold transition-colors border border-charcoal flex-shrink-0"
          title="Sign commit with WebCrypto ECDSA private key and append to Merkle DAG"
        >
          <Sparkles className="h-3.5 w-3.5 text-sage" />
          <span>Sign Commit</span>
        </button>
      )}
    </div>
  );
};
