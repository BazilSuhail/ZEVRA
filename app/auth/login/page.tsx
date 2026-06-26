"use client";

import { useState } from "react";
import { motion, AnimatePresence, MotionConfig } from "motion/react";
import { FiMail, FiLock, FiUser, FiLoader, FiAlertCircle, FiHome, FiShield, FiKey, FiZap } from "react-icons/fi";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/useAuth";
import Link from "next/link";
import Image from "next/image";
import { JellyBlobMascot } from "feral-blob";
import "feral-blob/blob.css";

type BlobMood = "neutral" | "happy" | "sad" | "angry" | "hmm" | "sideEye" | "password";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Blob interaction states
  const [blobMood, setBlobMood] = useState<BlobMood>("neutral");
  const [blobGaze, setBlobGaze] = useState({ x: 0, y: 0 });

  const router = useRouter();
  const { login } = useAuth();

  // Button animation configuration
  const buttonAnimation = {
    whileHover: { scale: 1.02 },
    whileTap: { scale: 0.98 },
    transition: {
      type: "tween" as const,
      duration: 0.15,
      ease: "easeInOut" as const,
    }
  };

  const handleInputFocus = (field: "username" | "password") => {
    if (field === "password") {
      setBlobMood("sideEye");
      setBlobGaze({ x: 15, y: 10 });
    } else {
      setBlobMood("hmm");
      setBlobGaze({ x: 12, y: -5 });
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
      await login(username.trim(), password);
      router.push("/chat");
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

  // Background gradient & relative/absolute grid layer reusable markup
  const renderBackgroundWithGrid = () => (
    <div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none bg-zinc-950">
      {/* Dark Purple / Indigo Background Gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-black via-zinc-950 to-purple-950/80" />

      {/* Grid Pattern Overlay */}
      <div 
        className="absolute inset-0 opacity-15"
        style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, rgba(147, 51, 234, 0.35) 1px, transparent 0)`,
          backgroundSize: '28px 28px'
        }}
      />

      {/* Deep Dark Ambient Glows */}
      <div className="absolute -left-20 -top-20 h-96 w-96 rounded-full bg-purple-900/15 blur-3xl" />
      <div className="absolute -bottom-20 -right-20 h-96 w-96 rounded-full bg-indigo-950/30 blur-3xl" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-80 w-80 rounded-full bg-purple-950/20 blur-3xl" />
    </div>
  );

  return (
    <div className="relative h-screen overflow-y-hidden w-full flex flex-col lg:grid lg:grid-cols-2 overflow-hidden text-slate-100">
      {/* Background Gradient + Absolute Grid Overlay */}
      {renderBackgroundWithGrid()}

      {/* Top Bar Navigation - Absolute Logo & Home Button */}
      <div className="absolute top-6 left-6 lg:left-42 right-6 z-30 flex items-center justify-between pointer-events-auto">
        <Link href="/" className="flex items-center gap-2.5 group">
          <Image 
            src="/zevra-logo.webp" 
            alt="Zevra Logo" 
            width={36} 
            height={36} 
            className="w-9 h-9 object-contain transition-transform group-hover:scale-105"
          />
          <span className="font-extrabold text-xl tracking-tight text-white group-hover:text-purple-300 transition-colors">
            Zevra
          </span>
        </Link>
      </div>

      {/* Left Column (Desktop) / Top (Mobile) - Mascot & Info Panel Area */}
      <div className="relative flex flex-col p-8 pt-24 pb-12 lg:p-24 z-10 order-1 lg:order-1">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative lg:ml-20 z-10 flex flex-col text-left w-full max-w-lg mx-auto"
        >
          {/* Headline & Description Left-Aligned */}
          <div className="my-4 text-left">
            <h1 className="text-3xl md:text-4xl font-bold text-white tracking-tight leading-tight">
              Welcome Back
            </h1>
            <p className="mt-3 text-sm md:text-[14px] font-medium text-purple-200/80 leading-relaxed">
              Step back into your secure zero-knowledge encrypted messaging hub.
            </p>
          </div>

          {/* Feature Highlights Badges */}
          <div className="flex flex-wrap items-center gap-3 my-2">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-purple-900/30 border border-purple-500/30 text-xs font-medium text-purple-300">
              <FiShield className="h-3.5 w-3.5 text-purple-400" />
              <span>Zero Knowledge</span>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-indigo-900/30 border border-indigo-500/30 text-xs font-medium text-indigo-300">
              <FiKey className="h-3.5 w-3.5 text-indigo-400" />
              <span>Client Keys Only</span>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-violet-900/30 border border-violet-500/30 text-xs font-medium text-violet-300">
              <FiZap className="h-3.5 w-3.5 text-violet-400" />
              <span>Realtime Sync</span>
            </div>
          </div>

          {/* Centered Blob Container */}
          <div className="mx-auto h-64 w-64 md:h-88 md:w-110 transition-transform duration-300 hover:scale-105">
            <MotionConfig transition={{ type: "tween", duration: 0.4, ease: "easeInOut" }}>
              <JellyBlobMascot mood={blobMood} gaze={blobGaze} />
            </MotionConfig>
          </div>

          {/* Mascot Speech/Status Line Beneath Blob */}
          <div className="flex items-center justify-center text-center">
            <p className="text-sm font-semibold text-purple-300">
              {blobMood === "password" && "Keeping a side-eye on your password!"}
              {blobMood === "happy" && "Credentials verified! Signing in..."}
              {blobMood === "neutral" && "Your zero-knowledge security companion."}
              {blobMood === "hmm" && "Focusing on your login credentials..."}
              {blobMood === "sideEye" && "Keeping a side-eye on your password..."}
              {blobMood === "sad" && "Oops! Double check your credentials."}
            </p>
          </div>

          <p className="mt-2 text-xs text-purple-200/50 text-center">
            End-to-end encrypted messaging. Only you and your recipient possess the keys.
          </p>
        </motion.div>
      </div>

      {/* Gradient Line Separator between columns */}
      <div className="hidden lg:block absolute top-20 bottom-20 left-1/2 w-[1px] -translate-x-1/2 bg-gradient-to-b from-transparent via-purple-500/40 to-transparent pointer-events-none z-20" />
      <div className="lg:hidden w-3/4 mx-auto h-[1px] bg-gradient-to-r from-transparent via-purple-500/40 to-transparent my-4 pointer-events-none z-20" />

      {/* Right Column (Desktop) / Bottom (Mobile) - Form Area */}
      <div className="relative flex flex-col items-center justify-center p-6 pt-24 lg:p-16 z-10 order-2 lg:order-2">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-sm"
        >
          {/* Pre-form Info Header Badge */}
          <div className="mb-4 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-950/60 border border-purple-800/40 text-xs text-purple-300">
            <span className="h-1.5 w-1.5 rounded-full bg-purple-400 animate-pulse" />
            <span>Secure Authentication Vault</span>
          </div>

          <h2 className="mb-1 text-2xl font-bold text-white">Sign in</h2>
          <p className="mb-6 text-sm text-purple-200/70">
            Welcome back. Enter your credentials to continue.
          </p>

          {/* Error display */}
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

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-purple-200/90">Username or Email</label>
              <div className="flex items-center gap-2 rounded-xl bg-black/60 border border-purple-900/40 px-4 py-3 transition-all focus-within:border-purple-500 focus-within:ring-1 focus-within:ring-purple-500/40">
                <FiUser className="h-4 w-4 text-purple-400" />
                <input
                  type="text"
                  value={username}
                  onFocus={() => handleInputFocus("username")}
                  onBlur={handleInputBlur}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Your username or email"
                  required
                  minLength={3}
                  className="flex-1 bg-transparent text-sm text-white placeholder-zinc-500 outline-none"
                />
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-purple-200/90">Password</label>
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
                  Signing in...
                </>
              ) : (
                "Sign In"
              )}
            </motion.button>
          </form>

          <p className="mt-6 text-center text-sm text-purple-200/60">
            Don&apos;t have an account?{" "}
            <Link href="/auth/register" className="font-medium text-purple-400 hover:text-purple-300 hover:underline">
              Sign up
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}