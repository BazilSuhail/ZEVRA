"use client";

import { useEffect, useState } from "react";
import { useAuthStore } from "@/context/stores/auth-store";
import { useSocketStore } from "@/context/stores/socket-store";

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

// ─── Splash Screen ─────────────────────────────────────────────────────────

export function SplashLoader() {
  const [show, setShow] = useState(true);
  const [fadeOut, setFadeOut] = useState(false);

  const hydrated = useHydration();
  const authLoading = useAuthStore((s) => s.isLoading);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const isConnected = useSocketStore((s) => s.isConnected);

  // Determine if ready
  const authReady = !authLoading;
  const socketReady = !isAuthenticated || isConnected;
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

  return (
    <div
      className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-white transition-opacity duration-500 dark:bg-zinc-950 ${
        fadeOut ? "opacity-0" : "opacity-100"
      }`}
    >
      <LockSVG />
      <p className="mt-6 text-sm font-medium tracking-wide text-zinc-400 dark:text-zinc-500">
        <span className="inline-flex items-center gap-2">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-indigo-500" />
          {isAuthenticated ? "Syncing..." : "Loading..."}
        </span>
      </p>
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
