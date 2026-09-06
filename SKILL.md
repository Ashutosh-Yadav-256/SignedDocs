---
name: hermesdocs-engine
description: Build, maintain, test, and debug HermesDocs, a local-first cryptographically verifiable collaborative Markdown editor using TipTap, Yjs, WebCrypto, IndexedDB, WebRTC, and a signed Merkle DAG.
---

# HermesDocs Engineering Skill

## 1. Mission

HermesDocs is a local-first collaborative Markdown editor designed for environments where document history must remain:

* offline-capable
* peer-to-peer
* cryptographically verifiable
* causally ordered
* independently auditable

The system uses:

* TipTap for rich-text editing
* Yjs for document CRDT state
* WebCrypto for identity and signatures
* IndexedDB for local persistence
* WebRTC for peer-to-peer synchronization
* BroadcastChannel for same-origin multi-tab synchronization
* a signed commit DAG for historical provenance
* `.hermes.json` for portable audit exports

The primary design principle is:

> Yjs determines document state. The Hermes commit DAG determines verifiable history.

Never merge these responsibilities.

---

# 2. Architectural Principles

## Rule 1 — Local-first

The editor must work without a network connection.

Core functionality must not require:

* cloud APIs
* authentication servers
* databases
* signaling servers
* external STUN/TURN services

Network services are optional enhancements.

The following must work completely offline:

* create document
* edit document
* save document
* reopen document
* create signed commits
* verify commits
* inspect history
* export `.hermes.json`

---

## Rule 2 — Yjs is the document-state authority

Yjs is the source of truth for live document content.

TipTap renders and manipulates the Yjs-backed document.

Never maintain a second independent text state such as:

```text
React state → authoritative document text
```

Do not use:

```typescript
setText(remoteText)
```

to process remote collaboration changes.

Remote changes must enter through Yjs.

Correct flow:

```text
TipTap
  ↓
Yjs transaction
  ↓
Yjs update
  ↓
CRDT synchronization
  ↓
Yjs document
  ↓
TipTap
```

---

# 3. Signed Commit Model

Every committed local batch produces a SignedCommitNode.

Canonical structure:

```typescript
interface SignedCommitNode {
  version: 1;

  id: string;

  parentIds: string[];

  author: {
    fingerprint: string;
    publicKey: string;
  };

  timestamp: number;

  updateHash: string;
  updateBinary: string;

  signature: string;
}
```

`parentIds` must be an array because concurrent peers create divergent DAG branches.

Never assume that document history is linear.

---

# 4. Commit Construction

The commit pipeline is:

```text
Yjs update
    ↓
Batch buffer
    ↓
SHA-256(updateBinary)
    ↓
Construct canonical commit header
    ↓
SHA-256(canonical header)
    ↓
commit.id
    ↓
ECDSA P-256 signature
    ↓
SignedCommitNode
    ↓
IndexedDB
```

Commit boundaries:

* approximately 1500ms idle
* OR approximately 50 Yjs operations
* OR configured maximum update size

Never sign every keystroke individually.

Do not block the editor while waiting for a signature.

---

# 5. Canonical Serialization

Never construct cryptographic hashes using ambiguous string concatenation.

Do not use:

```text
parentId + updateHash + publicKey + timestamp
```

unless a formally specified canonical encoding guarantees unambiguous parsing.

The canonical commit representation must contain:

```text
version
parentIds
updateHash
author public key
timestamp
```

in a deterministic encoding.

The exact same bytes must be reconstructed by every verifier.

Any change to the canonical encoding requires a protocol version change.

---

# 6. Cryptographic Rules

Use WebCrypto:

```text
ECDSA
P-256
SHA-256
```

Identity generation must use a non-extractable private key where supported.

The private key must never be serialized into `.hermes.json`.

Only the public key is exported.

The fingerprint is derived from:

```text
SHA-256(publicKey)
```

using the documented fingerprint encoding.

The short fingerprint is an identifier, not a security boundary.

Never use the fingerprint alone for authentication.

---

# 7. Verification Rules

Every incoming commit must be verified before its Yjs update is applied.

Verification order:

```text
1. Validate schema
2. Decode updateBinary
3. Hash updateBinary
4. Compare updateHash
5. Reconstruct canonical commit header
6. Hash canonical header
7. Compare id
8. Import author public key
9. Verify ECDSA signature
10. Validate parent references
11. Accept commit
12. Apply Yjs update
```

