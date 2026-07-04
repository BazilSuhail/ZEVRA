"use client";

import { useState } from "react";
import { motion, AnimatePresence, MotionConfig } from "motion/react";
import { FiLock, FiUser, FiLoader, FiAlertCircle, FiShield, FiKey, FiZap } from "react-icons/fi";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/context/stores";
import { api, setTokens } from "@/utils";
import { API } from "@/constants";
import { srpClient } from "@/utils/srp";
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
      // Step 1: SRP login start — get server public B + salt
      const startRes = await api.post<{
        success: boolean;
        userId: string;
        username: string;
        srpSalt: string;
        B: string;
      }>(API.AUTH.LOGIN_START, { username: username.trim() });

      if (!startRes.success) throw new Error("Login start failed");

      // Step 2: Compute SRP client proof (A, M1, session key K)
      const { A, M1 } = await srpClient({
        username: username.trim(),
        password,
        srpSalt: startRes.srpSalt,
        B: startRes.B,
      });

      // Step 3: Send A + M1 to server for verification
      const finishRes = await api.post<{
        success: boolean;
        user: { id: string; username: string; email: string };
        accessToken: string;
        refreshToken: string;
        keys: Record<string, unknown>;
        M2: string;
      }>(API.AUTH.LOGIN_FINISH, {
        username: username.trim(),
        A,
        M1,
      });

      if (!finishRes.success) throw new Error("Login failed");

      // Step 4: Store auth state + sync token to axios
      setTokens(finishRes.accessToken, finishRes.refreshToken);
      setAuth(finishRes.user, finishRes.accessToken);
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

  return (
    <div className="h-screen max-w-screen flex flex-col text-slate-100 overflow-hidden">
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
        <div className="absolute -left-20 -top-20 h-96 w-96 rounded-full bg-purple-900/15 blur-3xl" />
        <div className="absolute -bottom-20 -right-20 h-96 w-96 rounded-full bg-indigo-950/30 blur-3xl" />
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
          {/* ─── Left: Mascot & Info ─────────────────────────────── */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="hidden lg:flex flex-col items-center text-center"
          >
            <div className="mb-6 text-left">
              <h1 className="text-3xl xl:text-4xl font-bold text-white tracking-tight leading-tight">
                Welcome Back
              </h1>
              <p className="mt-3 text-sm text-purple-200/80 leading-relaxed">
                Step back into your secure zero-knowledge encrypted messaging hub.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2 mb-6">
              <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-purple-900/30 border border-purple-500/30 text-xs font-medium text-purple-300">
                <FiShield className="h-3.5 w-3.5 text-purple-400" />
                Zero Knowledge
              </span>
              <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-indigo-900/30 border border-indigo-500/30 text-xs font-medium text-indigo-300">
                <FiKey className="h-3.5 w-3.5 text-indigo-400" />
                Client Keys Only
              </span>
              <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-violet-900/30 border border-violet-500/30 text-xs font-medium text-violet-300">
                <FiZap className="h-3.5 w-3.5 text-violet-400" />
                Realtime Sync
              </span>
            </div>

            <div className="h-64 w-64 xl:h-80 xl:w-80 transition-transform duration-300 hover:scale-105">
              <MotionConfig transition={{ type: "tween", duration: 0.4, ease: "easeInOut" }}>
                <JellyBlobMascot mood={blobMood} gaze={blobGaze} />
              </MotionConfig>
            </div>

            <p className="mt-4 text-sm font-semibold text-purple-300">
              {blobMood === "password" && "Keeping a side-eye on your password!"}
              {blobMood === "happy" && "Credentials verified! Signing in..."}
              {blobMood === "neutral" && "Your zero-knowledge security companion."}
              {blobMood === "hmm" && "Focusing on your login credentials..."}
              {blobMood === "sideEye" && "Keeping a side-eye on your password..."}
              {blobMood === "sad" && "Oops! Double check your credentials."}
            </p>
          </motion.div>

          {/* Separator — desktop only */}
          <div className="hidden lg:block absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1px] h-2/3 bg-gradient-to-b from-transparent via-purple-500/40 to-transparent pointer-events-none z-20" />

          {/* ─── Right: Form ──────────────────────────────────────── */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-md mx-auto lg:mx-0 lg:ml-auto"
          >
            <div className="mb-4 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-950/60 border border-purple-800/40 text-xs text-purple-300">
              <span className="h-1.5 w-1.5 rounded-full bg-purple-400 animate-pulse" />
              Secure Authentication Vault
            </div>

            <h2 className="mb-1 text-2xl font-bold text-white">Sign in</h2>
            <p className="mb-6 text-sm text-purple-200/70">
              Welcome back. Enter your credentials to continue.
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
                  Username or Email
                </label>
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
              <Link
                href="/auth/register"
                className="font-medium text-purple-400 hover:text-purple-300 hover:underline"
              >
                Sign up
              </Link>
            </p>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
