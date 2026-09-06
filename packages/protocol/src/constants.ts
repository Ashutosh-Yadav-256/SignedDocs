export const PROTOCOL_VERSION = 1 as const;
export const DEFAULT_DEBOUNCE_MS = 1500;
export const DEFAULT_MAX_BATCH_SIZE = 50;
export const MAX_MESSAGE_SIZE_BYTES = 5 * 1024 * 1024; // 5MB limit

/**
 * Air-gapped / Local-first default: No external STUN servers contacted.
 * Uses WebRTC host candidates directly over LAN / local signaling.
 */
/**
 * Default public STUN servers for WebRTC peer-to-peer NAT traversal across the internet.
 */
export const PUBLIC_STUN_SERVERS: string[] = [
  'stun:stun.l.google.com:19302',
  'stun:global.stun.twilio.com:3478',
];

export const AIR_GAPPED_STUN_SERVERS: string[] = [];

export const DEV_OPTIONAL_STUN_SERVERS: string[] = PUBLIC_STUN_SERVERS;

export const DEFAULT_STUN_SERVERS: string[] = PUBLIC_STUN_SERVERS;

