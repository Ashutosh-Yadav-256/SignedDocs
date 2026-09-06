# HermesDocs 📜✨

> **Local-First, Cryptographically Verifiable Collaborative Markdown Editor**  
> Powered by TipTap, Yjs CRDTs, WebCrypto Signed Merkle DAG, IndexedDB, and WebRTC. Built with $0 infrastructure costs.

---

## 🏛️ Four Independent Concerns

1. **Document State** → TipTap + Yjs CRDT
2. **Cryptographic History** → Signed Commit Merkle DAG (ECDSA P-256 + SHA-256)
3. **Peer Synchronization** → WebRTC DataChannels + BroadcastChannel
4. **Independent Verification** → Standalone CLI & Browser Verifier (`.hermes.json`)

---

## 🚀 Getting Started

### 1. Install Dependencies
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

### 4. Run Automated Test Suite
```bash
npm test
```

### 5. Audit an Exported `.hermes.json` Bundle via CLI
```bash
npm run verify path/to/document.hermes.json
```

---

## 📦 Monorepo Structure

```
hermesdocs/
├── packages/
│   ├── crypto/         # WebCrypto ECDSA P-256, SHA-256, canonical serialization
│   ├── core/           # Document model, SignedCommitNode, Merkle DAG, Commit Pipeline, Verifier
│   ├── protocol/       # Wire format, sync handshake messages, schemas, constants
│   ├── storage/        # IndexedDB storage for docs, commits, DAG heads, and identity
│   └── sync/           # BroadcastChannel & WebRTC transports, handshake engine, awareness
├── apps/
│   ├── web/            # Vite + React 18 + TipTap + Yjs + Tailwind CSS + Visual DAG UI
│   ├── signal/         # Zero-cost lightweight WebSocket signaling server for peer discovery
│   └── verifier/       # Standalone Node.js CLI verifier for .hermes.json audit bundles
├── tests/              # Cryptographic, DAG, tampering, and verification test suites
├── docs/               # Architecture, Cryptography, Protocol, and Zero-Cost specifications
├── SKILL.md            # Agent skill definition for HermesDocs
└── package.json        # Monorepo root with npm workspaces
```

---

## 🛡️ Non-Negotiable Invariants

- **Local Editing Does Not Require Network**: 100% functional offline in browser.
- **Yjs is the Document State Authority**: CRDT handles live convergence; DAG handles signed provenance.
- **Signed Commits are Immutable**: Cryptographic Merkle DAG nodes cannot be altered without failing verification.
- **Remote Commits are Verified Before Yjs Application**: Inbound peer updates are verified with ECDSA P-256 before applying to the document.
- **Private Keys are Never Exported**: Only public keys and signatures exist in `.hermes.json`.
- **Signaling Does Not Carry Document State**: Transports are zero-knowledge relays.

---

## 📜 License
MIT
