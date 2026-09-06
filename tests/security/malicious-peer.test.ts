import { describe, it } from 'node:test';
import assert from 'node:assert';
import * as Y from 'yjs';
import {
  CommitDAG,
  HermesVerifier,
  SignedCommitNode,
} from '../../packages/core/src/index.js';
import {
  base64ToUint8Array,
  computeCommitId,
  generateIdentity,
  sha256Hex,
  signData,
  stringToUint8Array,
  uint8ArrayToBase64,
} from '../../packages/crypto/src/index.js';

async function createValidCommit(identity: any, text: string, timestamp: number = 1000): Promise<SignedCommitNode> {
  const doc = new Y.Doc();
  doc.getText('content').insert(0, text);
  const update = Y.encodeStateAsUpdate(doc);
  const updateBinary = uint8ArrayToBase64(update);
  const updateHash = await sha256Hex(update);

  const header = {
    version: 1 as const,
    parentIds: [],
    updateHash,
    authorPublicKey: identity.publicKeyBase64,
    timestamp,
  };

  const id = await computeCommitId(header);
  const canonicalBytes = stringToUint8Array(JSON.stringify({
    authorPublicKey: header.authorPublicKey,
    parentIds: header.parentIds,
    timestamp: header.timestamp,
    updateHash: header.updateHash,
    version: 1,
  }));

  const signature = await signData(identity.privateKey, canonicalBytes);

  return {
    version: 1,
    id,
    parentIds: [],
    author: {
      fingerprint: identity.fingerprint,
      publicKey: identity.publicKeyBase64,
    },
    timestamp,
    updateHash,
    updateBinary,
    signature,
  };
}

describe('Security: Hostile Peer Attack Defense & Quarantine', () => {
  it('should reject commit when payload binary is altered by 1 bit (tamper attack)', async () => {
    const identity = await generateIdentity();
    const commit = await createValidCommit(identity, 'Financial Record: $100.00');

    // Mutate 1 byte in binary payload
    const originalBytes = base64ToUint8Array(commit.updateBinary);
    const tamperedBytes = new Uint8Array(originalBytes);
    tamperedBytes[0] = (tamperedBytes[0] + 1) % 255;

    const tampered = {
      ...commit,
      updateBinary: uint8ArrayToBase64(tamperedBytes),
    };

    const verdict = await HermesVerifier.verifyCommit(tampered);
    assert.strictEqual(verdict.isValid, false);
    assert.strictEqual(verdict.verdict, 'HASH_MISMATCH');
  });

  it('should reject commit when author public key is swapped (impersonation attack)', async () => {
    const attacker = await generateIdentity();
    const victim = await generateIdentity();

    // Attacker signs payload with their own private key, but labels author with victim's fingerprint
    const commit = await createValidCommit(attacker, 'Unauthorized Admin Command');
    const impersonationCommit: SignedCommitNode = {
      ...commit,
      author: {
        fingerprint: victim.fingerprint, // Forged fingerprint
        publicKey: attacker.publicKeyBase64,
      },
    };

    const verdict = await HermesVerifier.verifyCommit(impersonationCommit);
    assert.strictEqual(verdict.isValid, false);
    assert.strictEqual(verdict.verdict, 'FINGERPRINT_MISMATCH');
  });

  it('should isolate and quarantine hostile commit without polluting local DAG or Yjs', async () => {
    const localIdentity = await generateIdentity();
    const attackerIdentity = await generateIdentity();

    const localDoc = new Y.Doc();
    const localDAG = new CommitDAG();

    // Local peer creates initial valid commit
    const validCommit = await createValidCommit(localIdentity, 'Verified Document Root\n');
    localDAG.insert(validCommit);
    Y.applyUpdate(localDoc, base64ToUint8Array(validCommit.updateBinary));

    // Attacker sends hostile corrupted commit
    const hostileCommit = await createValidCommit(attackerIdentity, 'Malicious Payload');
    hostileCommit.signature = 'corrupted_signature_xxxx';

    // Verification check before insertion
    const checkResult = await HermesVerifier.verifyCommit(hostileCommit);
    assert.strictEqual(checkResult.isValid, false);

    // Hostile commit is NOT inserted
    if (!checkResult.isValid) {
      // Quarantine
    } else {
      localDAG.insert(hostileCommit);
    }

    // Local DAG remains clean with only 1 valid commit
    assert.strictEqual(localDAG.size(), 1);
    assert.deepStrictEqual(localDAG.getHeads(), [validCommit.id]);
    assert.strictEqual(localDoc.getText('content').toString(), 'Verified Document Root\n');
  });
});
