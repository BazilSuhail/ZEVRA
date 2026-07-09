"use client";

import { FiBell, FiMoon, FiSun, FiMonitor, FiPhone } from "react-icons/fi";
import { useUiStore } from "@/context/stores/ui-store";
import type { Theme } from "@/context/stores/ui-store";
import { useCallStore } from "@/context/stores/call-store";

export default function SettingsPage() {
  const theme = useUiStore((s) => s.theme);
  const setTheme = useUiStore((s) => s.setTheme);
  const ringtoneEnabled = useCallStore((s) => s.ringtoneEnabled);
  const setRingtoneEnabled = useCallStore((s) => s.setRingtoneEnabled);

  const themeOptions: { value: Theme; label: string; icon: typeof FiMoon }[] = [
    { value: "dark", label: "Dark", icon: FiMoon },
    { value: "light", label: "Light", icon: FiSun },
    { value: "system", label: "System", icon: FiMonitor },
  ];

  return (
    <div className="flex flex-1 flex-col overflow-y-auto bg-[#fbfcfd] dark:bg-zinc-950">
      <header className="border-b border-zinc-200 bg-white px-6 py-6 dark:border-zinc-800 dark:bg-zinc-900">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-indigo-500">Preferences</p>
        <h1 className="mt-1 text-2xl font-bold">Settings</h1>
      </header>

      <div className="mx-auto w-full space-y-4 p-6">
        <div className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex items-center gap-3 mb-4">
            {theme === "dark" ? (
              <FiMoon className="text-indigo-600" />
            ) : theme === "light" ? (
              <FiSun className="text-amber-500" />
            ) : (
              <FiMonitor className="text-indigo-600" />
            )}
            <div>
              <p className="font-semibold">Appearance</p>
              <p className="text-xs text-zinc-500">
                {theme === "dark" ? "Dark mode" : theme === "light" ? "Light mode" : "跟随系统"}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            {themeOptions.map((opt) => {
              const Icon = opt.icon;
              return (
                <button
                  key={opt.value}
                  onClick={() => setTheme(opt.value)}
                  className={`flex items-center gap-2 rounded-lg px-4 py-2.5 text-xs font-semibold transition-colors ${
                    theme === opt.value
                      ? "bg-indigo-600 text-white"
                      : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-700"
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {opt.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <FiBell className="text-indigo-600" />
              <div>
                <p className="font-semibold">Notifications</p>
                <p className="text-xs text-zinc-500">Push notification settings</p>
              </div>
            </div>
            <div className="h-6 w-11 rounded-full bg-zinc-300 p-1 dark:bg-zinc-700">
              <span className="block h-4 w-4 rounded-full bg-white" />
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <FiPhone className="text-indigo-600" />
              <div>
                <p className="font-semibold">Call Ringtone</p>
                <p className="text-xs text-zinc-500">Play sound for incoming calls</p>
              </div>
            </div>
            <button
              onClick={() => setRingtoneEnabled(!ringtoneEnabled)}
              className={`relative h-6 w-11 rounded-full p-1 transition-colors ${
                ringtoneEnabled ? "bg-indigo-600" : "bg-zinc-300 dark:bg-zinc-700"
              }`}
            >
              <span
                className={`block h-4 w-4 rounded-full bg-white transition-transform ${
                  ringtoneEnabled ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
