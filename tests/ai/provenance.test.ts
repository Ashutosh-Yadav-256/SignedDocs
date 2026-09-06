import { describe, it } from 'node:test';
import assert from 'node:assert';
import {
  AIProvenanceManifest,
  SignedCommitNode,
  HermesVerifier,
} from '../../packages/core/src/index.js';
import {
  generateIdentity,
  sha256Hex,
  stringToUint8Array,
  computeCommitId,
  signData,
  uint8ArrayToBase64,
} from '../../packages/crypto/src/index.js';

describe('AI: Cryptographic Provenance & Approval Chains', () => {
  it('should track AI model metadata, prompt hash, context snapshot hash, and human reviewer approval', async () => {
    const reviewerIdentity = await generateIdentity();

    const promptText = 'Refactor authentication mechanism to use JWT tokens with 1h expiry.';
    const contextSnapshotText = '# System Architecture\nSession-based auth.';
    const aiOutputText = '# System Architecture\nJWT auth with 1h expiry and refresh tokens.';

    const promptHash = await sha256Hex(stringToUint8Array(promptText));
    const contextSnapshotHash = await sha256Hex(stringToUint8Array(contextSnapshotText));
    const outputHash = await sha256Hex(stringToUint8Array(aiOutputText));

    const aiProvenance: AIProvenanceManifest = {
      version: 1,
      modelIdentifier: 'ollama:llama3.2',
      promptHash,
      contextSnapshotHash,
      outputHash,
      generatedAt: 1788691200000,
      approval: {
        reviewerFingerprint: reviewerIdentity.fingerprint,
        approvedAt: 1788691205000,
      },
    };

    assert.strictEqual(aiProvenance.modelIdentifier, 'ollama:llama3.2');
    assert.strictEqual(aiProvenance.approval.reviewerFingerprint, reviewerIdentity.fingerprint);
    assert.ok(aiProvenance.promptHash.length === 64);
    assert.ok(aiProvenance.contextSnapshotHash.length === 64);
    assert.ok(aiProvenance.outputHash.length === 64);
  });

  it('should verify commit containing valid AI provenance manifest', async () => {
    const author = await generateIdentity();
    const updateBinary = uint8ArrayToBase64(stringToUint8Array('Yjs update data'));
    const updateHash = await sha256Hex(stringToUint8Array('Yjs update data'));

    const aiProvenance: AIProvenanceManifest = {
      version: 1,
      modelIdentifier: 'gemini-1.5-flash',
      promptHash: 'hash_prompt',
      contextSnapshotHash: 'hash_context',
      outputHash: 'hash_output',
      generatedAt: 1000,
      approval: {
        reviewerFingerprint: author.fingerprint,
        approvedAt: 1005,
      },
    };

    const header = {
      version: 1 as const,
      parentIds: [],
      updateHash,
      authorPublicKey: author.publicKeyBase64,
      timestamp: 1005,
    };

    const id = await computeCommitId(header);
    const canonicalBytes = stringToUint8Array(JSON.stringify({
      authorPublicKey: header.authorPublicKey,
      parentIds: header.parentIds,
      timestamp: header.timestamp,
      updateHash: header.updateHash,
      version: 1,
    }));

    const signature = await signData(author.privateKey, canonicalBytes);

    const commit: SignedCommitNode = {
      version: 1,
      id,
      parentIds: [],
      author: {
        fingerprint: author.fingerprint,
        publicKey: author.publicKeyBase64,
      },
      timestamp: 1005,
      updateHash,
      updateBinary,
      signature,
      aiProvenance,
    };

    const report = await HermesVerifier.verifyCommit(commit);
    assert.strictEqual(report.isValid, true);
    assert.strictEqual(report.verdict, 'VALID');
  });
});
