"use client";

import { useCallback } from "react";
import { FiPhone } from "react-icons/fi";
import { getSocket } from "@/lib/socket";
import { SOCKET_EVENTS } from "@/constants";
import { useCallStore } from "@/context/stores/call-store";

interface CallButtonProps {
  targetUserIds: string[];
  type: "DM" | "GROUP";
  size?: "sm" | "md";
  className?: string;
}

export default function CallButton({
  targetUserIds,
  type,
  size = "md",
  className,
}: CallButtonProps) {
  const { callStatus } = useCallStore();

  const handleCall = useCallback(() => {
    const socket = getSocket();
    if (!socket || !socket.connected) return;
    if (callStatus !== "idle") return;

    socket.emit(SOCKET_EVENTS.CALL_INITIATE, {
      targetUserIds,
      type,
    });

    useCallStore.getState().startCall(targetUserIds, type);
  }, [targetUserIds, type, callStatus]);

  const sizeClasses =
    size === "sm"
      ? "rounded-lg p-2 text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
      : "rounded-lg p-2 text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800";

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
