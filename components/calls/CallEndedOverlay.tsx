"use client";

import { useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { FiPhoneOff, FiAlertCircle } from "react-icons/fi";
import { useCallStore, type CallEndedInfo } from "@/context/stores/call-store";

function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return s > 0 ? `${m}m ${s}s` : `${m}m`;
}

export default function CallEndedOverlay() {
  const callEndedInfo = useCallStore((s) => s.callEndedInfo);
  const dismissCallEnded = useCallStore((s) => s.dismissCallEnded);

  // Auto-dismiss after 4s
  useEffect(() => {
    if (!callEndedInfo) return;
    const timer = setTimeout(dismissCallEnded, 4000);
    return () => clearTimeout(timer);
  }, [callEndedInfo, dismissCallEnded]);

  return (
    <AnimatePresence>
      {callEndedInfo && (
        <motion.div
          key="call-ended"
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -10, scale: 0.95 }}
          transition={{ type: "spring", damping: 28, stiffness: 340 }}
          className="fixed bottom-4 sm:bottom-6 left-1/2 z-[60] -translate-x-1/2"
        >
          <div
            onClick={dismissCallEnded}
            className="flex cursor-pointer items-center gap-2.5 sm:gap-3 rounded-xl sm:rounded-2xl bg-zinc-900/95 px-4 sm:px-5 py-2.5 sm:py-3 shadow-2xl ring-1 ring-zinc-700/50 backdrop-blur-xl"
          >
            {/* Icon */}
            <div
              className={`flex h-8 w-8 items-center justify-center rounded-full ${
                callEndedInfo.endedBy === "error"
                  ? "bg-red-500/15 text-red-400"
                  : "bg-zinc-700/50 text-zinc-400"
              }`}
            >
              {callEndedInfo.endedBy === "error" ? (
                <FiAlertCircle className="h-4 w-4" />
              ) : (
                <FiPhoneOff className="h-4 w-4" />
              )}
            </div>

            {/* Text */}
            <div className="flex flex-col">
              <span className="text-xs sm:text-sm font-medium text-white">
                {callEndedInfo.endedBy === "you"
                  ? "Call ended"
                  : callEndedInfo.endedBy === "peer"
                    ? `${callEndedInfo.peerUsername} ended the call`
                    : "Call disconnected"}
              </span>
              <span className="text-xs text-zinc-400">
                {callEndedInfo.duration > 0
                  ? `Duration: ${formatDuration(callEndedInfo.duration)}`
                  : "Not connected"}
              </span>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
