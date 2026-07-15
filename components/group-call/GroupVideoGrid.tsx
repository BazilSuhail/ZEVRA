"use client";

import { useEffect, useRef, useState, useMemo, useCallback } from "react";
import { motion } from "motion/react";
import { FiMic, FiMicOff } from "react-icons/fi";
import { useCallStore } from "@/context/stores/call-store";
import { getLiveKitRoom } from "@/lib/livekit";
import type { Track, TrackPublication, RemoteParticipant, Room } from "livekit-client";
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

// Get best video track from a participant — prefer screen share over camera
function getBestVideoTrack(p: RemoteParticipant | { videoTrackPublications: Map<string, TrackPublication> }): MediaStreamTrack | null {
  const pubs = Array.from(p.videoTrackPublications.values());
  // Prefer screen share
  const screenShare = pubs.find((pub) => pub.source === "screen_share" as any);
  if (screenShare?.track?.mediaStreamTrack) return screenShare.track.mediaStreamTrack;
  // Fall back to camera
  const camera = pubs.find((pub) => pub.source === "camera" as any || (!pub.source));
  if (camera?.track?.mediaStreamTrack) return camera.track.mediaStreamTrack;
  // Fall back to any video track
  return pubs[0]?.track?.mediaStreamTrack ?? null;
}

// ─── Single Tile ────────────────────────────────────────────────────────────

