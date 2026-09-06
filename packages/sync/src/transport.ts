import { HermesMessage } from '@hermes/protocol';

export type TransportStatus = 'DISCONNECTED' | 'CONNECTING' | 'CONNECTED';

export interface SyncTransport {
  readonly id: string;
  readonly name: string;
  getStatus(): TransportStatus;
  send(message: HermesMessage): void;
  onMessage(handler: (msg: HermesMessage) => void): void;
  onStatusChange(handler: (status: TransportStatus) => void): void;
  close(): void;
}
