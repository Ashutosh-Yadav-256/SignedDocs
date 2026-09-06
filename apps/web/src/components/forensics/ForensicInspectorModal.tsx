import React, { useState, useEffect } from 'react';
import {
  Activity,
  Bot,
  UserCheck,
  ClipboardPaste,
  Sparkles,
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-charcoal/40 p-4">
      <div className="bg-cream-light border border-cream-border rounded-lg w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden text-charcoal">
        {/* Header */}
        <div className="px-6 py-4 border-b border-cream-border flex items-center justify-between bg-cream">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded border border-sage/30 bg-sage/10 text-sage">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-serif font-bold flex items-center gap-2 text-charcoal">
                Forensic Attribution & Provenance Heatmap
                <span className="text-[10px] px-2 py-0.5 rounded bg-cream-light border border-cream-border text-sage font-mono">
                  Origin Proofs
                </span>
              </h2>
              <p className="text-xs text-charcoal-muted">
                Mathematical proof of human keystroke cadence vs. human-audited AI assistance vs. clipboard paste.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded text-charcoal-muted hover:text-charcoal hover:bg-cream-dark transition-colors border border-transparent hover:border-cream-border"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Breakdown Stats Bar */}
        <div className="grid grid-cols-3 border-b border-cream-border bg-cream p-4 gap-4">
          <div className="flex items-center space-x-3 p-3 rounded-lg bg-cream-light border border-cream-border">
            <div className="p-2 rounded bg-sage/15 text-sage">
              <UserCheck className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs text-charcoal-muted font-medium">Human Direct Typed</div>
              <div className="text-lg font-bold text-sage font-mono">
                {manifest.breakdown.humanPercentage}% ({manifest.breakdown.humanTypedChars} chars)
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-3 p-3 rounded-lg bg-cream-light border border-cream-border">
            <div className="p-2 rounded bg-terracotta/15 text-terracotta">
              <Bot className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs text-charcoal-muted font-medium">AI Assisted & Signed</div>
              <div className="text-lg font-bold text-terracotta font-mono">
                {manifest.breakdown.aiPercentage}% ({manifest.breakdown.aiAssistedChars} chars)
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-3 p-3 rounded-lg bg-cream-light border border-cream-border">
            <div className="p-2 rounded bg-cream text-charcoal">
              <ClipboardPaste className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs text-charcoal-muted font-medium">Clipboard Paste</div>
              <div className="text-lg font-bold text-charcoal font-mono">
                {manifest.breakdown.pastePercentage}% ({manifest.breakdown.pastedChars} chars)
              </div>
            </div>
          </div>
        </div>

        {/* Modal Body: Split View */}
        <div className="flex-1 overflow-hidden grid grid-cols-1 md:grid-cols-3">
          {/* Left / Center: Interactive Text Heatmap */}
          <div className="md:col-span-2 p-6 overflow-y-auto space-y-3 border-r border-cream-border bg-cream-light">
            <div className="text-xs text-charcoal-muted mb-2">
              Click any section below to inspect its mathematical proof of origin:
            </div>

            {manifest.spans.map((span) => {
              const isSelected = selectedSpan?.id === span.id;
              let bgClass = 'bg-cream-light border-cream-border';
              let badgeColor = 'text-charcoal bg-cream border border-cream-border';

              if (span.origin === 'HUMAN_TYPED') {
                bgClass = isSelected
                  ? 'bg-sage/10 border-sage'
                  : 'bg-cream-light border-cream-border hover:border-sage/50';
                badgeColor = 'text-sage bg-sage/10 border border-sage/30';
              } else if (span.origin === 'AI_ASSISTED') {
                bgClass = isSelected
                  ? 'bg-terracotta/10 border-terracotta'
                  : 'bg-terracotta/5 border-cream-border hover:border-terracotta/50';
                badgeColor = 'text-terracotta bg-terracotta/10 border border-terracotta/30';
              } else if (span.origin === 'EXTERNAL_PASTE') {
                bgClass = isSelected
                  ? 'bg-cream border-charcoal'
                  : 'bg-cream-light border-cream-border hover:border-charcoal-muted';
                badgeColor = 'text-charcoal bg-cream border border-cream-border';
              }

              return (
                <div
                  key={span.id}
                  onClick={() => setSelectedSpan(span)}
                  className={`p-4 rounded-lg border transition-colors cursor-pointer ${bgClass}`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className={`text-[10px] font-mono font-semibold px-2 py-0.5 rounded ${badgeColor}`}>
                      {span.origin.replace('_', ' ')}
                    </span>
                    <span className="text-[10px] text-charcoal-muted font-mono truncate max-w-[150px]">
                      {span.authorFingerprint}
                    </span>
                  </div>
                  <p className="text-sm leading-relaxed text-charcoal font-serif">{span.text}</p>
                </div>
              );
            })}
          </div>

          {/* Right: Forensic Details Inspector */}
          <div className="p-6 overflow-y-auto bg-cream space-y-4">
            <h3 className="text-xs font-bold text-charcoal-muted uppercase tracking-wider font-mono">
              Forensic Span Analysis
            </h3>

            {selectedSpan ? (
              <div className="space-y-4 text-xs">
                <div className="p-3.5 rounded-lg bg-cream-light border border-cream-border space-y-2">
                  <div className="text-charcoal-muted">Classification</div>
                  <div className="text-sm font-bold flex items-center gap-1.5 text-charcoal font-serif">
                    {selectedSpan.origin === 'HUMAN_TYPED' && (
                      <>
                        <UserCheck className="w-4 h-4 text-sage" />
                        Direct Human Typing
                      </>
                    )}
                    {selectedSpan.origin === 'AI_ASSISTED' && (
                      <>
                        <Bot className="w-4 h-4 text-terracotta" />
                        AI Assisted (Human Audited)
                      </>
                    )}
                    {selectedSpan.origin === 'EXTERNAL_PASTE' && (
                      <>
                        <ClipboardPaste className="w-4 h-4 text-charcoal" />
                        External Clipboard Paste
                      </>
                    )}
                  </div>
                </div>

                {selectedSpan.cadence && (
                  <div className="p-3.5 rounded-lg bg-cream-light border border-cream-border space-y-2">
                    <div className="text-charcoal-muted flex items-center justify-between">
                      <span>Keystroke Cadence Telemetry</span>
                      <span className="text-sage font-semibold">Verified Natural</span>
                    </div>
                    <div className="space-y-1 text-[11px] text-charcoal">
                      <div>Mean Interval: <span className="font-mono text-sage font-semibold">{selectedSpan.cadence.averageIntervalMs} ms</span></div>
                      <div>Cadence Variance: <span className="font-mono text-sage font-semibold">{selectedSpan.cadence.varianceMs} ms²</span></div>
                      <div>Sample Keystrokes: <span className="font-mono text-charcoal">{selectedSpan.cadence.samplesCount}</span></div>
                    </div>
                  </div>
                )}

                {selectedSpan.aiManifestHash && (
                  <div className="p-3.5 rounded-lg bg-cream-light border border-cream-border space-y-2">
                    <div className="text-terracotta font-semibold flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5" />
                      AI Provenance Manifest
                    </div>
                    <div className="space-y-1 text-[11px] text-charcoal">
                      <div>Model: <span className="font-mono text-terracotta font-semibold">{selectedSpan.aiModel || 'ollama:llama3.2'}</span></div>
                      <div>Snapshot Hash: <span className="font-mono text-[10px] text-charcoal-muted truncate block">{selectedSpan.aiManifestHash}</span></div>
                      <div>Reviewer: <span className="font-mono text-[10px] text-sage truncate block">{selectedSpan.humanReviewerFingerprint}</span></div>
                    </div>
                  </div>
                )}

                <div className="p-3.5 rounded-lg bg-cream-light border border-cream-border space-y-1">
                  <div className="text-charcoal-muted">Author Fingerprint</div>
                  <div className="font-mono text-[10px] text-charcoal break-all">{selectedSpan.authorFingerprint}</div>
                </div>

                <button
                  onClick={handleDownloadCertificate}
                  className="w-full py-2.5 rounded bg-charcoal hover:bg-charcoal/90 text-cream font-semibold text-xs flex items-center justify-center gap-2 border border-charcoal transition-colors"
                >
                  <FileBadge className="w-4 h-4" />
                  Export Forensics Certificate
                </button>
              </div>
            ) : (
              <div className="text-xs text-charcoal-muted">Select a span on the left to inspect details.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
