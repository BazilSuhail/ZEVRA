import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

// ─── Types ──────────────────────────────────────────────────────────────────

export type Theme = 'light' | 'dark' | 'system';

export interface UiState {
  theme: Theme;
  sidebarOpen: boolean;
  searchQuery: string;
  isMobile: boolean;
}

export interface UiActions {
  setTheme: (theme: Theme) => void;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  setSearchQuery: (query: string) => void;
  setIsMobile: (mobile: boolean) => void;
}

// ─── Store ──────────────────────────────────────────────────────────────────

export const useUiStore = create<UiState & UiActions>()(
  devtools(
    persist(
      (set) => ({
        // State
        theme: 'system',
        sidebarOpen: true,
        searchQuery: '',
        isMobile: false,

        // Actions
        setTheme: (theme) => set({ theme }, false, 'setTheme'),

        toggleSidebar: () =>
          set((state) => ({ sidebarOpen: !state.sidebarOpen }), false, 'toggleSidebar'),

        setSidebarOpen: (sidebarOpen) =>
          set({ sidebarOpen }, false, 'setSidebarOpen'),

        setSearchQuery: (searchQuery) =>
          set({ searchQuery }, false, 'setSearchQuery'),

        setIsMobile: (isMobile) =>
          set({ isMobile }, false, 'setIsMobile'),
      }),
      {
        name: 'zevra-ui',
        partialize: (state) => ({
          theme: state.theme,
          sidebarOpen: state.sidebarOpen,
        }),
      },
    ),
    { name: 'UiStore' },
  ),
);
