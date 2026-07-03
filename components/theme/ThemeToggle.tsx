"use client";

import { useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { FiSun, FiMoon } from "react-icons/fi";
import { useUiStore } from "@/context/stores";

/** Apply theme to <html> */
function applyTheme(theme: "light" | "dark") {
  document.documentElement.classList.toggle("dark", theme === "dark");
}

/** Read initial theme from localStorage (sync before paint) */
function getInitialTheme(): "light" | "dark" {
  if (typeof window === "undefined") return "dark";
  const saved = localStorage.getItem("zevra-ui");
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      if (parsed.state?.theme === "light" || parsed.state?.theme === "dark") {
        return parsed.state.theme;
      }
    } catch {}
  }
  return "dark";
}

export default function ThemeToggle() {
  const theme = useUiStore((s) => s.theme);
  const setTheme = useUiStore((s) => s.setTheme);

  // Sync on mount + when theme changes
  useEffect(() => {
    if (theme === 'light' || theme === 'dark') {
      applyTheme(theme);
    } else {
      // system — check OS preference
      const mq = window.matchMedia('(prefers-color-scheme: dark)');
      applyTheme(mq.matches ? 'dark' : 'light');
      const handler = (e: MediaQueryListEvent) => applyTheme(e.matches ? 'dark' : 'light');
      mq.addEventListener('change', handler);
      return () => mq.removeEventListener('change', handler);
    }
  }, [theme]);

  // Read from localStorage on first mount (zustand hydrates async)
  useEffect(() => {
    const initial = getInitialTheme();
    if (initial !== theme) {
      setTheme(initial);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const toggle = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  return (
    <button
      onClick={toggle}
      className="flex h-9 w-9 items-center justify-center rounded-full transition-colors hover:bg-zinc-100 dark:hover:bg-zinc-800"
      aria-label="Toggle theme"
    >
      <AnimatePresence mode="wait">
        {theme === "light" ? (
          <motion.span
            key="sun"
            initial={{ rotate: -90, opacity: 0 }}
            animate={{ rotate: 0, opacity: 1 }}
            exit={{ rotate: 90, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <FiSun className="h-5 w-5 text-amber-500" />
          </motion.span>
        ) : (
          <motion.span
            key="moon"
            initial={{ rotate: 90, opacity: 0 }}
            animate={{ rotate: 0, opacity: 1 }}
            exit={{ rotate: -90, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <FiMoon className="h-5 w-5 text-blue-400" />
          </motion.span>
        )}
      </AnimatePresence>
    </button>
  );
}
