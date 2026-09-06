import {
  deriveFingerprint,
  sha256Hex,
  stringToUint8Array,
  verifySignature,
} from '@hermes/crypto';
import {
  MultisigProposal,
  MultisigSealNode,
  MultisigVerificationResult,
} from './types.js';

export class MultisigVerifier {
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
   * Cryptographically verifies an M-of-N Multisig milestone seal.
   */
  public static async verifyMultisigSeal(
    seal: MultisigSealNode
  ): Promise<MultisigVerificationResult> {
    if (!seal || !seal.proposal || !seal.endorsements || !seal.proposal.quorum) {
      return {
        isValid: false,
        verdict: 'INVALID_SCHEMA',
        error: 'Invalid Multisig seal structure',
        milestoneName: seal?.proposal?.milestoneName || 'unknown',
        stateHash: seal?.proposal?.stateHash || 'unknown',
        validEndorsementsCount: 0,
        requiredQuorum: 0,
        totalEligible: 0,
        signatories: [],
      };
    }

    const { proposal, endorsements } = seal;
    const { quorum } = proposal;

    // 1. Verify Proposal ID Integrity
    const canonicalBytes = this.serializeProposal(proposal);
    const computedProposalId = await sha256Hex(canonicalBytes);
    if (computedProposalId.toLowerCase() !== proposal.proposalId.toLowerCase()) {
      return {
        isValid: false,
        verdict: 'PROPOSAL_ID_MISMATCH',
        error: `Proposal ID mismatch. Expected ${proposal.proposalId}, computed ${computedProposalId}`,
        milestoneName: proposal.milestoneName,
        stateHash: proposal.stateHash,
        validEndorsementsCount: 0,
        requiredQuorum: quorum.requiredQuorum,
        totalEligible: quorum.totalEligible,
        signatories: [],
      };
    }

    // 2. Track Unique Endorsers (Prevent duplicate signing attacks)
    const seenFingerprints = new Set<string>();
    const validSignatories: string[] = [];
    const eligibleSet = quorum.eligibleFingerprints ? new Set(quorum.eligibleFingerprints) : null;

    for (const endorsement of endorsements) {
      const { author, signature } = endorsement;

      // Check duplicate
      if (seenFingerprints.has(author.fingerprint)) {
        return {
          isValid: false,
          verdict: 'DUPLICATE_SIGNATORY',
          error: `Signatory ${author.fingerprint} submitted duplicate endorsement`,
          milestoneName: proposal.milestoneName,
          stateHash: proposal.stateHash,
          validEndorsementsCount: validSignatories.length,
          requiredQuorum: quorum.requiredQuorum,
          totalEligible: quorum.totalEligible,
          signatories: validSignatories,
        };
      }

      // Check Author Fingerprint
      const computedFingerprint = await deriveFingerprint(author.publicKey);
      if (computedFingerprint.toLowerCase() !== author.fingerprint.toLowerCase()) {
        return {
          isValid: false,
          verdict: 'FINGERPRINT_MISMATCH',
          error: `Endorser fingerprint mismatch for ${author.fingerprint}`,
          milestoneName: proposal.milestoneName,
          stateHash: proposal.stateHash,
          validEndorsementsCount: validSignatories.length,
          requiredQuorum: quorum.requiredQuorum,
          totalEligible: quorum.totalEligible,
          signatories: validSignatories,
        };
      }

      // Check Eligibility if whitelist exists
      if (eligibleSet && !eligibleSet.has(author.fingerprint)) {
        return {
          isValid: false,
          verdict: 'UNAUTHORIZED_SIGNER',
          error: `Signatory ${author.fingerprint} is not authorized by the quorum policy`,
          milestoneName: proposal.milestoneName,
          stateHash: proposal.stateHash,
          validEndorsementsCount: validSignatories.length,
          requiredQuorum: quorum.requiredQuorum,
          totalEligible: quorum.totalEligible,
          signatories: validSignatories,
        };
      }

      // Verify ECDSA Signature over Proposal
      const isSignatureValid = await verifySignature(
        author.publicKey,
        signature,
        canonicalBytes
      );

      if (!isSignatureValid) {
        return {
          isValid: false,
          verdict: 'INVALID_ENDORSEMENT',
          error: `Invalid cryptographic signature from endorser ${author.fingerprint}`,
          milestoneName: proposal.milestoneName,
          stateHash: proposal.stateHash,
          validEndorsementsCount: validSignatories.length,
          requiredQuorum: quorum.requiredQuorum,
          totalEligible: quorum.totalEligible,
          signatories: validSignatories,
        };
      }

      seenFingerprints.add(author.fingerprint);
      validSignatories.push(author.fingerprint);
    }

    // 3. Verify Quorum Threshold
    if (validSignatories.length < quorum.requiredQuorum) {
      return {
        isValid: false,
        verdict: 'QUORUM_NOT_MET',
        error: `Quorum not met: required ${quorum.requiredQuorum}, received ${validSignatories.length}`,
        milestoneName: proposal.milestoneName,
        stateHash: proposal.stateHash,
        validEndorsementsCount: validSignatories.length,
        requiredQuorum: quorum.requiredQuorum,
        totalEligible: quorum.totalEligible,
        signatories: validSignatories,
      };
    }

    return {
      isValid: true,
      verdict: 'SEAL_VALID',
      milestoneName: proposal.milestoneName,
      stateHash: proposal.stateHash,
      validEndorsementsCount: validSignatories.length,
      requiredQuorum: quorum.requiredQuorum,
      totalEligible: quorum.totalEligible,
      signatories: validSignatories,
    };
  }
}
