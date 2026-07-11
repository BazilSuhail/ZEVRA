"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { FiPhone, FiPhoneOff } from "react-icons/fi";
import { useCallStore } from "@/context/stores/call-store";
import { getSocket } from "@/lib/socket";
import { SOCKET_EVENTS } from "@/constants";

export default function IncomingCallModal() {
  const { incomingCall, callStatus, ringtoneEnabled } = useCallStore();
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [secondsLeft, setSecondsLeft] = useState(30);

  const isVisible = !!incomingCall && callStatus === "idle";

  const handleReject = useCallback(() => {
    if (!incomingCall) return;
    const socket = getSocket();
    if (socket) {
      socket.emit(SOCKET_EVENTS.CALL_REJECT, { callId: incomingCall.callId });
    }
    useCallStore.getState().rejectCall();
  }, [incomingCall]);

  const handleAccept = async () => {
    if (!incomingCall) return;
    const socket = getSocket();
    if (!socket) return;

    useCallStore.getState().setActiveCall({
      callId: incomingCall.callId,
      method: incomingCall.method || "WEBRTC",
      peerId: incomingCall.callerId,
      peerUsername: incomingCall.callerUsername,
    });
    useCallStore.getState().setCallStatus("connecting");
    useCallStore.getState().clearIncomingCall();

    socket.emit(SOCKET_EVENTS.CALL_ACCEPT, { callId: incomingCall.callId });
  };

  // Play ringtone
  useEffect(() => {
    if (isVisible && ringtoneEnabled) {
      try {
        audioRef.current = new Audio("/sounds/ringtone.mp3");
        audioRef.current.loop = true;
        audioRef.current.volume = 0.5;
        audioRef.current.play().catch(() => {});
      } catch {}
    }

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
        audioRef.current = null;
      }
    };
  }, [incomingCall?.callId, isVisible, ringtoneEnabled]);

  // Countdown auto-dismiss
  useEffect(() => {
    if (!isVisible) return;
    setSecondsLeft(30);

    const timer = setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) {
          clearInterval(timer);
          handleReject();
          return 0;
        }
        return s - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [incomingCall?.callId, isVisible, handleReject]);

  // Progress percentage for visual timer ring
  const progressPercent = (secondsLeft / 30) * 100;

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          key="incoming-call"
          initial={{ opacity: 0, y: -24, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.95 }}
          transition={{ type: "spring", damping: 25, stiffness: 350 }}
          className="fixed top-3 right-3 sm:top-5 sm:right-5 z-[70] w-[calc(100%-1.5rem)] max-w-[300px] sm:max-w-[320px]"
        >
          {/* Card Wrapper with Light + Dark Mode Support */}
          <div className="relative overflow-hidden rounded-2xl border border-indigo-200/80 bg-white/90 p-3.5 shadow-xl shadow-indigo-950/10 backdrop-blur-xl dark:border-indigo-500/20 dark:bg-zinc-950/90 dark:shadow-2xl dark:shadow-indigo-950/50">
            {/* Ambient Purple/Indigo Background Glows */}
            <div className="pointer-events-none absolute -top-10 -left-10 h-28 w-28 rounded-full bg-indigo-500/10 blur-xl dark:bg-indigo-600/15" />
            <div className="pointer-events-none absolute -bottom-10 -right-10 h-28 w-28 rounded-full bg-purple-500/10 blur-xl dark:bg-purple-600/15" />

            <div className="flex items-start gap-3">
              {/* Reduced Avatar Container (40px) */}
              <div className="relative h-10 w-10 shrink-0">
                {/* SVG Countdown Ring scaled down to 40px */}
                <svg className="h-10 w-10 -rotate-90 stroke-current text-indigo-500/20">
                  <circle
                    cx="20"
                    cy="20"
                    r="17"
                    strokeWidth="2.5"
                    fill="transparent"
                  />
                  <circle
                    cx="20"
                    cy="20"
                    r="17"
                    strokeWidth="2.5"
                    fill="transparent"
                    className="text-indigo-500 transition-all duration-1000 ease-linear dark:text-indigo-400"
                    strokeDasharray={106.8}
                    strokeDashoffset={106.8 - (106.8 * progressPercent) / 100}
                    strokeLinecap="round"
                  />
                </svg>

                {/* Main Compact Avatar */}
                <div className="absolute inset-1 flex items-center justify-center rounded-full bg-gradient-to-tr from-purple-600 to-indigo-600 text-xs font-bold text-white shadow-sm shadow-indigo-500/20">
                  {incomingCall.callerUsername?.[0]?.toUpperCase() || "?"}
                </div>

                {/* Pulsing Signal Dot */}
                <span className="absolute -bottom-0.5 -right-0.5 flex h-3 w-3">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-indigo-400 opacity-75" />
                  <span className="relative inline-flex h-3 w-3 rounded-full border-2 border-white bg-indigo-500 dark:border-zinc-950" />
                </span>
              </div>

              {/* Info & Actions */}
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-1">
                  <h4 className="truncate text-xs font-bold text-zinc-900 dark:text-zinc-100">
                    {incomingCall.callerUsername}
                  </h4>
                  <span className="text-[10px] font-semibold text-indigo-600 dark:text-indigo-300/80">
                    {secondsLeft}s
                  </span>
                </div>

                <p className="text-[11px] font-medium text-purple-700 dark:text-purple-300">
                  Incoming audio call...
                </p>

                {/* Buttons with Darker Emerald Green for Accept */}
                <div className="mt-2.5 flex items-center gap-2">
                  <motion.button
                    onClick={handleReject}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.95 }}
                    className="flex h-8 flex-1 items-center justify-center gap-1 rounded-lg border border-rose-200 bg-rose-50 text-xs font-semibold text-rose-600 transition-colors hover:bg-rose-600 hover:text-white dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-400 dark:hover:bg-rose-600 dark:hover:text-white"
                  >
                    <FiPhoneOff className="h-3 w-3" />
                    Decline
                  </motion.button>

                  <motion.button
                    onClick={handleAccept}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.95 }}
                    className="flex h-8 flex-1 items-center justify-center gap-1 rounded-lg bg-emerald-700 text-xs font-semibold text-white shadow-md shadow-emerald-900/20 transition-all hover:bg-emerald-800 dark:bg-emerald-700 dark:shadow-emerald-950/40 dark:hover:bg-emerald-600"
                  >
                    <FiPhone className="h-3 w-3" />
                    Accept
                  </motion.button>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
