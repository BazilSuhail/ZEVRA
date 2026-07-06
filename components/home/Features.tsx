"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform } from "motion/react";
import { FiLock, FiShield, FiZap, FiSmartphone, FiServer, FiCpu, FiCheck } from "react-icons/fi";

const features = [
  {
    icon: FiLock,
    title: "Zero-Knowledge E2EE",
    desc: "Every message in Zevra chat is encrypted on your device using AES-256-GCM. Our servers never see plaintext - only cryptographically sealed payloads.",
    tag: "AES-256-GCM",
  },
  {
    icon: FiShield,
    title: "SRP-6a Authentication",
    desc: "Zevra uses Secure Remote Password protocol for authentication without ever transmitting your password. Your credentials stay 100% safe.",
    tag: "Zero-Password Transmission",
  },
  {
    icon: FiZap,
    title: "Real-Time & Scalable",
    desc: "Powered by Redis Pub/Sub, BullMQ, and a multi-node WebSocket architecture, Zevra delivers instant message delivery with ultra-low latency.",
    tag: "Sub-10ms Latency",
  },
];

export default function Features() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"],
  });

  const svgScale = useTransform(scrollYProgress, [0.1, 0.5, 0.9], [0.94, 1, 0.96]);
  const svgOpacity = useTransform(scrollYProgress, [0.1, 0.35, 0.85, 1], [0.5, 1, 1, 0.6]);

  return (
    <section ref={containerRef} className="relative z-10 px-6 sm:px-8 py-28 sm:py-36 text-purple-50" suppressHydrationWarning>
      <div className="max-w-7xl mx-auto space-y-20">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.7, ease: "easeOut" }}
          className="text-center space-y-5 max-w-3xl mx-auto"
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-purple-500/30 bg-purple-950/60 text-purple-300 text-xs font-semibold uppercase tracking-widest backdrop-blur-md">
            <FiCpu className="w-4 h-4 text-indigo-400" />
            <span>Cryptographic Foundations</span>
          </div>

          <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight leading-tight">
            Why Choose{" "}
            <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-indigo-300 bg-clip-text text-transparent">
              Zevra Chat
            </span>
            ?
          </h2>

          <p className="text-purple-200/80 text-base sm:text-lg leading-relaxed max-w-2xl mx-auto">
            Engineered from first principles for absolute privacy, high throughput, and verifiable mathematical security.
          </p>
        </motion.div>

        {/* Feature Cards Grid */}
        <div className="grid gap-10 md:grid-cols-3">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 36 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.6, delay: i * 0.18, ease: "easeOut" }}
              whileHover={{ y: -8 }}
              className="neumorphic-card-dark neumorphic-card-dark-hover rounded-3xl p-8 sm:p-10 flex flex-col justify-between"
            >
              <div className="space-y-6">
                <div className="inline-flex p-4 rounded-2xl border border-purple-500/30 bg-purple-950/60 text-indigo-400">
                  <f.icon className="h-8 w-8 text-purple-300" />
                </div>
                
                <div className="space-y-3">
                  <h3 className="text-2xl font-bold text-white tracking-tight">{f.title}</h3>
                  <p className="text-purple-200/75 text-sm sm:text-base leading-relaxed">{f.desc}</p>
                </div>
              </div>

              <div className="pt-8 mt-6 border-t border-purple-500/20 flex items-center justify-between">
                <span className="text-xs font-mono px-3.5 py-1.5 rounded-lg border border-indigo-500/30 bg-indigo-950/50 text-indigo-300 font-medium">
                  {f.tag}
                </span>
                <FiCheck className="w-4 h-4 text-purple-400" />
              </div>
            </motion.div>
          ))}
        </div>

        {/* Custom Interactive SVG Diagram */}
        <motion.div
          style={{ scale: svgScale, opacity: svgOpacity }}
          className="neumorphic-card-dark rounded-3xl p-8 sm:p-12 border border-purple-500/30 overflow-hidden"
        >
          <div className="text-center space-y-3 mb-10 max-w-2xl mx-auto">
            <span className="text-xs font-mono uppercase tracking-widest text-indigo-400 font-semibold">
              Interactive System Flow
            </span>
            <h3 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              End-to-End Encryption Packet Relay
            </h3>
            <p className="text-purple-200/75 text-sm leading-relaxed">
              Demonstrating client-side payload encryption and zero-knowledge transmission across distributed Zevra relay nodes.
            </p>
          </div>

          <div className="w-full flex justify-center items-center py-4">
            <svg viewBox="0 0 900 320" className="w-full max-w-4xl fill-none">
              <defs>
                <linearGradient id="purpleGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#6366f1" />
                  <stop offset="50%" stopColor="#a855f7" />
                  <stop offset="100%" stopColor="#818cf8" />
                </linearGradient>
              </defs>

              {/* Connecting Conduit Paths */}
              <motion.path
                d="M 180 160 H 450"
                stroke="url(#purpleGradient)"
                strokeWidth="3"
                strokeDasharray="6 6"
                initial={{ strokeDashoffset: 120 }}
                animate={{ strokeDashoffset: 0 }}
                transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
              />
              <motion.path
                d="M 450 160 H 720"
                stroke="url(#purpleGradient)"
                strokeWidth="3"
                strokeDasharray="6 6"
                initial={{ strokeDashoffset: 120 }}
                animate={{ strokeDashoffset: 0 }}
                transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
              />

              {/* Sender Node */}
              <g transform="translate(60, 70)">
                <rect x="0" y="0" width="180" height="180" rx="24" fill="#140e34" stroke="#818cf8" strokeWidth="1.5" />
                <foreignObject x="0" y="0" width="180" height="180">
                  <div className="h-full flex flex-col items-center justify-center p-4 text-center space-y-2">
                    <div className="p-2.5 rounded-xl bg-purple-950/80 border border-purple-500/30 text-purple-300">
                      <FiSmartphone className="w-6 h-6 text-purple-400" />
                    </div>
                    <span className="text-sm font-bold text-white">Alice (Client A)</span>
                    <span className="text-xs text-purple-200/70">Encrypts Payload</span>
                    <span className="text-[10px] font-mono bg-purple-950/90 px-2.5 py-1 rounded-md border border-purple-500/40 text-purple-300">
                      PrivKey<sub>A</sub>
                    </span>
                  </div>
                </foreignObject>
              </g>

              {/* Relay Server Node */}
              <g transform="translate(360, 60)">
                <rect x="0" y="0" width="180" height="200" rx="24" fill="#0b081d" stroke="#a855f7" strokeWidth="1.5" />
                <foreignObject x="0" y="0" width="180" height="200">
                  <div className="h-full flex flex-col items-center justify-center p-4 text-center space-y-2">
                    <div className="p-2.5 rounded-xl bg-indigo-950/80 border border-indigo-500/30 text-indigo-300">
                      <FiServer className="w-6 h-6 text-indigo-400" />
                    </div>
                    <span className="text-sm font-bold text-white">Zevra Edge Relay</span>
                    <span className="text-xs text-purple-200/70">Encrypted Ciphertext</span>
                    <div className="text-[10px] font-mono bg-indigo-950/90 px-2.5 py-1 rounded-md border border-indigo-500/40 text-indigo-300">
                      Zero Plaintext Access
                    </div>
                  </div>
                </foreignObject>
              </g>

              {/* Recipient Node */}
              <g transform="translate(660, 70)">
                <rect x="0" y="0" width="180" height="180" rx="24" fill="#140e34" stroke="#818cf8" strokeWidth="1.5" />
                <foreignObject x="0" y="0" width="180" height="180">
                  <div className="h-full flex flex-col items-center justify-center p-4 text-center space-y-2">
                    <div className="p-2.5 rounded-xl bg-purple-950/80 border border-purple-500/30 text-purple-300">
                      <FiSmartphone className="w-6 h-6 text-purple-400" />
                    </div>
                    <span className="text-sm font-bold text-white">Bob (Client B)</span>
                    <span className="text-xs text-purple-200/70">Decrypts Payload</span>
                    <span className="text-[10px] font-mono bg-purple-950/90 px-2.5 py-1 rounded-md border border-purple-500/40 text-purple-300">
                      PubKey<sub>A</sub> / PrivKey<sub>B</sub>
                    </span>
                  </div>
                </foreignObject>
              </g>

              {/* Animated Encrypted Data Packets */}
              <motion.g
                animate={{
                  x: [240, 450, 660],
                }}
                transition={{
                  duration: 4.5,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              >
                <circle cx="0" cy="160" r="14" fill="#6366f1" stroke="#c084fc" strokeWidth="2" />
                <path d="M -4 160 L 0 156 L 4 160 M 0 156 V 164" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" />
              </motion.g>
            </svg>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
