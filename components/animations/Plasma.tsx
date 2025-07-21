"use client";

import * as React from "react";
import { useEffect, useRef } from "react";

const VERT_SRC = `
attribute vec2 a_pos;
void main(){ gl_Position = vec4(a_pos, 0.0, 1.0); }
`;

const FRAG_SRC = `
#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif

uniform vec2  uRes;
uniform float uTime, uDpr, uCell, uDot;
uniform float uPeak, uHeight, uThick, uFall;
uniform vec3  uBg, uBase, uAccent, uHigh;
uniform vec2  uMouse;
uniform float uMouseRadius, uMouseStrength;

void main(){
  float cs = max(uCell, 2.0);
  vec2 ci = floor(gl_FragCoord.xy / cs);
  vec2 cc = (ci + 0.5) * cs;

  float x = cc.x / uDpr;
  float y = (uRes.y - cc.y) / uDpr;
  float w = uRes.x / uDpr;
  float h = uRes.y / uDpr;

  float normX = (x - w * 0.5) / (w * 0.75);
  float curveY = h * uPeak + normX * normX * (h * uHeight);

  float mdx = x - uMouse.x;
  float influence = uMouseStrength * exp(-(mdx * mdx) / (2.0 * uMouseRadius * uMouseRadius + 1.0));
  curveY = mix(curveY, uMouse.y, influence);

  float dist = abs(y - curveY);
  float th = (140.0 + (1.0 - abs(normX)) * 80.0) * uThick;

  vec3 col = uBg;
  if (dist < th) {
    float i = 1.0 - dist / th;
    float waveX = sin(x * 0.015 + uTime);
    float waveY = cos(y * 0.02 + uTime);
    i = i * 0.7 + waveX * waveY * 0.3 * i;
    i *= max(0.0, 1.0 - pow(abs(normX), uFall));

    if (i > 0.02) {
      float side = uDot * i * uDpr;
      vec2 d = abs(gl_FragCoord.xy - cc);
      float cov = 1.0 - smoothstep(side * 0.5 - 1.0, side * 0.5 + 1.0, max(d.x, d.y));

      vec3 ink = mix(uBase, uAccent, clamp(pow(i, 1.1), 0.0, 1.0));
      ink = mix(ink, uHigh, smoothstep(0.72, 1.0, i));
      col = mix(uBg, ink, cov * clamp(i * 1.6, 0.0, 1.0));
    }
  }
  gl_FragColor = vec4(col, 1.0);
}
`;

function compile(gl: WebGLRenderingContext, type: number, src: string): WebGLShader | null {
  const sh = gl.createShader(type);
  if (!sh) return null;
  gl.shaderSource(sh, src);
  gl.compileShader(sh);
  if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
    console.error("PredictiveArc shader:", gl.getShaderInfoLog(sh));
    gl.deleteShader(sh);
    return null;
  }
  return sh;
}

function parseColor(input: string | undefined, fb: [number, number, number]): [number, number, number] {
  if (!input) return fb;
  const str = String(input).trim();
  if (str.charAt(0) === "#") {
    let hex = str.slice(1);
    if (hex.length === 3 || hex.length === 4) {
      hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
    }
    if (hex.length >= 6) {
      const r = parseInt(hex.slice(0, 2), 16);
      const g = parseInt(hex.slice(2, 4), 16);
      const b = parseInt(hex.slice(4, 6), 16);
      if (!isNaN(r) && !isNaN(g) && !isNaN(b)) return [r / 255, g / 255, b / 255];
    }
    return fb;
  }
  const m = str.match(/[\d.]+/g);
  if (m && m.length >= 3) {
    return [
      Math.min(255, parseFloat(m[0])) / 255,
      Math.min(255, parseFloat(m[1])) / 255,
      Math.min(255, parseFloat(m[2])) / 255,
    ];
  }
  return fb;
}

function num(v: unknown, fb: number): number {
  return typeof v === "number" && isFinite(v) ? v : fb;
}

function clampN(v: number, lo: number, hi: number): number {
  return v < lo ? lo : v > hi ? hi : v;
}

