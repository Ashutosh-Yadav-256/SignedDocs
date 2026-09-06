import { sha256Hex } from './hashing.js';
import { stringToUint8Array } from './encoding.js';

export interface MerkleProofStep {
  position: 'left' | 'right';
  hash: string;
}

export interface MerkleProof {
  leafIndex: number;
  leafHash: string;
  steps: MerkleProofStep[];
  root: string;
}

export interface MerkleTree {
  leaves: string[];
  levels: string[][];
  root: string;
}

/**
 * Combines two child hashes in order: SHA-256(leftHash + rightHash)
 */
export async function hashPair(left: string, right: string): Promise<string> {
  const combined = left + right;
  return sha256Hex(stringToUint8Array(combined));
}

/**
 * Builds a complete Merkle Tree from an array of leaf hashes (e.g. paragraph/clause hashes).
 * If number of leaves is odd, the last leaf is duplicated to balance the tree.
 */
export async function buildMerkleTree(leafHashes: string[]): Promise<MerkleTree> {
  if (leafHashes.length === 0) {
    const emptyRoot = await sha256Hex(stringToUint8Array(''));
    return {
      leaves: [],
      levels: [[emptyRoot]],
      root: emptyRoot,
    };
  }

  const levels: string[][] = [leafHashes.slice()];
  let currentLevel = leafHashes.slice();

  while (currentLevel.length > 1) {
    const nextLevel: string[] = [];
    for (let i = 0; i < currentLevel.length; i += 2) {
      const left = currentLevel[i];
      const right = i + 1 < currentLevel.length ? currentLevel[i + 1] : left; // duplicate if odd
      const parentHash = await hashPair(left, right);
      nextLevel.push(parentHash);
    }
    levels.push(nextLevel);
    currentLevel = nextLevel;
  }

  return {
    leaves: leafHashes,
    levels,
    root: levels[levels.length - 1][0],
  };
}

/**
 * Generates an inclusion proof (Merkle path) for a specific leaf index.
 */
export function generateMerkleProof(tree: MerkleTree, leafIndex: number): MerkleProof {
  if (leafIndex < 0 || leafIndex >= tree.leaves.length) {
    throw new Error(`Invalid leafIndex ${leafIndex} for tree with ${tree.leaves.length} leaves`);
  }

  const steps: MerkleProofStep[] = [];
  let currentIndex = leafIndex;

  for (let levelIdx = 0; levelIdx < tree.levels.length - 1; levelIdx++) {
    const level = tree.levels[levelIdx];
    const isRightChild = currentIndex % 2 === 1;
    const siblingIndex = isRightChild ? currentIndex - 1 : currentIndex + 1;

    if (siblingIndex < level.length) {
      steps.push({
        position: isRightChild ? 'left' : 'right',
        hash: level[siblingIndex],
      });
    } else {
      // Sibling was duplicate of current node
      steps.push({
        position: 'right',
        hash: level[currentIndex],
      });
    }

    currentIndex = Math.floor(currentIndex / 2);
  }

  return {
    leafIndex,
    leafHash: tree.leaves[leafIndex],
    steps,
    root: tree.root,
  };
}

/**
 * Cryptographically verifies a Merkle proof path against the expected Merkle Root.
 */
export async function verifyMerkleProof(
  root: string,
  leafHash: string,
  proof: MerkleProof
): Promise<boolean> {
  if (!proof || !proof.steps) return false;

  let currentHash = leafHash;

  for (const step of proof.steps) {
    if (step.position === 'left') {
      currentHash = await hashPair(step.hash, currentHash);
    } else {
      currentHash = await hashPair(currentHash, step.hash);
    }
  }

  return currentHash.toLowerCase() === root.toLowerCase();
}
