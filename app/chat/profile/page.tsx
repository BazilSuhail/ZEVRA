"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  FiArrowLeft,
  FiUser,
  FiLoader,
  FiCheckCircle,
  FiCamera,
  FiMail,
  FiCalendar,
  FiKey,
  FiShield,
  FiLogOut,
  FiEdit2,
  FiX,
  FiSettings,
  FiAlertCircle,
  FiRefreshCw,
  FiLock,
  FiChevronDown,
  FiChevronUp,
} from "react-icons/fi";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/useAuth";
import { useAct, useQueryClient } from "@/utils/query";
import { api } from "@/utils/api";
import type { MyKeys } from "@/utils/types";

export default function ProfilePage() {
  const router = useRouter();
  const qc = useQueryClient();
  const { user, loadSession, logout, keys } = useAuth();
  const [editing, setEditing] = useState(false);
  const [username, setUsername] = useState("");
  const [saved, setSaved] = useState(false);
  const [showKeys, setShowKeys] = useState(false);
  const [showRotate, setShowRotate] = useState(false);
  const [rotatePassword, setRotatePassword] = useState("");
  const [rotated, setRotated] = useState(false);

  useEffect(() => {
    loadSession();
  }, []);

  useEffect(() => {
    if (user?.username) setUsername(user.username);
  }, [user?.username]);

  const updateProfile = useAct(
    (vars: { username: string }) => api.put("/api/users/me", vars),
    {
      onSuccess: () => {
        setSaved(true);
        setEditing(false);
        loadSession();
        setTimeout(() => setSaved(false), 2000);
      },
    }
  );

  const rotateMutation = useAct(
    (vars: { password: string }) => api.post<{ success: boolean; message: string }>("/keys/rotate", vars),
    {
      onSuccess: () => {
        setRotated(true);
        setRotatePassword("");
        setShowRotate(false);
        loadSession();
        setTimeout(() => setRotated(false), 3000);
      },
    }
  );

  const handleSave = () => {
    if (!username.trim() || username === user?.username) {
      setEditing(false);
      return;
    }
    updateProfile.mutate({ username: username.trim() });
  };

  const handleCancel = () => {
    setUsername(user?.username || "");
    setEditing(false);
  };

  const handleLogout = () => {
    logout();
    router.push("/auth/login");
  };

  const handleRotate = () => {
    if (!rotatePassword.trim()) return;
    rotateMutation.mutate({ password: rotatePassword.trim() });
  };

  const fingerprint = keys?.publicKey
    ? keys.publicKey.match(/.{1,4}/g)?.join(" ") || ""
    : "";

  const sigFingerprint = keys?.publicKeySign
    ? keys.publicKeySign.match(/.{1,4}/g)?.join(" ") || ""
    : "";

  return (
    <div className="flex flex-1 flex-col overflow-y-auto">
      {/* Header */}
      <div className="border-b border-zinc-200 bg-white px-6 py-4 dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex items-center gap-3">
          <Link href="/chat" className="rounded-lg p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800">
            <FiArrowLeft className="h-5 w-5" />
          </Link>
          <h1 className="text-xl font-bold">Profile</h1>
        </div>
      </div>

      <div className="flex-1 px-6 py-6">
        <div className="w-full space-y-5">
          {/* Avatar + Name Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative overflow-hidden rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900"
          >
            <div className="h-24 bg-gradient-to-br from-indigo-500 to-purple-600" />
            <div className="relative -mt-12 flex flex-col items-center px-6 pb-6">
              <div className="relative">
                <div className="flex h-24 w-24 items-center justify-center rounded-full border-4 border-white bg-indigo-100 text-3xl font-bold text-indigo-600 shadow-lg dark:border-zinc-900 dark:bg-indigo-900/30 dark:text-indigo-400">
                  {user?.username?.[0]?.toUpperCase() || "U"}
                </div>
                <button className="absolute bottom-0 right-0 flex h-8 w-8 items-center justify-center rounded-full bg-indigo-600 text-white shadow-md hover:bg-indigo-700">
                  <FiCamera className="h-4 w-4" />
                </button>
              </div>

              <div className="mt-3 flex items-center gap-2">
                {editing ? (
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleSave();
                        if (e.key === "Escape") handleCancel();
                      }}
                      autoFocus
                      className="rounded-lg border border-indigo-300 bg-white px-3 py-1.5 text-center text-lg font-semibold outline-none focus:border-indigo-500 dark:border-indigo-700 dark:bg-zinc-800"
                    />
                    <button onClick={handleSave} disabled={updateProfile.isPending} className="rounded-lg bg-indigo-600 p-1.5 text-white hover:bg-indigo-700">
                      {updateProfile.isPending ? <FiLoader className="h-4 w-4 animate-spin" /> : <FiCheckCircle className="h-4 w-4" />}
                    </button>
                    <button onClick={handleCancel} className="rounded-lg bg-zinc-200 p-1.5 text-zinc-600 hover:bg-zinc-300 dark:bg-zinc-700 dark:text-zinc-400">
                      <FiX className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <>
                    <h2 className="text-xl font-bold">{user?.username || "Unknown"}</h2>
                    <button onClick={() => setEditing(true)} className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-indigo-600 dark:hover:bg-zinc-800">
                      <FiEdit2 className="h-4 w-4" />
                    </button>
                  </>
                )}
              </div>

              <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">{user?.email}</p>

              <AnimatePresence>
                {saved && (
                  <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="mt-2 flex items-center gap-1 rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-700 dark:bg-green-900/30 dark:text-green-400">
                    <FiCheckCircle className="h-3 w-3" /> Profile updated
                  </motion.div>
                )}
              </AnimatePresence>

              {updateProfile.error && (
                <p className="mt-2 text-xs text-red-500">{updateProfile.error.message}</p>
              )}
            </div>
          </motion.div>

          {/* Info Rows */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
            <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
              <InfoRow icon={FiMail} label="Email" value={user?.email || ""} />
              <InfoRow icon={FiCalendar} label="Joined" value={user?.createdAt ? new Date(user.createdAt).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }) : ""} />
            </div>
          </motion.div>

          {/* Keys Section */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
            {/* Keys header - always visible */}
            <button
              onClick={() => setShowKeys(!showKeys)}
              className="flex w-full items-center justify-between p-5 text-left transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-100 dark:bg-indigo-900/30">
                  <FiKey className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                </div>
                <div>
                  <p className="text-sm font-semibold">Encryption Keys</p>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    {keys ? `Version ${keys.keyVersion}` : "Not loaded"}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {keys && (
                  <span className="rounded-full bg-indigo-100 px-2.5 py-0.5 text-[11px] font-bold text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400">
                    v{keys.keyVersion}
                  </span>
                )}
                {showKeys ? <FiChevronUp className="h-4 w-4 text-zinc-400" /> : <FiChevronDown className="h-4 w-4 text-zinc-400" />}
              </div>
            </button>

            <AnimatePresence>
              {showKeys && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                  <div className="border-t border-zinc-100 px-5 pb-5 pt-4 dark:border-zinc-800">
                    {rotated && (
                      <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} className="mb-4 flex items-center gap-2 rounded-xl border border-green-200 bg-green-50 px-3 py-2 text-xs text-green-700 dark:border-green-800 dark:bg-green-900/20 dark:text-green-400">
                        <FiCheckCircle className="h-3.5 w-3.5" /> Keys rotated successfully
                      </motion.div>
                    )}

                    {keys && (
                      <div className="space-y-3">
                        {/* Algorithm */}
                        <div className="rounded-xl bg-zinc-50 p-3 dark:bg-zinc-800">
                          <p className="mb-1 text-[11px] font-medium text-zinc-500 dark:text-zinc-400">Algorithm</p>
                          <p className="text-xs font-medium">X25519 + Ed25519 | Argon2id + AES-256-GCM</p>
                        </div>

                        {/* Identity Key */}
                        <div className="rounded-xl bg-zinc-50 p-3 dark:bg-zinc-800">
                          <p className="mb-1 text-[11px] font-medium text-zinc-500 dark:text-zinc-400">Identity Key (X25519)</p>
                          <p className="break-all font-mono text-[11px] text-zinc-700 dark:text-zinc-300">{fingerprint || "Not loaded"}</p>
                        </div>

                        {/* Signing Key */}
                        <div className="rounded-xl bg-zinc-50 p-3 dark:bg-zinc-800">
                          <p className="mb-1 text-[11px] font-medium text-zinc-500 dark:text-zinc-400">Signing Key (Ed25519)</p>
                          <p className="break-all font-mono text-[11px] text-zinc-700 dark:text-zinc-300">{sigFingerprint || "Not loaded"}</p>
                        </div>

                        {/* Rotate Keys */}
                        <div className="rounded-xl border border-zinc-200 dark:border-zinc-700">
                          <button
                            onClick={() => setShowRotate(!showRotate)}
                            className="flex w-full items-center justify-between p-3 text-left"
                          >
                            <div className="flex items-center gap-2">
                              <FiRefreshCw className="h-3.5 w-3.5 text-amber-500" />
                              <span className="text-xs font-medium">Rotate Keys</span>
                            </div>
                            {showRotate ? <FiChevronUp className="h-3 w-3 text-zinc-400" /> : <FiChevronDown className="h-3 w-3 text-zinc-400" />}
                          </button>

                          <AnimatePresence>
                            {showRotate && (
                              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                                <div className="border-t border-zinc-100 px-3 pb-3 pt-3 dark:border-zinc-700">
                                  <div className="mb-2 flex items-start gap-2 rounded-lg bg-amber-50 p-2 text-[11px] text-amber-700 dark:bg-amber-900/20 dark:text-amber-400">
                                    <FiAlertCircle className="mt-0.5 h-3 w-3 shrink-0" />
                                    <p>Generates a new key pair. Old messages remain encrypted with the previous key.</p>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <div className="flex flex-1 items-center gap-1.5 rounded-lg border border-zinc-200 bg-zinc-50 px-2.5 py-2 dark:border-zinc-700 dark:bg-zinc-800">
                                      <FiLock className="h-3 w-3 text-zinc-400" />
                                      <input
                                        type="password"
                                        value={rotatePassword}
                                        onChange={(e) => setRotatePassword(e.target.value)}
                                        onKeyDown={(e) => e.key === "Enter" && handleRotate()}
                                        placeholder="Password"
                                        className="flex-1 bg-transparent text-xs outline-none"
                                      />
                                    </div>
                                    <button
                                      onClick={handleRotate}
                                      disabled={!rotatePassword.trim() || rotateMutation.isPending}
                                      className="shrink-0 rounded-lg bg-amber-600 px-3 py-2 text-xs font-semibold text-white hover:bg-amber-700 disabled:opacity-50"
                                    >
                                      {rotateMutation.isPending ? <FiLoader className="h-3 w-3 animate-spin" /> : <FiRefreshCw className="h-3 w-3" />}
                                    </button>
                                  </div>
                                  {rotateMutation.error && (
                                    <p className="mt-1.5 text-[11px] text-red-500">{rotateMutation.error.message}</p>
                                  )}
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      </div>
                    )}

                    {!keys && (
                      <p className="text-center text-xs text-zinc-500">No keys found. Keys are generated during registration.</p>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          {/* Quick Actions */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
            <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
              <Link href="/chat/settings" className="flex items-center justify-between px-5 py-4 transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-800/50">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-zinc-100 dark:bg-zinc-800">
                    <FiSettings className="h-4 w-4 text-zinc-600 dark:text-zinc-400" />
                  </div>
                  <span className="text-sm font-medium">Settings</span>
                </div>
                <FiChevronDown className="h-4 w-4 rotate-[-90deg] text-zinc-400" />
              </Link>
            </div>
          </motion.div>

          {/* Logout */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <button
              onClick={handleLogout}
              className="flex w-full items-center justify-center gap-2 rounded-2xl border border-red-200 bg-white py-3.5 text-sm font-medium text-red-600 transition-colors hover:bg-red-50 dark:border-red-900/50 dark:bg-zinc-900 dark:text-red-400 dark:hover:bg-red-900/20"
            >
              <FiLogOut className="h-4 w-4" />
              Sign Out
            </button>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

function InfoRow({ icon: Icon, label, value }: { icon: typeof FiMail; label: string; value: string }) {
  return (
    <div className="flex items-center justify-between px-5 py-3.5">
      <div className="flex items-center gap-3">
        <Icon className="h-4 w-4 text-zinc-400" />
        <span className="text-sm text-zinc-500 dark:text-zinc-400">{label}</span>
      </div>
      <span className="text-sm font-medium">{value}</span>
    </div>
  );
}
