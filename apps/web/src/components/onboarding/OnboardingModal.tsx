import React, { useState } from 'react';
import {
  FileText,
  ShieldCheck,
  EyeOff,
  Radio,
  Check,
  ArrowRight,
  ArrowLeft,
  X,
  Lock,
  Layers,
  Sparkles,
  Users,
  Award,
  Activity,
  GitBranch,
  Bot,
  QrCode,
  CheckCircle2,
  KeyRound,
  History,
} from 'lucide-react';

interface OnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const OnboardingModal: React.FC<OnboardingModalProps> = ({ isOpen, onClose }) => {
  const [selectedFeatureIndex, setSelectedFeatureIndex] = useState(0);

  if (!isOpen) return null;

  const features = [
    {
      id: 'canvas',
      title: 'Distraction-Free Collaborative Canvas',
      category: 'Core Editor',
      badge: 'Real-Time CRDT',
      icon: FileText,
      pillColor: 'bg-[#EFF2EF] text-[#3B453C] border-[#B6C2B7]',
      summary: 'Publication-grade typography powered by local-first Yjs CRDT synchronization.',
      details: [
        {
          title: 'Zero-Latency Local-First',
          desc: 'Your keystrokes update local browser memory immediately with 0ms latency. No waiting for remote servers.',
        },
        {
          title: 'Deterministic Conflict-Free Sync',
          desc: 'Collaborate with peers in real-time across tabs or P2P WebRTC DataChannels with mathematical CRDT convergence.',
        },
        {
          title: 'Editorial Typography & Reading Metrics',
          desc: 'Newsreader serif typography, word & character counters, and dynamic reading time calculation in a clean Medium-style reading measure.',
        },
      ],
      technicalBadge: 'Yjs CRDT + TipTap ProseMirror',
    },
    {
      id: 'crypto',
      title: 'WebCrypto ECDSA Key Pair Security',
      category: 'Cryptography',
      badge: 'Hardware WebCrypto',
      icon: ShieldCheck,
      pillColor: 'bg-[#EFF2EF] text-[#3B453C] border-[#B6C2B7]',
      summary: 'Mathematical proof of identity with client-side NIST P-256 elliptic curve keys.',
      details: [
        {
          title: 'Private Keys Never Leave Your Device',
          desc: 'Keys are generated in your browser via window.crypto.subtle and stored in local IndexedDB. Private keys are never exported or transmitted.',
        },
        {
          title: 'Unique Author Fingerprint',
          desc: 'Every author is identified by a unique public key fingerprint hash (e.g. hermes:8a7f9b...), preventing identity spoofing.',
        },
        {
          title: 'Zero Passwords, Zero Central Server Trust',
          desc: 'Authentication is cryptographically verified on every commit without needing third-party login providers.',
        },
      ],
      technicalBadge: 'ECDSA NIST P-256 + SHA-256',
    },
    {
      id: 'dag',
      title: 'Immutable Merkle DAG Commit History',
      category: 'Data Architecture',
      badge: 'Merkle DAG',
      icon: GitBranch,
      pillColor: 'bg-[#EFF2EF] text-[#3B453C] border-[#B6C2B7]',
      summary: 'Git-style Directed Acyclic Graph linking signed revision nodes.',
      details: [
        {
          title: 'Tamper-Evident History',
          desc: 'Each commit node links to parent hashes. If even 1 byte of the document or history is altered, cryptographic verification immediately fails.',
        },
        {
          title: 'Multi-Branch Fork Handling',
          desc: 'Concurrent offline edits fork cleanly into multiple DAG heads, which automatically reconverge when peers reconnect.',
        },
        {
          title: 'Standalone .hermes.json Verification',
          desc: 'Export the complete cryptographic bundle and verify it offline with zero network connectivity.',
        },
      ],
      technicalBadge: 'Merkle Tree + Parent Hashes',
    },
    {
      id: 'timetravel',
      title: 'Interactive DAG Graph & Time Travel',
      category: 'Inspection & Provenance',
      badge: 'Time Travel & Blame',
      icon: History,
      pillColor: 'bg-[#EFF2EF] text-[#3B453C] border-[#B6C2B7]',
      summary: 'Visual commit topology, historical scrubbing slider, and cryptographic blame.',
      details: [
        {
          title: '2D Visual DAG Visualizer',
          desc: 'Inspect nodes, authors, branch heads, and parent relationships with an interactive SVG topology graph.',
        },
        {
          title: 'Historical Time Travel Slider',
          desc: 'Scrub through the exact document state at any past commit without losing current work.',
        },
        {
          title: 'Cryptographic Signed Blame',
          desc: 'Inspect paragraph-by-paragraph provenance to verify exactly which peer author signed each clause.',
        },
      ],
      technicalBadge: 'Topology Inspection + Blame Engine',
    },
    {
      id: 'redaction',
      title: 'ZK-Redact: Selective Disclosure Studio',
      category: 'Privacy & Security',
      badge: 'Zero-Knowledge Proofs',
      icon: EyeOff,
      pillColor: 'bg-[#FBF1EB] text-[#8E4C29] border-[#E1B197]',
      summary: 'Redact sensitive clauses while providing cryptographic proofs of inclusion.',
      details: [
        {
          title: 'Confidential Clause Redaction',
          desc: 'Selectively withhold private clauses (e.g. financial PII, trade secrets) before sharing with external reviewers.',
        },
        {
          title: 'Mathematical Merkle Inclusion Proofs',
          desc: 'Recipients verify that the disclosed document is authentic and unchanged from the author’s signed original without seeing redacted content.',
        },
        {
          title: 'Built-in In-Browser Proof Verifier',
          desc: 'Recipient can drag and drop any .redacted.signeddocs.json bundle to audit the Merkle path in their browser.',
        },
      ],
      technicalBadge: 'Salted Merkle Tree + Sibling Proofs',
    },
    {
      id: 'multisig',
      title: 'Multisig Milestone Seals (M-of-N Quorum)',
      category: 'Governance',
      badge: 'Quorum Multi-Sig',
      icon: Award,
      pillColor: 'bg-[#FBF1EB] text-[#8E4C29] border-[#E1B197]',
      summary: 'Multi-party co-signing to lock formal milestone agreements.',
      details: [
        {
          title: 'Threshold Quorum Endorsements',
          desc: 'Define required quorum rules (e.g. 2-of-2 or 3-of-5 sign-offs) for document milestones or contracts.',
        },
        {
          title: 'Deterministic State Hashing',
          desc: 'Co-signers cryptographically endorse the SHA-256 state hash of the exact agreed document content.',
        },
        {
          title: 'Permanent Milestone Seal Certificate',
          desc: 'Once quorum is reached, generate an independently verifiable milestone seal certificate node.',
        },
      ],
      technicalBadge: 'M-of-N Threshold Signatures',
    },
    {
      id: 'forensics',
      title: 'Forensic Attribution & Keystroke Cadence',
      category: 'Provenance & Integrity',
      badge: 'Origin Forensics',
      icon: Activity,
      pillColor: 'bg-[#EFF2EF] text-[#3B453C] border-[#B6C2B7]',
      summary: 'Distinguishes natural human typing from AI generation and clipboard paste.',
      details: [
        {
          title: 'Keystroke Cadence Telemetry',
          desc: 'Tracks typing interval distributions and variance to prove authentic human typing rhythms.',
        },
        {
          title: 'AI Provenance Manifests',
          desc: 'When AI assistance is applied, tags the specific revision span with the model identifier, snapshot hash, and human reviewer fingerprint.',
        },
        {
          title: 'Interactive Origin Heatmap',
          desc: 'Visual color-coded heatmap of the document highlighting human-typed, AI-assisted, and pasted sections.',
        },
      ],
      technicalBadge: 'Keystroke Cadence + AI Manifests',
    },
    {
      id: 'airgap',
      title: 'Air-Gapped Optical QR Fountain Sync',
      category: 'Offline & Air-Gap',
      badge: '100% Off-Grid',
      icon: QrCode,
      pillColor: 'bg-[#EFF2EF] text-[#3B453C] border-[#B6C2B7]',
      summary: 'High-density animated optical QR stream for physically isolated devices.',
      details: [
        {
          title: 'Zero Wireless Radio Signals',
          desc: 'Synchronize document commits across air-gapped security enclaves without Wi-Fi, Bluetooth, or USB drives.',
        },
        {
          title: 'Fountain Code Streaming',
          desc: 'Transmitting screen plays high-frequency animated QR frames encoded with frame sequence and checksum metadata.',
        },
        {
          title: 'Instant Camera Ingestion & Convergence',
          desc: 'Receiving device scans the stream via webcam, reconstructs the delta, verifies signatures, and applies changes.',
        },
      ],
      technicalBadge: 'Optical Fountain Codes + Webcam Ingestion',
    },
    {
      id: 'ai',
      title: 'Hermes AI DAG Intelligence',
      category: 'AI Reasoning',
      badge: 'Provenance AI',
      icon: Bot,
      pillColor: 'bg-[#EFF2EF] text-[#3B453C] border-[#B6C2B7]',
      summary: 'AI that reasons over the document’s collaborative history and commit diffs.',
      details: [
        {
          title: 'Semantic Commit Explainer',
          desc: 'Select any commit in the DAG to get a clear natural-language explanation of what changed and why.',
        },
        {
          title: 'Branch & Conflict Advisor',
          desc: 'Detects divergent branches in the Merkle DAG and recommends merge strategies.',
        },
        {
          title: 'Smart Assist (Human-in-the-Loop)',
          desc: 'Generate proposed revisions with visual diff previews; applying changes triggers your WebCrypto key to sign a new verified commit.',
        },
      ],
      technicalBadge: 'Local Heuristics / Ollama / Cloud LLM',
    },
  ];

