import { CommitDAG } from '../dag.js';
import { SignedCommitNode } from '../types.js';
import {
  AIProvider,
  AIProviderConfig,
  AISuggestion,
  CommitContext,
  ConflictContext,
  DiffContext,
  HistoryContext,
} from './types.js';
import {
  computeLineDiff,
  extractHeadings,
  findOverlappingSections,
  groupDiffBySections,
  reconstructDocumentAtCommit,
} from './diffUtils.js';
import { HeuristicAIProvider } from './heuristicProvider.js';
import { OllamaAIProvider } from './ollamaProvider.js';
import { CloudAIProvider } from './cloudProvider.js';
import { BrowserAIProvider } from './browserAIProvider.js';

export class HermesAIEngine {
  private provider: AIProvider;
  private summaryCache: Map<string, string> = new Map();
  private diffExplanationCache: Map<string, string> = new Map();

  constructor(config: AIProviderConfig = { type: 'heuristic' }) {
    this.provider = this.createProvider(config);
  }

  public setProvider(config: AIProviderConfig): void {
    this.provider = this.createProvider(config);
  }

  public getProvider(): AIProvider {
    return this.provider;
  }

  private createProvider(config: AIProviderConfig): AIProvider {
    switch (config.type) {
      case 'ollama':
        return new OllamaAIProvider(config.endpoint, config.model || 'llama3.2');
      case 'cloud':
        return new CloudAIProvider(
          config.apiKey || '',
          config.endpoint || 'https://api.openai.com/v1/chat/completions',
          config.model || 'gpt-4o-mini'
        );
      case 'browser':
        return new BrowserAIProvider();
      case 'heuristic':
      default:
        return new HeuristicAIProvider();
    }
  }

  /**
   * Generates or returns cached AI summary for a specific commit node.
   */
  public async summarizeCommit(commit: SignedCommitNode, dag: CommitDAG): Promise<string> {
    const cached = this.summaryCache.get(commit.id);
    if (cached) return cached;

    const context = this.buildCommitContext(commit, dag);
    const summary = await this.provider.summarizeCommit(context);
    this.summaryCache.set(commit.id, summary);
    return summary;
  }

  /**
   * Explains semantic and technical diffs introduced by a commit.
   */
  public async explainDiff(commit: SignedCommitNode, dag: CommitDAG): Promise<string> {
    const cached = this.diffExplanationCache.get(commit.id);
    if (cached) return cached;

    const context = this.buildDiffContext(commit, dag);
    const explanation = await this.provider.explainDiff(context);
    this.diffExplanationCache.set(commit.id, explanation);
    return explanation;
  }

  /**
   * Synthesizes overall document provenance and DAG history.
   */
  public async analyzeHistory(
    dag: CommitDAG,
    documentId: string,
    documentTitle: string,
    currentDocumentText: string
  ): Promise<string> {
    const context = await this.buildHistoryContext(dag, documentId, documentTitle, currentDocumentText);
    return this.provider.analyzeHistory(context);
  }

  /**
   * Analyzes two divergent branches in the Merkle DAG and predicts potential merge conflicts.
   */
  public async detectBranchConflict(
    headCommitIdA: string,
    headCommitIdB: string,
    dag: CommitDAG
  ): Promise<string> {
    const context = this.buildConflictContext(headCommitIdA, headCommitIdB, dag);
    return this.provider.detectPotentialConflict(context);
  }

  /**
   * Answers natural language questions about the document's Merkle DAG history.
   */
  public async askHistoryQnA(
    question: string,
    dag: CommitDAG,
    documentId: string,
    documentTitle: string,
    currentDocumentText: string
  ): Promise<string> {
    const context = await this.buildHistoryContext(dag, documentId, documentTitle, currentDocumentText);
    return this.provider.askHistoryQnA(question, context);
  }

  /**
   * Proposes an AI edit for human-in-the-loop review.
   */
  public async suggestEdit(prompt: string, currentContent: string): Promise<AISuggestion> {
    if (this.provider.suggestEdit) {
      return this.provider.suggestEdit(prompt, currentContent);
    }
    const heuristic = new HeuristicAIProvider();
    return heuristic.suggestEdit(prompt, currentContent);
  }

  // --- Context Builders ---

