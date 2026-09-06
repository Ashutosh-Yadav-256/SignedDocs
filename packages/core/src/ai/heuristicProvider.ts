import {
  AIProvider,
  AISuggestion,
  CommitContext,
  ConflictContext,
  DiffContext,
  HistoryContext,
} from './types.js';
import { computeLineDiff } from './diffUtils.js';

/**
 * Built-in zero-cost, air-gapped, zero-latency heuristic AI intelligence provider.
 * Requires no external API, no GPU, no network, and operates 100% offline.
 */
export class HeuristicAIProvider implements AIProvider {
  public readonly id = 'heuristic_local';
  public readonly name = 'Built-in Offline Analyzer (Zero-Cost)';
  public readonly type = 'heuristic' as const;

  public async summarizeCommit(input: CommitContext): Promise<string> {
    const authorShort = input.authorFingerprint.slice(0, 10);
    const shortId = input.commitId.slice(0, 8);

    if (input.isMergeCommit) {
      return `Merged ${input.parentIds.length} divergent branches (${input.parentIds.map((p) => p.slice(0, 6)).join(', ')}) into commit #${shortId} with cryptographic verification.`;
    }

    if (input.parentIds.length === 0) {
      const lineCount = (input.afterText || '').split('\n').length;
      return `Initial document root commit #${shortId} created by ${authorShort} containing ${lineCount} lines.`;
    }

    const added = input.addedLinesCount;
    const removed = input.removedLinesCount;
    const sections = input.modifiedSections;

    let summaryParts: string[] = [];

    if (sections.length > 0) {
      const topSections = sections.slice(0, 3).map((s) => `"${s}"`).join(', ');
      summaryParts.push(`Updated ${sections.length > 1 ? 'sections' : 'section'} ${topSections}`);
    } else {
      summaryParts.push(`Modified document content`);
    }

    if (added > 0 && removed > 0) {
      summaryParts.push(`(+${added} / -${removed} lines)`);
    } else if (added > 0) {
      summaryParts.push(`(+${added} lines added)`);
    } else if (removed > 0) {
      summaryParts.push(`(-${removed} lines removed)`);
    } else {
      summaryParts.push(`(formatting / metadata change)`);
    }

    return `${summaryParts.join(' ')} by author ${authorShort}.`;
  }

  public async explainDiff(input: DiffContext): Promise<string> {
    const lines: string[] = [];
    lines.push(`### 🔍 Semantic Change Analysis (#${input.commitId.slice(0, 8)})`);
    lines.push(`**Author:** \`${input.authorFingerprint}\``);
    lines.push(`**Net Impact:** +${input.addedCount} / -${input.removedCount} lines across ${input.sections.length} section(s).\n`);

    for (const section of input.sections) {
      if (section.addedCount === 0 && section.removedCount === 0) continue;

      lines.push(`#### 📌 Section: **${section.heading}**`);
      if (section.addedCount > 0 && section.removedCount === 0) {
        lines.push(`- ✨ **New Content Added:** ${section.addedCount} lines introduced.`);
      } else if (section.removedCount > 0 && section.addedCount === 0) {
        lines.push(`- 🗑️ **Content Removed:** ${section.removedCount} lines deleted.`);
      } else {
        lines.push(`- 🔄 **Refactored:** Replaced ${section.removedCount} lines with ${section.addedCount} updated lines.`);
      }

      // Check for code block or key syntax changes
      const addedCode = section.lines.filter((l) => l.type === 'added' && (l.text.includes('```') || l.text.startsWith('    ')));
      if (addedCode.length > 0) {
        lines.push(`- 💻 **Code / Technical Examples:** Technical specification or code blocks were updated.`);
      }
      lines.push('');
    }

    return lines.join('\n');
  }

  public async analyzeHistory(input: HistoryContext): Promise<string> {
    const lines: string[] = [];
    lines.push(`### 🌳 Document Provenance & History Overview`);
    lines.push(`- **Document Title:** ${input.documentTitle}`);
    lines.push(`- **Total Signed Commits:** ${input.totalCommits} across ${input.uniqueAuthors.length} distinct author(s).`);
    lines.push(`- **Merkle DAG State:** ${input.isDivergent ? '⚠️ Concurrent branches active (' + input.heads.length + ' heads)' : '✅ Fully converged (Single head)'}`);
    lines.push(`\n**Author Distribution:**`);
    for (const author of input.uniqueAuthors) {
      const authorCommits = input.commitsSummary.filter((c) => c.author === author).length;
      const pct = Math.round((authorCommits / Math.max(1, input.totalCommits)) * 100);
      lines.push(`- \`${author.slice(0, 14)}...\`: ${authorCommits} commits (${pct}%)`);
    }

    lines.push(`\n**Recent Activity Timeline:**`);
    for (const c of input.commitsSummary.slice(-5).reverse()) {
      const timeStr = new Date(c.timestamp).toLocaleTimeString();
      lines.push(`- \`#${c.shortId}\` (${timeStr}) by \`${c.author.slice(0, 10)}\`: ${c.summary || 'Document update'}`);
    }

    return lines.join('\n');
  }

