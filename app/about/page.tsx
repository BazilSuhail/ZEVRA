"use client";

import { useEffect, useRef, useState, type MouseEvent, type ReactNode } from "react";
import { motion, useInView, useScroll, useTransform } from "motion/react";
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
  FiEye,
  FiEyeOff,
} from "react-icons/fi";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/home/Footer";
import ScrollProgress from "@/components/animations/ScrollProgress";
import Link from "next/link";

// ─── Self-contained animation styles (removed automatically on unmount) ────

const ANIM_CSS = `
@keyframes ab-drift { from { background-position: 0 0, 0 0; } to { background-position: 44px 44px, 44px 44px; } }
@keyframes ab-float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-16px); } }
@keyframes ab-marquee { from { transform: translateX(0); } to { transform: translateX(-50%); } }
@keyframes ab-scan { 0% { transform: translateY(-12vh); opacity: 0; } 12%, 88% { opacity: 1; } 100% { transform: translateY(112vh); opacity: 0; } }
.ab-drift { animation: ab-drift 30s linear infinite; }
.ab-float { animation: ab-float 15s ease-in-out infinite; }
.ab-marquee { animation: ab-marquee 46s linear infinite; }
.ab-scan { animation: ab-scan 9s cubic-bezier(0.4, 0, 0.6, 1) infinite; }
@media (prefers-reduced-motion: reduce) {
  .ab-drift, .ab-float, .ab-marquee, .ab-scan { animation: none !important; }
}
`;

const GRID_IMAGE =
  "linear-gradient(to right, var(--grid-line) 1px, transparent 1px), " +
  "linear-gradient(to bottom, var(--grid-line) 1px, transparent 1px)";

const GRID_MASK =
  "radial-gradient(ellipse 85% 70% at 50% 40%, #000 15%, transparent 85%)";

// ─── Content ────────────────────────────────────────────────────────────────

const features = [
  {
    icon: FiLock,
    title: "SRP-6a Authentication",
    desc: "Secure Remote Password (RFC 5054, 2048-bit MODP) means your password never travels the network. Only a cryptographic verifier reaches the server, and it is useless to an attacker without an offline dictionary break.",
  },
  {
    icon: FiKey,
    title: "X25519 / Ed25519 Keys",
    desc: "Every session mints ephemeral X25519 key pairs, signed with long-lived Ed25519 identity keys. Private key material is generated and kept inside the device keystore — never uploaded.",
  },
  {
    icon: FiShield,
    title: "AES-256-GCM Sealing",
    desc: "Messages and files are sealed with authenticated encryption: a fresh 12-byte IV per message, 128-bit auth tag, and any bit-flip in transit is rejected before your client ever renders it.",
  },
  {
    icon: FiServer,
    title: "Stateless Multi-Node Relay",
    desc: "Redis Pub/Sub and BullMQ workers keep delivery sub-10ms while nodes stay disposable. Session state lives in Redis, so any node can serve any request and scaling out is a restart.",
  },
  {
    icon: FiGlobe,
    title: "Zero-Knowledge by Construction",
    desc: "The relay routes sealed blobs it has no key for. A full database dump yields ciphertext, hashed usernames, and room IDs — nothing that describes what you actually said.",
  },
  {
    icon: FiCode,
    title: "Open Source & Auditable",
    desc: "Every primitive ships from audited libraries (@noble/curves, @noble/hashes) plus the native Web Crypto API. Trust is derived from code you can read, not from a policy page.",
  },
];

const capabilities = [
  "Group E2EE",
  "Double Ratchet forward secrecy",
  "Ephemeral in-memory storage",
  "Self-destructing buffers",
  "Peer-to-peer mesh",
  "WebRTC + LiveKit calls",
  "Real-time presence & receipts",
  "Zero telemetry",
];

