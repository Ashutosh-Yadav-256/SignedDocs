# HermesDocs P2P Wire Protocol

## 1. Message Types

All messages exchanged across transports (`BroadcastChannel` or WebRTC `RTCDataChannel`) conform to the `HermesMessage` protocol:

```typescript
type HermesMessage =
  | IdentityHelloMessage
  | DAGHeadsMessage
  | SyncRequestMessage
  | SyncResponseMessage
  | NewCommitMessage
  | AwarenessMessage;
```

---

## 2. Peer Handshake Sequence

When two peers connect:

```text
Peer A                         Peer B
  │                              │
  │──── IDENTITY_HELLO ─────────►│
  │◄─── IDENTITY_HELLO ──────────│
  │                              │
  │──── DAG_HEADS ──────────────►│
  │◄─── DAG_HEADS ───────────────│
  │                              │
  │──── SYNC_REQUEST ───────────►│ (Discovers missing ancestor heads)
  │                              │
  │◄─── SYNC_RESPONSE ───────────│ (Sends missing commit nodes)
  │                              │
  │   [Verify Commit Nodes]      │
  │   [Apply Verified Updates]   │
  │                              │
  │──── AWARENESS ──────────────►│
  │◄─── AWARENESS ───────────────│
```

---

## 3. Threat Model & Security Invariants

- **Hostile Transports**: Signaling servers, STUN relays, or intermediate nodes cannot forge commits or modify document states because every commit is signed with ECDSA P-256 and bound to the hash of the raw CRDT update.
- **Tampering Defense**: Modifying even 1 byte in the `updateBinary` causes the `updateHash` check or signature check to fail, immediately triggering a security quarantine.
- **Air-Gapped Operation**: Full editing, saving, commit signing, DAG traversal, and audit bundle exporting operate 100% offline without any network connectivity.
