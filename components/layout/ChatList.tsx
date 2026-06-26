"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "motion/react";
import { FiUsers, FiSearch } from "react-icons/fi";

const channels = [
  { id: "1", name: "Alice Johnson", lastMessage: "Hey, how are you?", unread: 2, time: "2m", online: true },
  { id: "2", name: "Dev Team", lastMessage: "Sprint planning at 3pm", unread: 0, time: "15m", online: false, isGroup: true },
  { id: "3", name: "Bob Smith", lastMessage: "Check out this link", unread: 5, time: "1h", online: true },
  { id: "4", name: "Family Group", lastMessage: "Mom: Dinner tonight?", unread: 1, time: "3h", online: false, isGroup: true },
  { id: "5", name: "Carol Davis", lastMessage: "Thanks for the help!", unread: 0, time: "1d", online: false },
];

export default function ChatList() {
  const pathname = usePathname();

  return (
    <div className="flex h-full w-[300px] flex-col border-r border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
      <div className="border-b border-zinc-200 px-4 py-3 dark:border-zinc-800">
        <h2 className="mb-3 text-lg font-bold">Chats</h2>
        <div className="flex items-center gap-2 rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-800">
          <FiSearch className="h-4 w-4 text-zinc-400" />
          <input type="text" placeholder="Search chats..." className="flex-1 bg-transparent text-sm outline-none" />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {channels.map((ch, i) => (
          <motion.div
            key={ch.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.03 }}
          >
            <Link
              href={`/chat/channel/${ch.id}`}
              className={`flex items-center gap-3 border-b border-zinc-100 px-4 py-3 transition-colors hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-800/50 ${
                pathname === `/chat/channel/${ch.id}` ? "bg-emerald-50 dark:bg-emerald-900/10" : ""
              }`}
            >
              <div className="relative">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 text-sm font-bold text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400">
                  {ch.isGroup ? <FiUsers className="h-4 w-4" /> : ch.name[0]}
                </div>
                {!ch.isGroup && ch.online && (
                  <div className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-white bg-emerald-500 dark:border-zinc-900" />
                )}
              </div>
              <div className="flex-1 overflow-hidden">
                <div className="flex items-center justify-between">
                  <span className="truncate text-sm font-medium">{ch.name}</span>
                  <span className="shrink-0 text-xs text-zinc-400">{ch.time}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="truncate text-xs text-zinc-500 dark:text-zinc-400">{ch.lastMessage}</span>
                  {ch.unread > 0 && (
                    <span className="ml-2 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-[10px] font-bold text-white">
                      {ch.unread}
                    </span>
                  )}
                </div>
              </div>
            </Link>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
