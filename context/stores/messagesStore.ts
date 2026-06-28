import { create } from "zustand";
import type { Message } from "../../utils/types";

// ─── Messages Store ──────────────────────────────────────────────────────────
// Single source of truth for all messages across all channels.
// Supabase Realtime pushes new messages here.
// UI reads from here — no React Query needed for messages.

interface MessagesState {
  messages: Record<string, Message[]>; // { channelId: messages[] }

  loadMessages: (channelId: string, msgs: Message[]) => void;
  addMessage: (channelId: string, msg: Message) => void;
  removeMessage: (channelId: string, messageId: string) => void;
  hardRemove: (channelId: string, messageId: string) => void;
  mergeDecrypted: (channelId: string, msgs: Message[]) => void;
  getMessages: (channelId: string) => Message[];
}

export const useMessages = create<MessagesState>((set, get) => ({
  messages: {},

  loadMessages: (channelId, msgs) => {
    set((state) => {
      const existing = state.messages[channelId] || [];
      const byId = new Map(existing.map((message) => [message.id, message]));
      for (const message of msgs) {
        const current = byId.get(message.id);
        byId.set(message.id, current ? { ...message, ...current } : message);
      }

      return {
        messages: {
          ...state.messages,
          [channelId]: [...byId.values()].sort(
            (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
          ),
        },
      };
    });
  },

  addMessage: (channelId, msg) => {
    set((state) => {
      const existing = state.messages[channelId] || [];
      if (existing.some((m) => m.id === msg.id)) return state;
      return {
        messages: { ...state.messages, [channelId]: [msg, ...existing] },
      };
    });
  },

  removeMessage: (channelId, messageId) => {
    set((state) => {
      const existing = state.messages[channelId] || [];
      return {
        messages: {
          ...state.messages,
          [channelId]: existing.map((m) =>
            m.id === messageId ? { ...m, isDeleted: true } : m
          ),
        },
      };
    });
  },

  hardRemove: (channelId, messageId) => {
    set((state) => {
      const existing = state.messages[channelId] || [];
      return {
        messages: {
          ...state.messages,
          [channelId]: existing.filter((m) => m.id !== messageId),
        },
      };
    });
  },

  mergeDecrypted: (channelId, msgs) => {
    set((state) => {
      const existing = state.messages[channelId] || [];
      const byId = new Map(msgs.map((m) => [m.id, m]));
      return {
        messages: {
          ...state.messages,
          [channelId]: existing.map((m) => byId.get(m.id) || m),
        },
      };
    });
  },

  getMessages: (channelId) => {
    return get().messages[channelId] || [];
  },
}));
