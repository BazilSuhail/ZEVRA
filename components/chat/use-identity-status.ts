"use client";

import { useEffect, useState } from "react";
import { ensureIdentity, onIdentityChange } from "@/lib/e2ee";

export type IdentityStatus = "checking" | "unlocked" | "locked";

/** Whether this device holds our unlocked private keys (live). */
export function useIdentityStatus(userId: string | undefined): IdentityStatus {
  const [status, setStatus] = useState<IdentityStatus>("checking");

  useEffect(() => {
    if (!userId) return;
    let alive = true;
    ensureIdentity(userId).then((id) => {
      if (alive) setStatus(id ? "unlocked" : "locked");
    });
    const unsub = onIdentityChange((id) => {
      if (alive) setStatus(id && id.userId === userId ? "unlocked" : "locked");
    });
    return () => {
      alive = false;
      unsub();
    };
  }, [userId]);

  return status;
}