  public async detectPotentialConflict(input: ConflictContext): Promise<string> {
    const lines: string[] = [];
    const overlap = input.overlappingSections;

    lines.push(`### ⚖️ AI Branch Divergence & Conflict Analysis`);
    lines.push(`- **Branch A Head:** \`#${input.branchA.headCommitId.slice(0, 8)}\` (${input.branchA.commits.length} commits)`);
    lines.push(`- **Branch B Head:** \`#${input.branchB.headCommitId.slice(0, 8)}\` (${input.branchB.commits.length} commits)`);
    lines.push(`- **Common Ancestor:** \`#${(input.commonAncestorId || 'root').slice(0, 8)}\``);
    lines.push('');

    if (overlap.length > 0) {
      lines.push(`⚠️ **Potential Semantic Conflict Detected:**`);
      lines.push(`Both branches concurrently modified the following section(s):`);
      for (const section of overlap) {
        lines.push(`  - **${section}**`);
      }
      lines.push(`\n*Recommendation:* Yjs CRDT will automatically merge text without crashing or dropping characters, but manual review is advised to ensure semantic consistency in "${overlap[0]}".`);
    } else {
      lines.push(`✅ **Clean Non-Overlapping Merge Predicted:**`);
      lines.push(`Branch A focused on [${input.branchA.modifiedSections.slice(0, 2).join(', ') || 'general sections'}] while Branch B focused on [${input.branchB.modifiedSections.slice(0, 2).join(', ') || 'independent sections'}]. No semantic section collisions detected.`);
    }

    return lines.join('\n');
  }

  public async askHistoryQnA(question: string, context: HistoryContext): Promise<string> {
    const q = question.toLowerCase();

    if (q.includes('who') || q.includes('author') || q.includes('contributor')) {
      const lines = [`**Contributors & Authors:**`];
      for (const author of context.uniqueAuthors) {
        const count = context.commitsSummary.filter((c) => c.author === author).length;
        lines.push(`- \`${author}\`: created ${count} signed commit(s).`);
      }
      return lines.join('\n');
    }

    if (q.includes('branch') || q.includes('diverg') || q.includes('head')) {
      if (context.isDivergent) {
        return `The Merkle DAG currently has **${context.heads.length} active heads** (${context.heads.map((h) => '#' + h.slice(0, 8)).join(', ')}). Multiple authors have made concurrent edits that have not yet been combined in a merge commit.`;
      }
      return `The Merkle DAG is currently in a linear / converged state with a single head (\`#${(context.heads[0] || '').slice(0, 8)}\`). All past branches have been cleanly integrated.`;
    }

    if (q.includes('what changed') || q.includes('recent') || q.includes('summary')) {
      const recent = context.commitsSummary.slice(-3).reverse();
      const lines = [`**Recent History Summary:**`];
      for (const c of recent) {
        lines.push(`- **Commit #${c.shortId}** (${new Date(c.timestamp).toLocaleTimeString()}) by \`${c.author.slice(0, 8)}\`: ${c.summary || 'Content revision'}`);
      }
      return lines.join('\n');
    }

    if (q.includes('verify') || q.includes('crypto') || q.includes('authentic')) {
      return `All **${context.totalCommits}** commits in this document DAG are signed with ECDSA P-256 and linked via SHA-256 parent hashes. You can run independent verification in the **Audit Tab** or via the CLI tool \`npm run verify <export.hermes.json>\`.`;
    }

    // Default synthesis
    return `Based on the Merkle DAG of **${context.documentTitle}**, there are **${context.totalCommits} signed commits** across **${context.uniqueAuthors.length} author(s)**. Current document state has ${context.currentDocumentText.split('\n').length} lines.`;
  }

  public async suggestEdit(prompt: string, currentContent: string): Promise<AISuggestion> {
    const p = prompt.toLowerCase();
    let proposed = currentContent;
    let summary = 'Proposed edits based on prompt';

    if (p.includes('table of contents') || p.includes('toc')) {
      const headings = currentContent.split('\n').filter((l) => l.startsWith('#'));
      const toc = ['## Table of Contents', ...headings.map((h) => `- [${h.replace(/^#+\s*/, '')}](#)`), ''].join('\n');
      proposed = `${toc}\n\n${currentContent}`;
      summary = 'Generated Table of Contents from document headings';
    } else if (p.includes('fix formatting') || p.includes('clean') || p.includes('format')) {
      proposed = currentContent.replace(/\n{3,}/g, '\n\n').trim() + '\n';
      summary = 'Normalized spacing and cleaned up Markdown formatting';
    } else if (p.includes('add security') || p.includes('security')) {
      proposed = `${currentContent}\n\n## 🛡️ Security & Provenance\n\nAll modifications in this document are cryptographically signed using WebCrypto ECDSA P-256. Private keys never leave the browser client.\n`;
      summary = 'Appended Security & Provenance section';
    } else {
      proposed = `${currentContent}\n\n> **Note:** ${prompt.trim()}\n`;
      summary = `Appended formatted note block for "${prompt.slice(0, 30)}..."`;
    }

    const diffLines = computeLineDiff(currentContent, proposed);

    return {
      prompt,
      originalText: currentContent,
      proposedText: proposed,
      summary,
      diffLines,
    };
  }
}
