"use client";

import Link from "next/link";
import { FiArrowRight, FiLock, FiMessageSquare, FiShield } from "react-icons/fi";

export default function ChatHomePage() {
  return <div className="flex flex-1 items-center justify-center bg-[#fbfcfd] p-6 dark:bg-zinc-950"><div className="max-w-lg text-center"><div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-100 text-indigo-600 dark:bg-indigo-950/50 dark:text-indigo-400"><FiMessageSquare className="h-8 w-8" /></div><p className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-indigo-500">Local prototype</p><h2 className="text-3xl font-bold tracking-tight">A quieter way to talk.</h2><p className="mx-auto mt-3 max-w-sm text-sm leading-6 text-zinc-500">Explore the interface with mock conversations. No account, server, or network connection is required.</p><Link href="/chat/dm/ava" className="mt-7 inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-200 hover:bg-indigo-700 dark:shadow-none">Open demo chat <FiArrowRight /></Link><div className="mt-8 flex justify-center gap-3 text-xs text-zinc-400"><span className="inline-flex items-center gap-1"><FiLock /> local messages</span><span className="inline-flex items-center gap-1"><FiShield /> simulated encryption</span></div></div></div>;
}
