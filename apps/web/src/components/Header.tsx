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
  Server,
  Link2,
  MessageSquare,
} from 'lucide-react';
import { AuditReport } from '@hermes/core';
import { HermesIdentity } from '@hermes/crypto';
import { PeerPresence, TransportStatus } from '@hermes/sync';

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
  onJoinClick?: () => void;
  onVerifyClick: () => void;
  onDocumentsClick: () => void;
  onAIClick?: () => void;
  onRedactClick?: () => void;
  onMultisigClick?: () => void;
  onForensicsClick?: () => void;
  onAirGapClick?: () => void;
  onOnboardingClick?: () => void;
  onLoadingScreenClick?: () => void;
  onAuthorClick?: () => void;
  onChatClick?: () => void;
  isChatOpen?: boolean;
  unreadChatCount?: number;
  chatActiveRoom?: string;
  signalingStatus?: TransportStatus;
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
  onJoinClick,
  onVerifyClick,
  onDocumentsClick,
  onAIClick,
  onRedactClick,
  onMultisigClick,
  onForensicsClick,
  onAirGapClick,
  onOnboardingClick,
  onLoadingScreenClick,
  onAuthorClick,
  onChatClick,
  isChatOpen,
  unreadChatCount,
  chatActiveRoom,
  signalingStatus,
}) => {
  const [copied, setCopied] = useState(false);
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
      <div className="flex h-16 items-center justify-between gap-2 sm:gap-3 lg:gap-4 px-3 sm:px-4 lg:px-6 w-full max-w-[1600px] mx-auto min-w-0">
        {/* Left Section: Document Library Trigger */}
        <div className="flex items-center shrink-0">
          <button
            onClick={onDocumentsClick}
            className="flex items-center transition-colors hover:opacity-85 text-left shrink-0"
            title="Open Document Library"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-charcoal text-cream-50 border border-charcoal shrink-0">
              <Feather className="h-4 w-4 text-cream-50" />
            </div>
          </button>
        </div>

        {/* Center Section: Responsive Navigation Tabs (Compact Icons on xl, Full Text on 2xl+) */}
        <div className="hidden xl:flex items-center space-x-0.5 bg-cream-subtle p-1 rounded-lg border border-cream-border shrink-0">
          <button
            onClick={() => onTabChange('editor')}
            title="Document Editor"
            className={`flex items-center space-x-1.5 rounded px-2.5 py-1 text-xs font-medium transition-colors ${
              activeTab === 'editor'
                ? 'bg-cream-50 text-charcoal font-semibold border border-cream-border shadow-none'
                : 'text-charcoal-muted hover:text-charcoal'
            }`}
          >
            <FileText className="h-3.5 w-3.5" />
            <span className="hidden 2xl:inline">Editor</span>
          </button>

          <button
            onClick={() => onTabChange('dag')}
            title="Merkle Commit DAG"
            className={`flex items-center space-x-1.5 rounded px-2.5 py-1 text-xs font-medium transition-colors ${
              activeTab === 'dag'
                ? 'bg-cream-50 text-charcoal font-semibold border border-cream-border shadow-none'
                : 'text-charcoal-muted hover:text-charcoal'
            }`}
          >
            <Layers className="h-3.5 w-3.5" />
            <span className="hidden 2xl:inline">Commit DAG</span>
          </button>

          <button
            onClick={() => onTabChange('blame')}
            title="Cryptographic Signed Blame"
            className={`flex items-center space-x-1.5 rounded px-2.5 py-1 text-xs font-medium transition-colors ${
              activeTab === 'blame'
                ? 'bg-cream-50 text-charcoal font-semibold border border-cream-border shadow-none'
                : 'text-charcoal-muted hover:text-charcoal'
            }`}
          >
            <ShieldCheck className="h-3.5 w-3.5" />
            <span className="hidden 2xl:inline">Signed Blame</span>
          </button>

          <button
            onClick={() => onTabChange('timetravel')}
            title="State Revision Time Travel"
            className={`flex items-center space-x-1.5 rounded px-2.5 py-1 text-xs font-medium transition-colors ${
              activeTab === 'timetravel'
                ? 'bg-cream-50 text-charcoal font-semibold border border-cream-border shadow-none'
                : 'text-charcoal-muted hover:text-charcoal'
            }`}
          >
            <Radio className="h-3.5 w-3.5" />
            <span className="hidden 2xl:inline">Time Travel</span>
          </button>

          <button
            onClick={() => onTabChange('audit')}
            title="Cryptographic Audit & Verifier"
            className={`flex items-center space-x-1.5 rounded px-2.5 py-1 text-xs font-medium transition-colors ${
              activeTab === 'audit'
                ? 'bg-cream-50 text-charcoal font-semibold border border-cream-border shadow-none'
                : 'text-charcoal-muted hover:text-charcoal'
            }`}
          >
            <FileCheck2 className="h-3.5 w-3.5" />
            <span className="hidden 2xl:inline">Audit & Verify</span>
          </button>
        </div>

        {/* Right Section: Action Utilities & Identity */}
        <div className="flex items-center space-x-1 sm:space-x-1.5 shrink-0 min-w-0">
          {/* System Status Indicator */}
          <button
            onClick={onLoadingScreenClick}
            title="Click to view Render relay status and loading animation"
            className="hidden 2xl:flex items-center space-x-1.5 rounded-lg px-2 py-1 text-xs font-medium border border-cream-border bg-cream-subtle text-charcoal hover:bg-cream transition-colors cursor-pointer shrink-0"
          >
            <span
              className={`h-2 w-2 rounded-full ${
                activePeers.length > 0
                  ? 'bg-sage-dark'
                  : signalingStatus === 'CONNECTED'
                  ? 'bg-sage'
                  : signalingStatus === 'CONNECTING'
                  ? 'bg-terracotta animate-pulse'
                  : 'bg-charcoal-light'
              }`}
            />
            <span className="font-mono text-[11px]">
              {activePeers.length > 0
                ? 'Connected'
                : signalingStatus === 'CONNECTED'
                ? 'Relay Ready'
                : signalingStatus === 'CONNECTING'
                ? 'Waking Relay...'
                : 'Local / Offline'}
            </span>
          </button>

          {/* Author Fingerprint Card (Full on xl+, Avatar dot on <xl) */}
          <div className="hidden xl:flex items-center space-x-2 rounded-lg bg-cream-subtle border border-cream-border px-2 py-1 shrink-0">
            <button
              onClick={onAuthorClick}
              title="Click to edit author identity & cursor color"
              className="h-3 w-3 rounded-full flex-shrink-0 cursor-pointer hover:ring-2 hover:ring-charcoal/20 transition-all"
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
                  className="bg-cream-50 text-xs text-charcoal rounded px-1 border border-charcoal/30 focus:outline-none max-w-[90px]"
                />
              ) : (
                <button
                  onClick={onAuthorClick || (() => setIsEditingName(true))}
                  className="text-xs font-semibold text-charcoal hover:underline transition-all cursor-pointer text-left truncate max-w-[85px] sm:max-w-[110px]"
                  title="Click to change author display name & cursor style"
                >
                  {displayName}
                </button>
              )}
              <button
                onClick={copyFingerprint}
                title="Click to copy ECDSA public key fingerprint"
                className="flex items-center space-x-1 text-[10px] font-mono text-charcoal-muted hover:text-charcoal transition-colors cursor-pointer"
              >
                <span>{identity.fingerprint.slice(0, 8)}...</span>
                {copied ? <Check className="h-2.5 w-2.5 text-sage-dark" /> : <Copy className="h-2.5 w-2.5" />}
              </button>
            </div>
          </div>

          {/* Compact Author Avatar Button on smaller screens (< xl) */}
          <button
            onClick={onAuthorClick}
            title={`Author: ${displayName} (#${identity.fingerprint.replace('hermes:', '').slice(0, 8)}) - Click to edit profile`}
            className="xl:hidden h-7 w-7 rounded-full flex items-center justify-center text-[11px] text-white font-bold shrink-0 cursor-pointer border border-cream-border shadow-2xs hover:ring-2 hover:ring-charcoal/20 transition-all"
            style={{ backgroundColor: userColor || '#7A8B7B' }}
          >
            {displayName.charAt(0).toUpperCase()}
          </button>

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
                  {onLoadingScreenClick && (
                    <button
                      onClick={() => {
                        onLoadingScreenClick();
                        setToolsDropdownOpen(false);
                      }}
                      className="w-full flex items-center space-x-2 px-3 py-2 text-left hover:bg-cream transition-colors text-charcoal border-t border-cream-border/50 cursor-pointer"
                    >
                      <Server className="h-3.5 w-3.5 text-sage-dark" />
                      <div>
                        <div className="font-semibold">Render Relay & Loader</div>
                        <div className="text-[10px] text-charcoal-muted">Wake-up status & animation</div>
                      </div>
                    </button>
                  )}
                  {onChatClick && (
                    <button
                      onClick={() => {
                        onChatClick();
                        setToolsDropdownOpen(false);
                      }}
                      className="w-full flex items-center space-x-2 px-3 py-2 text-left hover:bg-cream transition-colors text-charcoal border-t border-cream-border/50 cursor-pointer"
                    >
                      <MessageSquare className="h-3.5 w-3.5 text-sage-dark" />
                      <div>
                        <div className="font-semibold">E2EE Chat & Rooms</div>
                        <div className="text-[10px] text-charcoal-muted">AES-256 encrypted chat</div>
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

          {/* Join Document Session */}
          {onJoinClick && (
            <button
              onClick={onJoinClick}
              title="Join via Invite Link or Room Code"
              className="flex items-center space-x-1 rounded-lg px-2 sm:px-2.5 py-1 text-xs font-semibold bg-white text-charcoal border border-cream-border hover:bg-cream-subtle transition-colors shrink-0 cursor-pointer shadow-xs"
            >
              <Link2 className="h-3.5 w-3.5 text-terracotta-dark" />
              <span>Join</span>
            </button>
          )}

          {/* Invite Collaborators */}
          {onShareClick && (
            <button
              onClick={onShareClick}
              title="Share Document & Invite Collaborators"
              className="flex items-center space-x-1 rounded-lg px-2 sm:px-2.5 py-1 text-xs font-semibold bg-sage-light text-sage-dark border border-sage-border hover:bg-sage-200 transition-colors shrink-0 cursor-pointer shadow-xs"
            >
              <Share2 className="h-3.5 w-3.5" />
              <span>Invite</span>
            </button>
          )}

          {/* E2EE Chat Toggle */}
          {onChatClick && (
            <button
              onClick={onChatClick}
              title={`End-to-End Encrypted Chat ${chatActiveRoom ? `(#${chatActiveRoom})` : ''}`}
              className={`relative flex items-center space-x-1 rounded-lg px-2 sm:px-2.5 py-1 text-xs font-semibold border transition-all shrink-0 cursor-pointer shadow-xs ${
                isChatOpen
                  ? 'bg-charcoal text-cream-50 border-charcoal'
                  : 'bg-white text-charcoal border-cream-border hover:bg-cream-subtle'
              }`}
            >
              <MessageSquare className="h-3.5 w-3.5 text-sage-dark" />
              <span>Chat</span>
              {unreadChatCount && unreadChatCount > 0 ? (
                <span className="bg-terracotta text-cream-50 font-bold px-1.5 py-0.2 rounded-full text-[10px] animate-pulse">
                  {unreadChatCount}
                </span>
              ) : (
                <span className="h-1.5 w-1.5 rounded-full bg-sage-dark" />
              )}
            </button>
          )}

          {/* Export Bundle */}
          <button
            onClick={onExportClick}
            title="Export Verifiable Bundle"
            className="flex items-center space-x-1 rounded-lg px-2 sm:px-2.5 py-1 text-xs font-medium border border-cream-border hover:bg-cream-subtle text-charcoal transition-colors shrink-0"
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

          <div className="pt-2 border-t border-cream-border grid grid-cols-3 gap-2 text-xs">
            {onJoinClick && (
              <button
                onClick={() => {
                  onJoinClick();
                  setMobileMenuOpen(false);
                }}
                className="p-2 rounded bg-white border border-cream-border text-charcoal font-semibold text-left flex items-center gap-1.5"
              >
                <Link2 className="w-3.5 h-3.5 text-terracotta-dark" />
                Join
              </button>
            )}
            <button
              onClick={() => {
                onShareClick();
                setMobileMenuOpen(false);
              }}
              className="p-2 rounded bg-charcoal text-cream-50 font-semibold text-left flex items-center gap-1.5"
            >
              <Share2 className="w-3.5 h-3.5" />
              Invite
            </button>
            <button
              onClick={() => {
                onExportClick();
                setMobileMenuOpen(false);
              }}
              className="p-2 rounded bg-cream-subtle border border-cream-border text-left flex items-center gap-1.5 text-charcoal font-semibold"
            >
              <Download className="w-3.5 h-3.5" />
              Export
            </button>
            {onChatClick && (
              <button
                onClick={() => {
                  onChatClick();
                  setMobileMenuOpen(false);
                }}
                className="p-2 rounded bg-white border border-cream-border text-left flex items-center justify-between gap-1.5 text-charcoal font-semibold col-span-3 sm:col-span-1"
              >
                <div className="flex items-center gap-1.5">
                  <MessageSquare className="w-3.5 h-3.5 text-sage-dark" />
                  <span>Encrypted Chat</span>
                </div>
                {unreadChatCount && unreadChatCount > 0 && (
                  <span className="bg-terracotta text-cream-50 font-bold px-1.5 py-0.2 rounded-full text-[10px]">
                    {unreadChatCount}
                  </span>
                )}
              </button>
            )}
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
