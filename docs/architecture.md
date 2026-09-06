# HermesDocs Architecture Specification

HermesDocs is a local-first collaborative Markdown editor engineered around **four independent concerns**:

1. **Document State**: TipTap + Yjs CRDT
2. **Cryptographic History**: Signed Commit Merkle DAG (WebCrypto ECDSA P-256 + SHA-256)
3. **Peer Synchronization**: WebRTC DataChannels + BroadcastChannel
4. **Verification & Export**: Standalone audit verifier (`.hermes.json`)

```
┌─────────────────────────────────────────────────────────────┐
│                       Browser / PWA                         │
│                                                             │
│  ┌───────────────────────────────────────────────────────┐  │
│  │                    UI Layer                           │  │
│  │                                                       │  │
│  │ Dashboard │ Editor │ Timeline │ Presence │ Settings  │  │
│  └───────────────────────┬───────────────────────────────┘  │
│                          │                                  │
│  ┌───────────────────────▼───────────────────────────────┐  │
│  │                 Document Engine                      │  │
│  │                                                       │  │
│  │ TipTap ─────────────── Yjs ───────────── Markdown    │  │
│  └───────────────────────┬───────────────────────────────┘  │
│                          │                                  │
│  ┌───────────────────────▼───────────────────────────────┐  │
│  │                  Commit Engine                       │  │
│  │                                                       │  │
│  │ Update Buffer → Hash → DAG → Sign → Persist          │  │
│  └───────────────────────┬───────────────────────────────┘  │
│                          │                                  │
│  ┌───────────────┬──────▼───────┬───────────────────────┐  │
│  │               │              │                       │  │
│  ▼               ▼              ▼                       ▼  │
│ IndexedDB     WebCrypto      WebRTC             BroadcastChannel│
│               Identity       P2P                       │  │
└─────────────────────────────────────────────────────────────┘
```

---

## 1. Document State (Yjs CRDT)
- **Authority**: Yjs is the sole authority for live document state. TipTap is the rendering and editing view.
- **Rule**: Text state is never stored in separate ad-hoc React states. Remote edits enter strictly through Yjs CRDT operations.

## 2. Cryptographic Commit Pipeline
- Local edits produce incremental Yjs binary updates.
- Updates are accumulated in a volatile buffer (debounced at ~1500ms or 50 ops threshold).
- Merged update binary is hashed via SHA-256 (`updateHash`).
- Canonical commit header is constructed and hashed (`commit.id = SHA-256(canonicalHeader)`).
- Header is signed with ECDSA P-256 using the author's private key (`signature`).
- The resulting `SignedCommitNode` is appended to the local `CommitDAG` and persisted to IndexedDB.

## 3. Peer Synchronization (WebRTC & BroadcastChannel)
- **Same-Origin Tabs**: Handled via `BroadcastChannel` with 0 network latency.
- **P2P Devices**: Direct WebRTC DataChannels with public free STUN servers.
- **Signaling**: Lightweight Node.js WebSocket relay (`hermes-signal`) that ONLY negotiates peer connection setups (SDP/ICE) and never touches document content.

## 4. Standalone Verification
- Inbound commits from peers must pass all 9 verification steps before their Yjs binary update is applied.
- Portable `.hermes.json` audit bundles can be independently inspected and verified offline using the `apps/verifier` CLI.
