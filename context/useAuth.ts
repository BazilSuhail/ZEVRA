import { create } from "zustand";
import { api } from "@/utils/api";
import { generateClientEphemeral, computeM1, verifyM2 } from "@/utils/srp";
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

export const useAuth = create<AuthState>((set) => ({
  user: null,
  keys: null,
  isLoggedIn: typeof window !== "undefined" && !!localStorage.getItem("access_token"),

  // ─── Login (SRP-6a) ─────────────────────────────────────────────────────
  login: async (email, password) => {
    const username = email.split("@")[0];

    // Step 1: Generate client ephemeral
    const srpState = generateClientEphemeral();
    const A_hex = srpState.A.toString(16).padStart(512, "0");

    // Step 2: SRP start — get salt + B from server
    const startRes = await api.post<{
      userId: string;
      username: string;
      srpSalt: string;
      B: string;
    }>("/api/auth/login/start", { username });

    // Step 3: Compute M1 proof
    const { M1, K } = await computeM1(
      password,
      startRes.srpSalt,
      startRes.B,
      srpState,
      username
    );

    // Step 4: SRP finish — send A + M1, get tokens + keys
    const finishRes = await api.post<{
      user: { id: string; username: string; email: string };
      accessToken: string;
      refreshToken: string;
      M2: string;
      keys: MyKeys;
    }>("/api/auth/login/finish", {
      username,
      A: A_hex,
      M1,
    });

    // Step 5: Verify server proof M2
    const valid = await verifyM2(srpState.A, M1, K, finishRes.M2);
    if (!valid) throw new Error("Server proof verification failed");

    // Step 6: Store tokens
    localStorage.setItem("access_token", finishRes.accessToken);
    localStorage.setItem("refresh_token", finishRes.refreshToken);

    set({
      user: finishRes.user as User,
      keys: finishRes.keys,
      isLoggedIn: true,
    });
  },

  // ─── Register ─────────────────────────────────────────────────────────────
  register: async (username, email, password) => {
    await api.post<{ success: boolean; user: User }>(
      "/api/auth/register",
      { username, email, password }
    );
  },

  // ─── Logout ───────────────────────────────────────────────────────────────
  logout: () => {
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
      const user = await api.get<User>("/api/auth/me");
      const keys = await api.get<MyKeys>("/keys/me");
      set({ user, keys, isLoggedIn: true });
    } catch {
      localStorage.removeItem("access_token");
      localStorage.removeItem("refresh_token");
      set({ user: null, keys: null, isLoggedIn: false });
    }
  },

  setKeys: (keys) => set({ keys }),
}));
