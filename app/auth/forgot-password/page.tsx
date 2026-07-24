"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "motion/react";
import { FiArrowLeft, FiKey, FiLock, FiShield, FiUserPlus } from "react-icons/fi";

const POINTS = [
  {
    icon: FiLock,
    title: "We never see your password",
    body: "Sign-in uses SRP-6a, so the server only stores a verifier — not your password or anything that can recover it.",
  },
  {
    icon: FiKey,
    title: "Your password seals your keys",
    body: "Your private encryption keys are locked with a key derived from your password (Argon2id). Without it, nobody — including us — can unlock them.",
  },
  {
    icon: FiShield,
    title: "So a reset would lose everything",
    body: "Resetting the password would make every past message permanently unreadable. That's why account recovery isn't possible.",
  },
];

export default function ForgotPasswordPage() {
  return (
    <div
      className="auth-page relative flex min-h-screen w-screen flex-col justify-between overflow-x-hidden p-4 text-white sm:p-6"
      style={{ colorScheme: "dark" }}
    >
      <div className="absolute inset-0 -z-10 bg-zinc-950">
        <div className="absolute inset-0 bg-gradient-to-br from-black via-zinc-950 to-purple-950/80" />
        <div
          className="absolute inset-0 opacity-15"
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, rgba(147, 51, 234, 0.35) 1px, transparent 0)`,
            backgroundSize: "28px 28px",
          }}
        />
        <div className="absolute -right-20 -top-20 h-96 w-96 rounded-full bg-purple-900/15 blur-3xl" />
        <div className="absolute -bottom-20 -left-20 h-96 w-96 rounded-full bg-indigo-950/30 blur-3xl" />
      </div>

      <header className="z-30 mx-auto flex w-full max-w-6xl shrink-0 items-center justify-between">
        <Link href="/" className="group flex items-center gap-2">
          <Image src="/zevra-logo.webp" alt="Zevra" width={32} height={32} className="h-8 w-8 object-contain" />
          <span className="text-lg font-extrabold tracking-tight text-white transition-colors group-hover:text-purple-300">
            Zevra
          </span>
        </Link>
      </header>

      <main className="relative z-10 mx-auto flex w-full max-w-xl flex-1 items-center py-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full"
        >
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-purple-800/40 bg-purple-950 px-3 py-1 text-xs text-purple-300">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-purple-400" />
            Zero-knowledge encryption
          </div>

          <h1 className="mb-2 text-2xl font-bold text-white sm:text-3xl">Forgot your password?</h1>
          <p className="mb-4 text-sm leading-relaxed text-white/80">
            We&apos;re sorry — Zevra can&apos;t reset it. Your password is the only key to your
            encrypted messages, and it never leaves your device.
          </p>

          <div className="mb-6 h-0.5 w-[50%] bg-gradient-to-r from-purple-300 to-indigo-600" />

          <ul className="space-y-3">
            {POINTS.map(({ icon: Icon, title, body }) => (
              <li
                key={title}
                className="flex gap-3 rounded-xl border-2 border-border-purple bg-black/60 px-4 py-3.5"
              >
                <Icon className="mt-0.5 h-4 w-4 shrink-0 text-purple-400" />
                <div>
                  <p className="text-sm font-semibold text-white">{title}</p>
                  <p className="mt-0.5 text-xs leading-relaxed text-purple-200/80">{body}</p>
                </div>
              </li>
            ))}
          </ul>

          <p className="mt-6 text-sm text-white/80">
            If you can&apos;t remember it, create a new account. Your old conversations stay
            encrypted and can&apos;t be recovered.
          </p>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/auth/register"
              className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-brand to-accent py-3.5 font-semibold text-text-white shadow-lg shadow-purple-950/50 hover:from-brand-hover hover:to-accent-hover"
            >
              <FiUserPlus className="h-4 w-4" />
              Create a new account
            </Link>
            <Link
              href="/auth/login"
              className="flex flex-1 items-center justify-center gap-2 rounded-xl border-2 border-border-purple bg-black/60 py-3.5 font-semibold text-purple-200 transition-colors hover:border-border-purple-focus hover:text-white"
            >
              <FiArrowLeft className="h-4 w-4" />
              Back to sign in
            </Link>
          </div>
        </motion.div>
      </main>

      <footer className="h-4 shrink-0" />
    </div>
  );
}
