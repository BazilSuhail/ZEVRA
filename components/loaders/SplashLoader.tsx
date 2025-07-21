"use client";

import { useEffect, useState } from "react";
import { useAuthStore } from "@/context/stores/auth-store";
import { useSocketStore } from "@/context/stores/socket-store";
import GridBackdrop, { FloatingPackets } from "@/components/system/GridBackdrop";
import StatusTicker from "@/components/system/StatusTicker";

// ─── SVG Animation ─────────────────────────────────────────────────────────

function LockSVG() {
  return (
    <svg
      width="80"
      height="80"
      viewBox="0 0 80 80"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="animate-pulse"
    >
      {/* Shield outline */}
      <path
        d="M40 8L16 18V36C16 52.5 26.2 67.8 40 72C53.8 67.8 64 52.5 64 36V18L40 8Z"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="text-indigo-500"
        strokeDasharray="200"
        strokeDashoffset="200"
      >
        <animate
          attributeName="stroke-dashoffset"
          from="200"
          to="0"
          dur="1.2s"
          fill="freeze"
          calcMode="spline"
          keySplines="0.4 0 0.2 1"
        />
      </path>

      {/* Shield fill (fades in) */}
      <path
        d="M40 8L16 18V36C16 52.5 26.2 67.8 40 72C53.8 67.8 64 52.5 64 36V18L40 8Z"
        className="fill-indigo-500/10"
        opacity="0"
      >
        <animate
          attributeName="opacity"
          from="0"
          to="1"
          dur="0.6s"
          begin="0.8s"
          fill="freeze"
        />
      </path>

      {/* Lock body */}
      <rect
        x="30"
        y="36"
        width="20"
        height="16"
        rx="3"
        className="fill-indigo-500"
        opacity="0"
      >
        <animate
          attributeName="opacity"
          from="0"
          to="1"
          dur="0.4s"
          begin="1s"
          fill="freeze"
        />
      </rect>

      {/* Lock shackle */}
      <path
        d="M33 36V30C33 26.7 36.1 24 40 24C43.9 24 47 26.7 47 30V36"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        className="text-indigo-500"
        fill="none"
        strokeDasharray="40"
        strokeDashoffset="40"
      >
        <animate
          attributeName="stroke-dashoffset"
          from="40"
          to="0"
          dur="0.5s"
          begin="1.2s"
          fill="freeze"
          calcMode="spline"
          keySplines="0.4 0 0.2 1"
        />
      </path>

      {/* Keyhole */}
      <circle cx="40" cy="43" r="2" className="fill-white" opacity="0">
        <animate
          attributeName="opacity"
          from="0"
          to="1"
          dur="0.3s"
          begin="1.5s"
          fill="freeze"
        />
      </circle>
      <rect x="39" y="43" width="2" height="4" rx="1" className="fill-white" opacity="0">
        <animate
          attributeName="opacity"
          from="0"
          to="1"
          dur="0.3s"
          begin="1.5s"
          fill="freeze"
        />
      </rect>

      {/* Pulse ring */}
      <circle
        cx="40"
        cy="40"
        r="36"
        stroke="currentColor"
        strokeWidth="1"
        className="text-indigo-400"
        fill="none"
        opacity="0"
      >
        <animate
          attributeName="r"
          from="30"
          to="42"
          dur="1.5s"
          begin="1.6s"
          repeatCount="indefinite"
        />
        <animate
          attributeName="opacity"
          values="0.6;0"
          dur="1.5s"
          begin="1.6s"
          repeatCount="indefinite"
        />
      </circle>
    </svg>
  );
}

// ─── Rotating status messages ──────────────────────────────────────────────

const SYNC_TICKER = [
  "Syncing encrypted threads…",
  "Deriving session keys…",
  "Restoring local message cache…",
  "Negotiating the secure channel…",
];

const BOOT_TICKER = [
  "Loading zero-knowledge runtime…",
  "Preparing secure storage…",
  "Verifying device identity…",
  "Initializing Zevra…",
];

