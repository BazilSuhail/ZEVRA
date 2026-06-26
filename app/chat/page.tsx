"use client";

import { motion } from "motion/react";
import Link from "next/link";
import { FiUserPlus, FiUsers, FiMessageSquare, FiShield, FiLock } from "react-icons/fi";
import { useAuth } from "@/context/useAuth";

export default function ChatHomePage() {
  const { user } = useAuth();

  return (
    <div className="flex flex-1 flex-col items-center justify-center bg-zinc-50 dark:bg-zinc-950">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="text-center"
      >
        {/* Avatar */}
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-100 dark:bg-indigo-900/30">
          <FiMessageSquare className="h-8 w-8 text-indigo-500" />
        </div>

        <h2 className="mb-2 text-2xl font-bold text-zinc-900 dark:text-white">
          Welcome, {user?.username || "Guest"}
        </h2>
        <p className="mb-8 text-sm text-zinc-500 dark:text-zinc-400">
          Start a conversation or create a group
        </p>

        {/* Action Cards */}
        <div className="flex flex-col gap-4 sm:flex-row">
          {/* New Chat */}
          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            <Link
              href="/chat/new"
              className="group flex items-center gap-4 rounded-2xl border border-zinc-200 bg-white px-6 py-5 text-left transition-all hover:border-indigo-300 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-indigo-700"
            >
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-indigo-100 transition-colors group-hover:bg-indigo-200 dark:bg-indigo-900/40 dark:group-hover:bg-indigo-800/50">
                <FiUserPlus className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
              </div>
              <div>
                <p className="font-semibold text-zinc-900 dark:text-white">New Chat</p>
                <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
                  Start a conversation with someone
                </p>
              </div>
            </Link>
          </motion.div>

          {/* New Group */}
          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            <Link
              href="/chat/new?group=true"
              className="group flex items-center gap-4 rounded-2xl border border-zinc-200 bg-white px-6 py-5 text-left transition-all hover:border-indigo-300 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-indigo-700"
            >
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-indigo-100 transition-colors group-hover:bg-indigo-200 dark:bg-indigo-900/40 dark:group-hover:bg-indigo-800/50">
                <FiUsers className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
              </div>
              <div>
                <p className="font-semibold text-zinc-900 dark:text-white">New Group</p>
                <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
                  Create a group conversation
                </p>
              </div>
            </Link>
          </motion.div>
        </div>

        {/* Encryption badge */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mt-8 inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-indigo-50 px-4 py-2 text-xs text-indigo-600 dark:border-indigo-800 dark:bg-indigo-900/20 dark:text-indigo-400"
        >
          <FiShield className="h-3.5 w-3.5" />
          End-to-end encrypted
          <FiLock className="h-3 w-3" />
        </motion.div>
      </motion.div>
    </div>
  );
}
