"use client";

import Sidebar from "@/components/layout/Sidebar";
import ChatList from "@/components/layout/ChatList";

export default function ChatLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen overflow-hidden bg-[#f5f7f9] text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100">
      <Sidebar />
      <ChatList />
      <main className="flex min-w-0 flex-1">{children}</main>
    </div>
  );
}
