import { useState, useEffect, useRef, useCallback } from 'react';
import { SyncEngine } from '@hermes/sync';
import {
  HermesIdentity,
  deriveRoomKey,
  encryptChatMessage,
  decryptChatMessage,
  signData,
  verifySignature,
  stringToUint8Array,
} from '@hermes/crypto';
import { ChatEncryptedMessage } from '@hermes/protocol';

export interface ChatMessageItem {
  id: string;
  text: string;
  authorFingerprint: string;
  authorShortId: string;
  authorName: string;
  authorColor: string;
  timestamp: number;
  isVerified: boolean;
  isSelf: boolean;
  roomCode: string;
}

export interface UseHermesChatOptions {
  documentId: string;
  initialRoomCode: string;
  identity: HermesIdentity | null;
  displayName: string;
  userColor: string;
  syncEngine: SyncEngine | null;
}

export function useHermesChat(options: UseHermesChatOptions) {
  const {
    documentId,
    initialRoomCode,
    identity,
    displayName,
    userColor,
    syncEngine,
  } = options;

  const [activeRoom, setActiveRoom] = useState(initialRoomCode);
  const [knownRooms, setKnownRooms] = useState<string[]>(() => {
    return [initialRoomCode];
  });
  const [messages, setMessages] = useState<ChatMessageItem[]>([]);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  // Cache derived CryptoKeys per room code
  const roomKeysCache = useRef<Map<string, CryptoKey>>(new Map());

  const getOrCreateRoomKey = useCallback(async (room: string): Promise<CryptoKey> => {
    if (roomKeysCache.current.has(room)) {
      return roomKeysCache.current.get(room)!;
    }
    const key = await deriveRoomKey(room);
    roomKeysCache.current.set(room, key);
    return key;
  }, []);

  // Update known rooms when initialRoomCode changes
  useEffect(() => {
    setActiveRoom(initialRoomCode);
    setKnownRooms((prev) => (prev.includes(initialRoomCode) ? prev : [initialRoomCode, ...prev]));
  }, [initialRoomCode]);

  // Handle incoming encrypted chat messages from peers
  useEffect(() => {
    if (!syncEngine || !identity) return;

    const unsubscribe = syncEngine.onChatMessage(async (msg: ChatEncryptedMessage) => {
      // Ignore messages for other documents
      if (msg.documentId !== documentId) return;

      // Ensure room is tracked
      setKnownRooms((prev) => (prev.includes(msg.roomCode) ? prev : [...prev, msg.roomCode]));

      const isSelf = msg.author.fingerprint === identity.fingerprint;

      try {
        // 1. Verify author cryptographic signature
        const sigPayload = stringToUint8Array(`${msg.ciphertext}:${msg.iv}:${msg.timestamp}:${msg.author.fingerprint}`);
        const isVerified = await verifySignature(msg.author.publicKey, msg.signature, sigPayload);

        // 2. Decrypt message payload with room key
        const roomKey = await getOrCreateRoomKey(msg.roomCode);
        const plaintext = await decryptChatMessage(msg.ciphertext, msg.iv, roomKey);

        const shortHex = msg.author.fingerprint.replace('hermes:', '').slice(0, 8);
        const item: ChatMessageItem = {
          id: msg.id,
          text: plaintext,
          authorFingerprint: msg.author.fingerprint,
          authorShortId: shortHex,
          authorName: msg.author.displayName || `Author #${shortHex}`,
          authorColor: msg.authorColor || '#7A8B7B',
          timestamp: msg.timestamp,
          isVerified,
          isSelf,
          roomCode: msg.roomCode,
        };

        setMessages((prev) => {
          if (prev.some((m) => m.id === item.id)) return prev;
          return [...prev, item];
        });

        if (!isChatOpen && !isSelf) {
          setUnreadCount((c) => c + 1);
        }
      } catch (err) {
        console.warn('[Hermes E2EE Chat] Failed to verify or decrypt incoming chat message', err);
      }
    });

    return () => {
      unsubscribe();
    };
  }, [syncEngine, identity, documentId, isChatOpen, getOrCreateRoomKey]);

  // Send an E2EE encrypted chat message
  const sendMessage = useCallback(
    async (text: string): Promise<boolean> => {
      const trimmed = text.trim();
      if (!trimmed || !syncEngine || !identity) return false;

      try {
        const roomKey = await getOrCreateRoomKey(activeRoom);
        const { ciphertext, iv } = await encryptChatMessage(trimmed, roomKey);

        const timestamp = Date.now();
        const sigPayload = stringToUint8Array(`${ciphertext}:${iv}:${timestamp}:${identity.fingerprint}`);
        const signature = await signData(identity.privateKey, sigPayload);

        const msgId = `chat_${timestamp}_${Math.random().toString(36).substring(2, 7)}`;
        const encryptedMsg: ChatEncryptedMessage = {
          type: 'CHAT_MESSAGE',
          documentId,
          roomCode: activeRoom,
          id: msgId,
          author: {
            fingerprint: identity.fingerprint,
            publicKey: identity.publicKeyBase64,
            displayName,
          },
          authorColor: userColor,
          ciphertext,
          iv,
          signature,
          timestamp,
        };

        // Broadcast to peers over BroadcastChannel & WebRTC transports
        syncEngine.broadcastChatMessage(encryptedMsg);

        // Add to local message list immediately
        const shortHex = identity.fingerprint.replace('hermes:', '').slice(0, 8);
        const localItem: ChatMessageItem = {
          id: msgId,
          text: trimmed,
          authorFingerprint: identity.fingerprint,
          authorShortId: shortHex,
          authorName: displayName || `Author #${shortHex}`,
          authorColor: userColor,
          timestamp,
          isVerified: true,
          isSelf: true,
          roomCode: activeRoom,
        };

        setMessages((prev) => [...prev, localItem]);
        return true;
      } catch (err) {
        console.error('[Hermes E2EE Chat] Failed to encrypt and dispatch message', err);
        return false;
      }
    },
    [syncEngine, identity, documentId, activeRoom, displayName, userColor, getOrCreateRoomKey]
  );

  // Switch to an existing room
  const switchRoom = useCallback((roomCode: string) => {
    const cleanRoom = roomCode.trim();
    if (!cleanRoom) return;
    setActiveRoom(cleanRoom);
    setKnownRooms((prev) => (prev.includes(cleanRoom) ? prev : [...prev, cleanRoom]));
  }, []);

  // Start a fresh, private secure chat room
  const startFreshRoom = useCallback(() => {
    const freshRoomId = `room_${Math.random().toString(36).substring(2, 9)}`;
    setActiveRoom(freshRoomId);
    setKnownRooms((prev) => [freshRoomId, ...prev]);
    return freshRoomId;
  }, []);

  const openChat = useCallback(() => {
    setIsChatOpen(true);
    setUnreadCount(0);
  }, []);

  const closeChat = useCallback(() => {
    setIsChatOpen(false);
  }, []);

  const toggleChat = useCallback(() => {
    setIsChatOpen((prev) => {
      const next = !prev;
      if (next) setUnreadCount(0);
      return next;
    });
  }, []);

  // Filter messages for current active room
  const currentRoomMessages = messages.filter((m) => m.roomCode === activeRoom);

  return {
    messages: currentRoomMessages,
    allMessages: messages,
    activeRoom,
    knownRooms,
    isChatOpen,
    unreadCount,
    sendMessage,
    switchRoom,
    startFreshRoom,
    openChat,
    closeChat,
    toggleChat,
  };
}
