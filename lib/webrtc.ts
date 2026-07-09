import type { AppSocket } from './socket';
import { useCallStore } from '@/context/stores/call-store';
import { SOCKET_EVENTS } from '@/constants';

// ─── Constants ──────────────────────────────────────────────────────────────

const STUN_SERVERS: RTCIceServer[] = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
  { urls: 'stun:stun2.l.google.com:19302' },
];

const ICE_CANDIDATE_BUFFER_MS = 500;
const SDP_TIMEOUT_MS = 10000;

// ─── Helpers ────────────────────────────────────────────────────────────────

export function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

async function getOrCreateLocalStream(): Promise<MediaStream> {
  const existing = useCallStore.getState().localStream;
  if (existing && existing.active) return existing;
  return getLocalStream(true);
}

// ─── Peer Connection Factory ────────────────────────────────────────────────

export function createPeerConnection(): RTCPeerConnection {
  return new RTCPeerConnection({ iceServers: STUN_SERVERS });
}

export async function getLocalStream(video = true): Promise<MediaStream> {
  return navigator.mediaDevices.getUserMedia({
    audio: true,
    video: video ? { width: { ideal: 640 }, height: { ideal: 480 } } : false,
  });
}

export function stopStream(stream: MediaStream | null) {
  if (!stream) return;
  stream.getTracks().forEach((t) => t.stop());
}

export function cleanupPeer(pc: RTCPeerConnection | null) {
  if (!pc) return;
  try {
    pc.close();
  } catch {
    // already closed
  }
}

// ─── WebRTC Call Manager ────────────────────────────────────────────────────

export class WebRTCCall {
  private pc: RTCPeerConnection;
  private socket: AppSocket;
  private callId: string;
  private peerId: string;
  private pendingCandidates: RTCIceCandidateInit[] = [];
  private iceCandidateBuffer: RTCIceCandidateInit[] = [];
  private flushTimer: ReturnType<typeof setTimeout> | null = null;
  private destroyed = false;

  constructor(socket: AppSocket, callId: string, peerId: string) {
    this.socket = socket;
    this.callId = callId;
    this.peerId = peerId;
    this.pc = createPeerConnection();
    this.setupListeners();
  }

  get peerConnection() {
    return this.pc;
  }

  private setupListeners() {
    this.pc.onicecandidate = (event) => {
      if (event.candidate) {
        this.socket.emit(SOCKET_EVENTS.CALL_ICE_CANDIDATE, {
          callId: this.callId,
          candidate: event.candidate.toJSON(),
          targetUserId: this.peerId,
        });
      }
    };

    this.pc.ontrack = (event) => {
      if (event.streams[0]) {
        useCallStore.getState().setRemoteStream(event.streams[0]);
      }
    };

    this.pc.oniceconnectionstatechange = () => {
      const state = this.pc.iceConnectionState;
      if (state === 'connected' || state === 'completed') {
        useCallStore.getState().setCallStatus('connected');
        useCallStore.getState().startTimer();
      } else if (state === 'disconnected' || state === 'failed' || state === 'closed') {
        this.hangup('error');
      }
    };
  }

  async addLocalStream(stream: MediaStream) {
    stream.getTracks().forEach((track) => {
      this.pc.addTrack(track, stream);
    });
    useCallStore.getState().setLocalStream(stream);
  }

  async createOffer(): Promise<RTCSessionDescriptionInit> {
    const offer = await this.pc.createOffer();
    await this.pc.setLocalDescription(offer);

    const sdp = this.pc.localDescription?.sdp;
    if (!sdp) throw new Error('Failed to create offer SDP');

    return { type: 'offer', sdp };
  }

  async handleOffer(sdp: string): Promise<void> {
    if (this.destroyed) return;

    const desc = new RTCSessionDescription({ type: 'offer', sdp });
    await this.pc.setRemoteDescription(desc);

    // Flush any ICE candidates that arrived before SDP
    if (this.pendingCandidates.length > 0) {
      for (const c of this.pendingCandidates) {
        await this.pc.addIceCandidate(new RTCIceCandidate(c));
      }
      this.pendingCandidates = [];
    }
  }

