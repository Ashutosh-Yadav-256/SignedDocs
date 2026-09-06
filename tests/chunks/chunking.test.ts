import { describe, it } from 'node:test';
import assert from 'node:assert';
import { ChunkEngine } from '../../packages/core/src/index.js';
import { generateIdentity, stringToUint8Array } from '../../packages/crypto/src/index.js';

describe('Chunks: Content-Addressed P2P Artifact Transfer', () => {
  it('should slice binary payload into verified SHA-256 pieces and generate signed manifest', async () => {
    const identity = await generateIdentity();
    // 150 KB test binary (3 x 64KB chunks)
    const testData = new Uint8Array(150 * 1024);
    for (let i = 0; i < testData.length; i++) {
      testData[i] = i % 256;
    }

    const { manifest, pieces } = await ChunkEngine.createManifest(
      testData,
      'dataset.bin',
      'application/octet-stream',
      identity,
      64 * 1024
    );

    assert.strictEqual(manifest.filename, 'dataset.bin');
    assert.strictEqual(manifest.totalSize, 150 * 1024);
    assert.strictEqual(manifest.totalPieces, 3);
    assert.strictEqual(manifest.pieceHashes.length, 3);
    assert.strictEqual(pieces.length, 3);

    // Verify manifest signature
    const isManifestValid = await ChunkEngine.verifyManifest(manifest);
    assert.strictEqual(isManifestValid, true);

    // Verify individual piece
    const isPiece0Valid = await ChunkEngine.verifyPiece(pieces[0].data!, 0, manifest);
    assert.strictEqual(isPiece0Valid, true);
  });

  it('should reject piece if data does not match SHA-256 hash in manifest', async () => {
    const identity = await generateIdentity();
    const data = stringToUint8Array('Important research document data payload.');
    const { manifest, pieces } = await ChunkEngine.createManifest(data, 'doc.txt', 'text/plain', identity);

    // Mutate piece data
    const corruptedPiece = new Uint8Array(pieces[0].data!);
    corruptedPiece[0] = corruptedPiece[0] ^ 0xff;

    const isValid = await ChunkEngine.verifyPiece(corruptedPiece, 0, manifest);
    assert.strictEqual(isValid, false);
  });

  it('should reconstruct original binary artifact from out-of-order received pieces', async () => {
    const identity = await generateIdentity();
    const originalText = 'Hello Distributed Peer Network! Hermes Chunk Transfer Protocol v1.';
    const data = stringToUint8Array(originalText);

    const { manifest, pieces } = await ChunkEngine.createManifest(data, 'hello.txt', 'text/plain', identity, 16);

    // Simulate receiving pieces out-of-order over P2P network
    const pieceMap = new Map<number, Uint8Array>();
    const bitfield = ChunkEngine.createBitfield(manifest.totalPieces);

    // Receive piece 2, then piece 0, then piece 1, etc.
    const shuffled = [...pieces].sort(() => Math.random() - 0.5);
    for (const p of shuffled) {
      pieceMap.set(p.index, p.data!);
      ChunkEngine.updateBitfield(bitfield, p.index);
    }

    assert.strictEqual(bitfield.isComplete, true);

    // Reconstruct
    const reconstructed = await ChunkEngine.reconstructArtifact(pieceMap, manifest);
    assert.ok(reconstructed !== null);
    assert.deepStrictEqual(Array.from(reconstructed!), Array.from(data));
  });
});
