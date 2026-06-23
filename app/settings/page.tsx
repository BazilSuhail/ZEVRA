"use client";

import { motion } from "motion/react";
import Sidebar from "@/components/Sidebar";
import { FiShield, FiLock, FiKey, FiUser, FiToggleLeft, FiToggleRight } from "react-icons/fi";
import { useState } from "react";

export default function SettingsPage() {
  const [twoFactor, setTwoFactor] = useState(false);
  const [notifications, setNotifications] = useState(true);

  return (
    <div className="flex h-screen flex-1 overflow-hidden">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-y-auto">
        <div className="border-b border-zinc-200 bg-white px-6 py-4 dark:border-zinc-800 dark:bg-zinc-900">
          <h1 className="text-xl font-bold">Settings</h1>
        </div>

        <div className="flex-1 px-6 py-6">
          <div className="mx-auto max-w-2xl space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900"
            >
              <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold">
                <FiUser className="h-5 w-5 text-emerald-500" />
                Profile
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="mb-1.5 block text-sm font-medium">Display Name</label>
                  <input
                    type="text"
                    defaultValue="You"
                    className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm outline-none focus:border-emerald-500 dark:border-zinc-700 dark:bg-zinc-800"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium">Email</label>
                  <input
                    type="email"
                    defaultValue="you@example.com"
                    className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm outline-none focus:border-emerald-500 dark:border-zinc-700 dark:bg-zinc-800"
                  />
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900"
            >
              <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold">
                <FiShield className="h-5 w-5 text-emerald-500" />
                Security
              </h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Two-Factor Authentication</p>
                    <p className="text-sm text-zinc-500 dark:text-zinc-400">Add an extra layer of security</p>
                  </div>
                  <button onClick={() => setTwoFactor(!twoFactor)}>
                    {twoFactor ? (
                      <FiToggleRight className="h-8 w-8 text-emerald-500" />
                    ) : (
                      <FiToggleLeft className="h-8 w-8 text-zinc-300 dark:text-zinc-600" />
                    )}
                  </button>
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium">Change Password</label>
                  <input
                    type="password"
                    placeholder="New password"
                    className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm outline-none focus:border-emerald-500 dark:border-zinc-700 dark:bg-zinc-800"
                  />
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900"
            >
              <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold">
                <FiKey className="h-5 w-5 text-emerald-500" />
                Encryption Keys
              </h2>
              <p className="mb-4 text-sm text-zinc-500 dark:text-zinc-400">
                Your keys are used to encrypt and decrypt messages.
              </p>
              <div className="rounded-xl bg-zinc-50 p-4 font-mono text-xs dark:bg-zinc-800">
                <p className="text-zinc-400">Public Key Fingerprint:</p>
                <p className="mt-1 break-all text-zinc-700 dark:text-zinc-300">
                  05a4 82f3 b1c9 d4e7 6f02 a835 91c6 7d4e
                </p>
              </div>
              <motion.button
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                className="mt-4 rounded-xl border border-zinc-200 px-4 py-2.5 text-sm font-medium transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-800"
              >
                Rotate Keys
              </motion.button>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900"
            >
              <h2 className="mb-4 text-lg font-semibold">Notifications</h2>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Push Notifications</p>
                  <p className="text-sm text-zinc-500 dark:text-zinc-400">Get notified of new messages</p>
                </div>
                <button onClick={() => setNotifications(!notifications)}>
                  {notifications ? (
                    <FiToggleRight className="h-8 w-8 text-emerald-500" />
                  ) : (
                    <FiToggleLeft className="h-8 w-8 text-zinc-300 dark:text-zinc-600" />
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
