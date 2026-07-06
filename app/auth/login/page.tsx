"use client";

import { useState } from "react";
import { motion, AnimatePresence, MotionConfig } from "motion/react";
import { FiLock, FiUser, FiLoader, FiAlertCircle, FiShield, FiKey, FiZap, FiArrowRight } from "react-icons/fi";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/context/stores";
import { api, setTokens } from "@/utils";
import { srpClient } from "@/utils/srp";
import Link from "next/link";
import Image from "next/image";
import dynamic from "next/dynamic";

const JellyBlobMascot = dynamic(
  () => import("feral-blob").then((mod) => mod.JellyBlobMascot),
  { ssr: false }
);
import "feral-blob/blob.css";

type BlobMood = "neutral" | "happy" | "sad" | "angry" | "hmm" | "sideEye" | "password";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [blobMood, setBlobMood] = useState<BlobMood>("neutral");
  const [blobGaze, setBlobGaze] = useState({ x: 0, y: 0 });

  const router = useRouter();
  const setAuth = useAuthStore((s) => s.setAuth);

  const buttonAnimation = {
    whileHover: { scale: 1.02 },
    whileTap: { scale: 0.98 },
    transition: { type: "tween" as const, duration: 0.15, ease: "easeInOut" as const },
  };

  const handleInputFocus = (field: "username" | "password") => {
    if (field === "password") {
      setBlobMood("password");
      setBlobGaze({ x: 15, y: 10 });
    } else {
      setBlobMood("hmm");
      setBlobGaze({ x: 12, y: 5 });
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
      const startRes = await api.post<{
        success: boolean;
        userId: string;
        username: string;
        srpSalt: string;
        B: string;
      }>("/api/auth/login/start", { username: username.trim() });

      if (!startRes.success) throw new Error("Login start failed");

      const { A, M1 } = await srpClient({
        username: username.trim(),
        password,
        srpSalt: startRes.srpSalt,
        B: startRes.B,
      });

      const finishRes = await api.post<{
        success: boolean;
        user: { id: string; username: string; email: string };
        accessToken: string;
        refreshToken: string;
        keys: Record<string, unknown>;
        M2: string;
      }>("/api/auth/login/finish", {
        username: username.trim(),
        A,
        M1,
      });

      if (!finishRes.success) throw new Error("Login failed");

      setTokens(finishRes.accessToken, finishRes.refreshToken);
      setAuth(finishRes.user, finishRes.accessToken);
      setBlobMood("happy");
      router.push("/chat");
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        "Invalid credentials";
      setError(Array.isArray(msg) ? msg[0] : msg);
      setBlobMood("sad");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page relative h-screen w-screen overflow-hidden text-slate-100 flex flex-col justify-between p-4 sm:p-6">
      <div className="absolute inset-0 -z-10 bg-zinc-950">
        <div className="absolute inset-0 bg-gradient-to-br from-black via-zinc-950 to-purple-950/80" />
        <div
          className="absolute inset-0 opacity-15"
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, rgba(147, 51, 234, 0.35) 1px, transparent 0)`,
            backgroundSize: "28px 28px",
          }}
        />
        <div className="absolute -left-20 -top-20 h-96 w-96 rounded-full bg-purple-900/15 blur-3xl" />
        <div className="absolute -bottom-20 -right-20 h-96 w-96 rounded-full bg-indigo-950/30 blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-80 w-80 rounded-full bg-purple-950/20 blur-3xl" />
      </div>

      <header className="z-30 flex items-center justify-between w-full max-w-6xl mx-auto shrink-0">
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
      </header>

      <main className="relative z-10 bg mx-auto flex w-full max-w-6xl flex-1 items-center justify-center overflow-hidden">
        <div className="grid w-full grid-cols-1 items-center gap-6 lg:grid-cols-2 lg:gap-12 my-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="hidden lg:flex flex-col items-center lg:items-start text-center lg:order-1"
          >
            <div className="mb-4 text-left">
              <h1 className="text-2xl xl:text-3xl font-bold text-white tracking-tight leading-tight">
                Welcome Back
              </h1>
              <p className="mt-1 text-xs sm:text-sm text-purple-200/80 leading-relaxed">
                Unlock your end-to-end encrypted session safely with Helmet.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2 mb-4 justify-center">
              <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-purple-900/30 border border-purple-500/30 text-xs font-medium text-purple-300">
                <FiShield className="h-3.5 w-3.5 text-purple-400" />
                Zero-Knowledge
              </span>
              <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-indigo-900/30 border border-indigo-500/30 text-xs font-medium text-indigo-300">
                <FiKey className="h-3.5 w-3.5 text-indigo-400" />
                Private Keys
              </span>
              <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-violet-900/30 border border-violet-500/30 text-xs font-medium text-violet-300">
                <FiZap className="h-3.5 w-3.5 text-violet-400" />
                Secure Auth
              </span>
            </div>

            <div className="h-48 w-48 xl:h-100 xl:w-110 mx-auto transition-transform duration-300 hover:scale-105">
              <MotionConfig transition={{ type: "tween", duration: 0.4, ease: "easeInOut" }}>
                <JellyBlobMascot mood={blobMood} gaze={blobGaze} />
              </MotionConfig>
            </div>

            <p className="lg:-mt-16 text-xs mx-auto xl:text-sm font-semibold text-purple-300">
              {blobMood === "password" && "Shh... I'm looking away for your password!"}
              {blobMood === "happy" && "Success! Authenticating..."}
              {blobMood === "neutral" && "Ready when you are!"}
              {blobMood === "hmm" && "Checking your credentials..."}
              {blobMood === "sideEye" && "Make sure your information is accurate!"}
              {blobMood === "sad" && "Authentication failed. Try again."}
            </p>
          </motion.div>

          <div className="hidden lg:block absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1px] h-2/3 bg-gradient-to-b from-transparent via-purple-500/40 to-transparent pointer-events-none z-20" />

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-md mx-auto lg:order-2"
          >
            <div className="mb-3 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-950/60 border border-purple-800/40 text-xs text-purple-300">
              <span className="h-1.5 w-1.5 rounded-full bg-purple-400 animate-pulse" />
              Identity Verification
            </div>

            <h2 className="mb-1 text-2xl font-bold text-white">Sign in</h2>
            <p className="mb-4 text-xs sm:text-sm text-purple-200/70">
              Enter your credentials below to access your account.
            </p>

            <div className="w-[50%] mb-4 lg:mb-12 bg-gradient-to-r from-purple-300 to-indigo-900 h-0.5" />

            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mb-3 flex items-center gap-2 rounded-xl bg-red-500/10 border border-red-500/30 px-3 py-2 text-xs text-red-300"
                >
                  <FiAlertCircle className="h-4 w-4 shrink-0 text-red-400" />
                  {error}
                </motion.div>
              )}
            </AnimatePresence>

            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="mb-3 block text-xs font-medium text-purple-200/90">
                  Username
                </label>
                <div className="flex items-center gap-2 rounded-xl bg-black/60 border-2 border-purple-500/30 px-3.5  py-4 text-[15px]  transition-all focus-within:border-purple-500 focus-within:ring-1 focus-within:ring-purple-500/40">
                  <FiUser className="h-4 w-4 text-purple-400 shrink-0" />
                  <input
                    type="text"
                    value={username}
                    onFocus={() => handleInputFocus("username")}
                    onBlur={handleInputBlur}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Enter your username"
                    required
                    minLength={3}
                    className="flex-1 bg-transparent text-sm text-white placeholder-zinc-500 outline-none w-full"
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-3">
                  <label className="text-xs font-medium text-purple-200/90">
                    Password
                  </label>
                  <Link
                    href="/auth/forgot-password"
                    className="text-[11px] text-purple-400 hover:text-purple-300 hover:underline"
                  >
                    Forgot?
                  </Link>
                </div>
                <div className="flex items-center gap-2 rounded-xl bg-black/60 border-2 border-purple-500/30 px-3.5 py-4 text-[15px] transition-all focus-within:border-purple-500 focus-within:ring-1 focus-within:ring-purple-500/40">
                  <FiLock className="h-4 w-4 text-purple-400 shrink-0" />
                  <input
                    type="password"
                    value={password}
                    onFocus={() => handleInputFocus("password")}
                    onBlur={handleInputBlur}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    minLength={8}
                    className="flex-1 bg-transparent text-sm text-white placeholder-zinc-500 outline-none w-full"
                  />
                </div>
              </div>

              <motion.button
                {...buttonAnimation}
                type="submit"
                disabled={loading}
                className="flex w-full mt-8 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 py-3.5 text-md font-semibold text-white shadow-lg shadow-purple-950/50 hover:from-purple-500 hover:to-indigo-500 disabled:opacity-50 "
              >
                {loading ? (
                  <>
                    <FiLoader className="h-4 w-4 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  <>
                    Sign In <FiArrowRight className="h-4 w-4" />
                  </>
                )}
              </motion.button>
            </form>

            <p className="mt-4 text-center text-xs text-purple-200/60">
              Don&apos;t have an account?{" "}
              <Link
                href="/auth/register"
                className="font-medium text-purple-400 hover:text-purple-300 hover:underline"
              >
                Create one
              </Link>
            </p>
          </motion.div>
        </div>
      </main>

      <footer className="shrink-0 h-4" />
    </div>
  );
}
