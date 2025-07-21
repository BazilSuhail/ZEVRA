"use client";

import Link from "next/link";
import { FiArrowRight, FiLock, FiShield } from "react-icons/fi";
import StatusTicker from "@/components/system/StatusTicker";

// ─── Rotating status messages ──────────────────────────────────────────────

const TICKER = [
  "Pick a conversation to begin…",
  "Sealed end-to-end in transit and at rest",
  "Session keys derived on this device only",
  "Zero-knowledge relay · no telemetry",
];

// ─── Backdrop constants ────────────────────────────────────────────────────

const GRID_IMAGE =
  "linear-gradient(to right, var(--grid-line) 1px, transparent 1px), " +
  "linear-gradient(to bottom, var(--grid-line) 1px, transparent 1px)";

const GRID_MASK =
  "radial-gradient(ellipse 80% 70% at 50% 45%, #000 20%, transparent 85%)";

/**
 * Custom gradient canvas for the welcome screen.
 * Everything is layered with `relative` on the root and `absolute inset-0`
 * on each layer, so the stack never affects layout of the content above it.
 */
function WelcomeBackdrop() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0">
      {/* 1 — base: near-black in dark mode */}
      <div className="absolute inset-0 bg-[#faf9ff] dark:bg-[#040308]" />

      {/* 2 — deep violet bloom, top-left */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_75%_60%_at_12%_-5%,rgba(124,58,237,0.13),transparent_65%)] dark:bg-[radial-gradient(ellipse_75%_60%_at_12%_-5%,rgba(109,40,217,0.55),transparent_68%)]" />

      {/* 3 — indigo bloom, bottom-right */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_55%_at_105%_105%,rgba(79,70,229,0.11),transparent_62%)] dark:bg-[radial-gradient(ellipse_70%_55%_at_105%_105%,rgba(55,48,163,0.5),transparent_65%)]" />

      {/* 4 — violet core behind the content */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_50%_45%_at_50%_55%,rgba(168,85,247,0.09),transparent_72%)] dark:bg-[radial-gradient(ellipse_50%_45%_at_50%_55%,rgba(124,58,237,0.26),transparent_72%)]" />

      {/* 5 — diagonal sheen from the top-left corner */}
      <div className="absolute inset-0 bg-[linear-gradient(150deg,rgba(255,255,255,0.6),transparent_45%)] dark:bg-[linear-gradient(150deg,rgba(255,255,255,0.05),transparent_38%)]" />

      {/* 6 — grid texture, masked so it fades toward the edges */}
      <div
        className="zv-grid-lines absolute inset-0 opacity-40 dark:opacity-50"
        style={{
          backgroundImage: GRID_IMAGE,
          backgroundSize: "44px 44px",
          maskImage: GRID_MASK,
          WebkitMaskImage: GRID_MASK,
        }}
      />

      {/* 7 — drifting orb, left */}
      <div className="zv-float absolute -left-28 top-[14%] h-64 w-64 rounded-full bg-purple-300/40 blur-[80px] dark:bg-purple-700/30" style={{ animationDuration: "14s" }} />

      {/* 8 — drifting orb, right */}
      <div
        className="zv-float absolute -right-24 bottom-[8%] h-56 w-56 rounded-full bg-indigo-300/35 blur-[80px] dark:bg-indigo-700/25"
        style={{ animationDuration: "18s", animationDelay: "3s" }}
      />

      {/* 9 — darkening wash so the pane stays very dark in dark mode */}
      <div className="absolute inset-0 bg-transparent dark:bg-black/45" />

      {/* 10 — vignette */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_40%,rgba(90,70,160,0.10))] dark:bg-[radial-gradient(ellipse_at_center,transparent_22%,rgba(0,0,0,0.88))]" />
    </div>
  );
}

// ─── Welcome screen (empty DM state) ───────────────────────────────────────

export default function ChatPage() {
  return (
    <main className="relative isolate flex flex-1 flex-col overflow-hidden">
      <WelcomeBackdrop />

      <div className="relative z-10 flex flex-1 flex-col items-center justify-center px-6 py-10 text-center">
        {/* Hero: lock with pulsing rings */}
        <div className="relative mb-6 flex h-24 w-24 items-center justify-center">
          <span className="zv-ring absolute inset-0 rounded-3xl bg-indigo-500/20" />
          <span
            className="zv-ring absolute inset-0 rounded-3xl bg-purple-500/20"
            style={{ animationDelay: "1.2s" }}
          />
          <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl border border-indigo-500/20 bg-white/70 shadow-[0_18px_50px_-20px_rgba(99,102,241,0.6)] backdrop-blur-xl dark:border-indigo-400/20 dark:bg-white/[0.06]">
            <FiLock className="h-8 w-8 text-indigo-600 dark:text-indigo-400" />
          </div>
        </div>

        {/* Copy */}
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-white">
          Welcome to Zevra Chat
        </h1>
        <p className="mt-2 max-w-sm text-sm font-medium leading-relaxed text-zinc-600 dark:text-zinc-400">
          Select a conversation from the sidebar or start a new one.
        </p>

        {/* Rotating status line */}
        <StatusTicker
          messages={TICKER}
          className="mt-5 w-full max-w-xs"
          intervalMs={2600}
        />

        {/* E2E badge */}
        <div className="mt-5 inline-flex items-center gap-2 rounded-full border border-emerald-500/25 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-700 dark:text-emerald-400">
          <FiShield className="h-3.5 w-3.5" />
          End-to-end encrypted
        </div>

        {/* CTA */}
        <Link
          href="/about"
          className="mt-6 inline-flex items-center gap-2 rounded-full bg-indigo-600 px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-indigo-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500"
        >
          Learn More <FiArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </main>
  );
}
