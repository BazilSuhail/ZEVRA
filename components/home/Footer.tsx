"use client";

import Link from "next/link";

export default function Footer() {
  return (
    <footer className="relative z-10 border-t border-white/10 bg-black/50 px-6 py-12">
      <div className="w-full">
        <div className="grid gap-8 md:grid-cols-4">
          <div>
            <h3 className="mb-4 text-lg font-bold">Zevra</h3>
            <p className="text-sm text-zinc-400">Secure, private messaging for everyone.</p>
          </div>
          <div>
            <h4 className="mb-3 text-sm font-semibold text-zinc-300">Product</h4>
            <div className="space-y-2">
              <Link href="/about" className="block text-sm text-zinc-500 hover:text-white transition-colors">About</Link>
              <Link href="/login" className="block text-sm text-zinc-500 hover:text-white transition-colors">Get Started</Link>
              <Link href="/chat" className="block text-sm text-zinc-500 hover:text-white transition-colors">Open Chat</Link>
            </div>
          </div>
          <div>
            <h4 className="mb-3 text-sm font-semibold text-zinc-300">Security</h4>
            <div className="space-y-2">
              <span className="block text-sm text-zinc-500">E2E Encryption</span>
              <span className="block text-sm text-zinc-500">Open Source</span>
              <span className="block text-sm text-zinc-500">Auditable</span>
            </div>
          </div>
          <div>
            <h4 className="mb-3 text-sm font-semibold text-zinc-300">Legal</h4>
            <div className="space-y-2">
              <span className="block text-sm text-zinc-500">Privacy Policy</span>
              <span className="block text-sm text-zinc-500">Terms of Service</span>
            </div>
          </div>
        </div>
        <div className="mt-8 border-t border-white/10 pt-8 text-center text-sm text-zinc-500">
          &copy; 2026 Zevra. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
