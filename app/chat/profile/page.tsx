"use client";

import { motion } from "motion/react";
import { FiShield, FiKey, FiCalendar, FiEdit2 } from "react-icons/fi";

export default function ProfilePage() {
  return (
    <div className="flex flex-1 flex-col overflow-y-auto">
      <div className="border-b border-zinc-200 bg-white px-6 py-4 dark:border-zinc-800 dark:bg-zinc-900">
        <h1 className="text-xl font-bold">Profile</h1>
      </div>
      <div className="flex-1 px-6 py-6">
        <div className="mx-auto max-w-2xl">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl border border-zinc-200 bg-white p-8 dark:border-zinc-800 dark:bg-zinc-900">
            <div className="mb-6 flex items-center gap-6">
              <div className="flex h-24 w-24 items-center justify-center rounded-full bg-emerald-100 text-4xl font-bold text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400">Y</div>
              <div>
                <h2 className="text-2xl font-bold">You</h2>
                <p className="text-zinc-500 dark:text-zinc-400">you@example.com</p>
                <div className="mt-2 flex items-center gap-2 text-sm text-emerald-500"><FiShield className="h-4 w-4" />Verified</div>
              </div>
            </div>
            <div className="space-y-4">
              <div className="flex items-center gap-3 rounded-xl bg-zinc-50 p-4 dark:bg-zinc-800">
                <FiCalendar className="h-5 w-5 text-zinc-400" />
                <div>
                  <p className="text-sm text-zinc-500 dark:text-zinc-400">Joined</p>
                  <p className="font-medium">January 15, 2024</p>
                </div>
              </div>
              <div className="rounded-xl bg-zinc-50 p-4 dark:bg-zinc-800">
                <div className="mb-2 flex items-center gap-2"><FiKey className="h-5 w-5 text-zinc-400" /><p className="text-sm text-zinc-500 dark:text-zinc-400">Public Key</p></div>
                <p className="break-all font-mono text-xs text-zinc-700 dark:text-zinc-300">05a4 82f3 b1c9 d4e7 6f02 a835 91c6 7d4e</p>
              </div>
            </div>
            <motion.button whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }} className="mt-6 flex items-center gap-2 rounded-xl bg-emerald-600 px-6 py-3 text-sm font-semibold text-white hover:bg-emerald-700">
              <FiEdit2 className="h-4 w-4" />Edit Profile
            </motion.button>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
