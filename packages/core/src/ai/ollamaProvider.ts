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

export class OllamaAIProvider implements AIProvider {
  public readonly id = 'ollama_local';
  public readonly name = 'Ollama Local LLM (Zero-Cost / Private)';
  public readonly type = 'ollama' as const;
  private endpoint: string;
  private model: string;
  private fallback: HeuristicAIProvider;

  constructor(endpoint: string = 'http://localhost:11434', model: string = 'llama3.2') {
    this.endpoint = endpoint.replace(/\/+$/, '');
    this.model = model;
    this.fallback = new HeuristicAIProvider();
  }

  private async generate(prompt: string, system?: string): Promise<string> {
    try {
      const res = await fetch(`${this.endpoint}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: this.model,
          prompt,
          system:
            system ||
            'You are Hermes AI, an intelligent assistant analyzing a local-first cryptographically verifiable document Merkle DAG. Keep answers concise, factual, and formatted in Markdown.',
          stream: false,
        }),
      });

      if (!res.ok) {
        throw new Error(`Ollama returned status ${res.status}`);
      }

      const data = await res.json();
      return (data.response || '').trim();
    } catch (err) {
      console.warn('[Hermes AI] Ollama unavailable, using heuristic fallback:', err);
      return '';
    }
  }

  public async summarizeCommit(input: CommitContext): Promise<string> {
    const prompt = `Summarize this document commit in 1-2 clear sentences.
Commit ID: ${input.commitId}
Author: ${input.authorFingerprint}
Parents: ${input.parentIds.join(', ') || 'root'}
Added Lines: ${input.addedLinesCount}
Removed Lines: ${input.removedLinesCount}
Modified Sections: ${input.modifiedSections.join(', ') || 'General content'}
Raw Diff:
${input.rawDiffSummary.slice(0, 1000)}`;

    const response = await this.generate(prompt);
    return response || this.fallback.summarizeCommit(input);
  }

  public async explainDiff(input: DiffContext): Promise<string> {
    const prompt = `Analyze this commit diff and explain the semantic and technical modifications made.
Commit ID: ${input.commitId}
Author: ${input.authorFingerprint}
Net Lines: +${input.addedCount} / -${input.removedCount}
Diff Preview:
${input.diffLines
  .slice(0, 50)
  .map((l) => (l.type === 'added' ? '+ ' : l.type === 'removed' ? '- ' : '  ') + l.text)
  .join('\n')}`;

    const response = await this.generate(prompt);
    return response || this.fallback.explainDiff(input);
  }

  public async analyzeHistory(input: HistoryContext): Promise<string> {
    const prompt = `Provide an executive provenance summary of this document's Merkle DAG history.
Title: ${input.documentTitle}
Total Commits: ${input.totalCommits}
Authors: ${input.uniqueAuthors.join(', ')}
Heads: ${input.heads.join(', ')}
Recent Commits:
${JSON.stringify(input.commitsSummary.slice(-5), null, 2)}`;

    const response = await this.generate(prompt);
    return response || this.fallback.analyzeHistory(input);
  }

  public async detectPotentialConflict(input: ConflictContext): Promise<string> {
    const prompt = `Analyze these two concurrent DAG branches and predict if there are semantic conflicts when merging:
Branch A Head: ${input.branchA.headCommitId} (Sections: ${input.branchA.modifiedSections.join(', ')})
Branch B Head: ${input.branchB.headCommitId} (Sections: ${input.branchB.modifiedSections.join(', ')})
Overlapping Sections: ${input.overlappingSections.join(', ') || 'None'}`;

    const response = await this.generate(prompt);
    return response || this.fallback.detectPotentialConflict(input);
  }

  public async askHistoryQnA(question: string, context: HistoryContext): Promise<string> {
    const prompt = `Answer the following question about the document's history and Merkle DAG:
Question: ${question}

Context:
Title: ${context.documentTitle}
Total Commits: ${context.totalCommits}
Authors: ${context.uniqueAuthors.join(', ')}
Heads: ${context.heads.join(', ')}
Recent Commits: ${JSON.stringify(context.commitsSummary.slice(-5))}
Current Document Snippet:
${context.currentDocumentText.slice(0, 1500)}`;

    const response = await this.generate(prompt);
    return response || this.fallback.askHistoryQnA(question, context);
  }

  public async suggestEdit(prompt: string, currentContent: string): Promise<AISuggestion> {
    const system =
      'You are a technical document editor. Return ONLY the updated Markdown document without chat conversational filler.';
    const userPrompt = `Instruction: ${prompt}\n\nCurrent Document:\n${currentContent}`;

    const response = await this.generate(userPrompt, system);
    const proposed = response || currentContent;

    return {
      prompt,
      originalText: currentContent,
      proposedText: proposed,
      summary: `AI edit proposal for "${prompt.slice(0, 30)}..."`,
      diffLines: computeLineDiff(currentContent, proposed),
    };
  }
}
