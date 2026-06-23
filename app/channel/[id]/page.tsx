"use client";

import { motion } from "motion/react";
import Sidebar from "@/components/Sidebar";

const messages = [
  { id: 1, sender: "Alice", text: "Hey! How's the project going?", time: "10:30 AM", self: false },
  { id: 2, sender: "You", text: "Going great! Just finished the encryption module.", time: "10:32 AM", self: true },
  { id: 3, sender: "Alice", text: "That's awesome! Can you show me a demo later?", time: "10:33 AM", self: false },
  { id: 4, sender: "You", text: "Sure! Let's schedule a call for tomorrow.", time: "10:35 AM", self: true },
  { id: 5, sender: "Alice", text: "Perfect, looking forward to it 👍", time: "10:36 AM", self: false },
  { id: 6, sender: "You", text: "By the way, did you see the new security audit results?", time: "10:40 AM", self: true },
  { id: 7, sender: "Alice", text: "Not yet! Send me the link?", time: "10:41 AM", self: false },
];

export default function ChannelPage() {
  return (
    <div className="flex h-screen flex-1 overflow-hidden">
      <Sidebar />
      <div className="flex flex-1 flex-col">
        <div className="flex items-center justify-between border-b border-zinc-200 bg-white px-6 py-3 dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 font-bold text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400">
              A
            </div>
            <div>
              <p className="font-semibold">Alice Johnson</p>
              <p className="text-xs text-emerald-500">Online</p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-zinc-400">
            <span className="text-xs">E2EE</span>
            <div className="h-2 w-2 rounded-full bg-emerald-500" />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4">
          <div className="space-y-4">
            {messages.map((msg, i) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className={`flex ${msg.self ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-xs rounded-2xl px-4 py-2.5 ${
                    msg.self
                      ? "rounded-br-md bg-emerald-600 text-white"
                      : "rounded-bl-md bg-zinc-100 dark:bg-zinc-800"
                  }`}
                >
                  <p className="text-sm">{msg.text}</p>
                  <p className={`mt-1 text-[10px] ${msg.self ? "text-emerald-200" : "text-zinc-400"}`}>
                    {msg.time}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        <div className="border-t border-zinc-200 bg-white px-6 py-4 dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex items-center gap-3">
            <input
              type="text"
              placeholder="Type a message..."
              className="flex-1 rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm outline-none focus:border-emerald-500 dark:border-zinc-700 dark:bg-zinc-800"
            />
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="rounded-xl bg-emerald-600 px-6 py-3 text-sm font-semibold text-white hover:bg-emerald-700"
            >
              Send
            </motion.button>
          </div>
        </div>
      </div>
    </div>
  );
}
