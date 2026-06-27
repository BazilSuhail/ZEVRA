"use client";

import { useState } from "react";
import { motion } from "motion/react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  FiArrowLeft,
  FiUsers,
  FiArchive,
  FiUserPlus,
  FiLoader,
  FiAlertCircle,
  FiTrash2,
} from "react-icons/fi";
import { useFetch, useAct, useQueryClient } from "@/utils/query";
import { api } from "@/utils/api";
import { useAuth } from "@/context/useAuth";
import type { ChannelInfo } from "@/utils/types";

function parseParticipantIds(raw: unknown): string[] {
  if (Array.isArray(raw)) return raw;
  if (typeof raw === "string") {
    const cleaned = raw.replace(/[{}"]/g, "");
    if (!cleaned) return [];
    return cleaned.split(",").filter(Boolean);
  }
  return [];
}

export default function ChannelInfoPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { user: me } = useAuth();
  const qc = useQueryClient();
  const [addUsername, setAddUsername] = useState("");
  const [addError, setAddError] = useState<string | null>(null);

  const { data: channel, isLoading } = useFetch<ChannelInfo>(
    ["channel", id],
    () => api.get<ChannelInfo>(`/channels/${id}`),
    { staleTime: 30_000 }
  );

  const archiveChannel = useAct(
    () => api.post(`/channels/${id}/archive`),
    {
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: ["channels"] });
        router.push("/chat");
      },
    }
  );

  const addMember = useAct(
    (vars: { userId: string; role: string }) =>
      api.post(`/channels/${id}/members`, vars),
    {
      onSuccess: () => {
        setAddUsername("");
        setAddError(null);
        qc.invalidateQueries({ queryKey: ["channel", id] });
      },
      onError: (err: Error) => {
        setAddError(err.message || "Failed to add member");
      },
    }
  );

  const removeMember = useAct(
    (userId: string) => api.del(`/channels/${id}/members/${userId}`),
    {
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: ["channel", id] });
      },
    }
  );

  const handleAddMember = async () => {
    if (!addUsername.trim()) return;
    setAddError(null);
    try {
      const users = await api.get<{ id: string; username: string }[]>(
        `/api/users/search?q=${encodeURIComponent(addUsername)}&limit=5`
      );
      const found = users.find((u) => u.username.toLowerCase() === addUsername.toLowerCase());
      if (!found) {
        setAddError("User not found");
        return;
      }
      addMember.mutate({ userId: found.id, role: "MEMBER" });
    } catch {
      setAddError("Search failed");
    }
  };

  const isGroup = channel?.type === "GROUP";
  const myRole = channel?.members?.find((m) => m.id === me?.id)?.role;

  return (
    <div className="flex flex-1 flex-col overflow-y-auto">
      <div className="border-b border-zinc-200 bg-white px-6 py-4 dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex items-center gap-3">
          <Link href={`/chat/channel/${id}`} className="rounded-lg p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800">
            <FiArrowLeft className="h-5 w-5" />
          </Link>
          <h1 className="text-xl font-bold">Channel Info</h1>
        </div>
      </div>

      <div className="flex-1 px-6 py-6">
        <div className="w-full space-y-6">
          {isLoading && (
            <div className="flex items-center justify-center py-12">
              <FiLoader className="h-6 w-6 animate-spin text-zinc-400" />
            </div>
          )}

          {/* Channel details */}
          {channel && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
              <div className="flex items-center gap-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-indigo-100 text-2xl font-bold text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400">
                  {channel.name?.[0]?.toUpperCase() || (isGroup ? "G" : "D")}
                </div>
                <div>
                  <h2 className="text-xl font-semibold">{channel.name || "Direct Message"}</h2>
                  <p className="text-sm text-zinc-500 dark:text-zinc-400">
                    {isGroup ? `${channel.members?.length ?? 0} members` : "Direct message"}
                  </p>
                </div>
              </div>
            </motion.div>
          )}

          {/* Members */}
          {channel && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
              <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold">
                <FiUsers className="h-5 w-5 text-indigo-500" />Members
              </h2>
              <div className="space-y-3">
                {channel.members?.map((m, i) => (
                  <motion.div
                    key={m.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="flex items-center justify-between rounded-xl bg-zinc-50 p-3 dark:bg-zinc-800"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-100 text-sm font-bold text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400">
                        {m.username[0]?.toUpperCase()}
                      </div>
                      <div>
                        <p className="font-medium">
                          {m.username} {m.id === me?.id && <span className="text-xs text-zinc-400">(you)</span>}
                        </p>
                        <p className="text-xs text-zinc-500 dark:text-zinc-400">Joined {new Date(m.joinedAt).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="rounded-full bg-zinc-200 px-3 py-1 text-xs font-medium dark:bg-zinc-700">{m.role}</span>
                      {isGroup && m.id !== me?.id && (myRole === "ADMIN" || m.role !== "ADMIN") && (
                        <button
                          onClick={() => removeMember.mutate(m.id)}
                          className="rounded-lg p-1.5 text-zinc-400 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-900/20"
                        >
                          <FiTrash2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Add member (group only, admin only) */}
              {isGroup && myRole === "ADMIN" && (
                <div className="mt-4 border-t border-zinc-200 pt-4 dark:border-zinc-700">
                  <p className="mb-2 text-sm font-medium">Add member</p>
                  {addError && (
                    <p className="mb-2 flex items-center gap-1 text-xs text-red-500">
                      <FiAlertCircle className="h-3 w-3" />{addError}
                    </p>
                  )}
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={addUsername}
                      onChange={(e) => setAddUsername(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleAddMember()}
                      placeholder="Username..."
                      className="flex-1 rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-2.5 text-sm outline-none focus:border-indigo-500 dark:border-zinc-700 dark:bg-zinc-800"
                    />
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handleAddMember}
                      disabled={addMember.isPending || !addUsername.trim()}
                      className="flex items-center gap-1 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
                    >
                      {addMember.isPending ? <FiLoader className="h-4 w-4 animate-spin" /> : <FiUserPlus className="h-4 w-4" />}
                      Add
                    </motion.button>
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {/* Actions */}
          {channel && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
              <h2 className="mb-4 text-lg font-semibold">Actions</h2>
              <div className="space-y-3">
                <motion.button
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  onClick={() => archiveChannel.mutate()}
                  disabled={archiveChannel.isPending}
                  className="flex w-full items-center gap-3 rounded-xl border border-zinc-200 px-4 py-3 text-sm font-medium hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-800"
                >
                  <FiArchive className="h-5 w-5 text-zinc-400" />
                  {channel.isArchived ? "Unarchive Channel" : "Archive Channel"}
                </motion.button>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
