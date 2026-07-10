"use client";

import { useCallback } from "react";
import { FiPhone } from "react-icons/fi";
import { getSocket } from "@/lib/socket";
import { SOCKET_EVENTS } from "@/constants";
import { useCallStore } from "@/context/stores/call-store";
import { getLocalStream } from "@/lib/webrtc";

interface CallButtonProps {
  targetUserIds: string[];
  type: "DM" | "GROUP";
  peerUsername?: string;
  size?: "sm" | "md";
  className?: string;
}

export default function CallButton({
  targetUserIds,
  type,
  peerUsername,
  size = "md",
  className,
}: CallButtonProps) {
  const { callStatus } = useCallStore();

  const handleCall = useCallback(() => {
    const socket = getSocket();
    if (!socket || !socket.connected) return;
    if (callStatus !== "idle") return;

    // Set ALL state FIRST (synchronously) so the outgoing modal renders immediately
    const store = useCallStore.getState();
    store.setActiveCall({
      callId: `temp-${Date.now()}`,
      method: "WEBRTC",
      peerId: targetUserIds[0] || "",
      peerUsername: peerUsername || "Unknown",
    });
    store.startCall(targetUserIds, type);

    // Emit to server
    socket.emit(SOCKET_EVENTS.CALL_INITIATE, {
      targetUserIds,
      type,
    });

    // Request camera in background (non-blocking) — modal shows immediately
    getLocalStream(true)
      .then((stream) => {
        useCallStore.getState().setLocalStream(stream);
      })
      .catch(() => {
        console.warn("[CallButton] Camera not available, proceeding without video");
      });
  }, [targetUserIds, type, peerUsername, callStatus]);

  const sizeClasses =
    size === "sm"
      ? "rounded-lg p-2 text-zinc-400 hover:bg-purple-100 hover:text-purple-600 dark:hover:bg-purple-900/30 dark:hover:text-purple-400"
      : "rounded-lg p-2 text-zinc-400 hover:bg-purple-100 hover:text-purple-600 dark:hover:bg-purple-900/30 dark:hover:text-purple-400";

  const iconSize = size === "sm" ? "h-4 w-4" : "h-[18px] w-[18px]";

  return (
    <button
      onClick={handleCall}
      disabled={callStatus !== "idle"}
      className={`${sizeClasses} disabled:opacity-40 ${className ?? ""}`}
      title="Start call"
    >
      <FiPhone className={iconSize} />
    </button>
  );
}
