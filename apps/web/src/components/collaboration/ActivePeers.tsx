import React from 'react';
import { PeerPresence } from '@hermes/sync';
import { Users, ShieldCheck, Share2 } from 'lucide-react';

export interface ActivePeersProps {
  peers: PeerPresence[];
  currentUserFingerprint: string;
  currentUserDisplayName: string;
  currentUserColor: string;
  onShareClick?: () => void;
  onAuthorClick?: () => void;
}

export const ActivePeers: React.FC<ActivePeersProps> = ({
  peers,
  currentUserFingerprint,
  currentUserDisplayName,
  currentUserColor,
  onShareClick,
  onAuthorClick,
}) => {
  return (
    <div className="bg-cream-50 rounded-xl p-4 sm:p-5 border border-cream-border space-y-3.5 font-sans text-charcoal">
      {/* Header Row */}
      <div className="flex items-center justify-between pb-3 border-b border-cream-border gap-2">
        <div className="flex items-center space-x-2 min-w-0">
          <Users className="h-4 w-4 text-sage-dark shrink-0" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-charcoal truncate">
            Collaborators
          </h3>
        </div>
        <span className="text-[11px] font-mono bg-cream-subtle text-charcoal-muted border border-cream-border px-2 py-0.5 rounded font-semibold shrink-0">
          {peers.length + 1} Active
        </span>
      </div>

      {/* Primary Full-Width Invite Button */}
      {onShareClick && (
        <button
          onClick={onShareClick}
          className="w-full flex items-center justify-center space-x-2 py-2 px-3 rounded-lg bg-sage-light hover:bg-sage-200 border border-sage-border text-xs font-semibold text-sage-dark transition-all shadow-xs group cursor-pointer"
          title="Share Document Invite Link"
        >
          <Share2 className="h-3.5 w-3.5 transition-transform group-hover:scale-110 shrink-0" />
          <span>Invite Collaborators</span>
        </button>
      )}

      {/* Collaborator Peer Cards */}
      <div className="space-y-2">
        {/* You (Local Author) */}
        <div
          onClick={onAuthorClick}
          className={`flex items-center justify-between p-2.5 rounded-lg bg-cream-subtle border border-charcoal/20 ${
            onAuthorClick ? 'hover:bg-cream cursor-pointer transition-colors group' : ''
          }`}
          title={onAuthorClick ? 'Click to customize your author name & color' : undefined}
        >
          <div className="flex items-center space-x-2.5 min-w-0">
            <div
              className="h-3 w-3 rounded-full border border-charcoal/30 shrink-0 group-hover:scale-110 transition-transform"
              style={{ backgroundColor: currentUserColor }}
            />
            <div className="min-w-0">
              <div className="flex items-center space-x-1.5">
                <span className="text-xs font-semibold text-charcoal truncate max-w-[110px] group-hover:underline">
                  {currentUserDisplayName}
                </span>
                <span className="text-[9px] bg-charcoal text-cream-50 px-1.5 py-0.2 rounded font-medium shrink-0">
                  You
                </span>
              </div>
              <p className="text-[10px] font-mono text-charcoal-muted truncate max-w-[130px]">
                {currentUserFingerprint.slice(0, 14)}...
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-1 text-[10px] text-sage-dark bg-sage-light border border-sage-border px-1.5 py-0.5 rounded shrink-0">
            <ShieldCheck className="h-3 w-3" />
            <span>Key Holder</span>
          </div>
        </div>

        {/* Remote Peers */}
        {peers.map((peer) => (
          <div
            key={peer.author.fingerprint}
            className="flex items-center justify-between p-2.5 rounded-lg bg-cream-50 border border-cream-border hover:bg-cream-subtle transition-colors"
          >
            <div className="flex items-center space-x-2.5 min-w-0">
              <div
                className="h-3 w-3 rounded-full border border-charcoal/20 shrink-0"
                style={{ backgroundColor: peer.color || '#7A8B7B' }}
              />
              <div className="min-w-0">
                <span className="text-xs font-semibold text-charcoal block truncate max-w-[120px]">
                  {peer.displayName || 'Peer ' + peer.author.fingerprint.slice(0, 6)}
                </span>
                <p className="text-[10px] font-mono text-charcoal-muted truncate max-w-[130px]">
                  {peer.author.fingerprint.slice(0, 14)}...
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-1 text-[10px] text-sage-dark bg-sage-light border border-sage-border px-1.5 py-0.5 rounded shrink-0">
              <ShieldCheck className="h-3 w-3" />
              <span>Verified</span>
            </div>
          </div>
        ))}

        {/* Subtle empty state when alone */}
        {peers.length === 0 && (
          <div className="rounded-lg border border-dashed border-cream-border bg-cream-subtle/40 p-2.5 text-center">
            <p className="text-[11px] text-charcoal-muted mb-1">Editing alone in local mode</p>
            {onShareClick && (
              <button
                onClick={onShareClick}
                className="inline-flex items-center space-x-1 text-xs text-sage-dark font-medium hover:underline cursor-pointer"
              >
                <Share2 className="h-3 w-3" />
                <span>Share link to collaborate</span>
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
