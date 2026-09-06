import { describe, it } from 'node:test';
import assert from 'node:assert';
import * as Y from 'yjs';
import {
  CommitDAG,
  computeLineDiff,
  groupDiffBySections,
  HeuristicAIProvider,
  HermesAIEngine,
  SignedCommitNode,
} from '../packages/core/src/index.js';
import { uint8ArrayToBase64 } from '../packages/crypto/src/index.js';

function createYjsCommit(
  id: string,
  parentIds: string[],
  textToAdd: string,
  authorFingerprint: string = 'hermes:alice_test',
  timestamp: number = 1000
): SignedCommitNode {
  const doc = new Y.Doc();
  const ytext = doc.getText('tiptap');
  ytext.insert(0, textToAdd);
  const update = Y.encodeStateAsUpdate(doc);
  const updateBinary = uint8ArrayToBase64(update);

  return {
    version: 1,
    id,
    parentIds,
    author: {
      fingerprint: authorFingerprint,
      publicKey: 'MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA...',
    },
    timestamp,
    updateHash: 'hash_' + id,
    updateBinary,
    signature: 'sig_' + id,
  };
}

describe('Hermes AI Intelligence Layer', () => {
  it('should compute deterministic line diffs and section groups', () => {
    const before = '# Title\n\nIntro paragraph.\n\n## Auth\nOld auth text.';
    const after = '# Title\n\nIntro paragraph.\n\n## Auth\nNew JWT auth text.\n\n## API\nAPI details.';

    const diff = computeLineDiff(before, after);
    assert.ok(diff.some((l) => l.type === 'added' && l.text.includes('New JWT auth')));
    assert.ok(diff.some((l) => l.type === 'removed' && l.text.includes('Old auth text.')));

    const sections = groupDiffBySections(diff);
    assert.ok(sections.some((s) => s.heading === 'Auth' && s.addedCount > 0));
    assert.ok(sections.some((s) => s.heading === 'API' && s.addedCount > 0));
  });

  it('should summarize root, incremental, and merge commits accurately', async () => {
    const provider = new HeuristicAIProvider();

    // 1. Root commit
    const rootSummary = await provider.summarizeCommit({
      commitId: 'commit_001',
      parentIds: [],
      authorFingerprint: 'hermes:alice_01',
      authorPublicKey: 'key_alice',
      timestamp: 1000,
      isMergeCommit: false,
      afterText: '# Document\nFirst line',
      addedLinesCount: 2,
      removedLinesCount: 0,
      modifiedSections: ['Document'],
      rawDiffSummary: '+ # Document\n+ First line',
    });
    assert.ok(rootSummary.includes('Initial document root'));

    // 2. Incremental commit
    const incSummary = await provider.summarizeCommit({
      commitId: 'commit_002',
      parentIds: ['commit_001'],
      authorFingerprint: 'hermes:bob_02',
      authorPublicKey: 'key_bob',
      timestamp: 2000,
      isMergeCommit: false,
      addedLinesCount: 15,
      removedLinesCount: 3,
      modifiedSections: ['Authentication'],
      rawDiffSummary: '+ JWT auth token',
    });
    assert.ok(incSummary.includes('Authentication'));
    assert.ok(incSummary.includes('+15 / -3 lines'));

    // 3. Merge commit
    const mergeSummary = await provider.summarizeCommit({
      commitId: 'commit_003',
      parentIds: ['commit_002a', 'commit_002b'],
      authorFingerprint: 'hermes:alice_01',
      authorPublicKey: 'key_alice',
      timestamp: 3000,
      isMergeCommit: true,
      addedLinesCount: 0,
      removedLinesCount: 0,
      modifiedSections: [],
      rawDiffSummary: '',
    });
    assert.ok(mergeSummary.includes('Merged 2 divergent branches'));
  });

  it('should detect branch conflicts between concurrent DAG heads', async () => {
    const provider = new HeuristicAIProvider();

    // Overlapping conflict case
    const conflictReport = await provider.detectPotentialConflict({
      commonAncestorId: 'c0',
      commonAncestorText: '# Spec\nBase content',
      branchA: {
        headCommitId: 'cA',
        commits: [],
        text: '# Spec\n## Security\nAlice security edits',
        modifiedSections: ['Security'],
      },
      branchB: {
        headCommitId: 'cB',
        commits: [],
        text: '# Spec\n## Security\nBob security edits',
        modifiedSections: ['Security'],
      },
      overlappingSections: ['Security'],
    });
    assert.ok(conflictReport.includes('Potential Semantic Conflict Detected'));
    assert.ok(conflictReport.includes('Security'));

    // Clean non-overlapping case
    const cleanReport = await provider.detectPotentialConflict({
      commonAncestorId: 'c0',
      commonAncestorText: '# Spec\nBase content',
      branchA: {
        headCommitId: 'cA',
        commits: [],
        text: '# Spec\n## Documentation\nAlice docs',
        modifiedSections: ['Documentation'],
      },
      branchB: {
        headCommitId: 'cB',
        commits: [],
        text: '# Spec\n## API Reference\nBob API',
        modifiedSections: ['API Reference'],
      },
      overlappingSections: [],
    });
    assert.ok(cleanReport.includes('Clean Non-Overlapping Merge Predicted'));
  });

  it('should answer History Q&A questions using DAG context', async () => {
    const provider = new HeuristicAIProvider();
    const context = {
      documentId: 'doc_123',
      documentTitle: 'System Architecture',
      totalCommits: 5,
      uniqueAuthors: ['hermes:alice', 'hermes:bob'],
      heads: ['head_a', 'head_b'],
      isDivergent: true,
      commitsSummary: [
        {
          id: 'c1',
          shortId: 'c1',
          parentIds: [],
          author: 'hermes:alice',
          timestamp: 1000,
          summary: 'Initial architecture document',
          changesCount: 1,
        },
      ],
      currentDocumentText: '# System Architecture\nSpecs',
    };

    const authorsAns = await provider.askHistoryQnA('Who wrote this document?', context);
    assert.ok(authorsAns.includes('hermes:alice'));

    const branchAns = await provider.askHistoryQnA('Are there any branches active?', context);
    assert.ok(branchAns.includes('2 active heads'));
  });

  it('should orchestrate AI engine and cache commit summaries', async () => {
    const engine = new HermesAIEngine({ type: 'heuristic' });
    const dag = new CommitDAG();

    const c1 = createYjsCommit('c1', [], '# Hermes Docs\nInitial text\n', 'hermes:author_1', 100);
    const c2 = createYjsCommit('c2', ['c1'], '## Security\nSigned commits\n', 'hermes:author_2', 200);

    dag.insert(c1);
    dag.insert(c2);

    const summary1 = await engine.summarizeCommit(c1, dag);
    assert.ok(summary1.includes('Initial document root'));

    // Second call should return cached result instantly
    const summary1Cached = await engine.summarizeCommit(c1, dag);
    assert.strictEqual(summary1, summary1Cached);

    const diffExpl = await engine.explainDiff(c2, dag);
    assert.ok(diffExpl.includes('Semantic Change Analysis'));
  });
});
