import { describe, it } from 'node:test';
import assert from 'node:assert';
import { generateIdentity } from '../../packages/crypto/src/index.js';
import {
  RedactionEngine,
  RedactionVerifier,
} from '../../packages/core/src/index.js';

describe('ZK-Redact: Cryptographic Selective Disclosure & Merkle Redaction', () => {
  const sampleContract = `
# Executive Employment & Confidentiality Agreement

Section 1: Appointment & Duties
The Executive shall serve as Chief Technology Officer and report directly to the Board of Directors.

Section 2: Compensation & Equity Grant
The Company shall pay Executive an annual base salary of $450,000.00 USD, plus 2.5% incentive equity.

Section 3: Intellectual Property & Trade Secrets
All inventions, patents, and cryptographic protocols authored during the term shall remain sole property of Company.

Section 4: Whistleblower & Anonymous Disclosure
The primary internal audit liaison for protected reporting shall be Agent-Omega-774.

Section 5: Governing Law & Jurisdiction
This agreement shall be governed by and construed under the laws of the State of Delaware.
`.trim();

  it('should create a valid redacted bundle and verify unredacted text and Merkle roots', async () => {
    const identity = await generateIdentity();

    // Redact Section 2 (Salary: index 2) and Section 4 (Whistleblower: index 4)
    const bundle = await RedactionEngine.createRedactedBundle({
      documentId: 'doc_contract_001',
      documentTitle: 'Executive Employment Agreement',
      originalCommitId: 'commit_root_abc',
      text: sampleContract,
      identity,
      redactedIndices: [2, 4],
      redactionReasons: {
        2: 'Confidential Financial PII',
        4: 'Classified Source Identity',
      },
    });

    assert.strictEqual(bundle.format, 'hermesdocs-redacted');
    assert.strictEqual(bundle.stats.totalBlocks, 6);
    assert.strictEqual(bundle.stats.revealedBlocks, 4);
    assert.strictEqual(bundle.stats.redactedBlocks, 2);

    // Ensure redacted blocks DO NOT leak salts or secret plaintext
    const salaryBlock = bundle.blocks[2];
    assert.strictEqual(salaryBlock.isRedacted, true);
    assert.strictEqual(salaryBlock.content, '[REDACTED: Confidential Financial PII]');
    assert.strictEqual(salaryBlock.salt, undefined); // Zero-knowledge!
    assert.ok(salaryBlock.leafHash.length === 64);
    assert.ok(salaryBlock.proof.steps.length > 0);

    // Verify bundle cryptographically
    const verification = await RedactionVerifier.verifyRedactedBundle(bundle);
    assert.strictEqual(verification.isValid, true);
    assert.strictEqual(verification.verdict, 'VALID');
    assert.strictEqual(verification.authorFingerprint, identity.fingerprint);
    assert.strictEqual(verification.revealedBlocks, 4);
    assert.strictEqual(verification.redactedBlocks, 2);
  });

  it('should reject redacted bundle if unredacted plaintext is tampered with by 1 character', async () => {
    const identity = await generateIdentity();

    const bundle = await RedactionEngine.createRedactedBundle({
      documentId: 'doc_contract_002',
      documentTitle: 'Executive Agreement',
      originalCommitId: 'commit_root_xyz',
      text: sampleContract,
      identity,
      redactedIndices: [2],
    });

    // Tamper with Section 1 (Executive role)
    bundle.blocks[1].content = bundle.blocks[1].content.replace('Chief Technology Officer', 'Chief Executive Officer');

    const verification = await RedactionVerifier.verifyRedactedBundle(bundle);
    assert.strictEqual(verification.isValid, false);
    assert.strictEqual(verification.verdict, 'LEAF_HASH_MISMATCH');
  });

  it('should reject redacted bundle if author signature is forged or corrupted', async () => {
    const identity = await generateIdentity();

    const bundle = await RedactionEngine.createRedactedBundle({
      documentId: 'doc_contract_003',
      documentTitle: 'Executive Agreement',
      originalCommitId: 'commit_root_123',
      text: sampleContract,
      identity,
      redactedIndices: [2],
    });

    // Corrupt signature
    bundle.signature = 'forged_base64_signature_xxxx';

    const verification = await RedactionVerifier.verifyRedactedBundle(bundle);
    assert.strictEqual(verification.isValid, false);
    assert.strictEqual(verification.verdict, 'SIGNATURE_INVALID');
  });

  it('should reject bundle if a redacted leaf hash is swapped with another hash', async () => {
    const identity = await generateIdentity();

    const bundle = await RedactionEngine.createRedactedBundle({
      documentId: 'doc_contract_004',
      documentTitle: 'Executive Agreement',
      originalCommitId: 'commit_root_456',
      text: sampleContract,
      identity,
      redactedIndices: [2],
    });

    // Swap leaf hash of redacted block
    bundle.blocks[2].leafHash = '0000000000000000000000000000000000000000000000000000000000000000';

    const verification = await RedactionVerifier.verifyRedactedBundle(bundle);
    assert.strictEqual(verification.isValid, false);
    assert.strictEqual(verification.verdict, 'PROOF_INVALID');
  });
});
