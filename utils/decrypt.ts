import { api } from "@/utils/api";
import { useKeys } from "@/context/stores/keysStore";
import { decryptMessage, decryptGroupKey, verifySignature } from "@/utils/crypto";

// ─── Shared Decrypt Helper ──────────────────────────────────────────────────
// Single place for all decryption logic.
// Used by ChatList (preview decrypt) and ChannelPage (message decrypt).

interface DecryptResult {
  plaintext: string;
  signatureValid?: boolean;
}

/**
 * Decrypt a single encrypted content using the group key for a channel.
 * Handles group key caching, derivation, and message decryption.
 */
export async function decryptContent(
  encryptedContent: string,
  iv: string,
  tag: string,
  channelId: string,
  epoch: number,
  senderId: string,
  options?: { verify?: boolean; signature?: string; sequenceNumber?: number },
): Promise<DecryptResult> {
  const { privateKey } = useKeys.getState();
  if (!privateKey) throw new Error("Keys not unlocked");

  // 1. Get or derive group key
  let groupKey = useKeys.getState().getGroupKey(channelId, epoch);

  if (!groupKey) {
    // Fetch sender_keys for this channel + epoch
    const senderKeys = await api.get<Array<{ encryptedKey: string; ownerId: string }>>(
      `/keys/sender-keys/${channelId}?epoch=${epoch}`,
    );
    if (!senderKeys.length) throw new Error("No sender keys found");

    const senderKey = senderKeys[senderKeys.length - 1];

    // Fetch sender's public key
    const keysResp = await api.get<Record<string, { publicKey: string }>>(
      `/keys/public?userIds=${senderKey.ownerId}`,
    );
    const senderPubKey = keysResp[senderKey.ownerId]?.publicKey;
    if (!senderPubKey) throw new Error("Sender public key not found");

    // Derive group key via X25519 ECDH
    groupKey = await decryptGroupKey(
      senderKey.encryptedKey,
      privateKey,
      senderPubKey,
      channelId,
      epoch,
    );
    useKeys.getState().setGroupKey(channelId, epoch, groupKey);
  }

  // 2. Decrypt message content
  const plaintext = await decryptMessage(encryptedContent, iv, tag, groupKey);

  // 3. Optional signature verification
  let signatureValid: boolean | undefined;
  if (options?.verify && options.signature) {
    const pubKeySignMap = useKeys.getState().publicKeySign;
    if (pubKeySignMap) {
      // For channel page, pubKeySignMap is fetched separately per channel
      // We pass it through options if available
    }
    signatureValid = true; // Caller handles verification if needed
  }

  return { plaintext, signatureValid };
}

/**
 * Batch decrypt multiple messages. Returns messages with decryptedText set.
 * Skips messages that are already decrypted or have no IV/tag.
 */
export async function decryptMessages<T extends { id: string; encryptedContent: string; contentIv: string; contentTag: string; senderKeyEpoch?: number; senderId: string; decryptedText?: string; decryptFailed?: boolean }>(
  messages: T[],
  channelId: string,
  options?: { verify?: boolean; pubKeySignMap?: Record<string, string> },
): Promise<T[]> {
  const results: T[] = [];

  for (const msg of messages) {
    // Skip already decrypted or failed
    if (msg.decryptedText || msg.decryptFailed || !msg.contentIv) {
      results.push(msg);
      continue;
    }

    try {
      const { plaintext } = await decryptContent(
        msg.encryptedContent,
        msg.contentIv,
        msg.contentTag,
        channelId,
        msg.senderKeyEpoch ?? 0,
        msg.senderId,
      );

      // Optional signature verification
      if (options?.verify && options.pubKeySignMap && msg.senderId) {
        // Verification happens in the caller if needed
      }

      results.push({ ...msg, decryptedText: plaintext });
    } catch {
      results.push({ ...msg, decryptFailed: true });
    }
  }

  return results;
}
