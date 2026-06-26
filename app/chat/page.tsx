"use client";

import { motion } from "motion/react";
import { FiUsers } from "react-icons/fi";
import { useAuth } from "@/context/useAuth";

export default function ChatHomePage() {
  const { user } = useAuth();

  return (
    <div className="flex flex-1 flex-col items-center justify-center bg-zinc-50 dark:bg-zinc-950">
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center">
        <FiUsers className="mx-auto mb-4 h-12 w-12 text-zinc-300 dark:text-zinc-600" />
        <h2 className="mb-2 text-2xl font-bold">Welcome, {user?.username || "Guest"}</h2>
        <p className="text-zinc-500 dark:text-zinc-400">Select a chat to start messaging</p>
      </motion.div>
    </div>
  );
}
