"use client";

import { motion, useScroll, useTransform } from "motion/react";
import { useRef } from "react";
import {
  FiShield,
  FiLock,
  FiGlobe,
  FiKey,
  FiServer,
  FiCode,
  FiArrowRight,
  FiGithub,
  FiCheckCircle,
  FiCpu,
} from "react-icons/fi";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/home/Footer";
import Link from "next/link";

const features = [
  {
    icon: FiLock,
    title: "SRP-6a Authentication",
    desc: "Zevra uses Secure Remote Password protocol so your password is never transmitted over the network. Only a cryptographic verifier reaches our servers.",
  },
  {
    icon: FiKey,
    title: "X25519 / Ed25519 Key Exchange",
    desc: "Every Zevra chat session generates ephemeral X25519 key pairs with Ed25519 signing keys. Your private keys never leave your device.",
  },
  {
    icon: FiShield,
    title: "AES-256-GCM Encryption",
    desc: "Messages are sealed with military-grade AES-256-GCM symmetric encryption. Even if our servers were breached, only ciphertext would be exposed.",
  },
  {
    icon: FiServer,
    title: "Multi-Node Architecture",
    desc: "Built on Redis and BullMQ for horizontally scalable, real-time message delivery across a distributed network of encrypted nodes.",
  },
  {
    icon: FiGlobe,
    title: "Zero-Knowledge Design",
    desc: "Zevra chat never stores plaintext keys or reads your messages. Our servers process only cryptographically sealed payloads they cannot decode.",
  },
  {
    icon: FiCode,
    title: "Open Source & Auditable",
    desc: "Every line of Zevra's encryption implementation is publicly auditable. Trust through transparency, not promises.",
  },
];

