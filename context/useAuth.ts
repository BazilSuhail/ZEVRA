import { create } from "zustand";
import { api } from "@/utils/api";
import type { User, MyKeys } from "@/utils/types";

// ─── Store ────────────────────────────────────────────────────────────────────
// Global state: user + own keys only.
// Channels, messages, etc. live in TanStack Query (per-page).

interface AuthState {
  user: User | null;
  keys: MyKeys | null;
  isLoggedIn: boolean;

  login: (email: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  loadSession: () => Promise<void>;
  setKeys: (keys: MyKeys) => void;
}

export const useAuth = create<AuthState>((set, get) => ({
  user: null,
  keys: null,
  isLoggedIn: typeof window !== "undefined" && !!localStorage.getItem("access_token"),

  // ─── Login ────────────────────────────────────────────────────────────────
  login: async (email, password) => {
    const username = email.split("@")[0];

    // Step 1: SRP start (will be replaced with real SRP later)
    await api.post("/api/auth/login/start", { username });

    // Step 2: SRP finish
    const res = await api.post<{
      user: { id: string; username: string; email: string };
      accessToken: string;
      refreshToken: string;
      M2: string;
      keys: MyKeys;
    }>("/api/auth/login/finish", {
      username,
      A: "placeholder",
      M1: "placeholder",
    });

    localStorage.setItem("access_token", res.accessToken);
    localStorage.setItem("refresh_token", res.refreshToken);

    set({
      user: res.user as User,
      keys: res.keys,
      isLoggedIn: true,
    });
  },

  // ─── Register ─────────────────────────────────────────────────────────────
  register: async (username, email, password) => {
    const res = await api.post<{ success: boolean; user: User }>(
      "/api/auth/register",
      { username, email, password }
    );

    // Server returns user but no tokens — user must login after register
    set({ user: res.user });
  },

  // ─── Logout ───────────────────────────────────────────────────────────────
  logout: () => {
    // Fire-and-forget logout call
    api.post("/api/auth/logout").catch(() => {});

    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");

    set({ user: null, keys: null, isLoggedIn: false });
  },

  // ─── Load session on page refresh ─────────────────────────────────────────
  loadSession: async () => {
    const token = localStorage.getItem("access_token");
    if (!token) {
      set({ user: null, keys: null, isLoggedIn: false });
      return;
    }

    try {
      // Validate token + get user
      const user = await api.get<User>("/api/auth/me");

      // Fetch own keys
      const keys = await api.get<MyKeys>("/keys/me");

      set({ user, keys, isLoggedIn: true });
    } catch {
      // Token invalid or expired, interceptor handles refresh
      localStorage.removeItem("access_token");
      localStorage.removeItem("refresh_token");
      set({ user: null, keys: null, isLoggedIn: false });
    }
  },

  // ─── Update keys (after rotation) ─────────────────────────────────────────
  setKeys: (keys) => set({ keys }),
}));
