"use client";

import { motion } from "motion/react";
import type { CSSProperties, ReactNode } from "react";

// ─── Types ──────────────────────────────────────────────────────────────────

interface GridBackdropProps {
  /** Extra classes for the outer positioning container. */
  className?: string;
  children?: ReactNode;
}

// ─── Shared styles ──────────────────────────────────────────────────────────

/** Radial mask so the grid fades toward the edges ("grid gradient"). */
const GRID_MASK: CSSProperties = {
  maskImage:
    "radial-gradient(ellipse 75% 65% at 50% 45%, #000 25%, transparent 82%)",
  WebkitMaskImage:
    "radial-gradient(ellipse 75% 65% at 50% 45%, #000 25%, transparent 82%)",
};

const GRID_IMAGE =
  "linear-gradient(to right, var(--grid-line) 1px, transparent 1px), " +
  "linear-gradient(to bottom, var(--grid-line) 1px, transparent 1px)";

const DOTS_IMAGE =
  "radial-gradient(var(--grid-line-2) 1px, transparent 1px)";

/** Floating encrypted-looking packets rendered behind the content. */
const PACKETS = [
  { text: "a9f3…sealed", pos: "left-[7%] top-[16%]", delay: 0 },
  { text: "ws ▸ no route", pos: "right-[8%] top-[22%]", delay: 1.6 },
  { text: "retry · backoff", pos: "left-[12%] bottom-[20%]", delay: 0.8 },
  { text: "sha-256 ✓", pos: "right-[11%] bottom-[26%]", delay: 2.4 },
];

// ─── Floating packets (decorative) ──────────────────────────────────────────

export function FloatingPackets() {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 hidden overflow-hidden md:block"
    >
      {PACKETS.map((p) => (
        <motion.div
          key={p.text}
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: [0, 1, 1, 0], y: [24, 0, -20, -44] }}
          transition={{
            duration: 9,
            repeat: Infinity,
            delay: p.delay,
            ease: "easeInOut",
          }}
          className={`absolute rounded-full border border-purple-500/25 bg-white/60 px-3 py-1.5 font-mono text-[10px] tracking-wide text-purple-700 backdrop-blur-md dark:border-purple-400/20 dark:bg-purple-950/40 dark:text-purple-200/80 ${p.pos}`}
        >
          {p.text}
        </motion.div>
      ))}
    </div>
  );
}

// ─── Backdrop ───────────────────────────────────────────────────────────────

/**
 * Full-bleed layered backdrop built with absolute layers inside a relative
 * container: gradient washes → drifting gradient grid (radial-masked) →
 * blurred orbs → scan line. Light/dark aware via `--grid-line*` vars.
 */
export default function GridBackdrop({ className = "", children }: GridBackdropProps) {
  return (
    <div
      className={`relative isolate flex flex-col overflow-hidden bg-[#faf9ff] dark:bg-[#07050a] ${className}`}
    >
      {/* Layer 1 — gradient washes */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(168,85,247,0.16),transparent_58%)] dark:bg-[radial-gradient(ellipse_at_top,rgba(124,58,237,0.28),transparent_60%)]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,rgba(99,102,241,0.14),transparent_52%)] dark:bg-[radial-gradient(ellipse_at_bottom_right,rgba(79,70,229,0.22),transparent_55%)]"
      />

      {/* Layer 2 — fine dot grid (counter-drift) */}
      <div
        aria-hidden
        className="zv-grid-lines-rev pointer-events-none absolute inset-0 opacity-70"
        style={{ backgroundImage: DOTS_IMAGE, backgroundSize: "26px 26px" }}
      />

      {/* Layer 3 — gradient grid, masked to fade at the edges */}
      <div
        aria-hidden
        className="zv-grid-lines pointer-events-none absolute inset-0"
        style={{
          backgroundImage: GRID_IMAGE,
          backgroundSize: "44px 44px",
          ...GRID_MASK,
        }}
      />

      {/* Layer 4 — floating gradient orbs */}
      <div
        aria-hidden
        className="zv-float pointer-events-none absolute -left-28 top-[8%] h-72 w-72 rounded-full bg-purple-400/30 blur-[90px] dark:bg-purple-600/25 sm:h-96 sm:w-96"
        style={{ animationDuration: "13s" }}
      />
      <div
        aria-hidden
        className="zv-float pointer-events-none absolute -right-24 top-[38%] h-64 w-64 rounded-full bg-indigo-400/25 blur-[90px] dark:bg-indigo-600/25 sm:h-80 sm:w-80"
        style={{ animationDuration: "17s", animationDelay: "2s" }}
      />
      <div
        aria-hidden
        className="zv-float pointer-events-none absolute bottom-[-10%] left-[30%] h-56 w-56 rounded-full bg-fuchsia-400/20 blur-[90px] dark:bg-fuchsia-600/20"
        style={{ animationDuration: "15s", animationDelay: "4s" }}
      />

      {/* Layer 5 — scan line sweeping down */}
      <div
        aria-hidden
        className="zv-scan pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-purple-500/70 to-transparent"
      />

      {/* Layer 6 — vignette */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_45%,rgba(124,58,237,0.10))] dark:bg-[radial-gradient(ellipse_at_center,transparent_38%,rgba(0,0,0,0.5))]"
      />

      {/* Content */}
      <div className="relative z-10 flex flex-1 flex-col">{children}</div>
    </div>
  );
}
