"use client";

import { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { FiMaximize2, FiMinimize2 } from "react-icons/fi";
import { useCallStore } from "@/context/stores/call-store";
import CallControls from "./CallControls";
import CallTimer from "./CallTimer";

export default function ActiveCallOverlay() {
  const {
    activeCall,
    callStatus,
    isFullscreen,
    callDuration,
    localStream,
    remoteStream,
    toggleFullscreen,
  } = useCallStore();

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);

  // Attach streams to video elements
  useEffect(() => {
    if (localVideoRef.current) {
      localVideoRef.current.srcObject = localStream ?? null;
    }
  }, [localStream]);

  useEffect(() => {
    if (remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = remoteStream ?? null;
    }
  }, [remoteStream]);

  // Don't render if no active call or status is idle
  if (!activeCall || callStatus === "idle") return null;

  return (
    <AnimatePresence>
      {isFullscreen ? (
        // ─── Fullscreen Mode ────────────────────────────────────────
        <motion.div
          key="fullscreen"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-zinc-950"
        >
          {/* Remote video (full screen) */}
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            className="absolute inset-0 h-full w-full object-cover"
          />

          {/* Local video (PiP) */}
          <video
            ref={localVideoRef}
            autoPlay
            playsInline
            muted
            className="absolute bottom-24 right-6 h-36 w-48 rounded-xl border-2 border-zinc-700 object-cover shadow-lg"
          />

          {/* Top bar: name + timer */}
          <div className="absolute left-0 right-0 top-0 flex items-center justify-between px-6 pt-6">
            <div>
              <p className="text-sm font-bold text-white drop-shadow-lg">
                {activeCall.peerUsername}
              </p>
              <p className="text-xs text-zinc-300 drop-shadow-lg">
                {activeCall.method === "LIVEKIT" ? "Group call" : "1:1 call"}
              </p>
            </div>
            <CallTimer duration={callDuration} className="text-white drop-shadow-lg" />
          </div>

          {/* Bottom controls */}
          <div className="absolute bottom-8 left-0 right-0 flex justify-center">
            <CallControls variant="fullscreen" />
          </div>
        </motion.div>
      ) : (
        // ─── PiP Mode (bottom-right) ───────────────────────────────
        <motion.div
          key="pip"
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="fixed bottom-6 right-6 z-50 w-72 overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-2xl dark:border-zinc-700 dark:bg-zinc-900"
        >
          {/* Remote video */}
          <div className="relative h-40 bg-zinc-900">
            <video
              ref={remoteVideoRef}
              autoPlay
              playsInline
              className="h-full w-full object-cover"
            />
            {/* Overlay gradient */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />

            {/* Name + timer */}
            <div className="absolute bottom-2 left-3 right-3 flex items-center justify-between">
              <p className="truncate text-sm font-bold text-white">
                {activeCall.peerUsername}
              </p>
              <CallTimer duration={callDuration} className="text-white/80" />
            </div>
          </div>

          {/* Local video (small PiP) */}
          <video
            ref={localVideoRef}
            autoPlay
            playsInline
            muted
            className="absolute right-2 top-2 h-14 w-20 rounded-lg border border-zinc-600 object-cover"
          />

          {/* Controls + expand */}
          <div className="flex items-center justify-between px-3 pb-3 pt-2">
            <CallControls variant="overlay" />
            <button
              onClick={toggleFullscreen}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-100 text-zinc-500 transition-colors hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-700"
              title="Expand"
            >
              <FiMaximize2 className="h-3.5 w-3.5" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
