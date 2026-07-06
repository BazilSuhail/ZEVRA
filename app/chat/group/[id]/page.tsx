"use client";

import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  FiArrowLeft,
  FiCheck,
  FiLock,
  FiMoreHorizontal,
  FiPaperclip,
  FiSend,
  FiShield,
  FiSmile,
  FiUsers,
  FiLoader,
  FiAlertCircle,
  FiSettings,
} from "react-icons/fi";
import { useAuthStore } from "@/context/stores";
import { useChatStore } from "@/context/stores/chat-store";
import { getSocket } from "@/lib/socket";
import { getChatKey, decrypt } from "@/lib/crypto";
import { SOCKET_EVENTS, MessageStatus } from "@/constants";
import { api } from "@/utils/api";
import {
  getChannelMessages,
  saveMessages,
  saveMessage,
  type StoredMessage,
} from "@/lib/db";

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

// ─── Component ────────────────────────────────────────────────────────────

export default function GroupChatPage() {
  const { id: channelId } = useParams<{ id: string }>();
  const me = useAuthStore((s) => s.user);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const typingUsers = useChatStore((s) => s.typingUsers);

  const [channel, setChannel] = useState<ChannelInfo | null>(null);
  const [messages, setMessages] = useState<StoredMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [cursor, setCursor] = useState<string | null>(null);
  const [idbReady, setIdbReady] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const initialLoadDone = useRef(false);

  const socket = getSocket();
  const channelTyping = typingUsers[channelId] || new Set();
  const typingNames = Array.from(channelTyping).filter((uid) => uid !== me?.id);

  // ─── Track active room for unread counting ───────────────────────────
  const setActiveRoom = useChatStore((s) => s.setActiveRoom);
  const resetUnread = useChatStore((s) => s.resetUnread);
  useEffect(() => {
    if (channelId) {
      setActiveRoom(channelId);
      resetUnread(channelId);
    }
    return () => setActiveRoom(null);
  }, [channelId, setActiveRoom, resetUnread]);

  const memberMap = useMemo(() => {
    const map = new Map<string, { username: string; color: string }>();
    const colors = [
      "bg-rose-500", "bg-amber-500", "bg-emerald-500", "bg-cyan-500",
      "bg-violet-500", "bg-pink-500", "bg-teal-500", "bg-orange-500",
    ];
    channel?.members?.forEach((m, i) => {
      map.set(m.id, { username: m.username, color: colors[i % colors.length] });
    });
    return map;
  }, [channel?.members]);

  // ─── Fetch channel info ──────────────────────────────────────────────
  useEffect(() => {
    if (!channelId || !isAuthenticated) return;
    api
      .get<ChannelInfo>(`/channels/${channelId}`)
      .then((data) => setChannel(data))
      .catch(() => setError("Failed to load channel"));
  }, [channelId, isAuthenticated]);

  // ─── Step 1: Load from IDB instantly ─────────────────────────────────
  useEffect(() => {
    if (!channelId || initialLoadDone.current) return;
    initialLoadDone.current = true;

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
    (loadCursor?: string | null) => {
      if (!socket || !channelId) return;

      if (!idbReady && !loadCursor) {
        setLoading(true);
      }
      setSyncing(true);
      setError(null);

      socket.emit(
        SOCKET_EVENTS.GET_MESSAGES,
        { channelId, limit: 50, cursor: loadCursor || undefined },
        async (res: any) => {
          if (!res.success) {
            setError(res.error || "Failed to load messages");
            setLoading(false);
            setSyncing(false);
            return;
          }

          const chatKey = getChatKey(channelId);
          const serverMessages: StoredMessage[] = [];

          for (const m of res.messages || []) {
            let plaintext = "";
            if (m.contentIv && m.contentTag && chatKey) {
              try {
                plaintext = await decrypt(m.encryptedContent, m.contentIv, m.contentTag, chatKey);
              } catch {
                plaintext = "[Encrypted message]";
              }
            } else {
              plaintext = m.encryptedContent || "";
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
    if (!channelId || !isAuthenticated) return;
    const timer = setTimeout(() => fetchAndMerge(), idbReady ? 300 : 0);
    return () => clearTimeout(timer);
  }, [channelId, isAuthenticated, fetchAndMerge, idbReady]);

  // ─── Join channel ────────────────────────────────────────────────────
  useEffect(() => {
    if (!socket || !channelId || !isAuthenticated) return;
    socket.emit(SOCKET_EVENTS.JOIN_CHANNEL, { channelId }, () => {});
  }, [socket, channelId, isAuthenticated]);

  // ─── Listen for new messages ─────────────────────────────────────────
  useEffect(() => {
    if (!socket) return;

    const handleMessage = async (msg: any) => {
      if (msg.channelId !== channelId) return;
      const msgId = msg.id || msg.messageId || `temp-${Date.now()}`;

      setMessages((prev) => {
        if (prev.some((m) => m.id === msgId)) return prev;

        const chatKey = getChatKey(channelId);
        let plaintext = msg.encryptedContent || "";

        if (chatKey && msg.contentIv && msg.contentTag) {
          decrypt(msg.encryptedContent, msg.contentIv, msg.contentTag, chatKey)
            .then((pt) => {
              setMessages((p) =>
                p.map((m) => (m.id === msgId ? { ...m, plaintext: pt } : m)),
              );
            })
            .catch(() => {});
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
          plaintext: plaintext || "",
          status: MessageStatus.DELIVERED,
          createdAt: msg.createdAt || new Date().toISOString(),
          updatedAt: msg.updatedAt || new Date().toISOString(),
        };

        saveMessage(stored).catch(() => {});

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

    const text = draft.trim();
    const tempId = `temp-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    setDraft("");
    setSending(true);

    const optimistic: StoredMessage = {
      id: tempId,
      channelId,
      senderId: me?.id || "",
      ciphertext: text,
      iv: "",
      tag: "",
      signature: "",
      sequenceNumber: Date.now(),
      senderKeyEpoch: 0,
      messageType: "TEXT",
      metadata: null,
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
        encryptedContent: text,
        contentIv: "",
        contentTag: "",
        signature: "",
        sequenceNumber: Date.now(),
        senderKeyEpoch: 0,
        messageType: "TEXT",
      },
      (res: any) => {
        setSending(false);
        if (!res.success) {
          setError(res.message || "Failed to send");
          setDraft(text);
          setMessages((prev) => prev.filter((m) => m.id !== tempId));
        } else if (res.message?.id) {
          setMessages((prev) =>
            prev.map((m) =>
              m.id === tempId
                ? {
                    ...m,
                    id: res.message.id,
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
  const displayName = channel?.name || "Unknown Group";

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
    <div className="relative flex min-w-0 flex-1 flex-col bg-[#fbfcfd] dark:bg-zinc-950">
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
            href={`/chat/group/${channelId}/info`}
            className="flex items-center gap-3"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400">
              <FiUsers className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold">{displayName}</h2>
              <p className="text-xs text-zinc-500">
                {loading
                  ? "Loading..."
                  : channel?.memberCount
                    ? `${channel.memberCount} members`
                    : "Group"}
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
          <button className="rounded-lg p-2 text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800">
            <FiSettings />
          </button>
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
          {/* Group welcome */}
          {!loading && messages.length === 0 && (
            <div className="py-12 text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-indigo-100 dark:bg-indigo-900/30">
                <FiUsers className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
              </div>
              <p className="text-sm font-semibold">Welcome to {displayName}</p>
              <p className="mt-1 text-xs text-zinc-400">
                This is the start of your encrypted group conversation
              </p>
            </div>
          )}

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
                        <div className={`mb-1 flex items-center gap-1.5 ${isMine ? "justify-end" : ""}`}>
                          <div className="h-2 w-14 animate-pulse rounded bg-zinc-200 dark:bg-zinc-700" />
                          <div className="h-2 w-8 animate-pulse rounded bg-zinc-200/50 dark:bg-zinc-700/50" />
                        </div>
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

          {/* Load more indicator */}
          {loading && messages.length > 0 && (
            <div className="flex justify-center py-4">
              <FiLoader className="h-4 w-4 animate-spin text-zinc-400" />
            </div>
          )}

          {/* Message list */}
          {messages.map((msg) => {
            const isMine = msg.senderId === me?.id;
            return (
              <div
                key={msg.id}
                className={`mb-5 flex ${isMine ? "justify-end" : "justify-start"}`}
              >
                <div className="max-w-[80%]">
                  {/* Sender name for group messages */}
                  {!isMine && (() => {
                    const member = memberMap.get(msg.senderId);
                    const name = member?.username || msg.senderId.slice(0, 8);
                    const colorClass = member?.color || "bg-zinc-400";
                    return (
                      <div className="mb-1 flex items-center gap-2 px-1">
                        <div className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white ${colorClass}`}>
                          {name.charAt(0).toUpperCase()}
                        </div>
                        <span className="text-[11px] font-semibold text-zinc-500">{name}</span>
                      </div>
                    );
                  })()}
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
              {typingNames.length === 1 ? "someone is typing..." : "several people typing..."}
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input */}
      <div className="relative z-10 border-t border-zinc-200 bg-white px-4 py-3 dark:border-zinc-800 dark:bg-zinc-900">
        <div>
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
              placeholder="Write a message to the group..."
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
