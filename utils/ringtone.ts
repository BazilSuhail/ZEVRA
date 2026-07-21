import { useCallStore } from '@/context/stores/call-store';

// ─── Synthesized call ringtone (Web Audio API — no mp3 asset needed) ───────
//
// A large, modern call sound rather than a traditional telephone beep:
//   • two-note rising motif (D5 → G5, perfect fifth) with ±7-cent detune
//     chorus on each note for width and richness
//   • shimmer octave (D6) accent on the second note
//   • low body swell (G3 triangle + G2 sine sub) under the motif so the
//     ring has real "size" on small speakers
//   • stereo panning per voice + a synthesized exponential-decay reverb
//     (convolver with generated noise impulse) for space
// Cadence: motif at t=0 / t=0.3s, body tail until ~1.2s, silence, repeat.
// Playback is driven centrally by initCallRingtone() subscribing to the
// call store — starts when an incoming call is ringing, stops the moment
// it is declined, accepted, times out, or the call ends.

interface Voice {
  osc: OscillatorNode;
  gain: GainNode;
  panner: StereoPannerNode;
}

let ctx: AudioContext | null = null;
let voices: Voice[] = [];
let outGain: GainNode | null = null;
let dryGain: GainNode | null = null;
let wetGain: GainNode | null = null;
let convolver: ConvolverNode | null = null;
let cadenceTimer: ReturnType<typeof setInterval> | null = null;
let ringing = false;
let gestureCleanup: (() => void) | null = null;
let reverbBuffer: AudioBuffer | null = null;

const PERIOD_SEC = 2;
const MASTER_VOLUME = 0.16;

type Env = (param: AudioParam, t: number) => void;

// Fast attack, natural (exponential) release — musical, not a hard gate
function pluck(level: number, len: number): Env {
  return (p, t) => {
    p.setValueAtTime(0, t);
    p.linearRampToValueAtTime(level, t + 0.012);
    p.exponentialRampToValueAtTime(0.0001, t + len);
    p.setValueAtTime(0, t + len + 0.01);
  };
}

// Swell: slow-ish in, long tail — the "body" of the ring
function swell(level: number, attack: number, len: number): Env {
  return (p, t) => {
    p.setValueAtTime(0, t);
    p.linearRampToValueAtTime(level, t + attack);
    p.exponentialRampToValueAtTime(0.0001, t + len);
    p.setValueAtTime(0, t + len + 0.01);
  };
}

interface VoiceSpec {
  freq: number;
  type: OscillatorType;
  pan: number;
  detune?: number; // cents
  offset: number; // seconds into the cycle
  env: Env;
}

// D5 → G5 rising motif (strong, modern), sub/body under it
const VOICE_SPECS: VoiceSpec[] = [
  // Motif note 1: D5 (plain + detuned chorus pair)
  { freq: 587.33, type: 'triangle', pan: -0.45, offset: 0, env: pluck(0.5, 0.42) },
  { freq: 587.33, type: 'triangle', pan: -0.3, detune: 7, offset: 0, env: pluck(0.3, 0.44) },
  // Motif note 2: G5 (plain + detuned chorus pair)
  { freq: 783.99, type: 'triangle', pan: 0.45, offset: 0.3, env: pluck(0.5, 0.5) },
  { freq: 783.99, type: 'triangle', pan: 0.3, detune: -7, offset: 0.3, env: pluck(0.3, 0.52) },
  // Shimmer octave accent on note 2
  { freq: 1174.66, type: 'sine', pan: 0.7, offset: 0.3, env: pluck(0.12, 0.7) },
  // Body: G3 triangle pad + G2 sine sub for size
  { freq: 196.0, type: 'triangle', pan: -0.15, offset: 0, env: swell(0.22, 0.18, 1.1) },
  { freq: 98.0, type: 'sine', pan: 0, offset: 0, env: swell(0.4, 0.2, 1.2) },
];

function ensureContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  const AC = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AC) return null;
  if (!ctx) ctx = new AC();
  return ctx;
}

// Generated noise-decay impulse gives the ring size without any asset
function getReverbBuffer(audio: AudioContext): AudioBuffer {
  if (reverbBuffer) return reverbBuffer;
  const len = Math.floor(audio.sampleRate * 1.6);
  const buf = audio.createBuffer(2, len, audio.sampleRate);
  for (let ch = 0; ch < 2; ch++) {
    const data = buf.getChannelData(ch);
    for (let i = 0; i < len; i++) {
      const decay = Math.pow(1 - i / len, 2.6);
      data[i] = (Math.random() * 2 - 1) * decay;
    }
  }
  reverbBuffer = buf;
  return buf;
}

