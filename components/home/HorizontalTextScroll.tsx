'use client';

import { type Variants, motion, useScroll, useTransform } from 'motion/react';
import { useRef } from 'react';

interface SlideData {
  id: number;
  num: string;
  title: string;
  subtitle: string;
  tagline: string;
  stats: { label: string; value: string }[];
}

const slidesData: SlideData[] = [
  {
    id: 1,
    num: '01',
    title: 'PRIVACY IS NOT A FEATURE.',
    subtitle:
      'Zevra is engineered from the ground up with a strict privacy-first architecture. Localized client-side cryptography ensures your keys, messages, and metadata never exist unencrypted on central servers.',
    tagline: 'CLIENT-SIDE VAULT ACTIVE',
    stats: [
      { label: 'KEY ALGORITHM', value: 'X25519 / Ed25519' },
      { label: 'KEY STORE', value: 'Encrypted Enclave' },
      { label: 'LATENCY', value: '< 1.2ms' },
    ],
  },
  {
    id: 2,
    num: '02',
    title: 'SEALED BY MATHEMATICS.',
    subtitle:
      'Leveraging modern elliptic-curve cryptography and zero-knowledge protocol proofs, Zevra mathematically seals your communications. Verify identities without exposing plaintexts or credentials.',
    tagline: 'SRP-6a ZERO-TRUST VERIFIED',
    stats: [
      { label: 'PROOF MODEL', value: 'Non-Interactive ZK' },
      { label: 'TELEMETRY', value: '0 Bytes' },
      { label: 'VERIFICATION', value: 'Mathematical Proof' },
    ],
  },
  {
    id: 3,
    num: '03',
    title: 'ZERO LOGS. ZERO COMPROMISE.',
    subtitle:
      'Operating on a strict non-custodial model. No connection telemetry, persistent message stores, or behavioral tracking are retained. Buffers purge instantly upon session close.',
    tagline: 'MEMORY PURGE AUTOMATED',
    stats: [
      { label: 'LOGGING', value: 'Strict Zero' },
      { label: 'BUFFER', value: 'Volatile RAM' },
      { label: 'RETENTION', value: '0.00 Seconds' },
    ],
  },
  {
    id: 4,
    num: '04',
    title: 'WELCOME TO ZEVRA.',
    subtitle:
      'A streamlined, uncompromising communication suite crafted for individuals who demand simple, seamless security. Control your digital footprint effortlessly.',
    tagline: 'DOUBLE RATCHET MESH ONLINE',
    stats: [
      { label: 'FORWARD SECRECY', value: 'Per-Message' },
      { label: 'NETWORK', value: 'Peer-to-Peer Mesh' },
      { label: 'ENCRYPTION', value: 'Ratchet Synced' },
    ],
  },
];

const containerVariants: Variants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.05,
    },
  },
};

const textChildVariants: Variants = {
  hidden: {
    opacity: 0,
    y: 30,
    filter: 'blur(10px)',
  },
  visible: {
    opacity: 1,
    y: 0,
    filter: 'blur(0px)',
    transition: {
      duration: 0.6,
      ease: [0.22, 1, 0.36, 1],
    },
  },
};

function BalancedText({ text, className }: { text: string; className?: string }) {
  const words = text.split(' ');
  return (
    <span className={`inline-block ${className}`} style={{ textWrap: 'balance' }}>
      {words.map((word, idx) => (
        <span key={idx} className="inline-block whitespace-nowrap">
          {word}
          {idx < words.length - 1 && <span>&nbsp;</span>}
        </span>
      ))}
    </span>
  );
}

/* -------------------------------------------------------------------------- */
/*                        4 UNIQUE ANIMATION COMPONENTS                        */
/* -------------------------------------------------------------------------- */

/** 01. Rotating Vault Dial Mechanics */
function VaultDialVisual() {
  return (
    <div className="relative flex h-full w-full items-center justify-center p-4">
      <div className="relative flex h-52 w-52 items-center justify-center">
        {/* Outer Counter-Rotating Gear Ring */}
        <motion.svg
          viewBox="0 0 200 200"
          className="absolute inset-0 h-full w-full text-purple-500/30"
          animate={{ rotate: -360 }}
          transition={{ duration: 30, repeat: Infinity, ease: 'linear' }}
        >
          <circle cx="100" cy="100" r="90" stroke="currentColor" strokeWidth="1" strokeDasharray="4 8" fill="none" />
        </motion.svg>

        {/* Inner Fast Clockwise Ring */}
        <motion.svg
          viewBox="0 0 200 200"
          className="absolute inset-0 h-full w-full text-purple-400/60"
          animate={{ rotate: 360 }}
          transition={{ duration: 12, repeat: Infinity, ease: 'linear' }}
        >
          <circle cx="100" cy="100" r="70" stroke="currentColor" strokeWidth="1.5" strokeDasharray="12 12" fill="none" />
          <circle cx="100" cy="30" r="4" fill="currentColor" />
        </motion.svg>

        {/* Central Core Enclave */}
        <div className="relative flex h-24 w-24 items-center justify-center rounded-full border border-purple-400/40 bg-purple-950/20 backdrop-blur-sm">
          <motion.div
            className="h-12 w-12 rounded-full border-2 border-purple-300 border-t-transparent"
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
          />
          <span className="absolute font-mono text-[10px] font-bold tracking-widest text-purple-200">
            VAULT
          </span>
        </div>
      </div>
    </div>
  );
}

