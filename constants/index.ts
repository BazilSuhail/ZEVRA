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

  // Calls — Client → Server
  CALL_INITIATE: 'call:initiate',
  CALL_ACCEPT: 'call:accept',
  CALL_REJECT: 'call:reject',
  CALL_HANGUP: 'call:hangup',
  CALL_OFFER: 'call:offer',
  CALL_ANSWER: 'call:answer',
  CALL_ICE_CANDIDATE: 'call:ice-candidate',
  CALL_LIVEKIT_FALLBACK: 'call:livekit-fallback',
  CALL_LIVEKIT_JOIN_GROUP: 'call:livekit-join-group',

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
  PRESENCE_BULK: 'presence:bulk',

  // Calls — Server → Client
  CALL_METHOD_SELECTED: 'call:method-selected',
  CALL_INCOMING: 'call:incoming',
  CALL_ACCEPTED: 'call:accepted',
  CALL_REJECTED: 'call:rejected',
  CALL_HANGUP_RECV: 'call:hangup',
  CALL_OFFER_RECV: 'call:offer',
  CALL_ANSWER_RECV: 'call:answer',
  CALL_ICE_CANDIDATE_RECV: 'call:ice-candidate',
  LIVEKIT_TOKEN_REQUEST: 'livekit:token-request',
  LIVEKIT_INCOMING: 'livekit:incoming',
  LIVEKIT_GROUP_INVITE: 'livekit:group-invite',
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