  async createAnswer(): Promise<RTCSessionDescriptionInit> {
    const answer = await this.pc.createAnswer();
    await this.pc.setLocalDescription(answer);

    const sdp = this.pc.localDescription?.sdp;
    if (!sdp) throw new Error('Failed to create answer SDP');

    return { type: 'answer', sdp };
  }

  async handleAnswer(sdp: string): Promise<void> {
    if (this.destroyed) return;

    const desc = new RTCSessionDescription({ type: 'answer', sdp });
    await this.pc.setRemoteDescription(desc);

    // Flush any ICE candidates that arrived before SDP
    if (this.pendingCandidates.length > 0) {
      for (const c of this.pendingCandidates) {
        await this.pc.addIceCandidate(new RTCIceCandidate(c));
      }
      this.pendingCandidates = [];
    }
  }

  async handleIceCandidate(candidate: RTCIceCandidateInit) {
    if (this.destroyed) return;

    if (this.pc.remoteDescription) {
      await this.pc.addIceCandidate(new RTCIceCandidate(candidate));
    } else {
      this.pendingCandidates.push(candidate);
    }
  }

  hangup(endedBy: 'you' | 'peer' | 'error' = 'you') {
    if (this.destroyed) return;
    this.destroyed = true;

    if (this.flushTimer) clearTimeout(this.flushTimer);

    const { localStream, peerConnection } = useCallStore.getState();
    stopStream(localStream);
    cleanupPeer(peerConnection);

    this.socket.emit(SOCKET_EVENTS.CALL_HANGUP, {
      callId: this.callId,
    });

    useCallStore.getState().hangupCall(endedBy);
  }

  destroy() {
    if (this.destroyed) return;
    this.destroyed = true;

    if (this.flushTimer) clearTimeout(this.flushTimer);

    const { localStream, peerConnection } = useCallStore.getState();
    stopStream(localStream);
    cleanupPeer(peerConnection);

    useCallStore.getState().clearCall();
  }
}

// ─── Socket Setup for WebRTC ────────────────────────────────────────────────

let activeCall: WebRTCCall | null = null;

export function getActiveCall() {
  return activeCall;
}

