import { describe, it } from 'node:test';
import assert from 'node:assert';
import { CommitDAG, SignedCommitNode } from '../packages/core/src/index.js';

function createMockCommit(id: string, parentIds: string[], timestamp: number): SignedCommitNode {
  return {
    version: 1,
    id,
    parentIds,
    author: {
      fingerprint: 'hermes:testauthor001',
      publicKey: 'MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA...',
    },
    timestamp,
    updateHash: 'hash_' + id,
    updateBinary: 'update_' + id,
    signature: 'sig_' + id,
  };
}

describe('Hermes Commit DAG', () => {
  it('should maintain single head for linear commit sequence', () => {
    const dag = new CommitDAG();
    const c1 = createMockCommit('c1', [], 100);
    const c2 = createMockCommit('c2', ['c1'], 200);
    const c3 = createMockCommit('c3', ['c2'], 300);

    dag.insert(c1);
    assert.deepStrictEqual(dag.getHeads(), ['c1']);

    dag.insert(c2);
    assert.deepStrictEqual(dag.getHeads(), ['c2']);

    dag.insert(c3);
    assert.deepStrictEqual(dag.getHeads(), ['c3']);
    assert.strictEqual(dag.size(), 3);
  });

  it('should track multiple heads on concurrent branch divergence', () => {
    const dag = new CommitDAG();
    const root = createMockCommit('c0', [], 100);
    const branchA = createMockCommit('c1_a', ['c0'], 200);
    const branchB = createMockCommit('c1_b', ['c0'], 210);

    dag.insert(root);
    dag.insert(branchA);
    dag.insert(branchB);

    assert.deepStrictEqual(dag.getHeads().sort(), ['c1_a', 'c1_b'].sort());
  });

  it('should merge multiple heads into single head on merge commit', () => {
    const dag = new CommitDAG();
    const root = createMockCommit('c0', [], 100);
    const branchA = createMockCommit('c1_a', ['c0'], 200);
    const branchB = createMockCommit('c1_b', ['c0'], 210);
    const merge = createMockCommit('c2_merge', ['c1_a', 'c1_b'], 300);

    dag.insert(root);
    dag.insert(branchA);
    dag.insert(branchB);
    dag.insert(merge);

    assert.deepStrictEqual(dag.getHeads(), ['c2_merge']);
  });

  it('should correctly find lowest common ancestor (LCA)', () => {
    const dag = new CommitDAG();
    const root = createMockCommit('c0', [], 100);
    const a1 = createMockCommit('a1', ['c0'], 200);
    const a2 = createMockCommit('a2', ['a1'], 300);
    const b1 = createMockCommit('b1', ['c0'], 250);

    dag.insert(root);
    dag.insert(a1);
    dag.insert(a2);
    dag.insert(b1);

    const lca = dag.findCommonAncestor('a2', 'b1');
    assert.strictEqual(lca, 'c0');
  });

  it('should topologically sort DAG ensuring parents always precede children', () => {
    const dag = new CommitDAG();
    const c0 = createMockCommit('c0', [], 100);
    const c1 = createMockCommit('c1', ['c0'], 200);
    const c2 = createMockCommit('c2', ['c1'], 300);
    const c3 = createMockCommit('c3', ['c1'], 310);
    const c4 = createMockCommit('c4', ['c2', 'c3'], 400);

    // Insert out of order
    dag.insert(c4);
    dag.insert(c2);
    dag.insert(c0);
    dag.insert(c3);
    dag.insert(c1);

    const sorted = dag.topologicalSort();
    const idOrder = sorted.map((c) => c.id);

    assert.ok(idOrder.indexOf('c0') < idOrder.indexOf('c1'));
    assert.ok(idOrder.indexOf('c1') < idOrder.indexOf('c2'));
    assert.ok(idOrder.indexOf('c1') < idOrder.indexOf('c3'));
    assert.ok(idOrder.indexOf('c2') < idOrder.indexOf('c4'));
    assert.ok(idOrder.indexOf('c3') < idOrder.indexOf('c4'));
  });
});
