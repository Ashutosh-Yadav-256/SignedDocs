import {
  AIProvider,
  AISuggestion,
  CommitContext,
  ConflictContext,
  DiffContext,
  HistoryContext,
} from './types.js';
import { HeuristicAIProvider } from './heuristicProvider.js';
import { computeLineDiff } from './diffUtils.js';

/**
 * In-browser native AI provider leveraging `window.ai` (Chrome Prompt API) where available,
 * falling back automatically to heuristic intelligence.
 */
export class BrowserAIProvider implements AIProvider {
  public readonly id = 'browser_native';
  public readonly name = 'In-Browser Native AI (Prompt API)';
  public readonly type = 'browser' as const;
  private fallback: HeuristicAIProvider;

  constructor() {
    this.fallback = new HeuristicAIProvider();
  }

  private async generate(prompt: string): Promise<string> {
    if (typeof window !== 'undefined' && (window as any).ai?.languageModel) {
      try {
        const session = await (window as any).ai.languageModel.create();
        const result = await session.prompt(prompt);
        session.destroy();
        return (result || '').trim();
      } catch (err) {
        console.warn('[Hermes AI] Browser native AI error, falling back to heuristic:', err);
      }
    }
    return '';
  }

  public async summarizeCommit(input: CommitContext): Promise<string> {
    const prompt = `Summarize this commit concisely in 1 sentence: ${input.commitId} by ${input.authorFingerprint}. Sections: ${input.modifiedSections.join(', ')}`;
    const res = await this.generate(prompt);
    return res || this.fallback.summarizeCommit(input);
  }

  public async explainDiff(input: DiffContext): Promise<string> {
    const prompt = `Explain what changed in this commit diff in Markdown: Net +${input.addedCount} / -${input.removedCount} lines.`;
    const res = await this.generate(prompt);
    return res || this.fallback.explainDiff(input);
  }

  public async analyzeHistory(input: HistoryContext): Promise<string> {
    const prompt = `Summarize this document's Merkle DAG history with ${input.totalCommits} commits.`;
    const res = await this.generate(prompt);
    return res || this.fallback.analyzeHistory(input);
  }

  public async detectPotentialConflict(input: ConflictContext): Promise<string> {
    const prompt = `Analyze if there are conflicts merging Branch A (${input.branchA.headCommitId}) and Branch B (${input.branchB.headCommitId}). Overlapping sections: ${input.overlappingSections.join(', ')}`;
    const res = await this.generate(prompt);
    return res || this.fallback.detectPotentialConflict(input);
  }

  public async askHistoryQnA(question: string, context: HistoryContext): Promise<string> {
    const prompt = `Answer this question about the document Merkle DAG: "${question}". Document: ${context.documentTitle}`;
    const res = await this.generate(prompt);
    return res || this.fallback.askHistoryQnA(question, context);
  }

  public async suggestEdit(prompt: string, currentContent: string): Promise<AISuggestion> {
    const res = await this.generate(`Instruction: ${prompt}\n\nDocument:\n${currentContent}`);
    const proposed = res || currentContent;
    return {
      prompt,
      originalText: currentContent,
      proposedText: proposed,
      summary: `AI edit proposal for "${prompt.slice(0, 30)}..."`,
      diffLines: computeLineDiff(currentContent, proposed),
    };
  }
}
