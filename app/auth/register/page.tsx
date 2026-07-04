"use client";

import { useState } from "react";
import { motion, AnimatePresence, MotionConfig } from "motion/react";
import { FiMail, FiLock, FiUser, FiLoader, FiAlertCircle, FiCheckCircle, FiShield, FiKey, FiZap } from "react-icons/fi";
import { api } from "@/utils";
import Link from "next/link";
import Image from "next/image";
import { JellyBlobMascot } from "feral-blob";
import "feral-blob/blob.css";

type BlobMood = "neutral" | "happy" | "sad" | "angry" | "hmm" | "sideEye" | "password";

export default function RegisterPage() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [blobMood, setBlobMood] = useState<BlobMood>("neutral");
  const [blobGaze, setBlobGaze] = useState({ x: 0, y: 0 });

  const buttonAnimation = {
    whileHover: { scale: 1.02 },
    whileTap: { scale: 0.98 },
    transition: { type: "tween" as const, duration: 0.15, ease: "easeInOut" as const },
  };

  const handleInputFocus = (field: "username" | "email" | "password") => {
    if (field === "password") {
      setBlobMood("sideEye");
      setBlobGaze({ x: -15, y: 10 });
    } else if (field === "email") {
      setBlobMood("hmm");
      setBlobGaze({ x: -12, y: 5 });
    } else {
      setBlobMood("neutral");
      setBlobGaze({ x: -12, y: -5 });
    }
  };

  const handleInputBlur = () => {
    setBlobMood("neutral");
    setBlobGaze({ x: 0, y: 0 });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (username.trim().length < 3) {
      setError("Username must be at least 3 characters");
      setBlobMood("sideEye");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      setBlobMood("sideEye");
      return;
    }

    setLoading(true);
    setBlobMood("hmm");
    try {
      await api.post("/api/auth/register", {
        username: username.trim(),
        email,
        password,
      });
      setSuccess(true);
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        "Something went wrong";
      setError(Array.isArray(msg) ? msg[0] : msg);
      setBlobMood("sad");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page relative min-h-screen w-full flex flex-col text-slate-100">
      {/* Full-screen background */}
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
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-80 w-80 rounded-full bg-purple-950/20 blur-3xl" />
      </div>

      {/* Top nav */}
      <div className="absolute top-4 left-4 right-4 sm:top-6 sm:left-6 sm:right-6 z-30 flex items-center justify-between pointer-events-auto">
        <Link href="/" className="flex items-center gap-2 group">
          <Image
            src="/zevra-logo.webp"
            alt="Zevra"
            width={32}
            height={32}
            className="w-8 h-8 object-contain"
          />
          <span className="font-extrabold text-lg tracking-tight text-white group-hover:text-purple-300 transition-colors">
            Zevra
          </span>
        </Link>
      </div>

      {/* Content — centered, max 7xl */}
      <div className="relative z-10 mx-auto flex w-full max-w-7xl flex-1 items-center px-4 py-20 sm:px-6 lg:px-8">
        <div className="grid w-full grid-cols-1 items-center gap-8 lg:grid-cols-2 lg:gap-12">
          {/* ─── Left: Form ──────────────────────────────────────── */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-md mx-auto lg:mx-0 lg:order-1"
          >
            <div className="mb-4 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-950/60 border border-purple-800/40 text-xs text-purple-300">
              <span className="h-1.5 w-1.5 rounded-full bg-purple-400 animate-pulse" />
              New Identity Creation
            </div>

            {success ? (
              <div className="text-center">
                <FiCheckCircle className="mx-auto mb-4 h-12 w-12 text-purple-400" />
                <h1 className="mb-2 text-2xl font-bold text-white">Account Created!</h1>
                <p className="mb-6 text-sm text-purple-200/70">
                  Your account is ready. Please sign in to continue.
                </p>
                <Link
                  href="/auth/login"
                  className="inline-block w-full rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 px-6 py-3.5 text-sm font-semibold text-white shadow-lg shadow-purple-900/30 transition-all hover:from-purple-500 hover:to-indigo-500"
                >
                  Sign In
                </Link>
              </div>
            ) : (
              <>
                <h2 className="mb-1 text-2xl font-bold text-white">Create account</h2>
                <p className="mb-6 text-sm text-purple-200/70">
                  Join Zevra with end-to-end encrypted messaging.
                </p>

                <AnimatePresence>
                  {error && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="mb-4 flex items-center gap-2 rounded-xl bg-red-500/10 border border-red-500/30 px-4 py-3 text-sm text-red-300"
                    >
                      <FiAlertCircle className="h-4 w-4 shrink-0 text-red-400" />
                      {error}
                    </motion.div>
                  )}
                </AnimatePresence>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-purple-200/90">
                      Username
                    </label>
                    <div className="flex items-center gap-2 rounded-xl bg-black/60 border border-purple-900/40 px-4 py-3 transition-all focus-within:border-purple-500 focus-within:ring-1 focus-within:ring-purple-500/40">
                      <FiUser className="h-4 w-4 text-purple-400" />
                      <input
                        type="text"
                        value={username}
                        onFocus={() => handleInputFocus("username")}
                        onBlur={handleInputBlur}
                        onChange={(e) => setUsername(e.target.value)}
                        placeholder="Choose a username"
                        required
                        minLength={3}
                        className="flex-1 bg-transparent text-sm text-white placeholder-zinc-500 outline-none"
                      />
                    </div>
                    <p className="mt-1 text-xs text-purple-300/40">Minimum 3 characters</p>
                  </div>

                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-purple-200/90">
                      Email
                    </label>
                    <div className="flex items-center gap-2 rounded-xl bg-black/60 border border-purple-900/40 px-4 py-3 transition-all focus-within:border-purple-500 focus-within:ring-1 focus-within:ring-purple-500/40">
                      <FiMail className="h-4 w-4 text-purple-400" />
                      <input
                        type="email"
                        value={email}
                        onFocus={() => handleInputFocus("email")}
                        onBlur={handleInputBlur}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="you@example.com"
                        required
                        className="flex-1 bg-transparent text-sm text-white placeholder-zinc-500 outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-purple-200/90">
                      Password
                    </label>
                    <div className="flex items-center gap-2 rounded-xl bg-black/60 border border-purple-900/40 px-4 py-3 transition-all focus-within:border-purple-500 focus-within:ring-1 focus-within:ring-purple-500/40">
                      <FiLock className="h-4 w-4 text-purple-400" />
                      <input
                        type="password"
                        value={password}
                        onFocus={() => handleInputFocus("password")}
                        onBlur={handleInputBlur}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        required
                        minLength={8}
                        className="flex-1 bg-transparent text-sm text-white placeholder-zinc-500 outline-none"
                      />
                    </div>
                    <p className="mt-1 text-xs text-purple-300/40">Minimum 8 characters</p>
                  </div>

                  <motion.button
                    {...buttonAnimation}
                    type="submit"
                    disabled={loading}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 py-3.5 text-sm font-semibold text-white shadow-lg shadow-purple-950/50 hover:from-purple-500 hover:to-indigo-500 disabled:opacity-50"
                  >
                    {loading ? (
                      <>
                        <FiLoader className="h-4 w-4 animate-spin" />
                        Creating account...
                      </>
                    ) : (
                      "Create Account"
                    )}
                  </motion.button>
                </form>

                <p className="mt-6 text-center text-sm text-purple-200/60">
                  Already have an account?{" "}
                  <Link
                    href="/auth/login"
                    className="font-medium text-purple-400 hover:text-purple-300 hover:underline"
                  >
                    Sign in
                  </Link>
                </p>
              </>
            )}
          </motion.div>

          {/* Separator — desktop only */}
          <div className="hidden lg:block absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1px] h-2/3 bg-gradient-to-b from-transparent via-purple-500/40 to-transparent pointer-events-none z-20" />

          {/* ─── Right: Mascot & Info ───────────────────────────── */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="hidden lg:flex flex-col items-center text-center lg:order-2"
          >
            <div className="mb-6 text-left">
              <h1 className="text-3xl xl:text-4xl font-bold text-white tracking-tight leading-tight">
                {success ? "You're All Set!" : "Meet Helmet"}
              </h1>
              <p className="mt-3 text-sm text-purple-200/80 leading-relaxed">
                {success
                  ? "Your identity on Zevra is secured. Step inside your encrypted hub."
                  : "Create your identity on Zevra with zero-knowledge encryption."}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2 mb-6">
              <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-purple-900/30 border border-purple-500/30 text-xs font-medium text-purple-300">
                <FiShield className="h-3.5 w-3.5 text-purple-400" />
                Zero-Knowledge
              </span>
              <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-indigo-900/30 border border-indigo-500/30 text-xs font-medium text-indigo-300">
                <FiKey className="h-3.5 w-3.5 text-indigo-400" />
                Private Encryption
              </span>
              <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-violet-900/30 border border-violet-500/30 text-xs font-medium text-violet-300">
                <FiZap className="h-3.5 w-3.5 text-violet-400" />
                Instant Setup
              </span>
            </div>

            <div className="h-64 w-64 xl:h-80 xl:w-80 transition-transform duration-300 hover:scale-105">
              <MotionConfig transition={{ type: "tween", duration: 0.4, ease: "easeInOut" }}>
                <JellyBlobMascot mood={success ? "neutral" : blobMood} gaze={blobGaze} />
              </MotionConfig>
            </div>

            <p className="mt-4 text-sm font-semibold text-purple-300">
              {blobMood === "password" && "Keeping a side-eye on your password!"}
              {blobMood === "happy" && "Account ready! Welcome to Zevra."}
              {blobMood === "neutral" && "Your zero-knowledge security companion."}
              {blobMood === "hmm" && "Focusing closely on your email details..."}
              {blobMood === "sideEye" && "Keeping a watchful eye on your input!"}
              {blobMood === "sad" && "Oops! Let's fix those errors real quick."}
            </p>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
