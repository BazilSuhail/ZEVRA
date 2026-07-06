"use client";

import { motion, useScroll, useTransform } from "motion/react";
import { useRef } from "react";
import {
  FiLock,
  FiKey,
  FiShield,
  FiServer,
  FiMessageSquare,
  FiZap,
  FiArrowRight,
  FiGithub,
  FiCheckCircle,
  FiGlobe,
  FiCpu,
} from "react-icons/fi";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/home/Footer";
import Link from "next/link";

const cryptoSteps = [
  {
    phase: "01",
    title: "SRP-6a Authentication",
    desc: "When you sign in to Zevra, the Secure Remote Password protocol ensures your password never travels over the network. The client generates a proof (A) and verifier (M1) while the server responds with its own proof (B, M2). Both sides derive the same session key without either revealing the password.",
    icon: FiLock,
    details: [
      "Password never transmitted in plaintext",
      "Resistance to offline dictionary attacks",
      "Mutual authentication between client and server",
      "Per-session salt and ephemeral values",
    ],
  },
  {
    phase: "02",
    title: "X25519 Key Exchange",
    desc: "Every Zevra chat session generates ephemeral X25519 key pairs. The Curve25519 Diffie-Hellman protocol establishes a shared secret between two parties without any prior contact. Even if an attacker intercepts all traffic, they cannot derive the shared secret without solving the elliptic curve discrete logarithm problem.",
    icon: FiKey,
    details: [
      "Elliptic Curve Diffie-Hellman (ECDH)",
      "128-bit security level",
      "Ephemeral keys per session (forward secrecy)",
      "Constant-time implementation resistant to timing attacks",
    ],
  },
  {
    phase: "03",
    title: "Ed25519 Digital Signatures",
    desc: "Every message and key exchange in Zevra chat is signed with Ed25519 keys. This ensures authenticity: you can verify that a message genuinely came from your contact and was not tampered with in transit. The signature is fast to generate and verify, adding negligible overhead to real-time communication.",
    icon: FiShield,
    details: [
      "EdDSA signatures for message authenticity",
      "Tamper-proof message delivery",
      "Non-repudiation: sender cannot deny their message",
      "Compact 64-byte signatures",
    ],
  },
  {
    phase: "04",
    title: "AES-256-GCM Encryption",
    desc: "The actual message content is encrypted with AES-256-GCM, the gold standard for symmetric encryption. GCM mode provides both confidentiality and integrity: each message is encrypted and authenticated, meaning any modification is detected and rejected. Your plaintext never exists on Zevra's servers.",
    icon: FiMessageSquare,
    details: [
      "256-bit key size (brute-force infeasible)",
      "Authenticated encryption (confidentiality + integrity)",
      "Random IV per message prevents pattern analysis",
      "Hardware-accelerated AES-NI support",
    ],
  },
];

const infraComponents = [
  {
    icon: FiServer,
    title: "Redis Pub/Sub",
    desc: "Real-time message routing through Redis channels. Each connected client subscribes to their personal channel. Messages are delivered in microseconds with at-most-once delivery semantics, ensuring no duplicates in your Zevra chat.",
  },
  {
    icon: FiZap,
    title: "BullMQ Workers",
    desc: "Background job processing for message queuing, delivery retries, and push notifications. BullMQ provides reliable, Redis-backed job queues with rate limiting, retries, and priority scheduling for Zevra's multi-node architecture.",
  },
  {
    icon: FiGlobe,
    title: "Multi-Node Scaling",
    desc: "Zevra's backend runs as a cluster of stateless nodes behind a load balancer. Session state lives in Redis, allowing any node to handle any request. This architecture enables horizontal scaling to millions of concurrent encrypted chat sessions.",
  },
  {
    icon: FiCheckCircle,
    title: "Zero-Knowledge Server",
    desc: "Zevra's servers are designed to be zero-knowledge by construction. They store only encrypted blobs they cannot decrypt. Even database dumps yield nothing but ciphertext. Server compromise does not equal data compromise.",
  },
];

