'use client';

import { useTransform, motion, useScroll, MotionValue } from 'motion/react';
import { useRef } from 'react';
import { FiLock, FiShield, FiSend, FiLink, FiCode } from 'react-icons/fi';

const projects = [
  {
    title: 'Client-Side Key Generation',
    description:
      'X25519 key pairs and Ed25519 signing keys are computed locally in your browser. Private keys remain strictly encrypted in your device IndexedDB — never touching a server.',
    color: '#130e24',
    accent: '#6366f1',
  },
  {
    title: 'Zero-Knowledge Authentication',
    description:
      'SRP-6a protocol verifies your identity without ever transmitting your password. A cryptographic verifier is all the server receives — zero plaintext, zero trust assumptions.',
    color: '#0f0c1b',
    accent: '#a855f7',
  },
  {
    title: 'Sealed Transport Layer',
    description:
      'Every payload is encrypted with AES-256-GCM before touching the network. Servers process only ciphertext — mathematically sealed and meaningless without your private key.',
    color: '#130e24',
    accent: '#818cf8',
  },
  {
    title: 'Forward Secrecy Ratchet',
    description:
      'Session keys ratchet with every message. Past conversations remain sealed even if long-term keys are compromised — cryptographic time travel in your favor.',
    color: '#0f0c1b',
    accent: '#c084fc',
  },
  {
    title: 'Verifiable Architecture',
    description:
      'Open cryptographic stack, auditable by design. Every protocol decision is documented, every implementation transparent — because privacy demands verification.',
    color: '#130e24',
    accent: '#6366f1',
  },
];

function KeyIcon({ accent }: { accent: string }) {
  return (
    <svg viewBox="0 0 120 120" className="w-full h-full">
      <style>{`
        @keyframes keyPulse { 0%,100%{opacity:0.4;transform:scale(1)} 50%{opacity:0.8;transform:scale(1.05)} }
        @keyframes ringRotate { 0%{transform:rotate(0deg)} 100%{transform:rotate(360deg)} }
      `}</style>
      <g style={{ animation: 'keyPulse 3s ease-in-out infinite' }}>
        <circle cx="60" cy="60" r="50" fill="none" stroke={accent} strokeWidth="1" opacity={0.3} />
        <circle cx="60" cy="60" r="38" fill="none" stroke={accent} strokeWidth="0.5" opacity={0.2} />
      </g>
      <g transform="translate(60,60)">
        <g style={{ animation: 'ringRotate 12s linear infinite', transformOrigin: 'center' }}>
          <circle cx="0" cy="-42" r="4" fill={accent} opacity={0.6} />
          <circle cx="42" cy="0" r="3" fill={accent} opacity={0.4} />
          <circle cx="0" cy="42" r="4" fill={accent} opacity={0.6} />
          <circle cx="-42" cy="0" r="3" fill={accent} opacity={0.4} />
        </g>
      </g>
      <g transform="translate(42,52)">
        <rect x="0" y="8" width="36" height="20" rx="4" fill={accent} opacity={0.7} />
        <circle cx="12" cy="18" r="4" fill="#0a0812" />
        <path d="M 20,0 V 12 H 28 V 0" fill="none" stroke={accent} strokeWidth="3" strokeLinecap="round" opacity={0.7} />
      </g>
    </svg>
  );
}

function ShieldIcon({ accent }: { accent: string }) {
  return (
    <svg viewBox="0 0 120 120" className="w-full h-full">
      <style>{`
        @keyframes shieldGlow { 0%,100%{filter:drop-shadow(0 0 4px ${accent}33)} 50%{filter:drop-shadow(0 0 12px ${accent}66)} }
        @keyframes checkDraw { 0%{stroke-dashoffset:30} 100%{stroke-dashoffset:0} }
      `}</style>
      <g style={{ animation: 'shieldGlow 3s ease-in-out infinite' }}>
        <path
          d="M 60,15 L 95,30 L 95,60 Q 95,95 60,110 Q 25,95 25,60 L 25,30 Z"
          fill="none"
          stroke={accent}
          strokeWidth="2"
          opacity={0.6}
        />
        <path
          d="M 60,25 L 88,38 L 88,58 Q 88,88 60,100 Q 32,88 32,58 L 32,38 Z"
          fill={accent}
          opacity={0.08}
        />
      </g>
      <path
        d="M 45,60 L 55,72 L 78,48"
        fill="none"
        stroke={accent}
        strokeWidth="3.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeDasharray="30"
        style={{ animation: 'checkDraw 1.5s ease-out infinite alternate' }}
      />
    </svg>
  );
}

