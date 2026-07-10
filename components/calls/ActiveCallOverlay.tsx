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
  FiUser,
} from "react-icons/fi";
import { useCallStore } from "@/context/stores/call-store";
import { getActiveCall, formatDuration } from "@/lib/webrtc";
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

// ─── Control Button Component ─────────────────────────────────────────────

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
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      className={`flex h-11 w-11 items-center justify-center rounded-2xl shadow-md transition-all ${
        danger
          ? "bg-rose-600 text-white shadow-rose-900/20 hover:bg-rose-700"
          : active
            ? "bg-indigo-600 text-white shadow-indigo-900/20 hover:bg-indigo-700"
            : "bg-zinc-100 text-zinc-700 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700"
      }`}
      title={label}
    >
      {children}
    </motion.button>
  );
}

// ─── Sidebar Details & Integrated Controls Panel ────────────────────────────

function CallSidebar({
  visible,
  onClose,
}: {
  visible: boolean;
  onClose: () => void;
}) {
  const {
    activeCall,
    callStatus,
    callDuration,
    isMuted,
    isVideoOff,
    toggleMute,
    toggleVideo,
    toggleFullscreen,
  } = useCallStore();

  if (!activeCall) return null;

  const isConnecting = callStatus === "connecting";

  const handleHangup = () => {
    const call = getActiveCall();
    if (call) {
      call.hangup("you");
    } else {
      useCallStore.getState().hangupCall("you");
    }
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 20 }}
          transition={{ type: "spring", damping: 25, stiffness: 280 }}
          className="flex h-full w-full max-w-sm flex-col justify-between rounded-3xl border border-zinc-200/80 bg-white/95 p-4 shadow-2xl backdrop-blur-2xl dark:border-zinc-800/80 dark:bg-zinc-900/95 lg:max-w-xs lg:shadow-none"
        >
          {/* Top Section */}
          <div className="flex flex-col overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-zinc-200 pb-3 dark:border-zinc-800">
              <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                Call Details
              </h3>
              <button
                onClick={onClose}
                className="flex h-8 w-8 items-center justify-center rounded-full text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
              >
                <FiX className="h-4 w-4" />
              </button>
            </div>

            {/* Content Details */}
            <div className="mt-4 space-y-4 overflow-y-auto pr-1">
              {/* Peer Profile Card */}
              <div className="flex flex-col items-center rounded-2xl bg-zinc-50 p-4 dark:bg-zinc-800/40">
                <div className="relative mb-2">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-violet-600 to-indigo-600 text-xl font-bold text-white shadow-md shadow-indigo-500/20">
                    {activeCall.peerUsername?.[0]?.toUpperCase() || "?"}
                  </div>
                  {!isConnecting && callStatus === "connected" && (
                    <motion.span
                      className="absolute bottom-0 right-0 h-4 w-4 rounded-full border-2 border-white bg-emerald-500 dark:border-zinc-900"
                      animate={{ scale: [1, 1.15, 1] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    />
                  )}
                </div>
                <p className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                  {activeCall.peerUsername}
                </p>
                <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
                  {isConnecting
                    ? "Connecting..."
                    : callStatus === "connected"
                      ? "In call"
                      : "Ringing"}
                </p>
              </div>

              {/* Status Info List */}
              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between rounded-xl bg-zinc-50 p-3 dark:bg-zinc-800/40">
                  <span className="text-zinc-500 dark:text-zinc-400">Call Type</span>
                  <span className="font-semibold text-zinc-800 dark:text-zinc-200">
                    {formatCallType(activeCall.method)}
                  </span>
                </div>

                <div className="flex items-center justify-between rounded-xl bg-zinc-50 p-3 dark:bg-zinc-800/40">
                  <span className="text-zinc-500 dark:text-zinc-400">Duration</span>
                  <span className="font-semibold text-zinc-800 dark:text-zinc-200">
                    {isConnecting ? "Connecting" : formatDuration(callDuration)}
                  </span>
                </div>

                <div className="flex items-center justify-between rounded-xl bg-zinc-50 p-3 dark:bg-zinc-800/40">
                  <span className="text-zinc-500 dark:text-zinc-400">Microphone</span>
                  <span
                    className={`font-semibold ${
                      isMuted ? "text-rose-500" : "text-emerald-600 dark:text-emerald-400"
                    }`}
                  >
                    {isMuted ? "Muted" : "Active"}
                  </span>
                </div>

                <div className="flex items-center justify-between rounded-xl bg-zinc-50 p-3 dark:bg-zinc-800/40">
                  <span className="text-zinc-500 dark:text-zinc-400">Camera</span>
                  <span
                    className={`font-semibold ${
                      isVideoOff ? "text-rose-500" : "text-emerald-600 dark:text-emerald-400"
                    }`}
                  >
                    {isVideoOff ? "Disabled" : "Active"}
                  </span>
                </div>

                <div className="flex items-center justify-between rounded-xl bg-zinc-50 p-3 dark:bg-zinc-800/40">
                  <span className="text-zinc-500 dark:text-zinc-400">Call ID</span>
                  <span className="max-w-[120px] truncate font-mono text-[10px] text-zinc-400">
                    {activeCall.callId}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Integrated Bottom Control Actions Bar */}
          <div className="mt-4 flex items-center justify-between rounded-2xl border border-zinc-200/80 bg-zinc-50 p-2 dark:border-zinc-800/80 dark:bg-zinc-800/40">
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
              {isVideoOff ? (
                <FiVideoOff className="h-5 w-5" />
              ) : (
                <FiVideo className="h-5 w-5" />
              )}
            </ControlButton>

            <ControlButton onClick={handleHangup} danger label="End call">
              <FiPhoneOff className="h-5 w-5" />
            </ControlButton>

            <ControlButton onClick={toggleFullscreen} label="Minimize window">
              <FiMinimize2 className="h-5 w-5" />
            </ControlButton>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ─── Main Component ─────────────────────────────────────────────────────────

export default function ActiveCallOverlay() {
  const {
    activeCall,
    callStatus,
    isCaller,
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

  const [showSidebar, setShowSidebar] = useState(true);

  // ─── Timer management ────────────────────────────────────────────────
  const startTimer = useCallStore((s) => s.startTimer);
  const stopTimer = useCallStore((s) => s.stopTimer);
  const tickTimer = useCallStore((s) => s.tickTimer);

  useEffect(() => {
    const isActive = callStatus === "connecting" || callStatus === "connected";

    if (isActive) {
      const { callStartedAt } = useCallStore.getState();
      if (!callStartedAt) {
        startTimer();
      }

      const interval = setInterval(() => {
        tickTimer();
      }, 1000);

      return () => clearInterval(interval);
    } else {
      stopTimer();
    }
  }, [callStatus, startTimer, stopTimer, tickTimer]);

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
  const isRinging = callStatus === "ringing" && isCaller;
  const hasRemote = !!remoteStream;

  if (isRinging) return null;

  // ─── Fullscreen View ─────────────────────────────────────────

  if (isFullscreen) {
    return (
      <motion.div
        key="fullscreen"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex bg-zinc-950 p-3 sm:p-4 md:p-6"
      >
        <div className="relative flex h-full w-full flex-1 items-stretch gap-4 overflow-hidden">
          {/* Main Video Feed Container */}
          <div className="relative flex h-full flex-1 overflow-hidden rounded-3xl border border-zinc-800/80 bg-zinc-900 shadow-xl transition-all duration-300">
            {hasRemote ? (
              <video
                ref={remoteRef}
                autoPlay
                playsInline
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full flex-col items-center justify-center gap-3 text-zinc-500">
                <div className="flex h-24 w-24 items-center justify-center rounded-full bg-zinc-800 text-3xl font-bold text-zinc-300 shadow-inner">
                  {activeCall.peerUsername?.[0]?.toUpperCase()}
                </div>
                <p className="text-sm font-medium text-zinc-400">
                  {isConnecting
                    ? `Connecting to ${activeCall.peerUsername}...`
                    : activeCall.peerUsername}
                </p>
              </div>
            )}

            {/* Remote Peer Name Label */}
            <div className="absolute bottom-4 left-4 z-10 rounded-xl border border-white/10 bg-zinc-950/60 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur-md">
              {activeCall.peerUsername}
            </div>

            {/* Local Video Stream PIP (Bottom-Right of Video Feed) */}
            <div className="absolute bottom-4 right-4 z-20 h-32 w-44 overflow-hidden rounded-2xl border border-zinc-700/80 bg-zinc-950/90 shadow-2xl backdrop-blur-sm sm:h-40 sm:w-56">
              {!isVideoOff ? (
                <video
                  ref={localRef}
                  autoPlay
                  playsInline
                  muted
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-zinc-800/90">
                  <FiUser className="h-7 w-7 text-zinc-500" />
                </div>
              )}
              <div className="absolute bottom-2 left-2 rounded-lg border border-white/10 bg-zinc-950/70 px-2 py-0.5 text-[10px] font-semibold text-white backdrop-blur-md">
                You {isMuted && "(Muted)"}
              </div>
            </div>

            {/* Top-Right Floating Toggle Button */}
            {!showSidebar && (
              <motion.button
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                onClick={() => setShowSidebar(true)}
                className="absolute top-4 right-4 z-30 flex h-10 w-10 items-center justify-center rounded-full border border-zinc-700/80 bg-zinc-900/90 text-white shadow-xl backdrop-blur-md hover:bg-zinc-800"
                title="Open Call Details"
              >
                <FiInfo className="h-5 w-5" />
              </motion.button>
            )}

            {/* Connecting Spinner Overlay */}
            {isConnecting && (
              <div className="absolute inset-0 z-10 flex items-center justify-center bg-zinc-950/40 backdrop-blur-xs">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                  className="h-10 w-10 rounded-full border-2 border-indigo-500/20 border-t-indigo-500"
                />
              </div>
            )}
          </div>

          {/* Right Side Call Details Sidebar (Contains Bottom Control Row) */}
          <CallSidebar
            visible={showSidebar}
            onClose={() => setShowSidebar(false)}
          />
        </div>
      </motion.div>
    );
  }

  // ─── PiP View (Compact Floater) ───────────────────────────────────

  return (
    <motion.div
      key="pip"
      initial={{ y: 80, opacity: 0, scale: 0.95 }}
      animate={{ y: 0, opacity: 1, scale: 1 }}
      exit={{ y: 80, opacity: 0, scale: 0.95 }}
      transition={{ type: "spring", damping: 28, stiffness: 340 }}
      className="fixed bottom-6 right-6 z-50 w-72 overflow-hidden rounded-3xl border border-zinc-200/80 bg-white/95 shadow-2xl backdrop-blur-xl dark:border-zinc-800/80 dark:bg-zinc-900/95"
    >
      <div className="relative h-40 bg-zinc-900">
        {hasRemote ? (
          <video
            ref={remoteRef}
            autoPlay
            playsInline
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-indigo-600 text-sm font-bold text-white">
              {activeCall.peerUsername?.[0]?.toUpperCase()}
            </div>
          </div>
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/80 via-transparent to-transparent" />

        {hasRemote && (
          <video
            ref={localRef}
            autoPlay
            playsInline
            muted
            className="absolute right-2 top-2 h-14 w-20 rounded-xl border border-white/20 object-cover shadow-lg"
          />
        )}

        <div className="absolute bottom-2.5 left-3 right-3 flex items-center justify-between">
          <p className="truncate text-xs font-bold text-white">
            {activeCall.peerUsername}
          </p>
          {isConnecting ? (
            <span className="text-[10px] font-semibold text-emerald-400">
              Connecting...
            </span>
          ) : (
            <CallTimer duration={callDuration} className="text-[10px] text-zinc-300" />
          )}
        </div>
      </div>

      {/* Compact Controls */}
      <div className="flex items-center justify-center gap-2 p-2.5">
        <motion.button
          onClick={toggleMute}
          whileTap={{ scale: 0.92 }}
          className={`flex h-9 w-9 items-center justify-center rounded-full transition-colors ${
            isMuted
              ? "bg-rose-500/15 text-rose-500"
              : "bg-zinc-100 text-zinc-700 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
          }`}
        >
          {isMuted ? <FiMicOff className="h-4 w-4" /> : <FiMic className="h-4 w-4" />}
        </motion.button>

        <motion.button
          onClick={handleHangup}
          whileTap={{ scale: 0.92 }}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-rose-600 text-white shadow-md shadow-rose-900/20 hover:bg-rose-700"
        >
          <FiPhoneOff className="h-4 w-4" />
        </motion.button>

        <motion.button
          onClick={toggleVideo}
          whileTap={{ scale: 0.92 }}
          className={`flex h-9 w-9 items-center justify-center rounded-full transition-colors ${
            isVideoOff
              ? "bg-rose-500/15 text-rose-500"
              : "bg-zinc-100 text-zinc-700 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
          }`}
        >
          {isVideoOff ? <FiVideoOff className="h-4 w-4" /> : <FiVideo className="h-4 w-4" />}
        </motion.button>

        <motion.button
          onClick={toggleFullscreen}
          whileTap={{ scale: 0.92 }}
          className="flex h-9 w-9 items-center justify-center rounded-full bg-zinc-100 text-zinc-700 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
          title="Expand"
        >
          <FiMaximize2 className="h-3.5 w-3.5" />
        </motion.button>
      </div>
    </motion.div>
  );
}
