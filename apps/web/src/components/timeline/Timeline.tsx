import React from 'react';
import { SignedCommitNode } from '@hermes/core';
import { GitCommit, ShieldCheck, Clock, User, GitBranch } from 'lucide-react';

export interface TimelineProps {
  commits: SignedCommitNode[];
  heads: string[];
  onSelectCommit?: (commit: SignedCommitNode) => void;
}

export const Timeline: React.FC<TimelineProps> = ({ commits, heads, onSelectCommit }) => {
  const reversedCommits = [...commits].reverse();

  if (commits.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 glass-panel rounded-2xl text-center">
        <GitCommit className="h-10 w-10 text-slate-600 mb-2" />
        <h4 className="text-sm font-semibold text-slate-400">No Commit History Yet</h4>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {reversedCommits.map((commit, index) => {
        const isHead = heads.includes(commit.id);
        const isRoot = commit.parentIds.length === 0;
        const isMerge = commit.parentIds.length > 1;

        return (
          <div
            key={commit.id}
            onClick={() => onSelectCommit && onSelectCommit(commit)}
            className="group glass-panel hover:bg-slate-900/90 rounded-xl p-4 border border-slate-800/90 transition-all cursor-pointer hover:border-cyan-500/30"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-start space-x-3">
                <div
                  className={`mt-0.5 rounded-lg p-2 ${
                    isHead
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                      : isMerge
                        ? 'bg-purple-500/10 text-purple-400 border border-purple-500/30'
                        : 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30'
                  }`}
                >
                  <GitCommit className="h-4 w-4" />
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-mono text-xs font-bold text-white group-hover:text-cyan-400 transition-colors">
                      {commit.id.slice(0, 10)}...
                    </span>
                    {isHead && (
                      <span className="bg-emerald-500/20 text-emerald-400 text-[10px] font-semibold px-2 py-0.5 rounded-full border border-emerald-500/30">
                        HEAD TIP
                      </span>
                    )}
                    {isMerge && (
                      <span className="bg-purple-500/20 text-purple-400 text-[10px] font-semibold px-2 py-0.5 rounded-full border border-purple-500/30 flex items-center gap-1">
                        <GitBranch className="h-2.5 w-2.5" /> MERGE
                      </span>
                    )}
                    {isRoot && (
                      <span className="bg-slate-800 text-slate-400 text-[10px] font-semibold px-2 py-0.5 rounded-full">
                        GENESIS
                      </span>
                    )}
                  </div>

                  <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-slate-400">
                    <span className="flex items-center space-x-1 font-mono">
                      <User className="h-3 w-3 text-slate-500" />
                      <span>{commit.author.fingerprint.slice(0, 16)}</span>
                    </span>
                    <span className="flex items-center space-x-1">
                      <Clock className="h-3 w-3 text-slate-500" />
                      <span>{new Date(commit.timestamp).toLocaleTimeString()}</span>
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectCommit && onSelectCommit(commit);
                  }}
                  title="Explain commit with AI"
                  className="flex items-center space-x-1 text-xs text-cyan-400 hover:text-cyan-300 bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 rounded-lg px-2 py-1 transition-colors"
                >
                  <span className="text-xs">✨</span>
                  <span className="text-[10px] font-semibold">AI Explain</span>
                </button>

                <div className="flex items-center space-x-1.5 text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-lg px-2.5 py-1">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Signed</span>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
