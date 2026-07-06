import Link from "next/link";
import { FiShield, FiLock, FiGithub } from "react-icons/fi";

export default function Footer() {
  return (
    <footer className="relative z-10 border-t border-purple-500/20 bg-slate-950/80 px-4 sm:px-6 py-12 text-purple-100">
      <div className="max-w-7xl mx-auto">
        <div className="grid gap-8 md:grid-cols-4">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg border border-purple-500/30 bg-purple-950/60 text-purple-400">
                <FiLock className="w-4 h-4 text-purple-300" />
              </div>
              <h3 className="text-xl font-black tracking-wider text-white">ZEVRA</h3>
            </div>
            <p className="text-xs text-purple-200/70 leading-relaxed">
              Zero-knowledge encrypted chat and video platform built by Bazil Suhail. Zero plaintext stored, 100% mathematical privacy.
            </p>
          </div>

          <div>
            <h4 className="mb-4 text-xs font-mono font-bold uppercase tracking-widest text-indigo-300">
              Product
            </h4>
            <ul className="space-y-2.5">
              <li>
                <Link
                  href="/about"
                  className="text-xs text-purple-300/70 hover:text-white transition-colors"
                >
                  About Zevra
                </Link>
              </li>
              <li>
                <Link
                  href="/architecture"
                  className="text-xs text-purple-300/70 hover:text-white transition-colors"
                >
                  System Architecture
                </Link>
              </li>
              <li>
                <Link
                  href="/auth/register"
                  className="text-xs text-purple-300/70 hover:text-white transition-colors"
                >
                  Get Started
                </Link>
              </li>
              <li>
                <Link
                  href="/chat"
                  className="text-xs text-purple-300/70 hover:text-white transition-colors"
                >
                  Open Web App
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="mb-4 text-xs font-mono font-bold uppercase tracking-widest text-indigo-300">
              Security
            </h4>
            <ul className="space-y-2.5">
              <li>
                <Link
                  href="/architecture"
                  className="text-xs text-purple-300/70 hover:text-white transition-colors"
                >
                  AES-256-GCM / E2EE
                </Link>
              </li>
              <li>
                <span className="text-xs text-purple-300/70">SRP-6a Auth Protocol</span>
              </li>
              <li>
                <a
                  href="https://github.com/BazilSuhail/ZEVRA"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-purple-300/70 hover:text-white transition-colors flex items-center gap-1.5"
                >
                  <FiGithub className="w-3.5 h-3.5" /> Open Source Code
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="mb-4 text-xs font-mono font-bold uppercase tracking-widest text-indigo-300">Legal</h4>
            <ul className="space-y-2.5">
              <li>
                <span className="text-xs text-purple-300/70">
                  Privacy Policy
                </span>
              </li>
              <li>
                <span className="text-xs text-purple-300/70">
                  Terms of Service
                </span>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 border-t border-purple-500/20 pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-purple-300/60 gap-4">
          <p>&copy; 2026 Zevra. All rights reserved. Built by Bazil Suhail.</p>
          <div className="flex items-center gap-2">
            <FiShield className="w-3.5 h-3.5 text-purple-400" />
            <span>Zero-Knowledge Guarantee</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
