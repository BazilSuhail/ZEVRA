"use client";

import { useEffect, useMemo, useState, useCallback, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { FiUsers, FiSearch, FiMessageSquare } from "react-icons/fi";
import { api } from "@/utils/api";
import { useAuthStore } from "@/context/stores";
import { useChatStore } from "@/context/stores/chat-store";
import { useSocketStore } from "@/context/stores/socket-store";
import { decryptMessage, onIdentityChange, type DecryptResult } from "@/lib/e2ee";
import type { RawServerMessage } from "@/lib/message-decode";
import { contentPreviewText } from "@/lib/message-content";
import { getSocket } from "@/lib/socket";
import { SOCKET_EVENTS } from "@/constants";

// ─── Helpers ──────────────────────────────────────────────────────────────

function timeAgo(dateStr: string | null): string {
  if (!dateStr) return "";
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "now";
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d`;
  return `${Math.floor(days / 7)}w`;
}

function hashColor(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const colors = [
    "bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400",
    "bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400",
    "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400",
    "bg-sky-100 text-sky-600 dark:bg-sky-900/30 dark:text-sky-400",
    "bg-violet-100 text-violet-600 dark:bg-violet-900/30 dark:text-violet-400",
    "bg-pink-100 text-pink-600 dark:bg-pink-900/30 dark:text-pink-400",
    "bg-teal-100 text-teal-600 dark:bg-teal-900/30 dark:text-teal-400",
    "bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400",
  ];
  return colors[Math.abs(hash) % colors.length];
}

interface InboxRow {
  id: string;
  name: string | null;
  type: string;
  isArchived: boolean;
  lastMessageAt: string | null;
  lastMessageContent: string | null;
  lastMessageSenderId: string | null;
  lastMessageSenderName: string | null;
  lastMessageIv: string | null;
  lastMessageTag: string | null;
  lastMessageMetadata: Record<string, unknown> | null;
  lastMessageSenderKeyEpoch: number | null;
  createdAt: string;
  dmPeerId: string | null;
  unreadCount?: number;
}

interface ChannelDetails {
  name: string | null;
  members?: { id: string; username: string }[];
}

function previewForResult(res: DecryptResult): string {
  if (res.state === "ok") return contentPreviewText(res.plaintext);
  if (res.state === "locked") return "Encrypted message";
  return "Can't decrypt message";
}

type FilterTab = "all" | "direct" | "group";

export default function ChatList() {
  const pathname = usePathname();
  const user = useAuthStore((s) => s.user);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const unreadCounts = useChatStore((s) => s.unreadCounts);
  const sentPreviews = useChatStore((s) => s.sentPreviews);
  const isConnected = useSocketStore((s) => s.isConnected);
  const generation = useSocketStore((s) => s.generation);
  const onlineUsers = useSocketStore((s) => s.onlineUsers);

  const [rooms, setRooms] = useState<InboxRow[]>([]);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<FilterTab>("all");
  const [loaded, setLoaded] = useState(false);
  const [nameMap, setNameMap] = useState<Record<string, string>>({});
  const [previewMap, setPreviewMap] = useState<Record<string, string>>({});

  const userId = user?.id;
  const roomsRef = useRef<InboxRow[]>([]);
  const nameMapRef = useRef<Record<string, string>>({});
  useEffect(() => {
    roomsRef.current = rooms;
  }, [rooms]);
  useEffect(() => {
    nameMapRef.current = nameMap;
  }, [nameMap]);

  // ─── Decrypt a single preview ────────────────────────────────────────
  const decryptPreview = useCallback(async (r: InboxRow): Promise<string> => {
    if (!r.lastMessageContent) {
      if (r.lastMessageAt) return "";
      return r.type === "GROUP" ? "No messages yet" : "New conversation";
    }
    try {
      const res = await decryptMessage({
        channelId: r.id,
        senderId: r.lastMessageSenderId || "",
        encryptedContent: r.lastMessageContent,
        contentIv: r.lastMessageIv,
        contentTag: r.lastMessageTag,
        metadata: r.lastMessageMetadata,
      });
      return previewForResult(res);
    } catch {
      return "Can't decrypt message";
    }
  }, []);

  // ─── Resolve DM peer names (non-blocking) ─────────────────────────────
  const resolveNames = useCallback(
    async (data: InboxRow[]) => {
      const pending = data.filter(
        (r) => r.type === "DIRECT" && !r.name && !nameMapRef.current[r.id],
      );
      if (pending.length === 0) return;
      const entries = await Promise.allSettled(
        pending.map(async (r) => {
          if (r.lastMessageSenderId && r.lastMessageSenderId !== userId && r.lastMessageSenderName) {
            return { id: r.id, name: r.lastMessageSenderName };
          }
          try {
            const channel = await api.get<ChannelDetails>(`/channels/${r.id}`);
            if (channel?.name) return { id: r.id, name: channel.name };
            const other = channel?.members?.find((m) => m.id !== userId);
            if (other?.username) return { id: r.id, name: other.username };
          } catch {
            // fall through to the best name we have
          }
          return { id: r.id, name: r.lastMessageSenderName || "Unknown" };
        }),
      );
      const updates: Record<string, string> = {};
      entries.forEach((e) => {
        if (e.status === "fulfilled") updates[e.value.id] = e.value.name;
      });
      setNameMap((prev) => ({ ...prev, ...updates }));
    },
    [userId],
  );

  // ─── Load / reload the inbox ──────────────────────────────────────────
  const loadingRef = useRef(false);
  const reloadQueuedRef = useRef(false);

  const loadChannels = useCallback(async () => {
    if (loadingRef.current) {
      reloadQueuedRef.current = true;
      return;
    }
    loadingRef.current = true;
    try {
      const data = await api.get<InboxRow[]>("/channels");
      const entries = await Promise.all(
        data.map(async (r) => [r.id, await decryptPreview(r)] as const),
      );
      // Set previews + rooms together so previews are ready on first render
      setPreviewMap(Object.fromEntries(entries));
      setRooms(data);
      setLoaded(true);

      // Server-side unread counters (Redis) — the open room is always read
      if (data.some((r) => typeof r.unreadCount === "number")) {
        const active = useChatStore.getState().activeRoomId;
        useChatStore.getState().setUnreadCounts(
          Object.fromEntries(
            data
              .filter((r) => r.id !== active && (r.unreadCount ?? 0) > 0)
              .map((r) => [r.id, r.unreadCount as number]),
          ),
        );
      }

      void resolveNames(data);
    } catch {
      setLoaded(true);
    } finally {
      loadingRef.current = false;
      if (reloadQueuedRef.current) {
        reloadQueuedRef.current = false;
        void loadChannels();
      }
    }
  }, [decryptPreview, resolveNames]);

  // Initial load
  useEffect(() => {
    if (!isAuthenticated || loaded) return;
    void loadChannels();
  }, [isAuthenticated, loaded, loadChannels]);

  // Keys unlocked later (password prompt) → re-decrypt previews
  useEffect(
    () =>
      onIdentityChange((id) => {
        if (!id) return;
        void (async () => {
          const entries = await Promise.all(
            roomsRef.current.map(async (r) => [r.id, await decryptPreview(r)] as const),
          );
          setPreviewMap((prev) => ({ ...prev, ...Object.fromEntries(entries) }));
        })();
      }),
    [decryptPreview],
  );

  // ─── Resync on reconnect: catch up rooms created/changed while offline ─
  const everConnected = useRef(false);
  const prevConnected = useRef(false);
  useEffect(() => {
    if (!isConnected) {
      prevConnected.current = false;
      return;
    }
    const isReconnect = everConnected.current && !prevConnected.current;
    everConnected.current = true;
    prevConnected.current = true;
    if (isReconnect && isAuthenticated) void loadChannels();
  }, [isConnected, isAuthenticated, loadChannels]);

  // ─── Real-time updates via socket ─────────────────────────────────────
  useEffect(() => {
    if (!loaded) return;
    const socket = getSocket();
    if (!socket) return;

    const handleMessageNew = async (payload: unknown) => {
      const msg = payload as RawServerMessage;
      const channelId = msg?.channelId;
      if (!channelId) return;

      // A room we don't know yet (e.g. created while this tab was away)
      if (!roomsRef.current.some((r) => r.id === channelId)) {
        void loadChannels();
        return;
      }

      let preview: string;
      try {
        preview = previewForResult(
          await decryptMessage({
            channelId,
            senderId: msg.senderId || "",
            encryptedContent: msg.encryptedContent,
            contentIv: msg.contentIv,
            contentTag: msg.contentTag,
            metadata: msg.metadata,
          }),
        );
      } catch {
        preview = "Can't decrypt message";
      }

      setPreviewMap((prevMap) => ({ ...prevMap, [channelId]: preview }));

      // Move room to top — and refresh the sender, otherwise the "You: "
      // prefix uses a stale sender id from the previous message
      setRooms((prev) => {
        const idx = prev.findIndex((r) => r.id === channelId);
        if (idx === -1) return prev;
        const room = {
          ...prev[idx],
          lastMessageAt: msg.createdAt || new Date().toISOString(),
          lastMessageSenderId: msg.senderId || prev[idx].lastMessageSenderId,
          lastMessageSenderName: msg.senderUsername ?? prev[idx].lastMessageSenderName,
        };
        const others = prev.filter((r) => r.id !== channelId);
        return [room, ...others];
      });
    };

    const handleChannelCreated = (data: {
      channel: { id: string; type: string; name: string | null; createdAt: string };
      memberIds: string[];
    }) => {
      const ch = data?.channel;
      if (!ch?.id || roomsRef.current.some((r) => r.id === ch.id)) return;
      const row: InboxRow = {
        id: ch.id,
        name: ch.name,
        type: ch.type,
        isArchived: false,
        lastMessageAt: null,
        lastMessageContent: null,
        lastMessageSenderId: null,
        lastMessageSenderName: null,
        lastMessageIv: null,
        lastMessageTag: null,
        lastMessageMetadata: null,
        lastMessageSenderKeyEpoch: null,
        createdAt: ch.createdAt,
        dmPeerId:
          ch.type === "DIRECT" ? (data.memberIds?.find((id) => id !== userId) ?? null) : null,
      };
      setRooms((prev) => (prev.some((r) => r.id === row.id) ? prev : [row, ...prev]));
      setPreviewMap((prev) => ({
        ...prev,
        [row.id]: row.type === "GROUP" ? "No messages yet" : "New conversation",
      }));
      // The server already joined our sockets; joining again is idempotent
      getSocket()?.emit(SOCKET_EVENTS.JOIN_CHANNEL, { channelId: row.id }, () => {});
      void resolveNames([row]);
    };

    const handleMemberAdded = (data: { channelId: string; userId: string }) => {
      if (data?.userId === userId && !roomsRef.current.some((r) => r.id === data.channelId)) {
        void loadChannels();
      }
    };

    const handleMemberRemoved = (data: { channelId: string; userId: string }) => {
      if (data?.userId !== userId) return;
      setRooms((prev) => prev.filter((r) => r.id !== data.channelId));
      useChatStore.getState().resetUnread(data.channelId);
    };

    const handleMessageDeleted = (data: { messageId: string; channelId: string }) => {
      // The deleted message may have been the room's preview — refresh it
      if (data?.channelId && roomsRef.current.some((r) => r.id === data.channelId)) {
        void loadChannels();
      }
    };

    socket.on(SOCKET_EVENTS.MESSAGE_NEW, handleMessageNew);
    socket.on(SOCKET_EVENTS.CHANNEL_CREATED, handleChannelCreated);
    socket.on(SOCKET_EVENTS.CHANNEL_MEMBER_ADDED, handleMemberAdded);
    socket.on(SOCKET_EVENTS.CHANNEL_MEMBER_REMOVED, handleMemberRemoved);
    socket.on(SOCKET_EVENTS.MESSAGE_DELETED, handleMessageDeleted);
    return () => {
      socket.off(SOCKET_EVENTS.MESSAGE_NEW, handleMessageNew);
      socket.off(SOCKET_EVENTS.CHANNEL_CREATED, handleChannelCreated);
      socket.off(SOCKET_EVENTS.CHANNEL_MEMBER_ADDED, handleMemberAdded);
      socket.off(SOCKET_EVENTS.CHANNEL_MEMBER_REMOVED, handleMemberRemoved);
      socket.off(SOCKET_EVENTS.MESSAGE_DELETED, handleMessageDeleted);
    };
  }, [loaded, generation, userId, loadChannels, resolveNames]);

  // ─── Apply our own just-sent messages (no message:new echo for sender) ─
  useEffect(() => {
    const ids = Object.keys(sentPreviews);
    if (ids.length === 0) return;

    setRooms((prev) => {
      let changed = false;
      const next = prev.map((r) => {
        const sp = sentPreviews[r.id];
        if (!sp) return r;
        const roomAt = r.lastMessageAt ? new Date(r.lastMessageAt).getTime() : 0;
        const spAt = new Date(sp.at).getTime();
        // Only apply when our sent message isn't older than the room's latest
        // (a friend's newer message must keep winning)
        if (spAt < roomAt) return r;
        if (r.lastMessageSenderId === sp.senderId && r.lastMessageAt === sp.at) return r;
        changed = true;
        return { ...r, lastMessageAt: sp.at, lastMessageSenderId: sp.senderId };
      });
      if (!changed) return prev;
      return next.sort(
        (a, b) =>
          new Date(b.lastMessageAt || 0).getTime() - new Date(a.lastMessageAt || 0).getTime(),
      );
    });
  }, [sentPreviews, rooms]);

  // ─── Presence comes from the shared socket store (handled in          ─
  // ─── socket-handlers.ts: presence:bulk / user:joined / user:left)    ─

  // ─── Derived ──────────────────────────────────────────────────────────
  const displayName = (room: InboxRow): string => {
    if (room.name) return room.name;
    if (room.type === "DIRECT") {
      if (nameMap[room.id]) return nameMap[room.id];
      if (room.lastMessageSenderId !== user?.id && room.lastMessageSenderName) return room.lastMessageSenderName;
      if (room.lastMessageSenderId === user?.id) return "You";
    }
    return "Unknown";
  };

  const previewText = (room: InboxRow): string => {
    // Our own latest sent message (kept in sync by the sentPreviews effect)
    const sp = sentPreviews[room.id];
    if (
      sp &&
      room.lastMessageSenderId === sp.senderId &&
      room.lastMessageAt === sp.at
    ) {
      const prefix = room.type === "DIRECT" ? "You: " : "";
      return prefix + sp.text;
    }

    const decrypted = previewMap[room.id];
    if (decrypted !== undefined) {
      const prefix = room.type === "DIRECT" && room.lastMessageSenderId === user?.id ? "You: " : "";
      return prefix + decrypted;
    }
    // Fallback while previewMap is loading
    if (room.lastMessageAt) {
      return "";
    }
    return room.type === "GROUP" ? "No messages yet" : "New conversation";
  };

  const getDmOtherUserId = (room: InboxRow): string | null => {
    if (room.type !== "DIRECT") return null;
    return room.dmPeerId || null;
  };

  const sorted = useMemo(() => {
    return [...rooms].sort((a, b) => {
      const aTime = a.lastMessageAt ? new Date(a.lastMessageAt).getTime() : 0;
      const bTime = b.lastMessageAt ? new Date(b.lastMessageAt).getTime() : 0;
      return bTime - aTime;
    });
  }, [rooms]);

  const filtered = useMemo(() => {
    let result = sorted;
    if (activeTab === "direct") result = result.filter((r) => r.type === "DIRECT");
    else if (activeTab === "group") result = result.filter((r) => r.type === "GROUP");
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter((r) => displayName(r).toLowerCase().includes(q));
    }
    return result;
  }, [sorted, search, activeTab, nameMap, user?.id]);

  // ChatList: light=violet wash #f7f4ff (custom) / dark=#18181b (zinc-900)
  return (
    <div className="flex h-full w-full sm:w-70 lg:w-80 shrink-0 flex-col border-r border-[#e6e0f8] bg-[#f7f4ff] dark:border-zinc-800 dark:bg-zinc-900 shadow-sm dark:shadow-none">
      <div className="border-b border-[#e9e3f9] dark:border-zinc-800 px-4 py-3">
        <h2 className="mb-3 text-lg font-bold text-zinc-900 dark:text-zinc-100">Chats</h2>
        {/* Search: light=white #ffffff on the violet wash / dark=#0a0812 (zinc-950) */}
        <div className="flex items-center gap-2 rounded-xl border border-[#e9e3f9] bg-white dark:border-zinc-800 dark:bg-zinc-950 px-3 py-2 focus-within:border-purple-500 focus-within:ring-1 focus-within:ring-purple-500/40 transition-all">
          <FiSearch className="h-4 w-4 text-zinc-400 dark:text-zinc-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search chats..."
            className="flex-1 bg-transparent text-sm text-zinc-900 dark:text-zinc-100 outline-none placeholder-zinc-400 dark:placeholder-zinc-500"
          />
        </div>
      </div>

      <div className="flex border-b border-[#e9e3f9] dark:border-zinc-800">
        {([
          { key: "all" as const, label: "All", icon: null },
          { key: "direct" as const, label: "DMs", icon: FiMessageSquare },
          { key: "group" as const, label: "Groups", icon: FiUsers },
        ]).map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex flex-1 items-center justify-center gap-1.5 py-2.5 text-xs font-medium transition-colors ${
              activeTab === tab.key
                ? "border-b-2 border-purple-500 text-purple-600 dark:text-purple-400"
                : "text-zinc-500 dark:text-zinc-400 hover:text-purple-600 dark:hover:text-purple-400"
            }`}
          >
            {tab.icon && <tab.icon className="h-3.5 w-3.5" />}
            {tab.label}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {!loaded && (
          <div className="space-y-3 p-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 animate-pulse">
                {/* Skeleton: light=violet tint #e9e3f9 / dark=#3f3f46 (zinc-700) */}
                <div className="h-10 w-10 rounded-full bg-[#e9e3f9] dark:bg-zinc-800" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 w-24 rounded bg-[#e9e3f9] dark:bg-zinc-800" />
                  <div className="h-2.5 w-36 rounded bg-[#efecfd] dark:bg-zinc-950" />
                </div>
              </div>
            ))}
          </div>
        )}

        {loaded && filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-zinc-400 dark:text-zinc-500">
            <FiUsers className="mb-3 h-8 w-8" />
            <p className="text-sm">
              {activeTab === "direct"
                ? "No direct messages yet"
                : activeTab === "group"
                  ? "No groups yet"
                  : "No conversations yet"}
            </p>
            <p className="mt-1 text-xs text-zinc-400 dark:text-zinc-600">
              Start a new chat from the sidebar
            </p>
          </div>
        )}

        {filtered.map((room) => {
          const name = displayName(room);
          const isGroup = room.type === "GROUP";
          const initial = isGroup ? null : name[0]?.toUpperCase();
          const displayTime = timeAgo(room.lastMessageAt);
          const colorClass = isGroup ? "" : hashColor(name);
          const unread = unreadCounts[room.id] || 0;
          const preview = previewText(room);
          const isOnline = !isGroup && !!onlineUsers[getDmOtherUserId(room) || ""];

          return (
            <Link
              key={room.id}
              href={isGroup ? `/chat/group/${room.id}` : `/chat/dm/${room.id}`}
              className={`flex items-center gap-3 border-b border-[#efecfd] px-4 py-3 transition-colors hover:bg-white/70 dark:border-zinc-800/50 dark:hover:bg-zinc-800/50 ${
                pathname.includes(room.id)
                  ? "bg-white shadow-[inset_3px_0_0_0_#7c3aed] dark:bg-zinc-800/50 dark:shadow-[inset_3px_0_0_0_#8b5cf6]"
                  : ""
              }`}
            >
              <div className="relative">
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold ${
                    colorClass ||
                    "bg-purple-100 dark:bg-zinc-800 text-purple-600 dark:text-purple-400"
                  }`}
                >
                  {isGroup ? <FiUsers className="h-4 w-4" /> : initial}
                </div>
                {/* Online dot */}
                {isOnline && (
                  <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-white dark:border-zinc-900 bg-emerald-500" />
                )}
              </div>
              <div className="flex-1 overflow-hidden">
                <div className="flex items-center justify-between">
                  <span className="truncate text-sm font-medium text-zinc-900 dark:text-zinc-100">{name}</span>
                  {displayTime && (
                    <span className="shrink-0 text-xs text-zinc-400 dark:text-zinc-500">{displayTime}</span>
                  )}
                </div>
                <div className="flex items-center justify-between">
                  <span className="truncate text-xs text-zinc-500 dark:text-zinc-400">
                    {preview}
                  </span>
                  {unread > 0 && (
                    <span className="ml-2 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-purple-600 text-[10px] font-bold text-white">
                      {unread}
                    </span>
                  )}
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
