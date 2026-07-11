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
  FiMenu,
  FiX,
  FiMessageSquare,
} from "react-icons/fi";
import { AnimatePresence, motion } from "motion/react";

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
  const [sheetOpen, setSheetOpen] = useState(false);

  const clearAllData = async () => {
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
    localStorage.clear();
    sessionStorage.clear();
  };

  const handleLogout = async () => {
    setLoggingOut(true);
    setSheetOpen(false);
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

  const isChatRoot = pathname === "/chat";

  // ─── Mobile Bottom Bar ─────────────────────────────────────────────
  const MobileBottomBar = () => {
    if (!isChatRoot) return null;
    return (
      <nav className="fixed inset-x-0 bottom-0 z-50 md:hidden">
      <div className="mx-2 mb-2 flex items-center justify-around rounded-2xl border border-zinc-200 bg-white/90 px-2 py-2 shadow-xl backdrop-blur-xl dark:border-zinc-800 dark:bg-zinc-900/90">
        {/* Logo */}
        <Link
          href="/chat"
          className="flex h-10 w-10 items-center justify-center"
        >
          <Image
            src="/zevra-logo.webp"
            alt="Zevra"
            width={28}
            height={28}
            className="h-7 w-7 object-contain"
          />
        </Link>

        {/* DMs */}
        <Link
          href="/chat"
          className={`flex h-10 w-10 items-center justify-center rounded-xl transition-colors ${
            isChatRoot
              ? "bg-purple-100 text-purple-600 dark:bg-zinc-800 dark:text-purple-400"
              : "text-zinc-500 hover:bg-purple-100 hover:text-purple-600 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-purple-400"
          }`}
        >
          <FiMessageSquare className="h-5 w-5" />
        </Link>

        {/* Calls */}
        <Link
          href="/chat/calls"
          className={`flex h-10 w-10 items-center justify-center rounded-xl transition-colors ${
            isActiveRoute("/chat/calls")
              ? "bg-purple-100 text-purple-600 dark:bg-zinc-800 dark:text-purple-400"
              : "text-zinc-500 hover:bg-purple-100 hover:text-purple-600 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-purple-400"
          }`}
        >
          <FiPhone className="h-5 w-5" />
        </Link>

        {/* Security */}
        <Link
          href="/chat/audit"
          className={`flex h-10 w-10 items-center justify-center rounded-xl transition-colors ${
            isActiveRoute("/chat/audit")
              ? "bg-purple-100 text-purple-600 dark:bg-zinc-800 dark:text-purple-400"
              : "text-zinc-500 hover:bg-purple-100 hover:text-purple-600 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-purple-400"
          }`}
        >
          <FiShield className="h-5 w-5" />
        </Link>

        {/* Avatar / Profile */}
        <Link
          href="/chat/profile"
          className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-tr from-brand to-accent text-xs font-bold text-white"
        >
          {user?.username?.[0]?.toUpperCase() || "U"}
        </Link>

        {/* Hamburger → Bottom Sheet */}
        <button
          onClick={() => setSheetOpen(true)}
          className="flex h-10 w-10 items-center justify-center rounded-xl text-zinc-500 transition-colors hover:bg-purple-100 hover:text-purple-600 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-purple-400"
        >
          <FiMenu className="h-5 w-5" />
        </button>
      </div>
      </nav>
    );
  };

  // ─── Mobile Bottom Sheet ───────────────────────────────────────────
  const MobileBottomSheet = () => (
    <AnimatePresence>
      {sheetOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSheetOpen(false)}
            className="fixed inset-0 z-[60] bg-black/40 backdrop-blur-sm md:hidden"
          />

          {/* Sheet */}
          <motion.div
            initial={{ y: "90%" }}
            animate={{ y: 0 }}
            exit={{ y: "80%" }}
            transition={{ type: "spring", damping: 30, stiffness: 350 }}
            className="fixed inset-x-0 bottom-0 z-[70] flex max-h-[70vh] flex-col rounded-t-3xl border-t border-zinc-200 bg-white shadow-2xl dark:border-zinc-800 dark:bg-zinc-900 md:hidden"
          >
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-2">
              <div className="h-1 w-10 rounded-full bg-zinc-300 dark:bg-zinc-700" />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between px-5 pb-3">
              <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                Menu
              </h3>
              <button
                onClick={() => setSheetOpen(false)}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400"
              >
                <FiX className="h-4 w-4" />
              </button>
            </div>

            <div className="border-t border-zinc-100 dark:border-zinc-800" />

            {/* Items */}
            <div className="flex-1 overflow-y-auto px-3 py-2">
              {/* New Chat */}
              <button
                onClick={() => { setSheetOpen(false); setChatModalOpen(true); }}
                className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
              >
                <FiPlus className="h-5 w-5" />
                New Chat
              </button>

              {/* New Group */}
              <button
                onClick={() => { setSheetOpen(false); setGroupModalOpen(true); }}
                className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
              >
                <FiUsers className="h-5 w-5" />
                New Group
              </button>

              <div className="my-2 border-t border-zinc-100 dark:border-zinc-800" />

              {/* Security */}
              <Link
                href="/chat/audit"
                onClick={() => setSheetOpen(false)}
                className={`flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition-colors ${
                  isActiveRoute("/chat/audit")
                    ? "bg-purple-100 text-purple-600 dark:bg-zinc-800 dark:text-purple-400"
                    : "text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
                }`}
              >
                <FiShield className="h-5 w-5" />
                Security
              </Link>

              <div className="my-2 border-t border-zinc-100 dark:border-zinc-800" />

              {/* Theme */}
              <div className="flex items-center justify-between rounded-xl px-3 py-3">
                <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  Theme
                </span>
                <ThemeToggle />
              </div>

              {/* Logout */}
              <button
                onClick={() => { setSheetOpen(false); setLogoutModalOpen(true); }}
                className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-red-500 transition-colors hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/30"
              >
                <FiLogOut className="h-5 w-5" />
                Logout
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );

  return (
    <>
      {/* ─── Desktop Sidebar ─────────────────────────────────────────── */}
      <aside className="hidden h-full w-18 flex-col items-center border-r border-zinc-200 bg-purple-100/40 py-3 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 dark:shadow-none md:flex">
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
          <div className="pointer-events-none absolute left-full top-1/2 ml-3 hidden -translate-y-1/2 lg:block z-50">
            <div className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full bg-zinc-100 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-zinc-900 opacity-0 shadow-lg ring-1 ring-zinc-200 transition-all duration-200 group-hover:opacity-100 dark:bg-zinc-800 dark:text-zinc-100 dark:ring-zinc-800">
              <div className="h-1.5 w-1.5 rounded-full bg-purple-500" />
              Home
            </div>
          </div>
        </div>

        {/* Top Primary Actions */}
        <div className="mb-2 flex flex-col items-center gap-1.5">
          <div className="relative group">
            <button
              onClick={() => setChatModalOpen(true)}
              className="flex h-10 w-10 items-center justify-center rounded-xl text-zinc-500 transition-all duration-200 hover:bg-purple-100 hover:text-purple-600 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-purple-400"
            >
              <FiPlus className="h-5 w-5" />
            </button>
            <div className="pointer-events-none absolute left-full top-1/2 ml-3 hidden -translate-y-1/2 lg:block z-50">
              <div className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full bg-zinc-100 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-zinc-900 opacity-0 shadow-lg ring-1 ring-zinc-200 transition-all duration-200 group-hover:opacity-100 dark:bg-zinc-800 dark:text-zinc-100 dark:ring-zinc-800">
                <div className="h-1.5 w-1.5 rounded-full bg-purple-500" />
                New Chat
              </div>
            </div>
          </div>

          <div className="relative group">
            <button
              onClick={() => setGroupModalOpen(true)}
              className="flex h-10 w-10 items-center justify-center rounded-xl text-zinc-500 transition-all duration-200 hover:bg-purple-100 hover:text-purple-600 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-purple-400"
            >
              <FiUsers className="h-5 w-5" />
            </button>
            <div className="pointer-events-none absolute left-full top-1/2 ml-3 hidden -translate-y-1/2 lg:block z-50">
              <div className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full bg-zinc-100 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-zinc-900 opacity-0 shadow-lg ring-1 ring-zinc-200 transition-all duration-200 group-hover:opacity-100 dark:bg-zinc-800 dark:text-zinc-100 dark:ring-zinc-800">
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
                      ? "bg-purple-100 text-purple-600 dark:bg-zinc-800 dark:text-purple-400"
                      : "text-zinc-500 hover:bg-purple-100 hover:text-purple-600 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-purple-400"
                  }`}
                >
                  <item.icon className="h-5 w-5" />
                </Link>
                <div className="pointer-events-none absolute left-full top-1/2 ml-3 hidden -translate-y-1/2 lg:block z-50">
                  <div className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full bg-zinc-100 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-zinc-900 opacity-0 shadow-lg ring-1 ring-zinc-200 transition-all duration-200 group-hover:opacity-100 dark:bg-zinc-800 dark:text-zinc-100 dark:ring-zinc-800">
                    <div className="h-1.5 w-1.5 rounded-full bg-purple-500" />
                    {item.label}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* User Profile + Logout */}
        <div className="flex flex-col items-center gap-1.5 border-t border-zinc-200 pt-3 dark:border-zinc-800">
          <div className="relative group">
            <Link
              href="/chat/profile"
              className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-tr from-brand to-accent text-sm font-semibold text-white shadow-xs transition-transform duration-200 hover:scale-105"
            >
              {user?.username?.[0]?.toUpperCase() || "U"}
            </Link>
            <div className="pointer-events-none absolute left-full top-1/2 ml-3 hidden -translate-y-1/2 lg:block z-50">
              <div className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full bg-zinc-100 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-zinc-900 opacity-0 shadow-lg ring-1 ring-zinc-200 transition-all duration-200 group-hover:opacity-100 dark:bg-zinc-800 dark:text-zinc-100 dark:ring-zinc-800">
                <div className="h-1.5 w-1.5 rounded-full bg-purple-500" />
                {user?.username || "Profile"}
              </div>
            </div>
          </div>

          <div className="relative group">
            <button
              onClick={() => setLogoutModalOpen(true)}
              disabled={loggingOut}
              className="flex h-10 w-10 items-center justify-center rounded-xl text-zinc-500 transition-all duration-200 hover:bg-purple-100 hover:text-purple-600 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-purple-400 disabled:opacity-50"
            >
              {loggingOut ? (
                <FiLoader className="h-5 w-5 animate-spin" />
              ) : (
                <FiLogOut className="h-5 w-5" />
              )}
            </button>
            <div className="pointer-events-none absolute left-full top-1/2 ml-3 hidden -translate-y-1/2 lg:block z-50">
              <div className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full bg-zinc-100 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-red-600 opacity-0 shadow-lg ring-1 ring-zinc-200 transition-all duration-200 group-hover:opacity-100 dark:bg-zinc-900 dark:text-red-400 dark:ring-zinc-600">
                <div className="h-1.5 w-1.5 rounded-full bg-red-500" />
                {loggingOut ? "Logging out..." : "Logout"}
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* ─── Mobile ────────────────────────────────────────────────────── */}
      <MobileBottomBar />
      <MobileBottomSheet />

      <NewChatModal open={chatModalOpen} onClose={() => setChatModalOpen(false)} />
      <NewGroupModal open={groupModalOpen} onClose={() => setGroupModalOpen(false)} />
      <ConfirmLogoutModal open={logoutModalOpen} onClose={() => setLogoutModalOpen(false)} onConfirm={handleLogout} loading={loggingOut} />
    </>
  );
}
