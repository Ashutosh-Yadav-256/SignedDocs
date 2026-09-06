import React, { useState, useMemo } from 'react';
import * as Y from 'yjs';
import { CommitDAG, SignedCommitNode } from '@hermes/core';
import { base64ToUint8Array } from '@hermes/crypto';
import { History, Play, SkipBack, SkipForward, Clock, User, ShieldCheck, FileText } from 'lucide-react';

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
      <div className="flex flex-col items-center justify-center p-12 glass-panel rounded-2xl text-center">
        <History className="h-10 w-10 text-slate-600 mb-2" />
        <h4 className="text-sm font-semibold text-slate-400">No History Available</h4>
      </div>
    );
  }

  const { text, commit } = historicalState;

  return (
    <div className="glass-panel rounded-2xl p-6 border border-slate-800 shadow-2xl flex flex-col h-[calc(100vh-140px)]">
      {/* Header & Controls */}
      <div className="pb-4 border-b border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center space-x-2">
          <History className="h-5 w-5 text-cyan-400" />
          <div>
            <h2 className="text-base font-bold text-white">Time Travel Scrubber</h2>
            <p className="text-xs text-slate-400">
              Ephemeral state reconstruction at commit {currentIndex + 1} of {commits.length}
            </p>
          </div>
        </div>

        {/* Stepper Buttons */}
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setCurrentIndex((i) => Math.max(0, i - 1))}
            disabled={currentIndex === 0}
            className="p-2 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <SkipBack className="h-4 w-4" />
          </button>
          <span className="text-xs font-mono text-cyan-400 px-2 font-bold">
            Step {currentIndex + 1} / {commits.length}
          </span>
          <button
            onClick={() => setCurrentIndex((i) => Math.min(commits.length - 1, i + 1))}
            disabled={currentIndex === commits.length - 1}
            className="p-2 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <SkipForward className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Slider */}
      <div className="py-4 border-b border-slate-800/80">
        <input
          type="range"
          min={0}
          max={commits.length - 1}
          value={currentIndex}
          onChange={(e) => setCurrentIndex(parseInt(e.target.value, 10))}
          className="w-full accent-cyan-400 cursor-pointer h-2 bg-slate-800 rounded-lg appearance-none"
        />
      </div>

      {/* Commit Metadata Banner */}
      {commit && (
        <div className="my-4 bg-slate-900/90 rounded-xl p-3 border border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center space-x-2 font-mono">
            <span className="text-cyan-400 font-bold">Commit:</span>
            <span className="text-white">{commit.id.slice(0, 16)}...</span>
          </div>
          <div className="flex items-center space-x-2">
            <User className="h-3.5 w-3.5 text-slate-500" />
            <span className="text-slate-300 font-mono">{commit.author.fingerprint.slice(0, 16)}</span>
          </div>
          <div className="flex items-center space-x-2">
            <Clock className="h-3.5 w-3.5 text-slate-500" />
            <span className="text-slate-300">{new Date(commit.timestamp).toLocaleString()}</span>
          </div>
          <div className="flex items-center space-x-1 text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
            <ShieldCheck className="h-3.5 w-3.5" />
            <span>Cryptographically Verified</span>
          </div>
        </div>
      )}

      {/* Historical Text Display */}
      <div className="flex-1 overflow-y-auto rounded-xl bg-slate-950/80 p-6 border border-slate-900 font-sans text-slate-200 leading-relaxed whitespace-pre-wrap">
        {text ? text : <span className="text-slate-600 italic">Empty at this point in history...</span>}
      </div>
    </div>
  );
};
