import { sha256Bytes } from './hashing.js';
import { stringToUint8Array, uint8ArrayToString, uint8ArrayToBase64, base64ToUint8Array } from './encoding.js';

function toArrayBuffer(u8: Uint8Array): ArrayBuffer {
  return u8.buffer.slice(u8.byteOffset, u8.byteOffset + u8.byteLength) as ArrayBuffer;
}

/**
 * Derives a 256-bit AES-GCM symmetric encryption key from a collaborative room code.
 */
export async function deriveRoomKey(roomCode: string): Promise<CryptoKey> {
  const saltBytes = stringToUint8Array(`hermes-chat-e2ee:${roomCode}`);
  const keyMaterial = await sha256Bytes(saltBytes);

  return globalThis.crypto.subtle.importKey(
    'raw',
    toArrayBuffer(keyMaterial),
    { name: 'AES-GCM' },
    false,
    ['encrypt', 'decrypt']
  );
}

/**
 * Encrypts a plaintext chat message using AES-GCM with a random 12-byte initialization vector.
 */
export async function encryptChatMessage(
  plaintext: string,
  roomKey: CryptoKey
): Promise<{ ciphertext: string; iv: string }> {
  const iv = globalThis.crypto.getRandomValues(new Uint8Array(12));
  const encodedPlaintext = stringToUint8Array(plaintext);

  const encryptedBuffer = await globalThis.crypto.subtle.encrypt(
    { name: 'AES-GCM', iv: toArrayBuffer(iv) },
    roomKey,
    toArrayBuffer(encodedPlaintext)
  );

  return {
    ciphertext: uint8ArrayToBase64(new Uint8Array(encryptedBuffer)),
    iv: uint8ArrayToBase64(iv),
  };
}

/**
 * Decrypts an AES-GCM ciphertext payload back to plaintext using the room key.
 */
export async function decryptChatMessage(
  ciphertextBase64: string,
  ivBase64: string,
  roomKey: CryptoKey
): Promise<string> {
  const ciphertext = base64ToUint8Array(ciphertextBase64);
  const iv = base64ToUint8Array(ivBase64);

  const decryptedBuffer = await globalThis.crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: toArrayBuffer(iv) },
    roomKey,
    toArrayBuffer(ciphertext)
  );

  return uint8ArrayToString(new Uint8Array(decryptedBuffer));
}
