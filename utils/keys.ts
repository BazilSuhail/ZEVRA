import { api } from "./api";
import type { PublicKeyEntry, SenderKey } from "./types";

// ─── Public Keys ──────────────────────────────────────────────────────────────
// Fetch other users' public keys for E2EE encryption.

export async function getPublicKeys(userIds: string[]): Promise<Record<string, PublicKeyEntry>> {
  const params: Record<string, string[]> = {};
  params.userIds = userIds;
  return api.get<Record<string, PublicKeyEntry>>("/keys/public", params);
}

// ─── Sender Keys (Group E2EE) ────────────────────────────────────────────────
// Upload per-member encrypted sender keys for a group.

export async function uploadSenderKeys(
  groupId: string,
  epoch: number,
  items: { receiverId: string; encryptedKey: string; keySignature: string }[]
): Promise<{ success: boolean; message: string }> {
  return api.post("/keys/sender-keys", { groupId, epoch, items });
}

// Get sender keys for current user in a group.
export async function getSenderKeys(
  groupId: string,
  epoch?: number
): Promise<SenderKey[]> {
  const params: Record<string, string | number> = {};
  if (epoch !== undefined) params.epoch = epoch;
  return api.get<SenderKey[]>(`/keys/sender-keys/${groupId}`, params);
}

// Get all sender keys for a group (admin/key rotation).
export async function getAllSenderKeys(groupId: string): Promise<SenderKey[]> {
  return api.get<SenderKey[]>(`/keys/sender-keys/${groupId}/all`);
}
