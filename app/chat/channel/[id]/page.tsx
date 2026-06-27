"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  FiArrowLeft,
  FiMoreVertical,
  FiShield,
  FiLock,
  FiSend,
  FiLoader,
  FiAlertCircle,
  FiTrash2,
  FiCheck,
  FiCheckCircle,
} from "react-icons/fi";
import { useFetch, useAct, useQueryClient } from "@/utils/query";
import { api } from "@/utils/api";
import { useAuth } from "@/context/useAuth";
import type { Message, ChannelInfo } from "@/utils/types";

function parseParticipantIds(raw: unknown): string[] {
  if (Array.isArray(raw)) return raw;
  if (typeof raw === "string") {
    const cleaned = raw.replace(/[{}"]/g, "");
    if (!cleaned) return [];
    return cleaned.split(",").filter(Boolean);
  }
  return [];
}

function formatTime(dateStr: string): string {
  const d = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffDays = Math.floor(diffMs / 86400000);
  const time = d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  if (diffDays === 0) return time;
  if (diffDays === 1) return `Yesterday ${time}`;
  if (diffDays < 7) return `${d.toLocaleDateString([], { weekday: "short" })} ${time}`;
  return `${d.toLocaleDateString([], { month: "short", day: "numeric" })} ${time}`;
}

function formatDateSeparator(dateStr: string): string {
  const d = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffDays = Math.floor(diffMs / 86400000);
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  return d.toLocaleDateString([], { weekday: "long", month: "long", day: "numeric" });
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

export default function ChannelPage() {
  const { id } = useParams<{ id: string }>();
  const { user: me } = useAuth();
  const qc = useQueryClient();
  const [text, setText] = useState("");
  const [nameMap, setNameMap] = useState<Record<string, string>>({});
  const scrollRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const hasScrolledRef = useRef(false);

  const { data: channel, isLoading: loadingChannel } = useFetch<ChannelInfo>(
    ["channel", id],
    () => api.get<ChannelInfo>(`/channels/${id}`),
    { staleTime: 30_000 }
  );

  const { data: msgData, isLoading: loadingMessages } = useFetch(
    ["messages", id],
    () => api.get<{ messages: Message[]; nextCursor: string | null; hasMore: boolean }>(`/messages/channel/${id}?limit=50`),
    { staleTime: 5_000 }
  );

  const messages = (msgData?.messages ?? []).slice().reverse();
  const isGroup = channel?.type === "GROUP";

  useEffect(() => {
    if (!channel?.members) return;
    const map: Record<string, string> = {};
    for (const m of channel.members) {
      map[m.id] = m.username;
    }
    setNameMap(map);
  }, [channel?.members]);

  useEffect(() => {
    if (!messages.length || !me) return;
    const lastMsg = messages[messages.length - 1];
    if (lastMsg && lastMsg.senderId !== me.id) {
      api.post(`/messages/channel/${id}/read/${lastMsg.id}`).catch(() => {});
    }
  }, [messages, me, id]);

  // Scroll to bottom on load and new messages
  useEffect(() => {
    if (loadingMessages) return;
    // Always scroll to bottom when messages change
    bottomRef.current?.scrollIntoView({ behavior: hasScrolledRef.current ? "smooth" : "instant" });
    hasScrolledRef.current = true;
  }, [messages.length, loadingMessages]);

  const channelName = (() => {
    if (channel?.name) return channel.name;
    if (channel?.type === "DIRECT" && me) {
      const ids = parseParticipantIds(channel.participantIds);
      const otherId = ids.find((pid) => pid !== me.id);
      if (otherId && nameMap[otherId]) return nameMap[otherId];
    }
    return channel?.name || "Chat";
  })();

  const sendMessage = useAct<Message, { encryptedContent: string; contentIv: string; contentTag: string; signature: string }>(
    (vars) =>
      api.post<Message>("/messages", {
        channelId: id,
        encryptedContent: vars.encryptedContent,
        contentIv: vars.contentIv,
        contentTag: vars.contentTag,
        signature: vars.signature,
        sequenceNumber: messages.length + 1,
        senderKeyEpoch: 0,
        messageType: "TEXT",
        metadata: {},
      }),
    {
      onSuccess: () => {
        setText("");
        qc.invalidateQueries({ queryKey: ["messages", id] });
        qc.invalidateQueries({ queryKey: ["channels"] });
      },
    }
  );

  const deleteMessage = useAct<unknown, string>(
    (msgId) => api.del(`/messages/${msgId}`),
    {
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: ["messages", id] });
      },
    }
  );

  const handleSend = useCallback(() => {
    if (!text.trim() || sendMessage.isPending) return;
    const encoded = btoa(text.trim());
    sendMessage.mutate({
      encryptedContent: encoded,
      contentIv: "",
      contentTag: "",
      signature: "",
    });
  }, [text, sendMessage, messages.length, id]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const senderName = (senderId: string): string => {
    if (senderId === me?.id) return "You";
    return nameMap[senderId] || senderId.slice(0, 8);
  };

  const groupedByDate: { date: string; messages: Message[] }[] = [];
  let currentDate = "";
  for (const msg of messages) {
    const msgDate = new Date(msg.createdAt).toDateString();
    if (msgDate !== currentDate) {
      currentDate = msgDate;
      groupedByDate.push({ date: msg.createdAt, messages: [msg] });
    } else {
      groupedByDate[groupedByDate.length - 1].messages.push(msg);
    }
  }

  return (
    <div className="flex flex-1 flex-col">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-zinc-200 bg-white px-4 py-3 dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex items-center gap-3">
          <Link href="/chat" className="rounded-lg p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 md:hidden">
            <FiArrowLeft className="h-5 w-5" />
          </Link>
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-100 text-sm font-bold text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400">
            {channelName[0]?.toUpperCase()}
          </div>
          <div>
            <p className="font-semibold">{channelName}</p>
            <p className="text-xs text-indigo-500">
              {loadingChannel ? "Loading..." : `${channel?.members?.length ?? 0} members`}
            </p>
          </div>
        </div>
        <Link
          href={`/chat/channel/${id}/info`}
          className="rounded-lg p-2 text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
        >
          <FiMoreVertical className="h-5 w-5" />
        </Link>
      </div>

      {/* Encryption banner */}
      <div className="flex items-center justify-center gap-2 bg-indigo-50 py-2 text-xs text-indigo-600 dark:bg-indigo-900/10 dark:text-indigo-400">
        <FiShield className="h-3 w-3" />Messages are end-to-end encrypted<FiLock className="h-3 w-3" />
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4">
        {loadingMessages && (
          <div className="flex items-center justify-center py-12">
            <FiLoader className="h-6 w-6 animate-spin text-zinc-400" />
          </div>
        )}

        {!loadingMessages && messages.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-zinc-400">
            <FiShield className="mb-3 h-8 w-8" />
            <p className="text-sm">No messages yet</p>
            <p className="mt-1 text-xs text-zinc-300 dark:text-zinc-600">Send the first message to start the conversation</p>
          </div>
        )}

        <div className="space-y-4">
          {groupedByDate.map((group) => (
            <div key={group.date}>
              <div className="flex items-center justify-center py-2">
                <span className="rounded-full bg-zinc-200 px-3 py-1 text-[11px] font-medium text-zinc-600 dark:bg-zinc-700 dark:text-zinc-300">
                  {formatDateSeparator(group.date)}
                </span>
              </div>

              <div className="space-y-3">
                {group.messages.map((msg) => {
                  const isSelf = msg.senderId === me?.id;
                  let displayText = "[Encrypted message]";
                  try {
                    if (msg.encryptedContent && msg.contentIv === "") {
                      displayText = atob(msg.encryptedContent);
                    }
                  } catch {}

                  const name = senderName(msg.senderId);
                  const initial = name[0]?.toUpperCase() || "?";
                  const colorClass = hashColor(name);

                  return (
                    <motion.div
                      key={msg.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`flex gap-2 ${isSelf ? "flex-row-reverse" : "flex-row"}`}
                    >
                      {/* Avatar */}
                      <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold ${colorClass}`}>
                        {initial}
                      </div>

                      {/* Bubble + meta */}
                      <div className={`flex flex-col ${isSelf ? "items-end" : "items-start"} w-[70%]`}>
                        {/* Name */}
                        <p className={`mb-1 text-[11px] font-medium ${isSelf ? "text-indigo-500 dark:text-indigo-400" : "text-zinc-500 dark:text-zinc-400"}`}>
                          {name}
                        </p>

                        {/* Message bubble */}
                        <div className="group relative">
                          <div
                            className={`rounded-2xl px-4 py-2.5 ${
                              isSelf
                                ? "rounded-tr-md bg-indigo-600 text-white"
                                : "rounded-tl-md bg-zinc-100 dark:bg-zinc-800"
                            }`}
                          >
                            <p className="text-sm leading-relaxed">{displayText}</p>
                            <p className={`mt-1 flex items-center gap-2 text-[10px] ${isSelf ? "text-indigo-200" : "text-zinc-400"}`}>
                              <span>{formatTime(msg.createdAt)}</span>
                              {isSelf && <FiCheckCircle className="h-3 w-3" />}
                            </p>
                          </div>

                          {/* Delete on hover */}
                          {isSelf && (
                            <button
                              onClick={() => deleteMessage.mutate(msg.id)}
                              className="absolute -top-2 -right-8 invisible group-hover:visible rounded-lg p-1 text-zinc-400 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-900/20"
                            >
                              <FiTrash2 className="h-3 w-3" />
                            </button>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
        <div ref={bottomRef} />
      </div>

      {/* Send bar */}
      <div className="border-t border-zinc-200 bg-white px-4 py-3 dark:border-zinc-800 dark:bg-zinc-900">
        <AnimatePresence>
          {sendMessage.error && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-2 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-600 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400"
            >
              <FiAlertCircle className="h-3 w-3 shrink-0" />
              {sendMessage.error.message}
            </motion.div>
          )}
        </AnimatePresence>
        <div className="flex items-center gap-3">
          <input
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            disabled={sendMessage.isPending}
            className="flex-1 rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm outline-none focus:border-indigo-500 dark:border-zinc-700 dark:bg-zinc-800"
          />
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleSend}
            disabled={!text.trim() || sendMessage.isPending}
            className="rounded-xl bg-indigo-600 px-6 py-3 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
          >
            {sendMessage.isPending ? (
              <FiLoader className="h-4 w-4 animate-spin" />
            ) : (
              <FiSend className="h-4 w-4" />
            )}
          </motion.button>
        </div>
      </div>
    </div>
  );
}
