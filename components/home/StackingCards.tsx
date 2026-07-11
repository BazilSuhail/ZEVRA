'use client';

import { useTransform, motion, useScroll, MotionValue } from 'motion/react';
import { useRef } from 'react';

const projects = [
  {
    title: 'Client-Side Key Generation',
    subtitle: 'LAYER 01 // LOCAL CRYPTO',
    description:
      'X25519 key pairs and Ed25519 signing keys are computed locally in your browser using WebCrypto API. Private keys remain strictly encrypted inside your device IndexedDB — never touching an external server.',
    color: '#0f0b1e',
    accent: '#6366f1',
    tags: ['X25519', 'Ed25519', 'IndexedDB'],
  },
  {
    title: 'Zero-Knowledge Authentication',
    subtitle: 'LAYER 02 // ZERO-TRUST AUTH',
    description:
      'SRP-6a protocol verifies your identity without ever transmitting your password. A cryptographic verifier is all the server receives — zero plaintext exchanged, zero trust assumptions required.',
    color: '#0d091a',
    accent: '#a855f7',
    tags: ['SRP-6a', 'ZK-Proofs', 'Zero Plaintext'],
  },
  {
    title: 'Sealed Transport Layer',
    subtitle: 'LAYER 03 // END-TO-END ENCRYPTION',
    description:
      'Every payload is encrypted with AES-256-GCM before touching the network pipeline. Servers process only ciphertext — mathematically sealed and completely meaningless without your private key.',
    color: '#0f0b1e',
    accent: '#38bdf8',
    tags: ['AES-256-GCM', 'TLS 1.3', 'Ciphertext Only'],
  },
  {
    title: 'Forward Secrecy Ratchet',
    subtitle: 'LAYER 04 // DOUBLE RATCHET',
    description:
      'Session keys ratchet synchronously with every message exchanged. Past conversations remain cryptographically sealed even if long-term identity keys are compromised in the future.',
    color: '#0d091a',
    accent: '#c084fc',
    tags: ['Double Ratchet', 'DH Exchange', 'Ephemeral Keys'],
  },
  {
    title: 'Verifiable Architecture',
    subtitle: 'LAYER 05 // TRANSPARENT SECURITY',
    description:
      'Open cryptographic stack, fully auditable by design. Every protocol decision is formally documented and every implementation transparent — because real privacy demands verification, not promises.',
    color: '#0f0b1e',
    accent: '#34d399',
    tags: ['Open Source', 'Audited', 'Formal Spec'],
  },
];

/* -------------------------------------------------------------------------- */
/*                            UPDATED SVG GRAPHICS                            */
/* -------------------------------------------------------------------------- */

function KeyGenDiagram({ accent }: { accent: string }) {
  return (
    <svg viewBox="0 0 240 180" className="w-full h-full drop-shadow-2xl overflow-visible">
      <defs>
        <linearGradient id="keyGenGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={accent} stopOpacity="0.8" />
          <stop offset="100%" stopColor={accent} stopOpacity="0.1" />
        </linearGradient>
        <filter id="glowKey" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="6" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>

      {/* Grid Pattern Background */}
      <g opacity="0.15">
        <path d="M 10 0 V 180 M 50 0 V 180 M 90 0 V 180 M 130 0 V 180 M 170 0 V 180 M 210 0 V 180" stroke={accent} strokeWidth="0.5" strokeDasharray="2 4" />
        <path d="M 0 30 H 240 M 0 70 H 240 M 0 110 H 240 M 0 150 H 240" stroke={accent} strokeWidth="0.5" strokeDasharray="2 4" />
      </g>

      {/* Rotating Outer Ring */}
      <g transform="translate(120, 90)">
        <circle r="65" fill="none" stroke={accent} strokeWidth="1" strokeDasharray="8 6 2 6" opacity="0.4" className="animate-[spin_20s_linear_infinite]" />
        <circle r="52" fill="none" stroke={accent} strokeWidth="1.5" strokeDasharray="40 100" opacity="0.6" className="animate-[spin_12s_linear_infinite_reverse]" />
      </g>

      {/* Key Core Assembly */}
      <g transform="translate(120, 90)" filter="url(#glowKey)">
        <circle r="36" fill="#090613" stroke={accent} strokeWidth="2" />
        <circle r="26" fill="none" stroke={accent} strokeWidth="1" strokeDasharray="4 3" opacity="0.7" />

        {/* Animated Scanning Beam */}
        <line x1="-30" y1="0" x2="30" y2="0" stroke={accent} strokeWidth="2" className="animate-[spin_4s_linear_infinite]" />

        {/* Central Key Icon */}
        <path
          d="M -8 -4 A 8 8 0 1 1 2 4 L 10 4 L 10 8 L 14 8 L 14 4 L 18 4 L 18 -4 Z"
          fill={accent}
          transform="translate(-5, 0) scale(1.2)"
        />
      </g>

      {/* Floating Data Nodes */}
      <g>
        <circle cx="45" cy="45" r="4" fill={accent} className="animate-ping" opacity="0.7" />
        <circle cx="45" cy="45" r="3" fill={accent} />
        <text x="45" y="34" fill={accent} fontSize="8" fontFamily="monospace" textAnchor="middle" opacity="0.8">PUB_KEY</text>
        <line x1="45" y1="45" x2="88" y2="70" stroke={accent} strokeWidth="1" strokeDasharray="2 2" opacity="0.5" />

        <circle cx="195" cy="135" r="4" fill={accent} className="animate-ping" opacity="0.7" />
        <circle cx="195" cy="135" r="3" fill={accent} />
        <text x="195" y="148" fill={accent} fontSize="8" fontFamily="monospace" textAnchor="middle" opacity="0.8">PRIV_SEC</text>
        <line x1="195" y1="135" x2="152" y2="110" stroke={accent} strokeWidth="1" strokeDasharray="2 2" opacity="0.5" />
      </g>
    </svg>
  );
}

