"use client";

import { motion, Variants } from "motion/react";
import {
  FiArrowUpRight,
  FiShield,
  FiKey,
  FiLock,
  FiEyeOff,
  FiCheckCircle,
  FiGithub,
} from "react-icons/fi";

const pathSelfDraw: Variants = {
  hidden: {
    pathLength: 0,
    pathOffset: 0,
    opacity: 0,
  },
  visible: {
    pathLength: [0, 1, 1, 0],
    pathOffset: [0, 0, 1, 1],
    opacity: [0.5, 1, 1, 0.6],
    transition: {
      duration: 6,
      repeat: Infinity,
      ease: "easeInOut",
      times: [0, 0.55, 0.85, 1],
    },
  },
};

export default function Hero() {
  return (
    <section className="relative z-10 w-full text-slate-100 font-sans flex flex-col justify-between px-4 sm:px-6 lg:pt-28 pb-12 box-border selection:bg-purple-600 selection:text-white" suppressHydrationWarning>
      <main className="grid grid-cols-1 lg:grid-cols-12 gap-6 w-full max-w-7xl mx-auto items-stretch">
        {/* Left Column */}
        <div className="lg:col-span-7 flex flex-col justify-between space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="space-y-4 max-w-2xl"
          >
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-purple-400/30 bg-purple-950/40 text-purple-300 text-xs font-semibold tracking-wide uppercase backdrop-blur-md">
              <FiEyeOff className="w-4 h-4 text-indigo-400" />
              <span>Zero-Knowledge Architecture</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-tight text-white">
              Privacy is a Right, <br />
              <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-indigo-300 bg-clip-text text-transparent">
                Not a Feature.
              </span>
            </h1>

            <p className="text-purple-200/80 text-base sm:text-lg leading-relaxed max-w-xl">
              ZEVRA guarantees absolute communication privacy. Our servers never store plaintext keys, never read your messages, and process only cryptographically sealed data.
            </p>

            <div className="flex flex-wrap items-center gap-4 pt-2">
              <a
                href="https://github.com/BazilSuhail/ZEVRA"
                target="_blank"
                rel="noopener noreferrer"
                className="neumorphic-button-dark text-white font-semibold text-sm px-6 py-3 rounded-xl transition-transform hover:scale-105 flex items-center gap-2 cursor-pointer"
              >
                <FiGithub className="w-4 h-4" /> View Source Code
              </a>
              <a
                href="/architecture"
                className="text-purple-200 border border-purple-500/30 bg-purple-950/30 hover:bg-purple-900/40 hover:border-purple-400/50 px-5 py-3 rounded-xl transition-all cursor-pointer flex items-center gap-2 text-sm font-medium"
              >
                <span>Security Whitepaper</span>
                <FiArrowUpRight className="w-4 h-4 text-purple-300" />
              </a>
            </div>
          </motion.div>

          {/* Security Protocol Metrics Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="neumorphic-card-dark rounded-2xl p-6 relative flex flex-col justify-between overflow-hidden min-h-60"
          >
            <motion.svg
              viewBox="0 0 500 120"
              className="w-full h-full stroke-purple-500/20 fill-none absolute inset-0 pointer-events-none"
              strokeWidth="1"
            >
              <motion.path
                variants={pathSelfDraw}
                initial="hidden"
                animate="visible"
                strokeDasharray="4 4"
                d="M 30 60 Q 150 10, 250 60 T 470 60"
              />
              <motion.path
                variants={pathSelfDraw}
                initial="hidden"
                animate="visible"
                d="M 60 90 L 180 30 L 320 30 L 440 90 Z"
              />
              <motion.circle
                variants={pathSelfDraw}
                initial="hidden"
                animate="visible"
                cx="250"
                cy="60"
                r="16"
                stroke="#a855f7"
                strokeWidth="1.5"
              />
            </motion.svg>

            <div className="relative z-10 flex justify-between items-center text-xs font-mono text-purple-300/90 uppercase tracking-wider">
              <span>Security Guarantees</span>
              <span className="flex items-center gap-1.5 text-indigo-300 text-xs font-medium">
                <FiCheckCircle className="w-3.5 h-3.5 text-purple-400" /> Encrypted Vault Active
              </span>
            </div>

            <div className="relative z-10 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-purple-100 pt-4">
              <div className="neumorphic-inset-dark p-3.5 rounded-xl flex items-center gap-3">
                <FiKey className="w-5 h-5 text-purple-400 shrink-0" />
                <div>
                  <div className="font-semibold text-white text-xs">
                    Client-Side Keys
                  </div>
                  <div className="text-[11px] text-purple-300/70">
                    Keys never leave device
                  </div>
                </div>
              </div>

              <div className="neumorphic-inset-dark p-3.5 rounded-xl flex items-center gap-3">
                <FiShield className="w-5 h-5 text-indigo-400 shrink-0" />
                <div>
                  <div className="font-semibold text-white text-xs">
                    Zero-Knowledge Database
                  </div>
                  <div className="text-[11px] text-purple-300/70">
                    Stolen DB = Ciphertext payload
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Right Column - Cryptographic Vault Visual */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.7, delay: 0.3 }}
          className="lg:col-span-5 neumorphic-card-dark rounded-2xl relative flex flex-col justify-between p-6 overflow-hidden min-h-[380px]"
        >
          <div className="absolute inset-0 flex items-center justify-center p-6 pointer-events-none">
            <svg
              viewBox="0 0 400 400"
              className="w-full h-full fill-none max-w-[300px]"
            >
              <motion.polygon
                variants={pathSelfDraw}
                initial="hidden"
                animate="visible"
                points="200,20 350,100 350,300 200,380 50,300 50,100"
                stroke="rgba(168, 85, 247, 0.45)"
                strokeWidth="1.5"
                strokeDasharray="600"
              />
              <motion.rect
                variants={pathSelfDraw}
                initial="hidden"
                animate="visible"
                x="150"
                y="180"
                width="100"
                height="80"
                rx="12"
                stroke="#6366f1"
                strokeWidth="1.5"
                strokeDasharray="360"
              />
              <motion.path
                variants={pathSelfDraw}
                initial="hidden"
                animate="visible"
                stroke="#c084fc"
                strokeWidth="1.5"
                strokeDasharray="200"
                d="M 165 180 V 145 A 35 35 0 0 1 235 145 V 180"
              />
              <motion.circle
                variants={pathSelfDraw}
                initial="hidden"
                animate="visible"
                cx="200"
                cy="212"
                r="8"
                stroke="#a855f7"
                strokeWidth="1.5"
                strokeDasharray="60"
              />
              <motion.path
                variants={pathSelfDraw}
                initial="hidden"
                animate="visible"
                stroke="#a855f7"
                strokeWidth="1.5"
                strokeDasharray="40"
                d="M 196 218 L 192 238 H 208 L 204 218"
              />
              <motion.path
                variants={pathSelfDraw}
                initial="hidden"
                animate="visible"
                stroke="rgba(99, 102, 241, 0.4)"
                strokeWidth="1"
                strokeDasharray="180"
                d="M 200 20 V 110 M 200 260 V 380 M 50 100 L 150 180 M 350 100 L 250 180 M 50 300 L 150 260 M 350 300 L 250 260"
              />
            </svg>
          </div>

          <div className="relative z-10 flex justify-between items-center">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-purple-500/30 bg-purple-950/60 text-xs font-mono text-purple-200 backdrop-blur-md">
              <FiLock className="w-3.5 h-3.5 text-purple-400" /> AES-256-GCM / E2EE
            </span>
            <span className="flex h-3 w-3 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-purple-500"></span>
            </span>
          </div>

          <div className="relative z-10 space-y-2 mt-auto pt-24">
            <h2 className="text-xl font-bold text-white leading-snug">
              Uncompromising Zero-Trust
            </h2>
            <p className="text-purple-200/80 text-xs leading-relaxed">
              Every message payload is encrypted client-side before transmission. Even in the event of a full server compromise, zero plaintexts are revealed.
            </p>
          </div>
        </motion.div>
      </main>

      <div className="w-full max-w-7xl mx-auto h-[1px] bg-gradient-to-r from-transparent via-purple-500/30 to-transparent mt-12" />
    </section>
  );
}