/** 02. Zero-Knowledge Proof Matrix Sweep */
function ZkMatrixVisual() {
  const nodes = Array.from({ length: 16 });

  return (
    <div className="relative flex h-full w-full items-center justify-center p-4">
      <div className="relative grid grid-cols-4 gap-4 rounded-xl border border-purple-500/20 bg-neutral-950/40 p-6">
        {nodes.map((_, i) => (
          <motion.div
            key={i}
            className="flex h-8 w-8 items-center justify-center rounded-md border border-purple-400/30 font-mono text-xs text-purple-300"
            animate={{
              borderColor: ['rgba(168, 85, 247, 0.2)', 'rgba(52, 211, 153, 0.8)', 'rgba(168, 85, 247, 0.2)'],
              backgroundColor: ['rgba(0,0,0,0)', 'rgba(52, 211, 153, 0.15)', 'rgba(0,0,0,0)'],
              scale: [1, 1.08, 1],
            }}
            transition={{
              duration: 2.4,
              repeat: Infinity,
              delay: (i % 4) * 0.3 + Math.floor(i / 4) * 0.2,
              ease: 'easeInOut',
            }}
          >
            {i % 2 === 0 ? 'ZK' : '01'}
          </motion.div>
        ))}

        {/* Scanning Line Beam across grid */}
        <motion.div
          className="absolute left-0 top-0 h-full w-1 bg-gradient-to-b from-transparent via-emerald-400 to-transparent shadow-[0_0_12px_#34d399]"
          animate={{ x: [0, 220, 0] }}
          transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
        />
      </div>
    </div>
  );
}

/** 03. Volatile RAM Memory Purge */
function MemoryPurgeVisual() {
  const blocks = [0, 1, 2, 3, 4, 5];

  return (
    <div className="relative flex h-full w-full flex-col items-center justify-center gap-4 p-4 font-mono">
      <div className="flex gap-2">
        {blocks.map((block) => (
          <motion.div
            key={block}
            className="flex h-12 w-10 flex-col items-center justify-center rounded border border-purple-400/40 bg-purple-900/20 text-[10px] text-purple-200"
            animate={{
              opacity: [1, 1, 0, 0, 1],
              scale: [1, 1, 0.5, 0.5, 1],
              y: [0, 0, -20, -20, 0],
              filter: ['blur(0px)', 'blur(0px)', 'blur(8px)', 'blur(8px)', 'blur(0px)'],
            }}
            transition={{
              duration: 3.2,
              repeat: Infinity,
              delay: block * 0.2,
              ease: 'easeInOut',
            }}
          >
            <span>RAM</span>
            <span className="text-[8px] opacity-60">0x0{block}</span>
          </motion.div>
        ))}
      </div>

      <div className="flex items-center gap-2 text-xs text-rose-400/80">
        <motion.span
          className="h-2 w-2 rounded-full bg-rose-500"
          animate={{ opacity: [1, 0.2, 1] }}
          transition={{ duration: 1, repeat: Infinity }}
        />
        <span className="tracking-widest">VOLATILE_BUFFER_PURGE</span>
      </div>
    </div>
  );
}

