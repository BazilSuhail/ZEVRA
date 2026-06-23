"use client";

import { motion } from "motion/react";
import { FiShield, FiLock, FiGlobe, FiGithub } from "react-icons/fi";

export default function About() {
  return (
    <div className="flex flex-1 flex-col bg-background text-foreground">
      <section className="flex min-h-[calc(100vh-80px)] flex-col items-center justify-center px-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="max-w-3xl"
        >
          <FiShield className="mx-auto mb-6 h-12 w-12 text-emerald-500" />

          <h1 className="mb-6 text-5xl font-bold leading-tight tracking-tight md:text-6xl">
            About <span className="text-emerald-500">Zevra</span>
          </h1>

          <p className="mb-10 text-lg text-zinc-600 dark:text-zinc-400 md:text-xl">
            We believe everyone deserves private, secure communication.
            Zevra was built to make end-to-end encryption accessible to all.
          </p>
        </motion.div>
      </section>

      <section className="px-6 pb-24">
        <div className="mx-auto max-w-4xl space-y-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="grid gap-12 md:grid-cols-2"
          >
            <div>
              <h2 className="mb-4 text-2xl font-bold">Our Mission</h2>
              <p className="text-zinc-600 dark:text-zinc-400">
                Zevra was created with a simple goal: provide secure, private
                communication that anyone can use. In a world where digital
                surveillance is the norm, we believe privacy is a fundamental
                right, not a luxury.
              </p>
            </div>
            <div>
              <h2 className="mb-4 text-2xl font-bold">How It Works</h2>
              <p className="text-zinc-600 dark:text-zinc-400">
                Every message you send is encrypted on your device before it
                leaves. Only the person you&apos;re messaging can decrypt and
                read it. Not us. Not your ISP. Not anyone in between.
              </p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="grid gap-8 md:grid-cols-3"
          >
            <div className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
              <FiLock className="mb-4 h-8 w-8 text-emerald-500" />
              <h3 className="mb-2 font-semibold">Signal Protocol</h3>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                We use the industry-standard Signal Protocol for key exchange
                and message encryption.
              </p>
            </div>
            <div className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
              <FiGlobe className="mb-4 h-8 w-8 text-emerald-500" />
              <h3 className="mb-2 font-semibold">Decentralized</h3>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                No single point of failure. Your data isn&apos;t stored on
                one vulnerable server.
              </p>
            </div>
            <div className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
              <FiGithub className="mb-4 h-8 w-8 text-emerald-500" />
              <h3 className="mb-2 font-semibold">Open Source</h3>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                Our code is public. Security researchers can audit it
                anytime. Trust through transparency.
              </p>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
