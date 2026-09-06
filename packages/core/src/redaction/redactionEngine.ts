import {
  buildMerkleTree,
  generateMerkleProof,
  sha256Hex,
  signCanonicalHeader,
  stringToUint8Array,
} from '@hermes/crypto';
import {
  BlockType,
  DocumentBlock,
  RedactedBlock,
  RedactedExportBundle,
} from './types.js';

function generateRandomSalt(): string {
  const array = new Uint8Array(16);
  if (typeof globalThis.crypto !== 'undefined' && globalThis.crypto.getRandomValues) {
    globalThis.crypto.getRandomValues(array);
  } else {
    for (let i = 0; i < 16; i++) {
      array[i] = Math.floor(Math.random() * 256);
    }
  }
  return Array.from(array)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

function detectBlockType(content: string): BlockType {
  const trimmed = content.trim();
  if (trimmed.startsWith('#')) return 'heading';
  if (trimmed.startsWith('```')) return 'code';
  if (trimmed.startsWith('>')) return 'quote';
  if (trimmed.startsWith('|')) return 'table';
  if (/^(Section|Clause|Article|\d+\.)/i.test(trimmed)) return 'clause';
  return 'paragraph';
}

export class RedactionEngine {
  /**
   * Parses raw markdown / plain text into structured blocks with unique cryptographic salts.
   */
  public static async parseDocumentBlocks(text: string): Promise<DocumentBlock[]> {
    // Split by double line breaks or single line breaks if Markdown headers/quotes
    const rawBlocks = text
      .split(/\n\s*\n/)
      .map((b) => b.trim())
      .filter((b) => b.length > 0);

    if (rawBlocks.length === 0) {
      rawBlocks.push('');
    }

    const blocks: DocumentBlock[] = [];

    for (let i = 0; i < rawBlocks.length; i++) {
      const content = rawBlocks[i];
      const blockType = detectBlockType(content);
      const salt = generateRandomSalt();
      const leafPayload = `${content}:${salt}`;
      const leafHash = await sha256Hex(stringToUint8Array(leafPayload));

      blocks.push({
        index: i,
        blockType,
        content,
        salt,
        leafHash,
      });
    }

    return blocks;
  }

  /**
   * Produces a cryptographically verifiable Redacted Export Bundle with selective disclosure.
   */
  public static async createRedactedBundle(params: {
    documentId: string;
    documentTitle: string;
    originalCommitId: string;
    text: string;
    identity: {
      fingerprint: string;
      publicKeyBase64: string;
      privateKey: CryptoKey;
    };
    redactedIndices: number[];
    redactionReasons?: Record<number, string>;
    timestamp?: number;
  }): Promise<RedactedExportBundle> {
    const {
      documentId,
      documentTitle,
      originalCommitId,
      text,
      identity,
      redactedIndices,
      redactionReasons = {},
      timestamp = Date.now(),
    } = params;

    const documentBlocks = await this.parseDocumentBlocks(text);
    const leafHashes = documentBlocks.map((b) => b.leafHash);

    // Build Merkle Tree over all original blocks
    const merkleTree = await buildMerkleTree(leafHashes);
    const merkleRoot = merkleTree.root;

    // Construct Canonical Header for Author Signing
    const canonicalObj = {
      authorPublicKey: identity.publicKeyBase64,
      documentId,
      merkleRoot,
      originalCommitId,
      timestamp,
      version: 1 as const,
    };
    const canonicalBytes = stringToUint8Array(JSON.stringify(canonicalObj));
    const signature = await signCanonicalHeader(identity.privateKey, canonicalBytes);

    const redactedSet = new Set(redactedIndices);
    const redactedBlocks: RedactedBlock[] = [];

    for (let i = 0; i < documentBlocks.length; i++) {
      const b = documentBlocks[i];
      const isRedacted = redactedSet.has(i);
      const proof = generateMerkleProof(merkleTree, i);

      if (isRedacted) {
        const reason = redactionReasons[i] || 'Confidential';
        redactedBlocks.push({
          index: i,
          blockType: b.blockType,
          isRedacted: true,
          content: `[REDACTED: ${reason}]`,
          redactionReason: reason,
          leafHash: b.leafHash,
          // CRITICAL: salt is withheld to ensure zero-knowledge privacy
          proof,
        });
      } else {
        redactedBlocks.push({
          index: i,
          blockType: b.blockType,
          isRedacted: false,
          content: b.content,
          leafHash: b.leafHash,
          salt: b.salt, // Salt is revealed for verification
          proof,
        });
      }
    }

    return {
      format: 'hermesdocs-redacted',
      version: 1,
      documentId,
      documentTitle,
      originalCommitId,
      author: {
        fingerprint: identity.fingerprint,
        publicKey: identity.publicKeyBase64,
      },
      timestamp,
      merkleRoot,
      signature,
      blocks: redactedBlocks,
      stats: {
        totalBlocks: documentBlocks.length,
        revealedBlocks: documentBlocks.length - redactedSet.size,
        redactedBlocks: redactedSet.size,
      },
      exportedAt: Date.now(),
    };
  }
}