function PacketIcon({ accent }: { accent: string }) {
  return (
    <svg viewBox="0 0 120 120" className="w-full h-full">
      <style>{`
        @keyframes flyRight { 0%{transform:translateX(-20px);opacity:0} 20%{opacity:1} 80%{opacity:1} 100%{transform:translateX(20px);opacity:0} }
        @keyframes trailPulse { 0%,100%{opacity:0.2} 50%{opacity:0.5} }
      `}</style>
      <g>
        <rect x="20" y="35" width="50" height="35" rx="6" fill={accent} opacity={0.15} stroke={accent} strokeWidth="1.5" />
        <path d="M 20,35 L 45,55 L 70,35" fill="none" stroke={accent} strokeWidth="1.5" opacity={0.5} />
        <circle cx="45" cy="52" r="5" fill={accent} opacity={0.4} />
      </g>
      <g style={{ animation: 'flyRight 2.5s ease-in-out infinite' }}>
        <rect x="70" y="42" width="30" height="22" rx="4" fill={accent} opacity={0.6} />
        <path d="M 70,42 L 85,53 L 100,42" fill="none" stroke="#fff" strokeWidth="1" opacity={0.4} />
      </g>
      <g style={{ animation: 'trailPulse 2s ease-in-out infinite' }}>
        <line x1="15" y1="55" x2="25" y2="55" stroke={accent} strokeWidth="1.5" opacity={0.3} />
        <line x1="10" y1="52" x2="18" y2="52" stroke={accent} strokeWidth="1" opacity={0.2} />
        <line x1="12" y1="58" x2="20" y2="58" stroke={accent} strokeWidth="1" opacity={0.2} />
      </g>
    </svg>
  );
}

function RatchetIcon({ accent }: { accent: string }) {
  return (
    <svg viewBox="0 0 120 120" className="w-full h-full">
      <style>{`
        @keyframes chainSlide { 0%{transform:translateY(0)} 50%{transform:translateY(-6px)} 100%{transform:translateY(0)} }
        @keyframes linkPulse { 0%,100%{opacity:0.5;transform:scale(1)} 50%{opacity:0.9;transform:scale(1.08)} }
      `}</style>
      {[0, 1, 2, 3, 4].map((i) => (
        <g
          key={i}
          transform={`translate(${25 + i * 16}, ${50 + (i % 2) * 12})`}
          style={{
            animation: `chainSlide 2s ease-in-out ${i * 0.3}s infinite`,
          }}
        >
          <rect
            x="0" y="0" width="14" height="22" rx="5"
            fill="none" stroke={accent} strokeWidth="1.5"
            style={{ animation: `linkPulse 2s ease-in-out ${i * 0.2}s infinite` }}
          />
        </g>
      ))}
      <circle cx="60" cy="90" r="12" fill="none" stroke={accent} strokeWidth="1" opacity={0.3} />
      <circle cx="60" cy="90" r="6" fill={accent} opacity={0.2} />
    </svg>
  );
}

function CodeIcon({ accent }: { accent: string }) {
  return (
    <svg viewBox="0 0 120 120" className="w-full h-full">
      <style>{`
        @keyframes scanLine { 0%{transform:translateY(-40px)} 100%{transform:translateY(40px)} }
        @keyframes bracketPulse { 0%,100%{opacity:0.4} 50%{opacity:0.8} }
      `}</style>
      <g style={{ animation: 'bracketPulse 3s ease-in-out infinite' }}>
        <text x="28" y="52" fill={accent} fontSize="28" fontFamily="monospace" opacity={0.6}>&lt;</text>
        <text x="72" y="52" fill={accent} fontSize="28" fontFamily="monospace" opacity={0.6}>&gt;</text>
        <text x="36" y="72" fill={accent} fontSize="28" fontFamily="monospace" opacity={0.4}>/&gt;</text>
      </g>
      <line x1="20" y1="30" x2="100" y2="30" stroke={accent} strokeWidth="0.5" opacity={0.2} />
      <line x1="20" y1="90" x2="100" y2="90" stroke={accent} strokeWidth="0.5" opacity={0.2} />
      <rect
        x="20" y="30" width="80" height="4" rx="2"
        fill={accent} opacity={0.15}
        style={{ animation: 'scanLine 3s ease-in-out infinite' }}
      />
    </svg>
  );
}

