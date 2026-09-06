import { SignedCommitNode } from '../types.js';

export interface DiffLine {
  type: 'added' | 'removed' | 'unchanged';
  text: string;
  lineNumber?: number;
}

export interface DiffSection {
  heading: string;
  level: number;
  addedCount: number;
  removedCount: number;
  lines: DiffLine[];
}

export interface CommitContext {
  commitId: string;
  parentIds: string[];
  authorFingerprint: string;
  authorPublicKey: string;
  timestamp: number;
  isMergeCommit: boolean;
  beforeText?: string;
  afterText?: string;
  addedLinesCount: number;
  removedLinesCount: number;
  modifiedSections: string[];
  rawDiffSummary: string;
}

export interface DiffContext {
  commitId: string;
  authorFingerprint: string;
  beforeText: string;
  afterText: string;
  diffLines: DiffLine[];
  sections: DiffSection[];
  addedCount: number;
  removedCount: number;
}

export interface HistoryContext {
  documentId: string;
  documentTitle: string;
  totalCommits: number;
  uniqueAuthors: string[];
  heads: string[];
  isDivergent: boolean;
  commitsSummary: Array<{
    id: string;
    shortId: string;
    parentIds: string[];
    author: string;
    timestamp: number;
    summary?: string;
    changesCount: number;
  }>;
  currentDocumentText: string;
}

export interface ConflictContext {
  commonAncestorId: string | null;
  commonAncestorText: string;
  branchA: {
    headCommitId: string;
    commits: SignedCommitNode[];
    text: string;
    modifiedSections: string[];
  };
  branchB: {
    headCommitId: string;
    commits: SignedCommitNode[];
    text: string;
    modifiedSections: string[];
  };
  overlappingSections: string[];
}

export interface AISuggestion {
  prompt: string;
  originalText: string;
  proposedText: string;
  summary: string;
  diffLines: DiffLine[];
}

export type AIProviderType = 'heuristic' | 'ollama' | 'cloud' | 'browser';

export interface AIProviderConfig {
  type: AIProviderType;
  endpoint?: string;
  apiKey?: string;
  model?: string;
}

export interface AIProvider {
  readonly id: string;
  readonly name: string;
  readonly type: AIProviderType;

  summarizeCommit(input: CommitContext): Promise<string>;
  explainDiff(input: DiffContext): Promise<string>;
  analyzeHistory(input: HistoryContext): Promise<string>;
  detectPotentialConflict(input: ConflictContext): Promise<string>;
  askHistoryQnA(question: string, context: HistoryContext): Promise<string>;
  suggestEdit?(prompt: string, currentContent: string): Promise<AISuggestion>;
}
