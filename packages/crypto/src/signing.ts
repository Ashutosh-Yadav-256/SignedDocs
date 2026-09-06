import { uint8ArrayToBase64 } from './encoding.js';

const ECDSA_SIGN_PARAMS = {
  name: 'ECDSA',
  hash: { name: 'SHA-256' },
} as const;

/**
 * Signs raw canonical header bytes using an ECDSA P-256 private key.
 * Returns Base64-encoded signature.
 */
export async function signCanonicalHeader(
  privateKey: CryptoKey,
  canonicalHeaderBytes: Uint8Array
): Promise<string> {
  const subtle = globalThis.crypto.subtle;
  const buffer = canonicalHeaderBytes.buffer.slice(
    canonicalHeaderBytes.byteOffset,
    canonicalHeaderBytes.byteOffset + canonicalHeaderBytes.byteLength
  ) as ArrayBuffer;

  const signatureBuffer = await subtle.sign(ECDSA_SIGN_PARAMS, privateKey, buffer);
  return uint8ArrayToBase64(new Uint8Array(signatureBuffer));
}

/**
 * Alias for signing arbitrary canonical bytes with ECDSA P-256 private key.
 */
export const signData = signCanonicalHeader;

