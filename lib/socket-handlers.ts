import type { AppSocket } from './socket';
import { SOCKET_EVENTS, APP } from '@/constants';
import { useChatStore } from '@/context/stores/chat-store';
import { useSocketStore } from '@/context/stores/socket-store';
import { useAuthStore } from '@/context/stores/auth-store';
import { getAccessToken, getRefreshToken, refreshAccessToken } from '@/utils/api';
import { saveMessage, markMessageDeleted } from './db';
import { decodeServerMessage, rawMessageId, type RawServerMessage } from './message-decode';
import { setupWebRTCSocketHandlers } from './webrtc';
import { setupLiveKitSocketHandlers } from './livekit-handlers';

const AUTH_ERROR_CODES = new Set(['TOKEN_EXPIRED', 'INVALID_TOKEN', 'NOT_AUTHENTICATED', 'NO_TOKEN']);

// ─── Bind Socket Events → Zustand Store ─────────────────────────────────────

export function bindSocketHandlers(socket: AppSocket) {
  const chatStore = useChatStore.getState;
  const socketStore = useSocketStore.getState;

  // ─── Connection Events ────────────────────────────────────────────

  socket.on(SOCKET_EVENTS.CONNECTED, (data) => {
    socketStore().setConnected(true);
    socketStore().setSocketId(data.socketId);
    socketStore().setReconnectAttempts(0);
    socketStore().clearConnectionError();

    socket.emit(SOCKET_EVENTS.GET_UNREAD, (response) => {
      if (response.success && response.counts) {
        chatStore().setUnreadCounts(response.counts);
      }
    });
  });

  socket.on('connect', () => {
    socketStore().setConnected(true);
    socketStore().setStatus('connected');
    socketStore().clearConnectionError();
  });

  socket.on('disconnect', () => {
    socketStore().setConnected(false);
    socketStore().setStatus('disconnected');
  });

  // Manager-level reconnect events (fire on every automatic reconnection
  // cycle; `socket.on('reconnect_*')` never fires — those are manager events)
  const onReconnectAttempt = (attempt: number) => {
    socketStore().setStatus('reconnecting');
    socketStore().setReconnectAttempts(attempt);
    // Refresh auth so reconnections after token refresh use the fresh JWT
    const token = getAccessToken();
    if (token) socket.auth = { token };
  };
  const onReconnect = () => {
    socketStore().setConnected(true);
    socketStore().setStatus('connected');
    socketStore().setReconnectAttempts(0);
    socketStore().clearConnectionError();
  };
  const onReconnectFailed = () => {
    socketStore().setConnected(false);
    socketStore().setStatus('disconnected');
    socketStore().setConnectionError(
      'Reconnection failed — the server is unreachable.',
    );
  };
  socket.io.on('reconnect_attempt', onReconnectAttempt);
  socket.io.on('reconnect', onReconnect);
  socket.io.on('reconnect_failed', onReconnectFailed);
  (socket as any).__managerHandlers = { onReconnectAttempt, onReconnect, onReconnectFailed };

  socket.on(SOCKET_EVENTS.CONNECT_ERROR, (error) => {
    // console.warn: console.error would pop Next.js' dev error overlay
    console.warn('[Socket] Connection error:', error);
    const raw = error?.message;
    socketStore().setConnectionError(
      typeof raw === 'string' && raw ? raw : 'Connection failed',
    );
  });

  // Server rejects expired/invalid tokens with an 'error' event and then
  // disconnects (no auto-reconnect). Refresh once; the new access token in
  // the auth store makes the provider open a fresh socket with it.
  (socket as unknown as { on: (ev: string, cb: (e: { code?: string }) => void) => void }).on(
    'error',
    (err) => {
      if (!err?.code || !AUTH_ERROR_CODES.has(err.code) || !getRefreshToken()) return;
      refreshAccessToken().catch(() => {
        socketStore().setConnectionError('Session expired — reconnecting failed');
      });
    },
  );

  // ─── Message Events ──────────────────────────────────────────────

  socket.on(SOCKET_EVENTS.MESSAGE_NEW, async (msg: any) => {
    try {
      const raw = msg as RawServerMessage;
      if (!rawMessageId(raw) || !raw.channelId) return;

      const myId = useAuthStore.getState().user?.id;
      const isActive = raw.channelId === chatStore().activeRoomId;

      // Open conversations decode + persist their own messages; cache the
      // rest so opening that chat later is instant.
      if (!isActive) {
        if (raw.senderId !== myId) chatStore().incrementUnread(raw.channelId);
        const stored = await decodeServerMessage(raw);
        if (stored) await saveMessage(stored);
      }
    } catch {
      // Malformed payload or IndexedDB unavailable — the next history sync recovers
    }
  });

  socket.on(SOCKET_EVENTS.MESSAGE_DELETED, (data) => {
    if (!data?.messageId) return;
    markMessageDeleted(data.messageId).catch(() => {});
  });

  // ─── Typing Events ───────────────────────────────────────────────

  socket.on(SOCKET_EVENTS.TYPING_START_RECV, (data) => {
    chatStore().setTyping(data.channelId, data.userId);
  });

  socket.on(SOCKET_EVENTS.TYPING_STOP_RECV, (data) => {
    chatStore().removeTyping(data.channelId, data.userId);
  });

  // ─── Reaction Events ─────────────────────────────────────────────

  socket.on(SOCKET_EVENTS.REACTION_ADDED, (data) => {
    chatStore().addReaction(data.messageId, {
      emoji: data.emoji,
      userId: data.userId,
      username: data.username,
    });
  });

  socket.on(SOCKET_EVENTS.REACTION_REMOVED, (data) => {
    chatStore().removeReaction(data.messageId, data.userId, data.emoji);
  });

  // ─── User Presence Events ────────────────────────────────────────
  // Global presence events carry no channelId; channel join/leave events
  // (user:joined/left WITH channelId) are room notifications, not presence.

  socket.on(SOCKET_EVENTS.PRESENCE_BULK, (data) => {
    if (Array.isArray(data?.online)) socketStore().setPresenceBulk(data.online);
  });

  socket.on(SOCKET_EVENTS.USER_JOINED, (data) => {
    if (!data.channelId) socketStore().setUserOnline(data.userId);
  });

  socket.on(SOCKET_EVENTS.USER_LEFT, (data) => {
    if (!data.channelId) socketStore().setUserOffline(data.userId);
  });

  // ─── Call Events ─────────────────────────────────────────────────

  setupWebRTCSocketHandlers(socket);
  setupLiveKitSocketHandlers(socket);

  // ─── Heartbeat ───────────────────────────────────────────────────

  socket.on(SOCKET_EVENTS.HEARTBEAT_ACK, () => {});

  // Keep beating across reconnects — only cleared in unbind
  const heartbeatInterval = setInterval(() => {
    if (socket.connected) {
      (socket as any).emit('heartbeat');
    }
  }, APP.HEARTBEAT_INTERVAL_MS);
  (socket as any).__heartbeatInterval = heartbeatInterval;
}

export function unbindSocketHandlers(socket: AppSocket) {
  const managerHandlers = (socket as any).__managerHandlers;
  if (managerHandlers) {
    socket.io.off('reconnect_attempt', managerHandlers.onReconnectAttempt);
    socket.io.off('reconnect', managerHandlers.onReconnect);
    socket.io.off('reconnect_failed', managerHandlers.onReconnectFailed);
    (socket as any).__managerHandlers = null;
  }

  const heartbeatInterval = (socket as any).__heartbeatInterval;
  if (heartbeatInterval) {
    clearInterval(heartbeatInterval);
    (socket as any).__heartbeatInterval = null;
  }

  socket.removeAllListeners();
}

