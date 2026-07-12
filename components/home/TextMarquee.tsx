"use client";

import { Marquee } from "entity-react-marquee";
import {
  FiShield,
  FiLock,
  FiEye,
  FiZap,
  FiCheckCircle,
  FiGlobe,
} from "react-icons/fi";

const items = [
  { icon: FiShield, text: "End-to-End Encrypted" },
  { icon: FiLock, text: "Zero-Knowledge Proofs" },
  { icon: FiEye, text: "No Metadata Logged" },
  { icon: FiZap, text: "Sub-millisecond Latency" },
  { icon: FiCheckCircle, text: "Mathematically Verified" },
  { icon: FiGlobe, text: "Peer-to-Peer Mesh" },
];

export default function TextMarquee() {
  return (
    <div className="w-full bg-purple-700/50 mt-5 max-w-7xl mx-auto py-3">
      <Marquee
        speed={40}
        gap={40}
        maskColor="black"
        maskIntensity={0.3}
        maskWidth={5}
        scrollDirection={true}
        pauseOnHover
      >
        {items.map((item, i) => (
          <div key={i} className="flex items-center gap-3 whitespace-nowrap">
            <item.icon className="h-4 w-4 text-white/80" />
            <span className="font-mono text-sm font-medium tracking-wide text-white">
              {item.text}
            </span>
          </div>
        ))}
      </Marquee>
    </div>
  );
}