const stack = [
  { k: "Frontend", v: "Next.js 16 · React 19 · TypeScript 5" },
  { k: "Styling", v: "Tailwind CSS 4 · Motion (Framer)" },
  { k: "State", v: "Zustand 5 · persisted locally" },
  { k: "Real-Time", v: "Socket.IO 4 · WebSocket transport" },
  { k: "Client Store", v: "Dexie 4 · IndexedDB" },
  { k: "Cryptography", v: "Web Crypto · @noble/curves · @noble/hashes" },
  { k: "Voice / Video", v: "WebRTC P2P · LiveKit SFU fallback" },
  { k: "3D / Shader", v: "OGL · Plasma background" },
  { k: "Scrolling", v: "Lenis smooth scroll" },
  { k: "HTTP", v: "Axios · token interceptors" },
  { k: "Linting", v: "OxLint · TypeScript strict" },
  { k: "Runtime", v: "Bun 1.3+ · Node 18+" },
];

const serverSees = [
  "Encrypted ciphertext (base64)",
  "IV + auth tag (base64)",
  "Username (hashed)",
  "Room / channel IDs",
  "Connection timestamps",
];

const serverNeverSees = [
  "Plaintext messages",
  "Encryption keys",
  "Message content",
  "File & media content",
  "User passwords",
  "Key exchange parameters",
  "Call audio / video streams",
];

const MARQUEE_TERMS = [
  "SRP-6a",
  "X25519",
  "Ed25519",
  "AES-256-GCM",
  "PBKDF2 · 100K",
  "AES-KW",
  "Double Ratchet",
  "Zero Telemetry",
  "Client-Side Only",
  "Forward Secrecy",
];

// ─── Inline building blocks (kept local to this file) ───────────────────────

const HERO_CELLS = [
  { k: "Auth", v: "SRP-6a" },
  { k: "Cipher", v: "AES-256-GCM" },
  { k: "Exchange", v: "X25519" },
  { k: "Telemetry", v: "None" },
];

/** Simple two-scale grid mask + centre glow, scoped to the hero. */
function HeroGrid() {
  const mask =
    "radial-gradient(ellipse 70% 65% at 50% 45%, #000 5%, transparent 78%)";
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      <div
        className="absolute inset-0 opacity-80"
        style={{
          backgroundImage: GRID_IMAGE,
          backgroundSize: "72px 72px",
          maskImage: mask,
          WebkitMaskImage: mask,
        }}
      />
      <div
        className="absolute inset-0 opacity-50"
        style={{
          backgroundImage: GRID_IMAGE,
          backgroundSize: "24px 24px",
          maskImage: mask,
          WebkitMaskImage: mask,
        }}
      />
      <div className="absolute left-1/2 top-1/2 h-[440px] w-[440px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-purple-600/25 blur-[140px]" />
      <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-[#050310] via-[#050310]/70 to-transparent" />
    </div>
  );
}

/** Layered dark grid + gradient canvas pinned behind the whole page. */
function PageBackdrop() {
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
    >
      {/* 1 — base */}
      <div className="absolute inset-0 bg-[#050310]" />
      {/* 2 — violet bloom, top-left */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_75%_60%_at_8%_-10%,rgba(109,40,217,0.55),transparent_66%)]" />
      {/* 3 — indigo bloom, bottom-right */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_55%_at_106%_102%,rgba(55,48,163,0.5),transparent_62%)]" />
      {/* 4 — violet core */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_55%_45%_at_50%_32%,rgba(124,58,237,0.3),transparent_70%)]" />
      {/* 5 — diagonal sheen */}
      <div className="absolute inset-0 bg-[linear-gradient(150deg,rgba(255,255,255,0.06),transparent_38%)]" />
      {/* 6 — drifting grid, edge-masked */}
      <div
        className="ab-drift absolute inset-0 opacity-50"
        style={{
          backgroundImage: GRID_IMAGE,
          backgroundSize: "44px 44px",
          maskImage: GRID_MASK,
          WebkitMaskImage: GRID_MASK,
        }}
      />
      {/* 7 — scan line */}
      <div className="ab-scan absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-purple-500/60 to-transparent" />
      {/* 8 — floating orbs */}
      <div
        className="ab-float absolute -left-32 top-[22%] h-72 w-72 rounded-full bg-purple-700/40 blur-[110px]"
        style={{ animationDuration: "17s" }}
      />
      <div
        className="ab-float absolute -right-28 bottom-[14%] h-64 w-64 rounded-full bg-indigo-700/35 blur-[110px]"
        style={{ animationDuration: "21s", animationDelay: "5s" }}
      />
      {/* 9 — wash keeps it very dark */}
      <div className="absolute inset-0 bg-black/15" />
      {/* 10 — vignette */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_25%,rgba(0,0,0,0.78))]" />
    </div>
  );
}

