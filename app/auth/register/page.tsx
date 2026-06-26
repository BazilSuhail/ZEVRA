"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { FiMail, FiLock, FiUser, FiLoader, FiAlertCircle, FiCheckCircle } from "react-icons/fi";
import { useAuth } from "@/context/useAuth";
import Link from "next/link";
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
  const [blobMood, setBlobMood] = useState<BlobMood>("happy");
  const [blobGaze, setBlobGaze] = useState({ x: 0, y: 0 });

  const { register } = useAuth();

  const handleInputFocus = (field: "username" | "email" | "password") => {
    if (field === "password") {
      setBlobMood("password");
      setBlobGaze({ x: -15, y: 10 });
    } else if (field === "username") {
      setBlobMood("happy");
      setBlobGaze({ x: 12, y: -5 });
    } else {
      setBlobMood("hmm");
      setBlobGaze({ x: 12, y: 5 });
    }
  };

  const handleInputBlur = () => {
    setBlobMood("happy");
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
      setBlobMood("happy");
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

  if (success) {
    return (
      <div className="grid min-h-screen grid-cols-1 lg:grid-cols-2">
        {/* Left - Hero Banner */}
        <div className="hidden flex-col items-center justify-center border-r border-zinc-200 bg-zinc-50/50 p-12 dark:border-zinc-800 dark:bg-zinc-900/50 lg:flex">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center text-center"
          >
            <div className="mb-6 h-48 w-48">
              <JellyBlobMascot mood="happy" gaze={{ x: 0, y: 0 }} />
            </div>
            <h1 className="mb-2 text-3xl font-extrabold text-zinc-900 dark:text-zinc-100">You're All Set!</h1>
            <p className="max-w-sm text-sm text-zinc-500 dark:text-zinc-400">
              Your identity on Zevra is secured. Step inside your encrypted communication hub.
            </p>
          </motion.div>
        </div>

        {/* Right - Success */}
        <div className="flex flex-col items-center justify-center bg-background p-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-sm text-center"
          >
            <FiCheckCircle className="mx-auto mb-4 h-12 w-12 text-emerald-500" />
            <h1 className="mb-2 text-2xl font-bold">Account Created!</h1>
            <p className="mb-6 text-sm text-zinc-500 dark:text-zinc-400">
              Your account is ready. Please sign in to continue.
            </p>
            <Link
              href="/auth/login"
              className="inline-block w-full rounded-xl bg-emerald-600 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-emerald-700"
            >
              Sign In
            </Link>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="grid min-h-screen grid-cols-1 lg:grid-cols-2">
      {/* Left - Interactive Mascot Banner */}
      <div className="relative hidden flex-col items-center justify-center overflow-hidden border-r border-zinc-200 bg-zinc-50/60 p-12 dark:border-zinc-800 dark:bg-zinc-900/40 lg:flex">
        {/* Ambient Glows */}
        <div className="absolute -left-20 -top-20 h-64 w-64 rounded-full bg-emerald-500/10 blur-3xl" />
        <div className="absolute -bottom-20 -right-20 h-64 w-64 rounded-full bg-teal-500/10 blur-3xl" />

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative z-10 flex flex-col items-center text-center"
        >
          <div className="mb-6 h-56 w-56 transition-transform duration-300 hover:scale-105">
            <JellyBlobMascot mood={blobMood} gaze={blobGaze} />
          </div>

          <h1 className="mb-2 text-3xl font-extrabold text-zinc-900 dark:text-zinc-100">
            Meet Helmet
          </h1>
          <p className="max-w-xs text-sm font-medium text-emerald-600 dark:text-emerald-400">
            {blobMood === "password" && "Shhh... I'm looking away for privacy!"}
            {blobMood === "happy" && "Your zero-knowledge security companion."}
            {blobMood === "hmm" && "Checking out your email..."}
            {blobMood === "sideEye" && "Wait... that doesn't look quite right!"}
            {blobMood === "sad" && "Oops! Let's fix those errors real quick."}
          </p>
          <p className="mt-4 max-w-sm text-xs text-zinc-500 dark:text-zinc-400">
            End-to-end encrypted messaging. Only you and your recipient possess the keys.
          </p>
        </motion.div>
      </div>

      {/* Right - Form */}
      <div className="flex flex-col items-center justify-center bg-background p-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-sm"
        >
          {/* Mobile Header Mascot */}
          <div className="mb-6 text-center lg:hidden">
            <div className="mx-auto mb-2 h-20 w-20">
              <JellyBlobMascot mood={blobMood} gaze={blobGaze} />
            </div>
            <h1 className="text-xl font-bold">Zevra</h1>
          </div>

          <h2 className="mb-1 text-2xl font-bold">Create account</h2>
          <p className="mb-6 text-sm text-zinc-500 dark:text-zinc-400">
            Join Zevra with end-to-end encrypted messaging.
          </p>

          {/* Error display */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-4 flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400"
              >
                <FiAlertCircle className="h-4 w-4 shrink-0" />
                {error}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Registration Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium">Username</label>
              <div className="flex items-center gap-2 rounded-xl border border-zinc-200 bg-white px-4 py-3 transition-colors focus-within:border-emerald-500 dark:border-zinc-700 dark:bg-zinc-800 dark:focus-within:border-emerald-500">
                <FiUser className="h-4 w-4 text-zinc-400" />
                <input
                  type="text"
                  value={username}
                  onFocus={() => handleInputFocus("username")}
                  onBlur={handleInputBlur}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Choose a username"
                  required
                  minLength={3}
                  className="flex-1 bg-transparent text-sm outline-none"
                />
              </div>
              <p className="mt-1 text-xs text-zinc-400">Minimum 3 characters</p>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium">Email</label>
              <div className="flex items-center gap-2 rounded-xl border border-zinc-200 bg-white px-4 py-3 transition-colors focus-within:border-emerald-500 dark:border-zinc-700 dark:bg-zinc-800 dark:focus-within:border-emerald-500">
                <FiMail className="h-4 w-4 text-zinc-400" />
                <input
                  type="email"
                  value={email}
                  onFocus={() => handleInputFocus("email")}
                  onBlur={handleInputBlur}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  className="flex-1 bg-transparent text-sm outline-none"
                />
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium">Password</label>
              <div className="flex items-center gap-2 rounded-xl border border-zinc-200 bg-white px-4 py-3 transition-colors focus-within:border-emerald-500 dark:border-zinc-700 dark:bg-zinc-800 dark:focus-within:border-emerald-500">
                <FiLock className="h-4 w-4 text-zinc-400" />
                <input
                  type="password"
                  value={password}
                  onFocus={() => handleInputFocus("password")}
                  onBlur={handleInputBlur}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  minLength={8}
                  className="flex-1 bg-transparent text-sm outline-none"
                />
              </div>
              <p className="mt-1 text-xs text-zinc-400">Minimum 8 characters</p>
            </div>

            <motion.button
              whileHover={{ scale: loading ? 1 : 1.01 }}
              whileTap={{ scale: loading ? 1 : 0.99 }}
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 py-3 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50 disabled:hover:bg-emerald-600"
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

          <p className="mt-6 text-center text-sm text-zinc-500 dark:text-zinc-400">
            Already have an account?{" "}
            <Link href="/auth/login" className="font-medium text-emerald-500 hover:underline">
              Sign in
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
