import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

// ─── Types ──────────────────────────────────────────────────────────────────

export type ConnectionStatus = 'connecting' | 'connected' | 'disconnected' | 'reconnecting';

export interface SocketState {
  status: ConnectionStatus;
  socketId: string | null;
  isConnected: boolean;
  reconnectAttempts: number;
}

export interface SocketActions {
  setStatus: (status: ConnectionStatus) => void;
  setSocketId: (socketId: string) => void;
  setConnected: (connected: boolean) => void;
  setReconnectAttempts: (attempts: number) => void;
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

      reset: () =>
        set(
          {
            status: 'disconnected',
            socketId: null,
            isConnected: false,
            reconnectAttempts: 0,
          },
          false,
          'reset',
        ),
    }),
    { name: 'SocketStore' },
  ),
);
