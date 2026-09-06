import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import * as Y from 'yjs';
import {
  AuditReport,
  CommitDAG,
  HermesDocument,
  HermesExportBundle,
  HermesVerifier,
  SignedCommitNode,
} from '@hermes/core';
import { CommitPipeline } from '@hermes/core';
import { base64ToUint8Array, HermesIdentity, sha256Hex, uint8ArrayToBase64 } from '@hermes/crypto';
import { HermesStorage } from '@hermes/storage';
import {
  BroadcastChannelTransport,
  PeerPresence,
  SyncEngine,
  SyncTransport,
  WebRTCTransport,
} from '@hermes/sync';

export interface UseHermesDocumentOptions {
  documentId: string;
  documentTitle: string;
  identity: HermesIdentity;
  displayName: string;
  userColor: string;
  storage: HermesStorage;
  enableWebRTC?: boolean;
  signalingUrl?: string;
  roomCode?: string;
}

export function useHermesDocument(options: UseHermesDocumentOptions) {
  const {
    documentId,
    documentTitle,
    identity,
    displayName,
    userColor,
    storage,
    enableWebRTC = true,
    signalingUrl = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SIGNALING_URL) ||
      'wss://hermes-signaling-relay.onrender.com',
    roomCode,
  } = options;

  // Authoritative document state
  const ydoc = useMemo(() => new Y.Doc(), [documentId]);
  const dag = useMemo(() => new CommitDAG(), [documentId]);

  const [commits, setCommits] = useState<SignedCommitNode[]>([]);
  const [heads, setHeads] = useState<string[]>([]);
  const [activePeers, setActivePeers] = useState<PeerPresence[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [auditReport, setAuditReport] = useState<AuditReport | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  const pipelineRef = useRef<CommitPipeline | null>(null);
  const syncEngineRef = useRef<SyncEngine | null>(null);

  // Refresh reactive states
  const refreshDAGState = useCallback(async () => {
    const allCommits = dag.topologicalSort();
    const currentHeads = dag.getHeads();
    setCommits(allCommits);
    setHeads(currentHeads);

    // Run background verification report
    if (allCommits.length > 0) {
      const bundle: HermesExportBundle = {
        format: 'hermesdocs',
        version: 1,
        document: {
          id: documentId,
          title: documentTitle,
          createdAt: Date.now(),
          updatedAt: Date.now(),
          heads: currentHeads,
        },
        authors: [
          {
            fingerprint: identity.fingerprint,
            publicKey: identity.publicKeyBase64,
            displayName,
          },
        ],
        commits: allCommits,
        heads: currentHeads,
        stateHash: await sha256Hex(Y.encodeStateAsUpdate(ydoc)),
        exportedAt: Date.now(),
      };
      const report = await HermesVerifier.verifyExportBundle(bundle);
      setAuditReport(report);
    }
  }, [dag, documentId, documentTitle, identity, displayName, ydoc]);

  // Initialize document, storage & transports
  useEffect(() => {
    let isMounted = true;

    async function init() {
      setIsSyncing(true);

      // 1. Load document metadata & existing commits from IndexedDB
      let doc = await storage.getDocument(documentId);
      if (!doc) {
        doc = {
          id: documentId,
          title: documentTitle,
          createdAt: Date.now(),
          updatedAt: Date.now(),
          heads: [],
        };
        await storage.saveDocument(doc);
      }

      const storedCommits = await storage.getCommits(documentId);
      for (const c of storedCommits) {
        dag.insert(c);
      }

      // Apply stored updates to Yjs doc
      const sortedCommits = dag.topologicalSort();
      for (const commit of sortedCommits) {
        try {
          const updateBytes = base64ToUint8Array(commit.updateBinary);
          Y.applyUpdate(ydoc, updateBytes, 'local_storage');
        } catch (err) {
          console.warn('Failed to replay commit update from storage', commit.id, err);
        }
      }

      // 2. Setup Transports (BroadcastChannel for tabs, WebRTC for P2P)
      const transports: SyncTransport[] = [new BroadcastChannelTransport(documentId)];

      if (enableWebRTC) {
        const webrtc = new WebRTCTransport(documentId, {
          signalingUrl,
          roomCode: roomCode || documentId,
        });
        webrtc.connect();
        transports.push(webrtc);
      }

      // 3. Setup Sync Engine
      const syncEngine = new SyncEngine({
        document: doc,
        identity,
        ydoc,
        dag,
        storage,
        transports,
        displayName,
        userColor,
      });
      syncEngineRef.current = syncEngine;

      // Listen for DAG changes from remote peers
      const unsubDAG = syncEngine.onDAGUpdated(() => {
        if (isMounted) {
          refreshDAGState();
        }
      });

      // Listen for presence changes
      const unsubPeers = syncEngine.getAwareness().onPeersChange((peers) => {
        if (isMounted) {
          setActivePeers(peers);
        }
      });

      // 4. Setup Commit Pipeline for local edits
      const pipeline = new CommitPipeline(identity, dag, {
        debounceMs: 1500,
        maxBatchSize: 50,
        onCommitCreated: async (newCommit) => {
          await storage.saveCommit(documentId, newCommit);
          await storage.setHeads(documentId, dag.getHeads());
          syncEngine.broadcastNewCommit(newCommit);
          if (isMounted) {
            refreshDAGState();
          }
        },
      });
      pipelineRef.current = pipeline;

      // 5. Attach Yjs update listener (Rule 2: TipTap -> Yjs -> Pipeline -> Signed Commit)
      const onYDocUpdate = (update: Uint8Array, origin: any) => {
        // Only buffer local edits; remote updates are already signed by remote peer!
        if (origin !== 'remote' && origin !== 'local_storage') {
          pipeline.enqueueUpdate(update);
        }
      };
      ydoc.on('update', onYDocUpdate);

      // Initial broadcast of presence and DAG state
      syncEngine.broadcastHello();
      syncEngine.broadcastAwareness();
      syncEngine.broadcastDAGHeads();

      // Periodic presence and sync heartbeat (every 4 seconds)
      const heartbeatTimer = setInterval(() => {
        if (isMounted && syncEngineRef.current) {
          syncEngineRef.current.broadcastHello();
          syncEngineRef.current.broadcastAwareness();
        }
      }, 4000);

      if (isMounted) {
        setIsLoaded(true);
        setIsSyncing(false);
        refreshDAGState();
      }

      return () => {
        clearInterval(heartbeatTimer);
        ydoc.off('update', onYDocUpdate);
        unsubDAG();
        unsubPeers();
        syncEngine.destroy();
      };
    }

    const cleanupPromise = init();

    return () => {
      isMounted = false;
      cleanupPromise.then((cleanup) => cleanup && cleanup());
    };
  }, [documentId, documentTitle, identity, enableWebRTC, signalingUrl, roomCode]);

  // Manual flush to immediately create a signed commit
  const flushCommit = useCallback(async () => {
    if (pipelineRef.current) {
      const commit = await pipelineRef.current.flush();
      if (commit) {
        refreshDAGState();
      }
      return commit;
    }
    return null;
  }, [refreshDAGState]);

  // Export .hermes.json audit bundle
  const exportBundle = useCallback(async (): Promise<HermesExportBundle> => {
    // Flush any pending updates first
    await flushCommit();

    const allCommits = dag.topologicalSort();
    const currentHeads = dag.getHeads();
    const stateUpdate = Y.encodeStateAsUpdate(ydoc);
    const stateHash = await sha256Hex(stateUpdate);

    const authorMap = new Map<string, string>();
    for (const c of allCommits) {
      authorMap.set(c.author.fingerprint, c.author.publicKey);
    }
    authorMap.set(identity.fingerprint, identity.publicKeyBase64);

    const authors = Array.from(authorMap.entries()).map(([fingerprint, publicKey]) => ({
      fingerprint,
      publicKey,
      displayName: fingerprint === identity.fingerprint ? displayName : undefined,
    }));

    return {
      format: 'hermesdocs',
      version: 1,
      document: {
        id: documentId,
        title: documentTitle,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        heads: currentHeads,
      },
      authors,
      commits: allCommits,
      heads: currentHeads,
      stateHash,
      exportedAt: Date.now(),
    };
  }, [flushCommit, dag, ydoc, identity, documentId, documentTitle, displayName]);

  return {
    ydoc,
    dag,
    commits,
    heads,
    activePeers,
    isSyncing,
    auditReport,
    isLoaded,
    flushCommit,
    exportBundle,
    refreshDAGState,
  };
}
