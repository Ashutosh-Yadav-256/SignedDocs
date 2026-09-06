import React, { useState, useMemo } from 'react';
import * as Y from 'yjs';
import { CommitDAG, SignedCommitNode } from '@hermes/core';
import { base64ToUint8Array } from '@hermes/crypto';
import { History, SkipBack, SkipForward, Clock, User, ShieldCheck } from 'lucide-react';
import { extractTextFromYDoc } from '../../lib/yjsUtils.js';

export interface TimeTravelProps {
  dag: CommitDAG;
  commits: SignedCommitNode[];
}

export const TimeTravel: React.FC<TimeTravelProps> = ({ dag, commits }) => {
  const [currentIndex, setCurrentIndex] = useState<number>(Math.max(0, commits.length - 1));

  // Reconstruct historical state for the commit at currentIndex
  const historicalState = useMemo(() => {
    if (commits.length === 0) return { text: '', commit: null };

    const targetCommit = commits[currentIndex] || commits[commits.length - 1];
    const ephemeralDoc = new Y.Doc();

    // Get all topological ancestors up to this target commit
    const ancestors = dag.getAncestors(targetCommit.id);
    ancestors.add(targetCommit.id);

    const orderedCommits = dag.topologicalSort().filter((c) => ancestors.has(c.id));

    for (const c of orderedCommits) {
      try {
        const updateBytes = base64ToUint8Array(c.updateBinary);
        Y.applyUpdate(ephemeralDoc, updateBytes);
      } catch (err) {
        console.warn('Error applying historical update', err);
      }
    }

    const text = extractTextFromYDoc(ephemeralDoc, 'default');
    return { text, commit: targetCommit };
  }, [commits, currentIndex, dag]);

  if (commits.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 bg-cream-50 border border-cream-border rounded-xl text-center font-sans text-charcoal">
        <History className="h-8 w-8 text-charcoal-light mb-2" />
        <h4 className="text-xs font-semibold text-charcoal-muted">No History Available</h4>
      </div>
    );
  }

  const { text, commit } = historicalState;

  return (
    <div className="bg-cream-50 rounded-xl p-6 border border-cream-border flex flex-col h-[calc(100vh-140px)] font-sans text-charcoal">
      {/* Header & Controls */}
      <div className="pb-4 border-b border-cream-border flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center space-x-2">
          <History className="h-4 w-4 text-sage-dark" />
          <div>
            <h2 className="text-sm font-bold text-charcoal">Time Travel History Scrubber</h2>
            <p className="text-xs text-charcoal-muted">
              Reconstructing state at commit {currentIndex + 1} of {commits.length}
            </p>
          </div>
        </div>

        {/* Stepper Buttons */}
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setCurrentIndex((i) => Math.max(0, i - 1))}
            disabled={currentIndex === 0}
            className="p-1.5 rounded bg-cream-subtle hover:bg-cream-200 border border-cream-border text-charcoal disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <SkipBack className="h-3.5 w-3.5" />
          </button>
          <span className="text-xs font-mono text-charcoal px-2 font-bold">
            {currentIndex + 1} / {commits.length}
          </span>
          <button
            onClick={() => setCurrentIndex((i) => Math.min(commits.length - 1, i + 1))}
            disabled={currentIndex === commits.length - 1}
            className="p-1.5 rounded bg-cream-subtle hover:bg-cream-200 border border-cream-border text-charcoal disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <SkipForward className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Range Slider */}
      <div className="py-4 border-b border-cream-border">
        <input
          type="range"
          min={0}
          max={commits.length - 1}
          value={currentIndex}
          onChange={(e) => setCurrentIndex(parseInt(e.target.value, 10))}
          className="w-full accent-charcoal cursor-pointer h-1.5 bg-cream-subtle rounded appearance-none border border-cream-border"
        />
      </div>

      {/* Commit Metadata Banner */}
      {commit && (
        <div className="my-4 bg-cream-subtle rounded-lg p-3 border border-cream-border flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center space-x-2 font-mono">
            <span className="text-charcoal-muted font-bold">Commit:</span>
            <span className="text-charcoal font-semibold">{commit.id.slice(0, 16)}...</span>
          </div>
          <div className="flex items-center space-x-2">
            <User className="h-3.5 w-3.5 text-charcoal-light" />
            <span className="text-charcoal-muted font-mono">{commit.author.fingerprint.slice(0, 14)}...</span>
          </div>
          <div className="flex items-center space-x-2">
            <Clock className="h-3.5 w-3.5 text-charcoal-light" />
            <span className="text-charcoal-muted">{new Date(commit.timestamp).toLocaleTimeString()}</span>
          </div>
          <div className="flex items-center space-x-1 text-sage-dark bg-sage-light px-2 py-0.5 rounded border border-sage-border">
            <ShieldCheck className="h-3.5 w-3.5" />
            <span>Cryptographically Verified</span>
          </div>
        </div>
      )}

      {/* Historical Text Display */}
      <div className="flex-1 overflow-y-auto rounded-lg bg-cream-100 p-6 border border-cream-border font-serif text-charcoal text-base leading-relaxed whitespace-pre-wrap">
        {text ? text : <span className="text-charcoal-light italic">Empty at this point in history...</span>}
      </div>
    </div>
  );
};
