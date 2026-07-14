"use client";

import { useEffect, useState, useRef } from "react";
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
import GroupVideoGrid from "./GroupVideoGrid";
import GroupCallChat from "./GroupCallChat";
import GroupCallParticipants from "./GroupCallParticipants";

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
    toggleMute,
    toggleVideo,
    toggleChat,
    toggleParticipants,
    toggleFullscreen,
    isFullscreen,
    hangupCall,
    setScreenSharing,
  } = useCallStore();

  const startTimer = useCallStore((s) => s.startTimer);
  const stopTimer = useCallStore((s) => s.stopTimer);
  const tickTimer = useCallStore((s) => s.tickTimer);

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

  if (!activeCall || callStatus === "idle") return null;

  const isConnecting = callStatus === "connecting";
  const participantCount = participants.length + 1;

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

        {/* ─── Chat Sidebar ────────────────────────────────────── */}
        <AnimatePresence>
          {isChatOpen && (
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 340, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ type: "spring", damping: 28, stiffness: 300 }}
              className="absolute right-0 top-0 bottom-0 z-10 hidden border-l border-zinc-800/50 sm:block"
            >
              <GroupCallChat onClose={toggleChat} />
            </motion.div>
          )}
        </AnimatePresence>

        {/* ─── Participants Sidebar ────────────────────────────── */}
        <AnimatePresence>
          {isParticipantsOpen && (
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 300, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ type: "spring", damping: 28, stiffness: 300 }}
              className="absolute right-0 top-0 bottom-0 z-10 border-l border-zinc-800/50"
            >
              <GroupCallParticipants onClose={toggleParticipants} />
            </motion.div>
          )}
        </AnimatePresence>

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
              onClick={toggleFullscreen}
              label={isFullscreen ? "Exit fullscreen" : "Fullscreen"}
            >
              {isFullscreen ? (
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
                    Joining call...
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
