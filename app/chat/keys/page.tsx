"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  FiKey,
  FiShield,
  FiCheckCircle,
  FiLoader,
  FiRefreshCw,
  FiLock,
  FiAlertCircle,
  FiChevronDown,
  FiChevronUp,
} from "react-icons/fi";
import { useFetch, useAct, useQueryClient } from "@/utils/query";
import { api } from "@/utils/api";
import { useAuth } from "@/context/useAuth";
import type { MyKeys } from "@/utils/types";

export default function KeysPage() {
  const { keys, setKeys } = useAuth();
  const qc = useQueryClient();
  const [showRotate, setShowRotate] = useState(false);
  const [password, setPassword] = useState("");
  const [rotated, setRotated] = useState(false);

  const { data: freshKeys, isLoading } = useFetch<MyKeys>(
    "keys",
    () => api.get<MyKeys>("/keys/me"),
    { staleTime: 60_000 }
  );

  const displayKeys = freshKeys || keys;

  const rotateMutation = useAct(
    (vars: { password: string }) => api.post<{ success: boolean; message: string }>("/keys/rotate", vars),
    {
      onSuccess: () => {
        setRotated(true);
        setPassword("");
        setShowRotate(false);
        qc.invalidateQueries({ queryKey: ["keys"] });
        setTimeout(() => setRotated(false), 3000);
      },
    }
  );

  const handleRotate = () => {
    if (!password.trim()) return;
    rotateMutation.mutate({ password: password.trim() });
  };

  const fingerprint = displayKeys?.publicKey
    ? displayKeys.publicKey.match(/.{1,4}/g)?.join(" ") || ""
    : "";

  const sigFingerprint = displayKeys?.publicKeySign
    ? displayKeys.publicKeySign.match(/.{1,4}/g)?.join(" ") || ""
    : "";

  return (
    <div className="flex flex-1 flex-col overflow-y-auto">
      <div className="border-b border-zinc-200 bg-white px-6 py-4 dark:border-zinc-800 dark:bg-zinc-900">
        <h1 className="text-xl font-bold">Encryption Keys</h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">Your cryptographic identity</p>
      </div>
      <div className="flex-1 px-6 py-6">
        <div className="w-full space-y-5">
          {isLoading && (
            <div className="flex items-center justify-center py-12">
              <FiLoader className="h-6 w-6 animate-spin text-zinc-400" />
            </div>
          )}

          {!isLoading && !displayKeys && (
            <div className="rounded-2xl border border-zinc-200 bg-white p-6 text-center dark:border-zinc-800 dark:bg-zinc-900">
              <FiKey className="mx-auto mb-3 h-8 w-8 text-zinc-400" />
              <p className="text-sm text-zinc-500">No keys found. Keys are generated during registration.</p>
            </div>
          )}

          {displayKeys && (
            <>
              {/* Success toast */}
              <AnimatePresence>
                {rotated && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="flex items-center gap-2 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700 dark:border-green-800 dark:bg-green-900/20 dark:text-green-400"
                  >
                    <FiCheckCircle className="h-4 w-4" /> Keys rotated successfully
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Key version */}
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-100 dark:bg-indigo-900/30">
                      <FiKey className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold">Key Version</p>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400">Used for message encryption</p>
                    </div>
                  </div>
                  <span className="rounded-full bg-indigo-100 px-3 py-1 text-xs font-bold text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400">
                    v{displayKeys.keyVersion}
                  </span>
                </div>
              </motion.div>

              {/* Public Key */}
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
                <div className="mb-4 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 dark:bg-emerald-900/30">
                    <FiShield className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold">Public Keys</p>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">Shared with other users for E2EE</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="rounded-xl bg-zinc-50 p-3 dark:bg-zinc-800">
                    <p className="mb-1 text-[11px] font-medium text-zinc-500 dark:text-zinc-400">Identity Key (X25519)</p>
                    <p className="break-all font-mono text-xs text-zinc-700 dark:text-zinc-300">{fingerprint || "Not loaded"}</p>
                  </div>
                  <div className="rounded-xl bg-zinc-50 p-3 dark:bg-zinc-800">
                    <p className="mb-1 text-[11px] font-medium text-zinc-500 dark:text-zinc-400">Signing Key (Ed25519)</p>
                    <p className="break-all font-mono text-xs text-zinc-700 dark:text-zinc-300">{sigFingerprint || "Not loaded"}</p>
                  </div>
                </div>
              </motion.div>

              {/* Key details */}
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
                <div className="mb-4 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-100 dark:bg-sky-900/30">
                    <FiCheckCircle className="h-5 w-5 text-sky-600 dark:text-sky-400" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold">Algorithm Details</p>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">Cryptographic primitives used</p>
                  </div>
                </div>
                <div className="space-y-2">
                  {[
                    ["Key Exchange", "X25519 Diffie-Hellman"],
                    ["Digital Signature", "Ed25519"],
                    ["Key Derivation", "Argon2id"],
                    ["Message Encryption", "AES-256-GCM"],
                    ["Private Key Storage", "Encrypted locally"],
                  ].map(([label, value]) => (
                    <div key={label} className="flex items-center justify-between rounded-xl bg-zinc-50 px-4 py-2.5 dark:bg-zinc-800">
                      <span className="text-xs text-zinc-500 dark:text-zinc-400">{label}</span>
                      <span className="text-xs font-medium">{value}</span>
                    </div>
                  ))}
                </div>
              </motion.div>

              {/* Rotate Keys */}
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
                <button
                  onClick={() => setShowRotate(!showRotate)}
                  className="flex w-full items-center justify-between p-5 text-left transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 dark:bg-amber-900/30">
                      <FiRefreshCw className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold">Rotate Keys</p>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400">Generate new key pair</p>
                    </div>
                  </div>
                  {showRotate ? <FiChevronUp className="h-4 w-4 text-zinc-400" /> : <FiChevronDown className="h-4 w-4 text-zinc-400" />}
                </button>

                <AnimatePresence>
                  {showRotate && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="border-t border-zinc-100 px-5 pb-5 pt-4 dark:border-zinc-800">
                        <div className="mb-3 flex items-start gap-2 rounded-xl bg-amber-50 p-3 text-xs text-amber-700 dark:bg-amber-900/20 dark:text-amber-400">
                          <FiAlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                          <p>Rotating keys will generate a new key pair. Your old messages remain encrypted with the previous key.</p>
                        </div>
                        <div className="space-y-3">
                          <div>
                            <label className="mb-1 block text-xs font-medium text-zinc-600 dark:text-zinc-400">Current Password</label>
                            <div className="flex items-center gap-2 rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2.5 dark:border-zinc-700 dark:bg-zinc-800">
                              <FiLock className="h-4 w-4 text-zinc-400" />
                              <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                onKeyDown={(e) => e.key === "Enter" && handleRotate()}
                                placeholder="Enter your password"
                                className="flex-1 bg-transparent text-sm outline-none"
                              />
                            </div>
                          </div>
                          <button
                            onClick={handleRotate}
                            disabled={!password.trim() || rotateMutation.isPending}
                            className="flex w-full items-center justify-center gap-2 rounded-xl bg-amber-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-amber-700 disabled:opacity-50"
                          >
                            {rotateMutation.isPending ? (
                              <><FiLoader className="h-4 w-4 animate-spin" /> Rotating...</>
                            ) : (
                              <><FiRefreshCw className="h-4 w-4" /> Rotate Keys</>
                            )}
                          </button>
                          {rotateMutation.error && (
                            <p className="text-xs text-red-500">{rotateMutation.error.message}</p>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
