"use client";

import { motion } from "motion/react";
import { FiClipboard, FiLogIn, FiKey, FiShield, FiAlertTriangle } from "react-icons/fi";

const events = [
  { id: "1", type: "login", message: "Signed in from Chrome on Windows", time: "2 hours ago", icon: FiLogIn, color: "text-emerald-500" },
  { id: "2", type: "key", message: "Encryption keys rotated", time: "1 day ago", icon: FiKey, color: "text-blue-500" },
  { id: "3", type: "security", message: "Two-factor authentication enabled", time: "3 days ago", icon: FiShield, color: "text-emerald-500" },
  { id: "4", type: "login", message: "Signed in from Safari on macOS", time: "5 days ago", icon: FiLogIn, color: "text-emerald-500" },
  { id: "5", type: "warning", message: "New device signed in", time: "1 week ago", icon: FiAlertTriangle, color: "text-amber-500" },
  { id: "6", type: "key", message: "Safety number changed with Alice Johnson", time: "2 weeks ago", icon: FiKey, color: "text-blue-500" },
];

export default function AuditPage() {
  return (
    <div className="flex flex-1 flex-col overflow-y-auto">
      <div className="border-b border-zinc-200 bg-white px-6 py-4 dark:border-zinc-800 dark:bg-zinc-900">
        <h1 className="text-xl font-bold">Audit Log</h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">Login history and security events</p>
      </div>
      <div className="flex-1 px-6 py-6">
        <div className="mx-auto max-w-2xl">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
            <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold"><FiClipboard className="h-5 w-5 text-emerald-500" />Recent Activity</h2>
            <div className="space-y-3">
              {events.map((event, i) => (
                <motion.div key={event.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }} className="flex items-start gap-3 rounded-xl bg-zinc-50 p-4 dark:bg-zinc-800">
                  <event.icon className={`mt-0.5 h-5 w-5 shrink-0 ${event.color}`} />
                  <div className="flex-1">
                    <p className="text-sm">{event.message}</p>
                    <p className="mt-1 text-xs text-zinc-400">{event.time}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
