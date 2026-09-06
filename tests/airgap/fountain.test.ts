import { describe, it } from 'node:test';
import assert from 'node:assert';
import {
  AirGapFountain,
  AirGapReceiver,
} from '../../packages/core/src/index.js';

describe('OpticalAirGap: Air-Gapped Optical Fountain Frames & QR Synchronization', () => {
  const sampleCommitPayload = JSON.stringify({
    version: 1,
    id: 'commit_airgap_root_7788',
    documentId: 'doc_airgap_scif_01',
    author: {
      fingerprint: 'hermes:classified_officer_42',
      publicKey: 'MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA0...',
    },
    deltaUpdates: [
      'Operation: Insert paragraph #1 (Tactical Coordinates: 34.0522 N, 118.2437 W)',
      'Operation: Approve encrypted communication frequency 433.92 MHz',
      'Operation: Authorize secure hash rotation on 24-hour cycle',
    ],
    timestamp: 1788700000000,
  });

  it('should slice large document payload into sequenced checksummed frames', async () => {
    const { sessionId, frames, rawFrameStrings } = await AirGapFountain.createFrames(
      sampleCommitPayload,
      100 // 100-byte small chunk size for multi-frame testing
    );

    assert.ok(sessionId.length > 0);
    assert.ok(frames.length > 3);
    assert.strictEqual(frames.length, rawFrameStrings.length);

    // Verify first frame wire format
    const firstRaw = rawFrameStrings[0];
    assert.ok(firstRaw.startsWith('HAG1:'));

    const parsedFrame = await AirGapFountain.parseRawFrame(firstRaw);
    assert.ok(parsedFrame !== null);
    assert.strictEqual(parsedFrame.sessionId, sessionId);
    assert.strictEqual(parsedFrame.frameIndex, 0);
    assert.strictEqual(parsedFrame.totalFrames, frames.length);
  });

  it('should reconstruct bit-exact payload when frames arrive out-of-order', async () => {
    const { frames } = await AirGapFountain.createFrames(sampleCommitPayload, 120);

    const receiver = new AirGapReceiver();

    // Shuffle frames to simulate camera frame drops and looping QR stream
    const shuffled = [...frames].sort(() => Math.random() - 0.5);

    let finalPayload: string | undefined;

    for (let i = 0; i < shuffled.length; i++) {
      const result = receiver.ingestFrame(shuffled[i]);
      if (result.isComplete) {
        finalPayload = result.payload;
        break;
      }
    }

    assert.ok(finalPayload !== undefined);
    assert.strictEqual(finalPayload, sampleCommitPayload);

    const session = receiver.getSession();
    assert.strictEqual(session.isComplete, true);
    assert.strictEqual(session.progressPercentage, 100);
    assert.strictEqual(session.missingFrameIndices.length, 0);
  });

  it('should reject frame with corrupted checksum', async () => {
    const { rawFrameStrings } = await AirGapFountain.createFrames('Confidential Military Order', 50);

    const corruptedRaw = rawFrameStrings[0].replace('HAG1:', 'HAG1:corrupted_checksum:');

    const parsed = await AirGapFountain.parseRawFrame(corruptedRaw);
    assert.strictEqual(parsed, null);
  });
});
