"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { FiUsers, FiSearch, FiMessageSquare } from "react-icons/fi";
import { api } from "@/utils/api";
import { useAuthStore } from "@/context/stores";
import { useChatStore } from "@/context/stores/chat-store";
import { getChatKey, decrypt } from "@/lib/crypto";

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
  lastMessageSenderKeyEpoch: number | null;
  createdAt: string;
}

type FilterTab = "all" | "direct" | "group";

export default function ChatList() {
  const pathname = usePathname();
  const user = useAuthStore((s) => s.user);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const unreadCounts = useChatStore((s) => s.unreadCounts);

  const [rooms, setRooms] = useState<InboxRow[]>([]);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<FilterTab>("all");
  const [loaded, setLoaded] = useState(false);
  const [nameMap, setNameMap] = useState<Record<string, string>>({});
  const [previewMap, setPreviewMap] = useState<Record<string, string>>({});

  // ─── Fetch channels on mount ──────────────────────────────────────────
  useEffect(() => {
    if (!isAuthenticated || loaded) return;
    api
      .get<InboxRow[]>("/channels")
      .then(async (data) => {
        setRooms(data);
        setLoaded(true);

        // Fetch names for DM channels where name is null
        const dmWithoutName = data.filter(
          (r) => r.type === "DIRECT" && !r.name && r.lastMessageSenderId,
        );
        if (dmWithoutName.length > 0) {
          const entries = await Promise.allSettled(
            dmWithoutName.map(async (r) => {
              if (r.lastMessageSenderId !== user?.id && r.lastMessageSenderName) {
                return { id: r.id, name: r.lastMessageSenderName };
              }
              try {
                const channel = await api.get<any>(`/channels/${r.id}`);
                // Channel response might have members or name
                if (channel?.name) return { id: r.id, name: channel.name };
              } catch {}
              return { id: r.id, name: r.lastMessageSenderName || "Unknown" };
            }),
          );
          const updates: Record<string, string> = {};
          entries.forEach((e) => {
            if (e.status === "fulfilled") updates[e.value.id] = e.value.name;
          });
          setNameMap(updates);
        }

        // Decrypt previews
        for (const r of data) {
          if (!r.lastMessageContent || !r.lastMessageIv || !r.lastMessageTag) continue;
          const chatKey = getChatKey(r.id);
          if (!chatKey) {
            setPreviewMap((prev) => ({ ...prev, [r.id]: "[Encrypted message]" }));
            continue;
          }
          try {
            const pt = await decrypt(r.lastMessageContent, r.lastMessageIv, r.lastMessageTag, chatKey);
            setPreviewMap((prev) => ({ ...prev, [r.id]: pt }));
          } catch {
            setPreviewMap((prev) => ({ ...prev, [r.id]: "[Encrypted message]" }));
          }
        }
      })
      .catch(() => setLoaded(true));
  }, [isAuthenticated, loaded, user?.id]);

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
    const decrypted = previewMap[room.id];
    if (decrypted) {
      const prefix = room.type === "DIRECT" && room.lastMessageSenderId === user?.id ? "You: " : "";
      return prefix + decrypted;
    }
    return room.type === "GROUP" ? "No messages yet" : "New conversation";
  };

  const filtered = useMemo(() => {
    let result = rooms;
    if (activeTab === "direct") result = result.filter((r) => r.type === "DIRECT");
    else if (activeTab === "group") result = result.filter((r) => r.type === "GROUP");
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter((r) => displayName(r).toLowerCase().includes(q));
    }
    return result;
  }, [rooms, search, activeTab, nameMap, user?.id]);

  return (
    <div className="flex h-full max-w-220 flex-col border-r border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
      <div className="border-b border-zinc-200 px-4 py-3 dark:border-zinc-800">
        <h2 className="mb-3 text-lg font-bold">Chats</h2>
        <div className="flex items-center gap-2 rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-800">
          <FiSearch className="h-4 w-4 text-zinc-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search chats..."
            className="flex-1 bg-transparent text-sm outline-none"
          />
        </div>
      </div>

      <div className="flex border-b border-zinc-200 dark:border-zinc-800">
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
                ? "border-b-2 border-indigo-500 text-indigo-600 dark:text-indigo-400"
                : "text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
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
                <div className="h-10 w-10 rounded-full bg-zinc-200 dark:bg-zinc-700" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 w-24 rounded bg-zinc-200 dark:bg-zinc-700" />
                  <div className="h-2.5 w-36 rounded bg-zinc-100 dark:bg-zinc-800" />
                </div>
              </div>
            ))}
          </div>
        )}

        {loaded && filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-zinc-400">
            <FiUsers className="mb-3 h-8 w-8" />
            <p className="text-sm">
              {activeTab === "direct"
                ? "No direct messages yet"
                : activeTab === "group"
                  ? "No groups yet"
                  : "No conversations yet"}
            </p>
            <p className="mt-1 text-xs text-zinc-300 dark:text-zinc-600">
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

          return (
            <Link
              key={room.id}
              href={isGroup ? `/chat/group/${room.id}` : `/chat/dm/${room.id}`}
              className={`flex items-center gap-3 border-b border-zinc-100 px-4 py-3 transition-colors hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-800/50 ${
                pathname.includes(room.id)
                  ? "bg-indigo-50 dark:bg-indigo-900/10"
                  : ""
              }`}
            >
              <div className="relative">
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold ${
                    colorClass ||
                    "bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400"
                  }`}
                >
                  {isGroup ? <FiUsers className="h-4 w-4" /> : initial}
                </div>
              </div>
              <div className="flex-1 overflow-hidden">
                <div className="flex items-center justify-between">
                  <span className="truncate text-sm font-medium">{name}</span>
                  {displayTime && (
                    <span className="shrink-0 text-xs text-zinc-400">{displayTime}</span>
                  )}
                </div>
                <div className="flex items-center justify-between">
                  <span className="truncate text-xs text-zinc-500 dark:text-zinc-400">
                    {preview}
                  </span>
                  {unread > 0 && (
                    <span className="ml-2 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-indigo-500 text-[10px] font-bold text-white">
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
