import { CRYPTO } from '@/constants';

// ─── Helpers ────────────────────────────────────────────────────────────────

function uint8ToBase64(bytes: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function base64ToUint8(base64: string): Uint8Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

function generateIV(): Uint8Array {
  return crypto.getRandomValues(new Uint8Array(CRYPTO.IV_LENGTH));
}

function toBuffer(data: Uint8Array): ArrayBuffer {
  return data.buffer as ArrayBuffer;
}

// ─── AES-256-GCM Encrypt/Decrypt ────────────────────────────────────────────

export interface EncryptedPayload {
  ciphertext: string; // base64
  iv: string; // base64
  tag: string; // base64
}

export async function encrypt(
  plaintext: string,
  key: CryptoKey,
): Promise<EncryptedPayload> {
  const iv = generateIV();
  const encoded = new TextEncoder().encode(plaintext);

  const encrypted = await crypto.subtle.encrypt(
    { name: CRYPTO.ALGORITHM, iv: toBuffer(iv), tagLength: CRYPTO.TAG_LENGTH * 8 },
    key,
    encoded,
  );

  const encryptedBytes = new Uint8Array(encrypted);
  const ciphertext = encryptedBytes.slice(0, encryptedBytes.length - CRYPTO.TAG_LENGTH);
  const tag = encryptedBytes.slice(encryptedBytes.length - CRYPTO.TAG_LENGTH);

  return {
    ciphertext: uint8ToBase64(ciphertext),
    iv: uint8ToBase64(iv),
    tag: uint8ToBase64(tag),
  };
}

export async function decrypt(
  ciphertext: string,
  iv: string,
  tag: string,
  key: CryptoKey,
): Promise<string> {
  const ciphertextBytes = base64ToUint8(ciphertext);
  const ivBytes = base64ToUint8(iv);
  const tagBytes = base64ToUint8(tag);

  const combined = new Uint8Array(ciphertextBytes.length + tagBytes.length);
  combined.set(ciphertextBytes);
  combined.set(tagBytes, ciphertextBytes.length);

  const decrypted = await crypto.subtle.decrypt(
    { name: CRYPTO.ALGORITHM, iv: toBuffer(ivBytes), tagLength: CRYPTO.TAG_LENGTH * 8 },
    key,
    combined,
  );

  return new TextDecoder().decode(decrypted);
}
