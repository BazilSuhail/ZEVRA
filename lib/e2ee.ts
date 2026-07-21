import { argon2idAsync } from '@noble/hashes/argon2.js';
import { hkdf } from '@noble/hashes/hkdf.js';
import { sha256 } from '@noble/hashes/sha2.js';
import { x25519, ed25519 } from '@noble/curves/ed25519.js';
import { getDB } from './db';
import { encrypt, decrypt } from './crypto';
import { api } from '@/utils/api';

// ─── Types ──────────────────────────────────────────────────────────────────

export interface UserKeys {
  publicKey: string; // base64 raw 32B (X25519)
  publicKeySign: string; // base64 raw 32B (Ed25519)
  encryptedPrivateKey: string; // "iv:tag:ciphertext" sealed with Argon2id KEK
  keySalt: string; // base64
  encryptedPrivateKeySign: string;
  keySaltSign: string;
  argon2Params?: { m: number; t: number; p: number };
  keyVersion?: number;
}

export interface Identity {
  userId: string;
  publicKey: string;
  publicKeySign: string;
  privateKey: Uint8Array; // raw 32B X25519 secret
  privateKeySign: Uint8Array; // raw 32B Ed25519 secret
}

interface StoredIdentity {
  id: 'me';
  userId: string;
  publicKey: string;
  publicKeySign: string;
  privateKey: string; // base64
  privateKeySign: string; // base64
}

export interface EncryptedMessagePayload {
  encryptedContent: string;
  contentIv: string;
  contentTag: string;
  signature: string;
  metadata: { v: 1; env: Record<string, string> };
}

interface PublicKeyInfo {
  publicKey: string;
  publicKeySign: string;
  keyVersion: number;
}

// ─── base64 helpers ─────────────────────────────────────────────────────────

function b64ToBytes(b64: string): Uint8Array {
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

function bytesToB64(bytes: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary);
}

// ─── Identity (private keys) ────────────────────────────────────────────────
//
// Private keys are sealed server-side with KEK = Argon2id(password, keySalt).
// We unwrap them at login (password in memory) and persist them raw in
// IndexedDB so subsequent page loads can decrypt without the password.
// Tradeoff: keys are protected at rest only by the device (same-origin
// storage), not by the password after login.

let identity: Identity | null = null;
let identityPromise: Promise<Identity | null> | null = null;

function deriveKek(
  password: string,
  saltB64: string,
  params?: { m: number; t: number; p: number },
): Promise<Uint8Array> {
  return argon2idAsync(new TextEncoder().encode(password), b64ToBytes(saltB64), {
    t: params?.t ?? 3,
    m: params?.m ?? 65536,
    p: params?.p ?? 4,
    dkLen: 32,
  });
}

async function unsealPrivateKey(sealed: string, kek: Uint8Array): Promise<Uint8Array> {
  const [ivB64, tagB64, ctB64] = sealed.split(':');
  if (!ivB64 || !tagB64 || !ctB64) throw new Error('Malformed sealed private key');
  // Sealed payload is raw binary (32B key), not text — decrypt to bytes directly.
  // WebCrypto expects the GCM tag appended to the ciphertext.
  const iv = b64ToBytes(ivB64);
  const tag = b64ToBytes(tagB64);
  const ct = b64ToBytes(ctB64);
  const combined = new Uint8Array(ct.length + tag.length);
  combined.set(ct);
  combined.set(tag, ct.length);

  const key = await crypto.subtle.importKey('raw', toArrayBuffer(kek), 'AES-GCM', false, [
    'decrypt',
  ]);
  const plaintext = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: toArrayBuffer(iv) },
    key,
    toArrayBuffer(combined),
  );
  return new Uint8Array(plaintext);
}

function toArrayBuffer(bytes: Uint8Array): ArrayBuffer {
  const buf = new ArrayBuffer(bytes.byteLength);
  new Uint8Array(buf).set(bytes);
  return buf;
}

/**
 * Unwrap the user's private keys with their password (called right after
 * SRP login, while the password is still in memory) and persist them.
 */
