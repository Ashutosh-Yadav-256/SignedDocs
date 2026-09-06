import { SignedCommitNode } from './types.js';

export class CommitDAG {
  private commits: Map<string, SignedCommitNode> = new Map();
  private children: Map<string, Set<string>> = new Map();
  private heads: Set<string> = new Set();

  constructor(initialCommits: SignedCommitNode[] = []) {
    for (const commit of initialCommits) {
      this.insert(commit);
    }
  }

  /**
   * Inserts a commit node into the DAG.
   * Updates child pointers and DAG heads.
   */
  public insert(commit: SignedCommitNode): void {
    if (this.commits.has(commit.id)) {
      return; // Already present
    }

    this.commits.set(commit.id, commit);
    if (!this.children.has(commit.id)) {
      this.children.set(commit.id, new Set());
    }

    // Update parent-to-child links
    for (const parentId of commit.parentIds) {
      if (!this.children.has(parentId)) {
        this.children.set(parentId, new Set());
      }
      this.children.get(parentId)!.add(commit.id);

      // Parent is no longer a head if it has a child
      this.heads.delete(parentId);
    }

    // If this commit has no children yet, it is currently a head
    if (this.children.get(commit.id)!.size === 0) {
      this.heads.add(commit.id);
    }
  }

  public get(id: string): SignedCommitNode | undefined {
    return this.commits.get(id);
  }

  public has(id: string): boolean {
    return this.commits.has(id);
  }

  public size(): number {
    return this.commits.size;
  }

  /**
   * Returns current DAG heads (tips with no children).
   * Sorted deterministically.
   */
  public getHeads(): string[] {
    return Array.from(this.heads).sort();
  }

  /**
   * Returns all commits in the DAG.
   */
  public getAllCommits(): SignedCommitNode[] {
    return Array.from(this.commits.values());
  }

  /**
   * Returns all ancestors of a given commit ID (including transitive parents).
   */
  public getAncestors(commitId: string): Set<string> {
    const ancestors = new Set<string>();
    const queue = [commitId];

    while (queue.length > 0) {
      const currentId = queue.shift()!;
      const node = this.commits.get(currentId);
      if (!node) continue;

      for (const parentId of node.parentIds) {
        if (!ancestors.has(parentId)) {
          ancestors.add(parentId);
          queue.push(parentId);
        }
      }
    }

    return ancestors;
  }

  /**
   * Checks if candidateAncestor is an ancestor of targetCommit.
   */
  public isAncestor(candidateAncestorId: string, targetCommitId: string): boolean {
    if (candidateAncestorId === targetCommitId) return true;
    const ancestors = this.getAncestors(targetCommitId);
    return ancestors.has(candidateAncestorId);
  }

  /**
   * Finds the lowest common ancestor (LCA) between two commit IDs.
   */
  public findCommonAncestor(idA: string, idB: string): string | null {
    if (idA === idB) return idA;

    const ancestorsA = this.getAncestors(idA);
    ancestorsA.add(idA);

    const queue = [idB];
    const visitedB = new Set<string>();

    while (queue.length > 0) {
      const current = queue.shift()!;
      if (visitedB.has(current)) continue;
      visitedB.add(current);

      if (ancestorsA.has(current)) {
        return current;
      }

      const node = this.commits.get(current);
      if (node) {
        for (const p of node.parentIds) {
          queue.push(p);
        }
      }
    }

    return null;
  }

  /**
   * Computes commits that exist locally but are not reachable from remoteHeads.
   */
  public getMissingCommits(remoteHeads: string[]): SignedCommitNode[] {
    const remoteReachable = new Set<string>();

    for (const head of remoteHeads) {
      if (this.commits.has(head)) {
        remoteReachable.add(head);
        const ancestors = this.getAncestors(head);
        for (const a of ancestors) {
          remoteReachable.add(a);
        }
      }
    }

    const missing: SignedCommitNode[] = [];
    const sorted = this.topologicalSort();

    for (const commit of sorted) {
      if (!remoteReachable.has(commit.id)) {
        missing.push(commit);
      }
    }

    return missing;
  }

  /**
   * Returns topologically sorted commits (parents guaranteed before children).
   */
  public topologicalSort(): SignedCommitNode[] {
    const inDegree = new Map<string, number>();
    for (const id of this.commits.keys()) {
      inDegree.set(id, 0);
    }

    for (const commit of this.commits.values()) {
      for (const parentId of commit.parentIds) {
        if (this.commits.has(parentId)) {
          // Parent must come before child
        }
      }
    }

    // Number of parents that must be processed before this node
    for (const commit of this.commits.values()) {
      let parentsInDag = 0;
      for (const parentId of commit.parentIds) {
        if (this.commits.has(parentId)) {
          parentsInDag++;
        }
      }
      inDegree.set(commit.id, parentsInDag);
    }

    const queue: string[] = [];
    for (const [id, deg] of inDegree.entries()) {
      if (deg === 0) {
        queue.push(id);
      }
    }

    // Deterministic sort for roots
    queue.sort((a, b) => {
      const timeA = this.commits.get(a)?.timestamp || 0;
      const timeB = this.commits.get(b)?.timestamp || 0;
      return timeA - timeB;
    });

    const result: SignedCommitNode[] = [];

    while (queue.length > 0) {
      const currentId = queue.shift()!;
      const node = this.commits.get(currentId)!;
      result.push(node);

      const childSet = this.children.get(currentId);
      if (childSet) {
        for (const childId of childSet) {
          const currentDeg = inDegree.get(childId)! - 1;
          inDegree.set(childId, currentDeg);
          if (currentDeg === 0) {
            queue.push(childId);
          }
        }
      }
    }

    return result;
  }

  /**
   * Detects if the graph contains any cycles.
   */
  public hasCycles(): boolean {
    const sorted = this.topologicalSort();
    return sorted.length !== this.commits.size;
  }
}
