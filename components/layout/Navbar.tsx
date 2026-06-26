"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { useAuth } from "@/context/useAuth";
import { useRouter } from "next/navigation";
import ThemeToggle from "@/components/theme/ThemeToggle";

export default function Navbar() {
  const { isLoggedIn } = useAuth();
  const router = useRouter();

  return (
    <nav className="fixed left-0 right-0 top-0 z-50 border-b border-white/10 bg-black/40 backdrop-blur-xl">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link href="/" className="text-xl font-bold">
          Zevra
        </Link>
        <div className="flex items-center gap-6">
          <Link href="/about" className="text-sm text-zinc-300 hover:text-white transition-colors">
            About
          </Link>
          <ThemeToggle />
          {isLoggedIn ? (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => router.push("/chat")}
              className="rounded-full bg-emerald-600 px-5 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
            >
              Open Chat
            </motion.button>
          ) : (
            <Link href="/login">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="rounded-full bg-emerald-600 px-5 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
              >
                Get Started
              </motion.button>
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}
