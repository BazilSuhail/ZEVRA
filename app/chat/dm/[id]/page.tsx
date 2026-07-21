"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { motion } from "motion/react";
import {
  FiArrowLeft,
  FiCheck,
  FiLock,
  FiMoreHorizontal,
  FiPaperclip,
  FiSend,
  FiShield,
  FiSmile,
  FiLoader,
  FiAlertCircle,
} from "react-icons/fi";
import { useAuthStore } from "@/context/stores";
import { useChatStore } from "@/context/stores/chat-store";
import { useSocketStore } from "@/context/stores/socket-store";
import { getSocket } from "@/lib/socket";
import { decryptMessage, encryptForChannel } from "@/lib/e2ee";
import { SOCKET_EVENTS, MessageStatus } from "@/constants";
import { api } from "@/utils/api";
import {
  getChannelMessages,
  saveMessages,
  saveMessage,
  type StoredMessage,
  type MessageReaction,
} from "@/lib/db";
import CallButton from "@/components/calls/CallButton";

// ─── Types ────────────────────────────────────────────────────────────────

interface ChannelInfo {
  id: string;
  name: string | null;
  type: string;
  isArchived: boolean;
  memberCount?: number;
  members?: { id: string; username: string; status: string; role: string; joinedAt: string }[];
  createdAt: string;
}

interface RawMessage {
  id: string;
  channelId: string;
  senderId: string;
  encryptedContent: string;
  contentIv: string;
  contentTag: string;
  signature?: string;
  sequenceNumber: number;
  senderKeyEpoch?: number;
  messageType?: string;
  metadata?: Record<string, unknown>;
  isDeleted?: boolean;
  createdAt: string;
  updatedAt?: string;
}

// Quick-pick reaction emojis (no external picker dependency)
const QUICK_EMOJIS = ["👍", "❤️", "😂", "😮", "😢", "😡", "🙏", "🔥"];

// ─── Component ────────────────────────────────────────────────────────────

