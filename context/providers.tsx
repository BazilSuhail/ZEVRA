'use client';

import { useState, useEffect, useCallback, type ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { connectSocket, disconnectSocket, type AppSocket } from '@/lib/socket';
import { bindSocketHandlers, unbindSocketHandlers } from '@/lib/socket-handlers';
import { useAuthStore } from '@/context/stores/auth-store';
import { useSocketStore } from '@/context/stores/socket-store';

// ─── React Query Client ─────────────────────────────────────────────────────

function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30 * 1000, // 30s
        gcTime: 5 * 60 * 1000, // 5min
        retry: 2,
        refetchOnWindowFocus: false,
      },
    },
  });
}

let browserQueryClient: QueryClient | null = null;

function getQueryClient() {
  if (typeof window === 'undefined') {
    return makeQueryClient();
  }
  if (!browserQueryClient) {
    browserQueryClient = makeQueryClient();
  }
  return browserQueryClient;
}

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
  const setAuth = useAuthStore((s) => s.setAuth);
  const logout = useAuthStore((s) => s.logout);
  const setLoading = useAuthStore((s) => s.setLoading);

  useEffect(() => {
    const accessToken = useAuthStore.getState().accessToken;
    const user = useAuthStore.getState().user;

    if (accessToken && user) {
      // Token exists from persist — init socket
      initSocket(accessToken);
      setLoading(false);
    } else {
      setLoading(false);
    }

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

    // Check periodically (backup for missed events)
    const interval = setInterval(check, 5000);
    return () => clearInterval(interval);
  }, [setConnected]);
}

// ─── Providers ──────────────────────────────────────────────────────────────

export function Providers({ children }: { children: ReactNode }) {
  const queryClient = getQueryClient();

  useAuthInit();
  useSocketConnection();

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}

// ─── Hydration Gate ─────────────────────────────────────────────────────────

export function useHydration() {
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    // Zustand persist hydration
    const unsub = useAuthStore.persist.onFinishHydration(() => {
      setHydrated(true);
    });

    useAuthStore.persist.rehydrate();

    // Fallback: if hydration is instant
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
