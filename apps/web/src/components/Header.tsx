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
  ChevronDown,
  SlidersHorizontal,
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
  const [toolsDropdownOpen, setToolsDropdownOpen] = useState(false);

  const copyFingerprint = () => {
    navigator.clipboard.writeText(identity.fingerprint);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isAuditValid = auditReport?.verdict === 'VALID';
  const connectionState = activePeers.length > 0 ? 'Connected' : 'Local';

  return (
    <header className="sticky top-0 z-40 w-full border-b border-cream-border bg-cream-50 text-charcoal">
      <div className="flex h-16 items-center justify-between gap-3 sm:gap-4 lg:gap-6 px-4 sm:px-6 lg:px-8 w-full max-w-[1600px] mx-auto">
        {/* Left Section: Publication Branding & Document Title */}
        <div className="flex items-center space-x-3 sm:space-x-3.5 min-w-0 shrink-0">
          <button
            onClick={onDocumentsClick}
            className="flex items-center space-x-2.5 transition-colors hover:opacity-85 text-left shrink-0"
            title="Open Document Library"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-charcoal text-cream-50 border border-charcoal shrink-0">
              <Feather className="h-4 w-4 text-cream-50" />
            </div>
            <div className="hidden sm:block shrink-0">
              <div className="flex items-center space-x-1.5">
                <span className="font-bold tracking-tight text-charcoal text-sm font-serif">SignedDocs</span>
                <span className="rounded bg-cream-subtle px-1.5 py-0.2 text-[10px] font-semibold text-charcoal-muted border border-cream-border font-mono">
                  v1.0
                </span>
              </div>
            </div>
          </button>

          <div className="h-5 w-px bg-cream-border hidden sm:block shrink-0" />

          {/* Document Title Editor */}
          <div className="flex items-center min-w-0">
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
                className="group flex items-center space-x-1.5 rounded px-2 py-1 text-sm font-semibold text-charcoal hover:bg-cream-subtle transition-colors font-serif min-w-0"
                title="Click to rename document"
              >
                <span className="truncate max-w-[100px] sm:max-w-[140px] md:max-w-[180px] xl:max-w-xs">{documentTitle}</span>
                <span className="text-charcoal-light text-xs opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                  ✎
                </span>
              </button>
            )}
          </div>
        </div>

        {/* Center Section: Minimalist Navigation Tabs (Desktop xl+) */}
        <div className="hidden xl:flex items-center space-x-1 bg-cream-subtle p-1 rounded-lg border border-cream-border shrink-0">
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
        <div className="flex items-center space-x-2 shrink-0">
          {/* System Status Indicator */}
          <div className="hidden 2xl:flex items-center space-x-1.5 rounded-lg px-2.5 py-1 text-xs font-medium border border-cream-border bg-cream-subtle text-charcoal">
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
                <span>{identity.fingerprint.slice(0, 10)}...</span>
                {copied ? <Check className="h-2.5 w-2.5 text-sage-dark" /> : <Copy className="h-2.5 w-2.5" />}
              </button>
            </div>
          </div>

          {/* Tools Dropdown */}
          <div className="relative hidden sm:block">
            <button
              onClick={() => setToolsDropdownOpen(!toolsDropdownOpen)}
              className="flex items-center space-x-1.5 rounded px-2.5 py-1.5 text-xs font-medium text-charcoal hover:bg-cream-subtle border border-cream-border transition-colors"
            >
              <SlidersHorizontal className="h-3.5 w-3.5 text-charcoal-muted" />
              <span>Tools</span>
              <ChevronDown className={`h-3 w-3 text-charcoal-muted transition-transform ${toolsDropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {toolsDropdownOpen && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setToolsDropdownOpen(false)}
                />
                <div className="absolute right-0 mt-1.5 w-48 rounded-lg bg-white border border-cream-border shadow-xl z-50 py-1 font-sans text-xs">
                  {onRedactClick && (
                    <button
                      onClick={() => {
                        onRedactClick();
                        setToolsDropdownOpen(false);
                      }}
                      className="w-full flex items-center space-x-2 px-3 py-2 text-left hover:bg-cream transition-colors text-charcoal"
                    >
                      <EyeOff className="h-3.5 w-3.5 text-terracotta-dark" />
                      <div>
                        <div className="font-semibold">ZK-Redact</div>
                        <div className="text-[10px] text-charcoal-muted">Selective disclosure</div>
                      </div>
                    </button>
                  )}
                  {onMultisigClick && (
                    <button
                      onClick={() => {
                        onMultisigClick();
                        setToolsDropdownOpen(false);
                      }}
                      className="w-full flex items-center space-x-2 px-3 py-2 text-left hover:bg-cream transition-colors text-charcoal border-t border-cream-border/50"
                    >
                      <Award className="h-3.5 w-3.5 text-terracotta-dark" />
                      <div>
                        <div className="font-semibold">Multisig Seal</div>
                        <div className="text-[10px] text-charcoal-muted">M-of-N milestone</div>
                      </div>
                    </button>
                  )}
                  {onForensicsClick && (
                    <button
                      onClick={() => {
                        onForensicsClick();
                        setToolsDropdownOpen(false);
                      }}
                      className="w-full flex items-center space-x-2 px-3 py-2 text-left hover:bg-cream transition-colors text-charcoal border-t border-cream-border/50"
                    >
                      <Activity className="h-3.5 w-3.5 text-sage-dark" />
                      <div>
                        <div className="font-semibold">Origin Forensics</div>
                        <div className="text-[10px] text-charcoal-muted">Attribution heatmap</div>
                      </div>
                    </button>
                  )}
                  {onAirGapClick && (
                    <button
                      onClick={() => {
                        onAirGapClick();
                        setToolsDropdownOpen(false);
                      }}
                      className="w-full flex items-center space-x-2 px-3 py-2 text-left hover:bg-cream transition-colors text-charcoal border-t border-cream-border/50"
                    >
                      <Radio className="h-3.5 w-3.5 text-sage-dark" />
                      <div>
                        <div className="font-semibold">Optical Air-Gap</div>
                        <div className="text-[10px] text-charcoal-muted">QR code sync</div>
                      </div>
                    </button>
                  )}
                </div>
              </>
            )}
          </div>

          {onAIClick && (
            <button
              onClick={onAIClick}
              title="AI Provenance & Change Explainer"
              className="flex items-center space-x-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium bg-sage-light text-sage-dark border border-sage-border hover:bg-sage-200 transition-colors shrink-0"
            >
              <Sparkles className="h-3.5 w-3.5" />
              <span className="hidden md:inline">AI Assist</span>
            </button>
          )}

          {/* Share / P2P Room - Prominent Primary Action */}
          <button
            onClick={onShareClick}
            title="Share Document P2P Link"
            className="flex items-center space-x-1.5 rounded-lg bg-charcoal text-cream-50 hover:bg-charcoal/90 px-3 py-1.5 text-xs font-semibold transition-colors shadow-sm shrink-0"
          >
            <Share2 className="h-3.5 w-3.5 text-cream-50" />
            <span>Share</span>
          </button>

          {/* Export Bundle */}
          <button
            onClick={onExportClick}
            title="Export Verifiable Bundle"
            className="flex items-center space-x-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium border border-cream-border hover:bg-cream-subtle text-charcoal transition-colors shrink-0"
          >
            <Download className="h-3.5 w-3.5 text-charcoal-muted" />
            <span className="hidden sm:inline">Export</span>
          </button>

          {/* Onboarding Tour Trigger */}
          {onOnboardingClick && (
            <button
              onClick={onOnboardingClick}
              title="Guided User Tour"
              className="p-1.5 rounded-lg text-charcoal-muted hover:text-charcoal hover:bg-cream-subtle border border-cream-border transition-colors shrink-0"
            >
              <HelpCircle className="h-4 w-4" />
            </button>
          )}

          {/* Mobile Menu Hamburger */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="xl:hidden p-1.5 rounded-lg text-charcoal hover:bg-cream-subtle border border-cream-border transition-colors shrink-0"
          >
            {mobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Dropdown */}
      {mobileMenuOpen && (
        <div className="xl:hidden border-t border-cream-border bg-cream-50 px-4 py-3 space-y-3 font-sans">
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
            <button
              onClick={() => {
                onShareClick();
                setMobileMenuOpen(false);
              }}
              className="p-2 rounded bg-charcoal text-cream-50 font-semibold text-left flex items-center gap-2"
            >
              <Share2 className="w-3.5 h-3.5" />
              Share Link
            </button>
            <button
              onClick={() => {
                onExportClick();
                setMobileMenuOpen(false);
              }}
              className="p-2 rounded bg-cream-subtle border border-cream-border text-left flex items-center gap-2 text-charcoal font-semibold"
            >
              <Download className="w-3.5 h-3.5" />
              Export Bundle
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
