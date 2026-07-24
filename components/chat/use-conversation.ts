"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { useAuthStore } from "@/context/stores/auth-store";
import { useChatStore } from "@/context/stores/chat-store";
import { useSocketStore } from "@/context/stores/socket-store";
import { getSocket } from "@/lib/socket";
import { encryptForChannel, onIdentityChange } from "@/lib/e2ee";
import { APP, MessageStatus, SOCKET_EVENTS } from "@/constants";
import { api, getErrorMessage } from "@/utils/api";
import {
  getChannelMessages,
  getMessagesByIds,
  saveMessage,
  saveMessages,
  type MessageReaction,
  type StoredMessage,
} from "@/lib/db";
import {
  decodeServerMessage,
  rawMessageId,
  retryDecrypt,
  type RawServerMessage,
} from "@/lib/message-decode";
import {
  buildFileContent,
  contentPreviewText,
  isImageMime,
  type AttachmentDescriptor,
} from "@/lib/message-content";

// ─── Types ────────────────────────────────────────────────────────────────

export interface ChannelMember {
  id: string;
  username: string;
  status: string;
  role: string;
  joinedAt: string;
}

export interface ChannelInfo {
  id: string;
  name: string | null;
  type: string;
  isArchived: boolean;
  memberCount?: number;
  members?: ChannelMember[];
  createdAt: string;
}

interface OutboxEntry {
  wire: Record<string, unknown>;
  preview: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────

export const isTempId = (id: string) => id.startsWith("temp-");

function sortMessages(list: StoredMessage[]): StoredMessage[] {
  return [...list].sort((a, b) => {
    const t = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    return t !== 0 ? t : a.sequenceNumber - b.sequenceNumber;
  });
}

/** Socket acks fail as `{ success:false, error:CODE, message }` — prefer message. */
function ackError(res: unknown, fallback: string): string {
  const r = res as { message?: unknown; error?: unknown } | null | undefined;
  if (r && typeof r.message === "string" && r.message) return r.message;
  if (r && typeof r.error === "string" && r.error) return r.error;
  return fallback;
}

function emitWithAck<T>(event: string, data: unknown, timeoutMs: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const sock = getSocket();
    if (!sock?.connected) {
      reject(new Error("Not connected to the server"));
      return;
    }
    (sock as any)
      .timeout(timeoutMs)
      .emit(event, data, (err: Error | null, res: T) => {
        if (err) reject(new Error("The server did not respond in time"));
        else resolve(res);
      });
  });
}

const REACTION_DEBOUNCE_MS = 250;

// ─── Hook ─────────────────────────────────────────────────────────────────

/**
 * All state + socket wiring for one conversation (DM or group). Mount it
 * under a component keyed by channelId so every state resets when the
 * route param changes.
 */
