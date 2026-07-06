"use client";

import { useState, useEffect } from "react";
import { FiCheck, FiCopy, FiKey, FiRefreshCw, FiShield, FiLoader, FiAlertCircle } from "react-icons/fi";
import { api } from "@/utils/api";

interface KeyInfo {
  id: string;
  userId: string;
  publicKey: string;
  keyType: string;
  algorithm: string;
  keySize: number;
  fingerprint: string;
  version: number;
  isActive: boolean;
  createdAt: string;
}

export default function KeysPage() {
  const [keys, setKeys] = useState<KeyInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [rotating, setRotating] = useState(false);
  const [rotated, setRotated] = useState(false);

  useEffect(() => {
    api
      .get<KeyInfo[]>("/keys/me")
      .then((data) => setKeys(data))
      .catch((err) => setError(err?.message || "Failed to load keys"))
      .finally(() => setLoading(false));
  }, []);

  const activeKey = keys.find((k) => k.isActive) || keys[0];

  const fingerprint = activeKey?.fingerprint
    ? activeKey.fingerprint.replace(/(.{4})/g, "$1 ").trim()
    : "—";

  const copyFingerprint = () => {
    if (!activeKey?.fingerprint) return;
    navigator.clipboard.writeText(activeKey.fingerprint);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const handleRotate = async () => {
    setRotating(true);
    try {
      const newKey = await api.post<KeyInfo>("/keys/rotate", {
        algorithm: "X25519",
        keyType: "IDENTITY",
      });
      setKeys((prev) => [
        newKey,
        ...prev.map((k) => ({ ...k, isActive: false })),
      ]);
      setRotated(true);
      setTimeout(() => setRotated(false), 3000);
    } catch {
      // silent
    } finally {
      setRotating(false);
    }
  };

  return (
    <div className="flex flex-1 flex-col overflow-y-auto bg-[#fbfcfd] dark:bg-zinc-950">
      <header className="border-b border-zinc-200 bg-white px-6 py-6 dark:border-zinc-800 dark:bg-zinc-900">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-indigo-500">Cryptography</p>
        <h1 className="mt-1 text-2xl font-bold">Encryption keys</h1>
        <p className="mt-1 text-sm text-zinc-500">Your key identity and rotation history.</p>
      </header>

      <div className="mx-auto w-full space-y-4 p-6">
        {loading && (
          <div className="flex items-center justify-center gap-2 py-12 text-sm text-zinc-400">
            <FiLoader className="h-4 w-4 animate-spin" />
            Loading keys...
          </div>
        )}

        {error && (
          <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400">
            <FiAlertCircle className="h-4 w-4 shrink-0" />
            {error}
          </div>
        )}

        {!loading && !error && (
          <>
            <div className="flex items-center justify-between rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
              <div className="flex items-center gap-3">
                <FiKey className="text-indigo-600" />
                <div>
                  <p className="font-semibold">Key version</p>
                  <p className="text-xs text-zinc-500">
                    {activeKey
                      ? `v${String(activeKey.version).padStart(2, "0")} — ${activeKey.algorithm}`
                      : "No keys found"}
                  </p>
                </div>
              </div>
              {activeKey && (
                <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-bold text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400">
                  v{String(activeKey.version).padStart(2, "0")}
                </span>
              )}
            </div>

            <div className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
              <div className="mb-4 flex items-center gap-3">
                <FiShield className="text-emerald-600" />
                <p className="font-semibold">Public identity</p>
              </div>
              <div className="rounded-lg bg-zinc-50 p-3 font-mono text-xs text-zinc-500 dark:bg-zinc-800">
                {activeKey?.algorithm || "X25519"} · {fingerprint}
              </div>
              <button
                onClick={copyFingerprint}
                className="mt-3 inline-flex items-center gap-2 text-xs font-semibold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400"
              >
                {copied ? <FiCheck /> : <FiCopy />}
                {copied ? "Copied" : "Copy fingerprint"}
              </button>
            </div>

            <button
              onClick={handleRotate}
              disabled={rotating}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
            >
              {rotating ? (
                <>
                  <FiLoader className="h-4 w-4 animate-spin" />
                  Rotating...
                </>
              ) : rotated ? (
                <>
                  <FiCheck className="h-4 w-4" />
                  New key generated
                </>
              ) : (
                <>
                  <FiRefreshCw className="h-4 w-4" />
                  Rotate keys
                </>
              )}
            </button>

            {keys.length > 1 && (
              <div className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
                <p className="mb-3 font-semibold">Key history</p>
                <div className="space-y-2">
                  {keys.map((k) => (
                    <div
                      key={k.id}
                      className="flex items-center justify-between rounded-lg bg-zinc-50 px-3 py-2 dark:bg-zinc-800"
                    >
                      <div>
                        <span className="text-sm font-medium">
                          v{String(k.version).padStart(2, "0")}
                        </span>
                        <span className="ml-2 text-xs text-zinc-400">
                          {k.isActive ? "Active" : "Retired"}
                        </span>
                      </div>
                      <span className="text-xs text-zinc-400">
                        {new Date(k.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
