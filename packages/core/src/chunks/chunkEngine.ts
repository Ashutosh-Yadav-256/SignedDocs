import {
  HermesIdentity,
  sha256Hex,
  signData,
  stringToUint8Array,
  verifySignature,
} from '@hermes/crypto';
import { ArtifactManifest, ArtifactPiece, BitfieldState } from './types.js';

export const DEFAULT_PIECE_SIZE = 64 * 1024; // 64 KB per chunk

export class ChunkEngine {
  /**
   * Slices binary data into pieces and creates a cryptographically signed ArtifactManifest.
   */
  public static async createManifest(
    data: Uint8Array,
    filename: string,
    mimeType: string,
    identity: HermesIdentity,
    pieceSize: number = DEFAULT_PIECE_SIZE
  ): Promise<{ manifest: ArtifactManifest; pieces: ArtifactPiece[] }> {
    const totalSize = data.length;
    const totalPieces = Math.ceil(totalSize / pieceSize) || 1;
    const pieceHashes: string[] = [];
    const pieces: ArtifactPiece[] = [];

    for (let i = 0; i < totalPieces; i++) {
      const start = i * pieceSize;
      const end = Math.min(start + pieceSize, totalSize);
      const chunk = data.slice(start, end);
      const pieceHash = await sha256Hex(chunk);

      pieceHashes.push(pieceHash);
      pieces.push({
        index: i,
        hash: pieceHash,
        size: chunk.length,
        data: chunk,
      });
    }

    const createdAt = Date.now();
    const manifestHeader = {
      createdAt,
      filename,
      mimeType,
      pieceHashes,
      pieceSize,
      totalPieces,
      totalSize,
      version: 1 as const,
    };

    const headerCanonical = JSON.stringify(manifestHeader);
    const headerBytes = stringToUint8Array(headerCanonical);
    const manifestId = await sha256Hex(headerBytes);

    const signature = await signData(identity.privateKey, headerBytes);

    const manifest: ArtifactManifest = {
      version: 1,
      id: manifestId,
      filename,
      mimeType,
      totalSize,
      pieceSize,
      totalPieces,
      pieceHashes,
      createdAt,
      author: {
        fingerprint: identity.fingerprint,
        publicKey: identity.publicKeyBase64,
      },
      signature,
    };

    return { manifest, pieces };
  }

  /**
   * Verifies the authenticity and signature of an ArtifactManifest.
   */
  public static async verifyManifest(manifest: ArtifactManifest): Promise<boolean> {
    if (!manifest || manifest.version !== 1 || !manifest.signature) {
      return false;
    }

    const manifestHeader = {
      createdAt: manifest.createdAt,
      filename: manifest.filename,
      mimeType: manifest.mimeType,
      pieceHashes: manifest.pieceHashes,
      pieceSize: manifest.pieceSize,
      totalPieces: manifest.totalPieces,
      totalSize: manifest.totalSize,
      version: 1 as const,
    };

    const headerCanonical = JSON.stringify(manifestHeader);
    const headerBytes = stringToUint8Array(headerCanonical);
    const expectedId = await sha256Hex(headerBytes);

    if (expectedId.toLowerCase() !== manifest.id.toLowerCase()) {
      return false;
    }

    return verifySignature(manifest.author.publicKey, manifest.signature, headerBytes);
  }

  /**
   * Verifies an individual piece chunk against its index in the manifest.
   */
  public static async verifyPiece(
    pieceData: Uint8Array,
    pieceIndex: number,
    manifest: ArtifactManifest
  ): Promise<boolean> {
    if (pieceIndex < 0 || pieceIndex >= manifest.totalPieces) {
      return false;
    }

    const expectedHash = manifest.pieceHashes[pieceIndex];
    if (!expectedHash) return false;

    const actualHash = await sha256Hex(pieceData);
    return actualHash.toLowerCase() === expectedHash.toLowerCase();
  }

  /**
   * Reconstructs the complete binary artifact from verified chunks.
   */
  public static async reconstructArtifact(
    pieces: Map<number, Uint8Array>,
    manifest: ArtifactManifest
  ): Promise<Uint8Array | null> {
    if (pieces.size !== manifest.totalPieces) {
      return null;
    }

    const combined = new Uint8Array(manifest.totalSize);
    let offset = 0;

    for (let i = 0; i < manifest.totalPieces; i++) {
      const pieceData = pieces.get(i);
      if (!pieceData) return null;

      const isValid = await this.verifyPiece(pieceData, i, manifest);
      if (!isValid) return null;

      combined.set(pieceData, offset);
      offset += pieceData.length;
    }

    return combined;
  }

  /**
   * Creates a bitfield state tracker.
   */
  public static createBitfield(totalPieces: number): BitfieldState {
    return {
      totalPieces,
      havePieces: new Set(),
      isComplete: false,
    };
  }

  /**
   * Updates bitfield with a newly received piece.
   */
  public static updateBitfield(bitfield: BitfieldState, pieceIndex: number): BitfieldState {
    bitfield.havePieces.add(pieceIndex);
    bitfield.isComplete = bitfield.havePieces.size === bitfield.totalPieces;
    return bitfield;
  }
}