export interface PlasmaProps {
  style?: React.CSSProperties;
  width?: number;
  height?: number;
  background?: string;
  color?: string; // Maps to accentColor for easy usage
  baseColor?: string;
  accentColor?: string;
  highlight?: string;
  density?: number;
  dotSize?: number;
  speed?: number;
  direction?: "forward" | "reverse" | "pingpong";
  scale?: number;
  opacity?: number;
  mouseInteractive?: boolean;
  renderScale?: number;
  maxDpr?: number;
  targetFps?: number;
  iterations?: number;
  arch?: { peak?: number; archHeight?: number; thickness?: number; falloff?: number };
  pointer?: { enabled?: boolean; radius?: number; strength?: number };
}

type ArchGroup = { peak?: number; archHeight?: number; thickness?: number; falloff?: number };
const ARCH_DEFAULTS: Required<ArchGroup> = { peak: 35, archHeight: 70, thickness: 100, falloff: 250 };

type PointerGroup = { enabled?: boolean; radius?: number; strength?: number };
const POINTER_DEFAULTS: Required<PointerGroup> = { enabled: true, radius: 220, strength: 60 };

export const Plasma: React.FC<PlasmaProps> = (props) => {
  const {
    style,
    background = "#030303",
    color,
    baseColor = "#4A3B69",
    accentColor = color || "#B497CF",
    highlight = "#FFFFFF",
    density = 78,
    dotSize = 102,
    speed = 1,
    direction = "forward",
    scale = 1,
    mouseInteractive = true,
    renderScale = 0.55,
    maxDpr = 2,
    targetFps = 35,
    arch,
    pointer,
    width,
    height,
  } = props;

  const arch_ = { ...ARCH_DEFAULTS, ...(arch || {}) };
  const pointer_ = {
    ...POINTER_DEFAULTS,
    enabled: mouseInteractive,
    ...(pointer || {}),
  };

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sizeRef = useRef({ w: 0, h: 0 });
  sizeRef.current = { w: num(width, 0), h: num(height, 0) };

  const vRef = useRef<Record<string, number | string | boolean>>({});
  const dirMultiplier = direction === "reverse" ? -1 : 1;

  vRef.current = {
    bg: background,
    base: baseColor,
    accent: accentColor,
    high: highlight,
    density: Math.round(clampN(num(density, 160), 40, 320) * (scale || 1)),
    dotSize: clampN(num(dotSize, 100), 20, 400) / 100,
    speed: clampN(num(speed, 1), 0, 10) * dirMultiplier,
    peak: clampN(num(arch_.peak, 35), 0, 100) / 100,
    archHeight: clampN(num(arch_.archHeight, 70), 0, 300) / 100,
    thickness: clampN(num(arch_.thickness, 100), 20, 400) / 100,
    falloff: clampN(num(arch_.falloff, 250), 50, 600) / 100,
    pointerEnabled: pointer_.enabled !== false,
    pointerRadius: clampN(num(pointer_.radius, 220), 40, 600),
    pointerStrength: clampN(num(pointer_.strength, 60), 0, 100) / 100,
  };

  const pointerStateRef = useRef({ x: 0, y: 0, targetX: 0, targetY: 0, active: 0, targetActive: 0 });

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!mouseInteractive) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const ps = pointerStateRef.current;
    ps.targetX = e.clientX - rect.left;
    ps.targetY = rect.height - (e.clientY - rect.top);
    ps.targetActive = 1;
  };

  const handlePointerLeave = () => {
    pointerStateRef.current.targetActive = 0;
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const gl = canvas.getContext("webgl", { alpha: false, antialias: false, depth: false });
    if (!gl) {
      console.error("PredictiveArc: WebGL unavailable");
      return;
    }

    const vs = compile(gl, gl.VERTEX_SHADER, VERT_SRC);
    const fs = compile(gl, gl.FRAGMENT_SHADER, FRAG_SRC);
    if (!vs || !fs) return;
    const prog = gl.createProgram();
    if (!prog) return;
    gl.attachShader(prog, vs);
    gl.attachShader(prog, fs);
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
      console.error("PredictiveArc link:", gl.getProgramInfoLog(prog));
      return;
    }
    gl.useProgram(prog);

    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const aPos = gl.getAttribLocation(prog, "a_pos");
    gl.enableVertexAttribArray(aPos);
    gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

    const locs: Record<string, WebGLUniformLocation | null> = {};
    const u = (name: string) => {
      if (!(name in locs)) locs[name] = gl.getUniformLocation(prog, name);
      return locs[name];
    };

    let raf = 0;
    let last = performance.now();
    let clock = 0;
    const frameInterval = 1000 / targetFps;
    let lastFrameTime = 0;

    const render = (now: number) => {
      raf = requestAnimationFrame(render);

      if (targetFps && now - lastFrameTime < frameInterval) {
        return;
      }
      lastFrameTime = now;

      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const v = vRef.current;

      clock = (clock + dt * 0.9 * (v.speed as number)) % 6283;

      const dpr = Math.min(window.devicePixelRatio || 1, maxDpr);
      const cw = sizeRef.current.w || canvas.clientWidth || 1200;
      const ch = sizeRef.current.h || canvas.clientHeight || 800;
      
      const bw = Math.max(1, Math.round(cw * dpr * renderScale));
      const bh = Math.max(1, Math.round(ch * dpr * renderScale));
      
      if (canvas.width !== bw || canvas.height !== bh) {
        canvas.width = bw;
        canvas.height = bh;
      }
      gl.viewport(0, 0, bw, bh);

      const pitchCss = Math.min(cw, ch) / (v.density as number);

      const ps = pointerStateRef.current;
      const posLerp = Math.min(1, dt * 12);
      const activeLerp = Math.min(1, dt * 6);
      ps.x += (ps.targetX - ps.x) * posLerp;
      ps.y += (ps.targetY - ps.y) * posLerp;
      ps.active += (ps.targetActive - ps.active) * activeLerp;

      gl.uniform2f(u("uRes"), bw, bh);
      gl.uniform1f(u("uTime"), clock);
      gl.uniform1f(u("uDpr"), dpr * renderScale);
      gl.uniform1f(u("uCell"), Math.max(2, pitchCss * dpr * renderScale));
      gl.uniform1f(u("uDot"), pitchCss * 1.2 * (v.dotSize as number) * dpr * renderScale);
      gl.uniform1f(u("uPeak"), v.peak as number);
      gl.uniform1f(u("uHeight"), v.archHeight as number);
      gl.uniform1f(u("uThick"), v.thickness as number);
      gl.uniform1f(u("uFall"), v.falloff as number);
      gl.uniform2f(u("uMouse"), ps.x * dpr * renderScale, (cw ? (canvas.clientHeight - ps.y) : ps.y) * dpr * renderScale);
      gl.uniform1f(u("uMouseRadius"), (v.pointerRadius as number) * dpr * renderScale);
      gl.uniform1f(
        u("uMouseStrength"),
        v.pointerEnabled ? (v.pointerStrength as number) * ps.active : 0
      );

      const cg = parseColor(v.bg as string, [0.012, 0.012, 0.012]);
      const cb = parseColor(v.base as string, [0.29, 0.23, 0.41]);
      const ca = parseColor(v.accent as string, [0.7, 0.59, 0.81]);
      const chh = parseColor(v.high as string, [1, 1, 1]);

      gl.uniform3f(u("uBg"), cg[0], cg[1], cg[2]);
      gl.uniform3f(u("uBase"), cb[0], cb[1], cb[2]);
      gl.uniform3f(u("uAccent"), ca[0], ca[1], ca[2]);
      gl.uniform3f(u("uHigh"), chh[0], chh[1], chh[2]);

      gl.drawArrays(gl.TRIANGLES, 0, 3);
    };

    raf = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(raf);
    };
  }, [maxDpr, renderScale, targetFps, mouseInteractive]);

  return (
    <div
      style={{
        position: "relative",
        overflow: "hidden",
        background,
        width: typeof width === "number" && width > 0 ? width : "100%",
        height: typeof height === "number" && height > 0 ? height : "100%",
        touchAction: "none",
        ...style,
      }}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
      onPointerCancel={handlePointerLeave}
    >
      <canvas
        ref={canvasRef}
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%", display: "block" }}
      />
    </div>
  );
};

export default Plasma;