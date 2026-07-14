"use client";

import { useEffect, useRef, useState, useMemo, useCallback } from "react";
import { motion } from "motion/react";
import { FiMic, FiMicOff } from "react-icons/fi";
import { useCallStore } from "@/context/stores/call-store";
import { getLiveKitRoom } from "@/lib/livekit";
import type { Track, RemoteParticipant, Room } from "livekit-client";
import { RoomEvent } from "livekit-client";

// ─── Avatar Colors ──────────────────────────────────────────────────────────

const AVATAR_GRADIENTS = [
  "from-violet-600 to-indigo-700",
  "from-emerald-500 to-teal-600",
  "from-amber-500 to-orange-600",
  "from-rose-500 to-pink-600",
  "from-cyan-500 to-blue-600",
  "from-fuchsia-500 to-purple-600",
];

function getAvatarGradient(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_GRADIENTS[Math.abs(hash) % AVATAR_GRADIENTS.length];
}

// ─── Single Tile ────────────────────────────────────────────────────────────

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
  const gradient = getAvatarGradient(displayName);

  return (
    <div className="group relative h-full w-full overflow-hidden rounded-2xl bg-zinc-900">
      {/* Speaking glow ring */}
      {isSpeaking && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute inset-0 z-0 rounded-2xl ring-2 ring-indigo-400/50 ring-inset"
          style={{ boxShadow: "inset 0 0 30px rgba(129,140,248,0.15)" }}
        />
      )}

      {mediaStreamTrack ? (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted={isLocal}
          className="relative z-[1] h-full w-full object-cover"
        />
      ) : (
        <div className="relative z-[1] flex h-full w-full items-center justify-center bg-gradient-to-br from-zinc-800 via-zinc-900 to-zinc-950">
          <motion.div
            animate={isSpeaking ? { scale: [1, 1.05, 1] } : {}}
            transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
            className={`flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br text-3xl font-bold text-white shadow-2xl sm:h-24 sm:w-24 sm:text-4xl ${gradient} ${
              isSpeaking ? "ring-3 ring-indigo-400/60 ring-offset-2 ring-offset-zinc-900" : ""
            }`}
          >
            {initials}
          </motion.div>
        </div>
      )}

      {/* Name + mic badge — bottom-left */}
      <div className="absolute bottom-3 left-3 z-10">
        <div className="flex items-center gap-2 rounded-xl bg-black/50 px-3 py-1.5 backdrop-blur-md">
          <span className="text-[13px] font-semibold text-white drop-shadow">
            {isLocal ? "You" : displayName}
          </span>
          {isMuted && (
            <div className="flex h-5 w-5 items-center justify-center rounded-full bg-rose-500/25">
              <FiMicOff className="h-2.5 w-2.5 text-rose-300" />
            </div>
          )}
          {isSpeaking && !isMuted && (
            <div className="flex gap-[2px]">
              {[0, 0.1, 0.2].map((d) => (
                <motion.span
                  key={d}
                  animate={{ scaleY: [1, 1.8, 1] }}
                  transition={{ duration: 0.35, repeat: Infinity, delay: d }}
                  className="h-3 w-[3px] rounded-full bg-indigo-400"
                />
              ))}
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

  // Room-level event listeners — poll until room is available (connectToRoom is async)
  useEffect(() => {
    let cleanup: (() => void) | null = null;
    let stopped = false;

    const register = (r: Room) => {
      const handleParticipantConnected = () => {
        r.remoteParticipants.forEach((p: RemoteParticipant) => {
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
            Array.from(r.remoteParticipants.values()).map((p: RemoteParticipant) => p.identity),
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

      r.on(RoomEvent.ParticipantConnected, handleParticipantConnected);
      r.on(RoomEvent.ParticipantDisconnected, handleParticipantDisconnected);

      // Mount-time scan for already-subscribed tracks (batched — one state update)
      const initial: Record<string, RemoteTrackInfo> = {};
      r.remoteParticipants.forEach((p: RemoteParticipant) => {
        const videoPub = Array.from(p.videoTrackPublications.values())[0];
        initial[p.identity] = {
          track: videoPub?.track?.mediaStreamTrack ?? null,
          name: p.name || p.identity.slice(0, 8),
          muted: !videoPub || !videoPub.track || videoPub.isMuted,
        };
      });
      setRemoteTracks(initial);

      cleanup = () => {
        window.removeEventListener("livekit:track-subscribed", handleTrackSubscribed);
        window.removeEventListener("livekit:track-unsubscribed", handleTrackUnsubscribed);
        window.removeEventListener("livekit:speakers-changed", handleSpeakersChanged);
        window.removeEventListener("livekit:track-muted", handleTrackMuted);
        window.removeEventListener("livekit:track-unmuted", handleTrackUnmuted);
        r.off(RoomEvent.ParticipantConnected, handleParticipantConnected);
        r.off(RoomEvent.ParticipantDisconnected, handleParticipantDisconnected);
      };
    };

    const tryConnect = () => {
      const r = getLiveKitRoom();
      if (r) {
        register(r);
        return true;
      }
      return false;
    };

    // Try immediately, then poll every 100ms until room is available
    if (!tryConnect()) {
      const interval = setInterval(() => {
        if (stopped) { clearInterval(interval); return; }
        if (tryConnect()) clearInterval(interval);
      }, 100);
      return () => { stopped = true; clearInterval(interval); };
    }

    return () => { stopped = true; cleanup?.(); };
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
