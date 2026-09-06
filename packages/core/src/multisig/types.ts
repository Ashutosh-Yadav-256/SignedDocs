export interface QuorumPolicy {
  requiredQuorum: number; // M (e.g. 2)
  totalEligible: number; // N (e.g. 3)
  eligibleFingerprints?: string[]; // Optional list of allowed author fingerprints
}

export interface MultisigProposal {
  proposalId: string; // SHA-256(canonicalProposalHeader)
  documentId: string;
  documentTitle: string;
  stateHash: string; // SHA-256(current Yjs document state / text)
  milestoneName: string;
  milestoneDescription?: string;
  quorum: QuorumPolicy;
  proposedBy: {
    fingerprint: string;
    publicKey: string;
  };
  timestamp: number;
}

export interface PeerEndorsement {
  author: {
    fingerprint: string;
    publicKey: string;
  };
  timestamp: number;
  signature: string; // ECDSA P-256 over canonical proposal bytes
}

export interface MultisigSealNode {
  version: 1;
  sealId: string;
  proposal: MultisigProposal;
  endorsements: PeerEndorsement[];
  sealedAt: number;
  status: 'PENDING' | 'SEALED' | 'EXPIRED';
}

export type MultisigVerdict =
  | 'SEAL_VALID'
  | 'INVALID_SCHEMA'
  | 'QUORUM_NOT_MET'
  | 'INVALID_ENDORSEMENT'
  | 'UNAUTHORIZED_SIGNER'
  | 'DUPLICATE_SIGNATORY'
  | 'PROPOSAL_ID_MISMATCH'
  | 'FINGERPRINT_MISMATCH';

export interface MultisigVerificationResult {
  isValid: boolean;
  verdict: MultisigVerdict;
  error?: string;
  milestoneName: string;
  stateHash: string;
  validEndorsementsCount: number;
  requiredQuorum: number;
  totalEligible: number;
  signatories: string[];
}
