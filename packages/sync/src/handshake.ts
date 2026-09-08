import * as Y from 'yjs';
import { Awareness, encodeAwarenessUpdate, applyAwarenessUpdate } from 'y-protocols/awareness';
import {
  CommitDAG,
  HermesAuthor,
  HermesDocument,
  HermesVerifier,
  SignedCommitNode,
} from '@hermes/core';
import { base64ToUint8Array, uint8ArrayToBase64, HermesIdentity } from '@hermes/crypto';
import {
  AwarenessMessage,
  ChatEncryptedMessage,
  DAGHeadsMessage,
  HermesMessage,
  IdentityHelloMessage,
  NewCommitMessage,
  PROTOCOL_VERSION,
  SyncRequestMessage,
  SyncResponseMessage,
} from '@hermes/protocol';
import { HermesStorage } from '@hermes/storage';
import { AwarenessManager, PeerPresence } from './awareness.js';
import { SyncTransport, TransportStatus } from './transport.js';

export interface SyncEngineOptions {
  document: HermesDocument;
  identity: HermesIdentity;
  ydoc: Y.Doc;
  dag: CommitDAG;
  storage: HermesStorage;
  transports: SyncTransport[];
  displayName?: string;
  userColor?: string;
  yAwareness?: Awareness;
}

export class SyncEngine {
  private document: HermesDocument;
  private identity: HermesIdentity;
  private ydoc: Y.Doc;
  private dag: CommitDAG;
  private storage: HermesStorage;
  private transports: SyncTransport[] = [];
  private awareness: AwarenessManager;
  private yAwareness: Awareness;
  private displayName: string;
  private userColor: string;
  private isProcessingRemoteUpdate = false;
  private onDAGUpdatedCallbacks: (() => void)[] = [];
  private chatMessageListeners: ((msg: ChatEncryptedMessage) => void)[] = [];

  constructor(options: SyncEngineOptions) {
    this.document = options.document;
    this.identity = options.identity;
    this.ydoc = options.ydoc;
    this.dag = options.dag;
    this.storage = options.storage;
    this.awareness = new AwarenessManager();
    this.yAwareness = options.yAwareness || new Awareness(this.ydoc);
    this.displayName = options.displayName || 'Anonymous Author';
    this.userColor = options.userColor || '#' + Math.floor(Math.random() * 16777215).toString(16);

    // Initialize local Yjs awareness state for collaborative cursors
    const authorShortId = this.identity.fingerprint.replace('hermes:', '').slice(0, 8);
    this.yAwareness.setLocalStateField('user', {
      name: this.displayName,
      color: this.userColor,
      authorId: authorShortId,
      fingerprint: this.identity.fingerprint,
    });

    // Listen to local awareness changes and broadcast to peers
    this.yAwareness.on('update', ({ added, updated, removed }: { added: number[]; updated: number[]; removed: number[] }, origin: any) => {
      if (origin !== 'remote') {
        const clients = added.concat(updated).concat(removed);
        if (clients.length > 0) {
          const updateBytes = encodeAwarenessUpdate(this.yAwareness, clients);
          this.broadcastAwareness(undefined, uint8ArrayToBase64(updateBytes));
        }
      }
    });

    for (const transport of options.transports) {
      this.addTransport(transport);
    }
  }

  public addTransport(transport: SyncTransport): void {
    this.transports.push(transport);

    transport.onMessage((msg) => {
      this.handleMessage(msg, transport);
    });

    transport.onStatusChange((status) => {
      if (status === 'CONNECTED') {
        this.broadcastHello();
        this.broadcastDAGHeads();
      }
    });

    if (transport.getStatus() === 'CONNECTED') {
      this.broadcastHello();
      this.broadcastDAGHeads();
    }
  }

  public getAwareness(): AwarenessManager {
    return this.awareness;
  }

  public onDAGUpdated(callback: () => void): () => void {
    this.onDAGUpdatedCallbacks.push(callback);
    return () => {
      this.onDAGUpdatedCallbacks = this.onDAGUpdatedCallbacks.filter((cb) => cb !== callback);
    };
  }

