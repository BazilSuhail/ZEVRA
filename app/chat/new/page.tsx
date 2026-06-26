"use client";

import { motion } from "motion/react";
import { FiSearch, FiUserPlus, FiUsers, FiArrowLeft } from "react-icons/fi";
import { useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

const users = [
  { id: "1", name: "David Wilson", email: "david@example.com", status: "online" },
  { id: "2", name: "Emma Brown", email: "emma@example.com", status: "offline" },
  { id: "3", name: "Frank Miller", email: "frank@example.com", status: "online" },
  { id: "4", name: "Grace Lee", email: "grace@example.com", status: "offline" },
  { id: "5", name: "Henry Taylor", email: "henry@example.com", status: "online" },
];

export default function NewChatPage() {
  const [query, setQuery] = useState("");
  const searchParams = useSearchParams();
  const isGroup = searchParams.get("group") === "true";
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);

  const filtered = users.filter(
    (u) => u.name.toLowerCase().includes(query.toLowerCase()) || u.email.toLowerCase().includes(query.toLowerCase())
  );

  const toggleUser = (id: string) => {
    setSelectedUsers((prev) => (prev.includes(id) ? prev.filter((u) => u !== id) : [...prev, id]));
  };

  return (
    <div className="flex flex-1 flex-col">
      <div className="border-b border-zinc-200 bg-white px-6 py-4 dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex items-center gap-3">
          <Link href="/chat" className="rounded-lg p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800">
            <FiArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-xl font-bold">{isGroup ? "New Group" : "New Chat"}</h1>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">{isGroup ? "Create a group conversation" : "Find and start a conversation"}</p>
          </div>
        </div>
      </div>

      {isGroup && (
        <div className="border-b border-zinc-200 bg-white px-6 py-3 dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex items-center gap-3">
            <FiUsers className="h-5 w-5 text-zinc-400" />
            <input type="text" placeholder="Group name..." className="flex-1 bg-transparent text-sm outline-none" />
          </div>
        </div>
      )}

      <div className="px-6 py-4">
        <div className="flex items-center gap-2 rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 dark:border-zinc-700 dark:bg-zinc-800">
          <FiSearch className="h-4 w-4 text-zinc-400" />
          <input type="text" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search by name or email..." className="flex-1 bg-transparent text-sm outline-none" />
        </div>
      </div>

      {isGroup && selectedUsers.length > 0 && (
        <div className="px-6 pb-3">
          <div className="flex flex-wrap gap-2">
            {selectedUsers.map((id) => {
              const user = users.find((u) => u.id === id);
              return user ? (
                <motion.span key={id} initial={{ scale: 0 }} animate={{ scale: 1 }} className="flex items-center gap-1 rounded-full bg-emerald-100 px-3 py-1 text-xs font-medium text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                  {user.name}
                  <button onClick={() => toggleUser(id)} className="ml-1 hover:text-emerald-900">×</button>
                </motion.span>
              ) : null;
            })}
          </div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto px-6">
        {filtered.map((user, i) => (
          <motion.div key={user.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
            className={`flex items-center justify-between rounded-xl px-4 py-3 transition-colors ${selectedUsers.includes(user.id) ? "bg-emerald-50 dark:bg-emerald-900/20" : "hover:bg-zinc-50 dark:hover:bg-zinc-800/50"}`}>
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 font-bold text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400">{user.name[0]}</div>
                <div className={`absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white dark:border-zinc-900 ${user.status === "online" ? "bg-emerald-500" : "bg-zinc-300"}`} />
              </div>
              <div>
                <p className="font-medium">{user.name}</p>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">{user.email}</p>
              </div>
            </div>
            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => isGroup ? toggleUser(user.id) : null}
              className={`rounded-lg p-2 ${selectedUsers.includes(user.id) ? "bg-emerald-600 text-white" : "bg-emerald-600 text-white hover:bg-emerald-700"}`}>
              {isGroup ? <FiUsers className="h-4 w-4" /> : <FiUserPlus className="h-4 w-4" />}
            </motion.button>
          </motion.div>
        ))}
      </div>

      {isGroup && selectedUsers.length > 0 && (
        <div className="border-t border-zinc-200 bg-white px-6 py-4 dark:border-zinc-800 dark:bg-zinc-900">
          <motion.button whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }} className="w-full rounded-xl bg-emerald-600 py-3 text-sm font-semibold text-white hover:bg-emerald-700">
            Create Group ({selectedUsers.length} members)
          </motion.button>
        </div>
      )}
    </div>
  );
}
