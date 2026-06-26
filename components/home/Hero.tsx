import React from 'react';
import { motion, Variants } from 'framer-motion';
import { FiArrowUpRight, FiShield, FiCpu, FiDatabase, FiLock, FiServer, FiTerminal } from 'react-icons/fi';

// Path drawing animation for SVGs on mount with infinite self-drawing loop
const pathSelfDraw: Variants = {
  hidden: {
    pathLength: 0,
    pathOffset: 0,
    opacity: 0
  },
  visible: {
    pathLength: [0, 1, 1, 0],
    pathOffset: [0, 0, 1, 1],
    opacity: [0, 1, 1, 0],
    transition: {
      duration: 4,
      repeat: Infinity,
      ease: "easeInOut",
      times: [0, 0.50, 0.55, 1]
    }
  }
};

// Subtle continuous floating motion
const floatAnim: Variants = {
  animate: {
    y: [-6, 6, -6],
    rotate: [0, 1.5, -1.5, 0],
    transition: {
      duration: 6,
      repeat: Infinity,
      ease: "easeInOut"
    }
  }
};

export const ZevraHero: React.FC = () => {
  return (
    <div className="h-screen mt-20 w-full text-white font-sans flex flex-col justify-between p-4 md:p-6 lg:p-8 overflow-hidden box-border">

      {/* Main Container */}
      <main className="grid grid-cols-1 lg:grid-cols-12 gap-6 w-full max-w-7xl mx-auto my-auto items-stretch h-full max-h-[85vh]">

        {/* Left Column (Content & Tech Badges Card) */}
        <div className="lg:col-span-7 flex flex-col justify-between space-y-4 md:space-y-6">

          {/* Main Headline & Server Purpose Intro */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="space-y-4 max-w-xl"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-indigo-500/30 text-indigo-300 text-xs font-semibold tracking-wider uppercase backdrop-blur-sm">
              <FiServer className="w-3.5 h-3.5 text-indigo-400" />
              <span>ZEVRA-Server Architecture</span>
            </div>

            <h1 className="text-4xl md:text-6xl font-bold tracking-tight leading-none text-slate-100">
              High Performance <br />
              <span className="text-indigo-500">Backend System</span> <br />
              Infrastructure
            </h1>

            <p className="text-slate-400 text-xs md:text-sm lg:text-base leading-relaxed max-w-md">
              Engineered for seamless microservice orchestration, secure data vault management, high-concurrency API routing, and real-time backend synchronization.
            </p>

            {/* Action Buttons */}
            <div className="flex items-center space-x-3 pt-1">
              <button className="bg-indigo-600 text-white font-medium text-sm px-6 py-3 rounded-full hover:bg-indigo-500 transition-all shadow-lg shadow-indigo-600/25 flex items-center gap-2">
                <FiTerminal className="w-4 h-4" /> View Repository
              </button>
              <button className="text-indigo-300 border border-indigo-500/30 p-3 rounded-full hover:bg-indigo-500/20 transition-colors">
                <FiArrowUpRight className="w-5 h-5" />
              </button>
            </div>
          </motion.div>

          {/* Bottom Left Card - Server Network Nodes */}
          <motion.div
            initial="hidden"
            animate="visible"
            className="rounded-3xl border border-indigo-900/40 p-4 relative flex items-center justify-between overflow-hidden flex-1 min-h-[160px]"
          >
            {/* Background SVG Grid & Connection Lines */}
            <motion.svg
              variants={floatAnim}
              animate="animate"
              viewBox="0 0 500 160"
              className="w-full h-full stroke-indigo-500/40 fill-none absolute inset-0 pointer-events-none"
              strokeWidth="1.5"
            >
              <motion.path variants={pathSelfDraw} strokeDasharray="4 4" d="M 50 80 Q 150 20, 250 80 T 450 80" />
              <motion.path variants={pathSelfDraw} d="M 80 120 L 150 40 L 350 40 L 420 120 Z" />
              <motion.path variants={pathSelfDraw} d="M 250 20 L 250 140" stroke="#6366f1" strokeWidth="2" />
              <motion.circle variants={pathSelfDraw} cx="250" cy="80" r="30" stroke="#818cf8" strokeWidth="2" />
            </motion.svg>

            {/* Feature Modules Overlay */}
            <div className="relative z-10 grid grid-cols-3 gap-3 w-full my-auto">
              <div className="border border-indigo-800/40 rounded-2xl p-3 flex flex-col items-center text-center backdrop-blur-sm">
                <FiShield className="w-5 h-5 text-indigo-400 mb-1" />
                <span className="text-xs font-semibold text-slate-200">Vault Security</span>
                <span className="text-[10px] text-slate-400">JWT & Encryption</span>
              </div>
              <div className="border border-indigo-500/50 rounded-2xl p-3 flex flex-col items-center text-center backdrop-blur-sm">
                <FiCpu className="w-5 h-5 text-indigo-300 mb-1" />
                <span className="text-xs font-semibold text-slate-200">Core Engine</span>
                <span className="text-[10px] text-slate-400">Node / REST API</span>
              </div>
              <div className="border border-indigo-800/40 rounded-2xl p-3 flex flex-col items-center text-center backdrop-blur-sm">
                <FiDatabase className="w-5 h-5 text-indigo-400 mb-1" />
                <span className="text-xs font-semibold text-slate-200">Database</span>
                <span className="text-[10px] text-slate-400">Optimized Queries</span>
              </div>
            </div>
          </motion.div>

        </div>

        {/* Right Column (Continuous Self-Drawing Custom Animated SVG Shape Card) */}
        <motion.div
          initial="hidden"
          animate="visible"
          className="lg:col-span-5 rounded-3xl border border-indigo-900/50 relative flex flex-col justify-between p-6 md:p-8 overflow-hidden"
        >
          {/* Self-Drawing Polygon & Server Isometric Illustration */}
          <div className="absolute inset-0 flex items-center justify-center p-4">
            <svg
              viewBox="0 0 400 500"
              className="w-full h-full fill-none"
            >
              {/* Outer Hexagonal Framework */}
              <motion.polygon
                variants={pathSelfDraw}
                initial="hidden"
                animate="visible"
                points="200,30 360,120 360,380 200,470 40,380 40,120"
                stroke="rgba(99, 102, 241, 0.6)"
                strokeWidth="2.5"
                strokeDasharray="800"
              />

              {/* Inner Hexagonal Shield */}
              <motion.polygon
                variants={pathSelfDraw}
                initial="hidden"
                animate="visible"
                points="200,70 320,140 320,360 200,430 80,360 80,140"
                stroke="#818cf8"
                strokeWidth="2"
                strokeDasharray="600"
              />

              {/* Server Layer Poly-Lines */}
              <motion.path
                variants={pathSelfDraw}
                initial="hidden"
                animate="visible"
                stroke="#6366f1"
                strokeWidth="2"
                strokeDasharray="400"
                d="M 120 170 L 200 210 L 280 170 L 200 130 Z"
              />
              <motion.path
                variants={pathSelfDraw}
                initial="hidden"
                animate="visible"
                stroke="#818cf8"
                strokeWidth="2"
                strokeDasharray="400"
                d="M 120 230 L 200 270 L 280 230 L 200 190 Z"
              />
              <motion.path
                variants={pathSelfDraw}
                initial="hidden"
                animate="visible"
                stroke="#a5b4fc"
                strokeWidth="2"
                strokeDasharray="400"
                d="M 120 290 L 200 330 L 280 290 L 200 250 Z"
              />

              {/* Isometric Pillar Lines */}
              <motion.path
                variants={pathSelfDraw}
                initial="hidden"
                animate="visible"
                stroke="rgba(129, 140, 248, 0.7)"
                strokeWidth="1.5"
                strokeDasharray="300"
                d="M 120 170 V 290 M 200 210 V 330 M 280 170 V 290"
              />
            </svg>
          </div>

          {/* Top Pill Tag */}
          <div className="relative z-10 flex justify-between items-center">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-indigo-400/30 text-xs text-indigo-200 backdrop-blur-md">
              <FiLock className="w-3 h-3 text-indigo-400" /> Secure Protocol
            </span>
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
            </span>
          </div>

          {/* Overlay Text Content */}
          <div className="relative z-10 space-y-3 mt-auto">
            <h2 className="text-2xl md:text-3xl font-bold leading-tight text-slate-100">
              Scalable, Secure & Modern Server Infrastructure
            </h2>
            <p className="text-slate-400 text-xs md:text-sm max-w-sm leading-relaxed">
              Designed for high availability, low latency communications, microservice scalability, and robust security management.
            </p>
          </div>
        </motion.div>

      </main>

      {/* Bottom Indigo Accent Line */}
      <div className="w-full h-1 bg-gradient-to-r from-transparent via-indigo-500 to-transparent rounded-full mt-2" />
    </div>
  );
};

export default ZevraHero;
