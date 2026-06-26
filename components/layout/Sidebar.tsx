"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion } from "motion/react";
import { useAuth } from "@/context/useAuth";
import ThemeToggle from "@/components/theme/ThemeToggle";
import {
  FiPlus,
  FiSettings,
  FiUser,
  FiKey,
  FiClipboard,
  FiSearch,
  FiLogOut,
  FiUsers,
  FiMessageSquare,
} from "react-icons/fi";

const navItems = [
  { href: "/chat/new", icon: FiPlus, label: "New Chat" },
  { href: "/chat/new?group=true", icon: FiUsers, label: "New Group" },
  { href: "/chat/search", icon: FiSearch, label: "Search" },
];

const bottomItems = [
  { href: "/chat/settings", icon: FiSettings, label: "Settings" },
  { href: "/chat/profile", icon: FiUser, label: "Profile" },
  { href: "/chat/keys", icon: FiKey, label: "Keys" },
  { href: "/chat/audit", icon: FiClipboard, label: "Audit" },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  return (
    <aside className="flex h-full w-[68px] flex-col items-center border-r border-zinc-200 bg-white py-3 dark:border-zinc-800 dark:bg-zinc-900">
      {/* Logo */}
      <Link href="/chat" className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-600 text-white transition-colors hover:bg-emerald-700" title="Home">
        <FiMessageSquare className="h-5 w-5" />
      </Link>

      {/* Top Actions */}
      <div className="mb-2 flex flex-col items-center gap-1">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            title={item.label}
            className={`flex h-10 w-10 items-center justify-center rounded-xl transition-colors ${
              pathname === item.href || (item.href.includes("?") && pathname.includes(item.href.split("?")[0]))
                ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400"
                : "text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-white"
            }`}
          >
            <item.icon className="h-5 w-5" />
          </Link>
        ))}
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Bottom Actions */}
      <div className="mb-2 flex flex-col items-center gap-1">
        <ThemeToggle />
        {bottomItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            title={item.label}
            className={`flex h-10 w-10 items-center justify-center rounded-xl transition-colors ${
              pathname === item.href
                ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400"
                : "text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-white"
            }`}
          >
            <item.icon className="h-5 w-5" />
          </Link>
        ))}
      </div>

      {/* User + Logout */}
      <div className="flex flex-col items-center gap-1 border-t border-zinc-200 pt-2 dark:border-zinc-800">
        <Link href="/chat/profile" title={user?.username || "Profile"} className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 text-sm font-bold text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400">
          {user?.username?.[0] || "U"}
        </Link>
        <button
          onClick={handleLogout}
          title="Logout"
          className="flex h-10 w-10 items-center justify-center rounded-xl text-zinc-500 transition-colors hover:bg-red-50 hover:text-red-500 dark:text-zinc-400 dark:hover:bg-red-900/20"
        >
          <FiLogOut className="h-5 w-5" />
        </button>
      </div>
    </aside>
  );
}
