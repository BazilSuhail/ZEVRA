import Dexie, { type EntityTable } from 'dexie';
import { MessageStatus } from '@/constants';

// ─── Types ──────────────────────────────────────────────────────────────────

export interface StoredMessage {
  id: string;
  channelId: string;
  senderId: string;
  ciphertext: string;
  iv: string;
  tag: string;
  signature: string;
  sequenceNumber: number;
  senderKeyEpoch: number;
  messageType: string;
  metadata: Record<string, unknown> | null;
  isDeleted: boolean;
  // Decrypted plaintext (kept in memory + IDB for fast load)
  plaintext: string;
  // Delivery status
  status: MessageStatus;
  // Timestamps
  createdAt: string; // ISO string
  updatedAt: string;
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

export interface StoredKey {
  channelId: string;
  wrappedKey: string; // AES-KW wrapped chat key (base64)
  epoch: number;
  updatedAt: string;
}

export interface PendingOp {
  id: string;
  type: 'send' | 'reaction' | 'mark-read';
  channelId: string;
  payload: string; // JSON serialized
  status: 'pending' | 'failed';
  retries: number;
  createdAt: string;
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

class ChatDatabase extends Dexie {
  messages!: EntityTable<StoredMessage, 'id'>;
  rooms!: EntityTable<StoredRoom, 'id'>;
  keys!: EntityTable<StoredKey, 'channelId'>;
  pendingOps!: EntityTable<PendingOp, 'id'>;
  calls!: EntityTable<StoredCall, 'id'>;

  constructor() {
    super('zevra-chat');

    this.version(1).stores({
      messages: 'id, channelId, senderId, status, createdAt, [channelId+sequenceNumber]',
      rooms: 'id, lastMessageAt, unreadCount',
      keys: 'channelId',
      pendingOps: 'id, channelId, status, createdAt',
    });

    this.version(2).stores({
      calls: 'id, peerId, startedAt, status',
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

export function closeDB() {
  if (db) {
    db.close();
    db = null;
  }
}

// ─── Message Helpers ────────────────────────────────────────────────────────

export async function saveMessage(message: StoredMessage): Promise<void> {
  const database = getDB();
  await database.messages.put(message);
}

export async function saveMessages(messages: StoredMessage[]): Promise<void> {
  const database = getDB();
  await database.messages.bulkPut(messages);
}

export async function getMessage(messageId: string): Promise<StoredMessage | undefined> {
  const database = getDB();
  return database.messages.get(messageId);
}

export async function getChannelMessages(
  channelId: string,
  limit = 50,
): Promise<StoredMessage[]> {
  const database = getDB();
  return database.messages
    .where('channelId')
    .equals(channelId)
    .sortBy('createdAt');
}

export async function getLatestMessageTimestamp(
  channelId: string,
): Promise<string | null> {
  const database = getDB();
  const last = await database.messages
    .where('channelId')
    .equals(channelId)
    .last();
  return last?.createdAt ?? null;
}

export async function getChannelMessagesAfter(
  channelId: string,
  afterTimestamp: string,
): Promise<StoredMessage[]> {
  const database = getDB();
  return database.messages
    .where('[channelId+createdAt]')
    .between([channelId, afterTimestamp], [channelId, '\uffff'])
    .toArray();
}

export async function updateMessageStatus(
  messageId: string,
  status: MessageStatus,
): Promise<void> {
  const database = getDB();
  await database.messages.update(messageId, { status });
}

export async function deleteMessage(messageId: string): Promise<void> {
  const database = getDB();
  await database.messages.delete(messageId);
}

// ─── Room Helpers ───────────────────────────────────────────────────────────

export async function saveRoom(room: StoredRoom): Promise<void> {
  const database = getDB();
  await database.rooms.put(room);
}

export async function getRooms(): Promise<StoredRoom[]> {
  const database = getDB();
  return database.rooms.orderBy('lastMessageAt').reverse().toArray();
}

export async function getRoom(channelId: string): Promise<StoredRoom | undefined> {
  const database = getDB();
  return database.rooms.get(channelId);
}

export async function updateRoomUnread(channelId: string, count: number): Promise<void> {
  const database = getDB();
  await database.rooms.update(channelId, { unreadCount: count });
}

export async function incrementRoomUnread(channelId: string): Promise<void> {
  const database = getDB();
  const room = await database.rooms.get(channelId);
  if (room) {
    await database.rooms.update(channelId, {
      unreadCount: room.unreadCount + 1,
    });
  }
}

// ─── Key Helpers ────────────────────────────────────────────────────────────

export async function saveKey(key: StoredKey): Promise<void> {
  const database = getDB();
  await database.keys.put(key);
}

export async function getKey(channelId: string): Promise<StoredKey | undefined> {
  const database = getDB();
  return database.keys.get(channelId);
}

// ─── Pending Ops Helpers ────────────────────────────────────────────────────

export async function addPendingOp(op: PendingOp): Promise<void> {
  const database = getDB();
  await database.pendingOps.put(op);
}

export async function getPendingOps(): Promise<PendingOp[]> {
  const database = getDB();
  return database.pendingOps
    .where('status')
    .equals('pending')
    .toArray();
}

export async function updatePendingOp(id: string, updates: Partial<PendingOp>): Promise<void> {
  const database = getDB();
  await database.pendingOps.update(id, updates);
}

export async function removePendingOp(id: string): Promise<void> {
  const database = getDB();
  await database.pendingOps.delete(id);
}

// ─── Bulk Operations ────────────────────────────────────────────────────────

export async function getUnreadCounts(): Promise<Record<string, number>> {
  const database = getDB();
  const rooms = await database.rooms.toArray();
  const counts: Record<string, number> = {};
  for (const room of rooms) {
    if (room.unreadCount > 0) {
      counts[room.id] = room.unreadCount;
    }
  }
  return counts;
}

export async function clearAll(): Promise<void> {
  const database = getDB();
  await database.transaction(
    'rw',
    [database.messages, database.rooms, database.keys, database.pendingOps, database.calls],
    async () => {
      await database!.messages.clear();
      await database!.rooms.clear();
      await database!.keys.clear();
      await database!.pendingOps.clear();
      await database!.calls.clear();
    },
  );
}

// ─── Call Helpers ────────────────────────────────────────────────────────────

export async function saveCall(call: StoredCall): Promise<void> {
  const database = getDB();
  await database.calls.put(call);
}

export async function getCalls(): Promise<StoredCall[]> {
  const database = getDB();
  return database.calls.orderBy('startedAt').reverse().toArray();
}

export async function getCall(callId: string): Promise<StoredCall | undefined> {
  const database = getDB();
  return database.calls.get(callId);
}

export async function updateCall(callId: string, updates: Partial<StoredCall>): Promise<void> {
  const database = getDB();
  await database.calls.update(callId, updates);
}

export async function deleteCall(callId: string): Promise<void> {
  const database = getDB();
  await database.calls.delete(callId);
}

export async function searchCalls(query: string): Promise<StoredCall[]> {
  const database = getDB();
  const lower = query.toLowerCase();
  const all = await database.calls.toArray();
  return all.filter((c) => c.peerUsername.toLowerCase().includes(lower));
}
