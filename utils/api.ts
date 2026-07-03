import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { API_URL } from '@/constants';

// ─── Token Manager ──────────────────────────────────────────────────────────
// Tokens live here (module scope). lib/api.ts re-exports them.
// This avoids circular imports — utils/api is the single source of truth.

let _accessToken: string | null = null;
let _refreshToken: string | null = null;

export function getAccessToken() {
  return _accessToken;
}

export function getRefreshToken() {
  return _refreshToken;
}

export function setTokens(access: string, refresh: string) {
  _accessToken = access;
  _refreshToken = refresh;
  if (typeof window !== 'undefined') {
    localStorage.setItem('refresh_token', refresh);
  }
}

export function clearTokens() {
  _accessToken = null;
  _refreshToken = null;
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

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (error: unknown) => void;
}> = [];

function processQueue(error: unknown, token: string | null) {
  failedQueue.forEach((p) => (error || !token ? p.reject(error) : p.resolve(token)));
  failedQueue = [];
}

http.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !originalRequest.url?.includes('/auth/login') &&
      !originalRequest.url?.includes('/auth/refresh') &&
      !originalRequest.url?.includes('/auth/register') &&
      _refreshToken
    ) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then((token) => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return http(originalRequest);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const { data } = await axios.post(`${API_URL}/api/auth/refresh`, {
          refreshToken: _refreshToken,
        });

        if (data.success) {
          setTokens(data.accessToken, data.refreshToken);
          processQueue(null, data.accessToken);
          originalRequest.headers.Authorization = `Bearer ${data.accessToken}`;
          return http(originalRequest);
        }
      } catch (refreshError) {
        processQueue(refreshError, null);
        clearTokens();
        if (typeof window !== 'undefined') window.location.href = '/auth';
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
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
      return { success: false, error: (error as Error).message } as T;
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
