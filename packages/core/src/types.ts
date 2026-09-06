/**
 * HermesDocs Core Types
 */

export interface HermesAuthor {
  fingerprint: string;
  publicKey: string; // SPKI base64
  displayName?: string;
}

export interface SignedCommitNode {
  version: 1;
  id: string; // SHA-256(canonicalHeader)
  parentIds: string[]; // Merkle DAG parents (allows concurrent branches)
  author: {
    fingerprint: string;
    publicKey: string;
  };
  timestamp: number;
  updateHash: string; // SHA-256(updateBinary)
  updateBinary: string; // Base64-encoded Yjs incremental update
  signature: string; // ECDSA P-256 signature
}

export interface HermesDocument {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  heads: string[];
}

export interface HermesExportBundle {
  format: 'hermesdocs';
  version: 1;
  document: HermesDocument;
  authors: HermesAuthor[];
  commits: SignedCommitNode[];
  heads: string[];
  stateHash: string;
  exportedAt: number;
}

export type CommitVerificationVerdict =
  | 'VALID'
  | 'INVALID_SCHEMA'
  | 'HASH_MISMATCH'
  | 'ID_MISMATCH'
  | 'SIGNATURE_INVALID'
  | 'FINGERPRINT_MISMATCH'
  | 'MISSING_PARENTS';

export interface CommitVerificationResult {
  commitId: string;
  verdict: CommitVerificationVerdict;
  isValid: boolean;
  error?: string;
  authorFingerprint?: string;
  timestamp?: number;
}

export type AuditVerdict = 'VALID' | 'INVALID' | 'INCOMPLETE' | 'UNSUPPORTED_VERSION';

export interface AuditReport {
  verdict: AuditVerdict;
  documentId: string;
  documentTitle: string;
  totalCommits: number;
  verifiedCommits: number;
  failedCommits: number;
  uniqueAuthors: string[];
  heads: string[];
  isDAGConnected: boolean;
  hasCycles: boolean;
  details: CommitVerificationResult[];
  summary: string;
}
