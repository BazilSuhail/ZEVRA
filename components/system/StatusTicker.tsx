"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";

// ─── Types ──────────────────────────────────────────────────────────────────

interface StatusTickerProps {
  messages: string[];
  /** Milliseconds each message stays on screen. */
  intervalMs?: number;
  className?: string;
}

// ─── Component ──────────────────────────────────────────────────────────────

/** Cycles through status messages with a soft slide/blur transition. */
export default function StatusTicker({
  messages,
  intervalMs = 2800,
  className = "",
}: StatusTickerProps) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (messages.length <= 1) return;
    const id = setInterval(
      () => setIndex((i) => (i + 1) % messages.length),
      intervalMs,
    );
    return () => clearInterval(id);
  }, [messages.length, intervalMs]);

  if (messages.length === 0) return null;

  return (
    <div className={`relative h-6 overflow-hidden ${className}`}>
      <AnimatePresence mode="wait">
        <motion.span
          key={index}
          initial={{ y: 14, opacity: 0, filter: "blur(4px)" }}
          animate={{ y: 0, opacity: 1, filter: "blur(0px)" }}
          exit={{ y: -14, opacity: 0, filter: "blur(4px)" }}
          transition={{ duration: 0.32, ease: "easeOut" }}
          className="absolute inset-0 flex items-center justify-center gap-2 text-center"
        >
          <span className="h-1.5 w-1.5 shrink-0 animate-pulse rounded-full bg-purple-500 dark:bg-purple-400" />
          <span className="truncate text-xs font-medium tracking-wide text-purple-600/90 dark:text-purple-300/80">
            {messages[index]}
          </span>
        </motion.span>
      </AnimatePresence>
    </div>
  );
}
