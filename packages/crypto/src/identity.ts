import { uint8ArrayToBase64, base64ToUint8Array } from './encoding.js';
import { deriveFingerprint } from './fingerprint.js';

export interface HermesIdentity {
  fingerprint: string;
  publicKeyBase64: string; // SPKI format base64
  publicKey: CryptoKey;
  privateKey: CryptoKey;
}

const ECDSA_ALGORITHM = {
  name: 'ECDSA',
  namedCurve: 'P-256',
} as const;

/**
 * Generates a new ECDSA P-256 cryptographic identity.
 * @param extractable Whether the private key can be exported (false by default for maximum security).
 */
export async function generateIdentity(extractable: boolean = false): Promise<HermesIdentity> {
  const subtle = globalThis.crypto.subtle;
  const keyPair = await subtle.generateKey(
    ECDSA_ALGORITHM,
    extractable,
    ['sign', 'verify']
  );

  const spkiBuffer = await subtle.exportKey('spki', keyPair.publicKey);
  const publicKeyBase64 = uint8ArrayToBase64(new Uint8Array(spkiBuffer));
  const fingerprint = await deriveFingerprint(publicKeyBase64);

  return {
    fingerprint,
    publicKeyBase64,
    publicKey: keyPair.publicKey,
    privateKey: keyPair.privateKey,
  };
}

/**
 * Imports an ECDSA P-256 public key from SPKI Base64 encoding.
 */
export async function importPublicKey(spkiBase64: string): Promise<CryptoKey> {
  const subtle = globalThis.crypto.subtle;
  const bytes = base64ToUint8Array(spkiBase64);
  const buffer = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;

  return await subtle.importKey(
    'spki',
    buffer,
    ECDSA_ALGORITHM,
    true,
    ['verify']
  );
}

/**
 * Exports a public CryptoKey to SPKI base64 format.
 */
export async function exportPublicKey(publicKey: CryptoKey): Promise<string> {
  const subtle = globalThis.crypto.subtle;
  const spkiBuffer = await subtle.exportKey('spki', publicKey);
  return uint8ArrayToBase64(new Uint8Array(spkiBuffer));
}
