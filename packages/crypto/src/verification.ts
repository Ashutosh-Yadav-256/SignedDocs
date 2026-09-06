import { base64ToUint8Array } from './encoding.js';
import { sha256Hex } from './hashing.js';
import { CanonicalCommitHeader, computeCommitId } from './canonical.js';
import { deriveFingerprint } from './fingerprint.js';
import { importPublicKey } from './identity.js';

const ECDSA_VERIFY_PARAMS = {
  name: 'ECDSA',
  hash: { name: 'SHA-256' },
} as const;

/**
 * Verifies an ECDSA P-256 signature against canonical header bytes.
 */
export async function verifySignature(
  publicKey: CryptoKey | string,
  signatureBase64: string,
  canonicalHeaderBytes: Uint8Array
): Promise<boolean> {
  try {
    const subtle = globalThis.crypto.subtle;
    const cryptoKey: CryptoKey =
      typeof publicKey === 'string' ? await importPublicKey(publicKey) : publicKey;

    const sigBytes = base64ToUint8Array(signatureBase64);
    const sigBuffer = sigBytes.buffer.slice(
      sigBytes.byteOffset,
      sigBytes.byteOffset + sigBytes.byteLength
    ) as ArrayBuffer;

    const dataBuffer = canonicalHeaderBytes.buffer.slice(
      canonicalHeaderBytes.byteOffset,
      canonicalHeaderBytes.byteOffset + canonicalHeaderBytes.byteLength
    ) as ArrayBuffer;

    return await subtle.verify(ECDSA_VERIFY_PARAMS, cryptoKey, sigBuffer, dataBuffer);
  } catch {
    return false;
  }
}

/**
 * Verifies that the SHA-256 hash of the decoded update binary matches the commit's updateHash.
 */
export async function verifyUpdateHash(
  updateBinaryBase64: string,
  expectedHash: string
): Promise<boolean> {
  try {
    const updateBytes = base64ToUint8Array(updateBinaryBase64);
    const actualHash = await sha256Hex(updateBytes);
    return actualHash.toLowerCase() === expectedHash.toLowerCase();
  } catch {
    return false;
  }
}

/**
 * Verifies that the recomputed Commit ID matches the expected Commit ID.
 */
export async function verifyCommitId(
  header: CanonicalCommitHeader,
  expectedId: string
): Promise<boolean> {
  try {
    const actualId = await computeCommitId(header);
    return actualId.toLowerCase() === expectedId.toLowerCase();
  } catch {
    return false;
  }
}

/**
 * Verifies that the author's short fingerprint matches SHA-256(publicKey).
 */
export async function verifyAuthorFingerprint(
  publicKeySpkiBase64: string,
  expectedFingerprint: string
): Promise<boolean> {
  try {
    const actualFingerprint = await deriveFingerprint(publicKeySpkiBase64);
    return actualFingerprint.toLowerCase() === expectedFingerprint.toLowerCase();
  } catch {
    return false;
  }
}
