"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform } from "motion/react";
import { FiMessageSquare, FiLock, FiCheckCircle, FiShield } from "react-icons/fi";

const steps = [
  {
    icon: FiMessageSquare,
    step: "01",
    title: "Create Your Zevra Account",
    desc: "Sign up with SRP-6a authentication. Your password is zero-knowledge hashed; it is never sent to our servers - only a cryptographic verifier payload.",
    details: ["Zero Password Transmission", "Client Salted Hash", "SRP Verifier Generation"],
  },
  {
    icon: FiLock,
    step: "02",
    title: "Keys Generated Client-Side",
    desc: "X25519 key pairs and Ed25519 signing keys are computed locally in your browser. Private keys remain strictly encrypted in device IndexedDB.",
    details: ["X25519 Elliptic Curve", "Ed25519 Signature Pair", "Local Key Storage"],
  },
  {
    icon: FiCheckCircle,
    step: "03",
    title: "Communicate with Confidence",
    desc: "Send instant messages and join video streams knowing only your recipient holds the key to decrypt payload bytes. Absolute zero compromise.",
    details: ["Ratchet Forward Secrecy", "Authentic Media Streams", "Zero Server Log"],
  },
];

export default function HowItWorks() {
  const containerRef = useRef<HTMLDivElement>(null);

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
            <FiShield className="w-4 h-4 text-indigo-400" />
            <span>Zero-Trust Protocol</span>
          </div>

          <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight leading-tight">
            How{" "}
            <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-indigo-300 bg-clip-text text-transparent">
              Zevra Chat
            </span>{" "}
            Works
          </h2>

          <p className="text-purple-200/80 text-base sm:text-lg leading-relaxed max-w-2xl mx-auto">
            Seamless, transparent, and cryptographically bulletproof - from account creation to every single message byte.
          </p>
        </motion.div>

        {/* Steps Grid */}
        <div className="grid gap-10 md:grid-cols-3">
          {steps.map((s, i) => (
            <motion.div
              key={s.title}
              initial={{ opacity: 0, y: 36 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.6, delay: i * 0.18, ease: "easeOut" }}
              whileHover={{ y: -8 }}
              className="neumorphic-card-dark neumorphic-card-dark-hover rounded-3xl p-8 sm:p-10 relative flex flex-col justify-between"
            >
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-purple-500/30 bg-purple-950/60 text-purple-300">
                    <s.icon className="h-8 w-8 text-purple-400" />
                  </div>
                  <span className="text-3xl font-black font-mono text-purple-400/35">
                    {s.step}
                  </span>
                </div>

                <div className="space-y-3">
                  <h3 className="text-2xl font-bold text-white tracking-tight">{s.title}</h3>
                  <p className="text-purple-200/75 text-sm sm:text-base leading-relaxed">{s.desc}</p>
                </div>
              </div>

              <div className="space-y-2.5 pt-6 mt-6 border-t border-purple-500/20">
                {s.details.map((detail, idx) => (
                  <div key={idx} className="flex items-center gap-2.5 text-xs text-purple-300">
                    <div className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
                    <span>{detail}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          ))}
        </div>

        {/* Custom SVG Explanation Diagram: SRP-6a Protocol Verification */}
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, ease: "easeOut" }}
          className="neumorphic-card-dark rounded-3xl p-8 sm:p-12 border border-purple-500/30 overflow-hidden"
        >
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
            <svg viewBox="0 0 900 280" className="w-full max-w-4xl fill-none">
              {/* Client Box */}
              <rect x="50" y="40" width="220" height="200" rx="20" fill="#140e34" stroke="#818cf8" strokeWidth="1.5" />
              <text x="160" y="75" textAnchor="middle" fill="#ffffff" fontSize="15" fontWeight="bold">Client Browser</text>
              <text x="160" y="98" textAnchor="middle" fill="#c084fc" fontSize="11">Computes A = g^a mod N</text>
              
              <rect x="70" y="120" width="180" height="36" rx="10" fill="#0b071e" stroke="#6366f1" strokeWidth="1" />
              <text x="160" y="142" textAnchor="middle" fill="#a5b4fc" fontSize="11" fontWeight="bold">Password x = H(s, p)</text>
              
              <rect x="70" y="170" width="180" height="40" rx="10" fill="#1e1346" stroke="#a855f7" strokeWidth="1" />
              <text x="160" y="195" textAnchor="middle" fill="#e9d5ff" fontSize="11" fontWeight="bold">Session Key K Derived</text>

              {/* Arrow 1 */}
              <g transform="translate(280, 85)">
                <line x1="0" y1="0" x2="340" y2="0" stroke="#818cf8" strokeWidth="2" strokeDasharray="4 4" />
                <polygon points="340,0 330,-5 330,5" fill="#818cf8" />
                <rect x="110" y="-14" width="120" height="22" rx="6" fill="#0a081a" stroke="#6366f1" strokeWidth="0.8" />
                <text x="170" y="1" textAnchor="middle" fill="#a5b4fc" fontSize="10" fontWeight="bold">1. Send Identity & A</text>
              </g>

              {/* Arrow 2 */}
              <g transform="translate(280, 150)">
                <line x1="340" y1="0" x2="0" y2="0" stroke="#a855f7" strokeWidth="2" strokeDasharray="4 4" />
                <polygon points="0,0 10,-5 10,5" fill="#a855f7" />
                <rect x="95" y="-14" width="150" height="22" rx="6" fill="#0a081a" stroke="#a855f7" strokeWidth="0.8" />
                <text x="170" y="1" textAnchor="middle" fill="#e9d5ff" fontSize="10" fontWeight="bold">2. Send Salt (s) & Challenge B</text>
              </g>

              {/* Arrow 3 */}
              <g transform="translate(280, 215)">
                <line x1="0" y1="0" x2="340" y2="0" stroke="#818cf8" strokeWidth="2" strokeDasharray="4 4" />
                <polygon points="340,0 330,-5 330,5" fill="#818cf8" />
                <rect x="110" y="-14" width="120" height="22" rx="6" fill="#0a081a" stroke="#6366f1" strokeWidth="0.8" />
                <text x="170" y="1" textAnchor="middle" fill="#a5b4fc" fontSize="10" fontWeight="bold">3. Send Client Proof M1</text>
              </g>

              {/* Server Box */}
              <rect x="630" y="40" width="220" height="200" rx="20" fill="#140e34" stroke="#a855f7" strokeWidth="1.5" />
              <text x="740" y="75" textAnchor="middle" fill="#ffffff" fontSize="15" fontWeight="bold">Zevra Server</text>
              <text x="740" y="98" textAnchor="middle" fill="#c084fc" fontSize="11">Verifier v = g^x mod N</text>

              <rect x="650" y="120" width="180" height="36" rx="10" fill="#0b071e" stroke="#a855f7" strokeWidth="1" />
              <text x="740" y="142" textAnchor="middle" fill="#e9d5ff" fontSize="11" fontWeight="bold">B = k*v + g^b mod N</text>

              <rect x="650" y="170" width="180" height="40" rx="10" fill="#1e1346" stroke="#818cf8" strokeWidth="1" />
              <text x="740" y="195" textAnchor="middle" fill="#a5b4fc" fontSize="11" fontWeight="bold">Verifies Proof M1 == M2</text>
            </svg>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
