'use client';

import { useState, useEffect, useRef, type ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { connectSocket, disconnectSocket, type AppSocket } from '@/lib/socket';
import { bindSocketHandlers, unbindSocketHandlers } from '@/lib/socket-handlers';
import { useAuthStore } from '@/context/stores/auth-store';
import { useSocketStore } from '@/context/stores/socket-store';
import { useUiStore } from '@/context/stores/ui-store';
import { setTokens, loadRefreshToken, api, getAccessToken } from '@/utils/api';
import { initCallRingtone } from '@/utils/ringtone';
import OutgoingCallModal from '@/components/calls/OutgoingCallModal';
import IncomingCallModal from '@/components/calls/IncomingCallModal';
import ActiveCallOverlay from '@/components/calls/ActiveCallOverlay';
import CallEndedOverlay from '@/components/calls/CallEndedOverlay';
import ConnectionErrorScreen from '@/components/errors/ConnectionErrorScreen';

// ─── Socket Manager ─────────────────────────────────────────────────────────

let socketInstance: AppSocket | null = null;
let socketToken: string | null = null;

function initSocket(token: string): AppSocket {
  // Same token: keep the socket if it's connected or still auto-reconnecting.
  // A dead socket (server rejected it / retries exhausted) gets replaced.
  if (socketInstance && socketToken === token) {
    if (socketInstance.connected || socketInstance.active) return socketInstance;
  }

  // New token (fresh login) or first init: replace the socket
  if (socketInstance) {
    unbindSocketHandlers(socketInstance);
    disconnectSocket();
    socketInstance = null;
  }

  socketToken = token;
  socketInstance = connectSocket(token);
  bindSocketHandlers(socketInstance);

  return socketInstance;
}

function destroySocket() {
  if (socketInstance) {
    unbindSocketHandlers(socketInstance);
    disconnectSocket();
    socketInstance = null;
    socketToken = null;
  }
}

/**
 * Tear down the current socket and start a fresh connection attempt.
 * Used by the connection error screen's "Retry connection" button.
 */
export function retryConnection() {
  const token = useAuthStore.getState().accessToken || getAccessToken();
  useSocketStore.getState().setStatus('connecting');

  if (!token) {
    // No credentials to reconnect with — a full reload re-runs auth boot.
    window.location.reload();
    return;
  }

  destroySocket();
  initSocket(token);
}

// ─── Theme: apply the persisted theme app-wide (works on every route, not
//     just where <ThemeToggle /> happens to be mounted) ─────────────────────

function useThemeSync() {
  const theme = useUiStore((s) => s.theme);

  useEffect(() => {
    const apply = (resolved: 'light' | 'dark') => {
      document.documentElement.classList.toggle('dark', resolved === 'dark');
    };

    if (theme === 'system') {
      const mq = window.matchMedia('(prefers-color-scheme: dark)');
      apply(mq.matches ? 'dark' : 'light');
      const onChange = (e: MediaQueryListEvent) => apply(e.matches ? 'dark' : 'light');
      mq.addEventListener('change', onChange);
      return () => mq.removeEventListener('change', onChange);
    }

    apply(theme);
  }, [theme]);
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
            // The interceptor may have silently refreshed the token — sync it
            const freshToken = getAccessToken() || token;
            if (freshToken !== token) useAuthStore.getState().setAccessToken(freshToken);
            initSocket(freshToken);
          } else {
            logout();
            window.location.href = '/auth/login';
          }
        })
        .catch(() => {
          const freshToken = getAccessToken() || useAuthStore.getState().accessToken;
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

// ─── Socket Lifecycle: connect whenever a token exists, destroy on logout ──

function useSocketLifecycle() {
  const accessToken = useAuthStore((s) => s.accessToken);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  useEffect(() => {
    if (accessToken && isAuthenticated) {
      const sock = initSocket(accessToken);
      if (!sock.connected) useSocketStore.getState().setStatus('connecting');
    } else {
      destroySocket();
      useSocketStore.getState().reset();
    }
  }, [accessToken, isAuthenticated]);
}

// ─── Providers ──────────────────────────────────────────────────────────────

/**
 * Marketing routes keep their own experience — the full-screen connection
 * error never covers them. It only surfaces on the app routes (chat and
 * friends). The underlying error state is kept either way, so navigating to
 * `/chat` still shows it.
 */
const NO_ERROR_OVERLAY = new Set(['/', '/about', '/architecture']);

export function Providers({ children }: { children: ReactNode }) {
  useAuthInit();
  useSocketLifecycle();
  useThemeSync();

  // Central ringtone: starts on incoming call, stops on decline/accept/end
  useEffect(() => {
    initCallRingtone();
  }, []);

  const pathname = usePathname();
  const connectionError = useSocketStore((s) => s.connectionError);
  const isConnected = useSocketStore((s) => s.isConnected);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  // Only surface the overlay for an authenticated session — that's the only
  // case where the socket (and therefore a socket failure) exists — and only
  // on app routes, never on home / about / architecture.
  const showConnectionError =
    isAuthenticated &&
    Boolean(connectionError) &&
    !isConnected &&
    !NO_ERROR_OVERLAY.has(pathname);

  return (
    <>
      {children}
      <OutgoingCallModal />
      <IncomingCallModal />
      <ActiveCallOverlay />
      <CallEndedOverlay />
      {showConnectionError && <ConnectionErrorScreen onRetry={retryConnection} />}
    </>
  );
}
