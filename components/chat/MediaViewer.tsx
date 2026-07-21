"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  FiX,
  FiZoomIn,
  FiZoomOut,
  FiRotateCcw,
  FiDownload,
  FiExternalLink,
  FiFile,
} from "react-icons/fi";
import {
  formatFileSize,
  isImageMime,
  type AttachmentDescriptor,
} from "@/lib/message-content";

const MIN_SCALE = 0.5;
const MAX_SCALE = 8;

interface MediaViewerProps {
  file: AttachmentDescriptor;
  caption?: string;
  onClose: () => void;
}

export default function MediaViewer({
  file,
  caption,
  onClose,
}: MediaViewerProps) {
  const isImage = isImageMime(file.mime);
  const isPdf = file.mime === "application/pdf";

  const [mounted, setMounted] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);
  const [view, setView] = useState({ s: 1, x: 0, y: 0 });

  const stageRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef(view);
  const pointersRef = useRef(new Map<number, { x: number; y: number }>());
  const dragRef = useRef<{ cx: number; cy: number; x: number; y: number } | null>(
    null,
  );
  const pinchRef = useRef<{
    dist: number;
    mid: { x: number; y: number };
    s0: number;
    p0: { x: number; y: number };
  } | null>(null);

  useEffect(() => setMounted(true), []);

  const update = useCallback((s: number, x: number, y: number) => {
    const next = {
      s: Math.min(MAX_SCALE, Math.max(MIN_SCALE, s)),
      x,
      y,
    };
    viewRef.current = next;
    setView(next);
  }, []);

  const resetView = useCallback(() => update(1, 0, 0), [update]);

  /** Zoom keeping the content under screen point (cx, cy) stationary. */
  const zoomAt = useCallback(
    (cx: number, cy: number, targetScale?: number) => {
      const v = viewRef.current;
      const next = Math.min(
        MAX_SCALE,
        Math.max(MIN_SCALE, targetScale ?? v.s),
      );
      if (next === v.s) return;
      const rect = stageRef.current?.getBoundingClientRect();
      if (!rect) return;
      const px = cx - rect.left - rect.width / 2;
      const py = cy - rect.top - rect.height / 2;
      const k = next / v.s;
      update(next, px - (px - v.x) * k, py - (py - v.y) * k);
    },
    [update],
  );

  const zoomFromCenter = useCallback(
    (factor: number) => {
      const rect = stageRef.current?.getBoundingClientRect();
      if (!rect) return;
      zoomAt(
        rect.left + rect.width / 2,
        rect.top + rect.height / 2,
        viewRef.current.s * factor,
      );
    },
    [zoomAt],
  );

  // Wheel zoom (non-passive so we can preventDefault)
  useEffect(() => {
    if (!isImage) return;
    const el = stageRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      zoomAt(e.clientX, e.clientY, viewRef.current.s * Math.exp(-e.deltaY * 0.0018));
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [isImage, zoomAt]);

  // Keyboard: Esc close, +/- zoom, 0 reset
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      else if (e.key === "+" || e.key === "=") zoomFromCenter(1.35);
      else if (e.key === "-") zoomFromCenter(1 / 1.35);
      else if (e.key === "0" && isImage) resetView();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose, zoomFromCenter, resetView, isImage]);

  // Lock body scroll while open
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  // ─── Pointer pan / pinch ─────────────────────────────────────────────

  const handlePointerDown = (e: React.PointerEvent) => {
    if (!isImage || !loaded || failed) return;
    pointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    const pts = [...pointersRef.current.values()];
    if (pts.length === 2) {
      dragRef.current = null;
      pinchRef.current = {
        dist: Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y),
        mid: { x: (pts[0].x + pts[1].x) / 2, y: (pts[0].y + pts[1].y) / 2 },
        s0: viewRef.current.s,
        p0: { x: viewRef.current.x, y: viewRef.current.y },
      };
    } else if (pts.length === 1 && viewRef.current.s > 1) {
      dragRef.current = {
        cx: e.clientX,
        cy: e.clientY,
        x: viewRef.current.x,
        y: viewRef.current.y,
      };
      (e.target as Element).setPointerCapture?.(e.pointerId);
    }
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isImage || !loaded || failed) return;
    if (!pointersRef.current.has(e.pointerId)) return;
    pointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

    const pinch = pinchRef.current;
    if (pinch && pointersRef.current.size >= 2) {
      const pts = [...pointersRef.current.values()];
      const dist = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
      const mid = { x: (pts[0].x + pts[1].x) / 2, y: (pts[0].y + pts[1].y) / 2 };
      const rect = stageRef.current?.getBoundingClientRect();
      if (!rect || pinch.dist === 0) return;
      const raw = Math.min(
        MAX_SCALE,
        Math.max(MIN_SCALE, (pinch.s0 * dist) / pinch.dist),
      );
      const k = raw / pinch.s0;
      const ax = pinch.mid.x - rect.left - rect.width / 2;
      const ay = pinch.mid.y - rect.top - rect.height / 2;
      update(
        raw,
        ax - (ax - pinch.p0.x) * k + (mid.x - pinch.mid.x),
        ay - (ay - pinch.p0.y) * k + (mid.y - pinch.mid.y),
      );
      return;
    }

    const drag = dragRef.current;
    if (drag) {
      update(
        viewRef.current.s,
        drag.x + (e.clientX - drag.cx),
        drag.y + (e.clientY - drag.cy),
      );
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    pointersRef.current.delete(e.pointerId);
    if (pointersRef.current.size < 2) pinchRef.current = null;
    if (pointersRef.current.size === 0) dragRef.current = null;
  };

  const handleDoubleClick = (e: React.MouseEvent) => {
    if (!isImage || !loaded || failed) return;
    const v = viewRef.current;
    if (v.s > 1.05) resetView();
    else zoomAt(e.clientX, e.clientY, 2.5);
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget && viewRef.current.s === 1) onClose();
  };

  if (!mounted) return null;

  const headerBtn =
    "grid h-9 w-9 place-items-center rounded-full bg-white/10 text-white/90 transition-colors hover:bg-white/20 hover:text-white";

  const showImage = isImage && !failed;
  const showFileCard = !isImage || failed;

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label={file.name}
      className="fixed inset-0 z-[100] flex flex-col bg-black/95 backdrop-blur-sm"
      onClick={handleBackdropClick}
    >
      {/* Top bar: filename + actions */}
      <header className="flex shrink-0 items-center gap-3 px-4 py-3 text-white">
        <FiFile className="h-4 w-4 shrink-0 text-white/50" />
        <span className="min-w-0 flex-1 truncate text-sm font-medium">
          {file.name}
        </span>
        <span className="hidden shrink-0 text-xs text-white/40 sm:block">
          {formatFileSize(file.size)}
        </span>
        <a
          href={file.url}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          aria-label="Open original"
          title="Open original"
          className={headerBtn}
        >
          <FiExternalLink className="h-4 w-4" />
        </a>
        <a
          href={file.url}
          download
          onClick={(e) => e.stopPropagation()}
          aria-label="Download"
          title="Download"
          className={headerBtn}
        >
          <FiDownload className="h-4 w-4" />
        </a>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className={headerBtn}
        >
          <FiX className="h-4 w-4" />
        </button>
      </header>

      {/* Stage */}
      <div
        ref={stageRef}
        className="relative flex min-h-0 flex-1 select-none items-center justify-center overflow-hidden"
        style={{ touchAction: "none" }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onDoubleClick={handleDoubleClick}
        onClick={(e) => {
          if (e.target === e.currentTarget && viewRef.current.s === 1)
            onClose();
        }}
      >
        {showImage && (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={file.url}
            alt={file.name}
            draggable={false}
            onLoad={() => setLoaded(true)}
            onError={() => setFailed(true)}
            className="max-h-full max-w-full object-contain will-change-transform"
            style={{
              transform: `translate(${view.x}px, ${view.y}px) scale(${view.s})`,
              cursor: view.s > 1 ? "grab" : "zoom-in",
            }}
          />
        )}

        {showImage && !loaded && (
          <div className="absolute inset-0 grid place-items-center">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/20 border-t-white" />
          </div>
        )}

        {showFileCard && (
          <div className="mx-4 max-w-sm rounded-2xl border border-white/10 bg-white/5 p-8 text-center text-white">
            <span className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-2xl bg-indigo-500/20 text-indigo-300">
              <FiFile className="h-8 w-8" />
            </span>
            <p className="mb-1 break-all text-sm font-semibold">{file.name}</p>
            <p className="mb-6 text-xs text-white/50">
              {formatFileSize(file.size)}
              {failed && " · preview unavailable"}
            </p>
            <a
              href={file.url}
              download
              className="inline-flex items-center gap-2 rounded-full bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-indigo-500"
            >
              <FiDownload className="h-4 w-4" />
              Download
            </a>
          </div>
        )}

        {isPdf && (
          <iframe
            src={file.url}
            title={file.name}
            className="h-full w-full rounded-xl border border-white/10 bg-white"
          />
        )}
      </div>

      {/* Bottom: caption + zoom controls */}
      <footer className="flex shrink-0 flex-col items-center gap-3 px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-2">
        {caption && (
          <p className="max-w-xl text-center text-sm text-white/80">
            {caption}
          </p>
        )}
        {isImage && !failed && (
          <div className="flex items-center gap-1 rounded-full bg-white/10 p-1">
            <button
              type="button"
              onClick={() => zoomFromCenter(1 / 1.35)}
              aria-label="Zoom out"
              className="grid h-8 w-8 place-items-center rounded-full text-white/90 transition-colors hover:bg-white/20"
            >
              <FiZoomOut className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={resetView}
              title="Reset zoom"
              className="min-w-[3.5rem] rounded-full px-1 text-center text-xs font-medium tabular-nums text-white/90 transition-colors hover:bg-white/20"
            >
              {Math.round(view.s * 100)}%
            </button>
            <button
              type="button"
              onClick={() => zoomFromCenter(1.35)}
              aria-label="Zoom in"
              className="grid h-8 w-8 place-items-center rounded-full text-white/90 transition-colors hover:bg-white/20"
            >
              <FiZoomIn className="h-4 w-4" />
            </button>
            <span className="mx-0.5 h-4 w-px bg-white/20" />
            <button
              type="button"
              onClick={resetView}
              aria-label="Reset view"
              className="grid h-8 w-8 place-items-center rounded-full text-white/90 transition-colors hover:bg-white/20"
            >
              <FiRotateCcw className="h-4 w-4" />
            </button>
          </div>
        )}
      </footer>
    </div>,
    document.body,
  );
}
