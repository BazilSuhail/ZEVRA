"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/context/stores";
import Sidebar from "@/components/layout/Sidebar";
import ChatList from "@/components/layout/ChatList";
import { SplashLoader } from "@/components/loaders/SplashLoader";

export default function ChatShell({ children }: { children: React.ReactNode }) {
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
      {children}
    </div>
  );
}
