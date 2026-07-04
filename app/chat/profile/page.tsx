"use client";

import { useState } from "react";
import { FiCheck, FiEdit2, FiMail, FiUser, FiShield, FiCalendar } from "react-icons/fi";
import { useAuthStore } from "@/context/stores";
import { api } from "@/utils/api";

export default function ProfilePage() {
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);

  const [name, setName] = useState(user?.username || "");
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const initials = user?.username
    ? user.username.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2)
    : "U";

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
      <header className="border-b border-zinc-200 bg-white px-6 py-6 dark:border-zinc-800 dark:bg-zinc-900">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-indigo-500">Account</p>
        <h1 className="mt-1 text-2xl font-bold">Profile</h1>
      </header>

      <div className="mx-auto w-full  p-6">
        {/* Avatar + Name */}
        <div className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-tr from-indigo-600 to-violet-500 text-xl font-bold text-white">
              {initials}
            </div>
            <div className="flex-1">
              {editing ? (
                <input
                  autoFocus
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSave()}
                  className="rounded-lg border border-indigo-300 px-3 py-2 text-lg font-semibold outline-none focus:ring-2 focus:ring-indigo-500/40 dark:border-indigo-700 dark:bg-zinc-800"
                />
              ) : (
                <h2 className="text-xl font-bold">{user?.username || "Unknown"}</h2>
              )}
              <p className="mt-1 flex items-center gap-1 text-sm text-zinc-500">
                <FiMail /> {user?.email || "No email"}
              </p>
            </div>
            <div className="flex gap-2">
              {editing && (
                <button
                  onClick={handleCancel}
                  className="rounded-lg bg-zinc-100 px-3 py-2 text-xs font-semibold text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-400"
                >
                  Cancel
                </button>
              )}
              <button
                onClick={() => (editing ? handleSave() : setEditing(true))}
                disabled={saving}
                className="rounded-lg bg-indigo-50 p-2 text-indigo-600 hover:bg-indigo-100 dark:bg-indigo-950/40 dark:text-indigo-400"
              >
                {saving ? (
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
                ) : editing ? (
                  <FiCheck />
                ) : (
                  <FiEdit2 />
                )}
              </button>
            </div>
          </div>

          {saved && (
            <p className="mt-4 flex items-center gap-2 text-xs font-semibold text-emerald-600">
              <FiCheck /> Profile updated
            </p>
          )}
          {error && (
            <p className="mt-4 text-xs font-semibold text-red-500">{error}</p>
          )}

          {/* Info cards */}
          <div className="mt-7 grid gap-3 sm:grid-cols-2">
            <div className="rounded-lg bg-zinc-50 p-4 dark:bg-zinc-800">
              <FiUser className="mb-3 text-zinc-400" />
              <p className="text-xs text-zinc-500">Username</p>
              <p className="mt-1 text-sm font-semibold">{user?.username || "—"}</p>
            </div>
            <div className="rounded-lg bg-zinc-50 p-4 dark:bg-zinc-800">
              <FiMail className="mb-3 text-zinc-400" />
              <p className="text-xs text-zinc-500">Email</p>
              <p className="mt-1 text-sm font-semibold">{user?.email || "—"}</p>
            </div>
            <div className="rounded-lg bg-zinc-50 p-4 dark:bg-zinc-800">
              <FiShield className="mb-3 text-emerald-500" />
              <p className="text-xs text-zinc-500">Encryption</p>
              <p className="mt-1 text-sm font-semibold">E2EE Active</p>
            </div>
            <div className="rounded-lg bg-zinc-50 p-4 dark:bg-zinc-800">
              <FiCalendar className="mb-3 text-zinc-400" />
              <p className="text-xs text-zinc-500">Joined</p>
              <p className="mt-1 text-sm font-semibold">
                {user?.createdAt
                  ? new Date(user.createdAt).toLocaleDateString()
                  : "—"}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
