import { describe, it } from 'node:test';
import assert from 'node:assert';
import {
  generateIdentity,
  signData,
  verifySignature,
  stringToUint8Array,
  sha256Hex,
} from '../../packages/crypto/src/index.js';

describe('Crypto: Signing & Key Verification', () => {
  it('should generate valid ECDSA P-256 key pair with exportable public SPKI', async () => {
    const identity = await generateIdentity();
    assert.ok(identity.fingerprint.startsWith('hermes:'));
    assert.strictEqual(typeof identity.publicKeyBase64, 'string');
    assert.ok(identity.publicKeyBase64.length > 50);
    assert.ok(identity.privateKey instanceof CryptoKey);
  });

  it('should sign canonical bytes and verify with public key', async () => {
    const identity = await generateIdentity();
    const payload = stringToUint8Array('Hermes Document Canonical Commit Header v1');
    const signature = await signData(identity.privateKey, payload);

    const isValid = await verifySignature(identity.publicKeyBase64, signature, payload);
    assert.strictEqual(isValid, true);
  });

  it('should reject signature when payload data is mutated by 1 byte', async () => {
    const identity = await generateIdentity();
    const payload = stringToUint8Array('Original Payload');
    const signature = await signData(identity.privateKey, payload);

    const mutatedPayload = stringToUint8Array('Mutated Payload');
    const isValid = await verifySignature(identity.publicKeyBase64, signature, mutatedPayload);
    assert.strictEqual(isValid, false);
  });

  it('should reject signature when verified against a different public key', async () => {
    const alice = await generateIdentity();
    const bob = await generateIdentity();

    const payload = stringToUint8Array('Confidential Agreement');
    const aliceSignature = await signData(alice.privateKey, payload);

    const isValid = await verifySignature(bob.publicKeyBase64, aliceSignature, payload);
    assert.strictEqual(isValid, false);
  });
});
