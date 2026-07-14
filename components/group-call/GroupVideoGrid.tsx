"use client";

import { useEffect, useRef, useState, useMemo } from "react";
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
  mediaStreamTrack,
  isSpeaking,
}: {
  identity: string;
  name: string;
  isLocal: boolean;
  isMuted: boolean;
  mediaStreamTrack: MediaStreamTrack | null;
  isSpeaking: boolean;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const attachedTrack = useRef<MediaStreamTrack | null>(null);

  // Only re-assign srcObject when the ACTUAL MediaStreamTrack changes
  useEffect(() => {
    const el = videoRef.current;
    if (!el) return;

    if (mediaStreamTrack && mediaStreamTrack !== attachedTrack.current) {
      el.srcObject = new MediaStream([mediaStreamTrack]);
      el.play().catch(() => {});
      attachedTrack.current = mediaStreamTrack;
    } else if (!mediaStreamTrack && attachedTrack.current) {
      el.srcObject = null;
      attachedTrack.current = null;
    }
  }, [mediaStreamTrack]);

  const displayName = name || identity.slice(0, 8);
  const initials = displayName
    .split(" ")
    .map((w: string) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="relative h-full w-full overflow-hidden bg-zinc-900">
      {mediaStreamTrack ? (
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
    mediaStreamTrack: MediaStreamTrack | null;
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
  const [remoteTracks, setRemoteTracks] = useState<
    Map<string, { track: MediaStreamTrack | null; name: string; muted: boolean }>
  >(new Map());
  const [speakers, setSpeakers] = useState<Set<string>>(new Set());

  // ─── Listen for room-level events dispatched from livekit.ts ─────
  useEffect(() => {
    const room = getLiveKitRoom();
    if (!room) return;

    const handleTrackSubscribed = (e: Event) => {
      const { participantIdentity, track } = (e as CustomEvent).detail;
      if (track.kind !== "video") return;

      setRemoteTracks((prev) => {
        const next = new Map(prev);
        const existing = next.get(participantIdentity);
        // Skip update if the actual track hasn't changed
        if (existing?.track === track.mediaStreamTrack) return prev;
        next.set(participantIdentity, {
          track: track.mediaStreamTrack,
          name: existing?.name || participantIdentity.slice(0, 8),
          muted: existing?.muted ?? false,
        });
        return next;
      });
    };

    const handleTrackUnsubscribed = (e: Event) => {
      const { participantIdentity } = (e as CustomEvent).detail;
      setRemoteTracks((prev) => {
        const next = new Map(prev);
        const existing = next.get(participantIdentity);
        if (existing && existing.track !== null) {
          next.set(participantIdentity, { ...existing, track: null });
          return next;
        }
        return prev; // no change → no re-render
      });
    };

    const handleSpeakersChanged = (e: Event) => {
      const { speakers: speakerIds } = (e as CustomEvent).detail;
      setSpeakers((prev) => {
        const next = new Set<string>(speakerIds as string[]);
        if (prev.size === next.size && [...prev].every((s) => next.has(s))) return prev;
        return next;
      });
    };

    const handleParticipantConnected = () => {
      room.remoteParticipants.forEach((p) => {
        setRemoteTracks((prev) => {
          if (prev.has(p.identity)) {
            // Already tracked — check if we need to update the track
            const existing = prev.get(p.identity)!;
            const videoPub = Array.from(p.videoTrackPublications.values())[0];
            const actualTrack = videoPub?.track?.mediaStreamTrack ?? null;
            if (existing.track === actualTrack) return prev;
            const next = new Map(prev);
            next.set(p.identity, { ...existing, track: actualTrack });
            return next;
          }
          // New participant — grab any already-published video track
          const videoPub = Array.from(p.videoTrackPublications.values())[0];
          const next = new Map(prev);
          next.set(p.identity, {
            track: videoPub?.track?.mediaStreamTrack ?? null,
            name: p.name || p.identity.slice(0, 8),
            muted: false,
          });
          return next;
        });
      });
    };

    const handleParticipantDisconnected = () => {
      setRemoteTracks((prev) => {
        const next = new Map(prev);
        const currentIds = new Set(
          Array.from(room.remoteParticipants.values()).map((p) => p.identity),
        );
        let changed = false;
        for (const id of next.keys()) {
          if (!currentIds.has(id)) {
            next.delete(id);
            changed = true;
          }
        }
        return changed ? next : prev;
      });
    };

    window.addEventListener("livekit:track-subscribed", handleTrackSubscribed);
    window.addEventListener("livekit:track-unsubscribed", handleTrackUnsubscribed);
    window.addEventListener("livekit:speakers-changed", handleSpeakersChanged);

    room.on("participantConnected" as any, handleParticipantConnected);
    room.on("participantDisconnected" as any, handleParticipantDisconnected);

    handleParticipantConnected();

    // Also scan for already-subscribed tracks (race condition: tracks subscribed before mount)
    room.remoteParticipants.forEach((p) => {
      p.videoTrackPublications.forEach((pub) => {
        if (pub.track?.mediaStreamTrack) {
          window.dispatchEvent(
            new CustomEvent("livekit:track-subscribed", {
              detail: {
                participantIdentity: p.identity,
                track: pub.track,
              },
            }),
          );
        }
      });
    });

    return () => {
      window.removeEventListener("livekit:track-subscribed", handleTrackSubscribed);
      window.removeEventListener("livekit:track-unsubscribed", handleTrackUnsubscribed);
      window.removeEventListener("livekit:speakers-changed", handleSpeakersChanged);
      room.off("participantConnected" as any, handleParticipantConnected);
      room.off("participantDisconnected" as any, handleParticipantDisconnected);
    };
  }, []);

  // Stable local video track reference
  const localMediaTrack = useMemo(() => {
    if (!localStream) return null;
    return localStream.getVideoTracks()[0] ?? null;
  }, [localStream]);

  // Build tile data — memoized to avoid new objects every render
  const tiles = useMemo(() => {
    const remote = Array.from(remoteTracks.entries()).map(
      ([identity, data]) => ({
        identity,
        name: data.name,
        isLocal: false as const,
        isMuted: data.muted,
        mediaStreamTrack: data.track,
        isSpeaking: speakers.has(identity),
      }),
    );

    return [
      {
        identity: "local",
        name: "You",
        isLocal: true as const,
        isMuted,
        mediaStreamTrack: localMediaTrack,
        isSpeaking: speakers.has("local"),
      },
      ...remote,
    ];
  }, [isMuted, localMediaTrack, remoteTracks, speakers]);

  return (
    <div className="relative h-full w-full overflow-hidden bg-zinc-950">
      <TileGrid tiles={tiles} />

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
