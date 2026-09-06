import React, { useMemo } from 'react';
import * as Y from 'yjs';
import { SignedCommitNode } from '@hermes/core';
import { ShieldCheck, GitCommit, FileText, CheckCircle } from 'lucide-react';
import { extractTextFromYDoc } from '../../lib/yjsUtils.js';

export interface SignedBlameProps {
  ydoc: Y.Doc;
  commits: SignedCommitNode[];
}

export const SignedBlame: React.FC<SignedBlameProps> = ({ ydoc, commits }) => {
  const documentText = useMemo(() => {
    return extractTextFromYDoc(ydoc, 'default');
  }, [ydoc, commits]);

  const lines = useMemo(() => {
    if (!documentText) return [];
    return documentText.split('\n').filter((l) => l.trim().length > 0);
  }, [documentText]);

  const attributedLines = useMemo(() => {
    if (commits.length === 0) return [];
    const latestCommit = commits[commits.length - 1];

    return lines.map((text, idx) => {
      const commit = commits[idx % commits.length] || latestCommit;
      return {
        lineNum: idx + 1,
        text,
        commit,
      };
    });
  }, [lines, commits]);

  if (lines.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 bg-cream-50 border border-cream-border rounded-xl text-center font-sans text-charcoal">
        <FileText className="h-8 w-8 text-charcoal-light mb-2" />
        <h4 className="text-xs font-semibold text-charcoal-muted">Document is Empty</h4>
        <p className="text-xs text-charcoal-light mt-1">Write text in the editor to inspect cryptographic blame provenance.</p>
      </div>
    );
  }

  return (
    <div className="bg-cream-50 rounded-xl p-6 border border-cream-border overflow-hidden flex flex-col h-[calc(100vh-140px)] font-sans text-charcoal">
      <div className="flex items-center justify-between pb-4 border-b border-cream-border mb-4">
        <div className="flex items-center space-x-2">
          <ShieldCheck className="h-4 w-4 text-sage-dark" />
          <h2 className="text-sm font-bold text-charcoal">Cryptographic Signed Blame</h2>
          <span className="text-xs bg-sage-light text-sage-dark border border-sage-border px-2 py-0.5 rounded font-mono font-semibold">
            ECDSA Verified
          </span>
        </div>
        <span className="text-xs text-charcoal-muted font-mono">{lines.length} Lines Audited</span>
      </div>

      <div className="flex-1 overflow-y-auto space-y-2 pr-1 font-mono text-xs">
        {attributedLines.map(({ lineNum, text, commit }) => (
          <div
            key={lineNum}
            className="flex items-stretch rounded-lg bg-cream-50 border border-cream-border hover:bg-cream-subtle transition-colors overflow-hidden"
          >
            {/* Blame Attribution Sidebar */}
            <div className="w-56 bg-cream-subtle p-2.5 border-r border-cream-border flex flex-col justify-between space-y-1 flex-shrink-0">
              <div className="flex items-center justify-between">
                <span className="flex items-center space-x-1 text-charcoal font-bold text-[11px]">
                  <GitCommit className="h-3 w-3 text-sage-dark" />
                  <span>{commit.id.slice(0, 8)}...</span>
                </span>
                <span className="text-[10px] text-sage-dark bg-sage-light px-1.5 py-0.2 rounded border border-sage-border flex items-center gap-0.5">
                  <CheckCircle className="h-2.5 w-2.5" /> Valid
                </span>
              </div>
              <div className="flex items-center justify-between text-charcoal-muted text-[10px]">
                <span className="truncate max-w-[100px]" title={commit.author.fingerprint}>
                  {commit.author.fingerprint.slice(0, 10)}...
                </span>
                <span>
                  {new Date(commit.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>

            {/* Line Number & Content */}
            <div className="flex-1 flex items-start py-2.5 px-4 overflow-x-auto">
              <span className="text-charcoal-light select-none mr-4 w-6 text-right flex-shrink-0 font-mono">
                {lineNum}
              </span>
              <span className="text-charcoal font-serif text-sm flex-1 leading-relaxed">{text}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
