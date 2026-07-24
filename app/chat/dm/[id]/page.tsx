"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  FiArrowLeft,
  FiLock,
  FiMoreHorizontal,
  FiShield,
  FiLoader,
  FiAlertCircle,
} from "react-icons/fi";
import { useChatStore } from "@/context/stores/chat-store";
import { useSocketStore } from "@/context/stores/socket-store";
import { getSocket } from "@/lib/socket";
import { SOCKET_EVENTS } from "@/constants";
import type { FileContent } from "@/lib/message-content";
import MediaViewer from "@/components/chat/MediaViewer";
import CallButton from "@/components/calls/CallButton";
import ChatBackdrop from "@/components/chat/ChatBackdrop";
import Composer from "@/components/chat/Composer";
import KeysLockedBanner from "@/components/chat/KeysLockedBanner";
import MessageItem from "@/components/chat/MessageItem";
import { useConversation } from "@/components/chat/use-conversation";

// Keyed by the route param so every piece of state resets on navigation
export default function DMChatPage() {
  const { id } = useParams<{ id: string }>();
  return <DMConversation key={id} channelId={id} />;
}

function DMConversation({ channelId }: { channelId: string }) {
  const {
    me,
    channel,
    messages,
    loading,
    syncing,
    loadingOlder,
    error,
    setError,
    removed,
    containerRef,
    endRef,
    handleScroll,
    handleTyping,
    send,
    retrySend,
    discardFailed,
    toggleReaction,
  } = useConversation(channelId);

  const typingUsers = useChatStore((s) => s.typingUsers);
  const reactionsByMessage = useChatStore((s) => s.reactionsByMessage);
  const isConnected = useSocketStore((s) => s.isConnected);
  const onlineUsers = useSocketStore((s) => s.onlineUsers);

  const [reactingTo, setReactingTo] = useState<string | null>(null);
  const [viewer, setViewer] = useState<FileContent | null>(null);

  const typingNames = Array.from(typingUsers[channelId] || []).filter((uid) => uid !== me?.id);

  // ─── Presence: track if peer is online (shared socket store) ─────────
  const otherMember = channel?.members?.find((m) => m.id !== me?.id);
  const isOnline = !!onlineUsers[otherMember?.id || ""];

  useEffect(() => {
    if (!isConnected || !otherMember?.id) return;
    // Explicit request covers peers unknown at connect-time (new DMs)
    getSocket()?.emit(
      SOCKET_EVENTS.PRESENCE_BULK,
      { userIds: [otherMember.id] },
      (res: { online: string[] }) => {
        if (res?.online) useSocketStore.getState().setUsersOnline(res.online);
      },
    );
  }, [isConnected, otherMember?.id]);

  // ─── Derived ─────────────────────────────────────────────────────────
  const displayName = channel?.name || otherMember?.username || "Unknown";
  const initials = displayName
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  // ─── Render ──────────────────────────────────────────────────────────
  return (
    <div className="relative flex h-full min-h-0 min-w-0 flex-1 flex-col bg-[#fbfcfd] dark:bg-zinc-950">
      <ChatBackdrop />
      {/* Header */}
      <header className="relative z-10 flex items-center justify-between border-b border-zinc-200 bg-white px-4 py-4 dark:border-zinc-800 dark:bg-zinc-900 sm:px-7">
        <div className="flex items-center gap-3">
          <Link
            href="/chat"
            className="rounded-lg p-2 text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
          >
            <FiArrowLeft />
          </Link>
          <Link href={`/chat/dm/${channelId}/info`} className="flex items-center gap-3">
            <div className="relative flex h-10 w-10 items-center justify-center rounded-full bg-amber-100 text-sm font-bold text-amber-700">
              {initials}
              <span
                className={`absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-white dark:border-zinc-900 ${isOnline ? "bg-emerald-500" : "bg-zinc-400"}`}
              />
            </div>
            <div>
              <h2 className="text-sm font-bold">{displayName}</h2>
              <p className="text-xs text-zinc-500">
                {loading ? "Loading..." : isOnline ? "Online" : "Offline"}
              </p>
            </div>
          </Link>
        </div>
        <div className="flex items-center gap-2">
          {syncing && <FiLoader className="h-4 w-4 animate-spin text-zinc-400" />}
          <span className="hidden items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1.5 text-[11px] font-semibold text-emerald-700 sm:flex dark:bg-emerald-950/40 dark:text-emerald-400">
            <FiShield /> end-to-end encrypted
          </span>
          {otherMember && (
            <CallButton
              targetUserIds={[otherMember.id]}
              type="DM"
              channelId={channelId}
              peerUsername={otherMember.username}
            />
          )}
          <Link
            href={`/chat/dm/${channelId}/info`}
            aria-label="Conversation details"
            className="rounded-lg p-2 text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
          >
            <FiMoreHorizontal />
          </Link>
        </div>
      </header>

      <KeysLockedBanner />

      {/* Error banner */}
      {error && (
        <div className="relative z-10 mx-4 mt-3 flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400">
          <FiAlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      {/* Messages */}
      <div
        ref={containerRef}
        onScroll={handleScroll}
        className="relative z-10 flex-1 overflow-y-auto px-4 py-6 sm:px-10 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        <div>
          {/* Loading skeleton */}
          {loading && messages.length === 0 && (
            <div className="space-y-5 py-6">
              {[1, 2, 3, 4, 5].map((i) => {
                const isMine = i % 2 === 0;
                return (
                  <div key={i} className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
                    <div className={`flex items-end gap-2 ${isMine ? "flex-row-reverse" : ""}`}>
                      {!isMine && (
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-zinc-200 dark:bg-zinc-700">
                          <span className="h-3 w-3 animate-pulse rounded bg-zinc-300 dark:bg-zinc-600" />
                        </div>
                      )}
                      <div>
                        <div className={`h-3 w-12 animate-pulse rounded bg-zinc-200 dark:bg-zinc-700 ${isMine ? "ml-auto mb-1" : "mb-1"}`} />
                        <div
                          className={`h-10 animate-pulse rounded-2xl ${isMine ? "rounded-br-sm bg-indigo-200 dark:bg-indigo-800" : "rounded-bl-sm bg-zinc-200 dark:bg-zinc-700"}`}
                          style={{ width: `${70 + i * 25}px` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Empty state */}
          {!loading && messages.length === 0 && (
            <div className="py-12 text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-indigo-100 dark:bg-indigo-900/30">
                <FiLock className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
              </div>
              <p className="text-sm font-semibold">No messages yet</p>
              <p className="mt-1 text-xs text-zinc-400">Send the first encrypted message</p>
            </div>
          )}

          {/* Load more indicator */}
          {loadingOlder && (
            <div className="flex justify-center py-4">
              <FiLoader className="h-4 w-4 animate-spin text-zinc-400" />
            </div>
          )}

          {/* Message list */}
          {messages.map((msg) => (
            <MessageItem
              key={msg.id}
              msg={msg}
              isMine={msg.senderId === me?.id}
              meId={me?.id}
              reactions={reactionsByMessage[msg.id]}
              pickerOpen={reactingTo === msg.id}
              onPickerOpenChange={(open) => setReactingTo(open ? msg.id : null)}
              onToggleReaction={toggleReaction}
              onRetry={retrySend}
              onDiscard={discardFailed}
              onOpenFile={setViewer}
            />
          ))}

          {/* Typing indicator */}
          {typingNames.length > 0 && (
            <div className="mb-3 flex items-center gap-2 text-xs text-zinc-400">
              <span className="flex gap-0.5">
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-indigo-400 [animation-delay:0ms]" />
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-indigo-400 [animation-delay:150ms]" />
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-indigo-400 [animation-delay:300ms]" />
              </span>
              typing...
            </div>
          )}

          <div ref={endRef} />
        </div>
      </div>

      <Composer
        placeholder="Write a message..."
        disabled={removed}
        onTyping={handleTyping}
        onError={setError}
        onSend={send}
      />

      {viewer && (
        <MediaViewer file={viewer.file} caption={viewer.caption} onClose={() => setViewer(null)} />
      )}
    </div>
  );
}
