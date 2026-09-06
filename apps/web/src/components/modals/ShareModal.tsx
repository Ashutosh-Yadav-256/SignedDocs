import React, { useState } from 'react';
import { X, Share2, Copy, Check, Radio, Network, Shield } from 'lucide-react';

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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-charcoal/40 p-4">
      <div className="w-full max-w-lg bg-cream-light rounded-lg border border-cream-border overflow-hidden text-charcoal">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-cream-border">
          <div className="flex items-center space-x-3">
            <div className="rounded border border-sage/30 bg-sage/10 p-2 text-sage">
              <Share2 className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold font-serif text-charcoal">Peer-to-Peer Collaboration</h3>
              <p className="text-xs text-charcoal-muted">Direct WebRTC & BroadcastChannel Synchronization</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded p-1.5 text-charcoal-muted hover:bg-cream hover:text-charcoal transition-colors border border-transparent hover:border-cream-border"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          {/* Features pills */}
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="bg-cream border border-cream-border rounded-lg p-3 flex items-center space-x-2.5">
              <Radio className="h-4 w-4 text-sage" />
              <div>
                <p className="font-semibold text-charcoal">Multi-Tab Sync</p>
                <p className="text-[10px] text-charcoal-muted">BroadcastChannel (0 net)</p>
              </div>
            </div>
            <div className="bg-cream border border-cream-border rounded-lg p-3 flex items-center space-x-2.5">
              <Network className="h-4 w-4 text-terracotta" />
              <div>
                <p className="font-semibold text-charcoal">P2P WebRTC</p>
                <p className="text-[10px] text-charcoal-muted">Direct DataChannels</p>
              </div>
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-charcoal block mb-1.5">
              Shareable Document URL
            </label>
            <div className="flex items-center space-x-2">
              <input
                type="text"
                readOnly
                value={shareUrl}
                className="flex-1 bg-cream border border-cream-border rounded px-3 py-2 text-xs font-mono text-charcoal focus:outline-none focus:border-charcoal"
              />
              <button
                onClick={copyUrl}
                className="flex items-center space-x-1.5 rounded bg-charcoal hover:bg-charcoal/90 text-cream px-3.5 py-2 text-xs font-semibold transition-colors border border-charcoal flex-shrink-0"
              >
                {copied ? (
                  <>
                    <Check className="h-3.5 w-3.5 text-sage" />
                    <span className="text-sage">Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5 text-cream" />
                    <span>Copy Link</span>
                  </>
                )}
              </button>
            </div>
          </div>

          <div className="bg-cream rounded-lg p-3.5 border border-cream-border text-xs text-charcoal space-y-1.5">
            <div className="flex items-center space-x-1.5 text-charcoal font-semibold">
              <Shield className="h-3.5 w-3.5 text-sage" />
              <span>Zero-Knowledge Collaboration</span>
            </div>
            <p className="text-[11px] leading-relaxed text-charcoal-muted">
              Document contents are transmitted directly peer-to-peer over encrypted WebRTC DataChannels. Incoming commits are cryptographically verified against ECDSA signatures before being applied to the document state.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-cream-border bg-cream text-right">
          <button
            onClick={onClose}
            className="rounded bg-cream-light hover:bg-cream-dark text-charcoal border border-cream-border px-4 py-1.5 text-xs font-semibold transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
