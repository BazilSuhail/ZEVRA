"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { FiShield, FiMail, FiLock, FiUser } from "react-icons/fi";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/useAuth";
import ThemeToggle from "@/components/theme/ThemeToggle";
import Link from "next/link";

export default function LoginPage() {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const router = useRouter();
  const { login, register } = useAuth();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (mode === "login") {
      login(email, password);
    } else {
      register(name, email, password);
    }
    router.push("/chat");
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-6">
      <div className="absolute right-6 top-6">
        <ThemeToggle />
      </div>
      <Link href="/" className="absolute left-6 top-6 text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-white">
        ← Back to Home
      </Link>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="mb-8 text-center">
          <FiShield className="mx-auto mb-4 h-12 w-12 text-emerald-500" />
          <h1 className="text-2xl font-bold">Welcome to Zevra</h1>
          <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
            End-to-end encrypted messaging
          </p>
        </div>

        <div className="mb-6 flex rounded-xl border border-zinc-200 bg-zinc-100 p-1 dark:border-zinc-700 dark:bg-zinc-800">
          {(["login", "register"] as const).map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={`flex-1 rounded-lg py-2.5 text-sm font-medium transition-colors ${
                mode === m
                  ? "bg-white text-zinc-900 shadow dark:bg-zinc-700 dark:text-white"
                  : "text-zinc-500 hover:text-zinc-700 dark:text-zinc-400"
              }`}
            >
              {m === "login" ? "Sign In" : "Sign Up"}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <AnimatePresence mode="wait">
            {mode === "register" && (
              <motion.div
                key="name"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
              >
                <label className="mb-1.5 block text-sm font-medium">Name</label>
                <div className="flex items-center gap-2 rounded-xl border border-zinc-200 bg-white px-4 py-3 dark:border-zinc-700 dark:bg-zinc-800">
                  <FiUser className="h-4 w-4 text-zinc-400" />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your name"
                    className="flex-1 bg-transparent text-sm outline-none"
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div>
            <label className="mb-1.5 block text-sm font-medium">Email</label>
            <div className="flex items-center gap-2 rounded-xl border border-zinc-200 bg-white px-4 py-3 dark:border-zinc-700 dark:bg-zinc-800">
              <FiMail className="h-4 w-4 text-zinc-400" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="flex-1 bg-transparent text-sm outline-none"
              />
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium">Password</label>
            <div className="flex items-center gap-2 rounded-xl border border-zinc-200 bg-white px-4 py-3 dark:border-zinc-700 dark:bg-zinc-800">
              <FiLock className="h-4 w-4 text-zinc-400" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="flex-1 bg-transparent text-sm outline-none"
              />
            </div>
          </div>

          <motion.button
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            type="submit"
            className="w-full rounded-xl bg-emerald-600 py-3 text-sm font-semibold text-white hover:bg-emerald-700"
          >
            {mode === "login" ? "Sign In" : "Create Account"}
          </motion.button>
        </form>

        <p className="mt-6 text-center text-xs text-zinc-500 dark:text-zinc-400">
          <button
            onClick={() => {
              login("guest@zevra.app", "guest");
              router.push("/chat");
            }}
            className="text-emerald-500 hover:underline"
          >
            Continue as Guest
          </button>
        </p>
      </motion.div>
    </div>
  );
}
