import React, { useState, useEffect } from 'react';
import { HermesDocument } from '@hermes/core';
import { HermesStorage } from '@hermes/storage';
import { Plus, FileText, Trash2, Clock, ArrowRight, BookOpen, Sparkles, Database } from 'lucide-react';

export interface DashboardProps {
  storage: HermesStorage;
  onSelectDocument: (docId: string, title: string) => void;
  onClose: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  storage,
  onSelectDocument,
  onClose,
}) => {
  const [documents, setDocuments] = useState<HermesDocument[]>([]);
  const [newTitle, setNewTitle] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  const loadDocs = async () => {
    const list = await storage.listDocuments();
    setDocuments(list);
  };

  useEffect(() => {
    loadDocs();
  }, [storage]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const title = newTitle.trim() || 'Untitled Hermes Document';
    const newDoc: HermesDocument = {
      id: 'doc_' + Math.random().toString(36).substring(2, 12),
      title,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      heads: [],
    };
    await storage.saveDocument(newDoc);
    setNewTitle('');
    setIsCreating(false);
    onSelectDocument(newDoc.id, newDoc.title);
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Delete this local document and its commit DAG?')) {
      await storage.deleteDocument(id);
      loadDocs();
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 space-y-6 text-charcoal">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-cream-border">
        <div>
          <h1 className="text-2xl font-serif font-bold text-charcoal tracking-tight flex items-center gap-2.5">
            <BookOpen className="h-6 w-6 text-sage" />
            <span>Local Documents & Stories</span>
          </h1>
          <p className="text-xs text-charcoal-muted mt-1">
            All documents are stored locally in your browser with cryptographically signed Merkle DAG history.
          </p>
        </div>

        <button
          onClick={() => setIsCreating(true)}
          className="flex items-center space-x-1.5 rounded bg-charcoal hover:bg-charcoal/90 text-cream px-4 py-2 text-xs font-semibold transition-colors border border-charcoal"
        >
          <Plus className="h-4 w-4" />
          <span>New Document</span>
        </button>
      </div>

      {/* Create Dialog */}
      {isCreating && (
        <form
          onSubmit={handleCreate}
          className="bg-cream-light p-5 rounded-lg border border-cream-border space-y-3"
        >
          <h3 className="text-sm font-bold text-charcoal font-serif">Create New Document</h3>
          <input
            type="text"
            placeholder="Document title (e.g. System Architecture Spec)"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            autoFocus
            className="w-full bg-cream border border-cream-border rounded px-4 py-2 text-sm text-charcoal focus:outline-none focus:border-charcoal font-serif"
          />
          <div className="flex items-center justify-end space-x-2">
            <button
              type="button"
              onClick={() => setIsCreating(false)}
              className="px-3 py-1.5 text-xs text-charcoal-muted hover:text-charcoal"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="bg-charcoal hover:bg-charcoal/90 text-cream text-xs font-semibold px-4 py-1.5 rounded transition-colors border border-charcoal"
            >
              Create & Open
            </button>
          </div>
        </form>
      )}

      {/* Documents Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {documents.map((doc) => (
          <div
            key={doc.id}
            onClick={() => onSelectDocument(doc.id, doc.title)}
            className="group bg-cream-light hover:bg-cream rounded-lg p-5 border border-cream-border hover:border-charcoal-muted transition-colors cursor-pointer flex flex-col justify-between"
          >
            <div>
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-2.5">
                  <div className="rounded border border-cream-border bg-cream p-2 text-sage">
                    <FileText className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-serif font-bold text-charcoal group-hover:text-sage transition-colors">
                      {doc.title}
                    </h3>
                    <p className="text-[10px] font-mono text-charcoal-muted mt-0.5">{doc.id}</p>
                  </div>
                </div>

                <button
                  onClick={(e) => handleDelete(doc.id, e)}
                  className="text-charcoal-muted hover:text-terracotta p-1 rounded transition-colors opacity-0 group-hover:opacity-100"
                  title="Delete Document"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="mt-6 pt-3 border-t border-cream-border flex items-center justify-between text-xs text-charcoal-muted">
              <span className="flex items-center space-x-1">
                <Clock className="h-3 w-3 text-charcoal-muted" />
                <span>{new Date(doc.updatedAt || doc.createdAt).toLocaleDateString()}</span>
              </span>
              <span className="flex items-center space-x-1 text-sage font-medium group-hover:translate-x-0.5 transition-transform">
                <span>Open Document</span>
                <ArrowRight className="h-3 w-3" />
              </span>
            </div>
          </div>
        ))}
      </div>

      {documents.length === 0 && !isCreating && (
        <div className="text-center py-16 bg-cream-light rounded-lg border border-cream-border p-8 space-y-3">
          <Database className="h-10 w-10 text-charcoal-muted mx-auto" />
          <h3 className="text-base font-serif font-semibold text-charcoal">No Documents Found</h3>
          <p className="text-xs text-charcoal-muted max-w-sm mx-auto">
            Create your first document to start collaborative editing with local Merkle DAG audit trails.
          </p>
          <button
            onClick={() => setIsCreating(true)}
            className="inline-flex items-center space-x-1.5 rounded bg-charcoal text-cream px-4 py-2 text-xs font-semibold hover:bg-charcoal/90 transition-colors border border-charcoal"
          >
            <Plus className="h-4 w-4" />
            <span>Create Document</span>
          </button>
        </div>
      )}
    </div>
  );
};