If any step fails:

```text
reject commit
do not apply Yjs update
do not add commit to DAG
do not update heads
```

Never partially accept a failed commit.

---

# 8. DAG Rules

The history is a DAG.

Example:

```text
       A
      / \
     B   C
      \ /
       D
```

D has:

```typescript
parentIds: [B, C]
```

Never silently discard one branch.

During synchronization:

1. Exchange DAG heads.
2. Determine common ancestors.
3. Identify missing commits.
4. Transfer missing commits.
5. Verify every commit.
6. Insert verified commits.
7. Apply verified Yjs updates.
8. Update local heads.
9. Create a merge commit when required.

CRDT convergence and DAG convergence are related but separate concerns.

---

# 9. Yjs and DAG Relationship

The DAG records signed update batches.

Yjs determines the resulting document state.

Do not assume:

```text
one commit = one complete document state
```

A commit contains an incremental Yjs update.

The final document is reconstructed by applying the relevant valid Yjs updates.

---

# 10. Remote Synchronization

Supported transports:

### BroadcastChannel

Used for:

* same-origin multi-tab communication
* same-machine testing
* local optimization

### WebRTC

Used for:

* peer-to-peer collaboration
* LAN collaboration
* offline/local network collaboration

### Signaling server

Used only to establish WebRTC connections.

The signaling server must not become the authoritative document server.

Do not send document contents through signaling.

---

# 11. WebRTC Rules

After a DataChannel is established:

```text
identity exchange
      ↓
protocol version negotiation
      ↓
DAG head exchange
      ↓
ancestor discovery
      ↓
missing commit exchange
      ↓
commit verification
      ↓
Yjs application
      ↓
awareness synchronization
```

Never trust a peer merely because a WebRTC connection exists.

Every received commit must still be cryptographically verified.

---

# 12. Awareness

Yjs Awareness is ephemeral.

Use it for:

* cursor position
* text selection
* display name
* short fingerprint
* connection/presence state

Never store persistent document history in Awareness.

Awareness data must never be treated as signed audit evidence.

Cursor updates should be throttled to avoid excessive network traffic.

---

# 13. IndexedDB

IndexedDB is the primary persistent local storage.

Logical stores:

```text
documents
commits
heads
identities
metadata
```

Yjs persistence may use `y-indexeddb`.

The commit DAG must have its own persistence representation.

Do not assume that the Yjs IndexedDB store is sufficient to reconstruct the signed audit history.

---

# 14. Storage Integrity

Never mutate a persisted commit after insertion.

A commit is immutable.

If metadata changes, create a new commit.

Never overwrite:

```text
id
parentIds
author
timestamp
updateHash
updateBinary
signature
```

of an existing signed commit.

---

# 15. Export Format

`.hermes.json` is a portable audit bundle.

It should contain:

```text
format
version
document metadata
author public keys
commit nodes
DAG heads
final document state hash
export metadata
```

Private keys must never be exported.

The exported bundle must be independently verifiable without HermesDocs servers.

---

# 16. Verification CLI

The verifier must not depend on the web application.

Example:

```bash
hermes verify incident.hermes.json
```

Expected result should clearly distinguish:

```text
VALID
INVALID
INCOMPLETE
UNSUPPORTED_VERSION
```

A valid signature does not prove that the timestamp represents real-world time.

The verifier must not claim cryptographic proof of an event occurring at a particular physical time unless a trusted timestamping mechanism is introduced.

---

# 17. Provenance

MVP provenance is commit/operation-level.

Do not claim perfect character-level authorship unless an explicit provenance mechanism has been implemented and tested.

Preferred model:

```text
document operation
      ↓
Yjs transaction
      ↓
signed commit
      ↓
author fingerprint
      ↓
provenance UI
```

The UI may display:

* author fingerprint
* commit timestamp
* commit ID
* signature status
* parent commit
* verification status

---

# 18. Security Rules

Treat all network input as hostile.

Validate:

* message type
* protocol version
* document ID
* commit schema
* commit size
* update size
* parent references
* public key format
* signature format

Never execute received document content as code.

Never use `eval`.

Never trust:

* peer-provided author names
* peer-provided timestamps
* peer-provided fingerprints
* peer-provided commit IDs
* peer-provided hashes

All cryptographic values must be independently recomputed.

---