export function useConversation(channelId: string) {
  const me = useAuthStore((s) => s.user);
  const meId = me?.id;
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const isConnected = useSocketStore((s) => s.isConnected);
  const generation = useSocketStore((s) => s.generation);

  const [channel, setChannel] = useState<ChannelInfo | null>(null);
  const [messages, setMessages] = useState<StoredMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [cursor, setCursor] = useState<number | null>(null);
  const [idbLoaded, setIdbLoaded] = useState(false);
  const [removed, setRemoved] = useState(false);

  const messagesRef = useRef<StoredMessage[]>([]);
  const aliveRef = useRef(true);
  const firstPageLoadedRef = useRef(false);
  const loadingOlderRef = useRef(false);
  const lastMarkedRef = useRef<string | null>(null);
  const outboxRef = useRef(new Map<string, OutboxEntry>());
  const containerRef = useRef<HTMLDivElement>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const scrollRestoreRef = useRef<{ height: number; top: number } | null>(null);
  const typingActiveRef = useRef(false);
  const typingTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    aliveRef.current = true;
    return () => {
      aliveRef.current = false;
    };
  }, []);

  /** Single write path: keeps the ref in sync so async code reads fresh state. */
  const commit = useCallback((fn: (prev: StoredMessage[]) => StoredMessage[]) => {
    const next = fn(messagesRef.current);
    if (next === messagesRef.current) return;
    messagesRef.current = next;
    setMessages(next);
  }, []);

  // ─── Scrolling ───────────────────────────────────────────────────────

  const scrollToBottom = useCallback((behavior: ScrollBehavior = "smooth") => {
    setTimeout(() => endRef.current?.scrollIntoView({ behavior }), 50);
  }, []);

  const isNearBottom = () => {
    const el = containerRef.current;
    if (!el) return true;
    return el.scrollHeight - el.scrollTop - el.clientHeight < 160;
  };

  // Keep the viewport anchored when older messages are prepended
  useLayoutEffect(() => {
    const restore = scrollRestoreRef.current;
    const el = containerRef.current;
    if (!restore || !el) return;
    scrollRestoreRef.current = null;
    el.scrollTop = el.scrollHeight - restore.height + restore.top;
  }, [messages]);

  // ─── Active room / unread ────────────────────────────────────────────

  useEffect(() => {
    const store = useChatStore.getState();
    store.setActiveRoom(channelId);
    store.resetUnread(channelId);
    return () => useChatStore.getState().setActiveRoom(null);
  }, [channelId]);

  // ─── Channel info ────────────────────────────────────────────────────

  const reloadChannel = useCallback(() => {
    api
      .get<ChannelInfo>(`/channels/${channelId}`)
      .then((data) => {
        if (aliveRef.current) setChannel(data);
      })
      .catch((err) => {
        if (aliveRef.current) setError(getErrorMessage(err, "Failed to load channel"));
      });
  }, [channelId]);

  useEffect(() => {
    if (isAuthenticated) reloadChannel();
  }, [isAuthenticated, reloadChannel]);

  // ─── Decrypt retries ─────────────────────────────────────────────────

  const retryUndecrypted = useCallback(
    async (rows: StoredMessage[]) => {
      const targets = rows.filter(
        (m) => !m.isDeleted && m.decryptState && m.decryptState !== "ok",
      );
      if (targets.length === 0) return;
      const updated = await Promise.all(targets.map(retryDecrypt));
      const changed = updated.filter((u, i) => u !== targets[i]);
      if (changed.length === 0 || !aliveRef.current) return;
      const byId = new Map(changed.map((m) => [m.id, m]));
      commit((prev) => prev.map((m) => byId.get(m.id) ?? m));
      saveMessages(changed).catch(() => {});
    },
    [commit],
  );

  // Keys unlocked (password prompt) → retry everything that failed/locked
  useEffect(
    () =>
      onIdentityChange((id) => {
        if (id) void retryUndecrypted(messagesRef.current);
      }),
    [retryUndecrypted],
  );

  // ─── Step 1: cached messages from IndexedDB ──────────────────────────

  useEffect(() => {
    let alive = true;
    (async () => {
      let cached: StoredMessage[] = [];
      try {
        cached = await getChannelMessages(channelId);
      } catch {
        cached = [];
      }
      if (!alive) return;
      if (cached.length > 0) {
        commit((prev) => {
          const map = new Map(cached.map((m) => [m.id, m]));
          for (const m of prev) map.set(m.id, m);
          return sortMessages([...map.values()]);
        });
        setLoading(false);
        scrollToBottom("instant");
      }
      setIdbLoaded(true);
      // Older cached pages may hold rows that failed before keys were unlocked
      void retryUndecrypted(cached);
    })();
    return () => {
      alive = false;
    };
  }, [channelId, commit, scrollToBottom, retryUndecrypted]);

  // ─── Mark read ───────────────────────────────────────────────────────

  const markRead = useCallback(() => {
    const list = messagesRef.current;
    let last: StoredMessage | undefined;
    for (let i = list.length - 1; i >= 0; i--) {
      if (!isTempId(list[i].id)) {
        last = list[i];
        break;
      }
    }
    if (!last || last.id === lastMarkedRef.current) return;
    const sock = getSocket();
    if (!sock?.connected) return;
    lastMarkedRef.current = last.id;
    sock.emit(SOCKET_EVENTS.MARK_READ, { channelId, messageId: last.id }, () => {});
    useChatStore.getState().resetUnread(channelId);
  }, [channelId]);

  useEffect(() => {
    markRead();
  }, [messages, isConnected, markRead]);

  // ─── Step 2: server history (latest page or an older page) ───────────

  const fetchPage = useCallback(
    async (pageCursor: number | null) => {
      const older = pageCursor != null;
      if (older) {
        if (loadingOlderRef.current) return;
        loadingOlderRef.current = true;
        setLoadingOlder(true);
      } else {
        setSyncing(true);
      }

      try {
        const res = await emitWithAck<{
          success: boolean;
          messages?: RawServerMessage[];
          nextCursor?: number | null;
          hasMore?: boolean;
          error?: string;
          message?: string;
        }>(
          SOCKET_EVENTS.GET_MESSAGES,
          {
            channelId,
            limit: APP.MESSAGE_PAGE_SIZE,
            cursor: pageCursor ?? undefined,
            mode: older ? "before" : "latest",
          },
          15000,
        );
        if (!aliveRef.current) return;
        if (!res?.success) {
          setError(ackError(res, "Failed to load messages"));
          return;
        }

        const raws = (res.messages || []).map((r) => ({
          ...r,
          channelId: r.channelId || channelId,
        }));

        // Known rows (state, then IndexedDB) protect good plaintext
        const known = new Map(messagesRef.current.map((m) => [m.id, m]));
        const missing = raws
          .map(rawMessageId)
          .filter((id): id is string => !!id && !known.has(id));
        if (missing.length > 0) {
          try {
            const fromDb = await getMessagesByIds(missing);
            fromDb.forEach((v, k) => known.set(k, v));
          } catch {
            // IndexedDB unavailable — decode from scratch
          }
        }

        const decoded = (
          await Promise.all(
            raws.map((r) => decodeServerMessage(r, known.get(rawMessageId(r) ?? ""))),
          )
        ).filter((m): m is StoredMessage => !!m);

        // Reactions ride along with history; never clobber in-flight intents
        const reactionsMap: Record<string, MessageReaction[]> = {};
        for (const r of raws) {
          const id = rawMessageId(r);
          if (id) reactionsMap[id] = Array.isArray(r.reactions) ? r.reactions : [];
        }
        useChatStore.getState().mergeReactionsFromHistory(reactionsMap);

        if (!aliveRef.current) return;

        const stickToBottom = !older && (!firstPageLoadedRef.current || isNearBottom());
        if (older) {
          const el = containerRef.current;
          if (el) scrollRestoreRef.current = { height: el.scrollHeight, top: el.scrollTop };
        }

        commit((prev) => {
          const map = new Map(prev.map((m) => [m.id, m]));
          for (const d of decoded) map.set(d.id, d);
          return sortMessages([...map.values()]);
        });
        saveMessages(decoded).catch(() => {});

        if (older || !firstPageLoadedRef.current) {
          setHasMore(res.hasMore ?? false);
          setCursor(res.nextCursor ?? null);
        }
        firstPageLoadedRef.current = true;
        setError(null);
        if (stickToBottom) scrollToBottom();
      } catch (err) {
        if (aliveRef.current) setError(getErrorMessage(err, "Failed to load messages"));
      } finally {
        if (aliveRef.current) {
          setLoading(false);
          if (older) setLoadingOlder(false);
          else setSyncing(false);
        }
        if (older) loadingOlderRef.current = false;
      }
    },
    [channelId, commit, scrollToBottom],
  );

  // One fetch per (re)connection, only after the cache has been read
  useEffect(() => {
    if (!idbLoaded || !isConnected || !isAuthenticated) return;
    void fetchPage(null);
  }, [idbLoaded, isConnected, isAuthenticated, fetchPage]);

  const handleScroll = useCallback(() => {
    const el = containerRef.current;
    if (!el || !hasMore || cursor == null || loading || loadingOlderRef.current) return;
    if (el.scrollTop < 100) void fetchPage(cursor);
  }, [hasMore, cursor, loading, fetchPage]);

  // ─── Join room (and re-join after reconnect / new socket) ────────────

  useEffect(() => {
    if (!isConnected || !isAuthenticated) return;
    getSocket()?.emit(SOCKET_EVENTS.JOIN_CHANNEL, { channelId }, () => {});
  }, [channelId, isConnected, isAuthenticated, generation]);

  // ─── Live events ─────────────────────────────────────────────────────

  useEffect(() => {
    const sock = getSocket();
    if (!sock) return;

    const onNew = async (payload: unknown) => {
      const raw = payload as RawServerMessage;
      if (raw?.channelId !== channelId) return;
      const id = rawMessageId(raw);
      if (!id || messagesRef.current.some((m) => m.id === id)) return;
      const wasNearBottom = isNearBottom();
      const decoded = await decodeServerMessage(raw);
      if (!decoded || !aliveRef.current) return;
      commit((prev) =>
        prev.some((m) => m.id === decoded.id) ? prev : sortMessages([...prev, decoded]),
      );
      saveMessage(decoded).catch(() => {});
      if (wasNearBottom || decoded.senderId === meId) scrollToBottom();
    };

    const onDeleted = (data: { messageId: string; channelId: string }) => {
      if (data?.channelId !== channelId) return;
      commit((prev) =>
        prev.some((m) => m.id === data.messageId)
          ? prev.map((m) =>
              m.id === data.messageId
                ? { ...m, isDeleted: true, plaintext: "", ciphertext: "", decryptState: "ok" as const }
                : m,
            )
          : prev,
      );
    };

    const onMemberAdded = (data: { channelId: string; userId: string }) => {
      if (data?.channelId === channelId) reloadChannel();
    };

    const onMemberRemoved = (data: { channelId: string; userId: string }) => {
      if (data?.channelId !== channelId) return;
      if (data.userId === meId) {
        setRemoved(true);
        setError("You are no longer a member of this conversation");
        return;
      }
      reloadChannel();
    };

    sock.on(SOCKET_EVENTS.MESSAGE_NEW, onNew);
    sock.on(SOCKET_EVENTS.MESSAGE_DELETED, onDeleted);
    sock.on(SOCKET_EVENTS.CHANNEL_MEMBER_ADDED, onMemberAdded);
    sock.on(SOCKET_EVENTS.CHANNEL_MEMBER_REMOVED, onMemberRemoved);
    return () => {
      sock.off(SOCKET_EVENTS.MESSAGE_NEW, onNew);
      sock.off(SOCKET_EVENTS.MESSAGE_DELETED, onDeleted);
      sock.off(SOCKET_EVENTS.CHANNEL_MEMBER_ADDED, onMemberAdded);
      sock.off(SOCKET_EVENTS.CHANNEL_MEMBER_REMOVED, onMemberRemoved);
    };
  }, [channelId, generation, meId, commit, reloadChannel, scrollToBottom]);

  // ─── Typing (emit) ───────────────────────────────────────────────────

  const stopTyping = useCallback(() => {
    if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    if (!typingActiveRef.current) return;
    typingActiveRef.current = false;
    getSocket()?.emit(SOCKET_EVENTS.TYPING_STOP, { channelId });
  }, [channelId]);

  const handleTyping = useCallback(() => {
    const sock = getSocket();
    if (!sock?.connected) return;
    if (!typingActiveRef.current) {
      typingActiveRef.current = true;
      sock.emit(SOCKET_EVENTS.TYPING_START, { channelId });
    }
    if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    typingTimerRef.current = setTimeout(stopTyping, 6000);
  }, [channelId, stopTyping]);

  useEffect(() => stopTyping, [stopTyping]);

  // ─── Send (ack timeout → failed state → retry) ───────────────────────

  const markFailed = useCallback(
    (tempId: string, reason: string) => {
      if (!aliveRef.current) return;
      commit((prev) =>
        prev.map((m) => (m.id === tempId ? { ...m, status: MessageStatus.FAILED } : m)),
      );
      setError(reason);
    },
    [commit],
  );

  const confirmSent = useCallback(
    (tempId: string, server: { id: string; sequenceNumber?: number; createdAt?: string }) => {
      const entry = outboxRef.current.get(tempId);
      outboxRef.current.delete(tempId);
      const current = messagesRef.current.find((m) => m.id === tempId);
      if (!current) return;
      const confirmed: StoredMessage = {
        ...current,
        id: server.id,
        sequenceNumber: server.sequenceNumber ?? current.sequenceNumber,
        status: MessageStatus.DELIVERED,
        createdAt: server.createdAt || current.createdAt,
        updatedAt: new Date().toISOString(),
      };
      commit((prev) =>
        sortMessages(
          prev
            .filter((m) => m.id !== server.id)
            .map((m) => (m.id === tempId ? confirmed : m)),
        ),
      );
      saveMessage(confirmed).catch(() => {});
      if (entry && meId) {
        useChatStore.getState().setSentPreview(channelId, {
          senderId: meId,
          text: entry.preview,
          at: confirmed.createdAt,
        });
      }
    },
    [channelId, commit, meId],
  );

  const dispatch = useCallback(
    (tempId: string) => {
      const entry = outboxRef.current.get(tempId);
      if (!entry) return;
      const sock = getSocket();
      if (!sock?.connected) {
        markFailed(tempId, "You're offline — message not sent");
        return;
      }
      let settled = false;
      const timer = setTimeout(() => {
        if (settled) return;
        settled = true;
        markFailed(tempId, "Message not confirmed by the server — tap retry");
      }, APP.SEND_ACK_TIMEOUT_MS);

      (sock as any).emit(SOCKET_EVENTS.SEND_MESSAGE, entry.wire, (res: unknown) => {
        clearTimeout(timer);
        const wasSettled = settled;
        settled = true;
        const r = res as { success?: boolean; message?: unknown } | null;
        const msg = r?.message as { id?: string; sequenceNumber?: number; createdAt?: string } | undefined;
        if (r?.success && msg && typeof msg === "object" && msg.id) {
          // A late ack still wins over the timeout's failed state
          confirmSent(tempId, { id: msg.id, sequenceNumber: msg.sequenceNumber, createdAt: msg.createdAt });
          return;
        }
        if (!wasSettled) markFailed(tempId, ackError(res, "Failed to send message"));
      });
    },
    [confirmSent, markFailed],
  );

  /** Encrypt + send. Returns false when nothing was queued (keep the draft). */
  const send = useCallback(
    async (caption: string, attachment: AttachmentDescriptor | null): Promise<boolean> => {
      if (removed) return false;
      const memberIds = channel?.members?.map((m) => m.id);
      if (!memberIds || memberIds.length === 0) {
        setError("Channel members not loaded yet — try again in a moment");
        return false;
      }

      // Attachment descriptor travels INSIDE the encrypted payload
      const text = attachment ? buildFileContent(caption, attachment) : caption;
      const messageType = attachment ? (isImageMime(attachment.mime) ? "IMAGE" : "FILE") : "TEXT";

      let payload: Awaited<ReturnType<typeof encryptForChannel>>;
      try {
        payload = await encryptForChannel({ channelId, memberIds, text });
      } catch (err) {
        setError(getErrorMessage(err, "Failed to encrypt message"));
        return false;
      }
      if (!aliveRef.current) return false;

      const tempId = `temp-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      const now = new Date().toISOString();
      const optimistic: StoredMessage = {
        id: tempId,
        channelId,
        senderId: meId || "",
        senderUsername: me?.username ?? null,
        ciphertext: payload.encryptedContent,
        iv: payload.contentIv,
        tag: payload.contentTag,
        signature: payload.signature,
        sequenceNumber: Number.MAX_SAFE_INTEGER,
        senderKeyEpoch: 0,
        messageType,
        metadata: payload.metadata,
        isDeleted: false,
        plaintext: text,
        decryptState: "ok",
        verified: true,
        status: MessageStatus.PENDING,
        createdAt: now,
        updatedAt: now,
      };

      outboxRef.current.set(tempId, {
        wire: {
          channelId,
          encryptedContent: payload.encryptedContent,
          contentIv: payload.contentIv,
          contentTag: payload.contentTag,
          signature: payload.signature,
          sequenceNumber: 0,
          senderKeyEpoch: 0,
          messageType,
          metadata: payload.metadata,
        },
        preview: contentPreviewText(text),
      });

      setError(null);
      commit((prev) => [...prev, optimistic]);
      scrollToBottom();
      stopTyping();
      dispatch(tempId);
      return true;
    },
    [removed, channel?.members, channelId, meId, me?.username, commit, scrollToBottom, stopTyping, dispatch],
  );

  const retrySend = useCallback(
    (tempId: string) => {
      const msg = messagesRef.current.find((m) => m.id === tempId);
      if (!msg || msg.status !== MessageStatus.FAILED || !outboxRef.current.has(tempId)) return;
      setError(null);
      commit((prev) =>
        prev.map((m) => (m.id === tempId ? { ...m, status: MessageStatus.PENDING } : m)),
      );
      dispatch(tempId);
    },
    [commit, dispatch],
  );

  const discardFailed = useCallback(
    (tempId: string) => {
      outboxRef.current.delete(tempId);
      commit((prev) => prev.filter((m) => m.id !== tempId));
    },
    [commit],
  );

  // ─── Reactions: debounced, coalesced, serialized (latest-wins) ───────

  const reactionTimersRef = useRef(new Map<string, ReturnType<typeof setTimeout>>());
  const reactionInFlightRef = useRef(new Set<string>());
  const reactionQueuedRef = useRef(new Map<string, { emoji: string; remove: boolean }>());
  const reactionOpsRef = useRef(new Set<string>());

  const releaseReactionOp = useCallback((messageId: string) => {
    if (reactionOpsRef.current.delete(messageId)) {
      useChatStore.getState().endReactionOp(messageId);
    }
  }, []);

  // Self-heal after persistent failure: adopt server truth silently
  const syncReactionsFromServer = useCallback(
    async (messageId: string) => {
      try {
        const grouped = await api.get<Array<{ emoji: string; userIds: string[] }>>(
          "/reactions",
          { messageId, channelId },
        );
        const known = useChatStore.getState().reactionsByMessage[messageId] || [];
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

  const flushReaction = useCallback(
    (messageId: string) => {
      if (reactionInFlightRef.current.has(messageId)) return;
      const op = reactionQueuedRef.current.get(messageId);
      if (!op) {
        releaseReactionOp(messageId);
        return;
      }

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
        if (reactionQueuedRef.current.has(messageId)) flushReaction(messageId);
        else releaseReactionOp(messageId);
      };

      const attempt = (retriesLeft: number) => {
        const sock = getSocket();
        if (!sock?.connected) {
          if (retriesLeft > 0) {
            setTimeout(() => attempt(retriesLeft - 1), 800);
          } else {
            finish();
            void syncReactionsFromServer(messageId);
          }
          return;
        }
        (sock as any)
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
              // Still failing — release the guard, then adopt server truth
              finish();
              void syncReactionsFromServer(messageId);
            },
          );
      };

      attempt(1);
    },
    [channelId, releaseReactionOp, syncReactionsFromServer],
  );

  // Unmount: never drop a queued intent — send it right away
  useEffect(() => {
    const timers = reactionTimersRef.current;
    const queued = reactionQueuedRef.current;
    const inFlight = reactionInFlightRef.current;
    return () => {
      for (const t of timers.values()) clearTimeout(t);
      timers.clear();
      for (const messageId of Array.from(queued.keys())) {
        // In-flight ones flush their queued intent from finish()
        if (!inFlight.has(messageId)) flushReaction(messageId);
      }
    };
  }, [flushReaction]);

  const toggleReaction = useCallback(
    (messageId: string, emoji: string) => {
      if (!meId || !me || isTempId(messageId)) return;
      const target = messagesRef.current.find((m) => m.id === messageId);
      if (!target || target.isDeleted) return;

      const state = useChatStore.getState();
      const existing = state.reactionsByMessage[messageId] || [];
      const mineBefore = existing.filter((r) => r.userId === meId);
      const hadMine = mineBefore.some((r) => r.emoji === emoji);

      if (!reactionOpsRef.current.has(messageId)) {
        reactionOpsRef.current.add(messageId);
        state.beginReactionOp(messageId);
      }

      // Optimistic apply — one reaction per user: a new emoji displaces my
      // previous one, clicking my own emoji removes it
      if (hadMine) {
        state.removeReaction(messageId, meId, emoji);
      } else {
        for (const r of mineBefore) state.removeReaction(messageId, meId, r.emoji);
        state.addReaction(messageId, { emoji, userId: meId, username: me.username });
      }

      reactionQueuedRef.current.set(messageId, { emoji, remove: hadMine });
      if (reactionInFlightRef.current.has(messageId)) return; // finish() picks it up
      const pending = reactionTimersRef.current.get(messageId);
      if (pending) clearTimeout(pending);
      reactionTimersRef.current.set(
        messageId,
        setTimeout(() => {
          reactionTimersRef.current.delete(messageId);
          flushReaction(messageId);
        }, REACTION_DEBOUNCE_MS),
      );
    },
    [meId, me, flushReaction],
  );

  return {
    me,
    channel,
    members: channel?.members ?? [],
    messages,
    loading,
    syncing,
    loadingOlder,
    error,
    setError,
    removed,
    containerRef,
    endRef,
    handleScroll,
    handleTyping,
    send,
    retrySend,
    discardFailed,
    toggleReaction,
  };
}
