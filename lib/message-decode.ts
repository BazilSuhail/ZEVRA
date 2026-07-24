import { MessageStatus } from '@/constants';
import { decryptMessage } from './e2ee';
import type { MessageReaction, StoredMessage } from './db';

// ─── Server message shape (message:new, get-messages, REST history) ───────

export interface RawServerMessage {
  id?: string;
  messageId?: string;
  channelId: string;
  senderId: string;
  senderUsername?: string | null;
  encryptedContent: string;
  contentIv?: string | null;
  contentTag?: string | null;
  signature?: string | null;
  sequenceNumber?: number;
  senderKeyEpoch?: number;
  messageType?: string;
  metadata?: Record<string, unknown> | null;
  isDeleted?: boolean;
  createdAt?: string;
  updatedAt?: string;
  reactions?: MessageReaction[];
}

export function rawMessageId(raw: RawServerMessage): string | null {
  return raw.id || raw.messageId || null;
}

/**
 * Turn a server message into a StoredMessage, decrypting it.
 * `cached` is the row we already have for this id: a good cached plaintext
 * is never replaced by a failed/locked decrypt of the same ciphertext.
 */
export async function decodeServerMessage(
  raw: RawServerMessage,
  cached?: StoredMessage,
): Promise<StoredMessage | null> {
  const id = rawMessageId(raw);
  if (!id) return null;
  const now = new Date().toISOString();

  const base: StoredMessage = {
    id,
    channelId: raw.channelId,
    senderId: raw.senderId,
    senderUsername: raw.senderUsername ?? cached?.senderUsername ?? null,
    ciphertext: raw.encryptedContent ?? '',
    iv: raw.contentIv ?? '',
    tag: raw.contentTag ?? '',
    signature: raw.signature || '',
    sequenceNumber: raw.sequenceNumber ?? cached?.sequenceNumber ?? 0,
    senderKeyEpoch: raw.senderKeyEpoch || 0,
    messageType: raw.messageType || 'TEXT',
    metadata: raw.metadata || null,
    isDeleted: !!raw.isDeleted,
    plaintext: '',
    decryptState: 'ok',
    status: MessageStatus.DELIVERED,
    createdAt: raw.createdAt || cached?.createdAt || now,
    updatedAt: raw.updatedAt || now,
  };

  if (base.isDeleted) return base;

  const sameCiphertext =
    cached && cached.ciphertext === base.ciphertext && cached.iv === base.iv;
  if (sameCiphertext && cached.decryptState === 'ok' && !cached.isDeleted) {
    return { ...base, plaintext: cached.plaintext, verified: cached.verified };
  }

  let result;
  try {
    result = await decryptMessage({
      channelId: base.channelId,
      senderId: base.senderId,
      encryptedContent: base.ciphertext,
      contentIv: raw.contentIv,
      contentTag: raw.contentTag,
      signature: raw.signature,
      metadata: raw.metadata,
    });
  } catch {
    result = { state: 'failed' as const, plaintext: '' };
  }

  return {
    ...base,
    plaintext: result.plaintext,
    decryptState: result.state,
    verified: result.verified,
  };
}

/** Retry decryption of a stored row that previously failed or was locked. */
export async function retryDecrypt(msg: StoredMessage): Promise<StoredMessage> {
  if (msg.isDeleted || msg.decryptState === 'ok' || !msg.ciphertext) return msg;
  try {
    const result = await decryptMessage({
      channelId: msg.channelId,
      senderId: msg.senderId,
      encryptedContent: msg.ciphertext,
      contentIv: msg.iv || null,
      contentTag: msg.tag || null,
      signature: msg.signature || null,
      metadata: msg.metadata,
    });
    // Still failing the same way — keep the row identity (no re-render)
    if (result.state === msg.decryptState) return msg;
    return {
      ...msg,
      plaintext: result.plaintext,
      decryptState: result.state,
      verified: result.verified,
    };
  } catch {
    return msg;
  }
}
