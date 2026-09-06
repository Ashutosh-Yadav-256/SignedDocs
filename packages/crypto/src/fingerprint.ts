import { base64ToUint8Array } from './encoding.js';
import { sha256Hex } from './hashing.js';

/**
 * Derives a human-readable, deterministic short fingerprint from an ECDSA public key (SPKI base64).
 * Format: "hermes:<16-char hex prefix>"
 */
export async function deriveFingerprint(publicKeySpkiBase64: string): Promise<string> {
  const bytes = base64ToUint8Array(publicKeySpkiBase64);
  const hashHex = await sha256Hex(bytes);
  return `hermes:${hashHex.slice(0, 16)}`;
}
