"use client";

import { Marquee } from "entity-react-marquee";
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

const items = [
  { icon: BullMQIcon, text: "BullMQ" },
  { icon: SiPostgresql, text: "PostgreSQL" },
  { icon: SiReact, text: "React" },
  { icon: SiNextdotjs, text: "Next.js" },
  { icon: SiRedis, text: "Redis" },
  { icon: SiNestjs, text: "NestJS" },
  { icon: SiNodedotjs, text: "Node.js" },
];

export default function TechStackMarquee() {
  return (
    <div className="max-w-7xl mx-auto py-8 mt-12 lg:mt-30">
      <p className="text-center font-mono text-xs tracking-[0.3em] text-neutral-500 uppercase mb-6">
        Tech Stack
      </p>
      <Marquee
        speed={35}
        gap={24}
        maskColor="black"
        maskIntensity={0.15}
        maskWidth={100}
        direction="left"
        pauseOnHover
      >
        {items.map((item, i) => (
          <div
            key={i}
            className="flex items-center gap-2.5 whitespace-nowrap rounded-full border border-neutral-800 bg-neutral-900/50 px-5 py-2.5 backdrop-blur-sm"
          >
            <item.icon className="h-4 w-4 text-neutral-300" />
            <span className="font-mono text-sm tracking-wide text-neutral-300">
              {item.text}
            </span>
          </div>
        ))}
      </Marquee>
    </div>
  );
}
