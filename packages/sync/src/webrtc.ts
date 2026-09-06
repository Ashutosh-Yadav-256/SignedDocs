import { DEFAULT_STUN_SERVERS, HermesMessage, isHermesMessage } from '@hermes/protocol';
import { SyncTransport, TransportStatus } from './transport.js';

export interface WebRTCTransportOptions {
  signalingUrl?: string;
  roomCode?: string;
  stunServers?: string[];
}

export class WebRTCTransport implements SyncTransport {
  public readonly id = 'webrtc_p2p';
  public readonly name = 'Peer-to-Peer LAN / WebRTC';
  private documentId: string;
  private signalingUrl: string;
  private roomCode: string;
  private stunServers: string[];
  private ws: WebSocket | null = null;
  private peerConnections: Map<string, RTCPeerConnection> = new Map();
  private dataChannels: Map<string, RTCDataChannel> = new Map();
  private messageHandlers: ((msg: HermesMessage) => void)[] = [];
  private statusHandlers: ((status: TransportStatus) => void)[] = [];
  private status: TransportStatus = 'DISCONNECTED';
  private localPeerId: string = Math.random().toString(36).substring(2, 10);

  constructor(documentId: string, options: WebRTCTransportOptions = {}) {
    this.documentId = documentId;
    this.roomCode = options.roomCode || documentId;
    const defaultSignaling =
      typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
        ? 'ws://localhost:4444'
        : 'wss://hermes-signaling-relay.onrender.com';
    this.signalingUrl = options.signalingUrl || defaultSignaling;
    this.stunServers = options.stunServers || DEFAULT_STUN_SERVERS; // Empty array for air-gapped default
  }

  public getStatus(): TransportStatus {
    return this.status;
  }

  public connect(): void {
    if (typeof WebSocket === 'undefined' || typeof RTCPeerConnection === 'undefined') {
      return;
    }

    this.setStatus('CONNECTING');

    try {
      this.ws = new WebSocket(this.signalingUrl);

      this.ws.onopen = () => {
        // Join the room for this document
        this.sendSignal({
          type: 'join',
          room: this.roomCode,
          peerId: this.localPeerId,
        });
      };

      this.ws.onmessage = async (event) => {
        try {
          const signal = JSON.parse(event.data);
          await this.handleSignalingMessage(signal);
        } catch (err) {
          console.warn('Invalid signaling payload received', err);
        }
      };

      this.ws.onerror = () => {
        // Signaling is an optional enhancement; local-first continues uninterrupted
        this.setStatus('DISCONNECTED');
      };

      this.ws.onclose = () => {
        this.setStatus('DISCONNECTED');
      };
    } catch {
      this.setStatus('DISCONNECTED');
    }
  }

  private sendSignal(msg: any): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(msg));
    }
  }

  private setStatus(newStatus: TransportStatus): void {
    if (this.status !== newStatus) {
      this.status = newStatus;
      for (const handler of this.statusHandlers) {
        handler(this.status);
      }
    }
  }

  private async handleSignalingMessage(signal: any): Promise<void> {
    const { type, peerId, targetPeerId, offer, answer, candidate } = signal;

    if (peerId === this.localPeerId) return;
    if (targetPeerId && targetPeerId !== this.localPeerId) return;

    if (type === 'peer_joined') {
      // Initiate WebRTC offer to the newly joined peer
      await this.initiateOffer(peerId);
    } else if (type === 'offer') {
      await this.handleOffer(peerId, offer);
    } else if (type === 'answer') {
      await this.handleAnswer(peerId, answer);
    } else if (type === 'candidate') {
      await this.handleCandidate(peerId, candidate);
    }
  }

  private createPeerConnection(remotePeerId: string): RTCPeerConnection {
    const pc = new RTCPeerConnection({
      iceServers: this.stunServers.map((url) => ({ urls: url })),
    });

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        this.sendSignal({
          type: 'candidate',
          room: this.roomCode,
          peerId: this.localPeerId,
          targetPeerId: remotePeerId,
          candidate: event.candidate,
        });
      }
    };

    pc.onconnectionstatechange = () => {
      if (pc.connectionState === 'connected') {
        this.setStatus('CONNECTED');
      } else if (
        pc.connectionState === 'disconnected' ||
        pc.connectionState === 'failed' ||
        pc.connectionState === 'closed'
      ) {
        this.peerConnections.delete(remotePeerId);
        this.dataChannels.delete(remotePeerId);
        if (this.peerConnections.size === 0) {
          this.setStatus('DISCONNECTED');
        }
      }
    };

    this.peerConnections.set(remotePeerId, pc);
    return pc;
  }

  private setupDataChannel(channel: RTCDataChannel): void {
    channel.onopen = () => {
      this.setStatus('CONNECTED');
    };

    channel.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (isHermesMessage(data) && data.documentId === this.documentId) {
          for (const handler of this.messageHandlers) {
            handler(data);
          }
        }
      } catch (err) {
        console.warn('Failed to parse DataChannel message', err);
      }
    };
  }

  private async initiateOffer(remotePeerId: string): Promise<void> {
    const pc = this.createPeerConnection(remotePeerId);
    const channel = pc.createDataChannel('hermes_sync', { ordered: true });
    this.dataChannels.set(remotePeerId, channel);
    this.setupDataChannel(channel);

    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);

    this.sendSignal({
      type: 'offer',
      room: this.roomCode,
      peerId: this.localPeerId,
      targetPeerId: remotePeerId,
      offer,
    });
  }

  private async handleOffer(remotePeerId: string, offer: RTCSessionDescriptionInit): Promise<void> {
    const pc = this.createPeerConnection(remotePeerId);

    pc.ondatachannel = (event) => {
      const channel = event.channel;
      this.dataChannels.set(remotePeerId, channel);
      this.setupDataChannel(channel);
    };

    await pc.setRemoteDescription(new RTCSessionDescription(offer));
    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);

    this.sendSignal({
      type: 'answer',
      room: this.roomCode,
      peerId: this.localPeerId,
      targetPeerId: remotePeerId,
      answer,
    });
  }

  private async handleAnswer(remotePeerId: string, answer: RTCSessionDescriptionInit): Promise<void> {
    const pc = this.peerConnections.get(remotePeerId);
    if (pc) {
      await pc.setRemoteDescription(new RTCSessionDescription(answer));
    }
  }

  private async handleCandidate(remotePeerId: string, candidate: RTCIceCandidateInit): Promise<void> {
    const pc = this.peerConnections.get(remotePeerId);
    if (pc && candidate) {
      await pc.addIceCandidate(new RTCIceCandidate(candidate));
    }
  }

  public send(message: HermesMessage): void {
    const payload = JSON.stringify(message);
    for (const channel of this.dataChannels.values()) {
      if (channel.readyState === 'open') {
        try {
          channel.send(payload);
        } catch (err) {
          console.error('Failed to send over WebRTC DataChannel', err);
        }
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
    for (const dc of this.dataChannels.values()) {
      dc.close();
    }
    this.dataChannels.clear();

    for (const pc of this.peerConnections.values()) {
      pc.close();
    }
    this.peerConnections.clear();

    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }

    this.setStatus('DISCONNECTED');
  }
}
