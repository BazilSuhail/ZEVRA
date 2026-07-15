"use client";

import { useEffect, useState, useRef, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  FiMic,
  FiMicOff,
  FiVideo,
  FiVideoOff,
  FiPhoneOff,
  FiMonitor,
  FiMessageSquare,
  FiUsers,
  FiMaximize2,
  FiMinimize2,
} from "react-icons/fi";
import { useCallStore } from "@/context/stores/call-store";
import { getLiveKitRoom, disconnectFromRoom } from "@/lib/livekit";
import GroupVideoGrid, { LocalPIP } from "./GroupVideoGrid";
import GroupCallChat from "./GroupCallChat";
import GroupCallParticipants from "./GroupCallParticipants";

function formatDuration(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

function ControlButton({
  onClick,
  active,
  danger,
  children,
  label,
  badge,
}: {
  onClick: () => void;
  active?: boolean;
  danger?: boolean;
  children: React.ReactNode;
  label: string;
  badge?: number;
}) {
  return (
    <motion.button
      onClick={onClick}
      whileHover={{ scale: 1.08 }}
      whileTap={{ scale: 0.92 }}
      className={`relative flex h-12 w-12 items-center justify-center rounded-full shadow-lg transition-all sm:h-14 sm:w-14 ${
        danger
          ? "bg-rose-600 text-white shadow-rose-900/30 hover:bg-rose-700"
          : active
            ? "bg-indigo-600 text-white shadow-indigo-900/30 hover:bg-indigo-700"
            : "bg-zinc-800/80 text-zinc-300 hover:bg-zinc-700/80 dark:bg-zinc-700/80 dark:text-zinc-200 dark:hover:bg-zinc-600/80"
      }`}
      title={label}
    >
      {children}
      {badge !== undefined && badge > 0 && (
        <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-indigo-600 text-[10px] font-bold text-white">
          {badge > 99 ? "99+" : badge}
        </span>
      )}
    </motion.button>
  );
}

export default function GroupCallModal() {
  const {
    activeCall,
    callStatus,
    callDuration,
    isMuted,
    isVideoOff,
    isScreenSharing,
    isChatOpen,
    isParticipantsOpen,
    participants,
    localStream,
    toggleMute,
    toggleVideo,
    toggleChat,
    toggleParticipants,
    hangupCall,
    setScreenSharing,
  } = useCallStore();

  const startTimer = useCallStore((s) => s.startTimer);
  const stopTimer = useCallStore((s) => s.stopTimer);
  const tickTimer = useCallStore((s) => s.tickTimer);

  // Track local speaking state for PIP indicator
  const [localSpeaking, setLocalSpeaking] = useState(false);
  useEffect(() => {
    const handleSpeakers = (e: Event) => {
      const { speakers: ids } = (e as CustomEvent).detail;
      const room = getLiveKitRoom();
      if (room) {
        setLocalSpeaking(ids.includes(room.localParticipant.identity));
      }
    };
    window.addEventListener("livekit:speakers-changed", handleSpeakers);
    return () => window.removeEventListener("livekit:speakers-changed", handleSpeakers);
  }, []);

  // Timer management
  useEffect(() => {
    const isActive = callStatus === "connecting" || callStatus === "connected";
    if (isActive) {
      const { callStartedAt } = useCallStore.getState();
      if (!callStartedAt) startTimer();
      const interval = setInterval(() => tickTimer(), 1000);
      return () => clearInterval(interval);
    } else {
      stopTimer();
    }
  }, [callStatus, startTimer, stopTimer, tickTimer]);

  // Sync mute/video state with LiveKit — skip first render (initial values already correct)
  const isFirstRender = useRef(true);
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    const room = getLiveKitRoom();
    if (!room) return;
    room.localParticipant.setMicrophoneEnabled(!isMuted);
  }, [isMuted]);

  useEffect(() => {
    if (isFirstRender.current) return;
    const room = getLiveKitRoom();
    if (!room) return;
    room.localParticipant.setCameraEnabled(!isVideoOff);
  }, [isVideoOff]);

  const handleHangup = async () => {
    await disconnectFromRoom();
    hangupCall("you");
  };

  const handleToggleScreenShare = async () => {
    const room = getLiveKitRoom();
    if (!room) return;
    try {
      const enabled = !isScreenSharing;
      await room.localParticipant.setScreenShareEnabled(enabled);
      setScreenSharing(enabled);
    } catch {
      // Screen share failed (e.g. permission denied, browser not supported)
    }
  };

  // Fullscreen API
  const [isFs, setIsFs] = useState(false);

  const handleToggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => setIsFs(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFs(false)).catch(() => {});
    }
  }, []);

  // Sync fullscreen state with browser
  useEffect(() => {
    const onFsChange = () => setIsFs(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", onFsChange);
    return () => document.removeEventListener("fullscreenchange", onFsChange);
  }, []);

  // Exit fullscreen on hangup
  useEffect(() => {
    if (callStatus === "idle" && document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    }
  }, [callStatus]);

  // Keyboard shortcuts: P = participants, C = chat (skip if typing in input)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === "INPUT" || target.tagName === "TEXTAREA") return;
      if (e.key === "p" || e.key === "P") toggleParticipants();
      if (e.key === "c" || e.key === "C") toggleChat();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [toggleParticipants, toggleChat]);

  if (!activeCall || callStatus === "idle") return null;

  const isConnecting = callStatus === "connecting";
  const participantCount = participants.length + 1;

  // Local video track for PIP
  const localMediaTrack = localStream?.getVideoTracks()[0] ?? null;
  const localName = getLiveKitRoom()?.localParticipant.name || "You";

  return (
    <AnimatePresence>
      <motion.div
        key="group-call"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex flex-col bg-zinc-950"
      >
        {/* ─── Video Area (full screen) ────────────────────────── */}
        <div className="absolute inset-0">
          <GroupVideoGrid isConnecting={isConnecting} />
        </div>

        {/* ─── Top Bar (group name, duration, participants) ─────── */}
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="absolute top-0 left-0 right-0 z-20"
        >
          <div className="flex items-center justify-between px-5 py-3 bg-gradient-to-b from-black/60 via-black/30 to-transparent">
            {/* Left: group name + duration */}
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-500/20">
                <FiUsers className="h-4 w-4 text-indigo-400" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-white leading-tight">
                  {activeCall.peerUsername || "Group Call"}
                </h2>
                <div className="flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-[11px] text-zinc-300 font-medium">
                    {callStatus === "connecting" ? "Connecting..." : formatDuration(callDuration)}
                  </span>
                </div>
              </div>
            </div>

            {/* Right: participant count */}
            <div className="flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 backdrop-blur-md">
              <FiUsers className="h-3.5 w-3.5 text-zinc-300" />
              <span className="text-xs font-semibold text-white">{participantCount}</span>
            </div>
          </div>
        </motion.div>

        {/* ─── Chat Panel (floating right) ────────────────────── */}
        <AnimatePresence>
          {isChatOpen && (
            <motion.div
              initial={{ scale: 0.9, opacity: 0, x: 20 }}
              animate={{ scale: 1, opacity: 1, x: 0 }}
              exit={{ scale: 0.9, opacity: 0, x: 20 }}
              transition={{ type: "spring", damping: 24, stiffness: 280 }}
              className="absolute bottom-0 right-0 top-0 z-40 w-[320px]"
            >
              <div className="h-full overflow-hidden rounded-2xl border border-zinc-700/50 shadow-2xl">
                <GroupCallChat onClose={toggleChat} />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ─── Participants Panel (floating right) ─────────────── */}
        <AnimatePresence>
          {isParticipantsOpen && (
            <motion.div
              initial={{ scale: 0.9, opacity: 0, x: 20 }}
              animate={{ scale: 1, opacity: 1, x: 0 }}
              exit={{ scale: 0.9, opacity: 0, x: 20 }}
              transition={{ type: "spring", damping: 24, stiffness: 280 }}
              className="absolute bottom-0 right-0 top-0 z-40 w-[300px]"
            >
              <div className="h-full overflow-hidden rounded-2xl border border-zinc-700/50 shadow-2xl">
                <GroupCallParticipants onClose={toggleParticipants} />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ─── Local PIP (bottom-right, fixed) ────────────────── */}
        {!isConnecting && (
          <div className="absolute bottom-20 right-4 z-30 sm:bottom-24 sm:right-6">
            <div className="h-28 w-40 overflow-hidden rounded-2xl border-2 border-zinc-700/50 shadow-2xl sm:h-36 sm:w-52">
              <LocalPIP
                track={localMediaTrack}
                name={localName}
                isMuted={isMuted}
                isSpeaking={localSpeaking}
              />
            </div>
          </div>
        )}

        {/* ─── Bottom Controls Bar (floating) ──────────────────── */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.15 }}
          className="absolute bottom-4 left-1/2 z-20 -translate-x-1/2"
        >
          <div className="flex items-center gap-2 rounded-2xl border border-zinc-700/50 bg-zinc-900/80 px-4 py-2.5 shadow-2xl backdrop-blur-xl sm:gap-3 sm:px-6 sm:py-3">
            {/* Mic */}
            <ControlButton
              onClick={toggleMute}
              active={!isMuted}
              label={isMuted ? "Unmute" : "Mute"}
            >
              {isMuted ? (
                <FiMicOff className="h-5 w-5" />
              ) : (
                <FiMic className="h-5 w-5" />
              )}
            </ControlButton>

            {/* Camera */}
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

            {/* Screen Share */}
            <ControlButton
              onClick={handleToggleScreenShare}
              active={isScreenSharing}
              label={isScreenSharing ? "Stop sharing" : "Share screen"}
            >
              <FiMonitor className="h-5 w-5" />
            </ControlButton>

            {/* Hangup */}
            <ControlButton onClick={handleHangup} danger label="End call">
              <FiPhoneOff className="h-5 w-5" />
            </ControlButton>

            {/* Divider */}
            <div className="mx-1 h-8 w-px bg-zinc-700/50 sm:mx-2" />

            {/* Chat */}
            <ControlButton
              onClick={toggleChat}
              active={isChatOpen}
              label="Chat"
            >
              <FiMessageSquare className="h-5 w-5" />
            </ControlButton>

            {/* Participants (with count badge) */}
            <ControlButton
              onClick={toggleParticipants}
              active={isParticipantsOpen}
              label="Participants"
              badge={participantCount}
            >
              <FiUsers className="h-5 w-5" />
            </ControlButton>

            {/* Fullscreen */}
            <ControlButton
              onClick={handleToggleFullscreen}
              label={isFs ? "Exit fullscreen" : "Fullscreen"}
            >
              {isFs ? (
                <FiMinimize2 className="h-5 w-5" />
              ) : (
                <FiMaximize2 className="h-5 w-5" />
              )}
            </ControlButton>
          </div>

          {/* ─── Mobile Chat (full width below controls) ──────────── */}
          <AnimatePresence>
            {isChatOpen && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 300, opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ type: "spring", damping: 28, stiffness: 300 }}
                className="sm:hidden"
              >
                <GroupCallChat onClose={toggleChat} />
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* ─── Connecting Overlay ────────────────────────────────── */}
        <AnimatePresence>
          {isConnecting && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-30 flex items-center justify-center bg-zinc-950/80 backdrop-blur-sm"
            >
              <div className="flex flex-col items-center gap-4">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                  className="h-12 w-12 rounded-full border-2 border-indigo-500/20 border-t-indigo-500"
                />
                <div className="text-center">
                  <p className="text-base font-medium text-white">
                    Joining {activeCall.peerUsername || "group"}...
                  </p>
                  <p className="mt-1 text-sm text-zinc-400">
                    Setting up encrypted connection
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </AnimatePresence>
  );
}
