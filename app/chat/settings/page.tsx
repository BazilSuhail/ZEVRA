"use client";

import { useState, useEffect } from "react";
import { motion } from "motion/react";
import { FiArrowLeft, FiSun, FiMoon, FiBell, FiLock, FiTrash2 } from "react-icons/fi";
import Link from "next/link";
import { useAuth } from "@/context/useAuth";

export default function SettingsPage() {
  const { logout } = useAuth();
  const [theme, setThemeState] = useState<"light" | "dark">("dark");

  useEffect(() => {
    const saved = localStorage.getItem("theme") as "light" | "dark" | null;
    const initial = saved ?? "dark";
    setThemeState(initial);
    document.documentElement.classList.toggle("dark", initial === "dark");
  }, []);

  const setTheme = (next: "light" | "dark") => {
    setThemeState(next);
    localStorage.setItem("theme", next);
    document.documentElement.classList.toggle("dark", next === "dark");
  };
  const [notifications, setNotifications] = useState({
    messages: true,
    sound: true,
    previews: false,
  });

  // Load from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("zevra_notifications");
    if (saved) {
      try { setNotifications(JSON.parse(saved)); } catch {}
    }
  }, []);

  const toggleNotif = (key: keyof typeof notifications) => {
    setNotifications((prev) => {
      const next = { ...prev, [key]: !prev[key] };
      localStorage.setItem("zevra_notifications", JSON.stringify(next));
      return next;
    });
  };

  return (
    <div className="flex flex-1 flex-col overflow-y-auto">
      <div className="border-b border-zinc-200 bg-white px-6 py-4 dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex items-center gap-3">
          <Link href="/chat" className="rounded-lg p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800">
            <FiArrowLeft className="h-5 w-5" />
          </Link>
          <h1 className="text-xl font-bold">Settings</h1>
        </div>
      </div>
      <div className="flex-1 px-6 py-6">
        <div className="w-full space-y-6">
          {/* Appearance */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
            <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold">
              {theme === "dark" ? <FiMoon className="h-5 w-5 text-indigo-500" /> : <FiSun className="h-5 w-5 text-indigo-500" />}
              Appearance
            </h2>
            <div className="flex items-center justify-between rounded-xl bg-zinc-50 p-4 dark:bg-zinc-800">
              <div>
                <p className="font-medium">Theme</p>
                <p className="text-sm text-zinc-500 dark:text-zinc-400">{theme === "dark" ? "Dark mode" : "Light mode"}</p>
              </div>
              <button
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
              >
                Switch to {theme === "dark" ? "Light" : "Dark"}
              </button>
            </div>
          </motion.div>

          {/* Notifications */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
            <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold">
              <FiBell className="h-5 w-5 text-indigo-500" />Notifications
            </h2>
            <div className="space-y-3">
              {([
                { key: "messages" as const, label: "Message notifications" },
                { key: "sound" as const, label: "Sound" },
                { key: "previews" as const, label: "Show previews" },
              ]).map(({ key, label }) => (
                <div key={key} className="flex items-center justify-between rounded-xl bg-zinc-50 px-4 py-3 dark:bg-zinc-800">
                  <span className="text-sm font-medium">{label}</span>
                  <button
                    onClick={() => toggleNotif(key)}
                    className={`h-5 w-9 cursor-pointer rounded-full p-0.5 transition-colors ${
                      notifications[key] ? "bg-indigo-600" : "bg-zinc-300 dark:bg-zinc-600"
                    }`}
                  >
                    <div className={`h-4 w-4 rounded-full bg-white transition-transform ${
                      notifications[key] ? "translate-x-4" : "translate-x-0"
                    }`} />
                  </button>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Security */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
            <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold">
              <FiLock className="h-5 w-5 text-indigo-500" />Security
            </h2>
            <div className="space-y-3">
              <Link
                href="/chat/keys"
                className="flex items-center justify-between rounded-xl bg-zinc-50 px-4 py-3 transition-colors hover:bg-zinc-100 dark:bg-zinc-800 dark:hover:bg-zinc-700"
              >
                <span className="text-sm font-medium">Encryption Keys</span>
                <span className="text-xs text-zinc-400">View & manage</span>
              </Link>
              <Link
                href="/chat/audit"
                className="flex items-center justify-between rounded-xl bg-zinc-50 px-4 py-3 transition-colors hover:bg-zinc-100 dark:bg-zinc-800 dark:hover:bg-zinc-700"
              >
                <span className="text-sm font-medium">Audit Log</span>
                <span className="text-xs text-zinc-400">View history</span>
              </Link>
            </div>
          </motion.div>

          {/* Account */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="rounded-2xl border border-red-200 bg-white p-6 dark:border-red-900/50 dark:bg-zinc-900">
            <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-red-600 dark:text-red-400">
              <FiTrash2 className="h-5 w-5" />Danger Zone
            </h2>
            <p className="mb-4 text-sm text-zinc-500 dark:text-zinc-400">
              Permanently delete your account and all associated data. This cannot be undone.
            </p>
            <button className="rounded-xl border border-red-300 px-4 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-900/20">
              Delete Account
            </button>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
