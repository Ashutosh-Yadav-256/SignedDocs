import React from 'react';
import { SignedCommitNode } from '@hermes/core';
import { GitCommit, ShieldCheck, Clock, User, GitBranch, Sparkles } from 'lucide-react';

export interface TimelineProps {
  commits: SignedCommitNode[];
  heads: string[];
  onSelectCommit?: (commit: SignedCommitNode) => void;
}

export const Timeline: React.FC<TimelineProps> = ({ commits, heads, onSelectCommit }) => {
  const reversedCommits = [...commits].reverse();

  if (commits.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 bg-cream-50 border border-cream-border rounded-xl text-center">
        <GitCommit className="h-8 w-8 text-charcoal-light mb-2" />
        <h4 className="text-xs font-semibold text-charcoal-muted">No Commit History Yet</h4>
      </div>
    );
  }

  return (
    <div className="space-y-2.5 font-sans">
      {reversedCommits.map((commit) => {
        const isHead = heads.includes(commit.id);
        const isRoot = commit.parentIds.length === 0;
        const isMerge = commit.parentIds.length > 1;

        return (
          <div
            key={commit.id}
            onClick={() => onSelectCommit && onSelectCommit(commit)}
            className="group bg-cream-50 hover:bg-cream-subtle rounded-lg p-3 border border-cream-border transition-colors cursor-pointer"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-start space-x-2.5">
                <div
                  className={`mt-0.5 rounded p-1.5 ${
                    isHead
                      ? 'bg-sage-light text-sage-dark border border-sage-border'
                      : isMerge
                        ? 'bg-terracotta-light text-terracotta-dark border border-terracotta-border'
                        : 'bg-cream-subtle text-charcoal border border-cream-border'
                  }`}
                >
                  <GitCommit className="h-3.5 w-3.5" />
                </div>
                <div>
                  <div className="flex items-center space-x-1.5">
                    <span className="font-mono text-xs font-bold text-charcoal group-hover:underline">
                      {commit.id.slice(0, 8)}
                    </span>
                    {isHead && (
                      <span className="bg-sage-light text-sage-dark text-[9px] font-semibold px-1.5 py-0.2 rounded border border-sage-border">
                        HEAD
                      </span>
                    )}
                    {isMerge && (
                      <span className="bg-terracotta-light text-terracotta-dark text-[9px] font-semibold px-1.5 py-0.2 rounded border border-terracotta-border flex items-center gap-0.5">
                        <GitBranch className="h-2 w-2" /> MERGE
                      </span>
                    )}
                    {isRoot && (
                      <span className="bg-cream-subtle text-charcoal-muted text-[9px] font-semibold px-1.5 py-0.2 rounded border border-cream-border">
                        ROOT
                      </span>
                    )}
                  </div>

                  <div className="mt-1.5 flex flex-wrap items-center gap-2 text-[11px] text-charcoal-muted">
                    <span className="flex items-center space-x-1 font-mono">
                      <User className="h-3 w-3 text-charcoal-light" />
                      <span>{commit.author.fingerprint.slice(0, 12)}...</span>
                    </span>
                    <span className="flex items-center space-x-1">
                      <Clock className="h-3 w-3 text-charcoal-light" />
                      <span>{new Date(commit.timestamp).toLocaleTimeString()}</span>
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-1.5">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectCommit && onSelectCommit(commit);
                  }}
                  title="Explain commit with AI"
                  className="flex items-center space-x-1 text-xs text-sage-dark hover:bg-sage-light bg-cream-subtle border border-cream-border rounded px-2 py-0.5 transition-colors"
                >
                  <Sparkles className="w-3 h-3 text-sage-dark" />
                  <span className="text-[10px] font-medium">Explain</span>
                </button>

                <div className="flex items-center space-x-1 text-xs text-sage-dark bg-sage-light border border-sage-border rounded px-2 py-0.5">
                  <ShieldCheck className="h-3 w-3" />
                  <span className="hidden sm:inline text-[10px] font-medium">Signed</span>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
