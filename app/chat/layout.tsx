"use client";

import { useAuth } from "@/context/useAuth";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useCallback } from "react";
import Sidebar from "@/components/layout/Sidebar";
import ChatList from "@/components/layout/ChatList";
import { useWatermark } from "@/utils/watermark";
import { trackPresence, ensureReconnectListener, onReconnect } from "@/utils/supabase";
import { api } from "@/utils/api";
import { useMessages } from "@/context/stores/messagesStore";

export default function ChatLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoggedIn, loadSession } = useAuth();
  const router = useRouter();
  const bootstrapped = useRef(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  // ─── Bootstrap auth ────────────────────────────────────────────────────
  useEffect(() => {
    if (isLoggedIn && user) return;
    if (bootstrapped.current) return;
    bootstrapped.current = true;
    loadSession();
  }, [isLoggedIn, user, loadSession]);

  useEffect(() => {
    if (mounted && !isLoggedIn) router.push("/auth/login");
  }, [isLoggedIn, router, mounted]);

  // ─── Track presence via Supabase ───────────────────────────────────────
  useEffect(() => {
    if (!user) return;
    const channel = trackPresence(user.id, user.username);
    return () => { channel.untrack(); };
  }, [user]);

  // ─── Periodic watermark sync ───────────────────────────────────────────
  useEffect(() => {
    if (!isLoggedIn) return;
    const interval = setInterval(() => {
      useWatermark.getState().syncAll();
    }, 30_000);
    return () => clearInterval(interval);
  }, [isLoggedIn]);

  // ─── Reconnect recovery ────────────────────────────────────────────────
  // When Supabase Realtime reconnects, refetch messages for any open channel
  // to fill gaps that occurred during the disconnect.
  useEffect(() => {
    if (!isLoggedIn) return;

    ensureReconnectListener();

    onReconnect(() => {
      // Refetch messages for all channels that have messages loaded
      const state = useMessages.getState();
      for (const channelId of Object.keys(state.messages)) {
        if (state.messages[channelId].length === 0) continue;
        const oldest = state.messages[channelId][state.messages[channelId].length - 1];
        api
          .get<{ messages: any[] }>(`/messages/channel/${channelId}?limit=50&cursor=${encodeURIComponent(oldest.createdAt)}`)
          .then((data) => {
            if (data.messages?.length) {
              state.loadMessages(channelId, data.messages);
            }
          })
          .catch(() => {});
      }
    });
  }, [isLoggedIn]);

  if (!mounted || !isLoggedIn) return null;

  return (
    <div className="flex h-screen flex-1 overflow-hidden">
      <Sidebar />
      <ChatList />
      <div className="flex flex-1 overflow-hidden">{children}</div>
    </div>
  );
}