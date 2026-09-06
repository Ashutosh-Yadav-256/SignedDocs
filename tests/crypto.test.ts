import { describe, it } from 'node:test';
import assert from 'node:assert';
import {
  generateIdentity,
  importPublicKey,
  deriveFingerprint,
  sha256Hex,
  serializeCanonicalHeader,
  computeCommitId,
  signCanonicalHeader,
  verifySignature,
  uint8ArrayToBase64,
  base64ToUint8Array,
} from '../packages/crypto/src/index.js';

describe('Hermes Cryptographic Primitives', () => {
  it('should compute deterministic SHA-256 hashes', async () => {
    const input = 'HermesDocs cryptographic history test';
    const hash1 = await sha256Hex(input);
    const hash2 = await sha256Hex(input);
    assert.strictEqual(hash1, hash2);
    assert.strictEqual(hash1.length, 64);
  });

  it('should generate valid ECDSA P-256 identity with SPKI public key', async () => {
    const identity = await generateIdentity(true);
    assert.ok(identity.publicKey);
    assert.ok(identity.privateKey);
    assert.ok(identity.publicKeyBase64.length > 50);
    assert.ok(identity.fingerprint.startsWith('hermes:'));

    // Re-import public key
    const importedKey = await importPublicKey(identity.publicKeyBase64);
    assert.ok(importedKey);
  });

  it('should derive deterministic author fingerprints', async () => {
    const identity = await generateIdentity(true);
    const fp1 = await deriveFingerprint(identity.publicKeyBase64);
    const fp2 = await deriveFingerprint(identity.publicKeyBase64);
    assert.strictEqual(fp1, fp2);
    assert.strictEqual(identity.fingerprint, fp1);
  });

  it('should sign canonical headers and verify ECDSA signatures', async () => {
    const identity = await generateIdentity(true);

    const canonicalHeader = {
      version: 1 as const,
      parentIds: ['parent_genesis_001'],
      updateHash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
      authorPublicKey: identity.publicKeyBase64,
      timestamp: 1741219200000,
    };

    const headerBytes = serializeCanonicalHeader(canonicalHeader);
    const commitId = await computeCommitId(canonicalHeader);
    assert.strictEqual(commitId.length, 64);

    const signature = await signCanonicalHeader(identity.privateKey, headerBytes);
    assert.ok(signature.length > 30);

    const isValid = await verifySignature(identity.publicKey, signature, headerBytes);
    assert.strictEqual(isValid, true);
  });

  it('should correctly encode and decode Base64 data', () => {
    const testBytes = new Uint8Array([0, 15, 255, 128, 64, 32]);
    const b64 = uint8ArrayToBase64(testBytes);
    const decoded = base64ToUint8Array(b64);
    assert.deepStrictEqual(decoded, testBytes);
  });
});
