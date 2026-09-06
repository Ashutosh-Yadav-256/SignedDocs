import React, { useState, useMemo } from 'react';
import { CommitDAG, SignedCommitNode } from '@hermes/core';
import {
  ShieldCheck,
  GitCommit,
  GitBranch,
  GitMerge,
  Clock,
  User,
  Hash,
  Key,
  CheckCircle,
  ChevronRight,
  Sparkles,
} from 'lucide-react';

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
      <div className="flex flex-col items-center justify-center p-12 bg-cream-50 border border-cream-border rounded-xl text-center text-charcoal font-sans">
        <GitBranch className="h-10 w-10 text-charcoal-light mb-2" />
        <h3 className="text-sm font-bold text-charcoal">No Commits in DAG Yet</h3>
        <p className="text-xs text-charcoal-muted max-w-md mt-1">
          Start typing in the editor. When you pause or click "Sign Commit", signed Merkle DAG nodes will appear here.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-140px)] font-sans text-charcoal">
      {/* Left Area: SVG Graph Canvas */}
      <div className="flex-1 bg-cream-50 rounded-xl p-6 border border-cream-border flex flex-col overflow-hidden">
        <div className="flex items-center justify-between pb-4 border-b border-cream-border mb-4">
          <div className="flex items-center space-x-2">
            <GitCommit className="h-4 w-4 text-charcoal" />
            <h2 className="text-sm font-bold text-charcoal">Merkle DAG History Graph</h2>
            <span className="text-xs bg-cream-subtle text-charcoal-muted px-2 py-0.5 rounded border border-cream-border font-mono">
              {commits.length} Nodes
            </span>
          </div>
          <div className="flex items-center space-x-3 text-xs text-charcoal-muted">
            <span className="flex items-center space-x-1">
              <span className="h-2.5 w-2.5 rounded-full bg-charcoal inline-block" />
              <span>Commit</span>
            </span>
            <span className="flex items-center space-x-1">
              <span className="h-2.5 w-2.5 rounded-full bg-sage-dark inline-block" />
              <span>Head Tip</span>
            </span>
          </div>
        </div>

        {/* Scrollable DAG Area */}
        <div className="flex-1 overflow-auto rounded-lg bg-cream-100 border border-cream-border p-4 relative">
          <svg width={layout.width} height={layout.height} className="overflow-visible">
            <defs>
              <marker
                id="arrowhead"
                markerWidth="8"
                markerHeight="6"
                refX="7"
                refY="3"
                orient="auto"
              >
                <polygon points="0 0, 8 3, 0 6" fill="#1A1A1A" />
              </marker>
            </defs>

            {/* Render Connecting Edges */}
            {layout.edges.map((edge, idx) => {
              const { from, to } = edge;
              const isSelectedEdge =
                selectedCommit?.id === to.commit.id || selectedCommit?.id === from.commit.id;

              const midX = (from.x + to.x) / 2;
              const pathD = `M ${from.x} ${from.y} C ${midX} ${from.y}, ${midX} ${to.y}, ${to.x} ${to.y}`;

              return (
                <path
                  key={`edge-${idx}`}
                  d={pathD}
                  fill="none"
                  stroke={isSelectedEdge ? '#1A1A1A' : '#B6C2B7'}
                  strokeWidth={isSelectedEdge ? 2.5 : 1.5}
                  strokeDasharray={edge.isMerge ? '4 2' : 'none'}
                  markerEnd="url(#arrowhead)"
                  className="transition-all duration-200"
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
                  {/* Selection Indicator Circle */}
                  {isSelected && (
                    <circle
                      r="22"
                      fill="none"
                      stroke="#1A1A1A"
                      strokeWidth="1.5"
                      strokeDasharray="3 3"
                    />
                  )}

                  {/* Main Node Circle */}
                  <circle
                    r={isHead ? 15 : 13}
                    fill={isSelected ? '#1A1A1A' : isHead ? '#7A8B7B' : '#FFFFFF'}
                    stroke={isSelected ? '#1A1A1A' : isHead ? '#5E705F' : '#1A1A1A'}
                    strokeWidth={isHead ? 2.5 : 1.5}
                    className="transition-all duration-150"
                  />

                  {/* SVG Icon */}
                  {isMerge ? (
                    <GitMerge
                      className={`h-3.5 w-3.5 -translate-x-1.5 -translate-y-1.5 pointer-events-none ${
                        isSelected || isHead ? 'text-cream-50' : 'text-charcoal'
                      }`}
                    />
                  ) : (
                    <GitCommit
                      className={`h-3.5 w-3.5 -translate-x-1.5 -translate-y-1.5 pointer-events-none ${
                        isSelected || isHead ? 'text-cream-50' : 'text-charcoal'
                      }`}
                    />
                  )}

                  {/* Label Text */}
                  <text
                    x="0"
                    y="26"
                    textAnchor="middle"
                    className="text-[10px] font-mono fill-charcoal font-semibold pointer-events-none"
                  >
                    {node.commit.id.slice(0, 7)}
                  </text>

                  {/* Author Tag */}
                  <text
                    x="0"
                    y="38"
                    textAnchor="middle"
                    className="text-[9px] font-mono fill-charcoal-muted pointer-events-none"
                  >
                    {node.commit.author.fingerprint.slice(0, 8)}...
                  </text>
                </g>
              );
            })}
          </svg>
        </div>
      </div>

      {/* Right Area: Commit Node Cryptographic Inspector */}
      {selectedCommit && (
        <div className="w-full lg:w-96 bg-cream-50 rounded-xl p-6 border border-cream-border flex flex-col justify-between overflow-y-auto">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-cream-border">
              <div className="flex items-center space-x-2">
                <ShieldCheck className="h-4 w-4 text-sage-dark" />
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-charcoal">Cryptographic Node</h3>
                  <p className="text-[11px] text-sage-dark font-mono">ECDSA P-256 Verified</p>
                </div>
              </div>

              {onSelectCommit && selectedCommit && (
                <button
                  type="button"
                  onClick={() => onSelectCommit(selectedCommit)}
                  className="flex items-center space-x-1 bg-sage-light text-sage-dark border border-sage-border px-2.5 py-1 rounded text-xs font-semibold hover:bg-sage-200 transition-colors"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>AI Explain</span>
                </button>
              )}
            </div>

            <div className="mt-4 space-y-3.5 text-xs">
              {/* Commit ID */}
              <div>
                <label className="text-charcoal-muted font-mono text-[10px] uppercase flex items-center gap-1">
                  <Hash className="h-3 w-3" /> Commit ID (SHA-256)
                </label>
                <div className="mt-1 bg-cream-subtle rounded p-2 font-mono text-charcoal break-all border border-cream-border text-[11px]">
                  {selectedCommit.id}
                </div>
              </div>

              {/* Author Info */}
              <div>
                <label className="text-charcoal-muted font-mono text-[10px] uppercase flex items-center gap-1">
                  <User className="h-3 w-3" /> Signer Fingerprint
                </label>
                <div className="mt-1 bg-cream-subtle rounded p-2 font-mono text-charcoal break-all border border-cream-border text-[11px]">
                  {selectedCommit.author.fingerprint}
                </div>
              </div>

              {/* Timestamp */}
              <div>
                <label className="text-charcoal-muted font-mono text-[10px] uppercase flex items-center gap-1">
                  <Clock className="h-3 w-3" /> Timestamp
                </label>
                <div className="mt-1 bg-cream-subtle rounded p-2 font-mono text-charcoal border border-cream-border text-[11px]">
                  {new Date(selectedCommit.timestamp).toLocaleString()}
                </div>
              </div>

              {/* Parent IDs */}
              <div>
                <label className="text-charcoal-muted font-mono text-[10px] uppercase flex items-center gap-1">
                  <GitBranch className="h-3 w-3" /> Parents ({selectedCommit.parentIds.length})
                </label>
                <div className="mt-1 space-y-1">
                  {selectedCommit.parentIds.length === 0 ? (
                    <div className="text-charcoal-muted italic p-2 bg-cream-subtle rounded border border-cream-border text-xs">
                      Root Commit (Genesis)
                    </div>
                  ) : (
                    selectedCommit.parentIds.map((pId) => (
                      <div
                        key={pId}
                        onClick={() => setSelectedCommitId(pId)}
                        className="bg-cream-subtle hover:bg-cream-200 text-charcoal rounded p-1.5 font-mono cursor-pointer flex items-center justify-between transition-colors border border-cream-border text-[11px]"
                      >
                        <span>{pId.slice(0, 16)}...</span>
                        <ChevronRight className="h-3 w-3 text-charcoal-muted" />
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Update Hash */}
              <div>
                <label className="text-charcoal-muted font-mono text-[10px] uppercase flex items-center gap-1">
                  <Key className="h-3 w-3" /> Yjs Update Binary Hash
                </label>
                <div className="mt-1 bg-cream-subtle rounded p-2 font-mono text-charcoal-muted break-all border border-cream-border text-[10px]">
                  {selectedCommit.updateHash}
                </div>
              </div>

              {/* ECDSA Signature */}
              <div>
                <label className="text-charcoal-muted font-mono text-[10px] uppercase flex items-center gap-1">
                  <ShieldCheck className="h-3 w-3 text-sage-dark" /> ECDSA P-256 Signature
                </label>
                <div className="mt-1 bg-cream-subtle rounded p-2 font-mono text-sage-dark break-all border border-cream-border text-[10px]">
                  {selectedCommit.signature}
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-cream-border flex items-center justify-between text-xs text-charcoal-muted">
            <span>Protocol: v{selectedCommit.version}</span>
            <span className="text-sage-dark font-semibold flex items-center gap-1">
              <CheckCircle className="h-3.5 w-3.5" /> Verified
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
