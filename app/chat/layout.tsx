"use client";

import ChatShell from "@/components/layout/ChatShell";

export default function ChatLayout({ children }: { children: React.ReactNode }) {
  return <ChatShell>{children}</ChatShell>;
}
