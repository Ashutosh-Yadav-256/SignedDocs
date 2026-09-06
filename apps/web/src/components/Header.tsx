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
  Key,
  Copy,
  Check,
  Radio,
  FileText,
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
}) => {
  const [copied, setCopied] = useState(false);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);

  const copyFingerprint = () => {
    navigator.clipboard.writeText(identity.fingerprint);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isAuditValid = auditReport?.verdict === 'VALID';

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-xl">
      <div className="flex h-16 items-center justify-between px-4 sm:px-6">
        {/* Left Section: Logo & Document Title */}
        <div className="flex items-center space-x-4">
          <button
            onClick={onDocumentsClick}
            className="flex items-center space-x-2.5 transition-opacity hover:opacity-80 group text-left"
          >
            <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500 via-sky-600 to-indigo-600 p-0.5 shadow-lg shadow-cyan-500/20 group-hover:shadow-cyan-500/30 transition-all">
              <div className="flex h-full w-full items-center justify-center rounded-[10px] bg-slate-950/90">
                <Sparkles className="h-5 w-5 text-cyan-400" />
              </div>
            </div>
            <div>
              <div className="flex items-center space-x-1.5">
                <span className="font-bold tracking-tight text-white text-base">HermesDocs</span>
                <span className="rounded bg-cyan-500/10 px-1.5 py-0.2 text-[10px] font-semibold text-cyan-400 border border-cyan-500/20">
                  DAG v1
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-mono">Local-First CRDT</p>
            </div>
          </button>

          <div className="h-6 w-px bg-slate-800" />

          {/* Title Editor */}
          <div className="flex items-center">
            {isEditingTitle ? (
              <input
                type="text"
                value={documentTitle}
                onChange={(e) => onTitleChange && onTitleChange(e.target.value)}
                onBlur={() => setIsEditingTitle(false)}
                onKeyDown={(e) => e.key === 'Enter' && setIsEditingTitle(false)}
                autoFocus
                className="bg-slate-900 border border-cyan-500/40 rounded px-2 py-1 text-sm font-semibold text-white focus:outline-none focus:ring-1 focus:ring-cyan-500"
              />
            ) : (
              <button
                onClick={() => setIsEditingTitle(true)}
                className="group flex items-center space-x-1.5 rounded-lg px-2.5 py-1 text-sm font-semibold text-slate-200 hover:bg-slate-900 transition-colors"
              >
                <span>{documentTitle}</span>
                <span className="text-slate-500 text-xs opacity-0 group-hover:opacity-100 transition-opacity">
                  ✎
                </span>
              </button>
            )}
          </div>
        </div>

        {/* Center Section: Navigation Tabs */}
        <div className="hidden lg:flex items-center space-x-1 rounded-xl bg-slate-900/90 p-1 border border-slate-800/80">
          <button
            onClick={() => onTabChange('editor')}
            className={`flex items-center space-x-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
              activeTab === 'editor'
                ? 'bg-gradient-to-r from-cyan-500 to-sky-500 text-white shadow-md shadow-cyan-500/25'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <FileText className="h-3.5 w-3.5" />
            <span>Editor</span>
          </button>

          <button
            onClick={() => onTabChange('dag')}
            className={`flex items-center space-x-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
              activeTab === 'dag'
                ? 'bg-gradient-to-r from-cyan-500 to-sky-500 text-white shadow-md shadow-cyan-500/25'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Layers className="h-3.5 w-3.5" />
            <span>Commit DAG</span>
          </button>

          <button
            onClick={() => onTabChange('blame')}
            className={`flex items-center space-x-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
              activeTab === 'blame'
                ? 'bg-gradient-to-r from-cyan-500 to-sky-500 text-white shadow-md shadow-cyan-500/25'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <ShieldCheck className="h-3.5 w-3.5" />
            <span>Signed Blame</span>
          </button>

          <button
            onClick={() => onTabChange('timetravel')}
            className={`flex items-center space-x-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
              activeTab === 'timetravel'
                ? 'bg-gradient-to-r from-cyan-500 to-sky-500 text-white shadow-md shadow-cyan-500/25'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Radio className="h-3.5 w-3.5" />
            <span>Time Travel</span>
          </button>

          <button
            onClick={() => onTabChange('audit')}
            className={`flex items-center space-x-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
              activeTab === 'audit'
                ? 'bg-gradient-to-r from-cyan-500 to-sky-500 text-white shadow-md shadow-cyan-500/25'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <FileCheck2 className="h-3.5 w-3.5" />
            <span>Audit & Verify</span>
          </button>
        </div>

        {/* Right Section: Author Identity & Action Buttons */}
        <div className="flex items-center space-x-3">
          {/* Cryptographic Audit Badge */}
          {auditReport && (
            <div
              className={`hidden md:flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${
                isAuditValid
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                  : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
              }`}
            >
              {isAuditValid ? (
                <>
                  <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
                  <span>Verified DAG ({auditReport.verifiedCommits})</span>
                </>
              ) : (
                <>
                  <ShieldAlert className="h-3.5 w-3.5 text-rose-400" />
                  <span>Unverified ({auditReport.failedCommits})</span>
                </>
              )}
            </div>
          )}

          {/* Active Peers Counter */}
          <div className="flex items-center space-x-1.5 rounded-lg bg-slate-900 px-2.5 py-1 border border-slate-800 text-xs text-slate-300">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <Users className="h-3.5 w-3.5 text-slate-400" />
            <span className="font-mono">{activePeers.length + 1}</span>
          </div>

          {/* Author Fingerprint Card */}
          <div className="flex items-center space-x-2 rounded-xl bg-slate-900/90 border border-slate-800 px-3 py-1.5">
            <div
              className="h-3 w-3 rounded-full flex-shrink-0"
              style={{ backgroundColor: userColor }}
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
                  className="bg-slate-800 text-xs text-white rounded px-1 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                />
              ) : (
                <button
                  onClick={() => setIsEditingName(true)}
                  className="text-xs font-semibold text-slate-200 hover:text-cyan-400 transition-colors"
                >
                  {displayName}
                </button>
              )}
              <button
                onClick={copyFingerprint}
                title="Click to copy ECDSA public key fingerprint"
                className="flex items-center space-x-1 text-[10px] font-mono text-slate-400 hover:text-slate-200 transition-colors"
              >
                <span>{identity.fingerprint.slice(0, 14)}...</span>
                {copied ? (
                  <Check className="h-2.5 w-2.5 text-emerald-400" />
                ) : (
                  <Copy className="h-2.5 w-2.5" />
                )}
              </button>
            </div>
          </div>

          {/* AI Intelligence Assistant */}
          {onAIClick && (
            <button
              onClick={onAIClick}
              className="flex items-center space-x-1.5 rounded-lg bg-gradient-to-r from-cyan-500/10 via-indigo-500/10 to-purple-500/10 border border-cyan-500/30 px-3 py-1.5 text-xs font-semibold text-cyan-300 hover:bg-cyan-500/20 hover:text-white transition-all shadow-sm"
            >
              <Sparkles className="h-3.5 w-3.5 text-cyan-400" />
              <span>AI Assistant</span>
            </button>
          )}

          {/* Share / P2P WebRTC */}
          <button
            onClick={onShareClick}
            className="flex items-center space-x-1.5 rounded-lg bg-slate-900 border border-slate-800 px-3 py-1.5 text-xs font-medium text-slate-200 hover:bg-slate-800 hover:text-white transition-all shadow-sm"
          >
            <Share2 className="h-3.5 w-3.5 text-cyan-400" />
            <span className="hidden sm:inline">P2P Room</span>
          </button>

          {/* Export .hermes.json */}
          <button
            onClick={onExportClick}
            className="flex items-center space-x-1.5 rounded-lg bg-gradient-to-r from-cyan-600 to-sky-600 px-3.5 py-1.5 text-xs font-semibold text-white hover:from-cyan-500 hover:to-sky-500 transition-all shadow-md shadow-cyan-500/20"
          >
            <Download className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Export Audit</span>
          </button>
        </div>
      </div>
    </header>
  );
};
