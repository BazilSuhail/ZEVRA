"use client";

import Link from "next/link";
import { FiArrowLeft, FiLock, FiUser } from "react-icons/fi";

export default function DirectInfoPage() {
  return (
    <div className="flex flex-1 flex-col bg-[#fbfcfd] dark:bg-zinc-950">
      <header className="flex items-center gap-3 border-b border-zinc-200 bg-white px-5 py-5 dark:border-zinc-800 dark:bg-zinc-900">
        <Link href="/chat" className="rounded-lg p-2 text-zinc-400 hover:bg-zinc-100">
          <FiArrowLeft />
        </Link>
        <h1 className="font-bold">Conversation details</h1>
      </header>
      <div className="mx-auto w-full max-w-lg space-y-3 p-6">
        <div className="flex items-center gap-4 rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-100 font-bold text-amber-700">AM</div>
          <div>
            <p className="font-semibold">Ava Morgan</p>
            <p className="text-xs text-zinc-500">Direct conversation</p>
          </div>
        </div>
        <div className="flex items-center gap-3 rounded-xl bg-emerald-50 p-4 text-sm text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400">
          <FiLock /> Messages are simulated as end-to-end encrypted.
        </div>
        <div className="flex items-center gap-3 rounded-xl border border-zinc-200 bg-white p-4 text-sm dark:border-zinc-800 dark:bg-zinc-900">
          <FiUser className="text-zinc-400" /> No real participant data is loaded.
        </div>
      </div>
    </div>
  );
}
