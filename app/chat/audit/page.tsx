"use client";

import { useEffect, useState } from "react";
import {
  FiCheckCircle,
  FiClock,
  FiLock,
  FiAlertTriangle,
  FiLogIn,
  FiLogOut,
  FiKey,
  FiUserPlus,
  FiShield,
} from "react-icons/fi";
import { api } from "@/utils/api";
import { useAuthStore } from "@/context/stores";

interface AuditEntry {
  id: string;
  action: string;
  details: Record<string, any> | null;
  ipAddress: string | null;
  userId: string | null;
  createdAt: string;
}

type Tab = "activity" | "security";

const ACTION_CONFIG: Record<
  string,
  { icon: typeof FiCheckCircle; color: string; bg: string; label: string }
> = {
  REGISTER: {
    icon: FiUserPlus,
    color: "text-blue-600 dark:text-blue-400",
    bg: "bg-blue-50 dark:bg-blue-950/40",
    label: "Account created",
  },
  LOGIN: {
    icon: FiLogIn,
    color: "text-emerald-600 dark:text-emerald-400",
    bg: "bg-emerald-50 dark:bg-emerald-950/40",
    label: "Signed in",
  },
  LOGIN_FAILED: {
    icon: FiAlertTriangle,
    color: "text-red-600 dark:text-red-400",
    bg: "bg-red-50 dark:bg-red-950/40",
    label: "Failed login attempt",
  },
  LOGOUT: {
    icon: FiLogOut,
    color: "text-zinc-600 dark:text-zinc-400",
    bg: "bg-zinc-50 dark:bg-zinc-800",
    label: "Signed out",
  },
  KEY_ROTATE: {
    icon: FiKey,
    color: "text-amber-600 dark:text-amber-400",
    bg: "bg-amber-50 dark:bg-amber-950/40",
    label: "Keys rotated",
  },
  PASSWORD_CHANGE: {
    icon: FiLock,
    color: "text-violet-600 dark:text-violet-400",
    bg: "bg-violet-50 dark:bg-violet-950/40",
    label: "Password changed",
  },
};

function getActionConfig(action: string) {
  return (
    ACTION_CONFIG[action] ?? {
      icon: FiShield,
      color: "text-indigo-600 dark:text-indigo-400",
      bg: "bg-indigo-50 dark:bg-indigo-950/40",
      label: action,
    }
  );
}

function timeAgo(dateStr: string): string {
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const secs = Math.floor(diffMs / 1000);
  if (secs < 60) return "just now";
  const mins = Math.floor(secs / 60);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

function formatTimestamp(dateStr: string): string {
  return new Date(dateStr).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function AuditPage() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const [tab, setTab] = useState<Tab>("activity");
  const [logs, setLogs] = useState<AuditEntry[]>([]);
  const [securityEvents, setSecurityEvents] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) return;
    setLoading(true);
    Promise.all([
      api.get<{ success: boolean; logs: AuditEntry[] }>("/audit/logs?limit=50"),
      api.get<{ success: boolean; events: AuditEntry[] }>("/audit/security"),
    ])
      .then(([logsRes, secRes]) => {
        setLogs(logsRes.logs ?? []);
        setSecurityEvents(secRes.events ?? []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [isAuthenticated]);

  const displayEvents = tab === "activity" ? logs : securityEvents;

  return (
    <div className="flex flex-1 flex-col overflow-y-auto bg-[#fbfcfd] dark:bg-zinc-950">
      <header className="border-b border-zinc-200 bg-white px-6 py-6 dark:border-zinc-800 dark:bg-zinc-900">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-indigo-500">
          Security
        </p>
        <h1 className="mt-1 text-2xl font-bold">Security center</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Audit trail of your account activity and security events.
        </p>
      </header>

      <div className="border-b border-zinc-200 bg-white px-6 dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex gap-6">
          {(["activity", "security"] as const).map((key) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`border-b-2 py-3 text-sm font-semibold transition-colors ${
                tab === key
                  ? "border-indigo-600 text-indigo-600"
                  : "border-transparent text-zinc-400 hover:text-zinc-600"
              }`}
            >
              {key === "activity" ? "Activity log" : "Security events"}
            </button>
          ))}
        </div>
      </div>

      <div className="mx-auto w-full max-w-2xl space-y-3 p-6">
        {loading && (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="flex gap-4 rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900 animate-pulse"
              >
                <div className="h-10 w-10 rounded-full bg-zinc-200 dark:bg-zinc-700" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 w-32 rounded bg-zinc-200 dark:bg-zinc-700" />
                  <div className="h-2.5 w-48 rounded bg-zinc-100 dark:bg-zinc-800" />
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && displayEvents.length === 0 && (
          <div className="flex flex-col items-center py-12 text-zinc-400">
            <FiShield className="mb-3 h-8 w-8" />
            <p className="text-sm">
              {tab === "activity"
                ? "No activity recorded yet"
                : "No security events recorded yet"}
            </p>
            <p className="mt-1 text-xs text-zinc-300 dark:text-zinc-600">
              Events will appear here as you use the app
            </p>
          </div>
        )}

        {!loading &&
          displayEvents.map((event) => {
            const cfg = getActionConfig(event.action);
            const Icon = cfg.icon;
            return (
              <div
                key={event.id}
                className="flex gap-4 rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900"
              >
                <div
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${cfg.bg}`}
                >
                  <Icon className={`h-4 w-4 ${cfg.color}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-semibold">{cfg.label}</p>
                    {event.ipAddress && (
                      <span className="shrink-0 text-[11px] text-zinc-400">
                        IP: {event.ipAddress}
                      </span>
                    )}
                  </div>
                  {event.details && Object.keys(event.details).length > 0 && (
                    <p className="mt-1 text-xs text-zinc-500">
                      {Object.entries(event.details)
                        .map(([k, v]) => `${k}: ${v}`)
                        .join(" · ")}
                    </p>
                  )}
                  <p className="mt-2 flex items-center gap-1 text-[11px] text-zinc-400">
                    <FiClock className="h-3 w-3" />
                    <span title={formatTimestamp(event.createdAt)}>
                      {timeAgo(event.createdAt)}
                    </span>
                    <span className="mx-1">·</span>
                    <span>{formatTimestamp(event.createdAt)}</span>
                  </p>
                </div>
              </div>
            );
          })}

        {!loading && displayEvents.length > 0 && (
          <div className="flex items-center gap-2 rounded-xl bg-indigo-50 p-4 text-xs text-indigo-700 dark:bg-indigo-950/30 dark:text-indigo-300">
            <FiLock className="shrink-0" />
            All events are logged server-side and tamper-proof.
          </div>
        )}
      </div>
    </div>
  );
}