  const current = features[selectedFeatureIndex];
  const IconComponent = current.icon;

  const handleNext = () => {
    if (selectedFeatureIndex < features.length - 1) {
      setSelectedFeatureIndex((prev) => prev + 1);
    } else {
      onClose();
    }
  };

  const handlePrev = () => {
    if (selectedFeatureIndex > 0) {
      setSelectedFeatureIndex((prev) => prev - 1);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-charcoal/40 p-3 sm:p-4 animate-in fade-in duration-150">
      <div className="bg-[#FDFCFA] border border-[#E2DCD2] rounded-xl w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden text-charcoal shadow-none">
        {/* Header Bar */}
        <div className="px-5 sm:px-6 py-3.5 border-b border-[#E2DCD2] flex items-center justify-between bg-[#F4F0E8]">
          <div className="flex items-center space-x-2.5">
            <div className="flex h-7 w-7 items-center justify-center rounded bg-charcoal text-cream-50">
              <FileText className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-sm font-serif font-bold text-charcoal flex items-center gap-2">
                SignedDocs Platform Architecture & Features Guide
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded text-charcoal-muted hover:text-charcoal hover:bg-[#EAE4D8] transition-colors"
            title="Close Guide"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body - Two Column Layout */}
        <div className="flex-1 overflow-hidden grid grid-cols-1 md:grid-cols-12">
          {/* Left Column: Feature Selection Navigation List */}
          <div className="md:col-span-4 border-b md:border-b-0 md:border-r border-[#E2DCD2] bg-[#F9F6F0] p-3 overflow-y-auto max-h-48 md:max-h-[calc(92vh-120px)] space-y-1">
            <div className="text-[10px] font-mono uppercase tracking-wider text-charcoal-muted px-2 py-1">
              Platform Innovations ({features.length})
            </div>
            {features.map((feat, idx) => {
              const FeatIcon = feat.icon;
              const isSelected = selectedFeatureIndex === idx;
              return (
                <button
                  key={feat.id}
                  onClick={() => setSelectedFeatureIndex(idx)}
                  className={`w-full text-left p-2.5 rounded text-xs transition-colors flex items-center space-x-2.5 ${
                    isSelected
                      ? 'bg-white text-charcoal font-semibold border border-[#E2DCD2] shadow-none'
                      : 'text-charcoal-muted hover:text-charcoal hover:bg-[#F4F0E8] border border-transparent'
                  }`}
                >
                  <FeatIcon className={`w-4 h-4 shrink-0 ${isSelected ? 'text-[#7A8B7B]' : 'text-charcoal-muted'}`} />
                  <div className="truncate flex-1">
                    <div className="truncate">{feat.title}</div>
                    <div className="text-[10px] text-charcoal-muted font-normal">{feat.category}</div>
                  </div>
                  {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-[#7A8B7B] shrink-0" />}
                </button>
              );
            })}
          </div>

          {/* Right Column: In-Depth Feature Details Display */}
          <div className="md:col-span-8 p-5 sm:p-7 overflow-y-auto space-y-5 bg-[#FFFFFF] max-h-[calc(92vh-120px)]">
            {/* Feature Header */}
            <div className="space-y-2 pb-4 border-b border-[#E2DCD2]">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className={`text-[10px] font-mono font-semibold px-2 py-0.5 rounded border ${current.pillColor}`}>
                  {current.badge}
                </span>
                <span className="text-[10px] font-mono text-charcoal-muted bg-[#F4F0E8] px-2 py-0.5 rounded border border-[#E2DCD2]">
                  {current.technicalBadge}
                </span>
              </div>

              <div className="flex items-start space-x-3 pt-1">
                <div className="p-2 rounded bg-[#EFF2EF] text-[#3B453C] border border-[#B6C2B7] shrink-0 mt-0.5">
                  <IconComponent className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-xl font-serif font-bold text-charcoal">
                    {current.title}
                  </h3>
                  <p className="text-xs text-charcoal-muted mt-0.5 font-sans leading-relaxed">
                    {current.summary}
                  </p>
                </div>
              </div>
            </div>

            {/* Feature Details Breakdown Cards */}
            <div className="space-y-3">
              <h4 className="text-xs font-mono uppercase tracking-wider text-charcoal-muted font-semibold">
                How It Works & Cryptographic Guarantees
              </h4>

              <div className="space-y-2.5">
                {current.details.map((detail, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 rounded bg-[#F9F6F0] border border-[#E2DCD2] space-y-1"
                  >
                    <div className="text-xs font-semibold text-charcoal flex items-center gap-1.5 font-sans">
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#7A8B7B] shrink-0" />
                      {detail.title}
                    </div>
                    <p className="text-xs text-charcoal-muted leading-relaxed pl-5 font-sans">
                      {detail.desc}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Mini Progress Indicator */}
            <div className="pt-2 flex items-center justify-between text-xs text-charcoal-muted border-t border-[#E2DCD2]">
              <span>Feature {selectedFeatureIndex + 1} of {features.length}</span>
              <div className="flex items-center space-x-1">
                {features.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedFeatureIndex(idx)}
                    className={`h-1.5 rounded-full transition-all ${
                      selectedFeatureIndex === idx
                        ? 'w-5 bg-charcoal'
                        : 'w-1.5 bg-[#E2DCD2] hover:bg-charcoal-muted'
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Footer Navigation */}
        <div className="px-5 sm:px-6 py-3 border-t border-[#E2DCD2] bg-[#F4F0E8] flex items-center justify-between">
          <button
            onClick={handlePrev}
            disabled={selectedFeatureIndex === 0}
            className="px-3 py-1.5 rounded text-xs font-medium text-charcoal-muted hover:text-charcoal hover:bg-[#EAE4D8] disabled:opacity-30 disabled:pointer-events-none flex items-center gap-1 transition-colors border border-transparent hover:border-[#E2DCD2]"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Previous
          </button>

          <div className="flex items-center space-x-2">
            <button
              onClick={onClose}
              className="px-3 py-1.5 rounded text-xs font-medium text-charcoal-muted hover:text-charcoal hover:bg-[#EAE4D8] transition-colors"
            >
              Skip to Editor
            </button>
            <button
              onClick={handleNext}
              className="px-4 py-1.5 rounded bg-charcoal text-cream-50 hover:bg-charcoal/90 text-xs font-medium flex items-center gap-1.5 transition-colors border border-charcoal"
            >
              {selectedFeatureIndex === features.length - 1 ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  Start Writing
                </>
              ) : (
                <>
                  Next Feature
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
