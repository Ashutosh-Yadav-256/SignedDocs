import { HermesIdentity } from '@hermes/crypto';
import { HermesDocument, SignedCommitNode } from '@hermes/core';

const DB_NAME = 'HermesDocs_DB';
const DB_VERSION = 1;

export interface PersistedCommit extends SignedCommitNode {
  documentId: string;
}

export class HermesStorage {
  private dbPromise: Promise<IDBDatabase> | null = null;
  private memoryDocs: Map<string, HermesDocument> = new Map();
  private memoryCommits: Map<string, PersistedCommit[]> = new Map();
  private memoryHeads: Map<string, string[]> = new Map();
  private memoryIdentity: HermesIdentity | null = null;

  private isIndexedDBAvailable(): boolean {
    return typeof indexedDB !== 'undefined';
  }

  private async getDB(): Promise<IDBDatabase> {
    if (!this.isIndexedDBAvailable()) {
      throw new Error('IndexedDB not available');
    }

    if (!this.dbPromise) {
      this.dbPromise = new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onupgradeneeded = (event) => {
          const db = (event.target as IDBOpenDBRequest).result;

          if (!db.objectStoreNames.contains('documents')) {
            db.createObjectStore('documents', { keyPath: 'id' });
          }

          if (!db.objectStoreNames.contains('commits')) {
            const commitStore = db.createObjectStore('commits', { keyPath: 'id' });
            commitStore.createIndex('documentId', 'documentId', { unique: false });
            commitStore.createIndex('timestamp', 'timestamp', { unique: false });
          }

          if (!db.objectStoreNames.contains('heads')) {
            db.createObjectStore('heads', { keyPath: 'documentId' });
          }

          if (!db.objectStoreNames.contains('identities')) {
            db.createObjectStore('identities', { keyPath: 'id' });
          }
        };

        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });
    }

    return this.dbPromise;
  }

  // --- Document Operations ---

  public async saveDocument(doc: HermesDocument): Promise<void> {
    if (!this.isIndexedDBAvailable()) {
      this.memoryDocs.set(doc.id, { ...doc });
      return;
    }

    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('documents', 'readwrite');
      const store = tx.objectStore('documents');
      const req = store.put(doc);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }

  public async getDocument(id: string): Promise<HermesDocument | undefined> {
    if (!this.isIndexedDBAvailable()) {
      return this.memoryDocs.get(id);
    }

    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('documents', 'readonly');
      const store = tx.objectStore('documents');
      const req = store.get(id);
      req.onsuccess = () => resolve(req.result || undefined);
      req.onerror = () => reject(req.error);
    });
  }

  public async listDocuments(): Promise<HermesDocument[]> {
    if (!this.isIndexedDBAvailable()) {
      return Array.from(this.memoryDocs.values());
    }

    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('documents', 'readonly');
      const store = tx.objectStore('documents');
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => reject(req.error);
    });
  }

  public async deleteDocument(id: string): Promise<void> {
    if (!this.isIndexedDBAvailable()) {
      this.memoryDocs.delete(id);
      this.memoryCommits.delete(id);
      this.memoryHeads.delete(id);
      return;
    }

    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(['documents', 'commits', 'heads'], 'readwrite');
      tx.objectStore('documents').delete(id);
      tx.objectStore('heads').delete(id);

      const commitStore = tx.objectStore('commits');
      const index = commitStore.index('documentId');
      const req = index.openCursor(IDBKeyRange.only(id));
      req.onsuccess = () => {
        const cursor = req.result;
        if (cursor) {
          cursor.delete();
          cursor.continue();
        }
      };

      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  // --- Commit Operations ---

  public async saveCommit(documentId: string, commit: SignedCommitNode): Promise<void> {
    const persisted: PersistedCommit = { ...commit, documentId };

    if (!this.isIndexedDBAvailable()) {
      const list = this.memoryCommits.get(documentId) || [];
      if (!list.some((c) => c.id === commit.id)) {
        list.push(persisted);
        this.memoryCommits.set(documentId, list);
      }
      return;
    }

    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('commits', 'readwrite');
      const store = tx.objectStore('commits');
      const req = store.put(persisted);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }

  public async getCommits(documentId: string): Promise<SignedCommitNode[]> {
    if (!this.isIndexedDBAvailable()) {
      return this.memoryCommits.get(documentId) || [];
    }

    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('commits', 'readonly');
      const store = tx.objectStore('commits');
      const index = store.index('documentId');
      const req = index.getAll(IDBKeyRange.only(documentId));

      req.onsuccess = () => {
        const results: PersistedCommit[] = req.result || [];
        // Map back to SignedCommitNode
        const commits: SignedCommitNode[] = results.map((r) => ({
          version: r.version,
          id: r.id,
          parentIds: r.parentIds,
          author: r.author,
          timestamp: r.timestamp,
          updateHash: r.updateHash,
          updateBinary: r.updateBinary,
          signature: r.signature,
        }));
        resolve(commits);
      };
      req.onerror = () => reject(req.error);
    });
  }

  // --- DAG Heads Operations ---

  public async setHeads(documentId: string, heads: string[]): Promise<void> {
    if (!this.isIndexedDBAvailable()) {
      this.memoryHeads.set(documentId, heads);
      return;
    }

    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('heads', 'readwrite');
      const store = tx.objectStore('heads');
      const req = store.put({ documentId, heads });
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }

  public async getHeads(documentId: string): Promise<string[]> {
    if (!this.isIndexedDBAvailable()) {
      return this.memoryHeads.get(documentId) || [];
    }

    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('heads', 'readonly');
      const store = tx.objectStore('heads');
      const req = store.get(documentId);
      req.onsuccess = () => resolve(req.result ? req.result.heads : []);
      req.onerror = () => reject(req.error);
    });
  }

  // --- Cryptographic Identity Operations ---

  public async saveIdentity(identity: HermesIdentity, identityKey: string = 'primary_identity'): Promise<void> {
    if (!this.isIndexedDBAvailable()) {
      this.memoryIdentity = identity;
      return;
    }

    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('identities', 'readwrite');
      const store = tx.objectStore('identities');
      const req = store.put({
        id: identityKey,
        fingerprint: identity.fingerprint,
        publicKeyBase64: identity.publicKeyBase64,
        publicKey: identity.publicKey,
        privateKey: identity.privateKey,
      });
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }

  public async loadIdentity(identityKey: string = 'primary_identity'): Promise<HermesIdentity | null> {
    if (!this.isIndexedDBAvailable()) {
      return this.memoryIdentity;
    }

    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('identities', 'readonly');
      const store = tx.objectStore('identities');
      const req = store.get(identityKey);
      req.onsuccess = () => {
        if (!req.result) {
          resolve(null);
        } else {
          resolve({
            fingerprint: req.result.fingerprint,
            publicKeyBase64: req.result.publicKeyBase64,
            publicKey: req.result.publicKey,
            privateKey: req.result.privateKey,
          });
        }
      };
      req.onerror = () => reject(req.error);
    });
  }
}
