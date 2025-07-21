import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

// ─── Types ──────────────────────────────────────────────────────────────────

export type ConnectionStatus = 'connecting' | 'connected' | 'disconnected' | 'reconnecting';

export interface SocketState {
  status: ConnectionStatus;
  socketId: string | null;
  isConnected: boolean;
  reconnectAttempts: number;
  onlineUsers: Record<string, boolean>;
  /** Last websocket connection error message (null when healthy / never attempted). */
  connectionError: string | null;
  /** Consecutive failed connection attempts — increments per `connect_error`. */
  failedAttempts: number;
}

export interface SocketActions {
  setStatus: (status: ConnectionStatus) => void;
  setSocketId: (socketId: string) => void;
  setConnected: (connected: boolean) => void;
  setReconnectAttempts: (attempts: number) => void;
  setPresenceBulk: (online: string[]) => void;
  setUsersOnline: (userIds: string[]) => void;
  setUserOnline: (userId: string) => void;
  setUserOffline: (userId: string) => void;
  /** Record a failed connection attempt (shows the connection error screen). */
  setConnectionError: (error: string) => void;
  /** Clear the connection error (called on successful connect). */
  clearConnectionError: () => void;
  reset: () => void;
}

// ─── Store ──────────────────────────────────────────────────────────────────

export const useSocketStore = create<SocketState & SocketActions>()(
  devtools(
    (set) => ({
      // State
      status: 'disconnected',
      socketId: null,
      isConnected: false,
      reconnectAttempts: 0,
      onlineUsers: {},
      connectionError: null,
      failedAttempts: 0,

      // Actions
      setStatus: (status) => set({ status }, false, 'setStatus'),

      setSocketId: (socketId) => set({ socketId }, false, 'setSocketId'),

      setConnected: (isConnected) =>
        set(
          {
            isConnected,
            status: isConnected ? 'connected' : 'disconnected',
          },
          false,
          'setConnected',
        ),

      setReconnectAttempts: (reconnectAttempts) =>
        set({ reconnectAttempts }, false, 'setReconnectAttempts'),

      setPresenceBulk: (online) =>
        set(
          {
            onlineUsers: Object.fromEntries(online.map((id) => [id, true])),
          },
          false,
          'setPresenceBulk',
        ),

      setUsersOnline: (userIds) =>
        set(
          (state) => {
            const next = { ...state.onlineUsers };
            for (const id of userIds) next[id] = true;
            return { onlineUsers: next };
          },
          false,
          'setUsersOnline',
        ),

      setUserOnline: (userId) =>
        set(
          (state) => ({ onlineUsers: { ...state.onlineUsers, [userId]: true } }),
          false,
          'setUserOnline',
        ),

      setUserOffline: (userId) =>
        set(
          (state) => {
            if (!state.onlineUsers[userId]) return state;
            const next = { ...state.onlineUsers };
            delete next[userId];
            return { onlineUsers: next };
          },
          false,
          'setUserOffline',
        ),

      setConnectionError: (error) =>
        set(
          (state) => ({
            connectionError: error,
            failedAttempts: state.failedAttempts + 1,
          }),
          false,
          'setConnectionError',
        ),

      clearConnectionError: () =>
        set(
          { connectionError: null, failedAttempts: 0 },
          false,
          'clearConnectionError',
        ),

      reset: () =>
        set(
          {
            status: 'disconnected',
            socketId: null,
            isConnected: false,
            reconnectAttempts: 0,
            onlineUsers: {},
            connectionError: null,
            failedAttempts: 0,
          },
          false,
          'reset',
        ),
    }),
    { name: 'SocketStore' },
  ),
);
