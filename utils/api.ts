import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { API_URL } from '@/constants';
import { useAuthStore } from '@/context/stores/auth-store';

/**
 * Human-readable message from an API/axios error. Server errors follow
 * `{ success:false, error:CODE, message }` — always show `message`.
 */
export function getErrorMessage(err: unknown, fallback = 'Something went wrong'): string {
  const data = (err as AxiosError<{ message?: string | string[] }>)?.response?.data;
  const msg = data?.message;
  if (Array.isArray(msg) && msg.length > 0) return String(msg[0]);
  if (typeof msg === 'string' && msg) return msg;
  if (err instanceof Error && err.message) return err.message;
  return fallback;
}

// ─── Token Manager ──────────────────────────────────────────────────────────
// Tokens live here (module scope) — utils/api is the single source of truth.
// Access tokens are short-lived (15 min): they are refreshed proactively
// shortly before expiry and on any 401. Refresh tokens are single-use, so
// every refresh goes through ONE in-flight promise.

let _accessToken: string | null = null;
let _refreshToken: string | null = null;
let refreshTimer: ReturnType<typeof setTimeout> | null = null;

export function getAccessToken() {
  return _accessToken;
}

export function getRefreshToken() {
  return _refreshToken;
}

/** `exp` (seconds) from a JWT payload, or null when unreadable. */
function jwtExpiry(token: string): number | null {
  try {
    const part = token.split('.')[1];
    if (!part) return null;
    const json = atob(part.replace(/-/g, '+').replace(/_/g, '/'));
    const exp = JSON.parse(json)?.exp;
    return typeof exp === 'number' ? exp : null;
  } catch {
    return null;
  }
}

function scheduleProactiveRefresh(access: string, expiresIn?: number) {
  if (typeof window === 'undefined') return;
  if (refreshTimer) clearTimeout(refreshTimer);
  refreshTimer = null;
  const exp = jwtExpiry(access);
  const msLeft = exp != null ? exp * 1000 - Date.now() : expiresIn != null ? expiresIn * 1000 : null;
  if (msLeft == null) return;
  // Refresh a minute early (or at 80% of very short lifetimes)
  const delay = Math.max(5_000, Math.min(msLeft - 60_000, msLeft * 0.8));
  refreshTimer = setTimeout(() => {
    refreshAccessToken().catch(() => {});
  }, delay);
}

export function setTokens(access: string, refresh: string, expiresIn?: number) {
  _accessToken = access;
  _refreshToken = refresh;
  if (typeof window !== 'undefined') {
    localStorage.setItem('refresh_token', refresh);
  }
  scheduleProactiveRefresh(access, expiresIn);
}

export function clearTokens() {
  _accessToken = null;
  _refreshToken = null;
  if (refreshTimer) clearTimeout(refreshTimer);
  refreshTimer = null;
  if (typeof window !== 'undefined') {
    localStorage.removeItem('refresh_token');
  }
}

export function loadRefreshToken() {
  if (typeof window !== 'undefined') {
    _refreshToken = localStorage.getItem('refresh_token');
  }
  return _refreshToken;
}

function endSession() {
  clearTokens();
  // Clear the persisted auth store first, otherwise the login page sees a
  // stale "authenticated" session and bounces back to /chat
  useAuthStore.getState().logout();
  if (typeof window !== 'undefined') window.location.href = '/auth/login';
}

let refreshInFlight: Promise<string> | null = null;

/**
 * Exchange the refresh token for a new pair — single-flight: concurrent
 * callers (401 retries, socket auth errors, the proactive timer) share one
 * request. A rejected refresh token (4xx) ends the session; network errors
 * just reject so the caller can retry later.
 */
