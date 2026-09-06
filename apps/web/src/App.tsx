import React, { useState, useMemo, useEffect } from 'react';
import { HermesStorage } from '@hermes/storage';
import { useHermesIdentity } from './hooks/useHermesIdentity.js';
import { useHermesDocument } from './hooks/useHermesDocument.js';
import { Header } from './components/Header.js';
import { Editor } from './components/editor/Editor.js';
import { DAGVisualizer } from './components/timeline/DAGVisualizer.js';
import { Timeline } from './components/timeline/Timeline.js';
import { SignedBlame } from './components/provenance/SignedBlame.js';
import { TimeTravel } from './components/provenance/TimeTravel.js';
import { ActivePeers } from './components/collaboration/ActivePeers.js';
import { ExportModal } from './components/modals/ExportModal.js';
import { AuditVerifierModal } from './components/modals/AuditVerifierModal.js';
import { ShareModal } from './components/modals/ShareModal.js';
import { Dashboard } from './components/Dashboard.js';
import { Sparkles, Layers, ShieldCheck, Radio, FileText, ArrowLeft } from 'lucide-react';

export function App() {
  const storage = useMemo(() => new HermesStorage(), []);

  // Parse URL parameters for room sharing
  const searchParams = new URLSearchParams(window.location.search);
  const initialDocId = searchParams.get('doc') || 'doc_hermes_default';
  const initialRoom = searchParams.get('room') || initialDocId;
  const initialSignal = searchParams.get('signal') || (import.meta.env?.VITE_SIGNALING_URL as string) || undefined;

  const [documentId, setDocumentId] = useState(initialDocId);
  const [documentTitle, setDocumentTitle] = useState('Hermes Protocol Specification');
  const [activeTab, setActiveTab] = useState<'editor' | 'dag' | 'blame' | 'timetravel' | 'audit'>('editor');
  const [showDashboard, setShowDashboard] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [isVerifierModalOpen, setIsVerifierModalOpen] = useState(false);

  // Author identity
  const {
    identity,
    displayName,
    userColor,
    isLoading: isIdentityLoading,
    updateDisplayName,
  } = useHermesIdentity(storage);

  // Synchronized Hermes document
  const hermesDoc = useHermesDocument({
    documentId,
    documentTitle,
    identity: identity!,
    displayName,
    userColor,
    storage,
    roomCode: initialRoom,
    signalingUrl: initialSignal,
  });

  const {
    ydoc,
    dag,
    commits,
    heads,
    activePeers,
    auditReport,
    isLoaded,
    flushCommit,
    exportBundle,
  } = hermesDoc;

  // Render loading state
  if (isIdentityLoading || !identity || !isLoaded) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0b0f19] text-slate-200">
        <div className="flex flex-col items-center space-y-4">
          <div className="relative flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-500 to-indigo-600 p-0.5 shadow-xl shadow-cyan-500/20 animate-pulse">
            <div className="flex h-full w-full items-center justify-center rounded-[14px] bg-slate-950">
              <Sparkles className="h-7 w-7 text-cyan-400 animate-spin" />
            </div>
          </div>
          <p className="text-sm font-semibold tracking-wide text-slate-400">
            Initializing WebCrypto Keys & Local Merkle DAG...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0b0f19] text-slate-100 flex flex-col font-sans">
      {/* Header */}
      <Header
        documentTitle={documentTitle}
        onTitleChange={setDocumentTitle}
        identity={identity}
        displayName={displayName}
        onDisplayNameChange={updateDisplayName}
        userColor={userColor}
        activePeers={activePeers}
        auditReport={auditReport}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onExportClick={() => setIsExportOpen(true)}
        onShareClick={() => setIsShareOpen(true)}
        onVerifyClick={() => setIsVerifierModalOpen(true)}
        onDocumentsClick={() => setShowDashboard(!showDashboard)}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6">
        {showDashboard ? (
          <Dashboard
            storage={storage}
            onSelectDocument={(id, title) => {
              setDocumentId(id);
              setDocumentTitle(title);
              setShowDashboard(false);
            }}
            onClose={() => setShowDashboard(false)}
          />
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Main Center Content View */}
            <div className={`${activeTab === 'editor' ? 'lg:col-span-8' : 'lg:col-span-12'}`}>
              {activeTab === 'editor' && (
                <Editor
                  ydoc={ydoc}
                  onFlushCommit={flushCommit}
                  documentTitle={documentTitle}
                />
              )}

              {activeTab === 'dag' && (
                <DAGVisualizer dag={dag} commits={commits} heads={heads} />
              )}

              {activeTab === 'blame' && <SignedBlame ydoc={ydoc} commits={commits} />}

              {activeTab === 'timetravel' && <TimeTravel dag={dag} commits={commits} />}

              {activeTab === 'audit' && (
                <AuditVerifierModal isStandaloneTab={true} />
              )}
            </div>

            {/* Right Sidebar (Only in Editor Mode) */}
            {activeTab === 'editor' && (
              <div className="lg:col-span-4 space-y-6">
                {/* Active Peers Presence */}
                <ActivePeers
                  peers={activePeers}
                  currentUserFingerprint={identity.fingerprint}
                  currentUserDisplayName={displayName}
                  currentUserColor={userColor}
                />

                {/* Quick DAG Feed */}
                <div className="glass-panel rounded-2xl p-5 border border-slate-800 shadow-xl">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-3">
                    <div className="flex items-center space-x-2">
                      <Layers className="h-4 w-4 text-cyan-400" />
                      <h3 className="text-sm font-bold text-white">Recent Commit Nodes</h3>
                    </div>
                    <button
                      onClick={() => setActiveTab('dag')}
                      className="text-xs text-cyan-400 hover:underline font-medium"
                    >
                      View Graph →
                    </button>
                  </div>
                  <div className="max-h-80 overflow-y-auto pr-1">
                    <Timeline commits={commits} heads={heads} />
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Modals */}
      <ExportModal
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
        getBundle={exportBundle}
      />

      <ShareModal
        isOpen={isShareOpen}
        onClose={() => setIsShareOpen(false)}
        documentId={documentId}
        roomCode={initialRoom}
      />

      {isVerifierModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4">
          <AuditVerifierModal onClose={() => setIsVerifierModalOpen(false)} />
        </div>
      )}
    </div>
  );
}

export default App;
