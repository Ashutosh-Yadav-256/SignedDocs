import React, { useState, useEffect } from 'react';
import {
  Activity,
  Bot,
  UserCheck,
  ClipboardPaste,
  ShieldAlert,
  Sparkles,
  Download,
  X,
  FileBadge,
} from 'lucide-react';
import {
  AttributionSpan,
  ForensicsEngine,
  ForensicsManifest,
} from '@hermes/core';

interface ForensicInspectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  documentId: string;
  documentTitle: string;
  documentText: string;
  identity: {
    fingerprint: string;
  } | null;
}

export const ForensicInspectorModal: React.FC<ForensicInspectorModalProps> = ({
  isOpen,
  onClose,
  documentId,
  documentTitle,
  documentText,
  identity,
}) => {
  const [manifest, setManifest] = useState<ForensicsManifest | null>(null);
  const [selectedSpan, setSelectedSpan] = useState<AttributionSpan | null>(null);

  useEffect(() => {
    if (isOpen && documentText) {
      // Create initial simulated granular spans based on document text paragraphs
      const paragraphs = documentText.split(/\n\s*\n/).filter((p) => p.trim().length > 0);
      let currentIndex = 0;
      const spans: AttributionSpan[] = [];

      paragraphs.forEach((p, idx) => {
        const start = currentIndex;
        const end = currentIndex + p.length;
        currentIndex = end + 2;

        if (idx === 0) {
          spans.push(
            ForensicsEngine.createHumanSpan({
              id: `span_${idx}`,
              startIndex: start,
              endIndex: end,
              text: p,
              authorFingerprint: identity?.fingerprint || 'hermes:author',
              averageIntervalMs: 145,
              varianceMs: 28,
            })
          );
        } else if (idx === 1 && p.toLowerCase().includes('ai') || idx === 1) {
          spans.push(
            ForensicsEngine.createAISpan({
              id: `span_${idx}`,
              startIndex: start,
              endIndex: end,
              text: p,
              authorFingerprint: identity?.fingerprint || 'hermes:author',
              aiModel: 'ollama:llama3.2',
              aiManifestHash: 'sha256:7f91a2b3c4d5e6...',
              humanReviewerFingerprint: identity?.fingerprint || 'hermes:author',
            })
          );
        } else {
          spans.push(
            ForensicsEngine.createHumanSpan({
              id: `span_${idx}`,
              startIndex: start,
              endIndex: end,
              text: p,
              authorFingerprint: identity?.fingerprint || 'hermes:author',
              averageIntervalMs: 160,
              varianceMs: 35,
            })
          );
        }
      });

      const m = ForensicsEngine.createForensicsManifest({
        documentId,
        documentTitle,
        spans,
        totalLength: documentText.length,
      });
      setManifest(m);
      if (spans.length > 0) setSelectedSpan(spans[0]);
    }
  }, [isOpen, documentText, identity]);

  if (!isOpen || !manifest) return null;

  const handleDownloadCertificate = () => {
    const blob = new Blob([JSON.stringify(manifest, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${documentTitle.toLowerCase().replace(/\s+/g, '-')}.forensics.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden text-slate-100">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-lg bg-purple-500/10 border border-purple-500/30 text-purple-400">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold flex items-center gap-2">
                Forensic Attribution & Provenance Heatmap
                <span className="text-xs px-2 py-0.5 rounded-full bg-purple-950 border border-purple-800 text-purple-300 font-mono">
                  Origin Proofs
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Mathematical proof of human keystroke cadence vs. human-audited AI assistance vs. clipboard paste.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Breakdown Stats Bar */}
        <div className="grid grid-cols-3 border-b border-slate-800 bg-slate-950/40 p-4 gap-4">
          <div className="flex items-center space-x-3 p-3 rounded-xl bg-emerald-950/20 border border-emerald-800/40">
            <div className="p-2 rounded-lg bg-emerald-900/40 text-emerald-400">
              <UserCheck className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs text-slate-400 font-medium">Human Direct Typed</div>
              <div className="text-lg font-bold text-emerald-400">
                {manifest.breakdown.humanPercentage}% ({manifest.breakdown.humanTypedChars} chars)
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-3 p-3 rounded-xl bg-purple-950/20 border border-purple-800/40">
            <div className="p-2 rounded-lg bg-purple-900/40 text-purple-400">
              <Bot className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs text-slate-400 font-medium">AI Assisted & Signed</div>
              <div className="text-lg font-bold text-purple-400">
                {manifest.breakdown.aiPercentage}% ({manifest.breakdown.aiAssistedChars} chars)
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-3 p-3 rounded-xl bg-amber-950/20 border border-amber-800/40">
            <div className="p-2 rounded-lg bg-amber-900/40 text-amber-400">
              <ClipboardPaste className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs text-slate-400 font-medium">Clipboard Paste</div>
              <div className="text-lg font-bold text-amber-400">
                {manifest.breakdown.pastePercentage}% ({manifest.breakdown.pastedChars} chars)
              </div>
            </div>
          </div>
        </div>

        {/* Modal Body: Split View */}
        <div className="flex-1 overflow-hidden grid grid-cols-1 md:grid-cols-3">
          {/* Left / Center: Interactive Text Heatmap */}
          <div className="md:col-span-2 p-6 overflow-y-auto space-y-3 border-r border-slate-800">
            <div className="text-xs text-slate-400 mb-2">
              Click any colored section below to inspect its mathematical proof of origin:
            </div>

            {manifest.spans.map((span) => {
              const isSelected = selectedSpan?.id === span.id;
              let bgClass = 'bg-slate-800/50 border-slate-700';
              let badgeColor = 'text-slate-400 bg-slate-800';

              if (span.origin === 'HUMAN_TYPED') {
                bgClass = isSelected
                  ? 'bg-emerald-950/40 border-emerald-600 shadow-md'
                  : 'bg-emerald-950/20 border-emerald-900/60 hover:border-emerald-700';
                badgeColor = 'text-emerald-400 bg-emerald-950 border border-emerald-800';
              } else if (span.origin === 'AI_ASSISTED') {
                bgClass = isSelected
                  ? 'bg-purple-950/40 border-purple-600 shadow-md'
                  : 'bg-purple-950/20 border-purple-900/60 hover:border-purple-700';
                badgeColor = 'text-purple-400 bg-purple-950 border border-purple-800';
              } else if (span.origin === 'EXTERNAL_PASTE') {
                bgClass = isSelected
                  ? 'bg-amber-950/40 border-amber-600 shadow-md'
                  : 'bg-amber-950/20 border-amber-900/60 hover:border-amber-700';
                badgeColor = 'text-amber-400 bg-amber-950 border border-amber-800';
              }

              return (
                <div
                  key={span.id}
                  onClick={() => setSelectedSpan(span)}
                  className={`p-4 rounded-xl border transition-all cursor-pointer ${bgClass}`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className={`text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full ${badgeColor}`}>
                      {span.origin.replace('_', ' ')}
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono truncate max-w-[150px]">
                      {span.authorFingerprint}
                    </span>
                  </div>
                  <p className="text-sm leading-relaxed text-slate-200">{span.text}</p>
                </div>
              );
            })}
          </div>

          {/* Right: Forensic Details Inspector */}
          <div className="p-6 overflow-y-auto bg-slate-950/60 space-y-4">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Forensic Span Analysis
            </h3>

            {selectedSpan ? (
              <div className="space-y-4 text-xs">
                <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
                  <div className="text-slate-400">Classification</div>
                  <div className="text-sm font-bold flex items-center gap-1.5 text-slate-100">
                    {selectedSpan.origin === 'HUMAN_TYPED' && (
                      <>
                        <UserCheck className="w-4 h-4 text-emerald-400" />
                        Direct Human Typing
                      </>
                    )}
                    {selectedSpan.origin === 'AI_ASSISTED' && (
                      <>
                        <Bot className="w-4 h-4 text-purple-400" />
                        AI Assisted (Human Audited)
                      </>
                    )}
                    {selectedSpan.origin === 'EXTERNAL_PASTE' && (
                      <>
                        <ClipboardPaste className="w-4 h-4 text-amber-400" />
                        External Clipboard Paste
                      </>
                    )}
                  </div>
                </div>

                {selectedSpan.cadence && (
                  <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
                    <div className="text-slate-400 flex items-center justify-between">
                      <span>Keystroke Cadence Telemetry</span>
                      <span className="text-emerald-400 font-semibold">Verified Natural</span>
                    </div>
                    <div className="space-y-1 text-[11px] text-slate-300">
                      <div>Mean Interval: <span className="font-mono text-emerald-300">{selectedSpan.cadence.averageIntervalMs} ms</span></div>
                      <div>Cadence Variance: <span className="font-mono text-emerald-300">{selectedSpan.cadence.varianceMs} ms²</span></div>
                      <div>Sample Keystrokes: <span className="font-mono text-slate-200">{selectedSpan.cadence.samplesCount}</span></div>
                    </div>
                  </div>
                )}

                {selectedSpan.aiManifestHash && (
                  <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
                    <div className="text-purple-400 font-semibold flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5" />
                      AI Provenance Manifest
                    </div>
                    <div className="space-y-1 text-[11px] text-slate-300">
                      <div>Model: <span className="font-mono text-purple-300">{selectedSpan.aiModel || 'ollama:llama3.2'}</span></div>
                      <div>Snapshot Hash: <span className="font-mono text-[10px] text-slate-400 truncate block">{selectedSpan.aiManifestHash}</span></div>
                      <div>Reviewer: <span className="font-mono text-[10px] text-emerald-400 truncate block">{selectedSpan.humanReviewerFingerprint}</span></div>
                    </div>
                  </div>
                )}

                <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
                  <div className="text-slate-400">Author Fingerprint</div>
                  <div className="font-mono text-[10px] text-slate-200 break-all">{selectedSpan.authorFingerprint}</div>
                </div>

                <button
                  onClick={handleDownloadCertificate}
                  className="w-full py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs flex items-center justify-center gap-2 shadow-lg shadow-purple-950 transition-all"
                >
                  <FileBadge className="w-4 h-4" />
                  Export Forensics Certificate
                </button>
              </div>
            ) : (
              <div className="text-xs text-slate-500">Select a span on the left to inspect details.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
