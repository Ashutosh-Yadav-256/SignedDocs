import { describe, it } from 'node:test';
import assert from 'node:assert';
import * as Y from 'yjs';
import { CommitDAG, HermesDocument } from '../../packages/core/src/index.js';
import { generateIdentity } from '../../packages/crypto/src/index.js';
import { SyncEngine, SyncTransport, TransportStatus } from '../../packages/sync/src/index.js';
import { HermesMessage } from '../../packages/protocol/src/index.js';

class MockDirectTransport implements SyncTransport {
  public readonly id = 'mock_direct';
  public readonly name = 'Mock Direct';
  public peerTransport: MockDirectTransport | null = null;
  private messageHandlers: ((msg: HermesMessage) => void)[] = [];
  private statusHandlers: ((status: TransportStatus) => void)[] = [];
  private status: TransportStatus = 'CONNECTED';

  public getStatus(): TransportStatus {
    return this.status;
  }

  public send(message: HermesMessage): void {
    if (this.peerTransport) {
      for (const h of this.peerTransport.messageHandlers) {
        h(message);
      }
    }
  }

  public onMessage(handler: (msg: HermesMessage) => void): void {
    this.messageHandlers.push(handler);
  }

  public onStatusChange(handler: (status: TransportStatus) => void): void {
    this.statusHandlers.push(handler);
  }

  public close(): void {
    this.status = 'DISCONNECTED';
  }
}

describe('Sync: Real-Time Collaborative Cursor & Awareness', () => {
  it('should propagate live Yjs awareness and custom author names across peers', async () => {
    const aliceId = await generateIdentity(true);
    const bobId = await generateIdentity(true);

    const docMeta: HermesDocument = {
      id: 'test_doc_awareness',
      title: 'Awareness Test Document',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      heads: [],
    };

    const aliceDoc = new Y.Doc();
    const bobDoc = new Y.Doc();

    const aliceTransport = new MockDirectTransport();
    const bobTransport = new MockDirectTransport();
    aliceTransport.peerTransport = bobTransport;
    bobTransport.peerTransport = aliceTransport;

    const dummyStorage: any = {
      saveCommit: async () => {},
      setHeads: async () => {},
    };

    const aliceSync = new SyncEngine({
      document: docMeta,
      identity: aliceId,
      ydoc: aliceDoc,
      dag: new CommitDAG(),
      storage: dummyStorage,
      transports: [aliceTransport],
      displayName: 'Alice Engineer',
      userColor: '#10B981',
    });

    const bobSync = new SyncEngine({
      document: docMeta,
      identity: bobId,
      ydoc: bobDoc,
      dag: new CommitDAG(),
      storage: dummyStorage,
      transports: [bobTransport],
      displayName: 'Bob QA',
      userColor: '#6366F1',
    });

    const aliceAwareness = aliceSync.getYjsAwareness();
    const bobAwareness = bobSync.getYjsAwareness();

    // Verify initial local state on Alice
    const aliceLocalState = aliceAwareness.getLocalState();
    assert.ok(aliceLocalState?.user, 'Alice local awareness should have user object');
    assert.strictEqual(aliceLocalState?.user?.name, 'Alice Engineer');
    assert.strictEqual(aliceLocalState?.user?.color, '#10B981');
    assert.strictEqual(aliceLocalState?.user?.authorId, aliceId.fingerprint.replace('hermes:', '').slice(0, 8));

    // Simulate Alice setting cursor position
    aliceAwareness.setLocalStateField('cursor', { anchor: 10, head: 15 });

    // Verify Bob's Yjs awareness received Alice's state
    const bobRemoteStates = bobAwareness.getStates();
    let aliceStateOnBob: any = null;
    for (const [clientId, state] of bobRemoteStates.entries()) {
      if (clientId !== bobAwareness.clientID) {
        aliceStateOnBob = state;
      }
    }

    assert.ok(aliceStateOnBob, 'Bob should receive Alice awareness state');
    assert.strictEqual(aliceStateOnBob.user?.name, 'Alice Engineer');
    assert.strictEqual(aliceStateOnBob.user?.color, '#10B981');
    assert.strictEqual(aliceStateOnBob.user?.authorId, aliceId.fingerprint.replace('hermes:', '').slice(0, 8));
    assert.deepStrictEqual(aliceStateOnBob.cursor, { anchor: 10, head: 15 });

    // Test updating custom author name
    aliceSync.updateLocalUser('Alice Senior Lead', '#C96846');
    const updatedAliceOnBob = bobAwareness.getStates().get(aliceAwareness.clientID);
    assert.strictEqual(updatedAliceOnBob?.user?.name, 'Alice Senior Lead');
    assert.strictEqual(updatedAliceOnBob?.user?.color, '#C96846');

    aliceSync.destroy();
    bobSync.destroy();
  });
});
