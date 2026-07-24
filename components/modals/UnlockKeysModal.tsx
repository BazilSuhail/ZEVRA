"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { FiAlertCircle, FiKey, FiLoader, FiLock, FiX } from "react-icons/fi";
import { useAuthStore } from "@/context/stores/auth-store";
import { useUiStore } from "@/context/stores/ui-store";
import { unlockWithPassword } from "@/lib/e2ee";
import { getErrorMessage } from "@/utils/api";
import { useIdentityStatus } from "@/components/chat/use-identity-status";

/**
 * Password prompt shown when the session token is valid but this device has
 * no unlocked private keys (new browser, cleared storage). Fetches the
 * sealed key blobs from GET /keys/me and unwraps them with Argon2id.
 * Opens automatically once per session; can be reopened from locked
 * messages / the conversation banner.
 */
export default function UnlockKeysModal() {
  const user = useAuthStore((s) => s.user);
  const open = useUiStore((s) => s.unlockKeysOpen);
  const setOpen = useUiStore((s) => s.setUnlockKeysOpen);
  const status = useIdentityStatus(user?.id);

  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const initialChecked = useRef(false);

  // Auto-open only for the first check of this session (keys missing on
  // load) — not when keys are wiped during logout
  useEffect(() => {
    if (status === "checking") return;
    if (!initialChecked.current) {
      initialChecked.current = true;
      if (status === "locked") setOpen(true);
    }
    if (status === "unlocked" && open) setOpen(false);
  }, [status, open, setOpen]);

  const close = () => {
    if (loading) return;
    setOpen(false);
    setPassword("");
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !password || loading) return;
    setLoading(true);
    setError(null);
    try {
      await unlockWithPassword(user.id, password);
      setPassword("");
      setOpen(false);
    } catch (err) {
      setError(getErrorMessage(err, "Could not unlock your keys"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {open && status !== "unlocked" && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={close}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />

          <motion.form
            onSubmit={handleSubmit}
            role="dialog"
            aria-modal="true"
            aria-labelledby="unlock-keys-title"
            className="relative w-full max-w-sm overflow-hidden rounded-2xl bg-white shadow-xl dark:bg-zinc-900"
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
          >
            <div className="flex items-center justify-between border-b border-zinc-100 px-5 py-4 dark:border-zinc-800">
              <h3 id="unlock-keys-title" className="flex items-center gap-2 text-sm font-bold text-zinc-900 dark:text-zinc-100">
                <FiKey className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                Unlock encryption keys
              </h3>
              <button
                type="button"
                aria-label="Close"
                onClick={close}
                disabled={loading}
                className="rounded-lg p-1 text-zinc-400 hover:bg-zinc-100 disabled:opacity-50 dark:hover:bg-zinc-800"
              >
                <FiX className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-3 px-5 py-5">
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                Your private keys aren&apos;t unlocked on this device. Enter your password to
                decrypt your messages — it never leaves this browser.
              </p>

              {error && (
                <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-600 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400">
                  <FiAlertCircle className="h-4 w-4 shrink-0" />
                  {error}
                </div>
              )}

              <label className="block">
                <span className="mb-1.5 block text-xs font-medium text-zinc-500 dark:text-zinc-400">Password</span>
                <span className="flex items-center gap-2 rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2.5 focus-within:border-indigo-400 focus-within:ring-1 focus-within:ring-indigo-400/40 dark:border-zinc-700 dark:bg-zinc-800">
                  <FiLock className="h-4 w-4 shrink-0 text-zinc-400" />
                  <input
                    type="password"
                    autoFocus
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="min-w-0 flex-1 bg-transparent text-sm text-zinc-900 outline-none dark:text-zinc-100"
                  />
                </span>
              </label>
            </div>

            <div className="flex items-center justify-end gap-2 border-t border-zinc-100 px-5 py-3 dark:border-zinc-800">
              <button
                type="button"
                onClick={close}
                disabled={loading}
                className="rounded-xl px-4 py-2 text-sm font-medium text-zinc-600 hover:bg-zinc-100 disabled:opacity-50 dark:text-zinc-400 dark:hover:bg-zinc-800"
              >
                Not now
              </button>
              <button
                type="submit"
                disabled={loading || !password}
                className="flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-60"
              >
                {loading ? <FiLoader className="h-4 w-4 animate-spin" /> : <FiKey className="h-4 w-4" />}
                {loading ? "Unlocking..." : "Unlock"}
              </button>
            </div>
          </motion.form>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
