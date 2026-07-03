import React from 'react';
import { motion, Variants } from 'framer-motion';
import {
  FiArrowUpRight,
  FiShield,
  FiKey,
  FiLock,
  FiEyeOff,
  FiCheckCircle,
  FiGithub
} from 'react-icons/fi';

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
      ease: 'easeInOut',
      times: [0, 0.55, 0.85, 1],
    },
  },
};

const pulseGlow: Variants = {
  animate: {
    scale: [1, 1.05, 1],
    opacity: [0.4, 0.8, 0.4],
    transition: {
      duration: 4,
      repeat: Infinity,
      ease: 'easeInOut',
    },
  },
};

export const ZevraHero: React.FC = () => {
  return (
    <div className="w-full text-slate-100 font-sans flex flex-col justify-between p-4 sm:p-6 lg:pt-28  box-border selection:bg-indigo-500 selection:text-white">
      {/* Main Grid */}
      <main className="grid grid-cols-1 lg:grid-cols-12 gap-5 w-full max-w-7xl mx-auto items-stretch">

        {/* Left Column (Main Copy & Architectural Badges) */}
        <div className="lg:col-span-7 flex flex-col justify-between space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="space-y-4 max-w-2xl"
          >
            {/* Tag Badge */}
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-indigo-500/30 bg-indigo-500/10 text-indigo-300 text-[11px] font-medium tracking-wide uppercase backdrop-blur-md">
              <FiEyeOff className="w-3.5 h-3.5 text-indigo-400" />
              <span>Zero-Knowledge Architecture</span>
            </div>

            {/* Headline */}
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-semibold tracking-tight leading-tight text-white">
              Privacy is a Right, <br />
              <span className="text-indigo-400 font-bold">Not a Feature.</span>
            </h1>

            {/* Body Text */}
            <p className="text-slate-400 text-sm sm:text-base leading-relaxed max-w-xl">
              ZEVRA guarantees absolute communication privacy. Our servers never store plaintext keys, never read your messages, and process only cryptographically sealed data.
            </p>

            {/* Action Buttons */}
            <div className="flex items-center gap-3 pt-2">
              <button className="bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs sm:text-sm px-4 py-2.5 rounded-lg transition-all shadow-sm shadow-indigo-600/30 flex items-center gap-2 cursor-pointer">
                <FiGithub className="w-4 h-4" /> View Source Code
              </button>
              <button className="text-slate-300 border border-slate-700/60 hover:bg-slate-800/50 hover:border-slate-600 p-2.5 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 text-xs sm:text-sm">
                <span>Security Whitepaper</span>
                <FiArrowUpRight className="w-4 h-4 text-slate-400" />
              </button>
            </div>
          </motion.div>

          {/* Bottom Left Card - Security Protocol Metrics */}
          <motion.div
            initial="hidden"
            animate="visible"
            className="rounded-2xl border border-indigo-900/30 bg-slate-900/40 backdrop-blur-sm p-5 relative flex flex-col justify-between overflow-hidden min-h-60"
          >
            {/* Background SVG Signal Grid */}
            <motion.svg
              viewBox="0 0 500 120"
              className="w-full h-full stroke-indigo-500/20 fill-none absolute inset-0 pointer-events-none"
              strokeWidth="1"
            >
              <motion.path variants={pathSelfDraw} strokeDasharray="4 4" d="M 30 60 Q 150 10, 250 60 T 470 60" />
              <motion.path variants={pathSelfDraw} d="M 60 90 L 180 30 L 320 30 L 440 90 Z" />
              <motion.circle variants={pathSelfDraw} cx="250" cy="60" r="16" stroke="#818cf8" strokeWidth="1.5" />
            </motion.svg>

            {/* Card Content Header */}
            <div className="relative z-10 flex justify-between items-center text-xs font-mono text-indigo-300/80 uppercase tracking-wider">
              <span>Security Guarantees</span>
              <span className="flex items-center gap-1.5 text-emerald-400 text-[11px]">
                <FiCheckCircle className="w-3.5 h-3.5" /> Encrypted Vault Active
              </span>
            </div>

            {/* Status Grid */}
            <div className="relative z-10 grid grid-cols-2 gap-4 text-xs text-slate-300 pt-3">
              <div className="flex items-center gap-2.5 bg-slate-950/40 p-2.5 rounded-lg border border-slate-800/60">
                <FiKey className="w-4 h-4 text-indigo-400 shrink-0" />
                <div>
                  <div className="font-medium text-white text-xs">Client-Side Keys</div>
                  <div className="text-[10px] text-slate-400">Keys never leave device</div>
                </div>
              </div>

              <div className="flex items-center gap-2.5 bg-slate-950/40 p-2.5 rounded-lg border border-slate-800/60">
                <FiShield className="w-4 h-4 text-indigo-400 shrink-0" />
                <div>
                  <div className="font-medium text-white text-xs">Zero-Knowledge Database</div>
                  <div className="text-[10px] text-slate-400">Stolen DB = Ciphertext payload</div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Right Column (Cryptographic Vault Visual) */}
        <motion.div
          initial="hidden"
          animate="visible"
          className="lg:col-span-5 rounded-2xl border border-indigo-900/40 bg-slate-900/30 backdrop-blur-sm relative flex flex-col justify-between p-5 sm:p-6 overflow-hidden"
        >
          {/* Cryptographic Vault SVG Illustration */}
          <div className="absolute inset-0 flex items-center justify-center p-6 opacity-90 pointer-events-none">
            <svg viewBox="0 0 400 400" className="w-full h-full fill-none max-w-[280px]">
              {/* Outer Geometric Vault Shield */}
              <motion.polygon
                variants={pathSelfDraw}
                initial="hidden"
                animate="visible"
                points="200,20 350,100 350,300 200,380 50,300 50,100"
                stroke="rgba(99, 102, 241, 0.4)"
                strokeWidth="1.5"
                strokeDasharray="600"
              />

              {/* Center Cryptographic Lock Body */}
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

              {/* Lock Shackle */}
              <motion.path
                variants={pathSelfDraw}
                initial="hidden"
                animate="visible"
                stroke="#818cf8"
                strokeWidth="1.5"
                strokeDasharray="200"
                d="M 165 180 V 145 A 35 35 0 0 1 235 145 V 180"
              />

              {/* Keyhole / Zero-Knowledge Core */}
              <motion.circle
                variants={pathSelfDraw}
                initial="hidden"
                animate="visible"
                cx="200"
                cy="212"
                r="8"
                stroke="#a5b4fc"
                strokeWidth="1.5"
                strokeDasharray="60"
              />

              <motion.path
                variants={pathSelfDraw}
                initial="hidden"
                animate="visible"
                stroke="#a5b4fc"
                strokeWidth="1.5"
                strokeDasharray="40"
                d="M 196 218 L 192 238 H 208 L 204 218"
              />

              {/* Key & Encrypted Data Ray Pathways */}
              <motion.path
                variants={pathSelfDraw}
                initial="hidden"
                animate="visible"
                stroke="rgba(129, 140, 248, 0.45)"
                strokeWidth="1"
                strokeDasharray="180"
                d="M 200 20 V 110 M 200 260 V 380 M 50 100 L 150 180 M 350 100 L 250 180 M 50 300 L 150 260 M 350 300 L 250 260"
              />
            </svg>
          </div>

          {/* Top Status Indicator */}
          <div className="relative z-10 flex justify-between items-center">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border border-indigo-500/20 bg-indigo-950/50 text-[11px] text-indigo-300 backdrop-blur-md">
              <FiLock className="w-3 h-3 text-indigo-400" /> AES-256-GCM / E2EE
            </span>
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
          </div>

          {/* Card Footnote */}
          <div className="relative z-10 space-y-1.5 mt-auto pt-16">
            <h2 className="text-lg font-semibold text-slate-100 leading-snug">
              Uncompromising Zero-Trust
            </h2>
            <p className="text-slate-400 text-xs leading-relaxed">
              Every message payload is encrypted client-side before transmission. Even in the event of a full server compromise, zero plaintexts are revealed.
            </p>
          </div>
        </motion.div>
      </main>

      {/* Subtle Bottom Divider */}
      <div className="w-full max-w-7xl mx-auto h-[1px] bg-gradient-to-r from-transparent via-indigo-500/20 to-transparent mt-8" />
    </div>
  );
};

export default ZevraHero;
