"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { motion } from "motion/react";
import { FiMic, FiMicOff, FiUser } from "react-icons/fi";
import { useCallStore } from "@/context/stores/call-store";
import { getLiveKitRoom } from "@/lib/livekit";
import type { Track } from "livekit-client";

// ─── Single Tile (fills parent) ────────────────────────────────────────────

function Tile({
  identity,
  name,
  isLocal,
  isMuted,
  videoTrack,
  isSpeaking,
}: {
  identity: string;
  name: string;
  isLocal: boolean;
  isMuted: boolean;
  videoTrack: Track | null;
  isSpeaking: boolean;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const el = videoRef.current;
    if (!el) return;

    if (videoTrack?.mediaStreamTrack) {
      const stream = new MediaStream([videoTrack.mediaStreamTrack]);
      el.srcObject = stream;
      el.play().catch(() => {});
    } else {
      el.srcObject = null;
    }
  }, [videoTrack]);

  const displayName = name || identity.slice(0, 8);
  const initials = displayName
    .split(" ")
    .map((w: string) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="relative h-full w-full overflow-hidden bg-zinc-900">
      {videoTrack?.mediaStreamTrack ? (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted={isLocal}
          className="h-full w-full object-cover"
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-zinc-800 via-zinc-900 to-zinc-950">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-indigo-600/20 text-3xl font-bold text-indigo-400 ring-2 ring-indigo-500/30 sm:h-24 sm:w-24 sm:text-4xl">
            {initials || <FiUser className="h-10 w-10" />}
          </div>
        </div>
      )}

      {/* Name badge — bottom-left */}
      <div className="absolute bottom-3 left-3 z-10">
        <div className="flex items-center gap-1.5 rounded-lg bg-zinc-950/70 px-2.5 py-1 backdrop-blur-md">
          <span className="text-xs font-semibold text-white">
            {isLocal ? "You" : displayName}
          </span>
          {isMuted && <FiMicOff className="h-3 w-3 text-rose-400" />}
          {isSpeaking && !isMuted && (
            <div className="flex gap-0.5">
              <motion.span
                animate={{ scaleY: [1, 1.5, 1] }}
                transition={{ duration: 0.3, repeat: Infinity }}
                className="h-2.5 w-0.5 rounded-full bg-indigo-400"
              />
              <motion.span
                animate={{ scaleY: [1, 2, 1] }}
                transition={{ duration: 0.3, repeat: Infinity, delay: 0.1 }}
                className="h-2.5 w-0.5 rounded-full bg-indigo-400"
              />
              <motion.span
                animate={{ scaleY: [1, 1.5, 1] }}
                transition={{ duration: 0.3, repeat: Infinity, delay: 0.2 }}
                className="h-2.5 w-0.5 rounded-full bg-indigo-400"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Grid Layout (2+ participants) ─────────────────────────────────────────

function TileGrid({
  tiles,
}: {
  tiles: {
    identity: string;
    name: string;
    isLocal: boolean;
    isMuted: boolean;
    videoTrack: Track | null;
    isSpeaking: boolean;
  }[];
}) {
  const count = tiles.length;

  if (count === 1) {
    return (
      <div className="h-full w-full">
        <Tile {...tiles[0]} />
      </div>
    );
  }

  if (count === 2) {
    return (
      <div className="grid h-full grid-cols-1 sm:grid-cols-2 gap-1 p-1">
        {tiles.map((t) => (
          <div key={t.identity} className="min-h-0 overflow-hidden rounded-xl">
            <Tile {...t} />
          </div>
        ))}
      </div>
    );
  }

  if (count <= 4) {
    return (
      <div className="grid h-full grid-cols-2 gap-1 p-1">
        {tiles.map((t) => (
          <div key={t.identity} className="min-h-0 overflow-hidden rounded-xl">
            <Tile {...t} />
          </div>
        ))}
      </div>
    );
  }

  if (count <= 6) {
    return (
      <div className="grid h-full grid-cols-2 sm:grid-cols-3 gap-1 p-1">
        {tiles.map((t) => (
          <div key={t.identity} className="min-h-0 overflow-hidden rounded-xl">
            <Tile {...t} />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid h-full grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-1 p-1">
      {tiles.map((t) => (
        <div key={t.identity} className="min-h-0 overflow-hidden rounded-xl">
          <Tile {...t} />
        </div>
      ))}
    </div>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────

interface GroupVideoGridProps {
  isConnecting: boolean;
}

export default function GroupVideoGrid({ isConnecting }: GroupVideoGridProps) {
  const { isMuted, localStream } = useCallStore();
  const [remoteVideos, setRemoteVideos] = useState<
    Map<string, { track: Track | null; name: string; muted: boolean }>
  >(new Map());
  const [speakers, setSpeakers] = useState<Set<string>>(new Set());

  // ─── Listen for room-level events dispatched from livekit.ts ─────
  useEffect(() => {
    const room = getLiveKitRoom();
    if (!room) return;

    const handleTrackSubscribed = (e: Event) => {
      const { participantIdentity, track } = (e as CustomEvent).detail;
      if (track.kind !== "video") return;

      setRemoteVideos((prev) => {
        const next = new Map(prev);
        const existing = next.get(participantIdentity);
        next.set(participantIdentity, {
          track,
          name: existing?.name || participantIdentity.slice(0, 8),
          muted: existing?.muted ?? false,
        });
        return next;
      });
    };

    const handleTrackUnsubscribed = (e: Event) => {
      const { participantIdentity } = (e as CustomEvent).detail;
      setRemoteVideos((prev) => {
        const next = new Map(prev);
        const existing = next.get(participantIdentity);
        if (existing) {
          next.set(participantIdentity, { ...existing, track: null });
        }
        return next;
      });
    };

    const handleSpeakersChanged = (e: Event) => {
      const { speakers: speakerIds } = (e as CustomEvent).detail;
      setSpeakers(new Set(speakerIds));
    };

    const handleParticipantConnected = () => {
      room.remoteParticipants.forEach((p) => {
        setRemoteVideos((prev) => {
          if (prev.has(p.identity)) return prev;
          const next = new Map(prev);
          next.set(p.identity, {
            track: null,
            name: p.name || p.identity.slice(0, 8),
            muted: false,
          });
          return next;
        });
      });
    };

    const handleParticipantDisconnected = () => {
      setRemoteVideos((prev) => {
        const next = new Map(prev);
        const currentIds = new Set(
          Array.from(room.remoteParticipants.values()).map((p) => p.identity),
        );
        for (const id of next.keys()) {
          if (!currentIds.has(id)) next.delete(id);
        }
        return next;
      });
    };

    window.addEventListener("livekit:track-subscribed", handleTrackSubscribed);
    window.addEventListener("livekit:track-unsubscribed", handleTrackUnsubscribed);
    window.addEventListener("livekit:speakers-changed", handleSpeakersChanged);

    room.on("participantConnected" as any, handleParticipantConnected);
    room.on("participantDisconnected" as any, handleParticipantDisconnected);

    handleParticipantConnected();

    return () => {
      window.removeEventListener("livekit:track-subscribed", handleTrackSubscribed);
      window.removeEventListener("livekit:track-unsubscribed", handleTrackUnsubscribed);
      window.removeEventListener("livekit:speakers-changed", handleSpeakersChanged);
      room.off("participantConnected" as any, handleParticipantConnected);
      room.off("participantDisconnected" as any, handleParticipantDisconnected);
    };
  }, []);

  // Local video track
  const localVideoTrack = localStream
    ? (() => {
        const videoTrack = localStream.getVideoTracks()[0];
        if (!videoTrack) return null;
        return { mediaStreamTrack: videoTrack } as Track;
      })()
    : null;

  const remoteParticipants = Array.from(remoteVideos.entries()).map(
    ([identity, data]) => ({
      identity,
      name: data.name,
      isLocal: false,
      isMuted: data.muted,
      videoTrack: data.track,
      isSpeaking: speakers.has(identity),
    }),
  );

  // Build tile list: local always first, then remotes
  const allTiles = [
    {
      identity: "local",
      name: "You",
      isLocal: true,
      isMuted,
      videoTrack: localVideoTrack,
      isSpeaking: speakers.has("local"),
    },
    ...remoteParticipants,
  ];

  return (
    <div className="relative h-full w-full overflow-hidden bg-zinc-950">
      {/* ─── Tile Grid ─────────────────────────────────────────── */}
      <TileGrid tiles={allTiles} />

      {/* ─── Connecting overlay ────────────────────────────────── */}
      {isConnecting && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-zinc-950/60 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-4">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
              className="h-12 w-12 rounded-full border-2 border-indigo-500/20 border-t-indigo-500"
            />
            <p className="text-sm font-medium text-zinc-300">Connecting...</p>
          </div>
        </div>
      )}
    </div>
  );
}
