import { stringToUint8Array, uint8ArrayToHex } from './encoding.js';

/**
 * Computes SHA-256 digest returning a hex string.
 */
export async function sha256Hex(data: Uint8Array | string | ArrayBuffer): Promise<string> {
  const bytes = await sha256Bytes(data);
  return uint8ArrayToHex(bytes);
}

/**
 * Computes SHA-256 digest returning raw Uint8Array bytes.
 */
export async function sha256Bytes(data: Uint8Array | string | ArrayBuffer): Promise<Uint8Array> {
  let buffer: ArrayBuffer;
  if (typeof data === 'string') {
    const u8 = stringToUint8Array(data);
    buffer = u8.buffer.slice(u8.byteOffset, u8.byteOffset + u8.byteLength) as ArrayBuffer;
  } else if (data instanceof Uint8Array) {
    buffer = data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength) as ArrayBuffer;
  } else {
    buffer = data;
  }

  const subtle = globalThis.crypto.subtle;
  const hashBuffer = await subtle.digest('SHA-256', buffer);
  return new Uint8Array(hashBuffer);
}
