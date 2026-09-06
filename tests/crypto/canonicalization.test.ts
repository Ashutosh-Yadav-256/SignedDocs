import { describe, it } from 'node:test';
import assert from 'node:assert';
import {
  serializeCanonicalHeader,
  computeCommitId,
  CanonicalCommitHeader,
} from '../../packages/crypto/src/index.js';

describe('Crypto: Deterministic Canonicalization (RFC 8785)', () => {
  it('should serialize identical object regardless of property key insertion order', async () => {
    const header1: CanonicalCommitHeader = {
      version: 1,
      parentIds: ['parent_a', 'parent_b'],
      updateHash: 'hash_123',
      authorPublicKey: 'key_xyz',
      timestamp: 1788691200000,
    };

    const header2: CanonicalCommitHeader = {
      timestamp: 1788691200000,
      authorPublicKey: 'key_xyz',
      updateHash: 'hash_123',
      parentIds: ['parent_a', 'parent_b'],
      version: 1,
    };

    const bytes1 = serializeCanonicalHeader(header1);
    const bytes2 = serializeCanonicalHeader(header2);

    assert.deepStrictEqual(Array.from(bytes1), Array.from(bytes2));

    const id1 = await computeCommitId(header1);
    const id2 = await computeCommitId(header2);
    assert.strictEqual(id1, id2);
  });

  it('should produce different IDs when timestamp or parentIds change', async () => {
    const headerBase: CanonicalCommitHeader = {
      version: 1,
      parentIds: ['p1'],
      updateHash: 'h1',
      authorPublicKey: 'k1',
      timestamp: 1000,
    };

    const headerDiffTime: CanonicalCommitHeader = {
      ...headerBase,
      timestamp: 1001,
    };

    const headerDiffParents: CanonicalCommitHeader = {
      ...headerBase,
      parentIds: ['p2'],
    };

    const idBase = await computeCommitId(headerBase);
    const idTime = await computeCommitId(headerDiffTime);
    const idParents = await computeCommitId(headerDiffParents);

    assert.notStrictEqual(idBase, idTime);
    assert.notStrictEqual(idBase, idParents);
  });
});
