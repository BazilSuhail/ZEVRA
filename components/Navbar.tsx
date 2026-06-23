"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import ThemeToggle from "./ThemeToggle";
import { motion } from "motion/react";
import { FiShield } from "react-icons/fi";

const links = [
  { href: "/", label: "Home" },
  { href: "/about", label: "About" },
];

export default function Navbar() {
  const pathname = usePathname();

  return (
    <motion.nav
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="fixed left-1/2 top-6 z-50 -translate-x-1/2"
    >
      <div className="flex items-center gap-2 rounded-full border border-zinc-200 bg-white/80 px-2 py-2 shadow-lg backdrop-blur-md dark:border-zinc-700 dark:bg-zinc-900/80">
        <Link href="/" className="flex items-center gap-2 rounded-full px-4 py-2 text-sm font-bold transition-colors hover:bg-zinc-100 dark:hover:bg-zinc-800">
          <FiShield className="h-5 w-5 text-emerald-500" />
          <span>Zevra</span>
        </Link>

        <div className="h-5 w-px bg-zinc-200 dark:bg-zinc-700" />

        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
              pathname === link.href
                ? "bg-zinc-900 text-white dark:bg-white dark:text-zinc-900"
                : "text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
            }`}
          >
            {link.label}
          </Link>
        ))}

        <div className="h-5 w-px bg-zinc-200 dark:bg-zinc-700" />

        <ThemeToggle />
      </div>
    </motion.nav>
  );
}
