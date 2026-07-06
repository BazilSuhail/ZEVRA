"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { FiArrowRight, FiLock, FiShield } from "react-icons/fi";
import { useAuthStore } from "@/context/stores";
import Sidebar from "@/components/layout/Sidebar";
import ChatList from "@/components/layout/ChatList";
import { SplashLoader } from "@/components/loaders/SplashLoader";

export default function ChatPage() {
  const router = useRouter();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const tokenValidated = useAuthStore((s) => s.tokenValidated);

  useEffect(() => {
    if (tokenValidated && !isAuthenticated) {
      router.replace("/auth/login");
    }
  }, [tokenValidated, isAuthenticated, router]);

  if (!tokenValidated) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#f5f7f9] dark:bg-zinc-950">
        <SplashLoader />
      </div>
    );
  }

  if (!isAuthenticated) return null;

  return (
    <div className="flex h-screen overflow-hidden bg-[#f5f7f9] text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100">
      <Sidebar />
      <ChatList />
      <main className="flex flex-1 items-center justify-center bg-[#fbfcfd] dark:bg-zinc-950">
        <div className="mx-auto max-w-lg space-y-6 px-6 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-100 dark:bg-indigo-900/30">
            <FiLock className="h-8 w-8 text-indigo-600 dark:text-indigo-400" />
          </div>
          <h1 className="text-2xl font-bold">Welcome to Zevra Chat</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Select a conversation from the sidebar or start a new one.
          </p>
          <div className="flex items-center justify-center gap-2 text-xs text-emerald-600 dark:text-emerald-400">
            <FiShield className="h-3.5 w-3.5" />
            End-to-end encrypted
          </div>
          <Link
            href="/about"
            className="inline-flex items-center gap-2 rounded-full bg-indigo-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 transition-colors"
          >
            Learn More <FiArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </main>
    </div>
  );
}
