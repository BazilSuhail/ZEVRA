"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "motion/react";
import { FiUsers, FiSearch, FiMessageSquare } from "react-icons/fi";
import { api } from "@/utils/api";
import { useAuth } from "@/context/useAuth";
import { useChannels } from "@/context/stores/channelsStore";
import { useKeys } from "@/context/stores/keysStore";
import { useWatermark } from "@/utils/watermark";
import { subscribeToChannels, subscribeToPresence } from "@/utils/supabase";
import { decryptContent } from "@/utils/decrypt";
import type { Channel } from "@/utils/types";

function parseParticipantIds(raw: unknown): string[] {
  if (Array.isArray(raw)) return raw;
  if (typeof raw === "string") {
    const cleaned = raw.replace(/[{}"]/g, "");
    if (!cleaned) return [];
    return cleaned.split(",").filter(Boolean);
  }
  return [];
}

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

function mapRow(row: Record<string, unknown>): Channel {
  return {
    id: row.id as string,
    type: (row.type as "DIRECT" | "GROUP") || "DIRECT",
    name: row.name as string | null,
    isArchived: (row.isArchived ?? row.is_archived ?? false) as boolean,
    lastMessageId: (row.lastMessageId ?? row.last_message_id) as string | null,
    lastMessageAt: (row.lastMessageAt ?? row.last_message_at) as string | null,
    lastMessageContent: (row.lastMessageContent ?? row.last_message_content) as string | null,
    lastMessageSenderId: (row.lastMessageSenderId ?? row.last_message_sender_id) as string | null,
    lastMessageSenderName: (row.lastMessageSenderName ?? row.last_message_sender_name) as string | null,
    lastMessageIv: (row.lastMessageIv ?? row.last_message_iv) as string | null,
    lastMessageTag: (row.lastMessageTag ?? row.last_message_tag) as string | null,
    lastMessageSenderKeyEpoch: (row.lastMessageSenderKeyEpoch ?? row.last_message_sender_key_epoch) as number | null,
    participantIds: parseParticipantIds(row.participantIds ?? row.participant_ids),
    createdAt: (row.createdAt ?? row.created_at) as string,
    lastReadMessageId: (row.lastReadMessageId ?? row.last_read_message_id) as string | null,
  };
}

type FilterTab = "all" | "direct" | "group";

export default function ChatList() {
  const pathname = usePathname();
  const { user } = useAuth();
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<FilterTab>("all");
  const [nameMap, setNameMap] = useState<Record<string, string>>({});
  const [onlineMap, setOnlineMap] = useState<Record<string, boolean>>({});
  const [decrypting, setDecrypting] = useState<Set<string>>(new Set());

  const channels = useChannels((s) => s.channels);
  const loadChannels = useChannels((s) => s.loadChannels);
  const updateChannel = useChannels((s) => s.updateChannel);
  const loaded = useChannels((s) => s.loaded);
  const previews = useChannels((s) => s.previews);
  const setPreview = useChannels((s) => s.setPreview);
  const watermarks = useWatermark((s) => s.watermarks);

  // Track key unlock without hydration mismatch
  const [keysReady, setKeysReady] = useState(false);
  useEffect(() => {
    if (useKeys.getState().isUnlocked) { setKeysReady(true); return; }
    return useKeys.subscribe((s) => { if (s.isUnlocked) setKeysReady(true); });
  }, []);

  // ─── Fetch channels (once) ────────────────────────────────────────────
  useEffect(() => {
    if (loaded) return;
    api.get<Record<string, unknown>[]>("/channels").then((data) => {
      loadChannels(data.map(mapRow));
    });
  }, [loaded, loadChannels]);

  // Keep inbox previews synchronized across browser windows.
  useEffect(() => {
    const sub = subscribeToChannels((channelId, updates) => {
      const mapped: Record<string, unknown> = {};
      if (updates.last_message_id !== undefined) mapped.lastMessageId = updates.last_message_id;
      if (updates.last_message_at !== undefined) mapped.lastMessageAt = updates.last_message_at;
      if (updates.last_message_content !== undefined) mapped.lastMessageContent = updates.last_message_content;
      if (updates.last_message_sender_id !== undefined) mapped.lastMessageSenderId = updates.last_message_sender_id;
      if (updates.last_message_sender_name !== undefined) mapped.lastMessageSenderName = updates.last_message_sender_name;
      if (Object.keys(mapped).length > 0) updateChannel(channelId, mapped);
    });
    return () => { sub.unsubscribe(); };
  }, [updateChannel]);

  // ─── Realtime: presence ───────────────────────────────────────────────
  useEffect(() => {
    if (!user) return;
    const ch = subscribeToPresence((state) => {
      const map: Record<string, boolean> = {};
      for (const [, presences] of Object.entries(state)) {
        if (presences.length > 0) map[presences[0].user_id] = true;
      }
      setOnlineMap(map);
    });
    return () => { ch.unsubscribe(); };
  }, [user]);

  // ─── Load watermarks ──────────────────────────────────────────────────
  useEffect(() => {
    if (!loaded || channels.length === 0) return;
    useWatermark.getState().loadFromServer(
      channels.map((ch) => ({ id: ch.id, lastReadMessageId: ch.lastReadMessageId ?? null }))
    );
  }, [loaded, channels]);

  // ─── Fetch DM names ───────────────────────────────────────────────────
  useEffect(() => {
    if (!channels.length || !user) return;
    const ids = new Set<string>();
    for (const ch of channels) {
      if (ch.type === "DIRECT" && !ch.name) {
        const otherId = parseParticipantIds(ch.participantIds).find((id) => id !== user.id);
        if (otherId && !nameMap[otherId]) ids.add(otherId);
      }
    }
    if (ids.size === 0) return;
    let cancelled = false;
    Promise.allSettled(
      [...ids].map((id) => api.get<{ id: string; username: string }>(`/api/users/${id}`))
    ).then((results) => {
      if (cancelled) return;
      const map: Record<string, string> = {};
      results.forEach((r, i) => {
        if (r.status === "fulfilled") map[[...ids][i]] = r.value.username;
      });
      setNameMap((prev) => ({ ...prev, ...map }));
    });
    return () => { cancelled = true; };
  }, [channels, user]);

  // ─── Decrypt previews using shared helper ─────────────────────────────
  useEffect(() => {
    if (!loaded || channels.length === 0 || !keysReady) return;

    const toDecrypt = channels.filter(
      (ch) => ch.lastMessageContent && ch.lastMessageIv && ch.lastMessageTag && !previews[ch.id]
    );
    if (toDecrypt.length === 0) return;

    let cancelled = false;

    const run = async () => {
      for (const ch of toDecrypt) {
        if (cancelled) return;
        setDecrypting((prev) => new Set(prev).add(ch.id));

        try {
          const { plaintext } = await decryptContent(
            ch.lastMessageContent!,
            ch.lastMessageIv!,
            ch.lastMessageTag!,
            ch.id,
            ch.lastMessageSenderKeyEpoch ?? 0,
            ch.lastMessageSenderId ?? "",
          );
          if (!cancelled) setPreview(ch.id, plaintext);
        } catch {
          // Preview stays as "[Encrypted message]"
        } finally {
          if (!cancelled) setDecrypting((prev) => {
            const next = new Set(prev);
            next.delete(ch.id);
            return next;
          });
        }
      }
    };

    run();
    return () => { cancelled = true; };
  }, [channels, loaded, keysReady, previews, setPreview]);

  // ─── Derived state ────────────────────────────────────────────────────
  const displayName = (ch: Channel): string => {
    if (ch.name) return ch.name;
    if (ch.type === "DIRECT" && user) {
      const otherId = parseParticipantIds(ch.participantIds).find((id) => id !== user.id);
      if (otherId && nameMap[otherId]) return nameMap[otherId];
      if (otherId) return otherId.slice(0, 8);
    }
    return "Unknown";
  };

  const isOnline = (ch: Channel): boolean => {
    if (ch.type !== "DIRECT" || !user) return false;
    const otherId = parseParticipantIds(ch.participantIds).find((id) => id !== user.id);
    return otherId ? !!onlineMap[otherId] : false;
  };

  const unreadMap = useMemo(() => {
    const result: Record<string, number> = {};
    for (const ch of channels) {
      if (ch.lastMessageId) {
        const lastReadId = watermarks[ch.id] || ch.lastReadMessageId;
        if (!lastReadId || ch.lastMessageId !== lastReadId) result[ch.id] = 1;
      }
    }
    return result;
  }, [channels, watermarks]);

  const filtered = useMemo(() => {
    let result = channels;
    if (activeTab === "direct") result = result.filter((ch) => ch.type === "DIRECT");
    else if (activeTab === "group") result = result.filter((ch) => ch.type === "GROUP");
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter((ch) => displayName(ch).toLowerCase().includes(q));
    }
    return result;
  }, [channels, search, activeTab, nameMap, user, onlineMap]);

  // ─── Preview renderer ─────────────────────────────────────────────────
  // ─── Preview renderer ────────────────────────────────────────────────────
  const renderPreview = (ch: Channel): React.ReactNode => {
    const senderName =
      ch.lastMessageSenderId === user?.id
        ? "You"
        : ch.lastMessageSenderName || "";

    if (!ch.lastMessageContent) {
      return ch.type === "DIRECT" ? "New conversation" : "No messages yet";
    }

    // Shimmer while decrypting
    if (decrypting.has(ch.id)) {
      return (
        <span className="inline-flex items-center gap-1.5">
          {senderName && (
            <span className="mr-1 text-zinc-500 dark:text-zinc-400">
              {senderName}:
            </span>
          )}

          <span className="inline-block h-3 w-24 animate-pulse rounded bg-zinc-200 dark:bg-zinc-700" />
        </span>
      );
    }

    // Decrypted preview
    const decrypted = previews[ch.id];

    if (decrypted) {
      return (
        <span className="inline-flex min-w-0 items-center">
          {senderName && (
            <span className="mr-1 shrink-0 text-zinc-500 dark:text-zinc-400">
              {senderName}:
            </span>
          )}

          <span className="truncate">{decrypted}</span>
        </span>
      );
    }

    // Fallback
    return (
      <span className="inline-flex items-center gap-1.5">
        {senderName && (
          <span className="mr-1 text-zinc-500 dark:text-zinc-400">
            {senderName}:
          </span>
        )}

        <span className="text-zinc-400 dark:text-zinc-500">
          [Encrypted message]
        </span>
      </span>
    );
  };


  return (
    <div className="flex h-full w-[300px] flex-col border-r border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
      <div className="border-b border-zinc-200 px-4 py-3 dark:border-zinc-800">
        <h2 className="mb-3 text-lg font-bold">Chats</h2>
        <div className="flex items-center gap-2 rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-800">
          <FiSearch className="h-4 w-4 text-zinc-400" />
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search chats..."
            className="flex-1 bg-transparent text-sm outline-none" />
        </div>
      </div>

      <div className="flex border-b border-zinc-200 dark:border-zinc-800">
        {([
          { key: "all" as const, label: "All", icon: null },
          { key: "direct" as const, label: "DMs", icon: FiMessageSquare },
          { key: "group" as const, label: "Groups", icon: FiUsers },
        ]).map((tab) => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)}
            className={`flex flex-1 items-center justify-center gap-1.5 py-2.5 text-xs font-medium transition-colors ${
              activeTab === tab.key
                ? "border-b-2 border-indigo-500 text-indigo-600 dark:text-indigo-400"
                : "text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
            }`}>
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
              {activeTab === "direct" ? "No direct messages yet" : activeTab === "group" ? "No groups yet" : "No conversations yet"}
            </p>
            <p className="mt-1 text-xs text-zinc-300 dark:text-zinc-600">Start a new chat from the sidebar</p>
          </div>
        )}

        {filtered.map((ch, i) => {
          const name = displayName(ch);
          const isGroup = ch.type === "GROUP";
          const initial = isGroup ? null : name[0]?.toUpperCase();
          const displayTime = timeAgo(ch.lastMessageAt);
          const online = isOnline(ch);
          const colorClass = isGroup ? "" : hashColor(name);

          return (
            <motion.div key={ch.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.03 }}>
              <Link href={`/chat/channel/${ch.id}`}
                className={`flex items-center gap-3 border-b border-zinc-100 px-4 py-3 transition-colors hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-800/50 ${
                  pathname === `/chat/channel/${ch.id}` ? "bg-indigo-50 dark:bg-indigo-900/10" : ""
                }`}>
                <div className="relative">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold ${colorClass || "bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400"}`}>
                    {isGroup ? <FiUsers className="h-4 w-4" /> : initial}
                  </div>
                  {!isGroup && (
                    <div className={`absolute -bottom-0.5 -right-0.5 h-4 w-4 rounded-full border-2 border-white dark:border-zinc-900 ${
                      online ? "bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.5)]" : "bg-zinc-300 dark:bg-zinc-600"
                    }`} />
                  )}
                </div>
                <div className="flex-1 overflow-hidden">
                  <div className="flex items-center justify-between">
                    <span className="truncate text-sm font-medium">{name}</span>
                    {displayTime && <span className="shrink-0 text-xs text-zinc-400">{displayTime}</span>}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="truncate text-xs text-zinc-500 dark:text-zinc-400">
                      {renderPreview(ch)}
                    </span>
                    {(unreadMap[ch.id] ?? 0) > 0 && (
                      <span className="ml-2 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-indigo-500 text-[10px] font-bold text-white">
                        {unreadMap[ch.id]}
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
