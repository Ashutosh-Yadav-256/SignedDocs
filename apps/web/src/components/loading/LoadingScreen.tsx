import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Cpu,
  Database,
  Radio,
  Feather,
  CheckCircle2,
  Loader2,
  Clock,
  Sparkles,
  ArrowRight,
  Server,
  CloudLightning,
  X,
} from 'lucide-react';
import { TransportStatus } from '@hermes/sync';

export interface LoadingScreenProps {
  isIdentityLoading: boolean;
  identityReady: boolean;
  isDocLoaded: boolean;
  signalingStatus?: TransportStatus;
  documentTitle?: string;
  onReadyToEnter?: () => void;
  isPreview?: boolean;
  onClosePreview?: () => void;
}

const CRYPTO_TIPS = [
  {
    title: 'Render Free Tier Cold Starts',
    desc: 'Free instance containers on Render.com spin down after 15m of inactivity and take ~30–50s to wake up. Once awake, P2P WebRTC data channels connect directly!',
    badge: 'Infrastructure',
  },
  {
    title: 'Local-First Zero Trust',
    desc: 'Every revision is signed with your NIST P-256 private key and linked into a Merkle DAG. You can write 100% offline without waiting for cloud relays.',
    badge: 'Cryptography',
  },
  {
    title: 'Direct Peer-to-Peer Mesh',
    desc: 'The Render signaling relay only brokers initial WebRTC SDP handshakes. Your collaborative edits never touch or reside on any centralized server.',
    badge: 'Privacy',
  },
  {
    title: 'Cryptographic Provenance',
    desc: 'SignedDocs audit bundles (.hermes.json) can be independently verified offline using standalone verifiers with zero vendor lock-in.',
    badge: 'Verifiability',
  },
];