function ZkProofDiagram({ accent }: { accent: string }) {
  return (
    <svg viewBox="0 0 240 180" className="w-full h-full drop-shadow-2xl overflow-visible">
      <defs>
        <filter id="glowShield" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="5" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>

      {/* Outer Hexagon Boundary */}
      <polygon
        points="120,15 180,45 180,135 120,165 60,135 60,45"
        fill="none"
        stroke={accent}
        strokeWidth="1.5"
        opacity="0.3"
        strokeDasharray="6 4"
      />

      {/* Zero Knowledge Verifier Node */}
      <g transform="translate(120, 90)" filter="url(#glowShield)">
        {/* Shield Structure */}
        <path
          d="M 0 -45 L 35 -25 L 35 15 Q 35 45 0 55 Q -35 45 -35 15 L -35 -25 Z"
          fill="#090613"
          stroke={accent}
          strokeWidth="2"
        />

        {/* Verification Check Mark Circuit */}
        <path
          d="M -14 2 L -4 12 L 16 -10"
          fill="none"
          stroke={accent}
          strokeWidth="3.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </g>

      {/* Prover to Verifier Particles */}
      <g>
        <circle cx="30" cy="90" r="16" fill="#090613" stroke={accent} strokeWidth="1.5" />
        <text x="30" y="93" fill={accent} fontSize="9" fontFamily="monospace" textAnchor="middle">PROVER</text>

        <path d="M 46 90 H 80" stroke={accent} strokeWidth="1.5" strokeDasharray="4 3" opacity="0.6" />

        {/* Animated Floating Proof Tokens */}
        <circle cx="62" cy="90" r="3" fill={accent} className="animate-[ping_2s_infinite]" />
      </g>

      {/* Zero Plaintext Signal Standard */}
      <g transform="translate(170, 75)">
        <rect width="50" height="30" rx="6" fill="#090613" stroke={accent} strokeWidth="1" />
        <text x="25" y="18" fill={accent} fontSize="7" fontFamily="monospace" textAnchor="middle">VERIFIED</text>
        <circle cx="25" cy="24" r="2" fill={accent} />
      </g>
    </svg>
  );
}

function TransportDiagram({ accent }: { accent: string }) {
  return (
    <svg viewBox="0 0 240 180" className="w-full h-full drop-shadow-2xl overflow-visible">
      {/* Network Pipeline Channels */}
      <path d="M 20 90 H 220" stroke={accent} strokeWidth="2" opacity="0.2" />
      <path d="M 20 65 H 220" stroke={accent} strokeWidth="1" strokeDasharray="3 3" opacity="0.15" />
      <path d="M 20 115 H 220" stroke={accent} strokeWidth="1" strokeDasharray="3 3" opacity="0.15" />

      {/* Sealed Tunnel Barrier */}
      <rect x="70" y="45" width="100" height="90" rx="12" fill="#090613" stroke={accent} strokeWidth="1.5" opacity="0.9" />
      <rect x="76" y="51" width="88" height="78" rx="8" fill="none" stroke={accent} strokeWidth="1" strokeDasharray="4 4" opacity="0.4" />

      {/* Encrypted Lock Core */}
      <g transform="translate(120, 85)">
        <rect x="-12" y="-2" width="24" height="20" rx="4" fill={accent} opacity="0.9" />
        <path d="M -7 -2 V -8 A 7 7 0 0 1 7 -8 V -2" fill="none" stroke={accent} strokeWidth="2.5" strokeLinecap="round" />
        <circle cx="0" cy="7" r="2.5" fill="#090613" />
      </g>

      {/* Plaintext to Ciphertext Transformation Blocks */}
      {/* Incoming Plaintext */}
      <g className="animate-[pulse_2s_infinite]">
        <rect x="25" y="78" width="24" height="24" rx="4" fill="#090613" stroke={accent} strokeWidth="1" />
        <text x="37" y="93" fill={accent} fontSize="8" fontFamily="monospace" textAnchor="middle">TXT</text>
      </g>

      {/* Outgoing Ciphertext */}
      <g className="animate-[pulse_2s_infinite_0.5s]">
        <rect x="190" y="78" width="24" height="24" rx="4" fill={accent} opacity="0.8" />
        <text x="202" y="93" fill="#090613" fontSize="8" fontFamily="monospace" fontWeight="bold" textAnchor="middle">0x8F</text>
      </g>
    </svg>
  );
}

