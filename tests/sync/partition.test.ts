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

async function makeSignedCommit(
  ydoc: Y.Doc,
  textToAppend: string,
  parentIds: string[],
  identity: any,
  timestamp: number
): Promise<SignedCommitNode> {
  const ytext = ydoc.getText('content');
  ytext.insert(ytext.length, textToAppend);
  const update = Y.encodeStateAsUpdate(ydoc);
  const updateBinary = uint8ArrayToBase64(update);
  const updateHash = await sha256Hex(update);

  const header = {
    version: 1 as const,
    parentIds,
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
    parentIds,
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

describe('Sync: Network Partition, Reconnection & Reconvergence', () => {
  it('should allow two peers to edit during offline partition and converge after reconnection', async () => {
    const aliceIdentity = await generateIdentity();
    const bobIdentity = await generateIdentity();

    // 1. Initial shared state
    const aliceDoc = new Y.Doc();
    const bobDoc = new Y.Doc();
    const aliceDAG = new CommitDAG();
    const bobDAG = new CommitDAG();

    // Genesis commit created by Alice
    const genesisCommit = await makeSignedCommit(aliceDoc, '# Distributed Systems\n', [], aliceIdentity, 100);
    aliceDAG.insert(genesisCommit);

    // Replicate genesis to Bob
    const genesisBytes = base64ToUint8Array(genesisCommit.updateBinary);
    Y.applyUpdate(bobDoc, genesisBytes);
    bobDAG.insert(genesisCommit);

    assert.strictEqual(aliceDoc.getText('content').toString(), bobDoc.getText('content').toString());

    // 2. NETWORK PARTITION OCCURS (Alice and Bob are disconnected)
    // Alice makes edits offline
    const aliceOfflineCommit = await makeSignedCommit(
      aliceDoc,
      'Alice note: Raft consensus.\n',
      aliceDAG.getHeads(),
      aliceIdentity,
      200
    );
    aliceDAG.insert(aliceOfflineCommit);

    // Bob makes concurrent edits offline
    const bobOfflineCommit = await makeSignedCommit(
      bobDoc,
      'Bob note: Paxos protocol.\n',
      bobDAG.getHeads(),
      bobIdentity,
      210
    );
    bobDAG.insert(bobOfflineCommit);

    // While partitioned, DAGs have divergent heads
    assert.deepStrictEqual(aliceDAG.getHeads(), [aliceOfflineCommit.id]);
    assert.deepStrictEqual(bobDAG.getHeads(), [bobOfflineCommit.id]);
    assert.notStrictEqual(aliceDoc.getText('content').toString(), bobDoc.getText('content').toString());

    // 3. NETWORK RESTORED: Exchange missing commits
    // Alice sends her missing commit to Bob
    const verifyAliceAtBob = await HermesVerifier.verifyCommit(aliceOfflineCommit);
    assert.strictEqual(verifyAliceAtBob.isValid, true);
    bobDAG.insert(aliceOfflineCommit);
    Y.applyUpdate(bobDoc, base64ToUint8Array(aliceOfflineCommit.updateBinary));

    // Bob sends his missing commit to Alice
    const verifyBobAtAlice = await HermesVerifier.verifyCommit(bobOfflineCommit);
    assert.strictEqual(verifyBobAtAlice.isValid, true);
    aliceDAG.insert(bobOfflineCommit);
    Y.applyUpdate(aliceDoc, base64ToUint8Array(bobOfflineCommit.updateBinary));

    // 4. VERIFY CONVERGENCE
    // Both peers have identical Yjs document state
    const finalTextAlice = aliceDoc.getText('content').toString();
    const finalTextBob = bobDoc.getText('content').toString();
    assert.strictEqual(finalTextAlice, finalTextBob);
    assert.ok(finalTextAlice.includes('Raft consensus'));
    assert.ok(finalTextAlice.includes('Paxos protocol'));

    // Both peers have identical 2 divergent heads in DAG
    const expectedHeads = [aliceOfflineCommit.id, bobOfflineCommit.id].sort();
    assert.deepStrictEqual(aliceDAG.getHeads().sort(), expectedHeads);
    assert.deepStrictEqual(bobDAG.getHeads().sort(), expectedHeads);

    // 5. CREATE MERGE COMMIT
    const mergeCommit = await makeSignedCommit(
      aliceDoc,
      '## Conclusion\nBoth protocols are valid.\n',
      aliceDAG.getHeads(),
      aliceIdentity,
      300
    );
    aliceDAG.insert(mergeCommit);
    bobDAG.insert(mergeCommit);
    Y.applyUpdate(bobDoc, base64ToUint8Array(mergeCommit.updateBinary));

    // After merge commit, both converge to a single unified head
    assert.deepStrictEqual(aliceDAG.getHeads(), [mergeCommit.id]);
    assert.deepStrictEqual(bobDAG.getHeads(), [mergeCommit.id]);
    assert.strictEqual(aliceDoc.getText('content').toString(), bobDoc.getText('content').toString());
  });
});
