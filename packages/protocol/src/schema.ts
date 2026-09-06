import { HermesMessage } from './messages.js';

export function isHermesMessage(obj: any): obj is HermesMessage {
  if (!obj || typeof obj !== 'object') return false;
  const validTypes = [
    'IDENTITY_HELLO',
    'DAG_HEADS',
    'SYNC_REQUEST',
    'SYNC_RESPONSE',
    'NEW_COMMIT',
    'AWARENESS',
  ];
  return validTypes.includes(obj.type) && typeof obj.documentId === 'string';
}
