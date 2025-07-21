"use client";

import { Fragment, useRef, type MouseEvent, type ReactNode } from "react";
import { motion, useScroll, useTransform } from "motion/react";
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
  FiCpu,
  FiGlobe,
  FiShare2,
  FiSend,
  FiUnlock,
  FiPenTool,
  FiEdit2,
  FiDatabase,
} from "react-icons/fi";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/home/Footer";
import ScrollProgress from "@/components/animations/ScrollProgress";
import Link from "next/link";

// ─── Self-contained animation styles (removed automatically on unmount) ────

const ANIM_CSS = `
@keyframes ac-drift { from { background-position: 0 0, 0 0; } to { background-position: 44px 44px, 44px 44px; } }
@keyframes ac-float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-16px); } }
@keyframes ac-marquee { from { transform: translateX(0); } to { transform: translateX(-50%); } }
@keyframes ac-scan { 0% { transform: translateY(-12vh); opacity: 0; } 12%, 88% { opacity: 1; } 100% { transform: translateY(112vh); opacity: 0; } }
@keyframes ac-dash { from { background-position: 0 0; } to { background-position: 14px 0; } }
.ac-drift { animation: ac-drift 30s linear infinite; }
.ac-float { animation: ac-float 16s ease-in-out infinite; }
.ac-marquee { animation: ac-marquee 50s linear infinite; }
.ac-scan { animation: ac-scan 11s cubic-bezier(0.4, 0, 0.6, 1) infinite; }
.ac-dash {
  background-image: repeating-linear-gradient(to right, rgba(168,85,247,0.85) 0 6px, transparent 6px 14px);
  background-size: 14px 100%;
  animation: ac-dash 0.6s linear infinite;
}
@media (prefers-reduced-motion: reduce) {
  .ac-drift, .ac-float, .ac-marquee, .ac-scan, .ac-dash { animation: none !important; }
}
`;

const GRID_IMAGE =
  "linear-gradient(to right, var(--grid-line) 1px, transparent 1px), " +
  "linear-gradient(to bottom, var(--grid-line) 1px, transparent 1px)";

const GRID_MASK =
  "radial-gradient(ellipse 85% 70% at 50% 40%, #000 15%, transparent 85%)";

// ─── Content ────────────────────────────────────────────────────────────────

const cryptoSteps = [
  {
    phase: "01",
    title: "SRP-6a Authentication",
    desc: "Sign-in runs the Secure Remote Password protocol, so your password never travels over the network. The client produces a proof (A) and verifier (M1); the server answers with its own (B, M2). Both sides arrive at the same session key while neither reveals the password.",
    icon: FiLock,
    details: [
      "Password never transmitted in plaintext",
      "Resistant to offline dictionary attacks",
      "Mutual authentication between client and server",
      "Per-session salt and ephemeral values",
    ],
  },
  {
    phase: "02",
    title: "X25519 Key Exchange",
    desc: "Every session mints ephemeral X25519 key pairs. Curve25519 Diffie-Hellman establishes a shared secret with no prior contact required — an observer holding the full transcript still cannot derive it without solving the elliptic-curve discrete logarithm problem.",
    icon: FiKey,
    details: [
      "Elliptic Curve Diffie-Hellman (ECDH)",
      "128-bit security level",
      "Ephemeral keys per session (forward secrecy)",
      "Constant-time implementation, timing-attack resistant",
    ],
  },
  {
    phase: "03",
    title: "Ed25519 Digital Signatures",
    desc: "Key exchanges and payloads are signed with Ed25519, so you can prove a message genuinely came from your contact and was not altered in transit. Signatures are fast enough to verify on every message without perceptible latency.",
    icon: FiShield,
    details: [
      "EdDSA signatures for message authenticity",
      "Tamper-proof delivery — any mutation fails verification",
      "Non-repudiation: sender cannot deny their message",
      "Compact 64-byte signatures",
    ],
  },
  {
    phase: "04",
    title: "AES-256-GCM Encryption",
    desc: "Message content is sealed with AES-256-GCM, which gives confidentiality and integrity in a single pass. Every message carries a fresh random IV and a 128-bit auth tag, so any modification is detected and rejected before rendering.",
    icon: FiMessageSquare,
    details: [
      "256-bit key size — brute force is infeasible",
      "Authenticated encryption (confidentiality + integrity)",
      "Random IV per message prevents pattern analysis",
      "Hardware-accelerated AES-NI where available",
    ],
  },
];