export async function unlockIdentity(
  userId: string,
  keys: UserKeys,
  password: string,
): Promise<Identity> {
  const params = keys.argon2Params;
  const [kek, kekSign] = await Promise.all([
    deriveKek(password, keys.keySalt, params),
    deriveKek(password, keys.keySaltSign, params),
  ]);

  const [privX, privEd] = await Promise.all([
    unsealPrivateKey(keys.encryptedPrivateKey, kek),
    unsealPrivateKey(keys.encryptedPrivateKeySign, kekSign),
  ]);

  identity = {
    userId,
    publicKey: keys.publicKey,
    publicKeySign: keys.publicKeySign,
    privateKey: privX,
    privateKeySign: privEd,
  };

  const stored: StoredIdentity = {
    id: 'me',
    userId,
    publicKey: keys.publicKey,
    publicKeySign: keys.publicKeySign,
    privateKey: bytesToB64(privX),
    privateKeySign: bytesToB64(privEd),
  };
  await getDB().identity.put(stored);

  return identity;
}

/** Load the persisted identity (no password needed). Safe to call often. */
export function ensureIdentity(userId?: string): Promise<Identity | null> {
  if (identity && (!userId || identity.userId === userId)) {
    return Promise.resolve(identity);
  }
  if (identityPromise) return identityPromise;

  identityPromise = (async () => {
    try {
      const stored = await getDB().identity.get('me');
      const expectedId = userId ?? stored?.userId;
      if (!stored || (expectedId && stored.userId !== expectedId)) {
        identity = null;
        return null;
      }
      identity = {
        userId: stored.userId,
        publicKey: stored.publicKey,
        publicKeySign: stored.publicKeySign,
        privateKey: b64ToBytes(stored.privateKey),
        privateKeySign: b64ToBytes(stored.privateKeySign),
      };
      return identity;
    } catch {
      return null;
    } finally {
      identityPromise = null;
    }
  })();

  return identityPromise;
}

export function getIdentity(): Identity | null {
  return identity;
}

/** Wipe local keys (logout). */
export async function clearIdentity(): Promise<void> {
  identity = null;
  identityPromise = null;
  publicKeyCache.clear();
  try {
    await getDB().identity.delete('me');
  } catch {}
}

// ─── Public key cache ───────────────────────────────────────────────────────

const publicKeyCache = new Map<string, PublicKeyInfo>();

export function primePublicKeyCache(userId: string, info: PublicKeyInfo) {
  publicKeyCache.set(userId, info);
}

export async function fetchPublicKeys(userIds: string[]): Promise<Map<string, PublicKeyInfo>> {
  const result = new Map<string, PublicKeyInfo>();
  const missing: string[] = [];
  for (const id of userIds) {
    const cached = publicKeyCache.get(id);
    if (cached) result.set(id, cached);
    else missing.push(id);
  }

  if (missing.length > 0) {
    const query = missing.map((id) => `userIds=${encodeURIComponent(id)}`).join('&');
    const res = await api.get<Record<string, PublicKeyInfo>>(`/keys/public?${query}`);
    for (const id of missing) {
      const info = res?.[id];
      if (info?.publicKey) {
        publicKeyCache.set(id, info);
        result.set(id, info);
      }
    }
  }

  return result;
}

// ─── Envelope keys (per-message content key sealed to each member) ─────────
//
// wrapKey = HKDF-SHA256(
//   ikm  = X25519(me.privateKey, peer.publicKey),
//   salt = channelId,                       // channel binding
//   info = "zevra-env-v1:${sender}:${recipient}",
//   len  = 16)
// → AES-KW-128 over the random per-message content key.
// The envelopes live in message metadata (ciphertext; visible to the server
// but only sender + recipient can derive the wrap key).

async function deriveWrapKey(
  myPrivate: Uint8Array,
  peerPublicB64: string,
  channelId: string,
  senderId: string,
  recipientId: string,
): Promise<CryptoKey> {
  const shared = x25519.getSharedSecret(myPrivate, b64ToBytes(peerPublicB64));
  const okm = hkdf(
    sha256,
    shared,
    new TextEncoder().encode(channelId),
    new TextEncoder().encode(`zevra-env-v1:${senderId}:${recipientId}`),
    16,
  );
  return crypto.subtle.importKey('raw', toArrayBuffer(okm), 'AES-KW', false, ['wrapKey', 'unwrapKey']);
}

