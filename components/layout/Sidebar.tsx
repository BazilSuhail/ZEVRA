"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuthStore } from "@/context/stores";
import { api } from "@/utils";
import { API } from "@/constants";
import { disconnectSocket } from "@/lib/socket";
import ThemeToggle from "@/components/theme/ThemeToggle";
import NewChatModal from "@/components/modals/NewChatModal";
import NewGroupModal from "@/components/modals/NewGroupModal";
import {
  FiPlus,
  FiSettings,
  FiUser,
  FiShield,
  FiLogOut,
  FiUsers,
} from "react-icons/fi";

const bottomItems = [
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

  const handleLogout = async () => {
    try {
      await api.post(API.AUTH.LOGOUT);
    } catch {}
    disconnectSocket();
    logout();
    router.push("/auth/login");
  };

  const isActiveRoute = (href: string) => {
    return pathname === href;
  };

  return (
    <>
      <aside className="flex h-full w-17 border-r border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900 flex-col items-center py-3 ">
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
            <div className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full bg-zinc-100 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-zinc-900 opacity-0 shadow-lg ring-1 ring-zinc-200 transition-all duration-200 group-hover:opacity-100 dark:bg-zinc-900 dark:text-zinc-100 dark:ring-zinc-800">
              <div className="h-1.5 w-1.5 rounded-full bg-indigo-500" />
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
              className={`flex h-10 w-10 items-center justify-center rounded-xl transition-all duration-200 ${
                "text-zinc-500 hover:bg-zinc-200/60 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800/60 dark:hover:text-zinc-100"
              }`}
            >
              <FiPlus className="h-5 w-5" />
            </button>
            <div className="pointer-events-none absolute left-full top-1/2 ml-3 hidden -translate-y-1/2 md:block z-50">
              <div className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full bg-zinc-100 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-zinc-900 opacity-0 shadow-lg ring-1 ring-zinc-200 transition-all duration-200 group-hover:opacity-100 dark:bg-zinc-900 dark:text-zinc-100 dark:ring-zinc-800">
                <div className="h-1.5 w-1.5 rounded-full bg-indigo-500" />
                New Chat
              </div>
            </div>
          </div>

          {/* New Group Button */}
          <div className="relative group">
            <button
              onClick={() => setGroupModalOpen(true)}
              className={`flex h-10 w-10 items-center justify-center rounded-xl transition-all duration-200 ${
                "text-zinc-500 hover:bg-zinc-200/60 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800/60 dark:hover:text-zinc-100"
              }`}
            >
              <FiUsers className="h-5 w-5" />
            </button>
            <div className="pointer-events-none absolute left-full top-1/2 ml-3 hidden -translate-y-1/2 md:block z-50">
              <div className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full bg-zinc-100 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-zinc-900 opacity-0 shadow-lg ring-1 ring-zinc-200 transition-all duration-200 group-hover:opacity-100 dark:bg-zinc-900 dark:text-zinc-100 dark:ring-zinc-800">
                <div className="h-1.5 w-1.5 rounded-full bg-indigo-500" />
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
                      ? "bg-zinc-200/80 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100"
                      : "text-zinc-500 hover:bg-zinc-200/60 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800/60 dark:hover:text-zinc-100"
                  }`}
                >
                  <item.icon className="h-5 w-5" />
                </Link>
                <div className="pointer-events-none absolute left-full top-1/2 ml-3 hidden -translate-y-1/2 md:block z-50">
                  <div className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full bg-zinc-100 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-zinc-900 opacity-0 shadow-lg ring-1 ring-zinc-200 transition-all duration-200 group-hover:opacity-100 dark:bg-zinc-900 dark:text-zinc-100 dark:ring-zinc-800">
                    <div className="h-1.5 w-1.5 rounded-full bg-indigo-500" />
                    {item.label}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* User Profile + Logout */}
        <div className="flex flex-col items-center gap-1.5 border-t border-zinc-200/80 pt-3 dark:border-zinc-800/80">
          <div className="relative group">
            <Link
              href="/chat/profile"
              className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-tr from-indigo-600 to-violet-500 text-sm font-semibold text-white shadow-xs transition-transform duration-200 hover:scale-105"
            >
              {user?.username?.[0]?.toUpperCase() || "U"}
            </Link>
            <div className="pointer-events-none absolute left-full top-1/2 ml-3 hidden -translate-y-1/2 md:block z-50">
              <div className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full bg-zinc-100 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-zinc-900 opacity-0 shadow-lg ring-1 ring-zinc-200 transition-all duration-200 group-hover:opacity-100 dark:bg-zinc-900 dark:text-zinc-100 dark:ring-zinc-800">
                <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                {user?.username || "Profile"}
              </div>
            </div>
          </div>

          <div className="relative group">
            <button
              onClick={handleLogout}
              className="flex h-10 w-10 items-center justify-center rounded-xl text-zinc-500 transition-all duration-200 hover:bg-rose-50 hover:text-rose-600 dark:text-zinc-400 dark:hover:bg-rose-950/30 dark:hover:text-rose-400"
            >
              <FiLogOut className="h-5 w-5" />
            </button>
            <div className="pointer-events-none absolute left-full top-1/2 ml-3 hidden -translate-y-1/2 md:block z-50">
              <div className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full bg-zinc-100 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-rose-600 opacity-0 shadow-lg ring-1 ring-zinc-200 transition-all duration-200 group-hover:opacity-100 dark:bg-zinc-900 dark:text-rose-400 dark:ring-zinc-800">
                <div className="h-1.5 w-1.5 rounded-full bg-rose-500" />
                Logout
              </div>
            </div>
          </div>
        </div>
      </aside>

      <NewChatModal open={chatModalOpen} onClose={() => setChatModalOpen(false)} />
      <NewGroupModal open={groupModalOpen} onClose={() => setGroupModalOpen(false)} />
    </>
  );
}
