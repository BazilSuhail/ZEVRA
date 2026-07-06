"use client";

import Link from "next/link";
import { FiArrowRight, FiLock, FiShield } from "react-icons/fi";

export default function ChatPage() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center bg-[#fbfcfd] dark:bg-zinc-950">
      <div className="mx-auto max-w-lg space-y-6 px-6 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-100 dark:bg-indigo-900/30">
          <FiLock className="h-8 w-8 text-indigo-600 dark:text-indigo-400" />
        </div>
        <h1 className="text-2xl font-bold">Welcome to Zevra Chat</h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Select a conversation from the sidebar or start a new one.
        </p>
        <div className="flex items-center justify-center gap-2 text-xs text-emerald-600 dark:text-emerald-400">
          <FiShield className="h-3.5 w-3.5" />
          End-to-end encrypted
        </div>
        <Link
          href="/about"
          className="inline-flex items-center gap-2 rounded-full bg-indigo-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 transition-colors"
        >
          Learn More <FiArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}
