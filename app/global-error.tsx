"use client";

import { useEffect } from "react";
import Link from "next/link";
import { FiAlertOctagon, FiRefreshCw, FiHome } from "react-icons/fi";
import ErrorShell from "@/components/errors/ErrorShell";
import "./globals.css";

// ─── Types ──────────────────────────────────────────────────────────────────

interface GlobalErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

// ─── Component ──────────────────────────────────────────────────────────────

/**
 * Root-layout error boundary. Replaces `<html>`/`<body>` when the root
 * layout itself fails, so it renders its own document shell with the same
 * themed grid-backdrop screen.
 */
export default function GlobalError({ error, reset }: GlobalErrorProps) {
  useEffect(() => {
    console.error("[Zevra] Global error:", error);
  }, [error]);

  return (
    <html lang="en">
      <body className="antialiased">
        <ErrorShell
          badge="Kernel panic"
          tone="danger"
          title="Zevra hit an unrecoverable error"
          description="The application shell failed to initialize. Retrying usually recovers; if it keeps happening, clear site data for this origin."
          details={error.message || "Unknown error"}
          ticker={[
            "Root layout failed to mount",
            "Your local encrypted cache is untouched",
            "Attempting recovery…",
          ]}
          icon={<FiAlertOctagon className="h-8 w-8" />}
          footer="Zevra · end-to-end encrypted · zero telemetry"
          actions={
            <>
              <button
                type="button"
                onClick={reset}
                className="group inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-purple-600/25 transition hover:from-purple-500 hover:to-indigo-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-purple-500 active:scale-95"
              >
                <FiRefreshCw className="h-4 w-4 transition-transform group-hover:rotate-90" />
                Reload
              </button>

              <Link
                href="/"
                className="inline-flex items-center gap-2 rounded-xl border border-zinc-300 bg-white/70 px-5 py-3 text-sm font-semibold text-zinc-700 backdrop-blur transition hover:bg-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-purple-500 dark:border-white/15 dark:bg-white/5 dark:text-zinc-200 dark:hover:bg-white/10"
              >
                <FiHome className="h-4 w-4" />
                Go home
              </Link>
            </>
          }
        />
      </body>
    </html>
  );
}
