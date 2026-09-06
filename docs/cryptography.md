# HermesDocs Cryptographic Specification

## 1. Cryptographic Primitives

HermesDocs relies entirely on standard, modern WebCrypto APIs available across all modern web browsers and Node.js:

| Primitive | Standard | Usage |
| :--- | :--- | :--- |
| **Signature Scheme** | ECDSA P-256 (secp256r1) | Author identity & commit authentication |
| **Digest Algorithm** | SHA-256 (FIPS 180-4) | Update hashing & commit ID derivation |
| **Fingerprint Format** | `hermes:<16-char-hex>` | Deterministic prefix of `SHA-256(SPKI_PublicKey)` |
| **Canonical Encoding** | Deterministic JSON (RFC 8785) | Canonical header byte equality across platforms |

---

## 2. Canonical Commit Header

To guarantee unambiguous hashing and cross-platform byte reproducibility, commit headers are canonicalized with strictly sorted keys and unformatted JSON:

```json
{
  "authorPublicKey": "<SPKI Base64>",
  "parentIds": ["<ParentId1>", "<ParentId2>"],
  "timestamp": 1741219200000,
  "updateHash": "<SHA-256 Hex of update binary>",
  "version": 1
}
```

- **Commit ID**: `SHA-256(canonicalHeaderBytes)`
- **Commit Signature**: `ECDSA_P256_Sign(privateKey, canonicalHeaderBytes)`

---

## 3. Strict Verification Pipeline

Every incoming commit node must pass 9 discrete validation checks before its CRDT update is applied:

1. **Schema Validation**: Validates fields, types, and protocol version 1.
2. **Binary Decoding**: Decodes `updateBinary` from Base64.
3. **Hash Matching**: Verifies `SHA-256(decodedBytes) === commit.updateHash`.
4. **Header Reconstruction**: Builds canonical header using `updateHash`, `author.publicKey`, `parentIds`, `timestamp`, `version`.
5. **Commit ID Verification**: Verifies `SHA-256(reconstructedHeader) === commit.id`.
6. **Author Fingerprint Check**: Verifies `deriveFingerprint(author.publicKey) === commit.author.fingerprint`.
7. **ECDSA Signature Verification**: Validates `ECDSA_Verify(author.publicKey, commit.signature, reconstructedHeader)`.
8. **DAG Cycle & Reference Check**: Confirms acyclicity and parent relationships.
9. **CRDT Application**: Only after all checks pass is `Y.applyUpdate(ydoc, updateBytes)` executed.
