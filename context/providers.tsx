'use client';

import { useState, useEffect, useRef, type ReactNode } from 'react';
import { connectSocket, disconnectSocket, type AppSocket } from '@/lib/socket';
import { bindSocketHandlers, unbindSocketHandlers } from '@/lib/socket-handlers';
import { useAuthStore } from '@/context/stores/auth-store';
import { useSocketStore } from '@/context/stores/socket-store';
import { setTokens, loadRefreshToken, api } from '@/utils/api';

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

// ─── Auth Init ──────────────────────────────────────────────────────────────

function useAuthInit() {
  const setLoading = useAuthStore((s) => s.setLoading);
  const logout = useAuthStore((s) => s.logout);
  const setUser = useAuthStore((s) => s.setUser);
  const setTokenValidated = useAuthStore((s) => s.setTokenValidated);
  const initialized = useRef(false);
  const [hydrated, setHydrated] = useState(false);

  // Wait for Zustand hydration
  useEffect(() => {
    const unsub = useAuthStore.persist.onFinishHydration(() => setHydrated(true));
    useAuthStore.persist.rehydrate();
    if (useAuthStore.persist.hasHydrated()) setHydrated(true);
    return unsub;
  }, []);

  // After hydration: validate token or finish loading
  useEffect(() => {
    if (!hydrated || initialized.current) return;
    initialized.current = true;

    const token = useAuthStore.getState().accessToken;
    const user = useAuthStore.getState().user;

    if (token && user) {
      // Sync tokens to module scope
      const refreshToken = loadRefreshToken();
      if (refreshToken) setTokens(token, refreshToken);

      // Validate with server — if 401, interceptor refreshes or redirects
      api.get<any>('/api/auth/me')
        .then((res) => {
          if (res?.user?.id) {
            setUser(res.user);
            initSocket(token);
          } else {
            logout();
            window.location.href = '/auth/login';
          }
        })
        .catch(() => {
          const freshToken = useAuthStore.getState().accessToken;
          if (freshToken) {
            initSocket(freshToken);
          }
        })
        .finally(() => {
          setTokenValidated(true);
          setLoading(false);
        });
    } else {
      setTokenValidated(true);
      setLoading(false);
    }
  }, [hydrated, setLoading, logout, setUser, setTokenValidated]);
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
