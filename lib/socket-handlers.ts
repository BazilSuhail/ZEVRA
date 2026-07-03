import type { AppSocket } from './socket';
import { SOCKET_EVENTS, APP, MessageStatus } from '@/constants';
import { useChatStore } from '@/context/stores/chat-store';
import { useSocketStore } from '@/context/stores/socket-store';
import { getChatKey, decrypt } from './crypto';
import {
  saveMessage,
  incrementRoomUnread,
  type StoredMessage,
} from './db';

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

  // Reserved events — use onAny for reconnect events
  socket.onAny((event: string, ...args: unknown[]) => {
    if (event === 'reconnect_attempt') {
      socketStore().setStatus('reconnecting');
      socketStore().setReconnectAttempts(args[0] as number);
    } else if (event === 'reconnect') {
      socketStore().setConnected(true);
      socketStore().setStatus('connected');
      socketStore().setReconnectAttempts(0);
    } else if (event === 'reconnect_failed') {
      socketStore().setConnected(false);
      socketStore().setStatus('disconnected');
    }
  });

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
      let plaintext = msg.encryptedContent;
      const chatKey = getChatKey(msg.channelId);
      if (chatKey && msg.contentIv && msg.contentTag) {
        plaintext = await decrypt(msg.encryptedContent, msg.contentIv, msg.contentTag, chatKey);
      }

      const message: StoredMessage = {
        id: msg.id,
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

  socket.on(SOCKET_EVENTS.REACTION_ADDED, () => {});
  socket.on(SOCKET_EVENTS.REACTION_REMOVED, () => {});

  // ─── User Presence Events ────────────────────────────────────────

  socket.on(SOCKET_EVENTS.USER_JOINED, () => {});
  socket.on(SOCKET_EVENTS.USER_LEFT, () => {});

  // ─── Heartbeat ───────────────────────────────────────────────────

  socket.on(SOCKET_EVENTS.HEARTBEAT_ACK, () => {});

  const heartbeatInterval = setInterval(() => {
    if (socket.connected) {
      (socket as any).emit('heartbeat');
    }
  }, APP.HEARTBEAT_INTERVAL_MS);

  socket.on('disconnect', () => {
    clearInterval(heartbeatInterval);
  });
}

export function unbindSocketHandlers(socket: AppSocket) {
  socket.removeAllListeners();
}

