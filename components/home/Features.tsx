"use client";

import { useRef, useState, useCallback } from "react";
import { motion, useScroll, useTransform, useSpring, useMotionValue, AnimatePresence } from "motion/react";
import { FiLock, FiShield, FiZap, FiCpu, FiCheck } from "react-icons/fi";

const features = [
  {
    icon: FiLock,
    title: "Zero-Knowledge E2EE",
    desc: "Every message in Zevra is encrypted on your device using AES-256-GCM. Our servers never see plaintext — only cryptographically sealed payloads that are meaningless without your private key.",
    tag: "AES-256-GCM",
  },
  {
    icon: FiShield,
    title: "SRP-6a Authentication",
    desc: "Zevra uses Secure Remote Password protocol for authentication without ever transmitting your password. Your credentials stay 100% safe on device.",
    tag: "Zero-Password Transmission",
  },
  {
    icon: FiZap,
    title: "Real-Time & Scalable",
    desc: "Powered by Redis Pub/Sub, BullMQ, and a multi-node WebSocket architecture, Zevra delivers instant message delivery with ultra-low latency.",
    tag: "Sub-10ms Latency",
  },
];

function useTilt(ref: React.RefObject<HTMLDivElement | null>) {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const springConfig = { stiffness: 300, damping: 30 };
  const rotateX = useSpring(useTransform(y, [-0.5, 0.5], [8, -8]), springConfig);
  const rotateY = useSpring(useTransform(x, [-0.5, 0.5], [-8, 8]), springConfig);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const el = ref.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const px = (e.clientX - rect.left) / rect.width - 0.5;
      const py = (e.clientY - rect.top) / rect.height - 0.5;
      x.set(px);
      y.set(py);
    },
    [ref, x, y]
  );

  const handleMouseLeave = useCallback(() => {
    x.set(0);
    y.set(0);
  }, [x, y]);

  return { rotateX, rotateY, handleMouseMove, handleMouseLeave };
}

function SpotlightCard({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const cardRef = useRef<HTMLDivElement>(null);
  const { rotateX, rotateY, handleMouseMove, handleMouseLeave } = useTilt(cardRef);
  const [spotPos, setSpotPos] = useState({ x: 0, y: 0 });
  const [hovered, setHovered] = useState(false);

  const onMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      handleMouseMove(e);
      const el = cardRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      setSpotPos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
    },
    [handleMouseMove]
  );

  return (
    <motion.div
      ref={cardRef}
      onMouseMove={onMouseMove}
      onMouseLeave={() => {
        handleMouseLeave();
        setHovered(false);
      }}
      onMouseEnter={() => setHovered(true)}
      style={{
        rotateX,
        rotateY,
        transformPerspective: 1000,
      }}
      className={`relative overflow-hidden ${className}`}
    >
      <AnimatePresence>
        {hovered && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="pointer-events-none absolute inset-0 z-0"
            style={{
              background: `radial-gradient(500px circle at ${spotPos.x}px ${spotPos.y}px, rgba(124,58,237,0.1), transparent 60%)`,
            }}
          />
        )}
      </AnimatePresence>
      <div className="relative z-10">{children}</div>
    </motion.div>
  );
}