function RatchetDiagram({ accent }: { accent: string }) {
  return (
    <svg viewBox="0 0 240 180" className="w-full h-full drop-shadow-2xl overflow-visible">
      {/* Ratchet Chain Links */}
      <g transform="translate(20, 90)">
        {[0, 1, 2, 3].map((step) => (
          <g key={step} transform={`translate(${step * 50}, 0)`}>
            {/* Connection Line */}
            {step < 3 && (
              <line x1="20" y1="0" x2="50" y2="0" stroke={accent} strokeWidth="2" strokeDasharray="3 3" opacity="0.6" />
            )}

            {/* Ratchet Step Node */}
            <circle r="16" fill="#090613" stroke={accent} strokeWidth="1.5" />
            <circle r="8" fill={accent} opacity={0.2} />
            <circle r="3" fill={accent} />

            {/* Key Identifier */}
            <text x="0" y="28" fill={accent} fontSize="8" fontFamily="monospace" textAnchor="middle" opacity="0.8">
              K_{step + 1}
            </text>
          </g>
        ))}
      </g>

      {/* Active Forward Step Pulse */}
      <g transform="translate(120, 40)">
        <rect x="-40" y="-12" width="80" height="24" rx="12" fill="#090613" stroke={accent} strokeWidth="1" />
        <text x="0" y="3" fill={accent} fontSize="8" fontFamily="monospace" textAnchor="middle">FORWARD SECURE</text>
      </g>
    </svg>
  );
}

function CodeSpecDiagram({ accent }: { accent: string }) {
  return (
    <svg viewBox="0 0 240 180" className="w-full h-full drop-shadow-2xl overflow-visible">
      {/* Code Editor Window frame */}
      <rect x="30" y="25" width="180" height="130" rx="10" fill="#090613" stroke={accent} strokeWidth="1.5" />
      <line x1="30" y1="50" x2="210" y2="50" stroke={accent} strokeWidth="1" opacity="0.3" />

      {/* Window Controls */}
      <circle cx="45" cy="37" r="3" fill={accent} opacity="0.8" />
      <circle cx="55" cy="37" r="3" fill={accent} opacity="0.5" />
      <circle cx="65" cy="37" r="3" fill={accent} opacity="0.3" />
      <text x="120" y="40" fill={accent} fontSize="8" fontFamily="monospace" textAnchor="middle" opacity="0.6">crypto_spec.rs</text>

      {/* Code Lines Abstract Representation */}
      <g transform="translate(45, 65)">
        <rect x="0" y="0" width="60" height="6" rx="3" fill={accent} opacity="0.8" />
        <rect x="68" y="0" width="40" height="6" rx="3" fill={accent} opacity="0.4" />

        <rect x="12" y="14" width="80" height="6" rx="3" fill={accent} opacity="0.5" />
        <rect x="98" y="14" width="30" height="6" rx="3" fill={accent} opacity="0.3" />

        <rect x="12" y="28" width="45" height="6" rx="3" fill={accent} opacity="0.6" />
        <rect x="63" y="28" width="70" height="6" rx="3" fill={accent} opacity="0.9" />

        <rect x="0" y="42" width="50" height="6" rx="3" fill={accent} opacity="0.7" />

        {/* Animated Terminal Cursor */}
        <rect x="54" y="42" width="6" height="8" fill={accent} className="animate-ping" />
      </g>

      {/* Verification Shield Badge */}
      <g transform="translate(180, 125)">
        <circle r="16" fill="#090613" stroke={accent} strokeWidth="1.5" />
        <path d="M -5 -1 L -1 3 L 6 -4" fill="none" stroke={accent} strokeWidth="2" strokeLinecap="round" />
      </g>
    </svg>
  );
}