export const LoadingScreen: React.FC<LoadingScreenProps> = ({
  isIdentityLoading,
  identityReady,
  isDocLoaded,
  signalingStatus = 'CONNECTING',
  documentTitle = 'Hermes Protocol Specification',
  onReadyToEnter,
  isPreview = false,
  onClosePreview,
}) => {
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [activeTipIndex, setActiveTipIndex] = useState(0);
  const [minTimeElapsed, setMinTimeElapsed] = useState(false);
  const [isExiting, setIsExiting] = useState(false);
  const [hashTicker, setHashTicker] = useState('7f83b165...e2d3');

  // Elapsed timer for Render cold-start tracking
  useEffect(() => {
    const timer = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Hash simulation ticker in background
  useEffect(() => {
    const hashInterval = setInterval(() => {
      const randomHex = Array.from({ length: 16 }, () =>
        Math.floor(Math.random() * 16).toString(16)
      ).join('');
      setHashTicker(`${randomHex.slice(0, 8)}...${randomHex.slice(8, 12)}`);
    }, 800);
    return () => clearInterval(hashInterval);
  }, []);

  // Rotate educational tips every 4.5 seconds
  useEffect(() => {
    const tipInterval = setInterval(() => {
      setActiveTipIndex((prev) => (prev + 1) % CRYPTO_TIPS.length);
    }, 4500);
    return () => clearInterval(tipInterval);
  }, []);

  // Ensure minimum presentation time (2 seconds) so animations don't jarringly flicker on instant local cache
  useEffect(() => {
    const minTimer = setTimeout(() => {
      setMinTimeElapsed(true);
    }, 2000);
    return () => clearTimeout(minTimer);
  }, []);

  // Local readiness
  const isLocalReady = !isIdentityLoading && identityReady && isDocLoaded;
  const isRelayConnected = signalingStatus === 'CONNECTED';

  // Format seconds as MM:SS
  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remainingSecs = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${remainingSecs.toString().padStart(2, '0')}s`;
  };

  const handleEnter = () => {
    setIsExiting(true);
    setTimeout(() => {
      if (isPreview && onClosePreview) {
        onClosePreview();
      } else if (onReadyToEnter) {
        onReadyToEnter();
      }
    }, 400);
  };

  // Subsystem statuses
  const steps = [
    {
      id: 'crypto',
      label: 'WebCrypto ECDSA Keypair',
      detail: 'NIST P-256 / SHA-256 identity generated',
      status: !isIdentityLoading && identityReady ? 'complete' : 'loading',
      icon: Cpu,
    },
    {
      id: 'storage',
      label: 'IndexedDB Merkle DAG',
      detail: 'Hydrating local causal commit DAG & vectors',
      status: isDocLoaded ? 'complete' : 'loading',
      icon: Database,
    },
    {
      id: 'relay',
      label: 'Render Cloud Signaling Relay',
      detail:
        isRelayConnected
          ? 'wss://hermes-signaling-relay.onrender.com (Online)'
          : elapsedSeconds > 8
          ? `Render free tier instance waking up (${formatTime(elapsedSeconds)} elapsed)...`
          : 'Connecting to hermes-signaling-relay.onrender.com...',
      status: isRelayConnected ? 'complete' : 'waiting',
      icon: Radio,
    },
    {
      id: 'editor',
      label: 'Collaborative TipTap Canvas',
      detail: isLocalReady ? 'Ready for offline-first authorship' : 'Binding Yjs CRDT model...',
      status: isLocalReady ? 'complete' : 'loading',
      icon: Feather,
    },
  ];

  // Calculate progress percentage
  let progress = 25;
  if (identityReady) progress += 25;
  if (isDocLoaded) progress += 25;
  if (isRelayConnected) progress += 25;
  else if (minTimeElapsed && isLocalReady) progress = 85;

  return (
    <div
      className={`fixed inset-0 z-50 flex flex-col items-center justify-between bg-cream text-charcoal font-sans transition-all duration-500 overflow-y-auto ${
        isExiting ? 'opacity-0 scale-98 pointer-events-none' : 'opacity-100 scale-100'
      }`}
      style={{
        backgroundImage: `radial-gradient(#E2DCD2 1px, transparent 1px), radial-gradient(#DDD4C0 1px, #F9F6F0 1px)`,
        backgroundSize: '32px 32px',
        backgroundPosition: '0 0, 16px 16px',
      }}
    >
      {/* Top Header Bar */}
      <div className="w-full max-w-5xl px-6 pt-6 flex items-center justify-between z-10">
        <div className="flex items-center space-x-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-charcoal text-cream-50 shadow-sm">
            <Feather className="h-4 w-4 text-cream-50" />
          </div>
          <div>
            <div className="flex items-center space-x-1.5">
              <span className="font-bold tracking-tight text-charcoal text-base font-serif">SignedDocs</span>
              <span className="rounded bg-cream-subtle px-1.5 py-0.2 text-[10px] font-mono text-charcoal-muted border border-cream-border">
                v1.0
              </span>
            </div>
            <p className="text-[11px] text-charcoal-muted font-sans">
              Cryptographically Verifiable Publication Platform
            </p>
          </div>
        </div>

        {isPreview && onClosePreview && (
          <button
            onClick={onClosePreview}
            className="flex items-center space-x-1 px-3 py-1.5 rounded-lg border border-cream-border bg-white text-xs font-medium text-charcoal hover:bg-cream-subtle transition-colors"
          >
            <X className="h-3.5 w-3.5" />
            <span>Close Preview</span>
          </button>
        )}
      </div>

      {/* Central Interactive Animation Centerpiece */}
      <div className="flex flex-col items-center justify-center max-w-xl w-full px-6 my-auto py-8">
        {/* Animated Cryptographic SVG Constellation */}
        <div className="relative flex items-center justify-center w-56 h-56 sm:w-64 sm:h-64 mb-6">
          {/* Subtle Ambient Glow Aura */}
          <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-sage/20 via-terracotta/15 to-transparent blur-2xl animate-pulse pointer-events-none" />

          {/* SVG Animated Circuit & Merkle Tree Rings */}
          <svg className="absolute inset-0 w-full h-full" viewBox="0 0 240 240">
            <defs>
              <linearGradient id="ringGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#7A8B7B" stopOpacity="0.8" />
                <stop offset="50%" stopColor="#C87D55" stopOpacity="0.6" />
                <stop offset="100%" stopColor="#1A1A1A" stopOpacity="0.2" />
              </linearGradient>
              <linearGradient id="glowLine" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#7A8B7B" stopOpacity="0.2" />
                <stop offset="50%" stopColor="#7A8B7B" stopOpacity="0.9" />
                <stop offset="100%" stopColor="#7A8B7B" stopOpacity="0.2" />
              </linearGradient>
            </defs>

            {/* Outer Rotating Dashed Ring */}
            <circle
              cx="120"
              cy="120"
              r="105"
              fill="none"
              stroke="#E2DCD2"
              strokeWidth="1.5"
              strokeDasharray="4 8"
              className="animate-[spin_40s_linear_infinite]"
              style={{ transformOrigin: 'center' }}
            />

            {/* Mid Orbit Ring with Cryptographic Hash Segment */}
            <circle
              cx="120"
              cy="120"
              r="84"
              fill="none"
              stroke="url(#ringGrad)"
              strokeWidth="2"
              strokeDasharray="60 120"
              className="animate-[spin_12s_linear_infinite_reverse]"
              style={{ transformOrigin: 'center' }}
            />

            {/* Merkle DAG Connecting Flow Lines */}
            <line x1="120" y1="52" x2="65" y2="155" stroke="url(#glowLine)" strokeWidth="1.5" strokeDasharray="3 3" />
            <line x1="120" y1="52" x2="175" y2="155" stroke="url(#glowLine)" strokeWidth="1.5" strokeDasharray="3 3" />
            <line x1="65" y1="155" x2="175" y2="155" stroke="#E2DCD2" strokeWidth="1.5" strokeDasharray="2 4" />
            <line x1="120" y1="52" x2="120" y2="120" stroke="#B6C2B7" strokeWidth="1.5" />
            <line x1="65" y1="155" x2="120" y2="120" stroke="#B6C2B7" strokeWidth="1.5" />
            <line x1="175" y1="155" x2="120" y2="120" stroke="#B6C2B7" strokeWidth="1.5" />

            {/* Orbiting Satellite Node 1 (Root Commit) */}
            <g className="animate-[pulse_2s_ease-in-out_infinite]">
              <circle cx="120" cy="52" r="7" fill="#F9F6F0" stroke="#7A8B7B" strokeWidth="2.5" />
              <circle cx="120" cy="52" r="2.5" fill="#7A8B7B" />
            </g>

            {/* Orbiting Satellite Node 2 (Branch A) */}
            <g className="animate-[pulse_2.4s_ease-in-out_infinite]">
              <circle cx="65" cy="155" r="7" fill="#F9F6F0" stroke="#C87D55" strokeWidth="2.5" />
              <circle cx="65" cy="155" r="2.5" fill="#C87D55" />
            </g>

            {/* Orbiting Satellite Node 3 (Branch B) */}
            <g className="animate-[pulse_2.8s_ease-in-out_infinite]">
              <circle cx="175" cy="155" r="7" fill="#F9F6F0" stroke="#1A1A1A" strokeWidth="2.5" />
              <circle cx="175" cy="155" r="2.5" fill="#1A1A1A" />
            </g>

            {/* Live Orbiting Particle along Ring */}
            <circle
              cx="120"
              cy="15"
              r="3.5"
              fill="#7A8B7B"
              className="animate-[spin_6s_linear_infinite]"
              style={{ transformOrigin: '120px 120px' }}
            />
          </svg>

          {/* Center Emblem Shield */}
          <div className="relative z-10 flex flex-col items-center justify-center w-24 h-24 rounded-2xl bg-white border border-cream-border shadow-lg p-3 text-center transition-transform hover:scale-105">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-cream-subtle border border-cream-border text-charcoal mb-1">
              <ShieldCheck className="h-6 w-6 text-sage-dark" />
            </div>
            <span className="text-[9px] font-mono text-charcoal-muted tracking-tight">
              {hashTicker}
            </span>
          </div>
        </div>

        {/* Heading & Document Context */}
        <div className="text-center mb-6 max-w-md">
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-charcoal tracking-tight mb-1.5">
            Initializing SignedDocs
          </h1>
          <p className="text-xs sm:text-sm text-charcoal-muted font-sans">
            Loading cryptographic workspace for <span className="font-semibold text-charcoal">"{documentTitle}"</span>
          </p>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-white border border-cream-border rounded-xl p-4 shadow-xs mb-5">
          <div className="flex items-center justify-between text-xs mb-2">
            <span className="font-medium text-charcoal flex items-center space-x-1.5">
              <Sparkles className="h-3.5 w-3.5 text-sage-dark" />
              <span>Workspace Initialization</span>
            </span>
            <span className="font-mono text-xs font-semibold text-charcoal-muted">{progress}%</span>
          </div>

          <div className="w-full h-2 bg-cream-subtle rounded-full overflow-hidden border border-cream-border/50">
            <div
              className="h-full bg-gradient-to-r from-sage via-sage-dark to-charcoal transition-all duration-700 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>

          {/* Subsystem Steps List */}
          <div className="mt-4 space-y-2.5">
            {steps.map((step) => {
              const Icon = step.icon;
              return (
                <div
                  key={step.id}
                  className="flex items-start justify-between text-xs py-1 border-b border-cream-border/40 last:border-0"
                >
                  <div className="flex items-center space-x-2.5">
                    <div
                      className={`flex h-6 w-6 items-center justify-center rounded-md border text-[11px] ${
                        step.status === 'complete'
                          ? 'bg-sage-light border-sage text-sage-dark'
                          : step.status === 'waiting'
                          ? 'bg-terracotta-light border-terracotta text-terracotta-dark'
                          : 'bg-cream-subtle border-cream-border text-charcoal-muted'
                      }`}
                    >
                      <Icon className="h-3 w-3" />
                    </div>
                    <div>
                      <div className="font-medium text-charcoal leading-none mb-0.5">{step.label}</div>
                      <div className="text-[10px] text-charcoal-muted">{step.detail}</div>
                    </div>
                  </div>

                  <div className="shrink-0 ml-2">
                    {step.status === 'complete' ? (
                      <CheckCircle2 className="h-4 w-4 text-sage-dark" />
                    ) : step.status === 'waiting' ? (
                      <div className="flex items-center space-x-1 text-terracotta-dark font-mono text-[10px] bg-terracotta-light px-1.5 py-0.5 rounded border border-terracotta/30">
                        <Clock className="h-3 w-3 animate-spin" />
                        <span>Waking</span>
                      </div>
                    ) : (
                      <Loader2 className="h-4 w-4 text-charcoal-muted animate-spin" />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Render Cold Start Notice Card */}
        <div className="w-full rounded-xl border border-cream-border bg-white/80 p-3.5 mb-5 shadow-xs">
          <div className="flex items-center justify-between mb-1.5">
            <div className="flex items-center space-x-1.5 text-xs font-semibold text-charcoal">
              <Server className="h-3.5 w-3.5 text-terracotta-dark" />
              <span>Render.com Cloud Relay Status</span>
            </div>
            <div className="flex items-center space-x-1 text-[11px] font-mono">
              <span className="text-charcoal-muted">Elapsed:</span>
              <span
                className={`px-1.5 py-0.2 rounded font-bold ${
                  isRelayConnected
                    ? 'bg-sage-light text-sage-dark border border-sage/40'
                    : 'bg-terracotta-light text-terracotta-dark border border-terracotta/40'
                }`}
              >
                {formatTime(elapsedSeconds)}
              </span>
            </div>
          </div>

          <div className="text-[11px] text-charcoal-muted leading-relaxed">
            {isRelayConnected ? (
              <span className="text-sage-dark font-medium flex items-center space-x-1">
                <CheckCircle2 className="h-3 w-3" />
                <span>Render signaling relay container is fully awake and synchronized!</span>
              </span>
            ) : elapsedSeconds > 8 ? (
              <span>
                Render's free tier spins down idle instances after 15m. It normally takes{' '}
                <strong className="text-charcoal font-semibold">30–50 seconds</strong> to boot up. Your local
                document is already safe and fully editable offline!
              </span>
            ) : (
              <span>
                Pinging <code className="text-[10px] bg-cream-subtle px-1 py-0.5 rounded font-mono">hermes-signaling-relay.onrender.com</code> to wake up WebRTC signaling...
              </span>
            )}
          </div>
        </div>

        {/* Primary Action Buttons */}
        <div className="w-full flex flex-col sm:flex-row items-center gap-2.5">
          {isLocalReady && (
            <button
              onClick={handleEnter}
              className="w-full flex items-center justify-center space-x-2 rounded-lg bg-charcoal px-5 py-2.5 text-xs sm:text-sm font-semibold text-cream-50 hover:bg-charcoal-700 transition-all shadow-sm hover:shadow group cursor-pointer"
            >
              <span>{isRelayConnected ? 'Open Document Workspace' : 'Start Writing Now (Offline Mode)'}</span>
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 text-cream-200" />
            </button>
          )}

          {!isRelayConnected && isLocalReady && (
            <div className="text-[10px] text-charcoal-muted text-center w-full">
              ⚡ Local-first: edits are signed locally and will sync automatically once Render wakes up.
            </div>
          )}
        </div>
      </div>

      {/* Bottom Cryptographic Insights Card Carousel */}
      <div className="w-full max-w-xl px-6 pb-6 z-10">
        <div className="rounded-xl border border-cream-border bg-white p-3.5 shadow-xs">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center space-x-1.5">
              <CloudLightning className="h-3.5 w-3.5 text-sage-dark" />
              <span className="text-[10px] font-mono uppercase tracking-wider text-charcoal-muted font-semibold">
                Architecture Insight • {CRYPTO_TIPS[activeTipIndex].badge}
              </span>
            </div>
            <div className="flex space-x-1">
              {CRYPTO_TIPS.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveTipIndex(idx)}
                  className={`h-1.5 rounded-full transition-all cursor-pointer ${
                    idx === activeTipIndex ? 'w-4 bg-charcoal' : 'w-1.5 bg-cream-border hover:bg-charcoal-light'
                  }`}
                  aria-label={`Slide ${idx + 1}`}
                />
              ))}
            </div>
          </div>

          <div className="transition-all duration-300">
            <h4 className="text-xs font-semibold text-charcoal mb-0.5">
              {CRYPTO_TIPS[activeTipIndex].title}
            </h4>
            <p className="text-[11px] text-charcoal-muted leading-relaxed">
              {CRYPTO_TIPS[activeTipIndex].desc}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
