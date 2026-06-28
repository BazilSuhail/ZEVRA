import axios, { AxiosRequestConfig } from "axios";

// ─── Axios instance ───────────────────────────────────────────────────────────

const client = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000",
  headers: { "Content-Type": "application/json" },
});

// Attach access token
client.interceptors.request.use((config) => {
  if (typeof window === "undefined") return config;
  const token = localStorage.getItem("access_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Auto-refresh on 401
let refreshing = false;
let queue: Array<() => void> = [];

client.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    if (error.response?.status !== 401 || original._retry) throw error;

    const isAuthRoute = /\/api\/auth\/(login|register|refresh)/.test(original.url);
    if (isAuthRoute) throw error;

    if (refreshing) {
      return new Promise((resolve) => {
        queue.push(() => resolve(client(original)));
      });
    }

    original._retry = true;
    refreshing = true;

    try {
      const refreshToken = localStorage.getItem("refresh_token");
      if (!refreshToken) throw new Error("No refresh token");

      const { data } = await axios.post(
        `${client.defaults.baseURL}/api/auth/refresh`,
        { refreshToken }
      );

      localStorage.setItem("access_token", data.accessToken);
      localStorage.setItem("refresh_token", data.refreshToken);
      original.headers.Authorization = `Bearer ${data.accessToken}`;

      queue.forEach((cb) => cb());
      queue = [];

      return client(original);
    } catch {
      localStorage.removeItem("access_token");
      localStorage.removeItem("refresh_token");
      window.location.href = "/auth/login";
      throw error;
    } finally {
      refreshing = false;
    }
  }
);

// ─── Core adapter ────────────────────────────────────────────────────────────

type Method = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

interface ApiOptions {
  body?: unknown;
  params?: Record<string, string | number | boolean | string[] | undefined>;
  headers?: Record<string, string>;
}

export async function request<T = unknown>(
  method: Method,
  url: string,
  options?: ApiOptions
): Promise<T> {
  const config: AxiosRequestConfig = { method, url, headers: options?.headers };

  if (options?.body) config.data = options.body;
  if (options?.params) {
    const clean: Record<string, string | number | boolean | string[]> = {};
    for (const [k, v] of Object.entries(options.params)) {
      if (v !== undefined && v !== null && v !== "") clean[k] = v as any;
    }
    if (Object.keys(clean).length > 0) config.params = clean;
  }

  const { data } = await client.request<T>(config);
  return data;
}

// ─── Convenience ──────────────────────────────────────────────────────────────

export const api = {
  get: <T = unknown>(url: string, params?: ApiOptions["params"]) =>
    request<T>("GET", url, { params }),
  post: <T = unknown>(url: string, body?: unknown) =>
    request<T>("POST", url, { body }),
  put: <T = unknown>(url: string, body?: unknown) =>
    request<T>("PUT", url, { body }),
  patch: <T = unknown>(url: string, body?: unknown) =>
    request<T>("PATCH", url, { body }),
  del: <T = unknown>(url: string) => request<T>("DELETE", url),
};