const comparisonData = [
  { feature: "Password Transmitted", zevra: "Never", whatsapp: "Hashed", signal: "Never" },
  { feature: "Key Storage", zevra: "Client-side only", whatsapp: "Server backup", signal: "Client + optional backup" },
  { feature: "Encryption Protocol", zevra: "AES-256-GCM + X25519", whatsapp: "Signal Protocol", signal: "Signal Protocol" },
  { feature: "Authentication", zevra: "SRP-6a", whatsapp: "Phone number", signal: "Phone number" },
  { feature: "Open Source", zevra: "Fully auditable", whatsapp: "Partial", signal: "Fully auditable" },
  { feature: "Video Conferencing", zevra: "E2EE", whatsapp: "E2EE", signal: "E2EE" },
  { feature: "Zero-Knowledge Server", zevra: "Yes", whatsapp: "No", signal: "No" },
];

export default function ArchitecturePage() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: containerRef });
  const heroY = useTransform(scrollYProgress, [0, 0.3], [0, -40]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.25], [1, 0]);

  return (
    <div ref={containerRef} className="flex min-h-screen flex-col bg-[#070514] text-purple-50 selection:bg-purple-600 selection:text-white" suppressHydrationWarning>
      <Navbar />

      {/* Hero Section */}
      <section className="relative flex min-h-[75vh] flex-col items-center justify-center overflow-hidden px-6 pt-28 pb-16 text-center">
        <div className="absolute inset-0 -z-10 pointer-events-none">
          <div className="absolute left-1/3 top-1/4 -z-10 h-[500px] w-[500px] -translate-x-1/2 rounded-full bg-indigo-600/15 blur-[140px]" />
          <div className="absolute right-1/3 top-1/3 -z-10 h-[400px] w-[400px] rounded-full bg-purple-600/15 blur-[120px]" />
        </div>

        <motion.div
          style={{ y: heroY, opacity: heroOpacity }}
          className="w-full max-w-5xl space-y-6"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl border border-purple-500/30 bg-purple-950/60 text-purple-300"
          >
            <FiShield className="h-10 w-10 text-indigo-400" />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-purple-500/30 bg-purple-950/50 text-purple-300 text-xs font-semibold uppercase tracking-wider backdrop-blur-md"
          >
            <FiCpu className="w-4 h-4 text-purple-400" />
            <span>Technical Deep Dive</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.15 }}
            className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-white leading-tight"
          >
            The Cryptographic{" "}
            <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-indigo-300 bg-clip-text text-transparent">
              Architecture
            </span>{" "}
            of Zevra
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.3 }}
            className="mx-auto max-w-3xl text-base sm:text-lg text-purple-200/80 leading-relaxed"
          >
            A complete technical breakdown of how Zevra achieves zero-knowledge, end-to-end encrypted real-time communication. Engineered by{" "}
            <span className="font-bold text-white">Bazil Suhail</span> using SRP-6a, X25519, Ed25519, and AES-256-GCM.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.45 }}
            className="flex flex-wrap items-center justify-center gap-4 pt-4"
          >
            <Link href="/auth/register">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.96 }}
                className="neumorphic-button-dark text-white font-bold px-8 py-3.5 rounded-xl text-sm flex items-center gap-2.5 cursor-pointer"
              >
                Try Zevra Chat <FiArrowRight className="h-4 w-4" />
              </motion.button>
            </Link>

            <a
              href="https://github.com/BazilSuhail/ZEVRA"
              target="_blank"
              rel="noopener noreferrer"
            >
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                className="border border-purple-500/30 bg-purple-950/40 hover:bg-purple-900/40 text-purple-200 font-semibold px-7 py-3.5 rounded-xl text-sm transition-all flex items-center gap-2 cursor-pointer"
              >
                <FiGithub className="h-4 w-4 text-purple-300" /> Audit the Code
              </motion.button>
            </a>
          </motion.div>
        </motion.div>
      </section>

      {/* Crypto Pipeline Steps */}
      <section className="px-6 pb-28">
        <div className="mx-auto max-w-6xl space-y-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            className="text-center space-y-3 max-w-2xl mx-auto"
          >
            <span className="text-xs font-mono uppercase tracking-widest text-indigo-400 font-semibold">
              Encryption Pipeline
            </span>
            <h2 className="text-3xl font-extrabold text-white tracking-tight">
              How Zevra Encrypts Every Message
            </h2>
            <p className="text-purple-200/80 text-sm sm:text-base">
              From authentication to delivery, every step in Zevra&apos;s pipeline is designed to keep your data confidential and authenticated.
            </p>
          </motion.div>

          <div className="space-y-8">
            {cryptoSteps.map((step, i) => (
              <motion.div
                key={step.phase}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-80px" }}
                transition={{ duration: 0.6, delay: i * 0.1 }}
                className="neumorphic-card-dark rounded-3xl p-8 sm:p-10 relative overflow-hidden"
              >
                <div className="absolute right-4 top-2 text-[140px] font-black text-purple-500/10 select-none pointer-events-none font-mono">
                  {step.phase}
                </div>

                <div className="relative grid gap-8 lg:grid-cols-5 items-center">
                  <div className="lg:col-span-2 space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="p-3.5 rounded-2xl border border-purple-500/30 bg-purple-950/60 text-purple-300">
                        <step.icon className="h-6 w-6 text-indigo-400" />
                      </div>
                      <span className="text-xs font-mono font-semibold uppercase tracking-wider text-purple-300">
                        Phase {step.phase}
                      </span>
                    </div>

                    <h3 className="text-2xl font-bold text-white">{step.title}</h3>
                    <p className="text-sm leading-relaxed text-purple-200/80">
                      {step.desc}
                    </p>
                  </div>

                  <div className="lg:col-span-3">
                    <div className="grid gap-3 sm:grid-cols-2">
                      {step.details.map((d, j) => (
                        <motion.div
                          key={d}
                          initial={{ opacity: 0, y: 10 }}
                          whileInView={{ opacity: 1, y: 0 }}
                          viewport={{ once: true }}
                          transition={{ delay: j * 0.08 }}
                          className="neumorphic-inset-dark p-4 rounded-xl flex items-start gap-2.5"
                        >
                          <FiCheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-purple-400" />
                          <span className="text-xs text-purple-200/85">
                            {d}
                          </span>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Architecture Diagram */}
      <section className="px-6 pb-28">
        <div className="mx-auto max-w-5xl space-y-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            className="text-center space-y-3 max-w-2xl mx-auto"
          >
            <span className="text-xs font-mono uppercase tracking-widest text-indigo-400 font-semibold">
              System Topology
            </span>
            <h2 className="text-3xl font-extrabold text-white tracking-tight">
              Zevra Multi-Node Architecture
            </h2>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, margin: "-80px" }}
            className="neumorphic-card-dark rounded-3xl p-8 sm:p-12 border border-purple-500/30 overflow-hidden"
          >
            <div className="font-mono text-xs leading-relaxed text-purple-200/90 overflow-x-auto">
              <pre className="whitespace-pre">{`
    ┌──────────────┐     ┌──────────────┐     ┌──────────────┐
    │   Client A   │     │   Client B   │     │   Client C   │
    │  (Browser)   │     │  (Browser)   │     │  (Browser)   │
    └──────┬───────┘     └──────┬───────┘     └──────┬───────┘
           │ X25519/AES-256     │ X25519/AES-256     │ X25519/AES-256
           │                    │                    │
    ───────┼────────────────────┼────────────────────┼───────
           │                    │                    │
    ┌──────▼────────────────────▼────────────────────▼───────┐
    │                    Load Balancer                        │
    └──────┬────────────────────┬────────────────────┬───────┘
           │                    │                    │
    ┌──────▼───────┐    ┌──────▼───────┐    ┌──────▼───────┐
    │   Node 1     │    │   Node 2     │    │   Node 3     │
    │  (Stateless) │    │  (Stateless) │    │  (Stateless) │
    └──────┬───────┘    └──────┬───────┘    └──────┬───────┘
           │                    │                    │
    ───────┼────────────────────┼────────────────────┼───────
           │                    │                    │
    ┌──────▼────────────────────▼────────────────────▼───────┐
    │              Redis (Pub/Sub + BullMQ)                  │
    │         Message Queues + Session State                 │
    └────────────────────────────────────────────────────────┘
              `}</pre>
            </div>
            <p className="mt-6 text-center text-xs text-purple-300/70">
              Every message is encrypted client-side before transmission. Zevra servers process only ciphertext.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Infrastructure Components */}
      <section className="px-6 pb-28">
        <div className="mx-auto max-w-6xl space-y-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            className="text-center space-y-3 max-w-2xl mx-auto"
          >
            <span className="text-xs font-mono uppercase tracking-widest text-indigo-400 font-semibold">
              Infrastructure
            </span>
            <h2 className="text-3xl font-extrabold text-white tracking-tight">
              Real-Time Delivery at Scale
            </h2>
            <p className="text-purple-200/80 text-sm sm:text-base">
              Zevra&apos;s backend is built for millions of concurrent encrypted chat sessions with sub-10ms delivery.
            </p>
          </motion.div>

          <div className="grid gap-8 md:grid-cols-2">
            {infraComponents.map((comp, i) => (
              <motion.div
                key={comp.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.5, delay: i * 0.12 }}
                whileHover={{ y: -6 }}
                className="neumorphic-card-dark neumorphic-card-dark-hover rounded-3xl p-8 space-y-4"
              >
                <div className="p-3.5 w-fit rounded-2xl border border-purple-500/30 bg-purple-950/60 text-purple-300">
                  <comp.icon className="h-6 w-6 text-indigo-400" />
                </div>
                <h3 className="text-xl font-bold text-white">{comp.title}</h3>
                <p className="text-sm leading-relaxed text-purple-200/75">
                  {comp.desc}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Comparison Table */}
      <section className="px-6 pb-28">
        <div className="mx-auto max-w-4xl space-y-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            className="text-center space-y-3 max-w-2xl mx-auto"
          >
            <span className="text-xs font-mono uppercase tracking-widest text-indigo-400 font-semibold">
              Platform Matrix
            </span>
            <h2 className="text-3xl font-extrabold text-white tracking-tight">
              Zevra vs Other Encrypted Chat Platforms
            </h2>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            className="neumorphic-card-dark rounded-3xl overflow-hidden border border-purple-500/30"
          >
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-purple-500/20 bg-purple-950/40">
                    <th className="px-6 py-4 text-left font-bold text-white">
                      Feature
                    </th>
                    <th className="px-6 py-4 text-center font-bold text-purple-300">
                      Zevra
                    </th>
                    <th className="px-6 py-4 text-center font-medium text-purple-200/60">
                      WhatsApp
                    </th>
                    <th className="px-6 py-4 text-center font-medium text-purple-200/60">
                      Signal
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {comparisonData.map((row, i) => (
                    <tr
                      key={row.feature}
                      className="border-b border-purple-500/10 last:border-0 hover:bg-purple-950/30 transition-colors"
                    >
                      <td className="px-6 py-4 font-semibold text-purple-100">
                        {row.feature}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="inline-flex items-center gap-1.5 rounded-full border border-purple-500/30 bg-purple-950/70 px-3 py-1 text-xs font-semibold text-purple-300">
                          <FiCheckCircle className="h-3.5 w-3.5 text-purple-400" />
                          {row.zevra}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center text-purple-200/60">
                        {row.whatsapp}
                      </td>
                      <td className="px-6 py-4 text-center text-purple-200/60">
                        {row.signal}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-6 pb-28">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          className="mx-auto max-w-3xl neumorphic-card-dark rounded-3xl p-12 text-center space-y-6"
        >
          <h2 className="text-3xl font-extrabold text-white">
            See the Architecture in Action
          </h2>
          <p className="mx-auto max-w-lg text-purple-200/80 text-sm sm:text-base">
            Experience Zevra&apos;s zero-knowledge encrypted chat for yourself. Every message is sealed with the cryptographic pipeline described above.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
            <Link href="/auth/register">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.96 }}
                className="neumorphic-button-dark text-white font-bold px-8 py-4 rounded-xl text-sm inline-flex items-center gap-2.5 cursor-pointer"
              >
                Start Using Zevra <FiArrowRight className="h-4 w-4" />
              </motion.button>
            </Link>
            <Link href="/about">
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                className="border border-purple-500/30 bg-purple-950/40 hover:bg-purple-900/40 text-purple-200 font-semibold px-7 py-4 rounded-xl text-sm transition-all flex items-center gap-2 cursor-pointer"
              >
                Learn About Zevra
              </motion.button>
            </Link>
          </div>
        </motion.div>
      </section>

      <Footer />
    </div>
  );
}
