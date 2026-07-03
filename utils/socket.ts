import { getSocket, type AppSocket } from '@/lib/socket';
import { SOCKET_EVENTS } from '@/constants';

// ─── Socket Adapter ─────────────────────────────────────────────────────────
//
// Usage:
//   import { socket } from '@/utils/socket';
//
//   // Fire-and-forget (typing, heartbeat)
//   socket.fire(SOCKET_EVENTS.TYPING_START, { channelId });
//
//   // Emit with acknowledgement (send message, get messages)
//   const result = await socket.emit(SOCKET_EVENTS.SEND_MESSAGE, { channelId, ... });
//   if (result.success) { ... }
//
//   // Check connection
//   if (socket.connected) { ... }
//

export const socket = {
  /** Get raw socket instance (for advanced usage). */
  raw: (): AppSocket | null => getSocket(),

  /** Is socket currently connected? */
  get connected(): boolean {
    return getSocket()?.connected ?? false;
  },

  /**
   * Emit event with server acknowledgement (promise).
   * Server responds via callback — this wraps it in a promise.
   *
   * @example
   *   const res = await socket.emit(SOCKET_EVENTS.SEND_MESSAGE, {
   *     channelId, encryptedContent, contentIv, contentTag, ...
   *   });
   *   // res = { success: true, message: { id, sequenceNumber, createdAt } }
   */
  emit<T = any>(event: string, data?: unknown, timeoutMs = 15000): Promise<T> {
    return new Promise((resolve, reject) => {
      const sock = getSocket();
      if (!sock?.connected) {
        reject(new Error('Socket not connected'));
        return;
      }

      const timer = setTimeout(() => {
        reject(new Error(`Socket "${event}" timed out after ${timeoutMs}ms`));
      }, timeoutMs);

      const callback = (response: T) => {
        clearTimeout(timer);
        resolve(response);
      };

      if (data !== undefined) {
        (sock.emit as any)(event, data, callback);
      } else {
        (sock.emit as any)(event, callback);
      }
    });
  },

  /**
   * Fire event without waiting for ack (fire-and-forget).
   * Use for typing indicators, heartbeats, etc.
   */
  fire(event: string, data?: unknown): void {
    const sock = getSocket();
    if (!sock?.connected) return;

    if (data !== undefined) {
      sock.emit(event as any, data);
    } else {
      sock.emit(event as any);
    }
  },

  /**
   * Register listener for a server event.
   * Returns unsubscribe function.
   *
   * @example
   *   const unsub = socket.on(SOCKET_EVENTS.MESSAGE_NEW, (msg) => { ... });
   *   // later: unsub()
   */
  on(event: string, handler: (...args: any[]) => void): () => void {
    const sock = getSocket();
    if (!sock) return () => {};

    sock.on(event as any, handler);
    return () => sock.off(event as any, handler);
  },

  /**
   * Remove listener for a specific event.
   */
  off(event: string, handler?: (...args: any[]) => void): void {
    const sock = getSocket();
    if (!sock) return;

    if (handler) {
      sock.off(event as any, handler);
    } else {
      sock.removeAllListeners(event as any);
    }
  },
};
