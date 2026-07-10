"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";

import "feral-blob/blob.css";

type BlobProps = {
  mood?: "neutral" | "happy" | "sad" | "angry" | "hmm" | "sideEye" | "password";
  gaze?: { x: number; y: number };
};

const JellyBlobMascot = dynamic(
  () => import("feral-blob").then((module) => module.JellyBlobMascot),
  {
    ssr: false,
    loading: () => <div aria-hidden="true" className="h-full w-full" />,
  },
);

export default function ClientBlob({ mood, gaze }: BlobProps) {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    const isLargeScreen = window.matchMedia("(min-width: 1024px)").matches;

    setEnabled(isLargeScreen && !prefersReducedMotion);
  }, []);

  if (!enabled) return <div aria-hidden="true" className="h-full w-full" />;

  return <JellyBlobMascot mood={mood} gaze={gaze} />;
}
