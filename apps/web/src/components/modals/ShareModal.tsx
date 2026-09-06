import React, { useState } from 'react';
import { X, Share2, Copy, Check, Radio, Network, Wifi, Shield } from 'lucide-react';

export interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  documentId: string;
  roomCode: string;
}

export const ShareModal: React.FC<ShareModalProps> = ({
  isOpen,
  onClose,
  documentId,
  roomCode,
}) => {
  const [copied, setCopied] = useState(false);

  const searchParams = new URLSearchParams(window.location.search);
  const signalParam = searchParams.get('signal');
  const shareUrl = `${window.location.origin}${window.location.pathname}?doc=${documentId}&room=${roomCode}${signalParam ? `&signal=${encodeURIComponent(signalParam)}` : ''}`;

  const copyUrl = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4">
      <div className="w-full max-w-lg glass-panel rounded-2xl border border-slate-800 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-800">
          <div className="flex items-center space-x-2.5">
            <div className="rounded-lg bg-cyan-500/10 p-2 text-cyan-400 border border-cyan-500/20">
              <Share2 className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Peer-to-Peer Collaboration</h3>
              <p className="text-xs text-slate-400">Direct WebRTC & BroadcastChannel Synchronization</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          {/* Features pills */}
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3 flex items-center space-x-2.5">
              <Radio className="h-4 w-4 text-emerald-400" />
              <div>
                <p className="font-semibold text-white">Multi-Tab Sync</p>
                <p className="text-[10px] text-slate-400">BroadcastChannel (0 net)</p>
              </div>
            </div>
            <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3 flex items-center space-x-2.5">
              <Network className="h-4 w-4 text-cyan-400" />
              <div>
                <p className="font-semibold text-white">P2P WebRTC</p>
                <p className="text-[10px] text-slate-400">Direct DataChannels</p>
              </div>
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1.5">
              Shareable Document URL
            </label>
            <div className="flex items-center space-x-2">
              <input
                type="text"
                readOnly
                value={shareUrl}
                className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-cyan-300 focus:outline-none"
              />
              <button
                onClick={copyUrl}
                className="flex items-center space-x-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white px-3.5 py-2 text-xs font-semibold transition-all shadow-md shadow-cyan-500/20 flex-shrink-0"
              >
                {copied ? (
                  <>
                    <Check className="h-3.5 w-3.5 text-emerald-400" />
                    <span>Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5" />
                    <span>Copy Link</span>
                  </>
                )}
              </button>
            </div>
          </div>

          <div className="bg-slate-900/60 rounded-xl p-3.5 border border-slate-800/80 text-xs text-slate-400 space-y-1.5">
            <div className="flex items-center space-x-1.5 text-slate-300 font-semibold">
              <Shield className="h-3.5 w-3.5 text-cyan-400" />
              <span>Zero-Knowledge Collaboration</span>
            </div>
            <p className="text-[11px] leading-relaxed">
              Document contents are transmitted directly peer-to-peer over encrypted WebRTC DataChannels. Incoming commits are cryptographically verified against ECDSA signatures before being applied to the document state.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/40 text-right">
          <button
            onClick={onClose}
            className="rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 px-4 py-1.5 text-xs font-semibold transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
