import React, { useState, useEffect, useMemo } from 'react';
import * as Y from 'yjs';
import {
  CommitDAG,
  HermesAIEngine,
  SignedCommitNode,
  AIProviderType,
  AIProviderConfig,
  AISuggestion,
} from '@hermes/core';
import { extractTextFromYDoc } from '../../lib/yjsUtils.js';
import {
  Sparkles,
  Bot,
  GitBranch,
  History,
  Send,
  Wand2,
  Settings,
  ShieldCheck,
  Layers,
  Check,
  X,
  RefreshCw,
  User,
  Clock,
} from 'lucide-react';

export interface AIAssistantDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  dag: CommitDAG;
  commits: SignedCommitNode[];
  heads: string[];
  ydoc: Y.Doc;
  documentTitle: string;
  documentId: string;
  onApplyAISuggestion: (newContent: string) => Promise<void>;
  selectedCommitId?: string | null;
}

export const AIAssistantDrawer: React.FC<AIAssistantDrawerProps> = ({
  isOpen,
  onClose,
  dag,
  commits,
  heads,
  ydoc,
  documentTitle,
  documentId,
  onApplyAISuggestion,
  selectedCommitId,
}) => {
  const [activeTab, setActiveTab] = useState<'qna' | 'commit' | 'branches' | 'refactor' | 'settings'>('qna');
  const [currentCommitId, setCurrentCommitId] = useState<string>(selectedCommitId || commits[commits.length - 1]?.id || '');

  // Provider configuration state
  const [providerType, setProviderType] = useState<AIProviderType>(() => {
    return (localStorage.getItem('hermes_ai_type') as AIProviderType) || 'heuristic';
  });
  const [apiKey, setApiKey] = useState(() => localStorage.getItem('hermes_ai_key') || '');
  const [endpoint, setEndpoint] = useState(() => localStorage.getItem('hermes_ai_endpoint') || 'http://localhost:11434');
  const [model, setModel] = useState(() => localStorage.getItem('hermes_ai_model') || 'llama3.2');

  // AI Engine instance
  const aiEngine = useMemo(() => {
    const config: AIProviderConfig = {
      type: providerType,
      apiKey: apiKey || undefined,
      endpoint: endpoint || undefined,
      model: model || undefined,
    };
    return new HermesAIEngine(config);
  }, [providerType, apiKey, endpoint, model]);

  // Q&A state
  const [questionInput, setQuestionInput] = useState('');
  const [chatMessages, setChatMessages] = useState<Array<{ sender: 'user' | 'ai'; text: string; timestamp: number }>>([
    {
      sender: 'ai',
      text: `Hello! I'm Hermes AI. I understand this document's Merkle DAG, cryptographic provenance, and commit history. Ask me anything about who made changes, branch divergences, or history evolution.`,
      timestamp: Date.now(),
    },
  ]);
  const [isAnswering, setIsAnswering] = useState(false);

  // Commit explanation state
  const [commitExplanation, setCommitExplanation] = useState<string>('');
  const [isExplainingCommit, setIsExplainingCommit] = useState(false);

  // Branch analysis state
  const [branchAnalysis, setBranchAnalysis] = useState<string>('');
  const [isAnalyzingBranches, setIsAnalyzingBranches] = useState(false);

  // Refactor state
  const [refactorPrompt, setRefactorPrompt] = useState('');
  const [suggestion, setSuggestion] = useState<AISuggestion | null>(null);
  const [isGeneratingSuggestion, setIsGeneratingSuggestion] = useState(false);
  const [isApplying, setIsApplying] = useState(false);

  // Sync selectedCommitId
  useEffect(() => {
    if (selectedCommitId) {
      setCurrentCommitId(selectedCommitId);
      setActiveTab('commit');
    }
  }, [selectedCommitId]);

  // Fetch commit explanation when switching commit
  useEffect(() => {
    if (!currentCommitId) return;
    const commit = dag.get(currentCommitId);
    if (!commit) return;

    let isMounted = true;
    setIsExplainingCommit(true);

    aiEngine
      .explainDiff(commit, dag)
      .then((explanation) => {
        if (isMounted) {
          setCommitExplanation(explanation);
          setIsExplainingCommit(false);
        }
      })
      .catch(() => {
        if (isMounted) setIsExplainingCommit(false);
      });

    return () => {
      isMounted = false;
    };
  }, [currentCommitId, dag, aiEngine]);

  // Fetch branch analysis when switching to branches tab
  useEffect(() => {
    if (activeTab === 'branches' && heads.length >= 2) {
      setIsAnalyzingBranches(true);
      aiEngine
        .detectBranchConflict(heads[0], heads[1], dag)
        .then((report) => {
          setBranchAnalysis(report);
          setIsAnalyzingBranches(false);
        })
        .catch(() => setIsAnalyzingBranches(false));
    }
  }, [activeTab, heads, dag, aiEngine]);

  const saveSettings = () => {
    localStorage.setItem('hermes_ai_type', providerType);
    localStorage.setItem('hermes_ai_key', apiKey);
    localStorage.setItem('hermes_ai_endpoint', endpoint);
    localStorage.setItem('hermes_ai_model', model);
    setActiveTab('qna');
  };

  const handleAskQuestion = async (customQ?: string) => {
    const q = customQ || questionInput;
    if (!q.trim() || isAnswering) return;

    const userMsg = { sender: 'user' as const, text: q, timestamp: Date.now() };
    setChatMessages((prev) => [...prev, userMsg]);
    setQuestionInput('');
    setIsAnswering(true);

    const currentText = extractTextFromYDoc(ydoc, 'default');

    try {
      const answer = await aiEngine.askHistoryQnA(q, dag, documentId, documentTitle, currentText);
      setChatMessages((prev) => [...prev, { sender: 'ai', text: answer, timestamp: Date.now() }]);
    } catch (err: any) {
      setChatMessages((prev) => [
        ...prev,
        { sender: 'ai', text: `Error analyzing DAG: ${err?.message || err}`, timestamp: Date.now() },
      ]);
    } finally {
      setIsAnswering(false);
    }
  };

  const handleGenerateSuggestion = async () => {
    if (!refactorPrompt.trim() || isGeneratingSuggestion) return;
    setIsGeneratingSuggestion(true);

    const currentText = extractTextFromYDoc(ydoc, 'default');

    try {
      const res = await aiEngine.suggestEdit(refactorPrompt, currentText);
      setSuggestion(res);
    } catch (err) {
      console.error('Failed to generate edit proposal', err);
    } finally {
      setIsGeneratingSuggestion(false);
    }
  };

  const handleApplySuggestion = async () => {
    if (!suggestion) return;
    setIsApplying(true);
    try {
      await onApplyAISuggestion(suggestion.proposedText);
      setSuggestion(null);
      setRefactorPrompt('');
    } catch (err) {
      console.error('Failed to apply AI suggestion', err);
    } finally {
      setIsApplying(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop overlay to prevent underlying page bleeding through */}
      <div
        className="fixed inset-0 z-50 bg-charcoal/40 transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Slide-out Solid Drawer */}
      <div className="fixed inset-y-0 right-0 z-50 w-full max-w-xl bg-white border-l border-cream-border flex flex-col font-sans text-charcoal shadow-2xl">
        {/* Drawer Header with 100% solid background */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-cream-border bg-[#F9F6F0]">
          <div className="flex items-center space-x-3">
            <div className="rounded border border-sage/30 bg-sage/10 p-2 text-sage">
              <Sparkles className="h-4 w-4" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-sm font-bold font-serif text-charcoal">Hermes AI Intelligence</h2>
                <span className="rounded bg-white px-1.5 py-0.5 text-[9px] font-mono text-sage border border-cream-border font-medium">
                  {aiEngine.getProvider().name.includes('Offline') ? '100% Offline' : aiEngine.getProvider().name}
                </span>
              </div>
              <p className="text-[11px] text-charcoal-muted">Provenance, History & Merkle DAG Reasoning</p>
            </div>
          </div>

          <div className="flex items-center space-x-1">
            <button
              onClick={() => setActiveTab('settings')}
              title="AI Provider Settings"
              className={`p-1.5 rounded text-charcoal-muted hover:text-charcoal hover:bg-cream transition-colors border border-transparent ${
                activeTab === 'settings' ? 'bg-white text-charcoal border-cream-border' : ''
              }`}
            >
              <Settings className="h-4 w-4" />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded text-charcoal-muted hover:text-charcoal hover:bg-cream transition-colors border border-transparent hover:border-cream-border"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Tabs with 100% solid background */}
        <div className="flex items-center space-x-1 px-4 py-2 border-b border-cream-border bg-[#F4F0E8] text-xs">
          <button
            onClick={() => setActiveTab('qna')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded transition-colors ${
              activeTab === 'qna' ? 'bg-white text-charcoal font-semibold border border-cream-border' : 'text-charcoal-muted hover:text-charcoal'
            }`}
          >
            <History className="h-3.5 w-3.5" />
            <span>History Q&A</span>
          </button>

          <button
            onClick={() => setActiveTab('commit')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded transition-colors ${
              activeTab === 'commit' ? 'bg-white text-charcoal font-semibold border border-cream-border' : 'text-charcoal-muted hover:text-charcoal'
            }`}
          >
            <Layers className="h-3.5 w-3.5" />
            <span>Commit Explainer</span>
          </button>

          <button
            onClick={() => setActiveTab('branches')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded transition-colors ${
              activeTab === 'branches' ? 'bg-white text-charcoal font-semibold border border-cream-border' : 'text-charcoal-muted hover:text-charcoal'
            }`}
          >
            <GitBranch className="h-3.5 w-3.5" />
            <span>Branches {heads.length > 1 && <span className="bg-terracotta text-white font-bold px-1 rounded text-[9px]">!</span>}</span>
          </button>

          <button
            onClick={() => setActiveTab('refactor')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded transition-colors ${
              activeTab === 'refactor' ? 'bg-white text-charcoal font-semibold border border-cream-border' : 'text-charcoal-muted hover:text-charcoal'
            }`}
          >
            <Wand2 className="h-3.5 w-3.5" />
            <span>Smart Assist</span>
          </button>
        </div>

        {/* Main Tab Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-white">
          {/* --- TAB 1: HISTORY Q&A --- */}
          {activeTab === 'qna' && (
            <div className="flex flex-col h-full space-y-4">
              {/* Quick Prompt Pills */}
              <div className="flex flex-wrap gap-2 text-[11px]">
                {[
                  { icon: User, label: 'Who contributed to this document?', query: 'Who contributed to this document?' },
                  { icon: GitBranch, label: 'Explain DAG branch topology', query: 'Explain DAG branch topology' },
                  { icon: Clock, label: 'Summarize recent revisions', query: 'Summarize recent revisions' },
                  { icon: ShieldCheck, label: 'Are all commits verified?', query: 'Are all commits cryptographically verified?' },
                ].map((pill, idx) => {
                  const IconComp = pill.icon;
                  return (
                    <button
                      key={idx}
                      onClick={() => handleAskQuestion(pill.query)}
                      className="flex items-center space-x-1.5 bg-[#F9F6F0] hover:bg-[#EDE7DB] text-charcoal border border-cream-border px-2.5 py-1 rounded transition-colors"
                    >
                      <IconComp className="h-3 w-3 text-sage" />
                      <span>{pill.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* Chat message bubbles */}
              <div className="flex-1 space-y-3 overflow-y-auto pr-1">
                {chatMessages.map((msg, index) => (
                  <div
                    key={index}
                    className={`flex items-start space-x-2.5 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    {msg.sender === 'ai' && (
                      <div className="h-6 w-6 rounded bg-[#F9F6F0] text-sage flex items-center justify-center flex-shrink-0 border border-cream-border mt-0.5">
                        <Bot className="h-3.5 w-3.5" />
                      </div>
                    )}
                    <div
                      className={`rounded-lg px-4 py-2.5 text-xs max-w-[85%] leading-relaxed ${
                        msg.sender === 'user'
                          ? 'bg-charcoal text-cream-50'
                          : 'bg-[#F9F6F0] border border-cream-border text-charcoal'
                      }`}
                    >
                      <div className="whitespace-pre-wrap font-sans">{msg.text}</div>
                    </div>
                  </div>
                ))}
                {isAnswering && (
                  <div className="flex items-center space-x-2 text-xs text-sage">
                    <Bot className="h-4 w-4 animate-spin" />
                    <span>Traversing Merkle DAG & analyzing commits...</span>
                  </div>
                )}
              </div>

              {/* Input Bar */}
              <div className="pt-2 border-t border-cream-border">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleAskQuestion();
                  }}
                  className="flex items-center space-x-2"
                >
                  <input
                    type="text"
                    placeholder="Ask about authors, commits, branches, or provenance..."
                    value={questionInput}
                    onChange={(e) => setQuestionInput(e.target.value)}
                    className="flex-1 bg-[#F9F6F0] border border-cream-border rounded px-3.5 py-2 text-xs text-charcoal placeholder-charcoal-muted focus:outline-none focus:border-charcoal font-sans"
                  />
                  <button
                    type="submit"
                    disabled={!questionInput.trim() || isAnswering}
                    className="bg-charcoal hover:bg-charcoal/90 disabled:opacity-40 text-cream-50 p-2 rounded transition-colors border border-charcoal"
                  >
                    <Send className="h-3.5 w-3.5" />
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* --- TAB 2: COMMIT EXPLAINER --- */}
          {activeTab === 'commit' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-charcoal">Select Commit Node:</label>
                <select
                  value={currentCommitId}
                  onChange={(e) => setCurrentCommitId(e.target.value)}
                  className="bg-[#F9F6F0] border border-cream-border rounded px-2.5 py-1 text-xs text-charcoal font-mono focus:outline-none focus:border-charcoal"
                >
                  {commits.map((c) => (
                    <option key={c.id} value={c.id}>
                      #{c.id.slice(0, 8)} ({c.author.fingerprint.slice(0, 10)}) -{' '}
                      {new Date(c.timestamp).toLocaleTimeString()}
                    </option>
                  ))}
                </select>
              </div>

              {isExplainingCommit ? (
                <div className="flex items-center justify-center p-12 text-xs text-sage space-x-2">
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  <span>Generating semantic diff & commit explanation...</span>
                </div>
              ) : (
                <div className="bg-[#F9F6F0] border border-cream-border rounded-lg p-4 text-xs space-y-3">
                  <div className="whitespace-pre-wrap leading-relaxed text-charcoal font-sans">
                    {commitExplanation || 'No commit selected.'}
                  </div>

                  <div className="pt-3 border-t border-cream-border flex items-center justify-between text-[11px] text-charcoal-muted">
                    <div className="flex items-center space-x-1.5 text-sage">
                      <ShieldCheck className="h-3.5 w-3.5" />
                      <span>Cryptographically Authenticated (ECDSA P-256)</span>
                    </div>
                    <span className="font-mono text-charcoal-muted">Node: #{currentCommitId.slice(0, 8)}</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* --- TAB 3: BRANCH & CONFLICT ANALYSIS --- */}
          {activeTab === 'branches' && (
            <div className="space-y-4">
              <div className="p-3 bg-[#F9F6F0] border border-cream-border rounded-lg flex items-center justify-between text-xs">
                <div>
                  <p className="font-semibold text-charcoal">Active Merkle DAG Heads</p>
                  <p className="text-[11px] text-charcoal-muted">
                    {heads.length} branch head(s) currently registered in graph.
                  </p>
                </div>
                <div className="flex items-center space-x-1">
                  {heads.map((h) => (
                    <span key={h} className="font-mono bg-white text-sage border border-cream-border px-2 py-0.5 rounded text-[10px] font-medium">
                      #{h.slice(0, 6)}
                    </span>
                  ))}
                </div>
              </div>

              {heads.length <= 1 ? (
                <div className="bg-[#F9F6F0] border border-cream-border rounded-lg p-6 text-center space-y-2 text-xs text-charcoal">
                  <Check className="h-8 w-8 text-sage mx-auto" />
                  <p className="font-semibold text-charcoal font-serif">Single Unified Head</p>
                  <p className="text-charcoal-muted text-[11px]">
                    All peer commits are currently merged into a single branch. There are no divergent branches active.
                  </p>
                </div>
              ) : (
                <div className="bg-[#F9F6F0] border border-cream-border rounded-lg p-4 text-xs space-y-3">
                  {isAnalyzingBranches ? (
                    <div className="flex items-center justify-center p-8 text-sage space-x-2">
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      <span>Analyzing branch divergence & conflict risks...</span>
                    </div>
                  ) : (
                    <div className="whitespace-pre-wrap leading-relaxed text-charcoal font-sans">
                      {branchAnalysis}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* --- TAB 4: SMART REFACTOR (HUMAN-IN-THE-LOOP) --- */}
          {activeTab === 'refactor' && (
            <div className="space-y-4 text-xs">
              <div className="space-y-1.5">
                <label className="font-semibold text-charcoal">Prompt AI to Edit Document:</label>
                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    placeholder="e.g., 'Add a security overview section', 'Generate Table of Contents', 'Clean formatting'"
                    value={refactorPrompt}
                    onChange={(e) => setRefactorPrompt(e.target.value)}
                    className="flex-1 bg-[#F9F6F0] border border-cream-border rounded px-3 py-2 text-xs text-charcoal placeholder-charcoal-muted focus:outline-none focus:border-charcoal font-sans"
                  />
                  <button
                    onClick={handleGenerateSuggestion}
                    disabled={!refactorPrompt.trim() || isGeneratingSuggestion}
                    className="flex items-center space-x-1.5 bg-charcoal hover:bg-charcoal/90 disabled:opacity-40 text-cream-50 px-3.5 py-2 rounded transition-colors font-semibold border border-charcoal"
                  >
                    <Sparkles className="h-3.5 w-3.5" />
                    <span>Generate</span>
                  </button>
                </div>
              </div>

              {isGeneratingSuggestion && (
                <div className="flex items-center justify-center p-8 text-sage space-x-2">
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  <span>AI is formulating document revision...</span>
                </div>
              )}

              {suggestion && (
                <div className="bg-[#F9F6F0] border border-cream-border rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-cream-border">
                    <span className="font-semibold text-charcoal font-serif">Proposed Revision Preview</span>
                    <span className="text-[10px] text-sage font-medium">{suggestion.summary}</span>
                  </div>

                  {/* Diff Preview */}
                  <div className="max-h-60 overflow-y-auto font-mono text-[11px] space-y-0.5 bg-white p-3 rounded border border-cream-border">
                    {suggestion.diffLines.slice(0, 40).map((line, idx) => (
                      <div
                        key={idx}
                        className={`px-1.5 py-0.5 rounded ${
                          line.type === 'added'
                            ? 'bg-sage/15 text-sage font-semibold'
                            : line.type === 'removed'
                            ? 'bg-rose-50 text-rose-700 line-through opacity-70'
                            : 'text-charcoal-muted opacity-60'
                        }`}
                      >
                        {line.type === 'added' ? '+ ' : line.type === 'removed' ? '- ' : '  '}
                        {line.text}
                      </div>
                    ))}
                  </div>

                  <div className="p-2.5 bg-white border border-cream-border rounded text-[11px] text-charcoal-muted space-y-1">
                    <div className="flex items-center space-x-1.5 text-sage font-semibold">
                      <ShieldCheck className="h-3.5 w-3.5" />
                      <span>Human-in-the-Loop Cryptographic Invariant</span>
                    </div>
                    <p>
                      Applying this AI suggestion will update Yjs and trigger your local WebCrypto ECDSA key to sign a new verified commit node on the Merkle DAG.
                    </p>
                  </div>

                  <div className="flex items-center justify-end space-x-2 pt-2">
                    <button
                      onClick={() => setSuggestion(null)}
                      className="px-3 py-1.5 bg-white hover:bg-cream text-charcoal border border-cream-border rounded font-medium"
                    >
                      Discard
                    </button>
                    <button
                      onClick={handleApplySuggestion}
                      disabled={isApplying}
                      className="flex items-center space-x-1.5 px-4 py-1.5 bg-charcoal hover:bg-charcoal/90 text-cream-50 rounded font-semibold border border-charcoal"
                    >
                      <Check className="h-3.5 w-3.5" />
                      <span>{isApplying ? 'Signing Commit...' : 'Approve & Cryptographically Sign'}</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* --- TAB 5: AI SETTINGS --- */}
          {activeTab === 'settings' && (
            <div className="space-y-4 text-xs">
              <div className="p-3 bg-[#F9F6F0] border border-cream-border rounded-lg space-y-1">
                <p className="font-semibold text-charcoal">Select AI Provider</p>
                <p className="text-[11px] text-charcoal-muted">
                  Hermes AI operates on zero-cost local heuristics by default, with optional local LLM (Ollama) or Cloud API adapters.
                </p>
              </div>

              <div className="space-y-2">
                <label className="font-semibold text-charcoal block">Provider Engine:</label>
                <div className="grid grid-cols-1 gap-2">
                  {[
                    {
                      type: 'heuristic' as const,
                      name: 'Built-in Offline Analyzer',
                      desc: '100% Free, Air-Gapped, Zero-Latency, Zero External Dependencies',
                    },
                    {
                      type: 'ollama' as const,
                      name: 'Ollama Local LLM',
                      desc: 'Private self-hosted local model (e.g. llama3.2, mistral)',
                    },
                    {
                      type: 'cloud' as const,
                      name: 'Cloud API (Gemini / OpenAI / Groq)',
                      desc: 'Connect with your own API key (stored in client memory only)',
                    },
                  ].map((item) => (
                    <button
                      key={item.type}
                      onClick={() => setProviderType(item.type)}
                      className={`text-left p-3 rounded-lg border transition-colors ${
                        providerType === item.type
                          ? 'bg-[#F9F6F0] border-charcoal'
                          : 'bg-white border-cream-border hover:border-charcoal-muted'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-charcoal">{item.name}</span>
                        {providerType === item.type && <Check className="h-3.5 w-3.5 text-sage" />}
                      </div>
                      <p className="text-[11px] text-charcoal-muted mt-0.5">{item.desc}</p>
                    </button>
                  ))}
                </div>
              </div>

              {providerType === 'ollama' && (
                <div className="space-y-3 bg-[#F9F6F0] p-3.5 rounded-lg border border-cream-border">
                  <div>
                    <label className="block text-charcoal font-semibold mb-1">Ollama Server Endpoint:</label>
                    <input
                      type="text"
                      value={endpoint}
                      onChange={(e) => setEndpoint(e.target.value)}
                      placeholder="http://localhost:11434"
                      className="w-full bg-white border border-cream-border rounded px-2.5 py-1.5 text-xs text-charcoal font-mono focus:outline-none focus:border-charcoal"
                    />
                  </div>
                  <div>
                    <label className="block text-charcoal font-semibold mb-1">Model Name:</label>
                    <input
                      type="text"
                      value={model}
                      onChange={(e) => setModel(e.target.value)}
                      placeholder="llama3.2"
                      className="w-full bg-white border border-cream-border rounded px-2.5 py-1.5 text-xs text-charcoal font-mono focus:outline-none focus:border-charcoal"
                    />
                  </div>
                </div>
              )}

              {providerType === 'cloud' && (
                <div className="space-y-3 bg-[#F9F6F0] p-3.5 rounded-lg border border-cream-border">
                  <div>
                    <label className="block text-charcoal font-semibold mb-1">API Key:</label>
                    <input
                      type="password"
                      value={apiKey}
                      onChange={(e) => setApiKey(e.target.value)}
                      placeholder="sk-..."
                      className="w-full bg-white border border-cream-border rounded px-2.5 py-1.5 text-xs text-charcoal font-mono focus:outline-none focus:border-charcoal"
                    />
                    <p className="text-[10px] text-charcoal-muted mt-1">
                      Your key is stored only in your local browser and never sent to peers or signaling relays.
                    </p>
                  </div>
                  <div>
                    <label className="block text-charcoal font-semibold mb-1">Model / Endpoint:</label>
                    <input
                      type="text"
                      value={model}
                      onChange={(e) => setModel(e.target.value)}
                      placeholder="gpt-4o-mini or gemini-1.5-flash"
                      className="w-full bg-white border border-cream-border rounded px-2.5 py-1.5 text-xs text-charcoal font-mono focus:outline-none focus:border-charcoal"
                    />
                  </div>
                </div>
              )}

              <button
                onClick={saveSettings}
                className="w-full py-2 bg-charcoal hover:bg-charcoal/90 text-cream-50 font-semibold rounded border border-charcoal transition-colors"
              >
                Save AI Configuration
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
};
