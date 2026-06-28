// ─── Server Response Types ────────────────────────────────────────────────────

export interface User {
  id: string;
  username: string;
  email: string;
  status: string;
  createdAt: string;
  lastLoginAt?: string;
  keyVersion?: number;
}

// Messages
export interface Message {
  id: string;
  channelId: string;
  senderId: string;
  messageType: string;
  encryptedContent: string;
  contentIv: string;
  contentTag: string;
  signature: string;
  sequenceNumber: number;
  senderKeyEpoch?: number;
  metadata: Record<string, unknown>;
  isDeleted: boolean;
  createdAt: string;
  decryptedText?: string;
  decryptFailed?: boolean;
}

// Channels
export interface Channel {
  id: string;
  type: "DIRECT" | "GROUP";
  name: string | null;
  isArchived: boolean;
  lastMessageId: string | null;
  lastMessageAt: string | null;
  lastMessageContent: string | null;
  lastMessageSenderId: string | null;
  lastMessageSenderName: string | null;
  lastMessageIv?: string | null;
  lastMessageTag?: string | null;
  lastMessageSenderKeyEpoch?: number | null;
  participantIds: string[];
  createdAt: string;
  lastReadMessageId?: string | null;
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

// Audit
export interface AuditLog {
  id: string;
  action: string;
  details: Record<string, unknown> | null;
  createdAt: string;
}