function scheduleCycle(startTime: number) {
  if (!ctx || !voiceSpecs.length) return;
  for (const { voice, spec } of voiceSpecs) {
    const t = startTime + spec.offset;
    const g = voice.gain.gain;
    try {
      g.cancelScheduledValues(startTime);
      g.setValueAtTime(0, startTime);
    } catch {}
    spec.env(g, t);
  }
}

// Paired with VOICE_SPECS at graph build time
let voiceSpecs: { voice: Voice; spec: VoiceSpec }[] = [];

function buildGraph(audio: AudioContext) {
  // Master → dry/wet split; wet goes through the generated reverb
  outGain = audio.createGain();
  outGain.gain.value = MASTER_VOLUME;
  outGain.connect(audio.destination);

  dryGain = audio.createGain();
  dryGain.gain.value = 0.8;
  dryGain.connect(outGain);

  convolver = audio.createConvolver();
  convolver.buffer = getReverbBuffer(audio);
  wetGain = audio.createGain();
  wetGain.gain.value = 0.45;
  convolver.connect(wetGain);
  wetGain.connect(outGain);
  dryGain.connect(convolver);

  voiceSpecs = VOICE_SPECS.map((spec) => {
    const osc = audio.createOscillator();
    osc.type = spec.type;
    osc.frequency.value = spec.freq;
    if (spec.detune) osc.detune.value = spec.detune;

    const gain = audio.createGain();
    gain.gain.value = 0;

    const panner = audio.createStereoPanner();
    panner.pan.value = spec.pan;

    osc.connect(gain);
    gain.connect(panner);
    panner.connect(dryGain!);
    panner.connect(convolver!);
    osc.start();

    return { voice: { osc, gain, panner }, spec };
  });
  voices = voiceSpecs.map((v) => v.voice);
}

function teardownGraph() {
  if (ctx) {
    const now = ctx.currentTime;
    for (const v of voices) {
      try {
        v.gain.gain.cancelScheduledValues(now);
        v.gain.gain.setValueAtTime(0, now);
        v.osc.stop(now + 0.01);
      } catch {}
      try {
        v.osc.disconnect();
        v.gain.disconnect();
        v.panner.disconnect();
      } catch {}
    }
  }
  voices = [];
  voiceSpecs = [];
  try {
    outGain?.disconnect();
    dryGain?.disconnect();
    wetGain?.disconnect();
    convolver?.disconnect();
  } catch {}
  outGain = null;
  dryGain = null;
  wetGain = null;
  convolver = null;
}

function beginCadence() {
  // Guard against a late AudioContext.resume() resolving after stopRingtone()
  if (!ringing || cadenceTimer || !ctx) return;
  scheduleCycle(ctx.currentTime + 0.05);
  cadenceTimer = setInterval(() => {
    if (!ringing || !ctx || !cadenceTimer) return;
    scheduleCycle(ctx.currentTime + 0.05);
  }, PERIOD_SEC * 1000);
}

// Browsers may keep the AudioContext suspended until a user gesture —
// resume on the first interaction while a call is ringing.
function attachGestureResume() {
  if (gestureCleanup) return;
  const resume = () => {
    if (!ctx || !ringing) {
      gestureCleanup?.();
      gestureCleanup = null;
      return;
    }
    ctx.resume().then(() => {
      beginCadence();
      gestureCleanup?.();
      gestureCleanup = null;
    }).catch(() => {});
  };
  window.addEventListener('pointerdown', resume, { once: true });
  window.addEventListener('keydown', resume, { once: true });
  gestureCleanup = () => {
    window.removeEventListener('pointerdown', resume);
    window.removeEventListener('keydown', resume);
  };
}

export function startRingtone(): void {
  if (ringing) return;
  const audio = ensureContext();
  if (!audio) return;
  ringing = true;

  buildGraph(audio);

  if (audio.state === 'suspended') {
    audio.resume().then(beginCadence).catch(attachGestureResume);
  } else {
    beginCadence();
  }
}

export function stopRingtone(): void {
  if (cadenceTimer) {
    clearInterval(cadenceTimer);
    cadenceTimer = null;
  }
  gestureCleanup?.();
  gestureCleanup = null;

  if (!ringing && voices.length === 0) return;
  ringing = false;

  teardownGraph();
  ctx?.suspend().catch(() => {});
}

// ─── Store-driven start/stop (call once, client-side only) ─────────────────

let initialized = false;

export function initCallRingtone(): void {
  if (initialized || typeof window === 'undefined') return;
  initialized = true;

  const sync = (state: {
    incomingCall: unknown;
    callStatus: string;
    ringtoneEnabled: boolean;
  }) => {
    const shouldRing =
      !!state.incomingCall && state.callStatus === 'idle' && state.ringtoneEnabled;
    if (shouldRing) startRingtone();
    else stopRingtone();
  };

  sync(useCallStore.getState());
  useCallStore.subscribe(sync);
}
