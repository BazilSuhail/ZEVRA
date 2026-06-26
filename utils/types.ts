// ─── Server Response Types ────────────────────────────────────────────────────
// Matches the ZEVRA server API exactly.

// Auth
export interface User {
  id: string;
  username: string;
  email: string;
  status: string;
  createdAt: string;
  lastLoginAt?: string;
  keyVersion?: number;
}

export interface AuthRegisterResponse {
  success: boolean;
  user: User;
}

export interface AuthLoginStartResponse {
  srpSalt: string;
  B: string;
}

export interface AuthLoginFinishResponse {
  user: { id: string; username: string; email: string };
  accessToken: string;
  refreshToken: string;
  M2: string;
  keys: {
    publicKey: string;
    publicKeySign: string;
    encryptedPrivateKey: string;
    keySalt: string;
    encryptedPrivateKeySign: string;
    keySaltSign: string;
    argon2Params: Record<string, number>;
    keyVersion: number;
  };
}

// Messages
export interface Message {
  id: string;
  channelId: string;
  senderId: string;
  encryptedContent: string;
  contentIv: string;
  contentTag: string;
  signature: string;
  sequenceNumber: number;
  senderKeyEpoch?: number;
  isDeleted: boolean;
  createdAt: string;
}

export interface SendMessageResponse {
  id: string;
  sequenceNumber: number;
  createdAt: string;
}

export interface UnreadCount {
  channelId: string;
  count: number;
}

// Channels
export interface Channel {
  id: string;
  type: "DIRECT" | "GROUP";
  name: string | null;
  isArchived: boolean;
  lastMessageId: string | null;
  lastMessageAt: string | null;
  participantIds: string[];
  createdAt: string;
  lastReadAt?: string;
  unreadCount?: number;
}

export interface ChannelInfo extends Channel {
  role: string;
  members: ChannelMember[];
}

export interface ChannelMember {
  id: string;
  username: string;
  status: string;
  role: string;
  joinedAt: string;
}

// Keys
export interface MyKeys {
  id: string;
  publicKey: string;
  encryptedPrivateKey: string;
  keySalt: string;
  publicKeySign: string;
  encryptedPrivateKeySign: string;
  keySaltSign: string;
  keyVersion: number;
  argon2Params: Record<string, number> | null;
}

export interface PublicKeyEntry {
  publicKey: string;
  publicKeySign: string;
  keyVersion: number;
}

export interface SenderKey {
  id: string;
  ownerId: string;
  encryptedKey: string;
  keySignature: string;
  epoch: number;
  createdAt: string;
}

// Audit
export interface AuditLog {
  id: string;
  action: string;
  userId: string | null;
  ipAddress: string | null;
  details: Record<string, unknown> | null;
  createdAt: string;
}

// Generic success
export interface SuccessResponse {
  success: boolean;
  message: string;
}

export interface ArchiveResponse {
  isArchived: boolean;
}