function Tile({
  identity,
  name,
  isLocal,
  isMuted,
  mediaStreamTrack,
  isSpeaking,
  compact,
}: {
  identity: string;
  name: string;
  isLocal: boolean;
  isMuted: boolean;
  mediaStreamTrack: MediaStreamTrack | null;
  isSpeaking: boolean;
  compact?: boolean;
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

  const initials = name
    .split(" ")
    .map((w: string) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
  const gradient = getAvatarGradient(name);

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
            className={`flex items-center justify-center rounded-full bg-gradient-to-br text-white shadow-2xl ${gradient} ${
              compact
                ? "h-12 w-12 text-lg"
                : "h-20 w-20 text-3xl sm:h-24 sm:w-24 sm:text-4xl"
            } ${
              isSpeaking ? "ring-3 ring-indigo-400/60 ring-offset-2 ring-offset-zinc-900" : ""
            }`}
          >
            {initials}
          </motion.div>
        </div>
      )}

      {/* Name + mic badge — bottom-left */}
      <div className={`absolute z-10 ${compact ? "bottom-1.5 left-1.5" : "bottom-3 left-3"}`}>
        <div className={`flex items-center gap-1.5 rounded-xl bg-black/50 backdrop-blur-md ${
          compact ? "px-2 py-1" : "gap-2 px-3 py-1.5"
        }`}>
          <span className={`font-semibold text-white drop-shadow ${
            compact ? "text-[10px]" : "text-[13px]"
          }`}>
            {name}
          </span>
          {isMuted && (
            <div className={`flex items-center justify-center rounded-full bg-rose-500/25 ${
              compact ? "h-3.5 w-3.5" : "h-5 w-5"
            }`}>
              <FiMicOff className={`${compact ? "h-2 w-2" : "h-2.5 w-2.5"} text-rose-300`} />
            </div>
          )}
          {isSpeaking && !isMuted && (
            <div className="flex gap-[2px]">
              {[0, 0.1, 0.2].map((d) => (
                <motion.span
                  key={d}
                  animate={{ scaleY: [1, 1.8, 1] }}
                  transition={{ duration: 0.35, repeat: Infinity, delay: d }}
                  className={`${compact ? "h-2 w-[2px]" : "h-3 w-[3px]"} rounded-full bg-indigo-400`}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Remote Grid (main area) ────────────────────────────────────────────────

function RemoteGrid({
  tiles,
}: {
  tiles: {
    identity: string;
    name: string;
    isMuted: boolean;
    mediaStreamTrack: MediaStreamTrack | null;
    isSpeaking: boolean;
  }[];
}) {
  const count = tiles.length;

  if (count === 0) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-zinc-800/50">
            <FiMic className="h-7 w-7 text-zinc-500" />
          </div>
          <p className="text-sm text-zinc-400">Waiting for others to join...</p>
        </div>
      </div>
    );
  }

  if (count === 1) {
    return (
      <div className="h-full w-full p-1">
        <div className="h-full overflow-hidden rounded-2xl">
          <Tile {...tiles[0]} isLocal={false} />
        </div>
      </div>
    );
  }

  if (count === 2) {
    return (
      <div className="grid h-full grid-cols-1 sm:grid-cols-2 gap-1.5 p-1">
        {tiles.map((t) => (
          <div key={t.identity} className="min-h-0 overflow-hidden rounded-2xl">
            <Tile {...t} isLocal={false} />
          </div>
        ))}
      </div>
    );
  }

  if (count <= 4) {
    return (
      <div className="grid h-full grid-cols-2 gap-1.5 p-1">
        {tiles.map((t) => (
          <div key={t.identity} className="min-h-0 overflow-hidden rounded-2xl">
            <Tile {...t} isLocal={false} />
          </div>
        ))}
      </div>
    );
  }

  if (count <= 6) {
    return (
      <div className="grid h-full grid-cols-2 sm:grid-cols-3 gap-1.5 p-1">
        {tiles.map((t) => (
          <div key={t.identity} className="min-h-0 overflow-hidden rounded-2xl">
            <Tile {...t} isLocal={false} />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid h-full grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-1.5 p-1">
      {tiles.map((t) => (
        <div key={t.identity} className="min-h-0 overflow-hidden rounded-2xl">
          <Tile {...t} isLocal={false} />
        </div>
      ))}
    </div>
  );
}

// ─── Local PIP (bottom-right floating) ──────────────────────────────────────

export function LocalPIP({
  track,
  name,
  isMuted,
  isSpeaking,
}: {
  track: MediaStreamTrack | null;
  name: string;
  isMuted: boolean;
  isSpeaking: boolean;
}) {
  return (
    <motion.div
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: "spring", damping: 20, stiffness: 300 }}
      className="h-full w-full"
    >
      <Tile
        identity="local"
        name={name}
        isLocal={true}
        isMuted={isMuted}
        mediaStreamTrack={track}
        isSpeaking={isSpeaking}
        compact
      />
    </motion.div>
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
          name: existing?.name || participantIdentity.slice(0, 6),
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

  useEffect(() => {
    let cleanup: (() => void) | null = null;
    let stopped = false;

    const register = (r: Room) => {
      const handleParticipantConnected = () => {
        r.remoteParticipants.forEach((p: RemoteParticipant) => {
          setRemoteTracks((prev) => {
            const existing = prev[p.identity];
            const actualTrack = getBestVideoTrack(p);
            if (existing?.track === actualTrack) return prev;
            return {
              ...prev,
              [p.identity]: {
                track: actualTrack,
                name: existing?.name || p.name || p.identity.slice(0, 6),
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

      // Detect screen share tracks being published (by any participant including local)
      const handleTrackPublished = (pub: TrackPublication, participant: any) => {
        if (pub.source !== ("screen_share" as any)) return;
        if (pub.track?.mediaStreamTrack) {
          const id = participant.identity;
          const isLocal = participant === r.localParticipant;
          if (isLocal) {
            // Local screen share — add as a separate grid entry
            setRemoteTracks((prev) => ({
              ...prev,
              [`screenshare-local`]: {
                track: pub.track!.mediaStreamTrack,
                name: "Your screen",
                muted: false,
              },
            }));
          } else {
            // Remote screen share — update their entry to show screen share
            setRemoteTracks((prev) => ({
              ...prev,
              [id]: {
                ...prev[id],
                track: pub.track!.mediaStreamTrack,
                muted: false,
              },
            }));
          }
        }
      };

      const handleTrackUnpublished = (pub: TrackPublication, participant: any) => {
        if (pub.source !== ("screen_share" as any)) return;
        const isLocal = participant === r.localParticipant;
        if (isLocal) {
          setRemoteTracks((prev) => {
            const next = { ...prev };
            delete next["screenshare-local"];
            return next;
          });
        }
      };

      r.on(RoomEvent.TrackPublished, handleTrackPublished);
      r.on(RoomEvent.TrackUnpublished, handleTrackUnpublished);

      const initial: Record<string, RemoteTrackInfo> = {};
      r.remoteParticipants.forEach((p: RemoteParticipant) => {
        initial[p.identity] = {
          track: getBestVideoTrack(p),
          name: p.name || p.identity.slice(0, 6),
          muted: !p.getTrackPublication("microphone" as any)?.track || (p.getTrackPublication("microphone" as any)?.isMuted ?? false),
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
        r.off(RoomEvent.TrackPublished, handleTrackPublished);
        r.off(RoomEvent.TrackUnpublished, handleTrackUnpublished);
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
  }, [handleTrackSubscribed, handleTrackUnsubscribed, handleSpeakersChanged, handleTrackMuted, handleTrackUnmuted]);

  // Remote participants only (for main grid)
  const remoteTiles = useMemo(() => {
    return Object.entries(remoteTracks).map(([identity, data]) => ({
      identity,
      name: data.name,
      isMuted: data.muted,
      mediaStreamTrack: data.track,
      isSpeaking: speakers.has(identity),
    }));
  }, [remoteTracks, speakers]);

  // Local display name from room
  const localName = useMemo(() => {
    const room = getLiveKitRoom();
    return room?.localParticipant.name || "You";
  }, []);

  return (
    <div className="relative h-full w-full overflow-hidden bg-zinc-950">
      {/* Main grid: remote participants */}
      <RemoteGrid tiles={remoteTiles} />

      {/* Connecting overlay */}
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
