"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/context/stores";
import Sidebar from "@/components/layout/Sidebar";
import ChatList from "@/components/layout/ChatList";
import { SplashLoader } from "@/components/loaders/SplashLoader";

export default function ChatLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const isLoading = useAuthStore((s) => s.isLoading);
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
    <>
      <head>
        <title>Zevra Chat | Encrypted Messaging</title>
        <meta name="description" content="Your encrypted Zevra chat workspace. End-to-end encrypted messages and video calls." />
        <meta name="robots" content="noindex, nofollow" />
        <meta property="og:title" content="Zevra Chat" />
        <meta property="og:description" content="Encrypted messaging workspace" />
      </head>
      <div className="flex h-screen overflow-hidden bg-[#f5f7f9] text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100">
        <Sidebar />
        <ChatList />
        <main className="flex flex-1">{children}</main>
      </div>
    </>
  );
}
