import { HermesMessage, isHermesMessage } from '@hermes/protocol';
import { SyncTransport, TransportStatus } from './transport.js';

export class BroadcastChannelTransport implements SyncTransport {
  public readonly id = 'broadcast_channel';
  public readonly name = 'Same-Browser Tabs (BroadcastChannel)';
  private channel: BroadcastChannel | null = null;
  private messageHandlers: ((msg: HermesMessage) => void)[] = [];
  private statusHandlers: ((status: TransportStatus) => void)[] = [];
  private status: TransportStatus = 'DISCONNECTED';
  private documentId: string;

  constructor(documentId: string) {
    this.documentId = documentId;
    if (typeof BroadcastChannel !== 'undefined') {
      try {
        this.channel = new BroadcastChannel(`hermes_doc_${documentId}`);
        this.status = 'CONNECTED';
        this.channel.onmessage = (event) => {
          const data = event.data;
          if (isHermesMessage(data) && data.documentId === this.documentId) {
            for (const handler of this.messageHandlers) {
              handler(data);
            }
          }
        };
      } catch (err) {
        console.warn('BroadcastChannel initialization failed', err);
        this.status = 'DISCONNECTED';
      }
    }
  }

  public getStatus(): TransportStatus {
    return this.status;
  }

  public send(message: HermesMessage): void {
    if (this.channel && this.status === 'CONNECTED') {
      try {
        this.channel.postMessage(message);
      } catch (err) {
        console.error('Failed to post message over BroadcastChannel', err);
      }
    }
  }

  public onMessage(handler: (msg: HermesMessage) => void): void {
    this.messageHandlers.push(handler);
  }

  public onStatusChange(handler: (status: TransportStatus) => void): void {
    this.statusHandlers.push(handler);
    handler(this.status);
  }

  public close(): void {
    if (this.channel) {
      this.channel.close();
      this.channel = null;
    }
    this.status = 'DISCONNECTED';
    for (const handler of this.statusHandlers) {
      handler(this.status);
    }
  }
}