  public buildCommitContext(commit: SignedCommitNode, dag: CommitDAG): CommitContext {
    const isMerge = commit.parentIds.length > 1;
    let beforeText = '';

    if (commit.parentIds.length > 0) {
      beforeText = reconstructDocumentAtCommit(commit.parentIds[0], dag);
    }

    const afterText = reconstructDocumentAtCommit(commit.id, dag);
    const diffLines = computeLineDiff(beforeText, afterText);
    const sections = groupDiffBySections(diffLines);

    const added = diffLines.filter((l) => l.type === 'added').length;
    const removed = diffLines.filter((l) => l.type === 'removed').length;
    const modifiedSections = sections
      .filter((s) => s.addedCount > 0 || s.removedCount > 0)
      .map((s) => s.heading);

    const rawDiffSummary = diffLines
      .slice(0, 30)
      .map((l) => (l.type === 'added' ? '+ ' : l.type === 'removed' ? '- ' : '  ') + l.text)
      .join('\n');

    return {
      commitId: commit.id,
      parentIds: commit.parentIds,
      authorFingerprint: commit.author.fingerprint,
      authorPublicKey: commit.author.publicKey,
      timestamp: commit.timestamp,
      isMergeCommit: isMerge,
      beforeText,
      afterText,
      addedLinesCount: added,
      removedLinesCount: removed,
      modifiedSections,
      rawDiffSummary,
    };
  }

  public buildDiffContext(commit: SignedCommitNode, dag: CommitDAG): DiffContext {
    let beforeText = '';
    if (commit.parentIds.length > 0) {
      beforeText = reconstructDocumentAtCommit(commit.parentIds[0], dag);
    }

    const afterText = reconstructDocumentAtCommit(commit.id, dag);
    const diffLines = computeLineDiff(beforeText, afterText);
    const sections = groupDiffBySections(diffLines);

    return {
      commitId: commit.id,
      authorFingerprint: commit.author.fingerprint,
      beforeText,
      afterText,
      diffLines,
      sections,
      addedCount: diffLines.filter((l) => l.type === 'added').length,
      removedCount: diffLines.filter((l) => l.type === 'removed').length,
    };
  }

  public async buildHistoryContext(
    dag: CommitDAG,
    documentId: string,
    documentTitle: string,
    currentDocumentText: string
  ): Promise<HistoryContext> {
    const allCommits = dag.topologicalSort();
    const heads = dag.getHeads();
    const authors = Array.from(new Set(allCommits.map((c) => c.author.fingerprint)));

    const commitsSummary = await Promise.all(
      allCommits.map(async (c) => ({
        id: c.id,
        shortId: c.id.slice(0, 8),
        parentIds: c.parentIds,
        author: c.author.fingerprint,
        timestamp: c.timestamp,
        summary: this.summaryCache.get(c.id) || undefined,
        changesCount: 1,
      }))
    );

    return {
      documentId,
      documentTitle,
      totalCommits: allCommits.length,
      uniqueAuthors: authors,
      heads,
      isDivergent: heads.length > 1,
      commitsSummary,
      currentDocumentText,
    };
  }

  public buildConflictContext(
    headCommitIdA: string,
    headCommitIdB: string,
    dag: CommitDAG
  ): ConflictContext {
    const lca = dag.findCommonAncestor(headCommitIdA, headCommitIdB);
    const commonAncestorText = lca ? reconstructDocumentAtCommit(lca, dag) : '';

    const textA = reconstructDocumentAtCommit(headCommitIdA, dag);
    const textB = reconstructDocumentAtCommit(headCommitIdB, dag);

    const sectionsA = extractHeadings(textA);
    const sectionsB = extractHeadings(textB);

    const ancestorsA = dag.getAncestors(headCommitIdA);
    ancestorsA.add(headCommitIdA);
    const commitsA = dag.topologicalSort().filter((c) => ancestorsA.has(c.id));

    const ancestorsB = dag.getAncestors(headCommitIdB);
    ancestorsB.add(headCommitIdB);
    const commitsB = dag.topologicalSort().filter((c) => ancestorsB.has(c.id));

    const overlapping = findOverlappingSections(sectionsA, sectionsB);

    return {
      commonAncestorId: lca,
      commonAncestorText,
      branchA: {
        headCommitId: headCommitIdA,
        commits: commitsA,
        text: textA,
        modifiedSections: sectionsA,
      },
      branchB: {
        headCommitId: headCommitIdB,
        commits: commitsB,
        text: textB,
        modifiedSections: sectionsB,
      },
      overlappingSections: overlapping,
    };
  }
}
