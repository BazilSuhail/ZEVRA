"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { FiSearch, FiUserPlus, FiX, FiLoader, FiAlertCircle } from "react-icons/fi";
import { useRouter } from "next/navigation";
import { api } from "@/utils/api";
import { useAct } from "@/utils/query";
import { useAuth } from "@/context/useAuth";
import { useQueryClient } from "@tanstack/react-query";
import type { User, Channel } from "@/utils/types";

interface NewChatModalProps {
  open: boolean;
  onClose: () => void;
}

export default function NewChatModal({ open, onClose }: NewChatModalProps) {
  const router = useRouter();
  const { user: me } = useAuth();
  const qc = useQueryClient();

  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
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
        if (!cancelled) setSearchResults(data.filter((u) => u.id !== me?.id));
      })
      .catch((err) => {
        if (!cancelled) setSearchError(err?.message || "Search failed");
      })
      .finally(() => {
        if (!cancelled) setSearching(false);
      });
    return () => { cancelled = true; };
  }, [debouncedQuery, me?.id]);

  const createChannel = useAct<Channel, { type: "DIRECT"; participantIds: string[] }>(
    (vars) => api.post<Channel>("/channels", vars),
    {
      onSuccess: (channel) => {
        qc.invalidateQueries({ queryKey: ["channels"] });
        onClose();
        router.push(`/chat/dm/${channel.id}`);
      },
    }
  );

  const handleStartDM = (userId: string) => {
    createChannel.mutate({ type: "DIRECT", participantIds: [userId] });
  };

  const handleClose = () => {
    setQuery("");
    setSearchResults([]);
    setSearchError(null);
    onClose();
  };

  if (!open) return null;

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={handleClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative mx-4 flex h-[500px] w-full max-w-md flex-col rounded-2xl border border-zinc-200 bg-white shadow-2xl dark:border-zinc-800 dark:bg-zinc-900"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-zinc-200 px-5 py-4 dark:border-zinc-800">
              <div>
                <h2 className="text-lg font-bold">New Chat</h2>
                <p className="text-sm text-zinc-500 dark:text-zinc-400">Find and start a conversation</p>
              </div>
              <button
                onClick={handleClose}
                className="rounded-lg p-2 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 dark:hover:bg-zinc-800"
              >
                <FiX className="h-5 w-5" />
              </button>
            </div>

            {/* Error */}
            <AnimatePresence>
              {(createChannel.error || searchError) && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mx-5 mt-3 flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400"
                >
                  <FiAlertCircle className="h-4 w-4 shrink-0" />
                  {createChannel.error?.message || searchError}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Search */}
            <div className="px-5 pt-4">
              <div className="flex items-center gap-2 rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 dark:border-zinc-700 dark:bg-zinc-800">
                <FiSearch className="h-4 w-4 text-zinc-400" />
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search by username..."
                  className="flex-1 bg-transparent text-sm outline-none"
                  autoFocus
                />
                {searching && <FiLoader className="h-4 w-4 animate-spin text-zinc-400" />}
              </div>
            </div>

            {/* Results */}
            <div className="flex-1 overflow-y-auto px-5 py-3">
              {!debouncedQuery.trim() && (
                <p className="py-8 text-center text-sm text-zinc-400">Type a username to search</p>
              )}

              {debouncedQuery.trim() && !searching && searchResults.length === 0 && !searchError && (
                <p className="py-8 text-center text-sm text-zinc-400">No users found</p>
              )}

              {searchResults.map((u, i) => (
                <motion.div
                  key={u.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03 }}
                  className="flex items-center justify-between rounded-xl px-3 py-3 transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
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
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
