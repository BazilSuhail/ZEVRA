import { create } from "zustand";

interface User {
  name: string;
  email: string;
}

interface AuthState {
  isLoggedIn: boolean;
  user: User | null;
  login: (email: string, password: string) => void;
  register: (name: string, email: string, password: string) => void;
  logout: () => void;
}

export const useAuth = create<AuthState>((set) => ({
  isLoggedIn: false,
  user: null,
  login: (email, _password) =>
    set({ isLoggedIn: true, user: { name: email.split("@")[0], email } }),
  register: (name, email, _password) =>
    set({ isLoggedIn: true, user: { name, email } }),
  logout: () => set({ isLoggedIn: false, user: null }),
}));
