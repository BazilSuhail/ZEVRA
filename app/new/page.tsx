"use client";

import { motion } from "motion/react";
import Sidebar from "@/components/Sidebar";
import { FiSearch, FiUserPlus } from "react-icons/fi";
import { useState } from "react";

const users = [
  { id: "1", name: "David Wilson", email: "david@example.com", status: "online" },
  { id: "2", name: "Emma Brown", email: "emma@example.com", status: "offline" },
  { id: "3", name: "Frank Miller", email: "frank@example.com", status: "online" },
  { id: "4", name: "Grace Lee", email: "grace@example.com", status: "offline" },
  { id: "5", name: "Henry Taylor", email: "henry@example.com", status: "online" },
];

export default function NewChatPage() {
  const [query, setQuery] = useState("");

  const filtered = users.filter(
    (u) => u.name.toLowerCase().includes(query.toLowerCase()) || u.email.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="flex h-screen flex-1 overflow-hidden">
      <Sidebar />
      <div className="flex flex-1 flex-col">
        <div className="border-b border-zinc-200 bg-white px-6 py-4 dark:border-zinc-800 dark:bg-zinc-900">
          <h1 className="text-xl font-bold">New Chat</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">Find and start a conversation</p>
        </div>

        <div className="px-6 py-4">
          <div className="flex items-center gap-2 rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 dark:border-zinc-700 dark:bg-zinc-800">
            <FiSearch className="h-4 w-4 text-zinc-400" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by name or email..."
              className="flex-1 bg-transparent text-sm outline-none"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-6">
          {filtered.map((user, i) => (
            <motion.div
              key={user.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="flex items-center justify-between rounded-xl px-4 py-3 transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
            >
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 font-bold text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400">
                    {user.name[0]}
                  </div>
                  <div
                    className={`absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white dark:border-zinc-900 ${
                      user.status === "online" ? "bg-emerald-500" : "bg-zinc-300"
                    }`}
                  />
                </div>
                <div>
                  <p className="font-medium">{user.name}</p>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">{user.email}</p>
                </div>
              </div>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="rounded-lg bg-emerald-600 p-2 text-white hover:bg-emerald-700"
              >
                <FiUserPlus className="h-4 w-4" />
              </motion.button>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
