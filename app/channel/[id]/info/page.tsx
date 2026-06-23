"use client";

import { motion } from "motion/react";
import Sidebar from "@/components/Sidebar";
import { FiUsers, FiSettings, FiArchive, FiTrash2 } from "react-icons/fi";

const members = [
  { id: "1", name: "Alice Johnson", role: "Admin", joined: "Jan 2024" },
  { id: "2", name: "Bob Smith", role: "Member", joined: "Feb 2024" },
  { id: "3", name: "Carol Davis", role: "Member", joined: "Mar 2024" },
  { id: "4", name: "You", role: "Member", joined: "Jan 2024" },
];

export default function GroupInfoPage() {
  return (
    <div className="flex h-screen flex-1 overflow-hidden">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-y-auto">
        <div className="border-b border-zinc-200 bg-white px-6 py-4 dark:border-zinc-800 dark:bg-zinc-900">
          <h1 className="text-xl font-bold">Dev Team</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">4 members</p>
        </div>

        <div className="flex-1 px-6 py-6">
          <div className="mx-auto max-w-2xl space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900"
            >
              <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold">
                <FiUsers className="h-5 w-5 text-emerald-500" />
                Members
              </h2>
              <div className="space-y-3">
                {members.map((m, i) => (
                  <motion.div
                    key={m.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="flex items-center justify-between rounded-xl bg-zinc-50 p-3 dark:bg-zinc-800"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 font-bold text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400">
                        {m.name[0]}
                      </div>
                      <div>
                        <p className="font-medium">{m.name}</p>
                        <p className="text-xs text-zinc-500 dark:text-zinc-400">Joined {m.joined}</p>
                      </div>
                    </div>
                    <span className="rounded-full bg-zinc-200 px-3 py-1 text-xs font-medium dark:bg-zinc-700">
                      {m.role}
                    </span>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900"
            >
              <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold">
                <FiSettings className="h-5 w-5 text-emerald-500" />
                Settings
              </h2>
              <div className="space-y-3">
                <motion.button
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  className="flex w-full items-center gap-3 rounded-xl border border-zinc-200 px-4 py-3 text-sm font-medium transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-800"
                >
                  <FiArchive className="h-5 w-5 text-zinc-400" />
                  Archive Group
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  className="flex w-full items-center gap-3 rounded-xl border border-red-200 px-4 py-3 text-sm font-medium text-red-600 transition-colors hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-900/20"
                >
                  <FiTrash2 className="h-5 w-5" />
                  Leave Group
                </motion.button>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
