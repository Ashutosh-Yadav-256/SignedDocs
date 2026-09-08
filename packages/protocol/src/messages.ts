import { HermesAuthor, SignedCommitNode } from '@hermes/core';

export interface IdentityHelloMessage {
  type: 'IDENTITY_HELLO';
  protocolVersion: 1;
  documentId: string;
  author: HermesAuthor;
  timestamp: number;
}

export interface DAGHeadsMessage {
  type: 'DAG_HEADS';
  documentId: string;
  heads: string[];
  timestamp: number;
}

export interface SyncRequestMessage {
  type: 'SYNC_REQUEST';
  documentId: string;
  knownHeads: string[];
}

export interface SyncResponseMessage {
  type: 'SYNC_RESPONSE';
  documentId: string;
  commits: SignedCommitNode[];
}

export interface NewCommitMessage {
  type: 'NEW_COMMIT';
  documentId: string;
  commit: SignedCommitNode;
}

export interface AwarenessMessage {
  type: 'AWARENESS';
  documentId: string;
  author: HermesAuthor;
  state: {
    cursor?: {
      anchor: number;
      head: number;
    };
    color: string;
    displayName?: string;
    lastActive: number;
  };
  awarenessUpdate?: string;
}

export type HermesMessage =
  | IdentityHelloMessage
  | DAGHeadsMessage
  | SyncRequestMessage
  | SyncResponseMessage
  | NewCommitMessage
  | AwarenessMessage;
