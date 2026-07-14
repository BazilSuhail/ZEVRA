import type { AppSocket } from "./socket";
import { SOCKET_EVENTS } from "@/constants";
import { useCallStore } from "@/context/stores/call-store";
import { connectToRoom, isRoomConnected } from "./livekit";

// ─── LiveKit Socket Handlers ───────────────────────────────────────────────

export function setupLiveKitSocketHandlers(socket: AppSocket) {
  const store = useCallStore.getState;

  // ─── Group Invite (someone started a group call) ────────────────

  socket.on(
    SOCKET_EVENTS.LIVEKIT_GROUP_INVITE,
    (data: {
      callId: string;
      roomName: string;
      serverUrl: string;
      token: string;
      inviterUsername: string;
    }) => {
      store().setIncomingCall({
        callId: data.callId || `livekit-${data.roomName}`,
        callerId: data.callId,
        callerUsername: data.inviterUsername,
        method: "LIVEKIT",
        roomName: data.roomName,
        serverUrl: data.serverUrl,
        token: data.token,
      });
    },
  );

  // ─── Incoming DM via LiveKit (fallback when target was offline) ─

  socket.on(
    SOCKET_EVENTS.LIVEKIT_INCOMING,
    (data: {
      callId: string;
      roomName: string;
      serverUrl: string;
      token: string;
      callerUsername: string;
    }) => {
      store().setIncomingCall({
        callId: data.callId || `livekit-${data.roomName}`,
        callerId: data.callId,
        callerUsername: data.callerUsername,
        method: "LIVEKIT",
        roomName: data.roomName,
        serverUrl: data.serverUrl,
        token: data.token,
      });
    },
  );

  // ─── Token request (reconnection scenario) ──────────────────────

  socket.on(
    SOCKET_EVENTS.LIVEKIT_TOKEN_REQUEST,
    (data: {
      callId: string;
      roomName: string;
      serverUrl: string;
      token: string;
    }) => {
      const activeCall = store().activeCall;
      if (activeCall) {
        store().setActiveCall({
          ...activeCall,
          serverUrl: data.serverUrl,
          token: data.token,
        });
      }

      // If room is disconnected, reconnect with the fresh token
      if (!isRoomConnected()) {
        connectToRoom(data.serverUrl, data.token).catch(() => {});
      }
    },
  );
}
