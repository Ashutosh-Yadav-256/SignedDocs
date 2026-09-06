import { sha256Hex, stringToUint8Array, uint8ArrayToBase64 } from '@hermes/crypto';
import { AirGapFrame } from './types.js';

export class AirGapFountain {
  public static readonly DEFAULT_CHUNK_SIZE = 300; // Optimal for standard 33x33 / 37x37 QR codes

  /**
   * Slices arbitrary string payload into sequenced AirGapFrames for animated QR transmission.
   */
  public static async createFrames(
    payload: string,
    chunkSize: number = AirGapFountain.DEFAULT_CHUNK_SIZE
  ): Promise<{ sessionId: string; frames: AirGapFrame[]; rawFrameStrings: string[] }> {
    const payloadBytes = stringToUint8Array(payload);
    const payloadBase64 = uint8ArrayToBase64(payloadBytes);
    const fullHash = await sha256Hex(payloadBytes);
    const sessionId = fullHash.slice(0, 8);

    const chunks: string[] = [];
    for (let i = 0; i < payloadBase64.length; i += chunkSize) {
      chunks.push(payloadBase64.slice(i, i + chunkSize));
    }

    const totalFrames = chunks.length > 0 ? chunks.length : 1;
    const frames: AirGapFrame[] = [];
    const rawFrameStrings: string[] = [];

    for (let index = 0; index < totalFrames; index++) {
      const chunk = chunks[index] || '';
      const chunkHash = await sha256Hex(stringToUint8Array(chunk));
      const checksum = chunkHash.slice(0, 8);

      const frame: AirGapFrame = {
        version: 1,
        sessionId,
        frameIndex: index,
        totalFrames,
        payloadChunkBase64: chunk,
        checksum,
      };

      // Compact wire format: "HAG1:sessionId:index:total:checksum:payload"
      const rawString = `HAG1:${sessionId}:${index}:${totalFrames}:${checksum}:${chunk}`;

      frames.push(frame);
      rawFrameStrings.push(rawString);
    }

    return {
      sessionId,
      frames,
      rawFrameStrings,
    };
  }

  /**
   * Parses a scanned raw QR string into an AirGapFrame.
   */
  public static async parseRawFrame(rawString: string): Promise<AirGapFrame | null> {
    if (!rawString.startsWith('HAG1:')) return null;

    const parts = rawString.split(':');
    if (parts.length < 6) return null;

    const [, sessionId, indexStr, totalStr, checksum, ...chunkParts] = parts;
    const frameIndex = parseInt(indexStr, 10);
    const totalFrames = parseInt(totalStr, 10);
    const payloadChunkBase64 = chunkParts.join(':'); // In case payload contains colons

    if (isNaN(frameIndex) || isNaN(totalFrames) || !sessionId || !checksum) {
      return null;
    }

    // Verify chunk checksum
    const computedHash = await sha256Hex(stringToUint8Array(payloadChunkBase64));
    if (computedHash.slice(0, 8).toLowerCase() !== checksum.toLowerCase()) {
      return null;
    }

    return {
      version: 1,
      sessionId,
      frameIndex,
      totalFrames,
      payloadChunkBase64,
      checksum,
    };
  }
}
