"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "motion/react";
import { useAuthStore } from "@/context/stores";
import { useRouter } from "next/navigation";
import ThemeToggle from "@/components/theme/ThemeToggle";

export default function Navbar() {
  const isLoggedIn = useAuthStore((s) => s.isAuthenticated);
  const tokenValidated = useAuthStore((s) => s.tokenValidated);
  const router = useRouter();

  return (
    <>
      {/* Top Floating Navbar (Desktop & Mobile Brand Tile) */}
      <nav className="fixed left-0 right-0 top-0 z-50 p-4">
        <div className="flex max-w-7xl mx-auto items-center justify-between gap-4">

          {/* Left Tile: Brand / Logo with Blurred Glow */}
          <div className="rounded-full border border-border bg-bg-surface/80 p-3 shadow-md dark:border-border-purple dark:bg-purple-950/50 dark:shadow-purple-900/20 backdrop-blur-xl transition-all">
            <Link href="/" className="flex items-center gap-2">
              <Image
                src="/zevra-logo.webp"
                alt="Zevra Logo"
                width={120}
                height={32}
                priority
                className="h-8 w-8 object-contain"
              />
            </Link>
          </div>

          {/* Right Tile: Desktop Nav Links & Actions */}
          <div className="hidden items-center gap-6 rounded-3xl border border-border bg-bg-surface/80 px-6 py-2.5 shadow-md dark:border-border-purple dark:bg-purple-950/80 dark:shadow-purple-900/20 backdrop-blur-xl sm:flex">
            <Link
              href="/about"
              className="text-sm font-medium text-text-body transition-colors hover:text-text-primary"
            >
              About
            </Link>
            <Link
              href="/architecture"
              className="text-sm font-medium text-text-body transition-colors hover:text-text-primary"
            >
              Architecture
            </Link>

            {!tokenValidated ? (
              <div className="h-9 w-28 animate-pulse rounded-full bg-bg-inset dark:bg-purple-900" />
            ) : isLoggedIn ? (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => router.push("/chat")}
                className="rounded-full bg-brand px-6 py-1.75 text-sm font-medium text-text-white shadow-md shadow-purple-900/30 hover:bg-brand-hover transition-colors"
              >
                Open Chat
              </motion.button>
            ) : (
              <Link href="/auth/login">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="rounded-full bg-brand px-6 py-2 text-sm font-semibold text-text-white shadow-md shadow-purple-900/30 hover:bg-brand-hover transition-colors"
                >
                  Get Started
                </motion.button>
              </Link>
            )}
          </div>

          {/* Right Mobile Tile: Theme Toggle */}
          <div className="flex items-center gap-2 rounded-3xl border border-border bg-bg-surface/80 px-4 py-3 shadow-md dark:border-border-purple dark:bg-purple-950/80 dark:shadow-purple-900/20 backdrop-blur-xl sm:hidden">
            <ThemeToggle />
          </div>

        </div>
      </nav>

      {/* Mobile Bottom Navigation Bar */}
      <nav className="fixed bottom-4 left-4 right-4 z-50 flex items-center justify-around rounded-full border border-border bg-bg-surface/90 px-6 py-3.5 shadow-xl dark:border-border-purple dark:bg-purple-950/90 dark:shadow-purple-900/40 backdrop-blur-2xl sm:hidden">
        <Link
          href="/about"
          className="text-sm font-medium text-text-body hover:text-text-primary transition-colors"
        >
          About
        </Link>
        <Link
          href="/architecture"
          className="text-sm font-medium text-text-body hover:text-text-primary transition-colors"
        >
          Architecture
        </Link>

        {!tokenValidated ? (
          <div className="h-9 w-24 animate-pulse rounded-full bg-bg-inset dark:bg-purple-900" />
        ) : isLoggedIn ? (
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => router.push("/chat")}
            className="rounded-full bg-brand px-5 py-2 text-xs font-semibold text-text-white shadow-md shadow-purple-900/30 hover:bg-brand-hover"
          >
            Open Chat
          </motion.button>
        ) : (
          <Link href="/auth/login">
            <motion.button
              whileTap={{ scale: 0.95 }}
              className="rounded-full bg-brand px-5 py-2 text-xs font-semibold text-text-white shadow-md shadow-purple-900/30 hover:bg-brand-hover"
            >
              Get Started
            </motion.button>
          </Link>
        )}
      </nav>
    </>
  );
}