  private notifyDAGUpdated(): void {
    for (const cb of this.onDAGUpdatedCallbacks) {
      cb();
    }
  }

  // --- Broadcast Protocol Messages ---

  public broadcastHello(): void {
    const author: HermesAuthor = {
      fingerprint: this.identity.fingerprint,
      publicKey: this.identity.publicKeyBase64,
      displayName: this.displayName,
    };

    const msg: IdentityHelloMessage = {
      type: 'IDENTITY_HELLO',
      protocolVersion: PROTOCOL_VERSION,
      documentId: this.document.id,
      author,
      timestamp: Date.now(),
    };

    this.broadcast(msg);
  }

  public broadcastDAGHeads(): void {
    const msg: DAGHeadsMessage = {
      type: 'DAG_HEADS',
      documentId: this.document.id,
      heads: this.dag.getHeads(),
      timestamp: Date.now(),
    };

    this.broadcast(msg);
  }

  public broadcastNewCommit(commit: SignedCommitNode): void {
    const msg: NewCommitMessage = {
      type: 'NEW_COMMIT',
      documentId: this.document.id,
      commit,
    };

    this.broadcast(msg);
    this.broadcastDAGHeads();
  }

  public broadcastAwareness(cursor?: { anchor: number; head: number }, awarenessUpdate?: string): void {
    let encodedUpdate = awarenessUpdate;
    if (!encodedUpdate) {
      try {
        const bytes = encodeAwarenessUpdate(this.yAwareness, [this.yAwareness.clientID]);
        encodedUpdate = uint8ArrayToBase64(bytes);
      } catch {
        // ignore
      }
    }

    const msg: AwarenessMessage = {
      type: 'AWARENESS',
      documentId: this.document.id,
      author: {
        fingerprint: this.identity.fingerprint,
        publicKey: this.identity.publicKeyBase64,
        displayName: this.displayName,
      },
      state: {
        cursor,
        color: this.userColor,
        displayName: this.displayName,
        lastActive: Date.now(),
      },
      awarenessUpdate: encodedUpdate,
    };

    this.broadcast(msg);
  }

  private broadcast(msg: HermesMessage): void {
    for (const transport of this.transports) {
      transport.send(msg);
    }
  }

  // --- Inbound Protocol Message Handler ---

  private async handleMessage(msg: HermesMessage, sourceTransport: SyncTransport): Promise<void> {
    if (msg.documentId !== this.document.id) return;

    switch (msg.type) {
      case 'IDENTITY_HELLO': {
        const isNewPeer = !this.awareness.getActivePeers().some((p) => p.author.fingerprint === msg.author.fingerprint);
        this.awareness.updatePeer({
          author: msg.author,
          color: '#6366f1',
          displayName: msg.author.displayName || msg.author.fingerprint.slice(0, 12),
          lastActive: msg.timestamp,
        });

        // Greet new peer back with our identity and DAG heads so they sync immediately
        if (isNewPeer) {
          this.broadcastHello();
          this.broadcastAwareness();
          this.broadcastDAGHeads();
        }
        break;
      }

      case 'DAG_HEADS': {
        const remoteHeads = msg.heads;
        const localHeads = this.dag.getHeads();

        // Check if remote heads contain commits we don't have
        const hasMissing = remoteHeads.length > 0 && remoteHeads.some((h) => !this.dag.has(h));
        if (hasMissing) {
          const req: SyncRequestMessage = {
            type: 'SYNC_REQUEST',
            documentId: this.document.id,
            knownHeads: localHeads,
          };
          sourceTransport.send(req);
        }

        // If we have heads that the remote peer doesn't have, announce our heads so they can sync
        const remoteMissingFromUs = localHeads.length > 0 && localHeads.some((h) => !remoteHeads.includes(h));
        if (remoteMissingFromUs && !hasMissing) {
          const headsMsg: DAGHeadsMessage = {
            type: 'DAG_HEADS',
            documentId: this.document.id,
            heads: localHeads,
            timestamp: Date.now(),
          };
          sourceTransport.send(headsMsg);
        }
        break;
      }

      case 'SYNC_REQUEST': {
        const missing = this.dag.getMissingCommits(msg.knownHeads);
        if (missing.length > 0) {
          const resp: SyncResponseMessage = {
            type: 'SYNC_RESPONSE',
            documentId: this.document.id,
            commits: missing,
          };
          sourceTransport.send(resp);
        }
        break;
      }

      case 'SYNC_RESPONSE': {
        const applied = await this.processIncomingCommits(msg.commits);
        if (applied > 0) {
          this.broadcastDAGHeads();
        }
        break;
      }

      case 'NEW_COMMIT': {
        await this.processIncomingCommits([msg.commit]);
        break;
      }

      case 'AWARENESS': {
        this.awareness.updatePeer({
          author: msg.author,
          cursor: msg.state.cursor,
          color: msg.state.color,
          displayName: msg.state.displayName || msg.author.fingerprint.slice(0, 12),
          lastActive: msg.state.lastActive,
        });

        if (msg.awarenessUpdate) {
          try {
            const bytes = base64ToUint8Array(msg.awarenessUpdate);
            applyAwarenessUpdate(this.yAwareness, bytes, 'remote');
          } catch (err) {
            console.warn('Failed to apply remote Yjs awareness update', err);
          }
        }
        break;
      }

      case 'CHAT_MESSAGE': {
        for (const handler of this.chatMessageListeners) {
          handler(msg);
        }
        break;
      }
    }
  }

