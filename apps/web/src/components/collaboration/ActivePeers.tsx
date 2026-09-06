import React from 'react';
import { PeerPresence } from '@hermes/sync';
import { Users, ShieldCheck } from 'lucide-react';

export interface ActivePeersProps {
  peers: PeerPresence[];
  currentUserFingerprint: string;
  currentUserDisplayName: string;
  currentUserColor: string;
}

export const ActivePeers: React.FC<ActivePeersProps> = ({
  peers,
  currentUserFingerprint,
  currentUserDisplayName,
  currentUserColor,
}) => {
  return (
    <div className="bg-cream-50 rounded-xl p-5 border border-cream-border space-y-4 font-sans text-charcoal">
      <div className="flex items-center justify-between pb-3 border-b border-cream-border">
        <div className="flex items-center space-x-2">
          <Users className="h-4 w-4 text-sage-dark" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-charcoal">Active Collaborators</h3>
        </div>
        <span className="text-xs font-mono bg-cream-subtle text-charcoal-muted border border-cream-border px-2 py-0.5 rounded font-semibold">
          {peers.length + 1} Active
        </span>
      </div>

      <div className="space-y-2">
        {/* You (Local Author) */}
        <div className="flex items-center justify-between p-2.5 rounded-lg bg-cream-subtle border border-charcoal/20">
          <div className="flex items-center space-x-3">
            <div
              className="h-3 w-3 rounded-full border border-charcoal/30"
              style={{ backgroundColor: currentUserColor }}
            />
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xs font-semibold text-charcoal">{currentUserDisplayName}</span>
                <span className="text-[10px] bg-charcoal text-cream-50 px-1.5 py-0.2 rounded font-medium">
                  You
                </span>
              </div>
              <p className="text-[10px] font-mono text-charcoal-muted">
                {currentUserFingerprint.slice(0, 16)}...
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-1 text-[10px] text-sage-dark bg-sage-light border border-sage-border px-2 py-0.5 rounded">
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
            <div className="flex items-center space-x-3">
              <div
                className="h-3 w-3 rounded-full border border-charcoal/20"
                style={{ backgroundColor: peer.color || '#7A8B7B' }}
              />
              <div>
                <span className="text-xs font-semibold text-charcoal">
                  {peer.displayName || 'Peer ' + peer.author.fingerprint.slice(0, 6)}
                </span>
                <p className="text-[10px] font-mono text-charcoal-muted">
                  {peer.author.fingerprint.slice(0, 16)}...
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-1 text-[10px] text-sage-dark bg-sage-light border border-sage-border px-2 py-0.5 rounded">
              <ShieldCheck className="h-3 w-3" />
              <span>Verified</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
