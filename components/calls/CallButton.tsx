"use client";

import { useCallback } from "react";
import { FiPhone } from "react-icons/fi";
import { getSocket } from "@/lib/socket";
import { SOCKET_EVENTS } from "@/constants";
import { useCallStore } from "@/context/stores/call-store";
import { getLocalStream } from "@/lib/webrtc";
import { connectToRoom } from "@/lib/livekit";

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

    const store = useCallStore.getState();
    const isGroup = type === "GROUP";

    // Set initial state — for GROUP, method is LIVEKIT
    store.setActiveCall({
      callId: `temp-${Date.now()}`,
      method: isGroup ? "LIVEKIT" : "WEBRTC",
      peerId: targetUserIds[0] || "",
      peerUsername: peerUsername || "Unknown",
    });
    store.startCall(targetUserIds, type);

    // Emit to server
    (socket as any).emit(
      SOCKET_EVENTS.CALL_INITIATE,
      { targetUserIds, type },
      (response: any) => {
        if (!response?.success) {
          // Check for LiveKit fallback (DM target offline)
          if (response?.fallback === "LIVEKIT") {
            // Server says target offline — request LiveKit fallback
            (socket as any).emit(
              SOCKET_EVENTS.CALL_LIVEKIT_FALLBACK,
              { targetUserIds },
              (fallbackResponse: any) => {
                if (fallbackResponse?.success) {
                  store.setActiveCall({
                    callId: `livekit-${fallbackResponse.roomName}`,
                    method: "LIVEKIT",
                    peerId: targetUserIds[0] || "",
                    peerUsername: peerUsername || "Unknown",
                    roomName: fallbackResponse.roomName,
                    serverUrl: fallbackResponse.serverUrl,
                    token: fallbackResponse.token,
                  });
                  // Connect to LiveKit
                  connectToRoom(fallbackResponse.serverUrl, fallbackResponse.token).catch(
                    (err) => {
                      console.error("[CallButton] LiveKit fallback connect failed:", err);
                      store.hangupCall("error");
                    },
                  );
                } else {
                  store.hangupCall("error");
                }
              },
            );
            return;
          }
          store.hangupCall("error");
          return;
        }

        // GROUP: server returned LiveKit token — connect directly
        if (isGroup && response.method === "LIVEKIT") {
          store.setActiveCall({
            callId: `livekit-${response.roomName}`,
            method: "LIVEKIT",
            peerId: targetUserIds[0] || "",
            peerUsername: peerUsername || "Unknown",
            roomName: response.roomName,
            serverUrl: response.serverUrl,
            token: response.token,
          });
          // Connect to LiveKit room (no ringing phase for group)
          connectToRoom(response.serverUrl, response.token).catch((err) => {
            console.error("[CallButton] LiveKit group connect failed:", err);
            store.hangupCall("error");
          });
          return;
        }

        // DM: WebRTC path — caller shows ringing, wait for CALL_METHOD_SELECTED
      },
    );

    // For DM WebRTC, request camera in background
    if (!isGroup) {
      getLocalStream(true)
        .then((stream) => {
          useCallStore.getState().setLocalStream(stream);
        })
        .catch(() => {
          console.warn("[CallButton] Camera not available, proceeding without video");
        });
    }
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
      title={type === "GROUP" ? "Start group call" : "Start call"}
    >
      <FiPhone className={iconSize} />
    </button>
  );
}
