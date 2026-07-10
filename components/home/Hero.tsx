"use client";

import React from "react";
import { motion } from "motion/react";
import RotatingText from "@/components/animations/RotatingText";

const GLOW_BARS = [4, 9, 1,9];

export default function Hero() {
  return (
    <section className="relative min-h-screen   text-white flex flex-col justify-between overflow-hidden lg:py-32 select-none">
      
      {/* Background Gradients & Glows (Purple Theme - Inverted & Faded) */}
      <div className="absolute top-0 left-0 right-0 h-[70%] bg-gradient-to-b from-[#a855f7]/10  to-transparent pointer-events-none blur-[140px]" />
      {/* 3D Glass Lens Visuals */}
      <div className="absolute inset-0 pointer-events-none z-0">
        {/* Left Lens */}
        <motion.div
          animate={{ x: [-55, 0, 15, -55] }}
          transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
          className="absolute left-[4%] top-[32%] w-[210px] h-[340px] rounded-[110px] border border-purple-500/15 bg-gradient-to-tr from-purple-500/10 via-purple-400/5 to-transparent backdrop-blur-md rotate-[-28deg] shadow-[inset_0_0_30px_rgba(168,85,247,0.12)]"
        />

        {/* Center Middle Lens */}
        <motion.div
          animate={{ y: [-20, 25, -12,-20] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 1 }}
          className="absolute left-[20%] top-[22%] w-83 h-47  rounded-[100px] border border-purple-500/15 bg-gradient-to-b from-purple-500/10 via-purple-400/5 to-transparent backdrop-blur-md rotate-[14deg] shadow-[inset_0_0_30px_rgba(168,85,247,0.12)]"
        />

        {/* Top Right Background Lens */}
        <motion.div
          animate={{ y: [14, 0, -24,14] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
          className="absolute left-[40%] top-[4%] w-[220px] h-[280px] rounded-[100px] border border-purple-400/15 bg-gradient-to-tl from-purple-500/10 via-purple-400/5 to-transparent backdrop-blur-md rotate-[38deg] shadow-[inset_0_0_30px_rgba(168,85,247,0.12)]"
        />
      </div>

      {/* Top Header Row */}
      <div className="relative z-10 flex justify-between items-start w-full max-w-7xl mx-auto">
        
        {/* Top-Left Paragraph */}
        <p className="text-text-body text-[13px] sm:text-sm max-w-[290px] leading-relaxed text-left m-0">
          <span className="text-text-secondary font-semibold">Zevra Architecture,</span> engineered for absolute sovereign intelligence and cryptographic privacy.
        </p>

        {/* Top-Right Dark Preview Card */}
        <div className="bg-bg-card border border-purple-900/40 p-2.5 rounded-2xl w-64 shadow-2xl flex flex-col gap-2.5">
          <div className="relative w-full h-28 rounded-xl overflow-hidden bg-bg-inset flex items-center justify-center">
            <style>{`
              @keyframes barGlow {
                0%, 100% { background: rgba(168,85,247,0.2); border-color: rgba(168,85,247,0.3); box-shadow: none; }
                50% { background: rgba(168,85,247,0.8); border-color: rgba(192,132,252,1); box-shadow: 0 0 12px rgba(168,85,247,0.9); }
              }
            `}</style>
            <div className="flex items-center justify-center gap-[3px] scale-90">
              {[...Array(15)].map((_, i) => (
                <div
                  key={i}
                  className={`w-2.5 h-14 rounded-full border backdrop-blur-sm ${
                    GLOW_BARS.includes(i) ? "border-purple-400/30" : "border-purple-400/30 bg-gradient-to-b from-purple-400/20 to-transparent"
                  }`}
                  style={{
                    transform: `skewY(${i > 7 ? (i - 7) * 5 : (7 - i) * -5}deg)`,
                    ...(GLOW_BARS.includes(i) && {
                      animation: `barGlow 3s ease-in-out ${(GLOW_BARS.indexOf(i)) * 1}s infinite`,
                    }),
                  }}
                />
              ))}
            </div>
          </div>
          <p className="text-purple-100 font-bold text-[11px] tracking-tight px-1 pb-0.5 text-left">
            Zevra Intelligence, sovereign and encrypted
          </p>
        </div>
      </div>

      {/* Main Center Typography (Pinned to Right Side) */}
      <div className="relative z-10 w-full max-w-7xl mx-auto pt-20  text-right flex flex-col items-end justify-end">
          <h1 className="text-6xl flex items-center sm:text-8xl md:text-[110px] lg:text-[124px] font-semibold tracking-tight  text-white text-right self-end">
          Sealed<p className="text-purple-300/30 tracking-normal font-light scale-y-[0.9] ml-2">-Private</p>
        </h1>
        <h2 className="text-6xl sm:text-8xl md:text-[110px] pb-8 lg:text-[90px] font-medium tracking-tighter leading-[0.9] text-right self-end overflow-hidden">
          <RotatingText
            texts={["Conversations", "Interactions", "Discussions"]}
            mainClassName="text-purple-300/50 inline"
            staggerDuration={0.05}
            splitBy="characters"
            transition={{ type: "spring", damping: 20, stiffness: 200 }}
          />
        </h2>
      </div>

      {/* Bottom Footer Section */}
      <div className="relative z-10 w-full max-w-7xl mx-auto pt-6 border-t border-border">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          
          <p className="text-[12px] sm:text-[13px] text-text-body max-w-xl leading-relaxed text-left">
            Zevra Protocol unifies zero-knowledge privacy with decentralized language processing. End-to-end encrypted cognitive compute for the Web3 ecosystem.
          </p>

          <button className="bg-gradient-to-r from-brand to-accent text-text-white font-extrabold text-xs px-6 py-2.5 rounded-xl hover:from-brand-hover hover:to-accent-hover transition-all shadow-md active:scale-95 whitespace-nowrap">
            Initiate Session
          </button>
        </div>
      </div>
    </section>
  );
}