const flowSteps = [
  {
    icon: FiEdit2,
    title: "Compose",
    desc: "Plaintext exists only in this tab's memory.",
    tag: "client",
  },
  {
    icon: FiLock,
    title: "Encrypt",
    desc: "AES-256-GCM seals it with a fresh IV.",
    tag: "AES-256-GCM",
  },
  {
    icon: FiPenTool,
    title: "Sign",
    desc: "Ed25519 proves who wrote it.",
    tag: "Ed25519",
  },
  {
    icon: FiShare2,
    title: "Relay",
    desc: "The server routes a blob it cannot open.",
    tag: "blind",
  },
  {
    icon: FiSend,
    title: "Forward",
    desc: "Socket.IO pushes it to the peer device.",
    tag: "WebSocket",
  },
  {
    icon: FiUnlock,
    title: "Decrypt",
    desc: "Peer verifies the signature, then renders.",
    tag: "client",
  },
];

const keyManagement = [
  {
    layer: "Authentication",
    algo: "SRP-6a",
    note: "RFC 5054 · 2048-bit MODP",
    purpose: "Password-based auth without exposing the password",
  },
  {
    layer: "Key Exchange",
    algo: "X25519",
    note: "Curve25519",
    purpose: "Ephemeral Diffie-Hellman session keys",
  },
  {
    layer: "Digital Signature",
    algo: "Ed25519",
    note: "EdDSA",
    purpose: "Key integrity and identity proof",
  },
  {
    layer: "Symmetric Encryption",
    algo: "AES-256-GCM",
    note: "128-bit IV · 128-bit tag",
    purpose: "Authenticated encryption for messages and files",
  },
  {
    layer: "Key Derivation",
    algo: "PBKDF2",
    note: "100K iterations · SHA-256",
    purpose: "Password → key material",
  },
  {
    layer: "Key Wrapping",
    algo: "AES-KW",
    note: "RFC 3394",
    purpose: "Protects stored cryptographic keys at rest",
  },
];

const restEndpoints = [
  { m: "POST", p: "/api/auth/register", d: "Register new account" },
  { m: "POST", p: "/api/auth/login", d: "SRP-6a login (start + finish)" },
  { m: "GET", p: "/api/auth/me", d: "Validate token / get profile" },
  { m: "PUT", p: "/api/users/me", d: "Update profile" },
  { m: "GET", p: "/api/keys", d: "Fetch encryption keys" },
  { m: "POST", p: "/api/keys/rotate", d: "Rotate key version" },
  { m: "GET", p: "/api/audit", d: "Security audit log" },
];

const socketEvents = [
  { e: "send-message", dir: "C → S", d: "Send encrypted payload" },
  { e: "message:new", dir: "S → C", d: "Receive encrypted payload" },
  { e: "typing:start / stop", dir: "↔", d: "Typing indicators" },
  { e: "call:initiate", dir: "C → S", d: "Start WebRTC / LiveKit call" },
  { e: "call:offer / answer", dir: "↔", d: "SDP exchange" },
  { e: "call:ice-candidate", dir: "↔", d: "ICE candidate exchange" },
  { e: "livekit:token-request", dir: "S → C", d: "Request LiveKit SFU token" },
  { e: "heartbeat-ack", dir: "S → C", d: "Connection keepalive" },
];

