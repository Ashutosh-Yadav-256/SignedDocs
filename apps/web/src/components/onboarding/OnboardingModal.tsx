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
  Sparkles,
  Users,
} from 'lucide-react';

interface OnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const OnboardingModal: React.FC<OnboardingModalProps> = ({ isOpen, onClose }) => {
  const [currentStep, setCurrentStep] = useState(0);

  if (!isOpen) return null;

  const steps = [
    {
      title: 'Distraction-Free Collaborative Writing',
      subtitle: 'Local-first architecture with real-time CRDT synchronization.',
      badge: 'Step 1 of 4',
      icon: FileText,
      colorClass: 'bg-sage/10 border-sage/30 text-sage',
      content: (
        <div className="space-y-4 text-charcoal text-sm leading-relaxed font-sans">
          <p>
            Welcome to <strong className="font-semibold text-charcoal">SignedDocs</strong> — a distraction-free, publication-grade document workspace designed for thoughtful writing and verifiable collaboration.
          </p>
          <div className="p-4 bg-cream border border-cream-border rounded-lg space-y-2">
            <div className="font-semibold text-xs text-charcoal flex items-center gap-2">
              <Users className="w-4 h-4 text-sage" />
              Real-Time CRDT Sync
            </div>
            <p className="text-xs text-charcoal-muted leading-relaxed">
              Every keystroke merges deterministically via Yjs. Collaborate with peers over zero-knowledge WebRTC DataChannels or local browser tabs with zero server dependencies.
            </p>
          </div>
        </div>
      ),
    },
    {
      title: 'Immutable Cryptographic History',
      subtitle: 'Mathematical proof of authorship via ECDSA P-256 Merkle DAG.',
      badge: 'Step 2 of 4',
      icon: ShieldCheck,
      colorClass: 'bg-sage/10 border-sage/30 text-sage',
      content: (
        <div className="space-y-4 text-charcoal text-sm leading-relaxed font-sans">
          <p>
            Unlike traditional cloud docs where anyone with database access can rewrite history, SignedDocs cryptographically signs every change on your device.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-3 bg-cream border border-cream-border rounded-lg space-y-1">
              <div className="text-xs font-semibold text-charcoal">WebCrypto Private Key</div>
              <p className="text-[11px] text-charcoal-muted leading-relaxed">
                Your private key stays strictly in your browser. It is never transmitted across the network.
              </p>
            </div>
            <div className="p-3 bg-cream border border-cream-border rounded-lg space-y-1">
              <div className="text-xs font-semibold text-charcoal">Merkle DAG Nodes</div>
              <p className="text-[11px] text-charcoal-muted leading-relaxed">
                Commits link to parent hashes. If even 1 character is tampered with, verification fails.
              </p>
            </div>
          </div>
        </div>
      ),
    },
    {
      title: 'Selective Disclosure & Forensic AI Origin',
      subtitle: 'ZK-Redaction and human vs. AI origin proofs.',
      badge: 'Step 3 of 4',
      icon: EyeOff,
      colorClass: 'bg-terracotta/10 border-terracotta/30 text-terracotta',
      content: (
        <div className="space-y-3 text-charcoal text-sm leading-relaxed font-sans">
          <p>
            SignedDocs introduces two groundbreaking trust primitives for modern publishing:
          </p>
          <div className="p-3 bg-cream border border-cream-border rounded-lg space-y-1.5">
            <div className="font-semibold text-xs text-charcoal flex items-center gap-2">
              <EyeOff className="w-3.5 h-3.5 text-terracotta" />
              ZK-Redact (Selective Disclosure)
            </div>
            <p className="text-xs text-charcoal-muted leading-relaxed">
              Redact confidential clauses before sharing. Recipients verify authenticity and unredacted text without seeing hidden content.
            </p>
          </div>
          <div className="p-3 bg-cream border border-cream-border rounded-lg space-y-1.5">
            <div className="font-semibold text-xs text-charcoal flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-sage" />
              Forensic Origin Heatmap
            </div>
            <p className="text-xs text-charcoal-muted leading-relaxed">
              Distinguishes direct human typing cadence from human-audited AI suggestions and clipboard pastes.
            </p>
          </div>
        </div>
      ),
    },
    {
      title: 'Air-Gapped Optical QR Sync',
      subtitle: 'Synchronize physically isolated laptops without cables or Wi-Fi.',
      badge: 'Step 4 of 4',
      icon: Radio,
      colorClass: 'bg-sage/10 border-sage/30 text-sage',
      content: (
        <div className="space-y-4 text-charcoal text-sm leading-relaxed font-sans">
          <p>
            In high-security enclaves with zero internet, you can project your document commits as high-density animated QR fountain streams.
          </p>
          <div className="p-4 bg-cream border border-cream-border rounded-lg space-y-2">
            <div className="font-semibold text-xs text-charcoal flex items-center gap-2">
              <Radio className="w-4 h-4 text-sage" />
              Camera Ingestion & Verification
            </div>
            <p className="text-xs text-charcoal-muted leading-relaxed">
              The receiving device scans the animated QR codes with its camera, verifies ECDSA signatures, and converges the Yjs document state automatically.
            </p>
          </div>
        </div>
      ),
    },
  ];

