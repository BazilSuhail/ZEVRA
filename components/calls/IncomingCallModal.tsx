"use client";

import { useEffect, useRef, useState } from "react";
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
  }, [incomingCall?.callId, isVisible]);

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

  const handleReject = () => {
    if (!incomingCall) return;
    const socket = getSocket();
    if (!socket) return;

    socket.emit(SOCKET_EVENTS.CALL_REJECT, { callId: incomingCall.callId });
    useCallStore.getState().rejectCall();
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          key="incoming-call"
          initial={{ opacity: 0, x: 80, y: -20 }}
          animate={{ opacity: 1, x: 0, y: 0 }}
          exit={{ opacity: 0, x: 80, y: -20 }}
          transition={{ type: "spring", damping: 26, stiffness: 300 }}
          className="fixed right-5 top-5 z-[70] w-80"
        >
          <div className="overflow-hidden rounded-2xl bg-zinc-900/95 shadow-2xl ring-1 ring-white/10 backdrop-blur-xl">
            {/* Top accent bar */}
            <div className="h-0.5 w-full bg-gradient-to-r from-emerald-500 via-emerald-400 to-teal-500" />

            <div className="flex items-center gap-3 px-4 py-3.5">
              {/* Avatar */}
              <div className="relative shrink-0">
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 text-sm font-bold text-white">
                  {incomingCall.callerUsername?.[0]?.toUpperCase() || "?"}
                </div>
                {/* Pulsing dot */}
                <motion.span
                  className="absolute -right-0.5 -top-0.5 h-3 w-3 rounded-full border-2 border-zinc-900 bg-emerald-400"
                  animate={{ scale: [1, 1.3, 1], opacity: [1, 0.6, 1] }}
                  transition={{ duration: 1.2, repeat: Infinity }}
                />
              </div>

              {/* Info + buttons */}
              <div className="flex-1 min-w-0">
                <p className="truncate text-sm font-semibold text-white">
                  {incomingCall.callerUsername}
                </p>
                <p className="text-xs text-zinc-400">
                  Incoming call &middot; {secondsLeft}s
                </p>

                {/* Action buttons */}
                <div className="mt-2 flex items-center gap-2">
                  <motion.button
                    onClick={handleReject}
                    whileTap={{ scale: 0.92 }}
                    className="flex h-8 items-center gap-1.5 rounded-lg bg-red-500/15 px-3 py-1 text-xs font-medium text-red-400 transition-colors hover:bg-red-500/25"
                  >
                    <FiPhoneOff className="h-3 w-3" />
                    Decline
                  </motion.button>
                  <motion.button
                    onClick={handleAccept}
                    whileTap={{ scale: 0.92 }}
                    className="flex h-8 items-center gap-1.5 rounded-lg bg-emerald-500 px-3 py-1 text-xs font-medium text-white shadow-lg shadow-emerald-500/20 transition-colors hover:bg-emerald-600"
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
