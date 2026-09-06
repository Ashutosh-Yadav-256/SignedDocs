export interface AirGapFrame {
  version: 1;
  sessionId: string; // SHA-256 session prefix
  frameIndex: number; // 0-based
  totalFrames: number;
  payloadChunkBase64: string;
  checksum: string; // 8-char hex checksum
}

export interface AirGapSession {
  sessionId: string;
  totalFrames: number;
  receivedCount: number;
  isComplete: boolean;
  progressPercentage: number;
  missingFrameIndices: number[];
}
