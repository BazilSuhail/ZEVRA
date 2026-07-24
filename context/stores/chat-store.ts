import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type { MessageReaction } from '@/lib/db';

// ─── Types ──────────────────────────────────────────────────────────────────

export interface ChatState {
  activeRoomId: string | null;

  // Unread
  unreadCounts: Record<string, number>;
  totalUnread: number;

  // Typing
  typingUsers: Record<string, Set<string>>; // channelId → Set<userId>

  // Latest message WE sent per channel (sender doesn't get message:new echo,
  // so the sidebar needs this to update its own-message previews)
  sentPreviews: Record<string, { senderId: string; text: string; at: string }>;

  // Emoji reactions keyed by messageId (hydrated from GET_MESSAGES,
  // kept live via reaction:added / reaction:removed socket events)
  reactionsByMessage: Record<string, MessageReaction[]>;

  // Messages with a local reaction intent not yet confirmed by the server.
  // History hydration must not overwrite their optimistic reactions.
  pendingReactionOps: Record<string, number>;
}

export interface ChatActions {
  setActiveRoom: (channelId: string | null) => void;

  // Unread
  setUnreadCounts: (counts: Record<string, number>) => void;
  mergeUnreadCounts: (counts: Record<string, number>) => void;
  incrementUnread: (channelId: string) => void;
  resetUnread: (channelId: string) => void;

  // Typing
  setTyping: (channelId: string, userId: string) => void;
  removeTyping: (channelId: string, userId: string) => void;

  // Sent previews
  setSentPreview: (
    channelId: string,
    preview: { senderId: string; text: string; at: string },
  ) => void;

  // Reactions
  setReactionsBulk: (byMessage: Record<string, MessageReaction[]>) => void;
  /** History hydration: skips messages that have pending local reaction ops. */
  mergeReactionsFromHistory: (byMessage: Record<string, MessageReaction[]>) => void;
  addReaction: (messageId: string, reaction: MessageReaction) => void;
  removeReaction: (messageId: string, userId: string, emoji: string) => void;
  beginReactionOp: (messageId: string) => void;
  endReactionOp: (messageId: string) => void;

  // Reset
  reset: () => void;
}

const initialState: ChatState = {
  activeRoomId: null,
  unreadCounts: {},
  totalUnread: 0,
  typingUsers: {},
  sentPreviews: {},
  reactionsByMessage: {},
  pendingReactionOps: {},
};

const sum = (counts: Record<string, number>) =>
  Object.values(counts).reduce((acc, n) => acc + n, 0);

// ─── Store ──────────────────────────────────────────────────────────────────

export const useChatStore = create<ChatState & ChatActions>()(
  devtools(
    (set) => ({
      ...initialState,

      setActiveRoom: (channelId) => set({ activeRoomId: channelId }, false, 'setActiveRoom'),

      // ─── Unread ────────────────────────────────────────────────────

      setUnreadCounts: (counts) =>
        set({ unreadCounts: counts, totalUnread: sum(counts) }, false, 'setUnreadCounts'),

      mergeUnreadCounts: (counts) =>
        set(
          (state) => {
            const next = { ...state.unreadCounts, ...counts };
            for (const [id, n] of Object.entries(next)) if (!n) delete next[id];
            return { unreadCounts: next, totalUnread: sum(next) };
          },
          false,
          'mergeUnreadCounts',
        ),

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
            if (!state.unreadCounts[channelId]) return state;
            const current = state.unreadCounts[channelId];
            const rest = { ...state.unreadCounts };
            delete rest[channelId];
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
              const rest = { ...state.typingUsers };
              delete rest[channelId];
              return { typingUsers: rest };
            }
            return {
              typingUsers: { ...state.typingUsers, [channelId]: updated },
            };
          },
          false,
          'removeTyping',
        ),

      // ─── Sent previews ─────────────────────────────────────────────

      setSentPreview: (channelId, preview) =>
        set(
          (state) => ({
            sentPreviews: { ...state.sentPreviews, [channelId]: preview },
          }),
          false,
          'setSentPreview',
        ),

      // ─── Reactions ────────────────────────────────────────────────

      setReactionsBulk: (byMessage) =>
        set(
          (state) => ({
            reactionsByMessage: { ...state.reactionsByMessage, ...byMessage },
          }),
          false,
          'setReactionsBulk',
        ),

      mergeReactionsFromHistory: (byMessage) =>
        set(
          (state) => {
            const next = { ...state.reactionsByMessage };
            for (const [id, list] of Object.entries(byMessage)) {
              if (state.pendingReactionOps[id]) continue;
              next[id] = list;
            }
            return { reactionsByMessage: next };
          },
          false,
          'mergeReactionsFromHistory',
        ),

      addReaction: (messageId, reaction) =>
        set(
          (state) => {
            const current = state.reactionsByMessage[messageId] || [];
            // Dedupe: same user + emoji already present
            if (
              current.some(
                (r) => r.userId === reaction.userId && r.emoji === reaction.emoji,
              )
            ) {
              return state;
            }
            return {
              reactionsByMessage: {
                ...state.reactionsByMessage,
                [messageId]: [...current, reaction],
              },
            };
          },
          false,
          'addReaction',
        ),

      removeReaction: (messageId, userId, emoji) =>
        set(
          (state) => {
            const current = state.reactionsByMessage[messageId];
            if (!current) return state;
            const next = current.filter(
              (r) => !(r.userId === userId && r.emoji === emoji),
            );
            return {
              reactionsByMessage: {
                ...state.reactionsByMessage,
                [messageId]: next,
              },
            };
          },
          false,
          'removeReaction',
        ),

      beginReactionOp: (messageId) =>
        set(
          (state) => ({
            pendingReactionOps: {
              ...state.pendingReactionOps,
              [messageId]: (state.pendingReactionOps[messageId] || 0) + 1,
            },
          }),
          false,
          'beginReactionOp',
        ),

      endReactionOp: (messageId) =>
        set(
          (state) => {
            const n = (state.pendingReactionOps[messageId] || 0) - 1;
            const next = { ...state.pendingReactionOps };
            if (n > 0) next[messageId] = n;
            else delete next[messageId];
            return { pendingReactionOps: next };
          },
          false,
          'endReactionOp',
        ),

      // ─── Reset ─────────────────────────────────────────────────────

      reset: () => set(initialState, false, 'reset'),
    }),
    { name: 'ChatStore' },
  ),
);
