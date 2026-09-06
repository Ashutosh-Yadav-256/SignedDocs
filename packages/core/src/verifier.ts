import {
  base64ToUint8Array,
  computeCommitId,
  deriveFingerprint,
  sha256Hex,
  verifySignature,
} from '@hermes/crypto';
import { CommitDAG } from './dag.js';
import {
  AuditReport,
  CommitVerificationResult,
  HermesExportBundle,
  SignedCommitNode,
} from './types.js';

export class HermesVerifier {
  /**
   * Cryptographically verifies a single SignedCommitNode in isolation.
   */
  public static async verifyCommit(
    commit: SignedCommitNode
  ): Promise<CommitVerificationResult> {
    // 1. Validate Schema
    if (
      !commit ||
      commit.version !== 1 ||
      !commit.id ||
      !Array.isArray(commit.parentIds) ||
      !commit.author ||
      !commit.author.publicKey ||
      !commit.author.fingerprint ||
      typeof commit.timestamp !== 'number' ||
      !commit.updateHash ||
      !commit.updateBinary ||
      !commit.signature
    ) {
      return {
        commitId: commit?.id || 'unknown',
        verdict: 'INVALID_SCHEMA',
        isValid: false,
        error: 'Commit does not adhere to Hermes SignedCommitNode v1 schema',
      };
    }

    try {
      // 2 & 3. Decode updateBinary & compare updateHash
      const updateBytes = base64ToUint8Array(commit.updateBinary);
      const computedUpdateHash = await sha256Hex(updateBytes);
      if (computedUpdateHash.toLowerCase() !== commit.updateHash.toLowerCase()) {
        return {
          commitId: commit.id,
          verdict: 'HASH_MISMATCH',
          isValid: false,
          error: `Update binary hash mismatch. Expected ${commit.updateHash}, computed ${computedUpdateHash}`,
          authorFingerprint: commit.author.fingerprint,
          timestamp: commit.timestamp,
        };
      }

      // 4 & 5. Reconstruct canonical commit header & compare commit ID
      const canonicalHeader = {
        version: 1 as const,
        parentIds: commit.parentIds,
        updateHash: commit.updateHash,
        authorPublicKey: commit.author.publicKey,
        timestamp: commit.timestamp,
      };

      const computedId = await computeCommitId(canonicalHeader);
      if (computedId.toLowerCase() !== commit.id.toLowerCase()) {
        return {
          commitId: commit.id,
          verdict: 'ID_MISMATCH',
          isValid: false,
          error: `Commit ID mismatch. Expected ${commit.id}, computed ${computedId}`,
          authorFingerprint: commit.author.fingerprint,
          timestamp: commit.timestamp,
        };
      }

      // 6. Verify Author Fingerprint
      const computedFingerprint = await deriveFingerprint(commit.author.publicKey);
      if (computedFingerprint.toLowerCase() !== commit.author.fingerprint.toLowerCase()) {
        return {
          commitId: commit.id,
          verdict: 'FINGERPRINT_MISMATCH',
          isValid: false,
          error: `Author fingerprint mismatch. Expected ${commit.author.fingerprint}, computed ${computedFingerprint}`,
          authorFingerprint: commit.author.fingerprint,
          timestamp: commit.timestamp,
        };
      }

      // 7. Verify ECDSA P-256 Signature
      const canonicalBytes = new TextEncoder().encode(
        JSON.stringify({
          authorPublicKey: canonicalHeader.authorPublicKey,
          parentIds: canonicalHeader.parentIds,
          timestamp: canonicalHeader.timestamp,
          updateHash: canonicalHeader.updateHash,
          version: 1,
        })
      );

      const isSignatureValid = await verifySignature(
        commit.author.publicKey,
        commit.signature,
        canonicalBytes
      );

      if (!isSignatureValid) {
        return {
          commitId: commit.id,
          verdict: 'SIGNATURE_INVALID',
          isValid: false,
          error: 'ECDSA signature verification failed for author public key',
          authorFingerprint: commit.author.fingerprint,
          timestamp: commit.timestamp,
        };
      }

      return {
        commitId: commit.id,
        verdict: 'VALID',
        isValid: true,
        authorFingerprint: commit.author.fingerprint,
        timestamp: commit.timestamp,
      };
    } catch (err: any) {
      return {
        commitId: commit.id,
        verdict: 'SIGNATURE_INVALID',
        isValid: false,
        error: `Cryptographic verification exception: ${err?.message || err}`,
        authorFingerprint: commit.author.fingerprint,
        timestamp: commit.timestamp,
      };
    }
  }

  /**
   * Performs an end-to-end audit of an exported .hermes.json bundle.
   */
  public static async verifyExportBundle(bundle: HermesExportBundle): Promise<AuditReport> {
    if (!bundle || bundle.format !== 'hermesdocs' || bundle.version !== 1) {
      return {
        verdict: 'UNSUPPORTED_VERSION',
        documentId: bundle?.document?.id || 'unknown',
        documentTitle: bundle?.document?.title || 'unknown',
        totalCommits: 0,
        verifiedCommits: 0,
        failedCommits: 0,
        uniqueAuthors: [],
        heads: [],
        isDAGConnected: false,
        hasCycles: false,
        details: [],
        summary: 'Invalid or unsupported Hermes bundle format',
      };
    }

    const commits = bundle.commits || [];
    const results: CommitVerificationResult[] = [];
    let verifiedCount = 0;
    let failedCount = 0;
    const authorSet = new Set<string>();

    // 1. Cryptographically verify every commit node
    for (const commit of commits) {
      const result = await this.verifyCommit(commit);
      results.push(result);
      if (result.isValid) {
        verifiedCount++;
        if (commit.author?.fingerprint) {
          authorSet.add(commit.author.fingerprint);
        }
      } else {
        failedCount++;
      }
    }

    // 2. Validate DAG Structure
    const dag = new CommitDAG(commits);
    const hasCycles = dag.hasCycles();
    const computedHeads = dag.getHeads();

    // Check parent connectivity
    let isDAGConnected = true;
    for (const commit of commits) {
      for (const pId of commit.parentIds) {
        if (!dag.has(pId)) {
          isDAGConnected = false;
          break;
        }
      }
    }

    let overallVerdict: 'VALID' | 'INVALID' | 'INCOMPLETE' = 'VALID';
    if (failedCount > 0 || hasCycles) {
      overallVerdict = 'INVALID';
    } else if (!isDAGConnected) {
      overallVerdict = 'INCOMPLETE';
    }

    const summary =
      overallVerdict === 'VALID'
        ? `Cryptographically Verified: ${verifiedCount}/${commits.length} commits signed and valid across ${authorSet.size} authors.`
        : overallVerdict === 'INCOMPLETE'
          ? `Incomplete History: Missing parent commits detected in DAG chain.`
          : `Audit Failed: ${failedCount} commit(s) failed cryptographic verification or DAG contains cycles.`;

    return {
      verdict: overallVerdict,
      documentId: bundle.document.id,
      documentTitle: bundle.document.title,
      totalCommits: commits.length,
      verifiedCommits: verifiedCount,
      failedCommits: failedCount,
      uniqueAuthors: Array.from(authorSet),
      heads: computedHeads,
      isDAGConnected,
      hasCycles,
      details: results,
      summary,
    };
  }
}
