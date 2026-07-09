import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

// ─── Types ──────────────────────────────────────────────────────────────────

export type CallMethod = 'WEBRTC' | 'LIVEKIT';
export type CallStatus = 'idle' | 'ringing' | 'connecting' | 'connected' | 'ended';

export interface ActiveCall {
  callId: string;
  method: CallMethod;
  peerId: string;
  peerUsername: string;
  roomName?: string;
  serverUrl?: string;
  token?: string;
  callLogId?: string;
}

export interface IncomingCall {
  callId: string;
  callerId: string;
  callerUsername: string;
  method?: CallMethod;
}

export interface CallState {
  // Active call
  activeCall: ActiveCall | null;
  callStatus: CallStatus;

  // Incoming call
  incomingCall: IncomingCall | null;

  // Media controls
  isMuted: boolean;
  isVideoOff: boolean;

  // Call view
  isFullscreen: boolean;

  // Timer
  callDuration: number;
  callStartedAt: number | null;

  // Streams (not persisted)
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  peerConnection: RTCPeerConnection | null;

  // Settings
  ringtoneEnabled: boolean;
}

export interface CallActions {
  // Call lifecycle
  startCall: (targetUserIds: string[], type: 'DM' | 'GROUP') => void;
  acceptCall: () => void;
  rejectCall: () => void;
  hangupCall: () => void;
  clearCall: () => void;

  // State setters
  setActiveCall: (call: ActiveCall | null) => void;
  setCallStatus: (status: CallStatus) => void;
  setIncomingCall: (call: IncomingCall | null) => void;
  clearIncomingCall: () => void;

  // Media
  toggleMute: () => void;
  toggleVideo: () => void;
  setLocalStream: (stream: MediaStream | null) => void;
  setRemoteStream: (stream: MediaStream | null) => void;
  setPeerConnection: (pc: RTCPeerConnection | null) => void;

  // View
  toggleFullscreen: () => void;
  setFullscreen: (fullscreen: boolean) => void;

  // Timer
  startTimer: () => void;
  stopTimer: () => void;
  tickTimer: () => void;

  // Settings
  setRingtoneEnabled: (enabled: boolean) => void;
}

// ─── Store ──────────────────────────────────────────────────────────────────

export const useCallStore = create<CallState & CallActions>()(
  devtools(
    persist(
      (set, get) => ({
        // ─── Initial State ────────────────────────────────────────────
        activeCall: null,
        callStatus: 'idle',
        incomingCall: null,
        isMuted: false,
        isVideoOff: false,
        isFullscreen: false,
        callDuration: 0,
        callStartedAt: null,
        localStream: null,
        remoteStream: null,
        peerConnection: null,
        ringtoneEnabled: false,

        // ─── Call Lifecycle ───────────────────────────────────────────

        startCall: (targetUserIds, type) => {
          // This will be called from the component
          // The actual socket emit happens in the component
          set(
            {
              callStatus: 'ringing',
              callDuration: 0,
              callStartedAt: null,
              isMuted: false,
              isVideoOff: false,
              isFullscreen: false,
            },
            false,
            'startCall',
          );
        },

        acceptCall: () => {
          set({ callStatus: 'connecting' }, false, 'acceptCall');
        },

        rejectCall: () => {
          set(
            {
              incomingCall: null,
              callStatus: 'idle',
            },
            false,
            'rejectCall',
          );
        },

        hangupCall: () => {
          const { localStream, remoteStream, peerConnection } = get();

          // Cleanup streams
          if (localStream) {
            localStream.getTracks().forEach((t) => t.stop());
          }
          if (remoteStream) {
            remoteStream.getTracks().forEach((t) => t.stop());
          }
          if (peerConnection) {
            peerConnection.close();
          }

          set(
            {
              activeCall: null,
              callStatus: 'idle',
              incomingCall: null,
              localStream: null,
              remoteStream: null,
              peerConnection: null,
              isMuted: false,
              isVideoOff: false,
              isFullscreen: false,
              callDuration: 0,
              callStartedAt: null,
            },
            false,
            'hangupCall',
          );
        },

        clearCall: () => {
          const { localStream, remoteStream, peerConnection } = get();

          if (localStream) {
            localStream.getTracks().forEach((t) => t.stop());
          }
          if (remoteStream) {
            remoteStream.getTracks().forEach((t) => t.stop());
          }
          if (peerConnection) {
            peerConnection.close();
          }

          set(
            {
              activeCall: null,
              callStatus: 'idle',
              localStream: null,
              remoteStream: null,
              peerConnection: null,
              isMuted: false,
              isVideoOff: false,
              isFullscreen: false,
              callDuration: 0,
              callStartedAt: null,
            },
            false,
            'clearCall',
          );
        },

        // ─── State Setters ────────────────────────────────────────────

        setActiveCall: (call) => set({ activeCall: call }, false, 'setActiveCall'),

        setCallStatus: (status) => set({ callStatus: status }, false, 'setCallStatus'),

        setIncomingCall: (call) => set({ incomingCall: call }, false, 'setIncomingCall'),

        clearIncomingCall: () => set({ incomingCall: null }, false, 'clearIncomingCall'),

        // ─── Media ────────────────────────────────────────────────────

        toggleMute: () =>
          set(
            (state) => {
              const newMuted = !state.isMuted;
              // Toggle audio track
              if (state.localStream) {
                state.localStream.getAudioTracks().forEach((t) => {
                  t.enabled = !newMuted;
                });
              }
              return { isMuted: newMuted };
            },
            false,
            'toggleMute',
          ),

        toggleVideo: () =>
          set(
            (state) => {
              const newVideoOff = !state.isVideoOff;
              // Toggle video track
              if (state.localStream) {
                state.localStream.getVideoTracks().forEach((t) => {
                  t.enabled = !newVideoOff;
                });
              }
              return { isVideoOff: newVideoOff };
            },
            false,
            'toggleVideo',
          ),

        setLocalStream: (stream) => set({ localStream: stream }, false, 'setLocalStream'),

        setRemoteStream: (stream) => set({ remoteStream: stream }, false, 'setRemoteStream'),

        setPeerConnection: (pc) => set({ peerConnection: pc }, false, 'setPeerConnection'),

        // ─── View ─────────────────────────────────────────────────────

        toggleFullscreen: () =>
          set(
            (state) => ({ isFullscreen: !state.isFullscreen }),
            false,
            'toggleFullscreen',
          ),

        setFullscreen: (fullscreen) => set({ isFullscreen: fullscreen }, false, 'setFullscreen'),

        // ─── Timer ────────────────────────────────────────────────────

        startTimer: () =>
          set({ callStartedAt: Date.now(), callDuration: 0 }, false, 'startTimer'),

        stopTimer: () => set({ callStartedAt: null }, false, 'stopTimer'),

        tickTimer: () =>
          set(
            (state) => {
              if (!state.callStartedAt) return {};
              return {
                callDuration: Math.floor((Date.now() - state.callStartedAt) / 1000),
              };
            },
            false,
            'tickTimer',
          ),

        // ─── Settings ─────────────────────────────────────────────────

        setRingtoneEnabled: (enabled) =>
          set({ ringtoneEnabled: enabled }, false, 'setRingtoneEnabled'),
      }),
      {
        name: 'zevra-call',
        partialize: (state) => ({
          ringtoneEnabled: state.ringtoneEnabled,
        }),
      },
    ),
    { name: 'CallStore' },
  ),
);
