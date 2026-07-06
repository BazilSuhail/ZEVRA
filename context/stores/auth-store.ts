import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

// ─── Types ──────────────────────────────────────────────────────────────────

export interface User {
  id: string;
  username: string;
  email: string;
  status?: string;
  createdAt?: string;
  keyVersion?: number;
}

export interface AuthState {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  tokenValidated: boolean;
}

export interface AuthActions {
  setAuth: (user: User, accessToken: string) => void;
  setUser: (user: User) => void;
  setAccessToken: (token: string) => void;
  logout: () => void;
  setLoading: (loading: boolean) => void;
  setTokenValidated: (validated: boolean) => void;
}

// ─── Store ──────────────────────────────────────────────────────────────────

export const useAuthStore = create<AuthState & AuthActions>()(
  devtools(
    persist(
      (set) => ({
        // State
        user: null,
        accessToken: null,
        isAuthenticated: false,
        isLoading: true,
        tokenValidated: false,

        // Actions
        setAuth: (user, accessToken) =>
          set(
            { user, accessToken, isAuthenticated: true, isLoading: false, tokenValidated: true },
            false,
            'setAuth',
          ),

        setUser: (user) => set({ user }, false, 'setUser'),

        setAccessToken: (token) => set({ accessToken: token }, false, 'setAccessToken'),

        logout: () =>
          set(
            { user: null, accessToken: null, isAuthenticated: false, isLoading: false, tokenValidated: true },
            false,
            'logout',
          ),

        setLoading: (isLoading) => set({ isLoading }, false, 'setLoading'),

        setTokenValidated: (tokenValidated) => set({ tokenValidated }, false, 'setTokenValidated'),
      }),
      {
        name: 'zevra-auth',
        partialize: (state) => ({
          user: state.user,
          accessToken: state.accessToken,
          isAuthenticated: state.isAuthenticated,
        }),
      },
    ),
    { name: 'AuthStore' },
  ),
);
