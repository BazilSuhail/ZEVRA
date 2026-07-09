"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  FiMic,
  FiMicOff,
  FiVideo,
  FiVideoOff,
  FiPhoneOff,
  FiMaximize2,
  FiMinimize2,
  FiInfo,
  FiX,
} from "react-icons/fi";
import { useCallStore } from "@/context/stores/call-store";
import { getActiveCall } from "@/lib/webrtc";
import CallTimer from "./CallTimer";

function useAttachStream(stream: MediaStream | null) {
  const streamRef = useRef(stream);
  streamRef.current = stream;

  const elRef = useRef<HTMLVideoElement | null>(null);

  const callbackRef = useCallback((el: HTMLVideoElement | null) => {
    elRef.current = el;
    if (el && streamRef.current) {
      el.srcObject = streamRef.current;
      el.play().catch(() => {});
    }
  }, []);

  useEffect(() => {
    const el = elRef.current;
    if (el && stream) {
      if (el.srcObject !== stream) {
        el.srcObject = stream;
        el.play().catch(() => {});
      }
    }
  }, [stream]);

  return callbackRef;
}

function formatCallType(method: string): string {
  return method === "LIVEKIT" ? "Group Call" : "Direct Call";
}

function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}h ${m}m ${s}s`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
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
          className="absolute right-0 top-0 z-20 flex h-full w-72 flex-col border-l border-white/5 bg-zinc-900/80 backdrop-blur-xl"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4">
            <h3 className="text-sm font-semibold text-white">Call Details</h3>
            <button
              onClick={onClose}
              className="flex h-7 w-7 items-center justify-center rounded-lg text-zinc-400 transition-colors hover:bg-white/5 hover:text-white"
            >
              <FiX className="h-4 w-4" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-5 pb-5">
            {/* Peer info */}
            <div className="flex flex-col items-center py-4">
              <div className="relative mb-3">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 text-lg font-bold text-white shadow-lg shadow-indigo-500/20">
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

            {/* Details */}
            <div className="space-y-3">
              <div className="rounded-xl bg-white/[0.03] p-3.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-zinc-500">Call type</span>
                  <span className="text-xs font-medium text-zinc-300">
                    {formatCallType(activeCall.method)}
                  </span>
                </div>
              </div>

              <div className="rounded-xl bg-white/[0.03] p-3.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-zinc-500">Duration</span>
                  <span className="text-xs font-medium text-zinc-300">
                    {isConnecting
                      ? "Connecting"
                      : formatDuration(callDuration)}
                  </span>
                </div>
              </div>

              <div className="rounded-xl bg-white/[0.03] p-3.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-zinc-500">Microphone</span>
                  <span
                    className={`text-xs font-medium ${
                      isMuted ? "text-red-400" : "text-emerald-400"
                    }`}
                  >
                    {isMuted ? "Muted" : "On"}
                  </span>
                </div>
              </div>

              <div className="rounded-xl bg-white/[0.03] p-3.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-zinc-500">Camera</span>
                  <span
                    className={`text-xs font-medium ${
                      isVideoOff ? "text-red-400" : "text-emerald-400"
                    }`}
                  >
                    {isVideoOff ? "Off" : "On"}
                  </span>
                </div>
              </div>

              <div className="rounded-xl bg-white/[0.03] p-3.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-zinc-500">Call ID</span>
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

// ─── Controls ───────────────────────────────────────────────────────────────

function ControlButton({
  onClick,
  active,
  danger,
  children,
  label,
}: {
  onClick: () => void;
  active?: boolean;
  danger?: boolean;
  children: React.ReactNode;
  label: string;
}) {
  return (
    <motion.button
      onClick={onClick}
      whileHover={{ scale: 1.08 }}
      whileTap={{ scale: 0.92 }}
      className={`flex h-12 w-12 items-center justify-center rounded-full transition-colors ${
        danger
          ? "bg-red-500 text-white shadow-lg shadow-red-500/30 hover:bg-red-600"
          : active
            ? "bg-white/15 text-white"
            : "bg-white/[0.06] text-zinc-300 hover:bg-white/10"
      }`}
      title={label}
    >
      {children}
    </motion.button>
  );
}

// ─── Main Overlay ───────────────────────────────────────────────────────────

export default function ActiveCallOverlay() {
  const {
    activeCall,
    callStatus,
    isFullscreen,
    callDuration,
    localStream,
    remoteStream,
    isMuted,
    isVideoOff,
    toggleMute,
    toggleVideo,
    toggleFullscreen,
  } = useCallStore();

  const [showSidebar, setShowSidebar] = useState(false);

  const localRef = useAttachStream(localStream);
  const remoteRef = useAttachStream(remoteStream);

  const handleHangup = () => {
    const call = getActiveCall();
    if (call) {
      call.hangup("you");
    } else {
      useCallStore.getState().hangupCall("you");
    }
  };

  if (!activeCall || callStatus === "idle") return null;

  const isConnecting = callStatus === "connecting";
  const hasRemote = !!remoteStream;

  // ─── Fullscreen ────────────────────────────────────────────────────

  if (isFullscreen) {
    return (
      <motion.div
        key="fullscreen"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex bg-zinc-950"
      >
        {/* Main video area */}
        <div className="relative flex-1">
          {hasRemote ? (
            <video
              ref={remoteRef}
              autoPlay
              playsInline
              className="absolute inset-0 h-full w-full object-cover"
            />
          ) : (
            <video
              ref={localRef}
              autoPlay
              playsInline
              muted
              className="absolute inset-0 h-full w-full object-cover"
            />
          )}

          {/* Gradient overlays */}
          <div className="absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-black/40 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-black/50 to-transparent" />

          {/* Local PiP */}
          {hasRemote && (
            <motion.video
              ref={localRef}
              autoPlay
              playsInline
              muted
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="absolute bottom-28 right-6 h-36 w-48 rounded-2xl border-2 border-white/10 object-cover shadow-2xl"
            />
          )}

          {/* Header */}
          <div className="absolute inset-x-0 top-0 z-10 flex items-center justify-between px-6 pt-5">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-sm font-bold text-white backdrop-blur-sm">
                {activeCall.peerUsername?.[0]?.toUpperCase()}
              </div>
              <div>
                <p className="text-sm font-semibold text-white drop-shadow-lg">
                  {activeCall.peerUsername}
                </p>
                <p className="text-xs text-white/50 drop-shadow-lg">
                  {isConnecting ? "Connecting..." : formatCallType(activeCall.method)}
                </p>
              </div>
            </div>
            {!isConnecting && (
              <CallTimer
                duration={callDuration}
                className="rounded-full bg-black/30 px-3 py-1 text-sm text-white backdrop-blur-sm"
              />
            )}
          </div>

          {/* Connecting spinner */}
          {isConnecting && (
            <div className="absolute inset-0 z-10 flex items-center justify-center">
              <div className="flex flex-col items-center gap-4">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                  className="h-12 w-12 rounded-full border-[3px] border-white/15 border-t-white"
                />
                <div className="text-center">
                  <p className="text-base font-medium text-white">
                    Connecting to {activeCall.peerUsername}...
                  </p>
                  <p className="mt-1 text-sm text-white/40">Setting up call</p>
                </div>
              </div>
            </div>
          )}

          {/* Center bottom controls */}
          <div className="absolute inset-x-0 bottom-0 z-10 flex justify-center pb-6">
            <div className="flex items-center gap-3 rounded-2xl bg-black/40 px-5 py-3 backdrop-blur-md">
              <ControlButton
                onClick={toggleMute}
                active={!isMuted}
                label={isMuted ? "Unmute" : "Mute"}
              >
                {isMuted ? <FiMicOff className="h-5 w-5" /> : <FiMic className="h-5 w-5" />}
              </ControlButton>

              <ControlButton
                onClick={toggleVideo}
                active={!isVideoOff}
                label={isVideoOff ? "Turn on camera" : "Turn off camera"}
              >
                {isVideoOff ? <FiVideoOff className="h-5 w-5" /> : <FiVideo className="h-5 w-5" />}
              </ControlButton>

              <ControlButton onClick={handleHangup} danger label="End call">
                <FiPhoneOff className="h-5 w-5" />
              </ControlButton>
            </div>
          </div>

          {/* Sidebar toggle */}
          <div className="absolute right-4 top-20 z-10">
            <button
              onClick={() => setShowSidebar(!showSidebar)}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-black/30 text-white/60 backdrop-blur-sm transition-colors hover:bg-black/50 hover:text-white"
            >
              <FiInfo className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Sidebar */}
        <CallSidebar visible={showSidebar} onClose={() => setShowSidebar(false)} />
      </motion.div>
    );
  }

  // ─── PiP (non-fullscreen) ─────────────────────────────────────────

  return (
    <motion.div
      key="pip"
      initial={{ y: 80, opacity: 0, scale: 0.95 }}
      animate={{ y: 0, opacity: 1, scale: 1 }}
      exit={{ y: 80, opacity: 0, scale: 0.95 }}
      transition={{ type: "spring", damping: 28, stiffness: 340 }}
      className="fixed bottom-6 right-6 z-50 w-72 overflow-hidden rounded-2xl border border-white/10 bg-zinc-900/95 shadow-2xl backdrop-blur-xl"
    >
      {/* Video */}
      <div className="relative h-40">
        {hasRemote ? (
          <video
            ref={remoteRef}
            autoPlay
            playsInline
            className="h-full w-full object-cover"
          />
        ) : (
          <video
            ref={localRef}
            autoPlay
            playsInline
            muted
            className="h-full w-full object-cover"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-900/80 via-transparent to-transparent" />

        {hasRemote && (
          <video
            ref={localRef}
            autoPlay
            playsInline
            muted
            className="absolute right-2 top-2 h-14 w-20 rounded-xl border border-white/15 object-cover shadow-lg"
          />
        )}

        <div className="absolute bottom-2 left-3 right-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-white/10 text-[10px] font-bold text-white">
              {activeCall.peerUsername?.[0]?.toUpperCase()}
            </div>
            <p className="truncate text-sm font-semibold text-white drop-shadow-lg">
              {activeCall.peerUsername}
            </p>
          </div>
          {isConnecting ? (
            <motion.div
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 1.2, repeat: Infinity }}
              className="flex items-center gap-1.5"
            >
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              <span className="text-xs text-white/70">Connecting</span>
            </motion.div>
          ) : (
            <CallTimer duration={callDuration} className="text-xs text-white/70" />
          )}
        </div>
      </div>

      {/* Center bottom controls */}
      <div className="flex items-center justify-center gap-2 px-3 pb-3 pt-2">
        <motion.button
          onClick={toggleMute}
          whileTap={{ scale: 0.92 }}
          className={`flex h-9 w-9 items-center justify-center rounded-full transition-colors ${
            isMuted
              ? "bg-red-500/15 text-red-400"
              : "bg-white/[0.06] text-zinc-300 hover:bg-white/10"
          }`}
        >
          {isMuted ? <FiMicOff className="h-4 w-4" /> : <FiMic className="h-4 w-4" />}
        </motion.button>

        <motion.button
          onClick={handleHangup}
          whileTap={{ scale: 0.92 }}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-red-500 text-white shadow-lg shadow-red-500/30 transition-colors hover:bg-red-600"
        >
          <FiPhoneOff className="h-4 w-4" />
        </motion.button>

        <motion.button
          onClick={toggleVideo}
          whileTap={{ scale: 0.92 }}
          className={`flex h-9 w-9 items-center justify-center rounded-full transition-colors ${
            isVideoOff
              ? "bg-red-500/15 text-red-400"
              : "bg-white/[0.06] text-zinc-300 hover:bg-white/10"
          }`}
        >
          {isVideoOff ? <FiVideoOff className="h-4 w-4" /> : <FiVideo className="h-4 w-4" />}
        </motion.button>

        <motion.button
          onClick={toggleFullscreen}
          whileTap={{ scale: 0.92 }}
          className="flex h-9 w-9 items-center justify-center rounded-full bg-white/[0.06] text-zinc-400 transition-colors hover:bg-white/10 hover:text-white ml-1"
          title="Expand"
        >
          <FiMaximize2 className="h-3.5 w-3.5" />
        </motion.button>
      </div>
    </motion.div>
  );
}
