"use client";

import { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { FiPhone, FiPhoneOff } from "react-icons/fi";
import { useCallStore } from "@/context/stores/call-store";
import { getSocket } from "@/lib/socket";
import { SOCKET_EVENTS } from "@/constants";

export default function IncomingCallToast() {
  const { incomingCall, callStatus, ringtoneEnabled } = useCallStore();
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Play ringtone
  useEffect(() => {
    if (incomingCall && callStatus === "idle" && ringtoneEnabled) {
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
  }, [incomingCall?.callId, callStatus, ringtoneEnabled]);

  // Auto-dismiss after 30s
  useEffect(() => {
    if (!incomingCall) return;

    const timer = setTimeout(() => {
      handleReject();
    }, 30000);

    return () => clearTimeout(timer);
  }, [incomingCall?.callId]);

  const handleAccept = async () => {
    if (!incomingCall) return;
    const socket = getSocket();
    if (!socket) return;

    // Set active call + status so overlay shows immediately
    useCallStore.getState().setActiveCall({
      callId: incomingCall.callId,
      method: "WEBRTC",
      peerId: incomingCall.callerId,
      peerUsername: incomingCall.callerUsername,
    });
    useCallStore.getState().setCallStatus("connecting");
    useCallStore.getState().clearIncomingCall();

    // Tell server we accepted
    socket.emit(SOCKET_EVENTS.CALL_ACCEPT, { callId: incomingCall.callId });
  };

  const handleReject = () => {
    if (!incomingCall) return;
    const socket = getSocket();
    if (!socket) return;

    socket.emit(SOCKET_EVENTS.CALL_REJECT, { callId: incomingCall.callId });
    useCallStore.getState().rejectCall();
  };

  return (
    <AnimatePresence>
      {incomingCall && callStatus === "idle" && (
        <motion.div
          initial={{ y: -20, opacity: 0, scale: 0.95 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: -20, opacity: 0, scale: 0.95 }}
          transition={{ type: "spring", damping: 20, stiffness: 260 }}
          className="fixed top-5 right-5 z-50 w-full max-w-xs overflow-hidden rounded-3xl border border-indigo-100/60 bg-white/90 p-4 shadow-xl shadow-indigo-500/10 backdrop-blur-xl transition-all dark:border-indigo-900/40 dark:bg-zinc-950/90 dark:shadow-purple-950/20"
        >
          <div className="flex items-center justify-between gap-3">
            {/* Caller Info & Avatar */}
            <div className="flex items-center gap-3 min-w-0">
              <div className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-500 text-base font-semibold text-white shadow-md shadow-indigo-500/20">
                {incomingCall.callerUsername[0]?.toUpperCase() || "?"}
                <span className="absolute -bottom-0.5 -right-0.5 flex h-3.5 w-3.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-indigo-400 opacity-75"></span>
                  <span className="relative inline-flex h-3.5 w-3.5 rounded-full border-2 border-white bg-indigo-500 dark:border-zinc-950"></span>
                </span>
              </div>

              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
                  {incomingCall.callerUsername}
                </p>
                <p className="text-xs font-medium text-purple-600 dark:text-purple-400">
                  Incoming audio call...
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={handleReject}
                className="group relative flex h-10 w-10 items-center justify-center rounded-2xl bg-zinc-100 text-zinc-600 transition-all duration-200 hover:bg-rose-500 hover:text-white dark:bg-zinc-900 dark:text-zinc-400 dark:hover:bg-rose-600 dark:hover:text-white"
                title="Decline"
                aria-label="Decline Call"
              >
                <FiPhoneOff className="h-4 w-4 transition-transform group-hover:scale-110" />
              </button>

              <button
                onClick={handleAccept}
                className="group relative flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-500 text-white shadow-lg shadow-emerald-500/25 transition-all duration-200 hover:bg-emerald-600 hover:shadow-emerald-500/35 dark:bg-emerald-600 dark:hover:bg-emerald-500"
                title="Accept"
                aria-label="Accept Call"
              >
                <FiPhone className="h-4 w-4 transition-transform group-hover:scale-110" />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
