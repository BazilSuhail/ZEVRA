"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "motion/react";
import { FiUsers, FiSearch } from "react-icons/fi";
import { useFetch } from "@/utils/query";
import { api } from "@/utils/api";
import { useAuth } from "@/context/useAuth";
import { useQueryClient } from "@tanstack/react-query";
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
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diffMs = now - then;
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "now";
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d`;
  const weeks = Math.floor(days / 7);
  return `${weeks}w`;
}

export default function ChatList() {
  const pathname = usePathname();
  const { user } = useAuth();
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [nameMap, setNameMap] = useState<Record<string, string>>({});

  useEffect(() => {
    qc.invalidateQueries({ queryKey: ["channels"] });
  }, [qc]);

  const { data: rawChannels, isLoading } = useFetch<Record<string, unknown>[]>(
    "channels",
    () => api.get<Record<string, unknown>[]>("/channels"),
    { staleTime: 0 }
  );

  const { data: unreadMap } = useFetch<Record<string, number>>(
    "unread",
    () => api.get<Record<string, number>>("/messages/unread"),
    { staleTime: 10_000 }
  );

  const channels = useMemo(() => {
    if (!rawChannels) return undefined;
    return rawChannels.map((ch) => ({
      ...ch,
      participantIds: parseParticipantIds(ch.participantIds),
    })) as Channel[];
  }, [rawChannels]);

  useEffect(() => {
    if (!channels || !user) return;

    const dmUserIds = new Set<string>();
    for (const ch of channels) {
      if (ch.type === "DIRECT" && !ch.name) {
        const ids = parseParticipantIds(ch.participantIds);
        const otherId = ids.find((id) => id !== user.id);
        if (otherId && !nameMap[otherId]) dmUserIds.add(otherId);
      }
    }

    if (dmUserIds.size === 0) return;

    let cancelled = false;
    const fetchAll = async () => {
      const results = await Promise.allSettled(
        [...dmUserIds].map((id) => api.get<{ id: string; username: string }>(`/api/users/${id}`))
      );
      if (cancelled) return;
      const map: Record<string, string> = {};
      results.forEach((r, i) => {
        if (r.status === "fulfilled") {
          const uid = [...dmUserIds][i];
          map[uid] = r.value.username;
        }
      });
      setNameMap((prev) => ({ ...prev, ...map }));
    };
    fetchAll();
    return () => { cancelled = true; };
  }, [channels, user, nameMap]);

  const displayName = (ch: Channel): string => {
    if (ch.name) return ch.name;
    if (ch.type === "DIRECT" && user) {
      const ids = parseParticipantIds(ch.participantIds);
      const otherId = ids.find((id) => id !== user.id);
      if (otherId && nameMap[otherId]) return nameMap[otherId];
      if (otherId) return otherId.slice(0, 8);
    }
    return "Unknown";
  };

  const filtered = useMemo(() => {
    if (!channels) return [];
    if (!search.trim()) return channels;
    const q = search.toLowerCase();
    return channels.filter((ch) => {
      const name = displayName(ch);
      return name.toLowerCase().includes(q);
    });
  }, [channels, search, nameMap, user]);

  return (
    <div className="flex h-full w-[300px] flex-col border-r border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
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

      <div className="flex-1 overflow-y-auto">
        {isLoading && (
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

        {!isLoading && filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-zinc-400">
            <FiUsers className="mb-3 h-8 w-8" />
            <p className="text-sm">No conversations yet</p>
            <p className="mt-1 text-xs text-zinc-300 dark:text-zinc-600">Start a new chat from the sidebar</p>
          </div>
        )}

        {filtered.map((ch, i) => {
          const name = displayName(ch);
          const isGroup = ch.type === "GROUP";
          const initial = isGroup ? null : name[0]?.toUpperCase();
          const displayTime = timeAgo(ch.lastMessageAt);

          return (
            <motion.div
              key={ch.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.03 }}
            >
              <Link
                href={`/chat/channel/${ch.id}`}
                className={`flex items-center gap-3 border-b border-zinc-100 px-4 py-3 transition-colors hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-800/50 ${
                  pathname === `/chat/channel/${ch.id}` ? "bg-indigo-50 dark:bg-indigo-900/10" : ""
                }`}
              >
                <div className="relative">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-100 text-sm font-bold text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400">
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
                      {ch.lastMessageContent
                        ? (() => {
                            let preview = ch.lastMessageContent;
                            try { preview = atob(ch.lastMessageContent); } catch {}
                            return `${ch.lastMessageSenderId === user?.id ? "You: " : ch.lastMessageSenderName ? `${ch.lastMessageSenderName}: ` : ""}${preview}`;
                          })()
                        : ch.type === "DIRECT" ? "New conversation" : "No messages yet"}
                    </span>
                    {(unreadMap?.[ch.id] ?? 0) > 0 && (
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
