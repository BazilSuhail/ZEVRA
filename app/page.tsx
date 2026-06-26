"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { FiShield, FiLock, FiZap, FiArrowRight } from "react-icons/fi";
import ThemeToggle from "@/components/theme/ThemeToggle";
import { useAuth } from "@/context/useAuth";
import { useRouter } from "next/navigation";
import TextLoop from "@/components/animations/TextLoop";

export default function LandingPage() {
  const { isLoggedIn } = useAuth();
  const router = useRouter();

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      {/* Navbar */}
      <nav className="fixed left-0 right-0 top-0 z-50 border-b border-zinc-200 bg-white/80 backdrop-blur-md dark:border-zinc-800 dark:bg-zinc-900/80">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link href="/" className="text-xl font-bold">
            Zevra
          </Link>
          <div className="flex items-center gap-6">
            <Link href="/about" className="text-sm text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white">
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

      <TextLoop/>

      {/* Hero */}
      <section className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="max-w-3xl"
        >
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-4 py-1.5 text-sm font-medium text-emerald-700 dark:border-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400">
            <FiShield className="h-4 w-4" />
            End-to-End Encrypted
          </div>

          <h1 className="mb-6 text-5xl font-bold leading-tight tracking-tight md:text-7xl">
            Private messaging
            <br />
            <span className="text-emerald-500">you can trust</span>
          </h1>

          <p className="mb-10 text-lg text-zinc-600 dark:text-zinc-400 md:text-xl">
            Zevra is a secure, end-to-end encrypted chat app built for people
            who value their privacy. No backdoors, no tracking, no compromise.
          </p>

          <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Link href="/login">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="flex items-center gap-2 rounded-full bg-emerald-600 px-8 py-3.5 text-sm font-semibold text-white hover:bg-emerald-700"
              >
                Get Started
                <FiArrowRight className="h-4 w-4" />
              </motion.button>
            </Link>
            <Link href="/about">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="rounded-full border border-zinc-200 px-8 py-3.5 text-sm font-semibold dark:border-zinc-700"
              >
                Learn More
              </motion.button>
            </Link>
          </div>
        </motion.div>
      </section>

      {/* Features */}
      <section className="px-6 pb-24">
        <div className="mx-auto max-w-5xl">
          <h2 className="mb-12 text-center text-3xl font-bold">Why Zevra?</h2>
          <div className="grid gap-6 md:grid-cols-3">
            {[
              { icon: FiLock, title: "E2E Encrypted", desc: "Only you and your recipient can read messages." },
              { icon: FiShield, title: "Zero Knowledge", desc: "We never see your data. Privacy by design." },
              { icon: FiZap, title: "Lightning Fast", desc: "Instant delivery with modern infrastructure." },
            ].map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900"
              >
                <f.icon className="mb-4 h-8 w-8 text-emerald-500" />
                <h3 className="mb-2 text-lg font-semibold">{f.title}</h3>
                <p className="text-zinc-600 dark:text-zinc-400">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
