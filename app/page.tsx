"use client";

import { motion } from "motion/react";
import Sidebar from "@/components/Sidebar";
import Link from "next/link";

const channels = [
  { id: "1", name: "Alice Johnson", lastMessage: "Hey, how are you?", unread: 2, time: "2m", online: true },
  { id: "2", name: "Dev Team", lastMessage: "Sprint planning at 3pm", unread: 0, time: "15m", online: false },
  { id: "3", name: "Bob Smith", lastMessage: "Check out this link", unread: 5, time: "1h", online: true },
  { id: "4", name: "Family Group", lastMessage: "Mom: Dinner tonight?", unread: 1, time: "3h", online: false },
  { id: "5", name: "Carol Davis", lastMessage: "Thanks for the help!", unread: 0, time: "1d", online: false },
];

export default function ChatListPage() {
  return (
    <div className="flex h-screen flex-1 overflow-hidden">
      <Sidebar />
      <div className="flex flex-1 flex-col">
        <div className="border-b border-zinc-200 bg-white px-6 py-4 dark:border-zinc-800 dark:bg-zinc-900">
          <h1 className="text-xl font-bold">Messages</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">5 conversations</p>
        </div>
        <div className="flex-1 overflow-y-auto">
          {channels.map((ch, i) => (
            <motion.div
              key={ch.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <Link
                href={`/channel/${ch.id}`}
                className="flex items-center gap-4 border-b border-zinc-100 px-6 py-4 transition-colors hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-800/50"
              >
                <div className="relative">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-lg font-bold text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400">
                    {ch.name[0]}
                  </div>
                  {ch.online && (
                    <div className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white bg-emerald-500 dark:border-zinc-900" />
                  )}
                </div>
                <div className="flex-1 overflow-hidden">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold">{ch.name}</span>
                    <span className="text-xs text-zinc-400">{ch.time}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="truncate text-sm text-zinc-500 dark:text-zinc-400">
                      {ch.lastMessage}
                    </span>
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
    </div>
  );
}
