"use client";

import { useState } from "react";
import { motion } from "motion/react";
import {
  FiClipboard,
  FiLogIn,
  FiKey,
  FiShield,
  FiAlertTriangle,
  FiLoader,
  FiUserPlus,
  FiLock,
  FiLogOut,
  FiArrowRight,
  FiInfo,
} from "react-icons/fi";
import { useFetch } from "@/utils/query";
import { api } from "@/utils/api";
import type { AuditLog } from "@/utils/types";

const actionConfig: Record<string, { icon: typeof FiLogIn; color: string; bg: string; label: string }> = {
  LOGIN: { icon: FiLogIn, color: "text-green-600 dark:text-green-400", bg: "bg-green-100 dark:bg-green-900/30", label: "Signed In" },
  REGISTER: { icon: FiUserPlus, color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-100 dark:bg-emerald-900/30", label: "Account Created" },
  LOGIN_FAILED: { icon: FiAlertTriangle, color: "text-amber-600 dark:text-amber-400", bg: "bg-amber-100 dark:bg-amber-900/30", label: "Sign In Failed" },
  KEY_ROTATE: { icon: FiKey, color: "text-blue-600 dark:text-blue-400", bg: "bg-blue-100 dark:bg-blue-900/30", label: "Keys Rotated" },
  PASSWORD_CHANGE: { icon: FiLock, color: "text-violet-600 dark:text-violet-400", bg: "bg-violet-100 dark:bg-violet-900/30", label: "Password Changed" },
  LOGOUT: { icon: FiLogOut, color: "text-zinc-600 dark:text-zinc-400", bg: "bg-zinc-100 dark:bg-zinc-800", label: "Signed Out" },
};

function timeAgo(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diffMs = now - then;
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

function formatDetails(details: Record<string, unknown> | null): { key: string; value: string }[] {
  if (!details || typeof details !== "object") return [];
  const entries: { key: string; value: string }[] = [];

  for (const [rawKey, val] of Object.entries(details)) {
    const key = rawKey
      .replace(/([A-Z])/g, " $1")
      .replace(/^./, (s) => s.toUpperCase())
      .replace(/_/g, " ");

    if (val === null || val === undefined || val === "") continue;

    if (typeof val === "object") {
      entries.push({ key, value: JSON.stringify(val) });
    } else {
      entries.push({ key, value: String(val) });
    }
  }

  return entries;
}

export default function AuditPage() {
  const [tab, setTab] = useState<"activity" | "security">("activity");

  const { data: activityData, isLoading: loadingActivity } = useFetch<{ success: boolean; logs: AuditLog[] }>(
    ["audit-logs", tab],
    () => api.get<{ success: boolean; logs: AuditLog[] }>(tab === "activity" ? "/api/audit/logs?limit=50" : "/api/audit/security?limit=50"),
    { staleTime: 30_000 }
  );

  const logs = activityData?.logs ?? [];

  return (
    <div className="flex flex-1 flex-col overflow-y-auto">
      <div className="border-b border-zinc-200 bg-white px-6 py-4 dark:border-zinc-800 dark:bg-zinc-900">
        <h1 className="text-xl font-bold">Security Center</h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">Activity logs and security events</p>
      </div>

      {/* Tabs */}
      <div className="border-b border-zinc-200 bg-white px-6 dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex gap-1">
          {([
            ["activity", "Activity Log", FiClipboard],
            ["security", "Security Events", FiShield],
          ] as const).map(([key, label, Icon]) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-medium transition-colors ${
                tab === key
                  ? "border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400"
                  : "border-transparent text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-300"
              }`}
            >
              <Icon className="h-4 w-4" />
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 px-6 py-6">
        <div className="w-full">
          {loadingActivity && (
            <div className="flex items-center justify-center py-12">
              <FiLoader className="h-6 w-6 animate-spin text-zinc-400" />
            </div>
          )}

          {!loadingActivity && logs.length === 0 && (
            <div className="rounded-2xl border border-zinc-200 bg-white p-6 text-center dark:border-zinc-800 dark:bg-zinc-900">
              <FiClipboard className="mx-auto mb-3 h-8 w-8 text-zinc-400" />
              <p className="text-sm text-zinc-500">
                {tab === "activity" ? "No activity events yet" : "No security events"}
              </p>
            </div>
          )}

          {logs.length > 0 && (
            <div className="relative ml-4 space-y-0">
              {/* Timeline line */}
              <div className="absolute left-[7px] top-3 bottom-3 w-px bg-zinc-200 dark:bg-zinc-700" />

              {logs.map((log, i) => {
                const cfg = actionConfig[log.action] || { icon: FiShield, color: "text-zinc-500", bg: "bg-zinc-100 dark:bg-zinc-800", label: log.action };
                const Icon = cfg.icon;
                const details = formatDetails(log.details);

                return (
                  <motion.div
                    key={log.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.03 }}
                    className="relative flex gap-3 py-3"
                  >
                    {/* Timeline dot */}
                    <div className={`relative z-10 flex h-[15px] w-[15px] shrink-0 items-center justify-center rounded-full border-2 border-white dark:border-zinc-900 ${cfg.bg} mt-1`}>
                      <div className={`h-1.5 w-1.5 rounded-full ${cfg.color.replace("text-", "bg-")}`} />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0 rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
                      <div className="flex items-start gap-3">
                        <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${cfg.bg}`}>
                          <Icon className={`h-4 w-4 ${cfg.color}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <p className="text-sm font-semibold">{cfg.label}</p>
                            <span className="shrink-0 text-[11px] text-zinc-400">{timeAgo(log.createdAt)}</span>
                          </div>

                          {/* Formatted details */}
                          {details.length > 0 && (
                            <div className="mt-2 space-y-1">
                              {details.map((d, di) => (
                                <div key={di} className="flex items-center gap-2 text-xs">
                                  <FiArrowRight className="h-3 w-3 shrink-0 text-zinc-300 dark:text-zinc-600" />
                                  <span className="text-zinc-500 dark:text-zinc-400">{d.key}:</span>
                                  <span className="truncate font-medium text-zinc-700 dark:text-zinc-300">{d.value}</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
