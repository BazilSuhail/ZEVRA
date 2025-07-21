"use client";

import { useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import {
  FiCheck,
  FiChevronRight,
  FiEdit2,
  FiMail,
  FiUser,
  FiShield,
  FiCalendar,
  FiMoon,
  FiSun,
  FiMonitor,
  FiPhone,
} from "react-icons/fi";
import { useAuthStore } from "@/context/stores";
import { useUiStore } from "@/context/stores/ui-store";
import type { Theme } from "@/context/stores/ui-store";
import { useCallStore } from "@/context/stores/call-store";
import { api } from "@/utils/api";

const GRID_IMAGE =
  "linear-gradient(to right, rgba(255,255,255,0.28) 1px, transparent 1px), " +
  "linear-gradient(to bottom, rgba(255,255,255,0.28) 1px, transparent 1px)";

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-indigo-500">
      {children}
    </p>
  );
}

function Toggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={onChange}
      className={`relative h-6 w-11 shrink-0 rounded-full p-1 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500 ${
        checked ? "bg-indigo-600" : "bg-zinc-300 dark:bg-zinc-700"
      }`}
    >
      <span
        className={`block h-4 w-4 rounded-full bg-white shadow-sm transition-transform duration-200 ${
          checked ? "translate-x-5" : "translate-x-0"
        }`}
      />
    </button>
  );
}

