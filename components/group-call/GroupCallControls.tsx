"use client";

import { motion } from "motion/react";
import {
  FiMic,
  FiMicOff,
  FiVideo,
  FiVideoOff,
  FiMonitor,
  FiPhoneOff,
  FiMessageSquare,
  FiUsers,
  FiSettings,
  FiMaximize2,
  FiMinimize2,
} from "react-icons/fi";
import { useCallStore } from "@/context/stores/call-store";

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

export default function GroupCallControls() {
  const {
    isMuted,
    isVideoOff,
    isScreenSharing,
    isChatOpen,
    isParticipantsOpen,
    isFullscreen,
    participants,
    toggleMute,
    toggleVideo,
    toggleChat,
    toggleParticipants,
    toggleFullscreen,
    hangupCall,
    setScreenSharing,
  } = useCallStore();

  const handleToggleScreenShare = async () => {
    const { getLiveKitRoom } = await import("@/lib/livekit");
    const room = getLiveKitRoom();
    if (!room) return;
    const enabled = !isScreenSharing;
    await room.localParticipant.setScreenShareEnabled(enabled);
    setScreenSharing(enabled);
  };

  const participantCount = participants.length + 1;

  return (
    <div className="flex items-center justify-center gap-2 px-4 py-3 sm:gap-3 sm:px-6 sm:py-4">
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
      <ControlButton onClick={hangupCall} danger label="End call">
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

      {/* Participants */}
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
  );
}
