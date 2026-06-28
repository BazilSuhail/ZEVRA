import { create } from "zustand";
import type { Channel } from "../../utils/types";

// ─── Channels Store ──────────────────────────────────────────────────────────

interface ChannelsState {
  channels: Channel[];
  loaded: boolean;
  previews: Record<string, string>; // channelId → decrypted last message preview

  loadChannels: (channels: Channel[]) => void;
  updateChannel: (channelId: string, updates: Partial<Channel>) => void;
  getChannel: (channelId: string) => Channel | undefined;
  setPreview: (channelId: string, text: string) => void;
}

export const useChannels = create<ChannelsState>((set, get) => ({
  channels: [],
  loaded: false,
  previews: {},

  loadChannels: (channels) => {
    set({ channels, loaded: true });
  },

  updateChannel: (channelId, updates) => {
    set((state) => ({
      channels: state.channels.map((ch) =>
        ch.id === channelId ? { ...ch, ...updates } : ch
      ),
    }));
  },

  getChannel: (channelId) => {
    return get().channels.find((ch) => ch.id === channelId);
  },

  setPreview: (channelId, text) => {
    set((state) => ({
      previews: { ...state.previews, [channelId]: text },
    }));
  },
}));