// ─── Splash Screen ─────────────────────────────────────────────────────────

export function SplashLoader() {
  const [show, setShow] = useState(true);
  const [fadeOut, setFadeOut] = useState(false);

  const hydrated = useHydration();
  const authLoading = useAuthStore((s) => s.isLoading);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const isConnected = useSocketStore((s) => s.isConnected);
  const connectionError = useSocketStore((s) => s.connectionError);

  // Determine if ready — a connection failure also ends the wait so the
  // full-screen connection error can take over instead of hanging forever.
  const authReady = !authLoading;
  const socketReady = !isAuthenticated || isConnected || Boolean(connectionError);
  const ready = hydrated && authReady && socketReady;

  useEffect(() => {
    if (ready) {
      // Start fade out, then remove from DOM
      const fadeTimer = setTimeout(() => setFadeOut(true), 200);
      const removeTimer = setTimeout(() => setShow(false), 600);
      return () => {
        clearTimeout(fadeTimer);
        clearTimeout(removeTimer);
      };
    }
  }, [ready]);

  if (!show) return null;

  const ticker = isAuthenticated ? SYNC_TICKER : BOOT_TICKER;

  return (
    <div
      className={`fixed inset-0 z-[9999] transition-opacity duration-500 ${
        fadeOut ? "opacity-0" : "opacity-100"
      }`}
    >
      <GridBackdrop className="h-full w-full">
        <FloatingPackets />

        <div className="flex flex-1 flex-col items-center justify-center px-6 text-center">
          {/* Hero: animated lock with pulsing rings */}
          <div className="relative mb-6 flex h-24 w-24 items-center justify-center">
            <span
              aria-hidden
              className="zv-ring absolute inset-0 rounded-3xl bg-indigo-500/20"
            />
            <span
              aria-hidden
              className="zv-ring absolute inset-0 rounded-3xl bg-purple-500/20"
              style={{ animationDelay: "1.2s" }}
            />
            <div className="relative flex h-20 w-20 items-center justify-center rounded-3xl border border-indigo-500/20 bg-white/70 shadow-[0_18px_50px_-20px_rgba(99,102,241,0.6)] backdrop-blur-xl dark:border-indigo-400/20 dark:bg-white/[0.06]">
              <LockSVG />
            </div>
          </div>

          {/* Wordmark */}
          <h1 className="text-lg font-semibold tracking-[0.42em] text-zinc-800 dark:text-purple-50">
            ZEVRA
          </h1>
          <p className="mt-1.5 font-mono text-[10px] uppercase tracking-[0.3em] text-purple-600/80 dark:text-purple-300/60">
            Zero-knowledge relay
          </p>

          {/* Rotating status messages */}
          <StatusTicker messages={ticker} className="mt-6 w-full max-w-xs" intervalMs={2400} />

          {/* Shimmer progress bar */}
          <div className="mt-5 h-1.5 w-52 overflow-hidden rounded-full bg-purple-500/15">
            <div className="zv-shimmer h-full w-1/3 rounded-full bg-gradient-to-r from-purple-500 via-indigo-500 to-purple-500" />
          </div>

          {/* Static status line */}
          <p className="mt-5 text-[11px] font-semibold uppercase tracking-[0.25em] text-zinc-400 dark:text-zinc-500">
            {isAuthenticated ? "Syncing sessions" : "Booting secure session"}
          </p>
        </div>
      </GridBackdrop>
    </div>
  );
}

// ─── Hydration Hook (same as providers.tsx but exported) ───────────────────

function useHydration() {
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const unsub = useAuthStore.persist.onFinishHydration(() => {
      setHydrated(true);
    });

    useAuthStore.persist.rehydrate();

    if (useAuthStore.persist.hasHydrated()) {
      setHydrated(true);
    }

    return unsub;
  }, []);

  return hydrated;
}
