"use client";

import { motion } from "motion/react";
import { FiKey, FiShield, FiCheckCircle } from "react-icons/fi";

const keys = [
  { id: "1", name: "Alice Johnson", fingerprint: "a4b2 8c1f 3e56 7d90 1234 5678 9abc def0", verified: true },
  { id: "2", name: "Bob Smith", fingerprint: "f0e1 d2c3 b4a5 9687 1029 3847 56af becd", verified: true },
  { id: "3", name: "Carol Davis", fingerprint: "1234 5678 9abc def0 abcd ef12 3456 7890", verified: false },
  { id: "4", name: "Dev Team", fingerprint: "9876 5432 10fe dcba fedc ba98 7654 3210", verified: true },
];

export default function KeysPage() {
  return (
    <div className="flex flex-1 flex-col overflow-y-auto">
      <div className="border-b border-zinc-200 bg-white px-6 py-4 dark:border-zinc-800 dark:bg-zinc-900">
        <h1 className="text-xl font-bold">Keys</h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">Verify identities and view key fingerprints</p>
      </div>
      <div className="flex-1 px-6 py-6">
        <div className="mx-auto max-w-2xl space-y-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
            <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold"><FiKey className="h-5 w-5 text-emerald-500" />Your Keys</h2>
            <div className="rounded-xl bg-zinc-50 p-4 dark:bg-zinc-800">
              <p className="mb-2 text-sm text-zinc-500 dark:text-zinc-400">Public Key Fingerprint</p>
              <p className="break-all font-mono text-xs text-zinc-700 dark:text-zinc-300">05a4 82f3 b1c9 d4e7 6f02 a835 91c6 7d4e</p>
            </div>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
            <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold"><FiShield className="h-5 w-5 text-emerald-500" />Contact Keys</h2>
            <div className="space-y-3">
              {keys.map((k, i) => (
                <motion.div key={k.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }} className="rounded-xl bg-zinc-50 p-4 dark:bg-zinc-800">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="font-medium">{k.name}</span>
                    {k.verified ? <span className="flex items-center gap-1 text-xs text-emerald-500"><FiCheckCircle className="h-3 w-3" />Verified</span> : <span className="text-xs text-zinc-400">Unverified</span>}
                  </div>
                  <p className="break-all font-mono text-[11px] text-zinc-500 dark:text-zinc-400">{k.fingerprint}</p>
                  {!k.verified && <motion.button whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }} className="mt-3 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-700">Verify</motion.button>}
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
