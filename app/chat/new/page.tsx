"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { FiSearch, FiUserPlus, FiUsers, FiArrowLeft, FiLoader, FiAlertCircle, FiX } from "react-icons/fi";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { api } from "@/utils/api";
import { useAct } from "@/utils/query";
import { useAuth } from "@/context/useAuth";
import { useQueryClient } from "@tanstack/react-query";
import type { User, Channel } from "@/utils/types";

export default function NewChatPage() {
  const router = useRouter();
  const { user: me } = useAuth();
  const qc = useQueryClient();
  const searchParams = useSearchParams();
  const isGroup = searchParams.get("group") === "true";

  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [selectedUserMap, setSelectedUserMap] = useState<Record<string, User>>({});
  const [groupName, setGroupName] = useState("");
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(query), 300);
    return () => clearTimeout(t);
  }, [query]);

  useEffect(() => {
    if (!debouncedQuery.trim()) {
      setSearchResults([]);
      return;
    }
    let cancelled = false;
    setSearching(true);
    setSearchError(null);
    api
      .get<User[]>(`/api/users/search?q=${encodeURIComponent(debouncedQuery)}&limit=20`)
      .then((data) => {
        if (!cancelled) {
          setSearchResults(data.filter((u) => u.id !== me?.id));
        }
      })
      .catch((err) => {
        if (!cancelled) setSearchError(err?.message || "Search failed");
      })
      .finally(() => {
        if (!cancelled) setSearching(false);
      });
    return () => { cancelled = true; };
  }, [debouncedQuery, me?.id]);

  const createChannel = useAct<Channel, { type: "DIRECT" | "GROUP"; name?: string; participantIds: string[] }>(
    (vars) => api.post<Channel>("/channels", vars),
    {
      onSuccess: (channel) => {
        qc.invalidateQueries({ queryKey: ["channels"] });
        router.push(`/chat/channel/${channel.id}`);
      },
    }
  );

  const toggleUser = (u: User) => {
    setSelectedUsers((prev) => {
      if (prev.includes(u.id)) {
        const next = prev.filter((id) => id !== id);
        setSelectedUserMap((m) => {
          const copy = { ...m };
          delete copy[u.id];
          return copy;
        });
        return next;
      }
      setSelectedUserMap((m) => ({ ...m, [u.id]: u }));
      return [...prev, u.id];
    });
  };

  const removeUser = (id: string) => {
    setSelectedUsers((prev) => prev.filter((uid) => uid !== id));
    setSelectedUserMap((m) => {
      const copy = { ...m };
      delete copy[id];
      return copy;
    });
  };

  const handleStartDM = useCallback(
    (userId: string) => {
      createChannel.mutate({
        type: "DIRECT",
        participantIds: [userId],
      });
    },
    [createChannel]
  );

  const canCreateGroup = isGroup && selectedUsers.length > 0 && groupName.trim().length > 0;

  const handleCreateGroup = () => {
    if (!canCreateGroup) return;
    createChannel.mutate({
      type: "GROUP",
      name: groupName.trim(),
      participantIds: selectedUsers,
    });
  };

  return (
    <div className="flex flex-1 flex-col">
      {/* Header */}
      <div className="border-b border-zinc-200 bg-white px-6 py-4 dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex items-center gap-3">
          <Link href="/chat" className="rounded-lg p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800">
            <FiArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-xl font-bold">{isGroup ? "New Group" : "New Chat"}</h1>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              {isGroup ? "Add members and name your group" : "Find and start a conversation"}
            </p>
          </div>
        </div>
      </div>

      {/* Group name — required */}
      {isGroup && (
        <div className="border-b border-zinc-200 bg-white px-6 py-3 dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex items-center gap-3">
            <FiUsers className="h-5 w-5 text-zinc-400" />
            <input
              type="text"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              placeholder="Group name (required)..."
              className="flex-1 bg-transparent text-sm outline-none"
            />
            {groupName && (
              <button onClick={() => setGroupName("")} className="text-zinc-400 hover:text-zinc-600">
                <FiX className="h-4 w-4" />
              </button>
            )}
          </div>
          {!groupName.trim() && selectedUsers.length > 0 && (
            <p className="mt-1 ml-8 text-xs text-amber-500">Group name is required</p>
          )}
        </div>
      )}

      {/* Error */}
      <AnimatePresence>
        {(createChannel.error || searchError) && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mx-6 mt-4 flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400"
          >
            <FiAlertCircle className="h-4 w-4 shrink-0" />
            {createChannel.error?.message || searchError}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Selected chips (group mode) */}
      {isGroup && selectedUsers.length > 0 && (
        <div className="border-b border-zinc-100 bg-white px-6 py-3 dark:border-zinc-800 dark:bg-zinc-900">
          <p className="mb-2 text-xs font-medium text-zinc-500 dark:text-zinc-400">{selectedUsers.length} selected</p>
          <div className="flex flex-wrap gap-2">
            {selectedUsers.map((uid) => {
              const u = selectedUserMap[uid];
              const name = u?.username || uid.slice(0, 8);
              return (
                <motion.span
                  key={uid}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0 }}
                  className="flex items-center gap-1.5 rounded-full bg-indigo-100 pl-2.5 pr-1.5 py-1 text-xs font-medium text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400"
                >
                  <div className="flex h-5 w-5 items-center justify-center rounded-full bg-indigo-200 text-[10px] font-bold dark:bg-indigo-800">
                    {name[0]?.toUpperCase()}
                  </div>
                  {name}
                  <button
                    onClick={() => removeUser(uid)}
                    className="ml-0.5 rounded-full p-0.5 hover:bg-indigo-200 dark:hover:bg-indigo-800"
                  >
                    <FiX className="h-3 w-3" />
                  </button>
                </motion.span>
              );
            })}
          </div>
        </div>
      )}

      {/* Search */}
      <div className="px-6 py-4">
        <div className="flex items-center gap-2 rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 dark:border-zinc-700 dark:bg-zinc-800">
          <FiSearch className="h-4 w-4 text-zinc-400" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by username..."
            className="flex-1 bg-transparent text-sm outline-none"
          />
          {searching && <FiLoader className="h-4 w-4 animate-spin text-zinc-400" />}
        </div>
      </div>

      {/* Results */}
      <div className="flex-1 overflow-y-auto px-6">
        {!debouncedQuery.trim() && (
          <p className="py-8 text-center text-sm text-zinc-400">Type a username to search</p>
        )}

        {debouncedQuery.trim() && !searching && searchResults.length === 0 && !searchError && (
          <p className="py-8 text-center text-sm text-zinc-400">No users found</p>
        )}

        {searchResults.map((u, i) => {
          const selected = selectedUsers.includes(u.id);
          return (
            <motion.div
              key={u.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
              className={`flex items-center justify-between rounded-xl px-4 py-3 transition-colors ${
                selected ? "bg-indigo-50 dark:bg-indigo-900/20" : "hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-100 font-bold text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400">
                    {u.username[0]?.toUpperCase()}
                  </div>
                  <div
                    className={`absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white dark:border-zinc-900 ${
                      u.status === "ONLINE" ? "bg-indigo-500" : "bg-zinc-300"
                    }`}
                  />
                </div>
                <div>
                  <p className="font-medium">{u.username}</p>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">{u.email}</p>
                </div>
              </div>

              {isGroup ? (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => toggleUser(u)}
                  className={`rounded-lg px-3 py-2 text-xs font-medium ${
                    selected
                      ? "bg-indigo-600 text-white"
                      : "bg-indigo-100 text-indigo-600 hover:bg-indigo-200 dark:bg-indigo-900/30 dark:text-indigo-400"
                  }`}
                >
                  {selected ? "Selected" : "Add"}
                </motion.button>
              ) : (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleStartDM(u.id)}
                  disabled={createChannel.isPending}
                  className="rounded-lg bg-indigo-600 p-2 text-white hover:bg-indigo-700 disabled:opacity-50"
                >
                  {createChannel.isPending ? (
                    <FiLoader className="h-4 w-4 animate-spin" />
                  ) : (
                    <FiUserPlus className="h-4 w-4" />
                  )}
                </motion.button>
              )}
            </motion.div>
          );
        })}
      </div>

      {/* Create group button */}
      {isGroup && (
        <div className="border-t border-zinc-200 bg-white px-6 py-4 dark:border-zinc-800 dark:bg-zinc-900">
          <motion.button
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            onClick={handleCreateGroup}
            disabled={!canCreateGroup || createChannel.isPending}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 py-3 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-40"
          >
            {createChannel.isPending ? (
              <>
                <FiLoader className="h-4 w-4 animate-spin" />
                Creating...
              </>
            ) : (
              `Create Group (${selectedUsers.length} members)`
            )}
          </motion.button>
          {isGroup && selectedUsers.length > 0 && !groupName.trim() && (
            <p className="mt-2 text-center text-xs text-amber-500">Enter a group name to continue</p>
          )}
        </div>
      )}
    </div>
  );
}
