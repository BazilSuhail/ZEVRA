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
        this.hangup();
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

  hangup() {
    if (this.destroyed) return;
    this.destroyed = true;

    if (this.flushTimer) clearTimeout(this.flushTimer);

    const { localStream, peerConnection } = useCallStore.getState();
    stopStream(localStream);
    cleanupPeer(peerConnection);

    this.socket.emit(SOCKET_EVENTS.CALL_HANGUP, {
      callId: this.callId,
      targetUserId: this.peerId,
    });

    useCallStore.getState().hangupCall();
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
  socket.on(SOCKET_EVENTS.CALL_METHOD_SELECTED, async (data: any) => {
    const { callId, method, targetUserId, targetUsername } = data;

    if (method === 'WEBRTC') {
      const store = useCallStore.getState();
      store.setActiveCall({
        callId,
        method: 'WEBRTC',
        peerId: targetUserId,
        peerUsername: targetUsername,
      });
      store.setCallStatus('ringing');
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

  // Call accepted by remote
  socket.on(SOCKET_EVENTS.CALL_ACCEPTED, async (data: any) => {
    const store = useCallStore.getState();
    store.setCallStatus('connecting');

    if (!store.activeCall) return;

    activeCall = new WebRTCCall(socket, store.activeCall.callId, store.activeCall.peerId);

    try {
      const stream = await getLocalStream(true);
      await activeCall.addLocalStream(stream);

      const offer = await activeCall.createOffer();
      socket.emit(SOCKET_EVENTS.CALL_OFFER, {
        callId: store.activeCall.callId,
        offer,
        targetUserId: store.activeCall.peerId,
      });

      useCallStore.setState({ peerConnection: activeCall.peerConnection });
    } catch (err) {
      console.error('[WebRTC] Failed to create offer:', err);
      activeCall.destroy();
      activeCall = null;
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
    useCallStore.getState().hangupCall();
  });

  // WebRTC offer received
  socket.on(SOCKET_EVENTS.CALL_OFFER_RECV, async (data: any) => {
    const store = useCallStore.getState();
    const { callId, offer, callerId, callerUsername } = data;

    store.setIncomingCall({
      callId,
      callerId,
      callerUsername,
      method: 'WEBRTC',
    });

    // Auto-accept (called when user clicks accept)
    const acceptHandler = async () => {
      store.setActiveCall({
        callId,
        method: 'WEBRTC',
        peerId: callerId,
        peerUsername: callerUsername,
      });
      store.setCallStatus('connecting');

      activeCall = new WebRTCCall(socket, callId, callerId);

      try {
        const stream = await getLocalStream(true);
        await activeCall.addLocalStream(stream);

        await activeCall.handleOffer(offer.sdp);

        const answer = await activeCall.createAnswer();
        socket.emit(SOCKET_EVENTS.CALL_ANSWER, {
          callId,
          answer,
          targetUserId: callerId,
        });

        useCallStore.setState({ peerConnection: activeCall.peerConnection });
        store.clearIncomingCall();
      } catch (err) {
        console.error('[WebRTC] Failed to handle offer:', err);
        activeCall?.destroy();
        activeCall = null;
      }
    };

    // Store handler so UI can call it
    useCallStore.setState({ _acceptOffer: acceptHandler } as any);
  });

  // WebRTC answer received
  socket.on(SOCKET_EVENTS.CALL_ANSWER_RECV, async (data: any) => {
    if (!activeCall) return;

    try {
      await activeCall.handleAnswer(data.answer.sdp);
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
