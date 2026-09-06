import React, { useState, useEffect } from 'react';
import {
  Shield,
  EyeOff,
  Eye,
  CheckCircle2,
  XCircle,
  Download,
  Copy,
  FileCheck,
  Lock,
  Sparkles,
  X,
} from 'lucide-react';
import {
  DocumentBlock,
  RedactionEngine,
  RedactionVerifier,
  RedactedExportBundle,
  RedactionVerificationResult,
} from '@hermes/core';

interface RedactionStudioModalProps {
  isOpen: boolean;
  onClose: () => void;
  documentId: string;
  documentTitle: string;
  documentText: string;
  identity: {
    fingerprint: string;
    publicKeyBase64: string;
    privateKey: CryptoKey;
  } | null;
  heads: string[];
}

export const RedactionStudioModal: React.FC<RedactionStudioModalProps> = ({
  isOpen,
  onClose,
  documentId,
  documentTitle,
  documentText,
  identity,
  heads,
}) => {
  const [activeTab, setActiveTab] = useState<'editor' | 'preview' | 'audit'>('editor');
  const [blocks, setBlocks] = useState<DocumentBlock[]>([]);
  const [redactedIndices, setRedactedIndices] = useState<Set<number>>(new Set());
  const [redactionReasons, setRedactionReasons] = useState<Record<number, string>>({});
  const [generatedBundle, setGeneratedBundle] = useState<RedactedExportBundle | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);

  // Audit tab state
  const [auditJsonInput, setAuditJsonInput] = useState('');
  const [auditResult, setAuditResult] = useState<RedactionVerificationResult | null>(null);
  const [isAuditing, setIsAuditing] = useState(false);

  useEffect(() => {
    if (isOpen && documentText) {
      RedactionEngine.parseDocumentBlocks(documentText).then((parsed) => {
        setBlocks(parsed);
      });
    }
  }, [isOpen, documentText]);

  if (!isOpen) return null;

  const toggleRedact = (index: number) => {
    const next = new Set(redactedIndices);
    if (next.has(index)) {
      next.delete(index);
    } else {
      next.add(index);
    }
    setRedactedIndices(next);
    setGeneratedBundle(null);
  };

  const handleReasonChange = (index: number, reason: string) => {
    setRedactionReasons((prev) => ({
      ...prev,
      [index]: reason,
    }));
  };

  const handleGenerateBundle = async () => {
    if (!identity) return;
    setIsGenerating(true);
    try {
      const bundle = await RedactionEngine.createRedactedBundle({
        documentId,
        documentTitle,
        originalCommitId: heads[0] || 'root_genesis',
        text: documentText,
        identity,
        redactedIndices: Array.from(redactedIndices),
        redactionReasons,
      });
      setGeneratedBundle(bundle);
      setActiveTab('preview');
    } catch (err) {
      console.error('Failed to generate redacted bundle', err);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = () => {
    if (!generatedBundle) return;
    const blob = new Blob([JSON.stringify(generatedBundle, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${documentTitle.toLowerCase().replace(/\s+/g, '-')}.redacted.signeddocs.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleCopy = () => {
    if (!generatedBundle) return;
    navigator.clipboard.writeText(JSON.stringify(generatedBundle, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRunAudit = async () => {
    if (!auditJsonInput.trim()) return;
    setIsAuditing(true);
    try {
      const parsed = JSON.parse(auditJsonInput);
      const result = await RedactionVerifier.verifyRedactedBundle(parsed);
      setAuditResult(result);
    } catch (err: any) {
      setAuditResult({
        isValid: false,
        verdict: 'INVALID_SCHEMA',
        error: `JSON parsing error: ${err.message}`,
        documentId: 'unknown',
        documentTitle: 'unknown',
        authorFingerprint: 'unknown',
        totalBlocks: 0,
        revealedBlocks: 0,
        redactedBlocks: 0,
        merkleRoot: '',
        blockVerdicts: [],
      });
    } finally {
      setIsAuditing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-charcoal/40 p-4">
      <div className="bg-cream-light border border-cream-border rounded-lg w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden text-charcoal">
        {/* Header */}
        <div className="px-6 py-4 border-b border-cream-border flex items-center justify-between bg-cream">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded border border-sage/30 bg-sage/10 text-sage">
              <EyeOff className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-serif font-bold flex items-center gap-2 text-charcoal">
                ZK-Redact & Selective Disclosure
                <span className="text-[10px] px-2 py-0.5 rounded bg-cream-light border border-cream-border text-sage font-mono">
                  Merkle Proofs
                </span>
              </h2>
              <p className="text-xs text-charcoal-muted">
                Redact confidential clauses while providing zero-knowledge cryptographic inclusion proofs to recipients.
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

        {/* Tab Navigation */}
        <div className="flex border-b border-cream-border bg-cream px-6 pt-2 text-xs">
          <button
            onClick={() => setActiveTab('editor')}
            className={`px-4 py-2.5 font-medium border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === 'editor'
                ? 'border-charcoal text-charcoal font-semibold bg-cream-light rounded-t'
                : 'border-transparent text-charcoal-muted hover:text-charcoal'
            }`}
          >
            <Lock className="w-4 h-4" />
            1. Select Redactions ({redactedIndices.size}/{blocks.length})
          </button>
          <button
            onClick={() => setActiveTab('preview')}
            className={`px-4 py-2.5 font-medium border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === 'preview'
                ? 'border-charcoal text-charcoal font-semibold bg-cream-light rounded-t'
                : 'border-transparent text-charcoal-muted hover:text-charcoal'
            }`}
          >
            <Eye className="w-4 h-4" />
            2. Redacted Preview & Export
          </button>
          <button
            onClick={() => setActiveTab('audit')}
            className={`px-4 py-2.5 font-medium border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === 'audit'
                ? 'border-charcoal text-charcoal font-semibold bg-cream-light rounded-t'
                : 'border-transparent text-charcoal-muted hover:text-charcoal'
            }`}
          >
            <FileCheck className="w-4 h-4" />
            3. In-Browser Proof Auditor
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {activeTab === 'editor' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between bg-cream p-3 rounded-lg border border-cream-border text-xs text-charcoal">
                <span>
                  Click any paragraph or clause below to toggle redaction. Redacted blocks withhold cryptographic salts while preserving the Merkle tree.
                </span>
                <button
                  onClick={handleGenerateBundle}
                  disabled={!identity || isGenerating}
                  className="px-4 py-2 rounded bg-charcoal hover:bg-charcoal/90 text-cream font-medium flex items-center gap-2 border border-charcoal transition-colors disabled:opacity-50"
                >
                  <Sparkles className="w-4 h-4" />
                  {isGenerating ? 'Building Tree...' : 'Generate Signed Proofs'}
                </button>
              </div>

              <div className="space-y-3">
                {blocks.map((block) => {
                  const isRedacted = redactedIndices.has(block.index);
                  return (
                    <div
                      key={block.index}
                      className={`p-4 rounded-lg border transition-colors cursor-pointer ${
                        isRedacted
                          ? 'bg-terracotta/5 border-terracotta/40'
                          : 'bg-cream-light border-cream-border hover:border-charcoal-muted'
                      }`}
                      onClick={() => toggleRedact(block.index)}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded bg-cream border border-cream-border text-charcoal">
                            Block #{block.index + 1} ({block.blockType})
                          </span>
                          {isRedacted ? (
                            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-terracotta/15 border border-terracotta/40 text-terracotta flex items-center gap-1">
                              <EyeOff className="w-3 h-3" /> Redacted
                            </span>
                          ) : (
                            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-sage/15 border border-sage/40 text-sage flex items-center gap-1">
                              <Eye className="w-3 h-3" /> Disclosed
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] font-mono text-charcoal-muted">
                          Leaf: {block.leafHash.slice(0, 16)}...
                        </span>
                      </div>

                      <p
                        className={`text-sm leading-relaxed font-serif ${
                          isRedacted ? 'line-through text-charcoal-muted opacity-60' : 'text-charcoal'
                        }`}
                      >
                        {block.content}
                      </p>

                      {isRedacted && (
                        <div
                          className="mt-3 pt-3 border-t border-terracotta/20 flex items-center gap-2"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <span className="text-xs text-terracotta font-medium">Reason:</span>
                          <input
                            type="text"
                            value={redactionReasons[block.index] || ''}
                            onChange={(e) => handleReasonChange(block.index, e.target.value)}
                            placeholder="e.g. Confidential Financial PII, Whistleblower Identity"
                            className="flex-1 bg-cream-light border border-cream-border rounded px-2.5 py-1 text-xs text-charcoal focus:outline-none focus:border-terracotta"
                          />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {activeTab === 'preview' && (
            <div className="space-y-4">
              {!generatedBundle ? (
                <div className="text-center py-12 text-charcoal-muted space-y-3">
                  <EyeOff className="w-12 h-12 mx-auto text-charcoal-muted" />
                  <p className="text-sm">No redacted bundle generated yet.</p>
                  <button
                    onClick={handleGenerateBundle}
                    disabled={!identity}
                    className="px-4 py-2 rounded bg-charcoal hover:bg-charcoal/90 text-cream font-medium text-sm transition-colors border border-charcoal"
                  >
                    Generate From Selected Blocks
                  </button>
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between bg-cream p-4 rounded-lg border border-cream-border">
                    <div className="space-y-1">
                      <div className="text-xs text-charcoal-muted">
                        Signed Merkle Root: <span className="font-mono text-sage font-medium">{generatedBundle.merkleRoot}</span>
                      </div>
                      <div className="text-xs text-charcoal-muted">
                        Author Fingerprint: <span className="font-mono text-charcoal">{generatedBundle.author.fingerprint}</span>
                      </div>
                      <div className="text-xs text-charcoal-muted flex items-center gap-2">
                        <span>Total Blocks: {generatedBundle.stats.totalBlocks}</span>
                        <span>•</span>
                        <span className="text-sage font-medium">Revealed: {generatedBundle.stats.revealedBlocks}</span>
                        <span>•</span>
                        <span className="text-terracotta font-medium">Redacted: {generatedBundle.stats.redactedBlocks}</span>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <button
                        onClick={handleCopy}
                        className="px-3 py-1.5 rounded bg-cream-light hover:bg-cream text-xs font-medium flex items-center gap-1.5 border border-cream-border text-charcoal transition-colors"
                      >
                        <Copy className="w-3.5 h-3.5" />
                        {copied ? 'Copied' : 'Copy JSON'}
                      </button>
                      <button
                        onClick={handleDownload}
                        className="px-3 py-1.5 rounded bg-charcoal hover:bg-charcoal/90 text-cream text-xs font-medium flex items-center gap-1.5 border border-charcoal transition-colors"
                      >
                        <Download className="w-3.5 h-3.5" />
                        Export .redacted.signeddocs.json
                      </button>
                    </div>
                  </div>

                  {/* Visual Document View */}
                  <div className="bg-cream-light p-6 rounded-lg border border-cream-border space-y-4">
                    <h3 className="text-lg font-serif font-bold text-charcoal border-b border-cream-border pb-2">
                      {generatedBundle.documentTitle} (Redacted Disclosed Copy)
                    </h3>
                    <div className="space-y-3">
                      {generatedBundle.blocks.map((b) => (
                        <div key={b.index} className="p-3 rounded bg-cream border border-cream-border">
                          {b.isRedacted ? (
                            <div className="bg-cream-light text-terracotta border border-terracotta/30 rounded p-2.5 font-mono text-xs flex items-center justify-between">
                              <span className="flex items-center gap-2">
                                <Lock className="w-3.5 h-3.5 text-terracotta" />
                                {b.content}
                              </span>
                              <span className="text-[10px] text-charcoal-muted">
                                Proof: {b.proof.steps.length} Merkle steps
                              </span>
                            </div>
                          ) : (
                            <div className="text-charcoal text-sm leading-relaxed font-serif">
                              {b.content}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {activeTab === 'audit' && (
            <div className="space-y-4">
              <div className="text-xs text-charcoal bg-cream p-3 rounded-lg border border-cream-border">
                Paste any <span className="font-mono text-sage font-semibold">.redacted.signeddocs.json</span> bundle below to verify its cryptographic validity. The verifier proves author authenticity and unredacted integrity without seeing secret clauses.
              </div>

              <div className="space-y-2">
                <textarea
                  value={auditJsonInput}
                  onChange={(e) => setAuditJsonInput(e.target.value)}
                  placeholder="Paste .redacted.signeddocs.json contents here..."
                  className="w-full h-40 bg-cream border border-cream-border rounded-lg p-3 font-mono text-xs text-charcoal focus:outline-none focus:border-charcoal"
                />
                <button
                  onClick={handleRunAudit}
                  disabled={isAuditing || !auditJsonInput.trim()}
                  className="px-4 py-2 rounded bg-charcoal hover:bg-charcoal/90 text-cream text-xs font-semibold flex items-center gap-2 transition-colors disabled:opacity-50 border border-charcoal"
                >
                  <FileCheck className="w-4 h-4" />
                  {isAuditing ? 'Auditing...' : 'Verify Cryptographic Proofs'}
                </button>
              </div>

              {auditResult && (
                <div
                  className={`p-4 rounded-lg border space-y-3 ${
                    auditResult.isValid
                      ? 'bg-sage/10 border-sage/40 text-charcoal'
                      : 'bg-rose-50 border-rose-300 text-rose-900'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      {auditResult.isValid ? (
                        <CheckCircle2 className="w-5 h-5 text-sage" />
                      ) : (
                        <XCircle className="w-5 h-5 text-rose-600" />
                      )}
                      <span className="font-semibold text-sm font-serif">
                        {auditResult.isValid ? 'Cryptographically Verified' : 'Verification Failed'}
                      </span>
                    </div>
                    <span className="font-mono text-xs px-2 py-0.5 rounded bg-cream-light border border-cream-border text-charcoal">
                      Verdict: {auditResult.verdict}
                    </span>
                  </div>

                  {auditResult.error && (
                    <div className="text-xs text-rose-700 bg-rose-100 p-2 rounded border border-rose-300">
                      {auditResult.error}
                    </div>
                  )}

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                    <div className="bg-cream-light p-2 rounded border border-cream-border">
                      <div className="text-charcoal-muted">Total Blocks</div>
                      <div className="font-semibold">{auditResult.totalBlocks}</div>
                    </div>
                    <div className="bg-cream-light p-2 rounded border border-cream-border">
                      <div className="text-sage">Revealed Blocks</div>
                      <div className="font-semibold">{auditResult.revealedBlocks}</div>
                    </div>
                    <div className="bg-cream-light p-2 rounded border border-cream-border">
                      <div className="text-terracotta">Redacted Blocks</div>
                      <div className="font-semibold">{auditResult.redactedBlocks}</div>
                    </div>
                    <div className="bg-cream-light p-2 rounded border border-cream-border">
                      <div className="text-charcoal-muted">Author</div>
                      <div className="font-mono text-[10px] truncate">{auditResult.authorFingerprint}</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
