"use client";

import { motion } from "motion/react";
import { FiSmile } from "react-icons/fi";
import type { MessageReaction } from "@/lib/db";

// Quick-pick reaction emojis (no external picker dependency)
const QUICK_EMOJIS = ["👍", "❤️", "😂", "😮", "😢", "😡", "🙏", "🔥"];

interface ReactionGroup {
  emoji: string;
  count: number;
  users: string[];
  mine: boolean;
}

function groupReactions(list: MessageReaction[] | undefined, meId: string | undefined): ReactionGroup[] {
  if (!list || list.length === 0) return [];
  const map = new Map<string, ReactionGroup>();
  for (const r of list) {
    const g = map.get(r.emoji) || { emoji: r.emoji, count: 0, users: [], mine: false };
    g.count += 1;
    g.users.push(r.username || "Someone");
    if (meId && r.userId === meId) g.mine = true;
    map.set(r.emoji, g);
  }
  return Array.from(map.values());
}

interface MessageReactionsProps {
  messageId: string;
  isMine: boolean;
  /** false for deleted / unsent messages — chips still render, picking is disabled */
  canReact: boolean;
  reactions: MessageReaction[] | undefined;
  meId: string | undefined;
  pickerOpen: boolean;
  onPickerOpenChange: (open: boolean) => void;
  onToggle: (messageId: string, emoji: string) => void;
}

/**
 * Hover quick-react button, emoji picker popover and reaction chips.
 * Render inside the message's `group relative` wrapper, after the bubble.
 */
export default function MessageReactions({
  messageId,
  isMine,
  canReact,
  reactions,
  meId,
  pickerOpen,
  onPickerOpenChange,
  onToggle,
}: MessageReactionsProps) {
  const groups = groupReactions(reactions, meId);

  const pick = (emoji: string) => {
    onPickerOpenChange(false);
    onToggle(messageId, emoji);
  };

  return (
    <>
      {/* Hover quick-react — on the inner side of the bubble so it never
          overflows the viewport */}
      {canReact && (
        <button
          type="button"
          aria-label="Add reaction"
          onClick={() => onPickerOpenChange(!pickerOpen)}
          className={`absolute top-1/2 z-30 grid h-7 w-7 -translate-y-1/2 place-items-center rounded-full border border-zinc-200 bg-white text-zinc-400 opacity-0 shadow-sm transition-all duration-150 hover:scale-110 hover:text-indigo-600 focus-visible:scale-110 focus-visible:opacity-100 group-hover:opacity-100 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-500 dark:hover:text-indigo-400 ${
            isMine ? "right-full mr-1" : "left-full ml-1"
          }`}
        >
          <FiSmile className="h-3.5 w-3.5" />
        </button>
      )}

      {/* Emoji picker popover */}
      {canReact && pickerOpen && (
        <>
          <div className="fixed inset-0 z-20" onClick={() => onPickerOpenChange(false)} />
          <motion.div
            initial={{ opacity: 0, y: 6, scale: 0.92 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ type: "spring", damping: 24, stiffness: 420 }}
            className={`absolute bottom-full z-40 mb-2 grid grid-cols-9 gap-x-7.5 gap-y-1.5 rounded-2xl border border-zinc-200 bg-white p-2 shadow-xl sm:grid-cols-9 dark:border-zinc-700 dark:bg-zinc-900 ${
              isMine ? "right-0" : "left-0"
            }`}
          >
            {QUICK_EMOJIS.map((emoji) => (
              <button
                key={emoji}
                type="button"
                aria-label={`React with ${emoji}`}
                onClick={() => pick(emoji)}
                className="grid h-9 w-9 place-items-center rounded-xl text-lg leading-none transition-transform hover:scale-110 hover:bg-zinc-100 dark:hover:bg-zinc-800"
              >
                {emoji}
              </button>
            ))}
          </motion.div>
        </>
      )}

      {/* Reaction chips */}
      {groups.length > 0 && (
        <div className={`relative z-30 mt-1.5 flex flex-wrap gap-1 ${isMine ? "justify-end" : ""}`}>
          {groups.map((g) => (
            <button
              key={g.emoji}
              type="button"
              title={g.users.join(", ")}
              disabled={!canReact}
              onClick={() => onToggle(messageId, g.emoji)}
              className={`inline-flex items-center gap-1 rounded-full border px-1.5 py-0.5 text-[11px] font-medium transition-all enabled:hover:scale-105 ${
                g.mine
                  ? "border-indigo-300 bg-indigo-50 text-indigo-700 dark:border-indigo-500/40 dark:bg-indigo-500/15 dark:text-indigo-300"
                  : "border-zinc-200 bg-white text-zinc-600 hover:border-zinc-300 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:border-zinc-600"
              }`}
            >
              <span className="text-sm leading-none">{g.emoji}</span>
              {g.count > 1 && <span>{g.count}</span>}
            </button>
          ))}
        </div>
      )}
    </>
  );
}
