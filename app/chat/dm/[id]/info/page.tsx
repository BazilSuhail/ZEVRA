"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { FiAlertCircle, FiArrowLeft, FiCalendar, FiLoader, FiLock } from "react-icons/fi";
import { useAuthStore } from "@/context/stores/auth-store";
import { useSocketStore } from "@/context/stores/socket-store";
import { useChannelInfo } from "@/components/chat/use-channel-info";

export default function DirectInfoPage() {
  const { id } = useParams<{ id: string }>();
  const meId = useAuthStore((s) => s.user?.id);
  const onlineUsers = useSocketStore((s) => s.onlineUsers);
  const { channel, error, loading } = useChannelInfo(id);

  const peer = channel?.members?.find((m) => m.id !== meId);
  const name = channel?.name || peer?.username || "Unknown";
  const initials = name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
  const online = !!(peer && onlineUsers[peer.id]);

  return (
    <div className="flex flex-1 flex-col bg-[#fbfcfd] dark:bg-zinc-950">
      <header className="flex items-center gap-3 border-b border-zinc-200 bg-white px-5 py-5 dark:border-zinc-800 dark:bg-zinc-900">
        <Link href={`/chat/dm/${id}`} className="rounded-lg p-2 text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800">
          <FiArrowLeft />
        </Link>
        <h1 className="font-bold">Conversation details</h1>
      </header>
      <div className="mx-auto w-full max-w-lg space-y-3 p-6">
        {loading && (
          <div className="flex items-center justify-center gap-2 py-12 text-sm text-zinc-400">
            <FiLoader className="h-4 w-4 animate-spin" />
            Loading...
          </div>
        )}

        {error && (
          <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400">
            <FiAlertCircle className="h-4 w-4 shrink-0" />
            {error}
          </div>
        )}

        {channel && (
          <>
            <div className="flex items-center gap-4 rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
              <div className="relative flex h-12 w-12 items-center justify-center rounded-full bg-amber-100 font-bold text-amber-700">
                {initials}
                <span
                  className={`absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border-2 border-white dark:border-zinc-900 ${online ? "bg-emerald-500" : "bg-zinc-400"}`}
                />
              </div>
              <div>
                <p className="font-semibold">{name}</p>
                <p className="text-xs text-zinc-500">
                  Direct conversation · {online ? "Online" : "Offline"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-xl bg-emerald-50 p-4 text-sm text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400">
              <FiLock className="shrink-0" /> Messages are end-to-end encrypted. Only you and {name} hold the keys.
            </div>
            <div className="flex items-center gap-3 rounded-xl border border-zinc-200 bg-white p-4 text-sm dark:border-zinc-800 dark:bg-zinc-900">
              <FiCalendar className="shrink-0 text-zinc-400" />
              Conversation started {new Date(channel.createdAt).toLocaleDateString()}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
