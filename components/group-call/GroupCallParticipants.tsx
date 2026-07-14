"use client";

import { useEffect, useState, useRef } from "react";
import { motion } from "motion/react";
import { FiX, FiMic, FiMicOff, FiMonitor } from "react-icons/fi";
import { getLiveKitRoom } from "@/lib/livekit";
import type { RemoteParticipant } from "livekit-client";
import { RoomEvent } from "livekit-client";

interface ParticipantInfo {
  identity: string;
  name: string;
  isLocal: boolean;
  isMuted: boolean;
  isSpeaking: boolean;
  isScreenSharing: boolean;
}

const AVATAR_COLORS = [
  "from-violet-600 to-indigo-700",
  "from-emerald-500 to-teal-600",
  "from-amber-500 to-orange-600",
  "from-rose-500 to-pink-600",
  "from-cyan-500 to-blue-600",
  "from-fuchsia-500 to-purple-600",
];

function getAvatarColor(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

export default function GroupCallParticipants({
  onClose,
}: {
  onClose: () => void;
}) {
  const [participantDetails, setParticipantDetails] = useState<
    ParticipantInfo[]
  >([]);
  const speakersRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    let cleanup: (() => void) | null = null;
    let stopped = false;

    const register = (room: any) => {
      const updateParticipants = () => {
        const details: ParticipantInfo[] = [];

        details.push({
          identity: room.localParticipant.identity,
          name: room.localParticipant.name || "You",
          isLocal: true,
          isMuted: !room.localParticipant.isMicrophoneEnabled,
          isSpeaking: speakersRef.current.has(room.localParticipant.identity),
          isScreenSharing: room.localParticipant.isScreenShareEnabled,
        });

        room.remoteParticipants.forEach((p: RemoteParticipant) => {
          const audioPub = Array.from(p.audioTrackPublications.values())[0];
          details.push({
            identity: p.identity,
            name: p.name || p.identity.slice(0, 8),
            isLocal: false,
            isMuted: !audioPub || !audioPub.track,
            isSpeaking: speakersRef.current.has(p.identity),
            isScreenSharing: p.isScreenShareEnabled,
          });
        });

        setParticipantDetails(details);
      };

      room.on(RoomEvent.ParticipantConnected, updateParticipants);
      room.on(RoomEvent.ParticipantDisconnected, updateParticipants);
      room.on(RoomEvent.TrackMuted, updateParticipants);
      room.on(RoomEvent.TrackUnmuted, updateParticipants);

      updateParticipants();

      cleanup = () => {
        room.off(RoomEvent.ParticipantConnected, updateParticipants);
        room.off(RoomEvent.ParticipantDisconnected, updateParticipants);
        room.off(RoomEvent.TrackMuted, updateParticipants);
        room.off(RoomEvent.TrackUnmuted, updateParticipants);
      };
    };

    const tryConnect = () => {
      const r = getLiveKitRoom();
      if (r) { register(r); return true; }
      return false;
    };

    if (!tryConnect()) {
      const interval = setInterval(() => {
        if (stopped) { clearInterval(interval); return; }
        if (tryConnect()) clearInterval(interval);
      }, 100);
      return () => { stopped = true; clearInterval(interval); };
    }

    return () => { stopped = true; cleanup?.(); };
  }, []);

  useEffect(() => {
    const handleSpeakersChanged = (e: Event) => {
      const { speakers: speakerIds } = (e as CustomEvent).detail;
      const newSpeakers = new Set<string>(speakerIds as string[]);
      speakersRef.current = newSpeakers;

      const room = getLiveKitRoom();
      if (!room) return;

      const details: ParticipantInfo[] = [];
      details.push({
        identity: room.localParticipant.identity,
        name: room.localParticipant.name || "You",
        isLocal: true,
        isMuted: !room.localParticipant.isMicrophoneEnabled,
        isSpeaking: newSpeakers.has(room.localParticipant.identity),
        isScreenSharing: room.localParticipant.isScreenShareEnabled,
      });

      room.remoteParticipants.forEach((p: RemoteParticipant) => {
        const audioPub = Array.from(p.audioTrackPublications.values())[0];
        details.push({
          identity: p.identity,
          name: p.name || p.identity.slice(0, 8),
          isLocal: false,
          isMuted: !audioPub || !audioPub.track,
          isSpeaking: newSpeakers.has(p.identity),
          isScreenSharing: p.isScreenShareEnabled,
        });
      });

      setParticipantDetails(details);
    };

    window.addEventListener("livekit:speakers-changed", handleSpeakersChanged);
    return () => {
      window.removeEventListener("livekit:speakers-changed", handleSpeakersChanged);
    };
  }, []);

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((w) => w[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="flex h-full flex-col bg-zinc-900/95 backdrop-blur-xl">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-zinc-800/50 px-4 py-3">
        <h3 className="text-sm font-bold text-white">
          Participants
          <span className="ml-1.5 text-zinc-400">{participantDetails.length}</span>
        </h3>
        <button
          onClick={onClose}
          className="flex h-7 w-7 items-center justify-center rounded-lg text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-white"
        >
          <FiX className="h-4 w-4" />
        </button>
      </div>

      {/* List */}
      <div className="scrollbar-group flex-1 overflow-y-auto px-3 py-3">
        <div className="space-y-1.5">
          {participantDetails.map((p, i) => {
            const colorClass = getAvatarColor(p.name);
            return (
              <motion.div
                key={p.identity}
                layout
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
                className={`group flex items-center gap-3 rounded-2xl px-3 py-3 transition-all ${
                  p.isSpeaking
                    ? "bg-white/[0.06] shadow-[inset_0_0_0_1px_rgba(129,140,248,0.2)]"
                    : "hover:bg-white/[0.03]"
                }`}
              >
                {/* Avatar */}
                <div className="relative shrink-0">
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br text-xs font-bold text-white shadow-lg ${colorClass} ${
                      p.isSpeaking ? "ring-2 ring-indigo-400/60 ring-offset-1 ring-offset-zinc-900" : ""
                    }`}
                  >
                    {getInitials(p.name)}
                  </div>
                  {/* Online dot */}
                  <span
                    className={`absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-zinc-900 ${
                      p.isSpeaking ? "bg-emerald-400" : "bg-zinc-500"
                    }`}
                  />
                </div>

                {/* Info */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className="truncate text-[13px] font-semibold text-white">
                      {p.isLocal ? "You" : p.name}
                    </span>
                    {p.isLocal && (
                      <span className="shrink-0 rounded-full bg-indigo-500/20 px-1.5 py-0.5 text-[9px] font-bold text-indigo-300">
                        YOU
                      </span>
                    )}
                  </div>
                </div>

                {/* Status icons */}
                <div className="flex shrink-0 items-center gap-1">
                  {p.isScreenSharing && (
                    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-500/15">
                      <FiMonitor className="h-3.5 w-3.5 text-emerald-400" />
                    </div>
                  )}
                  <div
                    className={`flex h-7 w-7 items-center justify-center rounded-full transition-colors ${
                      p.isMuted
                        ? "bg-rose-500/15 text-rose-400"
                        : "bg-zinc-700/40 text-zinc-400"
                    }`}
                  >
                    {p.isMuted ? (
                      <FiMicOff className="h-3.5 w-3.5" />
                    ) : (
                      <FiMic className="h-3.5 w-3.5" />
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-zinc-800/50 px-4 py-3">
        <p className="text-[10px] text-zinc-500">
          Up to 10 participants
        </p>
      </div>
    </div>
  );
}
