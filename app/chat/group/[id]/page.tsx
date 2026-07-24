"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  FiArrowLeft,
  FiMoreHorizontal,
  FiPhone,
  FiShield,
  FiLoader,
  FiAlertCircle,
  FiUsers,
} from "react-icons/fi";
import { useChatStore } from "@/context/stores/chat-store";
import { useSocketStore } from "@/context/stores/socket-store";
import { useCallStore } from "@/context/stores/call-store";
import { getSocket } from "@/lib/socket";
import { connectToRoom } from "@/lib/livekit";
import { SOCKET_EVENTS } from "@/constants";
import type { FileContent } from "@/lib/message-content";
import MediaViewer from "@/components/chat/MediaViewer";
import CallButton from "@/components/calls/CallButton";
import ChatBackdrop from "@/components/chat/ChatBackdrop";
import Composer from "@/components/chat/Composer";
import KeysLockedBanner from "@/components/chat/KeysLockedBanner";
import MessageItem from "@/components/chat/MessageItem";
import { useConversation } from "@/components/chat/use-conversation";

const MEMBER_COLORS = [
  "bg-rose-500", "bg-amber-500", "bg-emerald-500", "bg-cyan-500",
  "bg-violet-500", "bg-pink-500", "bg-teal-500", "bg-orange-500",
];

// Keyed by the route param so every piece of state resets on navigation
export default function GroupChatPage() {
  const { id } = useParams<{ id: string }>();
  return <GroupConversation key={id} channelId={id} />;
}

