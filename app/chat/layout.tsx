"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuthStore } from "@/context/stores";
import Sidebar from "@/components/layout/Sidebar";
import ChatList from "@/components/layout/ChatList";
import { SplashLoader } from "@/components/loaders/SplashLoader";

export default function ChatLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const tokenValidated = useAuthStore((s) => s.tokenValidated);

  const isChatRoot = pathname === "/chat";

  useEffect(() => {
    if (tokenValidated && !isAuthenticated) {
      router.replace("/auth/login");
    }
  }, [tokenValidated, isAuthenticated, router]);

  if (!tokenValidated) {
    return (
      <div className="flex h-screen items-center justify-center bg-bg-primary">
        <SplashLoader />
      </div>
    );
  }

  if (!isAuthenticated) return null;

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <div className={`${isChatRoot ? "flex" : "hidden md:flex"} w-full md:w-auto shrink-0`}>
        <ChatList />
      </div>
      <div className={`${isChatRoot ? "hidden md:flex" : "flex"} min-w-0 flex-1 flex-col`}>
        {children}
      </div>
    </div>
  );
}
