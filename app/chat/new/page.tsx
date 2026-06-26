"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { FiSearch, FiUserPlus, FiUsers, FiArrowLeft, FiLoader, FiAlertCircle } from "react-icons/fi";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { api } from "@/utils/api";
import { useAct } from "@/utils/query";
import { useAuth } from "@/context/useAuth";
import type { User, Channel } from "@/utils/types";

export default function NewChatPage() {
  const router = useRouter();
  const { user: me } = useAuth();
  const searchParams = useSearchParams();
  const isGroup = searchParams.get("group") === "true";

  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [groupName, setGroupName] = useState("");
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(query), 300);
    return () => clearTimeout(t);
  }, [query]);

  // Fetch users on debounced query change
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
          // Exclude self
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

  // Create channel mutation
  const createChannel = useAct<Channel, { type: "DIRECT" | "GROUP"; name?: string; participantIds: string[] }>(
    (vars) => api.post<Channel>("/channels", vars),
    {
      onSuccess: (channel) => {
        router.push(`/chat/channel/${channel.id}`);
      },
    }
  );

  const toggleUser = (id: string) => {
    setSelectedUsers((prev) => (prev.includes(id) ? prev.filter((u) => u !== id) : [...prev, id]));
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

  const handleCreateGroup = () => {
    if (selectedUsers.length === 0) return;
    createChannel.mutate({
      type: "GROUP",
      name: groupName.trim() || undefined,
      participantIds: selectedUsers,
    });
  };

  const displayName = (u: User) => u.username;
  const selectedUserNames = searchResults
    .filter((u) => selectedUsers.includes(u.id))
    .reduce<Record<string, string>>((acc, u) => { acc[u.id] = u.username; return acc; }, {});

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
              {isGroup ? "Create a group conversation" : "Find and start a conversation"}
            </p>
          </div>
        </div>
      </div>

      {/* Group name input */}
      {isGroup && (
        <div className="border-b border-zinc-200 bg-white px-6 py-3 dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex items-center gap-3">
            <FiUsers className="h-5 w-5 text-zinc-400" />
            <input
              type="text"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              placeholder="Group name..."
              className="flex-1 bg-transparent text-sm outline-none"
            />
          </div>
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

      {/* Selected chips (group mode) */}
      {isGroup && selectedUsers.length > 0 && (
        <div className="px-6 pb-3">
          <div className="flex flex-wrap gap-2">
            {selectedUsers.map((id) => (
              <motion.span
                key={id}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="flex items-center gap-1 rounded-full bg-indigo-100 px-3 py-1 text-xs font-medium text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400"
              >
                {selectedUserNames[id] || id.slice(0, 8)}
                <button onClick={() => toggleUser(id)} className="ml-1 hover:text-indigo-900">
                  x
                </button>
              </motion.span>
            ))}
          </div>
        </div>
      )}

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
                    {displayName(u)[0]?.toUpperCase()}
                  </div>
                  <div
                    className={`absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white dark:border-zinc-900 ${
                      u.status === "ONLINE" ? "bg-indigo-500" : "bg-zinc-300"
                    }`}
                  />
                </div>
                <div>
                  <p className="font-medium">{displayName(u)}</p>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">{u.email}</p>
                </div>
              </div>

              {isGroup ? (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => toggleUser(u.id)}
                  className={`rounded-lg p-2 ${
                    selected
                      ? "bg-indigo-600 text-white"
                      : "bg-indigo-600 text-white hover:bg-indigo-700"
                  }`}
                >
                  <FiUsers className="h-4 w-4" />
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
      {isGroup && selectedUsers.length > 0 && (
        <div className="border-t border-zinc-200 bg-white px-6 py-4 dark:border-zinc-800 dark:bg-zinc-900">
          <motion.button
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            onClick={handleCreateGroup}
            disabled={createChannel.isPending}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 py-3 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
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
        </div>
      )}
    </div>
  );
}
