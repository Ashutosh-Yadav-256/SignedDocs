import React from 'react';
import { PeerPresence } from '@hermes/sync';
import { Users, Radio, ShieldCheck, User } from 'lucide-react';

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
    <div className="glass-panel rounded-2xl p-5 border border-slate-800 shadow-xl space-y-4">
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div className="flex items-center space-x-2">
          <Users className="h-4 w-4 text-cyan-400" />
          <h3 className="text-sm font-bold text-white">Active Collaborative Peers</h3>
        </div>
        <span className="text-xs font-mono bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 px-2 py-0.5 rounded-full">
          {peers.length + 1} Connected
        </span>
      </div>

      <div className="space-y-2">
        {/* You (Local Author) */}
        <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-900/90 border border-cyan-500/30">
          <div className="flex items-center space-x-3">
            <div
              className="h-3 w-3 rounded-full ring-2 ring-cyan-500/40"
              style={{ backgroundColor: currentUserColor }}
            />
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xs font-bold text-white">{currentUserDisplayName}</span>
                <span className="text-[10px] bg-cyan-500/20 text-cyan-300 px-1.5 py-0.2 rounded font-semibold">
                  You (Local)
                </span>
              </div>
              <p className="text-[10px] font-mono text-slate-400">
                {currentUserFingerprint.slice(0, 16)}...
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-1 text-[10px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
            <ShieldCheck className="h-3 w-3" />
            <span>Key Holder</span>
          </div>
        </div>

        {/* Remote Peers */}
        {peers.map((peer) => (
          <div
            key={peer.author.fingerprint}
            className="flex items-center justify-between p-2.5 rounded-xl bg-slate-900/60 border border-slate-800/80 hover:border-slate-700 transition-colors"
          >
            <div className="flex items-center space-x-3">
              <div
                className="h-3 w-3 rounded-full"
                style={{ backgroundColor: peer.color || '#6366f1' }}
              />
              <div>
                <span className="text-xs font-semibold text-slate-200">
                  {peer.displayName || 'Peer ' + peer.author.fingerprint.slice(0, 6)}
                </span>
                <p className="text-[10px] font-mono text-slate-400">
                  {peer.author.fingerprint.slice(0, 16)}...
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-1 text-[10px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
              <ShieldCheck className="h-3 w-3" />
              <span>Verified</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
