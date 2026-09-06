import { describe, it } from 'node:test';
import assert from 'node:assert';
import {
  computeCommitId,
  generateIdentity,
  serializeCanonicalHeader,
  sha256Hex,
  signCanonicalHeader,
  uint8ArrayToBase64,
} from '../packages/crypto/src/index.js';
import { HermesExportBundle, HermesVerifier, SignedCommitNode } from '../packages/core/src/index.js';

async function buildMockExportBundle(): Promise<HermesExportBundle> {
  const alice = await generateIdentity(true);
  const bob = await generateIdentity(true);

  // Commit 1: Alice (Genesis)
  const up1 = new Uint8Array([10, 20, 30]);
  const upHash1 = await sha256Hex(up1);
  const h1 = {
    version: 1 as const,
    parentIds: [],
    updateHash: upHash1,
    authorPublicKey: alice.publicKeyBase64,
    timestamp: 1000,
  };
  const id1 = await computeCommitId(h1);
  const sig1 = await signCanonicalHeader(alice.privateKey, serializeCanonicalHeader(h1));
  const c1: SignedCommitNode = {
    version: 1,
    id: id1,
    parentIds: [],
    author: { fingerprint: alice.fingerprint, publicKey: alice.publicKeyBase64 },
    timestamp: 1000,
    updateHash: upHash1,
    updateBinary: uint8ArrayToBase64(up1),
    signature: sig1,
  };

  // Commit 2: Bob (Child of Commit 1)
  const up2 = new Uint8Array([40, 50, 60]);
  const upHash2 = await sha256Hex(up2);
  const h2 = {
    version: 1 as const,
    parentIds: [id1],
    updateHash: upHash2,
    authorPublicKey: bob.publicKeyBase64,
    timestamp: 2000,
  };
  const id2 = await computeCommitId(h2);
  const sig2 = await signCanonicalHeader(bob.privateKey, serializeCanonicalHeader(h2));
  const c2: SignedCommitNode = {
    version: 1,
    id: id2,
    parentIds: [id1],
    author: { fingerprint: bob.fingerprint, publicKey: bob.publicKeyBase64 },
    timestamp: 2000,
    updateHash: upHash2,
    updateBinary: uint8ArrayToBase64(up2),
    signature: sig2,
  };

  return {
    format: 'hermesdocs',
    version: 1,
    document: {
      id: 'doc_test_123',
      title: 'Audit Verification Document',
      createdAt: 1000,
      updatedAt: 2000,
      heads: [id2],
    },
    authors: [
      { fingerprint: alice.fingerprint, publicKey: alice.publicKeyBase64 },
      { fingerprint: bob.fingerprint, publicKey: bob.publicKeyBase64 },
    ],
    commits: [c1, c2],
    heads: [id2],
    stateHash: 'state_hash_123',
    exportedAt: 3000,
  };
}

describe('Hermes Standalone Verifier & Audit Bundle Engine', () => {
  it('should verify a valid multi-author export bundle', async () => {
    const bundle = await buildMockExportBundle();
    const report = await HermesVerifier.verifyExportBundle(bundle);

    assert.strictEqual(report.verdict, 'VALID');
    assert.strictEqual(report.totalCommits, 2);
    assert.strictEqual(report.verifiedCommits, 2);
    assert.strictEqual(report.failedCommits, 0);
    assert.strictEqual(report.uniqueAuthors.length, 2);
    assert.strictEqual(report.isDAGConnected, true);
    assert.strictEqual(report.hasCycles, false);
  });

  it('should report INVALID when a commit in the bundle is corrupted', async () => {
    const bundle = await buildMockExportBundle();
    // Tamper with commit 2
    bundle.commits[1].signature = 'tampered_invalid_signature_base64';

    const report = await HermesVerifier.verifyExportBundle(bundle);
    assert.strictEqual(report.verdict, 'INVALID');
    assert.strictEqual(report.failedCommits, 1);
  });

  it('should report INCOMPLETE when a parent commit is missing from the bundle', async () => {
    const bundle = await buildMockExportBundle();
    // Remove genesis commit 1 from commits list, leaving commit 2 with missing parent
    bundle.commits = [bundle.commits[1]];

    const report = await HermesVerifier.verifyExportBundle(bundle);
    assert.strictEqual(report.verdict, 'INCOMPLETE');
    assert.strictEqual(report.isDAGConnected, false);
  });
});
