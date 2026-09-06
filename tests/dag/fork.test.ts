import { describe, it } from 'node:test';
import assert from 'node:assert';
import { CommitDAG, SignedCommitNode } from '../../packages/core/src/index.js';

function createMockCommit(id: string, parentIds: string[], timestamp: number): SignedCommitNode {
  return {
    version: 1,
    id,
    parentIds,
    author: {
      fingerprint: 'hermes:testauthor',
      publicKey: 'MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA...',
    },
    timestamp,
    updateHash: 'hash_' + id,
    updateBinary: 'binary_' + id,
    signature: 'sig_' + id,
  };
}

describe('Merkle DAG: Concurrent Forks & Branch Divergence', () => {
  it('should accurately maintain multiple independent heads during a 3-way fork', () => {
    const dag = new CommitDAG();
    const root = createMockCommit('root', [], 100);
    const branchA = createMockCommit('branch_a', ['root'], 200);
    const branchB = createMockCommit('branch_b', ['root'], 210);
    const branchC = createMockCommit('branch_c', ['root'], 220);

    dag.insert(root);
    dag.insert(branchA);
    dag.insert(branchB);
    dag.insert(branchC);

    const heads = dag.getHeads().sort();
    assert.deepStrictEqual(heads, ['branch_a', 'branch_b', 'branch_c']);
  });

  it('should find lowest common ancestor for divergent branches', () => {
    const dag = new CommitDAG();
    const c0 = createMockCommit('c0', [], 100);
    const c1 = createMockCommit('c1', ['c0'], 200);

    const a1 = createMockCommit('a1', ['c1'], 300);
    const a2 = createMockCommit('a2', ['a1'], 400);

    const b1 = createMockCommit('b1', ['c1'], 310);
    const b2 = createMockCommit('b2', ['b1'], 410);

    dag.insert(c0);
    dag.insert(c1);
    dag.insert(a1);
    dag.insert(a2);
    dag.insert(b1);
    dag.insert(b2);

    const lca = dag.findCommonAncestor('a2', 'b2');
    assert.strictEqual(lca, 'c1');
  });

  it('should merge 3 concurrent branches into a single unified head', () => {
    const dag = new CommitDAG();
    const root = createMockCommit('root', [], 100);
    const a = createMockCommit('a', ['root'], 200);
    const b = createMockCommit('b', ['root'], 210);
    const c = createMockCommit('c', ['root'], 220);
    const merge3 = createMockCommit('merge_all', ['a', 'b', 'c'], 300);

    dag.insert(root);
    dag.insert(a);
    dag.insert(b);
    dag.insert(c);
    dag.insert(merge3);

    assert.deepStrictEqual(dag.getHeads(), ['merge_all']);
    assert.strictEqual(dag.size(), 5);
  });
});
