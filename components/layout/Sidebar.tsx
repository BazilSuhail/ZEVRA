"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuthStore } from "@/context/stores";
import { api } from "@/utils";

import { disconnectSocket } from "@/lib/socket";
import ThemeToggle from "@/components/theme/ThemeToggle";
import NewChatModal from "@/components/modals/NewChatModal";
import NewGroupModal from "@/components/modals/NewGroupModal";
import ConfirmLogoutModal from "@/components/modals/ConfirmLogoutModal";
import {
  FiPlus,
  FiSettings,
  FiUser,
  FiShield,
  FiLogOut,
  FiUsers,
  FiPhone,
  FiLoader,
} from "react-icons/fi";

const bottomItems = [
  { href: "/chat/calls", icon: FiPhone, label: "Calls" },
  { href: "/chat/settings", icon: FiSettings, label: "Settings" },
  { href: "/chat/profile", icon: FiUser, label: "Profile" },
  { href: "/chat/audit", icon: FiShield, label: "Security" },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const [chatModalOpen, setChatModalOpen] = useState(false);
  const [groupModalOpen, setGroupModalOpen] = useState(false);
  const [logoutModalOpen, setLogoutModalOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const clearAllData = async () => {
    // Clear IndexedDB
    const databases = await indexedDB.databases();
    await Promise.all(
      databases.map((db) => {
        if (db.name) {
          return new Promise<void>((resolve, reject) => {
            const req = indexedDB.deleteDatabase(db.name!);
            req.onsuccess = () => resolve();
            req.onerror = () => reject(req.error);
            req.onblocked = () => resolve();
          });
        }
      })
    );
    // Clear storage
    localStorage.clear();
    sessionStorage.clear();
  };

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await api.post("/api/auth/logout");
    } catch {}
    disconnectSocket();
    await clearAllData();
    logout();
    router.push("/auth/login");
  };

  const isActiveRoute = (href: string) => {
    return pathname === href;
  };

  return (
    <>
      {/* 
        Sidebar
        bg: light=#ffffff (zinc-50) / dark=#27272a (zinc-800)
        border: light=#e4e4e7 (zinc-200) / dark=#3f3f46 (zinc-700)
      */}
      <aside className="flex h-full sm:w-15 lg:w-18 border-r border-zinc-200 dark:border-zinc-800 bg-purple-100/40 dark:bg-zinc-900 flex-col items-center py-3 shadow-sm dark:shadow-none">
        {/* Top Brand Logo */}
        <div className="relative group mb-5">
          <Link
            href="/chat"
            className="flex h-10 w-10 items-center justify-center transition-transform duration-200 hover:scale-110"
          >
            <Image
              src="/zevra-logo.webp"
              alt="Zevra Logo"
              width={32}
              height={32}
              className="h-8 w-8 object-contain"
              priority
            />
          </Link>
          <div className="pointer-events-none absolute left-full top-1/2 ml-3 hidden -translate-y-1/2 md:block z-50">
            {/* Tooltip: bg light=#f4f4f5 (zinc-100) / dark=#27272a (zinc-800) */}
            <div className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full bg-zinc-100 dark:bg-zinc-800 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-zinc-900 dark:text-zinc-100 opacity-0 shadow-lg ring-1 ring-zinc-200 dark:ring-zinc-800 transition-all duration-200 group-hover:opacity-100">
              <div className="h-1.5 w-1.5 rounded-full bg-purple-500" />
              Home
            </div>
          </div>
        </div>

        {/* Top Primary Actions */}
        <div className="mb-2 flex flex-col items-center gap-1.5">
          {/* New Chat Button */}
          <div className="relative group">
            <button
              onClick={() => setChatModalOpen(true)}
              className="flex h-10 w-10 items-center justify-center rounded-xl text-zinc-500 dark:text-zinc-400 transition-all duration-200 hover:bg-purple-100 dark:hover:bg-zinc-800 hover:text-purple-600 dark:hover:text-purple-400"
            >
              <FiPlus className="h-5 w-5" />
            </button>
            <div className="pointer-events-none absolute left-full top-1/2 ml-3 hidden -translate-y-1/2 md:block z-50">
              <div className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full bg-zinc-100 dark:bg-zinc-800 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-zinc-900 dark:text-zinc-100 opacity-0 shadow-lg ring-1 ring-zinc-200 dark:ring-zinc-800 transition-all duration-200 group-hover:opacity-100">
                <div className="h-1.5 w-1.5 rounded-full bg-purple-500" />
                New Chat
              </div>
            </div>
          </div>

          {/* New Group Button */}
          <div className="relative group">
            <button
              onClick={() => setGroupModalOpen(true)}
              className="flex h-10 w-10 items-center justify-center rounded-xl text-zinc-500 dark:text-zinc-400 transition-all duration-200 hover:bg-purple-100 dark:hover:bg-zinc-800 hover:text-purple-600 dark:hover:text-purple-400"
            >
              <FiUsers className="h-5 w-5" />
            </button>
            <div className="pointer-events-none absolute left-full top-1/2 ml-3 hidden -translate-y-1/2 md:block z-50">
              <div className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full bg-zinc-100 dark:bg-zinc-800 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-zinc-900 dark:text-zinc-100 opacity-0 shadow-lg ring-1 ring-zinc-200 dark:ring-zinc-800 transition-all duration-200 group-hover:opacity-100">
                <div className="h-1.5 w-1.5 rounded-full bg-purple-500" />
                New Group
              </div>
            </div>
          </div>
        </div>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Bottom Secondary Actions */}
        <div className="mb-3 flex flex-col items-center gap-1.5">
          <ThemeToggle />

          {bottomItems.map((item) => {
            const active = isActiveRoute(item.href);
            return (
              <div key={item.href} className="relative group">
                <Link
                  href={item.href}
                  className={`flex h-10 w-10 items-center justify-center rounded-xl transition-all duration-200 ${
                    active
                      ? "bg-purple-100 dark:bg-zinc-800 text-purple-600 dark:text-purple-400"
                      : "text-zinc-500 dark:text-zinc-400 hover:bg-purple-100 dark:hover:bg-zinc-800 hover:text-purple-600 dark:hover:text-purple-400"
                  }`}
                >
                  <item.icon className="h-5 w-5" />
                </Link>
                <div className="pointer-events-none absolute left-full top-1/2 ml-3 hidden -translate-y-1/2 md:block z-50">
                  <div className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full bg-zinc-100 dark:bg-zinc-800 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-zinc-900 dark:text-zinc-100 opacity-0 shadow-lg ring-1 ring-zinc-200 dark:ring-zinc-800 transition-all duration-200 group-hover:opacity-100">
                    <div className="h-1.5 w-1.5 rounded-full bg-purple-500" />
                    {item.label}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* User Profile + Logout */}
        <div className="flex flex-col items-center gap-1.5 border-t border-zinc-200 dark:border-zinc-800 pt-3">
          <div className="relative group">
            <Link
              href="/chat/profile"
              className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-tr from-brand to-accent text-sm font-semibold text-white shadow-xs transition-transform duration-200 hover:scale-105"
            >
              {user?.username?.[0]?.toUpperCase() || "U"}
            </Link>
            <div className="pointer-events-none absolute left-full top-1/2 ml-3 hidden -translate-y-1/2 md:block z-50">
              <div className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full bg-zinc-100 dark:bg-zinc-800 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-zinc-900 dark:text-zinc-100 opacity-0 shadow-lg ring-1 ring-zinc-200 dark:ring-zinc-800 transition-all duration-200 group-hover:opacity-100">
                <div className="h-1.5 w-1.5 rounded-full bg-purple-500" />
                {user?.username || "Profile"}
              </div>
            </div>
          </div>

          <div className="relative group">
            <button
              onClick={() => setLogoutModalOpen(true)}
              disabled={loggingOut}
              className="flex h-10 w-10 items-center justify-center rounded-xl text-zinc-500 dark:text-zinc-400 transition-all duration-200 hover:bg-purple-100 dark:hover:bg-zinc-800 hover:text-purple-600 dark:hover:text-purple-400 disabled:opacity-50"
            >
              {loggingOut ? (
                <FiLoader className="h-5 w-5 animate-spin" />
              ) : (
                <FiLogOut className="h-5 w-5" />
              )}
            </button>
            <div className="pointer-events-none absolute left-full top-1/2 ml-3 hidden -translate-y-1/2 md:block z-50">
              <div className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full bg-zinc-100 dark:bg-zinc-900 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-red-600 dark:text-red-400 opacity-0 shadow-lg ring-1 ring-zinc-200 dark:ring-zinc-600 transition-all duration-200 group-hover:opacity-100">
                <div className="h-1.5 w-1.5 rounded-full bg-red-500" />
                {loggingOut ? "Logging out..." : "Logout"}
              </div>
            </div>
          </div>
        </div>
      </aside>

      <NewChatModal open={chatModalOpen} onClose={() => setChatModalOpen(false)} />
      <NewGroupModal open={groupModalOpen} onClose={() => setGroupModalOpen(false)} />
      <ConfirmLogoutModal open={logoutModalOpen} onClose={() => setLogoutModalOpen(false)} onConfirm={handleLogout} />
    </>
  );
}
