import { create } from "zustand";
import { api } from "@/utils/api";
import type { User, AuthLoginFinishResponse } from "@/utils/types";

interface AuthState {
  isLoggedIn: boolean;
  user: User | null;

  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  loadSession: () => void;
}

export const useAuth = create<AuthState>((set) => ({
  isLoggedIn: !!(
    typeof window !== "undefined" && localStorage.getItem("access_token")
  ),
  user: null,

  login: async (email, password) => {
    const username = email.split("@")[0];

    // Step 1: SRP start
    const start = await api.post<{ srpSalt: string; B: string }>(
      "/api/auth/login/start",
      { username }
    );

    // Step 2: SRP finish (crypto will be added later)
    const finish = await api.post<AuthLoginFinishResponse>(
      "/api/auth/login/finish",
      {
        username,
        A: "placeholder",
        M1: "placeholder",
      }
    );

    localStorage.setItem("access_token", finish.accessToken);
    localStorage.setItem("refresh_token", finish.refreshToken);

    set({
      isLoggedIn: true,
      user: finish.user as User,
    });
  },

  register: async (name, email, password) => {
    const res = await api.post<{ success: boolean; user: User }>(
      "/api/auth/register",
      {
        username: name,
        email,
        password,
      }
    );

    set({
      isLoggedIn: true,
      user: res.user,
    });
  },

  logout: () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    set({ isLoggedIn: false, user: null });
  },

  loadSession: async () => {
    const token = localStorage.getItem("access_token");
    if (!token) {
      set({ isLoggedIn: false, user: null });
      return;
    }
    try {
      const user = await api.get<User>("/api/auth/me");
      set({ isLoggedIn: true, user });
    } catch {
      localStorage.removeItem("access_token");
      localStorage.removeItem("refresh_token");
      set({ isLoggedIn: false, user: null });
    }
  },
}));
