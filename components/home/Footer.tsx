import Link from "next/link";
import { FiShield, FiLock, FiGithub, FiArrowUpRight } from "react-icons/fi";

export default function Footer() {
  return (
    <footer className="relative w-full z-10 border-t border-purple-500/10  px-6 sm:px-12 lg:px-20 py-16 lg:py-24 text-neutral-300">
      <div className="max-w-7xl mx-auto flex flex-col justify-between gap-16">

        {/* Top Header Section with Big Modern Typography */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 border-b border-white/5 pb-12">
          <div className="space-y-4 max-w-3xl">
            <div className="flex items-center gap-2 font-mono text-xs tracking-widest text-purple-400 uppercase">
              <span className="h-1.5 w-1.5 rounded-full bg-purple-400 animate-pulse" />
              <span>Zero-Knowledge Ecosystem</span>
            </div>
            <h2 className="text-4xl sm:text-6xl md:text-7xl font-black tracking-tight text-white uppercase">
              SECURE BY <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-indigo-300 to-purple-600">MATH.</span>
            </h2>
          </div>

          {/* Quick Link Buttons */}
          <div className="flex flex-wrap items-center gap-3 font-mono text-xs">
            <Link
              href="/about"
              className="group flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-5 py-3 text-white transition-all hover:border-purple-400/50 hover:bg-purple-500/10"
            >
              <span>ABOUT ZEVRA</span>
              <FiArrowUpRight className="w-3.5 h-3.5 text-purple-400 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
            </Link>
            <Link
              href="/architecture"
              className="group flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-5 py-3 text-white transition-all hover:border-purple-400/50 hover:bg-purple-500/10"
            >
              <span>ARCHITECTURE</span>
              <FiArrowUpRight className="w-3.5 h-3.5 text-purple-400 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
            </Link>
          </div>
        </div>

        {/* Middle Content Grid */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10 items-start">

          {/* Platform Identity */}
          <div className="md:col-span-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl border border-purple-500/20 bg-purple-950/40 text-purple-300">
                <FiLock className="w-5 h-5" />
              </div>
              <span className="text-2xl font-black tracking-wider text-white">ZEVRA</span>
            </div>
            <p className="text-sm text-neutral-400 leading-relaxed max-w-md">
              End-to-end encrypted communication platform built with local cryptography and SRP-6a verification. Zero plaintext stored, guaranteed mathematical privacy.
            </p>
          </div>

          {/* Creator Feature Box */}
          <div className="md:col-span-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 rounded-2xl border border-white/5 bg-white/[0.02] p-6 backdrop-blur-md">
            <div className="space-y-1">
              <span className="font-mono text-[10px] tracking-widest text-purple-400 uppercase">
                Designed & Engineered By
              </span>
              <h3 className="text-lg font-bold text-white">Bazil Suhail</h3>
              <p className="text-xs text-neutral-400">
                Architecting zero-trust digital infrastructure.
              </p>
            </div>

            <a
              href="https://github.com/BazilSuhail/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 rounded-xl border border-purple-400/20 bg-purple-500/10 px-4 py-2.5 font-mono text-xs font-semibold text-purple-200 transition-all hover:border-purple-400/50 hover:bg-purple-500/20"
            >
              <FiGithub className="w-4 h-4 text-purple-300" />
              <span>@BazilSuhail</span>
            </a>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-white/5 pt-8 flex flex-col sm:flex-row items-center justify-between text-xs text-neutral-500 font-mono gap-4">
          <p>&copy; {new Date().getFullYear()} ZEVRA. All rights reserved.</p>
          <div className="flex items-center gap-2 text-purple-400/80">
            <FiShield className="w-4 h-4 text-purple-400" />
            <span>Zero-Knowledge Guarantee</span>
          </div>
        </div>

      </div>
    </footer>
  );
}
