import * as Y from 'yjs';
import { base64ToUint8Array } from '@hermes/crypto';
import { CommitDAG } from '../dag.js';
import { SignedCommitNode } from '../types.js';
import { DiffLine, DiffSection } from './types.js';

/**
 * Computes a simple line-by-line diff between two strings.
 */
export function computeLineDiff(before: string, after: string): DiffLine[] {
  const beforeLines = before.split('\n');
  const afterLines = after.split('\n');
  const result: DiffLine[] = [];

  let b = 0;
  let a = 0;

  while (b < beforeLines.length || a < afterLines.length) {
    if (b < beforeLines.length && a < afterLines.length) {
      if (beforeLines[b] === afterLines[a]) {
        result.push({ type: 'unchanged', text: beforeLines[b], lineNumber: a + 1 });
        b++;
        a++;
      } else {
        // Lookahead to check if this is an insertion or deletion
        const foundInAfter = afterLines.indexOf(beforeLines[b], a);
        const foundInBefore = beforeLines.indexOf(afterLines[a], b);

        if (foundInAfter !== -1 && (foundInBefore === -1 || foundInAfter - a <= foundInBefore - b)) {
          // Lines were inserted in after
          while (a < foundInAfter) {
            result.push({ type: 'added', text: afterLines[a], lineNumber: a + 1 });
            a++;
          }
        } else if (foundInBefore !== -1) {
          // Lines were removed from before
          while (b < foundInBefore) {
            result.push({ type: 'removed', text: beforeLines[b] });
            b++;
          }
        } else {
          // Direct replacement
          result.push({ type: 'removed', text: beforeLines[b] });
          result.push({ type: 'added', text: afterLines[a], lineNumber: a + 1 });
          b++;
          a++;
        }
      }
    } else if (a < afterLines.length) {
      result.push({ type: 'added', text: afterLines[a], lineNumber: a + 1 });
      a++;
    } else if (b < beforeLines.length) {
      result.push({ type: 'removed', text: beforeLines[b] });
      b++;
    }
  }

  return result;
}

/**
 * Groups diff lines by Markdown heading sections.
 */
export function groupDiffBySections(diffLines: DiffLine[]): DiffSection[] {
  const sections: DiffSection[] = [];
  let currentSection: DiffSection = {
    heading: 'Document Overview',
    level: 1,
    addedCount: 0,
    removedCount: 0,
    lines: [],
  };

  for (const line of diffLines) {
    const headingMatch = line.text.match(/^(#{1,6})\s+(.*)$/);
    if (headingMatch && line.type !== 'removed') {
      if (currentSection.lines.length > 0) {
        sections.push(currentSection);
      }
      currentSection = {
        heading: headingMatch[2].trim(),
        level: headingMatch[1].length,
        addedCount: 0,
        removedCount: 0,
        lines: [],
      };
    }

    currentSection.lines.push(line);
    if (line.type === 'added') currentSection.addedCount++;
    if (line.type === 'removed') currentSection.removedCount++;
  }

  if (currentSection.lines.length > 0) {
    sections.push(currentSection);
  }

  return sections;
}

/**
 * Reconstructs the textual state of a document at a specific commit in the DAG.
 */
export function reconstructDocumentAtCommit(commitId: string, dag: CommitDAG): string {
  const ancestors = dag.getAncestors(commitId);
  ancestors.add(commitId);

  // Topologically sort all ancestors up to this commit
  const allCommits = dag.topologicalSort().filter((c) => ancestors.has(c.id));

  const tempDoc = new Y.Doc();
  for (const c of allCommits) {
    try {
      const updateBytes = base64ToUint8Array(c.updateBinary);
      Y.applyUpdate(tempDoc, updateBytes);
    } catch {
      // Ignore corrupted updates in simulation
    }
  }

  const ytext = tempDoc.getText('tiptap') || tempDoc.getText('content') || tempDoc.getText('default');
  const text = ytext.toString();
  tempDoc.destroy();
  return text;
}

/**
 * Extracts markdown headings from a text string.
 */
export function extractHeadings(text: string): string[] {
  const lines = text.split('\n');
  const headings: string[] = [];
  for (const line of lines) {
    const m = line.match(/^#{1,6}\s+(.*)$/);
    if (m) {
      headings.push(m[1].trim());
    }
  }
  return headings;
}

/**
 * Detects overlapping modified sections between two concurrent branch heads.
 */
export function findOverlappingSections(sectionsA: string[], sectionsB: string[]): string[] {
  const setB = new Set(sectionsB.map((s) => s.toLowerCase()));
  return sectionsA.filter((s) => setB.has(s.toLowerCase()));
}
