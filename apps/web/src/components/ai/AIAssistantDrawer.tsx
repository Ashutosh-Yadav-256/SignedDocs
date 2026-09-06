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
import {
  Sparkles,
  Bot,
  GitBranch,
  History,
  Send,
  Wand2,
  Settings,
  ShieldCheck,
  ShieldAlert,
  Layers,
  Check,
  X,
  Cpu,
  RefreshCw,
  FileText,
  AlertTriangle,
  ArrowRight,
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

    const ytext = ydoc.getText('tiptap') || ydoc.getText('content');
    const currentText = ytext ? ytext.toString() : '';

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

    const ytext = ydoc.getText('tiptap') || ydoc.getText('content');
    const currentText = ytext ? ytext.toString() : '';

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
    <div className="fixed inset-y-0 right-0 z-50 w-full max-w-xl bg-slate-950/95 border-l border-slate-800 backdrop-blur-2xl shadow-2xl flex flex-col font-sans transition-all duration-300">
      {/* Drawer Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800">
        <div className="flex items-center space-x-2.5">
          <div className="relative flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-cyan-500 to-indigo-600 p-0.5 shadow-md shadow-cyan-500/20">
            <div className="flex h-full w-full items-center justify-center rounded-[6px] bg-slate-950">
              <Sparkles className="h-4 w-4 text-cyan-400" />
            </div>
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-sm font-bold text-white">Hermes AI Intelligence</h2>
              <span className="rounded bg-cyan-500/10 px-1.5 py-0.5 text-[9px] font-mono text-cyan-400 border border-cyan-500/20">
                {aiEngine.getProvider().name.includes('Offline') ? '100% Offline / $0' : aiEngine.getProvider().name}
              </span>
            </div>
            <p className="text-[11px] text-slate-400">Provenance, History & Merkle DAG Reasoning</p>
          </div>
        </div>

        <div className="flex items-center space-x-1">
          <button
            onClick={() => setActiveTab('settings')}
            title="AI Provider Settings"
            className={`p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors ${
              activeTab === 'settings' ? 'bg-slate-800 text-cyan-400' : ''
            }`}
          >
            <Settings className="h-4 w-4" />
          </button>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center space-x-1 px-4 py-2 border-b border-slate-800/80 bg-slate-900/50 text-xs">
        <button
          onClick={() => setActiveTab('qna')}
          className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg transition-all ${
            activeTab === 'qna' ? 'bg-cyan-500/20 text-cyan-400 font-semibold border border-cyan-500/30' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <History className="h-3.5 w-3.5" />
          <span>History Q&A</span>
        </button>

        <button
          onClick={() => setActiveTab('commit')}
          className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg transition-all ${
            activeTab === 'commit' ? 'bg-cyan-500/20 text-cyan-400 font-semibold border border-cyan-500/30' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Layers className="h-3.5 w-3.5" />
          <span>Commit Explainer</span>
        </button>

        <button
          onClick={() => setActiveTab('branches')}
          className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg transition-all ${
            activeTab === 'branches' ? 'bg-cyan-500/20 text-cyan-400 font-semibold border border-cyan-500/30' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <GitBranch className="h-3.5 w-3.5" />
          <span>Branches {heads.length > 1 && <span className="bg-amber-500 text-slate-950 font-bold px-1 rounded-full text-[9px]">!</span>}</span>
        </button>

        <button
          onClick={() => setActiveTab('refactor')}
          className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg transition-all ${
            activeTab === 'refactor' ? 'bg-cyan-500/20 text-cyan-400 font-semibold border border-cyan-500/30' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Wand2 className="h-3.5 w-3.5" />
          <span>Smart Assist</span>
        </button>
      </div>

      {/* Main Tab Content */}
      <div className="flex-1 overflow-y-auto p-5 space-y-4">
        {/* --- TAB 1: HISTORY Q&A --- */}
        {activeTab === 'qna' && (
          <div className="flex flex-col h-full space-y-4">
            {/* Quick Prompt Pills */}
            <div className="flex flex-wrap gap-2 text-[11px]">
              {[
                '👤 Who contributed to this document?',
                '🌳 Explain DAG branch topology',
                '⏱️ Summarize recent revisions',
                '🛡️ Are all commits cryptographically verified?',
              ].map((pill, idx) => (
                <button
                  key={idx}
                  onClick={() => handleAskQuestion(pill.replace(/^[^a-zA-Z]+/, ''))}
                  className="bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 hover:border-cyan-500/30 px-2.5 py-1 rounded-full transition-all"
                >
                  {pill}
                </button>
              ))}
            </div>

            {/* Chat message bubbles */}
            <div className="flex-1 space-y-3 overflow-y-auto pr-1">
              {chatMessages.map((msg, index) => (
                <div
                  key={index}
                  className={`flex items-start space-x-2.5 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {msg.sender === 'ai' && (
                    <div className="h-6 w-6 rounded-md bg-cyan-500/20 text-cyan-400 flex items-center justify-center flex-shrink-0 border border-cyan-500/30 mt-0.5">
                      <Bot className="h-3.5 w-3.5" />
                    </div>
                  )}
                  <div
                    className={`rounded-2xl px-4 py-2.5 text-xs max-w-[85%] leading-relaxed ${
                      msg.sender === 'user'
                        ? 'bg-cyan-600 text-white rounded-br-sm'
                        : 'bg-slate-900 border border-slate-800 text-slate-200 rounded-bl-sm shadow-md'
                    }`}
                  >
                    <div className="whitespace-pre-wrap font-sans">{msg.text}</div>
                  </div>
                </div>
              ))}
              {isAnswering && (
                <div className="flex items-center space-x-2 text-xs text-cyan-400 animate-pulse">
                  <Bot className="h-4 w-4" />
                  <span>Traversing Merkle DAG & analyzing commits...</span>
                </div>
              )}
            </div>

            {/* Input Bar */}
            <div className="pt-2 border-t border-slate-800/80">
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
                  className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                />
                <button
                  type="submit"
                  disabled={!questionInput.trim() || isAnswering}
                  className="bg-cyan-600 hover:bg-cyan-500 disabled:opacity-40 text-white p-2 rounded-xl transition-all shadow-md shadow-cyan-500/20"
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
              <label className="text-xs font-semibold text-slate-300">Select Commit Node:</label>
              <select
                value={currentCommitId}
                onChange={(e) => setCurrentCommitId(e.target.value)}
                className="bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1 text-xs text-slate-200 font-mono focus:outline-none focus:border-cyan-500"
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
              <div className="flex items-center justify-center p-12 text-xs text-cyan-400 animate-pulse space-x-2">
                <RefreshCw className="h-4 w-4 animate-spin" />
                <span>Generating semantic diff & commit explanation...</span>
              </div>
            ) : (
              <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 text-xs space-y-3 shadow-lg">
                <div className="whitespace-pre-wrap leading-relaxed text-slate-200">
                  {commitExplanation || 'No commit selected.'}
                </div>

                <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
                  <div className="flex items-center space-x-1.5 text-emerald-400">
                    <ShieldCheck className="h-3.5 w-3.5" />
                    <span>Cryptographically Authenticated (ECDSA P-256)</span>
                  </div>
                  <span className="font-mono text-slate-500">Node: #{currentCommitId.slice(0, 8)}</span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* --- TAB 3: BRANCH & CONFLICT ANALYSIS --- */}
        {activeTab === 'branches' && (
          <div className="space-y-4">
            <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl flex items-center justify-between text-xs">
              <div>
                <p className="font-semibold text-white">Active Merkle DAG Heads</p>
                <p className="text-[11px] text-slate-400">
                  {heads.length} branch head(s) currently registered in graph.
                </p>
              </div>
              <div className="flex items-center space-x-1">
                {heads.map((h) => (
                  <span key={h} className="font-mono bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 px-2 py-0.5 rounded text-[10px]">
                    #{h.slice(0, 6)}
                  </span>
                ))}
              </div>
            </div>

            {heads.length <= 1 ? (
              <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-6 text-center space-y-2 text-xs text-slate-300">
                <Check className="h-8 w-8 text-emerald-400 mx-auto" />
                <p className="font-semibold text-white">Single Unified Head</p>
                <p className="text-slate-400 text-[11px]">
                  All peer commits are currently merged into a single branch. There are no divergent branches active.
                </p>
              </div>
            ) : (
              <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 text-xs space-y-3">
                {isAnalyzingBranches ? (
                  <div className="flex items-center justify-center p-8 text-cyan-400 space-x-2 animate-pulse">
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    <span>Analyzing branch divergence & conflict risks...</span>
                  </div>
                ) : (
                  <div className="whitespace-pre-wrap leading-relaxed text-slate-200">
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
              <label className="font-semibold text-slate-300">Prompt AI to Edit Document:</label>
              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  placeholder="e.g., 'Add a security overview section', 'Generate Table of Contents', 'Clean formatting'"
                  value={refactorPrompt}
                  onChange={(e) => setRefactorPrompt(e.target.value)}
                  className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                />
                <button
                  onClick={handleGenerateSuggestion}
                  disabled={!refactorPrompt.trim() || isGeneratingSuggestion}
                  className="flex items-center space-x-1.5 bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 disabled:opacity-40 text-white px-3.5 py-2 rounded-xl transition-all shadow-md shadow-cyan-500/20 font-semibold"
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  <span>Generate</span>
                </button>
              </div>
            </div>

            {isGeneratingSuggestion && (
              <div className="flex items-center justify-center p-8 text-cyan-400 space-x-2 animate-pulse">
                <RefreshCw className="h-4 w-4 animate-spin" />
                <span>AI is formulating document revision...</span>
              </div>
            )}

            {suggestion && (
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                  <span className="font-semibold text-white">Proposed Revision Preview</span>
                  <span className="text-[10px] text-cyan-400">{suggestion.summary}</span>
                </div>

                {/* Diff Preview */}
                <div className="max-h-60 overflow-y-auto font-mono text-[11px] space-y-0.5 bg-slate-950 p-3 rounded-lg border border-slate-800/80">
                  {suggestion.diffLines.slice(0, 40).map((line, idx) => (
                    <div
                      key={idx}
                      className={`px-1.5 py-0.5 rounded ${
                        line.type === 'added'
                          ? 'bg-emerald-500/10 text-emerald-300 font-semibold'
                          : line.type === 'removed'
                          ? 'bg-rose-500/10 text-rose-300 line-through opacity-70'
                          : 'text-slate-400 opacity-60'
                      }`}
                    >
                      {line.type === 'added' ? '+ ' : line.type === 'removed' ? '- ' : '  '}
                      {line.text}
                    </div>
                  ))}
                </div>

                <div className="p-2.5 bg-slate-950/80 border border-slate-800 rounded-lg text-[11px] text-slate-400 space-y-1">
                  <div className="flex items-center space-x-1.5 text-cyan-300 font-semibold">
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
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg font-medium"
                  >
                    Discard
                  </button>
                  <button
                    onClick={handleApplySuggestion}
                    disabled={isApplying}
                    className="flex items-center space-x-1.5 px-4 py-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-lg font-semibold shadow-md shadow-emerald-500/20"
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
            <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl space-y-1">
              <p className="font-semibold text-white">Select AI Provider</p>
              <p className="text-[11px] text-slate-400">
                Hermes AI operates on zero-cost local heuristics by default, with optional local LLM (Ollama) or Cloud API adapters.
              </p>
            </div>

            <div className="space-y-2">
              <label className="font-semibold text-slate-300 block">Provider Engine:</label>
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
                    className={`text-left p-3 rounded-xl border transition-all ${
                      providerType === item.type
                        ? 'bg-cyan-500/10 border-cyan-500/40 shadow-sm'
                        : 'bg-slate-900 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-white">{item.name}</span>
                      {providerType === item.type && <Check className="h-3.5 w-3.5 text-cyan-400" />}
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5">{item.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            {providerType === 'ollama' && (
              <div className="space-y-3 bg-slate-900 p-3.5 rounded-xl border border-slate-800">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Ollama Server Endpoint:</label>
                  <input
                    type="text"
                    value={endpoint}
                    onChange={(e) => setEndpoint(e.target.value)}
                    placeholder="http://localhost:11434"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 font-mono focus:outline-none focus:border-cyan-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Model Name:</label>
                  <input
                    type="text"
                    value={model}
                    onChange={(e) => setModel(e.target.value)}
                    placeholder="llama3.2"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 font-mono focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>
            )}

            {providerType === 'cloud' && (
              <div className="space-y-3 bg-slate-900 p-3.5 rounded-xl border border-slate-800">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">API Key:</label>
                  <input
                    type="password"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder="sk-..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 font-mono focus:outline-none focus:border-cyan-500"
                  />
                  <p className="text-[10px] text-slate-500 mt-1">
                    Your key is stored only in your local browser and never sent to peers or signaling relays.
                  </p>
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Model / Endpoint:</label>
                  <input
                    type="text"
                    value={model}
                    onChange={(e) => setModel(e.target.value)}
                    placeholder="gpt-4o-mini or gemini-1.5-flash"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 font-mono focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>
            )}

            <button
              onClick={saveSettings}
              className="w-full py-2 bg-gradient-to-r from-cyan-600 to-sky-600 hover:from-cyan-500 hover:to-sky-500 text-white font-semibold rounded-xl shadow-md transition-all"
            >
              Save AI Configuration
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
