"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import { useState } from "react";
import {
  FiMessageSquare,
  FiPlus,
  FiSettings,
  FiUser,
  FiShield,
  FiKey,
  FiClipboard,
  FiChevronLeft,
  FiChevronRight,
  FiSearch,
} from "react-icons/fi";

const channels = [
  { id: "1", name: "Alice Johnson", lastMessage: "Hey, how are you?", unread: 2, time: "2m" },
  { id: "2", name: "Dev Team", lastMessage: "Sprint planning at 3pm", unread: 0, time: "15m" },
  { id: "3", name: "Bob Smith", lastMessage: "Check out this link", unread: 5, time: "1h" },
  { id: "4", name: "Family Group", lastMessage: "Mom: Dinner tonight?", unread: 1, time: "3h" },
  { id: "5", name: "Carol Davis", lastMessage: "Thanks for the help!", unread: 0, time: "1d" },
];

const navItems = [
  { href: "/new", icon: FiPlus, label: "New Chat" },
  { href: "/settings", icon: FiSettings, label: "Settings" },
  { href: "/profile", icon: FiUser, label: "Profile" },
  { href: "/keys", icon: FiKey, label: "Keys" },
  { href: "/audit", icon: FiClipboard, label: "Audit" },
];

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();

  return (
    <motion.aside
      initial={false}
      animate={{ width: collapsed ? 68 : 300 }}
      transition={{ duration: 0.3, ease: "easeInOut" }}
      className="flex h-full flex-col border-r border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900"
    >
      <div className="flex items-center justify-between border-b border-zinc-200 px-4 py-3 dark:border-zinc-800">
        <AnimatePresence>
          {!collapsed && (
            <motion.span
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-lg font-bold"
            >
              Zevra
            </motion.span>
          )}
        </AnimatePresence>
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="rounded-lg p-2 transition-colors hover:bg-zinc-100 dark:hover:bg-zinc-800"
        >
          {collapsed ? <FiChevronRight /> : <FiChevronLeft />}
        </button>
      </div>

      <div className="p-3">
        <div className="flex items-center gap-2 rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-800">
          <FiSearch className="h-4 w-4 text-zinc-400" />
          <AnimatePresence>
            {!collapsed && (
              <motion.input
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: "100%" }}
                exit={{ opacity: 0, width: 0 }}
                placeholder="Search..."
                className="bg-transparent text-sm outline-none"
              />
            )}
          </AnimatePresence>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-2">
        <AnimatePresence>
          {!collapsed && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="mb-2 px-2 text-xs font-semibold uppercase text-zinc-400"
            >
              Chats
            </motion.p>
          )}
        </AnimatePresence>

        {channels.map((ch) => (
          <Link
            key={ch.id}
            href={`/channel/${ch.id}`}
            className={`mb-1 flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors ${
              pathname === `/channel/${ch.id}`
                ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400"
                : "hover:bg-zinc-100 dark:hover:bg-zinc-800"
            }`}
          >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-sm font-bold text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400">
              {ch.name[0]}
            </div>
            <AnimatePresence>
              {!collapsed && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex-1 overflow-hidden"
                >
                  <div className="flex items-center justify-between">
                    <span className="truncate text-sm font-medium">{ch.name}</span>
                    <span className="shrink-0 text-xs text-zinc-400">{ch.time}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="truncate text-xs text-zinc-500 dark:text-zinc-400">
                      {ch.lastMessage}
                    </span>
                    {ch.unread > 0 && (
                      <span className="ml-2 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-[10px] font-bold text-white">
                        {ch.unread}
                      </span>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </Link>
        ))}
      </div>

      <div className="border-t border-zinc-200 p-2 dark:border-zinc-800">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`mb-1 flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors ${
              pathname === item.href
                ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400"
                : "text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
            }`}
          >
            <item.icon className="h-5 w-5 shrink-0" />
            <AnimatePresence>
              {!collapsed && (
                <motion.span
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="text-sm font-medium"
                >
                  {item.label}
                </motion.span>
              )}
            </AnimatePresence>
          </Link>
        ))}
      </div>
    </motion.aside>
  );
}
