import Dexie, { type EntityTable } from 'dexie';
import { MessageStatus } from '@/constants';

// ─── Types ──────────────────────────────────────────────────────────────────

/**
 * 'ok'     → plaintext holds the decrypted content
 * 'failed' → could not decrypt (missing envelope, bad key, corrupt data)
 * 'locked' → our private keys are not unlocked on this device yet
 * The ciphertext fields are always kept so failed/locked rows can be retried.
 */
export type DecryptState = 'ok' | 'failed' | 'locked';

export interface StoredMessage {
  id: string;
  channelId: string;
  senderId: string;
  senderUsername?: string | null;
  ciphertext: string;
  iv: string;
  tag: string;
  signature: string;
  sequenceNumber: number;
  senderKeyEpoch: number;
  messageType: string;
  metadata: Record<string, unknown> | null;
  isDeleted: boolean;
  // Decrypted plaintext — only meaningful when decryptState === 'ok'
  plaintext: string;
  decryptState?: DecryptState;
  // Ed25519 signature check: true = valid, false = invalid, undefined = not checked
  verified?: boolean;
  // Delivery status
  status: MessageStatus;
  // Timestamps
  createdAt: string; // ISO string
  updatedAt: string;
}

// A single emoji reaction on a message (server-broadcast / history payload)
export interface MessageReaction {
  emoji: string;
  userId: string;
  username: string | null;
}

export interface StoredRoom {
  id: string;
  name: string | null;
  type: string;
  lastMessageAt: string | null;
  lastMessagePreview: string | null;
  unreadCount: number;
  isArchived: boolean;
  updatedAt: string;
}

interface StoredKey {
  channelId: string;
  wrappedKey: string;
  epoch: number;
  updatedAt: string;
}

interface PendingOp {
  id: string;
  type: 'send' | 'reaction' | 'mark-read';
  channelId: string;
  payload: string;
  status: 'pending' | 'failed';
  retries: number;
  createdAt: string;
}

export interface StoredIdentity {
  id: 'me';
  userId: string;
  publicKey: string;
  publicKeySign: string;
  privateKey: string; // base64 raw 32B
  privateKeySign: string; // base64 raw 32B
}

export interface StoredCall {
  id: string;
  type: 'WEBRTC' | 'LIVEKIT';
  peerId: string;
  peerUsername: string;
  direction: 'incoming' | 'outgoing';
  startedAt: string;
  endedAt: string | null;
  duration: number | null;
  status: 'missed' | 'completed' | 'rejected' | 'cancelled';
}

// ─── Database ───────────────────────────────────────────────────────────────

const DB_NAME = 'zevra-chat';

class ChatDatabase extends Dexie {
  messages!: EntityTable<StoredMessage, 'id'>;
  rooms!: EntityTable<StoredRoom, 'id'>;
  keys!: EntityTable<StoredKey, 'channelId'>;
  pendingOps!: EntityTable<PendingOp, 'id'>;
  calls!: EntityTable<StoredCall, 'id'>;
  identity!: EntityTable<StoredIdentity, 'id'>;

  constructor() {
    super(DB_NAME);

    this.version(1).stores({
      messages: 'id, channelId, senderId, status, createdAt, [channelId+sequenceNumber]',
      rooms: 'id, lastMessageAt, unreadCount',
      keys: 'channelId',
      pendingOps: 'id, channelId, status, createdAt',
    });

    this.version(2).stores({
      calls: 'id, peerId, startedAt, status',
    });

    this.version(3).stores({
      identity: 'id, userId',
    });
  }
}

// Singleton per user (reinit on login/logout)
let db: ChatDatabase | null = null;

export function getDB(): ChatDatabase {
  if (!db) {
    db = new ChatDatabase();
  }
  return db;
}

