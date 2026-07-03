import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type { StoredMessage, StoredRoom } from '@/lib/db';
import { MessageStatus } from '@/constants';

// ─── Types ──────────────────────────────────────────────────────────────────

export interface ChatState {
  // Rooms
  rooms: StoredRoom[];
  activeRoomId: string | null;

  // Messages (decrypted, for active room)
  messages: StoredMessage[];
  isLoadingMessages: boolean;
  hasMoreMessages: boolean;
  messageCursor: string | null;

  // Unread
  unreadCounts: Record<string, number>;
  totalUnread: number;

  // Typing
  typingUsers: Record<string, Set<string>>; // channelId → Set<userId>
}

export interface ChatActions {
  // Rooms
  setRooms: (rooms: StoredRoom[]) => void;
  addRoom: (room: StoredRoom) => void;
  updateRoom: (channelId: string, updates: Partial<StoredRoom>) => void;
  setActiveRoom: (channelId: string | null) => void;

  // Messages
  setMessages: (messages: StoredMessage[]) => void;
  addMessage: (message: StoredMessage) => void;
  updateMessage: (messageId: string, updates: Partial<StoredMessage>) => void;
  updateMessageStatus: (messageId: string, status: MessageStatus) => void;
  deleteMessage: (messageId: string) => void;
  prependMessages: (messages: StoredMessage[]) => void;
  setLoadingMessages: (loading: boolean) => void;
  setHasMore: (hasMore: boolean) => void;
  setMessageCursor: (cursor: string | null) => void;

  // Unread
  setUnreadCounts: (counts: Record<string, number>) => void;
  incrementUnread: (channelId: string) => void;
  resetUnread: (channelId: string) => void;

  // Typing
  setTyping: (channelId: string, userId: string) => void;
  removeTyping: (channelId: string, userId: string) => void;

  // Reset
  reset: () => void;
}

const initialState: ChatState = {
  rooms: [],
  activeRoomId: null,
  messages: [],
  isLoadingMessages: false,
  hasMoreMessages: true,
  messageCursor: null,
  unreadCounts: {},
  totalUnread: 0,
  typingUsers: {},
};

// ─── Store ──────────────────────────────────────────────────────────────────

export const useChatStore = create<ChatState & ChatActions>()(
  devtools(
    (set, get) => ({
      ...initialState,

      // ─── Rooms ──────────────────────────────────────────────────────

      setRooms: (rooms) => set({ rooms }, false, 'setRooms'),

      addRoom: (room) =>
        set(
          (state) => ({
            rooms: [room, ...state.rooms.filter((r) => r.id !== room.id)],
          }),
          false,
          'addRoom',
        ),

      updateRoom: (channelId, updates) =>
        set(
          (state) => ({
            rooms: state.rooms.map((r) =>
              r.id === channelId ? { ...r, ...updates } : r,
            ),
          }),
          false,
          'updateRoom',
        ),

      setActiveRoom: (channelId) => {
        set({ activeRoomId: channelId }, false, 'setActiveRoom');
        // Reset messages when switching rooms
        if (channelId) {
          set(
            { messages: [], messageCursor: null, hasMoreMessages: true },
            false,
            'setActiveRoom/reset',
          );
        }
      },

      // ─── Messages ──────────────────────────────────────────────────

      setMessages: (messages) => set({ messages }, false, 'setMessages'),

      addMessage: (message) =>
        set(
          (state) => {
            // Deduplicate
            if (state.messages.some((m) => m.id === message.id)) return state;
            return { messages: [...state.messages, message] };
          },
          false,
          'addMessage',
        ),

      updateMessage: (messageId, updates) =>
        set(
          (state) => ({
            messages: state.messages.map((m) =>
              m.id === messageId ? { ...m, ...updates } : m,
            ),
          }),
          false,
          'updateMessage',
        ),

      updateMessageStatus: (messageId, status) =>
        set(
          (state) => ({
            messages: state.messages.map((m) =>
              m.id === messageId ? { ...m, status } : m,
            ),
          }),
          false,
          'updateMessageStatus',
        ),

      deleteMessage: (messageId) =>
        set(
          (state) => ({
            messages: state.messages.filter((m) => m.id !== messageId),
          }),
          false,
          'deleteMessage',
        ),

      prependMessages: (newMessages) =>
        set(
          (state) => {
            const existingIds = new Set(state.messages.map((m) => m.id));
            const unique = newMessages.filter((m) => !existingIds.has(m.id));
            return { messages: [...unique, ...state.messages] };
          },
          false,
          'prependMessages',
        ),

      setLoadingMessages: (isLoadingMessages) =>
        set({ isLoadingMessages }, false, 'setLoadingMessages'),

      setHasMore: (hasMoreMessages) =>
        set({ hasMoreMessages }, false, 'setHasMore'),

      setMessageCursor: (messageCursor) =>
        set({ messageCursor }, false, 'setMessageCursor'),

      // ─── Unread ────────────────────────────────────────────────────

      setUnreadCounts: (counts) => {
        const total = Object.values(counts).reduce((sum, n) => sum + n, 0);
        set({ unreadCounts: counts, totalUnread: total }, false, 'setUnreadCounts');
      },

      incrementUnread: (channelId) =>
        set(
          (state) => {
            const current = state.unreadCounts[channelId] || 0;
            return {
              unreadCounts: { ...state.unreadCounts, [channelId]: current + 1 },
              totalUnread: state.totalUnread + 1,
            };
          },
          false,
          'incrementUnread',
        ),

      resetUnread: (channelId) =>
        set(
          (state) => {
            const current = state.unreadCounts[channelId] || 0;
            const { [channelId]: _, ...rest } = state.unreadCounts;
            return {
              unreadCounts: rest,
              totalUnread: Math.max(0, state.totalUnread - current),
            };
          },
          false,
          'resetUnread',
        ),

      // ─── Typing ────────────────────────────────────────────────────

      setTyping: (channelId, userId) =>
        set(
          (state) => {
            const current = state.typingUsers[channelId] || new Set();
            const updated = new Set(current);
            updated.add(userId);
            return {
              typingUsers: { ...state.typingUsers, [channelId]: updated },
            };
          },
          false,
          'setTyping',
        ),

      removeTyping: (channelId, userId) =>
        set(
          (state) => {
            const current = state.typingUsers[channelId];
            if (!current) return state;
            const updated = new Set(current);
            updated.delete(userId);
            if (updated.size === 0) {
              const { [channelId]: _, ...rest } = state.typingUsers;
              return { typingUsers: rest };
            }
            return {
              typingUsers: { ...state.typingUsers, [channelId]: updated },
            };
          },
          false,
          'removeTyping',
        ),

      // ─── Reset ─────────────────────────────────────────────────────

      reset: () => set(initialState, false, 'reset'),
    }),
    { name: 'ChatStore' },
  ),
);
