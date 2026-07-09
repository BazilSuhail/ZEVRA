"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { FiPhoneOff } from "react-icons/fi";
import { useCallStore } from "@/context/stores/call-store";
import { getActiveCall } from "@/lib/webrtc";

const RING_LABELS = [
  "Calling",
  "Ringing",
  "Still trying",
];

export default function OutgoingCallModal() {
  const { activeCall, callStatus, isCaller, localStream } = useCallStore();
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [ringIndex, setRingIndex] = useState(0);

  const isVisible = isCaller && callStatus === "ringing" && activeCall;

  const handleCancel = () => {
    const call = getActiveCall();
    if (call) {
      call.hangup("you");
    } else {
      useCallStore.getState().hangupCall("you");
    }
  };

  // Cycle ring label every 3s
  useEffect(() => {
    if (!isVisible) return;
    setRingIndex(0);
    const interval = setInterval(() => {
      setRingIndex((i) => (i + 1) % RING_LABELS.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [isVisible]);

  useEffect(() => {
    const el = videoRef.current;
    if (el && localStream && isVisible) {
      el.srcObject = localStream;
      el.play().catch(() => {});
    }
  }, [localStream, isVisible]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
        >
          <motion.div
            initial={{ scale: 0.92, opacity: 0, y: 12 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.92, opacity: 0, y: 12 }}
            transition={{ type: "spring", damping: 28, stiffness: 340 }}
            className="relative w-full max-w-xs overflow-hidden rounded-3xl bg-zinc-900/95 shadow-2xl ring-1 ring-white/10 backdrop-blur-xl"
          >
            {/* Video preview */}
            <div className="relative h-64 overflow-hidden bg-zinc-800">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="h-full w-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/80" />

              {/* Peer info overlay */}
              <div className="absolute inset-x-0 bottom-0 flex flex-col items-center px-4 pb-5">
                {/* Avatar */}
                <div className="relative mb-3">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 text-xl font-bold text-white shadow-lg shadow-indigo-500/30">
                    {activeCall?.peerUsername?.[0]?.toUpperCase() || "?"}
                  </div>
                  {/* Pulsing ring */}
                  <motion.span
                    className="absolute -inset-1 rounded-full border-2 border-indigo-400/40"
                    animate={{ scale: [1, 1.15, 1], opacity: [0.6, 0, 0.6] }}
                    transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                  />
                </div>
                <p className="text-lg font-semibold text-white drop-shadow-lg">
                  {activeCall?.peerUsername}
                </p>
                <div className="mt-1.5 flex items-center gap-2">
                  <motion.div
                    className="flex gap-1"
                    animate={{ opacity: [0.5, 1, 0.5] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  >
                    <span className="h-1.5 w-1.5 rounded-full bg-indigo-400" />
                    <span className="h-1.5 w-1.5 rounded-full bg-indigo-400" />
                    <span className="h-1.5 w-1.5 rounded-full bg-indigo-400" />
                  </motion.div>
                  <span className="text-sm text-zinc-300">
                    {RING_LABELS[ringIndex]}...
                  </span>
                </div>
              </div>
            </div>

            {/* Cancel button */}
            <div className="flex justify-center px-6 py-5">
              <motion.button
                onClick={handleCancel}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="flex h-14 w-14 items-center justify-center rounded-full bg-red-500 text-white shadow-lg shadow-red-500/30 transition-colors hover:bg-red-600"
                title="Cancel call"
              >
                <FiPhoneOff className="h-5 w-5" />
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
