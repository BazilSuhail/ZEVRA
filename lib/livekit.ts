"use client";

import {
  Room,
  RoomEvent,
  Track,
  ConnectionState,
  type Participant,
  type RemoteParticipant,
  type TrackPublication,
  DataPacket_Kind,
} from "livekit-client";
import { useCallStore } from "@/context/stores/call-store";

// ─── Singleton ──────────────────────────────────────────────────────────────

let room: Room | null = null;

export function getLiveKitRoom(): Room | null {
  return room;
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function buildLocalStream(r: Room): MediaStream | null {
  const tracks: MediaStreamTrack[] = [];
  for (const pub of r.localParticipant.getTrackPublications()) {
    if (pub.track?.mediaStreamTrack) {
      tracks.push(pub.track.mediaStreamTrack);
    }
  }
  return tracks.length > 0 ? new MediaStream(tracks) : null;
}

// ─── Connection ─────────────────────────────────────────────────────────────

export async function connectToRoom(
  serverUrl: string,
  token: string,
): Promise<Room> {
  if (room) {
    await disconnectFromRoom();
  }

  room = new Room({
    adaptiveStream: true,
    dynacast: true,
    audioCaptureDefaults: {
      echoCancellation: true,
      noiseSuppression: true,
      autoGainControl: true,
    },
    videoCaptureDefaults: {
      resolution: { width: 1280, height: 720, frameRate: 30 },
    },
  });

  setupRoomListeners(room);

  await room.connect(serverUrl, token);

  const store = useCallStore.getState();
  store.setCallStatus("connected");
  store.startTimer();

  // Enable camera + mic — tracks will be published asynchronously
  await Promise.all([
    room.localParticipant.setCameraEnabled(true),
    room.localParticipant.setMicrophoneEnabled(true),
  ]);

  // Wait for local tracks to be published, then build the stream
  // The TrackPublished event fires when each local track is ready
  await new Promise<void>((resolve) => {
    const stream = buildLocalStream(room!);
    if (stream) {
      store.setLocalStream(stream);
      resolve();
      return;
    }
    // No tracks yet — wait for them
    let resolved = false;
    const onTrackPublished = () => {
      if (resolved) return;
      const s = buildLocalStream(room!);
      if (s) {
        store.setLocalStream(s);
        resolved = true;
        room!.off(RoomEvent.TrackPublished, onTrackPublished);
        resolve();
      }
    };
    room!.on(RoomEvent.TrackPublished, onTrackPublished);
    // Fallback timeout — don't block forever
    setTimeout(() => {
      if (!resolved) {
        resolved = true;
        room!.off(RoomEvent.TrackPublished, onTrackPublished);
        // Try one more time
        const s = buildLocalStream(room!);
        if (s) store.setLocalStream(s);
        resolve();
      }
    }, 3000);
  });

  updateParticipants(room);

  return room;
}

export async function disconnectFromRoom(): Promise<void> {
  if (!room) return;

  try {
    room.localParticipant.setCameraEnabled(false);
    room.localParticipant.setMicrophoneEnabled(false);
    await room.disconnect();
  } catch {}

  const store = useCallStore.getState();
  store.setLocalStream(null);
  store.setRemoteStream(null);
  store.setParticipants([]);
  room = null;
}

// ─── Listeners ──────────────────────────────────────────────────────────────

function setupRoomListeners(r: Room) {
  r.on(RoomEvent.Connected, () => {
    const store = useCallStore.getState();
    store.setCallStatus("connected");
    store.startTimer();
    updateParticipants(r);
  });

  r.on(RoomEvent.Disconnected, () => {
    useCallStore.getState().hangupCall("peer");
  });

  r.on(RoomEvent.ParticipantConnected, () => {
    updateParticipants(r);
  });

  r.on(RoomEvent.ParticipantDisconnected, () => {
    updateParticipants(r);
  });

  // When a local track is published, update the local stream
  r.on(RoomEvent.TrackPublished, (pub: TrackPublication, participant: Participant) => {
    if (participant === r.localParticipant) {
      const stream = buildLocalStream(r);
      if (stream) {
        useCallStore.getState().setLocalStream(stream);
      }
    }
  });

  r.on(RoomEvent.TrackSubscribed, (track: Track, _pub: TrackPublication, participant: Participant) => {
    if (track.kind === Track.Kind.Video) {
      useCallStore.getState().setRemoteStream(new MediaStream([track.mediaStreamTrack]));
    }
    window.dispatchEvent(
      new CustomEvent("livekit:track-subscribed", {
        detail: { participantIdentity: participant.identity, track },
      }),
    );
  });

  r.on(RoomEvent.TrackUnsubscribed, (track: Track, _pub: TrackPublication, participant: Participant) => {
    if (track.kind === Track.Kind.Video) {
      useCallStore.getState().setRemoteStream(null);
    }
    window.dispatchEvent(
      new CustomEvent("livekit:track-unsubscribed", {
        detail: { participantIdentity: participant.identity, track },
      }),
    );
  });

  r.on(RoomEvent.ActiveSpeakersChanged, (speakers: Participant[]) => {
    window.dispatchEvent(
      new CustomEvent("livekit:speakers-changed", {
        detail: { speakers: speakers.map((s) => s.identity) },
      }),
    );
  });

  r.on(RoomEvent.DataReceived, (payload: Uint8Array, participant?: RemoteParticipant, _kind?: DataPacket_Kind, topic?: string) => {
    window.dispatchEvent(
      new CustomEvent("livekit:data-received", {
        detail: { payload, participantIdentity: participant?.identity, topic },
      }),
    );
  });
}

// ─── Participants ───────────────────────────────────────────────────────────

function updateParticipants(r: Room) {
  const participants = Array.from(r.remoteParticipants.values()).map(
    (p) => p.identity,
  );
  useCallStore.getState().setParticipants(participants);
}

export function getParticipantCount(): number {
  if (!room) return 0;
  return room.remoteParticipants.size + 1;
}

// ─── Media Controls ─────────────────────────────────────────────────────────

export function toggleLocalMic(): boolean {
  if (!room) return false;
  const enabled = !room.localParticipant.isMicrophoneEnabled;
  room.localParticipant.setMicrophoneEnabled(enabled);
  return enabled;
}

export function toggleLocalCamera(): boolean {
  if (!room) return false;
  const enabled = !room.localParticipant.isCameraEnabled;
  room.localParticipant.setCameraEnabled(enabled);
  return enabled;
}

export async function toggleScreenShare(): Promise<boolean> {
  if (!room) return false;
  const enabled = !room.localParticipant.isScreenShareEnabled;
  await room.localParticipant.setScreenShareEnabled(enabled);
  return enabled;
}

// ─── Chat (Data Channel) ────────────────────────────────────────────────────

export interface LiveKitChatMessage {
  message: string;
  sender: string;
  senderName: string;
  timestamp: number;
}

export function sendChatMessage(text: string): void {
  if (!room) return;

  const msg: LiveKitChatMessage = {
    message: text,
    sender: room.localParticipant.identity,
    senderName: room.localParticipant.name || room.localParticipant.identity,
    timestamp: Date.now(),
  };

  const encoded = new TextEncoder().encode(JSON.stringify(msg));
  room.localParticipant.publishData(encoded, { reliable: true, topic: "chat" });
}

// ─── Helpers ────────────────────────────────────────────────────────────────

export function isRoomConnected(): boolean {
  return room?.state === ConnectionState.Connected;
}
