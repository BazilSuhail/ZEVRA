"use client";

import { useEffect, useState, useRef } from "react";
import { motion } from "motion/react";
import { FiX, FiMic, FiMicOff, FiUser, FiMonitor } from "react-icons/fi";
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

export default function GroupCallParticipants({
  onClose,
}: {
  onClose: () => void;
}) {
  const [participantDetails, setParticipantDetails] = useState<
    ParticipantInfo[]
  >([]);
  const speakersRef = useRef<Set<string>>(new Set());

  // Effect 1: Room event listeners (runs once)
  useEffect(() => {
    const room = getLiveKitRoom();
    if (!room) return;

    const updateParticipants = () => {
      const details: ParticipantInfo[] = [];

      // Local participant
      details.push({
        identity: room.localParticipant.identity,
        name: room.localParticipant.name || "You",
        isLocal: true,
        isMuted: !room.localParticipant.isMicrophoneEnabled,
        isSpeaking: speakersRef.current.has(room.localParticipant.identity),
        isScreenSharing: room.localParticipant.isScreenShareEnabled,
      });

      // Remote participants
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

    return () => {
      room.off(RoomEvent.ParticipantConnected, updateParticipants);
      room.off(RoomEvent.ParticipantDisconnected, updateParticipants);
      room.off(RoomEvent.TrackMuted, updateParticipants);
      room.off(RoomEvent.TrackUnmuted, updateParticipants);
    };
  }, []);

  // Effect 2: Speaker updates via custom event (runs once)
  useEffect(() => {
    const handleSpeakersChanged = (e: Event) => {
      const { speakers: speakerIds } = (e as CustomEvent).detail;
      const newSpeakers = new Set<string>(speakerIds as string[]);
      speakersRef.current = newSpeakers;

      // Re-run participant update with new speakers
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
          Participants ({participantDetails.length})
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
        <div className="space-y-1">
          {participantDetails.map((p) => (
            <motion.div
              key={p.identity}
              layout
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className={`flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors ${
                p.isSpeaking
                  ? "bg-indigo-600/10 ring-1 ring-indigo-500/30"
                  : "hover:bg-zinc-800/50"
              }`}
            >
              {/* Avatar */}
              <div className="relative">
                <div
                  className={`flex h-9 w-9 items-center justify-center rounded-full text-xs font-bold ${
                    p.isLocal
                      ? "bg-indigo-600/20 text-indigo-400"
                      : "bg-zinc-700 text-zinc-300"
                  }`}
                >
                  {getInitials(p.name) || <FiUser className="h-4 w-4" />}
                </div>
                {p.isSpeaking && (
                  <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-zinc-900 bg-emerald-400" />
                )}
              </div>

              {/* Info */}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <span className="truncate text-xs font-semibold text-white">
                    {p.isLocal ? "You" : p.name}
                  </span>
                  {p.isLocal && (
                    <span className="rounded bg-indigo-600/80 px-1 py-0.5 text-[8px] font-bold text-white">
                      YOU
                    </span>
                  )}
                </div>
                <span className="text-[10px] text-zinc-500">
                  {p.identity.slice(0, 12)}...
                </span>
              </div>

              {/* Status icons */}
              <div className="flex items-center gap-1.5">
                {p.isScreenSharing && (
                  <div className="flex h-6 w-6 items-center justify-center rounded-md bg-emerald-600/20">
                    <FiMonitor className="h-3 w-3 text-emerald-400" />
                  </div>
                )}
                <div
                  className={`flex h-6 w-6 items-center justify-center rounded-md ${
                    p.isMuted ? "bg-rose-600/20" : "bg-zinc-700/50"
                  }`}
                >
                  {p.isMuted ? (
                    <FiMicOff className="h-3 w-3 text-rose-400" />
                  ) : (
                    <FiMic className="h-3 w-3 text-zinc-400" />
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Footer info */}
      <div className="border-t border-zinc-800/50 px-4 py-3">
        <p className="text-[10px] text-zinc-500">
          Maximum 10 participants per group call
        </p>
      </div>
    </div>
  );
}
