"use client";

import {
  SiPostgresql,
  SiReact,
  SiNextdotjs,
  SiRedis,
  SiNestjs,
  SiNodedotjs,
} from "react-icons/si";
import { type IconType } from "react-icons";

const BullMQIcon: IconType = (props) => (
  <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14H9V8h2v8zm4 0h-2V8h2v8z" />
  </svg>
);

const baseItems = [
  { icon: BullMQIcon, text: "BullMQ" },
  { icon: SiPostgresql, text: "PostgreSQL" },
  { icon: SiReact, text: "React" },
  { icon: SiNextdotjs, text: "Next.js" },
  { icon: SiRedis, text: "Redis" },
  { icon: SiNestjs, text: "NestJS" },
  { icon: SiNodedotjs, text: "Node.js" },
];

// Duplicate items 4x to ensure a wide enough track for seamless infinite looping
const duplicatedItems = [...baseItems, ...baseItems, ...baseItems, ...baseItems];

export default function TechStackMarquee() {
  return (
    <div className="max-w-7xl mx-auto py-8 mt-12 lg:mt-30 overflow-hidden space-y-4">
      <p className="text-center font-mono text-xs tracking-[0.3em] text-neutral-500 uppercase mb-6">
        Tech Stack
      </p>

      {/* Row 1: Scrolling Left */}
      <div className="relative w-full overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_15%,black_85%,transparent)]">
        <div className="flex w-max animate-marquee-left hover:[animation-play-state:paused] gap-6 py-2">
          {duplicatedItems.map((item, i) => (
            <div
              key={`row1-${i}`}
              className="flex items-center gap-2.5 whitespace-nowrap rounded-full border border-neutral-800 bg-neutral-900/50 px-5 py-2.5 backdrop-blur-sm shrink-0"
            >
              <item.icon className="h-4 w-4 text-neutral-300" />
              <span className="font-mono text-sm tracking-wide text-neutral-300">
                {item.text}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Row 2: Scrolling Right (Opposite Direction) */}
      <div className="relative w-full overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_15%,black_85%,transparent)]">
        <div className="flex w-max animate-marquee-right hover:[animation-play-state:paused] gap-6 py-2">
          {duplicatedItems.map((item, i) => (
            <div
              key={`row2-${i}`}
              className="flex items-center gap-2.5 whitespace-nowrap rounded-full border border-neutral-800 bg-neutral-900/50 px-5 py-2.5 backdrop-blur-sm shrink-0"
            >
              <item.icon className="h-4 w-4 text-neutral-300" />
              <span className="font-mono text-sm tracking-wide text-neutral-300">
                {item.text}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}