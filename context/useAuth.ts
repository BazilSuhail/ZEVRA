import { create } from "zustand";
import { api } from "@/utils/api";
import { generateClientEphemeral, computeM1, verifyM2 } from "@/utils/srp";
import { useKeys } from "@/context/stores/keysStore";
import type { User, MyKeys } from "@/utils/types";

interface AuthState {
  user: User | null;
  keys: MyKeys | null;
  isLoggedIn: boolean;

  login: (username: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  loadSession: () => Promise<void>;
}

export const useAuth = create<AuthState>((set) => ({
  user: null,
  keys: null,
  isLoggedIn: typeof window !== "undefined" && !!localStorage.getItem("access_token"),

  login: async (username, password) => {
    const srpState = generateClientEphemeral();
    const A_hex = srpState.A.toString(16).padStart(512, "0");

    const startRes = await api.post<{
      userId: string;
      username: string;
      srpSalt: string;
      B: string;
    }>("/api/auth/login/start", { username });

    const { M1, K } = await computeM1(password, startRes.srpSalt, startRes.B, srpState, username);

    const finishRes = await api.post<{
      user: { id: string; username: string; email: string };
      accessToken: string;
      refreshToken: string;
      M2: string;
      keys: MyKeys;
    }>("/api/auth/login/finish", { username, A: A_hex, M1 });

    const valid = await verifyM2(srpState.A, M1, K, finishRes.M2);
    if (!valid) throw new Error("Server proof verification failed");

    localStorage.setItem("access_token", finishRes.accessToken);
    localStorage.setItem("refresh_token", finishRes.refreshToken);

    set({ user: finishRes.user as User, keys: finishRes.keys, isLoggedIn: true });

    // Unlock E2EE keys (also persists sealed keys + KEK for session restore)
    await useKeys.getState().unlock(finishRes.keys, password);
  },

  register: async (username, email, password) => {
    await api.post<{ success: boolean; user: User }>("/api/auth/register", { username, email, password });
  },

  logout: () => {
    api.post("/api/auth/logout").catch(() => {});
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    useKeys.getState().lock();
    set({ user: null, keys: null, isLoggedIn: false });
  },

  loadSession: async () => {
    const token = localStorage.getItem("access_token");
    if (!token) {
      set({ user: null, keys: null, isLoggedIn: false });
      return;
    }
    try {
      const res = await api.get<{ success: boolean; user: User }>("/api/auth/me");
      const keys = await api.get<MyKeys>("/keys/me");
      set({ user: res.user, keys, isLoggedIn: true });

      // Try to restore E2EE keys from sessionStorage (no password needed)
      const restored = await useKeys.getState().restoreFromSession();
      if (!restored) {
        // Sealed keys exist in localStorage but KEK expired — need re-login to re-derive
        // We don't force logout, just E2EE stays locked until next full login
      }
    } catch {
      localStorage.removeItem("access_token");
      localStorage.removeItem("refresh_token");
      useKeys.getState().lock();
      set({ user: null, keys: null, isLoggedIn: false });
    }
  },
}));
