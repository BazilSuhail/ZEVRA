"use client";

import { motion } from "motion/react";
import { FiUsers, FiMessageSquare, FiGlobe, FiActivity, FiLock } from "react-icons/fi";

const stats = [
  { icon: FiUsers, value: "50K+", label: "Active Privacy Users", subtext: "Zero logs collected" },
  { icon: FiMessageSquare, value: "10M+", label: "E2EE Messages Delivered", subtext: "Sub-10ms delivery" },
  { icon: FiGlobe, value: "120+", label: "Countries Connected", subtext: "Distributed edge relays" },
];

export default function Stats() {
  return (
    <section className="relative z-10 px-6 sm:px-8 py-20 sm:py-28 text-purple-50" suppressHydrationWarning>
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, ease: "easeOut" }}
          className="neumorphic-card-dark rounded-3xl p-10 sm:p-16 relative overflow-hidden"
        >
          {/* Background SVG Grid Pattern */}
          <div className="absolute inset-0 opacity-15 pointer-events-none">
            <svg width="100%" height="100%">
              <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#818cf8" strokeWidth="0.5" />
              </pattern>
              <rect width="100%" height="100%" fill="url(#grid)" />
            </svg>
          </div>

          <div className="relative z-10 grid gap-10 md:grid-cols-3">
            {stats.map((s, i) => (
              <motion.div
                key={s.label}
                initial={{ opacity: 0, scale: 0.92 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.15 }}
                className="text-center neumorphic-inset-dark p-8 rounded-2xl flex flex-col items-center justify-center space-y-3"
              >
                <div className="p-3.5 rounded-2xl border border-purple-500/30 bg-purple-950/70 text-purple-300">
                  <s.icon className="h-7 w-7 text-indigo-400" />
                </div>
                <p className="text-4xl sm:text-5xl font-black text-white tracking-tight">{s.value}</p>
                <p className="text-base font-bold text-purple-200">{s.label}</p>
                <p className="text-xs text-purple-300/70">{s.subtext}</p>
              </motion.div>
            ))}
          </div>

          {/* SVG Node Explanatory Visual */}
          <div className="mt-14 pt-8 border-t border-purple-500/20 flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3.5">
              <div className="p-3 rounded-xl border border-purple-500/30 bg-purple-950/60">
                <FiActivity className="w-5 h-5 text-purple-400" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white">Global High-Availability Mesh</h4>
                <p className="text-xs text-purple-200/70">Redis Pub/Sub cluster with edge WebSockets for zero lag</p>
              </div>
            </div>

            <div className="flex items-center gap-2 font-mono text-xs text-indigo-300 border border-purple-500/30 bg-purple-950/50 px-4 py-2.5 rounded-xl">
              <FiLock className="w-4 h-4 text-purple-400" />
              <span>100% Zero-Knowledge Verified</span>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
