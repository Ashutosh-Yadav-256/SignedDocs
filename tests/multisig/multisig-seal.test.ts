import { describe, it } from 'node:test';
import assert from 'node:assert';
import { generateIdentity, sha256Hex, stringToUint8Array } from '../../packages/crypto/src/index.js';
import {
  MultisigEngine,
  MultisigVerifier,
} from '../../packages/core/src/index.js';

describe('MultisigSeal: M-of-N Threshold Multi-Party Milestone Seals', () => {
  it('should create and verify a 2-of-2 milestone agreement seal', async () => {
    const alice = await generateIdentity();
    const bob = await generateIdentity();

    const documentText = '# Partnership Agreement v1.0\nBoth parties agree to 50/50 revenue share.';
    const stateHash = await sha256Hex(stringToUint8Array(documentText));

    // 1. Alice proposes milestone seal with 2-of-2 quorum
    const proposal = await MultisigEngine.createProposal({
      documentId: 'doc_partnership_001',
      documentTitle: 'Partnership Agreement',
      stateHash,
      milestoneName: 'v1.0 Final Executed Agreement',
      milestoneDescription: 'Formal board sign-off by all founders',
      quorum: {
        requiredQuorum: 2,
        totalEligible: 2,
        eligibleFingerprints: [alice.fingerprint, bob.fingerprint],
      },
      identity: alice,
    });

    // 2. Alice endorses
    const aliceEndorsement = await MultisigEngine.endorseProposal(proposal, alice);

    // 3. Bob endorses
    const bobEndorsement = await MultisigEngine.endorseProposal(proposal, bob);

    // 4. Create seal node
    const sealNode = await MultisigEngine.createSealNode(proposal, [
      aliceEndorsement,
      bobEndorsement,
    ]);

    assert.strictEqual(sealNode.status, 'SEALED');
    assert.ok(sealNode.sealId.length === 64);
    assert.strictEqual(sealNode.endorsements.length, 2);

    // 5. Verify Seal
    const verdict = await MultisigVerifier.verifyMultisigSeal(sealNode);
    assert.strictEqual(verdict.isValid, true);
    assert.strictEqual(verdict.verdict, 'SEAL_VALID');
    assert.strictEqual(verdict.validEndorsementsCount, 2);
    assert.deepStrictEqual(verdict.signatories.sort(), [alice.fingerprint, bob.fingerprint].sort());
  });

  it('should verify a 2-of-3 threshold seal when 2 distinct eligible peers sign', async () => {
    const alice = await generateIdentity();
    const bob = await generateIdentity();
    const charlie = await generateIdentity();

    const stateHash = await sha256Hex(stringToUint8Array('Treasury Transfer Proposal'));

    const proposal = await MultisigEngine.createProposal({
      documentId: 'doc_treasury_002',
      documentTitle: 'Treasury Transfer',
      stateHash,
      milestoneName: 'Q3 Budget Approval',
      quorum: {
        requiredQuorum: 2,
        totalEligible: 3,
        eligibleFingerprints: [alice.fingerprint, bob.fingerprint, charlie.fingerprint],
      },
      identity: alice,
    });

    // Alice and Charlie endorse (Bob does not sign)
    const aliceEndorsement = await MultisigEngine.endorseProposal(proposal, alice);
    const charlieEndorsement = await MultisigEngine.endorseProposal(proposal, charlie);

    const sealNode = await MultisigEngine.createSealNode(proposal, [
      aliceEndorsement,
      charlieEndorsement,
    ]);

    const verdict = await MultisigVerifier.verifyMultisigSeal(sealNode);
    assert.strictEqual(verdict.isValid, true);
    assert.strictEqual(verdict.verdict, 'SEAL_VALID');
    assert.strictEqual(verdict.validEndorsementsCount, 2);
    assert.deepStrictEqual(verdict.signatories.sort(), [alice.fingerprint, charlie.fingerprint].sort());
  });

  it('should reject milestone seal when quorum threshold is not met (1-of-2)', async () => {
    const alice = await generateIdentity();
    const bob = await generateIdentity();

    const stateHash = await sha256Hex(stringToUint8Array('Confidential Term Sheet'));

    const proposal = await MultisigEngine.createProposal({
      documentId: 'doc_terms_003',
      documentTitle: 'Term Sheet',
      stateHash,
      milestoneName: 'Series A Term Sheet',
      quorum: {
        requiredQuorum: 2,
        totalEligible: 2,
      },
      identity: alice,
    });

    // Only Alice endorses
    const aliceEndorsement = await MultisigEngine.endorseProposal(proposal, alice);

    // Manual seal construction with insufficient endorsements
    const incompleteSeal = {
      version: 1 as const,
      sealId: 'incomplete_seal_id',
      proposal,
      endorsements: [aliceEndorsement],
      sealedAt: Date.now(),
      status: 'PENDING' as const,
    };

    const verdict = await MultisigVerifier.verifyMultisigSeal(incompleteSeal);
    assert.strictEqual(verdict.isValid, false);
    assert.strictEqual(verdict.verdict, 'QUORUM_NOT_MET');
  });

  it('should reject duplicate endorsement attack from single signer', async () => {
    const alice = await generateIdentity();

    const stateHash = await sha256Hex(stringToUint8Array('Single Signer Document'));

    const proposal = await MultisigEngine.createProposal({
      documentId: 'doc_dup_004',
      documentTitle: 'Duplicate Attack Test',
      stateHash,
      milestoneName: 'Bypass Attempt',
      quorum: {
        requiredQuorum: 2,
        totalEligible: 2,
      },
      identity: alice,
    });

    const aliceEndorsement = await MultisigEngine.endorseProposal(proposal, alice);

    // Attacker submits Alice endorsement twice
    const fraudulentSeal = {
      version: 1 as const,
      sealId: 'fraud_seal_id',
      proposal,
      endorsements: [aliceEndorsement, aliceEndorsement],
      sealedAt: Date.now(),
      status: 'PENDING' as const,
    };

    const verdict = await MultisigVerifier.verifyMultisigSeal(fraudulentSeal);
    assert.strictEqual(verdict.isValid, false);
    assert.strictEqual(verdict.verdict, 'DUPLICATE_SIGNATORY');
  });

  it('should reject unauthorized signer when not in whitelist policy', async () => {
    const alice = await generateIdentity();
    const bob = await generateIdentity();
    const eve = await generateIdentity(); // Unauthorized third party

    const stateHash = await sha256Hex(stringToUint8Array('Restricted Board Minutes'));

    const proposal = await MultisigEngine.createProposal({
      documentId: 'doc_board_005',
      documentTitle: 'Board Minutes',
      stateHash,
      milestoneName: 'Official Minutes Sign-off',
      quorum: {
        requiredQuorum: 2,
        totalEligible: 2,
        eligibleFingerprints: [alice.fingerprint, bob.fingerprint],
      },
      identity: alice,
    });

    const aliceEndorsement = await MultisigEngine.endorseProposal(proposal, alice);
    const eveEndorsement = await MultisigEngine.endorseProposal(proposal, eve);

    const fraudulentSeal = {
      version: 1 as const,
      sealId: 'unauthorized_seal_id',
      proposal,
      endorsements: [aliceEndorsement, eveEndorsement],
      sealedAt: Date.now(),
      status: 'PENDING' as const,
    };

    const verdict = await MultisigVerifier.verifyMultisigSeal(fraudulentSeal);
    assert.strictEqual(verdict.isValid, false);
    assert.strictEqual(verdict.verdict, 'UNAUTHORIZED_SIGNER');
  });
});
