import React, { useState } from 'react';
import {
  ShieldCheck,
  ShieldAlert,
  Users,
  Download,
  Share2,
  FileCheck2,
  Sparkles,
  Layers,
  Copy,
  Check,
  Radio,
  FileText,
  EyeOff,
  Award,
  Activity,
  HelpCircle,
  Menu,
  X,
  Feather,
} from 'lucide-react';
import { AuditReport } from '@hermes/core';
import { HermesIdentity } from '@hermes/crypto';
import { PeerPresence } from '@hermes/sync';

export interface HeaderProps {
  documentTitle: string;
  onTitleChange?: (newTitle: string) => void;
  identity: HermesIdentity;
  displayName: string;
  onDisplayNameChange: (name: string) => void;
  userColor: string;
  activePeers: PeerPresence[];
  auditReport: AuditReport | null;
  activeTab: 'editor' | 'dag' | 'blame' | 'timetravel' | 'audit';
  onTabChange: (tab: 'editor' | 'dag' | 'blame' | 'timetravel' | 'audit') => void;
  onExportClick: () => void;
  onShareClick: () => void;
  onVerifyClick: () => void;
  onDocumentsClick: () => void;
  onAIClick?: () => void;
  onRedactClick?: () => void;
  onMultisigClick?: () => void;
  onForensicsClick?: () => void;
  onAirGapClick?: () => void;
  onOnboardingClick?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  documentTitle,
  onTitleChange,
  identity,
  displayName,
  onDisplayNameChange,
  userColor,
  activePeers,
  auditReport,
  activeTab,
  onTabChange,
  onExportClick,
  onShareClick,
  onVerifyClick,
  onDocumentsClick,
  onAIClick,
  onRedactClick,
  onMultisigClick,
  onForensicsClick,
  onAirGapClick,
  onOnboardingClick,
}) => {
  const [copied, setCopied] = useState(false);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const copyFingerprint = () => {
    navigator.clipboard.writeText(identity.fingerprint);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isAuditValid = auditReport?.verdict === 'VALID';
  const connectionState = activePeers.length > 0 ? 'Connected' : 'Local';

  return (
    <header className="sticky top-0 z-40 w-full border-b border-cream-border bg-cream-50 text-charcoal">
      <div className="flex h-16 items-center justify-between px-4 sm:px-6 max-w-7xl mx-auto">
        {/* Left Section: Publication Branding & Document Title */}
        <div className="flex items-center space-x-3.5">
          <button
            onClick={onDocumentsClick}
            className="flex items-center space-x-2.5 transition-colors hover:opacity-85 text-left"
            title="Open Document Library"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-charcoal text-cream-50 border border-charcoal">
              <Feather className="h-4 w-4 text-cream-50" />
            </div>
            <div className="hidden sm:block">
              <div className="flex items-center space-x-1.5">
                <span className="font-bold tracking-tight text-charcoal text-sm font-serif">SignedDocs</span>
                <span className="rounded bg-cream-subtle px-1.5 py-0.2 text-[10px] font-semibold text-charcoal-muted border border-cream-border font-mono">
                  v1.0
                </span>
              </div>
            </div>
          </button>

          <div className="h-5 w-px bg-cream-border hidden sm:block" />

          {/* Document Title Editor */}
          <div className="flex items-center">
            {isEditingTitle ? (
              <input
                type="text"
                value={documentTitle}
                onChange={(e) => onTitleChange && onTitleChange(e.target.value)}
                onBlur={() => setIsEditingTitle(false)}
                onKeyDown={(e) => e.key === 'Enter' && setIsEditingTitle(false)}
                autoFocus
                className="bg-cream-subtle border border-charcoal/30 rounded px-2.5 py-1 text-sm font-semibold text-charcoal focus:outline-none focus:border-charcoal font-serif"
              />
            ) : (
              <button
                onClick={() => setIsEditingTitle(true)}
                className="group flex items-center space-x-1.5 rounded px-2 py-1 text-sm font-semibold text-charcoal hover:bg-cream-subtle transition-colors font-serif"
                title="Click to rename document"
              >
                <span className="truncate max-w-[160px] md:max-w-xs">{documentTitle}</span>
                <span className="text-charcoal-light text-xs opacity-0 group-hover:opacity-100 transition-opacity">
                  ✎
                </span>
              </button>
            )}
          </div>
        </div>

        {/* Center Section: Minimalist Navigation Tabs (Desktop) */}
        <div className="hidden lg:flex items-center space-x-1 bg-cream-subtle p-1 rounded-lg border border-cream-border">
          <button
            onClick={() => onTabChange('editor')}
            className={`flex items-center space-x-1.5 rounded px-3 py-1 text-xs font-medium transition-colors ${
              activeTab === 'editor'
                ? 'bg-cream-50 text-charcoal font-semibold border border-cream-border shadow-none'
                : 'text-charcoal-muted hover:text-charcoal'
            }`}
          >
            <FileText className="h-3.5 w-3.5" />
            <span>Editor</span>
          </button>

          <button
            onClick={() => onTabChange('dag')}
            className={`flex items-center space-x-1.5 rounded px-3 py-1 text-xs font-medium transition-colors ${
              activeTab === 'dag'
                ? 'bg-cream-50 text-charcoal font-semibold border border-cream-border shadow-none'
                : 'text-charcoal-muted hover:text-charcoal'
            }`}
          >
            <Layers className="h-3.5 w-3.5" />
            <span>Commit DAG</span>
          </button>

          <button
            onClick={() => onTabChange('blame')}
            className={`flex items-center space-x-1.5 rounded px-3 py-1 text-xs font-medium transition-colors ${
              activeTab === 'blame'
                ? 'bg-cream-50 text-charcoal font-semibold border border-cream-border shadow-none'
                : 'text-charcoal-muted hover:text-charcoal'
            }`}
          >
            <ShieldCheck className="h-3.5 w-3.5" />
            <span>Signed Blame</span>
          </button>

          <button
            onClick={() => onTabChange('timetravel')}
            className={`flex items-center space-x-1.5 rounded px-3 py-1 text-xs font-medium transition-colors ${
              activeTab === 'timetravel'
                ? 'bg-cream-50 text-charcoal font-semibold border border-cream-border shadow-none'
                : 'text-charcoal-muted hover:text-charcoal'
            }`}
          >
            <Radio className="h-3.5 w-3.5" />
            <span>Time Travel</span>
          </button>

          <button
            onClick={() => onTabChange('audit')}
            className={`flex items-center space-x-1.5 rounded px-3 py-1 text-xs font-medium transition-colors ${
              activeTab === 'audit'
                ? 'bg-cream-50 text-charcoal font-semibold border border-cream-border shadow-none'
                : 'text-charcoal-muted hover:text-charcoal'
            }`}
          >
            <FileCheck2 className="h-3.5 w-3.5" />
            <span>Audit & Verify</span>
          </button>
        </div>

        {/* Right Section: Action Utilities & Identity */}
        <div className="flex items-center space-x-2">
          {/* System Status Indicator (Rule 23) */}
          <div className="hidden xl:flex items-center space-x-1.5 rounded px-2.5 py-1 text-xs font-medium border border-cream-border bg-cream-subtle text-charcoal">
            <span
              className={`h-2 w-2 rounded-full ${
                connectionState === 'Connected' ? 'bg-sage-dark' : 'bg-charcoal-light'
              }`}
            />
            <span className="font-mono text-[11px]">{connectionState}</span>
          </div>

          {/* Author Fingerprint Card */}
          <div className="hidden md:flex items-center space-x-2 rounded-lg bg-cream-subtle border border-cream-border px-2.5 py-1">
            <div
              className="h-2.5 w-2.5 rounded-full flex-shrink-0"
              style={{ backgroundColor: userColor || '#7A8B7B' }}
            />
            <div className="flex flex-col text-left">
              {isEditingName ? (
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => onDisplayNameChange(e.target.value)}
                  onBlur={() => setIsEditingName(false)}
                  onKeyDown={(e) => e.key === 'Enter' && setIsEditingName(false)}
                  autoFocus
                  className="bg-cream-50 text-xs text-charcoal rounded px-1 border border-charcoal/30 focus:outline-none"
                />
              ) : (
                <button
                  onClick={() => setIsEditingName(true)}
                  className="text-xs font-semibold text-charcoal hover:underline transition-all"
                  title="Click to change author display name"
                >
                  {displayName}
                </button>
              )}
              <button
                onClick={copyFingerprint}
                title="Click to copy ECDSA public key fingerprint"
                className="flex items-center space-x-1 text-[10px] font-mono text-charcoal-muted hover:text-charcoal transition-colors"
              >
                <span>{identity.fingerprint.slice(0, 12)}...</span>
                {copied ? <Check className="h-2.5 w-2.5 text-sage-dark" /> : <Copy className="h-2.5 w-2.5" />}
              </button>
            </div>
          </div>

          {/* Innovation Action Toolbar (Flat 2D Buttons) */}
          {onRedactClick && (
            <button
              onClick={onRedactClick}
              title="ZK-Redact: Cryptographic Selective Disclosure"
              className="hidden lg:flex items-center space-x-1.5 rounded px-2.5 py-1.5 text-xs font-medium text-charcoal hover:bg-cream-subtle border border-cream-border transition-colors"
            >
              <EyeOff className="h-3.5 w-3.5 text-terracotta-dark" />
              <span>Redact</span>
            </button>
          )}

          {onMultisigClick && (
            <button
              onClick={onMultisigClick}
              title="Multisig: M-of-N Milestone Agreement Seal"
              className="hidden lg:flex items-center space-x-1.5 rounded px-2.5 py-1.5 text-xs font-medium text-charcoal hover:bg-cream-subtle border border-cream-border transition-colors"
            >
              <Award className="h-3.5 w-3.5 text-terracotta-dark" />
              <span>Multisig</span>
            </button>
          )}

          {onForensicsClick && (
            <button
              onClick={onForensicsClick}
              title="Forensics: Human vs. AI Attribution Heatmap"
              className="hidden lg:flex items-center space-x-1.5 rounded px-2.5 py-1.5 text-xs font-medium text-charcoal hover:bg-cream-subtle border border-cream-border transition-colors"
            >
              <Activity className="h-3.5 w-3.5 text-sage-dark" />
              <span>Forensics</span>
            </button>
          )}

          {onAirGapClick && (
            <button
              onClick={onAirGapClick}
              title="Air-Gap: Optical QR Sneakernet Sync"
              className="hidden lg:flex items-center space-x-1.5 rounded px-2.5 py-1.5 text-xs font-medium text-charcoal hover:bg-cream-subtle border border-cream-border transition-colors"
            >
              <Radio className="h-3.5 w-3.5 text-sage-dark" />
              <span>Air-Gap</span>
            </button>
          )}

          {onAIClick && (
            <button
              onClick={onAIClick}
              title="AI Provenance & Change Explainer"
              className="flex items-center space-x-1.5 rounded px-2.5 py-1.5 text-xs font-medium bg-sage-light text-sage-dark border border-sage-border hover:bg-sage-200 transition-colors"
            >
              <Sparkles className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">AI Assist</span>
            </button>
          )}

          {/* Share / P2P Room */}
          <button
            onClick={onShareClick}
            className="flex items-center space-x-1.5 rounded px-2.5 py-1.5 text-xs font-medium text-charcoal hover:bg-cream-subtle border border-cream-border transition-colors"
          >
            <Share2 className="h-3.5 w-3.5 text-charcoal-muted" />
            <span className="hidden sm:inline">Share</span>
          </button>

          {/* Export Bundle */}
          <button
            onClick={onExportClick}
            className="flex items-center space-x-1.5 rounded px-3 py-1.5 text-xs font-semibold bg-charcoal text-cream-50 hover:bg-charcoal-subtle transition-colors"
          >
            <Download className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Export</span>
          </button>

          {/* Onboarding Tour Trigger */}
          {onOnboardingClick && (
            <button
              onClick={onOnboardingClick}
              title="Guided User Tour"
              className="p-1.5 rounded text-charcoal-muted hover:text-charcoal hover:bg-cream-subtle border border-cream-border transition-colors"
            >
              <HelpCircle className="h-4 w-4" />
            </button>
          )}

          {/* Mobile Menu Hamburger */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-1.5 rounded text-charcoal hover:bg-cream-subtle border border-cream-border transition-colors"
          >
            {mobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Dropdown */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-cream-border bg-cream-50 px-4 py-3 space-y-3 font-sans">
          <div className="grid grid-cols-2 gap-2 text-xs">
            <button
              onClick={() => {
                onTabChange('editor');
                setMobileMenuOpen(false);
              }}
              className={`p-2 rounded text-left flex items-center gap-2 ${
                activeTab === 'editor' ? 'bg-charcoal text-cream-50 font-semibold' : 'bg-cream-subtle text-charcoal'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              Editor
            </button>
            <button
              onClick={() => {
                onTabChange('dag');
                setMobileMenuOpen(false);
              }}
              className={`p-2 rounded text-left flex items-center gap-2 ${
                activeTab === 'dag' ? 'bg-charcoal text-cream-50 font-semibold' : 'bg-cream-subtle text-charcoal'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              Commit DAG
            </button>
            <button
              onClick={() => {
                onTabChange('blame');
                setMobileMenuOpen(false);
              }}
              className={`p-2 rounded text-left flex items-center gap-2 ${
                activeTab === 'blame' ? 'bg-charcoal text-cream-50 font-semibold' : 'bg-cream-subtle text-charcoal'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              Signed Blame
            </button>
            <button
              onClick={() => {
                onTabChange('timetravel');
                setMobileMenuOpen(false);
              }}
              className={`p-2 rounded text-left flex items-center gap-2 ${
                activeTab === 'timetravel' ? 'bg-charcoal text-cream-50 font-semibold' : 'bg-cream-subtle text-charcoal'
              }`}
            >
              <Radio className="w-3.5 h-3.5" />
              Time Travel
            </button>
          </div>

          <div className="pt-2 border-t border-cream-border grid grid-cols-2 gap-2 text-xs">
            {onRedactClick && (
              <button
                onClick={() => {
                  onRedactClick();
                  setMobileMenuOpen(false);
                }}
                className="p-2 rounded bg-cream-subtle border border-cream-border text-left flex items-center gap-2"
              >
                <EyeOff className="w-3.5 h-3.5 text-terracotta-dark" />
                ZK-Redact
              </button>
            )}
            {onMultisigClick && (
              <button
                onClick={() => {
                  onMultisigClick();
                  setMobileMenuOpen(false);
                }}
                className="p-2 rounded bg-cream-subtle border border-cream-border text-left flex items-center gap-2"
              >
                <Award className="w-3.5 h-3.5 text-terracotta-dark" />
                Multisig Seal
              </button>
            )}
            {onForensicsClick && (
              <button
                onClick={() => {
                  onForensicsClick();
                  setMobileMenuOpen(false);
                }}
                className="p-2 rounded bg-cream-subtle border border-cream-border text-left flex items-center gap-2"
              >
                <Activity className="w-3.5 h-3.5 text-sage-dark" />
                Forensics
              </button>
            )}
            {onAirGapClick && (
              <button
                onClick={() => {
                  onAirGapClick();
                  setMobileMenuOpen(false);
                }}
                className="p-2 rounded bg-cream-subtle border border-cream-border text-left flex items-center gap-2"
              >
                <Radio className="w-3.5 h-3.5 text-sage-dark" />
                Air-Gap Sync
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
