"use client";

import { useEffect, useRef, useState, useMemo, useCallback } from "react";
import { motion } from "motion/react";
import { FiMic, FiMicOff, FiUser } from "react-icons/fi";
import { useCallStore } from "@/context/stores/call-store";
import { getLiveKitRoom } from "@/lib/livekit";
import type { Track } from "livekit-client";
import { RoomEvent } from "livekit-client";

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

interface RemoteTrackInfo {
  track: MediaStreamTrack | null;
  name: string;
  muted: boolean;
}

export default function GroupVideoGrid({ isConnecting }: GroupVideoGridProps) {
  const { isMuted, localStream } = useCallStore();
  const [remoteTracks, setRemoteTracks] = useState<
    Record<string, RemoteTrackInfo>
  >({});
  const [speakers, setSpeakers] = useState<Set<string>>(new Set());

  // Build stable local video track reference
  const localMediaTrack = useMemo(() => {
    if (!localStream) return null;
    return localStream.getVideoTracks()[0] ?? null;
  }, [localStream]);

  const handleTrackSubscribed = useCallback((e: Event) => {
    const { participantIdentity, track } = (e as CustomEvent).detail;
    if (track.kind !== "video") return;

    setRemoteTracks((prev) => {
      const existing = prev[participantIdentity];
      if (existing?.track === track.mediaStreamTrack) return prev;
      return {
        ...prev,
        [participantIdentity]: {
          track: track.mediaStreamTrack,
          name: existing?.name || participantIdentity.slice(0, 8),
          muted: existing?.muted ?? false,
        },
      };
    });
  }, []);

  const handleTrackUnsubscribed = useCallback((e: Event) => {
    const { participantIdentity } = (e as CustomEvent).detail;
    setRemoteTracks((prev) => {
      const existing = prev[participantIdentity];
      if (existing && existing.track !== null) {
        return { ...prev, [participantIdentity]: { ...existing, track: null } };
      }
      return prev;
    });
  }, []);

  const handleSpeakersChanged = useCallback((e: Event) => {
    const { speakers: speakerIds } = (e as CustomEvent).detail;
    setSpeakers((prev) => {
      const next = new Set<string>(speakerIds as string[]);
      if (prev.size === next.size && [...prev].every((s) => next.has(s))) return prev;
      return next;
    });
  }, []);

  // Track muted/unmuted — update muted status on remote tracks
  const handleTrackMuted = useCallback((e: Event) => {
    const { participantIdentity, kind } = (e as CustomEvent).detail;
    if (kind !== "video") return;
    setRemoteTracks((prev) => {
      const existing = prev[participantIdentity];
      if (!existing || existing.muted) return prev;
      return { ...prev, [participantIdentity]: { ...existing, muted: true } };
    });
  }, []);

  const handleTrackUnmuted = useCallback((e: Event) => {
    const { participantIdentity, kind } = (e as CustomEvent).detail;
    if (kind !== "video") return;
    setRemoteTracks((prev) => {
      const existing = prev[participantIdentity];
      if (!existing || !existing.muted) return prev;
      return { ...prev, [participantIdentity]: { ...existing, muted: false } };
    });
  }, []);

  // Room-level event listeners (runs once)
  useEffect(() => {
    const room = getLiveKitRoom();
    if (!room) return;

    const handleParticipantConnected = () => {
      room.remoteParticipants.forEach((p) => {
        setRemoteTracks((prev) => {
          const existing = prev[p.identity];
          const videoPub = Array.from(p.videoTrackPublications.values())[0];
          const actualTrack = videoPub?.track?.mediaStreamTrack ?? null;
          if (existing?.track === actualTrack) return prev;
          return {
            ...prev,
            [p.identity]: {
              track: actualTrack,
              name: existing?.name || p.name || p.identity.slice(0, 8),
              muted: existing?.muted ?? false,
            },
          };
        });
      });
    };

    const handleParticipantDisconnected = () => {
      setRemoteTracks((prev) => {
        const currentIds = new Set(
          Array.from(room.remoteParticipants.values()).map((p) => p.identity),
        );
        let changed = false;
        const next: Record<string, RemoteTrackInfo> = {};
        for (const [id, data] of Object.entries(prev)) {
          if (currentIds.has(id)) {
            next[id] = data;
          } else {
            changed = true;
          }
        }
        return changed ? next : prev;
      });
    };

    window.addEventListener("livekit:track-subscribed", handleTrackSubscribed);
    window.addEventListener("livekit:track-unsubscribed", handleTrackUnsubscribed);
    window.addEventListener("livekit:speakers-changed", handleSpeakersChanged);
    window.addEventListener("livekit:track-muted", handleTrackMuted);
    window.addEventListener("livekit:track-unmuted", handleTrackUnmuted);

    room.on(RoomEvent.ParticipantConnected, handleParticipantConnected);
    room.on(RoomEvent.ParticipantDisconnected, handleParticipantDisconnected);

    // Mount-time scan for already-subscribed tracks (batched — one state update)
    const initial: Record<string, RemoteTrackInfo> = {};
    room.remoteParticipants.forEach((p) => {
      const videoPub = Array.from(p.videoTrackPublications.values())[0];
      initial[p.identity] = {
        track: videoPub?.track?.mediaStreamTrack ?? null,
        name: p.name || p.identity.slice(0, 8),
        muted: !videoPub || !videoPub.track || videoPub.isMuted,
      };
    });
    setRemoteTracks(initial);

    return () => {
      window.removeEventListener("livekit:track-subscribed", handleTrackSubscribed);
      window.removeEventListener("livekit:track-unsubscribed", handleTrackUnsubscribed);
      window.removeEventListener("livekit:speakers-changed", handleSpeakersChanged);
      window.removeEventListener("livekit:track-muted", handleTrackMuted);
      window.removeEventListener("livekit:track-unmuted", handleTrackUnmuted);
      room.off(RoomEvent.ParticipantConnected, handleParticipantConnected);
      room.off(RoomEvent.ParticipantDisconnected, handleParticipantDisconnected);
    };
  }, [handleTrackSubscribed, handleTrackUnsubscribed, handleSpeakersChanged, handleTrackMuted, handleTrackUnmuted]);

  // Build tile data — memoized to avoid new objects every render
  const tiles = useMemo(() => {
    const remote = Object.entries(remoteTracks).map(
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