  /**
   * Cryptographically verifies incoming commits before applying updates to Yjs document.
   */
  public async processIncomingCommits(commits: SignedCommitNode[]): Promise<number> {
    let appliedCount = 0;

    for (const commit of commits) {
      if (this.dag.has(commit.id)) {
        continue; // Already processed
      }

      // Step 1: Cryptographically verify the commit
      const verification = await HermesVerifier.verifyCommit(commit);
      if (!verification.isValid) {
        console.error(
          `[Hermes Security Alert] Rejected malicious/corrupted commit ${commit.id}: ${verification.error}`
        );
        continue;
      }

      // Step 2: Insert into local DAG
      this.dag.insert(commit);

      // Step 3: Apply verified incremental Yjs update to live document state
      try {
        const updateBytes = base64ToUint8Array(commit.updateBinary);
        this.isProcessingRemoteUpdate = true;
        Y.applyUpdate(this.ydoc, updateBytes, 'remote');
      } catch (err) {
        console.error('Failed to apply verified Yjs update', err);
      } finally {
        this.isProcessingRemoteUpdate = false;
      }

      // Step 4: Persist to local IndexedDB
      await this.storage.saveCommit(this.document.id, commit);
      await this.storage.setHeads(this.document.id, this.dag.getHeads());

      appliedCount++;
    }

    if (appliedCount > 0) {
      this.notifyDAGUpdated();
    }

    return appliedCount;
  }

  public isRemoteUpdateActive(): boolean {
    return this.isProcessingRemoteUpdate;
  }

  public getYjsAwareness(): Awareness {
    return this.yAwareness;
  }

  public updateLocalUser(displayName: string, userColor: string): void {
    this.displayName = displayName;
    this.userColor = userColor;
    const authorShortId = this.identity.fingerprint.replace('hermes:', '').slice(0, 8);
    this.yAwareness.setLocalStateField('user', {
      name: displayName,
      color: userColor,
      authorId: authorShortId,
      fingerprint: this.identity.fingerprint,
    });
    this.broadcastAwareness();
  }

  public onChatMessage(handler: (msg: ChatEncryptedMessage) => void): () => void {
    this.chatMessageListeners.push(handler);
    return () => {
      this.chatMessageListeners = this.chatMessageListeners.filter((h) => h !== handler);
    };
  }

  public broadcastChatMessage(msg: ChatEncryptedMessage): void {
    this.broadcast(msg);
  }

  public destroy(): void {
    for (const transport of this.transports) {
      transport.close();
    }
    this.chatMessageListeners = [];
    this.yAwareness.destroy();
    this.awareness.destroy();
    this.onDAGUpdatedCallbacks = [];
  }
}
