"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  FiMic,
  FiMicOff,
  FiVideo,
  FiVideoOff,
  FiPhoneOff,
  FiMaximize2,
  FiInfo,
  FiX,
} from "react-icons/fi";
import { useCallStore } from "@/context/stores/call-store";
import { getActiveCall, formatDuration } from "@/lib/webrtc";
import CallTimer from "./CallTimer";

const RING_LABELS = ["Calling", "Ringing", "Still trying"];

function formatCallType(method: string): string {
  return method === "LIVEKIT" ? "Group Call" : "Direct Call";
}

// ─── Sidebar ────────────────────────────────────────────────────────────────

function CallSidebar({
  visible,
  onClose,
}: {
  visible: boolean;
  onClose: () => void;
}) {
  const { activeCall, callStatus, callDuration, isMuted, isVideoOff } =
    useCallStore();

  if (!activeCall) return null;

  const isConnecting = callStatus === "connecting";

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ x: 320, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: 320, opacity: 0 }}
          transition={{ type: "spring", damping: 28, stiffness: 300 }}
          className="absolute right-0 top-0 z-20 flex h-full w-56 sm:w-64 flex-col border-l border-zinc-700/50 bg-zinc-900/90 backdrop-blur-xl"
        >
          <div className="flex items-center justify-between px-5 py-4">
            <h3 className="text-sm font-semibold text-white">Call Details</h3>
            <button
              onClick={onClose}
              className="flex h-7 w-7 items-center justify-center rounded-lg text-zinc-400 transition-colors hover:bg-zinc-700/50 hover:text-white"
            >
              <FiX className="h-4 w-4" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-5 pb-5">
            <div className="flex flex-col items-center py-4">
              <div className="relative mb-3">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-purple-500 to-purple-700 text-lg font-bold text-white shadow-lg shadow-purple-500/20">
                  {activeCall.peerUsername?.[0]?.toUpperCase() || "?"}
                </div>
                {!isConnecting && callStatus === "connected" && (
                  <motion.span
                    className="absolute -bottom-0.5 -right-0.5 h-4 w-4 rounded-full border-2 border-zinc-900 bg-emerald-400"
                    animate={{ scale: [1, 1.15, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  />
                )}
              </div>
              <p className="text-base font-semibold text-white">
                {activeCall.peerUsername}
              </p>
              <p className="mt-0.5 text-xs text-zinc-400">
                {isConnecting
                  ? "Connecting..."
                  : callStatus === "connected"
                    ? "In call"
                    : "Ringing"}
              </p>
            </div>

            <div className="space-y-3">
              <div className="rounded-xl bg-zinc-800/50 p-3.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-zinc-400">Call type</span>
                  <span className="text-xs font-medium text-zinc-200">
                    {formatCallType(activeCall.method)}
                  </span>
                </div>
              </div>

              <div className="rounded-xl bg-zinc-800/50 p-3.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-zinc-400">Duration</span>
                  <span className="text-xs font-medium text-zinc-200">
                    {isConnecting ? "Connecting" : formatDuration(callDuration)}
                  </span>
                </div>
              </div>

              <div className="rounded-xl bg-zinc-800/50 p-3.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-zinc-400">Microphone</span>
                  <span
                    className={`text-xs font-medium ${
                      isMuted ? "text-red-400" : "text-emerald-400"
                    }`}
                  >
                    {isMuted ? "Muted" : "On"}
                  </span>
                </div>
              </div>

              <div className="rounded-xl bg-zinc-800/50 p-3.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-zinc-400">Camera</span>
                  <span
                    className={`text-xs font-medium ${
                      isVideoOff ? "text-red-400" : "text-emerald-400"
                    }`}
                  >
                    {isVideoOff ? "Off" : "On"}
                  </span>
                </div>
              </div>

              <div className="rounded-xl bg-zinc-800/50 p-3.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-zinc-400">Call ID</span>
                  <span className="max-w-[140px] truncate text-[10px] font-mono text-zinc-500">
                    {activeCall.callId}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ─── Main Modal ─────────────────────────────────────────────────────────────

export default function OutgoingCallModal() {
  const {
    activeCall,
    callStatus,
    isCaller,
    localStream,
    callDuration,
    isMuted,
    isVideoOff,
    toggleMute,
    toggleVideo,
    toggleFullscreen,
  } = useCallStore();

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [ringIndex, setRingIndex] = useState(0);
  const [showSidebar, setShowSidebar] = useState(false);

  const startTimer = useCallStore((s) => s.startTimer);
  const stopTimer = useCallStore((s) => s.stopTimer);
  const tickTimer = useCallStore((s) => s.tickTimer);

  const isVisible = isCaller && (callStatus === "ringing" || callStatus === "connecting") && activeCall;

  // Start/tick timer during ringing/connecting
  useEffect(() => {
    if (!isVisible) return;

    const { callStartedAt } = useCallStore.getState();
    if (!callStartedAt) {
      startTimer();
    }

    const interval = setInterval(() => {
      tickTimer();
    }, 1000);

    return () => clearInterval(interval);
  }, [isVisible, startTimer, tickTimer]);

  const handleHangup = useCallback(() => {
    const call = getActiveCall();
    if (call) {
      call.hangup("you");
    } else {
      useCallStore.getState().hangupCall("you");
    }
  }, []);

  // Cycle ring label every 3s
  useEffect(() => {
    if (!isVisible) return;
    setRingIndex(0);
    const interval = setInterval(() => {
      setRingIndex((i) => (i + 1) % RING_LABELS.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [isVisible]);

  // Attach local stream to video
  useEffect(() => {
    const el = videoRef.current;
    if (el && localStream && isVisible) {
      el.srcObject = localStream;
      el.play().catch(() => {});
    }
  }, [localStream, isVisible]);

  if (!isVisible) return null;

  const isConnecting = callStatus === "connecting";

  return (
    <AnimatePresence>
      <motion.div
        key="outgoing-call"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/70 backdrop-blur-sm p-4"
      >
        <motion.div
          initial={{ scale: 0.92, opacity: 0, y: 12 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.92, opacity: 0, y: 12 }}
          transition={{ type: "spring", damping: 28, stiffness: 340 }}
          className="relative h-[60vh] sm:h-[70vh] md:h-140 w-full max-w-sm sm:max-w-md lg:max-w-lg overflow-hidden rounded-3xl bg-zinc-900/95 shadow-2xl ring-1 ring-zinc-700/50 backdrop-blur-xl"
        >
          {/* Video preview */}
          <div className="relative h-full overflow-hidden bg-zinc-800">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-zinc-900/20 via-transparent to-zinc-900/80" />

            {/* Top bar: timer + sidebar toggle */}
            <div className="absolute inset-x-0 top-0 z-10 flex items-center justify-between px-5 pt-5">
              {!isConnecting && (
                <CallTimer
                  duration={callDuration}
                  className="rounded-full bg-zinc-900/50 px-3 py-1 text-sm text-white backdrop-blur-sm"
                />
              )}
              {isConnecting && <div />}
              <button
                onClick={() => setShowSidebar(!showSidebar)}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-zinc-900/50 text-white/60 backdrop-blur-sm transition-colors hover:bg-zinc-800/70 hover:text-white"
              >
                <FiInfo className="h-4 w-4" />
              </button>
            </div>

            {/* Peer info overlay */}
            <div className="absolute inset-x-0 bottom-1/3 z-10 flex flex-col items-center px-4 ">
              {/* Avatar */}
              <div className="relative mb-3">
                <div className="flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-full bg-gradient-to-br from-purple-500 to-purple-700 text-lg sm:text-xl font-bold text-white shadow-lg shadow-purple-500/30">
                  {activeCall?.peerUsername?.[0]?.toUpperCase() || "?"}
                </div>
                {/* Pulsing ring */}
                <motion.span
                  className="absolute -inset-1 rounded-full border-2 border-purple-400/40"
                  animate={{ scale: [1, 1.15, 1], opacity: [0.6, 0, 0.6] }}
                  transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                />
              </div>
              <p className="text-base sm:text-lg font-semibold text-white drop-shadow-lg">
                {activeCall?.peerUsername}
              </p>
              <div className="mt-1.5 flex items-center gap-2">
                <motion.div
                  className="flex gap-1"
                  animate={{ opacity: [0.5, 1, 0.5] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-purple-400" />
                  <span className="h-1.5 w-1.5 rounded-full bg-purple-400" />
                  <span className="h-1.5 w-1.5 rounded-full bg-purple-400" />
                </motion.div>
                <span className="text-sm text-zinc-300">
                  {isConnecting ? "Connecting..." : `${RING_LABELS[ringIndex]}...`}
                </span>
              </div>
              <p className="mt-1 text-xs text-zinc-500">
                {formatCallType(activeCall?.method || "WEBRTC")}
              </p>
            </div>

            {/* Connecting spinner */}
            {isConnecting && (
              <div className="absolute inset-0 z-10 flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                    className="h-10 w-10 sm:h-12 sm:w-12 rounded-full border-[3px] border-zinc-600 border-t-purple-400"
                  />
                  <div className="text-center">
                    <p className="text-base font-medium text-white">
                      Connecting to {activeCall?.peerUsername}...
                    </p>
                    <p className="mt-1 text-sm text-zinc-400">Setting up call</p>
                  </div>
                </div>
              </div>
            )}

            {/* Controls */}
            <div className="absolute inset-x-0 bottom-0 z-10 flex justify-center pb-2">
              <div className="flex items-center gap-2 sm:gap-3 rounded-2xl bg-zinc-900/60 px-3 sm:px-5 py-2.5 sm:py-3 backdrop-blur-md">
                <motion.button
                  onClick={toggleMute}
                  whileHover={{ scale: 1.08 }}
                  whileTap={{ scale: 0.92 }}
                  className={`flex h-10 w-10 sm:h-11 sm:w-11 items-center justify-center rounded-full transition-colors ${
                    isMuted
                      ? "bg-red-500/15 text-red-400"
                      : "bg-zinc-800/80 text-zinc-300 hover:bg-zinc-700/80"
                  }`}
                  title={isMuted ? "Unmute" : "Mute"}
                >
                  {isMuted ? (
                    <FiMicOff className="h-5 w-5" />
                  ) : (
                    <FiMic className="h-5 w-5" />
                  )}
                </motion.button>

                <motion.button
                  onClick={toggleVideo}
                  whileHover={{ scale: 1.08 }}
                  whileTap={{ scale: 0.92 }}
                  className={`flex h-10 w-10 sm:h-11 sm:w-11 items-center justify-center rounded-full transition-colors ${
                    isVideoOff
                      ? "bg-red-500/15 text-red-400"
                      : "bg-zinc-800/80 text-zinc-300 hover:bg-zinc-700/80"
                  }`}
                  title={isVideoOff ? "Turn on camera" : "Turn off camera"}
                >
                  {isVideoOff ? (
                    <FiVideoOff className="h-5 w-5" />
                  ) : (
                    <FiVideo className="h-5 w-5" />
                  )}
                </motion.button>

                <motion.button
                  onClick={handleHangup}
                  whileHover={{ scale: 1.08 }}
                  whileTap={{ scale: 0.92 }}
                  className="flex h-12 w-12 sm:h-13 sm:w-13 items-center justify-center rounded-full bg-red-500 text-white shadow-lg shadow-red-500/30 transition-colors hover:bg-red-600"
                  title="End call"
                >
                  <FiPhoneOff className="h-5 w-5" />
                </motion.button>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <CallSidebar visible={showSidebar} onClose={() => setShowSidebar(false)} />
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