// ─── Encrypt / Decrypt ──────────────────────────────────────────────────────

/**
 * Encrypt `text` for everyone in `memberIds` (must include self) and sign
 * `channelId:ciphertext` with our Ed25519 key.
 */
export async function encryptForChannel(params: {
  channelId: string;
  memberIds: string[];
  text: string;
}): Promise<EncryptedMessagePayload> {
  const me = await ensureIdentity();
  if (!me) throw new Error('Encryption keys not unlocked — log in again to send messages');

  const { channelId, memberIds, text } = params;
  const recipients = [...new Set(memberIds)];
  if (!recipients.includes(me.userId)) recipients.push(me.userId);

  // Fetch peers' public keys (ours comes from the identity)
  const peersToFetch = recipients.filter((id) => id !== me.userId);
  const pubs = await fetchPublicKeys(peersToFetch);
  const missing = recipients.filter((id) => id !== me.userId && !pubs.has(id));
  if (missing.length > 0) {
    throw new Error(`Missing encryption keys for ${missing.length} member(s)`);
  }

  // Random per-message content key
  const contentKeyRaw = crypto.getRandomValues(new Uint8Array(32));
  const contentKey = await crypto.subtle.importKey(
    'raw',
    toArrayBuffer(contentKeyRaw),
    'AES-GCM',
    true, // extractable so it can be wrapped for each member
    ['encrypt', 'decrypt'],
  );

  const enc = await encrypt(text, contentKey);

  // Seal the content key for every member
  const env: Record<string, string> = {};
  for (const memberId of recipients) {
    const peerPub = memberId === me.userId ? me.publicKey : pubs.get(memberId)!.publicKey;
    const kwKey = await deriveWrapKey(me.privateKey, peerPub, channelId, me.userId, memberId);
    const wrapped = await crypto.subtle.wrapKey('raw', contentKey, kwKey, 'AES-KW');
    env[memberId] = bytesToB64(new Uint8Array(wrapped));
  }

  // Sign channelId:ciphertext (server verifies against our publicKeySign)
  const signature = bytesToB64(
    ed25519.sign(
      new TextEncoder().encode(`${channelId}:${enc.ciphertext}`),
      me.privateKeySign,
    ),
  );

  return {
    encryptedContent: enc.ciphertext,
    contentIv: enc.iv,
    contentTag: enc.tag,
    signature,
    metadata: { v: 1, env },
  };
}

/**
 * Decrypt a message for the current identity.
 * Returns the plaintext, or null when it cannot be decrypted (missing
 * identity, missing envelope, unknown sender key, corrupt data).
 * Legacy plaintext messages (no IV/tag) pass through as-is.
 */
export async function decryptMessage(msg: {
  channelId: string;
  senderId: string;
  encryptedContent: string;
  contentIv?: string | null;
  contentTag?: string | null;
  metadata?: Record<string, unknown> | null;
}): Promise<string | null> {
  // Legacy pre-E2EE message: stored as plaintext
  if (!msg.contentIv || !msg.contentTag) return msg.encryptedContent;

  const me = await ensureIdentity();
  if (!me) return null;

  const env = (msg.metadata as { env?: Record<string, string> } | null | undefined)?.env;
  const myWrapped = env?.[me.userId];
  if (!myWrapped) return null;

  try {
    const senderPub =
      msg.senderId === me.userId ? me.publicKey : (await fetchPublicKeys([msg.senderId])).get(msg.senderId)?.publicKey;
    if (!senderPub) return null;

    const kwKey = await deriveWrapKey(me.privateKey, senderPub, msg.channelId, msg.senderId, me.userId);
    const contentKey = await crypto.subtle.unwrapKey(
      'raw',
      toArrayBuffer(b64ToBytes(myWrapped)),
      kwKey,
      'AES-KW',
      { name: 'AES-GCM' },
      false,
      ['decrypt'],
    );

    return await decrypt(msg.encryptedContent, msg.contentIv, msg.contentTag, contentKey);
  } catch {
    return null;
  }
}
