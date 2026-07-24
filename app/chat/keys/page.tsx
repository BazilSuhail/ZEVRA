"use client";

import { useState, useEffect } from "react";
import { FiCheck, FiCopy, FiKey, FiShield, FiLoader, FiAlertCircle, FiInfo, FiLock, FiUnlock } from "react-icons/fi";
import { api, getErrorMessage } from "@/utils/api";
import { keyFingerprint } from "@/lib/e2ee";
import { useAuthStore } from "@/context/stores/auth-store";
import { useUiStore } from "@/context/stores/ui-store";
import { useIdentityStatus } from "@/components/chat/use-identity-status";

// GET /keys/me — public halves + sealed private blobs (never shown)
interface MyKeys {
  id: string;
  publicKey: string;
  publicKeySign: string;
  keyVersion: number;
}

function groupHex(hex: string) {
  return hex ? hex.replace(/(.{4})/g, "$1 ").trim() : "—";
}

export default function KeysPage() {
  const userId = useAuthStore((s) => s.user?.id);
  const identityStatus = useIdentityStatus(userId);
  const openUnlock = useUiStore((s) => s.setUnlockKeysOpen);

  const [keys, setKeys] = useState<MyKeys | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<"enc" | "sign" | null>(null);

  useEffect(() => {
    api
      .get<MyKeys | null>("/keys/me")
      .then((data) => setKeys(data ?? null))
      .catch((err) => setError(getErrorMessage(err, "Failed to load keys")))
      .finally(() => setLoading(false));
  }, []);

  const encFingerprint = keys?.publicKey ? keyFingerprint(keys.publicKey) : "";
  const signFingerprint = keys?.publicKeySign ? keyFingerprint(keys.publicKeySign) : "";

  const copy = (which: "enc" | "sign", value: string) => {
    if (!value) return;
    navigator.clipboard.writeText(value).catch(() => {});
    setCopied(which);
    setTimeout(() => setCopied(null), 1500);
  };

  const version = keys ? `v${String(keys.keyVersion ?? 1).padStart(2, "0")}` : "";

  return (
    <div className="flex flex-1 flex-col overflow-y-auto bg-[#fbfcfd] dark:bg-zinc-950">
      <header className="border-b border-zinc-200 bg-white px-6 py-6 dark:border-zinc-800 dark:bg-zinc-900">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-indigo-500">Cryptography</p>
        <h1 className="mt-1 text-2xl font-bold">Encryption keys</h1>
        <p className="mt-1 text-sm text-zinc-500">Your public key identity and key version.</p>
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
                    {keys ? `${version} — X25519 + Ed25519` : "No keys found"}
                  </p>
                </div>
              </div>
              {keys && (
                <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-bold text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400">
                  {version}
                </span>
              )}
            </div>

            <div className="flex items-center justify-between gap-3 rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
              <div className="flex items-center gap-3">
                {identityStatus === "unlocked" ? (
                  <FiUnlock className="text-emerald-600" />
                ) : (
                  <FiLock className="text-amber-600" />
                )}
                <div>
                  <p className="font-semibold">This device</p>
                  <p className="text-xs text-zinc-500">
                    {identityStatus === "unlocked"
                      ? "Private keys unlocked — messages decrypt locally"
                      : identityStatus === "locked"
                        ? "Private keys locked — enter your password to decrypt messages"
                        : "Checking..."}
                  </p>
                </div>
              </div>
              {identityStatus === "locked" && (
                <button
                  type="button"
                  onClick={() => openUnlock(true)}
                  className="shrink-0 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-indigo-700"
                >
                  Unlock keys
                </button>
              )}
            </div>

            {keys && (
              <div className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
                <div className="mb-4 flex items-center gap-3">
                  <FiShield className="text-emerald-600" />
                  <p className="font-semibold">Public identity</p>
                </div>

                <p className="mb-1.5 text-xs font-medium text-zinc-500">Encryption key (X25519)</p>
                <div className="rounded-lg bg-zinc-50 p-3 font-mono text-xs break-all text-zinc-500 dark:bg-zinc-800">
                  {groupHex(encFingerprint)}
                </div>
                <button
                  onClick={() => copy("enc", encFingerprint)}
                  className="mt-2 inline-flex items-center gap-2 text-xs font-semibold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400"
                >
                  {copied === "enc" ? <FiCheck /> : <FiCopy />}
                  {copied === "enc" ? "Copied" : "Copy fingerprint"}
                </button>

                <p className="mt-4 mb-1.5 text-xs font-medium text-zinc-500">Signing key (Ed25519)</p>
                <div className="rounded-lg bg-zinc-50 p-3 font-mono text-xs break-all text-zinc-500 dark:bg-zinc-800">
                  {groupHex(signFingerprint)}
                </div>
                <button
                  onClick={() => copy("sign", signFingerprint)}
                  className="mt-2 inline-flex items-center gap-2 text-xs font-semibold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400"
                >
                  {copied === "sign" ? <FiCheck /> : <FiCopy />}
                  {copied === "sign" ? "Copied" : "Copy fingerprint"}
                </button>
              </div>
            )}

            <div className="flex items-start gap-3 rounded-xl border border-zinc-200 bg-white p-4 text-xs text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400">
              <FiInfo className="mt-0.5 h-4 w-4 shrink-0 text-indigo-500" />
              <p>
                Key rotation isn&apos;t available in the web app yet. Rotating requires generating new
                key pairs on your device and sealing them with your password, so it can&apos;t be done
                by the server alone. Fingerprints are the first 128 bits of SHA-256 over each public key.
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
