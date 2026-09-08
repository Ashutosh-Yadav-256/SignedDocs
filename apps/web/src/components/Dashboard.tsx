import React, { useState, useEffect } from 'react';
import { HermesDocument } from '@hermes/core';
import { HermesStorage } from '@hermes/storage';
import {
  Plus,
  FileText,
  Trash2,
  Clock,
  ArrowRight,
  BookOpen,
  Sparkles,
  Database,
  Link2,
  Copy,
  Check,
  Search,
  ShieldCheck,
  FilePlus,
  ArrowLeft,
  Users,
} from 'lucide-react';

export interface DashboardProps {
  storage: HermesStorage;
  currentDocId?: string;
  onSelectDocument: (docId: string, title: string, roomCode?: string) => void;
  onClose?: () => void;
  canClose?: boolean;
}

export function parseInviteInput(input: string): { docId: string; roomCode: string } | null {
  const trimmed = input.trim();
  if (!trimmed) return null;

  try {
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://') || trimmed.includes('?')) {
      const url = new URL(trimmed.startsWith('http') ? trimmed : `http://dummy.com/${trimmed}`);
      const doc = url.searchParams.get('doc');
      const room = url.searchParams.get('room');
      if (doc) {
        return { docId: doc, roomCode: room || doc };
      }
    }
  } catch {
    // ignore parse error, fallback to code regex
  }

  const cleanCode = trimmed.replace(/[^a-zA-Z0-9_-]/g, '');
  if (cleanCode.length > 0) {
    return { docId: cleanCode, roomCode: cleanCode };
  }

  return null;
}

