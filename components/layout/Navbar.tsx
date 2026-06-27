"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "motion/react";
import { useAuth } from "@/context/useAuth";
import { useRouter } from "next/navigation";
import ThemeToggle from "@/components/theme/ThemeToggle";

export default function Navbar() {
  const { isLoggedIn } = useAuth();
  const router = useRouter();

  return (
    <>
      {/* Top Floating Navbar (Desktop & Mobile Brand Tile) */}
      <nav className="fixed left-0 right-0 top-0 z-50 p-4">
        <div className="flex w-full items-center justify-between gap-4">

          {/* Left Tile: Brand / Logo with Blurred Indigo Glow */}
          <div className="rounded-3xl border border-indigo-500/20 bg-indigo-950/30 px-6 py-3 shadow-lg shadow-indigo-950/20 backdrop-blur-xl transition-all">
            <Link href="/" className="flex items-center gap-2">
              <Image
                src="/zevra-logo.webp"
                alt="Zevra Logo"
                width={120}
                height={32}
                priority
                className="h-8 w-auto object-contain"
              />
            </Link>
          </div>

          {/* Right Tile: Desktop Nav Links & Actions */}
          <div className="hidden items-center gap-6 rounded-3xl border border-indigo-500/20 bg-indigo-950/30 px-6 py-3 shadow-lg shadow-indigo-950/20 backdrop-blur-xl sm:flex">
            <Link
              href="/about"
              className="text-sm font-medium text-indigo-200 transition-colors hover:text-white"
            >
              About
            </Link>

            <ThemeToggle />

            {isLoggedIn ? (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => router.push("/chat")}
                className="rounded-full bg-indigo-600 px-6 py-2 text-sm font-semibold text-white shadow-md shadow-indigo-600/30 hover:bg-indigo-500 transition-colors"
              >
                Open Chat
              </motion.button>
            ) : (
              <Link href="/auth/login">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="rounded-full bg-indigo-600 px-6 py-2 text-sm font-semibold text-white shadow-md shadow-indigo-600/30 hover:bg-indigo-500 transition-colors"
                >
                  Get Started
                </motion.button>
              </Link>
            )}
          </div>

          {/* Right Mobile Tile: Theme Toggle */}
          <div className="flex items-center gap-2 rounded-3xl border border-indigo-500/20 bg-indigo-950/30 px-4 py-3 shadow-lg shadow-indigo-950/20 backdrop-blur-xl sm:hidden">
            <ThemeToggle />
          </div>

        </div>
      </nav>

      {/* Mobile Bottom Navigation Bar */}
      <nav className="fixed bottom-4 left-4 right-4 z-50 flex items-center justify-around rounded-full border border-indigo-500/20 bg-indigo-950/40 px-6 py-3.5 shadow-xl shadow-indigo-950/40 backdrop-blur-2xl sm:hidden">
        <Link
          href="/about"
          className="text-sm font-medium text-indigo-200 hover:text-white transition-colors"
        >
          About
        </Link>

        {isLoggedIn ? (
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => router.push("/chat")}
            className="rounded-full bg-indigo-600 px-5 py-2 text-xs font-semibold text-white shadow-md shadow-indigo-600/30 hover:bg-indigo-500"
          >
            Open Chat
          </motion.button>
        ) : (
          <Link href="/auth/login">
            <motion.button
              whileTap={{ scale: 0.95 }}
              className="rounded-full bg-indigo-600 px-5 py-2 text-xs font-semibold text-white shadow-md shadow-indigo-600/30 hover:bg-indigo-500"
            >
              Get Started
            </motion.button>
          </Link>
        )}
      </nav>
    </>
  );
}
