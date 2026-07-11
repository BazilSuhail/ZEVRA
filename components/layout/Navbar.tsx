"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "motion/react";
import { useAuthStore } from "@/context/stores";
import { useRouter } from "next/navigation";

export default function Navbar() {
  const isLoggedIn = useAuthStore((s) => s.isAuthenticated);
  const tokenValidated = useAuthStore((s) => s.tokenValidated);
  const router = useRouter();

  return (
    <nav className="fixed left-0 right-0 top-0 z-50 p-4 w-screen overflow-hidden">
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
              className="h-6 sm:h-8 w-6 sm:w-8 object-contain"
            />
          </Link>
        </div>

        {/* Desktop Navigation Tile */}
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

        {/* Mobile Navigation Tile (Visible on screens smaller than `sm`) */}
        <div className="flex items-center gap-3 rounded-full border border-border bg-bg-surface/80 px-6 py-2 shadow-md dark:border-border-purple dark:bg-purple-950/80 dark:shadow-purple-900/20 backdrop-blur-xl sm:hidden">
          <Link
            href="/about"
            className="text-xs font-medium text-text-body transition-colors hover:text-text-primary"
          >
            About
          </Link>
          <Link
            href="/architecture"
            className="text-xs font-medium text-text-body transition-colors hover:text-text-primary"
          >
            Architecture
          </Link>

          {!tokenValidated ? (
            <div className="h-7 w-20 animate-pulse rounded-full bg-bg-inset dark:bg-purple-900" />
          ) : isLoggedIn ? (
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => router.push("/chat")}
              className="rounded-full bg-brand px-3 py-1 text-[11px] font-semibold text-text-white shadow-md shadow-purple-900/30 hover:bg-brand-hover"
            >
              Open Chat
            </motion.button>
          ) : (
            <Link href="/auth/login">
              <motion.button
                whileTap={{ scale: 0.95 }}
                className="rounded-full bg-brand px-3 py-1 text-[11px] font-semibold text-text-white shadow-md shadow-purple-900/30 hover:bg-brand-hover"
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