"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { FiArrowLeft, FiSearch, FiPhone, FiVideo } from "react-icons/fi";
import { getCalls, fetchAndCacheCallHistory, searchCalls, type StoredCall } from "@/lib/db";
import { formatDuration } from "@/lib/webrtc";
import { useAuthStore } from "@/context/stores/auth-store";

type Filter = "all" | "incoming" | "outgoing" | "missed";

export default function CallLogsPage() {
  const [calls, setCalls] = useState<StoredCall[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const userId = useAuthStore((s) => s.user?.id);

  useEffect(() => {
    loadCalls();
  }, []);

  const loadCalls = async () => {
    setLoading(true);
    setFetchError(false);
    try {
      // Check cache first
      const cached = await getCalls();
      if (cached.length > 0) {
        setCalls(cached);
        setLoading(false);
        // Still refresh from server in background
        if (userId) {
          fetchAndCacheCallHistory(userId).then((fresh) => setCalls(fresh)).catch(() => {});
        }
        return;
      }

      // Cache empty — hit server
      if (userId) {
        const serverCalls = await fetchAndCacheCallHistory(userId);
        setCalls(serverCalls);
      }
    } catch {
      setFetchError(true);
      const cached = await getCalls();
      setCalls(cached);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (!query.trim()) {
      loadCalls();
      return;
    }
    const timer = setTimeout(async () => {
      const results = await searchCalls(query.trim());
      setCalls(results);
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);

  const formatTime = (iso: string) => {
    const d = new Date(iso);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffDays === 0) {
      return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    } else if (diffDays === 1) {
      return "Yesterday";
    } else if (diffDays < 7) {
      return d.toLocaleDateString([], { weekday: "short" });
    }
    return d.toLocaleDateString([], { month: "short", day: "numeric" });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "missed":
        return "text-red-500";
      case "completed":
        return "text-emerald-500";
      case "rejected":
        return "text-amber-500";
      default:
        return "text-zinc-400";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "missed":
        return "Missed";
      case "rejected":
        return "Declined";
      case "cancelled":
        return "Cancelled";
      default:
        return "";
    }
  };

  return (
    <div className="flex flex-1 flex-col overflow-hidden bg-[#fbfcfd] dark:bg-zinc-950">
      {/* Header */}
      <header className="border-b border-zinc-200 bg-white px-6 py-6 dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex items-center gap-3">
          <Link
            href="/chat"
            className="rounded-lg p-2 text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
          >
            <FiArrowLeft />
          </Link>
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-indigo-500">
              History
            </p>
            <h1 className="mt-0.5 text-2xl font-bold">Calls</h1>
          </div>
        </div>
      </header>

      {/* Search */}
      <div className="border-b border-zinc-200 bg-white px-4 py-3 dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex items-center gap-2 rounded-xl bg-zinc-100 px-3 py-2 dark:bg-zinc-800">
          <FiSearch className="h-4 w-4 text-zinc-400" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Search calls..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-zinc-400"
          />
        </div>
      </div>

      {/* Call list */}
      <div
        className="call-list-scroll flex-1 overflow-y-auto px-2 py-2"
        style={{
          scrollbarWidth: "thin",
          scrollbarColor: "rgb(161 161 170 / 0.3) transparent",
        }}
      >
        <style>{`
          .call-list-scroll::-webkit-scrollbar { width: 6px; }
          .call-list-scroll::-webkit-scrollbar-track { background: transparent; }
          .call-list-scroll::-webkit-scrollbar-thumb {
            background: rgb(161 161 170 / 0.3);
            border-radius: 9999px;
          }
          .call-list-scroll::-webkit-scrollbar-thumb:hover {
            background: rgb(161 161 170 / 0.5);
          }
          @media (prefers-color-scheme: dark) {
            .call-list-scroll::-webkit-scrollbar-thumb {
              background: rgb(82 82 91 / 0.4);
            }
            .call-list-scroll::-webkit-scrollbar-thumb:hover {
              background: rgb(82 82 91 / 0.6);
            }
          }
        `}</style>
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-zinc-300 border-t-indigo-600" />
          </div>
        ) : calls.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-zinc-400">
            <FiPhone className="mb-3 h-8 w-8" />
            <p className="text-sm font-medium">
              {query ? "No calls found" : "No call history yet"}
            </p>
            {fetchError && (
              <p className="mt-1 text-xs text-zinc-500">
                Showing cached data — couldn&apos;t reach server
              </p>
            )}
          </div>
        ) : (
          calls.map((call) => (
            <div
              key={call.id}
              className="flex items-center gap-3 rounded-xl px-3 py-3 transition-colors hover:bg-zinc-100 dark:hover:bg-zinc-800/50"
            >
              {/* Avatar */}
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-100 text-sm font-bold text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                {call.peerUsername[0]?.toUpperCase() || "?"}
              </div>

              {/* Info */}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="truncate text-sm font-semibold">
                    {call.peerUsername}
                  </p>
                  {call.status !== "completed" && (
                    <span className={`text-[11px] font-medium ${getStatusColor(call.status)}`}>
                      {getStatusLabel(call.status)}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1.5 text-xs text-zinc-500">
                  {call.direction === "incoming" ? (
                    <FiPhone className="h-3 w-3 rotate-[225deg]" />
                  ) : (
                    <FiPhone className="h-3 w-3" />
                  )}
                  <span>{call.type}</span>
                  {call.duration != null && call.duration > 0 && (
                    <>
                      <span>·</span>
                      <span>{formatDuration(call.duration)}</span>
                    </>
                  )}
                </div>
              </div>

              {/* Time */}
              <span className="shrink-0 text-xs text-zinc-400">
                {formatTime(call.startedAt)}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