/** 04. Double Ratchet Mesh Nodes */
function MeshRatchetVisual() {
  return (
    <div className="relative flex h-full w-full items-center justify-center p-4 font-mono">
      <svg viewBox="0 0 280 120" className="h-32 w-72">
        {/* Node A */}
        <circle cx="40" cy="60" r="18" className="fill-purple-950/40 stroke-purple-400 stroke-2" />
        <text x="40" y="64" textAnchor="middle" className="fill-purple-200 text-[10px]">A</text>

        {/* Pulse Echo Node A */}
        <motion.circle
          cx="40"
          cy="60"
          r="18"
          fill="none"
          stroke="rgba(196,181,253,0.8)"
          strokeWidth="1.5"
          animate={{ r: [18, 36], opacity: [0.8, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeOut' }}
        />

        {/* Connecting Mesh Line */}
        <line x1="58" y1="60" x2="222" y2="60" stroke="rgba(255,255,255,0.15)" strokeWidth="1.5" strokeDasharray="4 4" />

        {/* Packet travelling A -> B */}
        <motion.circle
          r="5"
          fill="#34d399"
          animate={{ cx: [58, 222], opacity: [0, 1, 1, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          cy="60"
        />

        {/* Packet travelling B -> A */}
        <motion.circle
          r="5"
          fill="#c084fc"
          animate={{ cx: [222, 58], opacity: [0, 1, 1, 0] }}
          transition={{ duration: 2, repeat: Infinity, delay: 1, ease: 'easeInOut' }}
          cy="60"
        />

        {/* Node B */}
        <circle cx="240" cy="60" r="18" className="fill-emerald-950/40 stroke-emerald-400 stroke-2" />
        <text x="240" y="64" textAnchor="middle" className="fill-emerald-200 text-[10px]">B</text>

        {/* Pulse Echo Node B */}
        <motion.circle
          cx="240"
          cy="60"
          r="18"
          fill="none"
          stroke="rgba(52,211,153,0.8)"
          strokeWidth="1.5"
          animate={{ r: [18, 36], opacity: [0.8, 0] }}
          transition={{ duration: 2, repeat: Infinity, delay: 1, ease: 'easeOut' }}
        />
      </svg>
    </div>
  );
}

function SlideVisual({ index }: { index: number }) {
  switch (index) {
    case 0:
      return <VaultDialVisual />;
    case 1:
      return <ZkMatrixVisual />;
    case 2:
      return <MemoryPurgeVisual />;
    case 3:
      return <MeshRatchetVisual />;
    default:
      return null;
  }
}

/* -------------------------------------------------------------------------- */
/*                              MAIN SCROLL SECTION                            */
/* -------------------------------------------------------------------------- */

export default function HorizontalTextScroll() {
  const targetRef = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll({
    target: targetRef,
    offset: ['start start', 'end end'],
  });

  const endPercentage = -((slidesData.length - 1) / slidesData.length) * 100;
  const x = useTransform(scrollYProgress, [0, 1], ['0%', `${endPercentage}%`]);

  return (
    <div className="w-full text-white">
      <section ref={targetRef} className="relative h-[300vh] w-full">
        <div className="sticky top-0 flex h-screen w-full items-center overflow-clip">
          <motion.div style={{ x }} className="flex h-full w-max">
            {slidesData.map((slide, index) => (
              <SlideItem key={slide.id} slide={slide} index={index} />
            ))}
          </motion.div>
        </div>
      </section>
    </div>
  );
}

function SlideItem({ slide, index }: { slide: SlideData; index: number }) {
  const isLeftDiagram = index % 2 === 1;

  return (
    <section className="flex h-screen w-screen shrink-0 items-center justify-center px-8 md:px-16 lg:px-24">
      <motion.div
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ amount: 0.3, once: false }}
        className="grid w-full max-w-7xl grid-cols-1 items-center gap-12 lg:grid-cols-12"
      >
        {/* Content Section */}
        <div
          className={`flex flex-col justify-center lg:col-span-7 ${
            isLeftDiagram ? 'lg:order-2' : 'lg:order-1'
          }`}
        >
          <motion.div variants={textChildVariants} className="flex items-baseline gap-4">
            <span className="font-mono text-5xl font-extralight tracking-tighter text-purple-400/40 md:text-6xl">
              {slide.num}
            </span>
            <div className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-purple-400 animate-pulse" />
              <span className="font-mono text-xs tracking-widest text-purple-300 uppercase">
                {slide.tagline}
              </span>
            </div>
          </motion.div>

          <motion.h2
            variants={textChildVariants}
            className="mt-4 text-2xl font-bold tracking-tight text-white sm:text-3xl md:text-4xl lg:text-5xl"
          >
            <BalancedText text={slide.title} />
          </motion.h2>

          <motion.p
            variants={textChildVariants}
            className="mt-4 max-w-xl text-sm leading-relaxed text-neutral-300 sm:text-base"
          >
            <BalancedText text={slide.subtitle} />
          </motion.p>

          <motion.div
            variants={textChildVariants}
            className="mt-8 grid grid-cols-3 gap-4 border-t border-white/10 pt-6"
          >
            {slide.stats.map((stat, i) => (
              <div key={i}>
                <div className="font-mono text-[10px] tracking-wider text-neutral-400 uppercase">
                  {stat.label}
                </div>
                <div className="mt-1 font-mono text-xs font-semibold text-purple-200">
                  {stat.value}
                </div>
              </div>
            ))}
          </motion.div>
        </div>

        {/* Frameless Unique Visual Area */}
        <motion.div
          variants={textChildVariants}
          className={`flex h-64 w-full items-center justify-center lg:col-span-5 lg:h-80 ${
            isLeftDiagram ? 'lg:order-1' : 'lg:order-2'
          }`}
        >
          <SlideVisual index={index} />
        </motion.div>
      </motion.div>
    </section>
  );
}