export default function Features() {
  const containerRef = useRef<HTMLDivElement>(null);
  const sectionRef = useRef<HTMLDivElement>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [spotVisible, setSpotVisible] = useState(false);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"],
  });

  const parallax1 = useTransform(scrollYProgress, [0, 1], [40, -40]);
  const parallax2 = useTransform(scrollYProgress, [0, 1], [20, -20]);
  const parallax3 = useTransform(scrollYProgress, [0, 1], [60, -60]);

  const handleSectionMouse = useCallback((e: React.MouseEvent) => {
    const el = sectionRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    setMousePos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  }, []);

  return (
    <section
      ref={sectionRef}
      onMouseMove={handleSectionMouse}
      onMouseEnter={() => setSpotVisible(true)}
      onMouseLeave={() => setSpotVisible(false)}
      className="relative z-10 px-6 sm:px-8 py-28 sm:py-36 text-purple-50"
      suppressHydrationWarning
    >
      {/* Section Spotlight */}
      <AnimatePresence>
        {spotVisible && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            className="pointer-events-none absolute inset-0 z-0"
            style={{
              background: `radial-gradient(800px circle at ${mousePos.x}px ${mousePos.y}px, rgba(124,58,237,0.06), transparent 60%)`,
            }}
          />
        )}
      </AnimatePresence>

      <div ref={containerRef} className="max-w-7xl mx-auto space-y-20 relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.7, ease: "easeOut" }}
          className="text-center space-y-5 max-w-3xl mx-auto"
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-purple-950/60 text-purple-300 text-xs font-semibold uppercase tracking-widest backdrop-blur-md">
            <FiCpu className="w-4 h-4 text-indigo-400" />
            <span>Cryptographic Foundations</span>
          </div>

          <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight leading-tight">
            Why Choose Zevra Chat?
          </h2>

          <p className="text-purple-200/80 text-base sm:text-lg leading-relaxed max-w-2xl mx-auto">
            Engineered from first principles for absolute privacy, high throughput, and verifiable mathematical security.
          </p>
        </motion.div>

        {/* Bento Grid */}
        <div className="grid gap-6 md:grid-cols-5 md:grid-rows-2">
          {/* Hero Card — E2EE (spans 3 cols, 2 rows) */}
          <SpotlightCard className="md:col-span-3 md:row-span-2 rounded-3xl bg-[#130e24]/80 backdrop-blur-xl p-8 sm:p-10">
            <motion.div style={{ y: parallax1 }} className="h-full flex flex-col justify-between min-h-[340px] md:min-h-[500px]">
              {/* Purple SVG Background Art */}
              <svg className="absolute top-0 right-0 w-64 h-64 opacity-[0.07] pointer-events-none" viewBox="0 0 200 200">
                <circle cx="160" cy="40" r="80" fill="#a855f7" />
                <circle cx="180" cy="60" r="50" fill="#c084fc" />
                <circle cx="140" cy="20" r="30" fill="#818cf8" />
              </svg>
              <svg className="absolute bottom-0 left-0 w-48 h-48 opacity-[0.05] pointer-events-none" viewBox="0 0 200 200">
                <path d="M 0 200 Q 50 120 100 160 T 200 100" fill="none" stroke="#a855f7" strokeWidth="40" strokeLinecap="round" />
                <circle cx="30" cy="170" r="25" fill="#818cf8" />
              </svg>
              <div className="space-y-6">
                <motion.div
                  whileHover={{ scale: 1.1, rotate: -10 }}
                  transition={{ type: "spring", stiffness: 400, damping: 20 }}
                  className="inline-flex p-5 rounded-2xl bg-purple-950/70 text-indigo-400"
                >
                  <FiLock className="h-10 w-10 text-purple-300" />
                </motion.div>

                <div className="space-y-3">
                  <h3 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">{features[0].title}</h3>
                  <p className="text-purple-200/75 text-sm sm:text-base leading-relaxed max-w-lg">{features[0].desc}</p>
                </div>
              </div>

              {/* Animated Lock Visual */}
              <div className="mt-8 flex items-end gap-4">
                <div className="flex-1 space-y-3">
                  {[0.85, 0.65, 0.9, 0.5, 0.75].map((w, i) => (
                    <motion.div
                      key={i}
                      initial={{ scaleX: 0 }}
                      whileInView={{ scaleX: 1 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.6, delay: 0.3 + i * 0.1, ease: [0.16, 1, 0.3, 1] }}
                      style={{ width: `${w * 100}%`, transformOrigin: "left" }}
                      className="h-1.5 rounded-full bg-purple-500/20"
                    />
                  ))}
                </div>
                <span className="text-xs font-mono px-3 py-1.5 rounded-lg bg-purple-950/50 text-indigo-300 font-medium whitespace-nowrap">
                  {features[0].tag}
                </span>
              </div>
            </motion.div>
          </SpotlightCard>

          {/* Card 2 — SRP-6a (2 cols, 1 row) */}
          <SpotlightCard className="md:col-span-2 md:row-span-1 rounded-3xl bg-[#130e24]/80 backdrop-blur-xl p-6 sm:p-8">
            {/* Purple SVG Background Art */}
            <svg className="absolute top-2 right-2 w-40 h-40 opacity-[0.07] pointer-events-none" viewBox="0 0 200 200">
              <circle cx="150" cy="50" r="60" fill="#c084fc" />
              <circle cx="170" cy="30" r="35" fill="#a855f7" />
              <path d="M 100 180 Q 140 100 180 140" fill="none" stroke="#818cf8" strokeWidth="20" strokeLinecap="round" />
            </svg>
            <svg className="absolute bottom-0 left-0 w-32 h-32 opacity-[0.05] pointer-events-none" viewBox="0 0 200 200">
              <circle cx="40" cy="160" r="50" fill="#a855f7" />
              <circle cx="20" cy="180" r="25" fill="#818cf8" />
            </svg>
            <motion.div style={{ y: parallax2 }} className="space-y-4">
              <motion.div
                whileHover={{ scale: 1.1, rotate: 10 }}
                transition={{ type: "spring", stiffness: 400, damping: 20 }}
                className="inline-flex p-3.5 rounded-xl bg-purple-950/70 text-indigo-400"
              >
                <FiShield className="h-7 w-7 text-purple-300" />
              </motion.div>

              <div className="space-y-2">
                <h3 className="text-xl sm:text-2xl font-bold text-white tracking-tight">{features[1].title}</h3>
                <p className="text-purple-200/75 text-sm leading-relaxed">{features[1].desc}</p>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <FiCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-xs font-mono text-indigo-300">{features[1].tag}</span>
              </div>
            </motion.div>
          </SpotlightCard>

          {/* Card 3 — Real-Time (2 cols, 1 row) */}
          <SpotlightCard className="md:col-span-2 md:row-span-1 rounded-3xl bg-[#130e24]/80 backdrop-blur-xl p-6 sm:p-8">
            {/* Purple SVG Background Art */}
            <svg className="absolute top-0 left-0 w-36 h-36 opacity-[0.06] pointer-events-none" viewBox="0 0 200 200">
              <circle cx="40" cy="40" r="55" fill="#818cf8" />
              <circle cx="60" cy="20" r="30" fill="#a855f7" />
              <path d="M 10 100 Q 80 40 140 80" fill="none" stroke="#c084fc" strokeWidth="15" strokeLinecap="round" />
            </svg>
            <svg className="absolute bottom-2 right-2 w-28 h-28 opacity-[0.06] pointer-events-none" viewBox="0 0 200 200">
              <circle cx="160" cy="160" r="45" fill="#a855f7" />
              <circle cx="140" cy="180" r="20" fill="#c084fc" />
            </svg>
            <motion.div style={{ y: parallax3 }} className="space-y-4">
              <motion.div
                whileHover={{ scale: 1.1, rotate: -10 }}
                transition={{ type: "spring", stiffness: 400, damping: 20 }}
                className="inline-flex p-3.5 rounded-xl bg-purple-950/70 text-indigo-400"
              >
                <FiZap className="h-7 w-7 text-purple-300" />
              </motion.div>

              <div className="space-y-2">
                <h3 className="text-xl sm:text-2xl font-bold text-white tracking-tight">{features[2].title}</h3>
                <p className="text-purple-200/75 text-sm leading-relaxed">{features[2].desc}</p>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <FiCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-xs font-mono text-indigo-300">{features[2].tag}</span>
              </div>
            </motion.div>
          </SpotlightCard>
        </div>

        {/* SRP-6a Diagram — Scroll Path Drawing */}
        <SpotlightCard className="rounded-3xl bg-[#130e24]/80 backdrop-blur-xl p-8 sm:p-12 overflow-hidden">
          <div className="text-center space-y-3 mb-10 max-w-2xl mx-auto">
            <span className="text-xs font-mono uppercase tracking-widest text-indigo-400 font-semibold">
              Cryptographic Breakdown
            </span>
            <h3 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              SRP-6a Zero-Knowledge Authentication Sequence
            </h3>
            <p className="text-purple-200/75 text-sm leading-relaxed">
              How Zevra verifies user authenticity without transmitting plaintext password credentials over the wire.
            </p>
          </div>

          <div className="w-full flex justify-center items-center py-4">
            <style>{`
              @keyframes msgRight {
                0% { transform: translateX(0); opacity: 0; }
                10% { opacity: 1; }
                90% { opacity: 1; }
                100% { transform: translateX(340px); opacity: 0; }
              }
              @keyframes msgLeft {
                0% { transform: translateX(340px); opacity: 0; }
                10% { opacity: 1; }
                90% { opacity: 1; }
                100% { transform: translateX(0); opacity: 0; }
              }
              @keyframes pulseRing {
                0%, 100% { r: 6; opacity: 0.6; }
                50% { r: 14; opacity: 0; }
              }
              @keyframes nodeGlow {
                0%, 100% { filter: drop-shadow(0 0 2px rgba(129,140,248,0.3)); }
                50% { filter: drop-shadow(0 0 10px rgba(129,140,248,0.7)); }
              }
              @keyframes lockBounce {
                0%, 100% { transform: translateY(0); }
                50% { transform: translateY(-3px); }
              }
              @keyframes dotFlicker {
                0%, 100% { opacity: 0.4; }
                50% { opacity: 1; }
              }
              @keyframes dataFlow {
                0% { stroke-dashoffset: 20; }
                100% { stroke-dashoffset: 0; }
              }
              .srp-msg-right { animation: msgRight 3s ease-in-out 1s infinite; }
              .srp-msg-left { animation: msgLeft 3s ease-in-out 4s infinite; }
              .srp-msg-right-delay { animation: msgRight 3s ease-in-out 7s infinite; }
              .srp-pulse { animation: pulseRing 2s ease-in-out infinite; }
              .srp-glow { animation: nodeGlow 3s ease-in-out infinite; }
              .srp-lock { animation: lockBounce 2s ease-in-out infinite; }
              .srp-dot { animation: dotFlicker 1.5s ease-in-out infinite; }
              .srp-data { stroke-dasharray: 6 4; animation: dataFlow 1s linear infinite; }
            `}</style>

            <svg viewBox="0 0 900 280" className="w-full max-w-4xl fill-none">
              <defs>
                <filter id="srpGlow">
                  <feGaussianBlur stdDeviation="3" result="blur" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>

              {/* Client Box */}
              <g className="srp-glow">
                <rect x="50" y="40" width="220" height="200" rx="20" fill="#140e34" stroke="#818cf8" strokeWidth="1.5" />
                <text x="160" y="75" textAnchor="middle" fill="#ffffff" fontSize="15" fontWeight="bold">Client Browser</text>
                <text x="160" y="98" textAnchor="middle" fill="#c084fc" fontSize="11">Computes A = g^a mod N</text>
                <rect x="70" y="120" width="180" height="36" rx="10" fill="#0b071e" stroke="#6366f1" strokeWidth="1" />
                <text x="160" y="142" textAnchor="middle" fill="#a5b4fc" fontSize="11" fontWeight="bold">Password x = H(s, p)</text>
                <rect x="70" y="170" width="180" height="40" rx="10" fill="#1e1346" stroke="#a855f7" strokeWidth="1" />
                <text x="160" y="195" textAnchor="middle" fill="#e9d5ff" fontSize="11" fontWeight="bold">Session Key K Derived</text>
                {/* Lock icon inside client */}
                <g className="srp-lock" transform="translate(150, 215)">
                  <rect x="-6" y="0" width="12" height="10" rx="2" fill="#a855f7" opacity={0.5} />
                  <path d="M -3,0 V -3 A 3,3 0 0,1 3,-3 V 0" fill="none" stroke="#a855f7" strokeWidth="1.5" opacity={0.5} />
                </g>
              </g>

              {/* Arrow 1: Client → Server */}
              <g transform="translate(280, 85)">
                <line x1="0" y1="0" x2="340" y2="0" stroke="#818cf8" strokeWidth="2" strokeDasharray="4 4" />
                <polygon points="340,0 330,-5 330,5" fill="#818cf8" />
                <rect x="110" y="-14" width="120" height="22" rx="6" fill="#0a081a" stroke="#6366f1" strokeWidth="0.8" />
                <text x="170" y="1" textAnchor="middle" fill="#a5b4fc" fontSize="10" fontWeight="bold">1. Send Identity & A</text>
                {/* Animated message envelope going right */}
                <g className="srp-msg-right">
                  <rect x="-8" y="-6" width="16" height="12" rx="3" fill="#6366f1" opacity={0.9} />
                  <path d="M -8,-6 L 0,1 L 8,-6" fill="none" stroke="#c084fc" strokeWidth="1" />
                </g>
                {/* Pulsing dot at start */}
                <circle cx="0" cy="0" r="4" fill="#818cf8" className="srp-dot" />
              </g>

              {/* Arrow 2: Server → Client */}
              <g transform="translate(280, 150)">
                <line x1="340" y1="0" x2="0" y2="0" stroke="#a855f7" strokeWidth="2" strokeDasharray="4 4" />
                <polygon points="0,0 10,-5 10,5" fill="#a855f7" />
                <rect x="95" y="-14" width="150" height="22" rx="6" fill="#0a081a" stroke="#a855f7" strokeWidth="0.8" />
                <text x="170" y="1" textAnchor="middle" fill="#e9d5ff" fontSize="10" fontWeight="bold">2. Send Salt (s) & Challenge B</text>
                {/* Animated message going left */}
                <g className="srp-msg-left">
                  <rect x="-8" y="-6" width="16" height="12" rx="3" fill="#a855f7" opacity={0.9} />
                  <path d="M -8,-6 L 0,1 L 8,-6" fill="none" stroke="#e9d5ff" strokeWidth="1" />
                </g>
                {/* Pulsing dot at end */}
                <circle cx="340" cy="0" r="4" fill="#a855f7" className="srp-dot" style={{ animationDelay: "0.5s" }} />
              </g>

              {/* Arrow 3: Client → Server */}
              <g transform="translate(280, 215)">
                <line x1="0" y1="0" x2="340" y2="0" stroke="#818cf8" strokeWidth="2" strokeDasharray="4 4" />
                <polygon points="340,0 330,-5 330,5" fill="#818cf8" />
                <rect x="110" y="-14" width="120" height="22" rx="6" fill="#0a081a" stroke="#6366f1" strokeWidth="0.8" />
                <text x="170" y="1" textAnchor="middle" fill="#a5b4fc" fontSize="10" fontWeight="bold">3. Send Client Proof M1</text>
                {/* Animated message going right */}
                <g className="srp-msg-right-delay">
                  <rect x="-8" y="-6" width="16" height="12" rx="3" fill="#6366f1" opacity={0.9} />
                  <path d="M -8,-6 L 0,1 L 8,-6" fill="none" stroke="#c084fc" strokeWidth="1" />
                  {/* Checkmark inside for proof */}
                  <path d="M -3,0 L -1,3 L 4,-2" fill="none" stroke="#ffffff" strokeWidth="1.2" strokeLinecap="round" />
                </g>
                {/* Pulsing dot at start */}
                <circle cx="0" cy="0" r="4" fill="#818cf8" className="srp-dot" style={{ animationDelay: "1s" }} />
              </g>

              {/* Server Box */}
              <g className="srp-glow">
                <rect x="630" y="40" width="220" height="200" rx="20" fill="#140e34" stroke="#a855f7" strokeWidth="1.5" />
                <text x="740" y="75" textAnchor="middle" fill="#ffffff" fontSize="15" fontWeight="bold">Zevra Server</text>
                <text x="740" y="98" textAnchor="middle" fill="#c084fc" fontSize="11">Verifier v = g^x mod N</text>
                <rect x="650" y="120" width="180" height="36" rx="10" fill="#0b071e" stroke="#a855f7" strokeWidth="1" />
                <text x="740" y="142" textAnchor="middle" fill="#e9d5ff" fontSize="11" fontWeight="bold">B = k*v + g^b mod N</text>
                <rect x="650" y="170" width="180" height="40" rx="10" fill="#1e1346" stroke="#818cf8" strokeWidth="1" />
                <text x="740" y="195" textAnchor="middle" fill="#a5b4fc" fontSize="11" fontWeight="bold">Verifies Proof M1 == M2</text>
                {/* Shield checkmark icon */}
                <g transform="translate(740, 218)">
                  <path d="M 0,-8 L 8,-4 L 8,4 Q 8,10 0,14 Q -8,10 -8,4 L -8,-4 Z" fill="#1e1346" stroke="#a855f7" strokeWidth="1" opacity={0.6} />
                  <path d="M -3,1 L -1,4 L 4,-2" fill="none" stroke="#a855f7" strokeWidth="1.5" strokeLinecap="round" />
                </g>
              </g>
            </svg>
          </div>
        </SpotlightCard>
      </div>
    </section>
  );
}
