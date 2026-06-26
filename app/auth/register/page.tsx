"use client";

import { useState } from "react";
import { motion, AnimatePresence, MotionConfig } from "motion/react";
import { FiMail, FiLock, FiUser, FiLoader, FiAlertCircle, FiCheckCircle, FiHome, FiShield, FiKey, FiZap } from "react-icons/fi";
import { useAuth } from "@/context/useAuth";
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

  // Blob interaction states
  const [blobMood, setBlobMood] = useState<BlobMood>("neutral");
  const [blobGaze, setBlobGaze] = useState({ x: 0, y: 0 });

  const { register } = useAuth();

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
      await register(username, email, password);
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
      <div className="absolute -right-20 -top-20 h-96 w-96 rounded-full bg-purple-900/15 blur-3xl" />
      <div className="absolute -bottom-20 -left-20 h-96 w-96 rounded-full bg-indigo-950/30 blur-3xl" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-80 w-80 rounded-full bg-purple-950/20 blur-3xl" />
    </div>
  );

  return (
    <div className="relative min-h-screen w-full flex flex-col lg:grid lg:grid-cols-2 overflow-hidden text-slate-100">
      {/* Background Gradient + Absolute Grid Overlay */}
      {renderBackgroundWithGrid()}

      {/* Top Bar Navigation - Absolute Logo & Home Button */}
      <div className="absolute top-4 left-6 lg:left-47 right-6 z-30 flex items-center justify-between pointer-events-auto">
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

      {/* Left Column (Desktop) / Bottom (Mobile) - Form Area */}
      <div className="relative flex flex-col items-center justify-center p-6 pt-24 lg:p-16 z-10 order-2 lg:order-1">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-sm"
        >
          {/* Pre-form Info Header Badge */}
          <div className="mb-4 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-950/60 border border-purple-800/40 text-xs text-purple-300">
            <span className="h-1.5 w-1.5 rounded-full bg-purple-400 animate-pulse" />
            <span>New Identity Creation</span>
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

              {/* Registration Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-purple-200/90">Username</label>
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
                  <label className="mb-1.5 block text-sm font-medium text-purple-200/90">Email</label>
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
                <Link href="/auth/login" className="font-medium text-purple-400 hover:text-purple-300 hover:underline">
                  Sign in
                </Link>
              </p>
            </>
          )}
        </motion.div>
      </div>

      {/* Gradient Line Separator between columns */}
      <div className="hidden lg:block absolute top-20 bottom-20 left-1/2 w-[1px] -translate-x-1/2 bg-gradient-to-b from-transparent via-purple-500/40 to-transparent pointer-events-none z-20" />
      <div className="lg:hidden w-3/4 mx-auto h-[1px] bg-gradient-to-r from-transparent via-purple-500/40 to-transparent my-4 pointer-events-none z-20" />

      {/* Right Column (Desktop) / Top (Mobile) - Mascot & Info Panel Area */}
      <div className="relative flex flex-col justify-between p-8 pt-24 pb-12 lg:p-16 z-10 order-1 lg:order-2">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative z-10 flex flex-col text-left w-full max-w-lg mx-auto"
        >
          {/* Headline & Description Left-Aligned */}
          <div className="my-4 text-left">
            <h1 className="text-3xl md:text-4xl font-bold text-white tracking-tight leading-tight">
              {success ? "You're All Set!" : "Meet Helmet"}
            </h1>
            <p className="mt-3 text-sm md:text-[14px] font-medium text-purple-200/80 leading-relaxed">
              {success
                ? "Your identity on Zevra is secured. Step inside your encrypted hub."
                : "Create your identity on Zevra with zero-knowledge encryption."}
            </p>
          </div>

          {/* Feature Highlights Badges */}
          <div className="flex flex-wrap items-center gap-3 my-2">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-purple-900/30 border border-purple-500/30 text-xs font-medium text-purple-300">
              <FiShield className="h-3.5 w-3.5 text-purple-400" />
              <span>Zero-Knowledge</span>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-indigo-900/30 border border-indigo-500/30 text-xs font-medium text-indigo-300">
              <FiKey className="h-3.5 w-3.5 text-indigo-400" />
              <span>Private Encryption</span>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-violet-900/30 border border-violet-500/30 text-xs font-medium text-violet-300">
              <FiZap className="h-3.5 w-3.5 text-violet-400" />
              <span>Instant Setup</span>
            </div>
          </div>

          {/* Centered Blob Container */}
          <div className="mx-auto h-64 w-64 md:h-96 md:w-120 transition-transform duration-300 hover:scale-105">
            <MotionConfig transition={{ type: "tween", duration: 0.4, ease: "easeInOut" }}>
              <JellyBlobMascot mood={success ? "neutral" : blobMood} gaze={blobGaze} />
            </MotionConfig>
          </div>

          {/* Mascot Speech/Status Line Beneath Blob */}
          <div className=" flex items-center justify-center text-center">
            <p className="text-sm font-semibold text-purple-300">
              {blobMood === "password" && "Keeping a side-eye on your password!"}
              {blobMood === "happy" && "Account ready! Welcome to Zevra."}
              {blobMood === "neutral" && "Your zero-knowledge security companion."}
              {blobMood === "hmm" && "Focusing closely on your email details..."}
              {blobMood === "sideEye" && "Keeping a watchful eye on your input!"}
              {blobMood === "sad" && "Oops! Let's fix those errors real quick."}
            </p>
          </div>

          <p className="mt-2 text-xs text-purple-200/50 text-center">
            End-to-end encrypted messaging. Only you and your recipient possess the keys.
          </p>
        </motion.div>
      </div>
    </div>
  );
}