const infraComponents = [
  {
    icon: FiDatabase,
    title: "Redis Pub/Sub",
    desc: "Each connected client subscribes to a personal channel. Messages fan out in microseconds with at-most-once semantics, so nothing is duplicated and nothing stalls behind a polling loop.",
  },
  {
    icon: FiZap,
    title: "BullMQ Workers",
    desc: "Redis-backed queues handle delivery retries, push fan-out and priority scheduling, with rate limits and exponential backoff baked into the workers themselves.",
  },
  {
    icon: FiGlobe,
    title: "Multi-Node Scaling",
    desc: "Stateless nodes sit behind a load balancer with session state in Redis, so any node can answer any request. Scaling out is horizontal and boring — exactly how infrastructure should be.",
  },
  {
    icon: FiServer,
    title: "Zero-Knowledge Server",
    desc: "Nodes store blobs they structurally cannot decrypt. A complete database dump yields ciphertext and hashed identifiers only — server compromise does not equal data compromise.",
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

const MARQUEE_TERMS = [
  "Client-Side Crypto",
  "Blind Relay",
  "Forward Secrecy",
  "Per-Message IV",
  "Authenticated Encryption",
  "Stateless Nodes",
  "Sub-10ms Delivery",
  "Zero Telemetry",
  "Ephemeral Keys",
  "Signed Payloads",
];

// ─── Inline building blocks (kept local to this file) ───────────────────────

const HERO_CELLS = [
  { k: "Phase 01", v: "SRP-6a" },
  { k: "Phase 02", v: "X25519" },
  { k: "Phase 03", v: "Ed25519" },
  { k: "Phase 04", v: "AES-256-GCM" },
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
      <div className="absolute left-1/2 top-1/2 h-[440px] w-[440px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-indigo-600/25 blur-[140px]" />
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
      {/* 2 — indigo bloom, top-left */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_75%_60%_at_6%_-10%,rgba(55,48,163,0.55),transparent_66%)]" />
      {/* 3 — violet bloom, bottom-right */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_55%_at_106%_102%,rgba(109,40,217,0.5),transparent_62%)]" />
      {/* 4 — violet core */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_55%_45%_at_50%_30%,rgba(124,58,237,0.3),transparent_70%)]" />
      {/* 5 — diagonal sheen */}
      <div className="absolute inset-0 bg-[linear-gradient(150deg,rgba(255,255,255,0.06),transparent_38%)]" />
      {/* 6 — drifting grid, edge-masked */}
      <div
        className="ac-drift absolute inset-0 opacity-50"
        style={{
          backgroundImage: GRID_IMAGE,
          backgroundSize: "44px 44px",
          maskImage: GRID_MASK,
          WebkitMaskImage: GRID_MASK,
        }}
      />
      {/* 7 — scan line */}
      <div className="ac-scan absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-indigo-500/60 to-transparent" />
      {/* 8 — floating orbs */}
      <div
        className="ac-float absolute -left-32 top-[26%] h-72 w-72 rounded-full bg-indigo-700/40 blur-[110px]"
        style={{ animationDuration: "18s" }}
      />
      <div
        className="ac-float absolute -right-28 bottom-[16%] h-64 w-64 rounded-full bg-purple-700/35 blur-[110px]"
        style={{ animationDuration: "22s", animationDelay: "6s" }}
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