const diagrams = [KeyGenDiagram, ZkProofDiagram, TransportDiagram, RatchetDiagram, CodeSpecDiagram];

/* -------------------------------------------------------------------------- */
/*                            STACK CARD COMPONENT                            */
/* -------------------------------------------------------------------------- */

interface CardProps {
  i: number;
  title: string;
  subtitle: string;
  description: string;
  color: string;
  accent: string;
  tags: string[];
  progress: MotionValue<number>;
  range: [number, number];
  targetScale: number;
}

function StackCard({
  i,
  title,
  subtitle,
  description,
  color,
  accent,
  tags,
  progress,
  range,
  targetScale,
}: CardProps) {
  const container = useRef(null);
  const { scrollYProgress } = useScroll({
    target: container,
    offset: ['start end', 'start start'],
  });

  const diagramScale = useTransform(scrollYProgress, [0, 1], [0.8, 1]);
  const scale = useTransform(progress, range, [1, targetScale]);

  const DiagramComponent = diagrams[i];

  return (
    <div
      ref={container}
      className="h-screen flex items-center justify-center sticky -top-12 sm:-top-8 lg:-top-10 px-4 sm:px-6"
    >
      <motion.div
        style={{
          backgroundColor: color,
          scale,
          top: `calc(10vh + ${i * 28}px)`,
        }}
        className="flex flex-col relative h-130 sm:h-120 w-full max-w-5xl mx-auto rounded-3xl p-6 sm:p-10 origin-top border border-white/10 shadow-2xl overflow-hidden backdrop-blur-xl"
      >
        {/* Subtle Ambient Glow */}
        <div
          className="absolute -right-20 -top-20 w-80 h-80 rounded-full opacity-15 pointer-events-none blur-3xl"
          style={{ backgroundColor: accent }}
        />

        {/* Card Header & Metadata */}
        <div className="flex items-center justify-between border-b border-white/10 pb-4 relative z-10">
          <span className="text-xs font-mono font-semibold tracking-widest uppercase" style={{ color: accent }}>
            {subtitle}
          </span>
          <span className="text-xs font-mono text-white/40">
            0{i + 1} / 0{projects.length}
          </span>
        </div>

        {/* Content Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 h-full mt-6 gap-6 lg:gap-8 relative z-10 items-center">
          {/* Left Column — Text & Tags */}
          <div className="lg:col-span-6 flex flex-col justify-between h-full py-2">
            <div>
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white tracking-tight leading-tight">
                {title}
              </h2>

              <p className="mt-4 text-sm sm:text-base text-purple-200/70 leading-relaxed font-normal">
                {description}
              </p>
            </div>

            {/* Tech Tags & Learn Link */}
            <div className="mt-6 flex flex-wrap items-center gap-2">
              {tags.map((tag, idx) => (
                <span
                  key={idx}
                  className="px-2.5 py-1 rounded-md text-xs font-mono bg-white/5 border border-white/10 text-white/80"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>

          {/* Right Column — Interactive Dynamic Graphic */}
          <div className="lg:col-span-6 flex items-center justify-center bg-black/20 rounded-2xl border border-white/5 p-4 sm:p-6 h-56 sm:h-64 lg:h-full">
            <motion.div
              className="w-full h-full flex items-center justify-center max-w-[280px] sm:max-w-[340px]"
              style={{ scale: diagramScale }}
            >
              <DiagramComponent accent={accent} />
            </motion.div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*                            MAIN STACKING CARDS                             */
/* -------------------------------------------------------------------------- */

export default function StackingCards() {
  const container = useRef(null);
  const { scrollYProgress } = useScroll({
    target: container,
    offset: ['start start', 'end end'],
  });

  return (
    <section ref={container} className="relative w-full z-10 py-20">
      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <div className="flex flex-col items-center justify-center text-center px-6 ">
          <span className="text-xs font-mono tracking-widest text-purple-400 uppercase mb-3">
            [ PROTOCOL SPECIFICATION ]
          </span>
          <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight leading-tight">
            Cryptographic Architecture
          </h2>
          <p className="text-purple-300/60 mt-3 max-w-xl text-sm sm:text-base">
            End-to-end mathematical guarantees built from first principles.
          </p>
        </div>

        {/* Stacking Cards Container */}
        <section className="w-full">
          {projects.map((project, i) => {
            const targetScale = 1 - (projects.length - i) * 0.04;
            return (
              <StackCard
                key={i}
                i={i}
                title={project.title}
                subtitle={project.subtitle}
                description={project.description}
                color={project.color}
                accent={project.accent}
                tags={project.tags}
                progress={scrollYProgress}
                range={[i * 0.2, 1]}
                targetScale={targetScale}
              />
            );
          })}
        </section>
      </div>
    </section>
  );
}
