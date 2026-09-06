import { describe, it } from 'node:test';
import assert from 'node:assert';
import {
  CadenceTracker,
  ForensicsEngine,
} from '../../packages/core/src/index.js';

describe('Forensics: Human vs. AI Attribution & Keystroke Cadence Engine', () => {
  it('should analyze natural human typing cadence with characteristic intervals', () => {
    const tracker = new CadenceTracker();

    // Simulate natural human typing intervals (150ms ± 30ms)
    let t = 1000;
    tracker.recordKeypress(t);
    const deltas = [140, 180, 120, 160, 190, 130, 150];
    for (const d of deltas) {
      t += d;
      tracker.recordKeypress(t);
    }

    const cadence = tracker.analyzeCadence();
    assert.strictEqual(cadence.isNaturalHuman, true);
    assert.ok(cadence.averageIntervalMs >= 130 && cadence.averageIntervalMs <= 180);
    assert.ok(cadence.varianceMs > 10);
    assert.strictEqual(cadence.samplesCount, 7);
  });

  it('should track granular attribution spans across human, AI-assisted, and pasted text', () => {
    const aliceFingerprint = 'hermes:alice1234';

    const span1 = ForensicsEngine.createHumanSpan({
      id: 'span_01',
      startIndex: 0,
      endIndex: 50,
      text: '# Project Roadmap\nThis project introduces Hermes.',
      authorFingerprint: aliceFingerprint,
    });

    const span2 = ForensicsEngine.createAISpan({
      id: 'span_02',
      startIndex: 51,
      endIndex: 120,
      text: 'The architecture employs a decentralized Merkle DAG for verifiable provenance.',
      authorFingerprint: aliceFingerprint,
      aiModel: 'ollama:llama3.2',
      aiManifestHash: 'sha256:abc123manifest',
      humanReviewerFingerprint: aliceFingerprint,
    });

    const span3 = ForensicsEngine.createPasteSpan({
      id: 'span_03',
      startIndex: 121,
      endIndex: 150,
      text: 'CONFIDENTIAL LICENSE KEY 9981',
      authorFingerprint: aliceFingerprint,
    });

    const manifest = ForensicsEngine.createForensicsManifest({
      documentId: 'doc_roadmap_001',
      documentTitle: 'Project Roadmap',
      spans: [span1, span2, span3],
    });

    assert.strictEqual(manifest.version, 1);
    assert.strictEqual(manifest.spans.length, 3);
    assert.strictEqual(manifest.breakdown.humanTypedChars, span1.text.length);
    assert.strictEqual(manifest.breakdown.aiAssistedChars, span2.text.length);
    assert.strictEqual(manifest.breakdown.pastedChars, span3.text.length);
    assert.ok(manifest.breakdown.humanPercentage > 0);
    assert.ok(manifest.breakdown.aiPercentage > 0);
    assert.ok(manifest.breakdown.pastePercentage > 0);
    assert.strictEqual(
      manifest.breakdown.humanPercentage + manifest.breakdown.aiPercentage + manifest.breakdown.pastePercentage,
      100
    );
  });
});