/** Close the connection and delete the whole local database (logout). */
export async function destroyDB(): Promise<void> {
  if (db) {
    db.close();
    db = null;
  }
  try {
    await Dexie.delete(DB_NAME);
  } catch {
    // Blocked by another tab — the next login overwrites the identity row anyway
  }
}

// ─── Message Helpers ────────────────────────────────────────────────────────

// Rows written by older builds stored the literal "[Encrypted message]" as
// plaintext; surface them as failed so they get retried instead of shown.
const LEGACY_FAILED_PLACEHOLDER = '[Encrypted message]';

function normalize(m: StoredMessage): StoredMessage {
  if (m.decryptState) return m;
  if (m.plaintext === LEGACY_FAILED_PLACEHOLDER) {
    return { ...m, plaintext: '', decryptState: 'failed' };
  }
  return { ...m, decryptState: 'ok' };
}

export async function saveMessage(message: StoredMessage): Promise<void> {
  await getDB().messages.put(message);
}

export async function saveMessages(messages: StoredMessage[]): Promise<void> {
  if (messages.length === 0) return;
  await getDB().messages.bulkPut(messages);
}

export async function getChannelMessages(channelId: string): Promise<StoredMessage[]> {
  const rows = await getDB()
    .messages.where('channelId')
    .equals(channelId)
    .sortBy('createdAt');
  return rows.map(normalize);
}

export async function getMessagesByIds(ids: string[]): Promise<Map<string, StoredMessage>> {
  const rows = await getDB().messages.bulkGet(ids);
  const map = new Map<string, StoredMessage>();
  for (const r of rows) if (r) map.set(r.id, normalize(r));
  return map;
}

export async function markMessageDeleted(messageId: string): Promise<void> {
  await getDB().messages.update(messageId, {
    isDeleted: true,
    plaintext: '',
    ciphertext: '',
    decryptState: 'ok',
  });
}

// ─── Call Helpers ────────────────────────────────────────────────────────────

export async function getCalls(): Promise<StoredCall[]> {
  const database = getDB();
  return database.calls.orderBy('startedAt').reverse().toArray();
}

export async function searchCalls(query: string): Promise<StoredCall[]> {
  const database = getDB();
  const lower = query.toLowerCase();
  const all = await database.calls.toArray();
  return all.filter((c) =>
    (c.peerUsername ?? '').toLowerCase().includes(lower),
  );
}

// ─── Server Call History ─────────────────────────────────────────────────────

interface ServerCallLog {
  id: string;
  type: string;
  status: string;
  started_at: string;
  ended_at: string | null;
  duration: number | null;
  room_name: string | null;
  caller_id: string;
  caller_username: string;
  callee_id: string;
  callee_username: string;
  participants: Array<{
    userId: string;
    username: string;
    joinedAt: string;
    leftAt: string | null;
    duration: number | null;
  }>;
}

interface CallHistoryResponse {
  calls: ServerCallLog[];
  page: number;
  hasMore: boolean;
}

export async function fetchAndCacheCallHistory(
  userId: string,
  page = 1,
  limit = 50,
): Promise<StoredCall[]> {
  const { api } = await import('@/utils/api');

  const res = await api.get<CallHistoryResponse>(
    `/calls/history?page=${page}&limit=${limit}`,
  );

  if (!res?.calls) return getCalls();

  const stored: StoredCall[] = res.calls.map((c) => ({
    id: c.id,
    type: c.type as 'WEBRTC' | 'LIVEKIT',
    peerId: c.caller_id === userId ? c.callee_id : c.caller_id,
    // username columns are nullable server-side (deleted / unknown peers)
    peerUsername:
      (c.caller_id === userId ? c.callee_username : c.caller_username) ||
      'Unknown',
    direction: c.caller_id === userId ? 'outgoing' : 'incoming',
    startedAt: c.started_at,
    endedAt: c.ended_at,
    duration: c.duration,
    status: c.status as StoredCall['status'],
  }));

  const database = getDB();
  await database.calls.bulkPut(stored);

  return stored;
}
