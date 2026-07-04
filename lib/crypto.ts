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

// ─── Key Derivation (PBKDF2 → AES-256-GCM) ────────────────────────────────

export async function deriveKey(
  password: string,
  salt: Uint8Array,
): Promise<CryptoKey> {
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(password),
    'PBKDF2',
    false,
    ['deriveKey'],
  );

  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: toBuffer(salt),
      iterations: CRYPTO.PBKDF2_ITERATIONS,
      hash: CRYPTO.HASH,
    },
    keyMaterial,
    { name: CRYPTO.ALGORITHM, length: CRYPTO.KEY_LENGTH },
    false,
    ['encrypt', 'decrypt'],
  );
}

export async function generateSalt(): Promise<Uint8Array> {
  return crypto.getRandomValues(new Uint8Array(16));
}

// ─── X25519 Key Exchange ────────────────────────────────────────────────────

export interface KeyPair {
  publicKey: CryptoKey;
  privateKey: CryptoKey;
}

export async function generateX25519KeyPair(): Promise<KeyPair> {
  const keyPair = await crypto.subtle.generateKey(
    { name: 'X25519' },
    true,
    ['deriveKey', 'deriveBits'],
  );
  return keyPair as KeyPair;
}

export async function exportPublicKey(key: CryptoKey): Promise<string> {
  const raw = await crypto.subtle.exportKey('raw', key);
  return uint8ToBase64(new Uint8Array(raw));
}

export async function importPublicKey(base64: string): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    'raw',
    toBuffer(base64ToUint8(base64)),
    { name: 'X25519' },
    true,
    ['deriveKey', 'deriveBits'],
  );
}

// ─── Ed25519 Sign/Verify ────────────────────────────────────────────────────

export async function generateEd25519KeyPair(): Promise<KeyPair> {
  const keyPair = await crypto.subtle.generateKey(
    { name: 'Ed25519' },
    true,
    ['sign', 'verify'],
  );
  return keyPair as KeyPair;
}

export async function sign(
  data: string,
  privateKey: CryptoKey,
): Promise<string> {
  const signature = await crypto.subtle.sign(
    'Ed25519',
    privateKey,
    new TextEncoder().encode(data),
  );
  return uint8ToBase64(new Uint8Array(signature));
}

export async function verify(
  data: string,
  signatureBase64: string,
  publicKey: CryptoKey,
): Promise<boolean> {
  return crypto.subtle.verify(
    'Ed25519',
    publicKey,
    toBuffer(base64ToUint8(signatureBase64)),
    new TextEncoder().encode(data),
  );
}

// ─── Chat Key Manager ──────────────────────────────────────────────────────

const chatKeyCache = new Map<string, CryptoKey>();

export function setChatKey(channelId: string, key: CryptoKey) {
  chatKeyCache.set(channelId, key);
}

export function getChatKey(channelId: string): CryptoKey | undefined {
  return chatKeyCache.get(channelId);
}

export function clearChatKeys() {
  chatKeyCache.clear();
}

export async function wrapKey(
  chatKey: CryptoKey,
  masterKey: CryptoKey,
): Promise<string> {
  const wrapped = await crypto.subtle.wrapKey('raw', chatKey, masterKey, {
    name: 'AES-KW',
  });
  return uint8ToBase64(new Uint8Array(wrapped));
}

export async function unwrapKey(
  wrappedBase64: string,
  masterKey: CryptoKey,
): Promise<CryptoKey> {
  return crypto.subtle.unwrapKey(
    'raw',
    toBuffer(base64ToUint8(wrappedBase64)),
    masterKey,
    { name: 'AES-KW' },
    { name: CRYPTO.ALGORITHM, length: CRYPTO.KEY_LENGTH },
    false,
    ['encrypt', 'decrypt'],
  );
}

export async function generateChatKey(): Promise<CryptoKey> {
  return crypto.subtle.generateKey(
    { name: CRYPTO.ALGORITHM, length: CRYPTO.KEY_LENGTH },
    false,
    ['encrypt', 'decrypt'],
  );
}
