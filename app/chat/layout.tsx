"use client";

import { useAuth } from "@/context/useAuth";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import Sidebar from "@/components/layout/Sidebar";
import ChatList from "@/components/layout/ChatList";

export default function ChatLayout({ children }: { children: React.ReactNode }) {
  const { isLoggedIn, loadSession } = useAuth();
  const router = useRouter();

  useEffect(() => {
    loadSession();
  }, [loadSession]);

  useEffect(() => {
    if (!isLoggedIn) {
      router.push("/login");
    }
  }, [isLoggedIn, router]);

  if (!isLoggedIn) return null;

  return (
    <div className="flex h-screen flex-1 overflow-hidden">
      <Sidebar />
      <ChatList />
      <div className="flex flex-1 overflow-hidden">{children}</div>
    </div>
  );
}
