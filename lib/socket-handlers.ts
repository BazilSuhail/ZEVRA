import type { AppSocket } from './socket';
import { SOCKET_EVENTS, APP, MessageStatus } from '@/constants';
import { useChatStore } from '@/context/stores/chat-store';
import { useSocketStore } from '@/context/stores/socket-store';
import { decryptMessage } from './e2ee';
import { getAccessToken } from '@/utils/api';
import {
  saveMessage,
  incrementRoomUnread,
  type StoredMessage,
} from './db';
import { setupWebRTCSocketHandlers } from './webrtc';
import { setupLiveKitSocketHandlers } from './livekit-handlers';

// ─── Bind Socket Events → Zustand Store ─────────────────────────────────────

export function bindSocketHandlers(socket: AppSocket) {
  const chatStore = useChatStore.getState;
  const socketStore = useSocketStore.getState;

  // ─── Connection Events ────────────────────────────────────────────

  socket.on(SOCKET_EVENTS.CONNECTED, (data) => {
    socketStore().setConnected(true);
    socketStore().setSocketId(data.socketId);
    socketStore().setReconnectAttempts(0);

    socket.emit(SOCKET_EVENTS.GET_UNREAD, (response) => {
      if (response.success && response.counts) {
        chatStore().setUnreadCounts(response.counts);
      }
    });
  });

  socket.on('connect', () => {
    socketStore().setConnected(true);
    socketStore().setStatus('connected');
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
  };
  const onReconnectFailed = () => {
    socketStore().setConnected(false);
    socketStore().setStatus('disconnected');
  };
  socket.io.on('reconnect_attempt', onReconnectAttempt);
  socket.io.on('reconnect', onReconnect);
  socket.io.on('reconnect_failed', onReconnectFailed);
  (socket as any).__managerHandlers = { onReconnectAttempt, onReconnect, onReconnectFailed };

  socket.on(SOCKET_EVENTS.CONNECT_ERROR, (error) => {
    console.error('[Socket] Connection error:', error);
  });

  socket.on(SOCKET_EVENTS.FORCED_DISCONNECT, (data) => {
    console.warn('[Socket] Forced disconnect:', data.reason);
    socketStore().setConnected(false);
    socketStore().setStatus('disconnected');
  });

  // ─── Message Events ──────────────────────────────────────────────

  socket.on(SOCKET_EVENTS.MESSAGE_NEW, async (msg: any) => {
    try {
      const msgId = msg.id || msg.messageId;
      if (!msgId) return; // Skip if no valid ID

      const decrypted = await decryptMessage({
        channelId: msg.channelId,
        senderId: msg.senderId,
        encryptedContent: msg.encryptedContent,
        contentIv: msg.contentIv,
        contentTag: msg.contentTag,
        metadata: msg.metadata,
      });
      const plaintext = decrypted ?? '[Encrypted message]';

      const message: StoredMessage = {
        id: msgId,
        channelId: msg.channelId,
        senderId: msg.senderId,
        ciphertext: msg.encryptedContent,
        iv: msg.contentIv,
        tag: msg.contentTag,
        signature: msg.signature || '',
        sequenceNumber: msg.sequenceNumber,
        senderKeyEpoch: msg.senderKeyEpoch || 0,
        messageType: msg.messageType || 'TEXT',
        metadata: msg.metadata || null,
        isDeleted: msg.isDeleted || false,
        plaintext,
        status: MessageStatus.DELIVERED,
        createdAt: msg.createdAt || new Date().toISOString(),
        updatedAt: msg.updatedAt || new Date().toISOString(),
      };

      await saveMessage(message);
      chatStore().addMessage(message);

      const activeRoomId = chatStore().activeRoomId;
      if (msg.channelId !== activeRoomId) {
        chatStore().incrementUnread(msg.channelId);
        await incrementRoomUnread(msg.channelId);
      }
    } catch (err) {
      console.error('[Socket] Failed to process message:new:', err);
    }
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

