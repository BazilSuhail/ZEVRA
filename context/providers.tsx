'use client';

import { useState, useEffect, type ReactNode } from 'react';
import { connectSocket, disconnectSocket, type AppSocket } from '@/lib/socket';
import { bindSocketHandlers, unbindSocketHandlers } from '@/lib/socket-handlers';
import { useAuthStore } from '@/context/stores/auth-store';
import { useSocketStore } from '@/context/stores/socket-store';
import { setTokens, loadRefreshToken } from '@/utils/api';

// ─── Socket Manager ─────────────────────────────────────────────────────────

let socketInstance: AppSocket | null = null;

function initSocket(token: string): AppSocket {
  if (socketInstance?.connected) return socketInstance;

  if (socketInstance) {
    unbindSocketHandlers(socketInstance);
    socketInstance.disconnect();
  }

  socketInstance = connectSocket(token);
  bindSocketHandlers(socketInstance);

  return socketInstance;
}

function destroySocket() {
  if (socketInstance) {
    unbindSocketHandlers(socketInstance);
    disconnectSocket();
    socketInstance = null;
  }
}

// ─── Auth Init (runs once on mount) ─────────────────────────────────────────

function useAuthInit() {
  const setLoading = useAuthStore((s) => s.setLoading);

  useEffect(() => {
    const accessToken = useAuthStore.getState().accessToken;
    const user = useAuthStore.getState().user;

    if (accessToken && user) {
      const refreshToken = loadRefreshToken();
      if (refreshToken) setTokens(accessToken, refreshToken);
      initSocket(accessToken);
    }
    setLoading(false);

    return () => {
      destroySocket();
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Watch for auth changes — connect/disconnect socket
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const accessToken = useAuthStore((s) => s.accessToken);

  useEffect(() => {
    if (isAuthenticated && accessToken) {
      initSocket(accessToken);
    } else {
      destroySocket();
    }
  }, [isAuthenticated, accessToken]);
}

// ─── Socket Connection Watcher ──────────────────────────────────────────────

function useSocketConnection() {
  const setConnected = useSocketStore((s) => s.setConnected);

  useEffect(() => {
    const check = () => {
      if (socketInstance?.connected) {
        setConnected(true);
      }
    };

    const interval = setInterval(check, 5000);
    return () => clearInterval(interval);
  }, [setConnected]);
}

// ─── Providers ──────────────────────────────────────────────────────────────

export function Providers({ children }: { children: ReactNode }) {
  useAuthInit();
  useSocketConnection();

  return <>{children}</>;
}

// ─── Hydration Gate ─────────────────────────────────────────────────────────

export function useHydration() {
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const unsub = useAuthStore.persist.onFinishHydration(() => {
      setHydrated(true);
    });

    useAuthStore.persist.rehydrate();

    if (useAuthStore.persist.hasHydrated()) {
      setHydrated(true);
    }

    return unsub;
  }, []);

  return hydrated;
}

export function HydrationGate({ children, fallback }: { children: ReactNode; fallback?: ReactNode }) {
  const hydrated = useHydration();
  if (!hydrated) return fallback ?? null;
  return <>{children}</>;
}
