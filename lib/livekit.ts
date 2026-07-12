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

  // Enable camera + mic
  await Promise.all([
    room.localParticipant.setCameraEnabled(true),
    room.localParticipant.setMicrophoneEnabled(true),
  ]);

  const store = useCallStore.getState();
  store.setCallStatus("connected");
  store.startTimer();

  // Build local stream from published tracks
  try {
    const tracks: MediaStreamTrack[] = [];
    for (const pub of room.localParticipant.getTrackPublications()) {
      if (pub.track?.mediaStreamTrack) {
        tracks.push(pub.track.mediaStreamTrack);
      }
    }
    if (tracks.length > 0) {
      store.setLocalStream(new MediaStream(tracks));
    }
  } catch {}

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

  r.on(RoomEvent.TrackSubscribed, (track: Track, _pub: TrackPublication, participant: Participant) => {
    if (track.kind === Track.Kind.Video) {
      // Update remote stream for legacy 1:1 callers
      useCallStore.getState().setRemoteStream(new MediaStream([track.mediaStreamTrack]));
    }
    // Dispatch a custom event so GroupVideoGrid can pick it up
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
    // Forward to GroupCallChat via custom event
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
  return room.remoteParticipants.size + 1; // +1 for local
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
