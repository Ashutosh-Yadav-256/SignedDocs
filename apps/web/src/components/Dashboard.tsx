import React, { useState, useEffect } from 'react';
import { HermesDocument } from '@hermes/core';
import { HermesStorage } from '@hermes/storage';
import { Plus, FileText, Trash2, Clock, ShieldCheck, ArrowRight, Sparkles, Database } from 'lucide-react';

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
    <div className="max-w-4xl mx-auto py-8 px-4 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
            <Sparkles className="h-6 w-6 text-cyan-400" />
            <span>Local Hermes Documents</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            All documents are stored locally in your browser with ECDSA signed Merkle DAG history.
          </p>
        </div>

        <button
          onClick={() => setIsCreating(true)}
          className="flex items-center space-x-1.5 rounded-xl bg-gradient-to-r from-cyan-600 to-sky-600 px-4 py-2 text-xs font-semibold text-white hover:from-cyan-500 hover:to-sky-500 transition-all shadow-lg shadow-cyan-500/25"
        >
          <Plus className="h-4 w-4" />
          <span>New Document</span>
        </button>
      </div>

      {/* Create Dialog */}
      {isCreating && (
        <form
          onSubmit={handleCreate}
          className="glass-panel p-5 rounded-2xl border border-cyan-500/40 space-y-3 shadow-xl"
        >
          <h3 className="text-sm font-bold text-white">Create New Document</h3>
          <input
            type="text"
            placeholder="Document title (e.g. System Architecture Spec)"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            autoFocus
            className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
          />
          <div className="flex items-center justify-end space-x-2">
            <button
              type="button"
              onClick={() => setIsCreating(false)}
              className="px-3 py-1.5 text-xs text-slate-400 hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold px-4 py-1.5 rounded-lg transition-colors"
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
            className="group glass-panel hover:bg-slate-900/90 rounded-2xl p-5 border border-slate-800/80 hover:border-cyan-500/40 transition-all cursor-pointer shadow-lg flex flex-col justify-between"
          >
            <div>
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-2.5">
                  <div className="rounded-xl bg-cyan-500/10 p-2.5 text-cyan-400 border border-cyan-500/20 group-hover:scale-105 transition-transform">
                    <FileText className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white group-hover:text-cyan-400 transition-colors">
                      {doc.title}
                    </h3>
                    <p className="text-[10px] font-mono text-slate-500 mt-0.5">{doc.id}</p>
                  </div>
                </div>

                <button
                  onClick={(e) => handleDelete(doc.id, e)}
                  className="text-slate-600 hover:text-rose-400 p-1 rounded transition-colors opacity-0 group-hover:opacity-100"
                  title="Delete Document"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="mt-6 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
              <span className="flex items-center space-x-1">
                <Clock className="h-3 w-3 text-slate-500" />
                <span>{new Date(doc.updatedAt || doc.createdAt).toLocaleDateString()}</span>
              </span>
              <span className="flex items-center space-x-1 text-cyan-400 font-semibold group-hover:translate-x-1 transition-transform">
                <span>Open Document</span>
                <ArrowRight className="h-3 w-3" />
              </span>
            </div>
          </div>
        ))}
      </div>

      {documents.length === 0 && !isCreating && (
        <div className="text-center py-16 glass-panel rounded-2xl border border-slate-800 p-8 space-y-3">
          <Database className="h-10 w-10 text-slate-600 mx-auto" />
          <h3 className="text-base font-semibold text-slate-300">No Documents Found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Create your first document to start collaborative editing with local Merkle DAG audit trails.
          </p>
          <button
            onClick={() => setIsCreating(true)}
            className="inline-flex items-center space-x-1.5 rounded-xl bg-cyan-600 px-4 py-2 text-xs font-semibold text-white hover:bg-cyan-500 transition-all"
          >
            <Plus className="h-4 w-4" />
            <span>Create Document</span>
          </button>
        </div>
      )}
    </div>
  );
};
