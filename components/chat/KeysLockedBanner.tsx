"use client";

import { FiLock } from "react-icons/fi";
import { useAuthStore } from "@/context/stores/auth-store";
import { useUiStore } from "@/context/stores/ui-store";
import { useIdentityStatus } from "./use-identity-status";

/** Shown in a conversation while this device's private keys are locked. */
export default function KeysLockedBanner() {
  const userId = useAuthStore((s) => s.user?.id);
  const status = useIdentityStatus(userId);
  const openUnlock = useUiStore((s) => s.setUnlockKeysOpen);

  if (status !== "locked") return null;

  return (
    <div className="relative z-10 mx-4 mt-3 flex items-center justify-between gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-2.5 text-sm text-amber-800 dark:border-amber-800/60 dark:bg-amber-950/30 dark:text-amber-300">
      <span className="flex items-center gap-2">
        <FiLock className="h-4 w-4 shrink-0" />
        Your encryption keys are locked on this device.
      </span>
      <button
        type="button"
        onClick={() => openUnlock(true)}
        className="shrink-0 rounded-lg bg-amber-600 px-3 py-1.5 text-xs font-bold text-white transition hover:bg-amber-700"
      >
        Unlock keys
      </button>
    </div>
  );
}
