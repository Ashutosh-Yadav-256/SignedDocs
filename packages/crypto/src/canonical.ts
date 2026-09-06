import { stringToUint8Array } from './encoding.js';
import { sha256Hex } from './hashing.js';

export interface CanonicalCommitHeader {
  version: 1;
  parentIds: string[];
  updateHash: string;
  authorPublicKey: string;
  timestamp: number;
}

/**
 * Deterministically serializes a commit header to canonical JSON bytes (RFC 8785 JSON Canonicalization Scheme).
 * Keys are strictly sorted, whitespace removed, numbers serialized canonically.
 */
export function serializeCanonicalHeader(header: CanonicalCommitHeader): Uint8Array {
  // Ensure parentIds is a clean array (parent order matters causally or sorted; we preserve exact parent array)
  const canonicalObj = {
    authorPublicKey: header.authorPublicKey,
    parentIds: header.parentIds,
    timestamp: header.timestamp,
    updateHash: header.updateHash,
    version: 1 as const,
  };

  const jsonString = JSON.stringify(canonicalObj);
  return stringToUint8Array(jsonString);
}

/**
 * Reconstructs canonical commit ID from header fields: SHA-256(canonicalHeaderBytes)
 */
export async function computeCommitId(header: CanonicalCommitHeader): Promise<string> {
  const headerBytes = serializeCanonicalHeader(header);
  return sha256Hex(headerBytes);
}
