import * as Y from 'yjs';
import {
  computeCommitId,
  HermesIdentity,
  serializeCanonicalHeader,
  sha256Hex,
  signCanonicalHeader,
  uint8ArrayToBase64,
} from '@hermes/crypto';
import { CommitDAG } from './dag.js';
import { SignedCommitNode } from './types.js';

export interface CommitPipelineOptions {
  debounceMs?: number;
  maxBatchSize?: number;
  onCommitCreated?: (commit: SignedCommitNode) => Promise<void> | void;
}

export class CommitPipeline {
  private updateBuffer: Uint8Array[] = [];
  private debounceTimer: any = null;
  private debounceMs: number;
  private maxBatchSize: number;
  private onCommitCreated?: (commit: SignedCommitNode) => Promise<void> | void;
  private identity: HermesIdentity;
  private dag: CommitDAG;
  private isCommitting: boolean = false;

  constructor(
    identity: HermesIdentity,
    dag: CommitDAG,
    options: CommitPipelineOptions = {}
  ) {
    this.identity = identity;
    this.dag = dag;
    this.debounceMs = options.debounceMs ?? 1500;
    this.maxBatchSize = options.maxBatchSize ?? 50;
    this.onCommitCreated = options.onCommitCreated;
  }

  public setIdentity(identity: HermesIdentity): void {
    this.identity = identity;
  }

  /**
   * Enqueues a raw incremental Yjs update into the local buffer.
   */
  public enqueueUpdate(update: Uint8Array): void {
    this.updateBuffer.push(update);

    if (this.updateBuffer.length >= this.maxBatchSize) {
      this.flush();
      return;
    }

    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }

    this.debounceTimer = setTimeout(() => {
      this.flush();
    }, this.debounceMs);
  }

  /**
   * Flushes the buffered updates and creates a SignedCommitNode.
   */
  public async flush(): Promise<SignedCommitNode | null> {
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
      this.debounceTimer = null;
    }

    if (this.updateBuffer.length === 0 || this.isCommitting) {
      return null;
    }

    this.isCommitting = true;
    const updatesToProcess = [...this.updateBuffer];
    this.updateBuffer = [];

    try {
      // 1. Merge incremental Yjs updates into a single atomic update binary
      const mergedUpdate = Y.mergeUpdates(updatesToProcess);
      const updateBinary = uint8ArrayToBase64(mergedUpdate);

      // 2. Compute SHA-256 hash of update binary
      const updateHash = await sha256Hex(mergedUpdate);

      // 3. Get current DAG heads to serve as parent IDs
      const parentIds = this.dag.getHeads();
      const timestamp = Date.now();

      // 4. Construct canonical commit header
      const canonicalHeader = {
        version: 1 as const,
        parentIds,
        updateHash,
        authorPublicKey: this.identity.publicKeyBase64,
        timestamp,
      };

      // 5. Compute commit ID: SHA-256(canonicalHeader)
      const commitId = await computeCommitId(canonicalHeader);

      // 6. Sign canonical header with ECDSA P-256
      const canonicalBytes = serializeCanonicalHeader(canonicalHeader);
      const signature = await signCanonicalHeader(
        this.identity.privateKey,
        canonicalBytes
      );

      // 7. Assemble SignedCommitNode
      const commit: SignedCommitNode = {
        version: 1,
        id: commitId,
        parentIds,
        author: {
          fingerprint: this.identity.fingerprint,
          publicKey: this.identity.publicKeyBase64,
        },
        timestamp,
        updateHash,
        updateBinary,
        signature,
      };

      // 8. Insert into local DAG
      this.dag.insert(commit);

      // 9. Callback for persistence & sync
      if (this.onCommitCreated) {
        await this.onCommitCreated(commit);
      }

      return commit;
    } finally {
      this.isCommitting = false;
    }
  }
}