export default function DMChatPage() {
  const { id: channelId } = useParams<{ id: string }>();
  const me = useAuthStore((s) => s.user);

  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const typingUsers = useChatStore((s) => s.typingUsers);
  const isConnected = useSocketStore((s) => s.isConnected);
  const onlineUsers = useSocketStore((s) => s.onlineUsers);

  const [channel, setChannel] = useState<ChannelInfo | null>(null);
  const [messages, setMessages] = useState<StoredMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [cursor, setCursor] = useState<number | null>(null);
  const [idbReady, setIdbReady] = useState(false);
  const [reactingTo, setReactingTo] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const initialLoadChannel = useRef<string | null>(null);

  const socket = getSocket();
  const channelTyping = typingUsers[channelId] || new Set();
  const typingNames = Array.from(channelTyping).filter((uid) => uid !== me?.id);

  // ─── Track active room for unread counting ───────────────────────────
  const setActiveRoom = useChatStore((s) => s.setActiveRoom);
  const resetUnread = useChatStore((s) => s.resetUnread);
  const setSentPreview = useChatStore((s) => s.setSentPreview);
  const reactionsByMessage = useChatStore((s) => s.reactionsByMessage);
  useEffect(() => {
    if (channelId) {
      setActiveRoom(channelId);
      resetUnread(channelId);
    }
    return () => setActiveRoom(null);
  }, [channelId, setActiveRoom, resetUnread]);

  // ─── Fetch channel info ──────────────────────────────────────────────
  useEffect(() => {
    if (!channelId || !isAuthenticated) return;
    api
      .get<ChannelInfo>(`/channels/${channelId}`)
      .then((data) => setChannel(data))
      .catch(() => setError("Failed to load channel"));
  }, [channelId, isAuthenticated]);

  // ─── Presence: track if peer is online (shared socket store) ─────────
  const otherMember = channel?.members?.find((m) => m.id !== me?.id);
  const isOnline = !!onlineUsers[otherMember?.id || ""];

  useEffect(() => {
    if (!isConnected || !otherMember?.id) return;
    // Explicit request covers peers unknown at connect-time (new DMs)
    getSocket()?.emit(
      SOCKET_EVENTS.PRESENCE_BULK,
      { userIds: [otherMember.id] },
      (res: { online: string[] }) => {
        if (res?.online) useSocketStore.getState().setUsersOnline(res.online);
      },
    );
  }, [isConnected, otherMember?.id]);

  // ─── Reactions: group + toggle ────────────────────────────────────

  const groupReactions = (list: MessageReaction[] | undefined) => {
    if (!list || list.length === 0) return [];
    const map = new Map<
      string,
      { emoji: string; count: number; users: string[]; mine: boolean }
    >();
    for (const r of list) {
      const g = map.get(r.emoji) || { emoji: r.emoji, count: 0, users: [], mine: false };
      g.count += 1;
      g.users.push(r.username || "Someone");
      if (me && r.userId === me.id) g.mine = true;
      map.set(r.emoji, g);
    }
    return Array.from(map.values());
  };

  // ─── Reactions: debounced, coalesced sends (latest-wins) ────────────
  // Rapid toggling must not race the server: at most ONE emit per message
  // is in flight, and intermediate clicks collapse into the final intent.

  const reactionTimersRef = useRef(new Map<string, ReturnType<typeof setTimeout>>());
  const reactionInFlightRef = useRef(new Set<string>());
  const reactionQueuedRef = useRef(
    new Map<string, { emoji: string; remove: boolean }>(),
  );

  // Self-heal after persistent failure: adopt server truth silently
  // (no error banner — the UI just settles to the authoritative state)
  const syncReactionsFromServer = useCallback(
    async (messageId: string) => {
      try {
        const grouped = await api.get<Array<{ emoji: string; userIds: string[] }>>(
          "/reactions",
          { messageId, channelId },
        );
        const known =
          useChatStore.getState().reactionsByMessage[messageId] || [];
        const list: MessageReaction[] = [];
        for (const g of grouped || []) {
          for (const uid of g.userIds) {
            list.push({
              emoji: g.emoji,
              userId: uid,
              username: known.find((r) => r.userId === uid)?.username ?? null,
            });
          }
        }
        useChatStore.getState().setReactionsBulk({ [messageId]: list });
      } catch {
        // Offline — keep optimistic state; the next history sync fixes it
      }
    },
    [channelId],
  );

  const flushReactions = useCallback(
    (messageId: string) => {
      if (!socket || reactionInFlightRef.current.has(messageId)) return;
      const op = reactionQueuedRef.current.get(messageId);
      if (!op) return;

      reactionQueuedRef.current.delete(messageId);
      const timer = reactionTimersRef.current.get(messageId);
      if (timer) {
        clearTimeout(timer);
        reactionTimersRef.current.delete(messageId);
      }
      reactionInFlightRef.current.add(messageId);

      const finish = () => {
        reactionInFlightRef.current.delete(messageId);
        // A newer click arrived mid-flight — send that one now
        if (reactionQueuedRef.current.has(messageId)) flushReactions(messageId);
      };

      const attempt = (retriesLeft: number) => {
        (socket as any)
          .timeout(4000)
          .emit(
            op.remove ? SOCKET_EVENTS.REACTION_REMOVE : SOCKET_EVENTS.REACTION_ADD,
            { channelId, messageId, emoji: op.emoji },
            (err: Error | null, res: { success?: boolean }) => {
              if (!err && res?.success) {
                finish();
                return;
              }
              if (retriesLeft > 0) {
                setTimeout(() => attempt(retriesLeft - 1), 400);
                return;
              }
              // Still failing — silently resync instead of showing an error
              void syncReactionsFromServer(messageId);
              finish();
            },
          );
      };

      attempt(1);
    },
    [socket, channelId, syncReactionsFromServer],
  );

  const scheduleReactionFlush = useCallback(
    (messageId: string) => {
      // In flight → finish() will pick up the queued intent
      if (reactionInFlightRef.current.has(messageId)) return;
      const existing = reactionTimersRef.current.get(messageId);
      if (existing) clearTimeout(existing);
      const t = setTimeout(() => {
        reactionTimersRef.current.delete(messageId);
        flushReactions(messageId);
      }, 250);
      reactionTimersRef.current.set(messageId, t);
    },
    [flushReactions],
  );

  // Clear pending debounce timers on unmount
  useEffect(() => {
    const timers = reactionTimersRef.current;
    return () => {
      for (const t of timers.values()) clearTimeout(t);
      timers.clear();
    };
  }, []);

  const toggleReaction = useCallback(
    (messageId: string, emoji: string) => {
      if (!channelId || !me) return;
      setReactingTo(null);

      const state = useChatStore.getState();
      const existing = state.reactionsByMessage[messageId] || [];
      const mineBefore = existing.filter((r) => r.userId === me.id);
      const hadMine = mineBefore.some((r) => r.emoji === emoji);

      // Optimistic apply (instant UI) — one reaction per user: a new emoji
      // displaces my previous one, clicking my own emoji removes it
      if (hadMine) {
        state.removeReaction(messageId, me.id, emoji);
      } else {
        for (const r of mineBefore) {
          state.removeReaction(messageId, me.id, r.emoji);
        }
        state.addReaction(messageId, {
          emoji,
          userId: me.id,
          username: me.username,
        });
      }

      // Latest-wins: coalesce rapid clicks, emit debounced & serialized
      reactionQueuedRef.current.set(messageId, { emoji, remove: hadMine });
      scheduleReactionFlush(messageId);
    },
    [channelId, me, scheduleReactionFlush],
  );

  // ─── Step 1: Load from IDB instantly ─────────────────────────────────
  useEffect(() => {
    if (!channelId || initialLoadChannel.current === channelId) return;
    initialLoadChannel.current = channelId;

    (async () => {
      try {
        const cached = await getChannelMessages(channelId);
        if (cached.length > 0) {
          setMessages(cached);
          setIdbReady(true);
          setLoading(false);
          setTimeout(() => {
            messagesEndRef.current?.scrollIntoView({ behavior: "instant" });
          }, 0);
        }
      } catch {}
    })();
  }, [channelId]);

  // ─── Step 2: Fetch from server & merge ──────────────────────────────
  const fetchAndMerge = useCallback(
    (loadCursor?: number | null) => {
      if (!socket || !channelId) return;

      if (!idbReady && !loadCursor) {
        setLoading(true);
      }
      setSyncing(true);
      setError(null);

      socket.emit(
        SOCKET_EVENTS.GET_MESSAGES,
        {
          channelId,
          limit: 50,
          cursor: loadCursor ?? undefined,
          mode: loadCursor != null ? "before" : "latest",
        },
        async (res: any) => {
          if (!res.success) {
            setError(res.error || "Failed to load messages");
            setLoading(false);
            setSyncing(false);
            return;
          }

          const serverMessages: StoredMessage[] = [];

          for (const m of res.messages || []) {
            let plaintext: string;
            try {
              const decrypted = await decryptMessage({
                channelId,
                senderId: m.senderId,
                encryptedContent: m.encryptedContent,
                contentIv: m.contentIv,
                contentTag: m.contentTag,
                metadata: m.metadata,
              });
              plaintext = decrypted ?? "[Encrypted message]";
            } catch {
              plaintext = "[Encrypted message]";
            }

            serverMessages.push({
              id: m.id,
              channelId: m.channelId,
              senderId: m.senderId,
              ciphertext: m.encryptedContent,
              iv: m.contentIv,
              tag: m.contentTag,
              signature: m.signature || "",
              sequenceNumber: m.sequenceNumber,
              senderKeyEpoch: m.senderKeyEpoch || 0,
              messageType: m.messageType || "TEXT",
              metadata: m.metadata || null,
              isDeleted: m.isDeleted || false,
              plaintext,
              status: MessageStatus.DELIVERED,
              createdAt: m.createdAt || new Date().toISOString(),
              updatedAt: m.updatedAt || new Date().toISOString(),
            });
          }

          // Hydrate reactions for this page — server includes them in
          // GET_MESSAGES; overwrite (even with []) so stale entries from a
          // previous session can't linger on re-synced messages
          const reactionsMap: Record<string, MessageReaction[]> = {};
          for (const m of res.messages || []) {
            if (!m.id) continue;
            reactionsMap[m.id] = Array.isArray(m.reactions) ? m.reactions : [];
          }
          if (Object.keys(reactionsMap).length > 0) {
            useChatStore.getState().setReactionsBulk(reactionsMap);
          }

          if (loadCursor) {
            setMessages((prev) => {
              const existingIds = new Set(prev.map((m) => m.id));
              const newMsgs = serverMessages.filter((m) => !existingIds.has(m.id));
              return [...newMsgs, ...prev];
            });
          } else {
            setMessages((prev) => {
              const map = new Map(prev.map((m) => [m.id, m]));
              for (const msg of serverMessages) {
                map.set(msg.id, msg);
              }
              return Array.from(map.values()).sort(
                (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
              );
            });
          }

          await saveMessages(serverMessages);

          setHasMore(res.hasMore ?? false);
          setCursor(res.nextCursor ?? null);
          setLoading(false);
          setSyncing(false);

          // Mark as read on server
          if (serverMessages.length > 0 && !loadCursor) {
            const lastMsg = serverMessages[serverMessages.length - 1];
            socket?.emit(SOCKET_EVENTS.MARK_READ, {
              channelId,
              messageId: lastMsg.id,
            }, () => {});
            resetUnread(channelId);
          }

          if (!loadCursor) {
            setTimeout(() => {
              messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
            }, 50);
          }
        },
      );
    },
    [socket, channelId, idbReady, resetUnread],
  );

  useEffect(() => {
    if (!channelId || !isAuthenticated || !isConnected) return;
    const timer = setTimeout(() => fetchAndMerge(), idbReady ? 300 : 0);
    return () => clearTimeout(timer);
  }, [channelId, isAuthenticated, fetchAndMerge, idbReady, isConnected]);

  // ─── Join channel (also re-joins after reconnect — server re-emits     ─
  // ─── user:joined to the room, harmless if already joined)             ─
  useEffect(() => {
    if (!socket || !channelId || !isAuthenticated || !isConnected) return;
    socket.emit(SOCKET_EVENTS.JOIN_CHANNEL, { channelId }, () => {});
  }, [socket, channelId, isAuthenticated, isConnected]);

  // ─── Listen for new messages ─────────────────────────────────────────
  useEffect(() => {
    if (!socket) return;

    const handleMessage = async (msg: any) => {
      if (msg.channelId !== channelId) return;
      const msgId = msg.id || msg.messageId || `temp-${Date.now()}`;

      let plaintext: string;
      try {
        const decrypted = await decryptMessage({
          channelId,
          senderId: msg.senderId,
          encryptedContent: msg.encryptedContent,
          contentIv: msg.contentIv,
          contentTag: msg.contentTag,
          metadata: msg.metadata,
        });
        plaintext = decrypted ?? "[Encrypted message]";
      } catch {
        plaintext = "[Encrypted message]";
      }

      const stored: StoredMessage = {
        id: msgId,
        channelId: msg.channelId,
        senderId: msg.senderId,
        ciphertext: msg.encryptedContent,
        iv: msg.contentIv,
        tag: msg.contentTag,
        signature: msg.signature || "",
        sequenceNumber: msg.sequenceNumber || 0,
        senderKeyEpoch: msg.senderKeyEpoch || 0,
        messageType: msg.messageType || "TEXT",
        metadata: msg.metadata || null,
        isDeleted: msg.isDeleted || false,
        plaintext,
        status: MessageStatus.DELIVERED,
        createdAt: msg.createdAt || new Date().toISOString(),
        updatedAt: msg.updatedAt || new Date().toISOString(),
      };

      saveMessage(stored).catch(() => {});

      setMessages((prev) => {
        if (prev.some((m) => m.id === msgId)) return prev;
        return [...prev, stored];
      });

      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 50);
    };

    socket.on(SOCKET_EVENTS.MESSAGE_NEW, handleMessage);
    return () => {
      socket.off(SOCKET_EVENTS.MESSAGE_NEW, handleMessage);
    };
  }, [socket, channelId]);

  // ─── Typing: listen ──────────────────────────────────────────────────
  useEffect(() => {
    if (!socket) return;
    const chatStore = useChatStore.getState;

    const onTypingStart = (data: { userId: string; channelId: string }) => {
      if (data.channelId === channelId && data.userId !== me?.id) {
        chatStore().setTyping(data.channelId, data.userId);
      }
    };
    const onTypingStop = (data: { userId: string; channelId: string }) => {
      if (data.channelId === channelId) {
        chatStore().removeTyping(data.channelId, data.userId);
      }
    };

    socket.on(SOCKET_EVENTS.TYPING_START_RECV, onTypingStart);
    socket.on(SOCKET_EVENTS.TYPING_STOP_RECV, onTypingStop);
    return () => {
      socket.off(SOCKET_EVENTS.TYPING_START_RECV, onTypingStart);
      socket.off(SOCKET_EVENTS.TYPING_STOP_RECV, onTypingStop);
    };
  }, [socket, channelId, me?.id]);

  // ─── Mark as read ────────────────────────────────────────────────────
  useEffect(() => {
    if (!socket || !channelId || messages.length === 0) return;
    const lastMsg = messages[messages.length - 1];
    if (lastMsg.senderId === me?.id) return;

    socket.emit(
      SOCKET_EVENTS.MARK_READ,
      { channelId, messageId: lastMsg.id },
      () => {},
    );
  }, [socket, channelId, messages, me?.id]);

  // ─── Send message ────────────────────────────────────────────────────
  const handleSend = async () => {
    if (!draft.trim() || !socket || !channelId || sending) return;

    const memberIds = channel?.members?.map((m) => m.id);
    if (!memberIds || memberIds.length === 0) {
      setError("Channel members not loaded yet — try again in a moment");
      return;
    }

    const text = draft.trim();
    const tempId = `temp-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    setDraft("");
    setSending(true);

    // Encrypt + sign for every member before sending
    let payload: Awaited<ReturnType<typeof encryptForChannel>>;
    try {
      payload = await encryptForChannel({ channelId, memberIds, text });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to encrypt message");
      setDraft(text);
      setSending(false);
      return;
    }

    const optimistic: StoredMessage = {
      id: tempId,
      channelId,
      senderId: me?.id || "",
      ciphertext: payload.encryptedContent,
      iv: payload.contentIv,
      tag: payload.contentTag,
      signature: payload.signature,
      sequenceNumber: 0,
      senderKeyEpoch: 0,
      messageType: "TEXT",
      metadata: payload.metadata,
      isDeleted: false,
      plaintext: text,
      status: MessageStatus.SENT,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, optimistic]);
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 50);

    socket.emit(SOCKET_EVENTS.TYPING_STOP, { channelId });

    socket.emit(
      SOCKET_EVENTS.SEND_MESSAGE,
      {
        channelId,
        encryptedContent: payload.encryptedContent,
        contentIv: payload.contentIv,
        contentTag: payload.contentTag,
        signature: payload.signature,
        sequenceNumber: 0,
        senderKeyEpoch: 0,
        messageType: "TEXT",
        metadata: payload.metadata,
      },
      (res: any) => {
        setSending(false);
        if (!res.success) {
          setError(res.message || "Failed to send");
          setDraft(text);
          setMessages((prev) => prev.filter((m) => m.id !== tempId));
        } else if (res.message?.id) {
          // Sender gets no message:new echo — push our own preview to the sidebar
          setSentPreview(channelId, {
            senderId: me?.id || "",
            text,
            at: res.message.createdAt || new Date().toISOString(),
          });
          setMessages((prev) =>
            prev.map((m) =>
              m.id === tempId
                ? {
                    ...m,
                    id: res.message.id,
                    sequenceNumber: res.message.sequenceNumber ?? m.sequenceNumber,
                    status: MessageStatus.DELIVERED,
                    createdAt: res.message.createdAt || m.createdAt,
                  }
                : m,
            ),
          );
        }
      },
    );
  };

  // ─── Typing: emit ────────────────────────────────────────────────────
  const handleTyping = () => {
    if (!socket || !channelId) return;
    socket.emit(SOCKET_EVENTS.TYPING_START, { channelId });

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      socket.emit(SOCKET_EVENTS.TYPING_STOP, { channelId });
    }, 6000);
  };

  // ─── Scroll to top for more ──────────────────────────────────────────
  const handleScroll = () => {
    const container = messagesContainerRef.current;
    if (!container || !hasMore || loading || !cursor) return;
    if (container.scrollTop < 100) {
      fetchAndMerge(cursor);
    }
  };

  // ─── Derived ─────────────────────────────────────────────────────────
  const displayName = channel?.name || otherMember?.username || "Unknown";
  const initials = displayName
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const formatTime = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  const bgPatternLight = `url("data:image/svg+xml,%3Csvg width='80' height='80' viewBox='0 0 80 80' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg stroke='%23000000' stroke-width='1.2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M12 20h10M12 32h6M12 44h10'/%3E%3Crect x='50' y='16' width='16' height='12' rx='2.5'/%3E%3Cpath d='M54 28v4a2.5 2.5 0 002.5 2.5h2.5l4 4v-4h1.5a2.5 2.5 0 002.5-2.5v-4'/%3E%3Ccircle cx='35' cy='50' r='6'/%3E%3Cpath d='M35 44v-2.5M35 56v-2.5M29 50h-2.5M41 50h-2.5'/%3E%3Cpath d='M62 46l-4 4M58 50l-4-4'/%3E%3Ccircle cx='20' cy='64' r='2.5'/%3E%3Ccircle cx='65' cy='10' r='2.5'/%3E%3Cpath d='M68 60l-2 2M70 58l-2-2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`;
  const bgPatternDark = `url("data:image/svg+xml,%3Csvg width='80' height='80' viewBox='0 0 80 80' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg stroke='%23ffffff' stroke-width='1.2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M12 20h10M12 32h6M12 44h10'/%3E%3Crect x='50' y='16' width='16' height='12' rx='2.5'/%3E%3Cpath d='M54 28v4a2.5 2.5 0 002.5 2.5h2.5l4 4v-4h1.5a2.5 2.5 0 002.5-2.5v-4'/%3E%3Ccircle cx='35' cy='50' r='6'/%3E%3Cpath d='M35 44v-2.5M35 56v-2.5M29 50h-2.5M41 50h-2.5'/%3E%3Cpath d='M62 46l-4 4M58 50l-4-4'/%3E%3Ccircle cx='20' cy='64' r='2.5'/%3E%3Ccircle cx='65' cy='10' r='2.5'/%3E%3Cpath d='M68 60l-2 2M70 58l-2-2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`;
  const [darkMode, setDarkMode] = useState(false);
  useEffect(() => {
    const check = () => setDarkMode(document.documentElement.classList.contains("dark"));
    check();
    const obs = new MutationObserver(check);
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    return () => obs.disconnect();
  }, []);

  // ─── Render ──────────────────────────────────────────────────────────
  return (
    <div className="relative flex h-full min-h-0 min-w-0 flex-1 flex-col bg-[#fbfcfd] dark:bg-zinc-950">
      {/* Background pattern */}
      <div
        className="pointer-events-none absolute inset-0 z-0 opacity-[0.1]"
        style={{ backgroundImage: darkMode ? bgPatternDark : bgPatternLight, backgroundRepeat: "repeat" }}
      />
      {/* Header */}
      <header className="relative z-10 flex items-center justify-between border-b border-zinc-200 bg-white px-4 py-4 dark:border-zinc-800 dark:bg-zinc-900 sm:px-7">
        <div className="flex items-center gap-3">
          <Link
            href="/chat"
            className="rounded-lg p-2 text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
          >
            <FiArrowLeft />
          </Link>
          <Link
            href={`/chat/dm/${channelId}/info`}
            className="flex items-center gap-3"
          >
            <div className="relative flex h-10 w-10 items-center justify-center rounded-full bg-amber-100 text-sm font-bold text-amber-700">
              {initials}
              <span className={`absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-white dark:border-zinc-900 ${isOnline ? "bg-emerald-500" : "bg-zinc-400"}`} />
            </div>
            <div>
              <h2 className="text-sm font-bold">{displayName}</h2>
              <p className="text-xs text-zinc-500">
                {loading ? "Loading..." : isOnline ? "Online" : "Offline"}
              </p>
            </div>
          </Link>
        </div>
        <div className="flex items-center gap-2">
          {syncing && (
            <FiLoader className="h-4 w-4 animate-spin text-zinc-400" />
          )}
          <span className="hidden items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1.5 text-[11px] font-semibold text-emerald-700 sm:flex dark:bg-emerald-950/40 dark:text-emerald-400">
            <FiShield /> end-to-end encrypted
          </span>
          {otherMember && (
            <CallButton
              targetUserIds={[otherMember.id]}
              type="DM"
              channelId={channelId}
              peerUsername={otherMember.username}
            />
          )}
          <button className="rounded-lg p-2 text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800">
            <FiMoreHorizontal />
          </button>
        </div>
      </header>

      {/* Error banner */}
      {error && (
        <div className="mx-4 mt-3 flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400">
          <FiAlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      {/* Messages */}
      <div
        ref={messagesContainerRef}
        onScroll={handleScroll}
        className="relative z-10 flex-1 overflow-y-auto px-4 py-6 sm:px-10 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        <div>
          {/* Loading skeleton */}
          {loading && messages.length === 0 && (
            <div className="space-y-5 py-6">
              {[1, 2, 3, 4, 5].map((i) => {
                const isMine = i % 2 === 0;
                return (
                  <div key={i} className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
                    <div className={`flex items-end gap-2 ${isMine ? "flex-row-reverse" : ""}`}>
                      {!isMine && (
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-zinc-200 dark:bg-zinc-700">
                          <span className="h-3 w-3 animate-pulse rounded bg-zinc-300 dark:bg-zinc-600" />
                        </div>
                      )}
                      <div>
                        <div className={`h-3 w-12 animate-pulse rounded bg-zinc-200 dark:bg-zinc-700 ${isMine ? "ml-auto mb-1" : "mb-1"}`} />
                        <div
                          className={`h-10 animate-pulse rounded-2xl ${isMine ? "rounded-br-sm bg-indigo-200 dark:bg-indigo-800" : "rounded-bl-sm bg-zinc-200 dark:bg-zinc-700"}`}
                          style={{ width: `${70 + i * 25}px` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Empty state */}
          {!loading && messages.length === 0 && (
            <div className="py-12 text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-indigo-100 dark:bg-indigo-900/30">
                <FiLock className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
              </div>
              <p className="text-sm font-semibold">No messages yet</p>
              <p className="mt-1 text-xs text-zinc-400">Send the first encrypted message</p>
            </div>
          )}

          {/* Load more indicator */}
          {loading && messages.length > 0 && (
            <div className="flex justify-center py-4">
              <FiLoader className="h-4 w-4 animate-spin text-zinc-400 " />
            </div>
          )}

          {/* Message list */}
          {messages.map((msg) => {
            const isMine = msg.senderId === me?.id;
            const reactionGroups = groupReactions(reactionsByMessage[msg.id]);
            return (
              <div
                key={msg.id}
                className={`mb-5   flex ${isMine ? "justify-end" : "justify-start"}`}
              >
                <div className="group relative max-w-[80%] lg:max-w-120">
                  <div
                    className={`rounded-2xl px-4 py-3 text-sm leading-6 ${
                      isMine
                        ? "rounded-br-sm bg-indigo-600 text-white"
                        : "rounded-bl-sm bg-white text-zinc-700 shadow-sm ring-1 ring-zinc-200 dark:bg-zinc-900 dark:text-zinc-200 dark:ring-zinc-800"
                    }`}
                  >
                    {msg.isDeleted ? (
                      <span className="italic text-zinc-400">Message deleted</span>
                    ) : msg.plaintext ? (
                      msg.plaintext
                    ) : (
                      <span className="flex items-center gap-2 text-zinc-400">
                        <FiLock className="h-3 w-3" />
                        <span className="h-3 w-28 animate-pulse rounded bg-zinc-200 dark:bg-zinc-700" />
                      </span>
                    )}
                  </div>

                  {/* Hover quick-react — placed on the inner side of the
                      bubble so it can never overflow the viewport */}
                  {!msg.isDeleted && (
                    <button
                      type="button"
                      aria-label="Add reaction"
                      onClick={() =>
                        setReactingTo(reactingTo === msg.id ? null : msg.id)
                      }
                      className={`absolute top-1/2 z-30 grid h-7 w-7 -translate-y-1/2 place-items-center rounded-full border border-zinc-200 bg-white text-zinc-400 opacity-0 shadow-sm transition-all duration-150 hover:scale-110 hover:text-indigo-600 focus-visible:scale-110 focus-visible:opacity-100 group-hover:opacity-100 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-500 dark:hover:text-indigo-400 ${
                        isMine ? "right-full mr-1" : "left-full ml-1"
                      }`}
                    >
                      <FiSmile className="h-3.5 w-3.5" />
                    </button>
                  )}

                  {/* Emoji picker popover */}
                  {reactingTo === msg.id && (
                    <>
                      <div
                        className="fixed inset-0 z-20"
                        onClick={() => setReactingTo(null)}
                      />
                      <motion.div
                        initial={{ opacity: 0, y: 6, scale: 0.92 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        transition={{ type: "spring", damping: 24, stiffness: 420 }}
                        className={`absolute  bottom-full z-40 mb-2 grid grid-cols-9 gap-x-7.5 gap-y-1.5 rounded-2xl border border-zinc-200 bg-white p-2 shadow-xl sm:grid-cols-9 dark:border-zinc-700 dark:bg-zinc-900 ${
                          isMine ? "right-0" : "left-0"
                        }`}
                      >
                        {QUICK_EMOJIS.map((emoji) => (
                          <button
                            key={emoji}
                            type="button"
                            aria-label={`React with ${emoji}`}
                            onClick={() => toggleReaction(msg.id, emoji)}
                            className="grid h-9 w-9 place-items-center rounded-xl text-lg leading-none transition-transform hover:scale-110 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                          >
                            {emoji}
                          </button>
                        ))}
                      </motion.div>
                    </>
                  )}

                  {/* Reaction chips */}
                  {reactionGroups.length > 0 && (
                    <div
                      className={`relative z-30 mt-1.5 flex flex-wrap gap-1 ${
                        isMine ? "justify-end" : ""
                      }`}
                    >
                      {reactionGroups.map((g) => (
                        <button
                          key={g.emoji}
                          type="button"
                          title={g.users.join(", ")}
                          onClick={() => toggleReaction(msg.id, g.emoji)}
                          className={`inline-flex items-center gap-1 rounded-full border px-1.5 py-0.5 text-[11px] font-medium transition-all hover:scale-105 ${
                            g.mine
                              ? "border-indigo-300 bg-indigo-50 text-indigo-700 dark:border-indigo-500/40 dark:bg-indigo-500/15 dark:text-indigo-300"
                              : "border-zinc-200 bg-white text-zinc-600 hover:border-zinc-300 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:border-zinc-600"
                          }`}
                        >
                          <span className="text-sm leading-none">{g.emoji}</span>
                          {g.count > 1 && <span>{g.count}</span>}
                        </button>
                      ))}
                    </div>
                  )}

                  <p
                    className={`mt-1 flex items-center gap-1 px-2 text-[10px] text-zinc-400 ${
                      isMine ? "justify-end" : ""
                    }`}
                  >
                    {formatTime(msg.createdAt)}
                    {isMine && <FiCheck className="h-3 w-3" />}
                  </p>
                </div>
              </div>
            );
          })}

          {/* Typing indicator */}
          {typingNames.length > 0 && (
            <div className="mb-3 flex items-center gap-2 text-xs text-zinc-400">
              <span className="flex gap-0.5">
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-indigo-400 [animation-delay:0ms]" />
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-indigo-400 [animation-delay:150ms]" />
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-indigo-400 [animation-delay:300ms]" />
              </span>
              typing...
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input */}
      <div className="relative z-10 border-t border-zinc-200 bg-white px-4 py-3 dark:border-zinc-800 dark:bg-zinc-900">
        <div className="">
          <div className="flex items-center gap-2 rounded-2xl border border-zinc-200 bg-zinc-50 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-800">
            <button className="p-2 text-zinc-400 hover:text-zinc-600">
              <FiPaperclip />
            </button>
            <input
              value={draft}
              onChange={(e) => {
                setDraft(e.target.value);
                handleTyping();
              }}
              onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
              placeholder="Write a message..."
              className="min-w-0 flex-1 bg-transparent text-sm outline-none"
              disabled={sending}
            />
            <button className="p-2 text-zinc-400 hover:text-zinc-600">
              <FiSmile />
            </button>
            <button
              onClick={handleSend}
              disabled={!draft.trim() || sending}
              className="rounded-xl bg-indigo-600 p-2.5 text-white hover:bg-indigo-700 disabled:opacity-40"
            >
              {sending ? (
                <FiLoader className="h-4 w-4 animate-spin" />
              ) : (
                <FiSend className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