/** Infinite marquee of protocol phrases. */
function Marquee() {
  return (
    <div className="relative overflow-hidden border-y border-purple-500/15 bg-black/30 py-4">
      <div className="ac-marquee flex w-max">
        {[0, 1].map((half) => (
          <div key={half} className="flex shrink-0 items-center gap-8 pr-8">
            {MARQUEE_TERMS.map((t) => (
              <span
                key={t}
                className="flex items-center gap-3 whitespace-nowrap font-mono text-[11px] uppercase tracking-[0.3em] text-indigo-300/70"
              >
                <span className="h-1.5 w-1.5 rounded-full bg-indigo-400/80" />
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

export default function ArchitecturePage() {
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
          className="relative w-full max-w-5xl space-y-7"
        >
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="inline-flex items-center gap-2 rounded-full border border-purple-500/30 bg-purple-950/50 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-purple-300 backdrop-blur-md"
          >
            <FiCpu className="h-4 w-4 text-purple-400" />
            <span>Technical Deep Dive</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.15 }}
            className="text-4xl font-semibold leading-tight tracking-tight text-white sm:text-6xl lg:text-7xl"
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
            className="mx-auto max-w-3xl text-base leading-relaxed text-purple-200/80 sm:text-lg"
          >
            A complete technical breakdown of how Zevra achieves zero-knowledge,
            end-to-end encrypted real-time communication — SRP-6a, X25519,
            Ed25519 and AES-256-GCM, wired through a blind relay.
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
                className="flex cursor-pointer items-center gap-2 rounded-xl border border-purple-500/30 bg-purple-950/40 px-7 py-3.5 text-sm font-semibold text-purple-200 transition-all hover:bg-purple-900/40"
              >
                <FiGithub className="h-4 w-4 text-purple-300" /> Audit the Code
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

      {/* ── Marquee ──────────────────────────────────────────────────── */}
      <Marquee />

      {/* ── End-to-end data flow ─────────────────────────────────────── */}
      <section className="px-6 pt-24 pb-24">
        <div className="mx-auto max-w-6xl space-y-12">
          <div className="mx-auto max-w-2xl space-y-4 text-center">
            <SectionLabel>Data Flow</SectionLabel>
            <h2 className="text-3xl font-semibold tracking-tight text-white">
              One Message, Six Stops
            </h2>
            <p className="text-sm text-purple-200/80 sm:text-base">
              Follow a single message from your keystroke to your contact&apos;s
              screen. The relay appears in the middle — and never holds a key.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-[1fr_auto_1fr_auto_1fr]">
            {flowSteps.map((s, i) => (
              <Fragment key={s.title}>
                <motion.div
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-60px" }}
                  transition={{ duration: 0.5, delay: (i % 3) * 0.1 }}
                >
                  <Spot className="neumorphic-card-dark h-full rounded-3xl p-6">
                    <div className="flex h-full flex-col gap-4">
                      <div className="flex items-center justify-between">
                        <div className="w-fit rounded-2xl border border-purple-500/30 bg-purple-950/60 p-3 text-purple-300">
                          <s.icon className="h-5 w-5 text-indigo-400" />
                        </div>
                        <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-purple-400/80">
                          {s.tag}
                        </span>
                      </div>
                      <div className="space-y-1.5">
                        <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-indigo-400/90">
                          Step {String(i + 1).padStart(2, "0")}
                        </p>
                        <h3 className="text-lg font-semibold text-white">
                          {s.title}
                        </h3>
                        <p className="text-sm leading-relaxed text-purple-200/75">
                          {s.desc}
                        </p>
                      </div>
                    </div>
                  </Spot>
                </motion.div>

                {i % 3 !== 2 && i !== flowSteps.length - 1 && (
                  <div
                    aria-hidden
                    className="hidden items-center justify-center lg:flex"
                  >
                    <span className="ac-dash h-0.5 w-10 rounded-full" />
                  </div>
                )}
              </Fragment>
            ))}
          </div>
        </div>
      </section>

      {/* ── Crypto pipeline steps ────────────────────────────────────── */}
      <section className="px-6 pb-24">
        <div className="mx-auto max-w-6xl space-y-16">
          <div className="mx-auto max-w-2xl space-y-4 text-center">
            <SectionLabel>Encryption Pipeline</SectionLabel>
            <h2 className="text-3xl font-semibold tracking-tight text-white">
              How Zevra Encrypts Every Message
            </h2>
            <p className="text-sm text-purple-200/80 sm:text-base">
              From authentication to delivery, every step is designed to keep
              your data confidential and authenticated.
            </p>
          </div>

          <div className="space-y-8">
            {cryptoSteps.map((step, i) => (
              <motion.div
                key={step.phase}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-80px" }}
                transition={{ duration: 0.6, delay: i * 0.1 }}
                className="neumorphic-card-dark relative overflow-hidden rounded-3xl p-8 sm:p-10"
              >
                <div className="pointer-events-none absolute right-4 top-2 select-none font-mono text-[140px] font-semibold leading-none text-purple-500/10">
                  {step.phase}
                </div>

                <div className="relative grid items-center gap-8 lg:grid-cols-5">
                  <div className="space-y-4 lg:col-span-2">
                    <div className="flex items-center gap-3">
                      <div className="rounded-2xl border border-purple-500/30 bg-purple-950/60 p-3.5 text-purple-300">
                        <step.icon className="h-6 w-6 text-indigo-400" />
                      </div>
                      <span className="font-mono text-xs font-semibold uppercase tracking-wider text-purple-300">
                        Phase {step.phase}
                      </span>
                    </div>

                    <h3 className="text-2xl font-semibold text-white">
                      {step.title}
                    </h3>
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
                          className="neumorphic-inset-dark flex items-start gap-2.5 rounded-xl p-4"
                        >
                          <FiCheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-purple-400" />
                          <span className="text-xs text-purple-200/85">{d}</span>
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

      {/* ── Key management table ─────────────────────────────────────── */}
      <section className="px-6 pb-24">
        <div className="mx-auto max-w-6xl space-y-10">
          <div className="mx-auto max-w-2xl space-y-4 text-center">
            <SectionLabel>Key Management</SectionLabel>
            <h2 className="text-3xl font-semibold tracking-tight text-white">
              One Primitive Per Layer
            </h2>
            <p className="text-sm text-purple-200/80 sm:text-base">
              Nothing custom where a published RFC already exists — every layer
              maps to a single, audited algorithm.
            </p>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            className="neumorphic-card-dark overflow-hidden rounded-3xl border border-purple-500/30"
          >
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] text-sm">
                <thead>
                  <tr className="border-b border-purple-500/20 bg-purple-950/40 text-left">
                    <th className="px-6 py-4 font-semibold text-white">Layer</th>
                    <th className="px-6 py-4 font-semibold text-purple-300">
                      Algorithm
                    </th>
                    <th className="px-6 py-4 font-semibold text-white">Purpose</th>
                  </tr>
                </thead>
                <tbody>
                  {keyManagement.map((r) => (
                    <tr
                      key={r.layer}
                      className="border-b border-purple-500/10 transition-colors last:border-0 hover:bg-purple-950/30"
                    >
                      <td className="px-6 py-4 font-semibold text-purple-100">
                        {r.layer}
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-mono text-xs font-semibold text-indigo-300">
                          {r.algo}
                        </span>
                        <span className="ml-2 font-mono text-[10px] text-purple-300/60">
                          {r.note}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-purple-200/75">
                        {r.purpose}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── Protocol surface ─────────────────────────────────────────── */}
      <section className="px-6 pb-24">
        <div className="mx-auto max-w-6xl space-y-10">
          <div className="mx-auto max-w-2xl space-y-4 text-center">
            <SectionLabel>Protocol Surface</SectionLabel>
            <h2 className="text-3xl font-semibold tracking-tight text-white">
              The Complete API Contract
            </h2>
            <p className="text-sm text-purple-200/80 sm:text-base">
              Seven REST endpoints and eight socket events — the entire surface
              a client can ever touch.
            </p>
          </div>

          <div className="grid gap-8 lg:grid-cols-2">
            {/* REST */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.55 }}
              className="neumorphic-card-dark rounded-3xl p-6 sm:p-8"
            >
              <div className="mb-5 flex items-center justify-between">
                <span className="font-mono text-xs uppercase tracking-[0.28em] text-indigo-400">
                  REST
                </span>
                <span className="rounded-full border border-purple-500/30 bg-purple-950/50 px-3 py-1 font-mono text-[10px] text-purple-300">
                  Axios · token interceptors
                </span>
              </div>
              <ul className="space-y-2.5">
                {restEndpoints.map((r, i) => (
                  <motion.li
                    key={r.p}
                    initial={{ opacity: 0, x: -10 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.05 }}
                    className="neumorphic-inset-dark flex flex-wrap items-center gap-x-3 gap-y-1 rounded-xl px-4 py-3"
                  >
                    <span
                      className={`font-mono text-[10px] font-semibold tracking-wider ${
                        r.m === "GET"
                          ? "text-emerald-400"
                          : r.m === "PUT"
                            ? "text-amber-400"
                            : "text-indigo-400"
                      }`}
                    >
                      {r.m}
                    </span>
                    <span className="font-mono text-xs text-purple-100">
                      {r.p}
                    </span>
                    <span className="w-full text-[11px] text-purple-300/60 sm:w-auto sm:flex-1 sm:text-right">
                      {r.d}
                    </span>
                  </motion.li>
                ))}
              </ul>
            </motion.div>

            {/* Socket */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.55, delay: 0.1 }}
              className="neumorphic-card-dark rounded-3xl p-6 sm:p-8"
            >
              <div className="mb-5 flex items-center justify-between">
                <span className="font-mono text-xs uppercase tracking-[0.28em] text-indigo-400">
                  WebSocket
                </span>
                <span className="rounded-full border border-purple-500/30 bg-purple-950/50 px-3 py-1 font-mono text-[10px] text-purple-300">
                  Socket.IO 4
                </span>
              </div>
              <ul className="space-y-2.5">
                {socketEvents.map((r, i) => (
                  <motion.li
                    key={r.e}
                    initial={{ opacity: 0, x: -10 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.05 }}
                    className="neumorphic-inset-dark flex flex-wrap items-center gap-x-3 gap-y-1 rounded-xl px-4 py-3"
                  >
                    <span className="font-mono text-[10px] font-semibold tracking-wider text-indigo-400">
                      {r.dir}
                    </span>
                    <span className="font-mono text-xs text-purple-100">
                      {r.e}
                    </span>
                    <span className="w-full text-[11px] text-purple-300/60 sm:w-auto sm:flex-1 sm:text-right">
                      {r.d}
                    </span>
                  </motion.li>
                ))}
              </ul>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── Architecture diagram ─────────────────────────────────────── */}
      <section className="px-6 pb-24">
        <div className="mx-auto max-w-5xl space-y-10">
          <div className="mx-auto max-w-2xl space-y-4 text-center">
            <SectionLabel>System Topology</SectionLabel>
            <h2 className="text-3xl font-semibold tracking-tight text-white">
              Zevra Multi-Node Architecture
            </h2>
          </div>

          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, margin: "-80px" }}
            className="neumorphic-card-dark overflow-hidden rounded-3xl border border-purple-500/30 p-8 sm:p-12"
          >
            <div className="overflow-x-auto font-mono text-xs leading-relaxed text-purple-200/90">
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
              Every message is encrypted client-side before transmission. Zevra
              servers process only ciphertext.
            </p>
          </motion.div>
        </div>
      </section>

      {/* ── Infrastructure ───────────────────────────────────────────── */}
      <section className="px-6 pb-24">
        <div className="mx-auto max-w-6xl space-y-12">
          <div className="mx-auto max-w-2xl space-y-4 text-center">
            <SectionLabel>Infrastructure</SectionLabel>
            <h2 className="text-3xl font-semibold tracking-tight text-white">
              Real-Time Delivery at Scale
            </h2>
            <p className="text-sm text-purple-200/80 sm:text-base">
              Built for millions of concurrent encrypted sessions with sub-10ms
              fan-out.
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-2">
            {infraComponents.map((comp, i) => (
              <motion.div
                key={comp.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.5, delay: i * 0.12 }}
                whileHover={{ y: -6 }}
              >
                <Spot className="neumorphic-card-dark neumorphic-card-dark-hover h-full rounded-3xl p-8">
                  <div className="space-y-4">
                    <div className="w-fit rounded-2xl border border-purple-500/30 bg-purple-950/60 p-3.5 text-purple-300">
                      <comp.icon className="h-6 w-6 text-indigo-400" />
                    </div>
                    <h3 className="text-xl font-semibold text-white">
                      {comp.title}
                    </h3>
                    <p className="text-sm leading-relaxed text-purple-200/75">
                      {comp.desc}
                    </p>
                  </div>
                </Spot>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Comparison ───────────────────────────────────────────────── */}
      <section className="px-6 pb-24">
        <div className="mx-auto max-w-4xl space-y-10">
          <div className="mx-auto max-w-2xl space-y-4 text-center">
            <SectionLabel>Platform Matrix</SectionLabel>
            <h2 className="text-3xl font-semibold tracking-tight text-white">
              Zevra vs Other Encrypted Chat Platforms
            </h2>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            className="neumorphic-card-dark overflow-hidden rounded-3xl border border-purple-500/30"
          >
            <div className="overflow-x-auto">
              <table className="w-full min-w-[560px] text-sm">
                <thead>
                  <tr className="border-b border-purple-500/20 bg-purple-950/40">
                    <th className="px-6 py-4 text-left font-semibold text-white">
                      Feature
                    </th>
                    <th className="px-6 py-4 text-center font-semibold text-purple-300">
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
                  {comparisonData.map((row) => (
                    <tr
                      key={row.feature}
                      className="border-b border-purple-500/10 transition-colors last:border-0 hover:bg-purple-950/30"
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

      {/* ── CTA ──────────────────────────────────────────────────────── */}
      <section className="px-6 pb-28">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          className="neumorphic-card-dark mx-auto max-w-3xl space-y-6 rounded-3xl p-12 text-center"
        >
          <h2 className="text-3xl font-semibold text-white">
            See the Architecture in Action
          </h2>
          <p className="mx-auto max-w-lg text-sm text-purple-200/80 sm:text-base">
            Every message you send is sealed by the pipeline above before it
            ever touches the network.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
            <Link href="/auth/register">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.96 }}
                className="neumorphic-button-dark inline-flex cursor-pointer items-center gap-2.5 rounded-xl px-8 py-4 text-sm font-semibold text-white"
              >
                Start Using Zevra <FiArrowRight className="h-4 w-4" />
              </motion.button>
            </Link>
            <Link href="/about">
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-purple-500/30 bg-purple-950/40 px-7 py-4 text-sm font-semibold text-purple-200 transition-all hover:bg-purple-900/40"
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