export default function ProfilePage() {
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);
  const theme = useUiStore((s) => s.theme);
  const setTheme = useUiStore((s) => s.setTheme);
  const ringtoneEnabled = useCallStore((s) => s.ringtoneEnabled);
  const setRingtoneEnabled = useCallStore((s) => s.setRingtoneEnabled);

  const [name, setName] = useState(user?.username || "");
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const initials = user?.username
    ? user.username
        .split(" ")
        .map((w) => w[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "U";

  const themeOptions: { value: Theme; label: string; icon: typeof FiMoon }[] = [
    { value: "dark", label: "Dark", icon: FiMoon },
    { value: "light", label: "Light", icon: FiSun },
    { value: "system", label: "System", icon: FiMonitor },
  ];

  const themeHint =
    theme === "dark"
      ? "Dark mode is on"
      : theme === "light"
        ? "Light mode is on"
        : "Follows your system preference";

  const tiles = [
    { icon: FiUser, label: "Username", value: user?.username || "—" },
    { icon: FiMail, label: "Email", value: user?.email || "—" },
    { icon: FiShield, label: "Encryption", value: "E2EE Active", accent: true },
    {
      icon: FiCalendar,
      label: "Joined",
      value: user?.createdAt
        ? new Date(user.createdAt).toLocaleDateString()
        : "—",
    },
  ];

  const handleSave = async () => {
    if (!name.trim() || name.trim() === user?.username) {
      setEditing(false);
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const updated = await api.put<{ id: string; username: string; email: string }>(
        "/api/users/me",
        { username: name.trim() }
      );
      setUser({ ...user!, username: updated.username });
      setEditing(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err: any) {
      setError(err?.response?.data?.message || "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setName(user?.username || "");
    setEditing(false);
    setError(null);
  };

  return (
    <div className="flex flex-1 flex-col overflow-y-auto bg-[#fbfcfd] dark:bg-zinc-950">
      <header className="sticky top-0 z-10 border-b border-zinc-200 bg-white/85 px-6 py-5 backdrop-blur-xl dark:border-zinc-800 dark:bg-zinc-900/85">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-indigo-500">
          Account &amp; Preferences
        </p>
        <h1 className="mt-1 text-2xl font-semibold">Profile</h1>
      </header>

      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="mx-auto w-full space-y-8 p-6"
      >
        {/* ─── Identity ─────────────────────────────────────────────── */}
        <section>
          <SectionLabel>Identity</SectionLabel>

          <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
            {/* Banner */}
            <div className="relative h-28 overflow-hidden bg-gradient-to-r from-indigo-600 via-purple-600 to-violet-600 sm:h-32">
              <div
                aria-hidden
                className="absolute inset-0 opacity-40"
                style={{ backgroundImage: GRID_IMAGE, backgroundSize: "26px 26px" }}
              />
              <div
                aria-hidden
                className="absolute inset-0 bg-[radial-gradient(ellipse_at_18%_-30%,rgba(255,255,255,0.4),transparent_60%)]"
              />
            </div>

            <div className="px-6 pb-6 sm:px-8">
              {/* Avatar + actions */}
              <div className="-mt-10 flex items-end justify-between gap-4">
                <div className="rounded-full ring-4 ring-white dark:ring-zinc-950">
                  <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-tr from-indigo-600 to-violet-500 text-2xl font-semibold text-white shadow-lg">
                    {initials}
                  </div>
                </div>

                <div className="flex gap-2 pb-2">
                  {editing && (
                    <button
                      onClick={handleCancel}
                      className="rounded-lg bg-zinc-100 px-3 py-2 text-xs font-semibold text-zinc-600 transition-colors hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-700"
                    >
                      Cancel
                    </button>
                  )}
                  <button
                    onClick={() => (editing ? handleSave() : setEditing(true))}
                    disabled={saving}
                    className="flex items-center gap-2 rounded-lg bg-indigo-600 px-3.5 py-2 text-xs font-semibold text-white transition-colors hover:bg-indigo-500 disabled:opacity-60 dark:bg-indigo-500 dark:hover:bg-indigo-400"
                  >
                    {saving ? (
                      <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    ) : editing ? (
                      <FiCheck className="h-3.5 w-3.5" />
                    ) : (
                      <FiEdit2 className="h-3.5 w-3.5" />
                    )}
                    {editing ? "Save" : "Edit"}
                  </button>
                </div>
              </div>

              {/* Name + email */}
              <div className="mt-4">
                {editing ? (
                  <input
                    autoFocus
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSave()}
                    className="w-full rounded-lg border border-indigo-300 bg-transparent px-3 py-2 text-lg font-semibold outline-none focus:ring-2 focus:ring-indigo-500/40 dark:border-indigo-700 dark:bg-zinc-800"
                  />
                ) : (
                  <h2 className="truncate text-xl font-semibold">
                    {user?.username || "Unknown"}
                  </h2>
                )}
                <p className="mt-1 flex items-center gap-1.5 truncate text-sm text-zinc-500 dark:text-zinc-400">
                  <FiMail className="h-4 w-4 shrink-0" />
                  {user?.email || "No email"}
                </p>

                <AnimatePresence>
                  {saved && (
                    <motion.p
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="mt-3 flex items-center gap-2 text-xs font-semibold text-emerald-600 dark:text-emerald-400"
                    >
                      <FiCheck className="h-3.5 w-3.5" /> Profile updated
                    </motion.p>
                  )}
                  {error && (
                    <motion.p
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="mt-3 text-xs font-semibold text-red-500"
                    >
                      {error}
                    </motion.p>
                  )}
                </AnimatePresence>
              </div>

              {/* Info tiles */}
              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                {tiles.map((t) => (
                  <div
                    key={t.label}
                    className="rounded-xl border border-zinc-100 bg-zinc-50 p-4 transition-colors hover:border-indigo-200 dark:border-zinc-800 dark:bg-zinc-800/60 dark:hover:border-indigo-900"
                  >
                    <t.icon
                      className={`mb-3 h-4 w-4 ${
                        t.accent ? "text-emerald-500" : "text-zinc-400"
                      }`}
                    />
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">
                      {t.label}
                    </p>
                    <p className="mt-1 truncate text-sm font-semibold">{t.value}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ─── Preferences ──────────────────────────────────────────── */}
        <section>
          <SectionLabel>Preferences</SectionLabel>

          <div className="space-y-3">
            {/* Appearance */}
            <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
              <div className="mb-4 flex items-center gap-3">
                {theme === "dark" ? (
                  <FiMoon className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                ) : theme === "light" ? (
                  <FiSun className="h-4 w-4 text-amber-500" />
                ) : (
                  <FiMonitor className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                )}
                <div>
                  <p className="font-semibold">Appearance</p>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    {themeHint}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-1 rounded-xl bg-zinc-100 p-1 dark:bg-zinc-800">
                {themeOptions.map((opt) => {
                  const Icon = opt.icon;
                  const active = theme === opt.value;
                  return (
                    <button
                      key={opt.value}
                      onClick={() => setTheme(opt.value)}
                      className="relative flex items-center justify-center rounded-lg px-3 py-2.5"
                    >
                      {active && (
                        <motion.span
                          layoutId="theme-pill"
                          transition={{ type: "spring", stiffness: 420, damping: 34 }}
                          className="absolute inset-0 rounded-lg bg-white shadow-sm ring-1 ring-zinc-200 dark:bg-zinc-950 dark:ring-zinc-700"
                        />
                      )}
                      <span
                        className={`relative flex items-center gap-1.5 text-xs font-semibold transition-colors ${
                          active
                            ? "text-indigo-600 dark:text-indigo-400"
                            : "text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
                        }`}
                      >
                        <Icon className="h-3.5 w-3.5" />
                        {opt.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Call ringtone */}
            <div className="flex items-center justify-between gap-4 rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
              <div className="flex items-center gap-3">
                <FiPhone className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                <div>
                  <p className="font-semibold">Call Ringtone</p>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    Play a sound for incoming calls
                  </p>
                </div>
              </div>
              <Toggle
                checked={ringtoneEnabled}
                onChange={() => setRingtoneEnabled(!ringtoneEnabled)}
                label="Call ringtone"
              />
            </div>
          </div>
        </section>

        {/* ─── Security ─────────────────────────────────────────────── */}
        <section>
          <SectionLabel>Security</SectionLabel>

          <Link
            href="/chat/audit"
            className="flex items-center justify-between gap-4 rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm transition-colors hover:border-indigo-300 hover:bg-indigo-50/50 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-indigo-800 dark:hover:bg-indigo-950/30"
          >
            <div className="flex items-center gap-3">
              <FiShield className="h-4 w-4 text-emerald-500" />
              <div>
                <p className="font-semibold">Security Audit Log</p>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  Review key rotations and account activity
                </p>
              </div>
            </div>
            <FiChevronRight className="h-4 w-4 shrink-0 text-zinc-400" />
          </Link>
        </section>
      </motion.div>
    </div>
  );
}
