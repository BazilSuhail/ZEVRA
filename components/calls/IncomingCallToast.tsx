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
          initial={{ x: 400, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: 400, opacity: 0 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="fixed right-4 top-4 z-50 w-80 overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-2xl dark:border-zinc-700 dark:bg-zinc-900"
        >
          {/* Header */}
          <div className="flex items-center gap-3 px-4 pt-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-100 text-sm font-bold text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
              {incomingCall.callerUsername[0]?.toUpperCase() || "?"}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-bold text-zinc-900 dark:text-white">
                {incomingCall.callerUsername}
              </p>
              <p className="text-xs text-zinc-500">Incoming call...</p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2 px-4 pb-4 pt-3">
            <button
              onClick={handleReject}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-red-500 text-white transition-colors hover:bg-red-600"
              title="Decline"
            >
              <FiPhoneOff />
            </button>
            <button
              onClick={handleAccept}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500 text-white transition-colors hover:bg-emerald-600"
              title="Accept"
            >
              <FiPhone />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
