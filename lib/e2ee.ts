import { argon2idAsync } from '@noble/hashes/argon2.js';
import { hkdf } from '@noble/hashes/hkdf.js';
import { sha256 } from '@noble/hashes/sha2.js';
import { x25519, ed25519 } from '@noble/curves/ed25519.js';
import { getDB, type DecryptState } from './db';
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
  argon2Params?: { m: number; t: number; p: number } | null;
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

interface EncryptedMessagePayload {
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

export interface DecryptResult {
  state: DecryptState;
  plaintext: string;
  /** Ed25519 check: true valid, false invalid, undefined when not checked */
  verified?: boolean;
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

function toArrayBuffer(bytes: Uint8Array): ArrayBuffer {
  const buf = new ArrayBuffer(bytes.byteLength);
  new Uint8Array(buf).set(bytes);
  return buf;
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

const identityListeners = new Set<(id: Identity | null) => void>();

/** Subscribe to identity unlock / clear. Returns an unsubscribe function. */
export function onIdentityChange(cb: (id: Identity | null) => void): () => void {
  identityListeners.add(cb);
  return () => {
    identityListeners.delete(cb);
  };
}

function emitIdentity() {
  for (const cb of identityListeners) cb(identity);
}

function deriveKek(
  password: string,
  saltB64: string,
  params?: { m: number; t: number; p: number } | null,
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

/**
 * Unwrap the user's private keys with their password and persist them.
 * Throws when the password is wrong or the sealed blobs are malformed.
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

  let privX: Uint8Array;
  let privEd: Uint8Array;
  try {
    [privX, privEd] = await Promise.all([
      unsealPrivateKey(keys.encryptedPrivateKey, kek),
      unsealPrivateKey(keys.encryptedPrivateKeySign, kekSign),
    ]);
  } catch {
    throw new Error('Could not unlock your encryption keys — check your password');
  }

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

  emitIdentity();
  return identity;
}

/**
 * Unlock keys for an already-authenticated session (e.g. a new device or
 * cleared storage): fetch our sealed key blobs and unwrap them.
 */
export async function unlockWithPassword(userId: string, password: string): Promise<Identity> {
  const keys = await api.get<UserKeys | null>('/keys/me');
  if (!keys?.encryptedPrivateKey || !keys.encryptedPrivateKeySign) {
    throw new Error('No encryption keys found for this account');
  }
  return unlockIdentity(userId, keys, password);
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

/** Wipe local keys (logout). */
export async function clearIdentity(): Promise<void> {
  identity = null;
  identityPromise = null;
  publicKeyCache.clear();
  try {
    await getDB().identity.delete('me');
  } catch {
    // DB may already be closed/deleted
  }
  emitIdentity();
}

// ─── Public key cache (coalesced fetches) ───────────────────────────────────
//
// Concurrent lookups (e.g. decrypting a page of 50 messages from several
// senders) are batched into ONE /keys/public request per tick, and an id
// already being fetched is never requested twice. Entries are invalidated
// per user when a decrypt fails with the cached key (the peer's keyVersion
// may have changed), then refetched once.

const publicKeyCache = new Map<string, PublicKeyInfo>();
const inflight = new Map<string, Promise<PublicKeyInfo | null>>();
let batchQueue: Array<{ id: string; resolve: (v: PublicKeyInfo | null) => void }> = [];
let batchTimer: ReturnType<typeof setTimeout> | null = null;
const lastForcedRefetch = new Map<string, number>();
const FORCED_REFETCH_COOLDOWN_MS = 30_000;

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const MAX_IDS_PER_REQUEST = 100; // server validates 1..100 userIds

async function runBatch() {
  const queue = batchQueue;
  batchQueue = [];
  batchTimer = null;
  const ids = [...new Set(queue.map((q) => q.id))];
  const res: Record<string, PublicKeyInfo> = {};
  for (let i = 0; i < ids.length; i += MAX_IDS_PER_REQUEST) {
    const chunk = ids.slice(i, i + MAX_IDS_PER_REQUEST);
    try {
      const query = chunk.map((id) => `userIds=${encodeURIComponent(id)}`).join('&');
      Object.assign(res, await api.get<Record<string, PublicKeyInfo>>(`/keys/public?${query}`));
    } catch {
      // Leave this chunk unresolved — callers treat it as "key unknown"
    }
  }
  for (const { id, resolve } of queue) {
    const info = res?.[id];
    if (info?.publicKey) {
      publicKeyCache.set(id, info);
      resolve(info);
    } else {
      resolve(null);
    }
  }
  for (const id of ids) inflight.delete(id);
}

function fetchOne(id: string): Promise<PublicKeyInfo | null> {
  const existing = inflight.get(id);
  if (existing) return existing;
  const p = new Promise<PublicKeyInfo | null>((resolve) => {
    batchQueue.push({ id, resolve });
    if (!batchTimer) batchTimer = setTimeout(runBatch, 10);
  });
  inflight.set(id, p);
  return p;
}

async function fetchPublicKeys(userIds: string[]): Promise<Map<string, PublicKeyInfo>> {
  const result = new Map<string, PublicKeyInfo>();
  const pending: Array<Promise<void>> = [];
  for (const id of new Set(userIds)) {
    if (!UUID_RE.test(id)) continue;
    const cached = publicKeyCache.get(id);
    if (cached) {
      result.set(id, cached);
      continue;
    }
    pending.push(
      fetchOne(id).then((info) => {
        if (info) result.set(id, info);
      }),
    );
  }
  await Promise.all(pending);
  return result;
}

/**
 * Drop a user's cached public key so the next lookup refetches it (their
 * keyVersion may have changed). Rate-limited per user. Returns true when the
 * cache entry was actually invalidated.
 */
function invalidatePublicKey(userId: string): boolean {
  const last = lastForcedRefetch.get(userId) ?? 0;
  if (Date.now() - last < FORCED_REFETCH_COOLDOWN_MS) return false;
  lastForcedRefetch.set(userId, Date.now());
  publicKeyCache.delete(userId);
  return true;
}

// ─── Envelope keys (per-message content key sealed to each member) ─────────
//
// wrapKey = HKDF-SHA256(
//   ikm  = X25519(me.privateKey, peer.publicKey),
//   salt = channelId,                       // channel binding
//   info = "zevra-env-v1:${sender}:${recipient}",
//   len  = 16)
// → AES-KW-128 over the random per-message content key.

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
  if (!me) throw new Error('Encryption keys are locked — unlock them to send messages');

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

function verifySignature(
  channelId: string,
  encryptedContent: string,
  signatureB64: string,
  publicKeySignB64: string,
): boolean {
  try {
    return ed25519.verify(
      b64ToBytes(signatureB64),
      new TextEncoder().encode(`${channelId}:${encryptedContent}`),
      b64ToBytes(publicKeySignB64),
    );
  } catch {
    return false;
  }
}

async function tryDecryptWith(
  me: Identity,
  senderPub: string,
  msg: {
    channelId: string;
    senderId: string;
    encryptedContent: string;
    contentIv: string;
    contentTag: string;
  },
  wrapped: string,
): Promise<string | null> {
  try {
    const kwKey = await deriveWrapKey(me.privateKey, senderPub, msg.channelId, msg.senderId, me.userId);
    const contentKey = await crypto.subtle.unwrapKey(
      'raw',
      toArrayBuffer(b64ToBytes(wrapped)),
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

/**
 * Decrypt a message for the current identity.
 * - state 'locked' when our private keys are not available on this device
 * - state 'failed' when it cannot be decrypted (no envelope, bad key, corrupt)
 * Legacy plaintext messages (no IV/tag) pass through as-is.
 * When a signature is present it is verified against the sender's Ed25519 key.
 */
export async function decryptMessage(msg: {
  channelId: string;
  senderId: string;
  encryptedContent: string;
  contentIv?: string | null;
  contentTag?: string | null;
  signature?: string | null;
  metadata?: Record<string, unknown> | null;
}): Promise<DecryptResult> {
  // Legacy pre-E2EE message: stored as plaintext
  if (!msg.contentIv || !msg.contentTag) {
    return { state: 'ok', plaintext: msg.encryptedContent ?? '' };
  }

  const me = await ensureIdentity();
  if (!me) return { state: 'locked', plaintext: '' };

  const env = (msg.metadata as { env?: Record<string, string> } | null | undefined)?.env;
  const myWrapped = env?.[me.userId];
  if (!myWrapped) return { state: 'failed', plaintext: '' };

  const full = {
    channelId: msg.channelId,
    senderId: msg.senderId,
    encryptedContent: msg.encryptedContent,
    contentIv: msg.contentIv,
    contentTag: msg.contentTag,
  };

  const lookup = async (): Promise<{ pub: string; sign: string } | null> => {
    if (msg.senderId === me.userId) return { pub: me.publicKey, sign: me.publicKeySign };
    const info = (await fetchPublicKeys([msg.senderId])).get(msg.senderId);
    return info ? { pub: info.publicKey, sign: info.publicKeySign } : null;
  };

  let sender = await lookup();
  let plaintext = sender ? await tryDecryptWith(me, sender.pub, full, myWrapped) : null;

  // The sender may have rotated keys since we cached them — refetch once
  if (plaintext === null && msg.senderId !== me.userId && invalidatePublicKey(msg.senderId)) {
    sender = await lookup();
    plaintext = sender ? await tryDecryptWith(me, sender.pub, full, myWrapped) : null;
  }

  if (plaintext === null || !sender) return { state: 'failed', plaintext: '' };

  const verified = msg.signature
    ? verifySignature(msg.channelId, msg.encryptedContent, msg.signature, sender.sign)
    : undefined;

  return { state: 'ok', plaintext, verified };
}

/** Short hex fingerprint of a base64 public key (for display). */
export function keyFingerprint(publicKeyB64: string): string {
  try {
    const digest = sha256(b64ToBytes(publicKeyB64));
    return Array.from(digest.slice(0, 16))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
  } catch {
    return '';
  }
}
