import {
  deriveFingerprint,
  sha256Hex,
  stringToUint8Array,
  verifyMerkleProof,
  verifySignature,
} from '@hermes/crypto';
import {
  RedactedExportBundle,
  RedactionVerificationResult,
} from './types.js';

export class RedactionVerifier {
  /**
   * Cryptographically audits a RedactedExportBundle.
   * Proves:
   * 1. Author signed the exact Merkle Root.
   * 2. Unredacted blocks match their original content and salts bit-for-bit.
   * 3. Redacted blocks belong to the signed tree at their specified positions without revealing contents.
   */
  public static async verifyRedactedBundle(
    bundle: RedactedExportBundle
  ): Promise<RedactionVerificationResult> {
    if (!bundle || bundle.format !== 'hermesdocs-redacted' || bundle.version !== 1) {
      return {
        isValid: false,
        verdict: 'INVALID_SCHEMA',
        error: 'Invalid or unsupported redacted bundle format',
        documentId: bundle?.documentId || 'unknown',
        documentTitle: bundle?.documentTitle || 'unknown',
        authorFingerprint: bundle?.author?.fingerprint || 'unknown',
        totalBlocks: 0,
        revealedBlocks: 0,
        redactedBlocks: 0,
        merkleRoot: '',
        blockVerdicts: [],
      };
    }

    // 1. Verify Author Fingerprint
    const computedFingerprint = await deriveFingerprint(bundle.author.publicKey);
    if (computedFingerprint.toLowerCase() !== bundle.author.fingerprint.toLowerCase()) {
      return {
        isValid: false,
        verdict: 'FINGERPRINT_MISMATCH',
        error: `Author fingerprint mismatch. Expected ${bundle.author.fingerprint}, computed ${computedFingerprint}`,
        documentId: bundle.documentId,
        documentTitle: bundle.documentTitle,
        authorFingerprint: bundle.author.fingerprint,
        totalBlocks: bundle.blocks.length,
        revealedBlocks: bundle.stats.revealedBlocks,
        redactedBlocks: bundle.stats.redactedBlocks,
        merkleRoot: bundle.merkleRoot,
        blockVerdicts: [],
      };
    }

    // 2. Verify ECDSA Signature over Canonical Header
    const canonicalObj = {
      authorPublicKey: bundle.author.publicKey,
      documentId: bundle.documentId,
      merkleRoot: bundle.merkleRoot,
      originalCommitId: bundle.originalCommitId,
      timestamp: bundle.timestamp,
      version: 1 as const,
    };
    const canonicalBytes = stringToUint8Array(JSON.stringify(canonicalObj));
    const isSignatureValid = await verifySignature(
      bundle.author.publicKey,
      bundle.signature,
      canonicalBytes
    );

    if (!isSignatureValid) {
      return {
        isValid: false,
        verdict: 'SIGNATURE_INVALID',
        error: 'Author signature is invalid for the specified Merkle Root and header',
        documentId: bundle.documentId,
        documentTitle: bundle.documentTitle,
        authorFingerprint: bundle.author.fingerprint,
        totalBlocks: bundle.blocks.length,
        revealedBlocks: bundle.stats.revealedBlocks,
        redactedBlocks: bundle.stats.redactedBlocks,
        merkleRoot: bundle.merkleRoot,
        blockVerdicts: [],
      };
    }

    // 3. Verify Every Block's Content & Merkle Proof
    const blockVerdicts = [];
    let allProofsValid = true;
    let allContentValid = true;

    for (const block of bundle.blocks) {
      let isContentValid = true;

      if (!block.isRedacted) {
        if (!block.salt) {
          isContentValid = false;
        } else {
          const payload = `${block.content}:${block.salt}`;
          const computedHash = await sha256Hex(stringToUint8Array(payload));
          if (computedHash.toLowerCase() !== block.leafHash.toLowerCase()) {
            isContentValid = false;
          }
        }
      }

      const isProofValid = await verifyMerkleProof(
        bundle.merkleRoot,
        block.leafHash,
        block.proof
      );

      if (!isContentValid) allContentValid = false;
      if (!isProofValid) allProofsValid = false;

      blockVerdicts.push({
        index: block.index,
        isRedacted: block.isRedacted,
        isProofValid,
        isContentValid,
      });
    }

    if (!allContentValid) {
      return {
        isValid: false,
        verdict: 'LEAF_HASH_MISMATCH',
        error: 'One or more unredacted blocks do not match their cryptographic leaf hashes',
        documentId: bundle.documentId,
        documentTitle: bundle.documentTitle,
        authorFingerprint: bundle.author.fingerprint,
        totalBlocks: bundle.blocks.length,
        revealedBlocks: bundle.stats.revealedBlocks,
        redactedBlocks: bundle.stats.redactedBlocks,
        merkleRoot: bundle.merkleRoot,
        blockVerdicts,
      };
    }

    if (!allProofsValid) {
      return {
        isValid: false,
        verdict: 'PROOF_INVALID',
        error: 'One or more block Merkle inclusion proofs failed validation against root',
        documentId: bundle.documentId,
        documentTitle: bundle.documentTitle,
        authorFingerprint: bundle.author.fingerprint,
        totalBlocks: bundle.blocks.length,
        revealedBlocks: bundle.stats.revealedBlocks,
        redactedBlocks: bundle.stats.redactedBlocks,
        merkleRoot: bundle.merkleRoot,
        blockVerdicts,
      };
    }

    return {
      isValid: true,
      verdict: 'VALID',
      documentId: bundle.documentId,
      documentTitle: bundle.documentTitle,
      authorFingerprint: bundle.author.fingerprint,
      totalBlocks: bundle.blocks.length,
      revealedBlocks: bundle.stats.revealedBlocks,
      redactedBlocks: bundle.stats.redactedBlocks,
      merkleRoot: bundle.merkleRoot,
      blockVerdicts,
    };
  }
}
