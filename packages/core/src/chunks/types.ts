export interface ArtifactPiece {
  index: number;
  hash: string; // SHA-256 of this chunk piece
  size: number;
  data?: Uint8Array;
}

export interface ArtifactManifest {
  version: 1;
  id: string; // Root SHA-256 hash
  filename: string;
  mimeType: string;
  totalSize: number;
  pieceSize: number; // e.g. 65536 (64KB)
  totalPieces: number;
  pieceHashes: string[];
  createdAt: number;
  author: {
    fingerprint: string;
    publicKey: string;
  };
  signature: string; // ECDSA P-256 signature over canonical manifest
}

export interface BitfieldState {
  totalPieces: number;
  havePieces: Set<number>;
  isComplete: boolean;
}
