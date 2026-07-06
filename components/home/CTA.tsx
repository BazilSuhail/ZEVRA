"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { FiArrowRight, FiLock, FiShield } from "react-icons/fi";

export default function CTA() {
  return (
    <section className="relative z-10 px-6 sm:px-8 py-28 sm:py-36 text-purple-50" suppressHydrationWarning>
      <div className="max-w-5xl mx-auto text-center">
        <motion.div
          initial={{ opacity: 0, y: 36 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, ease: "easeOut" }}
          className="neumorphic-card-dark rounded-3xl p-12 sm:p-20 relative overflow-hidden space-y-8"
        >
          {/* Subtle background ambient lights */}
          <div className="absolute -top-32 -left-32 w-80 h-80 bg-purple-600/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-32 -right-32 w-80 h-80 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 space-y-6 max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-purple-500/30 bg-purple-950/70 text-purple-300 text-xs font-semibold uppercase tracking-widest">
              <FiLock className="w-4 h-4 text-indigo-400" />
              <span>Get Started In Seconds</span>
            </div>

            <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight leading-tight">
              Ready to Experience True Privacy with{" "}
              <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-indigo-300 bg-clip-text text-transparent">
                Zevra
              </span>
              ?
            </h2>

            <p className="text-purple-200/80 text-base sm:text-lg leading-relaxed max-w-xl mx-auto">
              Join thousands of users who trust Zevra for secure, end-to-end encrypted communication. Built by Bazil Suhail with zero-knowledge at its core.
            </p>

            <div className="pt-6 flex flex-col sm:flex-row items-center justify-center gap-5">
              <Link href="/auth/register">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.96 }}
                  className="neumorphic-button-dark text-white font-bold px-9 py-4 rounded-2xl text-base flex items-center gap-3 cursor-pointer"
                >
                  Get Started Free
                  <FiArrowRight className="h-5 w-5" />
                </motion.button>
              </Link>
              
              <Link href="/about">
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  className="border border-purple-500/30 bg-purple-950/50 hover:bg-purple-900/40 text-purple-200 font-bold px-7 py-4 rounded-2xl text-base transition-all flex items-center gap-2.5 cursor-pointer"
                >
                  <FiShield className="w-4.5 h-4.5 text-purple-400" />
                  Learn Architecture
                </motion.button>
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
