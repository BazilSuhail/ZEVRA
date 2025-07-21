"use client";

import type { ReactNode } from "react";
import { motion } from "motion/react";
import GridBackdrop, { FloatingPackets } from "@/components/system/GridBackdrop";
import StatusTicker from "@/components/system/StatusTicker";

// ─── Types ──────────────────────────────────────────────────────────────────

interface ErrorShellProps {
  /** Small uppercase pill above the title, e.g. "CONNECTION LOST". */
  badge: string;
  /** Badge tone — drives red/amber/purple accent colors. */
  tone?: "danger" | "warning" | "brand";
  title: string;
  description: string;
  /** Monospace detail line (raw error message, digest, …). Never a URL. */
  details?: string | null;
  /** Rotating status messages under the description. */
  ticker?: string[];
  /** Icon rendered in the hero badge. */
  icon?: ReactNode;
  /** Action buttons row. */
  actions?: ReactNode;
  /** Monospace footer line. */
  footer?: string;
  /** Outer container classes (min-height / fixed sizing). */
  className?: string;
}

// ─── Tone styles ────────────────────────────────────────────────────────────

const TONES = {
  danger: {
    pill: "border-red-500/30 bg-red-500/10 text-red-600 dark:text-red-400",
    dot: "bg-red-500 dark:bg-red-400",
    icon: "from-red-500 to-orange-500 shadow-red-500/30",
    ring: "bg-red-500/20",
  },
  warning: {
    pill: "border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400",
    dot: "bg-amber-500 dark:bg-amber-400",
    icon: "from-amber-500 to-orange-500 shadow-amber-500/30",
    ring: "bg-amber-500/20",
  },
  brand: {
    pill: "border-purple-500/30 bg-purple-500/10 text-purple-600 dark:text-purple-300",
    dot: "bg-purple-500 dark:bg-purple-400",
    icon: "from-purple-600 to-indigo-600 shadow-purple-600/30",
    ring: "bg-purple-500/20",
  },
} as const;

// ─── Component ──────────────────────────────────────────────────────────────

/**
 * Full-screen themed error layout: grid backdrop, animated hero icon,
 * badge/title/description, rotating status line, details, actions.
 * Content sits directly on the backdrop (no card) and is fully centered.
 * Used by the connection-error overlay, `app/error.tsx` and global-error.
 *
 * Typography rule: font weight never exceeds `semibold` (600).
 */
export default function ErrorShell({
  badge,
  tone = "danger",
  title,
  description,
  details,
  ticker,
  icon,
  actions,
  footer,
  className = "",
}: ErrorShellProps) {
  const t = TONES[tone];

  return (
    <GridBackdrop className={`min-h-screen w-full ${className}`}>
      <FloatingPackets />

      <div className="flex flex-1 flex-col items-center justify-center px-6 py-14 text-center">
        <motion.div
          initial={{ opacity: 0, y: 26, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
          className="flex w-full max-w-[560px] flex-col items-center"
        >
          {/* Hero icon with pulsing rings */}
          <div className="relative mb-7 flex h-24 w-24 items-center justify-center">
            <span
              aria-hidden
              className={`zv-ring absolute inset-0 rounded-3xl ${t.ring}`}
            />
            <span
              aria-hidden
              className="zv-ring absolute inset-0 rounded-3xl bg-purple-500/20"
              style={{ animationDelay: "1.2s" }}
            />
            <div
              className={`relative flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br ${t.icon} text-white shadow-lg`}
            >
              {icon}
            </div>
          </div>

          {/* Badge */}
          <span
            className={`mb-4 inline-flex items-center gap-2 rounded-full border px-3.5 py-1 text-[10px] font-semibold uppercase tracking-[0.22em] ${t.pill}`}
          >
            <span className={`h-1.5 w-1.5 animate-pulse rounded-full ${t.dot}`} />
            {badge}
          </span>

          {/* Title + description */}
          <h1 className="text-3xl font-semibold leading-tight tracking-tight text-zinc-900 sm:text-4xl dark:text-white">
            {title}
          </h1>
          <p className="mt-3 max-w-[46ch] text-sm font-medium leading-relaxed text-zinc-600 dark:text-zinc-400">
            {description}
          </p>

          {/* Rotating status line */}
          {ticker && ticker.length > 0 && (
            <StatusTicker messages={ticker} className="mt-6 w-full max-w-sm" />
          )}

          {/* Raw details — plain centered text, no box, no URL */}
          {details && (
            <p className="mt-5 max-w-full overflow-x-auto font-mono text-[11px] leading-relaxed break-words text-zinc-500 dark:text-purple-300/60">
              {details}
            </p>
          )}

          {/* Actions */}
          {actions && (
            <div className="mt-8 flex w-full flex-wrap items-center justify-center gap-3">
              {actions}
            </div>
          )}

          {/* Footer */}
          {footer && (
            <p className="mt-8 font-mono text-[10px] font-medium uppercase tracking-[0.2em] text-zinc-400 dark:text-purple-300/50">
              {footer}
            </p>
          )}
        </motion.div>
      </div>
    </GridBackdrop>
  );
}