export const Dashboard: React.FC<DashboardProps> = ({
  storage,
  currentDocId,
  onSelectDocument,
  onClose,
  canClose = true,
}) => {
  const [documents, setDocuments] = useState<HermesDocument[]>([]);
  const [newTitle, setNewTitle] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [inviteInput, setInviteInput] = useState('');
  const [inviteError, setInviteError] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const loadDocs = async () => {
    const list = await storage.listDocuments();
    // Sort documents by most recently updated/created first
    list.sort((a, b) => (b.updatedAt || b.createdAt) - (a.updatedAt || a.createdAt));
    setDocuments(list);
  };

  useEffect(() => {
    loadDocs();
  }, [storage]);

  // Create a brand-new fresh document
  const handleCreateNew = async (customTitle?: string) => {
    const title = (customTitle !== undefined ? customTitle : newTitle).trim() || 'Untitled Document';
    const newDocId = 'doc_' + Math.random().toString(36).substring(2, 10);
    const newDoc: HermesDocument = {
      id: newDocId,
      title,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      heads: [],
    };
    await storage.saveDocument(newDoc);
    setNewTitle('');
    setIsCreating(false);
    onSelectDocument(newDoc.id, newDoc.title, newDoc.id);
  };

  // Join a document via Invite Link or Room Code
  const handleJoinInvite = (e: React.FormEvent) => {
    e.preventDefault();
    setInviteError('');
    const parsed = parseInviteInput(inviteInput);
    if (!parsed) {
      setInviteError('Please enter a valid document ID, room code, or full invite link.');
      return;
    }
    // Check if we already have this document in storage to preserve its title
    const existing = documents.find((d) => d.id === parsed.docId);
    const title = existing ? existing.title : 'Shared Document';
    onSelectDocument(parsed.docId, title, parsed.roomCode);
  };

  // Open Sample Protocol Specification demo
  const handleOpenSample = async () => {
    const sampleId = 'doc_hermes_default';
    const sampleTitle = 'Hermes Protocol Specification';
    let sampleDoc = await storage.getDocument(sampleId);
    if (!sampleDoc) {
      sampleDoc = {
        id: sampleId,
        title: sampleTitle,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        heads: [],
      };
      await storage.saveDocument(sampleDoc);
    }
    onSelectDocument(sampleId, sampleTitle, sampleId);
  };

  const handleDelete = async (id: string, title: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm(`Delete "${title}" and its local Merkle DAG commit history?`)) {
      await storage.deleteDocument(id);
      loadDocs();
    }
  };

  const copyDocId = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(id);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1800);
  };

  const filteredDocs = documents.filter((doc) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return doc.title.toLowerCase().includes(q) || doc.id.toLowerCase().includes(q);
  });

  return (
    <div className="max-w-5xl mx-auto py-8 px-4 sm:px-6 space-y-8 text-charcoal">
      {/* Top Navigation & Hub Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-cream-border">
        <div>
          <div className="flex items-center space-x-2 text-sage-dark text-xs font-mono font-medium tracking-wide uppercase mb-1">
            <ShieldCheck className="h-4 w-4 text-sage" />
            <span>Cryptographic Document Vault</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-charcoal tracking-tight">
            Document Hub & Stories
          </h1>
          <p className="text-xs sm:text-sm text-charcoal-muted mt-1 max-w-xl">
            Local-first, peer-to-peer documents. Every keystroke is signed with your ECDSA P-256 key and persisted directly in your browser.
          </p>
        </div>

        {canClose && onClose && (
          <button
            onClick={onClose}
            className="self-start sm:self-center flex items-center space-x-2 rounded-lg border border-cream-border bg-white hover:bg-cream px-3.5 py-2 text-xs font-semibold text-charcoal transition-colors shadow-xs"
          >
            <ArrowLeft className="h-4 w-4 text-charcoal-muted" />
            <span>Return to Editor</span>
          </button>
        )}
      </div>

      {/* Quick Launch Action Cards (Hero Row) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Card 1: Fresh Start */}
        <div className="relative overflow-hidden rounded-xl border border-cream-border bg-white p-5 shadow-xs flex flex-col justify-between hover:border-sage/60 transition-colors group">
          <div>
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-sage-light text-sage-dark mb-4 group-hover:scale-105 transition-transform">
              <FilePlus className="h-5 w-5" />
            </div>
            <h3 className="text-base font-serif font-bold text-charcoal">
              Start Fresh Document
            </h3>
            <p className="text-xs text-charcoal-muted mt-1.5 leading-relaxed">
              Create a brand new blank document with a unique ID and clean Merkle DAG history.
            </p>
          </div>

          <div className="mt-5 pt-3 border-t border-cream-border/60">
            <button
              onClick={() => handleCreateNew('Untitled Document')}
              className="w-full flex items-center justify-center space-x-2 rounded-lg bg-charcoal hover:bg-charcoal/90 text-cream-50 px-4 py-2.5 text-xs font-semibold transition-colors shadow-xs"
            >
              <Plus className="h-4 w-4" />
              <span>New Blank Document</span>
            </button>
          </div>
        </div>

        {/* Card 2: Join via Invite Link / Code */}
        <div className="relative overflow-hidden rounded-xl border border-cream-border bg-white p-5 shadow-xs flex flex-col justify-between hover:border-terracotta/60 transition-colors group">
          <div>
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-terracotta-50 text-terracotta-dark mb-4 group-hover:scale-105 transition-transform">
              <Link2 className="h-5 w-5" />
            </div>
            <h3 className="text-base font-serif font-bold text-charcoal">
              Join via Invite Link
            </h3>
            <p className="text-xs text-charcoal-muted mt-1.5 leading-relaxed">
              Collaborate on an existing session by pasting a room link or document ID.
            </p>
          </div>

          <form onSubmit={handleJoinInvite} className="mt-4 pt-3 border-t border-cream-border/60 space-y-2">
            <div className="relative">
              <input
                type="text"
                placeholder="Paste invite link or doc ID..."
                value={inviteInput}
                onChange={(e) => {
                  setInviteInput(e.target.value);
                  setInviteError('');
                }}
                className="w-full bg-cream rounded-lg border border-cream-border px-3 py-2 text-xs font-mono text-charcoal focus:outline-none focus:border-charcoal placeholder:font-sans placeholder:text-charcoal-muted/70"
              />
            </div>
            {inviteError && (
              <p className="text-[11px] text-terracotta-dark font-medium">{inviteError}</p>
            )}
            <button
              type="submit"
              disabled={!inviteInput.trim()}
              className="w-full flex items-center justify-center space-x-2 rounded-lg bg-cream-subtle hover:bg-cream-dark disabled:opacity-50 text-charcoal border border-cream-border px-4 py-2 text-xs font-semibold transition-colors"
            >
              <Users className="h-3.5 w-3.5 text-terracotta-dark" />
              <span>Connect to Room</span>
            </button>
          </form>
        </div>

        {/* Card 3: Sample Protocol Spec */}
        <div className="relative overflow-hidden rounded-xl border border-cream-border bg-white p-5 shadow-xs flex flex-col justify-between hover:border-charcoal/40 transition-colors group">
          <div>
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-cream-subtle text-charcoal mb-4 group-hover:scale-105 transition-transform">
              <Sparkles className="h-5 w-5 text-sage" />
            </div>
            <h3 className="text-base font-serif font-bold text-charcoal">
              Explore Demo Spec
            </h3>
            <p className="text-xs text-charcoal-muted mt-1.5 leading-relaxed">
              Explore the Hermes Protocol Specification with sample Merkle DAG branches, signatures, and verifier reports.
            </p>
          </div>

          <div className="mt-5 pt-3 border-t border-cream-border/60">
            <button
              onClick={handleOpenSample}
              className="w-full flex items-center justify-center space-x-2 rounded-lg border border-cream-border bg-white hover:bg-cream px-4 py-2.5 text-xs font-semibold text-charcoal transition-colors shadow-xs"
            >
              <BookOpen className="h-4 w-4 text-sage" />
              <span>Open Protocol Spec</span>
            </button>
          </div>
        </div>
      </div>

      {/* Custom Title Creation Modal / Drawer if user wants a named doc */}
      {isCreating && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleCreateNew();
          }}
          className="bg-white p-5 rounded-xl border border-cream-border shadow-md space-y-3"
        >
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-charcoal font-serif">Create Named Document</h3>
            <button
              type="button"
              onClick={() => setIsCreating(false)}
              className="text-xs text-charcoal-muted hover:text-charcoal"
            >
              Cancel
            </button>
          </div>
          <input
            type="text"
            placeholder="Document title (e.g. Distributed Consensus RFC, Sprint Architecture...)"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            autoFocus
            className="w-full bg-cream border border-cream-border rounded-lg px-4 py-2.5 text-sm text-charcoal focus:outline-none focus:border-charcoal font-serif"
          />
          <div className="flex items-center justify-end space-x-2 pt-1">
            <button
              type="button"
              onClick={() => setIsCreating(false)}
              className="px-3 py-1.5 text-xs text-charcoal-muted hover:text-charcoal"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="bg-charcoal hover:bg-charcoal/90 text-cream text-xs font-semibold px-4 py-2 rounded-lg transition-colors"
            >
              Create & Launch
            </button>
          </div>
        </form>
      )}

      {/* Saved Documents Section */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
          <div className="flex items-center space-x-2">
            <BookOpen className="h-5 w-5 text-sage" />
            <h2 className="text-lg font-serif font-bold text-charcoal">
              Your Saved Documents ({documents.length})
            </h2>
          </div>

          <div className="flex items-center space-x-3">
            {/* Search filter */}
            {documents.length > 2 && (
              <div className="relative">
                <Search className="h-3.5 w-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-charcoal-muted" />
                <input
                  type="text"
                  placeholder="Filter documents..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-white border border-cream-border rounded-lg pl-8 pr-3 py-1.5 text-xs text-charcoal focus:outline-none focus:border-charcoal w-48 font-sans"
                />
              </div>
            )}

            {!isCreating && (
              <button
                onClick={() => setIsCreating(true)}
                className="flex items-center space-x-1.5 rounded-lg bg-white border border-cream-border hover:bg-cream text-charcoal px-3 py-1.5 text-xs font-semibold transition-colors shadow-xs"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Named Document</span>
              </button>
            )}
          </div>
        </div>

        {/* Documents Grid */}
        {filteredDocs.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredDocs.map((doc) => {
              const isCurrent = doc.id === currentDocId;
              const formattedDate = new Date(doc.updatedAt || doc.createdAt).toLocaleDateString(undefined, {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              });

              return (
                <div
                  key={doc.id}
                  onClick={() => onSelectDocument(doc.id, doc.title, doc.id)}
                  className={`group bg-white hover:bg-cream-50 rounded-xl p-5 border transition-all cursor-pointer flex flex-col justify-between relative shadow-xs hover:shadow-md ${
                    isCurrent
                      ? 'border-sage ring-1 ring-sage/30'
                      : 'border-cream-border hover:border-charcoal-muted'
                  }`}
                >
                  <div>
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center space-x-3 min-w-0">
                        <div className="rounded-lg border border-cream-border bg-cream p-2.5 text-sage shrink-0 group-hover:scale-105 transition-transform">
                          <FileText className="h-5 w-5" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center space-x-2">
                            <h3 className="text-sm font-serif font-bold text-charcoal group-hover:text-sage-dark transition-colors truncate">
                              {doc.title}
                            </h3>
                            {isCurrent && (
                              <span className="shrink-0 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-sage-light text-sage-dark border border-sage/30">
                                Current
                              </span>
                            )}
                          </div>
                          <div className="flex items-center space-x-1.5 mt-1">
                            <span className="text-[10px] font-mono text-charcoal-muted truncate">
                              {doc.id}
                            </span>
                            <button
                              onClick={(e) => copyDocId(doc.id, e)}
                              className="text-charcoal-muted hover:text-charcoal p-0.5 rounded"
                              title="Copy Document ID"
                            >
                              {copiedId === doc.id ? (
                                <Check className="h-3 w-3 text-sage" />
                              ) : (
                                <Copy className="h-3 w-3" />
                              )}
                            </button>
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={(e) => handleDelete(doc.id, doc.title, e)}
                        className="text-charcoal-muted hover:text-terracotta p-1.5 rounded transition-colors opacity-0 group-hover:opacity-100 shrink-0"
                        title="Delete Document"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  <div className="mt-5 pt-3 border-t border-cream-border flex items-center justify-between text-xs text-charcoal-muted">
                    <span className="flex items-center space-x-1.5 text-[11px]">
                      <Clock className="h-3 w-3 text-charcoal-muted" />
                      <span>{formattedDate}</span>
                    </span>
                    <span className="flex items-center space-x-1 text-sage-dark font-semibold text-xs group-hover:translate-x-1 transition-transform">
                      <span>Open Document</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-12 bg-white rounded-xl border border-cream-border p-8 space-y-4 shadow-xs">
            <Database className="h-10 w-10 text-charcoal-muted mx-auto" />
            <div className="space-y-1">
              <h3 className="text-base font-serif font-semibold text-charcoal">
                {searchQuery ? 'No documents match your search' : 'No Local Documents Stored Yet'}
              </h3>
              <p className="text-xs text-charcoal-muted max-w-sm mx-auto">
                {searchQuery
                  ? 'Try changing your search term or clear the filter.'
                  : 'Start fresh with a blank document, or load the protocol demo to get started.'}
              </p>
            </div>
            {!searchQuery && (
              <div className="flex items-center justify-center space-x-3 pt-2">
                <button
                  onClick={() => handleCreateNew('Untitled Document')}
                  className="inline-flex items-center space-x-1.5 rounded-lg bg-charcoal text-cream-50 px-4 py-2 text-xs font-semibold hover:bg-charcoal/90 transition-colors shadow-xs"
                >
                  <Plus className="h-4 w-4" />
                  <span>Start Fresh Document</span>
                </button>
                <button
                  onClick={handleOpenSample}
                  className="inline-flex items-center space-x-1.5 rounded-lg border border-cream-border bg-white text-charcoal px-4 py-2 text-xs font-semibold hover:bg-cream transition-colors shadow-xs"
                >
                  <BookOpen className="h-4 w-4 text-sage" />
                  <span>Open Protocol Spec</span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Security & Zero-Trust Notice */}
      <div className="rounded-xl bg-cream-subtle border border-cream-border p-4 text-xs text-charcoal-muted flex items-start space-x-3">
        <ShieldCheck className="h-5 w-5 text-sage shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-semibold text-charcoal">Zero Centralized Storage Guarantee</p>
          <p className="text-[11px] leading-relaxed">
            HermesDocs never sends your text to a centralized database. Documents and cryptographic keys reside solely inside your browser’s IndexedDB. Collaboration runs directly peer-to-peer via WebRTC DataChannels.
          </p>
        </div>
      </div>
    </div>
  );
};
