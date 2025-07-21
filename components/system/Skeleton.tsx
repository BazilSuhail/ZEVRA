"use client";

// ─── Types ──────────────────────────────────────────────────────────────────

interface SkeletonProps {
  /** Tailwind size / shape classes, e.g. "h-10 w-10" or "h-3.5 w-32". */
  className?: string;
  /** Stagger the shimmer sweep (ms) for a left-to-right wave effect. */
  delay?: number;
}

// ─── Component ──────────────────────────────────────────────────────────────

/**
 * Shimmering placeholder bar. The sweep reuses the shared `zv-shimmer`
 * keyframes, so it stops automatically under `prefers-reduced-motion`.
 */
export default function Skeleton({ className = "", delay = 0 }: SkeletonProps) {
  return (
    <span
      aria-hidden
      className={`relative block overflow-hidden rounded-full bg-zinc-200/80 dark:bg-white/[0.07] ${className}`}
    >
      <span
        className="zv-shimmer absolute inset-0 bg-gradient-to-r from-transparent via-white/70 to-transparent dark:via-white/10 motion-reduce:opacity-0"
        style={{ animationDelay: `${delay}ms` }}
      />
    </span>
  );
}
