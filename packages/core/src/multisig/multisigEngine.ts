import {
  sha256Hex,
  signCanonicalHeader,
  stringToUint8Array,
} from '@hermes/crypto';
import {
  MultisigProposal,
  MultisigSealNode,
  PeerEndorsement,
  QuorumPolicy,
} from './types.js';
import { MultisigVerifier } from './multisigVerifier.js';

export class MultisigEngine {
  /**
   * Deterministically serializes a proposal to canonical JSON bytes.
   */
  public static serializeProposal(proposal: Omit<MultisigProposal, 'proposalId'>): Uint8Array {
    const canonicalObj = {
      documentId: proposal.documentId,
      milestoneName: proposal.milestoneName,
      proposedByPublicKey: proposal.proposedBy.publicKey,
      quorum: {
        eligibleFingerprints: proposal.quorum.eligibleFingerprints ? [...proposal.quorum.eligibleFingerprints].sort() : undefined,
        requiredQuorum: proposal.quorum.requiredQuorum,
        totalEligible: proposal.quorum.totalEligible,
      },
      stateHash: proposal.stateHash,
      timestamp: proposal.timestamp,
      version: 1 as const,
    };
    return stringToUint8Array(JSON.stringify(canonicalObj));
  }

  /**
   * Creates an unsealed MultisigProposal with a deterministic proposal ID.
   */
  public static async createProposal(params: {
    documentId: string;
    documentTitle: string;
    stateHash: string;
    milestoneName: string;
    milestoneDescription?: string;
    quorum: QuorumPolicy;
    identity: {
      fingerprint: string;
      publicKeyBase64: string;
    };
    timestamp?: number;
  }): Promise<MultisigProposal> {
    const timestamp = params.timestamp || Date.now();
    const proposalHeader: Omit<MultisigProposal, 'proposalId'> = {
      documentId: params.documentId,
      documentTitle: params.documentTitle,
      stateHash: params.stateHash,
      milestoneName: params.milestoneName,
      milestoneDescription: params.milestoneDescription,
      quorum: params.quorum,
      proposedBy: {
        fingerprint: params.identity.fingerprint,
        publicKey: params.identity.publicKeyBase64,
      },
      timestamp,
    };

    const canonicalBytes = this.serializeProposal(proposalHeader);
    const proposalId = await sha256Hex(canonicalBytes);

    return {
      proposalId,
      ...proposalHeader,
    };
  }

  /**
   * Signs a proposal endorsement using the peer's ECDSA P-256 private key.
   */
  public static async endorseProposal(
    proposal: MultisigProposal,
    identity: {
      fingerprint: string;
      publicKeyBase64: string;
      privateKey: CryptoKey;
    },
    timestamp: number = Date.now()
  ): Promise<PeerEndorsement> {
    const canonicalBytes = this.serializeProposal(proposal);
    const signature = await signCanonicalHeader(identity.privateKey, canonicalBytes);

    return {
      author: {
        fingerprint: identity.fingerprint,
        publicKey: identity.publicKeyBase64,
      },
      timestamp,
      signature,
    };
  }

  /**
   * Finalizes an M-of-N MultisigSealNode after collecting sufficient peer endorsements.
   */
  public static async createSealNode(
    proposal: MultisigProposal,
    endorsements: PeerEndorsement[]
  ): Promise<MultisigSealNode> {
    const node: MultisigSealNode = {
      version: 1,
      sealId: '',
      proposal,
      endorsements,
      sealedAt: Date.now(),
      status: 'PENDING',
    };

    // Verify quorum validity before sealing
    const verification = await MultisigVerifier.verifyMultisigSeal(node);
    if (!verification.isValid) {
      throw new Error(`Cannot seal milestone: ${verification.verdict} - ${verification.error}`);
    }

    // Deterministic seal ID based on proposal ID + sorted signatures
    const sortedSignatures = endorsements.map((e) => e.signature).sort().join('::');
    const sealPayload = `${proposal.proposalId}::${sortedSignatures}`;
    const sealId = await sha256Hex(stringToUint8Array(sealPayload));

    node.sealId = sealId;
    node.status = 'SEALED';
    return node;
  }
}
