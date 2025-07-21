"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { FiSun, FiMoon } from "react-icons/fi";
import { useUiStore } from "@/context/stores";
import type { Theme } from "@/context/stores/ui-store";

/** Apply theme to `<html>` — `dark` drives the Tailwind `dark:` variant */
function applyTheme(theme: "light" | "dark") {
  document.documentElement.classList.toggle("dark", theme === "dark");
}

/** Read persisted theme from localStorage, null when unset/invalid */
function getStoredTheme(): Theme | null {
  if (typeof window === "undefined") return null;
  const saved = localStorage.getItem("zevra-ui");
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      const t = parsed.state?.theme;
      if (t === "light" || t === "dark" || t === "system") return t;
    } catch {}
  }
  return null;
}

export default function ThemeToggle() {
  const theme = useUiStore((s) => s.theme);
  const setTheme = useUiStore((s) => s.setTheme);
  const [isLight, setIsLight] = useState(false);

  // Sync on mount + when theme changes
  useEffect(() => {
    if (theme === 'light' || theme === 'dark') {
      applyTheme(theme);
      setIsLight(theme === 'light');
    } else {
      // system — check OS preference
      const mq = window.matchMedia('(prefers-color-scheme: dark)');
      applyTheme(mq.matches ? 'dark' : 'light');
      setIsLight(!mq.matches);
      const handler = (e: MediaQueryListEvent) => {
        applyTheme(e.matches ? 'dark' : 'light');
        setIsLight(!e.matches);
      };
      mq.addEventListener('change', handler);
      return () => mq.removeEventListener('change', handler);
    }
  }, [theme]);

  // Adopt the persisted theme once (zustand hydrates async).
  // 'system' is left alone so OS preference keeps working.
  useEffect(() => {
    const stored = getStoredTheme();
    if (stored && stored !== theme) {
      setTheme(stored);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const toggle = () => {
    const resolved =
      theme === "system"
        ? window.matchMedia("(prefers-color-scheme: dark)").matches
          ? "dark"
          : "light"
        : theme;
    setTheme(resolved === "dark" ? "light" : "dark");
  };

  return (
    <button
      onClick={toggle}
      className="flex h-9 w-9 items-center justify-center rounded-full transition-colors hover:bg-zinc-100 dark:hover:bg-zinc-800"
      aria-label="Toggle theme"
    >
      <AnimatePresence mode="wait">
        {isLight ? (
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
