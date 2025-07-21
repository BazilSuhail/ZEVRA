"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import { FiRefreshCw, FiWifiOff, FiHome, FiX } from "react-icons/fi";
import ErrorShell from "@/components/errors/ErrorShell";
import { useSocketStore } from "@/context/stores/socket-store";

// ─── Rotating status messages ───────────────────────────────────────────────

const TICKER = [
  "Re-establishing the secure channel…",
  "Relay endpoint did not respond",
  "Your session keys never left this device",
  "Encrypted messages stay queued locally",
  "Retrying the WebSocket handshake…",
];

// ─── Types ──────────────────────────────────────────────────────────────────

interface ConnectionErrorScreenProps {
  /** Force a fresh socket connection (re-run provider init). */
  onRetry: () => void;
}

// ─── Component ──────────────────────────────────────────────────────────────

/**
 * Full-screen overlay shown when the websocket fails to connect.
 * Renders above the splash loader (z-[10000]) and hides itself the moment
 * the socket connects (parent unmounts it via `connectionError === null`).
 */
export default function ConnectionErrorScreen({ onRetry }: ConnectionErrorScreenProps) {
  const connectionError = useSocketStore((s) => s.connectionError);
  const failedAttempts = useSocketStore((s) => s.failedAttempts);
  const reconnectAttempts = useSocketStore((s) => s.reconnectAttempts);
  const status = useSocketStore((s) => s.status);

  const [dismissed, setDismissed] = useState(false);
  const [retrying, setRetrying] = useState(false);

  // A fresh error (or recovery) re-arms the screen after a dismissal.
  useEffect(() => {
    setDismissed(false);
    setRetrying(false);
  }, [connectionError]);

  // Stop the spinner if nothing happened within a few seconds.
  useEffect(() => {
    if (!retrying) return;
    const id = setTimeout(() => setRetrying(false), 5000);
    return () => clearTimeout(id);
  }, [retrying]);

  const handleRetry = () => {
    setRetrying(true);
    onRetry();
  };

  const attempts = Math.max(failedAttempts, reconnectAttempts, 1);
  const visible = Boolean(connectionError) && !dismissed;

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="connection-error"
          role="alertdialog"
          aria-label="Connection error"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.35 }}
          className="fixed inset-0 z-[10000] overflow-y-auto"
        >
          <ErrorShell
            badge="Connection lost"
            tone="danger"
            title="Can't reach the relay"
            description="The WebSocket to the Zevra server failed to open — the backend may be offline or restarting. Nothing was lost: your keys and messages stay encrypted on this device."
            details={`${connectionError}  ·  attempt ${attempts}`}
            ticker={TICKER}
            icon={<FiWifiOff className="h-8 w-8" />}
            footer="Zevra relay · end-to-end encrypted · zero telemetry"
            actions={
              <>
                <button
                  type="button"
                  onClick={handleRetry}
                  disabled={retrying || status === "connecting"}
                  className="group inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-purple-600/25 transition hover:from-purple-500 hover:to-indigo-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-purple-500 active:scale-95 disabled:cursor-wait disabled:opacity-75"
                >
                  <FiRefreshCw
                    className={`h-4 w-4 ${
                      retrying || status === "connecting"
                        ? "animate-spin"
                        : "transition-transform group-hover:rotate-90"
                    }`}
                  />
                  {retrying || status === "connecting" ? "Reconnecting…" : "Retry connection"}
                </button>

                <button
                  type="button"
                  onClick={() => window.location.reload()}
                  className="inline-flex items-center gap-2 rounded-xl border border-zinc-300 bg-white/70 px-5 py-3 text-sm font-semibold text-zinc-700 backdrop-blur transition hover:bg-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-purple-500 dark:border-white/15 dark:bg-white/5 dark:text-zinc-200 dark:hover:bg-white/10"
                >
                  Reload page
                </button>

                <Link
                  href="/"
                  className="inline-flex items-center gap-2 rounded-xl border border-transparent px-4 py-3 text-sm font-semibold text-zinc-500 transition hover:text-purple-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-purple-500 dark:text-zinc-400 dark:hover:text-purple-300"
                >
                  <FiHome className="h-4 w-4" />
                  Home
                </Link>

                <button
                  type="button"
                  onClick={() => setDismissed(true)}
                  aria-label="Dismiss and continue browsing"
                  className="inline-flex items-center gap-1.5 rounded-xl px-3 py-3 text-xs font-medium text-zinc-400 transition hover:text-zinc-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-purple-500 dark:text-zinc-500 dark:hover:text-zinc-300"
                >
                  <FiX className="h-3.5 w-3.5" />
                  Continue anyway
                </button>
              </>
            }
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
