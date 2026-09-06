import { MerkleProof } from '@hermes/crypto';

export type BlockType = 'heading' | 'paragraph' | 'clause' | 'table' | 'quote' | 'code';

export interface DocumentBlock {
  index: number;
  blockType: BlockType;
  content: string;
  salt: string; // 16-byte random hex string
  leafHash: string; // SHA-256(content + ":" + salt)
}

export interface RedactedBlock {
  index: number;
  blockType: BlockType;
  isRedacted: boolean;
  content: string; // Plaintext if not redacted; description/placeholder if redacted
  redactionReason?: string;
  leafHash: string; // The cryptographic leaf hash (present for both revealed & redacted)
  salt?: string; // OMITTED if redacted (zero-knowledge)
  proof: MerkleProof;
}

export interface RedactionStats {
  totalBlocks: number;
  revealedBlocks: number;
  redactedBlocks: number;
}

export interface RedactedExportBundle {
  format: 'hermesdocs-redacted';
  version: 1;
  documentId: string;
  documentTitle: string;
  originalCommitId: string;
  author: {
    fingerprint: string;
    publicKey: string;
  };
  timestamp: number;
  merkleRoot: string;
  signature: string; // ECDSA P-256 over canonical header
  blocks: RedactedBlock[];
  stats: RedactionStats;
  exportedAt: number;
}

export type RedactionVerificationVerdict =
  | 'VALID'
  | 'INVALID_SCHEMA'
  | 'MERKLE_ROOT_MISMATCH'
  | 'PROOF_INVALID'
  | 'LEAF_HASH_MISMATCH'
  | 'SIGNATURE_INVALID'
  | 'FINGERPRINT_MISMATCH';

export interface RedactionVerificationResult {
  isValid: boolean;
  verdict: RedactionVerificationVerdict;
  error?: string;
  documentId: string;
  documentTitle: string;
  authorFingerprint: string;
  totalBlocks: number;
  revealedBlocks: number;
  redactedBlocks: number;
  merkleRoot: string;
  blockVerdicts: {
    index: number;
    isRedacted: boolean;
    isProofValid: boolean;
    isContentValid: boolean;
  }[];
}
