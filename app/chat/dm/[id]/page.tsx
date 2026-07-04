"use client";

import { useEffect, useRef, useState, useCallback } from "react";
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
  FiLoader,
  FiAlertCircle,
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

export default function DMChatPage() {
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
          // Scroll to bottom after IDB load
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

      // If no IDB cache, show loading spinner
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
            // Loading older messages (scroll up) — prepend
            setMessages((prev) => {
              const existingIds = new Set(prev.map((m) => m.id));
              const newMsgs = serverMessages.filter((m) => !existingIds.has(m.id));
              return [...newMsgs, ...prev];
            });
          } else {
            // Initial/background sync — merge with existing
            setMessages((prev) => {
              const map = new Map(prev.map((m) => [m.id, m]));
              for (const msg of serverMessages) {
                map.set(msg.id, msg); // server wins on conflict
              }
              const merged = Array.from(map.values()).sort(
                (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
              );
              return merged;
            });
          }

          // Save all server messages to IDB
          await saveMessages(serverMessages);

          setHasMore(res.hasMore ?? false);
          setCursor(res.nextCursor ?? null);
          setLoading(false);
          setSyncing(false);

          // Scroll to bottom on initial sync
          if (!loadCursor) {
            setTimeout(() => {
              messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
            }, 50);
          }
        },
      );
    },
    [socket, channelId, idbReady],
  );

  // Trigger server sync after IDB load (or immediately if IDB empty)
  useEffect(() => {
    if (!channelId || !isAuthenticated) return;
    // Small delay to let IDB render first
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

        // Save to IDB (fire-and-forget)
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
  const displayName = channel?.name || "Unknown";
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

  // ─── Render ──────────────────────────────────────────────────────────
  return (
    <div className="flex min-w-0 flex-1 flex-col bg-[#fbfcfd] dark:bg-zinc-950">
      {/* Header */}
      <header className="flex items-center justify-between border-b border-zinc-200 bg-white px-4 py-4 dark:border-zinc-800 dark:bg-zinc-900 sm:px-7">
        <div className="flex items-center gap-3">
          <Link
            href="/chat"
            className="rounded-lg p-2 text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
          >
            <FiArrowLeft />
          </Link>
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-100 text-sm font-bold text-amber-700">
            {initials}
          </div>
          <div>
            <h2 className="text-sm font-bold">{displayName}</h2>
            <p className="text-xs text-zinc-500">
              {loading ? "Loading..." : "Online"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {syncing && (
            <FiLoader className="h-4 w-4 animate-spin text-zinc-400" />
          )}
          <span className="hidden items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1.5 text-[11px] font-semibold text-emerald-700 sm:flex dark:bg-emerald-950/40 dark:text-emerald-400">
            <FiShield /> end-to-end encrypted
          </span>
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
        className="flex-1 overflow-y-auto px-4 py-6 sm:px-10"
      >
        <div className="mx-auto max-w-3xl">
          {/* Loading only shown when IDB is empty */}
          {loading && messages.length === 0 && (
            <div className="flex items-center justify-center py-12">
              <FiLoader className="h-5 w-5 animate-spin text-indigo-500" />
              <span className="ml-2 text-sm text-zinc-400">Loading messages...</span>
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
              typing...
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input */}
      <div className="border-t border-zinc-200 bg-white px-4 py-3 dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mx-auto max-w-3xl">
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
