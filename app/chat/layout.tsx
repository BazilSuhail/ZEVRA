"use client";

import Sidebar from "@/components/layout/Sidebar";
import ChatList from "@/components/layout/ChatList";
import { SplashLoader } from "@/components/loaders/SplashLoader";

export default function ChatLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SplashLoader />
      <div className="flex h-screen overflow-hidden bg-[#f5f7f9] text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100">
        <Sidebar />
        <ChatList />
        <main className="flex flex-1">{children}</main>
      </div>
    </>
  );
}
