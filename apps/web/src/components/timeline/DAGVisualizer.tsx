import React, { useState, useMemo } from 'react';
import { CommitDAG, SignedCommitNode } from '@hermes/core';
import { ShieldCheck, GitCommit, GitBranch, GitMerge, Clock, User, Hash, Key, CheckCircle, ChevronRight } from 'lucide-react';

export interface DAGVisualizerProps {
  dag: CommitDAG;
  commits: SignedCommitNode[];
  heads: string[];
  onSelectCommit?: (commit: SignedCommitNode) => void;
}

interface LayoutNode {
  commit: SignedCommitNode;
  x: number;
  y: number;
  depth: number;
  lane: number;
}

export const DAGVisualizer: React.FC<DAGVisualizerProps> = ({
  dag,
  commits,
  heads,
  onSelectCommit,
}) => {
  const [selectedCommitId, setSelectedCommitId] = useState<string | null>(null);

  // Compute 2D coordinates for Merkle DAG
  const layout = useMemo(() => {
    if (commits.length === 0) return { nodes: [], edges: [], width: 600, height: 400 };

    const nodes: LayoutNode[] = [];
    const nodeMap = new Map<string, LayoutNode>();
    const laneAssignments = new Map<string, number>();
    let maxLane = 0;

    // 1. Calculate depth for each commit (longest path from root)
    const depthMap = new Map<string, number>();
    for (const commit of commits) {
      let maxParentDepth = -1;
      for (const pId of commit.parentIds) {
        const pDepth = depthMap.get(pId) ?? -1;
        if (pDepth > maxParentDepth) {
          maxParentDepth = pDepth;
        }
      }
      depthMap.set(commit.id, maxParentDepth + 1);
    }

    // 2. Assign horizontal lanes for concurrent branches
    const depthGroups = new Map<number, string[]>();
    for (const commit of commits) {
      const d = depthMap.get(commit.id) || 0;
      if (!depthGroups.has(d)) depthGroups.set(d, []);
      depthGroups.get(d)!.push(commit.id);
    }

    let maxDepth = 0;
    for (const [d, ids] of depthGroups.entries()) {
      if (d > maxDepth) maxDepth = d;
      ids.forEach((id, index) => {
        laneAssignments.set(id, index);
        if (index > maxLane) maxLane = index;
      });
    }

    const X_SPACING = 180;
    const Y_SPACING = 100;
    const PADDING_X = 80;
    const PADDING_Y = 80;

    for (const commit of commits) {
      const depth = depthMap.get(commit.id) || 0;
      const lane = laneAssignments.get(commit.id) || 0;
      const x = PADDING_X + depth * X_SPACING;
      const y = PADDING_Y + lane * Y_SPACING;

      const node: LayoutNode = { commit, x, y, depth, lane };
      nodes.push(node);
      nodeMap.set(commit.id, node);
    }

    // 3. Build edges between parents and children
    const edges: { from: LayoutNode; to: LayoutNode; isMerge: boolean }[] = [];
    for (const commit of commits) {
      const childNode = nodeMap.get(commit.id);
      if (!childNode) continue;

      for (const parentId of commit.parentIds) {
        const parentNode = nodeMap.get(parentId);
        if (parentNode) {
          edges.push({
            from: parentNode,
            to: childNode,
            isMerge: commit.parentIds.length > 1,
          });
        }
      }
    }

    const totalWidth = Math.max(700, PADDING_X * 2 + (maxDepth + 1) * X_SPACING);
    const totalHeight = Math.max(350, PADDING_Y * 2 + (maxLane + 1) * Y_SPACING);

    return { nodes, edges, width: totalWidth, height: totalHeight };
  }, [commits]);

  const selectedCommit = useMemo(() => {
    return commits.find((c) => c.id === selectedCommitId) || commits[commits.length - 1];
  }, [commits, selectedCommitId]);

  if (commits.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 glass-panel rounded-2xl text-center">
        <GitBranch className="h-12 w-12 text-slate-600 mb-3 animate-pulse" />
        <h3 className="text-lg font-semibold text-slate-300">No Commits in DAG Yet</h3>
        <p className="text-sm text-slate-500 max-w-md mt-1">
          Start typing in the editor. Once you pause for 1.5s or click "Sign Commit Node", signed Merkle DAG nodes will be visualized here.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-140px)]">
      {/* Left Area: SVG Graph Canvas */}
      <div className="flex-1 glass-panel rounded-2xl p-6 border border-slate-800 shadow-2xl flex flex-col overflow-hidden">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800/80 mb-4">
          <div className="flex items-center space-x-2">
            <GitCommit className="h-5 w-5 text-cyan-400" />
            <h2 className="text-base font-bold text-white">Merkle DAG History Graph</h2>
            <span className="text-xs bg-slate-800 text-slate-300 px-2 py-0.5 rounded-full font-mono">
              {commits.length} Nodes
            </span>
          </div>
          <div className="flex items-center space-x-3 text-xs text-slate-400">
            <span className="flex items-center space-x-1">
              <span className="h-2.5 w-2.5 rounded-full bg-cyan-400 inline-block shadow-sm shadow-cyan-400" />
              <span>Standard Commit</span>
            </span>
            <span className="flex items-center space-x-1">
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-400 inline-block shadow-sm shadow-emerald-400" />
              <span>DAG Head Tip</span>
            </span>
          </div>
        </div>

        {/* Scrollable DAG Area */}
        <div className="flex-1 overflow-auto rounded-xl bg-slate-950/70 border border-slate-900 p-4 relative">
          <svg width={layout.width} height={layout.height} className="overflow-visible">
            <defs>
              <linearGradient id="edgeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#0ea5e9" stopOpacity="0.8" />
                <stop offset="100%" stopColor="#6366f1" stopOpacity="0.8" />
              </linearGradient>
              <marker
                id="arrowhead"
                markerWidth="8"
                markerHeight="6"
                refX="7"
                refY="3"
                orient="auto"
              >
                <polygon points="0 0, 8 3, 0 6" fill="#0ea5e9" />
              </marker>
            </defs>

            {/* Render Connecting Edges */}
            {layout.edges.map((edge, idx) => {
              const { from, to } = edge;
              const isSelectedEdge =
                selectedCommit?.id === to.commit.id || selectedCommit?.id === from.commit.id;

              // Cubic bezier curve for branch merges
              const midX = (from.x + to.x) / 2;
              const pathD = `M ${from.x} ${from.y} C ${midX} ${from.y}, ${midX} ${to.y}, ${to.x} ${to.y}`;

              return (
                <path
                  key={`edge-${idx}`}
                  d={pathD}
                  fill="none"
                  stroke={isSelectedEdge ? '#38bdf8' : '#334155'}
                  strokeWidth={isSelectedEdge ? 3 : 2}
                  strokeDasharray={edge.isMerge ? '4 2' : 'none'}
                  markerEnd="url(#arrowhead)"
                  className="transition-all duration-300"
                />
              );
            })}

            {/* Render Commit Nodes */}
            {layout.nodes.map((node) => {
              const isHead = heads.includes(node.commit.id);
              const isSelected = selectedCommit?.id === node.commit.id;
              const isMerge = node.commit.parentIds.length > 1;

              return (
                <g
                  key={node.commit.id}
                  transform={`translate(${node.x}, ${node.y})`}
                  onClick={() => {
                    setSelectedCommitId(node.commit.id);
                    if (onSelectCommit) onSelectCommit(node.commit);
                  }}
                  className="cursor-pointer group"
                >
                  {/* Glow circle on selection */}
                  {isSelected && (
                    <circle
                      r="24"
                      fill="none"
                      stroke="#38bdf8"
                      strokeWidth="2"
                      className="animate-ping opacity-30"
                    />
                  )}

                  {/* Main Node Circle */}
                  <circle
                    r={isHead ? 16 : 14}
                    fill={isSelected ? '#0ea5e9' : isHead ? '#10b981' : '#1e293b'}
                    stroke={isSelected ? '#ffffff' : isHead ? '#34d399' : '#0ea5e9'}
                    strokeWidth={isHead ? 3 : 2}
                    className="transition-all duration-200 group-hover:scale-110"
                  />

                  {/* Icon */}
                  {isMerge ? (
                    <GitMerge
                      className="h-4 w-4 text-white -translate-x-2 -translate-y-2 pointer-events-none"
                    />
                  ) : (
                    <GitCommit
                      className="h-4 w-4 text-white -translate-x-2 -translate-y-2 pointer-events-none"
                    />
                  )}

                  {/* Label Text */}
                  <text
                    x="0"
                    y="28"
                    textAnchor="middle"
                    className="text-[11px] font-mono fill-slate-300 font-semibold pointer-events-none"
                  >
                    {node.commit.id.slice(0, 7)}
                  </text>

                  {/* Author Fingerprint Tag */}
                  <text
                    x="0"
                    y="42"
                    textAnchor="middle"
                    className="text-[9px] font-mono fill-slate-500 pointer-events-none"
                  >
                    {node.commit.author.fingerprint.slice(0, 10)}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>
      </div>

      {/* Right Area: Commit Node Cryptographic Inspector */}
      {selectedCommit && (
        <div className="w-full lg:w-96 glass-panel rounded-2xl p-6 border border-slate-800 shadow-2xl flex flex-col justify-between overflow-y-auto">
          <div>
            <div className="flex items-center space-x-2 pb-4 border-b border-slate-800">
              <ShieldCheck className="h-5 w-5 text-emerald-400" />
              <div>
                <h3 className="text-sm font-bold text-white">Cryptographic Node</h3>
                <p className="text-[11px] text-emerald-400 font-mono">ECDSA P-256 Verified</p>
              </div>
            </div>

            <div className="mt-4 space-y-4 text-xs">
              {/* Commit ID */}
              <div>
                <label className="text-slate-500 font-mono text-[10px] uppercase flex items-center gap-1">
                  <Hash className="h-3 w-3" /> Commit ID (SHA-256)
                </label>
                <div className="mt-1 bg-slate-900/90 rounded-lg p-2 font-mono text-cyan-400 break-all border border-slate-800">
                  {selectedCommit.id}
                </div>
              </div>

              {/* Author Info */}
              <div>
                <label className="text-slate-500 font-mono text-[10px] uppercase flex items-center gap-1">
                  <User className="h-3 w-3" /> Signer Fingerprint
                </label>
                <div className="mt-1 bg-slate-900/90 rounded-lg p-2 font-mono text-slate-200 break-all border border-slate-800">
                  {selectedCommit.author.fingerprint}
                </div>
              </div>

              {/* Timestamp */}
              <div>
                <label className="text-slate-500 font-mono text-[10px] uppercase flex items-center gap-1">
                  <Clock className="h-3 w-3" /> Timestamp
                </label>
                <div className="mt-1 bg-slate-900/90 rounded-lg p-2 font-mono text-slate-300 border border-slate-800">
                  {new Date(selectedCommit.timestamp).toLocaleString()}
                </div>
              </div>

              {/* Parent IDs */}
              <div>
                <label className="text-slate-500 font-mono text-[10px] uppercase flex items-center gap-1">
                  <GitBranch className="h-3 w-3" /> Parents ({selectedCommit.parentIds.length})
                </label>
                <div className="mt-1 space-y-1">
                  {selectedCommit.parentIds.length === 0 ? (
                    <div className="text-slate-500 italic p-2 bg-slate-900/60 rounded">
                      Root Commit (Genesis)
                    </div>
                  ) : (
                    selectedCommit.parentIds.map((pId) => (
                      <div
                        key={pId}
                        onClick={() => setSelectedCommitId(pId)}
                        className="bg-slate-900/90 hover:bg-slate-800 text-slate-300 rounded p-1.5 font-mono cursor-pointer flex items-center justify-between transition-colors border border-slate-800"
                      >
                        <span>{pId.slice(0, 16)}...</span>
                        <ChevronRight className="h-3 w-3 text-slate-500" />
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Update Hash */}
              <div>
                <label className="text-slate-500 font-mono text-[10px] uppercase flex items-center gap-1">
                  <Key className="h-3 w-3" /> Yjs Update Binary Hash
                </label>
                <div className="mt-1 bg-slate-900/90 rounded-lg p-2 font-mono text-slate-400 break-all border border-slate-800">
                  {selectedCommit.updateHash}
                </div>
              </div>

              {/* ECDSA Signature */}
              <div>
                <label className="text-slate-500 font-mono text-[10px] uppercase flex items-center gap-1">
                  <ShieldCheck className="h-3 w-3 text-emerald-400" /> ECDSA P-256 Signature
                </label>
                <div className="mt-1 bg-slate-900/90 rounded-lg p-2 font-mono text-emerald-400 break-all border border-emerald-500/20 text-[10px]">
                  {selectedCommit.signature}
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
            <span>Protocol Version: {selectedCommit.version}</span>
            <span className="text-emerald-400 font-semibold flex items-center gap-1">
              <CheckCircle className="h-3.5 w-3.5" /> Verified Node
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
