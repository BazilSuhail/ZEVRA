"use client";

import { formatDuration } from "@/lib/webrtc";

interface CallTimerProps {
  duration: number;
  className?: string;
}

export default function CallTimer({ duration, className }: CallTimerProps) {
  return (
    <span className={`text-sm font-medium ${className ?? ""}`}>
      {formatDuration(duration)}
    </span>
  );
}