const icons = [KeyIcon, ShieldIcon, PacketIcon, RatchetIcon, CodeIcon];

interface CardProps {
  i: number;
  title: string;
  description: string;
  color: string;
  accent: string;
  progress: MotionValue<number>;
  range: [number, number];
  targetScale: number;
}

function StackCard({
  i,
  title,
  description,
  color,
  accent,
  progress,
  range,
  targetScale,
}: CardProps) {
  const container = useRef(null);
  const { scrollYProgress } = useScroll({
    target: container,
    offset: ['start end', 'start start'],
  });

  const imageScale = useTransform(scrollYProgress, [0, 1], [2, 1]);
  const scale = useTransform(progress, range, [1, targetScale]);

  const Icon = icons[i];

  return (
    <div
      ref={container}
      className="h-screen flex items-center justify-center sticky top-0"
    >
      <motion.div
        style={{
          backgroundColor: color,
          scale,
          top: `calc(-5vh + ${i * 25}px)`,
        }}
        className="flex flex-col relative -top-[25%] h-[450px] w-full max-w-7xl mx-auto rounded-2xl p-6 sm:p-10 origin-top overflow-hidden"
      >
        {/* Subtle SVG background */}
        <svg className="absolute inset-0 w-full h-full opacity-[0.03] pointer-events-none" viewBox="0 0 100 100" preserveAspectRatio="none">
          <circle cx="80" cy="20" r="30" fill={accent} />
          <circle cx="20" cy="80" r="20" fill={accent} />
        </svg>

        <h2 className="text-xl sm:text-2xl font-bold text-white text-center tracking-tight relative z-10">
          {title}
        </h2>

        <div className="flex flex-col sm:flex-row h-full mt-5 gap-6 sm:gap-10 relative z-10">
          {/* Left — Text */}
          <div className="sm:w-[45%] flex flex-col justify-center">
            <p className="text-sm sm:text-base text-purple-200/75 leading-relaxed">
              {description}
            </p>
            <div className="mt-4 flex items-center gap-2 text-xs font-mono" style={{ color: accent }}>
              <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: accent }} />
              <span>Learn more</span>
              <svg width="16" height="8" viewBox="0 0 16 8" fill="none">
                <path d="M15.5 4.5C15.5 4.22 15.28 4 15 4H1M15 4L11.5 1M15 4L11.5 7" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
          </div>

          {/* Right — SVG Animation */}
          <div className="sm:w-[55%] flex items-center justify-center">
            <motion.div
              className="w-40 h-40 sm:w-56 sm:h-56"
              style={{ scale: imageScale }}
            >
              <Icon accent={accent} />
            </motion.div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

export default function StackingCards() {
  const container = useRef(null);
  const { scrollYProgress } = useScroll({
    target: container,
    offset: ['start start', 'end end'],
  });

  return (
    <section ref={container} className="relative z-10">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="h-[50vh] w-full grid place-content-center px-6">
          <h2 className="text-4xl sm:text-6xl font-bold text-center text-purple-50 tracking-tight leading-tight">
            Cryptographic Stack
          </h2>
          <p className="text-center text-purple-300/60 mt-4 text-sm sm:text-base">
            Scroll to explore each layer
          </p>
        </div>

        {/* Stacking Cards */}
        <section className="w-full">
          {projects.map((project, i) => {
            const targetScale = 1 - (projects.length - i) * 0.05;
            return (
              <StackCard
                key={i}
                i={i}
                title={project.title}
                description={project.description}
                color={project.color}
                accent={project.accent}
                progress={scrollYProgress}
                range={[i * 0.25, 1]}
                targetScale={targetScale}
              />
            );
          })}
        </section>
      </div>
    </section>
  );
}