export function setupWebRTCSocketHandlers(socket: AppSocket) {
  // Server confirms call method
  socket.on(SOCKET_EVENTS.CALL_METHOD_SELECTED, (data: any) => {
    const { callId, method, targetUserId, targetUsername } = data;

    if (method === 'WEBRTC') {
      const store = useCallStore.getState();
      // Update with real callId/peerId from server (callStatus already 'ringing' from startCall)
      store.setActiveCall({
        callId,
        method: 'WEBRTC',
        peerId: targetUserId,
        peerUsername: targetUsername,
      });
    }
  });

  // Incoming call notification
  socket.on(SOCKET_EVENTS.CALL_INCOMING, (data: any) => {
    useCallStore.getState().setIncomingCall({
      callId: data.callId,
      callerId: data.callerId,
      callerUsername: data.callerUsername,
      method: data.method || 'WEBRTC',
    });
  });

  // Call accepted by remote — caller creates offer, callee sets up PC and waits
  socket.on(SOCKET_EVENTS.CALL_ACCEPTED, async (data: any) => {
    const store = useCallStore.getState();
    const { callId, calleeId, calleeUsername } = data;

    // Use isCaller flag (set synchronously by startCall in CallButton)
    const isCaller = store.isCaller;

    // Fallback: if CALL_METHOD_SELECTED never fired, set up activeCall now
    if (!store.activeCall) {
      const peerId = calleeId || data.peerId || '';
      const peerUsername = calleeUsername || data.peerUsername || 'Unknown';
      store.setActiveCall({
        callId,
        method: 'WEBRTC',
        peerId,
        peerUsername,
      });
    }

    if (isCaller) {
      // ─── Caller: create offer ──────────────────────────────────────
      store.setCallStatus('connecting');

      const peerId = store.activeCall?.peerId || calleeId || '';
      activeCall = new WebRTCCall(socket, callId, peerId);

      try {
        const stream = await getOrCreateLocalStream();
        await activeCall.addLocalStream(stream);

        const offer = await activeCall.createOffer();
        socket.emit(SOCKET_EVENTS.CALL_OFFER, {
          callId,
          sdp: offer.sdp!,
        });

        useCallStore.setState({ peerConnection: activeCall.peerConnection });
      } catch (err) {
        console.error('[WebRTC] Failed to create offer:', err);
        activeCall.destroy();
        activeCall = null;
      }
    } else {
      // ─── Callee: set up PC, get stream, wait for offer ─────────────
      const peerId = store.activeCall?.peerId || '';
      activeCall = new WebRTCCall(socket, callId, peerId);

      try {
        const stream = await getOrCreateLocalStream();
        await activeCall.addLocalStream(stream);
        useCallStore.setState({ peerConnection: activeCall.peerConnection });
      } catch (err) {
        console.error('[WebRTC] Failed to setup callee:', err);
        activeCall.destroy();
        activeCall = null;
      }
    }
  });

  // Call rejected
  socket.on(SOCKET_EVENTS.CALL_REJECTED, () => {
    activeCall?.destroy();
    activeCall = null;
    useCallStore.getState().clearCall();
  });

  // Remote hangup
  socket.on(SOCKET_EVENTS.CALL_HANGUP_RECV, () => {
    activeCall?.destroy();
    activeCall = null;
    useCallStore.getState().hangupCall('peer');
  });

  // WebRTC offer received — callee receives the offer from caller
  socket.on(SOCKET_EVENTS.CALL_OFFER_RECV, async (data: any) => {
    const store = useCallStore.getState();
    const { callId, callerId, callerUsername } = data;

    // Handle both server formats: { offer: { type, sdp } } or raw { sdp }
    const sdp = data.offer?.sdp ?? data.sdp;
    if (!sdp || typeof sdp !== 'string' || !sdp.startsWith('v=')) {
      console.error('[WebRTC] Received invalid offer SDP:', data);
      return;
    }

    // If we already have an activeCall (callee accepted and set up PC), just handle offer
    if (activeCall) {
      try {
        await activeCall.handleOffer(sdp);

        const answer = await activeCall.createAnswer();
        socket.emit(SOCKET_EVENTS.CALL_ANSWER, {
          callId,
          sdp: answer.sdp!,
        });
      } catch (err) {
        console.error('[WebRTC] Failed to handle offer:', err);
      }
      return;
    }

    // Fallback: create everything from scratch (offer arrived before CALL_ACCEPTED)
    store.setActiveCall({
      callId,
      method: 'WEBRTC',
      peerId: callerId,
      peerUsername: callerUsername,
    });
    store.setCallStatus('connecting');
    store.clearIncomingCall();

    activeCall = new WebRTCCall(socket, callId, callerId);

    try {
      const stream = await getOrCreateLocalStream();
      await activeCall.addLocalStream(stream);

      await activeCall.handleOffer(sdp);

      const answer = await activeCall.createAnswer();
      socket.emit(SOCKET_EVENTS.CALL_ANSWER, {
        callId,
        sdp: answer.sdp!,
      });

      useCallStore.setState({ peerConnection: activeCall.peerConnection });
    } catch (err) {
      console.error('[WebRTC] Failed to handle offer fallback:', err);
      activeCall.destroy();
      activeCall = null;
    }
  });

  // WebRTC answer received
  socket.on(SOCKET_EVENTS.CALL_ANSWER_RECV, async (data: any) => {
    if (!activeCall) return;

    // Handle both server formats: { answer: { type, sdp } } or raw { sdp }
    const sdp = data.answer?.sdp ?? data.sdp;
    if (!sdp || typeof sdp !== 'string' || !sdp.startsWith('v=')) {
      console.error('[WebRTC] Received invalid answer SDP:', data);
      return;
    }

    try {
      await activeCall.handleAnswer(sdp);
    } catch (err) {
      console.error('[WebRTC] Failed to handle answer:', err);
    }
  });

  // ICE candidate received
  socket.on(SOCKET_EVENTS.CALL_ICE_CANDIDATE_RECV, async (data: any) => {
    if (!activeCall) return;

    try {
      await activeCall.handleIceCandidate(data.candidate);
    } catch (err) {
      console.error('[WebRTC] Failed to handle ICE candidate:', err);
    }
  });
}

export function teardownWebRTCCall() {
  if (activeCall) {
    activeCall.destroy();
    activeCall = null;
  }
}