# 19. Error Handling

A failed peer operation must not corrupt local state.

If a commit fails verification:

```text
log verification failure
quarantine/reject commit
continue local operation
```

Do not crash the editor because a remote peer sent malformed data.

Network failure must not prevent local editing.

The editor must gracefully transition:

```text
CONNECTED
   ↓
DISCONNECTED
   ↓
OFFLINE
   ↓
RECONNECTING
   ↓
SYNCING
   ↓
CONNECTED
```

---

# 20. Dependency Rules

Keep packages decoupled.

Allowed conceptual dependency:

```text
UI
 ↓
Application
 ↓
Core
 ↓
Crypto / Storage / Sync
```

Do not allow:

```text
crypto → React
core → TipTap UI
verifier → React
storage → UI
```

The verifier must remain usable independently of the browser editor.

---

# 21. Testing Requirements

Every cryptographic component requires deterministic tests.

Minimum tests:

* Hash test: Same input must always produce same hash.
* Signature test: Valid signature verifies.
* Tampering test: Modified update fails.
* Metadata tampering test: Modified timestamp fails.
* Author tampering test: Modified public key fails.
* Parent tampering test: Modified parent list fails.
* DAG test: Concurrent branches merge correctly.
* Replay test: Duplicate commits do not corrupt state.
* Malicious peer test: Invalid commits are rejected.
* Offline test: Editor works with network disabled.
* Persistence test: Browser restart restores document.
* Partition test: Two peers edit independently and converge after reconnect.
* Export test: Exported bundle verifies independently.

---

# 22. Performance Rules

Do not perform expensive cryptographic or DAG operations synchronously on every keystroke.

Prefer:

```text
typing
 ↓
Yjs
 ↓
volatile buffer
 ↓
idle
 ↓
commit
 ↓
crypto
 ↓
IndexedDB
```

Large operations such as:

* paste
* import
* snapshot reconstruction
* full verification

must not unnecessarily block the editor UI.

---

# 23. UI Rules

The UI must communicate system state clearly.

At minimum show:

```text
● Local
● Syncing
● Connected
● Offline
● Verification failed
```

For signed content:

```text
✓ Verified
```

or:

```text
⚠ Unverified
```

Never show a green verification badge unless the underlying verification engine has actually validated the commit.

---

# 24. Architecture Boundaries

Do not combine these responsibilities:

```text
Yjs             = document convergence
Hermes DAG      = signed historical provenance
WebRTC          = transport
Awareness       = ephemeral presence
IndexedDB       = local persistence
WebCrypto       = identity/signatures
Verifier        = independent trust evaluation
```

---

# 25. Non-Negotiable Invariants

## ZERO-COST INVARIANT

HermesDocs core functionality MUST NOT depend on any paid
service, cloud backend, hosted database, hosted authentication
provider, paid API, paid TURN server, or proprietary infrastructure.

All core functionality must remain usable with:

- no Internet connection
- no cloud account
- no external database
- no hosted signaling service

Internet-based STUN/TURN infrastructure may exist only as an
optional development/remote-testing mode and must never be
required for LAN or air-gapped operation.

## AIR-GAPPED INVARIANT

Air-gapped mode must disable all external network dependencies.

In air-gapped mode:

- BroadcastChannel may be used for same-origin tabs.
- WebRTC host candidates may be used for LAN peers.
- Local signaling may be used for WebRTC negotiation.
- No public STUN server may be contacted.
- No TURN server may be contacted.
- No cloud API may be contacted.
- No telemetry may be transmitted.

The application must remain fully functional when the network
interface has no Internet connectivity.

The following must always remain true:

```text
LOCAL EDITING DOES NOT REQUIRE NETWORK
YJS IS THE SOURCE OF TRUTH FOR DOCUMENT STATE
SIGNED COMMITS ARE IMMUTABLE
REMOTE COMMITS ARE VERIFIED BEFORE YJS APPLICATION
PRIVATE KEYS ARE NEVER EXPORTED
SIGNALING DOES NOT CARRY AUTHORITATIVE DOCUMENT STATE
CRDT CONVERGENCE IS SEPARATE FROM DAG HISTORY
THE VERIFIER DOES NOT TRUST THE EDITOR
A FAILED SIGNATURE NEVER PRODUCES A VALID DOCUMENT UPDATE
PROTOCOL CHANGES ARE VERSIONED
```
