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
import { AIAssistantDrawer } from './components/ai/AIAssistantDrawer.js';
import { RedactionStudioModal } from './components/redaction/RedactionStudioModal.js';
import { MultisigMilestoneModal } from './components/multisig/MultisigMilestoneModal.js';
import { ForensicInspectorModal } from './components/forensics/ForensicInspectorModal.js';
import { AirGapSyncModal } from './components/airgap/AirGapSyncModal.js';
import { OnboardingModal } from './components/onboarding/OnboardingModal.js';
import { extractTextFromYDoc, replaceYDocContent } from './lib/yjsUtils.js';
import {
  FileText,
  Layers,
  ShieldCheck,
  Radio,
  EyeOff,
  Award,
  Activity,
  QrCode,
  HelpCircle,
  Clock,
  KeyRound,
  BookOpen,
  Sparkles,
} from 'lucide-react';

export function App() {
  const storage = useMemo(() => new HermesStorage(), []);

  // Parse URL parameters for room sharing
  const searchParams = new URLSearchParams(window.location.search);
  const initialDocId = searchParams.get('doc') || 'doc_hermes_default';
  const initialRoom = searchParams.get('room') || initialDocId;
  const defaultSignalingUrl = 'wss://hermes-signaling-relay.onrender.com';
  const initialSignal = searchParams.get('signal') || (import.meta.env?.VITE_SIGNALING_URL as string) || defaultSignalingUrl;

  const [documentId, setDocumentId] = useState(initialDocId);
  const [documentTitle, setDocumentTitle] = useState('Hermes Protocol Specification');
  const [activeTab, setActiveTab] = useState<'editor' | 'dag' | 'blame' | 'timetravel' | 'audit'>('editor');
  const [showDashboard, setShowDashboard] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [isVerifierModalOpen, setIsVerifierModalOpen] = useState(false);
  const [isAIAssistantOpen, setIsAIAssistantOpen] = useState(false);
  const [selectedAICommitId, setSelectedAICommitId] = useState<string | null>(null);

  // Onboarding UX tour state
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(() => {
    return !localStorage.getItem('signeddocs_onboarded_seen');
  });

  // Innovation Modals State
  const [isRedactionModalOpen, setIsRedactionModalOpen] = useState(false);
  const [isMultisigModalOpen, setIsMultisigModalOpen] = useState(false);
  const [isForensicsModalOpen, setIsForensicsModalOpen] = useState(false);
  const [isAirGapModalOpen, setIsAirGapModalOpen] = useState(false);

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

  const handleCloseOnboarding = () => {
    localStorage.setItem('signeddocs_onboarded_seen', 'true');
    setIsOnboardingOpen(false);
  };

  // Render loading state with flat design styling
  if (isIdentityLoading || !identity || !isLoaded) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-cream text-charcoal">
        <div className="flex flex-col items-center space-y-4 max-w-sm p-8 bg-cream-light border border-cream-border rounded-lg text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded border border-sage/40 bg-sage/10 text-sage">
            <FileText className="h-6 w-6 text-sage" />
          </div>
          <div className="space-y-1">
            <h2 className="text-base font-serif font-bold text-charcoal">SignedDocs</h2>
            <p className="text-xs text-charcoal-muted">
              Initializing WebCrypto ECDSA keys and local Merkle DAG...
            </p>
          </div>
        </div>
      </div>
    );
  }

  const [docText, setDocText] = useState(() => extractTextFromYDoc(ydoc, 'default'));

  useEffect(() => {
    const handleUpdate = () => {
      setDocText(extractTextFromYDoc(ydoc, 'default'));
    };
    handleUpdate();
    ydoc.on('update', handleUpdate);
    return () => {
      ydoc.off('update', handleUpdate);
    };
  }, [ydoc]);

  const handleOpenAICommit = (commit: any) => {
    setSelectedAICommitId(commit.id);
    setIsAIAssistantOpen(true);
  };

  const handleApplyAISuggestion = async (newContent: string) => {
    replaceYDocContent(ydoc, newContent, 'default');
    await flushCommit();
  };

  // Calculate live stats for the left sidebar
  const wordCount = docText.trim() ? docText.trim().split(/\s+/).filter(Boolean).length : 0;
  const readTimeMin = Math.max(1, Math.ceil(wordCount / 200));

  return (
    <div className="min-h-screen bg-cream text-charcoal flex flex-col font-sans selection:bg-sage/20 selection:text-charcoal pb-16 lg:pb-0">
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
        onAIClick={() => setIsAIAssistantOpen(true)}
        onRedactClick={() => setIsRedactionModalOpen(true)}
        onMultisigClick={() => setIsMultisigModalOpen(true)}
        onForensicsClick={() => setIsForensicsModalOpen(true)}
        onAirGapClick={() => setIsAirGapModalOpen(true)}
        onOnboardingClick={() => setIsOnboardingOpen(true)}
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
            {/* Left Sidebar (Only in Editor Mode on Desktop for Symmetrical Balance) */}
            {activeTab === 'editor' && (
              <div className="hidden lg:block lg:col-span-3 space-y-5 sticky top-20">
                {/* Article Info & Reading Stats */}
                <div className="bg-cream-light rounded-lg p-5 border border-cream-border space-y-4">
                  <div className="pb-3 border-b border-cream-border">
                    <span className="text-[10px] font-mono uppercase tracking-wider text-charcoal-muted">Publication Overview</span>
                    <h3 className="text-sm font-serif font-bold text-charcoal mt-1 line-clamp-2">
                      {documentTitle}
                    </h3>
                  </div>

                  <div className="space-y-2 text-xs">
                    <div className="flex items-center justify-between text-charcoal-muted">
                      <span className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-sage" />
                        Reading Time
                      </span>
                      <span className="font-medium text-charcoal">{readTimeMin} min read</span>
                    </div>

                    <div className="flex items-center justify-between text-charcoal-muted">
                      <span className="flex items-center gap-1.5">
                        <BookOpen className="w-3.5 h-3.5 text-sage" />
                        Word Count
                      </span>
                      <span className="font-mono text-charcoal">{wordCount} words</span>
                    </div>

                    <div className="flex items-center justify-between text-charcoal-muted">
                      <span className="flex items-center gap-1.5">
                        <KeyRound className="w-3.5 h-3.5 text-sage" />
                        Author Fingerprint
                      </span>
                      <span className="font-mono text-[10px] text-charcoal">{identity.fingerprint.slice(0, 10)}...</span>
                    </div>
                  </div>
                </div>

                {/* Trust & Innovation Primitives */}
                <div className="bg-cream-light rounded-lg p-5 border border-cream-border space-y-3">
                  <h4 className="text-xs font-serif font-bold text-charcoal">Cryptographic Tools</h4>
                  <div className="space-y-1.5">
                    <button
                      onClick={() => setIsRedactionModalOpen(true)}
                      className="w-full flex items-center justify-between p-2 rounded bg-cream hover:bg-cream-dark border border-cream-border text-xs text-charcoal transition-colors text-left"
                    >
                      <span className="flex items-center gap-2">
                        <EyeOff className="w-3.5 h-3.5 text-sage" />
                        ZK-Redact Studio
                      </span>
                      <span className="text-[10px] text-charcoal-muted font-mono">Merkle</span>
                    </button>

                    <button
                      onClick={() => setIsMultisigModalOpen(true)}
                      className="w-full flex items-center justify-between p-2 rounded bg-cream hover:bg-cream-dark border border-cream-border text-xs text-charcoal transition-colors text-left"
                    >
                      <span className="flex items-center gap-2">
                        <Award className="w-3.5 h-3.5 text-terracotta" />
                        Multisig Seal
                      </span>
                      <span className="text-[10px] text-charcoal-muted font-mono">Quorum</span>
                    </button>

                    <button
                      onClick={() => setIsForensicsModalOpen(true)}
                      className="w-full flex items-center justify-between p-2 rounded bg-cream hover:bg-cream-dark border border-cream-border text-xs text-charcoal transition-colors text-left"
                    >
                      <span className="flex items-center gap-2">
                        <Activity className="w-3.5 h-3.5 text-sage" />
                        Origin Forensics
                      </span>
                      <span className="text-[10px] text-charcoal-muted font-mono">Heatmap</span>
                    </button>

                    <button
                      onClick={() => setIsAirGapModalOpen(true)}
                      className="w-full flex items-center justify-between p-2 rounded bg-cream hover:bg-cream-dark border border-cream-border text-xs text-charcoal transition-colors text-left"
                    >
                      <span className="flex items-center gap-2">
                        <QrCode className="w-3.5 h-3.5 text-charcoal" />
                        Optical Air-Gap Sync
                      </span>
                      <span className="text-[10px] text-charcoal-muted font-mono">Offline</span>
                    </button>
                  </div>
                </div>

                {/* Tour & Guide Trigger */}
                <button
                  onClick={() => setIsOnboardingOpen(true)}
                  className="w-full flex items-center justify-center space-x-2 py-2.5 px-3 rounded bg-cream hover:bg-cream-dark border border-cream-border text-xs text-charcoal font-medium transition-colors"
                >
                  <HelpCircle className="w-4 h-4 text-sage" />
                  <span>Platform Guide & Tour</span>
                </button>
              </div>
            )}

            {/* Main Center Content View */}
            <div className={`${activeTab === 'editor' ? 'lg:col-span-6' : 'lg:col-span-12'}`}>
              {activeTab === 'editor' && (
                <Editor
                  ydoc={ydoc}
                  onFlushCommit={flushCommit}
                  documentTitle={documentTitle}
                />
              )}

              {activeTab === 'dag' && (
                <DAGVisualizer
                  dag={dag}
                  commits={commits}
                  heads={heads}
                  onSelectCommit={handleOpenAICommit}
                />
              )}

              {activeTab === 'blame' && <SignedBlame ydoc={ydoc} commits={commits} />}

              {activeTab === 'timetravel' && <TimeTravel dag={dag} commits={commits} />}

              {activeTab === 'audit' && (
                <AuditVerifierModal isStandaloneTab={true} />
              )}
            </div>

            {/* Right Sidebar (Only in Editor Mode on Desktop) */}
            {activeTab === 'editor' && (
              <div className="hidden lg:block lg:col-span-3 space-y-5 sticky top-20">
                {/* Active Peers Presence */}
                <ActivePeers
                  peers={activePeers}
                  currentUserFingerprint={identity.fingerprint}
                  currentUserDisplayName={displayName}
                  currentUserColor={userColor}
                  onShareClick={() => setIsShareOpen(true)}
                />

                {/* Quick DAG Feed */}
                <div className="bg-cream-light rounded-lg p-5 border border-cream-border">
                  <div className="flex items-center justify-between pb-3 border-b border-cream-border mb-3">
                    <div className="flex items-center space-x-2">
                      <Layers className="h-4 w-4 text-sage" />
                      <h3 className="text-sm font-serif font-bold text-charcoal">Recent Commits</h3>
                    </div>
                    <button
                      onClick={() => setActiveTab('dag')}
                      className="text-xs text-sage hover:underline font-medium"
                    >
                      View Graph →
                    </button>
                  </div>
                  <div className="max-h-80 overflow-y-auto pr-1">
                    <Timeline
                      commits={commits}
                      heads={heads}
                      onSelectCommit={handleOpenAICommit}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Mobile Bottom Navigation Bar for Symmetrical Touch Navigation */}
      <div className="block lg:hidden fixed bottom-0 left-0 right-0 bg-cream-light border-t border-cream-border p-2 z-40">
        <div className="flex items-center justify-around text-[11px]">
          <button
            onClick={() => setActiveTab('editor')}
            className={`flex flex-col items-center p-1 rounded ${activeTab === 'editor' ? 'text-charcoal font-bold' : 'text-charcoal-muted'}`}
          >
            <FileText className="h-4 w-4 mb-0.5" />
            <span>Write</span>
          </button>
          <button
            onClick={() => setActiveTab('dag')}
            className={`flex flex-col items-center p-1 rounded ${activeTab === 'dag' ? 'text-charcoal font-bold' : 'text-charcoal-muted'}`}
          >
            <Layers className="h-4 w-4 mb-0.5" />
            <span>Graph</span>
          </button>
          <button
            onClick={() => setActiveTab('blame')}
            className={`flex flex-col items-center p-1 rounded ${activeTab === 'blame' ? 'text-charcoal font-bold' : 'text-charcoal-muted'}`}
          >
            <ShieldCheck className="h-4 w-4 mb-0.5" />
            <span>Blame</span>
          </button>
          <button
            onClick={() => setActiveTab('timetravel')}
            className={`flex flex-col items-center p-1 rounded ${activeTab === 'timetravel' ? 'text-charcoal font-bold' : 'text-charcoal-muted'}`}
          >
            <Clock className="h-4 w-4 mb-0.5" />
            <span>History</span>
          </button>
          <button
            onClick={() => setIsAIAssistantOpen(true)}
            className="flex flex-col items-center p-1 rounded text-sage font-medium"
          >
            <Sparkles className="h-4 w-4 mb-0.5" />
            <span>AI</span>
          </button>
        </div>
      </div>

      {/* Onboarding Modal */}
      <OnboardingModal
        isOpen={isOnboardingOpen}
        onClose={handleCloseOnboarding}
      />

      {/* Modals & AI Assistant Drawer */}
      <AIAssistantDrawer
        isOpen={isAIAssistantOpen}
        onClose={() => setIsAIAssistantOpen(false)}
        dag={dag}
        commits={commits}
        heads={heads}
        ydoc={ydoc}
        documentTitle={documentTitle}
        documentId={documentId}
        onApplyAISuggestion={handleApplyAISuggestion}
        selectedCommitId={selectedAICommitId}
      />

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
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-charcoal/40 p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsVerifierModalOpen(false);
          }}
        >
          <AuditVerifierModal onClose={() => setIsVerifierModalOpen(false)} />
        </div>
      )}

      {/* Phase 1: ZK-Redact Studio */}
      <RedactionStudioModal
        isOpen={isRedactionModalOpen}
        onClose={() => setIsRedactionModalOpen(false)}
        documentId={documentId}
        documentTitle={documentTitle}
        documentText={docText}
        identity={identity}
        heads={heads}
      />

      {/* Phase 2: Multisig Milestone Seals */}
      <MultisigMilestoneModal
        isOpen={isMultisigModalOpen}
        onClose={() => setIsMultisigModalOpen(false)}
        documentId={documentId}
        documentTitle={documentTitle}
        documentText={docText}
        identity={identity}
        activePeers={activePeers}
      />

      {/* Phase 3: Forensic Attribution Inspector */}
      <ForensicInspectorModal
        isOpen={isForensicsModalOpen}
        onClose={() => setIsForensicsModalOpen(false)}
        documentId={documentId}
        documentTitle={documentTitle}
        documentText={docText}
        identity={identity}
      />

      {/* Phase 4: Optical Air-Gap Sync */}
      <AirGapSyncModal
        isOpen={isAirGapModalOpen}
        onClose={() => setIsAirGapModalOpen(false)}
        documentId={documentId}
        documentTitle={documentTitle}
        documentText={docText}
        onApplyReconstructedPayload={handleApplyAISuggestion}
      />

    </div>
  );
}

export default App;