export default function AboutPage() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: containerRef });
  const heroY = useTransform(scrollYProgress, [0, 0.3], [0, -40]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.25], [1, 0]);

  return (
    <div ref={containerRef} className="flex min-h-screen flex-col bg-zinc-950  text-purple-50 selection:bg-purple-600 selection:text-white" suppressHydrationWarning>
      <Navbar />

      {/* Hero section */}
      <section className="relative flex min-h-[75vh] flex-col items-center justify-center overflow-hidden px-6 pt-36 pb-16 text-center">
        <div className="absolute inset-0 -z-10 pointer-events-none">
          <div className="absolute left-1/2 top-1/4 -z-10 h-[500px] w-[500px] -translate-x-1/2 rounded-full bg-purple-600/15 blur-[140px]" />
          <div className="absolute right-1/4 top-1/3 -z-10 h-[400px] w-[400px] rounded-full bg-indigo-600/15 blur-[120px]" />
        </div>

        <motion.div
          style={{ y: heroY, opacity: heroOpacity }}
          className="w-full max-w-4xl space-y-6"
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
            <span>Zero-Trust Mission</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.15 }}
            className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-white leading-tight"
          >
            About{" "}
            <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-indigo-300 bg-clip-text text-transparent">
              Zevra
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.3 }}
            className="mx-auto max-w-2xl text-base sm:text-lg text-purple-200/80 leading-relaxed"
          >
            A zero-knowledge encrypted chat platform engineered by{" "}
            <span className="font-bold text-white">Bazil Suhail</span> to make private communication accessible to everyone. No compromises. No backdoors. Just pure mathematics.
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
                Get Started Free <FiArrowRight className="h-4 w-4" />
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
                <FiGithub className="h-4 w-4 text-purple-300" /> View Source Code
              </motion.button>
            </a>
          </motion.div>
        </motion.div>
      </section>

      {/* Main Content Section */}
      <section className="px-6 pb-28">
        <div className="mx-auto max-w-6xl space-y-24">
          {/* Mission + Protection Grid */}
          <div className="grid gap-10 lg:grid-cols-2">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.6 }}
              className="neumorphic-card-dark rounded-3xl p-8 sm:p-10 space-y-4"
            >
              <div className="inline-flex items-center gap-2 rounded-full border border-purple-500/30 bg-purple-950/60 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-purple-300">
                <span className="h-2 w-2 rounded-full bg-purple-400 animate-pulse" />
                Our Mission
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
                Privacy Should Not Be a Luxury
              </h2>
              <p className="text-purple-200/80 text-sm sm:text-base leading-relaxed">
                Zevra was created by Bazil Suhail to solve a fundamental problem: private communication shouldn&apos;t require specialized cryptography degrees. Our zero-knowledge architecture ensures your messages and media stay encrypted locally on your device before reaching our relays. We built Zevra to prove privacy and smooth UX can coexist cleanly.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="neumorphic-card-dark rounded-3xl p-8 sm:p-10 space-y-4"
            >
              <div className="inline-flex items-center gap-2 rounded-full border border-indigo-500/30 bg-indigo-950/60 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-indigo-300">
                <span className="h-2 w-2 rounded-full bg-indigo-400 animate-pulse" />
                How Zevra Protects You
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
                Zero-Trust, Zero-Knowledge
              </h2>
              <p className="text-purple-200/80 text-sm sm:text-base leading-relaxed">
                Every message payload is sealed client-side using AES-256-GCM. Session key exchange uses X25519 with Ed25519 signatures. Authentication is governed by SRP-6a, so your password is never transmitted across the network. Even if servers were compromised, zero plaintexts are revealed.
              </p>
            </motion.div>
          </div>

          {/* Stats Bar */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            className="neumorphic-card-dark rounded-3xl p-8 sm:p-10 grid grid-cols-2 gap-8 md:grid-cols-4"
          >
            {[
              { value: "50K+", label: "Active Privacy Users" },
              { value: "10M+", label: "Encrypted Messages" },
              { value: "120+", label: "Countries Served" },
              { value: "0", label: "Data Breaches" },
            ].map((s, i) => (
              <motion.div
                key={s.label}
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.12 }}
                className="text-center neumorphic-inset-dark p-6 rounded-2xl"
              >
                <p className="text-3xl font-black text-white">{s.value}</p>
                <p className="mt-1 text-xs font-semibold text-purple-300/80">
                  {s.label}
                </p>
              </motion.div>
            ))}
          </motion.div>

          {/* Technology Grid */}
          <div className="space-y-12">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              className="text-center max-w-2xl mx-auto space-y-3"
            >
              <h2 className="text-3xl font-extrabold text-white tracking-tight">
                The Technology Behind Zevra Chat
              </h2>
              <p className="text-purple-200/75 text-sm sm:text-base">
                Every component of Zevra&apos;s encryption stack is purpose-built for zero-knowledge, real-time communication.
              </p>
            </motion.div>

            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
              {features.map((f, i) => (
                <motion.div
                  key={f.title}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-50px" }}
                  transition={{ duration: 0.5, delay: i * 0.1 }}
                  whileHover={{ y: -6 }}
                  className="neumorphic-card-dark neumorphic-card-dark-hover rounded-3xl p-8 flex flex-col justify-between"
                >
                  <div className="space-y-4">
                    <div className="p-3.5 w-fit rounded-2xl border border-purple-500/30 bg-purple-950/60 text-purple-300">
                      <f.icon className="h-6 w-6 text-indigo-400" />
                    </div>
                    <h3 className="text-xl font-bold text-white tracking-tight">{f.title}</h3>
                    <p className="text-sm text-purple-200/75 leading-relaxed">
                      {f.desc}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* About Creator Section */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            className="neumorphic-card-dark rounded-3xl overflow-hidden border border-purple-500/30"
          >
            <div className="grid gap-0 lg:grid-cols-5">
              <div className="relative flex flex-col items-center justify-center p-10 lg:col-span-2 border-b lg:border-b-0 lg:border-r border-purple-500/20 bg-purple-950/40">
                <div className="relative flex h-28 w-28 items-center justify-center rounded-3xl border-2 border-purple-500/40 bg-purple-950/80 text-3xl font-black text-purple-300">
                  BS
                </div>
                <p className="mt-4 text-xl font-bold text-white">Bazil Suhail</p>
                <p className="text-xs font-mono text-purple-300/70 mt-1">
                  Creator & Lead Developer
                </p>
              </div>

              <div className="flex flex-col justify-center p-8 sm:p-12 lg:col-span-3 space-y-4">
                <div className="inline-flex w-fit items-center gap-2 rounded-full border border-purple-500/30 bg-purple-950/60 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-purple-300">
                  The Vision
                </div>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
                  Built by Bazil Suhail with a Privacy-First Vision
                </h2>
                <p className="text-purple-200/80 text-sm leading-relaxed">
                  Bazil Suhail created Zevra with a clear conviction: everyone deserves access to truly private communication. As a developer focused on cryptographic systems, Bazil designed Zevra&apos;s architecture from the ground up using battle-tested protocols like SRP-6a, X25519, and AES-256-GCM to ensure no trust is placed in the server.
                </p>
                <p className="text-purple-200/80 text-sm leading-relaxed">
                  The result is Zevra chat: a platform where your identity, conversations, and data remain exclusively yours. No surveillance. No data mining. No compromises.
                </p>
              </div>
            </div>
          </motion.div>

          {/* CTA Section */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            className="neumorphic-card-dark rounded-3xl p-10 sm:p-14 text-center space-y-6"
          >
            <h2 className="text-3xl font-extrabold text-white">
              Ready to Experience True Privacy?
            </h2>
            <p className="mx-auto max-w-lg text-purple-200/80 text-sm sm:text-base">
              Join thousands of users who trust Zevra for secure, encrypted communication. Free, open source, and mathematically verified.
            </p>
            <Link href="/auth/register">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.96 }}
                className="neumorphic-button-dark text-white font-bold px-8 py-4 rounded-xl text-sm inline-flex items-center gap-2.5 cursor-pointer"
              >
                Get Started with Zevra <FiArrowRight className="h-4 w-4" />
              </motion.button>
            </Link>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
