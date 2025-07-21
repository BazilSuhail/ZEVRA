"use client";

import { useEffect } from "react";
import Link from "next/link";
import { FiAlertTriangle, FiRefreshCw, FiHome } from "react-icons/fi";
import ErrorShell from "@/components/errors/ErrorShell";

// ─── Types ──────────────────────────────────────────────────────────────────

interface RouteErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

// ─── Rotating status messages ───────────────────────────────────────────────

const TICKER = [
  "Rendering failed — nothing was lost",
  "Your session keys never left this device",
  "Rebuilding the view…",
  "Encrypted data stays on this device",
];

// ─── Component ──────────────────────────────────────────────────────────────

/**
 * Route error boundary — replaces Next.js' default error page with the
 * themed grid-backdrop screen (light/dark aware).
 */
export default function RouteError({ error, reset }: RouteErrorProps) {
  useEffect(() => {
    console.error("[Zevra] Route error:", error);
  }, [error]);

  const isDev = process.env.NODE_ENV !== "production";
  const detail = isDev
    ? `${error.message || "Unknown error"}${error.digest ? `  ·  digest: ${error.digest}` : ""}`
    : error.digest
      ? `reference: ${error.digest}`
      : null;

  return (
    <ErrorShell
      badge="Something broke"
      tone="warning"
      title="This screen failed to load"
      description={
        isDev
          ? "An unexpected error interrupted rendering. Check the console for the full stack trace, or retry the route."
          : "An unexpected error interrupted rendering. Nothing was lost — retry the route or head back home."
      }
      details={detail}
      ticker={TICKER}
      icon={<FiAlertTriangle className="h-8 w-8" />}
      footer="Zevra · end-to-end encrypted · zero telemetry"
      actions={
        <>
          <button
            type="button"
            onClick={reset}
            className="group inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-purple-600/25 transition hover:from-purple-500 hover:to-indigo-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-purple-500 active:scale-95"
          >
            <FiRefreshCw className="h-4 w-4 transition-transform group-hover:rotate-90" />
            Try again
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
  );
}
