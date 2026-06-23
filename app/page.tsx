"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { FiShield, FiLock, FiZap, FiEyeOff, FiArrowRight } from "react-icons/fi";

const features = [
  {
    icon: FiLock,
    title: "End-to-End Encrypted",
    description: "Messages are encrypted on your device and can only be read by the intended recipient.",
  },
  {
    icon: FiEyeOff,
    title: "Zero Knowledge",
    description: "We never see your messages, contacts, or metadata. Your privacy is absolute.",
  },
  {
    icon: FiZap,
    title: "Lightning Fast",
    description: "Built on modern infrastructure for instant message delivery worldwide.",
  },
  {
    icon: FiShield,
    title: "Open Source",
    description: "Fully auditable code. Verify our security claims yourself.",
  },
];

export default function Home() {
  return (
    <div className="flex flex-1 flex-col bg-background text-foreground">
      <section className="flex min-h-[calc(100vh-80px)] flex-col items-center justify-center px-6 text-center">
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
            <Link
              href="#"
              className="flex items-center gap-2 rounded-full bg-emerald-600 px-8 py-3.5 text-sm font-semibold text-white transition-colors hover:bg-emerald-700"
            >
              Get Started
              <FiArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/about"
              className="flex items-center gap-2 rounded-full border border-zinc-200 px-8 py-3.5 text-sm font-semibold transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
            >
              Learn More
            </Link>
          </div>
        </motion.div>
      </section>

      <section className="px-6 pb-24">
        <div className="mx-auto max-w-5xl">
          <motion.h2
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="mb-12 text-center text-3xl font-bold"
          >
            Why Zevra?
          </motion.h2>

          <div className="grid gap-6 md:grid-cols-2">
            {features.map((feature, i) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900"
              >
                <feature.icon className="mb-4 h-8 w-8 text-emerald-500" />
                <h3 className="mb-2 text-lg font-semibold">{feature.title}</h3>
                <p className="text-zinc-600 dark:text-zinc-400">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