  const current = steps[currentStep];
  const IconComponent = current.icon;

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep((prev) => prev + 1);
    } else {
      onClose();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-charcoal/40 p-4 animate-in fade-in duration-150">
      <div className="bg-cream-light border border-cream-border rounded-lg w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden text-charcoal">
        {/* Header Bar */}
        <div className="flex-shrink-0 px-6 py-4 border-b border-cream-border flex items-center justify-between bg-cream">
          <div className="flex items-center space-x-2">
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded bg-cream-light border border-cream-border text-charcoal-muted font-mono">
              {current.badge}
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded text-charcoal-muted hover:text-charcoal hover:bg-cream-dark transition-colors border border-transparent hover:border-cream-border"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body with flex-1 and min-h-0 to guarantee scrolling without overflow */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 min-h-0">
          <div className="flex items-start space-x-3.5">
            <div className={`p-2.5 rounded-lg border ${current.colorClass} flex-shrink-0`}>
              <IconComponent className="w-5 h-5" />
            </div>
            <div className="space-y-0.5">
              <h3 className="text-lg font-bold text-charcoal tracking-tight font-serif">
                {current.title}
              </h3>
              <p className="text-xs text-charcoal-muted">
                {current.subtitle}
              </p>
            </div>
          </div>

          <div className="pt-1">
            {current.content}
          </div>

          {/* Progress Indicators */}
          <div className="flex items-center justify-center space-x-1.5 pt-2">
            {steps.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentStep(idx)}
                className={`h-1.5 rounded-full transition-all ${
                  currentStep === idx
                    ? 'w-6 bg-charcoal'
                    : 'w-1.5 bg-cream-border hover:bg-charcoal-muted'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Footer Navigation */}
        <div className="flex-shrink-0 px-6 py-4 border-t border-cream-border bg-cream flex items-center justify-between">
          <button
            onClick={handlePrev}
            disabled={currentStep === 0}
            className="px-3.5 py-1.5 rounded text-xs font-semibold text-charcoal-muted hover:text-charcoal hover:bg-cream-dark disabled:opacity-30 disabled:pointer-events-none flex items-center gap-1 transition-colors border border-transparent hover:border-cream-border flex-shrink-0"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back
          </button>

          <button
            onClick={handleNext}
            className="px-4 py-2 rounded bg-charcoal text-cream hover:bg-charcoal/90 text-xs font-semibold flex items-center gap-1.5 transition-colors border border-charcoal flex-shrink-0"
          >
            {currentStep === steps.length - 1 ? (
              <>
                <Check className="w-3.5 h-3.5" />
                Start Writing
              </>
            ) : (
              <>
                Continue
                <ArrowRight className="w-3.5 h-3.5" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
