import { HermesAuthor } from '@hermes/core';

export interface PeerPresence {
  author: HermesAuthor;
  cursor?: {
    anchor: number;
    head: number;
  };
  color: string;
  displayName?: string;
  lastActive: number;
}

export class AwarenessManager {
  private peers: Map<string, PeerPresence> = new Map();
  private listeners: ((peers: PeerPresence[]) => void)[] = [];
  private cleanupInterval: any = null;

  constructor() {
    this.cleanupInterval = setInterval(() => {
      this.purgeInactivePeers();
    }, 10000);
  }

  public updatePeer(presence: PeerPresence): void {
    this.peers.set(presence.author.fingerprint, presence);
    this.notify();
  }

  public removePeer(fingerprint: string): void {
    if (this.peers.delete(fingerprint)) {
      this.notify();
    }
  }

  public getActivePeers(): PeerPresence[] {
    return Array.from(this.peers.values());
  }

  public onPeersChange(handler: (peers: PeerPresence[]) => void): () => void {
    this.listeners.push(handler);
    handler(this.getActivePeers());
    return () => {
      this.listeners = this.listeners.filter((h) => h !== handler);
    };
  }

  private purgeInactivePeers(): void {
    const now = Date.now();
    let changed = false;
    for (const [fingerprint, peer] of this.peers.entries()) {
      if (now - peer.lastActive > 30000) {
        // 30s timeout
        this.peers.delete(fingerprint);
        changed = true;
      }
    }
    if (changed) {
      this.notify();
    }
  }

  private notify(): void {
    const active = this.getActivePeers();
    for (const listener of this.listeners) {
      listener(active);
    }
  }

  public destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    this.peers.clear();
    this.listeners = [];
  }
}
