import { base64ToUint8Array, uint8ArrayToString } from '@hermes/crypto';
import { AirGapFountain } from './airgapFountain.js';
import { AirGapFrame, AirGapSession } from './types.js';

export class AirGapReceiver {
  private sessionId: string | null = null;
  private totalFrames: number = 0;
  private receivedFrames: Map<number, AirGapFrame> = new Map();

  public reset(): void {
    this.sessionId = null;
    this.totalFrames = 0;
    this.receivedFrames.clear();
  }

  public getSession(): AirGapSession {
    const receivedCount = this.receivedFrames.size;
    const isComplete = this.totalFrames > 0 && receivedCount === this.totalFrames;
    const progressPercentage = this.totalFrames > 0 ? Math.round((receivedCount / this.totalFrames) * 100) : 0;

    const missing: number[] = [];
    if (this.totalFrames > 0) {
      for (let i = 0; i < this.totalFrames; i++) {
        if (!this.receivedFrames.has(i)) {
          missing.push(i);
        }
      }
    }

    return {
      sessionId: this.sessionId || '',
      totalFrames: this.totalFrames,
      receivedCount,
      isComplete,
      progressPercentage,
      missingFrameIndices: missing,
    };
  }

  /**
   * Ingests a raw scanned QR frame string.
   */
  public async ingestRawString(
    rawString: string
  ): Promise<{ isNewFrame: boolean; isComplete: boolean; session: AirGapSession; payload?: string }> {
    const frame = await AirGapFountain.parseRawFrame(rawString);
    if (!frame) {
      return {
        isNewFrame: false,
        isComplete: false,
        session: this.getSession(),
      };
    }
    return this.ingestFrame(frame);
  }

  /**
   * Ingests an AirGapFrame object and checks for completion.
   */
  public ingestFrame(
    frame: AirGapFrame
  ): { isNewFrame: boolean; isComplete: boolean; session: AirGapSession; payload?: string } {
    // If new session detected, reset receiver
    if (this.sessionId !== frame.sessionId) {
      this.reset();
      this.sessionId = frame.sessionId;
      this.totalFrames = frame.totalFrames;
    }

    const isNew = !this.receivedFrames.has(frame.frameIndex);
    if (isNew) {
      this.receivedFrames.set(frame.frameIndex, frame);
    }

    const session = this.getSession();

    if (session.isComplete) {
      const sortedChunks: string[] = [];
      for (let i = 0; i < this.totalFrames; i++) {
        const f = this.receivedFrames.get(i);
        if (!f) throw new Error(`Missing frame index ${i} despite completion`);
        sortedChunks.push(f.payloadChunkBase64);
      }

      const combinedBase64 = sortedChunks.join('');
      const binary = base64ToUint8Array(combinedBase64);
      const payload = uint8ArrayToString(binary);

      return {
        isNewFrame: isNew,
        isComplete: true,
        session,
        payload,
      };
    }

    return {
      isNewFrame: isNew,
      isComplete: false,
      session,
    };
  }
}
