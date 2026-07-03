import { io, Socket } from 'socket.io-client';
import { API_URL, APP, SOCKET_EVENTS } from '@/constants';
import { getAccessToken } from '@/utils/api';

// ─── Types ──────────────────────────────────────────────────────────────────

export interface SocketUser {
  userId: string;
  username: string;
  socketId: string;
}

export interface ServerToClientEvents {
  [SOCKET_EVENTS.CONNECTED]: (data: SocketUser) => void;
  [SOCKET_EVENTS.CONNECT_ERROR]: (error: { code: string; message: string }) => void;
  [SOCKET_EVENTS.FORCED_DISCONNECT]: (data: { reason: string }) => void;
  [SOCKET_EVENTS.USER_MESSAGE]: (message: unknown) => void;
  [SOCKET_EVENTS.USER_JOINED]: (data: {
    userId: string;
    username: string;
    channelId: string;
  }) => void;
  [SOCKET_EVENTS.USER_LEFT]: (data: {
    userId: string;
    username: string;
    channelId: string;
  }) => void;
  [SOCKET_EVENTS.MESSAGE_NEW]: (message: unknown) => void;
  [SOCKET_EVENTS.TYPING_START_RECV]: (data: {
    userId: string;
    username: string;
    channelId: string;
  }) => void;
  [SOCKET_EVENTS.TYPING_STOP_RECV]: (data: {
    userId: string;
    channelId: string;
  }) => void;
  [SOCKET_EVENTS.REACTION_ADDED]: (data: {
    userId: string;
    username: string;
    messageId: string;
    emoji: string;
    channelId: string;
  }) => void;
  [SOCKET_EVENTS.REACTION_REMOVED]: (data: {
    userId: string;
    messageId: string;
    emoji: string;
    channelId: string;
  }) => void;
  [SOCKET_EVENTS.HEARTBEAT_ACK]: (data: { timestamp: number }) => void;
}

export interface ClientToServerEvents {
  [SOCKET_EVENTS.SEND_MESSAGE]: (
    data: {
      channelId: string;
      encryptedContent: string;
      contentIv: string;
      contentTag: string;
      signature: string;
      sequenceNumber: number;
      senderKeyEpoch: number;
      messageType?: string;
      metadata?: Record<string, unknown>;
    },
    callback: (response: { success: boolean; message?: unknown; error?: string }) => void,
  ) => void;
  [SOCKET_EVENTS.GET_MESSAGES]: (
    data: { channelId: string; limit?: number; cursor?: string },
    callback: (response: {
      success: boolean;
      messages?: unknown[];
      nextCursor?: string | null;
      hasMore?: boolean;
      error?: string;
    }) => void,
  ) => void;
  [SOCKET_EVENTS.MARK_READ]: (
    data: { channelId: string; messageId: string },
    callback: (response: { success: boolean; advanced?: boolean }) => void,
  ) => void;
  [SOCKET_EVENTS.GET_UNREAD]: (
    callback: (response: { success: boolean; counts?: Record<string, number> }) => void,
  ) => void;
  [SOCKET_EVENTS.GET_PENDING]: (
    callback: (response: { success: boolean; count?: number; messages?: unknown[] }) => void,
  ) => void;
  [SOCKET_EVENTS.REACTION_ADD]: (
    data: { channelId: string; messageId: string; emoji: string },
    callback: (response: { success: boolean; action?: string }) => void,
  ) => void;
  [SOCKET_EVENTS.REACTION_REMOVE]: (
    data: { channelId: string; messageId: string; emoji: string },
    callback: (response: { success: boolean; action?: string }) => void,
  ) => void;
  [SOCKET_EVENTS.CREATE_OR_JOIN]: (
    data: { participantIds: string[]; type: string; name?: string },
    callback: (response: {
      success: boolean;
      channelId?: string;
      created?: boolean;
      error?: string;
    }) => void,
  ) => void;
  [SOCKET_EVENTS.JOIN_CHANNEL]: (
    data: { channelId: string },
    callback: (response: { success: boolean; error?: string }) => void,
  ) => void;
  [SOCKET_EVENTS.LEAVE_CHANNEL]: (
    data: { channelId: string },
    callback: (response: { success: boolean }) => void,
  ) => void;
  [SOCKET_EVENTS.TYPING_START]: (data: { channelId: string }) => void;
  [SOCKET_EVENTS.TYPING_STOP]: (data: { channelId: string }) => void;
}

export type AppSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

// ─── Singleton ──────────────────────────────────────────────────────────────

let socket: AppSocket | null = null;

export function getSocket(): AppSocket | null {
  return socket;
}

export function connectSocket(token: string): AppSocket {
  if (socket?.connected) return socket;

  if (socket) {
    socket.removeAllListeners();
    socket.disconnect();
  }

  socket = io(API_URL, {
    auth: { token },
    transports: ['websocket'],
    reconnection: true,
    reconnectionAttempts: APP.RECONNECTION_ATTEMPTS,
    reconnectionDelay: APP.RECONNECTION_DELAY,
    reconnectionDelayMax: 10000,
    timeout: 20000,
  }) as AppSocket;

  return socket;
}

export function disconnectSocket() {
  if (socket) {
    socket.removeAllListeners();
    socket.disconnect();
    socket = null;
  }
}

// ─── Connection State Helpers ───────────────────────────────────────────────

export function isConnected(): boolean {
  return socket?.connected ?? false;
}

export function waitForConnection(timeoutMs = 5000): Promise<void> {
  return new Promise((resolve, reject) => {
    if (socket?.connected) {
      resolve();
      return;
    }

    const timer = setTimeout(() => {
      reject(new Error('Socket connection timed out'));
    }, timeoutMs);

    socket?.on('connect', () => {
      clearTimeout(timer);
      resolve();
    });

    socket?.on('connect_error', (err) => {
      clearTimeout(timer);
      reject(err);
    });
  });
}
