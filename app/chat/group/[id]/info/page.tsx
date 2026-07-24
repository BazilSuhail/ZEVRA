"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { FiAlertCircle, FiArrowLeft, FiLoader, FiLock, FiUsers } from "react-icons/fi";
import { useAuthStore } from "@/context/stores/auth-store";
import { useSocketStore } from "@/context/stores/socket-store";
import { useChannelInfo } from "@/components/chat/use-channel-info";

export default function GroupInfoPage() {
  const { id } = useParams<{ id: string }>();
  const meId = useAuthStore((s) => s.user?.id);
  const onlineUsers = useSocketStore((s) => s.onlineUsers);
  const { channel, error, loading } = useChannelInfo(id);

  const members = channel?.members ?? [];

  return (
    <div className="flex flex-1 flex-col overflow-y-auto bg-[#fbfcfd] dark:bg-zinc-950">
      <header className="flex items-center gap-3 border-b border-zinc-200 bg-white px-5 py-5 dark:border-zinc-800 dark:bg-zinc-900">
        <Link href={`/chat/group/${id}`} className="rounded-lg p-2 text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800">
          <FiArrowLeft />
        </Link>
        <h1 className="font-bold">Group details</h1>
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
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                <FiUsers />
              </div>
              <div>
                <p className="font-semibold">{channel.name || "Unnamed group"}</p>
                <p className="text-xs text-zinc-500">
                  {members.length} {members.length === 1 ? "member" : "members"} · created{" "}
                  {new Date(channel.createdAt).toLocaleDateString()}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-xl bg-emerald-50 p-4 text-sm text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400">
              <FiLock className="shrink-0" /> Every message is encrypted separately for each member.
            </div>

            <div className="rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
              <p className="border-b border-zinc-100 px-5 py-3 text-sm font-semibold dark:border-zinc-800">Members</p>
              <ul>
                {members.map((m) => {
                  const online = !!onlineUsers[m.id];
                  return (
                    <li
                      key={m.id}
                      className="flex items-center gap-3 border-b border-zinc-100 px-5 py-3 last:border-b-0 dark:border-zinc-800"
                    >
                      <div className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-sm font-bold text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400">
                        {m.username.charAt(0).toUpperCase()}
                        <span
                          className={`absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-white dark:border-zinc-900 ${online ? "bg-emerald-500" : "bg-zinc-400"}`}
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">
                          {m.username}
                          {m.id === meId && <span className="ml-1 text-xs text-zinc-400">(you)</span>}
                        </p>
                        <p className="text-xs text-zinc-500">
                          Joined {new Date(m.joinedAt).toLocaleDateString()}
                        </p>
                      </div>
                      {m.role === "ADMIN" && (
                        <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-[10px] font-bold text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400">
                          Admin
                        </span>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
