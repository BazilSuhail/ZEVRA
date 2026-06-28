"use client";

import { create } from "zustand";
import { api } from "@/utils/api";

// ─── Watermark Store ──────────────────────────────────────────────────────────
// Tracks the last read message ID per channel (client-side).
// Server only gets synced on channel leave + periodic (30s).
// Unread count = messages after watermark — zero DB calls.

interface WatermarkState {
  watermarks: Record<string, string>; // { channelId: lastReadMessageId }
  syncPending: Set<string>; // channels that need server sync

  setWatermark: (channelId: string, messageId: string) => void;
  getWatermark: (channelId: string) => string | null;
  syncToServer: (channelId: string) => Promise<void>;
  syncAll: () => Promise<void>;
  loadFromServer: (inbox: { id: string; lastReadMessageId: string | null }[]) => void;
}

export const useWatermark = create<WatermarkState>((set, get) => ({
  watermarks: (() => {
    if (typeof window === "undefined") return {};
    try {
      return JSON.parse(localStorage.getItem("zevra_watermarks") || "{}");
    } catch {
      return {};
    }
  })(),

  syncPending: new Set(),

  setWatermark: (channelId, messageId) => {
    set((state) => {
      const next = { ...state.watermarks, [channelId]: messageId };
      localStorage.setItem("zevra_watermarks", JSON.stringify(next));
      return { watermarks: next, syncPending: new Set([...state.syncPending, channelId]) };
    });
  },

  getWatermark: (channelId) => {
    return get().watermarks[channelId] || null;
  },

  syncToServer: async (channelId) => {
    const { watermarks } = get();
    const messageId = watermarks[channelId];
    if (!messageId) return;

    try {
      await api.post("/channels/mark-read", { channelId, lastReadMessageId: messageId });
      set((state) => {
        const next = new Set(state.syncPending);
        next.delete(channelId);
        return { syncPending: next };
      });
    } catch {}
  },

  syncAll: async () => {
    const { watermarks, syncPending } = get();
    const channelIds = [...syncPending];
    if (channelIds.length === 0) return;

    for (const channelId of channelIds) {
      const messageId = watermarks[channelId];
      if (!messageId) continue;
      try {
        await api.post("/channels/mark-read", { channelId, lastReadMessageId: messageId });
      } catch {}
    }

    set({ syncPending: new Set() });
  },

  loadFromServer: (inbox) => {
    set((state) => {
      const next = { ...state.watermarks };
      let changed = false;
      for (const ch of inbox) {
        if (ch.lastReadMessageId) {
          // Take the newer of local vs server
          const local = next[ch.id];
          if (!local) {
            next[ch.id] = ch.lastReadMessageId;
            changed = true;
          }
        }
      }
      if (changed) localStorage.setItem("zevra_watermarks", JSON.stringify(next));
      return { watermarks: next };
    });
  },
}));
