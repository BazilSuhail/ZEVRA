// ─── API ────────────────────────────────────────────────────────────────────

export const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

// ─── Socket Events ──────────────────────────────────────────────────────────

export const SOCKET_EVENTS = {
  // Client → Server
  SEND_MESSAGE: 'send-message',
  GET_MESSAGES: 'get-messages',
  MARK_READ: 'mark-read',
  GET_UNREAD: 'get-unread',
  GET_PENDING: 'get-pending',
  REACTION_ADD: 'reaction:add',
  REACTION_REMOVE: 'reaction:removed',
  CREATE_OR_JOIN: 'create-or-join',
  JOIN_CHANNEL: 'join-channel',
  LEAVE_CHANNEL: 'leave-channel',
  TYPING_START: 'typing:start',
  TYPING_STOP: 'typing:stop',

  // Server → Client
  CONNECTED: 'connected',
  CONNECT_ERROR: 'connect_error',
  FORCED_DISCONNECT: 'forced-disconnect',
  USER_MESSAGE: 'user:message',
  USER_JOINED: 'user:joined',
  USER_LEFT: 'user:left',
  MESSAGE_NEW: 'message:new',
  TYPING_START_RECV: 'typing:start',
  TYPING_STOP_RECV: 'typing:stop',
  REACTION_ADDED: 'reaction:added',
  REACTION_REMOVED: 'reaction:removed',
  HEARTBEAT_ACK: 'heartbeat-ack',
} as const;

// ─── Enums ──────────────────────────────────────────────────────────────────

export enum ChannelType {
  DIRECT = 'DIRECT',
  GROUP = 'GROUP',
}

export enum UserRole {
  MEMBER = 'MEMBER',
  ADMIN = 'ADMIN',
  OWNER = 'OWNER',
}

export enum UserStatus {
  ONLINE = 'ONLINE',
  OFFLINE = 'OFFLINE',
  AWAY = 'AWAY',
}

export enum MessageType {
  TEXT = 'TEXT',
  IMAGE = 'IMAGE',
  FILE = 'FILE',
  SYSTEM = 'SYSTEM',
}

export enum MessageStatus {
  PENDING = 'pending',
  SENT = 'sent',
  DELIVERED = 'delivered',
  READ = 'read',
  FAILED = 'failed',
}

// ─── Crypto ─────────────────────────────────────────────────────────────────

export const CRYPTO = {
  ALGORITHM: 'AES-GCM',
  KEY_LENGTH: 256,
  IV_LENGTH: 12,
  TAG_LENGTH: 16,
  PBKDF2_ITERATIONS: 100000,
  HASH: 'SHA-256',
} as const;

// ─── App ────────────────────────────────────────────────────────────────────

export const APP = {
  TYPING_TIMEOUT_MS: 6000,
  HEARTBEAT_INTERVAL_MS: 30000,
  MESSAGE_PAGE_SIZE: 50,
  RECONNECTION_ATTEMPTS: 10,
  RECONNECTION_DELAY: 1000,
  MAX_MESSAGE_LENGTH: 4096,
  MAX_FILE_SIZE_MB: 10,
} as const;
