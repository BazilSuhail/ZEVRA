"use client";

import { useEffect, useState } from "react";

const PATTERN = (stroke: string) =>
  `url("data:image/svg+xml,%3Csvg width='80' height='80' viewBox='0 0 80 80' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg stroke='%23${stroke}' stroke-width='1.2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M12 20h10M12 32h6M12 44h10'/%3E%3Crect x='50' y='16' width='16' height='12' rx='2.5'/%3E%3Cpath d='M54 28v4a2.5 2.5 0 002.5 2.5h2.5l4 4v-4h1.5a2.5 2.5 0 002.5-2.5v-4'/%3E%3Ccircle cx='35' cy='50' r='6'/%3E%3Cpath d='M35 44v-2.5M35 56v-2.5M29 50h-2.5M41 50h-2.5'/%3E%3Cpath d='M62 46l-4 4M58 50l-4-4'/%3E%3Ccircle cx='20' cy='64' r='2.5'/%3E%3Ccircle cx='65' cy='10' r='2.5'/%3E%3Cpath d='M68 60l-2 2M70 58l-2-2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`;

const LIGHT = PATTERN("000000");
const DARK = PATTERN("ffffff");

/** Subtle doodle pattern behind the conversation (follows the theme class). */
export default function ChatBackdrop() {
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    const check = () => setDarkMode(document.documentElement.classList.contains("dark"));
    check();
    const obs = new MutationObserver(check);
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    return () => obs.disconnect();
  }, []);

  return (
    <div
      className="pointer-events-none absolute inset-0 z-0 opacity-[0.1]"
      style={{ backgroundImage: darkMode ? DARK : LIGHT, backgroundRepeat: "repeat" }}
    />
  );
}
