# SignedDocs (Hermes Protocol) 📜✨

> **A local-first P2P collaboration system with cryptographically verifiable history.**  
> SignedDocs enables peers to collaboratively create, edit, and synchronize documents without a central document server. Every modification is represented in a cryptographically signed, tamper-evident Merkle DAG that can be independently audited and verified offline.

---

## 🏛️ Core Architecture & Independent Concerns

SignedDocs strictly isolates document synchronization, cryptographic truth, intelligence, and network transport:

```text
                           SIGNEDDOCS
                               │
            ┌──────────────────┼──────────────────┐
            ▼                  ▼                  ▼
     Document State       Merkle DAG          P2P Sync
   (TipTap + Yjs CRDT) (ECDSA P-256 / SHA-256) (WebRTC / BroadcastChannel)
            │                  │                  │
            └──────────────────┼──────────────────┘
                               │
                      Commit Pipeline
                               │
            ┌──────────────────┴──────────────────┐
            ▼                                     ▼
  Independent Verifier                   AI Intelligence Layer
 (Standalone CLI / Browser)           (Provenance / Diff Reasoning)
```

| Layer | Responsibility | Technology | Authority Guarantee |
| :--- | :--- | :--- | :--- |
| **1. Document State** | Real-time editing & non-blocking convergence | TipTap + Yjs CRDT | Local memory + IndexedDB |
| **2. Cryptographic History** | Immutable, signed provenance chain | Merkle DAG (ECDSA P-256 + SHA-256) | Math & Public-Key Cryptography |
| **3. AI Provenance & History** | Semantic diff analysis, DAG Q&A, conflict detection | Hermes AI Engine (Heuristic / Ollama / Cloud) | Untrusted derived insights |
| **4. P2P Transport & Chunks** | Direct DataChannels & content-addressed transfer | WebRTC + BroadcastChannel + Chunk Manifests | Zero-knowledge peer routing |
| **5. Independent Verification** | Portable proof auditing without servers | Standalone Node.js CLI & Browser Verifier | `.signeddocs.json` validation |

---

## 🛡️ Zero-Knowledge Signaling vs. Document Storage

- **No Centralized Document Server**: Document content, keys, history, and CRDT states exist **only** on client devices (IndexedDB) and travel directly over encrypted WebRTC DataChannels.
- **Signaling is a Zero-Knowledge Relay**: The lightweight signaling component (`apps/signal`) carries **only** WebRTC SDP offer/answer handshakes and ICE candidates. It never receives, parses, or stores document data.

---

## 🤖 AI Provenance Chain & Trust Boundary

AI suggestions are treated as **untrusted derived data**. When AI assists with document modifications, SignedDocs records an immutable **AI Provenance Manifest**:

```json
{
  "modelIdentifier": "ollama:llama3.2",
  "promptHash": "sha256:e3b0c442...",
  "contextSnapshotHash": "sha256:8f91a2b3...",
  "outputHash": "sha256:7c8d9e0f...",
  "generatedAt": 1788691200000,
  "approval": {
    "reviewerFingerprint": "hermes:a91f2c4b8e...",
    "approvedAt": 1788691205000
  }
}
```

> **The Invariant:** AI never signs commits directly. AI-generated text requires human authorization, entering via Yjs and being signed by the human author's WebCrypto ECDSA private key before entering the Merkle DAG.

---

## 🚀 Quick Start

### 1. Install Monorepo Dependencies
```bash
npm install
```

### 2. Start Web Application
```bash
npm run dev
```
Open `http://localhost:5173` in your browser.

### 3. (Optional) Start Local WebRTC Signaling Relay
```bash
npm run signal:dev
```

### 4. Run the Full Test Suite
```bash
npm test
```

### 5. Audit an Exported Bundle via Standalone CLI
```bash
npm run verify path/to/document.signeddocs.json
```

---

## 📦 Monorepo Structure

```text
SignedDocs/
├── packages/
│   ├── crypto/         # WebCrypto ECDSA P-256, SHA-256, canonical serialization
│   ├── core/           # SignedCommitNode, Merkle DAG, Commit Pipeline, AI Engine, Chunking, Verifier
│   ├── protocol/       # Wire formats, sync messages, AI provenance schemas, constants
│   ├── storage/        # IndexedDB persistent storage for docs, commits, DAG heads, identities
│   └── sync/           # BroadcastChannel & WebRTC transports, handshake engine, awareness
├── apps/
│   ├── web/            # Vite + React 18 + TipTap + Yjs + Tailwind CSS + Visual DAG + AI Assistant
│   ├── signal/         # Zero-knowledge lightweight WebSocket signaling relay with HTTP health checks
│   └── verifier/       # Standalone Node.js CLI verifier for .signeddocs.json bundles
├── tests/
│   ├── crypto/         # Cryptographic primitives, canonicalization, and identity tests
│   ├── dag/            # Merkle DAG forks, merges, LCA, and topological ordering tests
│   ├── sync/           # Network partition, reconnection, and multi-peer convergence tests
│   ├── security/       # 1-bit mutation tampering, signature forgery, and malicious peer tests
│   └── ai/             # AI provenance chain, semantic diffs, and conflict reasoning tests
├── docs/               # Specifications for Architecture, Cryptography, Protocol, and Zero-Cost Design
├── render.yaml         # One-click Render.com deployment configuration for signaling relay
├── SKILL.md            # Architecture invariants & AI Trust Boundary specification
└── package.json        # Monorepo root configuration
```

---

## 🛡️ Non-Negotiable Invariants

1. **Local Editing Does Not Require Network**: 100% functional offline in browser.
2. **Yjs is the Document State Authority**: CRDT handles live convergence; DAG handles signed provenance.
3. **Signed Commits are Immutable**: Cryptographic Merkle DAG nodes cannot be altered without failing verification.
4. **Remote Commits are Verified Before Yjs Application**: Inbound peer updates are verified with ECDSA P-256 before applying to the document.
5. **Private Keys are Never Exported**: Only public keys and signatures exist in exported bundles.
6. **Signaling Does Not Carry Document State**: Transports are zero-knowledge relays.
7. **AI is an Untrusted Derived Data Layer**: AI cannot determine cryptographic authenticity or bypass human signing.

---

## 📜 License
MIT