function GroupConversation({ channelId }: { channelId: string }) {
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

  const [reactingTo, setReactingTo] = useState<string | null>(null);
  const [viewer, setViewer] = useState<FileContent | null>(null);

  const typingNames = Array.from(typingUsers[channelId] || []).filter((uid) => uid !== me?.id);

  const memberMap = useMemo(() => {
    const map = new Map<string, { username: string; color: string }>();
    channel?.members?.forEach((m, i) => {
      map.set(m.id, { username: m.username, color: MEMBER_COLORS[i % MEMBER_COLORS.length] });
    });
    return map;
  }, [channel?.members]);

  // ─── Ongoing group call: detect + join ───────────────────────────────
  const callStatus = useCallStore((s) => s.callStatus);
  const [groupCall, setGroupCall] = useState<{ active: boolean; count: number }>({
    active: false,
    count: 0,
  });

  const checkGroupCall = useCallback(() => {
    const s = getSocket();
    if (!s || !s.connected) return;
    s.emit(SOCKET_EVENTS.CALL_LIVEKIT_ACTIVE, { channelId }, (res) => {
      if (res?.success) {
        setGroupCall({ active: !!res.active, count: res.participantCount ?? 0 });
      } else {
        setGroupCall((prev) => (prev.active ? { active: false, count: 0 } : prev));
      }
    });
  }, [channelId]);

  useEffect(() => {
    if (!isConnected) return;
    checkGroupCall();
    const interval = setInterval(checkGroupCall, 15_000);
    return () => clearInterval(interval);
  }, [isConnected, checkGroupCall]);

  // Someone invites us to this group's call → it's active now
  const generation = useSocketStore((s) => s.generation);
  useEffect(() => {
    const s = getSocket();
    if (!s) return;
    const onInvite = (data: { roomName: string }) => {
      if (data?.roomName === `group-${channelId}`) {
        setGroupCall((prev) => ({ active: true, count: Math.max(prev.count, 1) }));
      }
    };
    s.on(SOCKET_EVENTS.LIVEKIT_GROUP_INVITE, onInvite);
    return () => {
      s.off(SOCKET_EVENTS.LIVEKIT_GROUP_INVITE, onInvite);
    };
  }, [channelId, generation]);

  const joinGroupCall = useCallback(() => {
    const s = getSocket();
    if (!s || !s.connected) return;
    if (useCallStore.getState().callStatus !== "idle") return;

    const roomName = `group-${channelId}`;
    s.emit(SOCKET_EVENTS.CALL_LIVEKIT_JOIN_GROUP, { roomName }, async (res) => {
      if (!res?.success || !res.roomName || !res.serverUrl || !res.token) {
        setError(
          res?.error === "NOT_MEMBER" ? "You're not a member of this call" : "Failed to join the call",
        );
        checkGroupCall();
        return;
      }
      const store = useCallStore.getState();
      store.setActiveCall({
        callId: `livekit-${res.roomName}`,
        method: "LIVEKIT",
        peerId: "",
        peerUsername: channel?.name || "Group call",
        roomName: res.roomName,
        serverUrl: res.serverUrl,
        token: res.token,
      });
      try {
        await connectToRoom(res.serverUrl, res.token);
      } catch {
        store.hangupCall("error");
        setError("Failed to join the call");
      }
    });
  }, [channelId, channel?.name, checkGroupCall, setError]);

  // ─── Derived ─────────────────────────────────────────────────────────
  const displayName = channel?.name || "Unknown Group";
  const memberCount = channel?.members?.length ?? channel?.memberCount;

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
          <Link href={`/chat/group/${channelId}/info`} className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400">
              <FiUsers className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold">{displayName}</h2>
              <p className="text-xs text-zinc-500">
                {loading ? "Loading..." : memberCount ? `${memberCount} members` : "Group"}
              </p>
            </div>
          </Link>
        </div>
        <div className="flex items-center gap-2">
          {syncing && <FiLoader className="h-4 w-4 animate-spin text-zinc-400" />}
          <span className="hidden items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1.5 text-[11px] font-semibold text-emerald-700 sm:flex dark:bg-emerald-950/40 dark:text-emerald-400">
            <FiShield /> end-to-end encrypted
          </span>
          {channel?.members && !removed && (
            <CallButton
              targetUserIds={channel.members.filter((m) => m.id !== me?.id).map((m) => m.id)}
              type="GROUP"
              channelId={channelId}
              peerUsername={channel.name || "Group"}
            />
          )}
          <Link
            href={`/chat/group/${channelId}/info`}
            aria-label="Group details"
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

      {/* Ongoing group call banner */}
      {groupCall.active && callStatus === "idle" && !removed && (
        <div className="relative z-10 mx-4 mt-3 flex items-center justify-between gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 dark:border-emerald-800/60 dark:bg-emerald-950/40">
          <div className="flex items-center gap-2 text-sm text-emerald-700 dark:text-emerald-300">
            <span className="relative flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
            </span>
            <span className="font-semibold">
              Ongoing call{groupCall.count > 0 ? ` · ${groupCall.count} in call` : ""}
            </span>
          </div>
          <button
            onClick={joinGroupCall}
            className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white transition hover:bg-emerald-700"
          >
            <FiPhone className="h-3.5 w-3.5" />
            Join
          </button>
        </div>
      )}

      {/* Messages */}
      <div
        ref={containerRef}
        onScroll={handleScroll}
        className="relative z-10 flex-1 overflow-y-auto px-4 py-6 sm:px-10 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        <div>
          {/* Group welcome */}
          {!loading && messages.length === 0 && (
            <div className="py-12 text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-indigo-100 dark:bg-indigo-900/30">
                <FiUsers className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
              </div>
              <p className="text-sm font-semibold">Welcome to {displayName}</p>
              <p className="mt-1 text-xs text-zinc-400">
                This is the start of your encrypted group conversation
              </p>
            </div>
          )}

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
                        <div className={`mb-1 flex items-center gap-1.5 ${isMine ? "justify-end" : ""}`}>
                          <div className="h-2 w-14 animate-pulse rounded bg-zinc-200 dark:bg-zinc-700" />
                          <div className="h-2 w-8 animate-pulse rounded bg-zinc-200/50 dark:bg-zinc-700/50" />
                        </div>
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

          {/* Load more indicator */}
          {loadingOlder && (
            <div className="flex justify-center py-4">
              <FiLoader className="h-4 w-4 animate-spin text-zinc-400" />
            </div>
          )}

          {/* Message list */}
          {messages.map((msg) => {
            const isMine = msg.senderId === me?.id;
            const member = memberMap.get(msg.senderId);
            const sender = isMine
              ? null
              : {
                  name: member?.username || msg.senderUsername || msg.senderId.slice(0, 8),
                  color: member?.color || "bg-zinc-400",
                };
            return (
              <MessageItem
                key={msg.id}
                msg={msg}
                isMine={isMine}
                meId={me?.id}
                sender={sender}
                reactions={reactionsByMessage[msg.id]}
                pickerOpen={reactingTo === msg.id}
                onPickerOpenChange={(open) => setReactingTo(open ? msg.id : null)}
                onToggleReaction={toggleReaction}
                onRetry={retrySend}
                onDiscard={discardFailed}
                onOpenFile={setViewer}
              />
            );
          })}

          {/* Typing indicator */}
          {typingNames.length > 0 && (
            <div className="mb-3 flex items-center gap-2 text-xs text-zinc-400">
              <span className="flex gap-0.5">
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-indigo-400 [animation-delay:0ms]" />
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-indigo-400 [animation-delay:150ms]" />
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-indigo-400 [animation-delay:300ms]" />
              </span>
              {typingNames.length === 1
                ? `${memberMap.get(typingNames[0])?.username || "someone"} is typing...`
                : "several people typing..."}
            </div>
          )}

          <div ref={endRef} />
        </div>
      </div>

      <Composer
        placeholder="Write a message to the group..."
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
