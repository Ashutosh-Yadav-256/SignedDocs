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

export class CloudAIProvider implements AIProvider {
  public readonly id = 'cloud_api';
  public readonly name = 'Cloud API (Gemini / OpenAI / Groq)';
  public readonly type = 'cloud' as const;
  private endpoint: string;
  private apiKey: string;
  private model: string;
  private fallback: HeuristicAIProvider;

  constructor(
    apiKey: string,
    endpoint: string = 'https://api.openai.com/v1/chat/completions',
    model: string = 'gpt-4o-mini'
  ) {
    this.apiKey = apiKey;
    this.endpoint = endpoint;
    this.model = model;
    this.fallback = new HeuristicAIProvider();
  }

  private async generate(prompt: string, system?: string): Promise<string> {
    if (!this.apiKey) {
      return '';
    }

    try {
      const res = await fetch(this.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: this.model,
          messages: [
            {
              role: 'system',
              content:
                system ||
                'You are Hermes AI, analyzing a local-first cryptographically verifiable document Merkle DAG. Be concise, factual, and format in Markdown.',
            },
            {
              role: 'user',
              content: prompt,
            },
          ],
          temperature: 0.2,
        }),
      });

      if (!res.ok) {
        throw new Error(`Cloud API returned status ${res.status}`);
      }

      const data = await res.json();
      return (data.choices?.[0]?.message?.content || '').trim();
    } catch (err) {
      console.warn('[Hermes AI] Cloud API call failed, falling back to heuristic:', err);
      return '';
    }
  }

  public async summarizeCommit(input: CommitContext): Promise<string> {
    const prompt = `Summarize this document commit in 1-2 concise sentences.
Commit ID: ${input.commitId}
Author: ${input.authorFingerprint}
Parents: ${input.parentIds.join(', ') || 'root'}
Lines: +${input.addedLinesCount} / -${input.removedLinesCount}
Sections: ${input.modifiedSections.join(', ') || 'General'}`;

    const response = await this.generate(prompt);
    return response || this.fallback.summarizeCommit(input);
  }

  public async explainDiff(input: DiffContext): Promise<string> {
    const prompt = `Explain the key modifications in this commit diff in Markdown bullet points:
Commit: ${input.commitId}
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
    const prompt = `Provide an overview of this document's Merkle DAG history and author provenance:
Title: ${input.documentTitle}
Commits: ${input.totalCommits}
Authors: ${input.uniqueAuthors.join(', ')}
Heads: ${input.heads.join(', ')}`;

    const response = await this.generate(prompt);
    return response || this.fallback.analyzeHistory(input);
  }

  public async detectPotentialConflict(input: ConflictContext): Promise<string> {
    const prompt = `Predict any semantic merge conflicts between these two branches:
Branch A (${input.branchA.headCommitId}): Modified sections ${input.branchA.modifiedSections.join(', ')}
Branch B (${input.branchB.headCommitId}): Modified sections ${input.branchB.modifiedSections.join(', ')}
Overlapping: ${input.overlappingSections.join(', ') || 'None'}`;

    const response = await this.generate(prompt);
    return response || this.fallback.detectPotentialConflict(input);
  }

  public async askHistoryQnA(question: string, context: HistoryContext): Promise<string> {
    const prompt = `Answer this question about the document's Merkle DAG history:
Question: ${question}
Document: ${context.documentTitle} (${context.totalCommits} commits, Authors: ${context.uniqueAuthors.join(', ')})`;

    const response = await this.generate(prompt);
    return response || this.fallback.askHistoryQnA(question, context);
  }

  public async suggestEdit(prompt: string, currentContent: string): Promise<AISuggestion> {
    const system =
      'You are a technical document editor. Return ONLY the revised Markdown text without any conversational preamble.';
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
