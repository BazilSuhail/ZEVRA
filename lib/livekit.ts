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
let connecting = false;
let intentionalDisconnect = false;

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
  // Prevent double-connect race
  if (connecting) {
    throw new Error("Already connecting to a room");
  }

  if (room) {
    await disconnectFromRoom();
  }

  connecting = true;
  intentionalDisconnect = false;

  let newRoom: Room;
  try {
    newRoom = new Room({
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
  } catch (err) {
    connecting = false;
    throw err;
  }

  setupRoomListeners(newRoom);
  room = newRoom;

  try {
    await newRoom.connect(serverUrl, token);
  } catch (err) {
    connecting = false;
    room = null;
    throw err;
  }

  // Enable camera + mic — fire and forget, tracks publish async
  newRoom.localParticipant.setCameraEnabled(true).catch(() => {});
  newRoom.localParticipant.setMicrophoneEnabled(true).catch(() => {});

  // Poll for local tracks to be published (max 5s)
  const store = useCallStore.getState();
  await new Promise<void>((resolve) => {
    let attempts = 0;
    const maxAttempts = 25; // 25 * 200ms = 5s

    const check = () => {
      attempts++;
      const stream = buildLocalStream(newRoom);
      if (stream) {
        store.setLocalStream(stream);
        resolve();
        return;
      }
      if (attempts >= maxAttempts) {
        // Give up — call will work but without local preview
        resolve();
        return;
      }
      setTimeout(check, 200);
    };

    check();
  });

  store.setCallStatus("connected");
  store.startTimer();
  updateParticipants(newRoom);

  connecting = false;
  return newRoom;
}

export async function disconnectFromRoom(): Promise<void> {
  if (!room) return;

  intentionalDisconnect = true;

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
    // Skip if we initiated the disconnect intentionally
    if (intentionalDisconnect) return;
    useCallStore.getState().hangupCall("peer");
  });

  r.on(RoomEvent.ParticipantConnected, () => {
    updateParticipants(r);
  });

  r.on(RoomEvent.ParticipantDisconnected, () => {
    updateParticipants(r);
  });

  // Local track published — rebuild local stream
  r.on(RoomEvent.TrackPublished, (pub: TrackPublication, participant: Participant) => {
    if (participant === r.localParticipant) {
      const stream = buildLocalStream(r);
      if (stream) {
        useCallStore.getState().setLocalStream(stream);
      }
    }
  });

  // Local track unpublished — rebuild local stream
  r.on(RoomEvent.TrackUnpublished, (pub: TrackPublication, participant: Participant) => {
    if (participant === r.localParticipant) {
      const stream = buildLocalStream(r);
      useCallStore.getState().setLocalStream(stream);
    }
  });

  // Remote track subscribed
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

  // Remote track unsubscribed
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

  // Track muted — remote participant muted
  r.on(RoomEvent.TrackMuted, (pub: TrackPublication, participant: Participant) => {
    window.dispatchEvent(
      new CustomEvent("livekit:track-muted", {
        detail: { participantIdentity: participant.identity, trackSid: pub.trackSid },
      }),
    );
  });

  // Track unmuted — remote participant unmuted
  r.on(RoomEvent.TrackUnmuted, (pub: TrackPublication, participant: Participant) => {
    window.dispatchEvent(
      new CustomEvent("livekit:track-unmuted", {
        detail: { participantIdentity: participant.identity, trackSid: pub.trackSid },
      }),
    );
  });

  // Active speakers changed
  r.on(RoomEvent.ActiveSpeakersChanged, (speakers: Participant[]) => {
    window.dispatchEvent(
      new CustomEvent("livekit:speakers-changed", {
        detail: { speakers: speakers.map((s) => s.identity) },
      }),
    );
  });

  // Data channel received
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
  if (!room || room.state !== ConnectionState.Connected) return;

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
