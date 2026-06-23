"use client";

import { motion } from "motion/react";
import Sidebar from "@/components/layout/Sidebar";
import Link from "next/link";
import { FiMessageSquare, FiShield, FiLock } from "react-icons/fi";

export default function ChatHomePage() {
  return (
    <div className="flex h-screen flex-1 overflow-hidden">
      <Sidebar />
      <div className="flex flex-1 items-center justify-center bg-zinc-50 dark:bg-zinc-950">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center text-center"
        >
          <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/30">
            <FiMessageSquare className="h-10 w-10 text-emerald-500" />
          </div>
          <h2 className="mb-2 text-2xl font-bold">Welcome to Zevra</h2>
          <p className="mb-8 max-w-sm text-zinc-500 dark:text-zinc-400">
            Select a conversation from the sidebar or start a new chat
          </p>

          <div className="flex gap-4">
            <Link href="/chat/new">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="flex items-center gap-2 rounded-xl bg-emerald-600 px-6 py-3 text-sm font-semibold text-white hover:bg-emerald-700"
              >
                <FiMessageSquare className="h-4 w-4" />
                New Chat
              </motion.button>
            </Link>
            <Link href="/chat/new?group=true">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="flex items-center gap-2 rounded-xl border border-zinc-200 px-6 py-3 text-sm font-semibold dark:border-zinc-700"
              >
                New Group
              </motion.button>
            </Link>
          </div>

          <div className="mt-12 flex items-center gap-6 text-sm text-zinc-400">
            <div className="flex items-center gap-2">
              <FiShield className="h-4 w-4 text-emerald-500" />
              E2EE
            </div>
            <div className="flex items-center gap-2">
              <FiLock className="h-4 w-4 text-emerald-500" />
              Zero Knowledge
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
