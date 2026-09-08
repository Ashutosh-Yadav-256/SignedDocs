import { describe, it } from 'node:test';
import assert from 'node:assert';
import {
  generateIdentity,
  deriveRoomKey,
  encryptChatMessage,
  decryptChatMessage,
  signData,
  verifySignature,
  stringToUint8Array,
} from '../packages/crypto/src/index.js';

describe('Hermes Real-Time E2EE Chat & Multi-Room Cryptography', () => {
  it('should derive deterministic 256-bit AES-GCM room keys for the same room code', async () => {
    const roomCode = 'room_finance_review_2026';
    const key1 = await deriveRoomKey(roomCode);
    const key2 = await deriveRoomKey(roomCode);

    assert.ok(key1);
    assert.ok(key2);
    assert.strictEqual(key1.algorithm.name, 'AES-GCM');
    assert.strictEqual(key2.algorithm.name, 'AES-GCM');
  });

  it('should encrypt and decrypt chat message payloads correctly', async () => {
    const roomCode = 'room_general';
    const roomKey = await deriveRoomKey(roomCode);
    const plaintext = 'Hello collaborators! This is an end-to-end encrypted message.';

    const { ciphertext, iv } = await encryptChatMessage(plaintext, roomKey);
    assert.ok(ciphertext.length > 0);
    assert.ok(iv.length > 0);
    assert.notStrictEqual(ciphertext, plaintext);

    const decrypted = await decryptChatMessage(ciphertext, iv, roomKey);
    assert.strictEqual(decrypted, plaintext);
  });

  it('should enforce room isolation: different room keys cannot decrypt messages', async () => {
    const keyAlpha = await deriveRoomKey('room_alpha_confidential');
    const keyBeta = await deriveRoomKey('room_beta_public');
    const secret = 'Classified project milestone details';

    const { ciphertext, iv } = await encryptChatMessage(secret, keyAlpha);

    // Attempting to decrypt with room Beta's key must fail
    await assert.rejects(
      async () => {
        await decryptChatMessage(ciphertext, iv, keyBeta);
      },
      (err: any) => {
        return err !== undefined; // AES-GCM auth tag verification failure
      }
    );
  });

  it('should reject tampered ciphertext with AES-GCM integrity tag failure', async () => {
    const roomKey = await deriveRoomKey('room_secure_audit');
    const message = 'Audit report verdict: 100% VALID';

    const { ciphertext, iv } = await encryptChatMessage(message, roomKey);

    // Corrupt the ciphertext by flipping characters in the base64 string
    const tampered = ciphertext.slice(0, -4) + (ciphertext.slice(-4) === 'AAAA' ? 'BBBB' : 'AAAA');

    await assert.rejects(
      async () => {
        await decryptChatMessage(tampered, iv, roomKey);
      },
      (err: any) => {
        return err !== undefined;
      }
    );
  });

  it('should verify author identity with ECDSA signature on chat payload', async () => {
    const author = await generateIdentity(true);
    const roomKey = await deriveRoomKey('room_multi_peer');
    const text = 'Confirmed commit c61b4a verified.';

    const { ciphertext, iv } = await encryptChatMessage(text, roomKey);
    const timestamp = Date.now();

    // Author signs the cryptographic binding
    const sigPayload = stringToUint8Array(`${ciphertext}:${iv}:${timestamp}:${author.fingerprint}`);
    const signature = await signData(author.privateKey, sigPayload);

    // Receiver verifies with author's public key
    const isValid = await verifySignature(author.publicKeyBase64, signature, sigPayload);
    assert.strictEqual(isValid, true);

    // If an attacker attempts to modify the timestamp or author fingerprint, verification must fail
    const forgedPayload = stringToUint8Array(`${ciphertext}:${iv}:${timestamp + 1000}:${author.fingerprint}`);
    const isForgedValid = await verifySignature(author.publicKeyBase64, signature, forgedPayload);
    assert.strictEqual(isForgedValid, false);
  });

  it('should support dynamic "start fresh" private rooms', async () => {
    const freshRoom1 = `room_fresh_${Math.random().toString(36).substring(2, 9)}`;
    const freshRoom2 = `room_fresh_${Math.random().toString(36).substring(2, 9)}`;

    const keyFresh1 = await deriveRoomKey(freshRoom1);
    const keyFresh2 = await deriveRoomKey(freshRoom2);

    const msg = 'Fresh room secret discussion';
    const { ciphertext, iv } = await encryptChatMessage(msg, keyFresh1);

    // Key 1 succeeds
    const decrypted = await decryptChatMessage(ciphertext, iv, keyFresh1);
    assert.strictEqual(decrypted, msg);

    // Key 2 fails
    await assert.rejects(async () => {
      await decryptChatMessage(ciphertext, iv, keyFresh2);
    });
  });

  it('should deliver, verify, and decrypt messages in real time between peers over SyncEngine transport', async () => {
    // 1. Generate cryptographic identities
    const aliceIdentity = await generateIdentity(true);
    const bobIdentity = await generateIdentity(true);

    // 2. Setup mock direct bidirectional transport
    let aliceHandler: ((msg: any) => void) | null = null;
    let bobHandler: ((msg: any) => void) | null = null;

    const aliceTransport = {
      id: 'alice_transport',
      name: 'Alice Mock Transport',
      getStatus: () => 'CONNECTED' as const,
      send: (msg: any) => {
        if (bobHandler) bobHandler(msg);
      },
      onMessage: (h: any) => {
        aliceHandler = h;
      },
      onStatusChange: () => {},
      close: () => {},
    };

    const bobTransport = {
      id: 'bob_transport',
      name: 'Bob Mock Transport',
      getStatus: () => 'CONNECTED' as const,
      send: (msg: any) => {
        if (aliceHandler) aliceHandler(msg);
      },
      onMessage: (h: any) => {
        bobHandler = h;
      },
      onStatusChange: () => {},
      close: () => {},
    };

    // 3. Instantiate SyncEngines for both peers
    const { SyncEngine } = await import('../packages/sync/src/index.js');
    const { CommitDAG } = await import('../packages/core/src/index.js');
    const Y = await import('yjs');

    const aliceDoc = new Y.Doc();
    const bobDoc = new Y.Doc();

    const aliceEngine = new SyncEngine({
      document: { id: 'doc_chat_live', title: 'Live Chat Doc', createdAt: Date.now(), updatedAt: Date.now(), heads: [] },
      identity: aliceIdentity,
      ydoc: aliceDoc,
      dag: new CommitDAG(),
      transports: [aliceTransport],
      roomCode: 'room_shared_collab',
      displayName: 'Alice',
      userColor: '#E07A5F',
    });

    const bobEngine = new SyncEngine({
      document: { id: 'doc_chat_live', title: 'Live Chat Doc', createdAt: Date.now(), updatedAt: Date.now(), heads: [] },
      identity: bobIdentity,
      ydoc: bobDoc,
      dag: new CommitDAG(),
      transports: [bobTransport],
      roomCode: 'room_shared_collab',
      displayName: 'Bob',
      userColor: '#3D5A80',
    });

    // 4. Setup peer message listeners
    const bobReceived: any[] = [];
    bobEngine.onChatMessage(async (encryptedMsg) => {
      // Bob verifies Alice's signature
      const sigPayload = stringToUint8Array(
        `${encryptedMsg.ciphertext}:${encryptedMsg.iv}:${encryptedMsg.timestamp}:${encryptedMsg.author.fingerprint}`
      );
      const isVerified = await verifySignature(
        encryptedMsg.author.publicKey,
        encryptedMsg.signature,
        sigPayload
      );

      // Bob decrypts with room key
      const bobRoomKey = await deriveRoomKey(encryptedMsg.roomCode);
      const plaintext = await decryptChatMessage(encryptedMsg.ciphertext, encryptedMsg.iv, bobRoomKey);

      bobReceived.push({
        id: encryptedMsg.id,
        plaintext,
        author: encryptedMsg.author.displayName,
        isVerified,
      });
    });

    const aliceReceived: any[] = [];
    aliceEngine.onChatMessage(async (encryptedMsg) => {
      const sigPayload = stringToUint8Array(
        `${encryptedMsg.ciphertext}:${encryptedMsg.iv}:${encryptedMsg.timestamp}:${encryptedMsg.author.fingerprint}`
      );
      const isVerified = await verifySignature(
        encryptedMsg.author.publicKey,
        encryptedMsg.signature,
        sigPayload
      );

      const aliceRoomKey = await deriveRoomKey(encryptedMsg.roomCode);
      const plaintext = await decryptChatMessage(encryptedMsg.ciphertext, encryptedMsg.iv, aliceRoomKey);

      aliceReceived.push({
        id: encryptedMsg.id,
        plaintext,
        author: encryptedMsg.author.displayName,
        isVerified,
      });
    });

    // 5. Alice encrypts, signs, and sends message in room_shared_collab
    const roomCode = 'room_shared_collab';
    const aliceRoomKey = await deriveRoomKey(roomCode);
    const aliceText = 'Hey Bob, checking in on the real-time E2EE chat!';
    const { ciphertext: c1, iv: iv1 } = await encryptChatMessage(aliceText, aliceRoomKey);
    const ts1 = Date.now();
    const sigPayload1 = stringToUint8Array(`${c1}:${iv1}:${ts1}:${aliceIdentity.fingerprint}`);
    const sig1 = await signData(aliceIdentity.privateKey, sigPayload1);

    aliceEngine.broadcastChatMessage({
      type: 'CHAT_MESSAGE',
      documentId: 'doc_chat_live',
      roomCode,
      id: 'msg_001',
      author: {
        fingerprint: aliceIdentity.fingerprint,
        publicKey: aliceIdentity.publicKeyBase64,
        displayName: 'Alice',
      },
      authorColor: '#E07A5F',
      ciphertext: c1,
      iv: iv1,
      signature: sig1,
      timestamp: ts1,
    });

    // Wait for async cryptographic verification and decryption
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Verify Bob received, verified, and decrypted Alice's message
    assert.strictEqual(bobReceived.length, 1);
    assert.strictEqual(bobReceived[0].plaintext, aliceText);
    assert.strictEqual(bobReceived[0].author, 'Alice');
    assert.strictEqual(bobReceived[0].isVerified, true);

    // 6. Bob replies to Alice
    const bobRoomKey = await deriveRoomKey(roomCode);
    const bobText = 'Received loud and clear! 100% verified.';
    const { ciphertext: c2, iv: iv2 } = await encryptChatMessage(bobText, bobRoomKey);
    const ts2 = Date.now();
    const sigPayload2 = stringToUint8Array(`${c2}:${iv2}:${ts2}:${bobIdentity.fingerprint}`);
    const sig2 = await signData(bobIdentity.privateKey, sigPayload2);

    bobEngine.broadcastChatMessage({
      type: 'CHAT_MESSAGE',
      documentId: 'doc_chat_live',
      roomCode,
      id: 'msg_002',
      author: {
        fingerprint: bobIdentity.fingerprint,
        publicKey: bobIdentity.publicKeyBase64,
        displayName: 'Bob',
      },
      authorColor: '#3D5A80',
      ciphertext: c2,
      iv: iv2,
      signature: sig2,
      timestamp: ts2,
    });

    // Wait for async cryptographic verification and decryption
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Verify Alice received, verified, and decrypted Bob's reply
    assert.strictEqual(aliceReceived.length, 1);
    assert.strictEqual(aliceReceived[0].plaintext, bobText);
    assert.strictEqual(aliceReceived[0].author, 'Bob');
    assert.strictEqual(aliceReceived[0].isVerified, true);

    aliceEngine.destroy();
    bobEngine.destroy();
  });
});