/** Section eyebrow with animated rules either side. */
function SectionLabel({ children }: { children: ReactNode }) {
  return (
    <motion.span
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.5 }}
      className="inline-flex items-center gap-3 font-mono text-[11px] uppercase tracking-[0.32em] text-indigo-400"
    >
      <span className="h-px w-10 bg-gradient-to-r from-transparent to-indigo-400/70" />
      {children}
      <span className="h-px w-10 bg-gradient-to-l from-transparent to-indigo-400/70" />
    </motion.span>
  );
}

/** Card with a cursor-tracked spotlight on hover. */
function Spot({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);

  const onMove = (e: MouseEvent<HTMLDivElement>) => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    el.style.setProperty("--sx", `${e.clientX - r.left}px`);
    el.style.setProperty("--sy", `${e.clientY - r.top}px`);
  };

  return (
    <div
      ref={ref}
      onMouseMove={onMove}
      className={`group relative overflow-hidden ${className}`}
    >
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{
          background:
            "radial-gradient(320px circle at var(--sx, 50%) var(--sy, 50%), rgba(168,85,247,0.20), transparent 62%)",
        }}
      />
      <div className="relative">{children}</div>
    </div>
  );
}

/** Eased number count-up, fires once when scrolled into view. */
function Counter({
  to,
  suffix = "",
  duration = 1500,
  className = "",
}: {
  to: number;
  suffix?: string;
  duration?: number;
  className?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  const [n, setN] = useState(0);

  useEffect(() => {
    if (!inView) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setN(to);
      return;
    }
    let raf = 0;
    const t0 = performance.now();
    const step = (t: number) => {
      const p = Math.min((t - t0) / duration, 1);
      setN(Math.round(to * (1 - Math.pow(1 - p, 3))));
      if (p < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [inView, to, duration]);

  return (
    <span ref={ref} className={className}>
      {n}
      {suffix}
    </span>
  );
}

/** Infinite marquee of protocol names. */
function Marquee() {
  return (
    <div className="relative overflow-hidden border-y border-purple-500/15 bg-black/30 py-4">
      <div className="ab-marquee flex w-max">
        {[0, 1].map((half) => (
          <div key={half} className="flex shrink-0 items-center gap-8 pr-8">
            {MARQUEE_TERMS.map((t) => (
              <span
                key={t}
                className="flex items-center gap-3 whitespace-nowrap font-mono text-[11px] uppercase tracking-[0.3em] text-purple-300/70"
              >
                <span className="h-1.5 w-1.5 rounded-full bg-purple-400/80" />
                {t}
              </span>
            ))}
          </div>
        ))}
      </div>
      <div className="pointer-events-none absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-[#050310] to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-[#050310] to-transparent" />
    </div>
  );
}

// ─── Page ───────────────────────────────────────────────────────────────────

export default function AboutPage() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: containerRef });
  const heroY = useTransform(scrollYProgress, [0, 0.3], [0, -40]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.25], [1, 0]);

  return (
    <div
      ref={containerRef}
      className="relative isolate flex min-h-screen flex-col overflow-x-hidden text-purple-50 selection:bg-purple-600 selection:text-white"
      suppressHydrationWarning
    >
      <style>{ANIM_CSS}</style>
      <PageBackdrop />
      <ScrollProgress />
      <Navbar />

      {/* ── Hero ─────────────────────────────────────────────────────── */}
      <section className="relative flex min-h-[76vh] flex-col items-center justify-center overflow-hidden px-6 pt-36 pb-20 text-center">
        <HeroGrid />

        <motion.div
          style={{ y: heroY, opacity: heroOpacity }}
          className="relative w-full max-w-4xl space-y-7"
        >
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="inline-flex items-center gap-2 rounded-full border border-purple-500/30 bg-purple-950/50 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-purple-300 backdrop-blur-md"
          >
            <FiCpu className="h-4 w-4 text-purple-400" />
            <span>Zero-Trust Mission</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.15 }}
            className="text-4xl font-semibold leading-tight tracking-tight text-white sm:text-6xl lg:text-7xl"
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
            className="mx-auto max-w-2xl text-base leading-relaxed text-purple-200/80 sm:text-lg"
          >
            A zero-knowledge encrypted chat platform engineered by{" "}
            <span className="font-semibold text-white">Bazil Suhail</span> to make
            private communication accessible to everyone. No compromises. No
            backdoors. Just pure mathematics.
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
                className="neumorphic-button-dark flex cursor-pointer items-center gap-2.5 rounded-xl px-8 py-3.5 text-sm font-semibold text-white"
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
                className="flex cursor-pointer items-center gap-2 rounded-xl border border-purple-500/30 bg-purple-950/40 px-7 py-3.5 text-sm font-semibold text-purple-200 transition-all hover:bg-purple-900/40"
              >
                <FiGithub className="h-4 w-4 text-purple-300" /> View Source
              </motion.button>
            </a>
          </motion.div>

          {/* Protocol grid strip */}
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.55 }}
            className="mx-auto grid max-w-2xl grid-cols-2 gap-px overflow-hidden rounded-2xl border border-purple-500/25 bg-purple-500/25 sm:grid-cols-4"
          >
            {HERO_CELLS.map((c) => (
              <div key={c.k} className="bg-[#070513]/95 px-4 py-4">
                <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-indigo-400/85">
                  {c.k}
                </p>
                <p className="mt-1.5 text-sm font-semibold text-white">{c.v}</p>
              </div>
            ))}
          </motion.div>
        </motion.div>
      </section>

      {/* ── Protocol marquee ─────────────────────────────────────────── */}
      <Marquee />

      {/* ── Mission + protection ─────────────────────────────────────── */}
      <section className="px-6 pt-24 pb-24">
        <div className="mx-auto max-w-6xl space-y-20">
          <div className="grid gap-10 lg:grid-cols-2">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.6 }}
              className="neumorphic-card-dark space-y-4 rounded-3xl p-8 sm:p-10"
            >
              <div className="inline-flex items-center gap-2 rounded-full border border-purple-500/30 bg-purple-950/60 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-purple-300">
                <span className="h-2 w-2 animate-pulse rounded-full bg-purple-400" />
                Our Mission
              </div>
              <h2 className="text-2xl font-semibold text-white sm:text-3xl">
                Privacy Should Not Be a Luxury
              </h2>
              <p className="text-sm leading-relaxed text-purple-200/80 sm:text-base">
                Zevra was created by Bazil Suhail to solve a fundamental
                problem: private communication shouldn&apos;t require a
                cryptography degree. Our zero-knowledge architecture seals every
                message and file on your device before it ever reaches a relay —
                proving that real privacy and a smooth UX can coexist cleanly.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="neumorphic-card-dark space-y-4 rounded-3xl p-8 sm:p-10"
            >
              <div className="inline-flex items-center gap-2 rounded-full border border-indigo-500/30 bg-indigo-950/60 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-indigo-300">
                <span className="h-2 w-2 animate-pulse rounded-full bg-indigo-400" />
                How Zevra Protects You
              </div>
              <h2 className="text-2xl font-semibold text-white sm:text-3xl">
                Zero-Trust, Zero-Knowledge
              </h2>
              <p className="text-sm leading-relaxed text-purple-200/80 sm:text-base">
                Payloads are sealed with AES-256-GCM. Session keys are agreed
                with X25519 and signed by Ed25519. Authentication runs over
                SRP-6a, so the password itself never crosses the network — and
                even a total server compromise reveals no plaintext.
              </p>
            </motion.div>
          </div>

          {/* ── Animated stats ──────────────────────────────────────── */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            className="neumorphic-card-dark grid grid-cols-2 gap-8 rounded-3xl p-8 sm:p-10 md:grid-cols-4"
          >
            {[
              { to: 50, suffix: "K+", label: "Active Privacy Users" },
              { to: 10, suffix: "M+", label: "Encrypted Messages" },
              { to: 120, suffix: "+", label: "Countries Served" },
              { to: 0, suffix: "", label: "Data Breaches" },
            ].map((s) => (
              <motion.div
                key={s.label}
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 }}
                className="neumorphic-inset-dark rounded-2xl p-6 text-center"
              >
                <p className="text-4xl font-semibold text-white">
                  <Counter to={s.to} suffix={s.suffix} />
                </p>
                <p className="mt-1 text-xs font-semibold text-purple-300/80">
                  {s.label}
                </p>
              </motion.div>
            ))}
          </motion.div>

          {/* ── Technology grid ─────────────────────────────────────── */}
          <div className="space-y-12">
            <div className="mx-auto max-w-2xl space-y-4 text-center">
              <SectionLabel>The Stack</SectionLabel>
              <h2 className="text-3xl font-semibold tracking-tight text-white">
                The Technology Behind Zevra Chat
              </h2>
              <p className="text-sm text-purple-200/75 sm:text-base">
                Every component of the encryption stack is purpose-built for
                zero-knowledge, real-time communication.
              </p>
            </div>

            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
              {features.map((f, i) => (
                <motion.div
                  key={f.title}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-50px" }}
                  transition={{ duration: 0.5, delay: (i % 3) * 0.1 }}
                  whileHover={{ y: -6 }}
                >
                  <Spot className="neumorphic-card-dark neumorphic-card-dark-hover h-full rounded-3xl p-8">
                    <div className="space-y-4">
                      <div className="w-fit rounded-2xl border border-purple-500/30 bg-purple-950/60 p-3.5 text-purple-300">
                        <f.icon className="h-6 w-6 text-indigo-400" />
                      </div>
                      <h3 className="text-xl font-semibold tracking-tight text-white">
                        {f.title}
                      </h3>
                      <p className="text-sm leading-relaxed text-purple-200/75">
                        {f.desc}
                      </p>
                    </div>
                  </Spot>
                </motion.div>
              ))}
            </div>
          </div>

          {/* ── Capability chips ────────────────────────────────────── */}
          <div className="space-y-6">
            <div className="mx-auto max-w-2xl space-y-4 text-center">
              <SectionLabel>Also In The Box</SectionLabel>
            </div>
            <div className="flex flex-wrap justify-center gap-3">
              {capabilities.map((c, i) => (
                <motion.span
                  key={c}
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.05, duration: 0.35 }}
                  whileHover={{ y: -3 }}
                  className="inline-flex items-center gap-2 rounded-full border border-purple-500/25 bg-purple-950/40 px-4 py-2 text-sm text-purple-200/90 backdrop-blur"
                >
                  <FiCheckCircle className="h-3.5 w-3.5 text-purple-400" />
                  {c}
                </motion.span>
              ))}
            </div>
          </div>

          {/* ── Threat model ────────────────────────────────────────── */}
          <div className="space-y-8">
            <div className="mx-auto max-w-2xl space-y-4 text-center">
              <SectionLabel>Threat Model</SectionLabel>
              <h2 className="text-3xl font-semibold tracking-tight text-white">
                What the Relay Can — and Cannot — See
              </h2>
            </div>

            <div className="grid gap-8 lg:grid-cols-2">
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-80px" }}
                transition={{ duration: 0.55 }}
                className="neumorphic-card-dark rounded-3xl border border-amber-500/20 p-8 sm:p-10"
              >
                <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-amber-300">
                  <FiEye className="h-3.5 w-3.5" />
                  What the server sees
                </div>
                <ul className="space-y-3">
                  {serverSees.map((s, i) => (
                    <motion.li
                      key={s}
                      initial={{ opacity: 0, x: -12 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: i * 0.07 }}
                      className="flex items-center gap-3 text-sm text-purple-100/85"
                    >
                      <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-amber-400/80" />
                      {s}
                    </motion.li>
                  ))}
                </ul>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-80px" }}
                transition={{ duration: 0.55, delay: 0.1 }}
                className="neumorphic-card-dark rounded-3xl border border-emerald-500/20 p-8 sm:p-10"
              >
                <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-emerald-300">
                  <FiEyeOff className="h-3.5 w-3.5" />
                  What the server never sees
                </div>
                <ul className="space-y-3">
                  {serverNeverSees.map((s, i) => (
                    <motion.li
                      key={s}
                      initial={{ opacity: 0, x: -12 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: i * 0.06 }}
                      className="flex items-center gap-3 text-sm text-purple-100/85"
                    >
                      <FiCheckCircle className="h-4 w-4 shrink-0 text-emerald-400" />
                      {s}
                    </motion.li>
                  ))}
                </ul>
              </motion.div>
            </div>
          </div>

          {/* ── Tech stack table ────────────────────────────────────── */}
          <div className="space-y-8">
            <div className="mx-auto max-w-2xl space-y-4 text-center">
              <SectionLabel>Built With</SectionLabel>
              <h2 className="text-3xl font-semibold tracking-tight text-white">
                The Full Stack, Line by Line
              </h2>
            </div>

            <motion.div
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              className="neumorphic-card-dark grid gap-px overflow-hidden rounded-3xl sm:grid-cols-2 lg:grid-cols-3"
            >
              {stack.map((s, i) => (
                <motion.div
                  key={s.k}
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: (i % 6) * 0.05 }}
                  className="border-purple-500/10 bg-purple-950/20 p-6 transition-colors hover:bg-purple-900/30"
                >
                  <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-indigo-400">
                    {s.k}
                  </p>
                  <p className="mt-2 text-sm text-purple-100/90">{s.v}</p>
                </motion.div>
              ))}
            </motion.div>
          </div>

          {/* ── Creator ─────────────────────────────────────────────── */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            className="neumorphic-card-dark overflow-hidden rounded-3xl border border-purple-500/30"
          >
            <div className="grid gap-0 lg:grid-cols-5">
              <div className="relative flex flex-col items-center justify-center border-b border-purple-500/20 bg-purple-950/40 p-10 lg:col-span-2 lg:border-b-0 lg:border-r">
                <div className="relative flex h-28 w-28 items-center justify-center rounded-3xl border-2 border-purple-500/40 bg-purple-950/80 text-3xl font-semibold text-purple-300">
                  BS
                </div>
                <p className="mt-4 text-xl font-semibold text-white">
                  Bazil Suhail
                </p>
                <p className="mt-1 font-mono text-xs text-purple-300/70">
                  Creator &amp; Lead Developer
                </p>
              </div>

              <div className="flex flex-col justify-center space-y-4 p-8 sm:p-12 lg:col-span-3">
                <div className="inline-flex w-fit items-center gap-2 rounded-full border border-purple-500/30 bg-purple-950/60 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-purple-300">
                  The Vision
                </div>
                <h2 className="text-2xl font-semibold text-white sm:text-3xl">
                  Built with a Privacy-First Vision
                </h2>
                <p className="text-sm leading-relaxed text-purple-200/80">
                  Bazil Suhail created Zevra with a clear conviction: everyone
                  deserves access to truly private communication. The
                  architecture was designed from the ground up on battle-tested
                  protocols — SRP-6a, X25519, Ed25519, AES-256-GCM — so that no
                  trust is ever placed in the server.
                </p>
                <p className="text-sm leading-relaxed text-purple-200/80">
                  The result is a platform where your identity, conversations,
                  and data remain exclusively yours. No surveillance. No data
                  mining. No compromises.
                </p>
              </div>
            </div>
          </motion.div>

          {/* ── CTA ─────────────────────────────────────────────────── */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            className="neumorphic-card-dark space-y-6 rounded-3xl p-10 text-center sm:p-14"
          >
            <h2 className="text-3xl font-semibold text-white">
              Ready to Experience True Privacy?
            </h2>
            <p className="mx-auto max-w-lg text-sm text-purple-200/80 sm:text-base">
              Free, open source, and mathematically verified. Every message you
              send is sealed before it leaves this device.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-4">
              <Link href="/auth/register">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.96 }}
                  className="neumorphic-button-dark inline-flex cursor-pointer items-center gap-2.5 rounded-xl px-8 py-4 text-sm font-semibold text-white"
                >
                  Get Started with Zevra <FiArrowRight className="h-4 w-4" />
                </motion.button>
              </Link>
              <Link href="/architecture">
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-purple-500/30 bg-purple-950/40 px-7 py-4 text-sm font-semibold text-purple-200 transition-all hover:bg-purple-900/40"
                >
                  Read the Architecture <FiArrowRight className="h-4 w-4" />
                </motion.button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
