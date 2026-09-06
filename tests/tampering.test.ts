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
import { HermesVerifier, SignedCommitNode } from '../packages/core/src/index.js';

async function generateValidSignedCommit(): Promise<SignedCommitNode> {
  const identity = await generateIdentity(true);
  const fakeUpdate = new Uint8Array([1, 2, 3, 4, 5, 42]);
  const updateBinary = uint8ArrayToBase64(fakeUpdate);
  const updateHash = await sha256Hex(fakeUpdate);
  const parentIds = ['root_genesis'];
  const timestamp = 1741219200000;

  const canonicalHeader = {
    version: 1 as const,
    parentIds,
    updateHash,
    authorPublicKey: identity.publicKeyBase64,
    timestamp,
  };

  const commitId = await computeCommitId(canonicalHeader);
  const canonicalBytes = serializeCanonicalHeader(canonicalHeader);
  const signature = await signCanonicalHeader(identity.privateKey, canonicalBytes);

  return {
    version: 1,
    id: commitId,
    parentIds,
    author: {
      fingerprint: identity.fingerprint,
      publicKey: identity.publicKeyBase64,
    },
    timestamp,
    updateHash,
    updateBinary,
    signature,
  };
}

describe('Hermes Cryptographic Tampering & Security Defense', () => {
  it('should accept untouched, validly signed commit', async () => {
    const commit = await generateValidSignedCommit();
    const result = await HermesVerifier.verifyCommit(commit);
    assert.strictEqual(result.isValid, true);
    assert.strictEqual(result.verdict, 'VALID');
  });

  it('should reject commit if updateBinary is tampered with (1 bit modification)', async () => {
    const commit = await generateValidSignedCommit();
    // Tamper with update binary content
    const tamperedBytes = new Uint8Array([1, 2, 3, 4, 5, 99]); // changed 42 -> 99
    commit.updateBinary = uint8ArrayToBase64(tamperedBytes);

    const result = await HermesVerifier.verifyCommit(commit);
    assert.strictEqual(result.isValid, false);
    assert.strictEqual(result.verdict, 'HASH_MISMATCH');
  });

  it('should reject commit if timestamp is modified after signing', async () => {
    const commit = await generateValidSignedCommit();
    // Modify timestamp
    commit.timestamp = commit.timestamp + 5000;

    const result = await HermesVerifier.verifyCommit(commit);
    assert.strictEqual(result.isValid, false);
    assert.strictEqual(result.verdict, 'ID_MISMATCH');
  });

  it('should reject commit if parentIds are modified', async () => {
    const commit = await generateValidSignedCommit();
    commit.parentIds = ['malicious_parent_branch'];

    const result = await HermesVerifier.verifyCommit(commit);
    assert.strictEqual(result.isValid, false);
    assert.strictEqual(result.verdict, 'ID_MISMATCH');
  });

  it('should reject commit if author public key is swapped (impersonation attack)', async () => {
    const commit = await generateValidSignedCommit();
    const attackerIdentity = await generateIdentity(true);
    commit.author.publicKey = attackerIdentity.publicKeyBase64;

    const result = await HermesVerifier.verifyCommit(commit);
    assert.strictEqual(result.isValid, false);
    assert.strictEqual(result.verdict, 'ID_MISMATCH');
  });

  it('should reject commit if fingerprint does not match public key', async () => {
    const commit = await generateValidSignedCommit();
    commit.author.fingerprint = 'hermes:fakefingerprint123';

    const result = await HermesVerifier.verifyCommit(commit);
    assert.strictEqual(result.isValid, false);
    assert.strictEqual(result.verdict, 'FINGERPRINT_MISMATCH');
  });
});