export function refreshAccessToken(): Promise<string> {
  if (refreshInFlight) return refreshInFlight;
  const token = _refreshToken;
  if (!token) return Promise.reject(new Error('No refresh token'));

  refreshInFlight = (async () => {
    try {
      const { data } = await axios.post<{
        success: boolean;
        accessToken: string;
        refreshToken: string;
        expiresIn?: number;
      }>(`${API_URL}/api/auth/refresh`, { refreshToken: token }, { timeout: 15000 });
      if (!data?.accessToken || !data.refreshToken) throw new Error('Invalid refresh response');
      setTokens(data.accessToken, data.refreshToken, data.expiresIn);
      // Persisted store drives the socket lifecycle (reconnects with the new token)
      if (useAuthStore.getState().isAuthenticated) {
        useAuthStore.getState().setAccessToken(data.accessToken);
      }
      return data.accessToken;
    } catch (err) {
      const status = (err as AxiosError)?.response?.status;
      if (status && status >= 400 && status < 500 && status !== 429) endSession();
      throw err;
    } finally {
      refreshInFlight = null;
    }
  })();
  return refreshInFlight;
}

// ─── Axios Instance ─────────────────────────────────────────────────────────

const http = axios.create({
  baseURL: API_URL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

// ─── Request Interceptor: inject token ──────────────────────────────────────

http.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    if (_accessToken) {
      config.headers.Authorization = `Bearer ${_accessToken}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// ─── Response Interceptor: auto-refresh on 401 ─────────────────────────────

http.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as (InternalAxiosRequestConfig & { _retry?: boolean }) | undefined;

    if (
      originalRequest &&
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !originalRequest.url?.includes('/auth/login') &&
      !originalRequest.url?.includes('/auth/refresh') &&
      !originalRequest.url?.includes('/auth/register') &&
      _refreshToken
    ) {
      originalRequest._retry = true;
      const token = await refreshAccessToken();
      originalRequest.headers.Authorization = `Bearer ${token}`;
      return http(originalRequest);
    }

    return Promise.reject(error);
  },
);

// ─── Core Request Function ──────────────────────────────────────────────────
//
// Usage:
//   const data = await request<User[]>({ method: 'GET', url: API.USERS.SEARCH, params: { q: 'john' } });
//   const user = await request<User>({ method: 'POST', url: API.AUTH.LOGIN_FINISH, body: { username, A, M1 } });
//

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';

export interface RequestOptions {
  method: HttpMethod;
  url: string;
  body?: unknown;
  params?: Record<string, unknown>;
  headers?: Record<string, string>;
  timeout?: number;
  silent?: boolean; // don't throw on error
}

export async function request<T>(options: RequestOptions): Promise<T> {
  const { method, url, body, params, headers, timeout, silent } = options;

  try {
    const response = await http.request<T>({
      method,
      url,
      data: body,
      params,
      headers,
      timeout,
    });
    return response.data;
  } catch (error) {
    if (silent) {
      // Return a default-shaped error response
      return { success: false, error: getErrorMessage(error) } as T;
    }
    throw error;
  }
}

// ─── Convenience Wrappers ───────────────────────────────────────────────────
//
// Usage:
//   const data = await api.get<User[]>('/api/users/search', { q: 'john' });
//   const user = await api.post<User>('/api/auth/login/finish', { username, A, M1 });
//   await api.put('/keys/me', { publicKey, ... });
//   await api.delete(`/channels/${id}/members/${userId}`);
//   const file = await api.upload<UploadResult>('/uploads', fileObj);
//

export const api = {
  get: <T>(url: string, params?: Record<string, unknown>) =>
    request<T>({ method: 'GET', url, params }),

  post: <T>(url: string, body?: unknown) =>
    request<T>({ method: 'POST', url, body }),

  put: <T>(url: string, body?: unknown) =>
    request<T>({ method: 'PUT', url, body }),

  patch: <T>(url: string, body?: unknown) =>
    request<T>({ method: 'PATCH', url, body }),

  delete: <T>(url: string) =>
    request<T>({ method: 'DELETE', url }),

  upload: <T>(url: string, file: File | Blob, fieldName = 'file') => {
    const formData = new FormData();
    formData.append(fieldName, file);
    return request<T>({
      method: 'POST',
      url,
      body: formData,
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  /** Fire request silently (no throw on error). Returns { success, error? }. */
  silent: <T>(options: Omit<RequestOptions, 'silent'>) =>
    request<T & { success: boolean; error?: string }>({ ...options, silent: true }),
};

// ─── Raw axios export (for edge cases) ──────────────────────────────────────

export { http as axiosInstance };
