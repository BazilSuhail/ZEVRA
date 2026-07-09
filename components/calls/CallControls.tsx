"use client";

import {
  FiMic,
  FiMicOff,
  FiVideo,
  FiVideoOff,
  FiPhone,
} from "react-icons/fi";
import { useCallStore } from "@/context/stores/call-store";
import { getActiveCall } from "@/lib/webrtc";

interface CallControlsProps {
  variant?: "overlay" | "fullscreen";
}

export default function CallControls({ variant = "overlay" }: CallControlsProps) {
  const { isMuted, isVideoOff, toggleMute, toggleVideo } =
    useCallStore();

  const handleHangup = () => {
    const call = getActiveCall();
    if (call) {
      call.hangup('you');
    } else {
      useCallStore.getState().hangupCall('you');
    }
  };

  const btnBase =
    variant === "fullscreen"
      ? "flex h-12 w-12 items-center justify-center rounded-full transition-colors"
      : "flex h-9 w-9 items-center justify-center rounded-full transition-colors";

  const hangupBtnBase =
    variant === "fullscreen"
      ? "flex h-14 w-14 items-center justify-center rounded-full bg-red-500 text-white transition-colors hover:bg-red-600"
      : "flex h-10 w-10 items-center justify-center rounded-full bg-red-500 text-white transition-colors hover:bg-red-600";

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={toggleMute}
        className={`${btnBase} ${
          isMuted
            ? "bg-red-500/10 text-red-500"
            : "bg-zinc-800/60 text-white hover:bg-zinc-700/60"
        }`}
        title={isMuted ? "Unmute" : "Mute"}
      >
        {isMuted ? <FiMicOff /> : <FiMic />}
      </button>

      <button
        onClick={toggleVideo}
        className={`${btnBase} ${
          isVideoOff
            ? "bg-red-500/10 text-red-500"
            : "bg-zinc-800/60 text-white hover:bg-zinc-700/60"
        }`}
        title={isVideoOff ? "Turn on camera" : "Turn off camera"}
      >
        {isVideoOff ? <FiVideoOff /> : <FiVideo />}
      </button>

      <button
        onClick={handleHangup}
        className={hangupBtnBase}
        title="End call"
      >
        <FiPhone className="rotate-[135deg]" />
      </button>
    </div>
  );
}
